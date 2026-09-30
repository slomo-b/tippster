import '@fontsource/sometype-mono/latin-400.css';
import '@fontsource/sometype-mono/latin-700.css';
import '@fontsource/vt323/latin-400.css';

import { LESSONS, ROWS, WORDS } from './lessons.js';
import { loadState, saveState, touchStreak, levelFor, unlockFor, resumeLesson } from './store.js';
import { weakKeys, genText, starsFor, clampWpm } from './stats.js';
import { recordKeystroke, lessonsToGoal, rollingAcc } from './adaptive.js';
import { sHit, sErr, sLvl, clack } from './audio.js';
import { createField } from './field.js';
import { bar, scramble, log, flash, RAMP } from './fx.js';
import { checkForUpdates, startUpdateWatch } from './updater.js';
import { ACHIEVEMENTS, TOTAL_ACHIEVEMENTS, evaluate as evaluateAchievements, buildContext } from './achievements.js';
import { dailyText, ghostProgress } from './daily.js';

const S = loadState();
let saveTimer = null;
const saveNow = () => { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveState(S); } };
const save = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; saveState(S); }, 400);
};
const field = createField(document.getElementById('field'));
const $ = id => document.getElementById(id);

/* ── run state ─────────────────────────────────────────────── */
let cur = 0, pos = 0, target = '', startT = 0, errs = 0, hits = 0, combo = 0, maxCombo = 0, done = false;
window._errAt = new Set();

function renderLine() {
  const el = $('line');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < target.length; i++) {
    const sp = document.createElement('span');
    sp.textContent = target[i];
    sp.className = i < pos ? (window._errAt.has(i) ? 'bad' : 'done') : (i === pos ? 'cur' : 'todo');
    frag.appendChild(sp);
  }
  el.textContent = '';
  el.appendChild(frag);
  $('pointer').textContent = ' '.repeat(pos) + '^';
  const pct = target.length ? pos / target.length * 100 : 0;
  $('lineBar').textContent = bar(pct, 30);
  $('linePct').textContent = Math.round(pct) + '%';
}

/* ── keys ──────────────────────────────────────────────────── */
function buildKeys() {
  const kf = $('keys');
  kf.textContent = '';
  ROWS.forEach(r => {
    const row = document.createElement('div');
    row.className = 'krow';
    r.forEach(c => {
      const k = document.createElement('span');
      k.className = 'key';
      k.id = 'k-' + c;
      k.innerHTML = `${c.toUpperCase()}<span class="gl">.</span>`;
      row.appendChild(k);
    });
    kf.appendChild(row);
  });
  const row = document.createElement('div');
  row.className = 'krow';
  row.innerHTML = '<span class="key space" id="k- ">space<span class="gl">.</span></span>';
  kf.appendChild(row);
}

/** The key field is the same character grid, and its marks are your error rates. */
function paintKeys() {
  document.querySelectorAll('.key').forEach(k => {
    const c = k.id.slice(2);
    const v = S.keyStats[c];
    const r = v && v.tot > 2 ? v.err / v.tot : 0;
    const gl = k.querySelector('.gl');
    if (gl) gl.textContent = r > 0.005 ? RAMP[Math.min(RAMP.length - 1, 1 + Math.round(r * 8))] : '.';
    k.classList.toggle('weak', r > 0.12);
  });
}
function activeKeys() {
  const set = LESSONS[cur].keys === 'all' ? null : new Set(LESSONS[cur].keys.replace(/ /g, '').split(''));
  document.querySelectorAll('.key').forEach(k => {
    const c = k.id.slice(2);
    k.classList.toggle('dim', !!(set && c !== ' ' && !set.has(c)));
  });
}
function markKey(c, ok) {
  const el = $('k-' + (c || ' ').toLowerCase());
  if (!el) return;
  el.classList.remove('live');
  el.classList.add(ok ? 'hit' : 'miss');
  setTimeout(() => el.classList.remove('hit', 'miss'), 170);
}

