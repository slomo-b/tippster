#!/usr/bin/env node
// Cut a release: bump every version file, commit, tag, push.
// The tag starts .github/workflows/release.yml, which builds signed installers
// and publishes latest.json — that feed is what installed apps update from.
//
//   node scripts/release.mjs 2.0.2
//
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('usage: node scripts/release.mjs <major.minor.patch>');
  process.exit(1);
}
const git = (...args) => execFileSync('git', args, { stdio: 'inherit' });

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
console.log(`\nPushed v${version}. The Release workflow is building the signed installers.`);
