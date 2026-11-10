'use strict';
// ============================================================
//  โรงเรียนสัตว์น้อย – ตรรกะหลักของเว็บ
// ============================================================

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const AVATARS = ['🐰', '🐻', '🐼', '🦊', '🐥', '🐱', '🐶', '🦁'];
const SUBJECTS = {
  thai:    { name: 'ภาษาไทย',      emoji: '📚', color: 'c-pink' },
  math:    { name: 'คณิตศาสตร์',   emoji: '🔢', color: 'c-yellow' },
  science: { name: 'วิทยาศาสตร์',  emoji: '🔬', color: 'c-green' },
  english: { name: 'ภาษาอังกฤษ',   emoji: '🔤', color: 'c-blue' }
};
const GAMES = {
  match:    { name: 'เกมจับคู่',       emoji: '🧩', color: 'c-purple', desc: 'เปิดการ์ดหาคู่ที่เหมือนกัน' },
  vocab:    { name: 'เกมทายคำศัพท์',   emoji: '🔠', color: 'c-orange', desc: 'ดูรูปแล้วทายคำภาษาอังกฤษ' },
  addition: { name: 'เกมบวกเลข',       emoji: '➕', color: 'c-pink',   desc: 'บวกเลขให้ถูกทุกข้อ' }
};
const BOARD_KEYS = {
  match: 'เกมจับคู่', vocab: 'เกมทายคำศัพท์', addition: 'เกมบวกเลข',
  'quiz-thai': 'แบบทดสอบ ภาษาไทย', 'quiz-math': 'แบบทดสอบ คณิตศาสตร์',
  'quiz-science': 'แบบทดสอบ วิทยาศาสตร์', 'quiz-english': 'แบบทดสอบ ภาษาอังกฤษ'
};

// ---------------- สถานะผู้เรียน (เก็บในเครื่อง ไม่ใช้ฐานข้อมูล) ----------------
const state = { name: '', grade: 1, avatar: '🐰', stars: 0, done: {}, loggedIn: false };
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('kidschool_v1'));
    if (s) Object.assign(state, s);
  } catch (e) { /* ไม่เป็นไร */ }
}
function saveState() {
  try { localStorage.setItem('kidschool_v1', JSON.stringify(state)); } catch (e) { /* ไม่เป็นไร */ }
}

// ---------------- ตัวช่วย ----------------
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

let ac;
function beep(ok) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = ok ? 'triangle' : 'sawtooth';
    o.frequency.value = ok ? 880 : 220;
    g.gain.value = 0.07;
    o.start(); o.stop(ac.currentTime + (ok ? 0.15 : 0.25));
  } catch (e) { /* ไม่เป็นไร */ }
}

// ---------------- ส่ง/รับข้อมูลกับ Google Apps Script ----------------
function postToSheet(data) {
  if (!CONFIG.SCRIPT_URL) return;
  try {
    fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // ใช้ text/plain เพื่อเลี่ยงปัญหา CORS preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    }).catch(() => {});
  } catch (e) { /* ไม่เป็นไร */ }
}

// ---------------- สลับหน้าจอ ----------------
function show(id) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  window.scrollTo(0, 0);
  const bar = $('#topbar');
  if (state.loggedIn && id !== 'home') {
    bar.classList.remove('hidden');
    $('#tbAvatar').textContent = state.avatar;
    $('#tbName').textContent = state.name;
    $('#tbGrade').textContent = 'ป.' + state.grade;
    $('#tbStars').textContent = state.stars;
  } else {
    bar.classList.add('hidden');
  }
}

// ---------------- เข้าสู่ระบบ ----------------
let pickGrade = 1, pickAvatar = '🐰';
function openLogin() {
  $('#inName').value = state.name || '';
  pickGrade = state.grade || 1;
  pickAvatar = state.avatar || '🐰';
  $('#loginErr').textContent = '';
  refreshPicks();
  $('#modal').classList.remove('hidden');
  setTimeout(() => $('#inName').focus(), 50);
}
function refreshPicks() {
  $$('#gradePick button').forEach((b) => b.classList.toggle('sel', Number(b.dataset.grade) === pickGrade));
  $$('#avatarPick button').forEach((b) => b.classList.toggle('sel', b.dataset.av === pickAvatar));
}
function doLogin() {
  const name = $('#inName').value.trim();
  if (!name) { $('#loginErr').textContent = 'อย่าลืมพิมพ์ชื่อเล่นนะ 😊'; return; }
  if (name !== state.name) { state.stars = 0; state.done = {}; } // คนใหม่ เริ่มนับดาวใหม่
  state.name = name; state.grade = pickGrade; state.avatar = pickAvatar; state.loggedIn = true;
  saveState();
  postToSheet({ action: 'login', name: state.name, grade: state.grade, avatar: state.avatar });
  $('#modal').classList.add('hidden');
  renderMenu();
  show('menu');
}
function logout() {
  state.loggedIn = false; saveState(); show('home');
}

