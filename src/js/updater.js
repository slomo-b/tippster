// Auto-Update nur in der Tauri-Shell; im Browser/Vite-Dev passiert nichts.
export async function checkForUpdates() {
  if (!('__TAURI_INTERNALS__' in window)) return;
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) return;
    const ok = confirm(`Update ${update.version} verfügbar (du hast ${update.currentVersion}).\nJetzt installieren?`);
    if (!ok) return;
    await update.downloadAndInstall();
    alert('Update installiert — bitte Tippster neu starten.');
  } catch (e) {
    console.warn('Update-Check fehlgeschlagen:', e);
  }
}
