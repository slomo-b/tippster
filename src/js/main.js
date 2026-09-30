import '@fontsource/archivo-narrow/latin-400.css';
import '@fontsource/archivo-narrow/latin-600.css';
import '@fontsource/archivo-narrow/latin-700.css';
import '@fontsource/archivo/latin-400.css';
import '@fontsource/archivo/latin-500.css';
import '@fontsource/martian-mono/latin-400.css';
import '@fontsource/martian-mono/latin-700.css';

import { LESSONS, FINGER, ROWS, WORDS } from './lessons.js';
import { loadState, saveState, touchStreak, levelFor, unlockFor, resumeLesson } from './store.js';
import { weakKeys, genText, starsFor, clampWpm } from './stats.js';
import { recordKeystroke, lessonsToGoal, rollingAcc } from './adaptive.js';
import { sHit, sErr, sLvl, clack } from './audio.js';
import { flipCell, cascade, log, banner, markCounter } from './fx.js';
import { checkForUpdates } from './updater.js';
import { ACHIEVEMENTS, TOTAL_ACHIEVEMENTS, GROUP_ICON, evaluate as evaluateAchievements, buildContext } from './achievements.js';
import { dailyText, ghostProgress } from './daily.js';

const S = loadState();
let saveTimer = null;
const saveNow = () => { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; } saveState(S); };
const save = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; saveState(S); }, 400);
};

/* ── the board ─────────────────────────────────────────────── */
const COLS = 30;
let bCells = [], bText = '';
let cur = 0, pos = 0, startT = 0, errs = 0, hits = 0, combo = 0, maxCombo = 0, done = false;
window._errAt = new Set();

function buildBoard() {
  const board = document.getElementById('board');
  const rows = Math.max(1, Math.ceil(bText.length / COLS));
  board.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'board-rows';
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div');
    row.className = 'board-row';
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const has = i < bText.length;
      const cell = document.createElement('span');
      cell.className = 'flap' + (has ? '' : ' blank');
      cell.innerHTML = '<span class="half top"><span></span></span><span class="half bot"><span></span></span>';
      if (has) {
        const ch = bText[i];
        cell.querySelector('.top span').textContent = ch;
        cell.querySelector('.bot span').textContent = ch;
      }
      row.appendChild(cell);
      cells.push(cell);
    }
    wrap.appendChild(row);
  }
  board.appendChild(wrap);
  bCells = cells;
  paintBoard();
}
function paintBoard() {
  bCells.forEach((cell, i) => {
    if (i >= bText.length) return;
    cell.classList.remove('done', 'bad', 'live');
    if (i < pos) cell.classList.add(window._errAt.has(i) ? 'bad' : 'done');
    else if (i === pos) cell.classList.add('live');
  });
  highlightKey(bText[pos] || ' ');
  const board = document.getElementById('board');
  const rows = Math.max(1, Math.ceil(bText.length / COLS));
  const activeRow = Math.min(rows - 1, Math.floor(pos / COLS));
  const target = activeRow * (board.scrollHeight / rows);
  if (Math.abs(board.scrollTop - target) > 4) board.scrollTop = target;
}

/* ── the key field ─────────────────────────────────────────── */
const HAND = { lk: 'l', lr: 'l', lm: 'l', li: 'l', ri: 'r', rm: 'r', rr: 'r', rk: 'r', t: 'l' };
const KIND = { lk: 'pinky', lr: 'ring', lm: 'middle', li: 'index', ri: 'index', rm: 'middle', rr: 'ring', rk: 'pinky', t: 'middle' };
function buildKeys() {
  const kf = document.getElementById('keyfield');
  kf.innerHTML = '';
  ROWS.forEach(r => {
    const row = document.createElement('div');
    row.className = 'krow';
    r.forEach(c => {
      const f = FINGER[c] || 't';
      const k = document.createElement('span');
      k.className = `key hand-${HAND[f]} f-${KIND[f]}`;
      k.id = 'k-' + c;
      k.innerHTML = `<span class="fg"></span>${c.toUpperCase()}`;
      row.appendChild(k);
    });
    kf.appendChild(row);
  });
  const row = document.createElement('div');
  row.className = 'krow';
  row.innerHTML = '<span class="key space f-middle hand-l" id="k- "><span class="fg"></span>space</span>';
  kf.appendChild(row);
}
function highlightKey(ch) {
  document.querySelectorAll('.key').forEach(k => k.classList.remove('live'));
  const c = (ch || ' ').toLowerCase();
  const el = document.getElementById('k-' + c) || document.getElementById('k- ');
  if (el) el.classList.add('live');
}
function markKey(ch, ok) {
  const el = document.getElementById('k-' + (ch || ' ').toLowerCase());
  if (!el) return;
  el.classList.add(ok ? 'hit' : 'miss');
  setTimeout(() => el.classList.remove('hit', 'miss'), 190);
}
function paintWeakness() {
  const weak = new Set(weakKeys(S.keyStats));
  document.querySelectorAll('.key').forEach(k => {
    const c = k.id.slice(2);
    k.classList.toggle('weak', weak.has(c));
  });
}

