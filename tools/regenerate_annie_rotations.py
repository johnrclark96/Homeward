"""
Regenerate Annie's 8-direction rotations the CORRECT way (Option F1).

ROOT CAUSE of the original two-faced character:
  The 128x128 portrait (head + shoulders) was fed directly into
  /create-character-pro with method="create_with_style". That mode is
  text-driven; the reference image is style-only. With no body or
  back-of-head pixels to work from, the model invented everything below
  the shoulders and, for the pure-back "north" slot, fell back to a
  learned prior and produced a SECOND front-facing design.

  The Style Guide (HOMEWARD-STYLE-GUIDE.md:391-393) specifies a separate
  intermediate step: portrait -> single south sprite -> 8-direction
  rotation. That step was skipped.

FIX (Option F1):
  Use the existing canonical south sprite (full body, correct Annie) as
  the reference with method="rotate_character" -- the purpose-built
  "rotate this image into 8 directions" mode.

Usage: PIXELLAB_TOKEN=<token> python tools/regenerate_annie_rotations.py
"""

import base64
import io
import json
import os
import sys
import time
import urllib.request
import urllib.error

from PIL import Image

TOKEN = os.environ.get("PIXELLAB_TOKEN")
if not TOKEN:
    print("Missing PIXELLAB_TOKEN env var", file=sys.stderr)
    sys.exit(1)

BASE_URL = "https://api.pixellab.ai/v2"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(PROJECT_ROOT, "assets", "sprites", "characters", "annie", "raw")
SOUTH_SRC = os.path.join(RAW_DIR, "annie-overworld-south.png")
OUT_DIR = os.path.join(RAW_DIR, "rotate-v2")          # new rotations land here (not overwriting v1)
STATE_FILE = os.path.join(PROJECT_ROOT, "tools", ".annie-rotate-v2-state.json")
REF_CROP_PATH = os.path.join(OUT_DIR, "_reference-south-cropped.png")

CROP_SIZE = 168   # /create-character-pro reference_image max is 168x168
SEED = 1337

DIRECTIONS = ["south", "south-east", "east", "north-east",
              "north", "north-west", "west", "south-west"]

DESCRIPTION = (
    "chibi girl with long warm honey-brown wavy hair past shoulders, "
    "NOT bright yellow, NOT anime yellow, warm brown undertones with subtle "
    "golden highlights, red sweater, dark pants, small boots, top-down RPG "
    "sprite, low top-down view, transparent background, warm cozy pixel art, "
    "soft warm-brown contextual outlines, no pure black, no pure white"
)


