// The board's mechanics: flap turns, the cascade, the log, the counter wheels.
const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export { REDUCED };

/** Turn one flap cell over to `ch`. One cell turns per keystroke. */
export function flipCell(cell, ch) {
  if (!cell) return;
  const top = cell.querySelector('.top span');
  const bot = cell.querySelector('.bot span');
  if (top) top.textContent = ch;
  if (bot) bot.textContent = ch;
  if (REDUCED) return;
  cell.classList.remove('turn');
  void cell.offsetWidth;
  cell.classList.add('turn');
  cell.addEventListener('animationend', () => cell.classList.remove('turn'), { once: true });
}

/** The memorable moment: the whole board turns over, leaf after leaf. */
export function cascade(cells, step = 16) {
  if (REDUCED) return;
  const last = cells[cells.length - 1];
  let blocked = false;
  cells.forEach((c, i) => {
    setTimeout(() => {
      if (blocked) return;
      c.classList.remove('turn');
      void c.offsetWidth;
      c.classList.add('turn');
      if (c === last) setTimeout(() => { blocked = true; }, 240);
    }, i * step);
  });
}

/** A line in the operations log (toasts live on the board's bottom right). */
export function log(html, icon = '#i-lamp') {
  const wrap = document.getElementById('log');
  if (!wrap) return;
  const p = document.createElement('p');
  p.innerHTML = `<svg><use href="${icon}"/></svg><span>${html}</span>`;
  wrap.appendChild(p);
  while (wrap.children.length > 4) wrap.removeChild(wrap.firstChild);
  setTimeout(() => {
    p.classList.add('out');
    setTimeout(() => p.remove(), 400);
  }, 3400);
}

/** Level change announced across the board rail. */
export function banner(level) {
  const el = document.getElementById('banner');
  const t = document.getElementById('bannerLvl');
  if (!el || !t) return;
  t.textContent = `Level ${level}`;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 1900);
}

/** Counter wheels: a value that changes gets a brief mark, never a bounce. */
export function markCounter(el) {
  if (!el) return;
  el.classList.add('is-live');
  setTimeout(() => el.classList.remove('is-live'), 220);
}