/* ── counters & rail ───────────────────────────────────────── */
function setCounter(id, value) {
  const el = document.getElementById(id);
  if (!el || el.textContent === String(value)) return;
  el.textContent = value;
  markCounter(el);
}
function updateRail() {
  document.getElementById('fLvl').textContent = 'Level ' + levelFor(S.xp);
  document.getElementById('fXp').textContent = S.xp + ' XP';
  document.getElementById('fStreak').textContent = S.streak.count;
  document.getElementById('fStars').textContent = S.stars;
  document.getElementById('soundBtn').innerHTML =
    `<svg><use href="${S.sound ? '#i-sound' : '#i-mute'}"/></svg>Sound`;
}
function updateLive() {
  const mins = (Date.now() - startT) / 60000;
  setCounter('cWpm', mins > .01 ? clampWpm((hits / 5) / mins) : 0);
  setCounter('cAcc', Math.round(hits / Math.max(1, hits + errs) * 100) + '%');
  setCounter('cCombo', combo);
}

/* ── achievements ──────────────────────────────────────────── */
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const lessonsDone = () => Object.keys(S.lessonStars).length;
function bossStats() {
  const idx = LESSONS.map((l, i) => ({ l, i })).filter(x => x.l.boss).map(x => x.i);
  return { total: idx.length, done: idx.filter(i => S.lessonStars[i]).length };
}
function runAchievements({ wpm, acc, hits: h, isBoss = false, maxCombo: mc = 0 }) {
  const b = bossStats();
  const ctx = buildContext({
    wpm, acc, hits: h, maxCombo: mc, streak: S.streak.count, stars: S.stars, isBoss,
    lessonsDone: lessonsDone(), lessonTotal: LESSONS.length, bossesDone: b.done, bossTotal: b.total
  });
  const fresh = evaluateAchievements(ctx, S.badges);
  fresh.forEach(a => { S.badges.push(a.id); log(a.label, GROUP_ICON[a.group] || '#i-star'); });
  return fresh;
}
function celebrateIfLevelUp(before) {
  const after = levelFor(S.xp);
  if (after > before) { sLvl(S); banner(after); }
}

