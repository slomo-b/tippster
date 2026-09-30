import { describe, test, expect } from 'vitest';
import { weakKeys, starsFor, genText, clampWpm, MAX_WPM } from '../src/js/stats.js';
import { LESSONS } from '../src/js/lessons.js';

describe('weakKeys', () => {
  test('detects >12% errors', () => {
    expect(weakKeys({ e: { tot: 10, err: 3 } })).toContain('e');
  });
  test('ignores keys with too few samples', () => {
    expect(weakKeys({ e: { tot: 3, err: 3 } })).not.toContain('e');
  });
});
describe('starsFor', () => {
  test('awards 1-3 stars by accuracy/WPM', () => {
    expect(starsFor(80, 5)).toBe(1);
    expect(starsFor(92, 8)).toBe(2);
    expect(starsFor(97, 15)).toBe(3);
  });
});
describe('clampWpm', () => {
  test('caps unrealistic values', () => {
    expect(clampWpm(840)).toBe(MAX_WPM);
    expect(clampWpm(60)).toBe(60);
  });
  test('handles garbage input', () => {
    expect(clampWpm(-5)).toBe(0);
    expect(clampWpm(NaN)).toBe(0);
    expect(clampWpm(Infinity)).toBe(MAX_WPM);
  });
  test('rounds', () => { expect(clampWpm(41.6)).toBe(42); });
});

describe('genText', () => {
  test('lesson 0 uses only f/j', () => {
    const t = genText(0, LESSONS, {});
    expect(t.split('').every(c => 'fj '.includes(c) || LESSONS[0].words.join(' ').includes(c))).toBe(true);
  });
  test('final boss (keys=all) uses the sentence list, not random noise', () => {
    const bossIndex = LESSONS.findIndex(l => l.keys === 'all');
    const t = genText(bossIndex, LESSONS, {});
    expect(LESSONS[bossIndex].words.some(w => t.includes(w))).toBe(true);
  });
});
