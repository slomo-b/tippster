import confetti from 'canvas-confetti';
import gsap from 'gsap';
export { confetti, gsap };

// M4: Nutzerwunsch "weniger Bewegung" respektieren.
const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export { REDUCED };

export function levelUpBurst() {
  if (REDUCED) return;
  confetti({ particleCount: 140, spread: 80, origin: { y: .6 } });
  setTimeout(() => confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0 } }), 250);
  setTimeout(() => confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1 } }), 400);
}
export function comboFx(combo) {
  const el = document.getElementById('combo');
  if (!el || combo < 10) return;
  el.textContent = `🔥 COMBO x${combo}!`;
  el.style.opacity = 1;
  if (REDUCED) { gsap.to(el, { opacity: 0, duration: .6, delay: .4 }); return; }
  gsap.killTweensOf(el);
  gsap.fromTo(el, { scale: .5 }, { scale: combo % 25 === 0 ? 1.5 : 1.15, duration: .18, ease: 'back.out(3)' });
  gsap.to(el, { opacity: 0, duration: .4, delay: .6 });
  if (combo % 25 === 0) confetti({ particleCount: 60, spread: 70, origin: { y: .4 } });
}
export function tweenXP(pct) {
  if (REDUCED) { const b = document.querySelector('#xpFill'); if (b) b.style.width = pct + '%'; return; }
  gsap.to('#xpFill', { width: pct + '%', duration: .5 });
}
export function popKeyEl(el, ok) {
  if (!REDUCED) gsap.fromTo(el, { scale: 1 }, { scale: 1.28, duration: .07, yoyo: true, repeat: 1 });
  el.classList.remove('hit', 'miss'); void el.offsetWidth; el.classList.add(ok ? 'hit' : 'miss');
  setTimeout(() => el.classList.remove('hit', 'miss'), 220);
}
