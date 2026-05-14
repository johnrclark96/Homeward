import zipfile, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
zip_path = pathlib.Path('C:/Users/johnr/Downloads/homeward-validation-tests-2026-05-13.zip')

items = [
    ('assets/VALIDATION-TESTS-2026-05-13.md', 'VALIDATION-TESTS-2026-05-13.md'),

    ('assets/sprites/characters/annie/raw/annie-test1-size96-south.png', 'test-1-annie/annie-test1-size96-south.png'),
    ('assets/sprites/characters/annie/raw/annie-test1-size96-east.png',  'test-1-annie/annie-test1-size96-east.png'),
    ('assets/sprites/characters/annie/raw/annie-test1-size96-north.png', 'test-1-annie/annie-test1-size96-north.png'),
    ('assets/sprites/characters/annie/raw/annie-test1-size96-west.png',  'test-1-annie/annie-test1-size96-west.png'),

    ('assets/sprites/characters/obi/raw/obi-test2-size64-south.png', 'test-2-obi/obi-test2-size64-south.png'),
    ('assets/sprites/characters/obi/raw/obi-test2-size64-east.png',  'test-2-obi/obi-test2-size64-east.png'),
    ('assets/sprites/characters/obi/raw/obi-test2-size64-north.png', 'test-2-obi/obi-test2-size64-north.png'),
    ('assets/sprites/characters/obi/raw/obi-test2-size64-west.png',  'test-2-obi/obi-test2-size64-west.png'),

    ('assets/sprites/characters/luna/raw/luna-test3-size64-south.png', 'test-3-luna/luna-test3-size64-south.png'),
    ('assets/sprites/characters/luna/raw/luna-test3-size64-east.png',  'test-3-luna/luna-test3-size64-east.png'),
    ('assets/sprites/characters/luna/raw/luna-test3-size64-north.png', 'test-3-luna/luna-test3-size64-north.png'),
    ('assets/sprites/characters/luna/raw/luna-test3-size64-west.png',  'test-3-luna/luna-test3-size64-west.png'),

    ('assets/tiles/wicker-park/raw/wicker-park-test4-32px.png',  'test-4-tileset/wicker-park-test4-32px.png'),
    ('assets/tiles/wicker-park/raw/wicker-park-test4-32px.json', 'test-4-tileset/wicker-park-test4-32px.json'),
]

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for src_rel, arcname in items:
        src = root / src_rel
        if not src.exists():
            print(f'MISSING: {src}', file=sys.stderr)
            sys.exit(1)
        zf.write(src, arcname)
        print(f'+ {arcname}  ({src.stat().st_size} bytes)')

print()
print(f'zip: {zip_path}  ({zip_path.stat().st_size} bytes)')