/* ── lesson run ────────────────────────────────────────────── */
function startLesson(i) {
  cur = i; pos = 0; errs = 0; hits = 0; combo = 0; maxCombo = 0; done = false;
  window._errAt = new Set();
  window._lastKeyT = null;
  startT = Date.now();
  bText = genText(i, LESSONS, S.keyStats);
  document.getElementById('lessonTitle').textContent = `${i + 1}. ${LESSONS[i].t}`;
  document.getElementById('lessonMeta').textContent = `${LESSONS[i].boss ? 'boss' : 'drill'} · ${LESSONS[i].keys === 'all' ? 'all keys' : LESSONS[i].keys.split('').join(' ')}`;
  document.getElementById('hint').innerHTML = LESSONS[i].d;
  document.getElementById('result').hidden = true;
  buildBoard(); paintKeysForLesson(); renderPath(); updateRail(); updateQuest();
}
function paintKeysForLesson() {
  const active = LESSONS[cur].keys === 'all' ? null : new Set(LESSONS[cur].keys.replace(/ /g, '').split(''));
  document.querySelectorAll('.key').forEach(k => {
    const c = k.id.slice(2);
    k.style.opacity = (!active || active.has(c) || c === ' ') ? '1' : '.34';
  });
}
function updateQuest() {
  const w = weakKeys(S.keyStats);
  const left = lessonsToGoal(S.keyStats, LESSONS[cur].keys);
  const goal = left === 0 ? 'key goal reached' : `${left} lines to the key goal`;
  document.getElementById('quest').textContent = w.length
    ? `weakest key “${w[0]}” · ${Math.round((1 - rollingAcc(S.keyStats[w[0]])) * 100)}% errors · ${goal}`
    : `one line at a time · ${goal}`;
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !document.getElementById('result').hidden) { nextLine(); return; }
  const vis = n => !document.getElementById('view-' + n).hidden;
  if (vis('daily')) return dailyKey(e);
  if (vis('free')) return freeKey(e);
  if (!vis('learn')) return;
  if (e.key.length !== 1 || done) return;
  e.preventDefault();
  const exp = bText[pos];
  if (exp === undefined) return;
  const now = Date.now();
  const latency = window._lastKeyT ? now - window._lastKeyT : null;
  window._lastKeyT = now;
  const ok = e.key === exp;
  const k = exp === ' ' ? ' ' : exp.toLowerCase();
  recordKeystroke(S.keyStats, k, ok, latency);
  const cell = bCells[pos];
  if (ok) {
    hits++; combo++; maxCombo = Math.max(maxCombo, combo);
    S.xp += 1 + Math.floor(combo / 25);
    sHit(S); markKey(e.key, true); flipCell(cell, exp);
    pos++;
  } else {
    errs++; combo = 0;
    window._errAt.add(pos);
    sErr(S); markKey(e.key, false); flipCell(cell, exp);
    pos++;
  }
  paintBoard();
  updateLive(); updateRail(); save();
  if (pos >= bText.length) finishLesson();
});

function finishLesson() {
  done = true;
  const mins = (Date.now() - startT) / 60000;
  const wpm = clampWpm((hits / 5) / Math.max(mins, .05));
  const acc = Math.round(hits / Math.max(1, hits + errs) * 100);
  const st = starsFor(acc, wpm);
  const lvlBefore = levelFor(S.xp);
  S.stars += st;
  S.xp += 20 * st + (LESSONS[cur].boss ? 50 : 0);
  S.lessonStars[cur] = Math.max(S.lessonStars[cur] || 0, st);
  S.unlocked = unlockFor(cur, S.unlocked, LESSONS.length);
  S.history.unshift(`${todayStr()} · ${LESSONS[cur].t} · ${wpm} wpm · ${acc}%`);
  S.history = S.history.slice(0, 12);
  touchStreak(S);
  runAchievements({ wpm, acc, hits, isBoss: !!LESSONS[cur].boss, maxCombo });
  saveNow(); updateRail(); renderPath(); renderBadges(); renderHeat(); paintWeakness();
  celebrateIfLevelUp(lvlBefore);

  cascade(bCells.slice(0, bText.length));
  const weak = weakKeys(S.keyStats);
  document.getElementById('resultTitle').textContent = LESSONS[cur].boss ? 'Boss cleared' : 'Line complete';
  document.getElementById('resultStars').innerHTML = starsRow(st);
  document.getElementById('resultWpm').textContent = wpm;
  document.getElementById('resultAcc').textContent = acc + '%';
  document.getElementById('resultCombo').textContent = maxCombo;
  document.getElementById('resultSay').textContent = weak.length
    ? `Your weakest key is “${weak[0]}” — it will turn up more often next time.`
    : 'A clean line. Nothing to correct.';
  document.getElementById('result').hidden = false;
}
const nextLine = () => {
  document.getElementById('result').hidden = true;
  if (cur + 1 < LESSONS.length) startLesson(cur + 1);
};
document.getElementById('resNext').onclick = nextLine;
document.getElementById('resAgain').onclick = () => {
  document.getElementById('result').hidden = true;
  startLesson(cur);
};

