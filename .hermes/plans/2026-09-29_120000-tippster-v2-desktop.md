# Tippster V2 Desktop-App Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Aus Single-File `index.html` eine echte installierbare Desktop-App (Windows .exe) mit deutlich besserer Lernwirkung, Gamification und Offline-Fähigkeit machen.

**Architecture:** Bestehenden Web-Code in `src/` (Vite) überführen, dann mit Tauri v2 als nativer Shell wrappen (Rust-Backend für Storage/Stats/Updater). Frontend bleibt HTML/CSS/JS – kein Rewrite.

**Tech Stack:** Tauri v2 + Vite + Vanilla JS (später SvelteKit optional), SQLite via tauri-plugin-sql, GSAP + canvas-confetti (bleiben), Web Audio API, GitHub Actions für .exe-Build.

---

## 0. Current context / Annahmen

- Stand: `index.html` (~448 Zeilen), Single-File, CDN: `canvas-confetti@1.9.4`, `gsap@3.12.5`, Google Fonts. State in `localStorage:tippster_v1`.
- Lessons: 12 QWERTZ-Stufen (F J → … → Final Boss), adaptiv via `weakKeys()`, KeyStats, Streak, Badges, Free-Mode 30/60s.
- OS: Windows (win32), kein Git-Repo, kein Build. User = faul, Anfänger, will spielerisch + spannend.
- Entscheidung offen: Tauri (empfohlen, 3-8 MB) vs Electron (150 MB, einfacher). Plan primär Tauri, Fallback Electron notiert.

## 1. Proposed approach

1. Refactor: `index.html` → `src/index.html + src/css/ + src/js/` (lessons.js, stats.js, audio.js, gamification.js), npm + Vite dev-server.
2. Desktop-Shell: `npm create tauri-app`, bestehendes `src/` als `frontendDist`, Rust-Commands nur für Files/SQL/Autostart.
3. Feature-Upgrades in 3 Wellen: Lernen → Motivation → Desktop-Feeling (Tray, Offline, Updater, Installer).
4. Kein Feature ohne Messung: WPM/Accuracy/Heatmap-Tests vorab.

## 2. Step-by-step plan

### Phase A – Fundament (1 Tag)

#### Task A1: Git init + Ordnerstruktur
**Objective:** Reproduzierbare Basis schaffen.
**Files:**
- Create: `.gitignore`, `package.json`, `src/` Split aus `index.html`
- Modify: `index.html` → `src/index.html`
**Steps:**
1. `git init; git add index.html; git commit -m "chore: v1 snapshot"`
2. `npm init -y; npm i -D vite`, `src/js/lessons.js` (LESSONS-Array extrahieren), `src/js/store.js` (localStorage-Wrapper), `src/js/fx.js` (confetti/gsap/audio)
3. Verifikation: `npx vite --port 1420` öffnet App identisch zu vorher.
**Commit:** `chore: split single-file into src modules`

#### Task A2: Tests für Lern-Logik
**Objective:** Adaptive Logik absichern vor Umbau.
**Files:**
- Create: `tests/lessons.test.js` (vitest), `tests/stats.test.js`
**Step 1: Failing test:**
```js
import {weakKeys} from '../src/js/stats.js';
test('weakKeys erkennt >12% Fehler',()=>{expect(weakKeys({e:{tot:10,err:3}})).toContain('e')})
```
**Step 2:** Run `npx vitest run` → FAIL erwartet.
**Step 3:** `stats.js` implementieren (aus aktuellem Inline-Code extrahiert).
**Step 4:** Run → PASS. **Step 5:** Commit `test: keystats logic`.

#### Task A3: Tauri-Shell aufsetzen
**Objective:** Lauffähige .exe aus bestehendem Frontend.
**Files:**
- Create: `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`
**Steps:**
1. `npm create tauri-app@latest -- --template vanilla --manager npm`
2. `tauri.conf.json`: `frontendDist: "../src"`, `app.windows.title: "Tippster"`, Breite 1120x760
3. `npm run tauri dev` → Fenster mit App. `npm run tauri build` → `src-tauri/target/release/bundle/msi/*.msi`
**Verifikation:** .exe startet offline (CDN → später vendorn, s. A4).
**Commit:** `feat: tauri shell`

#### Task A4: Offline-Vendor (CDN entfernen)
**Objective:** Echte Desktop-App ohne Internet.
**Files:**
- Modify: `src/index.html`, `package.json`
**Steps:** `npm i canvas-confetti gsap`, `import` statt CDN-`<script>`, Fonts lokal via `@fontsource/outfit + jetbrains-mono`.
**Verifikation:** WLAN aus → `npm run tauri dev` läuft + Konfetti geht.
**Commit:** `feat: vendor libs offline`

### Phase B – Viel besser lernen (2-3 Tage)

