let AC = null;
function ctx() {
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  return AC;
}
export function tone(S, f = 660, d = .07, type = 'square', v = .04) {
  if (!S.sound) return;
  try {
    const a = ctx();
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = v;
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + d);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + d);
  } catch (e) {}
}

/** The board's own voice: a short filtered noise burst — a flap striking. */
export function clack(S, freq = 1600, gain = .05, ms = 34) {
  if (!S.sound) return;
  try {
    const a = ctx();
    const n = Math.max(1, Math.floor(a.sampleRate * (ms / 1000)));
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(); src.buffer = buf;
    const bp = a.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = freq; bp.Q.value = 1.1;
    const g = a.createGain(); g.gain.value = gain;
    src.connect(bp).connect(g).connect(a.destination);
    src.start();
  } catch (e) {}
}
export const sHit = (S) => clack(S, 1750, .045, 30);
export const sErr = (S) => clack(S, 340, .07, 60);
export const sLvl = (S) => {
  [0, 1, 2, 3, 4, 5].forEach(i => setTimeout(() => clack(S, 1300 + i * 120, .05, 28), i * 55));
};
