import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8');

const cargoVersion = cargo.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1];

describe('version consistency', () => {
  test('package.json, tauri.conf.json and Cargo.toml agree', () => {
    expect(conf.version, 'tauri.conf.json vs package.json').toBe(pkg.version);
    expect(cargoVersion, 'Cargo.toml vs package.json').toBe(pkg.version);
  });

  test('the version is a plain x.y.z — the MSI bundler rejects anything else', () => {
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
