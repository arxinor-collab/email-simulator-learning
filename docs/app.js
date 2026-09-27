'use strict';

const STATIC_MODE = Boolean(window.__EMAIL_SIMULATOR_STATIC__);

// 课堂名单集中在这里，后续替换姓名、英文账号和演示密码即可。
const studentAccounts = [
  { id: 'xiaoyi', name: '小奕', account: 'xiaoyi', password: '12345678' },
  { id: 'xiaojian', name: '小坚', account: 'xiaojian', password: '12345678' },
  { id: 'xiaoyu', name: '小宇', account: 'xiaoyu', password: '12345678' },
  { id: 'langlang', name: '朗朗', account: 'langlang', password: '12345678' },
  { id: 'xiaoyi2', name: '小仪', account: 'xiaoyi2', password: '12345678' },
  { id: 'xiaoxin', name: '小信', account: 'xiaoxin', password: '12345678' },
  { id: 'xuanxuan', name: '喧喧', account: 'xuanxuan', password: '12345678' },
];

const stageDefinitions = [
  { title: '找到贝贝的邀请', caption: '在收件箱中找到贝贝的未读邮件。' },
  { title: '告诉贝贝“我会参加”', caption: '打开邀请，点击“回复”，写完后记得发送。' },
  { title: '给贝贝准备礼物', caption: '判断这次应该“回复”还是“写信”，再完成一封新邮件。' },
  { title: '邮件应用大挑战', caption: '把查收、回复和写信的方法用到新的情境中。' },
  { title: '查收贝贝的回信', caption: '在邮箱中查收贝贝的回信。' },
];

const initialMessages = [
  {
    id: 'birthday-invite', sender: '贝贝', senderEmail: 'beibei@example.com', subject: '生日派对邀请',
    date: '2026年09月26日 10:20',
    body: '下周是我的生日，我想邀请你来我的生日派对，你会来吗？',
    unread: true, kind: 'birthday',
  },
  {
    id: 'teacher-photo', sender: '信息老师', senderEmail: 'teacher@example.com', subject: '上周课堂照片',
    date: '2026年09月25日 16:30', body: '这是上周信息技术课的课堂照片，请你有时间时看看。', unread: false, kind: 'ordinary',
  },
  {
    id: 'system-welcome', sender: '学习邮箱', senderEmail: 'system@example.com', subject: '欢迎使用学习邮箱',
    date: '2026年09月22日 09:00', body: '欢迎来到学习邮箱。这里可以练习查收、回复和发送邮件。', unread: false, kind: 'ordinary',
  },
];

const teacherMessage = {
  id: 'teacher-activity', sender: '信息老师', senderEmail: 'teacher@example.com', subject: '明天的信息技术活动',
  date: '2026年09月26日 14:10', body: '你好！\n\n明天我们有信息技术活动。\n\n你明天能参加吗？', unread: true, kind: 'transfer',
};

const returnMessage = {
  id: 'beibei-reply', sender: '贝贝', senderEmail: 'beibei@example.com', subject: 'Re：喜欢的生日礼物',
  date: '2026年09月26日 14:30', body: '你好！\n\n谢谢你来参加我的生日派对！\n\n我最近很喜欢画画。\n\n贝贝', unread: true, kind: 'return',
};

const safetyScenarios = [
  { id: 'reply-later', title: '收到需要回复的邮件，一个星期不回复。', correct: 'no', explain: '需要回复的邮件，要及时回复。' },
  { id: 'send-without-check', title: '写好邮件以后，不检查就直接发送。', correct: 'no', explain: '发送前要检查收件人、主题和正文。' },
  { id: 'share-password', title: '好朋友问邮箱密码，可以告诉他。', correct: 'no', explain: '邮箱密码是自己的秘密，不能告诉别人。' },
];

const afterReviewScenarios = [
  { title: '第一步｜找对位置', question: '收到一封新邮件，应该先去哪里找？', options: [{ value: 'inbox', label: '收件箱' }, { value: 'sent', label: '已发送' }], correct: 'inbox', explain: '新收到的邮件会出现在收件箱。' },
  { title: '第二步｜选对功能', question: '贝贝已经发来邮件，你要回应她，应该选择什么？', options: [{ value: 'reply', label: '回复' }, { value: 'write', label: '写信' }], correct: 'reply', explain: '已经收到对方的邮件，要用“回复”。' },
  { title: '第三步｜发送前检查', question: '邮件写好以后，哪一个做法更安全？', options: [{ value: 'check', label: '检查后发送' }, { value: 'send', label: '直接发送' }], correct: 'check', explain: '发送前要检查收件人、主题和正文。' },
];

const quizBanks = {
  1: {
    label: '一级', title: '排序题', difficulty: '最难', kind: 'sort',
    questions: [
      { prompt: '邮箱提示“你有1封新邮件”，你想看看老师发来了什么。\n请排序。', items: ['找到新邮件', '进入收件箱', '单击打开'], answer: [1, 0, 2] },
      { prompt: '老师给你发邮件问：“明天能参加活动吗？”你想回复“我能参加”。请排序。', items: ['输入回复内容', '点击发送', '打开邮件', '点击回复'], answer: [2, 3, 0, 1] },
      { prompt: '你想主动给老师发一封新邮件，询问明天几点集合。请排序。', items: ['填写主题', '点击写信', '输入正文', '填写/选择收件人', '点击发送'], answer: [1, 3, 0, 2, 4] },
    ],
  },
  2: {
    label: '二级', title: '选择题', difficulty: '中等', kind: 'choice',
    questions: [
      { prompt: '邮箱提示有一封新邮件，你想看看里面写了什么，应该先去哪里？', options: [{ value: 'A', label: 'A. 收件箱' }, { value: 'B', label: 'B. 写信' }], answer: 'A' },
      { prompt: '小明已经给你发来邮件问：“你明天来吗？”你要回答他，应该用哪个功能？', options: [{ value: 'A', label: 'A. 回复' }, { value: 'B', label: 'B. 写信' }], answer: 'A' },
      { prompt: '你想主动给老师发一封新邮件，问“明天在哪里集合？”，应该用哪个功能？', options: [{ value: 'A', label: 'A. 回复' }, { value: 'B', label: 'B. 写信' }], answer: 'B' },
    ],
  },
  3: {
    label: '三级', title: '判断题', difficulty: '最容易', kind: 'judge',
    questions: [
      { prompt: '画面：邮箱出现“1封新邮件”，学生点击“收件箱”去查看。这样做对吗？', options: [{ value: 'true', label: '✓ 对' }, { value: 'false', label: '✕ 不对' }], answer: 'true' },
      { prompt: '画面：妈妈已经发来邮件问“几点回家？”，学生点击“回复”回答妈妈。这样做对吗？', options: [{ value: 'true', label: '✓ 对' }, { value: 'false', label: '✕ 不对' }], answer: 'true' },
      { prompt: '画面：学生想主动问老师“明天几点上课？”，选择“回复”。这样做对吗？', options: [{ value: 'true', label: '✓ 对' }, { value: 'false', label: '✕ 不对' }], answer: 'false' },
    ],
  },
};

const supportLevels = [
  { label: '无提示', scaffoldLevel: 'independent', description: '学生独立完成，教师只提供必要反馈。' },
  { label: '少量提示', scaffoldLevel: 'guided', description: '保留必要检查提示，减少操作提醒。' },
  { label: '分步提示', scaffoldLevel: 'full', description: '显示操作步骤，帮助学生逐步完成。' },
  { label: '完整提示', scaffoldLevel: 'full', description: '显示完整步骤、关键词和句式提示。' },
];

// 学生进入关卡时的初始支持强度。进入后，教师仍可通过页面控件自由调整。
// support 数字对应：0 无提示，1 少量提示，2 分步提示，3 完整提示。
const studentLevelDefaults = {
  xiaoyi:   { support: [1, 1, 0, null, 0], quizDifficulty: 1 },
  xiaojian: { support: [2, 1, 1, null, 0], quizDifficulty: 1 },
  xiaoyu:   { support: [2, 1, 0, null, 0], quizDifficulty: 1 },
  langlang: { support: [2, 2, 1, null, 0], quizDifficulty: 2 },
  xiaoyi2:  { support: [2, 2, 1, null, 0], quizDifficulty: 2 },
  xiaoxin:  { support: [2, 2, 1, null, 1], quizDifficulty: 2 },
  xuanxuan: { support: [3, 3, 2, null, 2], quizDifficulty: 3 },
};

const state = {
  config: null, loggedIn: false, studentName: '', view: 'inbox', selectedMessage: null, supportLevel: 3, scaffoldLevel: 'full', stageIndex: 0, transferStep: 0,
  returnAvailable: false, sending: false, reviewOpen: false, feedback: null, firstLevelWrongClicks: 0, firstLevelNotice: false, thirdLevelWrongClicks: 0, thirdLevelNotice: false, deletedMessageIds: [],
  compose: { subject: '', body: '', recipientEmail: '', reply: false }, sentMessages: [], sentCompletionStage: 0, safetyAnswers: {}, attempts: {},
  quizDifficulty: 1, quizQuestionIndex: 0, quizSelection: null, quizSortOrder: [], quizSubmitted: false, quizCorrectCount: 0, completedStages: [],
  studentId: new URLSearchParams(window.location.search).get('student') || '', mode: null, teacherStage: 0, afterReviewStep: 0, afterReviewSelection: null, afterReviewResult: '', afterReviewContinueOpen: false,
};

function $(selector) { return document.querySelector(selector); }

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function getRecipientEmail() { return state.config?.recipient?.email || 'beibei@example.com'; }
function getRecipientName() { return state.config?.recipient?.name || '贝贝'; }
function currentStage() { return stageDefinitions[state.stageIndex] || stageDefinitions[4]; }
function currentSupportLevel() { return supportLevels[state.supportLevel] || supportLevels[3]; }
function isStageCompleted(index) { return state.completedStages.includes(index); }
function getNextStageIndex() {
  const next = stageDefinitions.findIndex((_, index) => !isStageCompleted(index));
  return next >= 0 ? next : stageDefinitions.length - 1;
}
function markStageCompleted(stageNumber) {
  const index = Math.max(0, Math.min(stageDefinitions.length - 1, Number(stageNumber) - 1));
  if (!state.completedStages.includes(index)) state.completedStages.push(index);
  const next = getNextStageIndex();
  if (state.teacherStage === index && next !== index) state.teacherStage = next;
  state.stageIndex = next;
}

