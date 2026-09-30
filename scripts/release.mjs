#!/usr/bin/env node
// Cut a release: bump every version file, commit, tag, push.
// The tag starts .github/workflows/release.yml, which builds signed installers
// and publishes latest.json — that feed is what installed apps update from.
//
//   node scripts/release.mjs 2.0.2
//
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('usage: node scripts/release.mjs <major.minor.patch>');
  process.exit(1);
}
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

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

run('git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml');
run(`git commit -m "release: v${version}"`);
run(`git tag v${version}`);
run('git push');
run('git push origin v${version}');
console.log(`\nPushed v${version}. The Release workflow is building the signed installers.`);