#### Task B1: Adaptive Engine V2 (Keybr-like)
- Per-Taste WPM + Rolling-Accuracy (letzte 30 Anschläge), Ziel-Speed pro Taste, Prognose "noch X Lektionen".
- Files: `src/js/adaptive.js`, Test: `adaptive.test.js` (schwächste Taste wird 4x übergewichtet).
- Verifikation: absichtlich `e` falsch → nächste Lektion enthält 3x mehr `e`.

#### Task B2: Profile + SQLite statt localStorage
- `tauri-plugin-sql`, Tabelle `keys(key,tot,err,wpm)`, `sessions(date,wpm,acc)`, Migration von localStorage beim Erststart.
- Verifikation: App schließen/öffnen → Stats bleiben, Heatmap aus DB.

#### Task B3: Onboarding für Faule (5-Min-Modus)
- Erster Start: "Wie faul bist du?" → Daily-Goal 5/10/15 Min, Streak-Freeze 1x/Woche, Desktop-Reminder (Tauri notification).
- Files: `src/js/onboarding.js`, `src-tauri` notification-permission.
- Verifikation: 5-Min-Timer beendet Lektion automatisch mit Bonus-XP.

#### Task B4: Boss + Story + Unlocks ausbauen
- Alle 4 Level Boss (2.5x Speed-Anforderung, EMP-Powerup = 1x Fehler verzeihen), Charakter-Unlocks (Fuchs 🦊 → Ninja 🥷 → Roboter 🤖 mit Voice-Lines via Web Speech).
- Test: Boss erst nach Schwelle freischaltbar.

### Phase C – Gamification + Juice (2 Tage)

#### Task C1: Achievements V2 (20 Stk, eletypes-Vorbild)
- Speed 40→100 WPM, Accuracy 95→100%, Combo 25/50/100, Streak 3/7/30, Nachtschicht, Early Bird. Share-Card als PNG (canvas export für Discord).
#### Task C2: Ghost-Race + Daily Challenge (TypeRacer-like, lokal)
- Seeded Daily-Text (Datum als Seed), Ghost deiner Bestleistung tippt mit, Leaderboard lokal + optional Friends-Code.
#### Task C3: Sound + Haptik
- Howler optional für MP3-Keyclicks, sonst WebAudio Presets (mechanisch/thock), Lautstärke-Slider, Screen-Shake-Stärke einstellbar.
#### Task C4: Animation-Pass (GSAP Timeline)
- Level-Up-Overlay 1.5s, Tasten-Trail-Partikel (canvas), Hintergrund-Parallax, Reduced-Motion-Toggle (a11y).

### Phase D – Release (1 Tag)

#### Task D1: Installer + Icons + Auto-Updater
- `tauri-plugin-updater`, Icon-Set (`src-tauri/icons/`), NSIS-Installer deutsch, Versionsnummer 2.0.0.
- Verifikation: `npm run tauri build` → `.msi` + `.exe` installierbar ohne Admin.
#### Task D2: Landing +/README
- `README.md`: Install-Anleitung, Quellen (Monkeytype/Keybr/Tipp10), Screenshots, Uninstall.

## 3. Files likely to change
- `index.html` → aufgeteilt in `src/index.html`, `src/css/app.css`, `src/js/{main,lessons,adaptive,store,audio,fx,achievements}.js`
- Neu: `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`, `src-tauri/Cargo.toml`
- Neu: `package.json` (vite, vitest, tauri), `tests/*.test.js`
- Behalten: QWERTZ-LESSONS-Reihenfolge, weakKeys-Idee, Streak-Logik.

## 4. Tests / Validation
- `npx vitest run` → alle grün (adaptive, stats, achievements).
- Manuell: 1) WLAN aus starten 2) 5-Min-Lektion spielen 3) absichtlich Fehler → Heatmap rot + Quest ändert sich 4) App neustarten → XP/Streak da 5) Boss-Level schafft Konfetti + Sound 6) `tauri build` erzeugt Installer <15 MB.
- Faul-Test: User schafft L1 ohne Anleitung in <3 Min.

## 5. Risiken, Tradeoffs, offene Fragen
- **Tauri vs Electron:** Tauri = leicht + schnell, braucht Rust-Toolchain + WebView2 (auf Win11 meist da). Electron = schwer (~150 MB) aber pur JS, einfacher für Anfänger. Empfehlung: Tauri, Fallback `electron-forge` wenn Rust-Setup scheitert.
- **CDN → Vendor:** Pflicht für Offline, +~150 KB lokal, ok.
- **Scope-Creep:** Multiplayer-Echtzeit (WebSocket) bewusst raus – Ghost reicht für Motivation, 10x weniger Aufwand.
- **Offen – bitte entscheiden:**
  1. Tauri (leicht) oder Electron (einfach)? → Default Tauri.
  2. Installer nur für dich oder öffentlich (Updater/ Signierung nötig)?
  3. Sollen Stats in Cloud (Account) oder nur lokal bleiben? → Default lokal (DSGVO-frei).

---
Gespeichert für Implementierung. Nächster Schritt nach Freigabe: Task A1 via subagent-driven-development starten.
