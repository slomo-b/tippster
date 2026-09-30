---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src"]
---

# Surface: Tippster desktop app

Scope: the whole product surface — Learn, Free typing, Challenge, Stats, Sources.
Visitor mode: **Operate** (the learner completes a task: type a drill line).
Primary target: `index.html` + `src/` (Tauri desktop window, 1120×760 default,
900×640 minimum; also runs in a browser).

## Audience, job, action, constraints

International developers and knowledge workers whose typing is the slow part of
their day. They practise alone, for about five minutes, looking at their hands as
much as the screen. The action is typing one drill line correctly. Constraints:
keyboard-only input, offline, no account, local progress, `prefers-reduced-motion`.
Product truth lives in PRODUCT.md.

## Direction contract

THESIS: The drill line is a mechanical departure board. Every character is a flap
cell that turns over as you type it. This owns the ONE thing a typing trainer must
show — the character you are about to type and whether you just got it right — and
refuses the category default of a wall of prose with a caret somewhere inside it.

OWN-WORLD: Matte ink-black flap cells on brushed steel; warm white painted
letterforms; a single amber lamp marking the live cell; dim red for a wrong leaf;
zebra hatching for weakness. No gradients, no glow, no rounded pills. Type is
Archivo Narrow condensed caps on the flaps and labels, Martian Mono on every
mechanical counter. Recognisable with all text removed: a ruled grid of black
cells on steel, four amber lamps, hatched columns.

STORY: The visitor understands within one glance that this board is their
keyboard's output, sees which key is live, types it, and watches the leaf turn.
They believe their weakness is being measured because they can see it hatched.

FIRST VIEWPORT: Full-bleed steel ground. A top rail carries TIPPSTER in condensed
caps left and three mechanical counter wheels right (WPM, accuracy, combo) in
Martian Mono between hairline rules. Below it the departure board: one ruled band
of flap cells holding the drill line, the live cell lit amber, already-typed cells
settled white, wrong leaves dim red. Under the board, the key field — four ruled
rows of key cells in the same language, weakest columns zebra-hatched, the next
key's cell lit amber. The primary action, NEW LINE, sits as a steel plate at the
bottom left of the board, never floating.

FORM: split-flap concourse board (challenger, hand position 3), raised by three
named donations — from the one-bit desktop: dither/1-bit tonal discipline, two
inks and no gradient; from the viewfinder HUD: state by pattern rather than
colour, hatch marks trouble; from the deep dive: one ruled axis governs every
measurement. Seed key c4c4ae4e.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Memorable moment

Completing a line makes the whole board cascade left to right, leaf over leaf —
the ripple of clacks that lifts every head in a concourse.

## Unresolved

Whether the curriculum gains non-German layouts and corpora (open in PRODUCT.md).