/* ── path, badges, heat, history ───────────────────────────── */
function starsRow(n, total = 3) {
  let s = '';
  for (let i = 0; i < total; i++) s += `<svg class="starsvg${i < n ? '' : ' off'}"><use href="#i-star"/></svg>`;
  return s;
}
function renderPath() {
  const el = document.getElementById('path');
  el.innerHTML = '';
  LESSONS.forEach((L, i) => {
    const b = document.createElement('button');
    b.disabled = i >= S.unlocked;
    b.setAttribute('aria-current', String(i === cur));
    b.innerHTML = `<span class="no">${String(i + 1).padStart(2, '0')}</span>`
      + `<span>${L.t}</span>`
      + `<span class="tag">${L.boss ? 'boss' : 'drill'}</span>`
      + `<span class="st">${S.lessonStars[i] ? starsRow(S.lessonStars[i]) : ''}</span>`;
    if (!b.disabled) b.onclick = () => startLesson(i);
    el.appendChild(b);
  });
  document.getElementById('pathMeta').textContent = `${lessonsDone()}/${LESSONS.length}`;
}
function badgeHTML() {
  const unlocked = new Set(S.badges);
  return ACHIEVEMENTS.map(a => {
    const on = unlocked.has(a.id);
    return `<span class="badge${on ? '' : ' locked'}"><svg><use href="${GROUP_ICON[a.group] || '#i-star'}"/></svg>${a.label}</span>`;
  }).join('');
}
function renderBadges() {
  const html = badgeHTML();
  const n = `${new Set(S.badges).size}/${TOTAL_ACHIEVEMENTS}`;
  ['badges', 'badges2', 'badgesDaily'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
  ['badgeMeta', 'badgeMeta2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = n;
  });
}
function renderHeat() {
  const el = document.getElementById('heat');
  el.innerHTML = '';
  'abcdefghijklmnopqrstuvwxyzäöüß,. -'.split('').forEach(k => {
    const v = S.keyStats[k];
    const r = v && v.tot > 2 ? v.err / v.tot : 0;
    const d = document.createElement('div');
    if (r > .25) d.classList.add('w3'); else if (r > .12) d.classList.add('w2'); else if (v) d.classList.add('w1');
    d.innerHTML = `<i>${k === ' ' ? 'spc' : k}</i>${v && v.tot > 2 ? Math.round((1 - r) * 100) + '%' : '—'}`;
    el.appendChild(d);
  });
}
function renderHistory() {
  const el = document.getElementById('history');
  el.innerHTML = S.history.length
    ? S.history.map(h => `<span class="src">${h}</span>`).join('')
    : '<span class="src">no lines yet</span>';
}

