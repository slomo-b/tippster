// Auto-update. Only inside the Tauri shell; in the browser this is inert.
// The window talks to the GitHub release: it fetches latest.json, compares it to the
// running version, and — only if you ask — downloads the signed installer and runs it.
import { log } from './fx.js';

let pending = null;
let checking = false;
let announced = null;

const plate = () => document.getElementById('updateBtn');
const checkPlate = () => document.getElementById('checkUpdates');

function offer(update) {
  const b = plate();
  if (b) {
    b.hidden = false;
    b.dataset.version = update.version;
    const label = b.querySelector('span');
    if (label) label.textContent = `Install ${update.version}`;
  }
}

/**
 * @param {{manual?: boolean}} opts manual = the user pressed the plate, so report either way.
 */
export async function checkForUpdates({ manual = false } = {}) {
  if (!('__TAURI_INTERNALS__' in window)) {
    if (manual) log('updates arrive with the installed app', '#i-mute');
    return;
  }
  if (checking) return;
  checking = true;
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) {
      if (manual) log('Tippster is up to date', '#i-lamp');
      return;
    }
    pending = update;
    offer(update);
    // announce a given version once per session, not on every poll
    if (announced !== update.version) {
      announced = update.version;
      log(`version ${update.version} is ready to install`, '#i-down');
    }
    if (manual) log(`version ${update.version} available`, '#i-lamp');
  } catch (e) {
    if (manual) log('update check failed — no network?', '#i-mute');
    console.warn('update check failed:', e);
  } finally {
    checking = false;
  }
}

/** Download and run the signed installer. Windows restarts the app when it finishes. */
export async function installUpdate() {
  if (!pending) return checkForUpdates({ manual: true });
  const b = plate();
  const label = b && b.querySelector('span');
  try {
    if (b) b.disabled = true;
    if (label) label.textContent = 'Downloading…';
    let got = 0, total = 0, announcedPct = -1;
    await pending.downloadAndInstall(ev => {
      if (!label) return;
      if (ev.event === 'Started') total = (ev.data && ev.data.contentLength) || 0;
      else if (ev.event === 'Progress') {
        got += (ev.data && ev.data.chunkLength) || 0;
        const pct = total ? Math.round(got / total * 100) : 0;
        if (pct !== announcedPct && pct % 10 === 0) { announcedPct = pct; label.textContent = `Downloading ${pct}%`; }
      } else if (ev.event === 'Finished') label.textContent = 'Installing…';
    });
  } catch (e) {
    if (b) b.disabled = false;
    if (label) label.textContent = 'Retry update';
    log('update failed — try again later', '#i-mute');
    console.warn('update install failed:', e);
  }
}

/** Poll on start, every four hours, and whenever the window regains focus. */
export function startUpdateWatch() {
  if (!('__TAURI_INTERNALS__' in window)) return;
  checkForUpdates();
  setInterval(() => checkForUpdates(), 4 * 60 * 60 * 1000);
  let last = 0;
  window.addEventListener('focus', () => {
    const now = Date.now();
    if (now - last > 10 * 60 * 1000) { last = now; checkForUpdates(); }
  });
  const cp = checkPlate();
  if (cp) cp.onclick = () => checkForUpdates({ manual: true });
  const b = plate();
  if (b) b.onclick = () => installUpdate();
}
