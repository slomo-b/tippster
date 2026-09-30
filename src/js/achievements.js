// C1: Achievements V2 — 23 badges in 6 groups, pure predicate functions (testable).
export const ACHIEVEMENTS = [
  // Speed
  { id: 'w20', label: '20 words/min', group: 'Speed', check: c => c.wpm >= 20 },
  { id: 'w30', label: '30 words/min', group: 'Speed', check: c => c.wpm >= 30 },
  { id: 'w40', label: '40 words/min', group: 'Speed', check: c => c.wpm >= 40 },
  { id: 'w60', label: '60 words/min', group: 'Speed', check: c => c.wpm >= 60 },
  { id: 'w80', label: '80 words/min', group: 'Speed', check: c => c.wpm >= 80 },
  { id: 'w100', label: '100 words/min', group: 'Speed', check: c => c.wpm >= 100 },
  // Accuracy
  { id: 'a90', label: '90 % clean', group: 'Accuracy', check: c => c.acc >= 90 },
  { id: 'a95', label: '95 % accuracy', group: 'Accuracy', check: c => c.acc >= 95 },
  { id: 'a98', label: '98 % surgeon', group: 'Accuracy', check: c => c.acc >= 98 },
  { id: 'flawless', label: 'Flawless line', group: 'Accuracy', check: c => c.acc === 100 && c.hits >= 40 },
  // Combo
  { id: 'c25', label: 'Combo x25', group: 'Combo', check: c => c.maxCombo >= 25 },
  { id: 'c50', label: 'Combo x50', group: 'Combo', check: c => c.maxCombo >= 50 },
  { id: 'c100', label: 'Combo x100', group: 'Combo', check: c => c.maxCombo >= 100 },
  // Streak
  { id: 's3', label: '3-day streak', group: 'Streak', check: c => c.streak >= 3 },
  { id: 's7', label: '7-day streak', group: 'Streak', check: c => c.streak >= 7 },
  { id: 's30', label: '30-day streak', group: 'Streak', check: c => c.streak >= 30 },
  // Progress
  { id: 'boss1', label: 'First boss down', group: 'Progress', check: c => c.isBoss },
  { id: 'bossAll', label: 'Every boss beaten', group: 'Progress', check: c => c.bossTotal > 0 && c.bossesDone >= c.bossTotal },
  { id: 'lesson6', label: 'Home row mastered', group: 'Progress', check: c => c.lessonsDone >= 6 },
  { id: 'course', label: 'Course complete', group: 'Progress', check: c => c.lessonTotal > 0 && c.lessonsDone >= c.lessonTotal },
  // Special
  { id: 'night', label: 'Night shift', group: 'Special', check: c => c.hour >= 23 || c.hour < 4 },
  { id: 'early', label: 'Early bird', group: 'Special', check: c => c.hour >= 5 && c.hour < 7 },
  { id: 'stars9', label: '9 stars collected', group: 'Special', check: c => c.stars >= 9 },
];

// Group -> drawn icon, one stroke weight across the whole set.
export const GROUP_ICON = {
  Speed: '#i-free', Accuracy: '#i-target', Combo: '#i-flame',
  Streak: '#i-trophy', Progress: '#i-learn', Special: '#i-star',
};

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;

// Rest of the new unlocked achievements (excludes ones already known).
export function evaluate(ctx, unlocked = []) {
  const known = new Set(unlocked);
  return ACHIEVEMENTS.filter(a => !known.has(a.id) && a.check(ctx));
}

// Build the context from a finished run.
export function buildContext(o) {
  return {
    wpm: o.wpm || 0,
    acc: o.acc || 0,
    maxCombo: o.maxCombo || 0,
    hits: o.hits || 0,
    streak: o.streak || 0,
    stars: o.stars || 0,
    isBoss: !!o.isBoss,
    hour: o.hour == null ? new Date().getHours() : o.hour,
    lessonsDone: o.lessonsDone || 0,
    lessonTotal: o.lessonTotal || 0,
    bossesDone: o.bossesDone || 0,
    bossTotal: o.bossTotal || 0,
  };
}
