// The live render: a full-bleed character grid where glyph density stands in for
// light. Nothing here is content — it is the screen's phosphor. Everything the
// learner must read is real DOM text on top of it.
const RAMP = ' .:-=+*#%@';           // light -> dense
const GHOST = [104, 74, 27];          // the faint phosphor this layer may use
const HOT = [232, 163, 61];           // densest glyphs, still the same single hue

export function createField(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cols = 0, rows = 0, cw = 14, ch = 20, dpr = 1;
  let t = 0, energy = 0, shock = 0;
  let ripples = [];
  let raf = null, last = 0, interval = 1000 / 30;
  let scrolling = false;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    cols = Math.ceil(w / cw);
    rows = Math.ceil(h / ch);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${Math.round(ch * 0.86)}px 'Sometype Mono', monospace`;
    ctx.textBaseline = 'top';
    if (reduced) draw();
  }

  /** A keystroke: a ring of light leaving the centre, briefly raising the floor. */
  function pulse(strength = 1) {
    ripples.push({ r: 0, a: 0.9 * strength });
    if (ripples.length > 6) ripples.shift();
    energy = Math.min(1, energy + 0.05 * strength);
  }

  /** A miss: the screen tears. */
  function tear() {
    shock = 1;
    ripples = [];
  }

  /** Combo drives the whole display. */
  function setEnergy(v) { energy = Math.max(0, Math.min(1, v)); }

  function field(x, y, time) {
    const nx = x / cols, ny = y / rows;
    let v =
      0.5 +
      0.5 * Math.sin(nx * 7.5 + time * 0.35) *
      Math.cos(ny * 5.2 - time * 0.27) +
      0.35 * Math.sin((nx + ny) * 3.1 + time * 0.19);
    return Math.max(0, Math.min(1, v * 0.5));
  }

  function draw() {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.fillStyle = `rgb(${GHOST[0] * 0.10 | 0},${GHOST[1] * 0.10 | 0},${GHOST[2] * 0.10 | 0})`;
    ctx.fillRect(0, 0, w, h);

    const cx = cols / 2, cy = rows / 2;
    const maxR = Math.hypot(cols, rows) * 0.75;
    let bucket = -1;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let v = field(x, y, t) * (0.30 + energy * 0.55);

        for (const rp of ripples) {
          const d = Math.hypot(x - cx, y - cy);
          const band = Math.abs(d - rp.r);
          if (band < 2.2) v += rp.a * (1 - band / 2.2) * 0.9;
          else if (d < rp.r) v += rp.a * 0.10 * (1 - d / maxR);
        }

        if (shock > 0) v += (Math.random() - 0.35) * shock * 0.7;

        if (v <= 0.055) continue;
        let idx = Math.min(RAMP.length - 1, 1 + Math.floor(v * (RAMP.length - 1)));
        const g = RAMP[idx];
        if (g === ' ') continue;

        const b = Math.min(3, Math.floor(idx / 2.6));
        if (b !== bucket) {
          bucket = b;
          const k = b / 3;
          const cr = (GHOST[0] + (HOT[0] - GHOST[0]) * k) | 0;
          const cg = (GHOST[1] + (HOT[1] - GHOST[1]) * k) | 0;
          const cb = (GHOST[2] + (HOT[2] - GHOST[2]) * k) | 0;
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        }
        ctx.fillText(g, x * cw, y * ch);
      }
    }
  }

  function step(dt) {
    t += dt * 0.001;
    energy *= 0.995;
    shock *= 0.86;
    if (shock < 0.02) shock = 0;
    ripples = ripples.filter(rp => { rp.r += dt * 0.028; rp.a *= 0.985; return rp.a > 0.03; });
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(64, now - last);
    if (dt < interval) return;
    const t0 = performance.now();
    last = now;
    step(dt);
    draw();
    const spent = performance.now() - t0;
    // adaptive: never fight the browser for frames
    interval = spent > 14 ? 1000 / 20 : spent > 8 ? 1000 / 26 : 1000 / 34;
  }

  resize();
  draw();                                  // never show a blank screen, even for one frame
  window.addEventListener('resize', resize);
  if (!reduced) raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (reduced) return;
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  });

  return {
    pulse, tear, setEnergy,
    /** A celebration sweep: dense glyphs rush across the grid. */
    bloom() {
      for (let i = 0; i < 5; i++) ripples.push({ r: i * 3, a: 0.8 });
      energy = 1;
    },
  };
}
