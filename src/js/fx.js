// The world's own effects. Nothing here adds a colour: emphasis is inverse video,
// scalars are drawn with the density ramp, and new text resolves out of noise.
export const RAMP = ' .:-=+*#%@';
const NOISE = '.:-=+*#%@<>/\\|';

const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export { reduced as REDUCED };

/** A bar whose leading edge is the brightest glyph — light, not colour. */
export function bar(pct, w = 28) {
  const d = Math.max(0, Math.min(1, pct / 100));
  if (d <= 0) return ' '.repeat(w);
  let s = '';
  for (let i = 0; i < w; i++) {
    const edge = (i + 0.5) / w;
    const v = edge <= d
      ? 0.52 + 0.48 * (edge / d)                 // densest right at the edge
      : Math.max(0, 1 - (edge - d) * w * 0.55);  // and it falls away behind it
    s += RAMP[Math.round(v * (RAMP.length - 1))];
  }
  return s;
}

/** Text resolving out of scrambled glyphs. The world's only entrance. */
export function scramble(el, text, duration = 520) {
  if (!el) return;
  if (reduced || document.hidden) { el.textContent = text; return; }
  const n = text.length;
  const start = performance.now();
  const token = (el._sc = (el._sc || 0) + 1);
  (function tick(now) {
    if (el._sc !== token) return;
    const p = Math.min(1, (now - start) / duration);
    const revealed = p * n * 1.7;
    let out = '';
    for (let i = 0; i < n; i++) {
      const ch = text[i];
      out += i < revealed || ch === ' ' ? ch : NOISE[(Math.random() * NOISE.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = text;
  })(start);
}

/** A short inverse-video flash on a node that already exists. */
export function flash(el) {
  if (!el || reduced) return;
  el.classList.add('inv');
  setTimeout(() => el.classList.remove('inv'), 140);
}

/** Terminal log: latest line at the bottom, oldest falls off the top. */
export function log(text) {
  const wrap = document.getElementById('log');
  if (!wrap) return;
  const p = document.createElement('p');
  p.textContent = '> ' + text;
  wrap.appendChild(p);
  while (wrap.children.length > 5) wrap.removeChild(wrap.firstChild);
  setTimeout(() => {
    p.classList.add('out');
    setTimeout(() => p.remove(), 420);
  }, 3600);
}
