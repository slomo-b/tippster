// C2: Tages-Challenge (deterministisch pro Datum) + Ghost-Race gegen den Bestwert.
export function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function dailySeed(dateStr) { return hashString('tippster-daily-' + dateStr); }

// Gleicher Text für alle am selben Tag — keine Math.random-Abhängigkeit.
export function dailyText(dateStr, words, count = 45) {
  if (!words || !words.length) return '';
  const rnd = mulberry32(dailySeed(dateStr));
  const out = [];
  for (let i = 0; i < count; i++) out.push(words[Math.floor(rnd() * words.length)]);
  return out.join(' ');
}

// Fortschritt (0..1) eines Ghosts, der mit bestWpm tippt.
export function ghostProgress(elapsedMs, bestWpm, targetLen) {
  if (!bestWpm || !targetLen) return 0;
  const chars = bestWpm * 5 * (elapsedMs / 60000);
  return Math.max(0, Math.min(1, chars / targetLen));
}