/* ── free typing ───────────────────────────────────────────── */
let fT = null, fPos = 0, fTarget = '', fStart = 0, fHits = 0, fErr = 0, fSecs = 60;
window._ferr = new Set();
const freeGen = () => { let s = ''; for (let i = 0; i < 70; i++) s += WORDS[Math.floor(Math.random() * WORDS.length)] + ' '; return s.trim(); };
function freeRender() {
  const el = document.getElementById('freeLine');
  el.innerHTML = '';
  [...fTarget].forEach((c, i) => {
    const sp = document.createElement('span');
    sp.textContent = c;
    sp.className = i < fPos ? (window._ferr.has(i) ? 'bad' : 'ok') : (i === fPos ? 'cur' : 'todo');
    el.appendChild(sp);
  });
}
function freeKey(e) {
  if (!fTarget || e.key.length !== 1) return;
  if (fPos >= fTarget.length) fTarget += ' ' + WORDS[Math.floor(Math.random() * WORDS.length)];
  if (e.key === fTarget[fPos]) { fHits++; clack(S, 1750, .035, 26); }
  else { fErr++; window._ferr.add(fPos); clack(S, 340, .05, 55); }
  fPos++;
  freeRender();
}
document.getElementById('freeStart').onclick = () => {
  fTarget = freeGen(); fPos = 0; fHits = 0; fErr = 0; window._ferr = new Set(); fStart = Date.now();
  setCounter('cWpm', 0); setCounter('cAcc', '100%'); setCounter('cCombo', 0);
  freeRender(); clearInterval(fT);
  fT = setInterval(() => {
    const el = Date.now() - fStart, left = Math.max(0, Math.ceil(fSecs - el / 1000)), mins = el / 60000;
    document.getElementById('fLeft').textContent = left;
    setCounter('cWpm', mins > .01 ? clampWpm((fHits / 5) / mins) : 0);
    setCounter('cAcc', Math.round(fHits / Math.max(1, fHits + fErr) * 100) + '%');
    if (left <= 0) {
      clearInterval(fT);
      const w = parseInt(document.getElementById('cWpm').textContent) || 0;
      const acc = fHits / Math.max(1, fHits + fErr);
      const earned = fHits >= 20 ? Math.round(Math.min(w, 120) * acc) : 0;
      const lvlBefore = levelFor(S.xp);
      S.xp += earned; touchStreak(S);
      runAchievements({ wpm: w, acc: Math.round(acc * 100), hits: fHits });
      saveNow(); updateRail(); renderBadges();
      celebrateIfLevelUp(lvlBefore);
      log(earned > 0 ? `${w} wpm at ${Math.round(acc * 100)}% · +${earned} xp` : 'too little typed for xp',
        earned > 0 ? '#i-lamp' : '#i-mute');
    }
  }, 250);
};
document.querySelectorAll('[data-time]').forEach(b => b.onclick = () => {
  fSecs = parseInt(b.dataset.time);
  document.getElementById('freeTime').textContent = fSecs + ' s';
  document.getElementById('fLeft').textContent = fSecs;
});

/* ── daily challenge + ghost ───────────────────────────────── */
let dT = null, dTarget = '', dPos = 0, dHits = 0, dErr = 0, dStart = 0, dRun = false;
window._derr = new Set();
if (!S.daily || S.daily.date !== todayStr()) S.daily = { date: todayStr(), best: 0, last: 0 };
function dailyRender() {
  const el = document.getElementById('dailyLine');
  if (!dTarget) { el.innerHTML = `<span class="todo">Press start — the text for ${todayStr()}</span>`; return; }
  el.innerHTML = '';
  [...dTarget].forEach((c, i) => {
    const sp = document.createElement('span');
    sp.textContent = c;
    sp.className = i < dPos ? (window._derr.has(i) ? 'bad' : 'ok') : (i === dPos ? 'cur' : 'todo');
    el.appendChild(sp);
  });
}
function dailyTrack() {
  const len = dTarget.length || 1;
  const best = S.daily.best || 0;
  const g = best ? ghostProgress(Date.now() - dStart, best, len) * 100 : 0;
  const mine = dStart ? (dPos / len) * 100 : 0;
  document.getElementById('ghostMark').style.left = g + '%';
  document.getElementById('mineMark').style.left = mine + '%';
  document.getElementById('trackFill').style.width = mine + '%';
  setCounter('cCombo', 0);
}
document.getElementById('dailyStart').onclick = () => {
  if (S.daily.date !== todayStr()) S.daily = { date: todayStr(), best: 0, last: 0 };
  dTarget = dailyText(todayStr(), WORDS, 45);
  dPos = 0; dHits = 0; dErr = 0; window._derr = new Set(); dStart = Date.now(); dRun = true;
  document.getElementById('dailyDate').textContent = todayStr();
  document.getElementById('dailyBest').textContent = S.daily.best ? `best ${S.daily.best} wpm` : 'no run today';
  dailyRender(); dailyTrack(); clearInterval(dT);
  dT = setInterval(() => {
    const mins = (Date.now() - dStart) / 60000;
    setCounter('cWpm', mins > .01 ? clampWpm((dHits / 5) / mins) : 0);
    setCounter('cAcc', Math.round(dHits / Math.max(1, dHits + dErr) * 100) + '%');
    dailyTrack();
  }, 180);
};
function dailyKey(e) {
  if (!dRun || e.key.length !== 1 || dPos >= dTarget.length) return;
  if (e.key === dTarget[dPos]) { dHits++; clack(S, 1750, .035, 26); }
  else { dErr++; window._derr.add(dPos); clack(S, 340, .05, 55); }
  dPos++;
  dailyRender();
  if (dPos >= dTarget.length) finishDaily();
}
function finishDaily() {
  dRun = false; clearInterval(dT);
  const mins = (Date.now() - dStart) / 60000;
  const wpm = clampWpm((dHits / 5) / Math.max(mins, .05));
  const acc = Math.round(dHits / Math.max(1, dHits + dErr) * 100);
  const prev = S.daily.best;
  const record = wpm > prev;
  if (record) S.daily.best = wpm;
  S.daily.last = wpm;
  const earned = Math.round(Math.min(wpm, 120) * (acc / 100));
  const lvlBefore = levelFor(S.xp);
  S.xp += earned; touchStreak(S);
  runAchievements({ wpm, acc, hits: dHits });
  saveNow(); updateRail(); renderBadges();
  document.getElementById('dailyBest').textContent = `best ${S.daily.best} wpm`;
  document.getElementById('dailyQuest').textContent = record
    ? `New best today: ${wpm} wpm at ${acc}% · +${earned} xp`
    : `${wpm} wpm at ${acc}% against a ghost of ${prev} · +${earned} xp`;
  celebrateIfLevelUp(lvlBefore);
  log(record ? `new daily best · ${wpm} wpm` : `daily run · ${wpm} wpm`, record ? '#i-trophy' : '#i-daily');
}

