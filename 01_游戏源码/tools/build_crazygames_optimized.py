"""CrazyGames-only optimized build. Shared source and WeChat outputs are read-only.
Uses the shared, already approved cleanup of the v0.33 gameplay lineage.
"""
from pathlib import Path
import hashlib, io, json, re, zipfile, os
from PIL import Image

SRC = Path(__file__).resolve().parents[1]
ROOT = SRC.parent
SDK_BUILD = os.environ.get("CRAZY_SDK") == "1"
PERF_BUILD = os.environ.get("CRAZY_30FPS") == "1"
if PERF_BUILD and not SDK_BUILD:raise ValueError("30FPS build requires CRAZY_SDK=1")
LOAD_BUILD = os.environ.get("CRAZY_LOAD_FIX") == "1"
if LOAD_BUILD and not PERF_BUILD:raise ValueError("Loading fix requires CRAZY_30FPS=1")
TYPE_BUILD = os.environ.get("CRAZY_HOME_TYPE") == "1"
if TYPE_BUILD and not LOAD_BUILD:raise ValueError("Home typography requires CRAZY_LOAD_FIX=1")
VERSION = "v0.51-crazygames" if TYPE_BUILD else ("v0.49-crazygames" if LOAD_BUILD else ("v0.48-crazygames" if PERF_BUILD else ("v0.47-crazygames" if SDK_BUILD else "v0.46-crazygames")))
MUSIC_BUILD = os.environ.get("CRAZY_NEW_MUSIC") == "1"
if MUSIC_BUILD:
    if not TYPE_BUILD: raise ValueError("New music build requires CRAZY_HOME_TYPE=1")
    VERSION = "v0.53-crazygames"
if LOAD_BUILD:
    from crazygames_loading_build import loading_transform
if PERF_BUILD:
    from crazygames_performance_build import performance_transform
if SDK_BUILD:
    from crazygames_sdk_build import sdk_transform, sdk_html
OUT = ROOT / "04_试玩版本" / VERSION
WEB = OUT / "web"
WEB.mkdir(parents=True, exist_ok=True)
for folder in ("assets", "scripts"):
    (WEB / folder).mkdir(exist_ok=True)
hashes, generated, image_report = {}, [], []
def emit(relative, data):
    p = WEB / relative
    p.write_bytes(data if isinstance(data, bytes) else data.encode("utf-8"))
    generated.append(p)
    return relative
def read(relative):
    raw = (SRC / relative).read_bytes()
    hashes[relative] = hashlib.sha256(raw).hexdigest()
    return raw.decode("utf-8-sig")
def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError("Expected one source anchor: "+old[:100])
    return text.replace(old,new,1)

manifest = {}
names = re.findall(r'"([^"\n]+\.(?:png|jpg|jpeg|webp))"\s*:\s*"data:',read("src/assets_b64.js"))
for name in names:
    p = SRC / "assets" / name
    im = Image.open(p)
    old = im.size
    # Absolute-coordinate atlases are unchanged. Standalone fish and scenery
    # are drawn proportionally; care sheets use normalized 4x2 frame coordinates.
    if re.match(r"fish_\d+_v",name):
        im.thumbnail((256,256),Image.Resampling.LANCZOS)
    elif name.startswith("care_") and "room" not in name and "buttons" not in name:
        # exact 4x2 divisibility avoids bleeding between animation cells
        if im.width>1024:
            im=im.resize((1024, max(2,round(im.height*1024/im.width/2)*2)),Image.Resampling.LANCZOS)
    elif name=="coast_surface_v04.png":
        im.thumbnail((720,1280),Image.Resampling.LANCZOS)
    elif not any(x in name for x in ("atlas","harvest","journal","buttons","fisher","sheet","sprite")):
        im.thumbnail((1536,1536),Image.Resampling.LANCZOS)
    b=io.BytesIO()
    im.save(b,format="WEBP",quality=84,method=3)
    data=b.getvalue()
    relative="assets/"+hashlib.sha256(data).hexdigest()[:24]+".webp"
    if not (WEB / relative).exists():
        emit(relative,data)
    else: generated.append(WEB / relative)
    manifest[name]=relative
    image_report.append({"name":name,"before":old,"after":im.size})
audio={}
for p in sorted((SRC/"assets/audio").glob("*.mp3")):
    audio_source = SRC / "assets/audio_crazygames/Music_Loop_v053.mp3" if MUSIC_BUILD and p.name == "Music_Loop.mp3" else p
    data=audio_source.read_bytes()
    hashes[audio_source.relative_to(SRC).as_posix()] = hashlib.sha256(data).hexdigest()
    relative="assets/"+hashlib.sha256(data).hexdigest()[:24]+".mp3"
    emit(relative,data);audio[p.name]=relative
