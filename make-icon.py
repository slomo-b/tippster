from PIL import Image, ImageDraw, ImageFont
import os

S = 1024
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Hintergrund: dunkles, abgerundetes Quadrat
d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=(11, 15, 30, 255))

# Diagonaler Verlauf als Akzentband
band = Image.new("RGBA", (S, S), (0, 0, 0, 0))
bd = ImageDraw.Draw(band)
for i in range(S):
    t = i / S
    r = int(34 + (167 - 34) * t)
    g = int(211 + (139 - 211) * t)
    b = int(238 + (250 - 238) * t)
    bd.line([(i, 0), (i, S)], fill=(r, g, b, 255))
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
img.paste(band, (0, 0), mask)
d = ImageDraw.Draw(img)

# Keycap
kw, kh = int(S * 0.56), int(S * 0.50)
kx, ky = (S - kw) // 2, int(S * 0.20)
d.rounded_rectangle([kx, ky, kx + kw, ky + kh], radius=int(S * 0.10), fill=(20, 27, 50, 255))
d.rounded_rectangle([kx + 6, ky + 6, kx + kw - 6, ky + kh - 6], radius=int(S * 0.09),
                    outline=(238, 242, 255, 55), width=5)

# Buchstabe T
font = None
for p in [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\segoeuib.ttf"]:
    if os.path.exists(p):
        font = ImageFont.truetype(p, int(kh * 0.62))
        break
text = "T"
bb = d.textbbox((0, 0), text, font=font)
tx = kx + (kw - (bb[2] - bb[0])) / 2 - bb[0]
ty = ky + (kh - (bb[3] - bb[1])) / 2 - bb[1]
d.text((tx, ty), text, font=font, fill=(238, 242, 255, 255))

# Cursor-Unterstrich in Gelb
cw = int(kw * 0.34)
d.rounded_rectangle([(S - cw) // 2, ky + kh + int(S * 0.075), (S + cw) // 2, ky + kh + int(S * 0.105)],
                    radius=int(S * 0.016), fill=(250, 204, 21, 255))

img.save("icon-source.png")
print("icon-source.png", img.size)
