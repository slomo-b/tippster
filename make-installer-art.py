from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join("src-tauri", "installer")
os.makedirs(OUT, exist_ok=True)

GROUND = (27, 31, 35)
RAIL = (35, 40, 45)
RAIL2 = (43, 49, 55)
INK = (14, 16, 19)
INK2 = (23, 27, 31)
RULE = (52, 59, 66)
RULE2 = (72, 81, 90)
PAINT = (241, 239, 233)
PAINT2 = (195, 199, 203)
DIM = (152, 160, 167)
AMBER = (232, 163, 61)
RED = (178, 80, 60)

DIN = r"C:\Windows\Fonts\bahnschrift.ttf"
MONO = r"C:\Windows\Fonts\consola.ttf"
din_cache, mono_cache = {}, {}


def din(px, weight=600):
    key = (px, weight)
    if key not in din_cache:
        f = ImageFont.truetype(DIN, px)
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
        din_cache[key] = f
    return din_cache[key]


def mono(px):
    if px not in mono_cache:
        mono_cache[px] = ImageFont.truetype(MONO, px)
    return mono_cache[px]


def tracked(d, xy, text, font, fill, tracking=0.0):
    """Draw letter-spaced text; returns the end x."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + tracking
    return x


def tracked_w(d, text, font, tracking=0.0):
    return sum(d.textlength(c, font=font) + tracking for c in text) - (tracking if text else 0)


def flap(d, x, y, w, h, ch, state="todo"):
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=INK)
    d.rectangle([x, y + h // 2, x + w - 1, y + h - 1], fill=INK2)
    d.line([x, y + h // 2, x + w - 1, y + h // 2], fill=(0, 0, 0))
    col = {"todo": (74, 80, 86), "done": PAINT2, "bad": PAINT2, "live": AMBER}[state]
    if ch:
        f = mono(max(8, int(h * 0.52)))
        tw = d.textlength(ch, font=f)
        d.text((x + (w - tw) / 2, y + (h - f.size) / 2 - 1), ch, font=f, fill=col)
    if state == "live":
        d.rectangle([x, y - 2, x + w - 1, y - 1], fill=AMBER)
    if state == "bad":
        d.rectangle([x, y + h, x + w - 1, y + h + 1], fill=RED)


# ── NSIS header 150×57 ────────────────────────────────────────────────────────
def nsis_header(path, title="TIPPSTER", sub="TOUCH TYPING"):
    W, H = 150, 57
    img = Image.new("RGB", (W, H), GROUND)
    d = ImageDraw.Draw(img)
    d.rectangle([0, H - 2, W - 1, H - 1], fill=RULE2)
    f1 = din(15, 700)
    f2 = din(7, 400)
    tracked(d, (10, 11), title, f1, PAINT, 1.6)
    tracked(d, (11, 32), sub, f2, DIM, 1.8)
    # three flap cells, the middle one live
    cw, chh, gap = 17, 21, 3
    x0 = W - 10 - (cw * 3 + gap * 2)
    for i, (ch, st) in enumerate([("F", "done"), ("J", "live"), ("K", "todo")]):
        flap(d, x0 + i * (cw + gap), 18, cw, chh, ch, st)
    img.save(path, "BMP")
    print(" ", path, img.size)


# ── NSIS sidebar 164×314 ──────────────────────────────────────────────────────
def nsis_sidebar(path):
    W, H = 164, 314
    img = Image.new("RGB", (W, H), RAIL)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 2, H - 1], fill=AMBER)          # live lamp edge
    d.rectangle([3, 0, 3, H - 1], fill=RULE)

    tracked(d, (18, 22), "TIPPSTER", din(20, 700), PAINT, 2.0)
    d.rectangle([18, 52, W - 18, 52], fill=RULE2)

    # the board: 4 rows x 6 cells
    cw, chh, gap = 19, 24, 3
    x0 = 18
    rows = [
        "f j f j f".split(),
        "j f f j j".split(),
        "d k d k d".split(),
        "a s a s a".split(),
    ]
    live = (0, 2)
    bad = (2, 3)
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            st = "live" if (r, c) == live else "bad" if (r, c) == bad else ("done" if (r, c) < (1, 0) else "todo")
            flap(d, x0 + c * (cw + gap), 70 + r * (chh + gap), cw, chh, ch, st)

    # a drill line in mono
    d.text((18, 200), "das kajak glas", font=mono(12), fill=PAINT2)
    d.text((18, 216), "hals schal lag", font=mono(12), fill=(74, 80, 86))

    d.rectangle([18, 248, W - 18, 248], fill=RULE2)
    tracked(d, (18, 258), "FIVE MINUTES", din(9, 700), PAINT, 1.6)
    tracked(d, (18, 272), "A DAY", din(9, 700), PAINT, 1.6)
    tracked(d, (18, 290), "OFFLINE · SIGNED", din(7, 400), DIM, 1.2)
    img.save(path, "BMP")
    print(" ", path, img.size)


# ── WiX banner 493×58 ─────────────────────────────────────────────────────────
def wix_banner(path):
    W, H = 493, 58
    img = Image.new("RGB", (W, H), RAIL)
    d = ImageDraw.Draw(img)
    d.rectangle([0, H - 2, W - 1, H - 1], fill=RULE2)
    tracked(d, (22, 16), "TIPPSTER", din(21, 700), PAINT, 2.4)

    # three counter wheels, right aligned
    counters = [("WORDS/MIN", "0"), ("ACCURACY", "100%"), ("COMBO", "0")]
    fw = din(7, 400)
    fv = mono(15)
    widths = [70, 78, 64]
    total = sum(widths) + 3
    x = W - 22 - total
    for (lab, val), w in zip(counters, widths):
        d.line([x - 1, 10, x - 1, H - 12], fill=RULE2)
        tracked(d, (x + 6, 13), lab, fw, DIM, 1.3)
        d.text((x + 6, 25), val, font=fv, fill=PAINT)
        x += w + 1
    img.save(path, "BMP")
    print(" ", path, img.size)


# ── WiX dialog 493×312 ────────────────────────────────────────────────────────
def wix_dialog(path):
    W, H = 493, 312
    img = Image.new("RGB", (W, H), GROUND)
    d = ImageDraw.Draw(img)

    tracked(d, (34, 28), "TIPPSTER", din(26, 700), PAINT, 3.0)
    tracked(d, (35, 60), "TOUCH TYPING, GAMIFIED", din(9, 400), DIM, 2.0)

    # the board: 4 rows x 15 cells, all filled with a real drill line
    cw, chh, gap = 25, 30, 3
    x0 = 34
    line = "daskajakglashalsschallagsalatfassloschaalshaschglasflaggs"
    states = {}
    for i in range(60):
        r, c = divmod(i, 15)
        if i < 11:
            states[i] = "done"
        elif i == 11:
            states[i] = "bad"
        elif i == 12:
            states[i] = "live"
        else:
            states[i] = "todo"
    for i in range(60):
        r, c = divmod(i, 15)
        ch = line[i] if i < len(line) else ""
        flap(d, x0 + c * (cw + gap), 92 + r * (chh + gap), cw, chh, ch, states.get(i, "todo"))

    d.rectangle([34, 236, W - 34, 236], fill=RULE2)
    tracked(d, (34, 250), "TWELVE LEVELS · TWENTY-THREE BADGES · A GHOST TO RACE",
            din(9, 700), PAINT, 1.4)
    tracked(d, (34, 270), "WORKS OFFLINE · PROGRESS STAYS ON YOUR MACHINE",
            din(8, 400), DIM, 1.2)
    img.save(path, "BMP")
    print(" ", path, img.size)


print("writing installer art ->", OUT)
nsis_header(os.path.join(OUT, "nsis-header.bmp"))
nsis_header(os.path.join(OUT, "nsis-uninstaller-header.bmp"), "TIPPSTER", "UNINSTALL")
nsis_sidebar(os.path.join(OUT, "nsis-sidebar.bmp"))
wix_banner(os.path.join(OUT, "wix-banner.bmp"))
wix_dialog(os.path.join(OUT, "wix-dialog.bmp"))
print("done")
