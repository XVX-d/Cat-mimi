"""Source-based WeChat build. Original simulation is concatenated, never replaced.
All writes are restricted to the designated generated project. No H5 asset edits.
"""
from pathlib import Path
import argparse, re, json, hashlib, shutil, io, datetime
from PIL import Image

SOURCE=Path(__file__).resolve().parents[1]
ROOT=SOURCE.parent
VERSION='v0.44'
def build():
    target=ROOT/'04_试玩版本'/VERSION/'微信测试工程'
    target.mkdir(parents=True,exist_ok=True)
    inline=(SOURCE/'src/assets_b64.js').read_text(encoding='utf-8-sig')
    names=re.findall(r'"([^"\n]+\.(?:png|jpg|jpeg|webp))"\s*:\s*"data:',inline)
    manifest={'images':{},'audio':{}}
    packages=[];sizes=[];index=0;used=0
    def asset_file(name,data):
        nonlocal index,used
        if used+len(data)>3500000:index+=1;used=0
        folder='res'+str(index)
        if folder not in packages:packages.append(folder);sizes.append(0)
        p=target/folder/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
        used+=len(data);sizes[index]+=len(data)
        return folder+'/'+name
    for name in names:
        p=SOURCE/'assets'/name
        if not p.exists():raise FileNotFoundError(p)
        im=Image.open(p).convert('RGBA')
        # Keep atlas coordinate systems intact. Downscale only standalone fish/backgrounds.
        if re.match(r'fish_\d+_v',name):im.thumbnail((256,256),Image.Resampling.LANCZOS)
        elif name.startswith('care_') and 'room' not in name and 'buttons' not in name:im.thumbnail((1024,1024),Image.Resampling.LANCZOS)
        elif name=='coast_surface_v04.png':im.thumbnail((720,1280),Image.Resampling.LANCZOS)
        elif not any(s in name for s in ['atlas','harvest_minimal','catalog_journal','care_buttons']):im.thumbnail((1536,1536),Image.Resampling.LANCZOS)
        b=io.BytesIO()
        opaque=im.getextrema()[3]==(255,255)
        # Chroma-key sheets must retain exact color relationships; indexed PNG keeps alpha.
        if opaque and not any(s in name for s in ['atlas','care_','harvest','journal']):
            out=Path(name).stem+'.jpg';im.convert('RGB').save(b,format='JPEG',quality=86,optimize=True)
        else:
            out=Path(name).stem+'.png';im.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(b,format='PNG',optimize=True)
        manifest['images'][name]=asset_file(out,b.getvalue())
    for p in sorted((SOURCE/'assets/audio').glob('*.mp3')):
        manifest['audio'][p.name]=asset_file('audio/'+p.name,p.read_bytes())
    scripts=re.findall(r'<script[^>]+src="\./([^"?]+)',(SOURCE/'index.html').read_text(encoding='utf8'))
    excluded={'src/assets_b64.js','src/_export_src.js','src/debug.js','src/systems/homeSystem.js','src/systems/mainSceneEditorBridge.js','src/systems/mapEditorSystem.js'}
    sources=[s for s in scripts if s not in excluded]
    sources.insert(sources.index('src/platform/platformSystem.js')+1,'src/platform/wechatAdapter.js')
    aliases='document,navigator,location,performance,localStorage,Image,MutationObserver,NodeFilter,getComputedStyle,requestAnimationFrame,cancelAnimationFrame,addEventListener,removeEventListener,innerWidth,innerHeight'.split(',')
    chunks=['module.exports=function(window){\nconst {'+','.join(aliases)+'}=window;\n']
    hashes={}
    for name in sources:
        p=SOURCE/name;s=p.read_text(encoding='utf-8-sig');hashes[name]=hashlib.sha256(p.read_bytes()).hexdigest()
        # Browser global-property lookup is explicit under CommonJS scope.
        if name=='src/game.js':
            s=re.sub(r'(?<![\w.])ZOOM_(BOAT|FISH|CFG)\b',r'window.ZOOM_\1',s)
        chunks.extend(['\n// SOURCE: '+name+'\n',s,'\n'])
    chunks.append('\n};\n')
    (target/'original-game.js').write_text(''.join(chunks),encoding='utf8')
    for name in ['runtime.js','view.js']:
        text=(SOURCE/'wechat'/name).read_text(encoding='utf8')
        if name=='runtime.js':text=re.sub(r"title:'渔获喵喵 v[0-9.]+", "title:'渔获喵喵 "+VERSION,text)
        (target/name).write_text(text,encoding='utf8')
    (target/'manifest.js').write_text('module.exports='+json.dumps(manifest,ensure_ascii=False)+';',encoding='utf8')
    (target/'game.json').write_text(json.dumps({'deviceOrientation':'portrait','subpackages':[{'name':p,'root':p+'/'} for p in packages]},indent=2),encoding='utf8')
    for p in packages:(target/p/'game.js').write_text('// Resource-only subpackage.\n',encoding='utf8')
    boot="""'use strict';
const wxapi=wx;
const manifest=require('./manifest');
const root=require('./runtime')(wxapi,manifest);
GameGlobal.MAOMAO=root;
const canvas=root.document.getElementById('game'),ctx=canvas.getContext('2d');
canvas.width=540;canvas.height=960;
function status(s){ctx.fillStyle='#164c68';ctx.fillRect(0,0,540,960);ctx.fillStyle='#fff3d0';ctx.textAlign='center';ctx.font='26px sans-serif';ctx.fillText('渔获喵喵',270,410);ctx.font='20px sans-serif';ctx.fillText(s,270,480);root.WeChatHost.present();}
const packages=PACKAGES;
let cursor=0,loading=false,failed=false;
function next(){if(loading)return;if(cursor===packages.length){require('./original-game')(root);require('./view')(root);root.WeChatHost.loaded();return;}loading=true;failed=false;status('加载完整游戏资源 '+(cursor+1)+' / '+packages.length);wxapi.loadSubpackage({name:packages[cursor],success(){loading=false;cursor++;next();},fail(err){loading=false;failed=true;console.error(err);status('资源加载失败，点击重试');}});}
wxapi.onTouchEnd(()=>{if(failed)next();});next();
""".replace('PACKAGES',json.dumps(packages))
    (target/'game.js').write_text(boot,encoding='utf8')
    cfg=json.loads(Path(r'D:\_project\_MCJ\AI\CES\project.config.json').read_text(encoding='utf-8-sig'))
    cfg.update(projectname='yuhuo-miaomiao-source-'+VERSION.replace('.',''),compileType='game',description='v0.33源码微信适配测试，未发布')
    cfg['setting'].update(es6=True,enhance=True,uploadWithSourceMap=False)
    cfg['packOptions']={'ignore':[{'type':'file','value':f} for f in ['build-manifest.json','README.md','.eslintrc.js','model.js','asset-manifest.js']]+[{'type':'folder','value':f} for f in ['assets','audio','images','js','shared']],'include':[]}
    (target/'project.config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf8')
    main=sum(p.stat().st_size for p in target.iterdir() if p.is_file() and p.name not in ['build-manifest.json','project.config.json','project.private.config.json'])
    total=main+sum(sizes)
    assert main<4*1024*1024,(main,'Main package too large')
    assert total<20*1024*1024,(total,'Conservative complete-package budget exceeded')
    report={'version':VERSION,'baseline':'v0.33','source':str(SOURCE),'original_source_hashes':hashes,'excluded_browser_files':sorted(excluded),'main_bytes':main,'resource_bytes':sizes,'total_bytes':total,'image_count':len(names),'audio_count':len(manifest['audio']),'validation':'development testing; not approved for release'}
    (target/'build-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'target':str(target),'main_bytes':main,'total_bytes':total,'packages':len(packages),'images':len(names)},ensure_ascii=False))
    return target,report
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--install',action='store_true');args=parser.parse_args()
    target,report=build()
    if args.install:
        import zipfile
        dest=Path(r'D:\_project\_MCJ\AI\CES')
        backup=ROOT/'05_版本备份'/('微信测试入口替换前-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.zip')
        with zipfile.ZipFile(backup,'w',zipfile.ZIP_DEFLATED) as z:
            for p in dest.iterdir():
                if p.is_file():z.write(p,p.name)
        shutil.copytree(target,dest,dirs_exist_ok=True)
        print('Installed current generated project into CES; unrelated files are not overwritten or deleted.')