function speakFullPrompt(text) {
  if (state.supportLevel !== 3 || !text || typeof window === 'undefined' || !window.speechSynthesis) return;
  const Utterance = window.SpeechSynthesisUtterance;
  if (typeof Utterance !== 'function') return;
  window.speechSynthesis.cancel();
  const utterance = new Utterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function speakResult(text) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
  const Utterance = window.SpeechSynthesisUtterance;
  if (typeof Utterance !== 'function') return;
  window.speechSynthesis.cancel();
  const utterance = new Utterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

let feedbackAudioContext = null;

function playCorrectSound() {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (typeof AudioContextClass !== 'function') return;
  if (!feedbackAudioContext) feedbackAudioContext = new AudioContextClass();
  const context = feedbackAudioContext;
  if (typeof context.resume === 'function') context.resume();
  const start = context.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const noteStart = start + index * 0.09;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.16, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.2);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.21);
  });
}

function speakSidebarLabel(label) { speakFullPrompt(label); }

function findStudent(id) { return studentAccounts.find((student) => student.id === id) || null; }

function setLoginFeedback(message, type = '') {
  const element = $('#loginFeedback');
  if (!element) return;
  element.textContent = message;
  element.className = `login-feedback ${type}`;
}

function closeStudentMenu() {
  const picker = $('#studentPicker');
  const menu = $('#studentMenu');
  if (!picker || !menu) return;
  menu.hidden = true;
  picker.setAttribute('aria-expanded', 'false');
  picker.classList.remove('expanded');
}

function toggleStudentMenu(force) {
  const picker = $('#studentPicker');
  const menu = $('#studentMenu');
  if (!picker || !menu) return;
  const open = typeof force === 'boolean' ? force : menu.hidden;
  menu.hidden = !open;
  picker.setAttribute('aria-expanded', String(open));
  picker.classList.toggle('expanded', open);
}

function selectStudent(id) {
  const student = findStudent(id);
  if (!student) return;
  state.studentId = student.id;
  state.studentName = student.name;
  const placeholder = $('#accountPlaceholder');
  const account = $('#accountUsername');
  const password = $('#passwordInput');
  const loginButton = $('#loginButton');
  if (placeholder) placeholder.hidden = true;
  if (account) account.textContent = student.account;
  if (password) {
    password.value = student.password;
    password.type = 'password';
  }
  if (loginButton) loginButton.disabled = false;
  setLoginFeedback('已选择账号，可以登录。', 'success');
  document.querySelectorAll('.student-option').forEach((option) => option.classList.toggle('selected', option.dataset.studentId === student.id));
  closeStudentMenu();
}

function renderStudentMenu() {
  const menu = $('#studentMenu');
  if (!menu) return;
  menu.innerHTML = studentAccounts.map((student) => `<button class="student-option" type="button" role="option" data-student-id="${escapeHtml(student.id)}"><span class="student-option-avatar">${escapeHtml(student.name.slice(0, 1))}</span><span><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.account)}@example.com</small></span><span class="student-option-check">✓</span></button>`).join('');
}

function enterMailbox() {
  const student = findStudent(state.studentId);
  if (!student) {
    setLoginFeedback('请先点击账号框，选择自己的名字。', 'error');
    toggleStudentMenu(true);
    return;
  }
  state.loggedIn = true;
  state.studentName = student.name;
  document.body.classList.remove('login-mode');
  $('#loginScreen').hidden = true;
  $('#mailApp').hidden = false;
  $('#studentLabel').textContent = state.studentName;
  state.view = 'launcher';
  state.mode = null;
  setFeedback('', '');
  setStatus(state.config?.demoMode ? '已连接，当前为教学演示模式' : '已连接，可以发送给贝贝');
  render();
}

function initLogin() {
  document.body.classList.add('login-mode');
  renderStudentMenu();
  $('#studentPicker')?.addEventListener('click', () => toggleStudentMenu());
  $('#studentPicker')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleStudentMenu(); }
    if (event.key === 'Escape') closeStudentMenu();
  });
  $('#studentMenu')?.addEventListener('click', (event) => {
    const option = event.target.closest('[data-student-id]');
    if (option) selectStudent(option.dataset.studentId);
  });
  $('#passwordToggle')?.addEventListener('click', () => {
    const password = $('#passwordInput');
    const toggle = $('#passwordToggle');
    if (!password || !toggle || !password.value) return;
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    toggle.setAttribute('aria-pressed', String(!visible));
    toggle.classList.toggle('visible', !visible);
  });
  $('#forgotPassword')?.addEventListener('click', () => setLoginFeedback('课堂练习账号由老师统一设置。', 'info'));
  $('#loginForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    enterMailbox();
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#studentPicker, #studentMenu')) closeStudentMenu();
  });
}

function setStatus(message, type = '') {
  const element = $('#statusMessage');
  if (element) element.textContent = message;
  document.querySelector('.status-dot')?.classList.toggle('status-error', type === 'error');
}

function setFeedback(message, type = '') { state.feedback = message ? { message, type } : null; }

function feedbackHtml() {
  if (!state.feedback) return '<div class="feedback-slot" aria-live="polite"></div>';
  return `<div class="feedback ${escapeHtml(state.feedback.type)}" role="status">${escapeHtml(state.feedback.message)}</div>`;
}

function trackEvent(action, details = {}) {
  if (STATIC_MODE) return;
  fetch('/api/events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, stage: state.stageIndex + 1, view: state.view, studentId: state.studentId, sessionId: `lesson-${new Date().toISOString().slice(0, 10)}`, details }),
  }).catch(() => {});
}

function countAttempt(key) {
  state.attempts[key] = (state.attempts[key] || 0) + 1;
  trackEvent('attempt', { key, count: state.attempts[key] });
  return state.attempts[key];
}

function getInboxMessages() {
  const messages = [...initialMessages];
  if (state.stageIndex >= 3 && state.transferStep === 0) messages.unshift(teacherMessage);
  if (state.returnAvailable) messages.unshift(returnMessage);
  return messages.filter((message) => !state.deletedMessageIds.includes(message.id));
}

function getMessageById(id) { return getInboxMessages().find((message) => message.id === id) || null; }

function isExpectedMessage(message) {
  if (!message) return false;
  if (state.stageIndex <= 2) return message.id === 'birthday-invite';
  if (state.stageIndex === 3 && state.transferStep === 0) return message.id === 'teacher-activity';
  if (state.stageIndex === 4) return true;
  return true;
}

function render() {
  const hubView = ['launcher', 'levels', 'afterReview', 'externalMail', 'quizIntro', 'quiz', 'quizResult'].includes(state.view);
  document.body.classList.toggle('hub-view', hubView);
  updateConnectionStatus(); updateScaffoldSelect(); updateSupportControl(); updateLessonChrome(); updateSidebarSelection(); updateHomeSelection(); updateFirstLevelGuidance();
  const panel = $('#mainPanel');
  if (!panel) return;
  if (state.view === 'launcher') panel.innerHTML = renderLauncher();
  else if (state.view === 'levels') panel.innerHTML = renderLevels();
  else if (state.view === 'afterReview') panel.innerHTML = renderAfterReview();
  else if (state.view === 'externalMail') panel.innerHTML = renderExternalMail();
  else if (state.view === 'quizIntro') panel.innerHTML = renderQuizIntro();
  else if (state.view === 'quiz') panel.innerHTML = renderQuiz();
  else if (state.view === 'quizResult') panel.innerHTML = renderQuizResult();
  else if (state.view === 'studentHome') panel.innerHTML = renderStudentHome();
  else if (state.view === 'detail') panel.innerHTML = renderDetail();
  else if (state.view === 'compose') panel.innerHTML = renderCompose();
  else if (state.view === 'choice') panel.innerHTML = renderChoice();
  else if (state.view === 'contacts') panel.innerHTML = renderContacts();
  else if (state.view === 'sent') panel.innerHTML = renderSent();
  else if (state.view === 'drafts') panel.innerHTML = renderDrafts();
  else if (state.view === 'safety') panel.innerHTML = renderSafety();
  else if (state.view === 'result') panel.innerHTML = renderResult();
  else if (state.view === 'transfer') panel.innerHTML = renderTransferIntro();
  else panel.innerHTML = renderInbox();
  panel.insertAdjacentHTML('beforeend', renderFirstLevelNotice());
  panel.insertAdjacentHTML('beforeend', renderThirdLevelNotice());
}

function updateConnectionStatus() {
  const element = $('#connectionStatus');
  if (!element || !state.config) return;
  element.classList.toggle('demo', state.config.demoMode);
  element.innerHTML = state.config.demoMode ? '<span class="status-pip"></span> 教学演示模式' : '<span class="status-pip"></span> 联网发信已连接';
}

function updateLessonChrome() {
  const stage = currentStage();
  const title = $('#missionTitle'); const caption = $('#missionCaption'); const progress = $('#missionProgress');
  const stageNumber = $('#lessonStageNumber'); const unreadCount = $('#unreadCount');
  if (title) title.textContent = stage.title;
  if (caption) caption.textContent = stage.caption;
  if (progress) progress.style.width = `${Math.min(100, ((state.stageIndex + 1) / stageDefinitions.length) * 100)}%`;
  if (stageNumber) stageNumber.textContent = String(Math.min(5, state.stageIndex + 1));
  if (unreadCount) unreadCount.textContent = String(getInboxMessages().filter((message) => message.unread).length);
}

function updateScaffoldSelect() {
  const select = $('#scaffoldLevel'); if (select) select.value = state.scaffoldLevel;
  const descriptions = { full: '一步一步提示，附带关键词和句式按钮。', guided: '保留检查清单，减少语言提示。', independent: '只保留必要的任务和结果反馈。' };
  const description = $('#scaffoldDescription'); if (description) description.textContent = descriptions[state.scaffoldLevel];
}

function updateSupportControl() {
  const profile = currentSupportLevel();
  const input = $('#supportLevel');
  const value = $('#supportLevelValue');
  const description = $('#supportDescription');
  if (input) {
    input.value = String(state.supportLevel);
    input.setAttribute('aria-valuetext', profile.label);
  }
  if (value) value.textContent = profile.label;
  if (description) description.textContent = profile.description;
}

function updateSidebarSelection() {
  const actionToView = { 'show-inbox': 'inbox', 'show-sent': 'sent', 'show-drafts': 'drafts', 'show-contacts': 'contacts' };
  document.querySelectorAll('.folder-item').forEach((button) => button.classList.toggle('selected', actionToView[button.dataset.action] === state.view));
}

function updateHomeSelection() {
  document.querySelector('.home-link')?.classList.toggle('selected', state.view === 'studentHome');
}

