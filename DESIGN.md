# Design

<!-- impeccable:design-schema 1 -->

The durable visual system of **Tippster** — "The Departure Board", a split-flap
concourse board. Recorded from the built surface, not from intent.

## World

A mechanical departure board: matte ink-black flap cells mounted on brushed steel,
warm white painted letterforms, and a single amber lamp marking the live cell. The
practice text is not prose with a caret — it is a row of flap cells, each of which
turns over as the learner types it. Weakness is shown by zebra hatching, never by
colour alone. The board is the keyboard's output; the key field below it is drawn in
the same cell language.

## Palette

Restrained: two inks, one lamp, one warning. No gradients, no glass, no glow.

| Token | Value | Role |
|---|---|---|
| `--ground` | `#1B1F23` | page ground, brushed steel |
| `--rail` | `#23282D` | rail plates, board backing |
| `--rail-2` | `#2B3137` | raised plate, hover ground |
| `--ink` | `#0E1013` | flap face |
| `--ink-2` | `#171B1F` | lower flap leaf |
| `--rule` | `#343B42` | hairline |
| `--rule-2` | `#48515A` | stronger hairline, panel edge |
| `--paint` | `#F1EFE9` | letters, primary text |
| `--paint-2` | `#C3C7CB` | settled (already typed) letters |
| `--dim` | `#98A0A7` | secondary copy |
| `--amber` | `#E8A33D` | the live lamp: current cell, active tab, primary action |
| `--amber-2` | `#9C6E28` | amber at rest |
| `--red` | `#B2503C` | a wrong leaf, a serious weakness |
| `--blue` | `#7C9DB5` | ring-finger ink only |

Finger identity uses four inks on a 2px edge rule (`--finger-index/-middle/-ring/-pinky`),
with left-hand rules on the left edge and right-hand rules on the right. This is the
only place more than two hues appear, and it is data, not decoration.

Trouble is encoded as **pattern**: an amber SVG hatch (`--hatch`) over a weak key, a
red hatch (`--hatch-red`) over a wrong one. Contrast is never carried by colour alone.

## Type

| Face | Use | Weights | Why |
|---|---|---|---|
| `Archivo Narrow` | flap letters, labels, buttons, nav, headings — all caps, tracked | 400 / 600 / 700 | condensed grotesque, the register of a stamped flap legend |
| `Archivo` | body copy, notes, list rows | 400 / 500 | same family, readable at 13–15px |
| `Martian Mono` | the drill line, every counter, heat values | 400 / 700 | wide and mechanical; reads as an instrument, not as code |

All numerals are `tabular-nums`. Labels are uppercase with `letter-spacing: .14–.2em`.
Functional text floor is 11px; nothing content-bearing sits below it.

## Composition

The frame is two rails and a board, never a stack of cards.

- **Top rail** — wordmark left, three counter wheels right (`Words/min`, `Accuracy`,
  `Combo`) separated by hairlines. This is live measurement.
- **Tab rail** — flat plates divided by hairlines; the selected plate inverts to amber.
- **View** — a main column and a 300px side column divided by a hairline. Below
  1020px the side column drops under the main column and the view scrolls; the page
  itself never scrolls.
- **Standing rail (footer)** — level, streak, stars, XP: state that persists between
  sessions, separated from the live counters above.
- Regions are separated by hairlines and 1px inset rules. There are no rounded
  corners, no drop shadows, no cards.

## Components

- **Flap** (`.flap`) — 40px cell, two halves split by a 1px black rule, letter centred
  in Martian Mono. States: todo, `done` (settled, `--paint-2`), `bad` (red letter, darker
  lower leaf), `live` (amber letter plus a 2px amber rule across the top edge), `blank`
  (unused cell at the end of a row).
- **Key cell** (`.key`) — 38px cell in the same language, legend in Archivo Narrow caps,
  finger edge rule, optional hatch. States: resting, `weak`, `live` (inverted to amber
  with a dark edge rule), `hit`, `miss`.
- **Plate** (`.plate`) — rectangular button. Default is `--rail-2` with a hairline;
  `primary` is solid amber with ink text; `quiet` is unfilled.
- **List row** — four columns: index, title, tier tag, stars. The current lesson is
  marked by an amber index, not by a coloured bar.
- **Log line** — bottom-right, max four, icon + text, fades out.
- **Result band** (`.result`) — after each line an inline steel panel appears *under the
  board*, inside the normal flow: title, star row, a three-value stat line, Next level /
  Same line, and a one-line verdict. It is not a modal; the board stays visible, nothing
  is trapped, and Enter advances. A modal was deliberately rejected here — a 15-second
  drill does not need an interruption.

### Derived shades

Fixed shades that belong to the palette and are used only in the states named:

| Value | Use |
|---|---|
| `#0A0C0E` | unused cell at the end of a board row |
| `#1A1113` | lower leaf of a wrong flap |
| `#26302A` | key cell, after a hit |
| `#2A1B19` | key cell, after a miss |
| `#191D21` | locked badge ground |
| `#F2B455` | primary plate, hover |
| `#737C84` | scrollbar thumb (3.9:1 on ground) |
| `#000` | the 1px split rule inside a flap |

## Motion

One authored moment, and it is the world's own: the **flap turn**. A cell's upper leaf
rotates to −92° while the lower leaf rises from +92°, 170ms. It fires once per keystroke
on the cell just typed, and on completing a line the entire board cascades left to
right, 16ms apart. Counters and log lines only mark a change; nothing bounces, nothing
glows. Under `prefers-reduced-motion` every duration collapses to 0.001ms and the
cascade is skipped.

## Sound

The board's own voice: a short bandpassed noise burst — a flap striking. Three voices:
a high clack on a correct key, a low one on an error, and a six-step run of clacks on
level-up. No music, no samples.

## Browser surfaces

Themed from the palette: `::selection` is amber on ink, scrollbars take `#737C84`
(3.9:1 on the ground), and focus rings are 2px amber. Numerals are always
`tabular-nums` where columns must align. There is no editable surface in the app —
input arrives as window-level keystrokes — so no caret is themed.

### Contrast

Measured against the ground each sits on: primary `--paint` 15.5:1, `--paint-2` 11.2:1,
secondary `--dim` 6.25:1 on ground / 5.61:1 on rail / 4.96:1 on rail-2 / 7.19:1 on ink.
Trouble is never signalled by low-contrast colour: a wrong flap keeps `--paint-2`
letters and takes a 2px `--red` rule; a wrong character in a typed line keeps
`--paint-2` and takes a red underline.

## What this world refuses

Neon-on-black with glow, purple gradients, emoji as icons, rounded pill tabs, stat
cards in a row, gradient text, glass blur, and a coloured left border on any element.
