# ⌨️ Tippster

**Touch typing, but gamified.** For lazy sloperators who need a more fun way to
learn typing — because if your typing is the development bottleneck, no amount of
AI autocomplete will fix your 30 WPM.

Runs as a Windows desktop app (Tauri v2) and in the browser. German QWERTZ layout.

```
5 minutes a day beats 2 hours on Sunday.
```

## Why it might actually work on you

- **5-minute sessions.** That is the whole commitment. The streak is designed
  so a single short lesson keeps it alive.
- **Your weakest key gets hunted.** Rolling per-key accuracy and latency feed an
  adaptive engine; the worst key is weighted 4× in the next drill and named in
  the daily quest.
- **It plays like something.** XP, levels, combos, 23 badges, boss fights, and a
  daily challenge where you race a ghost of your own best run.
- **Mistakes are not punished, they are data.** Errors earn XP too.

## Features

- **12 lessons** in a proven order: `F J → D K → S L → A Ö → G H → Ä → R U → E I →
  W O → Q P T Z Ü → bottom row → final boss`, with boss fights along the way.
- **Adaptive engine** — rolling accuracy (last 30 keystrokes) + per-key latency,
  weakest keys over-weighted, plus a "how many lessons to your goal" estimate.
- **Daily challenge + ghost race** — same text for everyone, seeded by the date;
  you race your own personal best.
- **Gamification** — XP, levels, local-timezone streaks, combos, real per-lesson
  stars, 23 badges in 6 groups, unlock gating.
- **Juice** — keyboard highlighting with finger colors, key pops, screen shake,
  combo popups, badge toasts, level-up celebration, confetti, Web Audio sounds.
- **Free typing test** — 30/60 s Monkeytype-style speed test.
- **Stats** — per-key heatmap, history, JSON export/import of your progress.
- **Offline** — every font and effect library is bundled. No CDN, no network.
- **Accessible** — respects `prefers-reduced-motion`, keyboard-operable tabs,
  Esc closes dialogs.
- **Signed auto-update** via GitHub Releases.

## Download

Grab the installer from the [latest release](../../releases/latest):

| File | Notes |
|---|---|
| `Tippster_..._x64-setup.exe` | Windows installer, no admin needed |
| `Tippster_..._x64_en-US.msi` | MSI for managed installs |

### Windows SmartScreen

Windows will say **"Windows protected your PC — unknown publisher"** the first time you
run the installer. That is expected: the installer is not signed with a Windows
code-signing certificate.

Install it anyway, either way:

- In the dialog: **More info → Run anyway**
- Or clear the download flag first, then run it:

  ```powershell
  Unblock-File .\Tippster_2.0.6_x64-setup.exe
  ```

Why this is not simply "buy a certificate":

| Option | Cost | Removes the warning? |
|---|---|---|
| No signature (today) | free | no — warns until the build has download history |
| Azure Artifact Signing | ~$10/mo | only after reputation builds; **individuals eligible in the US and Canada only** |
| OV certificate from a CA | ~$150–300/yr | only after reputation builds, and needs a hardware token |
| EV certificate | ~$400+/yr | **not since 2024** — reputation still has to accumulate |
| Self-signed | free | no — it blocks public users outright |
| Microsoft Store (MSIX) | free | yes, the Store re-signs the package |

Microsoft's own guidance is that SmartScreen reputation accrues per file hash, so the
prompt fades as more people run the same build. A certificate shortens that but no longer
skips it.

To sign anyway, add two repository secrets and CI does the rest — nothing else changes:

- `WINDOWS_CERTIFICATE` — the `.pfx` as base64 (`[Convert]::ToBase64String([IO.File]::ReadAllBytes('cert.pfx'))`)
- `WINDOWS_CERTIFICATE_PASSWORD` — its password

`scripts/set-thumbprint.mjs` writes the imported certificate's thumbprint into
`tauri.conf.json` during the build, and stays a no-op when the secrets are absent.


## Development

