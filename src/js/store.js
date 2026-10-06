const KEY = 'tippster_v1';
const store = (typeof localStorage !== 'undefined') ? localStorage : null;
export function loadState() {
  let raw = '{}';
  try { raw = (store && store.getItem(KEY)) || '{}'; } catch (e) { raw = '{}'; }
  const S = JSON.parse(raw);
  Object.assign(S, {
    xp: S.xp || 0, stars: S.stars || 0, unlocked: S.unlocked || 1,
    keyStats: S.keyStats || {}, badges: S.badges || [], history: S.history || [],
    lessonStars: S.lessonStars || {},
    daily: S.daily || { date: '', best: 0, last: 0 },
    streak: S.streak || { count: 0, last: '' }, sound: S.sound !== false,
    autoUpdate: S.autoUpdate === true
  });
  // Migration V1 -> V2: add the rolling window required by the adaptive engine
  for (const k of Object.keys(S.keyStats)) {
    const e = S.keyStats[k];
    if (!Array.isArray(e.recent)) e.recent = [];
    if (!Array.isArray(e.lat)) e.lat = [];
  }
  return S;
}
export function saveState(S) { try { store && store.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

// Local date (not UTC!) — otherwise the streak day flips during the night.
export function localDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function dayBefore(dayStr) {
  const [y, m, d] = dayStr.split('-').map(Number);
  return localDay(new Date(y, m - 1, d - 1));
}
export function touchStreak(S, now = new Date()) {
  const t = localDay(now);
  if (S.streak.last !== t) {
    const y = dayBefore(t);
    S.streak.count = (S.streak.last === y) ? S.streak.count + 1 : 1;
    S.streak.last = t;
  }
}
export function levelFor(xp) { return 1 + Math.floor(xp / 150); }

// Finishing or skipping lesson `cur` unlocks the next two,
// never less than before, never beyond the total.
export function unlockFor(cur, unlocked, total) {
  return Math.max(unlocked, Math.min(cur + 2, total));
}
// Lesson the app starts with (the last unlocked one), not always 0.
export function resumeLesson(unlocked, total) {
  return Math.max(0, Math.min(unlocked - 1, total - 1));
}

