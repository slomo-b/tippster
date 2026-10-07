import { describe, test, expect } from 'vitest';
import { localDay, dayBefore, touchStreak, unlockFor, resumeLesson, loadState, replaceState } from '../src/js/store.js';

describe('localDay', () => {
  test('uses local time, not UTC', () => {
    // 29 Sep 2026 00:30 local -> must be 2026-09-29 (UTC would be the 28th)
    expect(localDay(new Date(2026, 8, 29, 0, 30))).toBe('2026-09-29');
  });
  test('month and day are zero-padded', () => {
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('dayBefore', () => {
  test('month boundary', () => { expect(dayBefore('2026-03-01')).toBe('2026-02-28'); });
  test('leap year', () => { expect(dayBefore('2024-03-01')).toBe('2024-02-29'); });
});

describe('touchStreak', () => {
  test('same day changes nothing', () => {
    const S = { streak: { count: 5, last: '2026-09-29' } };
    touchStreak(S, new Date(2026, 8, 29, 0, 30));
    expect(S.streak.count).toBe(5);
  });
  test('the next day increments', () => {
    const S = { streak: { count: 5, last: '2026-09-28' } };
    touchStreak(S, new Date(2026, 8, 29, 0, 30));
    expect(S.streak.count).toBe(6);
    expect(S.streak.last).toBe('2026-09-29');
  });
  test('a gap resets to 1', () => {
    const S = { streak: { count: 9, last: '2026-09-20' } };
    touchStreak(S, new Date(2026, 8, 29, 8, 0));
    expect(S.streak.count).toBe(1);
  });
  test('counts the day even at 00:30', () => {
    const S = { streak: { count: 3, last: '2026-09-28' } };
    touchStreak(S, new Date(2026, 8, 29, 0, 30));
    expect(S.streak.count).toBe(4);
  });
});

describe('unlockFor / resumeLesson', () => {
  test('finishing L1 (index 0) unlocks L2', () => {
    expect(unlockFor(0, 1, 12)).toBe(2);
  });
  test('skipping L1 does not lock L2', () => {
    expect(unlockFor(0, 1, 12)).toBe(2);
  });
  test('never drops below the current state', () => {
    expect(unlockFor(0, 7, 12)).toBe(7);
  });
  test('the last lesson does not exceed the total', () => {
    expect(unlockFor(11, 12, 12)).toBe(12);
  });
  test('resume starts at the last unlocked lesson', () => {
    expect(resumeLesson(1, 12)).toBe(0);
    expect(resumeLesson(5, 12)).toBe(4);
    expect(resumeLesson(99, 12)).toBe(11);
  });
});

describe('loadState migration', () => {
  test('lessonStars is backfilled', () => {
    const S = loadState();
    expect(S.lessonStars).toBeTypeOf('object');
  });
});

describe('shared state', () => {
  // Two modules each holding their own copy meant the last save won, which silently
  // reverted a setting (auto-update) on the next keystroke.
  test('every caller gets the same object', () => {
    expect(loadState()).toBe(loadState());
  });
  test('replaceState swaps the shared object', () => {
    const before = loadState();
    const next = replaceState({ ...before, autoUpdate: false });
    expect(loadState()).toBe(next);
    expect(loadState().autoUpdate).toBe(false);
    replaceState({ ...next, autoUpdate: true });
  });
  test('a write through one reference is visible through another', () => {
    const a = loadState();
    const b = loadState();
    a.sound = false;
    expect(b.sound).toBe(false);
    a.sound = true;
  });
});
