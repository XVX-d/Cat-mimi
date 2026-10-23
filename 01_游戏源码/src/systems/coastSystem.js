"use strict";
/* v0.9 海边美术与展示层；加载画面与首页共用美术语言，不持有鱼群、命中、鱼线消耗或经济状态。 */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={});
 const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 const asset=name=>(root.ASSET_INLINE&&root.ASSET_INLINE[name])||"assets/"+name;
 let castTime=0,happyTime=0,images={},bookNew=false,harvestTimer=0,artObserver=null,artScreen=null,paintPending=false;
 const layout=id=>game.MainSceneLayoutSystem.get(id);
 // Presentation-only clock: never advances fishing simulation or save state.
 let idleTime=0,idleBlend=0,idleLast=null;
 function tickIdle(now,active,frozen){
  const dt=idleLast===null?0:Math.min(.05,Math.max(0,(now-idleLast)/1000));idleLast=now;
  if(frozen)return;
  const reduced=game.SettingsSystem.load().reducedMotion;
  if(reduced){idleBlend=0;return;}
  if(active||idleBlend>0)idleTime+=dt;
  idleBlend=Math.max(0,Math.min(1,idleBlend+(active?1:-1)*dt*3));
 }
 function idleOffset(v){
  const head=Math.max(0,Math.min(1,(.62-v)/.25));
  const cycle=idleTime%7,u=(cycle-2)/3.5;
  const glance=u>0&&u<1?Math.sin(Math.PI*u)**2:0;
  return {x:idleBlend*head*(Math.sin(idleTime*.8)*.003+glance*.018),
   y:-idleBlend*Math.max(0,(.9-v)/.9)*Math.min(1,v/.08)*.012*(.5+.5*Math.sin(idleTime*1.5))};
 }
 const idleSprites=new Map();
 function drawIdleCat(ctx,img,cols,rows,index,c){
  if(!img)return;
  const sw=img.width/cols,sh=img.height/rows,top=rows===3&&index>=3?.035:0;
  const key=cols+':'+index;
  let canvas=idleSprites.get(key);
  if(!canvas){canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;idleSprites.set(key,canvas);}
  const paint=canvas.getContext('2d');paint.clearRect(0,0,sw,sh);
  const steps=96;
  for(let i=0;i<steps;i++){
   const a=top+(1-top)*i/steps,b=top+(1-top)*(i+1)/steps;
   const p=idleOffset(a),q=idleOffset(b);
   const sy=Math.round(a*sh),ey=Math.round(b*sh),dy=Math.round((a+p.y)*sh),end=Math.round((b+q.y)*sh);
   if(ey>sy&&end>dy)paint.drawImage(img,(index%cols)*sw,Math.floor(index/cols)*sh+sy,sw,ey-sy,
    Math.round(p.x*sw),dy,sw,end-dy);
  }
  ctx.drawImage(canvas,c.x,c.y,c.w,c.h);
 }
 function drawSurfaceIdle(ctx,width){
  if(idleBlend<=0)return;
  const home=camera(),pier=layout('pier');
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<22;i++){
   const x=home.x+((i*137.51+31)%width),y=home.y+355+(i*83.7)%590;
   const phase=idleTime*.65+i*2.1,alpha=(.5+.5*Math.sin(phase))**2*.30*idleBlend;
   ctx.strokeStyle='rgba(230,255,255,'+alpha+')';ctx.lineWidth=1.6;
   const drift=Math.sin(phase*.65)*10,r=7+(i%4)*3;
   ctx.beginPath();ctx.ellipse(x+drift,y+Math.sin(phase*.45)*2,r,1.6,0,0,Math.PI*2);ctx.stroke();
  }
  if(!pier.hidden)for(const k of [.20,.91])for(let j=0;j<2;j++){
   const u=(idleTime*.17+j*.5+k)%1;
   ctx.strokeStyle='rgba(205,251,255,'+(.24*Math.sin(Math.PI*u)*idleBlend)+')';ctx.lineWidth=1.7;
   ctx.beginPath();ctx.ellipse(pier.x+pier.w*k,pier.y+pier.h*.94,14+u*30,3+u*6,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
 // Normalized source rectangles avoid neighbouring artwork bleeding between atlas cells.
 const uiRects=[[0,.035,.258,.205],[.269,.108,.233,.128],[.519,.108,.231,.128],[.769,.108,.231,.128],
 [.015,.27,.23,.20],[.266,.27,.222,.20],[.511,.27,.218,.20],[.766,.27,.218,.20],
 [.014,.50,.23,.194],[.267,.50,.218,.194],[.51,.495,.238,.212],[.785,.49,.177,.219],
 [.020,.734,.23,.21],[.28,.738,.208,.203],[.519,.745,.192,.197],[.735,.731,.25,.219]];
 const icon=(n,cls="")=>'<canvas aria-hidden="true" class="coast-icon '+cls+'" data-coast-art="'+n+'"></canvas>';
 function skin(item,cls=""){return '<span role="img" aria-label="'+esc(item.name)+'" class="coast-skin '+(item.id==="default"?"coast-skin-single ":"")+cls+'" style="background-image:url(&quot;'+asset(item.id==="default"?"coast_cat_pose_v027.png":"coast_skins_v04.png")+'&quot;);--cols:3;--rows:'+(item.id==="default"?2:3)+';--sx:'+(item.id==="default"?0:item.frame%3)+';--sy:'+(item.id==="default"?0:Math.floor(item.frame/3))+'"></span>';}
 function fishImage(fish,known=true){return '<img alt="'+(known?esc(fish.name):"未知鱼的轮廓")+'" class="recipe-fish '+(known?"":"silhouette")+'" src="'+asset(fish.iconKey+".png")+'">';}
 function modal(title,body,cls=""){return '<div class="life-overlay coast-overlay"><section class="bottom-sheet coast-panel '+cls+'" data-sheet>'+'<canvas class="coast-frame-art" aria-hidden="true"></canvas>'+'<header><h2>'+title+'</h2><button data-action="close-overlay" aria-label="关闭">'+icon(14)+'</button></header><div class="sheet-scroll">'+body+'</div></section></div>';}
 function yard(s,st){
  const defs=[["图鉴",4,'data-scene="collection"'],["设置",7,'data-action="open-settings"'],["房间",8,'data-action="enter-interior"'],["外观",9,'data-action="open-cat"']];
  return '<div class="life-shell scene-yard coast-yard"><header class="life-header coast-header"><div class="coast-coins">'+icon(13)+'<b>'+s.player.coins+'</b></div><h1>'+icon(0)+'<span>潮汐码头</span></h1><small class="coast-version">v0.33</small></header><section class="life-world yard-world"><div class="yard-quick-actions">'+defs.map(([name,n,a])=>'<button '+a+' aria-label="'+name+'">'+icon(n)+'<b>'+name+'</b>'+(name==="图鉴"&&bookNew?'<em class="coast-dot"></em>':"")+'</button>').join("")+'</div><button class="coast-upgrade" data-action="open-tackle">'+icon(2,"coast-button-bg")+icon(10)+'<b>钓具升级</b></button><button class="home-cast-entry" data-action="start-fishing">'+icon(1,"coast-button-bg")+icon(11)+'<b>开始钓鱼</b></button></section></div>';
 }
 function tackle(s){
  const ids=["rod_rack","hook_bench","fish_bucket"],names=["鱼竿","鱼钩","鱼篓"];
  return modal("钓具升级",'<p class="coast-balance">'+icon(13)+'可用金币 <b>'+s.player.coins+'</b></p>'+ids.map((id,i)=>{
   const x=game.GameSession.getFacilityState(id),can=!x.isMax&&s.player.coins>=x.nextCost;
   return '<article class="coast-gear">'+icon([10,11,12][i])+'<div><h3>'+names[i]+' <small>Lv.'+(id==="rod_rack"?x.level-1:x.level)+'</small></h3><p>'+esc(x.currentBenefit)+'</p><p class="coast-next">'+(x.nextBenefit?'升级后 '+esc(x.nextBenefit):'已达最高等级')+'</p></div><button class="coast-gold" data-tackle-upgrade="'+id+'" '+(can?"":"disabled")+'>'+(x.isMax?"已满级":'<b>'+x.nextCost+'</b><span>'+(can?"升级":"金币不足")+'</span>')+'</button></article>';
  }).join("")+'<p class="coast-note">'+game.DepthSystem.summary(s)+'</p><p class="coast-note">所有猫咪外观共用钓具等级，升级立即生效。</p>',"coast-tackle");
 }
 function wardrobe(s,asGrid=false){
  game.CatCollectionSystem.ensure(s);
  const body='<p class="coast-note">1 种免费 + 9 种特殊外观 · 共用成长与钓鱼能力<br>鱼获可分多杆累计，永久解锁，不扣除数量。</p><div class="coast-wardrobe">'+game.CatAppearanceConfig.list().map(a=>{
   const ok=s.cat.unlockedAppearances.includes(a.id),active=s.cat.activeAppearance===a.id;
   return '<article class="coast-look '+(active?"selected":"")+'">'+skin(a)+'<h3>'+esc(a.name)+'</h3><div class="coast-recipe">'+game.CatCollectionSystem.progress(s,a).map(p=>{
    const f=game.FishConfig.getById(p.fishId);
    return '<div>'+fishImage(f,p.discovered)+'<span>'+(p.discovered?esc(f.name):"？？？")+'<b>'+Math.min(p.count,p.required)+' / '+p.required+'</b></span></div>';
   }).join("")+(a.id==="default"?'<p>初始免费外观</p>':"")+'</div><button data-cat-appearance="'+a.id+'" '+(!ok||active?"disabled":"")+'>'+(active?"使用中":ok?"装备外观":"尚未解锁")+'</button></article>';
  }).join("")+'</div>';
  return asGrid?body:modal("选择猫咪外观",body,"coast-wardrobe-panel");
 }
 function harvest(s,result){return game.HarvestPresentationSystem.html(s,result);}
 // Keep all icon proportions; stretch only the plain middle of button artwork.
 function drawUI(ctx,im,n,width,height){
  const [x,y,w,h]=uiRects[n],sx=x*im.width,sy=y*im.height,sw=w*im.width,sh=h*im.height;
  if(n>=1&&n<=3){
   const cap=sw*.22,edge=Math.min(width/2,cap*height/sh);
   ctx.drawImage(im,sx,sy,cap,sh,0,0,edge,height);
   if(width>edge*2)ctx.drawImage(im,sx+cap,sy,sw-cap*2,sh,edge,0,width-edge*2,height);
   ctx.drawImage(im,sx+sw-cap,sy,cap,sh,width-edge,0,edge,height);
  }else if(n===15){
   const xs=[0,sw*.14,sw*.32,sw*.68,sw*.86,sw],ys=[0,sh*.30,sh*.88,sh];
   const scale=64/(sh*.30),edge=sw*.14*scale,mid=sw*.36*scale,bottom=sh*.12*scale;
   const dx=[0,edge,width/2-mid/2,width/2+mid/2,width-edge,width],dy=[0,64,height-bottom,height];
   for(let row=0;row<3;row++)for(let col=0;col<5;col++)
    ctx.drawImage(im,sx+xs[col],sy+ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row],dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);
  }else{
   const scale=Math.min(width/sw,height/sh),dw=sw*scale,dh=sh*scale;
   ctx.drawImage(im,sx,sy,sw,sh,(width-dw)/2,(height-dh)/2,dw,dh);
  }
 }
function paintArt(c){
  if(c.classList.contains("coast-frame-art")&&c.parentElement.classList.contains("harvest-v09")){game.HarvestArtSystem.frame(c);return;}
  const im=images.coast_ui;if(!im)return;
  const panel=c.classList.contains("coast-frame-art"),box=panel?c.parentElement:c;
  const w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;
  const dpr=Math.min(2,root.devicePixelRatio||1);
  c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
  const ctx=c.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
  drawUI(ctx,im,panel?15:Number(c.dataset.coastArt),w,h);
 }
 function afterRender(screen,s,route){
  if(game.CatalogArtSystem)game.CatalogArtSystem.mount(screen);
  screen.classList.add("coast-screen");
  artScreen=screen;paintPending=true;
  if(artObserver)artObserver.disconnect();
  const art=screen.querySelectorAll("canvas.coast-icon,canvas.coast-frame-art");
  art.forEach(paintArt);
  if(typeof ResizeObserver!=="undefined"){
    artObserver=new ResizeObserver(entries=>entries.forEach(e=>paintArt(e.target)));
    art.forEach(c=>artObserver.observe(c));
  }
  if(route.scene==="collection")bookNew=false;
  if(route.scene==="yard")placeUI(screen);
  clearInterval(harvestTimer);
  game.HarvestArtSystem.mount(screen);
  game.HarvestPresentationSystem.mount(screen);
  const strip=screen.querySelector(".coast-catch-strip");
  if(strip){let i=0;const items=[...strip.children];harvestTimer=setInterval(()=>{
   if(!strip.isConnected||i>=items.length){clearInterval(harvestTimer);return;}
   const el=items[i++];el.classList.add("converted");
   strip.scrollTo({left:Math.max(0,el.offsetLeft-strip.offsetLeft-strip.clientWidth/2+el.clientWidth/2),behavior:game.SettingsSystem.load().reducedMotion?"instant":"smooth"});
  },450);}
 }
 function skipHarvest(screen){game.HarvestPresentationSystem.skip();}
 function camera(){const c=layout("camera");return {x:c.x,y:c.y};}
 function placeUI(screen){
  const cat=layout("cat"),up=layout("upgrade"),start=layout("start"),cam=camera(),z=1;
  const u=screen.querySelector(".coast-upgrade"),b=screen.querySelector(".home-cast-entry");
  if(u)Object.assign(u.style,{left:((cat.x+cat.w/2-cam.x)*z-up.w/2+up.x)+"px",top:((cat.y-cam.y)*z+up.y)+"px",width:up.w+"px",height:up.h+"px",visibility:up.hidden?"hidden":"visible"});
  if(b)Object.assign(b.style,{left:start.x+"px",top:start.y+"px",width:start.w+"px",height:start.h+"px",visibility:start.hidden?"hidden":"visible"});
 }
 function drawCell(ctx,img,cols,rows,index,r){
  if(!img||r.hidden)return;
  const w=img.width/cols,h=img.height/rows;
  // Tiny atlas gutters prevent adjacent poses from leaking into this sprite.
  const left=rows===2&&index===4?w*.025:0,top=rows===3&&index>=3?h*.035:0;
  ctx.drawImage(img,index%cols*w+left,Math.floor(index/cols)*h+top,w-left,h-top,r.x+r.w*left/w,r.y+r.h*top/h,r.w*(1-left/w),r.h*(1-top/h));
 }
 // Shared rigid-pose animation keeps each equipped skin and its rod/line anchors together.
 // Feet pivot on the dock; no animation updates save data or fishing physics.
 function skinPose(time,state,c){
  const reduced=game.SettingsSystem.load().reducedMotion;
  const gain=reduced?.25:1;
  let turn=0,scaleY=1,lift=0,rod=-.57;
  if(state==="cast"){
   const t=Math.max(0,Math.min(.9,time-castTime));
   const keys=[[0,0,-.57],[.30,-.14,-1.95],[.48,.12,-.20],[.9,0,-.57]];
   for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){
    const a=keys[i-1],b=keys[i],u=(t-a[0])/(b[0]-a[0]),e=u*u*(3-2*u);
    turn=(a[1]+(b[1]-a[1])*e)*gain;rod=a[2]+(b[2]-a[2])*e;break;
   }
  }else if(time<happyTime){
   const t=Math.max(0,1.3-(happyTime-time));
   const jump=Math.abs(Math.sin(Math.PI*t/0.65))*(1-t/1.3);
   lift=reduced?0:-c.h*.045*jump;turn=reduced?0:Math.sin(t*12)*.035*(1-t/1.3);
  }else if(state==="retract"){
   turn=(-.045+Math.sin(time*8)*.025)*gain;
   rod=-.80+Math.sin(time*8)*.10*gain;
   if(!reduced)scaleY=1-Math.max(0,Math.sin(time*8))*.018;
  }else if(!reduced){
   scaleY=1+Math.sin(time*2.4)*.006;
   if(state==="swim")turn=Math.sin(time*2.4)*.008;
  }
  rod+=idleBlend*Math.sin(idleTime*1.15)*.035;
  return {px:c.x+c.w*.55,py:c.y+c.h*.94,turn,scaleY,lift,rod};
 }
 function posePoint(x,y,p){
  const dx=x-p.px,dy=(y-p.py)*p.scaleY,cs=Math.cos(p.turn),sn=Math.sin(p.turn);
  return {x:p.px+dx*cs-dy*sn,y:p.py+p.lift+dx*sn+dy*cs};
 }
 function anchors(time,state){
  const c=layout("cat"),selected=game.GameSession&&game.GameSession.getSave().cat.activeAppearance||"default";
  // Same motion for every skin; only the painted hand location differs.
  const grip=selected==="default"?[.76,.59]:[.80,.70];
  const p=skinPose(time,state,c),x=c.x+c.w*grip[0],y=c.y+c.h*grip[1];
  const hand=posePoint(x,y,p),length=c.w*.60;
  if(idleBlend>0){const o=idleOffset(grip[1]);hand.x+=o.x*c.w;hand.y+=o.y*c.h;}
  const tip=posePoint(x+Math.cos(p.rod)*length,y+Math.sin(p.rod)*length,p);
  if(idleBlend>0){const o=idleOffset(grip[1]);tip.x+=o.x*c.w;tip.y+=o.y*c.h;}
  return {hand,tip,angle:Math.atan2(tip.y-hand.y,tip.x-hand.x)};
 }
 function drawCharacter(ctx,imgs,time,state){
  images=imgs;const c=layout("cat"),s=game.GameSession.getSave(),a=game.CatAppearanceConfig.getById(s.cat.activeAppearance)||game.CatAppearanceConfig.getById("default");
  if(!c.hidden){
   const p=skinPose(time,state,c);
   ctx.save();ctx.translate(p.px,p.py+p.lift);ctx.rotate(p.turn);ctx.scale(1,p.scaleY);ctx.translate(-p.px,-p.py);
   const drawCat=idleBlend>0?drawIdleCat:drawCell;
   drawCat(ctx,a.id==="default"?imgs.coast_cat:imgs.coast_skins,a.id==="default"?1:3,a.id==="default"?1:3,a.id==="default"?0:a.frame,c);
   ctx.restore();
   const {hand,tip}=anchors(time,state);
   ctx.save();ctx.lineCap="round";ctx.strokeStyle="#703c1b";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hand.x,hand.y);ctx.lineTo(tip.x,tip.y);ctx.stroke();
   ctx.strokeStyle="#efbc66";ctx.lineWidth=2;ctx.stroke();ctx.restore();
  }
 }
 function drawPlaced(ctx,img,item,alpha){
  if(!img||!img.width)return;
  const h=item.w*img.height/img.width,top=item.y-h;
  ctx.save();ctx.globalAlpha=alpha==null?1:alpha;
  if(item.flip<0){ctx.translate(item.x+item.w,top);ctx.scale(-1,1);ctx.drawImage(img,0,0,item.w,h);}
  else ctx.drawImage(img,item.x,top,item.w,h);
  ctx.restore();
 }
 function drawUnderwaterDetails(ctx,imgs,camX,camY,width,viewH,waterY,worldH){
  const bottom=camY+viewH;if(bottom<waterY+90)return;
  const top=Math.max(camY,waterY+80),cfg=game.PixelWorldConfig||{};
  ctx.save();
  // 浅中层水纹：固定在世界坐标中，随镜头移动，不会像屏幕贴纸一样漂浮。
  const firstRow=Math.max(0,Math.floor((top-waterY-210)/340));
  const lastRow=Math.ceil((Math.min(bottom,waterY+1900)-waterY-210)/340);
  for(let row=firstRow;row<=lastRow;row++){
   const y=waterY+210+row*340,depth=Math.max(0,Math.min(1,(y-waterY)/(worldH-waterY)));
   const a=Math.max(.018,.105-depth*.075),tile=360;
   const firstCol=Math.floor((camX-180)/tile),lastCol=Math.ceil((camX+width+180)/tile);
   for(let col=firstCol;col<=lastCol;col++){
    const cx=col*tile+95+((row*137+col*61)%155),rx=62+((row+col*3)&3)*17;
    ctx.strokeStyle='rgba(186,246,246,'+a.toFixed(3)+')';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(cx,y,rx,16+((row+col)&1)*5,-.08,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.ellipse(cx+rx*.45,y+32,rx*.55,9,.06,0,Math.PI*2);ctx.stroke();
   }
  }
  // 柔和深度色带让长距离下潜时有阶段变化，同时不遮挡鱼和鱼钩。
  for(const band of [{y:1120,c:'65,210,203',a:.045},{y:1880,c:'84,123,202',a:.055},{y:2580,c:'51,78,151',a:.065}]){
   if(band.y+300<top||band.y-300>bottom)continue;
   const g=ctx.createLinearGradient(0,band.y-300,0,band.y+300);
   g.addColorStop(0,'rgba('+band.c+',0)');g.addColorStop(.5,'rgba('+band.c+','+band.a+')');g.addColorStop(1,'rgba('+band.c+',0)');
   ctx.fillStyle=g;ctx.fillRect(camX,band.y-300,width,600);
  }
  // 远景礁石经过雾化处理，仅作环境层，不参与阻挡。
  for(const item of (cfg.backdrops||[])){
   const im=imgs[item.key];if(!im||!im.width)continue;
   const h=item.w*im.height/im.width;
   if(item.x+item.w<camX-40||item.x>camX+width+40||item.y<top-40||item.y-h>bottom+40)continue;
   drawPlaced(ctx,im,item,item.alpha);
  }
  ctx.restore();
 }
 function drawWorld(ctx,imgs,camX,camY,zoom,worldH,waterY){
  images=imgs;
  if(paintPending&&images.coast_ui&&artScreen){
   paintPending=false;artScreen.querySelectorAll("canvas.coast-icon,canvas.coast-frame-art").forEach(paintArt);
  }
  const width=540/zoom,viewH=960/zoom;
  ctx.fillStyle="#05659f";ctx.fillRect(camX,camY,width,viewH);
  if(imgs.coast_water)ctx.drawImage(imgs.coast_water,camX,waterY,width,worldH-waterY);
  if(game.ReefArtSystem)game.ReefArtSystem.background(ctx,imgs,camX,camY,width,viewH,waterY,worldH);
  const home=camera(),top=home.y,sh=960;
  if(camY<top+sh&&imgs.coast_surface){
   // Same painted water overlaps smoothly; no map switch or black transition.
   const im=imgs.coast_surface,bands=40;
   for(let i=0;i<bands;i++){
    const y=top+i*sh/bands;
    ctx.globalAlpha=y<waterY?1:Math.max(0,1-(y-waterY)/300);
    ctx.drawImage(im,0,i*im.height/bands,im.width,im.height/bands,camX,y,width,sh/bands+1);
   }
   ctx.globalAlpha=1;
  }
  drawUnderwaterDetails(ctx,imgs,camX,camY,width,viewH,waterY,worldH);
  if(game.DepthSystem)game.DepthSystem.atmosphere(ctx,camX,camY,width,viewH,waterY);
  if(game.ReefArtSystem)game.ReefArtSystem.decorations(ctx,imgs,camX,camY,width,viewH);
  const p=layout("pier");
  drawSurfaceIdle(ctx,width);
  // Retain visible landmarks wherever the original world still has collisions.
  (game.PixelWorldConfig.structures||[]).forEach(o=>{
   const im=imgs[o.key];if(!im)return;const h=o.w*im.height/im.width;
   if(o.x+o.w>=camX&&o.x<=camX+width&&o.y>=camY&&o.y-h<=camY+viewH)drawPlaced(ctx,im,o);
  });
  if(imgs.coast_pier&&!p.hidden)ctx.drawImage(imgs.coast_pier,p.x,p.y,p.w,p.h);
 }
 function hud(ctx,lineLeft,lineMax,depth,retract){
  const p=Math.max(0,Math.min(1,lineLeft/Math.max(1,lineMax)));
  ctx.save();ctx.fillStyle="#684127";ctx.strokeStyle="#e1b473";ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(26,28,488,42,18);ctx.fill();ctx.stroke();
  ctx.fillStyle=p<.2?"#ff9953":"#3ed9f1";ctx.beginPath();ctx.roundRect(32,34,476*p,30,13);ctx.fill();
  ctx.textAlign="center";ctx.font="bold 19px sans-serif";ctx.fillStyle="#fff9de";ctx.shadowColor="#164564";ctx.shadowBlur=3;
  ctx.fillText("剩余鱼线 "+Math.ceil(lineLeft/10)+" / "+Math.ceil(lineMax/10)+" 米",270,56);
  ctx.font="bold 18px sans-serif";ctx.fillText("下沉深度 "+Math.max(0,Math.floor(depth/10))+" 米",270,99);
  if(retract)ctx.fillText("正在收线…",270,132);
  ctx.restore();
 }
 game.GameEvents.on(game.GameEvents.EVENTS.FISH_FIRST_DISCOVERED,()=>{bookNew=true;});
 game.CoastSystem=Object.freeze({tickIdle,yard,tackle,wardrobe,harvest,afterRender,skipHarvest,skin,fishImage,camera,placeUI,drawUI,drawWorld,drawCharacter,anchors,hud,
 cast:t=>{castTime=t;},happy:t=>{happyTime=t+1.3;},castReady:t=>t-castTime>=.9});
})(window);