/* ── rail / readouts ───────────────────────────────────────── */
const pad = n => String(n).padStart(2, '0');
function updateRail() {
  const lv = levelFor(S.xp);
  $('sLvl').textContent = pad(lv);
  $('sStreak').textContent = S.streak.count;
  $('sStars').textContent = S.stars;
  $('sXp').textContent = S.xp;
  $('fLvl').textContent = lv;
  $('fStreak').textContent = S.streak.count;
  $('fStars').textContent = S.stars;
  $('soundBtn').textContent = S.sound ? 'sound on' : 'sound off';
}
function updateLive() {
  const mins = (Date.now() - startT) / 60000;
  $('cWpm').textContent = mins > .01 ? clampWpm((hits / 5) / mins) : 0;
  $('cAcc').textContent = Math.round(hits / Math.max(1, hits + errs) * 100) + '%';
  const c = $('cCombo');
  const before = c.textContent;
  c.textContent = combo;
  if (String(combo) !== before && combo > 0 && combo % 10 === 0) flash(c);
  field.setEnergy(Math.min(1, combo / 55));
}
function updateQuest() {
  const w = weakKeys(S.keyStats);
  const left = lessonsToGoal(S.keyStats, LESSONS[cur].keys);
  $('cGoal').textContent = left === 0 ? 'done' : left + ' lines';
  $('quest').textContent = w.length
    ? `weakest key “${w[0]}” at ${Math.round((1 - rollingAcc(S.keyStats[w[0]])) * 100)}% errors`
    : 'a clean slate — start typing';
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
  fresh.forEach(a => { S.badges.push(a.id); log('badge ' + a.label); });
  return fresh;
}
function celebrateIfLevelUp(before) {
  const after = levelFor(S.xp);
  if (after > before) {
    sLvl(S);
    field.bloom();
    const el = $('bannerText');
    scramble(el, 'level ' + after, 700);
    $('banner').hidden = false;
    setTimeout(() => { $('banner').hidden = true; }, 2000);
  }
}

/* ── lesson run ────────────────────────────────────────────── */
function startLesson(i) {
  cur = i; pos = 0; errs = 0; hits = 0; combo = 0; maxCombo = 0; done = false;
  window._errAt = new Set();
  window._lastKeyT = null;
  startT = Date.now();
  target = genText(i, LESSONS, S.keyStats);
  scramble($('lessonTitle'), `${i + 1}. ${LESSONS[i].t}`, 420);
  $('lessonMeta').textContent = `${LESSONS[i].boss ? 'boss' : 'drill'} · ${LESSONS[i].keys === 'all' ? 'all keys' : LESSONS[i].keys.split('').join(' ')}`;
  $('hint').textContent = LESSONS[i].d;
  field.setEnergy(0);
  renderLine(); buildKeys(); paintKeys(); activeKeys();
  renderPath(); updateRail(); updateQuest(); updateLive();
  $('fMsg').textContent = 'ready — start typing';
}