function updateFirstLevelGuidance() {
  const lockControls = state.stageIndex === 0 && state.supportLevel >= 2;
  const fullPrompt = state.stageIndex === 0 && state.supportLevel === 3;
  const fullFifthLevelPrompt = state.stageIndex === 4 && state.supportLevel === 3;
  const inboxFolder = document.querySelector('.folder-item[data-action="show-inbox"]');
  const writeButton = document.querySelector('.action-button.write');
  inboxFolder?.classList.toggle('first-level-focus', fullPrompt || fullFifthLevelPrompt);
  writeButton?.classList.toggle('third-level-focus', state.stageIndex === 2 && state.supportLevel === 3);
  document.querySelectorAll('.action-button.receive, .action-button.write, .folder-item[data-action="show-drafts"], .folder-item[data-action="show-sent"], .folder-item[data-action="show-contacts"], .student-shortcut[data-action="show-contacts"]').forEach((button) => {
    button.classList.toggle('lesson-locked', lockControls);
    if (lockControls) button.setAttribute('aria-disabled', 'true');
    else button.removeAttribute('aria-disabled');
  });
}

function renderLauncher() {
  return `<section class="content-card hub-shell"><div class="hub-heading"><div><h1>今天想完成哪一项？</h1><p>${escapeHtml(state.studentName)}，请选择老师安排的学习内容。</p></div></div><div class="mode-grid"><button class="mode-card classroom-card" data-action="open-classroom"><span class="mode-icon">▦</span><span class="mode-copy"><strong>课堂练习</strong><small>跟随老师指令，按步骤完成课堂练习</small></span><span class="mode-arrow">→</span></button><button class="mode-card after-card" data-action="open-after-review"><span class="mode-icon">↗</span><span class="mode-copy"><strong>课后巩固</strong><small>先完成模拟复习，再进入常见邮箱实操</small></span><span class="mode-arrow">→</span></button></div><div class="hub-note"><span>✦</span><div><strong>学习提示</strong><p>课堂练习会从“找到未读邮件”开始，跟着老师的步骤继续；课后巩固完成模拟复习后，可以选择新浪、QQ或网易邮箱继续练习。</p></div></div></section>`;
}

function renderLevels() {
  const targetStage = stageDefinitions[state.teacherStage] || stageDefinitions[0];
  const nextStage = getNextStageIndex();
  const cards = stageDefinitions.map((stage, index) => {
    const completed = isStageCompleted(index);
    const target = !completed && index === state.teacherStage;
    const current = !completed && index === nextStage;
    const stateLabel = completed ? '已完成' : current ? '准备进入' : target ? '老师指令' : '选择进入';
    const completeBadge = completed ? '<span class="level-complete-badge" aria-label="已完成">✓</span>' : '';
    return `<button class="level-card ${completed ? 'completed' : ''} ${target ? 'teacher-target' : ''} ${current ? 'current-level' : ''}" data-action="select-level" data-level="${index}"><span class="level-number">${index + 1}</span><span class="level-copy"><strong>第${index + 1}关｜${escapeHtml(stage.title)}</strong><small>${escapeHtml(stage.caption)}</small></span><span class="level-state">${stateLabel}<b>→</b></span>${completeBadge}</button>`;
  }).join('');
  return `<section class="content-card hub-shell levels-shell"><div class="hub-heading"><div><div class="eyebrow">课堂练习</div><h1>选择一个关卡开始</h1><p>老师发出指令后，学生点击对应关卡进入练习。</p></div><button class="secondary-button hub-back" data-action="go-launcher">‹ 返回学习入口</button></div><div class="teacher-directive"><div class="directive-icon">☞</div><div class="directive-copy"><strong>今天请完成第${state.teacherStage + 1}关：${escapeHtml(targetStage.title)}</strong><small>教师可以调整下面的任务编号，学生再选择要进入的关卡。</small></div><label class="teacher-select-label" for="teacherStageSelect">任务编号<select id="teacherStageSelect">${stageDefinitions.map((stage, index) => `<option value="${index}" ${index === state.teacherStage ? 'selected' : ''}>第${index + 1}关</option>`).join('')}</select></label></div>${feedbackHtml()}<div class="level-grid">${cards}</div></section>`;
}

function renderAfterReview() {
  const scenario = afterReviewScenarios[state.afterReviewStep];
  const progress = afterReviewScenarios.map((item, index) => `<span class="review-step ${index < state.afterReviewStep ? 'done' : ''} ${index === state.afterReviewStep ? 'active' : ''}"><b>${index < state.afterReviewStep ? '✓' : index + 1}</b>${escapeHtml(item.title.split('｜')[1])}</span>`).join('');
  const options = scenario.options.map((option, index) => {
    const selected = state.afterReviewSelection === option.value;
    const resultClass = state.afterReviewResult === 'correct' && option.value === scenario.correct ? 'correct' : state.afterReviewResult === 'wrong' && selected ? 'wrong' : '';
    return `<button class="review-option ${selected ? 'chosen' : ''} ${resultClass}" data-action="after-review-choice" data-choice="${escapeHtml(option.value)}" data-voice-label="${escapeHtml(option.label)}"><span>${index + 1}</span>${escapeHtml(option.label)}</button>`;
  }).join('');
  const continueLabel = state.afterReviewStep === afterReviewScenarios.length - 1 ? '完成复习' : '下一题';
  const continueModal = state.afterReviewContinueOpen ? `<div class="after-review-success-backdrop" role="dialog" aria-modal="true" aria-labelledby="afterReviewSuccessTitle"><div class="after-review-success-modal"><div class="after-review-success-icon">✓</div><div class="eyebrow">回答正确</div><h2 id="afterReviewSuccessTitle">是否进行下一题？</h2><p>你选对了，可以继续完成模拟复习。</p><button class="primary-button after-review-continue-button" data-action="after-review-next">${continueLabel}</button></div></div>` : '';
  return `<section class="content-card hub-shell review-shell"><div class="hub-heading"><div><div class="eyebrow">课后巩固｜模拟复习</div><h1>先复习，再去真实邮箱练习</h1><p>完成下面三个小判断，确认已经记住收发邮件的基本步骤。</p></div><button class="secondary-button hub-back" data-action="go-launcher">‹ 返回学习入口</button></div><div class="review-progress">${progress}</div>${feedbackHtml()}<article class="review-question"><span class="review-question-index">${state.afterReviewStep + 1} / ${afterReviewScenarios.length}</span><div class="eyebrow">${escapeHtml(scenario.title)}</div><h2>${escapeHtml(scenario.question)}</h2><div class="review-options">${options}</div><button class="primary-button review-submit-button" data-action="after-review-submit" ${state.afterReviewSelection ? '' : 'disabled'}>提交答案</button></article><div class="hub-footer"><span>选择答案后，点击“提交答案”。</span><button class="secondary-button" data-action="go-launcher">退出复习</button></div>${continueModal}</section>`;
}

function speakAfterReviewQuestion() {
  const scenario = afterReviewScenarios[state.afterReviewStep];
  if (scenario?.question) speakResult(scenario.question);
}

function renderExternalMail() {
  return `<section class="content-card hub-shell external-shell"><div class="hub-heading"><div><div class="eyebrow">课后巩固｜模拟复习完成</div><h1>选择一个邮箱继续实操</h1><p>请使用你最开始选择的学习邮箱，完成课后作业。</p></div><button class="secondary-button hub-back" data-action="go-launcher">‹ 返回学习入口</button></div><div class="completion-banner"><span>✓</span><div><strong>模拟复习已完成</strong><small>接下来可以查收邮件、回复邮件或写一封新邮件。</small></div></div><div class="external-task"><strong>课后任务</strong><span>登录邮箱 → 找到邮件 → 回复或写信 → 发送前检查</span></div><div class="external-grid"><a class="external-card sina" href="https://mail.sina.com.cn/" target="_blank" rel="noopener noreferrer" data-action="open-external-mail" data-provider="新浪邮箱"><span class="external-logo">S</span><span><strong>新浪邮箱</strong><small>打开新浪邮箱</small></span><b>↗</b></a><a class="external-card qq" href="https://mail.qq.com/" target="_blank" rel="noopener noreferrer" data-action="open-external-mail" data-provider="QQ邮箱"><span class="external-logo">Q</span><span><strong>QQ邮箱</strong><small>打开QQ邮箱</small></span><b>↗</b></a><a class="external-card netease" href="https://mail.163.com/" target="_blank" rel="noopener noreferrer" data-action="open-external-mail" data-provider="网易邮箱"><span class="external-logo">@</span><span><strong>网易邮箱</strong><small>打开网易邮箱</small></span><b>↗</b></a></div><div class="hub-note external-warning"><span aria-hidden="true">!</span><div><strong>使用提醒</strong><p>外部邮箱页面由对应服务商提供。请只使用自己的账号操作，不要把邮箱密码告诉别人。</p></div></div></section>`;
}

function currentQuizBank() { return quizBanks[state.quizDifficulty] || quizBanks[1]; }

function speakQuizQuestion() {
  const question = currentQuizBank().questions[state.quizQuestionIndex];
  if (question?.prompt) speakResult(question.prompt.replace(/\s+/g, ' '));
}

function resetQuizState() {
  state.quizQuestionIndex = 0;
  state.quizSelection = null;
  state.quizSortOrder = [];
  state.quizSubmitted = false;
  state.quizCorrectCount = 0;
}

function renderQuizIntro() {
  const difficultyOptions = Object.entries(quizBanks).map(([value, bank]) => `<option value="${value}" ${Number(value) === state.quizDifficulty ? 'selected' : ''}>${bank.label}</option>`).join('');
  return `<section class="content-card hub-shell quiz-intro-shell"><div class="hub-heading"><div><div class="eyebrow">第四关｜答题练习</div><h1>邮件应用大挑战</h1><p>选择一种答题难度，完成三道邮件应用题。</p></div><button class="secondary-button hub-back" data-action="go-levels">‹ 返回选择页</button></div><div class="quiz-intro-panel"><div class="quiz-intro-icon">?</div><div class="quiz-intro-copy"><strong>准备开始答题</strong></div><label class="quiz-difficulty-label" for="quizDifficulty">答题难度<select id="quizDifficulty">${difficultyOptions}</select></label></div><button class="primary-button quiz-start-button" data-action="start-quiz">开始答题</button></section>`;
}