// ---------------- เมนูหลัก ----------------
function renderMenu() {
  $('#menuHello').textContent = 'สวัสดี ' + state.avatar + ' ' + state.name + '!';
  $('#menuSub').textContent = 'ชั้นประถมศึกษาปีที่ ' + state.grade + ' — วันนี้อยากเรียนหรือเล่นอะไรดี?';
  $('#subjectGrid').innerHTML = Object.keys(SUBJECTS).map((k) => {
    const s = SUBJECTS[k];
    return '<button class="tile ' + s.color + '" data-act="subject" data-key="' + k + '"><span class="em">' + s.emoji + '</span>' + s.name + '</button>';
  }).join('');
  $('#gameGrid').innerHTML = Object.keys(GAMES).map((k) => {
    const g = GAMES[k];
    return '<button class="tile ' + g.color + '" data-act="game" data-key="' + k + '"><span class="em">' + g.emoji + '</span>' + g.name + '<small>' + g.desc + '</small></button>';
  }).join('');
}

// ---------------- บทเรียน ----------------
let curSubject = 'thai', curLesson = 0;
function openSubject(key) {
  curSubject = key;
  const s = SUBJECTS[key];
  $('#subjectTitle').textContent = s.emoji + ' ' + s.name + ' ป.' + state.grade;
  const lessons = LESSONS[key][state.grade];
  $('#lessonList').innerHTML = lessons.map((l, i) => {
    const done = state.done[key + '-' + state.grade + '-' + i];
    return '<button class="tile ' + s.color + '" data-act="lesson" data-i="' + i + '"><span class="em">' + l.e + '</span>บทที่ ' + (i + 1) + ' ' + esc(l.t) + (done ? '<span class="ok">✅</span>' : '') + '</button>';
  }).join('');
  show('subject');
}
function openLesson(i) {
  curLesson = i;
  const l = LESSONS[curSubject][state.grade][i];
  $('#lessonTitle').textContent = l.e + ' ' + l.t;
  $('#lessonBody').innerHTML = l.h;
  const done = state.done[curSubject + '-' + state.grade + '-' + i];
  $('#lessonDone').textContent = done ? '✅ อ่านจบแล้ว' : '✅ อ่านจบแล้ว (รับ ⭐ 1 ดวง)';
  show('lesson');
}
function lessonDone() {
  const k = curSubject + '-' + state.grade + '-' + curLesson;
  if (!state.done[k]) { state.done[k] = true; state.stars += 1; saveState(); beep(true); }
  openSubject(curSubject);
}

// ---------------- ตัวเล่นแบบทดสอบ (ใช้ร่วมกันทุกเกมตอบคำถาม) ----------------
let quiz = null;
function startQuiz(opts) {
  quiz = Object.assign({ i: 0, score: 0, locked: false, t0: Date.now() }, opts);
  show('quiz');
  renderQuestion();
}
function renderQuestion() {
  const it = quiz.items[quiz.i];
  $('#quizTitle').textContent = quiz.title;
  $('#quizProgress').textContent = 'ข้อ ' + (quiz.i + 1) + '/' + quiz.items.length;
  $('#quizBar').style.width = (quiz.i / quiz.items.length * 100) + '%';
  $('#quizEmoji').textContent = it.e || '';
  $('#quizQ').textContent = it.q;
  $('#quizFeedback').textContent = '';
  quiz.locked = false;
  const box = $('#quizChoices');
  box.innerHTML = '';
  shuffle(it.c.map((t, idx) => ({ t: t, ok: idx === it.a }))).forEach((ch) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.textContent = ch.t;
    b.addEventListener('click', () => answer(b, ch.ok));
    box.appendChild(b);
  });
}
function answer(btn, ok) {
  if (quiz.locked) return;
  quiz.locked = true;
  if (ok) {
    quiz.score++;
    btn.classList.add('right');
    $('#quizFeedback').textContent = '🎉 เก่งมาก ถูกต้อง!';
  } else {
    btn.classList.add('wrong');
    $('#quizFeedback').textContent = '😅 ไม่เป็นไร ลองข้อต่อไปนะ';
  }
  beep(ok);
  setTimeout(() => {
    quiz.i++;
    if (quiz.i >= quiz.items.length) {
      const total = quiz.items.length, pct = quiz.score / total;
      finish({
        title: quiz.title, game: quiz.game, score: quiz.score, total: total,
        stars: pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1,
        secs: Math.round((Date.now() - quiz.t0) / 1000), again: quiz.again
      });
    } else {
      renderQuestion();
    }
  }, 1100);
}

