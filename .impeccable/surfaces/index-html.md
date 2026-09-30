---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src"]
---

# Surface: Tippster desktop app

Scope: the whole product surface — Learn, Free, Daily, Stats, Sources.
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

THESIS: The screen is a character grid, and light is made of glyphs rather than
colour. The interface does not sit on top of a live render — it *is* one, and it
answers every keystroke. The one belief this must install: your typing is moving
something, and the display's own energy is your streak made visible. It refuses the
category default of a dark app with a coloured accent.

OWN-WORLD: One hue only, amber phosphor `#E8A33D` on `#0B0B09`, with `#B9822F` for text
not yet reached and `#7A5620` for structure. Brightness is a position in the ramp
` .:-=+*#%@`, never a colour value. Emphasis is inverse video. Sometype Mono carries all
functional text; VT323 carries the four readout numerals. Recognisable with all text
removed: a drifting density field of amber glyphs, a bright caret cell, and a bar whose
leading edge is its densest point.

STORY: The visitor sees a screen already alive, reads the one line they must type,
types it, and watches the field answer them. Each correct key sends a ring of light;
a miss tears the grid; a finished line blooms. Their combo sets how hard the screen is
running. Nothing is explained, because the feedback is immediate.

FIRST VIEWPORT: Rail with `TIPPSTER_` left and level/streak/stars/XP right. Bracket tab
row. Then the line: a 30-cell density bar, the drill text with the live character in
inverse video, a pointer row with `^` under it, and one status line of readouts
(`wpm acc combo goal`) whose numerals are VT323. Under that the key field — the same
character cells, each carrying its own error rate as a ramp glyph. Primary action is
`new line`, a bracket-style button, not a floating pill.

FORM: ASCII live render (challenger, source `medium-native-ascii-live-scene-render`),
taken at the assignment's full commitment: "density of glyphs stands in for light" is
the palette, the typographic scale, and the motion system at once. Seed key b11b0e4d.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Memorable moment

A miss tears the whole grid into noise for a beat; a completed line blooms outward from
the centre; and the field's density trackers your combo, so a long run makes the screen
itself run hotter.

## Unresolved

Whether the curriculum gains non-German layouts and corpora (open in PRODUCT.md).