def http_post_json(path, body):
    req = urllib.request.Request(
        BASE_URL + path,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def http_get_json(path):
    req = urllib.request.Request(
        BASE_URL + path,
        headers={"Authorization": f"Bearer {TOKEN}"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def unwrap(b):
    if isinstance(b, dict) and isinstance(b.get("data"), dict):
        return b["data"]
    return b if isinstance(b, dict) else {}


def build_reference():
    """Center a CROP_SIZE window on the character's bounding box."""
    src = Image.open(SOUTH_SRC).convert("RGBA")
    print(f"South source: {SOUTH_SRC}  size={src.size}")
    bbox = src.getbbox()  # (left, top, right, bottom) of non-transparent pixels
    if bbox is None:
        raise RuntimeError("south.png appears fully transparent")
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    print(f"  character bbox = {bbox}  ({bw}x{bh})")
    if bw > CROP_SIZE or bh > CROP_SIZE:
        raise RuntimeError(f"character ({bw}x{bh}) does not fit in {CROP_SIZE}x{CROP_SIZE} crop")

    cx = (bbox[0] + bbox[2]) // 2
    cy = (bbox[1] + bbox[3]) // 2
    left = cx - CROP_SIZE // 2
    top = cy - CROP_SIZE // 2
    # Clamp the window inside the source canvas.
    left = max(0, min(left, src.size[0] - CROP_SIZE))
    top = max(0, min(top, src.size[1] - CROP_SIZE))
    crop = src.crop((left, top, left + CROP_SIZE, top + CROP_SIZE))
    print(f"  cropped to {crop.size} at offset ({left},{top}), character centered on bbox")

    os.makedirs(OUT_DIR, exist_ok=True)
    crop.save(REF_CROP_PATH, "PNG")
    print(f"  saved reference crop -> {os.path.relpath(REF_CROP_PATH, PROJECT_ROOT)}")

    buf = io.BytesIO()
    crop.save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def submit(ref_b64):
    body = {
        "description": DESCRIPTION,
        "image_size": {"width": 64, "height": 96},
        "method": "rotate_character",
        "reference_image": {"type": "base64", "base64": ref_b64, "format": "png"},
        "view": "low top-down",
        "template_id": "mannequin",
        "no_background": True,
        "seed": SEED,
    }
    print("\nPOST /create-character-pro  method=rotate_character ...")
    status, resp = http_post_json("/create-character-pro", body)
    if status >= 400:
        raise RuntimeError(f"submit HTTP {status}: {json.dumps(resp)[:500]}")
    data = unwrap(resp)
    character_id = data.get("character_id")
    job_id = data.get("background_job_id")
    if not character_id or not job_id:
        raise RuntimeError(f"missing character_id/background_job_id: {json.dumps(resp)[:500]}")
    print(f"  character_id      = {character_id}")
    print(f"  background_job_id = {job_id}")
    with open(STATE_FILE, "w") as f:
        json.dump({"character_id": character_id, "job_id": job_id,
                   "submitted_at": time.strftime("%Y-%m-%dT%H:%M:%S")}, f, indent=2)
    return character_id, job_id


def poll(job_id):
    print("\nPolling background job...")
    start = time.time()
    while True:
        status, resp = http_get_json(f"/background-jobs/{job_id}")
        if status >= 400:
            raise RuntimeError(f"poll HTTP {status}: {json.dumps(resp)}")
        data = unwrap(resp)
        st = data.get("status")
        elapsed = int(time.time() - start)
        if st == "completed":
            print(f"  completed in {elapsed}s")
            return
        if st == "failed":
            raise RuntimeError(f"job failed: {json.dumps(resp)[:500]}")
        print(f"  status={st} ({elapsed}s)")
        time.sleep(6)


def download_rotations(character_id):
    status, resp = http_get_json(f"/characters/{character_id}")
    if status >= 400:
        raise RuntimeError(f"GET character HTTP {status}: {json.dumps(resp)}")
    data = unwrap(resp)
    with open(os.path.join(OUT_DIR, "_character-response.json"), "w") as f:
        json.dump(data, f, indent=2)

    urls = data.get("rotation_urls") or {}
    if not urls:
        raise RuntimeError(f"no rotation_urls in response; keys={list(data.keys())}")

    print("\nDownloading 8 rotations...")
    for d in DIRECTIONS:
        url = urls.get(d)
        if not url:
            print(f"  {d:<11} MISSING url")
            continue
        # Backblaze CDN blocks the default "Python-urllib/x.y" UA (403) and
        # rejects the PixelLab Bearer token (401) — send a plain browser UA.
        dl_req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(dl_req, timeout=60) as r:
            buf = r.read()
        out = os.path.join(OUT_DIR, f"annie-overworld-{d}.png")
        with open(out, "wb") as f:
            f.write(buf)
        print(f"  {d:<11} {os.path.relpath(out, PROJECT_ROOT)} ({len(buf)} bytes)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    if os.path.exists(STATE_FILE):
        saved = json.load(open(STATE_FILE))
        print(f"Resuming from state file: character_id={saved['character_id']}")
        character_id, job_id = saved["character_id"], saved["job_id"]
    else:
        ref_b64 = build_reference()
        character_id, job_id = submit(ref_b64)

    poll(job_id)
    download_rotations(character_id)
    print(f"\nDone. New character_id = {character_id}")
    print(f"New rotations in {os.path.relpath(OUT_DIR, PROJECT_ROOT)}/  (originals untouched)")


if __name__ == "__main__":
    main()
