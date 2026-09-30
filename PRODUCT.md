# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily international: developers and knowledge workers whose typing speed, not
their thinking, is the slow part of their day. They sit at their own machine, alone,
for a few minutes at a time, between or before other work. The product's author is the
first user and the harshest case: someone who has repeatedly tried to learn touch
typing and abandoned every earnest, joyless trainer.

## Product Purpose

Teach touch typing by making short daily practice worth returning to. Twelve lessons
unlock progressively; the engine tracks every keystroke and pushes the learner's
weakest key. Success means the learner comes back tomorrow and their measured speed and
accuracy rise over weeks — not that they finished a lesson today.

## Positioning

Two mechanisms a generic typing test does not have: per-key rolling statistics that
over-weight the weakest key in the next drill, and a gamified loop (XP, streaks, combos,
bosses, badges, a daily challenge raced against your own ghost) that makes a five-minute
session feel like play. It runs fully offline as a desktop app with no account and
progress stored on the machine.

## Operating Context

- Ships as a Windows desktop app (Tauri v2) and also runs in a browser.
- Desktop window is the primary surface: 1120×760 default, 900×640 minimum.
- Sessions are short — about five minutes — and often interrupted.
- All input is the physical keyboard; the learner is looking at their hands as much as
  the screen. Peeking is the habit being trained away.
- The practice corpus and key order are currently German QWERTZ (`ö ä ü ß`).
- No network at runtime: fonts, effects, and sounds are bundled.

## Capabilities and Constraints

Confirmed: 12 progressive lessons ending in a final boss; adaptive engine (rolling
accuracy over the last 30 keystrokes + per-key latency, weakest keys over-weighted,
lessons-to-goal estimate); XP, levels, timezone-local streaks, combos, per-lesson stars,
23 badges, boss fights, unlock gating; daily challenge with date-seeded text and a ghost
race against the personal best; 30/60-second free typing test; per-key heatmap and
history; JSON export/import of progress; signed auto-update; `prefers-reduced-motion`
respected.

Undecided, must not be invented: whether the curriculum gains QWERTY/other-layout
support and a non-German practice corpus. The stated direction (international) and the
current corpus (German QWERTZ) disagree; this is a known open product decision, not a
bug to silently paper over.

## Brand Commitments

The name **Tippster** is fixed and stays. Nothing else about the incumbent look is
binding: the user explicitly released the emoji-and-neon presentation.

## Evidence on Hand

None. There are no real users, testimonials, benchmarks, or download numbers. Future
work must not fabricate any.

## Product Principles

1. **Five minutes must be enough.** Every screen is judged by whether a short, distracted
   session still feels complete and still counts.
2. **The weakest key is the curriculum.** Practice targets measured weakness, not a fixed
   script.
3. **Never make the learner feel tested.** Errors are data and earn reward; the tone is
   coaching, never examination.
4. **The keyboard is the subject.** The surface shows the learner's real instrument —
   fingers, keys, and the next key to press — and never hides it behind decoration.
5. **Works offline, keeps your data.** No account, no network, progress stays local.

## Accessibility & Inclusion

`prefers-reduced-motion` is honoured throughout. Tabs are keyboard-operable with visible
focus. The app is keyboard-driven by nature, so every control must be reachable and
readable without a mouse.
