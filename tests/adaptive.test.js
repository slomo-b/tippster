import { describe, test, expect } from 'vitest';
import { recordKeystroke, weakestKeys, buildWeightedPool, lessonsToGoal, rollingAcc, GOAL } from '../src/js/adaptive.js';

describe('recordKeystroke', () => {
  test('zählt tot/err und begrenzt Fenster auf 30', () => {
    const ks = {};
    for (let i = 0; i < 35; i++) recordKeystroke(ks, 'e', i % 2 === 0, 200);
    expect(ks.e.tot).toBe(35);
    expect(ks.e.recent.length).toBe(GOAL.window);
    expect(ks.e.lat.length).toBe(GOAL.window);
  });
  test('rolling accuracy aus letztem Fenster', () => {
    const ks = {};
    for (let i = 0; i < 10; i++) recordKeystroke(ks, 'a', true, 150);
    for (let i = 0; i < 10; i++) recordKeystroke(ks, 'a', false, 600);
    expect(rollingAcc(ks.a)).toBeCloseTo(0.5, 5);
  });
});

describe('weakestKeys', () => {
  test('fehlerhafteste Taste zuerst, gute ignoriert', () => {
    const ks = {};
    for (let i = 0; i < 10; i++) { recordKeystroke(ks, 'e', false, 500); recordKeystroke(ks, 'f', true, 150); }
    const w = weakestKeys(ks, 3);
    expect(w[0]).toBe('e');
    expect(w).not.toContain('f');
  });
});

describe('buildWeightedPool', () => {
  test('schwache Taste 4x übergewichtet', () => {
    const pool = buildWeightedPool('fj', ['e'], 4);
    const count = (c) => pool.split('').filter(x => x === c).length;
    expect(count('e')).toBe(4);
    expect(count('f')).toBe(1);
  });
});

describe('lessonsToGoal', () => {
  test('0 wenn alles gemeistert, >0 bei offener Taste', () => {
    const ks = {};
    for (let i = 0; i < 25; i++) { recordKeystroke(ks, 'f', true, 150); recordKeystroke(ks, 'j', true, 150); }
    expect(lessonsToGoal(ks, 'fj')).toBe(0);
    const ks2 = {};
    for (let i = 0; i < 10; i++) recordKeystroke(ks2, 'e', false, 600);
    expect(lessonsToGoal(ks2, 'fj')).toBeGreaterThan(0);
  });
});