function renderQuiz() {
  const bank = currentQuizBank();
  const question = bank.questions[state.quizQuestionIndex];
  const progress = `${state.quizQuestionIndex + 1} / ${bank.questions.length}`;
  let answerArea = '';
  if (bank.kind === 'sort') {
    const order = state.quizSortOrder;
    answerArea = `<div class="quiz-sort-area"><p class="quiz-instruction">请按正确顺序点击卡片：</p><div class="quiz-sort-order">${order.length ? order.map((itemIndex, index) => `<span><b>${index + 1}</b>${escapeHtml(question.items[itemIndex])}</span>`).join('') : '<span class="quiz-empty-order">还没有选择顺序</span>'}</div><div class="quiz-sort-options">${question.items.map((item, index) => `<button class="quiz-sort-card ${order.includes(index) ? 'chosen' : ''}" data-action="quiz-sort-item" data-index="${index}" data-voice-label="${escapeHtml(item)}" ${state.quizSubmitted ? 'disabled' : ''}><span>${order.includes(index) ? order.indexOf(index) + 1 : '＋'}</span>${escapeHtml(item)}</button>`).join('')}</div></div>`;
  } else {
    answerArea = `<div class="quiz-answer-options">${question.options.map((option) => { const isJudge = bank.kind === 'judge'; const voiceLabel = isJudge ? (option.value === 'true' ? '对' : '错') : option.label; const image = option.value === 'true' ? 'assets/quiz-correct-icon.png' : 'assets/quiz-incorrect-icon.png'; return `<button class="quiz-answer-option ${isJudge ? 'quiz-judge-option' : ''} ${state.quizSelection === option.value ? 'chosen' : ''}" data-action="quiz-select-answer" data-answer="${escapeHtml(option.value)}" data-voice-label="${escapeHtml(voiceLabel)}" aria-label="${escapeHtml(voiceLabel)}" ${state.quizSubmitted ? 'disabled' : ''}>${isJudge ? `<img src="${image}" alt="${escapeHtml(voiceLabel)}" />` : escapeHtml(option.label)}</button>`; }).join('')}</div>`;
  }
  const submitLabel = state.quizSubmitted ? (state.quizQuestionIndex === bank.questions.length - 1 ? '完成答题' : '下一题') : '确认答案';
  const feedback = state.quizSubmitted ? '<div class="quiz-feedback success">回答正确，可以继续。</div>' : '';
  return `<section class="content-card hub-shell quiz-shell"><div class="hub-heading"><div><div class="eyebrow">第四关｜${bank.label}${bank.title}</div><h1>邮件应用大挑战</h1><p>第${progress}题</p></div><button class="secondary-button hub-back" data-action="go-levels">返回选择页</button></div>${feedbackHtml()}<article class="quiz-question-card"><div class="quiz-question-type">${bank.title}</div><h2>${escapeHtml(question.prompt)}</h2>${answerArea}${feedback}<button class="primary-button quiz-submit-button" data-action="quiz-submit" ${(!state.quizSubmitted && ((bank.kind === 'sort' && state.quizSortOrder.length !== question.items.length) || (bank.kind !== 'sort' && !state.quizSelection))) ? 'disabled' : ''}>${submitLabel}</button></article></section>`;
}

function renderQuizResult() {
  return '<section class="content-card hub-shell quiz-result-shell"><div class="hub-heading"><div><div class="eyebrow">第四关完成</div><h1>答题完成</h1><p>你已经练习了收件、回复和主动写信的方法。</p></div></div><div class="ability-result-grid"><div class="ability-result"><span>✓</span><strong>我会查收邮件</strong></div><div class="ability-result"><span>✓</span><strong>我会回复邮件</strong></div><div class="ability-result"><span>✓</span><strong>我会主动写信</strong></div></div><button class="primary-button quiz-finish-button" data-action="finish-quiz">返回关卡选择页</button></section>';
}

function submitQuizAnswer() {
  const bank = currentQuizBank();
  const question = bank.questions[state.quizQuestionIndex];
  if (state.quizSubmitted) {
    if (state.quizQuestionIndex === bank.questions.length - 1) {
      state.view = 'quizResult';
      setFeedback('', '');
      trackEvent('complete-quiz', { difficulty: state.quizDifficulty, correct: state.quizCorrectCount });
    } else {
      state.quizQuestionIndex += 1;
      state.quizSelection = null;
      state.quizSortOrder = [];
      state.quizSubmitted = false;
      setFeedback('', '');
    }
    render();
    if (state.view === 'quiz') speakQuizQuestion();
    return;
  }
  const answer = bank.kind === 'sort' ? state.quizSortOrder : state.quizSelection;
  const correct = bank.kind === 'sort' ? JSON.stringify(answer) === JSON.stringify(question.answer) : answer === question.answer;
  if (!correct) {
    setFeedback('再想一想，再选择一次。', 'info');
    render();
    return;
  }
  state.quizSubmitted = true;
  state.quizCorrectCount += 1;
  setFeedback('', '');
  playCorrectSound();
  speakResult('你真棒');
  render();
}

function renderStudentHome() {
  const student = findStudent(state.studentId);
  const account = student ? `${student.account}@example.com` : `${state.studentName || 'student'}@example.com`;
  const unread = getInboxMessages().filter((message) => message.unread).length;
  const fullFirstLevelPrompt = state.stageIndex === 0 && state.supportLevel === 3;
  const steppedFirstLevelPrompt = state.stageIndex === 0 && state.supportLevel === 2;
  const fullFifthLevelPrompt = state.stageIndex === 4 && state.supportLevel === 3;
  const guidedThirdLevelPrompt = state.stageIndex === 2 && state.supportLevel === 1;
  const steppedThirdLevelPrompt = state.stageIndex === 2 && state.supportLevel >= 2;
  const lockFirstLevelControls = state.stageIndex === 0 && state.supportLevel >= 2;
  let instruction = '老师指令：先找到一封未读邮件';
  if (fullFirstLevelPrompt || steppedFirstLevelPrompt) instruction = '老师指令：点击“收件箱”';
  if (guidedThirdLevelPrompt) instruction = '老师指令：你要写一封邮件发送给贝贝';
  if (steppedThirdLevelPrompt) instruction = '老师指令：点击“写信”';
  if (state.stageIndex === 4) instruction = state.supportLevel >= 2 ? '教师指令：查看“收件箱”。' : '教师指令：现在要查看贝贝的回信。';
  const focusInstruction = steppedFirstLevelPrompt || steppedThirdLevelPrompt || (state.stageIndex === 4 && state.supportLevel >= 2);
  const homeTask = state.supportLevel === 0 ? '' : `<div class="student-home-task ${focusInstruction ? 'first-level-instruction-focus' : ''}">${instruction}</div>`;
  return `<section class="content-card student-home"><div class="student-profile-card"><div class="student-profile-head"><div class="student-avatar">${escapeHtml(state.studentName.slice(0, 1) || '学')}</div><div class="student-profile-copy"><div class="eyebrow">个人邮箱</div><h1>${escapeHtml(state.studentName || '学生')}</h1><p>${escapeHtml(account)}</p></div></div>${homeTask}<div class="student-shortcuts"><button class="student-shortcut ${fullFirstLevelPrompt || fullFifthLevelPrompt ? 'first-level-focus' : ''}" data-action="show-inbox"><span class="shortcut-icon"><img src="assets/unread-mail-icon.png" alt="" aria-hidden="true" /></span><span><strong>未读邮箱</strong><small>查看收到的新邮件</small></span><b>${unread}</b></button><button class="student-shortcut ${lockFirstLevelControls ? 'lesson-locked' : ''}" data-action="show-contacts" ${lockFirstLevelControls ? 'aria-disabled="true"' : ''}><span class="shortcut-icon"><img src="assets/contact-person-icon.png" alt="" aria-hidden="true" /></span><span><strong>联系人邮箱</strong><small>选择本课联系人</small></span><b>›</b></button></div></div></section>`;
}

function renderFirstLevelNotice() {
  if (!state.firstLevelNotice) return '';
  return '<div class="third-level-notice-backdrop" role="dialog" aria-modal="true" aria-labelledby="firstLevelNoticeTitle"><div class="third-level-notice"><button class="third-level-notice-close" type="button" data-action="close-first-level-notice" aria-label="关闭提示">×</button><div class="third-level-notice-visual"><span class="first-level-inbox-example"><span>▣</span><strong>收件箱</strong><b>1</b></span><span class="third-level-notice-arrow">↓</span></div><h2 id="firstLevelNoticeTitle">你要查看“收件箱”</h2></div></div>';
}

function renderThirdLevelNotice() {
  if (!state.thirdLevelNotice) return '';
  return '<div class="third-level-notice-backdrop" role="dialog" aria-modal="true" aria-labelledby="thirdLevelNoticeTitle"><div class="third-level-notice"><button class="third-level-notice-close" type="button" data-action="close-third-level-notice" aria-label="关闭提示">×</button><div class="third-level-notice-visual"><span class="third-level-write-example">＋ 写信</span><span class="third-level-notice-arrow">↓</span></div><h2 id="thirdLevelNoticeTitle">你要给贝贝“写信”</h2></div></div>';
}

function renderTaskStrip(title, body, steps = []) {
  if (state.supportLevel === 0) return '';
  const highlightBeibeiStep = [0, 4].includes(state.stageIndex) && state.view === 'inbox' && state.supportLevel >= 2;
  const highlightOpenedStep = state.stageIndex === 0 && state.view === 'detail' && state.supportLevel >= 2;
  const highlightReplyInputStep = state.stageIndex === 1 && state.view === 'compose' && state.compose.reply && state.supportLevel >= 2;
  const stepHtml = steps.map((step, index) => {
    const focused = (highlightBeibeiStep && index === 1) || (highlightOpenedStep && index === 2) || (highlightReplyInputStep && index === 1);
    const reveal = focused && !highlightReplyInputStep && state.supportLevel === 3;
    return `<span class="task-step ${focused ? `first-level-step-focus ${reveal ? 'first-level-step-reveal' : ''}` : ''}"><b>${index + 1}</b>${escapeHtml(step)}</span>`;
  }).join('');
  return `<div class="task-strip"><div class="task-strip-icon">${state.stageIndex + 1}</div><div class="task-strip-copy"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></div>${stepHtml ? `<div class="task-flow">${stepHtml}</div>` : ''}</div>`;
}