document.addEventListener('keydown', e => {
  const vis = n => !$('view-' + n).hidden;
  if (vis('daily')) return dailyKey(e);
  if (vis('free')) return freeKey(e);
  if (!vis('learn')) return;
  if (e.key.length !== 1 || done) return;
  e.preventDefault();
  const exp = target[pos];
  if (exp === undefined) return;
  const now = Date.now();
  const latency = window._lastKeyT ? now - window._lastKeyT : null;
  window._lastKeyT = now;
  const ok = e.key === exp;
  const k = exp === ' ' ? ' ' : exp.toLowerCase();
  recordKeystroke(S.keyStats, k, ok, latency);
  if (ok) {
    hits++; combo++; maxCombo = Math.max(maxCombo, combo);
    S.xp += 1 + Math.floor(combo / 25);
    clack(S, 1750, .04, 26); markKey(e.key, true); field.pulse(.7);
  } else {
    errs++; combo = 0;
    window._errAt.add(pos);
    clack(S, 300, .06, 55); markKey(e.key, false); field.tear();
  }
  pos++;
  renderLine(); updateLive(); updateRail(); save();
  if (pos >= target.length) finishLesson();
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
  S.history.unshift(`${todayStr()}  ${LESSONS[cur].t}  ${wpm} wpm  ${acc}%`);
  S.history = S.history.slice(0, 12);
  touchStreak(S);
  runAchievements({ wpm, acc, hits, isBoss: !!LESSONS[cur].boss, maxCombo });
  saveNow(); updateRail(); renderPath(); renderBadges(); renderHeat(); paintKeys();

  field.bloom();
  const answer = st === 3 ? 'perfect' : st === 2 ? 'clean' : 'cleared';
  const el = $('bannerText');
  scramble(el, answer, 620);
  $('banner').hidden = false;
  setTimeout(() => { $('banner').hidden = true; }, 1700);
  $('fMsg').textContent = `${wpm} wpm · ${acc}% · combo ${maxCombo} · ${'*'.repeat(st)}`;
  log(`${answer} — ${wpm} wpm at ${acc}%, best combo ${maxCombo}`);

  celebrateIfLevelUp(lvlBefore);
  if (cur + 1 < LESSONS.length) setTimeout(() => startLesson(cur + 1), 1900);
  else setTimeout(() => startLesson(cur), 1900);
}

/* ── path / badges / heat ──────────────────────────────────── */
function renderPath() {
  const el = $('path');
  el.textContent = '';
  LESSONS.forEach((L, i) => {
    const b = document.createElement('button');
    b.disabled = i >= S.unlocked;
    b.setAttribute('aria-current', String(i === cur));
    const st = S.lessonStars[i] || 0;
    b.innerHTML = `<span class="no">${pad(i + 1)}</span><span>${L.t}</span><span>${st ? '*'.repeat(st) : ''}</span>`;
    if (!b.disabled) b.onclick = () => startLesson(i);
    el.appendChild(b);
  });
  $('pathMeta').textContent = `${lessonsDone()}/${LESSONS.length}`;
}
function badgeHTML() {
  const on = new Set(S.badges);
  return ACHIEVEMENTS.map(a => `<span class="badge${on.has(a.id) ? ' on' : ''}">${a.label}</span>`).join('');
}
function renderBadges() {
  const html = badgeHTML();
  const n = new Set(S.badges).size + '/' + TOTAL_ACHIEVEMENTS;
  ['badges', 'badges2', 'badgesDaily'].forEach(id => { const el = $(id); if (el) el.innerHTML = html; });
  ['badgeMeta', 'badgeMeta2'].forEach(id => { const el = $(id); if (el) el.textContent = n; });
}
function renderHeat() {
  const el = $('heat');
  el.textContent = '';
  'abcdefghijklmnopqrstuvwxyzäöüß,. -'.split('').forEach(k => {
    const v = S.keyStats[k];
    const r = v && v.tot > 2 ? v.err / v.tot : 0;
    const d = document.createElement('div');
    const glyph = r > 0 ? RAMP[Math.min(RAMP.length - 1, 1 + Math.round(r * 8))] : '.';
    d.innerHTML = `${k === ' ' ? '_' : k}<i>${glyph}</i>`;
    el.appendChild(d);
  });
  const rows = Object.entries(S.keyStats)
    .filter(([, v]) => v.tot > 4 && v.err > 0)
    .map(([k, v]) => ({ k, r: v.err / v.tot, tot: v.tot }))
    .sort((a, b) => b.r - a.r).slice(0, 8);
  $('splits').innerHTML = rows.length
    ? '<table class="splits"><tr><th>key</th><th>density</th><th class="n">errors</th></tr>'
      + rows.map(x => `<tr><td>${x.k === ' ' ? 'space' : x.k}</td><td><span class="bar">${bar(x.r * 100, 18)}</span></td><td class="n">${Math.round(x.r * 100)}%</td></tr>`).join('')
      + '</table>'
    : '<p class="note">No misses recorded yet.</p>';
}
function renderHistory() {
  const el = $('history');
  el.innerHTML = S.history.length ? S.history.map(h => `<span class="no">${h}</span>`).join('') : '<span class="no">no lines yet</span>';
}

/* ── free typing ───────────────────────────────────────────── */
let fT = null, fPos = 0, fTarget = '', fStart = 0, fHits = 0, fErr = 0, fSecs = 60;
window._ferr = new Set();
const freeGen = () => { let s = ''; for (let i = 0; i < 70; i++) s += WORDS[Math.floor(Math.random() * WORDS.length)] + ' '; return s.trim(); };
function freeRender() {
  const el = $('freeLine');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < fTarget.length; i++) {
    const sp = document.createElement('span');
    sp.textContent = fTarget[i];
    sp.className = i < fPos ? (window._ferr.has(i) ? 'bad' : 'done') : (i === fPos ? 'cur' : 'todo');
    frag.appendChild(sp);
  }
  el.textContent = '';
  el.appendChild(frag);
}
function freeKey(e) {
  if (!fTarget || e.key.length !== 1) return;
  if (fPos >= fTarget.length) fTarget += ' ' + WORDS[Math.floor(Math.random() * WORDS.length)];
  if (e.key === fTarget[fPos]) { fHits++; clack(S, 1750, .035, 24); field.pulse(.5); }
  else { fErr++; window._ferr.add(fPos); clack(S, 300, .05, 50); field.tear(); }
  fPos++;
  freeRender();
  $('fwHits').textContent = fHits;
}
$('freeStart').onclick = () => {
  fTarget = freeGen(); fPos = 0; fHits = 0; fErr = 0; window._ferr = new Set(); fStart = Date.now();
  $('fwWpm').textContent = 0; $('fwAcc').textContent = '100%'; $('fwHits').textContent = 0;
  freeRender(); clearInterval(fT);
  fT = setInterval(() => {
    const el = Date.now() - fStart, left = Math.max(0, Math.ceil(fSecs - el / 1000)), mins = el / 60000;
    $('freeLeft').textContent = left + ' left';
    $('fwWpm').textContent = mins > .01 ? clampWpm((fHits / 5) / mins) : 0;
    $('fwAcc').textContent = Math.round(fHits / Math.max(1, fHits + fErr) * 100) + '%';
    if (left <= 0) {
      clearInterval(fT);
      const w = clampWpm((fHits / 5) / Math.max(mins, .05));
      const acc = fHits / Math.max(1, fHits + fErr);
      const earned = fHits >= 20 ? Math.round(Math.min(w, 120) * acc) : 0;
      const lvlBefore = levelFor(S.xp);
      S.xp += earned; touchStreak(S);
      runAchievements({ wpm: w, acc: Math.round(acc * 100), hits: fHits });
      saveNow(); updateRail(); renderBadges(); paintKeys();
      celebrateIfLevelUp(lvlBefore);
      log(earned ? `${w} wpm at ${Math.round(acc * 100)}% — +${earned} xp` : 'too little typed for xp');
    }
  }, 220);
};
document.querySelectorAll('[data-time]').forEach(b => b.onclick = () => {
  fSecs = parseInt(b.dataset.time);
  $('freeMeta').textContent = fSecs + ' s';
  $('freeLeft').textContent = fSecs + ' left';
});

