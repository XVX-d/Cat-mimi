"use strict";
/* v0.10: selected original image is a runtime sprite atlas; labels and counts stay dynamic. */
(function(root){
 const game=root.CatFishGame;
 const file="harvest_minimal_v010.png";
 const rects={blue:[140,146,244,258],purple:[392,146,246,258],gold:[646,146,244,258],red:[140,416,244,258],
 income:[134,695,758,295],double:[135,1012,757,174],home:[137,1202,368,165],again:[518,1202,368,165]};
 let im=null,host=null,observer=null;
 const cache=new Map();
 function ensure(){
  if(im)return;
  im=new Image();
  im.onload=()=>{if(host&&host.isConnected)mount(host);};
  im.src=(root.ASSET_INLINE&&root.ASSET_INLINE[file])||"assets/"+file;
 }
 function slice(ctx,rect,w,h,edge){
  const [sx,sy,sw,sh]=rect,k=Math.min(w/sw,h/sh);
  const border=Math.min(edge*k,w/2,h/2);
  const xs=[0,edge,sw-edge,sw],ys=[0,edge,sh-edge,sh];
  const dx=[0,border,w-border,w],dy=[0,border,h-border,h];
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
   const dw=dx[col+1]-dx[col],dh=dy[row+1]-dy[row];if(dw<=0||dh<=0)continue;
   ctx.drawImage(im,sx+xs[col],sy+ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row],dx[col],dy[row],dw,dh);
  }
 }
 function frame(c,bounds){
  ensure();
  if(!im.complete||!im.naturalWidth)return false;
  const box=bounds||c.parentElement,w=box.clientWidth,h=box.clientHeight,dpr=Math.min(2,root.devicePixelRatio||1);
  if(!w||!h)return;
  c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
  const ctx=c.getContext("2d");ctx.scale(dpr,dpr);
  ctx.save();
  ctx.scale(w/873,h/1444);ctx.translate(-76,-41);
  // Follow the original timber silhouette so its gray concept backdrop never enters the game.
  ctx.beginPath();ctx.moveTo(509,46);
  ctx.bezierCurveTo(360,45,250,47,183,60);
  ctx.bezierCurveTo(110,68,79,114,79,202);
  ctx.lineTo(79,1292);ctx.bezierCurveTo(79,1400,100,1435,178,1461);
  ctx.bezierCurveTo(320,1490,742,1490,849,1463);
  ctx.bezierCurveTo(924,1447,944,1407,944,1321);
  ctx.lineTo(944,198);ctx.bezierCurveTo(944,94,912,65,848,56);
  ctx.bezierCurveTo(740,45,605,46,509,46);ctx.closePath();ctx.clip();
  ctx.fillStyle="#ecc792";ctx.fillRect(76,41,873,1444);
  if(im.complete&&im.naturalWidth){
   ctx.drawImage(im,0,0);
   // Replace only the atlas's baked-in content region with a quiet matching wood backing.
   const g=ctx.createLinearGradient(136,0,893,0);
   g.addColorStop(0,"#edc58c");g.addColorStop(.45,"#f5d69f");g.addColorStop(1,"#edc58c");
   ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(134,142,758,1237,28);ctx.fill();
  }
  ctx.restore();
  return true;
 }
 function part(c,key,w,h){
  ensure();if(!im.complete||!im.naturalWidth||!rects[key])return false;
  const dpr=Math.min(2,root.devicePixelRatio||1);c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
  const ctx=c.getContext('2d');ctx.scale(dpr,dpr);slice(ctx,rects[key],w,h,key==='income'?60:45);return true;
 }
 function skin(el,key){
  const w=el.clientWidth,h=el.clientHeight;if(!w||!h||!im.complete||!im.naturalWidth)return;
  const id=key+":"+w+":"+h;
  if(!cache.has(id)){
   const c=document.createElement("canvas");c.width=w*2;c.height=h*2;
   const ctx=c.getContext("2d");ctx.scale(2,2);
   slice(ctx,rects[key],w,h,key==="income"?60:45);
   if(cache.size>64)cache.clear();
   cache.set(id,c.toDataURL());
  }
  el.style.backgroundImage='url("'+cache.get(id)+'")';
 }
 function paintAll(){
  if(!host||!host.isConnected)return;
  const panel=host.querySelector(".harvest-v09");if(!panel)return;
  frame(panel.querySelector(".coast-frame-art"));
  panel.querySelectorAll(".harvest-fish-card").forEach(el=>skin(el,["blue","purple","gold","red"].find((_,i)=>el.classList.contains("tier-"+i))||"blue"));
  for(const [selector,key] of [[".harvest-income","income"],[".harvest-double","double"],["[data-action=harvest-home]","home"],["[data-action=harvest-continue]","again"]]){
   const el=panel.querySelector(selector);if(el)skin(el,key);
  }
 }
 function mount(screen){
  host=screen;ensure();if(observer)observer.disconnect();
  const panel=screen.querySelector(".harvest-v09");if(!panel)return;
  panel.classList.add("harvest-minimal");
  paintAll();
  if(typeof ResizeObserver!=="undefined"){
   observer=new ResizeObserver(paintAll);
   panel.querySelectorAll(".harvest-fish-card,.harvest-income,.harvest-double,.coast-result-actions button").forEach(e=>observer.observe(e));
  }
 }
 game.HarvestArtSystem=Object.freeze({mount,frame,part});
})(window);
