import { describe, test, expect } from 'vitest';
import { dailyText, dailySeed, mulberry32, hashString, ghostProgress } from '../src/js/daily.js';

const WORDS = 'der und die das mit sich auf ist ein eine'.split(' ');

describe('Determinism', () => {
  test('same date -> same text', () => {
    expect(dailyText('2026-09-30', WORDS)).toBe(dailyText('2026-09-30', WORDS));
  });
  test('different date -> different text', () => {
    expect(dailyText('2026-09-30', WORDS)).not.toBe(dailyText('2026-10-01', WORDS));
  });
  test('mulberry32 yields a reproducible sequence', () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  test('values stay within [0,1)', () => {
    const r = mulberry32(dailySeed('2026-09-30'));
    for (let i = 0; i < 200; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
  test('hashString is stable', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
});

describe('dailyText', () => {
  test('uses only words from the list', () => {
    const t = dailyText('2026-09-30', WORDS);
    expect(t.split(' ').every(w => WORDS.includes(w))).toBe(true);
  });
  test('empty word list -> empty text', () => {
    expect(dailyText('2026-09-30', [])).toBe('');
  });
});

describe('ghostProgress', () => {
  test('0 without a best value or target length', () => {
    expect(ghostProgress(1000, 0, 100)).toBe(0);
    expect(ghostProgress(1000, 50, 0)).toBe(0);
  });
  test('grows over time and caps at 1', () => {
    const early = ghostProgress(5000, 60, 300);
    const later = ghostProgress(20000, 60, 300);
    expect(later).toBeGreaterThan(early);
    expect(ghostProgress(10_000_000, 60, 300)).toBe(1);
  });
  test('a faster ghost is further ahead', () => {
    expect(ghostProgress(10000, 80, 400)).toBeGreaterThan(ghostProgress(10000, 40, 400));
  });
});