function renderInbox() {
  const plainMailbox = state.stageIndex === 4;
  const messages = getInboxMessages();
  let taskTitle = '找到贝贝的新邮件'; let taskBody = '请根据未读标识、发件人和主题，找到需要打开的邮件。'; let steps = ['收件箱', '贝贝', '打开邮件'];
  if (state.stageIndex === 3) { taskTitle = '信息老师发来一封邮件'; taskBody = '这是迁移练习。请找到信息老师的来信。'; steps = ['收件箱', '信息老师', '打开邮件']; }
  if (state.stageIndex === 4) { taskTitle = '找到贝贝的回信'; taskBody = '请根据未读标识、发件人和主题，找到需要打开的邮件。'; steps = ['收件箱', '贝贝', '打开邮件']; }
  const writeButton = state.stageIndex === 2 ? '<button class="primary-button" data-action="start-write">开始写信</button>' : '';
  const inboxDescription = plainMailbox || state.supportLevel === 0 ? '' : '<p>先看清楚发件人、主题和正文，再决定下一步。</p>';
  const inboxNote = plainMailbox || state.supportLevel === 0 ? '' : '<div class="inbox-note"><span class="note-icon">i</span> 未读邮件会显示蓝色圆点；打开邮件后，可以看到发件人、主题、时间和正文。</div>';
  const taskStrip = plainMailbox && state.supportLevel < 2 ? '' : renderTaskStrip(taskTitle, taskBody, state.supportLevel >= 2 ? steps : []);
  return `<section class="content-card"><div class="page-heading"><div><div class="eyebrow">${plainMailbox ? '邮箱' : '收信练习'}</div><h1>收件箱 <span class="title-count">(${messages.length})</span></h1>${inboxDescription}</div><div class="page-tools">${writeButton}<button class="icon-button" data-action="refresh">↻ 刷新</button></div></div>${taskStrip}${feedbackHtml()}<div class="mail-list">${messages.map((message) => { const expected = isExpectedMessage(message); const fifthLevelReplyFocus = state.stageIndex === 4 && state.supportLevel === 3 && message.id === 'beibei-reply'; const focusClass = expected && state.stageIndex === 3 ? 'focus-row' : (expected && state.stageIndex === 0 && state.supportLevel === 3) || fifthLevelReplyFocus ? 'first-level-mail-focus' : ''; return `<button class="mail-row ${focusClass}" data-action="open-message" data-id="${escapeHtml(message.id)}"><span class="mail-select" aria-hidden="true"></span><span class="mail-state ${message.unread ? 'unread' : ''}" aria-label="${message.unread ? '未读' : '已读'}"></span><span class="sender">${escapeHtml(message.sender)}</span><span class="subject-preview"><strong>${escapeHtml(message.subject)}</strong><span class="preview-text">${escapeHtml(message.body.split('\n')[0])}</span></span><span class="mail-date">${escapeHtml(message.date.slice(5, 16))}</span></button>`; }).join('')}</div>${inboxNote}</section>`;
}

function renderDetail() {
  const message = state.selectedMessage || initialMessages[0];
  const plainMailbox = state.stageIndex === 4;
  const birthdayRead = state.stageIndex === 0 && message.id === 'birthday-invite';
  const secondLevelInvite = state.stageIndex === 1 && message.id === 'birthday-invite';
  const transferRead = state.stageIndex === 3 && message.id === 'teacher-activity';
  const returnRead = state.stageIndex === 4 && message.id === 'beibei-reply';
  let action = '';
  if (birthdayRead) action = '<button class="primary-button" data-action="complete-level">完成</button>';
  else if (transferRead) action = '<button class="primary-button" data-action="confirm-transfer-read">看清楚了，判断下一步</button>';
  else if (returnRead) action = '<button class="primary-button" data-action="confirm-return">读完回信，完成安全判断</button>';
  const detailHint = birthdayRead && state.supportLevel === 3 ? '<div class="read-facts"><div><span>发件人</span><strong>贝贝</strong></div><div><span>主题</span><strong>生日派对邀请</strong></div><div><span>邀请内容</span><strong>参加生日派对</strong></div></div>' : '';
  const replyDisabled = birthdayRead ? 'disabled' : '';
  const replyClass = secondLevelInvite ? (state.supportLevel === 3 ? 'toolbar-primary toolbar-attention' : state.supportLevel > 0 ? 'toolbar-primary' : '') : '';
  const detailTaskStrip = [0, 1].includes(state.stageIndex) && state.supportLevel >= 2
    ? renderTaskStrip(
      state.stageIndex === 0 ? '找到贝贝的新邮件' : '回复贝贝的邮件',
      state.stageIndex === 0 ? '你已经打开了贝贝的邮件。' : '先看清邮件内容，再回复贝贝。',
      ['收件箱', '贝贝', '打开邮件']
    )
    : '';
  let detailFooter = '';
  if (secondLevelInvite && state.supportLevel >= 2) {
    const fullPrompt = state.supportLevel === 3;
    const promptTitle = fullPrompt ? '回复贝贝的信件信息' : '步骤4';
    const prompt = fullPrompt ? '点击“<em>回复</em>”' : '<em class="detail-step-emphasis">回复贝贝的信件信息。</em>';
    detailFooter = `<div class="detail-step-prompt"><div class="detail-step-number">4</div><div><strong>${promptTitle}</strong><span>${prompt}</span></div></div>`;
  } else if (!plainMailbox && action && (birthdayRead || state.supportLevel > 0)) {
    detailFooter = `<div class="detail-next"><div><strong>${birthdayRead ? '恭喜你找到了贝贝发来的邮件' : returnRead ? '回信已读完' : '下一步'}</strong><span>${birthdayRead ? '点击“完成”，返回关卡选择页。' : returnRead ? '下面完成邮箱安全小卫士判断。' : '根据邮件内容，选择合适的操作。'}</span></div>${action}</div>`;
  }
  const highlightReturnGift = returnRead && state.supportLevel === 3;
  const messageBody = highlightReturnGift
    ? escapeHtml(message.body).replace('喜欢画画', '<span class="return-gift-focus">喜欢画画</span>')
    : escapeHtml(message.body);
  return `<section class="content-card"><div class="detail-toolbar"><button class="icon-button back-button" data-action="show-inbox">‹ 返回</button><button class="icon-button ${replyClass}" data-action="reply" ${replyDisabled}>↩ 回复</button><button class="icon-button" data-action="forward-message">↪ 转发</button><button class="icon-button danger-button" data-action="delete-message">删除</button></div>${detailTaskStrip}${feedbackHtml()}<article class="detail-body"><div class="message-label"><span class="message-dot"></span>${message.unread ? '未读邮件' : '邮件详情'}</div><h1 class="detail-subject">${escapeHtml(message.subject)}</h1><dl class="mail-meta"><dt>发件人</dt><dd><span class="mini-avatar">${escapeHtml(message.sender.slice(0, 1))}</span>${escapeHtml(message.sender)} &lt;${escapeHtml(message.senderEmail)}&gt;</dd><dt>收件人</dt><dd>我 &lt;学生邮箱&gt;</dd><dt>时　间</dt><dd>${escapeHtml(message.date)}</dd></dl><div class="mail-content">${messageBody}</div>${detailHint}${detailFooter}</article></section>`;
}

function renderChoice() {
  const isTransfer = state.stageIndex === 3;
  const title = isTransfer ? (state.transferStep === 1 ? '老师问你能不能参加活动' : '你想主动问老师活动几点开始') : '这次应该选择哪一个？';
  const body = isTransfer ? (state.transferStep === 1 ? '这是对已有邮件的回应。' : '这是你主动发起的新问题。') : '已经告诉贝贝你会参加了。现在想主动问她喜欢什么礼物。';
  const correct = isTransfer ? (state.transferStep === 1 ? 'reply' : 'write') : 'write';
  return `<section class="content-card choice-card-shell"><div class="page-heading"><div><div class="eyebrow">${isTransfer ? '迁移判断' : '情境判断'}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p></div></div>${renderTaskStrip(isTransfer ? '先判断功能，再操作' : '回复，还是写信？', isTransfer ? '想一想：这是回应别人，还是主动发起交流？' : '想一想：贝贝已经发来邮件了吗？', state.supportLevel >= 2 ? ['看情境', '选功能', '再操作'] : [])}${feedbackHtml()}<div class="choice-grid"><button class="choice-card" data-action="choose-mode" data-mode="reply"><span class="choice-icon reply-icon">↩</span><strong>回复</strong><span>对已有邮件作出回应</span>${correct === 'reply' ? '<em>这次要用它</em>' : ''}</button><button class="choice-card" data-action="choose-mode" data-mode="write"><span class="choice-icon write-icon">＋</span><strong>写信</strong><span>主动给别人发一封新邮件</span>${correct === 'write' ? '<em>这次要用它</em>' : ''}</button></div>${state.supportLevel >= 3 ? '<div class="choice-tip">提示：已经收到对方的邮件，用“回复”；想主动开始一个新话题，用“写信”。</div>' : ''}</section>`;
}

function renderCompose() {
  const subjectDone = Boolean(state.compose.subject.trim()); const bodyDone = Boolean(state.compose.body.trim()); const recipientDone = Boolean(state.compose.recipientEmail.trim());
  const forwarding = Boolean(state.compose.forward);
  const complete = subjectDone && bodyDone && recipientDone; const showFull = state.supportLevel >= 3; const showSteps = state.supportLevel >= 2; const showGuided = state.supportLevel >= 1;
  const supportTitle = showFull ? '一步一步完成' : showSteps ? '按步骤检查' : showGuided ? '发送前检查' : '自己检查';
  const composeDescription = state.supportLevel === 0 ? '' : `<p>${state.compose.reply ? '回复会沿着原邮件发送给贝贝。' : forwarding ? '原邮件内容已带入，请选择收件人后发送。' : '先选收件人，再填写主题和正文。'}</p>`;
  const recipient = state.compose.reply ? `<div class="locked-recipient"><span class="lock">🔒</span><strong>${escapeHtml(getRecipientName())}</strong><small>&lt;${escapeHtml(getRecipientEmail())}&gt;</small></div>` : recipientDone ? `<div class="selected-recipient"><span class="recipient-avatar">贝</span><span><strong>${escapeHtml(getRecipientName())}</strong><small>&lt;${escapeHtml(state.compose.recipientEmail)}&gt;</small></span><button type="button" data-action="clear-recipient" aria-label="清除收件人">×</button></div>` : '<button type="button" class="contact-picker" data-action="open-recipient-contacts"><span>＋</span> 从联系人邮箱选择贝贝</button>';
  const steps = state.compose.reply ? [['收件人：贝贝', true], ['填写回复内容', bodyDone], ['检查后发送', false]] : [['选择收件人', recipientDone], ['填写邮件主题', subjectDone], ['填写邮件正文', bodyDone], ['检查后发送', false]];
  const composeSupport = state.supportLevel === 0 ? '' : `<aside class="compose-support"><div class="support-title">${supportTitle}</div><ol class="step-list">${steps.map(([text, done], index) => `<li class="${done ? 'done' : ''}" data-step="${index}"><span class="step-number">${done ? '✓' : index + 1}</span><span>${text}</span></li>`).join('')}</ol>${showGuided ? `<div class="check-list"><div class="check-item done">收件人：${state.compose.reply ? '贝贝' : recipientDone ? '已选择' : '还未选择'}</div><div class="check-item ${subjectDone ? 'done' : ''}">主题${subjectDone ? '已填写' : '还未填写'}</div><div class="check-item ${bodyDone ? 'done' : ''}">正文${bodyDone ? '已填写' : '还未填写'}</div></div>` : ''}</aside>`;
  const highlightReplyBody = state.stageIndex === 1 && state.compose.reply && state.supportLevel === 3;
  return `<section class="content-card"><div class="page-heading"><div><div class="eyebrow">${state.compose.reply ? '回复邮件' : forwarding ? '转发邮件' : '新建邮件'}</div><h1>${state.compose.reply ? '回复邮件' : forwarding ? '转发邮件' : '写新邮件'}</h1>${composeDescription}</div><div class="page-tools"><button class="icon-button" data-action="save-draft">保存草稿</button><button class="icon-button" data-action="show-inbox">取消</button></div></div>${renderTaskStrip(state.compose.reply ? '告诉贝贝“我会参加”' : forwarding ? '转发这封邮件' : '给贝贝准备礼物', state.compose.reply ? '回复内容写清楚，再点击发送。' : forwarding ? '选择收件人，检查原邮件内容后发送。' : '完成收件人、主题、正文，发送前认真检查。', showSteps ? (state.compose.reply ? ['回复', '输入', '发送'] : ['收件人', '主题', '正文', '发送']) : [])}${feedbackHtml()}<div class="compose-layout${state.supportLevel === 0 ? ' no-compose-support' : ''}"><form class="compose-form" id="composeForm"><div class="field-row"><div class="field-label">收件人</div><div>${recipient}</div></div><div class="field-row"><label class="field-label" for="subjectInput">主　题</label><input class="compose-input" id="subjectInput" maxlength="120" placeholder="写一个能看懂的主题" value="${escapeHtml(state.compose.subject)}" /></div><label class="body-label" for="bodyInput">正文</label><textarea class="compose-textarea ${highlightReplyBody ? 'full-reply-body-focus' : ''}" id="bodyInput" maxlength="2000" placeholder="在这里写邮件正文…">${escapeHtml(state.compose.body)}</textarea>${showFull ? '<div class="phrase-area"><span class="phrase-label">句式提示</span><button type="button" class="phrase-chip" data-action="insert-phrase" data-text="您好，贝贝！">您好，贝贝！</button><button type="button" class="phrase-chip" data-action="insert-phrase" data-text="我想告诉你：">我想告诉你：</button><button type="button" class="phrase-chip" data-action="insert-phrase" data-text="谢谢！">谢谢！</button></div>' : ''}<div class="compose-actions-bar"><span class="char-count">${state.compose.body.length}/2000</span><button class="send-button" type="submit" ${complete && !state.sending ? '' : 'disabled'}>${state.sending ? '发送中…' : '发送'}</button></div></form>${composeSupport}</div>${state.reviewOpen ? renderReviewModal() : ''}</section>`;
}

