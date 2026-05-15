"""
Build a review package of Annie's v2 overworld assets + a session summary,
zipped to the user's Downloads folder.

Includes: the approved portrait, 8 static rotation PNGs, every raw animation
frame, and animated GIFs (one per direction per animation) so the walk + idle
cycles can actually be watched. GIFs are cropped to a common bounding box and
3x upscaled (nearest-neighbour) for visibility.

Usage: python tools/build_annie_review_package.py
"""

import io
import os
import zipfile

from PIL import Image

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(PROJECT, "assets", "sprites", "characters", "annie", "raw")
PORTRAIT = os.path.join(PROJECT, "assets", "portraits", "annie", "annie-neutral.png")
ZIP_OUT = r"C:\Users\johnr\Downloads\annie-v2-review-2026-05-15.zip"

DIRECTIONS = ["south", "south-east", "east", "north-east",
              "north", "north-west", "west", "south-west"]
ANIMS = [
    {"name": "walking", "frames": 6, "duration": 110},
    {"name": "breathing-idle", "frames": 4, "duration": 220},
]
UPSCALE = 3
MARGIN = 6


def load(p):
    return Image.open(p).convert("RGBA")


def all_asset_paths():
    paths = [os.path.join(RAW, f"annie-overworld-{d}.png") for d in DIRECTIONS]
    for a in ANIMS:
        for d in DIRECTIONS:
            for i in range(a["frames"]):
                paths.append(os.path.join(RAW, a["name"], d, f"{i}.png"))
    return paths


def union_bbox():
    """Common content bbox across every rotation + animation frame."""
    left = top = 10**9
    right = bottom = 0
    for p in all_asset_paths():
        if not os.path.exists(p):
            continue
        bb = load(p).getbbox()
        if bb:
            left, top = min(left, bb[0]), min(top, bb[1])
            right, bottom = max(right, bb[2]), max(bottom, bb[3])
    return (left, top, right, bottom)


