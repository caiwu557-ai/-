"""Confirm every converted image is a legitimate WebP and has correct dimensions."""
import json,sys,math
from pathlib import Path
from PIL import Image
p=Path(__file__).resolve().parents[1]
records=json.loads((p/'data/bank.json').read_text('utf8'))['questions']
assert len(records)==364
for q in records:
 with Image.open(p/q['image']) as image:
  assert image.format=='WEBP',q['id']
  assert image.size==(q['width'],q['height']),q['id']
  image.verify()
print(f'PASS: {len(records)} WebP images intact, pixel dimensions preserved')
