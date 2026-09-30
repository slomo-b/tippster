import { describe, test, expect } from 'vitest';
import { ACHIEVEMENTS, evaluate, buildContext, TOTAL_ACHIEVEMENTS } from '../src/js/achievements.js';

describe('Achievements', () => {
  test('at least 20 badges, ids are unique', () => {
    expect(TOTAL_ACHIEVEMENTS).toBeGreaterThanOrEqual(20);
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test('every badge has a label and a group', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.label).toBeTruthy();
      expect(a.group).toBeTruthy();
      expect(typeof a.check).toBe('function');
    }
  });
});

describe('evaluate', () => {
  const ctx = buildContext({ wpm: 45, acc: 96, maxCombo: 30, hits: 100, streak: 7, hour: 12 });

  test('unlocks matching badges', () => {
    const got = evaluate(ctx, []).map(a => a.id);
    expect(got).toContain('w40');
    expect(got).toContain('a95');
    expect(got).toContain('c25');
    expect(got).toContain('s7');
  });
  test('does not return already known badges', () => {
    const got = evaluate(ctx, ['w40', 'a95', 'c25', 's7']).map(a => a.id);
    expect(got).not.toContain('w40');
    expect(got).not.toContain('a95');
  });
  test('unreached goals stay locked', () => {
    const got = evaluate(ctx, []).map(a => a.id);
    expect(got).not.toContain('w60');
    expect(got).not.toContain('c50');
    expect(got).not.toContain('a98');
  });
});

describe('Special / Progress', () => {
  test('night owl only fires at night', () => {
    expect(evaluate(buildContext({ hour: 23 }), []).map(a => a.id)).toContain('night');
    expect(evaluate(buildContext({ hour: 2 }), []).map(a => a.id)).toContain('night');
    expect(evaluate(buildContext({ hour: 12 }), []).map(a => a.id)).not.toContain('night');
  });
  test('all-bosses only fires when the counts match', () => {
    expect(evaluate(buildContext({ bossesDone: 3, bossTotal: 3 }), []).map(a => a.id)).toContain('bossAll');
    expect(evaluate(buildContext({ bossesDone: 1, bossTotal: 3 }), []).map(a => a.id)).not.toContain('bossAll');
    expect(evaluate(buildContext({ bossesDone: 0, bossTotal: 0 }), []).map(a => a.id)).not.toContain('bossAll');
  });
  test('flawless requires a minimum length', () => {
    expect(evaluate(buildContext({ acc: 100, hits: 10 }), []).map(a => a.id)).not.toContain('flawless');
    expect(evaluate(buildContext({ acc: 100, hits: 50 }), []).map(a => a.id)).toContain('flawless');
  });
});
