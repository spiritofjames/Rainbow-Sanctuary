"""Delivery encodings from owner-approved sources; no creative alterations."""
from pathlib import Path
from PIL import Image
import argparse
import subprocess

root = Path(__file__).resolve().parents[1]
out = root / 'assets' / 'home'
parser = argparse.ArgumentParser()
parser.add_argument('--aerial', type=Path, required=True)
parser.add_argument('--fonts', type=Path, required=True)
args = parser.parse_args()
coast = root / 'assets/retreats/awakening-inner-light-december-2026/rainbow-sanctuary-panama-1920.jpg'
for name, source, sizes in [
    ('coast', coast, [960, 1920]),
    ('school-site-visualisation', args.aerial, [800, 1672]),
]:
    for width in sizes:
        image = Image.open(source).convert('RGB')
        image.thumbnail((width, 10000), Image.Resampling.LANCZOS)
        target = out / f'{name}-{width}.webp'
        image.save(target, 'WEBP', quality=84, method=6)
        print(target.name, image.size, target.stat().st_size)

for source_name, target in [('EBGaramond-RainbowSanctuary.ttf', 'rainbow-serif.woff2'), ('Inter-RainbowSanctuary.ttf', 'rainbow-sans.woff2')]:
    subprocess.run(['pyftsubset', str(args.fonts / source_name), '--flavor=woff2',
                    '--unicodes=U+0020-017F,U+2000-206F,U+2192,U+2197',
                    '--output-file=' + str(out / target)], check=True)
    print(target, (out / target).stat().st_size)
