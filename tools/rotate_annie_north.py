"""
Fix the broken Annie north sprite via /rotate (north-east -> north).

Constraints discovered:
  - /rotate only accepts 128x128 / 64x64 / 32x32 / 16x16 (square)
  - /rotate does NOT accept the `view` field (extra_forbidden)
  - Existing sprites are 184x184 (auto-expanded by /create-character-pro)

Approach:
  1. Center-crop the 184x184 north-east source to 128x128
     (preserves character pixels at original scale, trims padding only)
  2. POST /rotate with the 128x128 crop
  3. Center-pad the 128x128 result back to 184x184 with transparent border

Usage:  PIXELLAB_TOKEN=<token> python tools/rotate_annie_north.py
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
SRC_PATH = os.path.join(RAW_DIR, "annie-overworld-north-east.png")
OUT_DIR = os.path.join(RAW_DIR, "north-fix-candidates")
SEEDS = [1337, 7, 42]

CANVAS_FULL = 184
CANVAS_ROTATE = 128


def http_post_json(path, body):
    req = urllib.request.Request(
        BASE_URL + path,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TOKEN}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
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


def http_get_bytes(url):
    with urllib.request.urlopen(url, timeout=60) as resp:
        return resp.read()


def unwrap(b):
    return b.get("data") if isinstance(b, dict) and "data" in b and isinstance(b["data"], dict) else b


def center_crop(img, target):
    w, h = img.size
    left = (w - target) // 2
    top = (h - target) // 2
    return img.crop((left, top, left + target, top + target))


def center_pad(img, target):
    w, h = img.size
    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    left = (target - w) // 2
    top = (target - h) // 2
    canvas.paste(img, (left, top))
    return canvas


def rotate_one(seed, src_b64):
    body = {
        "image_size": {"width": CANVAS_ROTATE, "height": CANVAS_ROTATE},
        "from_image": {"type": "base64", "base64": src_b64, "format": "png"},
        "from_direction": "north-east",
        "to_direction": "north",
        "image_guidance_scale": 3.0,
        "seed": seed,
    }
    print(f"\n[seed={seed}] POST /rotate")
    status, resp = http_post_json("/rotate", body)
    if status >= 400:
        raise RuntimeError(f"submit HTTP {status}: {json.dumps(resp)[:400]}")
    data = unwrap(resp)

    # /rotate may be sync (image in response) or async (background_job_id).
    img_ref = None
    for path in [
        ("image", "base64"),
        ("image", "url"),
    ]:
        cur = data
        for key in path:
            cur = cur.get(key) if isinstance(cur, dict) else None
        if cur:
            img_ref = cur
            break
    if not img_ref:
        imgs = data.get("images")
        if imgs:
            img_ref = imgs[0].get("base64") or imgs[0].get("url")
    if not img_ref and data.get("background_job_id"):
        job_id = data["background_job_id"]
        print(f"  async — polling {job_id}")
        start = time.time()
        while True:
            ps, pb = http_get_json(f"/background-jobs/{job_id}")
            if ps >= 400:
                raise RuntimeError(f"poll HTTP {ps}: {json.dumps(pb)}")
            pd = unwrap(pb)
            elapsed = int(time.time() - start)
            st = pd.get("status")
            if st == "completed":
                print(f"  completed in {elapsed}s")
                last = pd.get("last_response") or {}
                imgs = last.get("images") or []
                if imgs:
                    img_ref = imgs[0].get("base64") or imgs[0].get("url")
                else:
                    img_ref = (last.get("image") or {}).get("base64") or (last.get("image") or {}).get("url")
                break
            if st == "failed":
                raise RuntimeError(f"job failed: {json.dumps(pb)[:400]}")
            print(f"  status={st} ({elapsed}s)")
            time.sleep(3)

    if not img_ref:
        raise RuntimeError(f"no image in response: {json.dumps(resp)[:500]}")

    if img_ref.startswith("http"):
        raw = http_get_bytes(img_ref)
    else:
        raw = base64.b64decode(img_ref)

    rotated = Image.open(io.BytesIO(raw)).convert("RGBA")
    print(f"  rotated received: {rotated.size}")
    padded = center_pad(rotated, CANVAS_FULL)
    out_path = os.path.join(OUT_DIR, f"annie-overworld-north-seed-{seed}.png")
    padded.save(out_path, "PNG")
    print(f"  saved {os.path.relpath(out_path, PROJECT_ROOT)} ({os.path.getsize(out_path)} bytes)")
    return out_path


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    src = Image.open(SRC_PATH).convert("RGBA")
    print(f"Source {os.path.relpath(SRC_PATH, PROJECT_ROOT)}: {src.size} ({os.path.getsize(SRC_PATH)} bytes)")
    cropped = center_crop(src, CANVAS_ROTATE)
    print(f"Center-cropped to {cropped.size} for /rotate")
    buf = io.BytesIO()
    cropped.save(buf, "PNG")
    src_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    debug_crop = os.path.join(OUT_DIR, "_source-128.png")
    cropped.save(debug_crop, "PNG")
    print(f"Debug cropped source saved to {os.path.relpath(debug_crop, PROJECT_ROOT)}")

    results = []
    for seed in SEEDS:
        try:
            results.append(rotate_one(seed, src_b64))
        except Exception as e:
            print(f"  FAILED seed={seed}: {e}")

    print("\n=== Candidates ===")
    for path in results:
        size = os.path.getsize(path)
        tag = "(small — likely back view)" if size < 9000 else "(large — possibly front view)"
        print(f"  {os.path.relpath(path, PROJECT_ROOT)} {size}B {tag}")


if __name__ == "__main__":
    main()
