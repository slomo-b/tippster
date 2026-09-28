export function weakKeys(keyStats) {
  return Object.entries(keyStats)
    .filter(([, v]) => v.tot > 4 && (v.err / v.tot) > 0.12)
    .sort((a, b) => (b[1].err / b[1].tot) - (a[1].err / a[1].tot))
    .slice(0, 3).map(x => x[0]);
}
export function genText(li, LESSONS, keyStats) {
  const L = LESSONS[li];
  const weak = weakKeys(keyStats).filter(k => L.keys.includes(k) || L.keys === 'all');
  let pool = L.keys === 'all' ? 'abcdefghijklmnopqrstuvwxyzäöü ,.!?' : '';
  if (L.keys !== 'all') pool = L.keys.replace(/ /g, '');
  const boost = weak.join('').repeat(4);
  let s = '';
  if (li === 11) { s = L.words.join(' '); }
  else {
    for (let i = 0; i < 3; i++) {
      const a = pool[Math.floor(Math.random() * pool.length)] || 'f';
      s += (a + pool[0] + a + ' ').repeat(2);
    }
    const allPool = (pool + boost).split('');
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
