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

4. **Ship a release** with a tag:

   ```bash
   git tag v2.0.1 && git push origin v2.0.1
   ```

   `.github/workflows/release.yml` builds signed installers and opens a draft release.

> ⚠️ Lose the private key and you can never ship updates again. Back it up.

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
