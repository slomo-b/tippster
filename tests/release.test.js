import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8');

const cargoVersion = cargo.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1];

describe('version consistency', () => {
  test('package.json, tauri.conf.json and Cargo.toml agree', () => {
    expect(conf.version, 'tauri.conf.json vs package.json').toBe(pkg.version);
    expect(cargoVersion, 'Cargo.toml vs package.json').toBe(pkg.version);
  });

  test('the version is a plain x.y.z â€” the MSI bundler rejects anything else', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('release wiring', () => {
  const release = readFileSync('.github/workflows/release.yml', 'utf8');

  test('releases are published, not left as drafts', () => {
    expect(release).toMatch(/releaseDraft:\s*false/);
  });
  test('the updater endpoint points at this repository and its latest release', () => {
    const url = conf.plugins?.updater?.endpoints?.[0] || '';
    expect(url).toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/latest\/download\/latest\.json$/);
  });

  test('updater artifacts and a public key are configured', () => {
    expect(conf.bundle.createUpdaterArtifacts).toBe(true);
    expect((conf.plugins?.updater?.pubkey || '').length).toBeGreaterThan(40);
  });
});

describe('workflow files', () => {
  const files = ['.github/workflows/ci.yml', '.github/workflows/release.yml'];

  test('every workflow parses as YAML and is named', () => {
    for (const f of files) {
      const doc = parse(readFileSync(f, 'utf8'));
      expect(doc, `${f} did not parse`).toBeTruthy();
      expect(doc.name, `${f} has no name: â€” GitHub would list it by filename`).toBeTruthy();
      expect(doc.on, `${f} has no on:`).toBeTruthy();
      expect(Object.keys(doc.jobs || {}).length, `${f} has no jobs`).toBeGreaterThan(0);
    }
  });

  // GitHub rejects a workflow outright when a secret is used in `if:`, and the failure is
  // a 0-second run that says only "workflow file issue". That cost a whole release.
  test('no secret is referenced inside an if: conditional', () => {
    const walk = (node, path) => {
      if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
      if (!node || typeof node !== 'object') return;
      for (const [k, v] of Object.entries(node)) {
        if (k === 'if' && typeof v === 'string' && /secrets\./.test(v)) {
          throw new Error(`${path}.if references a secret: ${v}`);
        }
        walk(v, `${path}.${k}`);
      }
    };
    for (const f of files) {
      expect(() => walk(parse(readFileSync(f, 'utf8')), f), `${f} uses secrets in if:`).not.toThrow();
    }
  });

  test('every job has steps and every step does something', () => {
    for (const f of files) {
      const doc = parse(readFileSync(f, 'utf8'));
      for (const [jobName, job] of Object.entries(doc.jobs)) {
        expect(Array.isArray(job.steps), `${f}: job ${jobName} has no steps`).toBe(true);
        for (const step of job.steps) {
          expect(step.uses || step.run, `${f}: a step in ${jobName} neither uses nor runs anything`).toBeTruthy();
        }
      }
    }
  });

  // The notes step needs the previous tag. actions/checkout omits tags unless asked,
  // and without one the notes silently listed the entire history as "what changed".
  test('the release checkout fetches tags, so the notes can find the previous release', () => {
    const doc = parse(readFileSync('.github/workflows/release.yml', 'utf8'));
    const checkout = doc.jobs.build.steps.find(s => String(s.uses || '').startsWith('actions/checkout'));
    expect(checkout, 'no checkout step in the release job').toBeTruthy();
    expect(checkout.with?.['fetch-tags'], 'release checkout must set fetch-tags: true').toBe(true);
    expect(checkout.with?.['fetch-depth']).toBe(0);
  });
});
