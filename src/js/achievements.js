// C1: Achievements V2 — 23 Badges in 6 Gruppen, reine Prüf-Funktionen (testbar).
export const ACHIEVEMENTS = [
  // Tempo
  { id: 'w20', label: '🐢 20 WPM', group: 'Tempo', check: c => c.wpm >= 20 },
  { id: 'w30', label: '🚶 30 WPM', group: 'Tempo', check: c => c.wpm >= 30 },
  { id: 'w40', label: '⚡ 40 WPM', group: 'Tempo', check: c => c.wpm >= 40 },
  { id: 'w60', label: '🥷 60 WPM Ninja', group: 'Tempo', check: c => c.wpm >= 60 },
  { id: 'w80', label: '🚀 80 WPM Rakete', group: 'Tempo', check: c => c.wpm >= 80 },
  { id: 'w100', label: '👽 100 WPM Alien', group: 'Tempo', check: c => c.wpm >= 100 },
  // Präzision
  { id: 'a90', label: '🎯 90 % sauber', group: 'Präzision', check: c => c.acc >= 90 },
  { id: 'a95', label: '🎯 95 % Präzision', group: 'Präzision', check: c => c.acc >= 95 },
  { id: 'a98', label: '🔬 98 % Chirurg', group: 'Präzision', check: c => c.acc >= 98 },
  { id: 'flawless', label: '💎 Fehlerfrei (40+ Zeichen)', group: 'Präzision', check: c => c.acc === 100 && c.hits >= 40 },
  // Combo
  { id: 'c25', label: '🔥 Combo x25', group: 'Combo', check: c => c.maxCombo >= 25 },
  { id: 'c50', label: '☄️ Combo x50', group: 'Combo', check: c => c.maxCombo >= 50 },
  { id: 'c100', label: '💥 Combo x100', group: 'Combo', check: c => c.maxCombo >= 100 },
  // Streak
  { id: 's3', label: '🔥 3-Tage-Streak', group: 'Streak', check: c => c.streak >= 3 },
  { id: 's7', label: '🏆 7-Tage-Streak', group: 'Streak', check: c => c.streak >= 7 },
  { id: 's30', label: '🗓️ 30-Tage-Streak', group: 'Streak', check: c => c.streak >= 30 },
  // Fortschritt
  { id: 'boss1', label: '👑 Erster Boss', group: 'Fortschritt', check: c => c.isBoss },
  { id: 'bossAll', label: '🏰 Alle Bosse besiegt', group: 'Fortschritt', check: c => c.bossTotal > 0 && c.bossesDone >= c.bossTotal },
  { id: 'lesson6', label: '📗 Grundreihe gemeistert', group: 'Fortschritt', check: c => c.lessonsDone >= 6 },
  { id: 'course', label: '🎓 Kurs komplett', group: 'Fortschritt', check: c => c.lessonTotal > 0 && c.lessonsDone >= c.lessonTotal },
  // Besonders
  { id: 'night', label: '🦉 Nachteule (23–4 Uhr)', group: 'Besonders', check: c => c.hour >= 23 || c.hour < 4 },
  { id: 'early', label: '🌅 Frühaufsteher (5–7 Uhr)', group: 'Besonders', check: c => c.hour >= 5 && c.hour < 7 },
  { id: 'stars9', label: '🌟 9 Sterne gesammelt', group: 'Besonders', check: c => c.stars >= 9 },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;

// Liefert die neu freigeschalteten Achievements (nicht die schon bekannten).
export function evaluate(ctx, unlocked = []) {
  const known = new Set(unlocked);
  return ACHIEVEMENTS.filter(a => !known.has(a.id) && a.check(ctx));
}

// Kontext aus einem abgeschlossenen Durchlauf bauen.
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
