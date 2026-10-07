import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const jsFiles = readdirSync('src/js').filter(f => f.endsWith('.js'));
const js = jsFiles.map(f => `\n/* ${f} */\n` + readFileSync('src/js/' + f, 'utf8')).join('');
const all = jsFiles.map(f => readFileSync('src/js/' + f, 'utf8')).join('\n');

const matchAll = (re, s) => [...s.matchAll(re)].map(m => m[1]);
const idsIn = (s) => matchAll(/\bid="([^"]+)"/g, s);

describe('index.html structure', () => {
  const ids = idsIn(html);

  test('every id is unique', () => {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate ids: ${dupes.join(', ')}`).toEqual([]);
  });

  test('every tab points at a panel that exists', () => {
    const tabs = matchAll(/data-t="([^"]+)"/g, html);
    expect(tabs.length).toBeGreaterThan(0);
    const missing = tabs.filter(t => !ids.includes('view-' + t));
    expect(missing, `data-t without a view-<t> id: ${missing.join(', ')}`).toEqual([]);
  });

  test('every view-* panel has a tab that reaches it', () => {
    const tabs = matchAll(/data-t="([^"]+)"/g, html);
    const panels = ids.filter(id => id.startsWith('view-')).map(id => id.slice(5));
    const orphan = panels.filter(p => !tabs.includes(p));
    expect(orphan, `panels no tab can show: ${orphan.join(', ')}`).toEqual([]);
  });

  test('aria-controls and aria-labelledby resolve', () => {
    for (const ref of [...matchAll(/aria-controls="([^"]+)"/g, html), ...matchAll(/aria-labelledby="([^"]+)"/g, html)]) {
      expect(ids, `aria reference "${ref}" has no target`).toContain(ref);
    }
  });
});

describe('script references to the document', () => {
  // ids the scripts create at runtime, so they are legitimately absent from the markup
  const dynamic = /^(k-|f-)/;

  test('every element the scripts look up exists in index.html', () => {
    const wanted = new Set([
      ...matchAll(/getElementById\('([^']+)'\)/g, all),
      ...matchAll(/\$\('([^']+)'\)/g, all),
      ...matchAll(/querySelector\('#([A-Za-z0-9_-]+)'\)/g, all),
    ]);
    const ids = idsIn(html);
    const missing = [...wanted].filter(id => !ids.includes(id) && !dynamic.test(id));
    expect(missing, `scripts look up ids that do not exist: ${missing.join(', ')}`).toEqual([]);
  });

  test('the view list the tab code switches on matches the markup', () => {
    const listMatch = all.match(/\[([^\]]*'learn'[^\]]*)\]/);
    expect(listMatch, 'no view list found in the scripts').toBeTruthy();
    const named = matchAll(/'([a-z]+)'/g, listMatch[1]);
    const ids = idsIn(html);
    for (const n of named) expect(ids, `view-${n} missing`).toContain('view-' + n);
  });
});