function renderReviewModal() {
  return `<div class="review-backdrop" role="dialog" aria-modal="true" aria-labelledby="reviewTitle"><div class="review-modal"><div class="review-icon">✓</div><div class="eyebrow">最后看一看</div><h2 id="reviewTitle">发送前检查</h2><p class="review-intro">确认没有问题，再把邮件发出去。</p><div class="review-list"><div><span>✓</span><label>收件人</label><strong>${escapeHtml(getRecipientName())}</strong></div><div><span>✓</span><label>主题</label><strong>${escapeHtml(state.compose.subject)}</strong></div><div><span>✓</span><label>正文</label><strong>已经填写</strong></div></div><div class="review-actions"><button class="secondary-button" data-action="cancel-review">返回修改</button><button class="primary-button" data-action="confirm-send">确认发送</button></div></div></div>`;
}

function renderSent() {
  const next = state.sentCompletionStage === 2 ? '<div class="next-mission"><div class="next-mission-icon">✓</div><div><div class="eyebrow">本关完成</div><strong>你已经成功回复了贝贝</strong><span>点击“已完成”，返回关卡选择页。</span></div><button class="primary-button" data-action="complete-level">已完成</button></div>' : state.sentCompletionStage === 3 ? '<div class="next-mission"><div class="next-mission-icon">✓</div><div><div class="eyebrow">本关完成</div><strong>你成功给贝贝写了一封信！</strong><span>点击“已完成”，返回关卡选择页。</span></div><button class="primary-button" data-action="complete-level">已完成</button></div>' : '';
  return `<section class="content-card"><div class="page-heading"><div><div class="eyebrow">发信记录</div><h1>已发送</h1><p>这里记录本次练习中已经发送的邮件。</p></div></div>${state.sentMessages.length ? `<div class="mail-list">${state.sentMessages.map((message) => `<div class="mail-row sent-row"><span class="mail-select" aria-hidden="true"></span><span class="mail-state sent"></span><span class="sender">我</span><span class="subject-preview"><strong>${escapeHtml(message.subject)}</strong><span class="preview-text">已发送给贝贝</span></span><span class="mail-date">刚刚</span></div>`).join('')}</div>` : '<div class="empty-state"><div class="empty-icon">➤</div><div>还没有发送记录</div></div>'}${next}</section>`;
}

function renderDrafts() {
  return '<section class="content-card"><div class="page-heading"><div><div class="eyebrow">暂存内容</div><h1>草稿箱</h1><p>暂存的邮件可以继续完成。</p></div></div><div class="empty-state"><div class="empty-icon">□</div><div>当前没有草稿</div><small>课堂练习中可以先完成一封邮件，再使用发送前检查。</small></div></section>';
}

function renderTransferIntro() {
  return '<section class="content-card transfer-intro"><div class="page-heading"><div><div class="eyebrow">第4关｜迁移练习</div><h1>邮件应用大挑战</h1><p>换一个情境，继续使用查收、回复和写信的方法。</p></div></div><div class="transfer-roadmap"><div class="roadmap-item active"><b>1</b><strong>查收</strong><span>找到信息老师的邮件</span></div><div class="roadmap-line"></div><div class="roadmap-item"><b>2</b><strong>回复</strong><span>回应老师的问题</span></div><div class="roadmap-line"></div><div class="roadmap-item"><b>3</b><strong>写信</strong><span>主动问一个问题</span></div></div><div class="transfer-start"><div class="transfer-illustration">↗</div><h2>准备好了吗？</h2><p>信息老师发来了一封新邮件，请回到收件箱找一找。</p><button class="primary-button" data-action="show-inbox">打开收件箱</button></div></section>';
}

function renderContacts() {
  return `<section class="content-card"><div class="page-heading"><div><div class="eyebrow">联系人邮箱</div><h1>联系人邮箱</h1><p>本课练习只开放一个安全联系人。</p></div></div><div class="contact-panel"><button class="contact-card selectable-contact" data-action="select-recipient"><div class="avatar">贝</div><div><div class="contact-name">${escapeHtml(getRecipientName())}</div><div class="contact-email">${escapeHtml(getRecipientEmail())}</div></div><div class="contact-lock">🔒 本课联系人</div></button><div class="notice-box">为了保护学生和收件人的隐私，本练习只允许给贝贝发送邮件。选择后会自动带入写信页面。</div></div></section>`;
}

function renderSafety() {
  const done = safetyScenarios.filter((scenario) => state.safetyAnswers[scenario.id] === scenario.correct).length;
  return `<section class="content-card safety-shell"><div class="page-heading"><div><div class="eyebrow">第五关｜邮箱小卫士</div><h1>安全使用邮箱</h1><p>读一读每个情境，选择“可以”还是“不可以”。</p></div><div class="safety-score"><strong>${done}</strong><span>/ 3</span><small>已判断</small></div></div>${renderTaskStrip('想一想，再选择', '邮箱里的信息要安全，也要养成发送前检查的习惯。', state.scaffoldLevel === 'full' ? ['读情境', '做判断', '看原因'] : [])}<div class="safety-list">${safetyScenarios.map((scenario, index) => { const answer = state.safetyAnswers[scenario.id]; const correct = answer === scenario.correct; return `<article class="safety-card ${correct ? 'correct' : answer ? 'wrong' : ''}"><div class="safety-index">${index + 1}</div><div class="safety-copy"><strong>${escapeHtml(scenario.title)}</strong>${answer ? `<span class="answer-note">${correct ? `✓ ${escapeHtml(scenario.explain)}` : '再想一想：这个做法安全吗？'}</span>` : ''}</div><div class="safety-actions"><button class="judge-button yes ${answer === 'yes' ? 'chosen' : ''}" data-action="choose-safety" data-id="${scenario.id}" data-choice="yes">可以</button><button class="judge-button no ${answer === 'no' ? 'chosen' : ''}" data-action="choose-safety" data-id="${scenario.id}" data-choice="no">不可以</button></div></article>`; }).join('')}</div>${feedbackHtml()}${done === 3 ? '<div class="safety-complete"><span>✓</span><div><strong>三个情境都判断对了</strong><small>你已经准备好安全地使用邮箱。</small></div><button class="primary-button" data-action="show-result">查看学习结果</button></div>' : ''}</section>`;
}

function renderResult() {
  const abilities = ['我会查收邮件', '我会回复邮件', '我会主动写信', '我知道什么时候回复、什么时候写信', '我会在发送前认真检查', '我知道保护邮箱密码'];
  return `<section class="content-card result-shell"><div class="result-hero"><div class="result-badge">✦</div><div class="eyebrow">学习完成</div><h1>邮箱小达人</h1><p>你完成了从查收到安全判断的完整练习。</p></div><div class="ability-grid">${abilities.map((ability) => `<div class="ability-item"><span>✓</span>${ability}</div>`).join('')}</div><div class="result-summary"><div><span class="summary-icon">📥</span><strong>查收邮件</strong><small>已完成</small></div><div><span class="summary-icon">↩</span><strong>回复邮件</strong><small>已完成</small></div><div><span class="summary-icon">✉</span><strong>写新邮件</strong><small>已完成</small></div><div><span class="summary-icon">🛡</span><strong>安全使用邮箱</strong><small>已完成</small></div></div><div class="result-actions"><button class="secondary-button" data-action="show-inbox">回到邮箱</button><button class="primary-button" data-action="restart">再练习一次</button></div></section>`;
}

function openCompose(reply) {
  state.compose.reply = reply; state.compose.forward = false; state.compose.subject = reply ? `回复：${state.selectedMessage?.subject || '生日派对邀请'}` : ''; state.compose.body = ''; state.compose.recipientEmail = reply ? getRecipientEmail() : ''; state.reviewOpen = false; state.view = 'compose'; setFeedback('', ''); trackEvent('open-compose', { reply }); render();
}

function forwardSelectedMessage() {
  const message = state.selectedMessage;
  if (!message) return;
  state.compose = {
    subject: `转发：${message.subject}`,
    body: `\n\n---------- 转发邮件 ----------\n发件人：${message.sender} <${message.senderEmail}>\n时间：${message.date}\n主题：${message.subject}\n\n${message.body}`,
    recipientEmail: '',
    reply: false,
    forward: true,
  };
  state.reviewOpen = false;
  state.view = 'compose';
  setFeedback('已带入原邮件内容，请选择收件人后发送。', 'info');
  trackEvent('forward-message', { messageId: message.id });
  render();
}