Requires Node 22+ and a Rust toolchain.

```bash
npm install
npm run dev        # browser (Vite)
npm test           # Vitest, 50 tests
npm run build      # frontend -> dist/
npm run tauri:dev  # desktop app
```

### Windows without MSVC (GNU toolchain)

Prepend MinGW to PATH before building:

```powershell
$env:PATH = 'C:\Users\Mo\.local\mingw64\mingw64\bin;' + $env:USERPROFILE + '\.cargo\bin;' + $env:PATH
npm run tauri:build
```

Installers land in `src-tauri/target/release/bundle/`.

## Release / auto-update setup

1. **Signing key** (once, never commit it):

   ```bash
   npx tauri signer generate -w "$env:USERPROFILE\.tauri\tippster.key"
   ```

   The public key lives in `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.

2. **Update endpoint** in `tauri.conf.json`:

   ```
   https://github.com/<owner>/<repo>/releases/latest/download/latest.json
   ```

3. **Repository secrets** (Settings → Secrets → Actions):
   - `TAURI_SIGNING_PRIVATE_KEY` — contents of `tippster.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — leave empty if the key has no password

4. **Ship a release** with the helper — it bumps all three version files, commits, tags and pushes:

   ```bash
   npm run release 2.0.3
   ```

   `.github/workflows/release.yml` then builds the signed installers and opens a draft
   release. Publish the draft to make it the feed installed apps update from.

> ⚠️ Lose the private key and you can never ship updates again. Back it up.

### How installed apps update

The updater polls `releases/latest/download/latest.json` — on start, every four hours,
and when the window regains focus. It compares that version to the running one, offers
the install in the bottom rail, and only downloads when you press it. **The repository
must be public**: an anonymous update check against a private repo returns 404.

## Installer artwork

The Windows installer and uninstaller are branded to match the app (NSIS header and
sidebar, WiX banner and dialog). Regenerate after a palette change:

```bash
python make-installer-art.py     # writes src-tauri/installer/*.bmp
```

Wired in `src-tauri/tauri.conf.json` under `bundle.windows`. The required pixel sizes
come from the Tauri config schema, not from guessing:
NSIS 150×57 header and 164×314 sidebar, WiX 493×58 banner and 493×312 dialog.

## Project layout

```
src/
  js/
    lessons.js      lessons, finger mapping, keyboard layout
    adaptive.js     adaptive engine (rolling stats, prediction)
    achievements.js 23 badges (pure predicates)
    daily.js        daily seed, ghost progress
    stats.js        text generation, stars, WPM clamp
    store.js        state, local date, unlock/resume, migration
    audio.js        Web Audio sounds
    fx.js           confetti / GSAP effects, toasts
    updater.js      auto-update (Tauri only, no-op in browser)
    main.js         UI wiring
  css/app.css
tests/              Vitest (50 tests)
src-tauri/          Tauri shell (Rust, config, icons)
src-tauri/installer/  installer and uninstaller artwork (regenerate with make-installer-art.py)
scripts/release.mjs   bump versions, commit, tag, push
.github/workflows/  CI + release
```

## Regenerating the app icon

```bash
python make-icon.py                 # writes icon-source.png (1024x1024)
npx tauri icon icon-source.png      # writes src-tauri/icons/*
```

## Notes

- The practice corpus is German on purpose: it is what exercises `ö ä ü ß` and
  the QWERTZ layout. The interface is English.
- Progress is stored locally by the app. Use export/import to back it up.

## Built on ideas from

- [Monkeytype](https://github.com/monkeytypegame/monkeytype) — live WPM, test modes
- [Keybr](https://github.com/aradzie/keybr.com) — adaptive weak-key drills
- [Tipp10](https://www.tipp10.com) — German lesson methodology
- [Klavaro](https://klavaro.sourceforge.io) — staged progression
- [Eletypes](https://github.com/gamer-ai/eletypes-frontend) — badges, heatmap
- [TypeRacer](https://play.typeracer.com) — racing as motivation