emit("scripts/assets.js","window.ASSET_INLINE="+json.dumps(manifest)+";window.AUDIO_INLINE="+json.dumps(audio)+";")

def optimize(name,s):
    s=s.replace("cat-and-fish.","cat-and-fish.crazy-basic.")
    s=s.replace("v0.33",VERSION).replace("Cat & Fish","Meow & Reel").replace("CAT &amp; FISH","Meow &amp; Reel")
    if name.endswith("platformSystem.js"):
        s=replace_once(s,'if (/(^|\\.)crazygames\\.com$/i.test(host) || /[?&](crazygames|isCrazyGames)=1/i.test(search)) return "crazygames";',
                       '/* Basic Launch: browser lifecycle, no SDK. */')
    if name.endswith("localizationConfig.js"):
        s=replace_once(s,'"剩余鱼线 {left}",\n    "Line: {left} / {max} m"','"剩余鱼线 {left}",\n    "Line: {left}"')
        s=replace_once(s,'"{max} 米",\n    "Line: {left} / {max} m"','"{max} 米",\n    "{max} m"')
    if name.endswith("localizationSystem.js"):
        s=s.replace('["小屋内部","Cat Cabin"]','["下沉深度","Depth"],["历史记录","Best"],["历史最深","Best Depth"],["小屋内部","Cat Cabin"]')
        if TYPE_BUILD:
            s=replace_once(s,'const output=t(entry.original);', 'const output=language==="en"&&node.parentElement.matches(".coast-upgrade>b")?"Upgrade":t(entry.original);')
    if name.endswith("game.js"):
        # Cap backing pixels, not CSS size or game coordinates/timing.
        s=replace_once(s,'Math.min(window.devicePixelRatio||1,3)','Math.min(window.devicePixelRatio||1,1.25,720/(VW*s))')
        s=s.replace('ctx.imageSmoothingQuality="high"','ctx.imageSmoothingQuality="medium"')
        s=replace_once(s,'function keepTexturesHot(){','function keepTexturesHot(){ return; // decoded bitmaps are already resident; avoid continuous invisible draws')
        s=replace_once(s,'now-lastIdleCanvasFrame<idleInterval','now-lastIdleCanvasFrame<idleInterval-1')
    if name.endswith("coastSystem.js"):
        s=replace_once(s,'const steps=96;','const steps=24;')
        start=s.index('   const im=imgs.coast_surface,bands=40;')
        end=s.index('\n  drawUnderwaterDetails',start)
        s=s[:start]+"""   const im=imgs.coast_surface;
   if(!surfaceCache || surfaceCacheSource!==im || surfaceCacheWater!==waterY-top){
    surfaceCache=document.createElement("canvas");surfaceCache.width=540;surfaceCache.height=960;
    const sc=surfaceCache.getContext("2d");
    // Preserve the old 40-band alpha, but rasterize it once rather than every frame.
    for(let i=0;i<40;i++){const y=i*24;sc.globalAlpha=top+y<waterY?1:Math.max(0,1-(top+y-waterY)/300);
     sc.drawImage(im,0,i*im.height/40,im.width,im.height/40,0,y,540,25);}
    surfaceCacheSource=im;surfaceCacheWater=waterY-top;
   }
   ctx.drawImage(surfaceCache,camX,top,width,sh);
  }"""+s[end:]
        s=s.replace(' let castTime=0,',' let surfaceCache=null,surfaceCacheSource=null,surfaceCacheWater=null;\n let castTime=0,')
    if name.endswith("harvestPresentationSystem.js"):
        s=replace_once(s,'Math.min(16,4+count*2)','Math.min(8,3+count)')
        s=replace_once(s,'c.width=64;c.height=64;','c.width=48;c.height=48;')
        s=replace_once(s,'13,64,64','13,48,48')
        # Reuse one rasterized coin across a burst instead of painting the atlas N times.
        anchor='  if(!reduced())for(let i=0;'
        s=replace_once(s,anchor,'''  let coinSprite=null;
  if(coinArt&&coinArt.complete&&coinArt.naturalWidth){
   coinSprite=coinArt._cgCoin;
   if(!coinSprite){coinSprite=document.createElement("canvas");coinSprite.width=48;coinSprite.height=48;
    game.CoastSystem.drawUI(coinSprite.getContext("2d"),coinArt,13,48,48);coinArt._cgCoin=coinSprite;}
  }
  if(!reduced())for(let i=0;''')
        s=replace_once(s,'if(coinArt&&coinArt.complete&&coinArt.naturalWidth)game.CoastSystem.drawUI(c.getContext("2d"),coinArt,13,48,48);',
                       'if(coinSprite)c.getContext("2d").drawImage(coinSprite,0,0);')
    if name.endswith("homeSystem.js"):
        s=replace_once(s,'if(t.dataset.action==="harvest-double"){game.HarvestPresentationSystem.double(screen,harvestResult);return;}',
                       'if(t.dataset.action==="harvest-double"){return;}')
    if name.endswith("uiFeedbackSystem.js"):
        s=replace_once(s,'function toast(message,kind){',
                       'function toast(message,kind){if(kind==="success"||/^(升级完成|渔具升级完成|猫咪外观已更换|已换上新外观|开心陪伴)/.test(String(message)))return;')
    if name.endswith("catCareSystem.js"):
        s=replace_once(s,"      '<button class=\"care-wardrobe\" data-action=\"open-cat\"><canvas class=\"coast-icon\" data-coast-art=\"9\" aria-hidden=\"true\"></canvas><b>更换外观</b></button>'+","")
        s=replace_once(s,'<span>图鉴</span></button>','</button>')
    return s

