/* Native WeChat boundary. No browser/WebView, eval, or replacement fishing model. */
'use strict';
module.exports=function createRuntime(wx,manifest){
  const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
  const sys=wx.getAppBaseInfo?wx.getAppBaseInfo():wx.getSystemInfoSync();
  const nativeRAF=typeof requestAnimationFrame==='function'?requestAnimationFrame:fn=>setTimeout(()=>fn(Date.now()),16);
  const nativeCAF=typeof cancelAnimationFrame==='function'?cancelAnimationFrame:clearTimeout;
  function emitter(o){const listeners={};o.addEventListener=(k,f)=>{(listeners[k]||(listeners[k]=[])).push(f);};o.removeEventListener=(k,f)=>{listeners[k]=(listeners[k]||[]).filter(x=>x!==f);};o.dispatchEvent=e=>{(listeners[e.type]||[]).slice().forEach(f=>f(e));};return o;}
  function element(){const classes=new Set();return emitter({style:{setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}},dataset:{},classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>{if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);return on;}},children:[],appendChild(n){this.children.push(n);n.parentElement=this;return n;},remove(){},setAttribute(){},removeAttribute(){},querySelector:()=>null,querySelectorAll:()=>[],closest:()=>null});}
  function decorateCanvas(c){const extras=element();for(const key of Object.keys(extras)){if(['style','dataset','classList','children'].includes(key)&&c[key]!=null)continue;c[key]=extras[key];}const x=c.getContext('2d');if(!x.roundRect)x.roundRect=function(a,b,w,h,r){r=Array.isArray(r)?r[0]:r;r=Math.min(r||0,Math.abs(w)/2,Math.abs(h)/2);this.moveTo(a+r,b);this.lineTo(a+w-r,b);this.quadraticCurveTo(a+w,b,a+w,b+r);this.lineTo(a+w,b+h-r);this.quadraticCurveTo(a+w,b+h,a+w-r,b+h);this.lineTo(a+r,b+h);this.quadraticCurveTo(a,b+h,a,b+h-r);this.lineTo(a,b+r);this.quadraticCurveTo(a,b,a+r,b);this.closePath();};return c;}
  // The first native canvas is the display; keep the 9:16 game on a separate surface.
  const display=wx.createCanvas(),displayCtx=display.getContext('2d');
  const canvas=decorateCanvas(wx.createCanvas());
  const backdrop=wx.createCanvas();backdrop.width=20;backdrop.height=36;
  const backdropCtx=backdrop.getContext('2d');let hasBackdrop=false;
  const wrap=element(),body=element(),html=element();
  const w=emitter({wx,innerWidth:info.windowWidth,innerHeight:info.windowHeight,devicePixelRatio:Math.min(info.pixelRatio||1,2),setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id),setInterval:(fn,ms)=>setInterval(fn,ms),clearInterval:id=>clearInterval(id),
    performance:{now:()=>Date.now()-epoch},location:{search:'?nodebug',hostname:'wechat',href:'wechat://game'},navigator:{language:sys.language||'zh-CN',languages:[sys.language||'zh-CN'],userAgent:'WeChat MiniGame',vibrate:()=>{wx.vibrateShort({type:'light'});return true;}},
    ASSET_INLINE:manifest.images,AUDIO_INLINE:manifest.audio});
  const epoch=Date.now();
  const doc=emitter({title:'渔获喵喵 v0.36',hidden:false,readyState:'loading',body,documentElement:html,getElementById:id=>id==='game'?canvas:id==='wrap'?wrap:null,querySelector:()=>null,querySelectorAll:()=>[],createTreeWalker:()=>({nextNode:()=>false}),
    createElement:tag=>tag==='canvas'?decorateCanvas(wx.createCanvas()):element()});
  w.document=doc;w.window=w;
  w.localStorage={getItem:k=>{const v=wx.getStorageSync(k);return v===''?null:String(v);},setItem:(k,v)=>wx.setStorageSync(k,String(v)),removeItem:k=>wx.removeStorageSync(k)};
  w.Image=function(){const im=wx.createImage();for(const [key,get] of [['naturalWidth',()=>im.width],['naturalHeight',()=>im.height],['complete',()=>im.width>0]])if(im[key]===undefined)Object.defineProperty(im,key,{get,configurable:true});return im;};
  w.MutationObserver=class {observe(){}disconnect(){}};
  w.NodeFilter={SHOW_ELEMENT:1,SHOW_TEXT:4};
  w.getComputedStyle=()=>({getPropertyValue:()=>'',width:'540px',height:'960px'});
  canvas.setPointerCapture=()=>{};canvas.releasePointerCapture=()=>{};
  function viewport(){const scale=Math.min(w.innerWidth/540,w.innerHeight/960);return {left:(w.innerWidth-540*scale)/2,top:(w.innerHeight-960*scale)/2,width:540*scale,height:960*scale,scale};}
  canvas.getBoundingClientRect=viewport;
  function present(){
    const d=w.devicePixelRatio,r=viewport(),bw=Math.round(w.innerWidth*d),bh=Math.round(w.innerHeight*d);
    if(display.width!==bw||display.height!==bh){display.width=bw;display.height=bh;}
    displayCtx.setTransform(d,0,0,d,0,0);displayCtx.globalAlpha=1;
    displayCtx.fillStyle='#327f99';displayCtx.fillRect(0,0,w.innerWidth,w.innerHeight);
    // Low-resolution scene-only sampling produces a soft extension without duplicating UI.
    if(hasBackdrop){const cover=Math.max(w.innerWidth/20,w.innerHeight/36);displayCtx.imageSmoothingEnabled=true;displayCtx.imageSmoothingQuality='high';displayCtx.drawImage(backdrop,(w.innerWidth-20*cover)/2,(w.innerHeight-36*cover)/2,20*cover,36*cover);displayCtx.fillStyle='rgba(194,227,230,.18)';displayCtx.fillRect(0,0,w.innerWidth,w.innerHeight);}
    displayCtx.drawImage(canvas,r.left,r.top,r.width,r.height);
  }
  const sounds=new Map();let engine=null;
  const host={connect:e=>{engine=e;},getEngine:()=>engine,present,viewport,
    captureBackground(){backdropCtx.clearRect(0,0,20,36);backdropCtx.drawImage(canvas,0,0,20,36);hasBackdrop=true;},
    sound(file,loop,volume){if(!file||!manifest.audio[file])return;let a=sounds.get(file);if(!a){a=wx.createInnerAudioContext();a.src=manifest.audio[file];sounds.set(file,a);}if(loop&&a.paused===false)return;a.loop=loop;a.volume=volume;a.play();},
    stopSound:file=>{const a=sounds.get(file);if(a)a.stop();},
    stopAll:()=>sounds.forEach(a=>a.pause()),
    exportJSON(text){const path=wx.env.USER_DATA_PATH+'/yuhuo-miaomiao-analytics.json';wx.getFileSystemManager().writeFile({filePath:path,data:text,encoding:'utf8',success:()=>wx.showToast({title:'测试数据已保存',icon:'none'})});return path;}
  };w.WeChatHost=host;
  w.requestAnimationFrame=fn=>nativeRAF(t=>{try{fn(w.performance.now());present();}catch(e){console.error('[MAOMAO runtime]',e.stack||e);wx.showToast({title:'运行错误，请查看调试器',icon:'none'});}});
  w.cancelAnimationFrame=nativeCAF;
  function touch(type,event){const t=event.changedTouches&&event.changedTouches[0];if(!t)return;const r=viewport();const p={x:(t.clientX-r.left)/r.scale,y:(t.clientY-r.top)/r.scale};const view=w.CatFishGame&&w.CatFishGame.WeChatView;
    if(type==='pointerdown'&&(p.x<0||p.x>540||p.y<0||p.y>960))return;
    if(view&&view.touch(type,p))return;
    const e={type,pointerId:t.identifier||1,clientX:t.clientX,clientY:t.clientY,target:canvas,button:0,isPrimary:true,preventDefault(){},stopPropagation(){}};
    doc.dispatchEvent(e);canvas.dispatchEvent(e);w.dispatchEvent(e);
  }
  wx.onTouchStart(e=>touch('pointerdown',e));wx.onTouchMove(e=>touch('pointermove',e));wx.onTouchEnd(e=>touch('pointerup',e));wx.onTouchCancel(e=>touch('pointercancel',e));
  wx.onHide(()=>{doc.hidden=true;host.stopAll();doc.dispatchEvent({type:'visibilitychange'});w.dispatchEvent({type:'blur'});});
  wx.onShow(()=>{doc.hidden=false;doc.dispatchEvent({type:'visibilitychange'});w.dispatchEvent({type:'focus'});});
  if(wx.onWindowResize)wx.onWindowResize(e=>{w.innerWidth=e.windowWidth;w.innerHeight=e.windowHeight;w.dispatchEvent({type:'resize'});});
  host.loaded=()=>{doc.readyState='complete';doc.dispatchEvent({type:'DOMContentLoaded'});w.dispatchEvent({type:'DOMContentLoaded'});};
  return w;
};