function deleteSelectedMessage() {
  const message = state.selectedMessage;
  if (!message) return;
  if (!window.confirm(`确定要删除邮件“${message.subject}”吗？`)) return;
  if (!state.deletedMessageIds.includes(message.id)) state.deletedMessageIds.push(message.id);
  trackEvent('delete-message', { messageId: message.id });
  state.selectedMessage = null;
  state.view = 'inbox';
  setFeedback('邮件已删除。', 'success');
  setStatus('邮件已删除');
  render();
}

function handleWrongTarget(message) {
  const attempt = countAttempt(`open-${message.id}`);
  const prompt = attempt >= 3 ? (state.stageIndex === 4 ? '请看带有贝贝名字的未读邮件。' : '请看收件箱里带蓝色圆点、发件人为贝贝的邮件。') : attempt === 2 ? (state.stageIndex === 3 ? '我们要找的是信息老师的来信。' : state.stageIndex === 4 ? '贝贝的回信在收件箱里。' : '先看发件人，再看主题。') : (state.stageIndex === 3 ? '这封邮件不是信息老师发来的。' : state.stageIndex === 4 ? '这封邮件不是贝贝的回信。' : '这封邮件不是贝贝的邀请。');
  setFeedback(prompt, attempt >= 3 ? 'info' : ''); setStatus(prompt); render();
}

function startWriteFlow() {
  if (state.stageIndex === 2) { state.thirdLevelWrongClicks = 0; state.thirdLevelNotice = false; openCompose(false); return; }
  openCompose(false);
}

function handleFirstLevelWrongAction() {
  state.firstLevelWrongClicks += 1;
  trackEvent('first-level-wrong-control', { count: state.firstLevelWrongClicks });
  if (state.firstLevelWrongClicks >= 3) {
    state.firstLevelWrongClicks = 0;
    state.firstLevelNotice = true;
    setFeedback('', '');
    setStatus('请点击“收件箱”');
    render();
  }
}

function handleThirdLevelWrongAction() {
  state.thirdLevelWrongClicks += 1;
  if (state.thirdLevelWrongClicks >= 3) {
    state.thirdLevelWrongClicks = 0;
    state.thirdLevelNotice = true;
    setFeedback('', '');
    setStatus('请点击“写信”完成本关任务');
  } else {
    setFeedback('这一关要主动给贝贝写信，请点击“写信”。', 'info');
    setStatus('这一关要主动给贝贝写信');
  }
  render();
}

function openClassroom() {
  state.mode = 'classroom';
  state.stageIndex = getNextStageIndex();
  state.transferStep = 0;
  state.returnAvailable = false;
  state.selectedMessage = null;
  state.feedback = null;
  state.compose = { subject: '', body: '', recipientEmail: '', reply: false };
  state.reviewOpen = false;
  state.safetyAnswers = {};
  state.sentMessages = [];
  state.sentCompletionStage = 0;
  state.attempts = {};
  state.firstLevelWrongClicks = 0;
  state.firstLevelNotice = false;
  state.thirdLevelWrongClicks = 0;
  state.thirdLevelNotice = false;
  state.deletedMessageIds = [];
  resetQuizState();
  resetMessageReadState();
  state.view = 'levels';
  trackEvent('start-classroom');
  setStatus('请选择课堂关卡');
  render();
}

function openAfterReview() {
  state.mode = 'after'; state.view = 'afterReview'; state.afterReviewStep = 0; state.afterReviewSelection = null; state.afterReviewResult = ''; state.afterReviewContinueOpen = false; state.feedback = null;
  trackEvent('select-learning-mode', { mode: 'after' });
  setStatus('先完成课后模拟复习'); render(); speakAfterReviewQuestion();
}

function goLauncher() {
  state.mode = null; state.view = 'launcher'; state.feedback = null;
  trackEvent('go-launcher'); setStatus('请选择学习内容'); render();
}

function showStudentHome() {
  state.view = 'studentHome'; state.feedback = null;
  setStatus('已回到个人邮箱首页'); render();
}

function prepareLevel(level) {
  const safeLevel = Math.max(0, Math.min(stageDefinitions.length - 1, Number(level) || 0));
  const studentDefaults = studentLevelDefaults[state.studentId];
  const defaultSupport = studentDefaults?.support?.[safeLevel];
  if (Number.isInteger(defaultSupport)) {
    state.supportLevel = defaultSupport;
    state.scaffoldLevel = supportLevels[defaultSupport].scaffoldLevel;
  }
  if (safeLevel === 3 && studentDefaults?.quizDifficulty) state.quizDifficulty = studentDefaults.quizDifficulty;
  state.mode = 'classroom'; state.stageIndex = safeLevel; state.selectedMessage = null; state.feedback = null;
  state.transferStep = safeLevel >= 4 ? 3 : 0; state.returnAvailable = safeLevel >= 4;
  state.compose = { subject: '', body: '', recipientEmail: '', reply: false }; state.reviewOpen = false;
  state.safetyAnswers = {}; state.sentMessages = []; state.sentCompletionStage = 0; state.firstLevelWrongClicks = 0; state.firstLevelNotice = false; state.thirdLevelWrongClicks = 0; state.thirdLevelNotice = false; state.deletedMessageIds = []; resetMessageReadState();
  resetQuizState();
  if (safeLevel >= 2) {
    const birthdayInvite = initialMessages.find((message) => message.id === 'birthday-invite');
    if (birthdayInvite) birthdayInvite.unread = false;
  }
  state.view = safeLevel === 3 ? 'quizIntro' : 'studentHome';
  trackEvent('select-level', { level: safeLevel + 1 });
  setStatus(safeLevel === 3 ? '请选择答题难度' : `已进入第${safeLevel + 1}关`); render();
}

function selectAfterReviewChoice(choice) {
  state.afterReviewSelection = choice;
  state.afterReviewResult = '';
  state.afterReviewContinueOpen = false;
  setFeedback('', '');
  render();
}

function submitAfterReview() {
  const scenario = afterReviewScenarios[state.afterReviewStep];
  const choice = state.afterReviewSelection;
  if (!scenario || !choice) return;
  const correct = choice === scenario.correct;
  state.afterReviewResult = correct ? 'correct' : 'wrong';
  state.afterReviewContinueOpen = correct;
  trackEvent('after-review-choice', { choice, correct, level: state.afterReviewStep + 1 });
  setFeedback(correct ? '回答正确。' : '这个选项不对，请重新选择。', correct ? 'success' : 'info');
  render();
}

function advanceAfterReview() {
  const scenario = afterReviewScenarios[state.afterReviewStep];
  const choice = state.afterReviewSelection;
  if (!scenario || !choice || state.afterReviewResult !== 'correct') return;
  state.afterReviewContinueOpen = false;
  if (state.afterReviewStep === afterReviewScenarios.length - 1) {
    state.view = 'externalMail'; state.feedback = null; trackEvent('complete-after-review'); setStatus('模拟复习完成，可以选择邮箱实操'); render(); return;
  }
  state.afterReviewStep += 1;
  state.afterReviewSelection = null;
  state.afterReviewResult = '';
  setFeedback('', '');
  render();
  speakAfterReviewQuestion();
}

function updateComposeLive() {
  const subjectDone = Boolean(state.compose.subject.trim()); const bodyDone = Boolean(state.compose.body.trim()); const recipientDone = Boolean(state.compose.recipientEmail.trim());
  const sendButton = document.querySelector('.send-button'); if (sendButton) sendButton.disabled = !subjectDone || !bodyDone || !recipientDone || state.sending;
  const count = document.querySelector('.char-count'); if (count) count.textContent = `${state.compose.body.length}/2000`;
  document.querySelectorAll('[data-step]').forEach((step) => { const index = Number(step.dataset.step); const done = state.compose.reply ? [true, bodyDone, false][index] : [recipientDone, subjectDone, bodyDone, false][index]; step.classList.toggle('done', Boolean(done)); const number = step.querySelector('.step-number'); if (number) number.textContent = done ? '✓' : String(index + 1); });
}

async function submitMail() {
  if (state.sending) return;
  const subject = state.compose.subject.trim(); const body = state.compose.body.trim(); const recipientEmail = state.compose.recipientEmail.trim();
  if (!recipientEmail || !subject || !body) { setFeedback('请先完成收件人、主题和正文。', 'info'); state.reviewOpen = false; render(); return; }
  state.sending = true; setFeedback('', ''); render();
  try {
    let result;
    if (STATIC_MODE) {
      result = { ok: true, mode: 'demo' };
    } else {
      const response = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientEmail, subject, body, studentId: state.studentId, sessionId: `lesson-${new Date().toISOString().slice(0, 10)}` }) });
      result = await response.json();
      if (!response.ok || !result.ok) { setFeedback(result.message || '邮件没有发送成功，请再检查一次。', 'error'); setStatus(result.message || '发送没有完成', 'error'); return; }
    }
    state.sentMessages.unshift({ subject, body, mode: result.mode }); trackEvent('send-success', { mode: result.mode, reply: state.compose.reply, subjectLength: subject.length, bodyLength: body.length });
    const wasReply = state.compose.reply; state.compose = { subject: '', body: '', recipientEmail: '', reply: false }; state.reviewOpen = false; setFeedback('', '');
    if (wasReply && state.stageIndex === 1) { state.stageIndex = 2; state.sentCompletionStage = 2; state.view = 'sent'; setStatus(result.mode === 'demo' ? '回复已记录，请确认本关完成' : '回复已发送给贝贝，请确认本关完成'); speakResult('你已经成功回复了贝贝'); }
    else if (!wasReply && state.stageIndex === 2) { state.sentCompletionStage = 3; state.view = 'sent'; setStatus(result.mode === 'demo' ? '新邮件已记录，请确认本关完成' : '新邮件已发送给贝贝，请确认本关完成'); speakResult('你成功给贝贝写了一封信'); }
    else { state.view = 'sent'; setStatus(result.mode === 'demo' ? '已记录演示发送结果' : '邮件已发送给贝贝'); }
  } catch { setFeedback('暂时无法连接发送服务，请检查页面地址。', 'error'); setStatus('发送服务暂时不可用', 'error'); }
  finally { state.sending = false; render(); }
}

function insertPhrase(text) { const current = state.compose.body.trim(); state.compose.body = current ? `${current}\n${text}` : text; render(); $('#bodyInput')?.focus(); trackEvent('insert-phrase'); }

function chooseSafety(id, choice) {
  const scenario = safetyScenarios.find((item) => item.id === id); if (!scenario) return;
  state.safetyAnswers[id] = choice; trackEvent('safety-choice', { id, choice, correct: choice === scenario.correct });
  setFeedback(choice === scenario.correct ? '判断正确。再看看其他情境。' : '这个做法需要再想一想。可以看一看题目里的“安全”提示。', choice === scenario.correct ? 'success' : 'info'); render();
}