/* ── tabs: real tablist with roving focus ──────────────────── */
const tabList = [...document.querySelectorAll('.tab')];
function selectTab(t) {
  tabList.forEach(x => {
    const on = x === t;
    x.classList.toggle('on', on);
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1;
  });
  ['learn', 'free', 'daily', 'stats', 'quellen'].forEach(v => {
    document.getElementById('view-' + v).hidden = t.dataset.t !== v;
  });
  if (t.dataset.t === 'stats') { renderHeat(); renderBadges(); renderHistory(); }
  if (t.dataset.t === 'daily') { dailyRender(); renderBadges(); }
  if (t.dataset.t === 'learn') { paintWeakness(); updateQuest(); }
}
tabList.forEach((t, i) => {
  t.onclick = () => selectTab(t);
  t.onkeydown = ev => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' && ev.key !== 'Home' && ev.key !== 'End') return;
    ev.preventDefault();
    const n = ev.key === 'Home' ? 0
      : ev.key === 'End' ? tabList.length - 1
        : (i + (ev.key === 'ArrowRight' ? 1 : -1) + tabList.length) % tabList.length;
    selectTab(tabList[n]);
    tabList[n].focus();
  };
});

/* ── controls ──────────────────────────────────────────────── */
document.getElementById('newLine').onclick = () => startLesson(cur);
document.getElementById('skipLine').onclick = () => {
  S.unlocked = unlockFor(cur, S.unlocked, LESSONS.length);
  save(); document.getElementById('result').hidden = true;
  if (cur + 1 < LESSONS.length) startLesson(cur + 1);
};
document.getElementById('soundBtn').onclick = () => { S.sound = !S.sound; saveNow(); updateRail(); };
document.getElementById('resetBtn').onclick = () => {
  if (confirm('Wipe all progress?')) { localStorage.removeItem('tippster_v1'); location.reload(); }
};
document.getElementById('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tippster-progress-${todayStr()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
};
document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
document.getElementById('importFile').onchange = ev => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const data = JSON.parse(rd.result);
      if (typeof data !== 'object' || data === null || !('keyStats' in data)) throw new Error('not a Tippster backup');
      localStorage.setItem('tippster_v1', JSON.stringify(data));
      location.reload();
    } catch (err) { alert('Import failed: ' + err.message); }
  };
  rd.readAsText(file);
};
window.addEventListener('beforeunload', saveNow);

/* ── init ──────────────────────────────────────────────────── */
buildKeys();
renderPath(); renderBadges(); renderHeat(); renderHistory();
startLesson(resumeLesson(S.unlocked, LESSONS.length));
updateRail(); paintWeakness(); dailyRender();
document.getElementById('freeLine').innerHTML = '<span class="todo">Press start — 60 seconds of German practice words</span>';
save();
checkForUpdates();