/* ── daily + ghost ─────────────────────────────────────────── */
let dT = null, dTarget = '', dPos = 0, dHits = 0, dErr = 0, dStart = 0, dRun = false;
window._derr = new Set();
if (!S.daily || S.daily.date !== todayStr()) S.daily = { date: todayStr(), best: 0, last: 0 };
const TRACK = 46;
function dailyRender() {
  const el = $('dailyLine');
  if (!dTarget) { el.innerHTML = '<span class="todo">press run — the text for ' + todayStr() + '</span>'; return; }
  const frag = document.createDocumentFragment();
  for (let i = 0; i < dTarget.length; i++) {
    const sp = document.createElement('span');
    sp.textContent = dTarget[i];
    sp.className = i < dPos ? (window._derr.has(i) ? 'bad' : 'done') : (i === dPos ? 'cur' : 'todo');
    frag.appendChild(sp);
  }
  el.textContent = '';
  el.appendChild(frag);
}
function dailyTrack() {
  const len = dTarget.length || 1;
  const best = S.daily.best || 0;
  const g = best && dStart ? ghostProgress(Date.now() - dStart, best, len) : 0;
  const mine = dStart ? dPos / len : 0;
  const col = v => Math.max(0, Math.min(TRACK - 1, Math.round(v * (TRACK - 1))));
  $('ghostRow').textContent = ' '.repeat(col(g)) + (best ? '^' : '');
  $('mineRow').textContent = dStart ? ' '.repeat(col(mine)) + '^' : '';
  $('trackBase').textContent = bar(mine * 100, TRACK);
}
$('dailyStart').onclick = () => {
  if (S.daily.date !== todayStr()) S.daily = { date: todayStr(), best: 0, last: 0 };
  dTarget = dailyText(todayStr(), WORDS, 45);
  dPos = 0; dHits = 0; dErr = 0; window._derr = new Set(); dStart = Date.now(); dRun = true;
  $('dailyDate').textContent = todayStr();
  $('dailyBest').textContent = S.daily.best ? 'best ' + S.daily.best + ' wpm' : 'no run today';
  dailyRender(); dailyTrack(); clearInterval(dT);
  dT = setInterval(() => {
    const mins = (Date.now() - dStart) / 60000;
    $('dwWpm').textContent = mins > .01 ? clampWpm((dHits / 5) / mins) : 0;
    $('dwAcc').textContent = Math.round(dHits / Math.max(1, dHits + dErr) * 100) + '%';
    dailyTrack();
  }, 160);
};
function dailyKey(e) {
  if (!dRun || e.key.length !== 1 || dPos >= dTarget.length) return;
  if (e.key === dTarget[dPos]) { dHits++; clack(S, 1750, .035, 24); field.pulse(.6); }
  else { dErr++; window._derr.add(dPos); clack(S, 300, .05, 50); field.tear(); }
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
  $('dailyBest').textContent = 'best ' + S.daily.best + ' wpm';
  $('dailyQuest').textContent = record
    ? `new best today: ${wpm} wpm at ${acc}% — +${earned} xp`
    : `${wpm} wpm at ${acc}% against a ghost of ${prev} — +${earned} xp`;
  if (record) { field.bloom(); const el = $('bannerText'); scramble(el, 'record', 600); $('banner').hidden = false; setTimeout(() => { $('banner').hidden = true; }, 1600); }
  celebrateIfLevelUp(lvlBefore);
  log(record ? `new daily best — ${wpm} wpm` : `daily run — ${wpm} wpm`);
}

