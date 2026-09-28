import { LESSONS, FINGER, FCOL, FNAME, ROWS, WORDS } from './lessons.js';
import { loadState, saveState, touchStreak, levelFor } from './store.js';
import { weakKeys, genText, starsFor } from './stats.js';
import { sHit, sErr, sLvl, tone } from './audio.js';
import { confetti, gsap, levelUpBurst, comboFx, tweenXP, popKeyEl } from './fx.js';

const S = loadState();
const save = () => saveState(S);
let cur = 0, pos = 0, target = '', startT = 0, errs = 0, hits = 0, combo = 0, maxCombo = 0, done = false;
window._errAt = new Set();

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
  const learnVisible = document.getElementById('view-learn').style.display !== 'none';
  const freeVisible = document.getElementById('view-free').style.display !== 'none';
  if (freeVisible && !learnVisible) return handleFreeKey(e);
  if (!learnVisible) return;
  if (['Shift','Control','Alt','Meta','CapsLock','Tab'].includes(e.key)) return;
  if (done) return;
  e.preventDefault();
  const exp = target[pos]; const got = e.key;
  const k = exp === ' ' ? ' ' : (exp || ' ').toLowerCase();
  S.keyStats[k] = S.keyStats[k] || { tot: 0, err: 0 }; S.keyStats[k].tot++;
  if (got === exp) {
    hits++; combo++; maxCombo = Math.max(maxCombo, combo);
    S.xp += 1 + Math.floor(combo / 25);
    sHit(S); popKey(got, true); comboFx(combo);
    pos++;
    if (pos >= target.length) finishLesson(); else renderText();
  } else {
    errs++; combo = 0; S.keyStats[k].err++;
    window._errAt.add(pos);
    sErr(S); popKey(got, false);
    document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 250);
    renderText();
  }
  const mins = (Date.now() - startT) / 60000;
  document.getElementById('sAcc').textContent = Math.round(hits / Math.max(1, hits + errs) * 100) + '%';
  document.getElementById('sWpm').textContent = mins > .01 ? Math.round((hits / 5) / mins) : 0;
  document.getElementById('sCombo').textContent = combo;
  updateHUD(); save();
});
function finishLesson() {
  done = true;
  const mins = (Date.now() - startT) / 60000, wpm = Math.round((hits / 5) / Math.max(mins, .05)), acc = Math.round(hits / Math.max(1, hits + errs) * 100);
  const st = starsFor(acc, wpm);
  S.stars += st; S.xp += 20 * st + (LESSONS[cur].boss ? 50 : 0);
  if (cur + 1 > S.unlocked - 1 && cur + 1 < LESSONS.length) S.unlocked = cur + 1;
  if (S.unlocked < cur + 2 && cur + 1 < LESSONS.length) S.unlocked = cur + 2;
  S.history.unshift(`${new Date().toLocaleDateString('de-DE')} L${cur + 1}: ${wpm} WPM, ${acc}%, ${st}⭐`); S.history = S.history.slice(0, 12);
  touchStreak(S); award(acc, wpm);
  save(); updateHUD(); renderLevels(); renderBadges(); renderHeat();
  sLvl(S); levelUpBurst();
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
function award(acc, wpm) {
  const add = (id) => { if (!S.badges.includes(id)) { S.badges.push(id); confetti({ particleCount: 40, origin: { y: .3 } }); } };
  if (maxCombo >= 25) add('c25'); if (maxCombo >= 50) add('c50');
  if (acc >= 95) add('a95'); if (acc === 100) add('a100');
  if (wpm >= 40) add('w40'); if (wpm >= 60) add('w60');
  if (S.streak.count >= 3) add('s3'); if (S.streak.count >= 7) add('s7');
}
const BADGE_LABEL = { c25: '🔥 Combo x25', c50: '☄️ Combo x50', a95: '🎯 95% Präzision', a100: '💎 100% fehlerfrei', w40: '⚡ 40 WPM', w60: '🥷 60 WPM Ninja', s3: '🔥 3-Tage-Streak', s7: '🏆 7-Tage-Streak' };
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
  document.getElementById('quest').innerHTML = w.length
    ? `🎯 <b>Tages-Quest:</b> Besiege dein <b style="font-size:20px">„${w[0]}"</b> (${Math.round(S.keyStats[w[0]].err / S.keyStats[w[0]].tot * 100)}% Fehler) — 5 Min reichen!`
    : `🎯 <b>Tages-Quest:</b> 1 Lektion à 5 Min — Streak sichern! 🦥`;
}
function renderLevels() {
  const el = document.getElementById('levels'); el.innerHTML = '';
  LESSONS.forEach((L, i) => {
    const b = document.createElement('button');
    b.className = 'lvl' + (i >= S.unlocked ? ' locked' : '') + (i === cur ? ' current' : '');
    b.innerHTML = `<b>${i + 1}. ${L.t}</b><span>${L.boss ? '👑 Boss' : '🎮 Übung'} · ${L.keys === 'all' ? 'alle Tasten' : L.keys}</span><div class="stars">${i < S.unlocked ? '⭐' : ''}</div>`;
    if (i < S.unlocked) b.onclick = () => startLesson(i);
    el.appendChild(b);
  });
}
function renderBadges() {
  const h = S.badges.length ? S.badges.map(b => `<span class="badge">${BADGE_LABEL[b] || b}</span>`).join('') : '<span class="hint">Noch keine — spiel 1 Lektion!</span>';
  document.getElementById('badges').innerHTML = '<b>Badges:</b><br>' + h;
  document.getElementById('badges2').innerHTML = h;
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
  if (!fTarget || (e.key.length !== 1 && e.key !== ' ')) return;
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
    document.getElementById('fWpm').textContent = mins > .01 ? Math.round((fHits / 5) / mins) : 0;
    document.getElementById('fAcc').textContent = Math.round(fHits / Math.max(1, fHits + fErr) * 100) + '%';
    if (left <= 0) {
      clearInterval(fT);
      const w = document.getElementById('fWpm').textContent;
      S.xp += parseInt(w) || 5; touchStreak(S); save(); updateHUD();
      confetti({ particleCount: 100, spread: 70 });
      alert(`Zeit um! ${w} WPM — XP kassiert!`);
    }
  }, 250);
};
document.querySelectorAll('[data-time]').forEach(b => b.onclick = () => { fSecs = parseInt(b.dataset.time); document.getElementById('fTime').textContent = fSecs; });
document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on')); t.classList.add('on');
  ['learn','free','stats','quellen'].forEach(v => document.getElementById('view-' + v).style.display = t.dataset.t === v ? 'grid' : 'none');
  if (t.dataset.t === 'stats') { renderHeat(); renderBadges(); }
});
document.getElementById('restartBtn').onclick = () => startLesson(cur);
document.getElementById('skipBtn').onclick = () => {
  if (cur + 1 < LESSONS.length && cur + 1 >= S.unlocked) S.unlocked = cur + 1;
  save(); document.getElementById('overlay').style.display = 'none';
  if (cur + 1 < LESSONS.length) startLesson(cur + 1);
};
document.getElementById('soundBtn').onclick = () => { S.sound = !S.sound; save(); updateHUD(); };
document.getElementById('resetBtn').onclick = () => { if (confirm('Wirklich alles löschen?')) { localStorage.removeItem('tippster_v1'); location.reload(); } };

buildKbd(); renderLevels(); renderBadges(); renderHeat();
startLesson(0); touchStreak(S); updateHUD(); save();
