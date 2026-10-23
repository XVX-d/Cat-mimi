#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 assets/ 图片压到投放体积:按显示尺寸缩放 + PNG 256 色量化(保留 alpha) + 优化。
原图已备份在 _assets_orig/。需要复原:把 _assets_orig/* 拷回 assets/ 再重跑 gen。
用法:python compress_assets.py"""
import pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).parent
SRC  = ROOT / "_assets_orig"     # 从原图压(可重复运行不累积损失)
DST  = ROOT / "assets"

# 各图最大宽度(≈ 显示宽 ×2,留 retina 余量)。未列出的用默认 360。
MAXW = {
    "bg_surface":1024, "bg_water":1024,            # 全屏背景,保留
    "wave_ai":620, "boat":520, "fisher":300, "rod":420, "seaking":560, "wreck":680,
    "rock":720, "rock_e":720, "rock_b":520, "rock_c":520, "rock_d":560, "rock_f":520,
    "fish_s":180, "fish_m":220, "fish_l":260,
    "hook_cu":120, "hook_ag":120, "hook_au":120, "hook_dia":120,
    "ui_card_gear":560, "ui_btn":340, "ui_reel":200, "ui_cast":240, "ui_goal":400,
    "ui_download":160, "ui_ico_line":130, "ui_upgrade":280, "coin":120,
}
DEFAULT_MAXW = 360
JPG_Q = 80

def maxw_for(stem): return MAXW.get(stem, DEFAULT_MAXW)

tot_old = tot_new = 0
for p in sorted(SRC.iterdir()):
    if p.suffix.lower() not in (".png",".jpg",".jpeg"): continue
    stem = p.stem
    im = Image.open(p)
    old = p.stat().st_size
    mw = maxw_for(stem)
    if im.width > mw:
        h = round(im.height * mw / im.width)
        im = im.resize((mw, h), Image.LANCZOS)
    out = DST / p.name
    if p.suffix.lower() in (".jpg",".jpeg"):
        im.convert("RGB").save(out, "JPEG", quality=JPG_Q, optimize=True, progressive=True)
    else:
        # 256 色量化(FASTOCTREE 保留每色 alpha,适合 LowPoly/卡通)
        q = im.convert("RGBA").quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        q.save(out, "PNG", optimize=True)
    new = out.stat().st_size
    tot_old += old; tot_new += new
    print(f"  {p.name:22s} {old/1024:7.1f}KB -> {new/1024:7.1f}KB  ({100*new/old:4.0f}%)")

print(f"---- 合计 {tot_old/1024/1024:.2f}MB -> {tot_new/1024/1024:.2f}MB ----")
