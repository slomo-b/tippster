import { describe, test, expect } from 'vitest';
import { FINGER, FCOL, FNAME, ROWS, LESSONS } from '../src/js/lessons.js';

describe('Keyboard mapping', () => {
  test('every key in the rows has a finger', () => {
    const missing = ROWS.flat().filter(c => !FINGER[c]);
    expect(missing).toEqual([]);
  });
  test('digits map to the correct fingers', () => {
    expect(FINGER['1']).toBe('lk');
    expect(FINGER['5']).toBe('li');
    expect(FINGER['6']).toBe('ri');
    expect(FINGER['0']).toBe('rk');
  });
  test('every finger has a color and a name', () => {
    for (const f of Object.values(FINGER)) {
      expect(FCOL[f], `color for ${f}`).toBeTruthy();
      expect(FNAME[f], `name for ${f}`).toBeTruthy();
    }
  });
});

describe('Lessons', () => {
  test('at least one boss with keys=all exists', () => {
    expect(LESSONS.some(l => l.keys === 'all')).toBe(true);
  });
  test('every lesson has a title, description and words', () => {
    for (const l of LESSONS) {
      expect(l.t).toBeTruthy(); expect(l.d).toBeTruthy();
      expect(Array.isArray(l.words) && l.words.length > 0).toBe(true);
    }
  });
});
