import { weakestKeys as weakest, buildWeightedPool } from './adaptive.js';

export function weakKeys(keyStats) { return weakest(keyStats, 3); }

export function genText(li, LESSONS, keyStats) {
  const L = LESSONS[li];
  const weak = weakKeys(keyStats).filter(k => L.keys.includes(k) || L.keys === 'all');
  let pool = L.keys === 'all' ? 'abcdefghijklmnopqrstuvwxyzäöü ,.!?' : '';
  if (L.keys !== 'all') pool = L.keys.replace(/ /g, '');
  const allPool = buildWeightedPool(pool, weak).split('');
  let s = '';
  if (L.keys === 'all') { s = L.words.join(' '); }
  else {
    for (let i = 0; i < 3; i++) {
      const a = pool[Math.floor(Math.random() * pool.length)] || 'f';
      s += (a + pool[0] + a + ' ').repeat(2);
    }
    for (let i = 0; i < 14; i++) {
      let w = ''; const len = 2 + Math.floor(Math.random() * 4);
      for (let j = 0; j < len; j++) w += allPool[Math.floor(Math.random() * allPool.length)];
      s += w + ' ';
    }
    L.words.forEach(w => { if (Math.random() > .4) s += w + ' '; });
  }
  return s.trim().slice(0, 220);
}
export function starsFor(acc, wpm) { let s = 1; if (acc >= 90) s = 2; if (acc >= 96 && wpm >= 12) s = 3; return s; }

// WPM plausibel halten: synthetisch/instantanes Tippen darf keine Rekorde erzeugen.
export const MAX_WPM = 250;
export function clampWpm(w) {
  if (typeof w !== 'number' || Number.isNaN(w) || w < 0) return 0;
  return Math.min(MAX_WPM, Math.round(w));
}
