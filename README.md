# ⌨️ Tippster

10-Finger-Tippen spielerisch lernen — als Windows-Desktop-App (Tauri v2) und im Browser.

## Features

- **12 didaktische Lektionen** (QWERTZ): `F J → D K → S L → A Ö → G H → Ä → R U → E I → W O → Q P T Z Ü → unten → Final Boss`, inkl. Boss-Fights.
- **Adaptive Engine**: rolling Genauigkeit (letzte 30 Anschläge) + Latenz pro Taste; schwache Tasten werden **4× übergewichtet** und als Tages-Quest trainiert.
- **Gamification**: XP, Level, Streak (lokale Zeitzone), Combos, echte Sterne pro Lektion, **23 Badges** in 6 Gruppen, Unlock-Gating.
- **Tages-Challenge + Ghost-Race**: derselbe Text für alle (Datum als Seed) — du fährst gegen deinen eigenen Bestwert.
- **Juice**: Tastatur-Highlight, Key-Pops (GSAP), Screen-Shake, Combo-Popups, Badge-Toasts, Level-Up-Feier, Konfetti (canvas-confetti), Web-Audio-Sounds.
- **Offline** — alle Fonts und Libraries sind gebündelt, kein CDN.
- **Auto-Update** (signiert) über GitHub Releases.
- **Fortschritt sichern**: Export/Import als JSON (Stats-Tab).
- **Barrierefrei**: folgt `prefers-reduced-motion`, Tabs per Tastatur bedienbar, Esc schließt Dialoge.

## Entwicklung

```bash
npm install
npm run dev        # Browser (Vite)
npm test           # Vitest
npm run build      # Frontend nach dist/
npm run tauri:dev  # Desktop-App
```

### Windows ohne MSVC (GNU-Toolchain)

MinGW vor den Build-Befehl hängen:

```powershell
$env:PATH = 'C:\Users\Mo\.local\mingw64\mingw64\bin;' + $env:USERPROFILE + '\.cargo\bin;' + $env:PATH
npm run tauri:build
```

## Release (öffentlich verteilbar)

Installer landen nach `npm run tauri:build` in:

- `src-tauri/target/release/bundle/nsis/Tippster_<version>_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/Tippster_<version>_x64_en-US.msi`

### Auto-Update einrichten

1. **Signatur-Schlüssel** (einmalig, niemals committen):

   ```bash
   npx tauri signer generate -w "$env:USERPROFILE\.tauri\tippster.key"
   ```

   Der öffentliche Schlüssel steht in `src-tauri/tauri.conf.json` unter `plugins.updater.pubkey`.

2. **Endpunkt** in `tauri.conf.json` von `DEIN-USER` auf dein GitHub-Repo ändern:

   ```
   https://github.com/<user>/<repo>/releases/latest/download/latest.json
   ```

3. **GitHub-Secrets** anlegen (Settings → Secrets → Actions):
   - `TAURI_SIGNING_PRIVATE_KEY` — Inhalt von `tippster.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — Passwort (leer lassen, wenn keins)

4. **Release bauen**: Tag pushen.

   ```bash
   git tag v2.0.1 && git push origin v2.0.1
   ```

   Der Workflow `.github/workflows/release.yml` baut signierte Installer und legt einen Draft-Release an. Der lokale Build braucht `TAURI_SIGNING_PRIVATE_KEY` als Pfad oder Inhalt.

> ⚠️ Privaten Schlüssel verloren = keine Updates mehr möglich. Sicher aufbewahren.

## Struktur

```
src/
  js/
    lessons.js    Lektionen, Finger-Zuordnung, Tastatur-Layout
    adaptive.js   Adaptive Engine (rolling stats, Prognose)
    achievements.js  23 Badges (reine Prüf-Funktionen)
    daily.js      Tages-Seed, Ghost-Fortschritt
    stats.js      Text-Generierung, Sterne, WPM-Deckel
    store.js      State, lokales Datum, Unlock/Resume, Migration
    audio.js      Web-Audio-Sounds
    fx.js         Konfetti/GSAP-Effekte
    updater.js    Auto-Update (nur in Tauri aktiv)
    main.js       UI-Verdrahtung
  css/app.css
tests/            Vitest (50 Tests)
src-tauri/        Tauri-Shell (Rust, Config, Icons)
```

## App-Icon neu erzeugen

Das Icon wird aus `icon-source.png` generiert:

```bash
python make-icon.py                 # erzeugt icon-source.png (1024x1024)
npx tauri icon icon-source.png      # schreibt src-tauri/icons/*
```

## Quellen / Inspiration

- [Monkeytype](https://github.com/monkeytypegame/monkeytype) — Live-WPM, Test-Modi
- [Keybr](https://github.com/aradzie/keybr.com) — adaptive Schwachstellen-Übungen
- [Tipp10](https://www.tipp10.com) — deutsche Lektions-Didaktik
- [Klavaro](https://klavaro.sourceforge.io) — Stufen-Aufbau
- [Eletypes](https://github.com/gamer-ai/eletypes-frontend) — Badges, Heatmap
- [TypeRacer](https://play.typeracer.com) — Renn-Motivation
