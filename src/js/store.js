const KEY = 'tippster_v1';
export function loadState() {
  const S = JSON.parse(localStorage.getItem(KEY) || '{}');
  Object.assign(S, {
    xp: S.xp || 0, stars: S.stars || 0, unlocked: S.unlocked || 1,
    keyStats: S.keyStats || {}, badges: S.badges || [], history: S.history || [],
    streak: S.streak || { count: 0, last: '' }, sound: S.sound !== false
  });
  return S;
}
export function saveState(S) { localStorage.setItem(KEY, JSON.stringify(S)); }
export function touchStreak(S) {
  const t = new Date().toISOString().slice(0, 10);
  if (S.streak.last !== t) {
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    S.streak.count = (S.streak.last === y) ? S.streak.count + 1 : 1;
    S.streak.last = t;
  }
}
export function levelFor(xp) { return 1 + Math.floor(xp / 150); }