html=read("index.html")
html=re.sub(r"<title>.*?</title>","<title>Meow &amp; Reel - "+VERSION+"</title>",html,flags=re.S)
def css(m):
    relative=m[1].split("?")[0].removeprefix("./")
    return "<style>"+read(relative)+"</style>"
html=re.sub(r'<link\b[^>]*href="(\./src/[^"]+\.css(?:\?[^"]*)?)"[^>]*>',css,html)
excluded={"src/_export_src.js","src/debug.js","src/systems/mapEditorSystem.js","src/systems/mainSceneEditorBridge.js",
          "src/platform/douyinAdapter.js","src/platform/crazyGamesAdapter.js"}
count=0
bundle=[]
def js(m):
    global count
    relative=m[1].split("?")[0].removeprefix("./")
    if relative in excluded:return ""
    if relative=="src/assets_b64.js":
        if LOAD_BUILD:
            bundle.append((WEB/'scripts/assets.js').read_text(encoding='utf-8'))
            return ''
        return '<script defer src="scripts/assets.js"></script>'
    s=optimize(relative,read(relative))
    if SDK_BUILD:s=sdk_transform(relative,s)
    if PERF_BUILD:s=performance_transform(relative,s)
    if LOAD_BUILD:
        bundle.append(loading_transform(relative,s))
        return ''
    target=f"scripts/game-{count:03d}.js";count+=1
    emit(target,s)
    return '<script defer src="'+target+'"></script>'
html=re.sub(r'<script[^>]*src="([^"]+)"[^>]*></script>',js,html)
html=html.replace("</head>","""<style>
html,body {overscroll-behavior:none;user-select:none;-webkit-user-select:none;}
body {-webkit-touch-callout:none;}canvas{touch-action:none;}
.life-overlay,.coast-screen .life-overlay{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}
[data-action="harvest-double"],[data-action="analytics-export"]{display:none!important;}
</style></head>""")
if TYPE_BUILD:html=html.replace('</head>','<style>'+read('tools/crazygames_home_type.css')+'</style></head>')
if LOAD_BUILD:
    emit('scripts/game-bundle.js','"use strict";\n'+ '\n;\n'.join(bundle))
    html=html.replace('</body>','<script defer src="scripts/game-bundle.js"></script></body>')
def sdk_read(name):
    s=read(name)
    if LOAD_BUILD and name=='tools/crazygames_bootstrap.js':
        s=s.replace('panel.textContent="Unable to connect. Please enable CrazyGames SDK Data in the submission settings, then retry. / 连接失败，请确认后台已选择 SDK Data 存档后重试。";',
          'panel.textContent="Startup failed / 启动失败："+String(error&&error.message||error)+" — Retry / 请重试。若提示 dataModuleDisabled，请在后台启用 SDK Data 存档。";')
    return s
if SDK_BUILD:html=sdk_html(html,sdk_read,emit)
emit("index.html",html)
files=sorted(set(generated))
size=sum(p.stat().st_size for p in files)
assert size<20_000_000 and len(files)<1500
with zipfile.ZipFile(OUT/f"Meow-Reel-{VERSION.split('-')[0]}-CrazyGames.zip","w",zipfile.ZIP_DEFLATED) as z:
    for p in files:z.write(p,p.relative_to(WEB).as_posix())
report={"version":VERSION,"baseline":"v0.33 lineage + approved shared cleanup from v0.41-v0.44",
        "bytes":size,"files":len(files),"source_hashes":hashes,"image_dimensions":image_report,
        "local_test":"pending","platform_test":"pending","wechat_unchanged":"v0.44"}
