import { describe, test, expect } from 'vitest';
import { FINGER, FCOL, FNAME, ROWS, LESSONS } from '../src/js/lessons.js';

describe('Tastatur-Zuordnung', () => {
  test('alle Tasten der Reihen haben einen Finger', () => {
    const missing = ROWS.flat().filter(c => !FINGER[c]);
    expect(missing).toEqual([]);
  });
  test('Ziffern sind den richtigen Fingern zugeordnet', () => {
    expect(FINGER['1']).toBe('lk');
    expect(FINGER['5']).toBe('li');
    expect(FINGER['6']).toBe('ri');
    expect(FINGER['0']).toBe('rk');
  });
  test('jeder Finger hat Farbe und Namen', () => {
    for (const f of Object.values(FINGER)) {
      expect(FCOL[f], `Farbe für ${f}`).toBeTruthy();
      expect(FNAME[f], `Name für ${f}`).toBeTruthy();
    }
  });
});

describe('Lektionen', () => {
  test('mindestens ein Boss mit keys=all existiert', () => {
    expect(LESSONS.some(l => l.keys === 'all')).toBe(true);
  });
  test('jede Lektion hat Titel, Beschreibung und Wörter', () => {
    for (const l of LESSONS) {
      expect(l.t).toBeTruthy(); expect(l.d).toBeTruthy();
      expect(Array.isArray(l.words) && l.words.length > 0).toBe(true);
    }
  });
});
