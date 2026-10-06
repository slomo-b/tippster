// Auto-update. Only inside the Tauri shell; in the browser this is inert.
//
// The chain: a tag pushed to the repository makes CI build signed installers and
// publish a release. The app fetches that release's latest.json, compares the version
// to its own, and either offers the install in the footer or — if "install updates
// automatically" is on — downloads and runs it without asking.
import { log } from './fx.js';
import { loadState, saveState } from './store.js';

let pending = null;
let checking = false;
let announced = null;
let installing = false;

const S = loadState();
const plate = () => document.getElementById('updateBtn');
const checkPlate = () => document.getElementById('checkUpdates');
const autoBox = () => document.getElementById('autoUpdate');

function offer(update) {
  const b = plate();
  if (!b) return;
  b.hidden = false;
  b.dataset.version = update.version;
  const label = b.querySelector('span');
  if (label) label.textContent = `Install ${update.version}`;
}

/** @param {{manual?: boolean}} opts manual = the user asked, so answer either way. */
export async function checkForUpdates({ manual = false } = {}) {
  if (!('__TAURI_INTERNALS__' in window)) {
    if (manual) log('updates arrive with the installed app');
    return;
  }
  if (checking || installing) return;
  checking = true;
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) {
      if (manual) log('tippster is up to date');
      return;
    }
    pending = update;
    offer(update);
    if (announced !== update.version) {
      announced = update.version;
      log(`version ${update.version} is available`);
    }
    if (manual) log(`version ${update.version} available`);
    if (S.autoUpdate) await installUpdate();
  } catch (e) {
    if (manual) log('update check failed — no network?');
    console.warn('update check failed:', e);
  } finally {
    checking = false;
  }
}

/** Download and run the signed installer. Windows restarts the app when it finishes. */
export async function installUpdate() {
  if (installing) return;
  if (!pending) return checkForUpdates({ manual: true });
  installing = true;
  const b = plate();
  const label = b && b.querySelector('span');
  try {
    if (b) b.disabled = true;
    if (label) label.textContent = 'downloading 0%';
    let got = 0, total = 0, shown = -1;
    await pending.downloadAndInstall(ev => {
      if (!label) return;
      if (ev.event === 'Started') total = (ev.data && ev.data.contentLength) || 0;
      else if (ev.event === 'Progress') {
        got += (ev.data && ev.data.chunkLength) || 0;
        const pct = total ? Math.round(got / total * 100) : 0;
        if (pct !== shown && pct % 10 === 0) { shown = pct; label.textContent = `downloading ${pct}%`; }
      } else if (ev.event === 'Finished') label.textContent = 'installing…';
    });
  } catch (e) {
    installing = false;
    if (b) b.disabled = false;
    if (label) label.textContent = 'retry update';
    log('update failed — try again later');
    console.warn('update install failed:', e);
  }
}

/** The toggle in the Sources view. */
export function setAutoUpdate(on) {
  S.autoUpdate = !!on;
  saveState(S);
  const box = autoBox();
  if (box) box.checked = S.autoUpdate;
  log(S.autoUpdate ? 'updates will install themselves' : 'updates will ask first');
  if (S.autoUpdate && pending) installUpdate();
}

/** Poll on start, every four hours, and when the window regains focus. */
export function startUpdateWatch() {
  const box = autoBox();
  if (box) {
    box.checked = S.autoUpdate;
    box.onchange = () => setAutoUpdate(box.checked);
  }
  if (checkPlate()) checkPlate().onclick = () => checkForUpdates({ manual: true });
  if (plate()) plate().onclick = () => installUpdate();

  if (!('__TAURI_INTERNALS__' in window)) return;
  checkForUpdates();
  setInterval(() => checkForUpdates(), 4 * 60 * 60 * 1000);
  let last = 0;
  window.addEventListener('focus', () => {
    const now = Date.now();
    if (now - last > 10 * 60 * 1000) { last = now; checkForUpdates(); }
  });
}