function resetMessageReadState() {
  initialMessages.forEach((message) => { message.unread = message.id === 'birthday-invite'; });
  teacherMessage.unread = true;
  returnMessage.unread = true;
}

function restartLesson() {
  state.view = 'inbox'; state.selectedMessage = null; state.stageIndex = 0; state.transferStep = 0; state.returnAvailable = false; state.feedback = null; state.sentMessages = []; state.sentCompletionStage = 0; state.completedStages = []; state.safetyAnswers = {}; state.attempts = {}; state.firstLevelWrongClicks = 0; state.firstLevelNotice = false; state.thirdLevelWrongClicks = 0; state.thirdLevelNotice = false; state.deletedMessageIds = []; resetQuizState(); resetMessageReadState(); setStatus('准备开始'); trackEvent('restart-lesson'); render();
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]'); if (!target) return;
  const action = target.dataset.action;
  if (action === 'close-first-level-notice') { state.firstLevelNotice = false; render(); return; }
  if (action === 'close-third-level-notice') { state.thirdLevelNotice = false; render(); return; }
  const firstLevelLockedControl = target.classList.contains('receive') || ['start-write', 'show-drafts', 'show-sent', 'show-contacts'].includes(action);
  if (state.stageIndex === 0 && state.supportLevel >= 2 && firstLevelLockedControl) { handleFirstLevelWrongAction(); return; }
  if (state.stageIndex === 2 && state.supportLevel > 0 && ['show-inbox', 'show-drafts', 'show-sent', 'show-contacts'].includes(action)) { handleThirdLevelWrongAction(); return; }
  if (action === 'quiz-sort-item' || action === 'after-review-choice') speakResult(target.dataset.voiceLabel);
  else speakSidebarLabel(target.dataset.voiceLabel);
  if (action === 'open-classroom') openClassroom();
  else if (action === 'open-after-review') openAfterReview();
  else if (action === 'show-student-home') showStudentHome();
  else if (action === 'go-launcher') goLauncher();
  else if (action === 'go-levels') { state.mode = 'classroom'; state.view = 'levels'; state.feedback = null; trackEvent('go-levels'); setStatus('请选择课堂关卡'); render(); }
  else if (action === 'select-level') prepareLevel(target.dataset.level);
  else if (action === 'after-review-choice') selectAfterReviewChoice(target.dataset.choice);
  else if (action === 'after-review-submit') submitAfterReview();
  else if (action === 'after-review-next') advanceAfterReview();
  else if (action === 'open-external-mail') { trackEvent('open-external-mail', { provider: target.dataset.provider }); setStatus(`正在打开${target.dataset.provider}`); }
  else if (action === 'start-quiz') { state.quizDifficulty = Math.max(1, Math.min(3, Number($('#quizDifficulty')?.value) || 1)); resetQuizState(); state.view = 'quiz'; setFeedback('', ''); trackEvent('start-quiz', { difficulty: state.quizDifficulty }); setStatus('开始答题'); render(); speakQuizQuestion(); }
  else if (action === 'quiz-sort-item') { const index = Number(target.dataset.index); const position = state.quizSortOrder.indexOf(index); if (position >= 0) state.quizSortOrder.splice(position, 1); else state.quizSortOrder.push(index); render(); }
  else if (action === 'quiz-select-answer') { state.quizSelection = target.dataset.answer; setFeedback('', ''); render(); speakResult(target.dataset.voiceLabel); }
  else if (action === 'quiz-submit') submitQuizAnswer();
  else if (action === 'finish-quiz') { markStageCompleted(4); state.view = 'levels'; state.quizSubmitted = false; setFeedback('', ''); trackEvent('finish-quiz', { difficulty: state.quizDifficulty }); setStatus('第四关完成，请选择下一关'); render(); }
  else if (action === 'show-inbox' || action === 'refresh') { if (state.stageIndex === 0) state.firstLevelWrongClicks = 0; state.view = 'inbox'; state.selectedMessage = null; setFeedback('', ''); render(); }
  else if (action === 'show-contacts') { state.view = 'contacts'; setFeedback('', ''); render(); }
  else if (action === 'open-recipient-contacts') { state.view = 'contacts'; setFeedback('', ''); trackEvent('open-recipient-contacts', {}); render(); }
  else if (action === 'show-sent') { state.view = 'sent'; setFeedback('', ''); render(); }
  else if (action === 'show-drafts') { state.view = 'drafts'; setFeedback('', ''); render(); }
  else if (action === 'start-write') startWriteFlow();
  else if (action === 'open-message') { const message = getMessageById(target.dataset.id); if (!message) return; if (!isExpectedMessage(message) && (state.stageIndex === 0 || state.stageIndex === 3)) { handleWrongTarget(message); return; } const firstLevelComplete = state.stageIndex === 0 && message.id === 'birthday-invite'; state.selectedMessage = message; state.view = 'detail'; message.unread = false; setFeedback('', ''); trackEvent('open-message', { messageId: message.id, sender: message.sender }); render(); if (firstLevelComplete) speakResult('恭喜你找到了贝贝发来的邮件'); }
  else if (action === 'compose' || action === 'reply') openCompose(action === 'reply');
  else if (action === 'forward-message') forwardSelectedMessage();
  else if (action === 'delete-message') deleteSelectedMessage();
  else if (action === 'choose-mode') {
    const expected = state.stageIndex === 3 ? (state.transferStep === 1 ? 'reply' : 'write') : 'write';
    if (target.dataset.mode !== expected) { const attempt = countAttempt(`choose-${state.stageIndex}-${state.transferStep}`); setFeedback(attempt >= 2 ? `想一想：${expected === 'reply' ? '这是回应已有邮件，要选择“回复”。' : '这是主动发起新话题，要选择“写信”。'}` : '先读清楚情境，再选择功能。', attempt >= 2 ? 'info' : ''); render(); return; }
    trackEvent('choose-function', { choice: target.dataset.mode, transferStep: state.transferStep });
    if (state.stageIndex === 3) { if (state.transferStep === 1) { state.transferStep = 2; setFeedback('选对了。接下来，想主动问老师活动几点开始。', 'success'); render(); } else { state.stageIndex = 4; state.returnAvailable = true; state.transferStep = 3; state.view = 'inbox'; setFeedback('迁移练习完成。叮——贝贝的回信已经到达。', 'success'); setStatus('收到一封新邮件，请自己查收'); render(); } }
    else openCompose(false);
  }
  else if (action === 'select-recipient') { state.compose.recipientEmail = getRecipientEmail(); state.view = 'compose'; setFeedback('已选择贝贝。', 'success'); trackEvent('select-recipient', { recipient: getRecipientName() }); render(); }
  else if (action === 'clear-recipient') { state.compose.recipientEmail = ''; render(); }
  else if (action === 'complete-level') { const completedStage = state.sentCompletionStage || (state.stageIndex === 2 ? 2 : 1); markStageCompleted(completedStage); state.sentCompletionStage = 0; state.view = 'levels'; state.selectedMessage = null; setFeedback('', ''); trackEvent('complete-stage', { stage: completedStage }); setStatus(`第${completedStage}关完成，请选择下一关`); render(); }
  else if (action === 'confirm-read') { state.stageIndex = 1; setFeedback('看清楚了。现在想一想：要怎样回应贝贝？', 'success'); trackEvent('complete-stage', { stage: 1 }); render(); }
  else if (action === 'confirm-transfer-read') { state.transferStep = 1; state.view = 'choice'; setFeedback('', ''); render(); }
  else if (action === 'confirm-return') { state.view = 'safety'; setFeedback('', ''); trackEvent('open-safety'); render(); }
  else if (action === 'cancel-review') { state.reviewOpen = false; render(); }
  else if (action === 'confirm-send') submitMail();
  else if (action === 'insert-phrase') insertPhrase(target.dataset.text || '');
  else if (action === 'save-draft') { setStatus('草稿功能保留为下一步扩展'); trackEvent('save-draft'); }
  else if (action === 'choose-safety') chooseSafety(target.dataset.id, target.dataset.choice);
  else if (action === 'show-result') { markStageCompleted(5); state.view = 'result'; render(); }
  else if (action === 'restart') restartLesson();
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'subjectInput') state.compose.subject = event.target.value;
  if (event.target.id === 'bodyInput') state.compose.body = event.target.value;
  if (event.target.id === 'supportLevel') {
    state.supportLevel = Math.max(0, Math.min(3, Number(event.target.value) || 0));
    state.scaffoldLevel = currentSupportLevel().scaffoldLevel;
    updateSupportControl();
  }
  if (event.target.id === 'subjectInput' || event.target.id === 'bodyInput') updateComposeLive();
});

document.addEventListener('change', (event) => {
  if (event.target.id === 'quizDifficulty') { state.quizDifficulty = Math.max(1, Math.min(3, Number(event.target.value) || 1)); render(); }
  if (event.target.id === 'scaffoldLevel') { state.scaffoldLevel = event.target.value; trackEvent('scaffold-change', { level: state.scaffoldLevel }); render(); }
  if (event.target.id === 'supportLevel') { trackEvent('support-level-change', { level: state.supportLevel, label: currentSupportLevel().label }); render(); }
  if (event.target.id === 'teacherStageSelect') { state.teacherStage = Number(event.target.value) || 0; trackEvent('teacher-instruction', { level: state.teacherStage + 1 }); setFeedback(`老师指令已更新为第${state.teacherStage + 1}关。`, 'success'); render(); }
});

document.addEventListener('submit', (event) => { if (event.target.id !== 'composeForm') return; event.preventDefault(); const complete = state.compose.recipientEmail.trim() && state.compose.subject.trim() && state.compose.body.trim(); if (!complete) { setFeedback('请先完成收件人、主题和正文。', 'info'); render(); return; } state.reviewOpen = true; trackEvent('open-send-review'); render(); });

async function loadConfig() {
  try { if (STATIC_MODE) { state.config = { recipient: { name: '贝贝', email: 'beibei@example.com' }, demoMode: true }; setStatus('纯静态教学演示模式'); } else { const response = await fetch('/api/config'); state.config = await response.json(); initialMessages.forEach((message) => { if (message.sender === '贝贝') message.senderEmail = getRecipientEmail(); }); returnMessage.senderEmail = getRecipientEmail(); setStatus(state.config.demoMode ? '已连接，当前为教学演示模式' : '已连接，可以发送给贝贝'); } }
  catch { state.config = { recipient: { name: '贝贝', email: 'beibei@example.com' }, demoMode: true }; setStatus('服务连接失败，请检查页面地址', 'error'); }
  if (state.loggedIn) {
    $('#studentLabel').textContent = state.studentName;
    render();
  }
}

initLogin();
loadConfig();
