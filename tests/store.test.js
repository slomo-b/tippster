import { describe, test, expect } from 'vitest';
import { localDay, dayBefore, touchStreak, unlockFor, resumeLesson, loadState } from '../src/js/store.js';

describe('localDay', () => {
  test('nutzt lokale Zeit, nicht UTC', () => {
    // 29.09.2026 00:30 lokal -> muss 2026-09-29 sein (UTC wäre 28.)
    expect(localDay(new Date(2026, 8, 29, 0, 30))).toBe('2026-09-29');
  });
  test('Monat/Tag zweistellig', () => {
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('dayBefore', () => {
  test('Monatsgrenze', () => { expect(dayBefore('2026-03-01')).toBe('2026-02-28'); });
  test('Schaltjahr', () => { expect(dayBefore('2024-03-01')).toBe('2024-02-29'); });
});

describe('touchStreak', () => {
  const base = () => ({ streak: { count: 0, last: '' } });
  test('gleicher Tag ändert nichts', () => {
    const S = { streak: { count: 5, last: '2026-09-29' } };
    touchStreak(S, new Date(2026, 8, 29, 0, 30));
    expect(S.streak.count).toBe(5);
  });
  test('Folgetag erhöht', () => {
    const S = { streak: { count: 5, last: '2026-09-28' } };
    touchStreak(S, new Date(2026, 8, 29, 0, 30));
    expect(S.streak.count).toBe(6);
    expect(S.streak.last).toBe('2026-09-29');
  });
  test('Lücke setzt auf 1', () => {
    const S = { streak: { count: 9, last: '2026-09-20' } };
    touchStreak(S, new Date(2026, 8, 29, 8, 0));
    expect(S.streak.count).toBe(1);
  });
  test('nachts um 00:30 wird der Tag trotzdem gezählt', () => {
    const S = { streak: { count: 3, last: '2026-09-28' } };
    touchStreak(S, new Date(2026, 8, 29, 0, 30));
    expect(S.streak.count).toBe(4);
  });
});

describe('unlockFor / resumeLesson', () => {
  test('Abschluss L1 (index0) schaltet L2 frei', () => {
    expect(unlockFor(0, 1, 12)).toBe(2);
  });
  test('Skip von L1 sperrt L2 nicht', () => {
    expect(unlockFor(0, 1, 12)).toBe(2);
  });
  test('sinkt nie unter bisherigen Stand', () => {
    expect(unlockFor(0, 7, 12)).toBe(7);
  });
  test('letzte Lektion überschreitet Gesamtzahl nicht', () => {
    expect(unlockFor(11, 12, 12)).toBe(12);
  });
  test('resume startet bei letzter freigeschalteter Lektion', () => {
    expect(resumeLesson(1, 12)).toBe(0);
    expect(resumeLesson(5, 12)).toBe(4);
    expect(resumeLesson(99, 12)).toBe(11);
  });
});

describe('loadState Migration', () => {
  test('lessonStars wird nachgerüstet', () => {
    const S = loadState();
    expect(S.lessonStars).toBeTypeOf('object');
  });
});
