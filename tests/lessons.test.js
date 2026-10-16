import { describe, test, expect } from 'vitest';
import { LAYOUTS, forLayout, FCOL, FNAME } from '../src/js/lessons.js';

describe('Keyboard mapping (per layout)', () => {
  for (const [id, L] of Object.entries(LAYOUTS)) {
    test(`[${id}] every key in the rows has a finger`, () => {
      const missing = L.rows.flat().filter(c => !L.finger[c]);
      expect(missing).toEqual([]);
    });
    test(`[${id}] digits map to the correct fingers`, () => {
      expect(L.finger['1']).toBe('lk');
      expect(L.finger['5']).toBe('li');
      expect(L.finger['6']).toBe('ri');
      expect(L.finger['0']).toBe('rk');
    });
    test(`[${id}] every finger has a color and a name`, () => {
      for (const f of Object.values(L.finger)) {
        expect(FCOL[f], `color for ${f}`).toBeTruthy();
        expect(FNAME[f], `name for ${f}`).toBeTruthy();
      }
    });
  }
  test('forLayout is total and de is the default', () => {
    expect(forLayout('en')).toBe(LAYOUTS.en);
    expect(forLayout('de')).toBe(LAYOUTS.de);
    expect(forLayout('xx')).toBe(LAYOUTS.de);
    expect(forLayout()).toBe(LAYOUTS.de);
  });
});

describe('Curricula (per layout)', () => {
  for (const [id, L] of Object.entries(LAYOUTS)) {
    test(`[${id}] exactly one final boss with keys=all`, () => {
      expect(L.lessons.filter(l => l.keys === 'all').length).toBe(1);
      expect(L.lessons.some(l => l.keys === 'all')).toBe(true);
    });
    test(`[${id}] every lesson has a title, description and words`, () => {
      for (const l of L.lessons) {
        expect(l.t, `lesson ${l.keys}`).toBeTruthy();
        expect(l.d, `lesson ${l.keys}`).toBeTruthy();
        expect(Array.isArray(l.words), `lesson ${l.keys}`).toBe(true);
        expect(l.words.length, `lesson ${l.keys}`).toBeGreaterThan(0);
      }
    });
    // Letters must be typeable on that layout. Punctuation (! . ,) arrives via Shift
    // and the real bottom keys, so only letters are constrained here.
    test(`[${id}] drill words only use letters this layout can type`, () => {
      const set = new Set(L.rows.flat());
      const bad = [];
      for (const le of L.lessons) for (const w of le.words) for (const c of w.toLowerCase()) {
        if (/[a-zäöüß;]/.test(c) && !set.has(c)) bad.push(`${le.t}: "${w}" (${c})`);
      }
      expect(bad).toEqual([]);
    });
    test(`[${id}] the free corpus spells only letters this layout can type`, () => {
      const set = new Set(L.rows.flat());
      const bad = L.words.filter(w => [...w.toLowerCase()].some(c => /[a-zäöüß]/.test(c) && !set.has(c)));
      expect(bad).toEqual([]);
    });
  }
});
