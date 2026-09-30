import '@fontsource/outfit/latin-400.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/outfit/latin-800.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import { LESSONS, FINGER, FCOL, FNAME, ROWS, WORDS } from './lessons.js';
import { loadState, saveState, touchStreak, levelFor, unlockFor, resumeLesson } from './store.js';
import { weakKeys, genText, starsFor, clampWpm, MAX_WPM } from './stats.js';
import { recordKeystroke, lessonsToGoal, rollingAcc } from './adaptive.js';
import { sHit, sErr, sLvl, tone } from './audio.js';
import { confetti, gsap, levelUpBurst, comboFx, tweenXP, popKeyEl, toast, celebrateLevel } from './fx.js';
import { checkForUpdates } from './updater.js';
import { ACHIEVEMENTS, TOTAL_ACHIEVEMENTS, evaluate as evaluateAchievements, buildContext } from './achievements.js';
import { dailyText, ghostProgress } from './daily.js';

const S = loadState();
// M2: Schreiben entkoppeln — nicht bei jedem Anschlag JSON.stringify+write.
let saveTimer = null;
const saveNow = () => { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; } saveState(S); };
const save = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; saveState(S); }, 400);
};
let cur = 0, pos = 0, target = '', startT = 0, errs = 0, hits = 0, combo = 0, maxCombo = 0, done = false;
window._errAt = new Set();

// ---- C1: Achievements ----
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const lessonsDone = () => Object.keys(S.lessonStars).length;
function bossStats() {
  const idx = LESSONS.map((l, i) => ({ l, i })).filter(x => x.l.boss).map(x => x.i);
  return { total: idx.length, done: idx.filter(i => S.lessonStars[i]).length };
}
function runAchievements({ wpm, acc, hits, isBoss = false, maxCombo: mc = 0 }) {
  const b = bossStats();
  const ctx = buildContext({
    wpm, acc, hits, maxCombo: mc, streak: S.streak.count, stars: S.stars, isBoss,
    lessonsDone: lessonsDone(), lessonTotal: LESSONS.length, bossesDone: b.done, bossTotal: b.total
  });
  const fresh = evaluateAchievements(ctx, S.badges);
  fresh.forEach(a => { S.badges.push(a.id); toast(`🏅 <b>${a.label}</b>`); });
  if (fresh.length) confetti({ particleCount: 50, origin: { y: .25 } });
  return fresh;
}
function celebrateIfLevelUp(before) {
  const after = levelFor(S.xp);
  if (after > before) { sLvl(S); celebrateLevel(after); }
  else levelUpBurst();
}

