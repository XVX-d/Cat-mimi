#!/usr/bin/env python3
"""Slice the generated life-scene UI atlas into compact transparent WebP assets."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "_assets_orig" / "ui_life_atlas.png"
OUTPUT = ROOT / "assets"

SPRITES = {
    "ui_life_nav.webp": (18, 470, 406, 608),
    "ui_life_panel.webp": (428, 246, 784, 608),
    "ui_life_coin.webp": (788, 506, 945, 600),
    "ui_life_primary.webp": (954, 487, 1241, 606),
    "ui_life_plaque.webp": (24, 792, 330, 970),
    "ui_life_card.webp": (386, 680, 614, 1003),
    "ui_life_card_selected.webp": (666, 678, 900, 1003),
    "ui_life_round.webp": (968, 752, 1218, 1007),
}

atlas = Image.open(SOURCE).convert("RGBA")
for filename, box in SPRITES.items():
    sprite = atlas.crop(box)
    sprite = sprite.resize((max(1, sprite.width // 2), max(1, sprite.height // 2)), Image.Resampling.NEAREST)
    sprite.save(OUTPUT / filename, "WEBP", lossless=True, method=6)
    print(filename, sprite.size)
