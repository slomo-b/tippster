#!/usr/bin/env node
// CI helper: when a Windows certificate has been imported into the runner's store,
// write its thumbprint into tauri.conf.json so the bundler signs the installers.
// Does nothing when TAURI_WINDOWS_CERT_THUMBPRINT is unset, so unsigned local builds
// and unsigned CI runs are unaffected.
//
//   TAURI_WINDOWS_CERT_THUMBPRINT=ABC123 node scripts/set-thumbprint.mjs
//
import { readFileSync, writeFileSync } from 'node:fs';

const thumb = (process.env.TAURI_WINDOWS_CERT_THUMBPRINT || '').trim();
if (!thumb) {
  console.log('no certificate thumbprint — building unsigned');
  process.exit(0);
}

const file = 'src-tauri/tauri.conf.json';
const conf = JSON.parse(readFileSync(file, 'utf8'));
conf.bundle.windows = conf.bundle.windows || {};
conf.bundle.windows.certificateThumbprint = thumb;
conf.bundle.windows.digestAlgorithm = conf.bundle.windows.digestAlgorithm || 'sha256';
conf.bundle.windows.timestampUrl = conf.bundle.windows.timestampUrl
  || 'http://timestamp.digicert.com';
writeFileSync(file, JSON.stringify(conf, null, 2) + '\n');
console.log(`signing with certificate ${thumb.slice(0, 8)}…`);
