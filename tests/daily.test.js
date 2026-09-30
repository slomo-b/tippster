import { describe, test, expect } from 'vitest';
import { dailyText, dailySeed, mulberry32, hashString, ghostProgress } from '../src/js/daily.js';

const WORDS = 'der und die das mit sich auf ist ein eine'.split(' ');

describe('Determinismus', () => {
  test('gleiches Datum -> gleicher Text', () => {
    expect(dailyText('2026-09-30', WORDS)).toBe(dailyText('2026-09-30', WORDS));
  });
  test('anderes Datum -> anderer Text', () => {
    expect(dailyText('2026-09-30', WORDS)).not.toBe(dailyText('2026-10-01', WORDS));
  });
  test('mulberry32 liefert reproduzierbare Folge', () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  test('Werte liegen in [0,1)', () => {
    const r = mulberry32(dailySeed('2026-09-30'));
    for (let i = 0; i < 200; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
  test('hashString ist stabil', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
});

describe('dailyText', () => {
  test('nutzt nur Wörter aus der Liste', () => {
    const t = dailyText('2026-09-30', WORDS);
    expect(t.split(' ').every(w => WORDS.includes(w))).toBe(true);
  });
  test('leere Wortliste -> leerer Text', () => {
    expect(dailyText('2026-09-30', [])).toBe('');
  });
});

describe('ghostProgress', () => {
  test('0 ohne Bestwert oder Länge', () => {
    expect(ghostProgress(1000, 0, 100)).toBe(0);
    expect(ghostProgress(1000, 50, 0)).toBe(0);
  });
  test('wächst mit der Zeit und ist bei 1 gedeckelt', () => {
    const early = ghostProgress(5000, 60, 300);
    const later = ghostProgress(20000, 60, 300);
    expect(later).toBeGreaterThan(early);
    expect(ghostProgress(10_000_000, 60, 300)).toBe(1);
  });
  test('schnellerer Ghost ist weiter', () => {
    expect(ghostProgress(10000, 80, 400)).toBeGreaterThan(ghostProgress(10000, 40, 400));
  });
});