function renderText() {
  const el = document.getElementById('textFlow'); el.innerHTML = '';
  [...target].forEach((ch, i) => {
    const sp = document.createElement('span');
    sp.textContent = ch === ' ' ? ' ' : ch;
    sp.className = i < pos ? 'done' : (i === pos ? 'cur' : 'todo');
    if (i < pos && window._errAt.has(i)) sp.className = 'err';
    el.appendChild(sp);
  });
  document.getElementById('sProg').textContent = Math.round(pos / target.length * 100) + '%';
  highlightKey(target[pos] || ' ');
}
function startLesson(i) {
  cur = i; pos = 0; errs = 0; hits = 0; combo = 0; maxCombo = 0; done = false; window._errAt = new Set();
  window._lastKeyT = null;
  startT = Date.now();
  target = genText(i, LESSONS, S.keyStats);
  document.getElementById('lessonTitle').textContent = `Lektion ${i + 1}: ${LESSONS[i].t}`;
  document.getElementById('lessonDesc').textContent = LESSONS[i].d;
  renderLevels(); renderText(); updateHUD(); updateQuest();
}
function buildKbd() {
  const k = document.getElementById('kbd'); k.innerHTML = '';
  ROWS.forEach(r => {
    const d = document.createElement('div'); d.className = 'krow';
    r.forEach(c => {
      const k2 = document.createElement('div'); k2.className = 'key'; k2.id = 'k-' + c;
      k2.innerHTML = `${c.toUpperCase()}<small>${FNAME[FINGER[c]] || ''}</small>`;
      const f = FINGER[c]; if (f) k2.style.borderTop = `3px solid ${FCOL[f]}`;
      d.appendChild(k2);
    });
    k.appendChild(d);
  });
  const sp = document.createElement('div'); sp.className = 'krow';
  sp.innerHTML = `<div class="key space" id="k- ">Space<small>Daumen</small></div>`; k.appendChild(sp);
  const f = document.getElementById('fingers'); f.innerHTML = '';
  ['lk','lr','lm','li','t','ri','rm','rr','rk'].forEach(x => {
    const d = document.createElement('div'); d.className = 'finger'; d.id = 'f-' + x; d.textContent = FNAME[x] || x; f.appendChild(d);
  });
}
function highlightKey(ch) {
  document.querySelectorAll('.key').forEach(e => e.classList.remove('next'));
  document.querySelectorAll('.finger').forEach(e => { e.classList.remove('on'); e.style.background = ''; });
  ch = (ch || ' ').toLowerCase();
  const el = document.getElementById('k-' + ch) || document.getElementById('k- ');
  if (el) el.classList.add('next');
  const fg = FINGER[ch] || 't'; const fe = document.getElementById('f-' + fg);
  if (fe) { fe.classList.add('on'); fe.style.background = FCOL[fg]; }
}
function popKey(ch, ok) {
  const el = document.getElementById('k-' + (ch.toLowerCase() || ' ')) || document.getElementById('k- ');
  if (!el) return;
  popKeyEl(el, ok);
}
document.addEventListener('keydown', e => {
  const visible = n => document.getElementById('view-' + n).style.display !== 'none';
  if (visible('daily')) return handleDailyKey(e);
  if (visible('free')) return handleFreeKey(e);
  if (!visible('learn')) return;
  if (e.key.length !== 1) return; // nur druckbare Zeichen (Backspace/Escape/Pfeile ausgenommen)
  if (done) return;
  e.preventDefault();
  const exp = target[pos]; const got = e.key;
  const k = exp === ' ' ? ' ' : (exp || ' ').toLowerCase();
  const now = Date.now();
  const latency = window._lastKeyT ? now - window._lastKeyT : null;
  window._lastKeyT = now;
  const ok = got === exp;
  recordKeystroke(S.keyStats, k, ok, latency);
  if (ok) {
    hits++; combo++; maxCombo = Math.max(maxCombo, combo);
    S.xp += 1 + Math.floor(combo / 25);
    sHit(S); popKey(got, true); comboFx(combo);
    pos++;
    if (pos >= target.length) finishLesson(); else renderText();
  } else {
    errs++; combo = 0;
    window._errAt.add(pos);
    sErr(S); popKey(got, false);
    const m = document.querySelector('main');
    m.classList.add('shake'); setTimeout(() => m.classList.remove('shake'), 250);
    renderText();
  }
  const mins = (Date.now() - startT) / 60000;
  document.getElementById('sAcc').textContent = Math.round(hits / Math.max(1, hits + errs) * 100) + '%';
  document.getElementById('sWpm').textContent = mins > .01 ? clampWpm((hits / 5) / mins) : 0;
  document.getElementById('sCombo').textContent = combo;
  updateHUD(); save();
});
function finishLesson() {
  done = true;
  const mins = (Date.now() - startT) / 60000, wpm = clampWpm((hits / 5) / Math.max(mins, .05)), acc = Math.round(hits / Math.max(1, hits + errs) * 100);
  const st = starsFor(acc, wpm);
  const lvlBefore = levelFor(S.xp);
  S.stars += st; S.xp += 20 * st + (LESSONS[cur].boss ? 50 : 0);
  S.lessonStars[cur] = Math.max(S.lessonStars[cur] || 0, st);
  S.unlocked = unlockFor(cur, S.unlocked, LESSONS.length);
  S.history.unshift(`${new Date().toLocaleDateString('de-DE')} L${cur + 1}: ${wpm} WPM, ${acc}%, ${st}⭐`); S.history = S.history.slice(0, 12);
  touchStreak(S);
  runAchievements({ wpm, acc, hits, isBoss: !!LESSONS[cur].boss, maxCombo });
  saveNow(); updateHUD(); renderLevels(); renderBadges(); renderHeat();
  celebrateIfLevelUp(lvlBefore);
  const box = document.getElementById('overlayBox');
  const weak = weakKeys(S.keyStats);
  box.innerHTML = `<h1>${LESSONS[cur].boss ? '👑 BOSS BESIEGT!' : '🎉 Geschafft!'}</h1>
    <p>${wpm} WPM · ${acc}% Genauigkeit · Max-Combo x${maxCombo}</p>
    <p style="font-size:30px">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</p>
    <p class="hint">${weak.length ? 'Deine Wackel-Taste: <b>' + weak[0] + '</b> — kommt morgen öfter dran.' : 'Sauber! Keine Wackel-Taste heute.'}</p>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">
    <button class="btn" id="ovNext">Weiter →</button>
    <button class="btn ghost" id="ovAgain">Nochmal</button></div>`;
  document.getElementById('overlay').style.display = 'grid';
  gsap.fromTo(box, { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .4, ease: 'back.out(1.8)' });
  document.getElementById('ovNext').onclick = () => { document.getElementById('overlay').style.display = 'none'; if (cur + 1 < LESSONS.length) startLesson(cur + 1); };
  document.getElementById('ovAgain').onclick = () => { document.getElementById('overlay').style.display = 'none'; startLesson(cur); };
}
function updateHUD() {
  document.getElementById('lvlLabel').textContent = 'Level ' + levelFor(S.xp);
  document.getElementById('xpLabel').textContent = S.xp + ' XP';
  document.getElementById('streakPill').textContent = `🔥 ${S.streak.count} Tage`;
  document.getElementById('starsPill').textContent = `⭐ ${S.stars}`;
  tweenXP((S.xp % 150) / 150 * 100);
  document.getElementById('soundBtn').textContent = S.sound ? '🔊 Sound an' : '🔇 Sound aus';
}
function updateQuest() {
  const w = weakKeys(S.keyStats);
  const left = lessonsToGoal(S.keyStats, LESSONS[cur].keys);
  const prog = left === 0 ? 'Ziel erreicht — nächste Lektion wartet! 🚀' : `noch ~${left} Lektionen bis zum Tasten-Ziel 🎯`;
  document.getElementById('quest').innerHTML = w.length
    ? `🎯 <b>Tages-Quest:</b> Besiege dein <b style="font-size:20px">„${w[0]}"</b> (${Math.round((1 - rollingAcc(S.keyStats[w[0]])) * 100)}% Fehler, letzte ${S.keyStats[w[0]].recent.length}) — ${prog}`
    : `🎯 <b>Tages-Quest:</b> 1 Lektion à 5 Min — ${prog} 🦥`;
}
function renderLevels() {
  const el = document.getElementById('levels'); el.innerHTML = '';
  LESSONS.forEach((L, i) => {
    const b = document.createElement('button');
    b.className = 'lvl' + (i >= S.unlocked ? ' locked' : '') + (i === cur ? ' current' : '');
    b.innerHTML = `<b>${i + 1}. ${L.t}</b><span>${L.boss ? '👑 Boss' : '🎮 Übung'} · ${L.keys === 'all' ? 'alle Tasten' : L.keys}</span><div class="stars">${S.lessonStars[i] ? '⭐'.repeat(S.lessonStars[i]) : ''}</div>`;
    if (i < S.unlocked) b.onclick = () => startLesson(i);
    el.appendChild(b);
  });
}
function renderBadges() {
  const unlocked = new Set(S.badges);
  const cells = ACHIEVEMENTS.map(a =>
    `<span class="badge${unlocked.has(a.id) ? '' : ' locked'}" title="${a.group}">${a.label}</span>`).join('');
  const grid = `<div class="badges-grid">${cells}</div>`;
  document.getElementById('badges').innerHTML = `<b>${unlocked.size}/${TOTAL_ACHIEVEMENTS} Badges</b>${grid}`;
  document.getElementById('badges2').innerHTML = grid;
  const bd = document.getElementById('badgesDaily'); if (bd) bd.innerHTML = grid;
  const bc = document.getElementById('badgeCount'); if (bc) bc.textContent = `${unlocked.size}/${TOTAL_ACHIEVEMENTS}`;
  document.getElementById('history').innerHTML = S.history.join('<br>') || 'Noch kein Verlauf.';
}
function renderHeat() {
  const el = document.getElementById('heat'); el.innerHTML = '';
  'abcdefghijklmnopqrstuvwxyzäöüß,. -'.split('').forEach(k => {
    const v = S.keyStats[k]; const r = v && v.tot > 2 ? v.err / v.tot : 0;
    const d = document.createElement('div'); d.className = 'hcell';
    d.textContent = `${k === ' ' ? 'space' : k} ${v ? Math.round((1 - r) * 100) + '%' : ''}`;
    d.style.background = r > .25 ? '#7f1d2e' : r > .12 ? '#7c4a12' : v ? '#0f3d2e' : '#080c1d';
    el.appendChild(d);
  });
}
// Free mode
let fT = null, fPos = 0, fTarget = '', fStart = 0, fHits = 0, fErr = 0, fSecs = 60;
window._ferr = new Set();
function freeGen() { let s = ''; for (let i = 0; i < 70; i++) s += WORDS[Math.floor(Math.random() * WORDS.length)] + ' '; return s.trim(); }
function freeRender() {
  const el = document.getElementById('freeText'); el.innerHTML = '';
  [...fTarget].forEach((c, i) => {
    const sp = document.createElement('span'); sp.textContent = c;
    sp.style.color = i < fPos ? (window._ferr.has(i) ? '#fb7185' : '#34d399') : '#5b6a9e';
    if (i === fPos) { sp.style.background = '#22d3ee'; sp.style.color = '#06222a'; }
    el.appendChild(sp);
  });
}
function handleFreeKey(e) {
  if (!fTarget || e.key.length !== 1) return;
  if (fPos >= fTarget.length) fTarget += ' ' + WORDS[Math.floor(Math.random() * WORDS.length)]; // nachfüllen statt überlaufen
  if (e.key === fTarget[fPos]) { fHits++; fPos++; tone(S, 700, .04, 'square', .02); }
  else { fErr++; window._ferr.add(fPos); fPos++; tone(S, 140, .12, 'sawtooth', .04); }
  freeRender();
}
document.getElementById('freeStart').onclick = () => {
  fTarget = freeGen(); fPos = 0; fHits = 0; fErr = 0; window._ferr = new Set(); fStart = Date.now();
  freeRender(); clearInterval(fT);
  fT = setInterval(() => {
    const el = Date.now() - fStart; const left = Math.max(0, Math.ceil(fSecs - el / 1000));
    document.getElementById('fTime').textContent = left;
    const mins = el / 60000;
    document.getElementById('fWpm').textContent = mins > .01 ? clampWpm((fHits / 5) / mins) : 0;
    document.getElementById('fAcc').textContent = Math.round(fHits / Math.max(1, fHits + fErr) * 100) + '%';
    if (left <= 0) {
      clearInterval(fT);
      const w = parseInt(document.getElementById('fWpm').textContent) || 0;
      const acc = fHits / Math.max(1, fHits + fErr);
      // M7: XP an Leistung koppeln, nicht an rohe WPM; Mindestmenge verhindert Farmen.
      const earned = fHits >= 20 ? Math.min(w, 120) * acc : 0;
      const lvlBefore = levelFor(S.xp);
      S.xp += Math.round(earned);
      touchStreak(S);
      runAchievements({ wpm: w, acc: Math.round(acc * 100), hits: fHits, isBoss: false });
      saveNow(); updateHUD(); renderBadges();
      celebrateIfLevelUp(lvlBefore);
      toast(earned > 0
        ? `⏱️ ${w} WPM, ${Math.round(acc * 100)} % — +${Math.round(earned)} XP`
        : '⏱️ Zu wenig getippt für XP (20 Treffer nötig)');
    }
  }, 250);
};
document.querySelectorAll('[data-time]').forEach(b => b.onclick = () => { fSecs = parseInt(b.dataset.time); document.getElementById('fTime').textContent = fSecs; });

