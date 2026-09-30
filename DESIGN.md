# Design

<!-- impeccable:design-schema 1 -->

The durable visual system of **Tippster** — "Live Feed". Recorded from the built
surface, not from intent.

## World

The whole surface is one character grid. A live field of glyphs is drawn behind the
content and never stops moving: it drifts, it answers every keystroke with a ring of
light, and it tears when you miss. Everything the learner reads is real text on that
same grid, in the same typeface, one step brighter than the field.

**The governing rule: light is made of glyphs, not of colour.** There is exactly one
hue. Brightness is a question of which character — from `' '` to `'@'` — and emphasis
is inverse video, because that is what a terminal has instead of a second colour.

## Palette

One ink. Contrast measured against the void.

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--void` | `#0B0B09` | the screen | — |
| `--scrim` | `rgba(11,11,9,.86)` | content ground over the field | — |
| `--phos` | `#E8A33D` | the ink: text you have reached, the cursor, live state | 9.13:1 |
| `--phos-2` | `#B9822F` | decayed phosphor: text not yet reached, secondary copy | 5.91:1 |
| `--phos-3` | `#7A5620` | structure and ornament only — rules, ghost bars, never content | 2.99:1 |

`--phos-3` is deliberately below the content bar. It may draw a rule or a bar's tail
and nothing a reader must read.

### The density ramp

` .:-=+*#%@` — ten steps, thin to dense. It is the only tonal system in the product:

- **Bars** are drawn with it, densest at the leading edge, falling away behind.
- **The key field** carries each key's error rate as a ramp glyph.
- **The stats heatmap** carries each key's error rate the same way.
- **The field's own light** is a position in this ramp, not a colour value.

## Type

| Face | Use | Why |
|---|---|---|
| `Sometype Mono` 400/700 | everything functional: copy, labels, buttons, the drill line | the material itself — this world is a character grid |
| `VT323` 400 | the four readout numerals only | a DEC terminal face; the instrument voice |

Monospace here is the medium, not a costume for "technical". Nothing is set below 11px.

## Composition

Two rails, one view, no cards.

- **Rail** — `TIPPSTER_` left; level, streak, stars, XP right, divided by hairlines.
- **Tab rail** — bracket labels `[ learn ]`; the selected one inverts.
- **View** — main column plus a 290px side column, divided by a hairline. Below 1020px
  the side column drops under and the view scrolls; the page itself does not.
- **Footer** — level, streak, stars, the last result, then sound and update.
- Regions are separated by 1px `--phos-3` rules. No rounded corners, no shadows, no
  cards, no fill.

## Components

- **The line** (`.line`) — the drill text, one span per character. `todo` is `--phos-2`,
  `done` is `--phos`, `cur` is inverse video, `bad` is inverse in `--phos-2`. The live
  character carries a `^` in an `::after` positioned off its own bottom edge, so the
  caret stays welded to its character through any wrap — a separate caret row was tried
  first and misaligned on wrapped lines.
- **Progress** (`.bar`) — 30 cells of the ramp; the edge is the brightest glyph.
- **Readouts** (`.read`) — one horizontal status line: `wpm 42  acc 98%  combo 47
  goal 3 lines`, numerals in VT323 at 21px. A status line, never a row of metric tiles.
- **Key field** (`.key`) — 42px character cells in the same grid. The label plus a ramp
  glyph for that key's error rate. `live` inverts, `hit` fills with `--phos-2`, `miss`
  brightens its rule, `dim` fades keys not in the current lesson.
- **Bars and tables** — `bar()` for any proportion; `table.splits` for ranked numbers.
- **Log** — bottom right, five lines of `> message`, oldest falls off.
- **Banner** — a large VT323 word resolving out of noise at the top third.

## Motion

One authored entrance: **scramble**. Any new string resolves out of random glyphs from
the same character set used everywhere else, over 320–700ms depending on weight. It is
used for the lesson heading, the tab heading, the result banner and level-up.

The **live field** is the second and larger motion: a drifting density field at 20–34fps
(adaptive, so it never fights the browser), plus three events —

- a keystroke sends a **ring** of light out from the centre and raises the floor,
- a miss **tears** the field into noise that decays,
- a completed line **blooms**, and combo sets the field's overall energy, so your streak
  literally powers the display.

One frame is drawn synchronously at start-up so the screen is never blank.

Under `prefers-reduced-motion` the field draws a single static frame, the scramble
resolves instantly, and the CSS transitions collapse.

## Sound

The keystroke is a short bandpassed noise burst — a key striking. A high one on a hit,
a low one on a miss, a six-step run on level-up.

## Browser surfaces

Themed from the palette: `::selection` inverts, scrollbars take `--phos-3`, focus rings
are a 1px `--phos` outline, and there is no caret to theme because input arrives as
window-level keystrokes.

## What this world refuses

Any second hue. Red for errors, green for success, or a neon gradient — all are made
from the ramp and inverse video instead. Also: cards, radii, shadows, blur, icon
libraries, emoji, and bars that are a flat fill rather than a density.

## Known trade-off

One ink means the keyboard can no longer colour-code fingers. Finger guidance moved into
the lesson's written instruction; the key field's job is now "which key is next" and
"which key is weak".
