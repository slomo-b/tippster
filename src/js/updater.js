// Auto-update only inside the Tauri shell; in the browser / Vite dev this does nothing.
export async function checkForUpdates() {
  if (!('__TAURI_INTERNALS__' in window)) return;
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) return;
    const ok = confirm(`Update ${update.version} is available (you have ${update.currentVersion}).\nInstall now?`);
    if (!ok) return;
    await update.downloadAndInstall();
    alert('Update installed — please restart Tippster.');
  } catch (e) {
    console.warn('Update check failed:', e);
  }
}
