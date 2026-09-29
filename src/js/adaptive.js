// Adaptive Engine V2 (Keybr-like): rolling stats pro Taste + Ziel-Prognose.
export const GOAL = { accuracy: 0.95, latencyMs: 400, minSamples: 20, window: 30 };
export const BOOST_FACTOR = 4;

export function ensureEntry(keyStats, key) {
  let e = keyStats[key];
  if (!e || typeof e.tot !== 'number') { e = { tot: 0, err: 0, recent: [], lat: [] }; keyStats[key] = e; }
  if (!Array.isArray(e.recent)) e.recent = [];
  if (!Array.isArray(e.lat)) e.lat = [];
  return e;
}

export function recordKeystroke(keyStats, key, ok, latencyMs = null) {
  const e = ensureEntry(keyStats, key);
  e.tot++;
  if (!ok) e.err++;
  e.recent.push(ok ? 1 : 0);
  if (e.recent.length > GOAL.window) e.recent.shift();
  if (latencyMs != null && latencyMs >= 0 && latencyMs < 5000) {
    e.lat.push(Math.round(latencyMs));
    if (e.lat.length > GOAL.window) e.lat.shift();
  }
  return e;
}

export function rollingAcc(e) {
  if (!e || !Array.isArray(e.recent) || !e.recent.length) return e && e.tot > 0 ? 1 - e.err / e.tot : 1;
  return e.recent.reduce((a, b) => a + b, 0) / e.recent.length;
}

export function avgLatency(e) {
  if (!e || !Array.isArray(e.lat) || !e.lat.length) return null;
  return e.lat.reduce((a, b) => a + b, 0) / e.lat.length;
}

export function isMastered(e) {
  if (!e || e.tot < GOAL.minSamples) return false;
  return rollingAcc(e) >= GOAL.accuracy && (avgLatency(e) == null || avgLatency(e) <= GOAL.latencyMs);
}

// Score: Fehlerquote zuerst (rolling), bei Gleichstand langsamere Taste zuerst.
export function weakestKeys(keyStats, n = 3) {
  return Object.entries(keyStats)
    .filter(([, v]) => v.tot > 4)
    .map(([k, v]) => ({ key: k, errRate: 1 - rollingAcc(v), lat: avgLatency(v) ?? 0 }))
    .filter(x => x.errRate > 1 - GOAL.accuracy + 0.07) // > ~12% Fehler
    .sort((a, b) => (b.errRate - a.errRate) || (b.lat - a.lat))
    .slice(0, n).map(x => x.key);
}

export function buildWeightedPool(pool, weak, factor = BOOST_FACTOR) {
  return pool + weak.join('').repeat(factor);
}

// Prognose: grob 2 Lektionen pro nicht-gemeisterter Taste im aktiven Set.
export function lessonsToGoal(keyStats, lessonKeys) {
  const keys = lessonKeys === 'all'
    ? Object.keys(keyStats)
    : [...new Set(lessonKeys.replace(/ /g, '').split(''))];
  const open = keys.filter(k => !isMastered(keyStats[k]));
  if (!open.length) return 0;
  return Math.max(1, open.length * 2 - Math.floor(keys.filter(k => isMastered(keyStats[k])).length / 2));
}