(OUT/"build-info.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
(OUT/"使用说明.txt").write_text("""Meow & Reel / 渔获喵喵 v0.46 CrazyGames优化清理版
上传 Meow-Reel-v0.46-CrazyGames.zip；或上传 web 内全部文件，根目录含 index.html。
使用与v0.45相同的存档键，旧金币、图鉴、猫咪和升级进度保留。
复用已经确认的源码清理：移除背包、家具/房屋升级、旧多海域解锁及任务奖励模块。
保留鱼王、水下海王、礁石碰撞、钓鱼升级、图鉴、小猫陪伴；不接广告与SDK。
性能：降低高密屏绘制分辨率、海面40次分段绘制缓存为1次、禁用无形保温绘制、
降低独立图片解码尺寸、移除菜单实时背景模糊、复用结算金币并限制单次数量。
微信v0.44、CES和历史v0.33/v0.45没有修改。
此包仍需重新上传CrazyGames预览，并在真实手机测试；不是审核通过或已发布版本。
构建入口：01_游戏源码/tools/build_crazygames_optimized.py
""",encoding="utf-8")
if SDK_BUILD:
    (OUT/"使用说明.txt").write_text("""Meow & Reel v0.47 CrazyGames SDK测试包
上传本目录 Meow-Reel-v0.47-CrazyGames.zip，入口为根目录 index.html。
后台存档选项必须改为：Yes, using the Data Module from CrazyGames SDK。
勾选游戏支持通过SDK静音；移动设备支持；不要勾选在线多人。
接入SDK v3初始化、加载及游戏状态、平台静音、Data存档。广告保持关闭。
旧版同源本地存档仅在SDK无存档时尝试一次迁移，已有SDK进度优先。
SDK连接或Data配置失败会显示重试，不会偷偷启动新进度。
平台外普通网页使用本地存档；平台内存档仅由SDK管理。
继承v0.46性能优化及已确认清理，不改微信v0.44/CES。
需在CrazyGames预览检查SDK检测、存档、静音及iOS/Android实际表现。
未自动上传、提交审核或发布；接入SDK不代表卡顿已完全解决。
构建：设置CRAZY_SDK=1后运行01_游戏源码/tools/build_crazygames_optimized.py。
""",encoding="utf-8")
print(json.dumps({"version":VERSION,"bytes":size,"files":len(files)},ensure_ascii=False))
if PERF_BUILD:
    instructions=(OUT/"使用说明.txt").read_text(encoding="utf-8").replace("v0.47","v0.48")
    instructions+="\n30帧优先版：钓鱼渲染目标30FPS，跳帧不丢失模拟时间；画布最大540像素宽。\n画面外鱼不绘制，仍参与原模拟；摆尾4片，静止挂钩鱼直接绘制。鱼数量、碰撞和收益不改。\n目标帧率不等于所有电脑均可稳定达到，需CrazyGames QA复测。\n构建同时设置CRAZY_SDK=1和CRAZY_30FPS=1。\n"
    (OUT/"使用说明.txt").write_text(instructions,encoding="utf-8")
if LOAD_BUILD:
    instructions=(OUT/'使用说明.txt').read_text(encoding='utf-8').replace('v0.48','v0.49')
    instructions+='\n加载修复：54个游戏脚本合并为1个；解码并发4、总等待预算6秒；超时保留已加载原图。\n图片网络错误/20秒超时及关键素材处理异常显示阶段与重试按钮，不强行跳过碰撞初始化。\n保留SDK存档规则与30帧优化；构建额外设置CRAZY_LOAD_FIX=1。\n'
    (OUT/'使用说明.txt').write_text(instructions,encoding='utf-8')
if TYPE_BUILD:
    instructions=(OUT/'使用说明.txt').read_text(encoding='utf-8').replace('v0.49','v0.51')
    instructions+='\n英文首页排版：码头木牌居中两行、暖色粗体与轻描边；升级按钮单行Upgrade，缩小图标并留出安全边距。\n仅影响英文首页两处，中文及其它菜单不变；无新美术和网络字体。构建额外设置CRAZY_HOME_TYPE=1。\n'
    (OUT/'使用说明.txt').write_text(instructions,encoding='utf-8')
if MUSIC_BUILD:
    instructions=(OUT/'使用说明.txt').read_text(encoding='utf-8').replace('v0.51','v0.53')
    instructions+='\n背景音乐替换为用户提供的“新项目.mp3”，原样保留音频，不改钓鱼和UI音效、存档及SDK静音逻辑。\n新音乐源码为assets/audio_crazygames/Music_Loop_v053.mp3，仅本构建启用；旧音乐、微信包及历史包保留。\n构建额外设置CRAZY_NEW_MUSIC=1。循环衔接与听感待用户试听确认。\n'
    (OUT/'使用说明.txt').write_text(instructions,encoding='utf-8')
