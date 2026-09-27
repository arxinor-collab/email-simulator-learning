'use strict';

const http = require('node:http');
const net = require('node:net');
const tls = require('node:tls');
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const ROOT_DIR = __dirname;
loadDotEnv(path.join(ROOT_DIR, '.env'));
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LOG_FILE = path.join(DATA_DIR, 'send-log.jsonl');
const EVENT_LOG_FILE = path.join(DATA_DIR, 'event-log.jsonl');
const PORT = Number(process.env.PORT || 3000);
const HOST = String(process.env.HOST || '127.0.0.1').trim();
const MAX_REQUEST_BYTES = 16 * 1024;
const SEND_WINDOW_MS = 10 * 60 * 1000;
const STUDENT_SEND_LIMIT = 3;
const IP_SEND_LIMIT = 20;
const STUDENT_COOLDOWN_MS = 20 * 1000;
const DEMO_STUDENT_SEND_LIMIT = 1000;
const DEMO_IP_SEND_LIMIT = 1000;
const DEMO_STUDENT_COOLDOWN_MS = 0;

const allowedRecipient = {
  name: '贝贝',
  email: normalizeEmail(process.env.BEIBEI_EMAIL || 'beibei@example.com'),
};

const smtp = {
  host: String(process.env.SMTP_HOST || '').trim(),
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false',
  user: String(process.env.SMTP_USER || '').trim(),
  pass: String(process.env.SMTP_PASS || ''),
  from: String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim(),
};

const smtpConfigured = Boolean(
  smtp.host && smtp.port && smtp.user && smtp.pass && smtp.from &&
  process.env.BEIBEI_EMAIL,
);
const logSalt = process.env.LOG_SALT || 'local-development-log-salt';

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function sanitizeText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .slice(0, maxLength);
}

function sanitizeSubject(value) {
  return sanitizeText(value, 120).replace(/[\r\n]/g, ' ').trim();
}

function sanitizeStudentId(value) {
  return sanitizeText(value || '未标记学生', 64).trim() || '未标记学生';
}

function validateSendPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, status: 400, code: 'INVALID_JSON', message: '发送内容格式不正确。' };
  }

  const recipientEmail = normalizeEmail(payload.recipientEmail);
  if (recipientEmail !== allowedRecipient.email) {
    return {
      ok: false,
      status: 400,
      code: 'RECIPIENT_NOT_ALLOWED',
      message: '收件人只能选择贝贝。',
    };
  }

  const subject = sanitizeSubject(payload.subject);
  const body = sanitizeText(payload.body, 2000).replace(/\r\n?/g, '\n').trim();
  if (!subject) {
    return { ok: false, status: 400, code: 'SUBJECT_REQUIRED', message: '请先填写邮件主题。' };
  }
  if (!body) {
    return { ok: false, status: 400, code: 'BODY_REQUIRED', message: '请先填写邮件正文。' };
  }

  return {
    ok: true,
    value: {
      recipientEmail: allowedRecipient.email,
      subject,
      body,
      studentId: sanitizeStudentId(payload.studentId),
      sessionId: sanitizeText(payload.sessionId || 'local-session', 80).trim() || 'local-session',
    },
  };
}

class SlidingWindowRateLimiter {
  constructor({ limit, windowMs, cooldownMs }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.cooldownMs = cooldownMs;
    this.events = new Map();
  }

  check(key, now = Date.now()) {
    const previous = this.events.get(key) || [];
    const recent = previous.filter((timestamp) => now - timestamp < this.windowMs);
    const last = recent[recent.length - 1];
    if (this.cooldownMs && last !== undefined && now - last < this.cooldownMs) {
      const retryAfter = Math.ceil((this.cooldownMs - (now - last)) / 1000);
      this.events.set(key, recent);
      return { ok: false, retryAfter };
    }
    if (recent.length >= this.limit) {
      const retryAfter = Math.ceil((this.windowMs - (now - recent[0])) / 1000);
      this.events.set(key, recent);
      return { ok: false, retryAfter };
    }
    recent.push(now);
    this.events.set(key, recent);
    return { ok: true, retryAfter: 0 };
  }
}