// ---------------- สรุปผล ----------------
let lastAgain = null;
function finish(r) {
  state.stars += r.stars;
  saveState();
  postToSheet({ action: 'score', name: state.name, grade: state.grade, avatar: state.avatar, game: r.game, score: r.score, total: r.total, secs: r.secs });
  lastAgain = r.again;
  $('#resTitle').textContent = '🏁 ' + r.title;
  $('#resStars').textContent = '⭐'.repeat(r.stars) + '☆'.repeat(3 - r.stars);
  $('#resScore').textContent = 'ได้ ' + r.score + ' / ' + r.total + ' คะแนน';
  $('#resMsg').textContent = r.stars === 3 ? 'สุดยอดไปเลย! 🏆' : r.stars === 2 ? 'เก่งมาก! ลองอีกครั้งเพื่อได้ครบ 3 ดาวนะ 💪' : 'สู้ ๆ นะ ฝึกอีกนิดจะเก่งขึ้นแน่นอน 🌈';
  beep(true);
  show('result');
}

// ---------------- แบบทดสอบท้ายวิชา ----------------
function startSubjectQuiz() {
  const key = curSubject;
  const items = QUIZ[key][state.grade];
  const run = () => startQuiz({
    title: '📝 ' + SUBJECTS[key].name + ' ป.' + state.grade,
    items: shuffle(items), game: 'quiz-' + key, again: run
  });
  run();
}

// ---------------- เกมทายคำศัพท์ ----------------
function startVocab() {
  const g = state.grade, pool = VOCAB[g];
  const items = shuffle(pool).slice(0, 10).map((w) => {
    const wrong = shuffle(pool.filter((x) => x !== w)).slice(0, 3).map((x) => x.en);
    return {
      e: w.e,
      q: g === 1 ? 'ภาพนี้คือ "' + w.th + '" ภาษาอังกฤษคืออะไร?' : 'ภาพนี้ภาษาอังกฤษคืออะไร?',
      c: [w.en].concat(wrong), a: 0
    };
  });
  startQuiz({ title: '🔠 เกมทายคำศัพท์', items: items, game: 'vocab', again: startVocab });
}

// ---------------- เกมบวกเลข ----------------
function startAddition() {
  const g = state.grade, items = [];
  for (let i = 0; i < 10; i++) {
    let a, b;
    if (g === 1) { a = rnd(1, 9); b = rnd(1, 10 - a); }
    else if (g === 2) { a = rnd(10, 40); b = rnd(5, 50 - a); }
    else { a = rnd(10, 70); b = rnd(10, 100 - a); }
    const ans = a + b, set = [ans];
    while (set.length < 4) {
      const d = ans + rnd(-6, 6);
      if (d >= 0 && set.indexOf(d) === -1) set.push(d);
    }
    items.push({
      e: g === 1 ? '🍎'.repeat(a) + ' ➕ ' + '🍏'.repeat(b) : '',
      q: a + ' + ' + b + ' = ?', c: set.map(String), a: 0
    });
  }
  startQuiz({ title: '➕ เกมบวกเลข', items: items, game: 'addition', again: startAddition });
}

// ---------------- เกมจับคู่ ----------------
let mt = null;
function startMatch() {
  const g = state.grade;
  const n = { 1: 4, 2: 6, 3: 8 }[g];
  const words = shuffle(VOCAB[g]).slice(0, n);
  const cards = [];
  words.forEach((w, i) => {
    if (g === 1) { cards.push({ p: i, t: w.e, emo: true }, { p: i, t: w.th, emo: false }); }
    else if (g === 2) { cards.push({ p: i, t: w.e, emo: true }, { p: i, t: w.en, emo: false }); }
    else { cards.push({ p: i, t: w.en, emo: false }, { p: i, t: w.th, emo: false }); }
  });
  mt = { first: null, lock: false, moves: 0, found: 0, total: n, t0: Date.now() };
  $('#matchMoves').textContent = '0';
  $('#matchHint').textContent = g === 1 ? 'จับคู่ รูปภาพ กับ คำภาษาไทย' : g === 2 ? 'จับคู่ รูปภาพ กับ คำภาษาอังกฤษ' : 'จับคู่ คำภาษาอังกฤษ กับ คำภาษาไทย';
  const grid = $('#matchGrid');
  grid.innerHTML = '';
  shuffle(cards).forEach((c) => {
    const b = document.createElement('button');
    b.className = 'mcard';
    b.dataset.pair = c.p;
    b.innerHTML = '<span class="front">❓</span><span class="back' + (c.emo ? ' emo' : '') + '">' + esc(c.t) + '</span>';
    b.addEventListener('click', () => flip(b));
    grid.appendChild(b);
  });
  show('match');
}
function flip(el) {
  if (mt.lock || el.classList.contains('open') || el.classList.contains('done')) return;
  el.classList.add('open');
  if (!mt.first) { mt.first = el; return; }
  const a = mt.first, b = el;
  mt.first = null;
  mt.moves++;
  $('#matchMoves').textContent = mt.moves;
  if (a.dataset.pair === b.dataset.pair) {
    a.classList.replace('open', 'done'); b.classList.replace('open', 'done');
    mt.found++; beep(true);
    if (mt.found === mt.total) {
      const stars = mt.moves <= mt.total + 2 ? 3 : mt.moves <= mt.total * 2 ? 2 : 1;
      setTimeout(() => finish({
        title: 'เกมจับคู่', game: 'match', score: mt.total, total: mt.total, stars: stars,
        secs: Math.round((Date.now() - mt.t0) / 1000), again: startMatch
      }), 600);
    }
  } else {
    mt.lock = true; beep(false);
    setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); mt.lock = false; }, 800);
  }
}

