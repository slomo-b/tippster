#!/usr/bin/env node
// Cut a release: bump every version file, commit, tag, push.
// The tag starts .github/workflows/release.yml, which builds signed installers and
// publishes the release and latest.json — that feed is what installed apps update from.
// No manual step follows: the release goes live on its own.
//
//   node scripts/release.mjs patch      # 2.0.4 -> 2.0.5
//   node scripts/release.mjs minor      # 2.0.4 -> 2.1.0
//   node scripts/release.mjs 3.0.0      # or name the version outright
//
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const arg = process.argv[2];
const git = (...args) => execFileSync('git', args, { stdio: 'inherit' });
const readVersion = () => JSON.parse(readFileSync('package.json', 'utf8')).version;

function resolveVersion(a) {
  if (/^\d+\.\d+\.\d+$/.test(a || '')) return a;
  if (['patch', 'minor', 'major'].includes(a)) {
    const [maj, min, pat] = readVersion().split('.').map(Number);
    if (a === 'major') return `${maj + 1}.0.0`;
    if (a === 'minor') return `${maj}.${min + 1}.0`;
    return `${maj}.${min}.${pat + 1}`;
  }
  return null;
}

const version = resolveVersion(arg);
if (!version) {
  console.error('usage: node scripts/release.mjs <patch|minor|major|x.y.z>');
  console.error(`current version: ${readVersion()}`);
  process.exit(1);
}

const bumpJson = (file, key = 'version') => {
  const raw = readFileSync(file, 'utf8');
  const out = raw.replace(new RegExp(`("${key}"\\s*:\\s*)"[^"]+"`), `$1"${version}"`);
  if (out === raw) throw new Error(`no ${key} found in ${file}`);
  writeFileSync(file, out);
  console.log(`  ${file} -> ${version}`);
};

console.log(`Bumping to ${version}`);
bumpJson('package.json');
bumpJson('src-tauri/tauri.conf.json');
const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8');
writeFileSync('src-tauri/Cargo.toml', cargo.replace(/^(version\s*=\s*)"[^"]+"/m, `$1"${version}"`));
console.log(`  src-tauri/Cargo.toml -> ${version}`);

git('add', 'package.json', 'src-tauri/tauri.conf.json', 'src-tauri/Cargo.toml');
git('commit', '-m', `release: v${version}`);
git('tag', `v${version}`);
try {
  git('push');
  git('push', 'origin', `v${version}`);
} catch (e) {
  console.error(`\nThe commit and tag v${version} exist locally but the push failed.`);
  console.error(`Retry with:\n  git push && git push origin v${version}\n`);
  process.exit(1);
}
console.log(`\nPushed v${version}. The Release workflow is building and publishing it.`);
console.log('Installed apps pick it up on their next check.');
