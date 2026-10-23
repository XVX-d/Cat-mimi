"""Bounded, observable startup for the CrazyGames-only build."""
def once(s,a,b):
    if s.count(a)!=1:raise ValueError('Loading anchor mismatch: '+a[:60])
    return s.replace(a,b,1)

def loading_transform(name,s):
    if not name.endswith('game.js'):return s
    s=once(s,'let pending=Object.keys(ASSET_LIST).length;', '''let pending=Object.keys(ASSET_LIST).length;
let cgFinalizeStarted=false;
window.CGLoading={stage:'images',asset:'',warnings:[],failed:false,started:performance.now()};
function cgLoadFail(stage,error){
 const st=window.CGLoading;if(st.failed)return;st.failed=true;st.stage=stage;
 st.error=String(error&&error.message||error);console.error('[CG loading]',stage,st.error);
 const panel=document.createElement('div');panel.id='cg-load-error';
 panel.style.cssText='position:fixed;inset:0;z-index:1000000;background:#10394bf5;color:white;display:grid;place-content:center;text-align:center;padding:24px;font:17px sans-serif';
 const label=document.createElement('p');label.textContent='Loading failed / 加载未完成：'+stage+' — '+st.error;
 const button=document.createElement('button');button.textContent='Retry / 重新加载';button.style.cssText='padding:14px;margin:16px';button.onclick=()=>location.reload();
 panel.append(label,button);document.body.appendChild(panel);
}
function cgBound(p,ms){let timer;return Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('decode timeout')),Math.max(1,ms));})]).finally(()=>clearTimeout(timer));}
''')
    start=s.index('async function finalizeLoading(){')
    end=s.index('\nfunction imageToCanvas(k)',start)
    s=s[:start]+'''async function finalizeLoading(){
 const st=window.CGLoading;if(st.failed)return;
 st.stage='decode';
 // Image onload has already completed. decode() is an optimization, not an
 // unbounded prerequisite. Keep the original drawable Image on timeout.
 const keys=Object.keys(IMG),deadline=performance.now()+6000;let cursor=0;
 async function worker(){while(cursor<keys.length){
  const key=keys[cursor++],im=IMG[key];if(!im)continue;st.asset=key;
  if(im.decode&&performance.now()<deadline){try{await cgBound(im.decode(),deadline-performance.now());}
   catch(e){st.warnings.push({asset:key,reason:String(e.message||e)});}}
  if(im instanceof HTMLImageElement&&(!im.complete||!im.naturalWidth))throw Error('Invalid image: '+key);
  // Materialize only small frequently-drawn sprites. Do not duplicate every
  // full-screen/legacy atlas into CPU pixels during startup.
  if(im.width*im.height<=262144&&key.indexOf('fish_')===0)imageToCanvas(key);
  await new Promise(r=>setTimeout(r,0));
 }}
 await Promise.all([worker(),worker(),worker(),worker()]);
 if(st.failed)return;
 st.stage='reef-collision';await new Promise(r=>setTimeout(r,0));
 if(window.CatFishGame.ReefArtSystem&&!window.CatFishGame.ReefArtSystem.prepare(IMG))throw Error('Reef atlas unavailable');
 st.stage='catalog';await new Promise(r=>setTimeout(r,0));
 window.CatFishGame.CatalogArtSystem.prepare(IMG.catalog_journal);
 if(st.failed)return;
 st.stage='ready';st.asset='';st.durationMs=performance.now()-st.started;
 window._loadingFinalized=true;
 try{if(window.preloadAllAudio)setTimeout(window.preloadAllAudio,300);}catch(e){}
}
'''+s[end:]
    s=once(s,'if(--pending===0){alEvent("LOADED");applyUiLayout();finalizeLoading();}',
        '''if(--pending===0&&!cgFinalizeStarted&&!window.CGLoading.failed){cgFinalizeStarted=true;
    try{alEvent("LOADED");applyUiLayout();finalizeLoading().catch(e=>cgLoadFail(window.CGLoading.stage,e));}
    catch(e){cgLoadFail('layout',e);}}''')
    s=once(s,'im.onload=()=>{IMG[k]=im;predecodeImage(im);finishAssetRequest();};',
        '''let cgDone=false;
  const cgTimer=setTimeout(()=>cgFinish(Error('Image request timeout: '+k)),20000);
  function cgFinish(error){if(cgDone)return;cgDone=true;clearTimeout(cgTimer);
   if(error)cgLoadFail('images',error);else IMG[k]=im;finishAssetRequest();}
  im.onload=()=>cgFinish();''')
    s=once(s,'im.onerror=finishAssetRequest;',"im.onerror=()=>cgFinish(Error('Image unavailable: '+k));")
    return s
