'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  allowedRecipient,
  buildMimeMessage,
  normalizeEmail,
  validateSendPayload,
  validateEventPayload,
  SlidingWindowRateLimiter,
} = require('../server');

test('normalizes email addresses for exact comparison', () => {
  assert.equal(normalizeEmail('  BEIBEI@example.com '), 'beibei@example.com');
});

test('accepts a complete message only for the configured recipient', () => {
  const result = validateSendPayload({
    recipientEmail: allowedRecipient.email,
    subject: '生日派对',
    body: '您好，贝贝！',
    studentId: '学生1',
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.recipientEmail, allowedRecipient.email);
});

test('rejects any recipient outside the allowlist', () => {
  const result = validateSendPayload({
    recipientEmail: 'someone-else@example.com',
    subject: '测试',
    body: '正文',
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'RECIPIENT_NOT_ALLOWED');
});

test('rejects empty subject and body', () => {
  const noSubject = validateSendPayload({ recipientEmail: allowedRecipient.email, subject: ' ', body: '正文' });
  const noBody = validateSendPayload({ recipientEmail: allowedRecipient.email, subject: '主题', body: ' ' });
  assert.equal(noSubject.code, 'SUBJECT_REQUIRED');
  assert.equal(noBody.code, 'BODY_REQUIRED');
});

test('rate limiter enforces cooldown and window count', () => {
  const limiter = new SlidingWindowRateLimiter({ limit: 2, windowMs: 1000, cooldownMs: 100 });
  assert.equal(limiter.check('student', 0).ok, true);
  assert.equal(limiter.check('student', 50).ok, false);
  assert.equal(limiter.check('student', 100).ok, true);
  assert.equal(limiter.check('student', 200).ok, false);
  assert.equal(limiter.check('student', 1200).ok, true);
});

test('builds a UTF-8 plain-text MIME message and dot-stuffs lines', () => {
  const message = buildMimeMessage({
    from: 'teacher@example.com',
    to: allowedRecipient.email,
    subject: '主题',
    text: '第一行\n.第二行',
    requestId: 'request-1',
  });
  assert.match(message, /Content-Type: text\/plain; charset=UTF-8/);
  assert.match(message, /Subject: =\?UTF-8\?B\?/);
  assert.match(message, /\r\n\.\.第二行\r\n/);
});

test('accepts learning events without recording message contents', () => {
  const result = validateEventPayload({
    action: 'open-message',
    stage: 1,
    studentId: '学生1',
    details: { messageId: 'birthday-invite', body: '不应被记录' },
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.details, { messageId: 'birthday-invite' });
});

test('rejects unsupported learning event types', () => {
  const result = validateEventPayload({ action: 'keyboard-recording', studentId: '学生1' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'EVENT_NOT_ALLOWED');
});
