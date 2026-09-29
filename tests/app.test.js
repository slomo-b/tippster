import { describe, test, expect } from 'vitest';
import { weakKeys, starsFor, genText } from '../src/js/stats.js';
import { LESSONS } from '../src/js/lessons.js';

describe('weakKeys', () => {
  test('erkennt >12% Fehler', () => {
    expect(weakKeys({ e: { tot: 10, err: 3 } })).toContain('e');
  });
  test('ignoriert wenige Samples', () => {
    expect(weakKeys({ e: { tot: 3, err: 3 } })).not.toContain('e');
  });
});
describe('starsFor', () => {
  test('1-3 Sterne nach Accuracy/WPM', () => {
    expect(starsFor(80, 5)).toBe(1);
    expect(starsFor(92, 8)).toBe(2);
    expect(starsFor(97, 15)).toBe(3);
  });
});
describe('genText', () => {
  test('Lektion 0 nutzt nur f/j', () => {
    const t = genText(0, LESSONS, {});
    expect(t.split('').every(c => 'fj '.includes(c) || LESSONS[0].words.join(' ').includes(c))).toBe(true);
  });
  test('Final-Boss (keys=all) nutzt die Satzliste, nicht Zufall', () => {
    const bossIndex = LESSONS.findIndex(l => l.keys === 'all');
    const t = genText(bossIndex, LESSONS, {});
    expect(LESSONS[bossIndex].words.some(w => t.includes(w))).toBe(true);
  });
});
