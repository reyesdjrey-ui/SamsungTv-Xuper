#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const otaDir = path.join(rootDir, 'ota');
const secretFile = path.resolve(rootDir, '../../tools/.ota-secret');
const manifestPath = path.join(otaDir, 'manifest.json');

const OTA_SALT = (process.env.OTA_SALT || (fs.existsSync(secretFile) ? fs.readFileSync(secretFile, 'utf8') : '')).trim();
if (!OTA_SALT) {
  console.error('Falta OTA_SALT (en variable de entorno OTA_SALT o archivo .ota-secret).');
  process.exit(1);
}

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return (i >= 0 && i + 1 < args.length) ? args[i + 1] : null;
}

let prevRev = 1;
if (fs.existsSync(manifestPath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (prev && Number(prev.rev)) prevRev = Number(prev.rev);
  } catch (_) {}
}

const rev = Number(getArg('--rev') || (prevRev + 1));
const minBaseRev = Number(getArg('--min-base-rev') || 1);
const version = getArg('--version') || ('3.0.0-ota' + rev);
const notes = getArg('--notes') || ('Actualizacion OTA rev ' + rev);
const includeStores = args.includes('--include-stores');

const orderedScripts = [
  'core/net/xe-env.js',
  'core/net/xe-cipher.js',
  'core/net/xe-relay.js',
  'core/net/xe-net.js',
  'core/net/xe-identity.js',
  'core/net/xe-auth.js',
  'core/net/xe-repository.js',
  'core/net/xe-broadcast.js',
  'core/net/xe-digest.js',
  'core/net/xe-manifest.js',
  'core/media/xe-system-scanner.js',
  'core/media/xe-gateway.js',
  'core/media/xe-byte-buffer.js',
  'core/media/xe-audio-clock.js',
  'core/media/xe-isobmff-mux.js',
  'core/media/xe-track-mgr.js',
  'core/media/xe-hevc-engine.js',
  'core/media/xe-mp4-engine.js',
  'core/media/xe-vod-engine.js',
  'core/media/xe-tizen-av.js',
  'core/media/xe-live-engine.js',
  'core/media/xe-watch-state.js',
  'store/xe-vod-index.js',
  'store/xe-featured-index.js',
  'store/xe-live-index.js',
  'store/xe-m3u-index.js',
  'store/xe-runtime-cfg.js',
  'core/shell/xe-bridge.js',
  'core/shell/xe-controller.js'
];

const coreNet = [
  'core/net/xe-env.js',
  'core/net/xe-cipher.js',
  'core/net/xe-crypto-worker.js',
  'core/net/xe-relay.js',
  'core/net/xe-net.js',
  'core/net/xe-identity.js',
  'core/net/xe-auth.js',
  'core/net/xe-repository.js',
  'core/net/xe-broadcast.js',
  'core/net/xe-digest.js',
  'core/net/xe-manifest.js'
];
const coreMedia = [
  'core/media/xe-system-scanner.js',
  'core/media/xe-gateway.js',
  'core/media/xe-byte-buffer.js',
  'core/media/xe-audio-clock.js',
  'core/media/xe-isobmff-mux.js',
  'core/media/xe-track-mgr.js',
  'core/media/xe-hevc-engine.js',
  'core/media/xe-mp4-engine.js',
  'core/media/xe-vod-engine.js',
  'core/media/xe-tizen-av.js',
  'core/media/xe-live-engine.js',
  'core/media/xe-watch-state.js'
];
const shellFiles = [
  'core/shell/xe-bridge.js',
  'core/shell/xe-controller.js',
  'store/xe-runtime-cfg.js'
];
const storeFiles = includeStores ? [
  'store/xe-vod-index.js',
  'store/xe-featured-index.js',
  'store/xe-live-index.js',
  'store/xe-m3u-index.js'
] : [];
const cssFiles = [
  'styles/xe-theme.css'
];

const targetFiles = [].concat(coreNet, coreMedia, shellFiles, storeFiles, cssFiles);
const filesMap = {};

for (const rel of targetFiles) {
  const full = path.join(rootDir, rel);
  if (!fs.existsSync(full)) {
    console.warn('[build-ota] Omitido (no existe):', rel);
    continue;
  }
  if (rel.endsWith('.js')) {
    execFileSync(process.execPath, ['-c', full], { stdio: 'inherit' });
  }
  filesMap[rel] = fs.readFileSync(full, 'utf8');
}

if (!fs.existsSync(otaDir)) fs.mkdirSync(otaDir, { recursive: true });

const bundleName = 'bundle-' + rev + '.json';
const bundleObj = {
  rev: rev,
  version: version,
  createdAt: new Date().toISOString(),
  scripts: orderedScripts,
  files: filesMap
};
const bundleText = JSON.stringify(bundleObj);
const sha256 = crypto.createHash('sha256').update(bundleText, 'utf8').digest('hex').toLowerCase();
const sig = crypto.createHash('md5')
  .update('xuper-ota:' + rev + ':' + version + ':' + sha256 + ':' + OTA_SALT, 'utf8')
  .digest('hex')
  .toLowerCase();

fs.writeFileSync(path.join(otaDir, bundleName), bundleText, 'utf8');

const manifestObj = {
  rev: rev,
  version: version,
  minBaseRev: minBaseRev,
  bundle: bundleName,
  sha256: sha256,
  sig: sig,
  notes: notes,
  updatedAt: new Date().toISOString()
};
fs.writeFileSync(manifestPath, JSON.stringify(manifestObj, null, 2) + '\n', 'utf8');

// Keep only the latest 2 bundle-*.json files
const existingBundles = fs.readdirSync(otaDir)
  .filter((f) => /^bundle-\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
while (existingBundles.length > 2) {
  const old = existingBundles.shift();
  fs.unlinkSync(path.join(otaDir, old));
}

console.log('[build-ota] Generado:', {
  rev: rev,
  version: version,
  bundle: bundleName,
  bundleKB: Math.round(Buffer.byteLength(bundleText, 'utf8') / 1024),
  filesCount: Object.keys(filesMap).length,
  sha256: sha256.slice(0, 16) + '...'
});
