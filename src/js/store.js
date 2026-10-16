const KEY = 'tippster_v1';
const store = (typeof localStorage !== 'undefined') ? localStorage : null;

// One shared state object. Two modules each holding their own copy of the state means
// whichever saves last wins — which silently reverted a user's setting on every keystroke.
let CURRENT = null;
// True exactly when a stored record existed but could not be parsed — main.js surfaces
// this so the reset is honest instead of silent.
let RECOVERED = false;
export const stateRecovered = () => CURRENT !== null && RECOVERED;

// A corrupt record must never stop the app from booting: without containment the
// failure happens at module load, before any button exists — only DevTools inside
// the installed app could recover it.
export function safeParse(raw) {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : null;
  } catch (e) { return null; }
}
const isObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
const collect = v => isObject(v) ? v : {};
const list = v => Array.isArray(v) ? v : [];
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v)) ? v : d;

// Import contract: every collection this app writes must have its real type here.
// Without the checks an imported `{ keyStats: "x" }` would brick the app the same way.
export function isValidBackup(d) {
  return isObject(d)
    && isObject(d.keyStats)
    && isObject(d.lessonStars)
    && Array.isArray(d.badges)
    && Array.isArray(d.history)
    && (d.xp === undefined || typeof d.xp === 'number')
    && (d.stars === undefined || typeof d.stars === 'number')
    && (d.unlocked === undefined || typeof d.unlocked === 'number')
    && (d.sound === undefined || typeof d.sound === 'boolean');
}
export const STATE_VERSION = 2;

export function loadState() {
  if (CURRENT) return CURRENT;
  let raw = '{}';
  let hadData = false;
  try {
    raw = (store && store.getItem(KEY)) || '{}';
    hadData = !!store.getItem(KEY);
  } catch (e) { raw = '{}'; }
  const parsed = safeParse(raw);
  RECOVERED = hadData && !parsed;
  const S = parsed || {};
  Object.assign(S, {
    xp: num(S.xp, 0), stars: num(S.stars, 0),
    // Coerce every collection to its type: a string keyStats from a bad import
    // would otherwise throw in the migration loop below, at module load.
    unlocked: Math.max(1, Math.floor(num(S.unlocked, 1))),
    keyStats: collect(S.keyStats), badges: list(S.badges), history: list(S.history),
    lessonStars: collect(S.lessonStars),
    daily: collect(S.daily),
    streak: collect(S.streak),
    layout: S.layout === 'en' ? 'en' : 'de',
    sound: S.sound !== false,
    autoUpdate: S.autoUpdate !== false,
    v: num(S.v, STATE_VERSION)
  });
  if (typeof S.streak.count !== 'number') S.streak = { count: 0, last: '' };
  // Layout migration: lessonStars/unlocked used to live at the top level; with two
  // curricula they belong to the layout that earned them. Old records are parked as
  // the German progress — the English one starts clean. Top-level fields are then
  // always re-synced to the active layout, so main.js can keep reading them directly.
  const isLayoutProgress = p => isObject(p) && isObject(p.DE) && isObject(p.EN);
  if (!isLayoutProgress(S.progress)) {
    S.progress = { DE: { lessonStars: S.lessonStars, unlocked: S.unlocked }, EN: { lessonStars: {}, unlocked: 1 } };
  }
  // Daily state per layout too: a German ghost racing an English run would be a lie.
  if (!isObject(S.daily.de)) {
    const old = S.daily;
    S.daily = {
      de: { date: old.date || '', best: num(old.best, 0), last: num(old.last, 0) },
      en: { date: '', best: 0, last: 0 }
    };
  }
  const prog = S.progress[layoutKey(S.layout)];
  S.lessonStars = collect(prog.lessonStars);
  S.unlocked = Math.max(1, Math.floor(num(prog.unlocked, 1)));
  // Migration V1 -> V2: add the rolling window required by the adaptive engine
  for (const k of Object.keys(S.keyStats)) {
    const e = S.keyStats[k];
    if (!Array.isArray(e.recent)) e.recent = [];
    if (!Array.isArray(e.lat)) e.lat = [];
  }
  CURRENT = S;
  return CURRENT;
}
// The importer replaces the whole record and reloads; anything in memory is obsolete.
export function replaceState(next) {
  CURRENT = next;
  try { store && store.setItem(KEY, JSON.stringify(next)); } catch (e) {}
  return CURRENT;
}
export function saveState(S) { try { store && store.setItem(KEY, JSON.stringify(S || CURRENT || {})); } catch (e) {} }

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

/* ── two layouts, one user ──────────────────────────────────── */
export const layoutKey = l => l === 'en' ? 'EN' : 'DE';

// Switch layouts: park the active layout's progress on it, then load the target's
// into the top-level fields the rest of the app reads. Lesson stars, unlocking and
// the daily ghost are per layout; XP, stars, streak, badges and key stats are shared
// (they belong to the physical keys, not to a curriculum).
export function switchLayout(S, to) {
  if ((to !== 'en' && to !== 'de') || to === S.layout) return false;
  S.progress[layoutKey(S.layout)] = { lessonStars: S.lessonStars, unlocked: S.unlocked };
  S.layout = to;
  const key = layoutKey(to);
  if (!isObject(S.progress[key])) S.progress[key] = { lessonStars: {}, unlocked: 1 };
  const p = S.progress[key];
  S.lessonStars = collect(p.lessonStars);
  S.unlocked = Math.max(1, Math.floor(num(p.unlocked, 1)));
  return true;
}

// Today's daily challenge entry for the active layout.
export function dailyFor(S) {
  return S.daily[S.layout] || (S.daily[S.layout] = { date: '', best: 0, last: 0 });
}

