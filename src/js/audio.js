let AC = null;
export function tone(S, f = 660, d = .07, type = 'square', v = .04) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = v;
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d);
  } catch (e) {}
}
export const sHit = (S) => tone(S, 660, .06, 'square', .03);
export const sErr = (S) => tone(S, 150, .18, 'sawtooth', .05);
export const sLvl = (S) => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(S, f, .14, 'square', .05), i * 95));