/* ── tabs ──────────────────────────────────────────────────── */
const tabList = [...document.querySelectorAll('.tab')];
function selectTab(t) {
  tabList.forEach(x => {
    const on = x === t;
    x.classList.toggle('on', on);
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1;
  });
  ['learn', 'free', 'daily', 'stats', 'quellen'].forEach(v => { $('view-' + v).hidden = t.dataset.t !== v; });
  if (t.dataset.t === 'stats') { renderHeat(); renderBadges(); renderHistory(); }
  if (t.dataset.t === 'daily') { dailyRender(); renderBadges(); }
  if (t.dataset.t === 'learn') { paintKeys(); updateQuest(); }
  const heading = $('view-' + t.dataset.t).querySelector('.h');
  if (heading) scramble(heading, heading.textContent, 320);
}
tabList.forEach((t, i) => {
  t.onclick = () => selectTab(t);
  t.onkeydown = ev => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(ev.key)) return;
    ev.preventDefault();
    const n = ev.key === 'Home' ? 0 : ev.key === 'End' ? tabList.length - 1
      : (i + (ev.key === 'ArrowRight' ? 1 : -1) + tabList.length) % tabList.length;
    selectTab(tabList[n]); tabList[n].focus();
  };
});

/* ── controls ──────────────────────────────────────────────── */
$('newLine').onclick = () => startLesson(cur);
$('skipLine').onclick = () => {
  S.unlocked = unlockFor(cur, S.unlocked, LESSONS.length);
  save();
  if (cur + 1 < LESSONS.length) startLesson(cur + 1);
};
$('soundBtn').onclick = () => { S.sound = !S.sound; saveNow(); updateRail(); };
$('resetBtn').onclick = () => { if (confirm('Wipe all progress?')) { localStorage.removeItem('tippster_v1'); location.reload(); } };
$('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tippster-progress-${todayStr()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
};
$('importBtn').onclick = () => $('importFile').click();
$('importFile').onchange = ev => {
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
renderPath(); renderBadges(); renderHeat(); renderHistory();
startLesson(resumeLesson(S.unlocked, LESSONS.length));
updateRail(); updateQuest();
$('freeLine').innerHTML = '<span class="todo">press run — 60 seconds of german practice words</span>';
dailyRender();
save();
startUpdateWatch();