// ---------------- ตารางคะแนน ----------------
function openBoard() {
  const sel = $('#boardGame');
  if (!sel.options.length) {
    sel.innerHTML = Object.keys(BOARD_KEYS).map((k) => '<option value="' + k + '">' + BOARD_KEYS[k] + '</option>').join('');
    sel.addEventListener('change', loadBoard);
  }
  show('board');
  loadBoard();
}
function loadBoard() {
  const box = $('#boardBody');
  if (!CONFIG.SCRIPT_URL) {
    box.textContent = 'ยังไม่ได้เชื่อมต่อ Google Sheets (ดูวิธีตั้งค่าในไฟล์ config.js)';
    return;
  }
  box.textContent = 'กำลังโหลด...';
  fetch(CONFIG.SCRIPT_URL + '?action=top&game=' + encodeURIComponent($('#boardGame').value))
    .then((r) => r.json())
    .then((d) => {
      if (!d.ok || !d.rows.length) { box.textContent = 'ยังไม่มีคะแนน มาเป็นคนแรกกันเถอะ! 🌟'; return; }
      box.innerHTML = '<table><tr><th>#</th><th>ชื่อ</th><th>ชั้น</th><th>คะแนน</th><th>เวลา</th></tr>' +
        d.rows.map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(r.avatar || '') + ' ' + esc(r.name) + '</td><td>ป.' + esc(r.grade) + '</td><td>' + esc(r.score) + '/' + esc(r.total) + '</td><td>' + esc(r.secs) + ' วิ</td></tr>').join('') +
        '</table>';
    })
    .catch(() => { box.textContent = 'โหลดตารางคะแนนไม่สำเร็จ ลองใหม่อีกครั้งนะ'; });
}

// ---------------- ผูกปุ่มทั้งหมด ----------------
document.addEventListener('click', (e) => {
  const gp = e.target.closest('#gradePick button');
  if (gp) { pickGrade = Number(gp.dataset.grade); refreshPicks(); return; }
  const av = e.target.closest('#avatarPick button');
  if (av) { pickAvatar = av.dataset.av; refreshPicks(); return; }

  const t = e.target.closest('[data-act]');
  if (!t) return;
  switch (t.dataset.act) {
    case 'login-open':  openLogin(); break;
    case 'login-close': $('#modal').classList.add('hidden'); break;
    case 'login-go':    doLogin(); break;
    case 'logout':      logout(); break;
    case 'menu':        renderMenu(); show('menu'); break;
    case 'subject':     openSubject(t.dataset.key); break;
    case 'lesson':      openLesson(Number(t.dataset.i)); break;
    case 'lesson-done': lessonDone(); break;
    case 'lesson-back': openSubject(curSubject); break;
    case 'subject-quiz': startSubjectQuiz(); break;
    case 'game':
      if (t.dataset.key === 'match') startMatch();
      else if (t.dataset.key === 'vocab') startVocab();
      else startAddition();
      break;
    case 'quiz-exit':   renderMenu(); show('menu'); break;
    case 'again':       if (lastAgain) lastAgain(); break;
    case 'board':       openBoard(); break;
  }
});
$('#inName').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

// ---------------- เริ่มต้น ----------------
(function init() {
  loadState();
  $('#avatarPick').innerHTML = AVATARS.map((a) => '<button type="button" data-av="' + a + '">' + a + '</button>').join('');
  state.loggedIn = false; // เปิดเว็บใหม่ทุกครั้งให้เริ่มที่หน้าแรกพร้อมปุ่มเข้าสู่ระบบ
  show('home');
})();