const studentLimiter = new SlidingWindowRateLimiter({
  limit: smtpConfigured ? STUDENT_SEND_LIMIT : DEMO_STUDENT_SEND_LIMIT,
  windowMs: SEND_WINDOW_MS,
  cooldownMs: smtpConfigured ? STUDENT_COOLDOWN_MS : DEMO_STUDENT_COOLDOWN_MS,
});
const ipLimiter = new SlidingWindowRateLimiter({
  limit: smtpConfigured ? IP_SEND_LIMIT : DEMO_IP_SEND_LIMIT,
  windowMs: SEND_WINDOW_MS,
  cooldownMs: 0,
});

function getClientIp(request) {
  const address = request.socket.remoteAddress || 'unknown';
  return address.replace(/^::ffff:/, '');
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(`${logSalt}:${ip}`).digest('hex').slice(0, 16);
}

async function appendLog(entry) {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    await fsp.appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    console.error('send log unavailable:', error.message);
  }
}

async function appendEventLog(entry) {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    await fsp.appendFile(EVENT_LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    console.error('event log unavailable:', error.message);
  }
}

const EVENT_ACTIONS = new Set([
  'attempt', 'open-message', 'open-compose', 'open-choice', 'choose-function', 'select-recipient',
  'complete-stage', 'open-safety', 'safety-choice', 'open-send-review', 'send-success',
  'insert-phrase', 'save-draft', 'scaffold-change', 'restart-lesson', 'open-launcher',
  'select-learning-mode', 'teacher-instruction', 'select-level', 'after-review-choice',
  'complete-after-review', 'open-external-mail', 'go-levels', 'go-launcher',
]);

function sanitizeEventDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  const safeKeys = new Set([
    'key', 'count', 'messageId', 'sender', 'reply', 'choice', 'transferStep', 'mode', 'stage',
    'id', 'correct', 'recipient', 'subjectLength', 'bodyLength', 'level', 'type', 'provider',
  ]);
  return Object.fromEntries(Object.entries(details)
    .filter(([key]) => safeKeys.has(key))
    .map(([key, value]) => [key, typeof value === 'boolean' || typeof value === 'number' ? value : sanitizeText(value, 100)]));
}

function validateEventPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, status: 400, code: 'INVALID_EVENT', message: '操作记录格式不正确。' };
  }
  const action = sanitizeText(payload.action, 40).trim();
  if (!EVENT_ACTIONS.has(action)) {
    return { ok: false, status: 400, code: 'EVENT_NOT_ALLOWED', message: '操作类型不受支持。' };
  }
  return {
    ok: true,
    value: {
      action,
      stage: Math.max(1, Math.min(5, Number(payload.stage) || 1)),
      view: sanitizeText(payload.view, 32).trim() || 'unknown',
      studentId: sanitizeStudentId(payload.studentId),
      sessionId: sanitizeText(payload.sessionId || 'local-session', 80).trim() || 'local-session',
      details: sanitizeEventDetails(payload.details),
    },
  };
}

async function handleEvent(request, response) {
  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    return jsonResponse(response, error.statusCode || 400, {
      ok: false,
      code: error.message,
      message: '操作记录格式不正确。',
    }, commonHeaders());
  }
  const validation = validateEventPayload(payload);
  if (!validation.ok) {
    return jsonResponse(response, validation.status, {
      ok: false,
      code: validation.code,
      message: validation.message,
    }, commonHeaders());
  }
  await appendEventLog({
    timestamp: new Date().toISOString(),
    type: 'learning_event',
    requestId: crypto.randomUUID(),
    ipHash: hashIp(getClientIp(request)),
    ...validation.value,
  });
  return jsonResponse(response, 200, { ok: true }, commonHeaders());
}

function encodeMimeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function extractAddress(address) {
  const match = String(address).match(/<([^>]+)>/);
  return normalizeEmail(match ? match[1] : address);
}

function formatEnvelopeAddress(address) {
  const email = extractAddress(address);
  const display = String(address).replace(/<[^>]+>/, '').trim();
  return display && display !== email ? `${encodeMimeHeader(display)} <${email}>` : email;
}

function dotStuff(value) {
  return value.split('\n').map((line) => line.startsWith('.') ? `.${line}` : line).join('\r\n');
}

function buildMimeMessage({ from, to, subject, text, requestId }) {
  const hostPart = smtp.host || 'learning-mailbox.local';
  const normalizedText = text.replace(/\r\n?/g, '\n');
  return [
    `From: ${formatEnvelopeAddress(from)}`,
    `To: ${formatEnvelopeAddress(to)}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${requestId}@${hostPart}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    dotStuff(normalizedText),
    '',
  ].join('\r\n');
}

class SmtpConnection {
  constructor(socket) {
    this.socket = socket;
    this.buffer = '';
    this.waiters = [];
    this.closed = false;
    this.attach(socket);
  }

  attach(socket) {
    this.socket = socket;
    socket.on('data', (chunk) => {
      this.buffer += chunk.toString('utf8');
      this.drain();
    });
    socket.on('error', (error) => this.fail(error));
    socket.on('close', () => {
      this.closed = true;
      if (this.waiters.length) this.fail(new Error('SMTP_CONNECTION_CLOSED'));
    });
  }

  drain() {
    while (this.waiters.length) {
      const response = this.takeResponse();
      if (!response) return;
      this.waiters.shift().resolve(response);
    }
  }

  takeResponse() {
    const lines = this.buffer.split('\r\n');
    if (lines.length < 2 || !/^\d{3}[ -]/.test(lines[0])) return null;
    const code = lines[0].slice(0, 3);
    let endIndex = -1;
    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index].startsWith(`${code} `)) {
        endIndex = index;
        break;
      }
    }
    if (endIndex === -1) return null;
    const responseLines = lines.slice(0, endIndex + 1);
    this.buffer = lines.slice(endIndex + 1).join('\r\n');
    return { code: Number(code), text: responseLines.join('\n') };
  }

  readResponse() {
    const response = this.takeResponse();
    if (response) return Promise.resolve(response);
    return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }));
  }

  fail(error) {
    while (this.waiters.length) this.waiters.shift().reject(error);
  }

  async command(line) {
    this.socket.write(`${line}\r\n`);
    return this.readResponse();
  }

  async data(message) {
    this.socket.write(`${message}\r\n.\r\n`);
    return this.readResponse();
  }

  upgradeToTls(host) {
    const rawSocket = this.socket;
    rawSocket.removeAllListeners('data');
    rawSocket.removeAllListeners('error');
    rawSocket.removeAllListeners('close');
    const secureSocket = tls.connect({ socket: rawSocket, servername: host });
    this.attach(secureSocket);
    return new Promise((resolve, reject) => {
      secureSocket.once('secureConnect', resolve);
      secureSocket.once('error', reject);
    });
  }

  close() {
    if (this.socket && !this.closed) this.socket.end();
  }
}

function connectSocket({ host, port, secure }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const socket = secure
      ? tls.connect({ host, port, servername: host })
      : net.createConnection({ host, port });
    const connectedEvent = secure ? 'secureConnect' : 'connect';
    const onConnected = () => {
      if (settled) return;
      settled = true;
      socket.removeListener('error', onError);
      resolve(socket);
    };
    const onError = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    socket.once(connectedEvent, onConnected);
    socket.once('error', onError);
  });
}

async function sendSmtpMessage({ from, to, subject, body, requestId }) {
  const socket = await connectSocket(smtp);
  const connection = new SmtpConnection(socket);
  try {
    let response = await connection.readResponse();
    if (response.code !== 220) throw new Error(`SMTP_${response.code}`);
    response = await connection.command(`EHLO learning-mailbox.local`);
    if (response.code !== 250) throw new Error(`SMTP_${response.code}`);

    if (!smtp.secure) {
      response = await connection.command('STARTTLS');
      if (response.code !== 220) throw new Error(`SMTP_${response.code}`);
      await connection.upgradeToTls(smtp.host);
      response = await connection.command('EHLO learning-mailbox.local');
      if (response.code !== 250) throw new Error(`SMTP_${response.code}`);
    }

    response = await connection.command(
      `AUTH PLAIN ${Buffer.from(`\u0000${smtp.user}\u0000${smtp.pass}`).toString('base64')}`,
    );
    if (response.code !== 235 && response.code !== 503) {
      response = await connection.command('AUTH LOGIN');
      if (response.code !== 334) throw new Error(`SMTP_${response.code}`);
      response = await connection.command(Buffer.from(smtp.user).toString('base64'));
      if (response.code !== 334) throw new Error(`SMTP_${response.code}`);
      response = await connection.command(Buffer.from(smtp.pass).toString('base64'));
      if (response.code !== 235) throw new Error(`SMTP_${response.code}`);
    }

    response = await connection.command(`MAIL FROM:<${extractAddress(from)}>`);
    if (response.code !== 250) throw new Error(`SMTP_${response.code}`);
    response = await connection.command(`RCPT TO:<${extractAddress(to)}>`);
    if (![250, 251].includes(response.code)) throw new Error(`SMTP_${response.code}`);
    response = await connection.command('DATA');
    if (response.code !== 354) throw new Error(`SMTP_${response.code}`);
    response = await connection.data(buildMimeMessage({ from, to, subject, text: body, requestId }));
    if (response.code !== 250) throw new Error(`SMTP_${response.code}`);
    await connection.command('QUIT');
  } finally {
    connection.close();
  }
}

function jsonResponse(response, statusCode, data, headers = {}) {
  const body = JSON.stringify(data);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  response.end(body);
}

function commonHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:",
  };
}

async function readJson(request) {
  let total = 0;
  const chunks = [];
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_REQUEST_BYTES) {
      const error = new Error('REQUEST_TOO_LARGE');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('INVALID_JSON');
    error.statusCode = 400;
    throw error;
  }
}

async function handleSend(request, response) {
  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    return jsonResponse(response, error.statusCode || 400, {
      ok: false,
      code: error.message,
      message: error.message === 'REQUEST_TOO_LARGE' ? '邮件内容过长，请缩短后再试。' : '发送内容格式不正确。',
    }, commonHeaders());
  }

  const validation = validateSendPayload(payload);
  if (!validation.ok) {
    return jsonResponse(response, validation.status, {
      ok: false,
      code: validation.code,
      message: validation.message,
    }, commonHeaders());
  }

  const value = validation.value;
  const ip = getClientIp(request);
  const studentResult = studentLimiter.check(`${ip}:${value.studentId}`);
  const ipResult = ipLimiter.check(ip);
  if (!studentResult.ok || !ipResult.ok) {
    const retryAfter = Math.max(studentResult.retryAfter, ipResult.retryAfter);
    await appendLog({
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      ipHash: hashIp(ip),
      studentId: value.studentId,
      sessionId: value.sessionId,
      recipient: allowedRecipient.email,
      subjectLength: value.subject.length,
      bodyLength: value.body.length,
      status: 'rate_limited',
      retryAfter,
    });
    return jsonResponse(response, 429, {
      ok: false,
      code: 'RATE_LIMITED',
      message: `发送次数需要休息一下，请约 ${retryAfter} 秒后再试。`,
      retryAfter,
    }, { ...commonHeaders(), 'Retry-After': String(retryAfter) });
  }

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const baseLog = {
    timestamp: new Date().toISOString(),
    requestId,
    ipHash: hashIp(ip),
    studentId: value.studentId,
    sessionId: value.sessionId,
    recipient: allowedRecipient.email,
    subjectLength: value.subject.length,
    bodyLength: value.body.length,
    transport: smtpConfigured ? 'smtp' : 'demo',
  };

  if (!smtpConfigured) {
    await appendLog({ ...baseLog, status: 'demo_saved', latencyMs: Date.now() - startedAt });
    return jsonResponse(response, 200, {
      ok: true,
      mode: 'demo',
      requestId,
      message: '邮件已完成检查，并记录在教学演示日志中。当前未开启真实投递。',
    }, commonHeaders());
  }

  try {
    await sendSmtpMessage({
      from: smtp.from,
      to: allowedRecipient.email,
      subject: value.subject,
      body: value.body,
      requestId,
    });
    await appendLog({ ...baseLog, status: 'sent', latencyMs: Date.now() - startedAt });
    return jsonResponse(response, 200, {
      ok: true,
      mode: 'smtp',
      requestId,
      message: '邮件已发送给贝贝。',
    }, commonHeaders());
  } catch (error) {
    console.error('smtp send failed:', error.message);
    await appendLog({
      ...baseLog,
      status: 'failed',
      errorCode: String(error.message || 'SMTP_FAILED').slice(0, 80),
      latencyMs: Date.now() - startedAt,
    });
    return jsonResponse(response, 502, {
      ok: false,
      code: 'SEND_FAILED',
      requestId,
      message: '邮件暂时没有发送成功，请检查网络或请教师协助。',
    }, commonHeaders());
  }
}

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);
  if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    return jsonResponse(response, 403, { ok: false, message: '禁止访问。' }, commonHeaders());
  }
  try {
    const file = await fsp.readFile(filePath);
    const extension = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.svg': 'image/svg+xml',
    };
    response.writeHead(200, {
      ...commonHeaders(),
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Content-Length': file.byteLength,
      'Cache-Control': 'no-store',
    });
    response.end(file);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : 500;
    jsonResponse(response, status, { ok: false, message: '页面不存在。' }, commonHeaders());
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const { pathname } = requestUrl;
  if (request.method === 'GET' && pathname === '/api/config') {
    return jsonResponse(response, 200, {
      ok: true,
      recipient: allowedRecipient,
      demoMode: !smtpConfigured,
      limits: {
        studentWindowMinutes: SEND_WINDOW_MS / 60000,
        studentMaxSends: smtpConfigured ? STUDENT_SEND_LIMIT : DEMO_STUDENT_SEND_LIMIT,
        cooldownSeconds: (smtpConfigured ? STUDENT_COOLDOWN_MS : DEMO_STUDENT_COOLDOWN_MS) / 1000,
      },
    }, commonHeaders());
  }
  if (request.method === 'GET' && pathname === '/api/health') {
    return jsonResponse(response, 200, {
      ok: true,
      mode: smtpConfigured ? 'smtp' : 'demo',
    }, commonHeaders());
  }
  if (request.method === 'POST' && pathname === '/api/send') {
    return handleSend(request, response);
  }
  if (request.method === 'POST' && pathname === '/api/events') {
    return handleEvent(request, response);
  }
  if (request.method === 'GET') {
    return serveStatic(request, response, pathname);
  }
  return jsonResponse(response, 405, { ok: false, message: '当前操作不支持。' }, commonHeaders());
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`学习邮箱已启动：http://${HOST}:${PORT}`);
    console.log(`发送模式：${smtpConfigured ? 'SMTP 联网投递' : '教学演示模式'}`);
    console.log(`贝贝地址：${allowedRecipient.email}`);
  });
}

module.exports = {
  allowedRecipient,
  buildMimeMessage,
  normalizeEmail,
  validateSendPayload,
  validateEventPayload,
  SlidingWindowRateLimiter,
};
