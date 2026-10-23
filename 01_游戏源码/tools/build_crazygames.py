"""Independent Basic Launch build from the immutable v0.33 release.
No changes to shared gameplay or WeChat outputs. Run with bundled Python + Pillow.
"""
from pathlib import Path
import base64, hashlib, io, json, re, zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "04_试玩版本/v0.33/猫与鱼-v0.33.html"
OUT = ROOT / "04_试玩版本/v0.45-crazygames"
WEB = OUT / "web"
VERSION = "v0.45-crazygames"
WEB.mkdir(parents=True, exist_ok=True)
for folder in ("assets", "scripts"):
    (WEB / folder).mkdir(exist_ok=True)
html = SOURCE.read_text(encoding="utf-8")
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assets = {}
def asset(match):
    mime, encoded = match.groups()
    raw = base64.b64decode(encoded)
    key = hashlib.sha256(raw).hexdigest()[:24]
    if key in assets:
        return assets[key]
    cached = list((WEB / "assets").glob(key + ".*"))
    if cached:
        assets[key] = cached[0].relative_to(WEB).as_posix()
        return assets[key]
    ext = {"png":"png","jpeg":"jpg","jpg":"jpg","webp":"webp",
           "mpeg":"mp3","mp3":"mp3","ogg":"ogg","wav":"wav"}[mime.split("/")[1]]
    if mime.startswith("image/"):
        # Preserve atlas dimensions/frame alignment, alpha and existing artwork.
        im = Image.open(io.BytesIO(raw))
        buf = io.BytesIO()
        im.save(buf, format="WEBP", quality=82, method=6)
        if len(buf.getvalue()) < len(raw):
            raw, ext = buf.getvalue(), "webp"
    relative = f"assets/{key}.{ext}"
    (WEB / relative).write_bytes(raw)
    assets[key] = relative
    return relative
html = re.sub(r"data:((?:image/(?:png|jpeg|jpg|webp)|audio/(?:mpeg|mp3|ogg|wav)));base64,([A-Za-z0-9+/=]+)", asset, html)
html = re.sub(r"<title>.*?</title>", "<title>渔获喵喵 | Cat & Fish - v0.45 CrazyGames</title>", html, flags=re.S)
html = html.replace("v0.33", VERSION)
# v0.33 already embeds localization.css in its combined style block, but
# retains a redundant development link. Remove that broken duplicate.
html = re.sub(r'<link[^>]+href="[^"]*src/localization\.css[^"]*"[^>]*>', '', html)
# Separate save/language/analytics storage from original H5 on a shared origin.
html = html.replace("cat-and-fish.", "cat-and-fish.crazy-basic.")
# Baseline has two fragment translations that incorrectly introduce parameters
# absent from their source text, producing literal {left}/{max} in the HUD.
assert html.count('"Line: {left} / {max} m"') == 2
html = html.replace('"Line: {left} / {max} m"', '"Line: {left}"', 1)
html = html.replace('"Line: {left} / {max} m"', '"{max} m"', 1)
html = html.replace('["小屋内部","Cat Cabin"]',
                    '["下沉深度","Depth"],["历史最深","Best Depth"],["历史最深记录","Best Depth"],["历史记录","Best"],["小屋内部","Cat Cabin"]')
# Basic Launch intentionally has no SDK, ads, or external network dependency.
html = html.replace('if (/(^|\\.)crazygames\\.com$/i.test(host) || /[?&](crazygames|isCrazyGames)=1/i.test(search)) return "crazygames";',
                    '/* Basic Launch: use browser lifecycle and local storage. */')
html = html.replace('if(t.dataset.action==="harvest-double"){game.HarvestPresentationSystem.double(screen,harvestResult);return;}',
                    'if(t.dataset.action==="harvest-double"){return;}')
scripts = []
def script(match):
    attrs, body = match.groups()
    if 'src=' in attrs:
        raise RuntimeError("Unexpected external script in baseline: "+attrs)
    if 'platform.register("crazygames", adapter)' in body or 'platform.register("douyin", adapter)' in body:
        return ""
    relative = f"scripts/game-{len(scripts):03d}.js"
    (WEB / relative).write_text(body, encoding="utf-8")
    scripts.append(relative)
    return f'<script src="{relative}"></script>'
html = re.sub(r"<script\b([^>]*)>(.*?)</script>", script, html, flags=re.S|re.I)
html = html.replace("</head>", """<style>
html,body { overscroll-behavior:none; -webkit-user-select:none; user-select:none; }
body { -webkit-touch-callout:none; }
canvas { touch-action:none; }
[data-action="harvest-double"],[data-action="analytics-export"] { display:none!important; }
</style></head>""")
html = html.replace("v0.33", VERSION)
(WEB / "index.html").write_text(html, encoding="utf-8")
files = sorted(p for p in WEB.rglob("*") if p.is_file())
size = sum(p.stat().st_size for p in files)
assert size < 20_000_000, f"Mobile size budget exceeded: {size}"
assert len(files) < 1500
with zipfile.ZipFile(OUT / "CatFish-v0.45-CrazyGames-Basic.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for p in files:
        z.write(p, p.relative_to(WEB).as_posix())
manifest = {"version":VERSION,"baseline":"v0.33","baseline_sha256":source_hash,
            "mode":"Basic Launch - no SDK or ads","bytes":size,"files":len(files),
            "asset_count":len(assets),"local_test":"pending","platform_test":"pending",
            "wechat_version_unchanged":"v0.44"}
(OUT / "build-info.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
(OUT / "使用说明.txt").write_text("""渔获喵喵 CrazyGames 独立基础测试版 v0.45
基于 v0.33 原版，微信 v0.44 和 CES 工程未改动。

上传文件：CatFish-v0.45-CrazyGames-Basic.zip
ZIP 根目录含 index.html，不上传本目录的说明和测试文件。
本地预览：使用 HTTP 静态服务器打开 web/index.html。
可以用 Python：python -m http.server 8890 --directory web
再打开 http://localhost:8890/

这一版不接 SDK，不请求广告，隐藏结算翻倍和本地埋点导出按钮。
没有云存档，进度保存在当前浏览器；与原 H5 存档隔离。
语言沿用原版，根据浏览器选择，可在设置切换。
图像保持原始尺寸和透明通道，仅压缩格式；不重新生成美术。
仍需在 CrazyGames 上传预览、Safari/iPhone、安卓真机验证。
不表示已过平台审核，也不是正式商业化版本。

后续源码维护：01_游戏源码/tools/build_crazygames.py 为此版本构建入口。
不要直接修改 web 内生成文件，不要覆盖 v0.33 历史原版。
后续 Full Launch 需要另行接入 SDK、数据存储和正式广告。
官方要求：https://docs.crazygames.com/requirements/technical/
""",encoding="utf-8")
print(json.dumps(manifest,ensure_ascii=False))