def checkerboard(size, sq=8):
    """Light/dark checkerboard so transparency is visible in the GIF."""
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    px = img.load()
    for y in range(size[1]):
        for x in range(size[0]):
            c = 200 if ((x // sq) + (y // sq)) % 2 == 0 else 150
            px[x, y] = (c, c, c, 255)
    return img


def make_gif(anim_name, direction, crop, n_frames, duration):
    cw = (crop[2] - crop[0]) * UPSCALE
    ch = (crop[3] - crop[1]) * UPSCALE
    bg = checkerboard((cw, ch))
    out_frames = []
    for i in range(n_frames):
        fp = os.path.join(RAW, anim_name, direction, f"{i}.png")
        fr = load(fp).crop(crop).resize((cw, ch), Image.NEAREST)
        composed = Image.alpha_composite(bg, fr).convert("RGB")
        out_frames.append(composed)
    buf = io.BytesIO()
    out_frames[0].save(buf, format="GIF", save_all=True,
                       append_images=out_frames[1:], duration=duration, loop=0)
    return buf.getvalue()


SUMMARY = """# Annie Overworld Sprite - Review Package

Generated 2026-05-15

## Contents of this package

- `portrait-annie-neutral.png` - the approved master style anchor (128x128, seed 1337)
- `rotations/` - the 8 static directional sprites (actual asset PNGs, transparent background)
- `walking-gifs/` - 8 walk-cycle animations, one per direction (cropped + 3x upscaled, checkerboard = transparent)
- `idle-gifs/` - 8 breathing-idle loops, one per direction
- `frames/` - every raw animation frame PNG (48 walking + 32 idle), full 184x184 canvas

## Final result

A complete, consistent 8-direction Annie overworld sprite:

- 8 static rotations
- walking: 8 directions x 6 frames = 48 frames
- breathing-idle: 8 directions x 4 frames = 32 frames

All 8 directions - including north - are clean and read as one coherent
character. North is a proper back-of-head view.

Active PixelLab character_id: ad0fdc16-a374-4252-9209-c0750971c916

## What happened this session

1. PORTRAIT APPROVED. Seed 1337 chosen as Annie's master style anchor (from a
   batch of 4 candidates).

2. FIRST OVERWORLD ATTEMPT FAILED. An 8-direction sprite was generated, but the
   `north` rotation came back as a SECOND, subtly different front-facing face
   instead of a back-of-head view. Every animation derived from it was corrupted.

3. ROOT CAUSE FOUND. The first attempt fed the 128x128 portrait (head and
   shoulders only) directly into PixelLab's 8-direction generator using
   `method=create_with_style`. That mode is text/style-driven - with no body or
   back-of-head pixels to work from, the model invented a second front-facing
   chibi for the pure-back north slot. The Style Guide's required intermediate
   step - portrait, then a full-body south sprite, THEN the rotation - had been
   skipped.

4. FIX APPLIED (Option F1). The rotation step was redone correctly: a full-body
   south-facing sprite was used as the reference image with
   `method=rotate_character` (the purpose-built "rotate this image into 8
   directions" mode). New character `ad0fdc16` - all 8 rotations consistent,
   north a true back view.

5. ANIMATION API MISUSE CORRECTED. Animations had been requested one direction
   at a time, which fragmented each animation into 8 separate 1/8-full entries.
   Corrected to the intended usage: one request per animation type covering all
   8 directions at once.

6. COMPLETED AND VERIFIED. All 16 animation directions (8 walk + 8 idle) were
   generated and downloaded. North walk and idle were specifically confirmed as
   proper back views.

7. COMMITTED. The good v2 set was promoted to the canonical asset locations;
   the broken v1 character assets were archived; the generation log was
   rewritten with the root cause and the correct workflow for future characters.

## Known issues / next steps (Aseprite cleanup - NOT done yet)

- Normalize the 8 static rotation canvases to a common foot/center anchor so
  the character does not jitter between facings.
- Palette-snap to the Homeward palette (indexed color) to catch any drift.
- Minor: the sweater red reads slightly punchier from the front than from the
  side/back rotations; pants and boots are both very dark and could use a 1px
  separator for readability.
- Onion-skin each walk cycle to confirm no foot-slip on the loop.
- No direction needs to be hand-drawn - all 24 PixelLab outputs (8 rotations +
  16 animation directions) are clean.

## Cost

Approximately 95 image generations of the 5,000/month PixelLab allowance
(includes the failed v1 attempt and the corrective regeneration).
"""


def main():
    crop_raw = union_bbox()
    crop = (max(0, crop_raw[0] - MARGIN), max(0, crop_raw[1] - MARGIN),
            crop_raw[2] + MARGIN, crop_raw[3] + MARGIN)
    print(f"union content bbox {crop_raw} -> crop {crop}")

    with zipfile.ZipFile(ZIP_OUT, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("SUMMARY.md", SUMMARY)

        with open(PORTRAIT, "rb") as f:
            z.writestr("portrait-annie-neutral.png", f.read())

        for d in DIRECTIONS:
            src = os.path.join(RAW, f"annie-overworld-{d}.png")
            with open(src, "rb") as f:
                z.writestr(f"rotations/annie-overworld-{d}.png", f.read())

        for a in ANIMS:
            gif_dir = "walking-gifs" if a["name"] == "walking" else "idle-gifs"
            label = a["name"] if a["name"] == "walking" else "idle"
            for d in DIRECTIONS:
                gif = make_gif(a["name"], d, crop, a["frames"], a["duration"])
                z.writestr(f"{gif_dir}/{label}-{d}.gif", gif)
                for i in range(a["frames"]):
                    fp = os.path.join(RAW, a["name"], d, f"{i}.png")
                    with open(fp, "rb") as f:
                        z.writestr(f"frames/{a['name']}/{d}/{i}.png", f.read())
            print(f"  {a['name']}: 8 GIFs + {8 * a['frames']} frames")

    size_kb = os.path.getsize(ZIP_OUT) // 1024
    print(f"\nWrote {ZIP_OUT} ({size_kb} KB)")


if __name__ == "__main__":
    main()
