#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一键同步并打包:
① 刷新 src/assets_b64.js(图片 data URI,给双击开发版用)
② 生成 src/_export_src.js(window.__EXPORT_SRC__={html,css,js},给页面内「导出 H5」按钮用)
③ 把 css / assets_b64 / _export_src / game.js 全部内联进 index.html,
   剥掉 debug.js → 单文件 seaking_standalone.html(投放/分发用)
改完 src/ 或 assets/ 重跑即可。用法:`python build_standalone.py`。"""
import argparse, base64, json, math, pathlib, re

ROOT = pathlib.Path(__file__).parent
ASSETS = ROOT / "assets"
AUDIO_DIR = ASSETS / "audio"
EXTS = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
AUDIO_EXTS = {".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav"}

js   = (ROOT / "src" / "game.js").read_text(encoding="utf-8")
css  = (ROOT / "src" / "style.css").read_text(encoding="utf-8") + "\n" + (ROOT / "src" / "lifeScene.css").read_text(encoding="utf-8") + "\n" + (ROOT / "src" / "coast.css").read_text(encoding="utf-8")
css += "\n" + (ROOT / "src" / "harvest.css").read_text(encoding="utf-8")
css += "\n" + (ROOT / "src" / "catalogJournal.css").read_text(encoding="utf-8")
css += "\n" + (ROOT / "src" / "catCare.css").read_text(encoding="utf-8")
css += "\n" + (ROOT / "src" / "localization.css").read_text(encoding="utf-8")
html = (ROOT / "index.html").read_text(encoding="utf-8")
MODULE_FILES = [
    "src/config/gameDataSchema.js",
    "src/config/fishingFeelConfig.js",
    "src/config/interactionFeelConfig.js",
    "src/config/balanceConfig.js",
    "src/config/fishCatalogConfig.js",
    "src/config/fishConfig.js",
    "src/data/defaultSaveData.js",
    "src/save/saveSystem.js",
    "src/systems/fishCatalogSystem.js",
    "src/systems/economySystem.js",
    "src/systems/fishBookSystem.js",
    "src/systems/gameEventBus.js",
    "src/systems/analyticsSystem.js",
    "src/systems/onboardingSystem.js",
    "src/platform/platformSystem.js",
    "src/platform/douyinAdapter.js",
    "src/platform/crazyGamesAdapter.js",
    "src/config/mapConfig.js",
    "src/config/mapThemeConfig.js",
    "src/config/pixelWorldConfig.js",
    "src/systems/mapVisualSystem.js",
    "src/systems/mapExpeditionSystem.js",
    "src/systems/pixelWorldSystem.js",
    "src/config/catConfig.js",
    "src/config/catAppearanceConfig.js",
    "src/cat/catSystem.js",
    "src/systems/catCollectionSystem.js",
    "src/systems/collectionFeedbackSystem.js",
    "src/config/facilityConfig.js",
    "src/systems/facilitySystem.js",
    "src/systems/catHomeSystem.js",
    "src/systems/homeStateSystem.js",
    "src/systems/sceneRouterSystem.js",
    "src/systems/overlayManagerSystem.js",
    "src/systems/settingsSystem.js",
    "src/config/localizationConfig.js",
    "src/systems/localizationSystem.js",
    "src/systems/uiFeedbackSystem.js",
    "src/systems/sessionSafetySystem.js",
    "src/systems/collectionViewSystem.js",
    "src/systems/catShowcaseSystem.js",
    "src/systems/progressGuideSystem.js",
    "src/config/mainLayoutConfig.js",
    "src/systems/homeLayoutSystem.js",
    "src/systems/mainSceneLayoutSystem.js",
    "src/systems/homeFishingBridgeSystem.js",
    "src/systems/harvestArtSystem.js",
    "src/systems/harvestPresentationSystem.js",
    "src/systems/coastSystem.js",
    "src/systems/catalogArtSystem.js",
    "src/systems/reefArtSystem.js",
    "src/systems/depthSystem.js",
    "src/systems/homeSystem.js",
    "src/systems/catCareSystem.js",
]
parser = argparse.ArgumentParser(description="猫与鱼单文件构建")
parser.add_argument("--layout", type=pathlib.Path, help="主界面部件编辑器导出的 JSON")
options = parser.parse_args()
layout_source = None
if options.layout:
    chosen = json.loads(options.layout.read_text(encoding="utf-8-sig"))
    if not isinstance(chosen, dict) or not isinstance(chosen.get("canvas"), dict):
        raise ValueError("布局必须为主界面部件编辑器导出的 canvas/dom JSON")
    canvas = chosen["canvas"]
    if canvas.get("version") not in (3, 4) or not isinstance(canvas.get("components"), dict):
        raise ValueError("请使用 v0.17 全局 UI 布局编辑器重新导出布局")
    for key, value in canvas["components"].items():
        if key not in ("cat", "pier", "camera", "upgrade", "start") or not isinstance(value, dict):
            raise ValueError("未知部件或无效配置：" + key)
        for field in ("x", "y", "w", "h"):
            n = value.get(field)
            if not isinstance(n, (int, float)) or isinstance(n, bool) or not math.isfinite(n):
                raise ValueError("部件坐标需要有限数字：" + key + "." + field)
    if canvas.get("ui") is not None:
        if not isinstance(canvas["ui"], dict):
            raise ValueError("钓鱼 HUD 布局必须为对象")
        allowed_ui = ("hudLine", "hudCoin", "hudCoinIcon", "hudGoal", "reelBtn", "exitBtn")
        for key, value in canvas["ui"].items():
            if key not in allowed_ui or not isinstance(value, dict):
                raise ValueError("未知钓鱼 HUD 部件或无效配置：" + key)
            for field in ("x", "y", "w", "h"):
                n = value.get(field)
                if not isinstance(n, (int, float)) or isinstance(n, bool) or not math.isfinite(n):
                    raise ValueError("钓鱼 HUD 坐标需要有限数字：" + key + "." + field)
    if not isinstance(chosen.get("dom", {}), dict):
        raise ValueError("dom 布局必须为对象")
    layout_source = "window.MAOMAO_LAYOUT = " + json.dumps(chosen, ensure_ascii=False).replace("<", "\\u003c") + ";"
modules = [(path, layout_source if layout_source and path == "src/config/mainLayoutConfig.js"
            else (ROOT / path).read_text(encoding="utf-8")) for path in MODULE_FILES]
runtime_js = "\n\n".join(source for _, source in modules + [("src/game.js", js)])

# 发布版仍使用同一套主界面，但移除仅供开发者使用的地图工作室入口与处理分支。
release_modules = []
for path, source in modules:
    if path == "src/systems/homeSystem.js":
        source = re.sub(r'<button class="setting-link" data-action="editor">.*?</button>', '', source)
        source = re.sub(r'<button class="interior-editor-entry"[^>]*>.*?</button>', '', source)
        source = source.replace('if(action==="editor"){if(game.MapEditorSystem)game.MapEditorSystem.open();return;}', '')
        source = source.replace('if(action==="open-interior-editor"){root.open("./小屋家具编辑器.html","_blank");return;}', '')
    release_modules.append((path, source))
release_js = js.replace('  const studio=window.CatFishGame&&window.CatFishGame.MapEditorSystem;\n  if(studio)studio.drawWorld(ctx,{x:0,y:WATER_Y+30,w:WORLD_W,h:WORLD_H-WATER_Y-30});\n', '')

# 1) 刷新 assets_b64.js:图片走 ASSET_INLINE,音频走 AUDIO_INLINE
def data_uri_from(p: pathlib.Path, ext_map: dict) -> str:
    mime = ext_map[p.suffix.lower()]
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode("ascii")

# 已移除玩法的原图保留在磁盘供恢复，但不再内嵌到开发缓存或试玩包。
RETIRED_ASSETS = {"map_abyss_portal.webp", "boss_swim_cat.webp", "boss_tentacle_castle.webp"}
RETIRED_ASSETS.update(f"boss_tentacle_{index}.webp" for index in range(8))
files = sorted(p for p in ASSETS.iterdir()
               if p.suffix.lower() in EXTS and p.name != "home_hut_background.jpg"
               and p.name not in RETIRED_ASSETS)
audio_files = sorted(AUDIO_DIR.iterdir()) if AUDIO_DIR.exists() else []
audio_files = [p for p in audio_files if p.suffix.lower() in AUDIO_EXTS]

ab_lines = [
    "/* 自动生成 by build_standalone.py —— 勿手改 */",
    "window.ASSET_INLINE = {",
]
for p in files:
    ab_lines.append(f"  {json.dumps(p.name)}: {json.dumps(data_uri_from(p, EXTS))},")
ab_lines.append("};")
ab_lines.append("window.AUDIO_INLINE = {")
for p in audio_files:
    ab_lines.append(f"  {json.dumps(p.name)}: {json.dumps(data_uri_from(p, AUDIO_EXTS))},")
ab_lines.append("};\n")
ab64 = "\n".join(ab_lines)
(ROOT / "src" / "assets_b64.js").write_text(ab64, encoding="utf-8")

# 2) 生成 _export_src.js —— 给「导出 H5」按钮在 file:// 下免 fetch 拼自包含
# JSON 串里的 html 含字面 "</script>",直接内联进 <script> 会被 HTML 解析器提前关闭。
# 把每个 "<" 转成 "<":JS / JSON 运行时仍解为 "<",但 HTML 解析器不再误判。
exp = ("/* 自动生成 by build_standalone.py —— 勿手改。供「导出 H5」按钮用 */\n"
       "window.__EXPORT_SRC__ = "
       + json.dumps({"html": html, "css": css, "js": runtime_js}, ensure_ascii=False).replace("<", "\\u003c")
       + ";\n")
(ROOT / "src" / "_export_src.js").write_text(exp, encoding="utf-8")

# 3) 内联出单文件投放版 —— 剥 debug.js,其余全部 inline
# 用正则匹配,容忍 ?v=2 之类的防缓存后缀
out_html = html
# 正式包不内嵌开发期的导出源码副本，避免把调试/编辑器源码作为字符串带入。
out_html = re.sub(r'\s*<script[^>]+src="[^"]*src/_export_src\.js(?:\?[^"]*)?"[^>]*></script>', '', out_html)
out_html = re.sub(
    r'<link[^>]+href="[./]*src/style\.css(?:\?[^"]*)?"[^>]*/?>',
    lambda m: "<style>\n" + css + "\n</style>",
    out_html
)
out_html = re.sub(r'\s*<link[^>]+href="[./]*src/(?:lifeScene|coast|harvest|catalogJournal|catCare)\.css(?:\?[^"]*)?"[^>]*/?>', '', out_html)
out_html = re.sub(
    r'<script[^>]+src="[./]*src/assets_b64\.js(?:\?[^"]*)?"[^>]*></script>',
    lambda m: "<script>\n" + ab64 + "\n</script>",
    out_html
)
for relative_path, source in release_modules:
    escaped_path = re.escape(relative_path)
    out_html = re.sub(
        rf'<script[^>]+src="[./]*{escaped_path}(?:\?[^"]*)?"[^>]*></script>',
        lambda m, content=source: "<script>\n" + content + "\n</script>",
        out_html
    )
out_html = re.sub(
    r'<script[^>]+src="[./]*src/_export_src\.js(?:\?[^"]*)?"[^>]*></script>',
    lambda m: "<script>\n" + exp + "\n</script>",
    out_html
)
out_html = re.sub(
    r'<script[^>]+src="[./]*src/game\.js(?:\?[^"]*)?"[^>]*></script>',
    lambda m: "<script>\n" + release_js + "\n</script>",
    out_html
)
# 移除 debug.js 引用 + 相邻的"投放时删除"注释
out_html = re.sub(r'\s*<!--[^-]*debug\.js[^-]*-->', '', out_html)
out_html = re.sub(r'\s*<script[^>]+src="[^"]*debug\.js(?:\?[^"]*)?"[^>]*></script>', '', out_html)
out_html = re.sub(r'\s*<script[^>]+src="[^"]*mapEditorSystem\.js(?:\?[^"]*)?"[^>]*></script>', '', out_html)
out_html = re.sub(r'\s*<script[^>]+src="[^"]*mainSceneEditorBridge\.js(?:\?[^"]*)?"[^>]*></script>', '', out_html)

# 防 replace 静默失败:核心标记必须出现 + 不能残留任何外链 script
assert "ASSET_INLINE" in out_html, "内联失败:assets_b64 标签未匹配"
assert "WAVE_CFG" in out_html, "内联失败:game.js 标签未匹配"
assert "FishBookSystem" in out_html, "内联失败:猫与鱼基础模块未匹配"
leftover = re.findall(r'<script[^>]+src="[^"]+"[^>]*></script>', out_html)
assert not leftover, f"还有 {len(leftover)} 个外链 script 残留:{leftover[:3]}"

dst = ROOT / "seaking_standalone.html"
dst.write_text(out_html, encoding="utf-8")

size_mb = dst.stat().st_size/1024/1024
print(f"已生成 src/assets_b64.js   ({len(files)} 张图 + {len(audio_files)} 个音频)")
print(f"已生成 src/_export_src.js  (html+css+js 字符串副本)")
print(f"已生成 {dst.name}  ({size_mb:.2f} MB)")

# 体积守卫:投放包必须 ≤ 4.5MB(时刻保持)
BUDGET_MB = 4.5
if size_mb > BUDGET_MB:
    print(f"\n[!!!] 超出投放体积预算!{size_mb:.2f} MB > {BUDGET_MB} MB")
    print(f"   请压缩素材:python compress_assets.py(从 _assets_orig 重新压),再重跑本脚本。")
    print(f"   最大的几个素材:")
    big = sorted(ASSETS.glob("*"), key=lambda p: -p.stat().st_size)[:6]
    for p in big:
        print(f"     {p.stat().st_size/1024:7.1f} KB  {p.name}")
else:
    print(f"[OK] 体积 {size_mb:.2f} MB,在 {BUDGET_MB} MB 预算内(余量 {BUDGET_MB-size_mb:.2f} MB)")