// ---- C2: Tages-Challenge + Ghost-Race ----
let dTarget = '', dPos = 0, dHits = 0, dErr = 0, dStart = 0, dTimer = null, dRunning = false;
window._derr = new Set();
if (!S.daily || S.daily.date !== todayStr()) S.daily = { date: todayStr(), best: 0, last: 0 };

function dailyBestLabel() {
  const el = document.getElementById('dailyBest');
  if (el) el.textContent = S.daily.best ? `Bestwert heute: ${S.daily.best} WPM` : 'Bestwert heute: —';
}
function renderDailyText() {
  const el = document.getElementById('dailyText');
  if (!el) return;
  if (!dTarget) { el.innerHTML = `<span class="todo">Drücke Start — Text für ${todayStr()}</span>`; return; }
  el.innerHTML = '';
  [...dTarget].forEach((c, i) => {
    const sp = document.createElement('span');
    sp.textContent = c;
    sp.className = i < dPos ? (window._derr.has(i) ? 'err' : 'done') : (i === dPos ? 'cur' : 'todo');
    el.appendChild(sp);
  });
}
function updateGhost() {
  const best = S.daily.best || 0, len = dTarget.length || 1;
  let pct = 0;
  if (best && dStart) pct = ghostProgress(Date.now() - dStart, best, len) * 100;
  document.getElementById('ghostFill').style.width = pct + '%';
  document.getElementById('ghostMark').style.left = pct + '%';
  document.getElementById('dGhost').textContent = best;
}
document.getElementById('dailyStart').onclick = () => {
  if (S.daily.date !== todayStr()) S.daily = { date: todayStr(), best: 0, last: 0 };
  dTarget = dailyText(todayStr(), WORDS, 45);
  dPos = 0; dHits = 0; dErr = 0; window._derr = new Set(); dStart = Date.now(); dRunning = true;
  renderDailyText(); dailyBestLabel(); updateGhost(); clearInterval(dTimer);
  dTimer = setInterval(() => {
    const el = Date.now() - dStart, mins = el / 60000;
    document.getElementById('dWpm').textContent = mins > .01 ? clampWpm((dHits / 5) / mins) : 0;
    document.getElementById('dAcc').textContent = Math.round(dHits / Math.max(1, dHits + dErr) * 100) + '%';
    updateGhost();
  }, 200);
};
function handleDailyKey(e) {
  if (!dRunning || e.key.length !== 1 || dPos >= dTarget.length) return;
  if (e.key === dTarget[dPos]) { dHits++; dPos++; tone(S, 700, .04, 'square', .02); }
  else { dErr++; window._derr.add(dPos); dPos++; tone(S, 140, .12, 'sawtooth', .04); }
  renderDailyText();
  if (dPos >= dTarget.length) finishDaily();
}
function finishDaily() {
  dRunning = false; clearInterval(dTimer);
  const mins = (Date.now() - dStart) / 60000;
  const wpm = clampWpm((dHits / 5) / Math.max(mins, .05));
  const acc = Math.round(dHits / Math.max(1, dHits + dErr) * 100);
  const prevBest = S.daily.best;
  const isRecord = wpm > prevBest;
  if (isRecord) S.daily.best = wpm;
  S.daily.last = wpm;
  const earned = Math.round(Math.min(wpm, 120) * (acc / 100));
  const lvlBefore = levelFor(S.xp);
  S.xp += earned;
  touchStreak(S);
  runAchievements({ wpm, acc, hits: dHits, isBoss: false });
  saveNow(); updateHUD(); renderBadges(); dailyBestLabel(); updateGhost();
  document.getElementById('dailyQuest').innerHTML = isRecord
    ? `🥇 <b>Neuer Tagesrekord: ${wpm} WPM</b> (${acc} %) — +${earned} XP`
    : `${wpm} WPM (${acc} %) gegen Ghost ${prevBest} — +${earned} XP`;
  celebrateIfLevelUp(lvlBefore);
  if (isRecord) confetti({ particleCount: 130, spread: 80, origin: { y: .5 } });
}
document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
  t.classList.add('on'); t.setAttribute('aria-selected', 'true');
  ['learn','free','daily','stats','quellen'].forEach(v => document.getElementById('view-' + v).style.display = t.dataset.t === v ? 'grid' : 'none');
  if (t.dataset.t === 'stats') { renderHeat(); renderBadges(); }
  if (t.dataset.t === 'daily') { renderDailyText(); dailyBestLabel(); updateGhost(); renderBadges(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const o = document.getElementById('overlay');
    if (o.style.display === 'grid') o.style.display = 'none';
  }
});
document.getElementById('restartBtn').onclick = () => startLesson(cur);
document.getElementById('skipBtn').onclick = () => {
  S.unlocked = unlockFor(cur, S.unlocked, LESSONS.length);
  save(); document.getElementById('overlay').style.display = 'none';
  if (cur + 1 < LESSONS.length) startLesson(cur + 1);
};
document.getElementById('soundBtn').onclick = () => { S.sound = !S.sound; saveNow(); updateHUD(); };
document.getElementById('resetBtn').onclick = () => { if (confirm('Wirklich alles löschen?')) { localStorage.removeItem('tippster_v1'); location.reload(); } };
// M8: Fortschritt sichern und wiederherstellen
document.getElementById('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tippster-fortschritt-${new Date().toISOString().slice(0, 10)}.json`;
  a.click(); URL.revokeObjectURL(a.href);
};
document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
document.getElementById('importFile').onchange = (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const data = JSON.parse(rd.result);
      if (typeof data !== 'object' || data === null || !('keyStats' in data)) throw new Error('kein Tippster-Backup');
      localStorage.setItem('tippster_v1', JSON.stringify(data));
      location.reload();
    } catch (err) { alert('Import fehlgeschlagen: ' + err.message); }
  };
  rd.readAsText(file);
};
window.addEventListener('beforeunload', saveNow);

buildKbd(); renderLevels(); renderBadges(); renderHeat(); renderDailyText(); dailyBestLabel();
startLesson(resumeLesson(S.unlocked, LESSONS.length)); updateHUD(); save();
checkForUpdates();
