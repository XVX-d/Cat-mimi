"use strict";
/* ================================================================
   海王钓鱼 · H5 Playable v2.0
   操作:完全跟手拖动鱼钩 · 击杀的鱼挂在钩后排队跟随 · 深度世界
   素材接入:同名文件放进 ./assets/ 即自动替换占位绘制
   ================================================================ */

/* v0.8 海边加载界面：码头、初始猫、木牌标题、进度和提示统一为当前美术语言。 */
/* ---------- 埋点 (AppLovin Playable Analytics, 仅预定义事件) ---------- */
const alFired={};
function alEvent(n){
  if(alFired[n])return; alFired[n]=1;
  try{ if(typeof window.ALPlayableAnalytics!=="undefined") window.ALPlayableAnalytics.trackEvent(n); }catch(e){}
}
alEvent("LOADING");

/* 商业试玩版遗留的外链 CTA 已移除；所有操作留在游戏内。 */

/* ---------- 基础 ---------- */
const VW=540,VH=960;              // 屏幕(可视窗口)尺寸
const WORLD_W=(window.CatFishGame.PixelWorldConfig&&window.CatFishGame.PixelWorldConfig.worldWidth)||900;
const WORLD_H=(window.CatFishGame.PixelWorldConfig&&window.CatFishGame.PixelWorldConfig.worldHeight)||3800;
/*<<DEBUG_CFG_START>>*/
// 加载界面布局参数(调试面板“加载”可实时调整)。
window.LOADING_UI={
  titleY:28,titleW:350,titleH:220,
  pierX:-112,pierY:430,pierW:570,
  catX:130,catY:330,catSize:280,
  barX:65,barY:755,barW:410,barH:58,
  messageY:842,tipY:892
};
window.WAVE_CFG={
  width:500,
  heightScale:0.65,
  yOffset:-0.06,
  speed:58
};
// 水下背景图(bg_water)调节
window.WATER_BG_CFG={
  top:235,
  height:3500,
  alpha:0.8
};
// 镜头(boat=准备阶段,fish=钓鱼阶段;Y 锚点 0~1 = 钩在屏幕纵向位置,0=顶部 1=底部)
window.ZOOM_CFG={
  boat:1.95,
  fish:1.35,
  boatY:0.75,
  fishY:0.4
};
// 海面↔水下过渡带(drawWaveTransition)
window.WAVE_TRANS_CFG={
  yCenter:73,
  hUp:37,
  hDown:82,
  alpha:0.52,
  hue:204,
  sat:95,
  light:31,
  imageKey:"wave_transition"
};
// 场景礁石/沉船布局 — 调试面板「场景编辑」直接拖动可改
// 每项 {key,x,y,w,flip}:key=礁石资源名(rock/rock_b/rock_c/rock_d/wreck),flip=±1
window.SCENERY_CFG=[
  {"key":"rock","x":650,"y":1184,"w":420,"flip":-1},
  {"key":"rock","x":623,"y":729,"w":426,"flip":1},
  {"key":"rock_f","x":395,"y":977,"w":168,"flip":-1},
  {"key":"rock_d","x":-77,"y":525,"w":240,"flip":-1},
  {"key":"wreck","x":416,"y":1597,"w":536,"flip":1},
  {"key":"rock","x":-248,"y":1544,"w":448,"flip":1},
  {"key":"rock_e","x":-339,"y":1010,"w":548,"flip":-1},
  {"key":"rock_c","x":213,"y":831,"w":116,"flip":1},
  {"key":"rock_b","x":337,"y":580,"w":140,"flip":-1},
  {"key":"rock_b","x":255,"y":1389,"w":140,"flip":-1},
  {"key":"rock_c","x":830,"y":490,"w":116,"flip":1},
  {"key":"rock_f","x":539,"y":408,"w":104,"flip":-1},
  {"key":"rock_f","x":125,"y":368,"w":104,"flip":1}
];
// 游戏数值微调(调试面板「游戏数值」组)
window.GAME_CFG={"coinScale":3,"boatDX":-62,"rodTipFx":0.988,"rodTipFy":0.356,"fishHp":{"s":1,"m":2,"l":3},"lineDist":[1000,1900,2750,3600],"bossCoins":320,"bossSpd":150,"bossR":130};
// 船分层合成(船体/渔夫/鱼竿)布局
window.BOAT_CFG={"boatW":237,"waterFrac":0.95,"fisherScale":0.19,"fX":0.83,"fY":0.85,"rodScale":0.31,"rX":0.91,"rY":0.56,"rodHandFx":0.07,"rodHandFy":0.93,"rodTipFx":0.94,"rodTipFy":0.19};
// 程序文字样式(调试面板「文字样式」可调)
window.TEXT_CFG={"coin":{"size":19,"fill":"#ffffff","stroke":"#000000","sw":2,"dx":6,"dy":3,"align":"left"},"line":{"size":34,"fill":"#ffffff","stroke":"#000000","sw":4,"dx":0,"dy":0,"align":"center"},"goalBanner":{"size":14,"fill":"#ffd0a0","stroke":"","sw":0,"dx":0,"dy":0,"align":"center"},"pop":{"size":19,"fill":"#ffd966","stroke":"#000000","sw":4,"dx":0,"dy":0,"align":"center"},"upCoins":{"size":24,"fill":"#ffd966","stroke":"","sw":0,"dx":0,"dy":0,"align":"center"},"upName":{"size":22,"fill":"#eaf6ff","stroke":"","sw":0,"dx":0,"dy":0,"align":"left"},"upLv":{"size":37,"fill":"#bcd9ec","stroke":"","sw":0,"dx":0,"dy":0,"align":"left"},"upPrice":{"size":20,"fill":"#ffffff","stroke":"","sw":0,"dx":0,"dy":0,"align":"center"},"setCoin":{"size":26,"fill":"#ffd966","stroke":"","sw":0,"dx":0,"dy":0,"align":"center"},"setBalance":{"size":16,"fill":"#7fb8d4","stroke":"","sw":0,"dx":0,"dy":0,"align":"center"},"panelTitle":{"size":28,"fill":"#aef3ff","stroke":"","sw":0,"dx":0,"dy":0,"align":"center"},"panelSub":{"size":17,"fill":"#ffd966","stroke":"","sw":0,"dx":0,"dy":0,"align":"center"},"guide":{"size":18,"fill":"#ffffff","stroke":"#0a2a3e","sw":4,"dx":0,"dy":0,"align":"center"}};
// UI 布局/皮肤(调试面板「UI 编辑」拖动可改;img=ASSET_LIST 的 key)
window.UI_CFG={"castBtn":{"x":194,"y":669,"w":147,"h":98,"img":"ui_cast"},"reelBtn":{"x":397,"y":800,"w":107,"h":78,"img":"ui_reel"},"upgradeBtn":{"x":-168,"y":-175,"w":99,"h":46,"img":"ui_upgrade","follow":true},"downloadBtn":{"x":467,"y":72,"w":64,"h":64,"img":"ui_download"},"exitBtn":{"x":16,"y":18,"w":82,"h":31},"hudCoin":{"x":14,"y":69,"w":95,"h":32,"img":"ui_coin","txt":true},"hudCoinIcon":{"x":16,"y":70,"w":30,"h":30,"img":"coin"},"hudGoal":{"x":8,"y":108,"w":147,"h":36,"img":"ui_goal","txt":false},"hudLine":{"x":12,"y":18,"w":517,"h":31,"img":"ui_line","txt":true}};
{
  const savedUI=window.CatFishGame&&window.CatFishGame.MainSceneLayoutSystem&&window.CatFishGame.MainSceneLayoutSystem.getUIConfig();
  if(savedUI)Object.keys(savedUI).forEach(id=>{if(window.UI_CFG[id])Object.assign(window.UI_CFG[id],savedUI[id]);});
}
// 升级面板元素微调(旧 DOM 版,已弃用;保留兼容)
window.PANEL_CFG={"gearCard":{"dx":0,"dy":0,"w":0,"h":0},"upCoins":{"dx":6,"dy":11,"w":0,"h":0,"s":1},"rowLine":{"dx":0,"dy":-98,"w":0,"h":140,"s":1},"rowAtk":{"dx":0,"dy":-240,"w":0,"h":0,"s":1},"icoLine":{"dx":0,"dy":0,"w":69,"h":0,"s":1},"icoAtk":{"dx":0,"dy":0,"w":0,"h":0,"s":1},"buyLine":{"dx":0,"dy":0,"w":0,"h":0,"s":1},"buyAtk":{"dx":0,"dy":0,"w":0,"h":0,"s":1},"goFishBtn":{"dx":0,"dy":0,"w":0,"h":0,"s":1},"closeUpgrade":{"dx":4,"dy":-15,"w":0,"h":0,"s":1.14}};
// Canvas 弹窗坐标(调试面板「UI/弹窗 编辑」拖动可改;模板复用 upRow*)
window.PANEL_UI={"upCard":{"x":44,"y":147,"w":460,"h":660,"img":"ui_card_gear"},"upClose":{"x":443,"y":213,"w":46,"h":46,"img":"ui_close"},"upCoins":{"x":270,"y":288,"w":0,"h":0},"upRowX":77,"upRowW":393,"upRowH":162,"upRows":[325,510],"upRowImg":"ui_uprow","upIco":{"dx":26,"dy":51,"w":60,"h":70},"upName":{"dx":34,"dy":9,"w":150,"h":34,"imgLine":"ui_txt_line","imgAtk":"ui_txt_hook"},"upLv":{"dx":123,"dy":60,"w":0,"h":0},"upPips":{"dx":92,"dy":92,"w":110,"h":14},"upBuy":{"dx":249,"dy":83,"w":112,"h":39,"img":"ui_upbtn"},"upPrice":{"dx":0,"dy":-16,"w":0,"h":0},"upGoFish":{"x":129,"y":690,"w":273,"h":81,"img":"ui_btn"},"goalCard":{"x":50,"y":248,"w":440,"h":464,"img":"ui_card"},"goalBtn":{"x":195,"y":628,"w":150,"h":58,"img":"ui_btn_blue"},"setCard":{"x":50,"y":200,"w":440,"h":560,"img":"ui_card"},"setCoin":{"x":270,"y":556,"w":0,"h":0},"setBalance":{"x":270,"y":598,"w":0,"h":0},"setBtnUp":{"x":92,"y":672,"w":160,"h":58,"img":"ui_btn_blue"},"setBtnFish":{"x":288,"y":672,"w":160,"h":58,"img":"ui_btn"},"ctaCard":{"x":40,"y":200,"w":460,"h":560,"img":"ui_card"},"ctaBtn":{"x":160,"y":664,"w":220,"h":64,"img":"ui_btn"}};
/*<<DEBUG_CFG_END>>*/
const BALANCE=window.CatFishGame.BalanceConfig;
const INTERACTION=window.CatFishGame.InteractionFeelConfig;
window.GAME_CFG.lineDist=BALANCE.gear.rod.lineDistances.slice();
window.GAME_CFG.bossCoins=BALANCE.boss.triggerEarnings;
// ZOOM_BOAT/ZOOM_FISH 是兼容别名,自动读 window.ZOOM_CFG.boat/.fish
Object.defineProperty(window,"ZOOM_BOAT",{get:()=>window.ZOOM_CFG.boat,configurable:true});
Object.defineProperty(window,"ZOOM_FISH",{get:()=>window.ZOOM_CFG.fish,configurable:true});
const WATER_Y=205;                // 海平面(世界坐标系)
const cvs=document.getElementById("game"),ctx=cvs.getContext("2d");
if(window.CatFishGame.LocalizationSystem)window.CatFishGame.LocalizationSystem.installCanvas(ctx);
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
const dist=(x1,y1,x2,y2)=>Math.hypot(x1-x2,y1-y2);
const TURBO=/[?&]turbo/.test(location.search); // 调试:回合×0.3

function resize(){
  const s=Math.min(innerWidth/VW,innerHeight/VH);
  // DPR-aware:backing store = 显示像素 × DPR,渲染依然按 540×960 逻辑坐标,清晰不糊
  const dpr=Math.min(window.devicePixelRatio||1,3); // 3× 封顶避免过高 GPU 负担
  cvs.style.width=VW*s+"px"; cvs.style.height=VH*s+"px";
  const bw=Math.round(VW*s*dpr), bh=Math.round(VH*s*dpr);
  if(cvs.width!==bw||cvs.height!==bh){ cvs.width=bw; cvs.height=bh; }
  const scale=bw/VW;
  ctx.setTransform(scale,0,0,scale,0,0); // 基础缩放,后续 ctx.scale/translate 相乘 → 游戏代码不用改
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  const w=$("wrap");w.style.width=VW*s+"px";w.style.height=VH*s+"px";
  applyUiLayout();   // 屏幕尺寸变了,重排 DOM UI
}
addEventListener("resize",resize);resize();

/* ---------- UI 布局:DOM 控件按 UI_CFG(虚拟 540×960)定位 + 可选贴图 ---------- */
// 返回某 UI 项的虚拟矩形 {x,y,w,h};HUD 绘制直接用(canvas 内部就是 540×960)
function uiRect(id){
  const c=(window.UI_CFG&&window.UI_CFG[id])||null;
  if(!c) return null;
  return {x:c.x, y:c.y, w:c.w, h:c.h, img:c.img, on:c.on!==false, txt:c.txt!==false};
}
// 取 UI 皮肤图(img 为 ASSET_LIST 的 key,已加载才返回)。
// UI_IMG_READY 守卫:首帧 resize 早于 IMG 声明(TDZ),未就绪先返回 null。
// 用 var(提升、无 TDZ),否则首帧 resize() 引用它本身也会抛 TDZ。
var UI_IMG_READY=false;
function uiImg(id){
  if(!UI_IMG_READY) return null;
  const c=window.UI_CFG&&window.UI_CFG[id];
  if(!c||!c.img) return null;
  return IMG[c.img]||null;
}
// 虚拟矩形,高度按图等比派生(有图:h=w×图高/图宽,不裁剪不拉伸;无图:用 cfg.h)
function uiBox(id){
  const c=(window.UI_CFG&&window.UI_CFG[id])||null;
  if(!c) return null;
  const im=uiImg(id);
  const h=im ? c.w*im.height/im.width : c.h;
  return {x:c.x, y:c.y, w:c.w, h:h, img:c.img, txt:c.txt!==false, follow:c.follow};
}
function applyUiLayout(){
  if(!window.UI_CFG) return;
  const wrap=$("wrap"); if(!wrap) return;
  const scale=(wrap.offsetWidth||VW)/VW;       // 显示像素 = 虚拟 × scale
  // 固定位 DOM 按钮(left/top 由 cfg 驱动;upgradeBtn 跟随鱼钩,在 updateUpgradeBtn 里单独处理)
  const place=(id)=>{
    const el=$(id), c=window.UI_CFG[id]; if(!el||!c) return;
    const b=uiBox(id);
    el.style.left=(c.x*scale)+"px";
    el.style.top =(c.y*scale)+"px";
    el.style.right="auto"; el.style.bottom="auto"; el.style.transform="none"; // 清掉 CSS 居中 transform,纯 left/top 定位
    el.style.width =(b.w*scale)+"px";
    // 有图:高度按图等比;无图用 cfg.h
    if(uiImg(id)) el.style.height=(b.h*scale)+"px";
    else if(c.h) el.style.height=(c.h*scale)+"px";
    const img=uiImg(id);
    if(img){ el.style.backgroundImage="url("+img.src+")"; el.classList.add("ui-skinned"); }
    else   { el.style.backgroundImage=""; el.classList.remove("ui-skinned"); }
  };
  place("castBtn"); place("reelBtn"); place("downloadBtn");
  // upgradeBtn 尺寸/皮肤(位置跟随鱼钩,在 updateUpgradeBtn 里逐帧设)
  const up=$("upgradeBtn"), uc=window.UI_CFG.upgradeBtn;
  if(up&&uc){
    const b=uiBox("upgradeBtn");
    up.style.width=(b.w*scale)+"px"; up.style.height=(b.h*scale)+"px";
    const img=uiImg("upgradeBtn");
    if(img){ up.style.backgroundImage="url("+img.src+")"; up.classList.add("ui-skinned"); }
    else   { up.style.backgroundImage=""; up.classList.remove("ui-skinned"); }
    // 编辑模式下游戏冻结、updateUpgradeBtn 不跑 → 这里按"鱼钩屏幕位+偏移"主动定位,保证可见可拖
    if(window.UI_EDIT_MODE){
      const sx=(hook.x-camX)*curZoom + (uc.x||0);
      const sy=(hook.y-camY)*curZoom + (uc.y||0);
      up.style.left=(sx*scale)+"px"; up.style.top=(sy*scale)+"px";
      up.style.transform="translate(-50%,-50%)"; // 以该点为中心(与编辑框一致)
    }
  }
  applyPanelSkins();
  applyPanelLayout();
}

/* ---------- 面板/弹窗皮肤:有图则给 :root 设 CSS 变量 + skin-* 类,缺图回退 CSS 渐变 ---------- */
const PANEL_SKINS=[
  {img:"ui_card",      v:"--ui-card",    cls:"skin-card"},
  {img:"ui_card_gear", v:"--ui-cardgear",cls:"skin-cardgear"},
  {img:"ui_btn",      v:"--ui-btn",    cls:"skin-btn"},
  {img:"ui_btn_blue", v:"--ui-btnblue",cls:"skin-btnblue"},
  {img:"ui_uprow",    v:"--ui-uprow",  cls:"skin-uprow"},
  {img:"ui_upbtn",    v:"--ui-upbtn",  cls:"skin-upbtn"},
  {img:"ui_pip",      v:"--ui-pip",    cls:"skin-pip"},
  {img:"ui_pip_on",   v:"--ui-pipon",  cls:"skin-pipon"}
];
function applyPanelSkins(){
  if(!UI_IMG_READY) return;
  const root=document.documentElement;
  for(const s of PANEL_SKINS){
    const im=IMG[s.img];
    if(im){ root.style.setProperty(s.v,"url("+im.src+")"); root.classList.add(s.cls); }
    else  { root.classList.remove(s.cls); }
  }
  // 升级面板 X 关闭按钮贴图(ui_close)
  const close=$("closeUpgrade");
  if(close){
    if(IMG.ui_close){ close.style.backgroundImage="url("+IMG.ui_close.src+")"; close.classList.add("ui-skinned"); }
    else { close.style.backgroundImage=""; close.classList.remove("ui-skinned"); }
  }
  // 烤字按钮按图等比设尺寸(不拉伸、不裁剪;文字已在 CSS 隐藏):TAP TO FISH + 买按钮
  const fit=(el,im,targetH)=>{ if(!el)return;
    if(im){ el.style.height=targetH+"px"; el.style.width=(targetH*im.naturalWidth/im.naturalHeight)+"px"; }
    else  { el.style.height=""; el.style.width=""; } };
  fit($("goFishBtn"), IMG.ui_btn, 56);
  document.querySelectorAll("#upgradePanel .upbtn").forEach(b=>fit(b, IMG.ui_upbtn, 44));
  applyTextSkins();
}

/* 静态文字(标题/标签)图替换:有图则把元素背景设为图 + 加 .txt-skinned(文字透明) */
const TEXT_SKINS=[
  {img:"ui_txt_goal",   sel:"#goalTitle"},
  {img:"ui_txt_settle", sel:"#settleTitle"},
  {img:"ui_txt_gear",   sel:"#gearTitle"},
  {img:"ui_txt_cta",    sel:"#ctaTitle"},
  {img:"ui_txt_line",   sel:"#rowLine .upname"},
  {img:"ui_txt_hook",   sel:"#rowAtk .upname"}
];
function applyTextSkins(){
  if(!UI_IMG_READY) return;
  for(const t of TEXT_SKINS){
    const el=document.querySelector(t.sel); if(!el) continue;
    const im=IMG[t.img];
    if(im){ el.style.backgroundImage="url("+im.src+")"; el.classList.add("txt-skinned"); }
    else  { el.style.backgroundImage=""; el.classList.remove("txt-skinned"); }
  }
}

/* 升级面板元素:flex 布局上叠加 位移(dx,dy)+ 宽高覆盖(w,h,0=不覆盖)。单位虚拟px×scale。「升级面板编辑」拖动+滑块。 */
function applyPanelLayout(){
  if(!window.PANEL_CFG) return;
  const wrap=$("wrap"); const scale=(wrap&&wrap.offsetWidth)?wrap.offsetWidth/VW:1;
  for(const id in window.PANEL_CFG){
    const el=$(id), c=window.PANEL_CFG[id]; if(!el||!c) continue;
    el.style.transform="translate("+((c.dx||0)*scale)+"px,"+((c.dy||0)*scale)+"px)";
    if(c.w>0) el.style.width =(c.w*scale)+"px";
    if(c.h>0){ el.style.height=(c.h*scale)+"px"; if(id==="gearCard") el.style.aspectRatio="auto"; }
  }
}

/* ---------- 数值配置 ---------- */
/* 鱼种(按层分布,不再用占比) */
const FISH_TYPES={
  s:{key:"s",name:"Small",hp:1,value:5, r:16,spd:[55,85], c1:"#46c2e8",c2:"#2a8fb5",c3:"#bdeefc",
     wag:{pivotFx:0.35, speed:8, amp:0.22}},
  m:{key:"m",name:"Medium",hp:2,value:15,r:27,spd:[42,62], c1:"#ffb054",c2:"#d97c20",c3:"#ffe0b0",
     wag:{pivotFx:0.32, speed:6, amp:0.20}},
  l:{key:"l",name:"Large",hp:3,value:40,r:34,spd:[30,46], c1:"#a07ae0",c2:"#6a4cb0",c3:"#d8c8f8",
     wag:{pivotFx:0.30, speed:4, amp:0.16}}
};
// 尾巴摆动运行时配置(调试面板可覆盖同名字段)
window.FISH_WAG=window.FISH_WAG||{};
// 把 GAME_CFG.fishHp 同步进 FISH_TYPES(血条最大值 t.hp 与新鱼出生血都读这里)
function applyFishHp(){
  const h=window.GAME_CFG&&window.GAME_CFG.fishHp; if(!h)return;
  // 硬钳:大鱼 HP 不允许超过 3。调试滑块/旧 localStorage 若给出 >3 的值一律截到 3,
  // 并写回 GAME_CFG 让血条渲染/其它读点也拿到一致的 3。历史上多次调回都失败就是这里少了硬约束。
  if(h.l>3){ h.l=3; }
  if(h.s>0)FISH_TYPES.s.hp=h.s; if(h.m>0)FISH_TYPES.m.hp=h.m; if(h.l>0)FISH_TYPES.l.hp=h.l;
}
applyFishHp();
window.applyFishHp=applyFishHp; // 供调试面板滑块调用
/* 深度分层:浅(小鱼) → 中(中鱼) → 深(大鱼) → 极深(海王) */
const BANDS=window.CatFishGame.FishCatalogConfig.depthBands.map(b=>({
  min:WATER_Y+b.min*10+(b.min===0?40:0),
  max:b.max===null?WORLD_H-100:WATER_Y+b.max*10,
  kinds:b.kinds.slice(),count:b.count,name:b.name
}));
// 地图只筛选可出现的鱼种；深度、AI、碰撞、HP 与奖励仍完全沿用原有 FishingSystem。
function mapKindsForBand(kinds){
  return kinds;
}
const LINE_LV =window.GAME_CFG.lineDist;  // 鱼线各级最大长度(像素,每 10px=1m)— 引用 GAME_CFG,调试面板就地改值即时生效
const FEEL=(window.CatFishGame.FishingFeelConfig&&window.CatFishGame.FishingFeelConfig.values)||{};
const HOOK_SPD=FEEL.hookSpeed||120;             // 鱼钩匀速 px/s,始终运动
const HOOK_TURN=FEEL.turnRate||9;                // 普通转向跟随强度
const HOOK_REVERSE_TURN=FEEL.reverseTurnRate||13;// 反向修正更快，降低“拖了但没转过来”的迟滞
const LINE_SAMPLE=5;            // 鱼线轨迹采样间距(像素)
const REEL_LINE_SPEED=1250;     // 收线能力(px/s)：收杆总时长 = 实际放出的鱼线长度 / 此速度
const REEL_MIN_DURATION=.38;    // 很短的线也保留基本收杆表现
const REEL_MAX_DURATION=2.4;    // 避免高等级长线让玩家等待过久

/* ---------- 礁石碰撞:基于图片 alpha 轮廓,与画面完全一致 ---------- */
/* 每个礁石图降采样成低分辨率"是否实心"网格;碰撞/寻路按 SCENERY_CFG 的
   x/y/w/flip 把世界坐标映射回图片本地 UV 查网格 → 形状与显示像素吻合。 */
const MASK_COLS=40;          // 网格横向分辨率(纵向按图片比例;越小整体越平坦)
const ROCK_MASK={};          // key -> {cols,rows,aspect,grid:Uint8Array}
const MASK_ALPHA=110;        // alpha 阈值:高于此算实心(滤掉抗锯齿边/极淡海草)
const MASK_SMOOTH_PASSES=2;  // 平滑轮廓的多数投票次数(越大越平坦,凹凸细节丢失越多)
function ensureRockMask(key){
  // 只有已经建成、且 grid 非全零、且 nonZeroPixels>0 的 mask 才复用;
  // 否则视为"iOS 图片没解码好时误建"的坏 mask,下帧重建。
  const cached=ROCK_MASK[key];
  if(cached && cached.grid && cached.nz>0) return cached;
  const img=IMG[key];
  if(!img){return null;}      // 图还没加载,下帧再试(不写缓存)
  const cols=MASK_COLS, rows=Math.max(1,Math.round(MASK_COLS*img.height/img.width));
  let grid=null;
  try{
    const oc=document.createElement("canvas");oc.width=cols;oc.height=rows;
    const octx=oc.getContext("2d");
    octx.drawImage(img,0,0,cols,rows);
    const d=octx.getImageData(0,0,cols,rows).data;
    grid=new Uint8Array(cols*rows);
    for(let i=0;i<cols*rows;i++) grid[i]=d[i*4+3]>MASK_ALPHA?1:0;
    // 平滑:3×3 多数投票(≥5 个邻居为实心即算实心) — 削掉小刺、填掉小缺口,让轮廓平坦
    for(let pass=0;pass<MASK_SMOOTH_PASSES;pass++){
      const nxt=new Uint8Array(cols*rows);
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        let cnt=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const xx=x+dx, yy=y+dy;
          if(xx<0||yy<0||xx>=cols||yy>=rows) continue;
          if(grid[yy*cols+xx]) cnt++;
        }
        nxt[y*cols+x]=cnt>=5?1:0;
      }
      grid=nxt;
    }
  }catch(e){grid=null;} // 极端:画布被污染,降级为无碰撞
  let nz=0;
  if(grid) for(let i=0;i<grid.length;i++) if(grid[i]) nz++;
  ROCK_MASK[key]={cols,rows,aspect:img.height/img.width,grid,nz};
  return ROCK_MASK[key];
}
/* 世界坐标点是否落在任一礁石的实心轮廓内 */
function rockSolidAt(px,py){
  const pixelWorld=window.CatFishGame&&window.CatFishGame.PixelWorldSystem;
  if(pixelWorld&&pixelWorld.solidAt)return !!pixelWorld.solidAt(px,py);
  const list=window.SCENERY_CFG||[];
  for(const it of list){
    const m=ensureRockMask(it.key);
    if(!m||!m.grid) continue;
    const w=it.w, h=it.w*m.aspect;
    let lx=px-it.x, ly=py-it.y;
    if(lx<0||ly<0||lx>=w||ly>=h) continue;
    let u=lx/w; if(it.flip<0) u=1-u;     // 翻转时横向镜像 UV
    const gx=Math.min(m.cols-1,(u*m.cols)|0);
    const gy=Math.min(m.rows-1,(ly/h*m.rows)|0);
    if(m.grid[gy*m.cols+gx]) return true;
  }
  return false;
}
const LINE_COST=BALANCE.gear.rod.costs.slice();
const ATK_LV=[
  {dmg:BALANCE.gear.hook.damage[0],cd:1.0,name:"Copper",prongs:1,c:"#c98a4b"},
  {dmg:BALANCE.gear.hook.damage[1],cd:1.0,name:"Silver",prongs:2,c:"#cdd6dd"},
  {dmg:BALANCE.gear.hook.damage[2],cd:0.8,name:"Gold",prongs:3,c:"#ffd24a"},
  {dmg:BALANCE.gear.hook.damage[3],cd:0.4,name:"Diamond",prongs:3,c:"#aef3ff"} // CTA 不可达,仅展示
];
const ATK_COST=BALANCE.gear.hook.costs.slice();
const GOAL_COINS=BALANCE.boss.triggerEarnings;
const BOSS_TRIGGER_DEPTH=1700;       // 钩下到此深度才出海王
const TUT_MIN_COINS=60;

/* ---------- 素材清单(缺图自动回退占位绘制) ---------- */
const ASSET_LIST={
  coast_surface:"coast_surface_v04.png",coast_water:"coast_water_v04.png",coast_pier:"coast_pier_v04.png",
  coast_cat:"coast_cat_pose_v027.png",coast_skins:"coast_skins_v04.png",coast_ui:"coast_ui_v04.png",
  harvest_minimal:"harvest_minimal_v010.png",
  catalog_journal:"catalog_journal_v016.png",
  reef_atlas:"reef_atlas_v011.png",reef_scene:"reef_scene_v011.png",
  bg_surface:"bg_surface.jpg", bg_water:"bg_water.jpg",
  map_pixel_surface:"map_pixel_surface.webp", map_pixel_depth:"map_pixel_depth.webp",
  map_pixel_seabed:"map_pixel_seabed.webp",
  map_structure_0:"map_structure_0.webp",map_structure_1:"map_structure_1.webp",
  map_structure_2:"map_structure_2.webp",map_structure_3:"map_structure_3.webp",
  map_structure_4:"map_structure_4.webp",map_structure_5:"map_structure_5.webp",
  map_structure_6:"map_structure_6.webp",map_structure_7:"map_structure_7.webp",
  home_upper_background:"home_upper_background.jpg",
  home_hut_sprite:"home_hut_sprite.webp",
  home_pier_sprite:"home_pier_sprite.webp",
  wave:"wave_ai.png",          // 水下顶部横向滚动波浪带(LowPoly,seamless)
  wave_transition:"wave_transition.png",  // 可选:海面↔水下过渡带覆盖图(竖向带透明渐变)。
                                          // 文件不存在时 onerror 静默忽略,自动回退到程序化渐变。
  rock:"rock.png",             // 礁石主平台(LowPoly + 顶部海草,可重复使用)
  rock_b:"rock_b.png",         // 礁石变体 B:圆丘 / 小礁
  rock_c:"rock_c.png",         // 礁石变体 C:双柱拱门(中央留通道)
  rock_d:"rock_d.png",         // 礁石变体 D:高柱 / 尖塔
  rock_e:"rock_e.png",         // 礁石变体 E:宽多层礁台
  rock_f:"rock_f.png",         // 礁石变体 F:窄高尖柱
  wreck:"wreck.png",           // 沉船平台
  fish_s:"fish_s.png", fish_m:"fish_m.png", fish_l:"fish_l.png",
  fish_01_v021:"fish_01_v021.png", fish_02_v021:"fish_02_v021.png",
  fish_03_v021:"fish_03_v021.png", fish_04_v021:"fish_04_v021.png",
  fish_05_v021:"fish_05_v021.png", fish_06_v021:"fish_06_v021.png",
  fish_07_v021:"fish_07_v021.png", fish_08_v021:"fish_08_v021.png",
  fish_09_v021:"fish_09_v021.png", fish_10_v021:"fish_10_v021.png",
  fish_11_v025:"fish_11_v025.png", fish_12_v025:"fish_12_v025.png",
  fish_13_v025:"fish_13_v025.png", fish_14_v025:"fish_14_v025.png",
  fish_15_v025:"fish_15_v025.png", fish_16_v025:"fish_16_v025.png",
  fish_17_v025:"fish_17_v025.png", fish_18_v025:"fish_18_v025.png",
  fish_19_v025:"fish_19_v025.png", fish_20_v025:"fish_20_v025.png",
  fish_21_v026:"fish_21_v026.png", fish_22_v026:"fish_22_v026.png",
  fish_23_v026:"fish_23_v026.png", fish_24_v026:"fish_24_v026.png",
  fish_25_v026:"fish_25_v026.png", fish_26_v026:"fish_26_v026.png",
  fish_27_v026:"fish_27_v026.png", fish_28_v026:"fish_28_v026.png",
  fish_29_v026:"fish_29_v026.png", fish_30_v026:"fish_30_v026.png",
  seaking:"seaking.png", boat:"boat.png", fisher:"fisher.png", rod:"rod.png",
  // 渔夫状态机(水平精灵条,行 = 一个动画,列 = 帧;缺图自动回退到 fisher.png)
  fisher_idle:"fisher_idle.png",     // 待机(hook idle 且 phase=ready/tut_aim/intro)
  fisher_cast:"fisher_cast.png",     // 开始钓鱼(hook.state="cast",一次性,不循环)
  fisher_fishing:"fisher_fishing.png", // 钓鱼中(hook.state="swim")
  fisher_reel:"fisher_reel.png",     // 收鱼(hook.state="retract",一次性)
  hook_cu:"hook_cu.png", hook_ag:"hook_ag.png", hook_au:"hook_au.png", hook_dia:"hook_dia.png",
  line_tex:"line_tex.png",  // 鱼线平铺纹理(可选;缺图回退白线+程序编织纹)
  ui_finger:"ui_finger.png", // 引导手指图标(替换 👆 emoji;缺图回退到 emoji)
  ui_line_fill:"ui_line_fill.png", // 鱼线进度条填充贴图(有则用图,无则纯色回退)
  // ---- UI 皮肤图(可选;缺图 onerror 静默,自动回退内置渲染)。文件名 = ui_<键>.png ----
  ui_cast:"ui_cast.png", ui_reel:"ui_reel.png", ui_upgrade:"ui_upgrade.png", ui_tut:"ui_tut.png",
  coin:"coin.png",   // 全局金币图标(HUD/结算飞币/升级面板/结算面板 统一用这张)
  ui_coin:"ui_coin.png", ui_goal:"ui_goal.png", ui_line:"ui_line.png",
  ui_bosshp:"ui_bosshp.png",
  // 升级面板图标(缺图回退到程序画)
  ui_ico_line:"ui_ico_line.png", ui_ico_atk:"ui_ico_atk.png",
  // 分级图标(有则优先用,缺则回退到通用 ui_ico_line / ui_ico_atk)
  ui_ico_line_lv1:"ui_ico_line_lv1.png", ui_ico_line_lv2:"ui_ico_line_lv2.png",
  ui_ico_line_lv3:"ui_ico_line_lv3.png", ui_ico_line_lv4:"ui_ico_line_lv4.png",
  ui_ico_hook_lv1:"ui_ico_hook_lv1.png", ui_ico_hook_lv2:"ui_ico_hook_lv2.png",
  ui_ico_hook_lv3:"ui_ico_hook_lv3.png", ui_ico_hook_lv4:"ui_ico_hook_lv4.png",
  // 面板/弹窗皮肤(缺图回退 CSS 渐变):卡框 / 升级面板专用卡框(含 GEAR UPGRADE 标题) / 金按钮 / 蓝按钮 / 升级行 / 小买钮 / 等级格子(空/满)
  ui_card:"ui_card.png", ui_card_gear:"ui_card_gear.png", ui_btn:"ui_btn.png", ui_btn_blue:"ui_btn_blue.png",
  ui_uprow:"ui_uprow.png", ui_upbtn:"ui_upbtn.png", ui_pip:"ui_pip.png", ui_pip_on:"ui_pip_on.png",
  // Download/CTA 圆按钮、升级面板 X 关闭(缺图回退 CSS)
  ui_download:"ui_download.png", ui_close:"ui_close.png",
  // 静态文字图(把标题/标签做成图;缺图回退程序文字):弹窗标题 + 升级行标签
  ui_txt_goal:"ui_txt_goal.png", ui_txt_settle:"ui_txt_settle.png", ui_txt_gear:"ui_txt_gear.png",
  ui_txt_cta:"ui_txt_cta.png", ui_txt_line:"ui_txt_line.png", ui_txt_hook:"ui_txt_hook.png"
};
/* boat.png 关键点(测量后的相对像素位置 / 总尺寸 814×488)
   - 鱼竿尖(灯笼):x=770/814 ≈ 0.946, y=340/488 ≈ 0.697
   - 渔夫手部:x=625/814 ≈ 0.768, y=255/488 ≈ 0.523
   - 船底:y=460/488 ≈ 0.942 */
const BOAT_W_WORLD=253;                // boat.png 绘制宽度(世界单位,缩小 1/3 后)
const BOAT_H_WORLD=BOAT_W_WORLD*488/814; // ≈228
const BOAT_BOTTOM_OFFSET=22;           // 船底浸入水中的像素
// 鱼竿尖横向相对位置(GAME_CFG.rodTipFx,0~1),回退 0.946
function rodTipFx(){return (window.GAME_CFG&&window.GAME_CFG.rodTipFx!=null)?window.GAME_CFG.rodTipFx:0.946;}
function rodTipFy(){return (window.GAME_CFG&&window.GAME_CFG.rodTipFy!=null)?window.GAME_CFG.rodTipFy:0.697;}
// 鱼钩入水/收线归位的 x:船中心 + 竿尖横偏 + 船偏移(boatDX),与船图竿尖同步
// 下钩/归位 x = 鱼竿尖(由 drawBoat 每帧更新;鱼线垂直从竿尖入水)。首帧 drawBoat 未跑则回退公式。
function castX(){return (typeof rodTipX==="number"&&rodTipX>0)?rodTipX:(WORLD_W/2+BOAT_W_WORLD*(rodTipFx()-0.5)+((window.GAME_CFG&&window.GAME_CFG.boatDX)||0));}

const IMG={};
UI_IMG_READY=true;   // IMG 已声明,uiImg 可安全引用
let pending=Object.keys(ASSET_LIST).length;
// 预解码 + 预光栅化:大图(渔夫精灵条等)第一次 drawImage 时浏览器才解码/光栅化,会掉一帧。
// 加载完成后 decode() + 按接近真实的尺寸画进离屏 canvas,把解码和缩放光栅缓存都提前到加载期。
function predecodeImage(im){
  try{
    const warm=()=>{try{
      const oc=predecodeImage._oc||(predecodeImage._oc=document.createElement("canvas"));
      // 用图片原始尺寸(上限 2048)warm,同时再画一次半尺寸 → 覆盖大图缩小绘制的光栅路径
      const w=Math.min(im.naturalWidth||1,2048), h=Math.min(im.naturalHeight||1,2048);
      oc.width=w; oc.height=h;
      const c2=oc.getContext("2d");
      c2.drawImage(im,0,0,w,h);
      c2.drawImage(im,0,0,Math.max(1,w>>1),Math.max(1,h>>1));
    }catch(e){}};
    if(im.decode) im.decode().then(warm,warm); else warm();
  }catch(e){}
}
// 渔夫各状态精灵条:LOADED 后按"游戏内真实绘制路径"warm 一遍。
// 关键:直接画到主 ctx(近零 alpha,几乎不可见)——部分浏览器 GPU 纹理缓存按 canvas 隔离,
// 离屏 canvas 上的 warm 不惠及主画布,这正是首次绘制掉帧修不掉的常见原因。
// 渔夫精灵条 → 逐帧切成独立 canvas。canvas 是常驻位图,绘制永不触发图片解码。
// (Image 的解码缓存会被 Chrome 随时逐出:idle 每帧在画所以常热,cast/reel 加载后
//  几十秒无人画 → 解码数据被回收 → 首次使用时光栅线程重新解码 = 100~250ms 掉帧。)
const FISHER_FRAMES={};  // st -> {sig, frames:[canvas,...]}
async function warmFisherFrames(){
  try{
    // iOS Safari:并行 decode 4 张巨型精灵条会失败;改成串行 await。
    for(const st of ["idle","cast","fishing","reel"]){
      const im=IMG["fisher_"+st];
      if(im&&im.decode){ try{ await im.decode(); }catch(e){} }
    }
    // 切片目标分辨率 = 游戏内实际显示尺寸 × 设备像素比 × 1.25 余量。
    // 用原图分辨率切片会导致:内存浪费 25 倍 + 首次收鱼时几十 MB 的 GPU 纹理上传(≈200ms 掉帧)。
    const B=window.BOAT_CFG||{};
    const bw=B.boatW||237, fscale=B.fisherScale||0.26;
    const maxZoom=Math.max((window.ZOOM_CFG&&ZOOM_CFG.boat)||1.95,(window.ZOOM_CFG&&ZOOM_CFG.fish)||1.35);
    const dprScale=(cvs&&cvs.width&&VW)?(cvs.width/VW):2;   // 主画布 backing / 逻辑宽
    const targetW=Math.max(64, Math.ceil(bw*fscale*maxZoom*dprScale*1.25));
    for(const st of ["idle","cast","fishing","reel"]){
      const img=IMG["fisher_"+st], cfg=window.FISHER_ANIM&&window.FISHER_ANIM[st];
      if(!img||!img.width||!cfg) continue;
      const cols=Math.max(1,cfg.cols|0), rows=Math.max(1,cfg.rows|0);
      const fw=img.width/cols, fh=img.height/rows;
      const total=(cfg.frames&&cfg.frames>0)?Math.min(cfg.frames,cols*rows):cols*rows;
      const outW=Math.max(1,Math.min(Math.round(fw), targetW));
      const outH=Math.max(1,Math.round(outW*(fh/fw)));
      const sig=img.width+"x"+img.height+"|"+cols+"x"+rows+"|"+total+"|"+outW+"|"+(img.src?img.src.length:0);
      if(FISHER_FRAMES[st]&&FISHER_FRAMES[st].sig===sig) continue; // 没变不重切
      const frames=[];
      for(let i=0;i<total;i++){
        const cc=i%cols, rr=(i/cols)|0;
        const oc=document.createElement("canvas");
        oc.width=outW; oc.height=outH;
        const c2=oc.getContext("2d");
        c2.imageSmoothingQuality="high";
        c2.drawImage(img, cc*fw, rr*fh, fw, fh, 0, 0, outW, outH);
        // 物化为裸像素(同 imageToCanvas):否则切片 canvas 的绘制录像仍引用巨型精灵条,
        // 重放时重新解码整张 webp = 首抛/首收 150~220ms 尖峰的直接来源。
        // iOS 兜底:抽样若 alpha 全 0 说明 drawImage 静默失败,该 state 整个跳过、保留原 img
        try{
          const px=c2.getImageData(0,0,outW,outH);
          const d=px.data;
          let hasPix=false;
          const step=Math.max(4,(d.length>>2)/64|0)*4;
          for(let j=3;j<d.length;j+=step){ if(d[j]>0){ hasPix=true; break; } }
          if(!hasPix){ frames.length=0; break; }   // 中止本 state 切片
          const o2=document.createElement("canvas");
          o2.width=outW; o2.height=outH;
          o2.getContext("2d").putImageData(px,0,0);
          frames.push(o2);
        }catch(e){ frames.push(oc); }
      }
      // 只有切片真的产出了 >0 帧才写入 cache 和 释放原图;否则保留原 img,让 pickFisherFrame
      // 走回退路径直接画 raw sprite,画面不至于完全丢失(iOS 局部 decode 失败时的兜底)
      if(frames.length>0){
        FISHER_FRAMES[st]={sig, frames};
        IMG["fisher_"+st]={width:img.width,height:img.height};
      }
    }
    // 鱼光晕贴图预构建:fishGlowSprite 是 2× 分辨率 + shadowBlur×3 的重光栅操作,
    // 懒构建会正好落在第一次收鱼(首条挂钩鱼绘制)那一帧 → 独立包必卡。加载期做掉。
    for(const k in FISH_TYPES) fishGlowSprite("fish_"+k, FISH_TYPES[k].r);
    arrowSprite();   // boss 引导箭头贴图(含 shadowBlur 发光)也在加载期烤好
  }catch(e){}
}
// 纹理 keep-alive:每帧以 1×1 clip 把「所有游戏位图」画一遍到主 ctx。
// 作用:① 首次真实使用前纹理已上传 GPU(否则首用即上传 = 100ms+ 尖峰,
//   典型:第一次收鱼结束弹结算面板,大卡片图首绘) ② 每帧刷新 LRU,纹理永不被逐出。
// 成本:百余次被裁剪成 1px 的 drawImage,亚毫秒;比任何"一次性预热"都可靠。
window.__REEL_HOT=false;   // 兼容旧逻辑的标记(pickFisherFrame 里还在写),已不用于停止保温
// 纹理保温(最终版,在导出包上实测零尖峰):
// ① 渔夫帧/光晕按「游戏内真实显示尺寸」轮换绘制,每帧 4 张(alpha=0.004 不可见)——
//    Chrome 的光栅缓存按目标尺寸分档,48×48 的保温命中不了真实绘制的档位;
//    也绝不能全量每帧画(大图缩采样吃满 GPU 带宽 = 持续掉帧,历史教训)。
// ② 前 120 帧做一次 GPU 管线预热:鱼线 pattern 描边/虚线/lighter/描边文字/径向渐变/旋转贴图
//    各画一遍,消除首次使用某种绘制形态时的管线编译尖峰。
window.__CAST_HOT=false;   // 兼容标记(pickFisherFrame 在写),保温已不依赖它们
let _hotArr=null,_hotIdx=0,_hotSig="";
function keepTexturesHot(){
  if(!ctx) return;
  const sig=Object.keys(FISHER_FRAMES).length+"|"+Object.keys(_fishGlowCache).length;
  if(sig!==_hotSig){
    _hotSig=sig; _hotArr=[]; _hotIdx=0;
    const B=window.BOAT_CFG||{}, bw=B.boatW||237, fs=B.fisherScale||.26;
    for(const z of [(window.ZOOM_CFG&&ZOOM_CFG.fish)||1.35,(window.ZOOM_CFG&&ZOOM_CFG.boat)||1.95]){
      const dw=bw*fs*z;
      for(const st in FISHER_FRAMES){
        const c=FISHER_FRAMES[st];
        if(c&&c.frames) for(const f of c.frames) _hotArr.push({im:f,w:dw,h:dw*f.height/f.width});
      }
      for(const k in _fishGlowCache){
        const g=_fishGlowCache[k];
        if(g&&g.cv) _hotArr.push({im:g.cv,w:g.dw*z,h:g.dh*z});
      }
    }
  }
  if(_hotArr&&_hotArr.length){
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalAlpha=0.004;
    for(let n=0;n<4;n++){
      const it=_hotArr[_hotIdx];
      ctx.drawImage(it.im,0,0,it.w,it.h);
      _hotIdx=(_hotIdx+1)%_hotArr.length;
    }
    ctx.restore();
  }
  // GPU 管线预热(前 120 帧,每帧一遍,单次开销亚毫秒)
  window.__PIPE_N=window.__PIPE_N||0;
  if(window.__PIPE_N<120){
    window.__PIPE_N++;
    try{
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.globalAlpha=0.004;
      const pat=(typeof lineTexPattern==="function")?lineTexPattern():null;
      ctx.strokeStyle=pat||"rgba(248,253,250,.95)"; ctx.lineWidth=2.8; ctx.lineCap="round"; ctx.lineJoin="round";
      ctx.beginPath(); ctx.moveTo(2,2); ctx.quadraticCurveTo(30,30,10,60); ctx.stroke();
      ctx.strokeStyle="rgba(20,40,40,.35)"; ctx.lineWidth=3.2;
      ctx.beginPath(); ctx.moveTo(4,0); ctx.quadraticCurveTo(34,28,14,58); ctx.stroke();
      ctx.setLineDash([4,6]); ctx.lineDashOffset=-3; ctx.strokeStyle="rgba(130,170,185,.55)"; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(40,40); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalCompositeOperation="lighter";
      if(IMG.fish_s&&IMG.fish_s.width) ctx.drawImage(IMG.fish_s,0,0,40,30);
      ctx.globalCompositeOperation="source-over";
      ctx.font="bold 19px sans-serif"; ctx.textAlign="center";
      ctx.strokeStyle="#123"; ctx.lineWidth=3; ctx.strokeText("+5",20,20);
      ctx.fillStyle="#ffd966"; ctx.fillText("+5",20,20);
      const gg=ctx.createRadialGradient(20,20,2,20,20,30);
      gg.addColorStop(0,"rgba(255,220,120,.5)"); gg.addColorStop(1,"rgba(255,220,120,0)");
      ctx.fillStyle=gg; ctx.fillRect(0,0,40,40);
      ctx.rotate(.3);
      if(IMG.hook_cu&&IMG.hook_cu.width) ctx.drawImage(IMG.hook_cu,0,0,32,32);
      ctx.restore();
    }catch(e){}
  }
}
// Image → canvas 常驻位图:data URI 图片的解码缓存会被 Chrome 随时回收(尤其独立包),
// 回收后下一次 drawImage 要在光栅线程重新解码 = 帧间隔 80~200ms 的尖峰(JS 计时看不到)。
// canvas 是解码后的像素,绘制永不触发解码 → 根治。转换在加载期一次完成。
// iOS Safari 上,onload 会先于巨型 data URI(bg_water 1024×1820、fisher_reel 4170×7784 等)
// 真正解码完成触发。此时对 img 做 drawImage 得到空像素 —— imageToCanvas/warmFisherFrames 都会把
// 空白拍进 canvas,首次打开背景/角色都看不见。第二次因为浏览器缓存了解码后位图才正常。
// 修:所有图片先 await decode() 全部就绪,再统一 materialize。
// 大图降采样:iOS Safari 处理 > 2MP 的位图会严重卡顿(fisher 精灵条常在 20+MP)。
// 逐张 decode 后立刻缩到 ≤1.5MP;iOS 走 createImageBitmap 走 GPU 通道,不走 CPU drawImage。
const _DOWNSCALE_MAX_PX=2e6;
const _DOWNSCALE_TARGET_PX=1.5e6;
async function downscaleIfHuge(k){
  const im=IMG[k];
  if(!im) return;
  const w=im.naturalWidth||im.width, h=im.naturalHeight||im.height;
  if(!w||!h) return;
  const area=w*h;
  const individualFishArt=/^fish_\d+_v02[56]$/.test(k);
  const maxPixels=individualFishArt?262144:_DOWNSCALE_MAX_PX;
  if(area<=maxPixels) return;
  const scale=Math.sqrt((individualFishArt?196608:_DOWNSCALE_TARGET_PX)/area);
  const nw=Math.max(1,Math.floor(w*scale)), nh=Math.max(1,Math.floor(h*scale));
  try{
    if(window.createImageBitmap){
      const bmp=await createImageBitmap(im, {resizeWidth:nw, resizeHeight:nh, resizeQuality:"high"});
      // iOS Safari 会静默忽略 resize 选项,返回全尺寸 bitmap —— 必须验证实际尺寸
      if(bmp && bmp.width<=nw*1.25){ IMG[k]=bmp; return; }
      if(bmp && bmp.close) try{bmp.close();}catch(e){}
    }
  }catch(e){}
  try{
    const c=document.createElement("canvas");
    c.width=nw; c.height=nh;
    c.getContext("2d").drawImage(im,0,0,nw,nh);
    IMG[k]=c;
  }catch(e){}
}
async function finalizeLoading(){
  // 串行 await 每张 decode + 立刻降采样超大图 + materialize 常规图
  for(const kk in IMG){
    const im=IMG[kk];
    if(im && im.decode){
      try{ await im.decode(); }catch(e){}
    }
    await downscaleIfHuge(kk);
    if(kk.indexOf("fisher_")!==0){
      const cur=IMG[kk];
      const W=cur&&(cur.naturalWidth||cur.width);
      if(cur && W) imageToCanvas(kk);
    }
  }
  if(window.CatFishGame.ReefArtSystem)window.CatFishGame.ReefArtSystem.prepare(IMG);
  await warmFisherFrames();
  window.CatFishGame.CatalogArtSystem.prepare(IMG.catalog_journal);
  window._loadingFinalized=true;
  // 图片全就绪后,后台预解码全部音效(decodeAudioData 走音频线程,不抢渲染)
  // → 第一次钩鱼/金币爆出时 AudioBuffer 已就绪,播放零成本,iOS 不再掉帧
  try{ if(window.preloadAllAudio) setTimeout(window.preloadAllAudio, 300); }catch(e){}
}
function imageToCanvas(k){
  try{
    const im=IMG[k];
    // 兼容:Image 用 naturalWidth、Canvas/ImageBitmap 用 width
    const W=im&&(im.naturalWidth||im.width), H=im&&(im.naturalHeight||im.height);
    if(!W) return;
    const oc=document.createElement("canvas");
    oc.width=W; oc.height=H;
    const c=oc.getContext("2d");
    c.drawImage(im,0,0);
    // 物化为裸像素:canvas 默认只存"绘制命令录像",显存紧张时重放录像会重新解码原图
    // (曾致面板图首次弹出 100ms+ 尖峰)。putImageData 进新 canvas 后不再引用原图。
    const px=c.getImageData(0,0,oc.width,oc.height);
    // iOS 教训:drawImage 有时静默产出全透明(内存/解码没就绪)。抽样 alpha 若全为 0
    // → 物化会把"空白 canvas"永久写入 IMG,以后再也画不出来。检出后放弃物化,保留原 Image
    const d=px.data;
    let hasPix=false;
    // 抽样 128 个像素点(足够快;不用扫全图)
    const step=Math.max(4, (d.length>>2)/128|0)*4;
    for(let i=3;i<d.length;i+=step){ if(d[i]>0){ hasPix=true; break; } }
    if(!hasPix) return;   // 保持 IMG[k] 为原 Image,drawImage 直接用原图渲染
    const o2=document.createElement("canvas");
    o2.width=oc.width; o2.height=oc.height;
    o2.getContext("2d").putImageData(px,0,0);
    IMG[k]=o2;
  }catch(e){}
}
function finishAssetRequest(){
  if(--pending===0){alEvent("LOADED");applyUiLayout();finalizeLoading();}
}
for(const k in ASSET_LIST){
  const fname=ASSET_LIST[k];
  // assets_b64.js 已经是一份完整的开发/发布素材清单。存在清单时直接跳过未内嵌的
  // 可选素材，避免每次启动都产生一批必然失败的 404；没有清单的散装开发模式仍走相对路径。
  if(window.ASSET_INLINE&&!window.ASSET_INLINE[fname]){IMG[k]=null;finishAssetRequest();continue;}
  const im=new Image();
  im.onload=()=>{IMG[k]=im;predecodeImage(im);finishAssetRequest();};
  // 关键:onerror 也要跑完整的完成流程!清单里有缺失文件时(如可选的 wave_transition),
  // 最后完成的往往是 onerror —— 曾因此处不跑 imageToCanvas/warmFisherFrames,
  // 导致导出包切片/转换全部未执行,首抛/首收 150~220ms 尖峰,排查数轮才定位到这里。
  im.onerror=finishAssetRequest;
  // 优先用内嵌 base64(单文件导出),否则用相对路径(开发版)
  im.src=(window.ASSET_INLINE&&window.ASSET_INLINE[fname])||("assets/"+fname);
}

/* ---------- 音效(HTMLAudioElement 池,不用 AudioContext beep 了) ---------- */
let muted=false;
const AUDIO_MAP={
  cast:      "UI_FishingRod_Throw.mp3",
  reel:      "UI_FishingRod_ReelIn.mp3",
  hit:       "UI_Fish_Hit.mp3",
  catchS:    "UI_Catch_SmallFish.mp3",
  catchM:    "UI_Catch_MediumFish.mp3",
  catchL:    "UI_Catch_BigFish.mp3",
  coinCollect:"UI_Coin_Collect.mp3",
  coinDrop:  "UI_Coin_Drop.mp3",
  coinLack:  "UI_Coin_Lack.mp3",
  upgrade:   "UI_LevelUp.mp3",
  alert:     "UI_Alert.mp3",
  menuOpen:  "UI_Menu_Open.mp3",
  click:     "UI_Click.mp3",
  playerHurt:"UI_Player_Hurt.mp3",
  bgm:       "Music_Loop.mp3",
  amb:       "Amb_AboveWater_Loop.mp3",
};
// 音量已全部预烘进 mp3 文件(iOS 忽略 HTMLAudio.volume,只能烘文件);播放端一律 1.0
const AUDIO_VOL={
  cast:1,reel:1,hit:1,catchS:1,catchM:1,catchL:1,
  coinCollect:1,coinDrop:1,coinLack:1,upgrade:1,
  alert:1,menuOpen:1,click:1,playerHurt:1,
  bgm:1,amb:1,
};
/* Web Audio 实现(iOS 两大痛点的解法):
   ① HTMLAudio 的 loop 在 iOS 有可闻间隙 → AudioBufferSourceNode.loop 采样级无缝
   ② HTMLAudio 每次 play() 在 iOS 有主线程解码开销(钩鱼/金币爆掉帧的元凶)
      → mp3 预解码成 AudioBuffer,播放只是 start() 一个 source,微秒级 */
let _ac=null, _masterGain=null;
const _bufs={};          // key → AudioBuffer(解码完成)
const _bufLoading={};    // key → true(解码中)
const _loopNodes={};     // key → {src,gain}(循环播放中的节点)
function _audioSrc(name){
  return (window.AUDIO_INLINE&&window.AUDIO_INLINE[name])||("assets/audio/"+name);
}
// 解码专用 OfflineAudioContext:AudioBuffer 不绑定 context,可在任何 context 上播。
// 好处:真正的播放 AudioContext 可以等到首次用户手势才创建 ——
// AppLovin 的 iOS WKWebView 对"非手势创建的 AudioContext"很敏感(卡 interrupted 不出声)
let _decCtx=null;
function _getDecCtx(){
  if(_decCtx) return _decCtx;
  try{ _decCtx=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,1,44100); }catch(e){}
  return _decCtx;
}
function _ensureAC(){
  if(_ac) return _ac;
  try{
    _ac=new (window.AudioContext||window.webkitAudioContext)();
    _masterGain=_ac.createGain();
    _masterGain.connect(_ac.destination);
  }catch(e){}
  return _ac;
}
function _tryResume(){
  // WKWebView 里 state 可能是 "interrupted"(非 "suspended")—— 只要不是 running 都尝试 resume
  if(_ac && _ac.state!=="running"){ try{ _ac.resume(); }catch(e){} }
}
function _dataUriToArrayBuffer(uri){
  const i=uri.indexOf(",");
  const bin=atob(uri.slice(i+1));
  const buf=new ArrayBuffer(bin.length);
  const u8=new Uint8Array(buf);
  for(let j=0;j<bin.length;j++) u8[j]=bin.charCodeAt(j);
  return buf;
}
function _loadBuf(key){
  if(_bufs[key]||_bufLoading[key]) return;
  // 解码优先走 OfflineAudioContext(不触发播放会话);没有再退回真 context
  const ac=_getDecCtx()||_ensureAC(); if(!ac) return;
  _bufLoading[key]=true;
  const src=_audioSrc(AUDIO_MAP[key]);
  const onBuf=(ab)=>{
    // decodeAudioData 在 iOS 上老式回调签名兼容性最好
    ac.decodeAudioData(ab, (buf)=>{ _bufs[key]=buf; _bufLoading[key]=false;
      // 若这是等待中的 loop(用户已经点过屏),解码完立即开播
      if(_loopWanted[key]) _startLoop(key);
    }, ()=>{ _bufLoading[key]=false; });
  };
  if(src.indexOf("data:")===0){
    try{ onBuf(_dataUriToArrayBuffer(src)); }catch(e){ _bufLoading[key]=false; }
  } else {
    fetch(src).then(r=>r.arrayBuffer()).then(onBuf).catch(()=>{ _bufLoading[key]=false; });
  }
}
// 加载完成后后台预解码全部音效(decodeAudioData 主要在音频线程,不卡渲染),
// 保证第一次钩鱼/金币时 buffer 已就绪,零掉帧
window.preloadAllAudio=function(){
  if(_isAdEnv()){
    // 广告容器:预建 HTMLAudio 池并触发加载,首播不卡
    for(const key in AUDIO_MAP){ const arr=_haGet(key); if(arr) for(const a of arr){ try{a.load();}catch(e){} } }
    return;
  }
  for(const key in AUDIO_MAP) _loadBuf(key);
};
const _loopWanted={};   // key → true(玩家已请求播放,等 buffer 就绪自动开)
function _startLoop(key){
  if(muted||!_ac||!_bufs[key]||_loopNodes[key]) return;
  try{
    const src=_ac.createBufferSource();
    src.buffer=_bufs[key]; src.loop=true;
    const g=_ac.createGain(); g.gain.value=AUDIO_VOL[key]||0.5;
    src.connect(g); g.connect(_masterGain);
    src.start(0);
    _loopNodes[key]={src,gain:g};
  }catch(e){}
}
/* 双模式:
   - 广告容器(mraid 存在,如 AppLovin 的 WKWebView):Web Audio 输出被容器整体静音,
     只有 HTMLAudioElement 能出声 → 走 HTMLAudio(音量已烘进文件,不依赖 volume 属性)
   - 普通浏览器:走 Web Audio(循环无缝 + 播放零成本) */
// 强制全环境 Web Audio:此前 AppLovin"无声"的更可能解释是测试机静音拨片打开了
// (Web Audio 尊重拨片 → 无声;HTMLAudio 无视拨片 → 幽灵环境音能响,证据吻合)。
// 首手势用真实静音 mp3 把音频会话切到 playback,拨片就压不住 Web Audio 了。
// 若实测仍无声,把这里改回 mraid 检测走 HTMLAudio 路径。
const AUDIO_FORCE_WEBAUDIO=true;
let _adEnvCache=false;
function _isAdEnv(){
  if(AUDIO_FORCE_WEBAUDIO) return false;
  if(_adEnvCache) return true;
  if(typeof mraid!=="undefined"){ _adEnvCache=true; return true; }
  return false;
}
const _haPool={}, _haIdx={};   // HTMLAudio 模式的元素池
function _haGet(key){
  if(_haPool[key]) return _haPool[key];
  const src=_audioSrc(AUDIO_MAP[key]); if(!src) return null;
  const isLoop=(key==="bgm"||key==="amb");
  // 循环音轨:2 个元素接力(不用 el.loop —— mp3 循环点必有可闻间隙);音效:3 个轮换
  const n=isLoop?2:3, arr=[];
  for(let i=0;i<n;i++){ const a=new Audio(); a.src=src; arr.push(a); }
  _haPool[key]=arr;
  return arr;
}
// 双元素接力循环:当前元素还剩 <0.12s 时启动另一个,首尾交叠盖住 mp3 的循环缝隙
const _haLoopState={};   // key → {idx}
let _haLoopTimer=null;
function _haLoopTick(){
  for(const key in _haLoopState){
    const st=_haLoopState[key]; if(!st) continue;
    const arr=_haPool[key]; if(!arr) continue;
    const cur=arr[st.idx];
    if(cur && cur.duration && !cur.paused && cur.currentTime > cur.duration-0.12){
      const nxt=(st.idx+1)%arr.length;
      const b=arr[nxt];
      try{ b.currentTime=0; const p=b.play(); if(p&&p.catch)p.catch(()=>{}); }catch(e){}
      st.idx=nxt;
    }
  }
}
function _haStartLoop(key){
  const arr=_haGet(key); if(!arr||!arr[0]) return;
  if(_haLoopState[key]) return;   // 已在播
  _haLoopState[key]={idx:0};
  const a=arr[0];
  try{ a.currentTime=0; const p=a.play(); if(p&&p.catch)p.catch(()=>{}); }catch(e){}
  if(!_haLoopTimer) _haLoopTimer=setInterval(_haLoopTick, 50);
}
function _haStopLoop(key){
  const st=_haLoopState[key];
  delete _haLoopState[key];
  const arr=_haPool[key];
  if(arr) for(const a of arr){ try{ a.pause(); }catch(e){} }
  if(!Object.keys(_haLoopState).length && _haLoopTimer){ clearInterval(_haLoopTimer); _haLoopTimer=null; }
}
function playSfx(key, volOverride){
  if(muted) return;
  if(window.CatFishGame&&window.CatFishGame.SettingsSystem&&!window.CatFishGame.SettingsSystem.load().sound) return;
  if(window.WeChatHost){window.WeChatHost.sound(AUDIO_MAP[key],false,volOverride??AUDIO_VOL[key]??1);return;}
  if(_isAdEnv()){
    const arr=_haGet(key); if(!arr) return;
    const i=(_haIdx[key]||0)%arr.length; _haIdx[key]=i+1;
    const a=arr[i];
    try{ a.currentTime=0; const p=a.play(); if(p&&p.catch)p.catch(()=>{}); }catch(e){}
    return;
  }
  const ac=_ensureAC(); if(!ac) return;
  _tryResume();
  const buf=_bufs[key];
  if(!buf){ _loadBuf(key); return; }   // 首次还没解码好:触发解码,本次静默(极少见,预解码已覆盖)
  try{
    const src=ac.createBufferSource();
    src.buffer=buf;
    const g=ac.createGain();
    g.gain.value=(volOverride!=null?volOverride:(AUDIO_VOL[key]||1));
    src.connect(g); g.connect(_masterGain);
    src.start(0);
  }catch(e){}
}
function playLoop(key){
  if(muted) return;
  if(window.WeChatHost){if(settings().sound)window.WeChatHost.sound(AUDIO_MAP[key],true,AUDIO_VOL[key]||.5);return;}
  _loopWanted[key]=true;
  if(_isAdEnv()){ _haStartLoop(key); return; }
  const ac=_ensureAC(); if(!ac) return;
  _tryResume();
  if(_bufs[key]) _startLoop(key);
  else _loadBuf(key);
}
function stopLoop(key){
  if(window.WeChatHost)window.WeChatHost.stopSound(AUDIO_MAP[key]);
  _loopWanted[key]=false;
  _haStopLoop(key);
  const n=_loopNodes[key];
  if(n){ try{ n.src.stop(); }catch(e){} delete _loopNodes[key]; }
}
// audio():首次用户手势时调用 —— resume AudioContext(iOS autoplay 策略)+ 启动 BGM/环境音
function audio(){
  if(muted) return;
  if(window.WeChatHost){playLoop("bgm");playLoop("amb");return;}
  // iOS 静音拨片:Web Audio 会被拨片完全压制(HTMLAudio 不会)。
  // 把音频会话切到 playback 类别 → 拨片静音时 Web Audio 依然出声(与其他游戏行为一致):
  // ① iOS 16.4+ 有正式 API;② 老版本用"无声 HTMLAudio 循环"hack 切会话
  if(_isAdEnv()){    // 广告容器:纯 HTMLAudio,不碰 Web Audio,也不需要静音拨片 keeper
    playLoop("bgm"); playLoop("amb");
    return;
  }
  // 静音拨片 keeper:播一个真实的 10 秒静音 mp3(走 AUDIO_INLINE,和其他音效同一条已验证通道),
  // 把 WKWebView 音频会话切到 playback → 静音拨片压不住 Web Audio。
  // (曾用运行时生成的 WAV Blob,在 WKWebView 里疑似静默失败,会话没切过去)
  if(!window.__iosAudioSession){
    window.__iosAudioSession=true;
    try{ if(navigator.audioSession) navigator.audioSession.type="playback"; }catch(e){}
    try{
      const s=new Audio(_audioSrc("Silence_10s.mp3"));
      s.loop=true;
      const pr=s.play(); if(pr&&pr.catch) pr.catch(()=>{});
      window.__silentKeeper=s;
    }catch(e){}
  }else try{if(window.__silentKeeper&&window.__silentKeeper.paused){const pr=window.__silentKeeper.play();if(pr&&pr.catch)pr.catch(()=>{});}}catch(e){}
  _ensureAC();       // 首次手势里创建播放 context(WKWebView 最认这种)
  _tryResume();      // suspended / interrupted 一律尝试恢复
  playLoop("bgm"); playLoop("amb");
}
window.setMuted=(m)=>{
  muted=!!m;
  if(muted){ stopLoop("bgm"); stopLoop("amb"); if(_masterGain)_masterGain.gain.value=0; }
  else { if(_masterGain)_masterGain.gain.value=1; playLoop("bgm"); playLoop("amb"); }
};
function suspendAudioForLifecycle(){
  try{if(_ac&&_ac.state==="running")_ac.suspend();}catch(e){}
  _haStopLoop("bgm");_haStopLoop("amb");
  try{if(window.__silentKeeper)window.__silentKeeper.pause();}catch(e){}
}
function resumeAudioForLifecycle(){
  if(muted||window.CatFishGame.SettingsSystem&&!window.CatFishGame.SettingsSystem.load().sound)return;
  try{if(_ac&&(_ac.state==="suspended"||_ac.state==="interrupted"))_ac.resume();}catch(e){}
  try{if(window.__silentKeeper&&window.__silentKeeper.paused){const pr=window.__silentKeeper.play();if(pr&&pr.catch)pr.catch(()=>{});}}catch(e){}
  if(_isAdEnv()){
    if(_loopWanted.bgm)_haStartLoop("bgm");
    if(_loopWanted.amb)_haStartLoop("amb");
  }
}
// WKWebView(AppLovin 容器)只认 touchend/click 解锁音频,pointerdown(≈touchstart)不算。
// Safari 新内核按下即解锁所以本机正常。把解锁同时挂到抬起类事件上,双保险;
// 监听常驻:系统电话打断/切后台回来的 interrupted 状态也能靠下一次交互恢复
["touchend","click","pointerup"].forEach(ev=>{
  addEventListener(ev, ()=>{ try{ audio(); }catch(e){} }, {passive:true});
});
// 隐藏诊断:URL 加 ?audiodbg 时,屏幕左上角实时显示音频状态(排查容器环境用)
if(/[?&]audiodbg/.test(location.search)){
  const el=document.createElement("div");
  el.style.cssText="position:fixed;left:4px;top:4px;z-index:99999;background:rgba(0,0,0,.8);color:#0f0;font:11px monospace;padding:4px 6px;pointer-events:none;white-space:pre";
  document.body.appendChild(el);
  setInterval(()=>{
    el.textContent="ac:"+(_ac?_ac.state:"null")
      +" bufs:"+Object.keys(_bufs).length
      +" loops:"+Object.keys(_loopNodes).length
      +" muted:"+muted
      +" inline:"+!!(window.AUDIO_INLINE&&Object.keys(window.AUDIO_INLINE).length);
  }, 500);
}
// SFX 兼容层:老键名保留、映射到新音效;新加的直接对应
const SFX={
  cast:()=>playSfx("cast"),
  reel:()=>playSfx("reel"),
  hit:()=>playSfx("hit"),
  kill:(kind)=>{
    if(kind==="l")      playSfx("catchL");
    else if(kind==="m") playSfx("catchM");
    else                playSfx("catchS");
  },
  // 金币吸收每颗触发一次,连环 play 在 iOS 是逐次解码 = 掉帧;节流到 120ms 一声,听感无差
  coin:()=>{
    const now=performance.now();
    if(SFX._coinAt && now-SFX._coinAt<120) return;
    SFX._coinAt=now;
    playSfx("coinCollect");
  },
  coinDrop:()=>playSfx("coinDrop"),
  coinLack:()=>playSfx("coinLack"),
  upgrade:()=>playSfx("upgrade"),
  alert:()=>playSfx("alert"),
  menuOpen:()=>playSfx("menuOpen"),
  click:()=>playSfx("click"),
  playerHurt:()=>playSfx("playerHurt"),
  // 兼容旧调用:settle 走大鱼捕获,boss 走玩家受伤警报
  settle:()=>playSfx("catchL"),
  boss:()=>playSfx("playerHurt"),
};

/* ---------- 状态 ---------- */
/* phase: intro → tut_aim →(玩家按下)→ fishing → retract
        → (settle DOM) → boss(由 depth 触发) → bossRetract → forced(DOM) → cta(DOM) */
let phase="intro";
let T=0, introT=0;
let coins=BALANCE.startingCoins, totalEarned=0, roundValue=0, roundCatch={};
let roundBaseValue=0,roundSettlementBonus=0,roundValueFinalized=false;
// 金币滚动显示值:所有 UI 上的金币数字都画 dispCoins(每帧向真实 coins 滚动),涨/扣钱都有滚动感
let dispCoins=BALANCE.startingCoins;
function updateDispCoins(){
  const now=performance.now();
  const dt=Math.min(0.1,(now-(updateDispCoins._t||now))/1000); updateDispCoins._t=now;
  const diff=coins-dispCoins;
  if(diff===0) return;
  // 比例趋近(约 0.35s 走完 88%)+ 最低滚速 40/s,保证小额差也有滚动、大额差不拖沓
  const step=Math.max(Math.abs(diff)*dt*6, dt*40);
  dispCoins = Math.abs(diff)<=step ? coins : dispCoins+Math.sign(diff)*step;
}
function coinsShown(){ return Math.round(dispCoins); }
let lineLv=0, atkLv=0;
// 猫与鱼基础模块的最小桥接：原有 coins / lineLv / atkLv 仍是运行时单一真相源。
// SaveData 只在捕获、结算、购买等明确节点同步，不参与钓鱼、碰撞或镜头更新。
let progressionSave=window.CatFishGame.SaveSystem.load();
const sessionSafety=window.CatFishGame.SessionSafetySystem;
sessionSafety.registerSaveProvider(()=>progressionSave);
coins=progressionSave.player.coins;
dispCoins=coins;
lineLv=Math.min(LINE_LV.length-1,Math.max(0,progressionSave.player.rodLevel|0));
atkLv=Math.min(3,Math.max(0,progressionSave.player.hookLevel|0));
const economyWallet=window.CatFishGame.EconomySystem.createWallet({
  getBalance:()=>coins,
  setBalance:value=>{coins=value;}
});
window.CatFishGame.PlatformSystem.ready().then(function(ready){
  const platform=window.CatFishGame.PlatformSystem.getState();
  if(!ready||platform.name!=="crazygames")return;
  progressionSave=window.CatFishGame.SaveSystem.load();
  coins=progressionSave.player.coins;dispCoins=coins;
  lineLv=Math.min(LINE_LV.length-1,Math.max(0,progressionSave.player.rodLevel|0));
  atkLv=Math.min(3,Math.max(0,progressionSave.player.hookLevel|0));
  lineMax=LINE_LV[lineLv];lineLeft=Math.min(lineLeft,lineMax);
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.GAME_STARTED,{coins:coins,rodLevel:lineLv,hookLevel:atkLv,cat:progressionSave.cat,save:progressionSave,source:"platform_storage"});
});
function syncProgression(){
  progressionSave.player.rodLevel=lineLv;
  progressionSave.player.hookLevel=atkLv;
  economyWallet.writeToSave(progressionSave);
  window.CatFishGame.SaveSystem.save(progressionSave);
  return window.CatFishGame.SaveSystem.getStatus().ok;
}
let lineLeft=LINE_LV[0], lineMax=LINE_LV[0], lineDrain=false, lineFeedbackStage=0;
function updateLineFeedback(){
  if(!lineMax||!lineDrain)return;
  const feel=window.CatFishGame.FishingFeelConfig;
  const state=feel?feel.lineState(lineLeft/lineMax):(lineLeft/lineMax<=.12?"critical":lineLeft/lineMax<=.3?"warning":"safe");
  const stage=state==="critical"?2:state==="warning"?1:0;
  if(stage>lineFeedbackStage){feelPulse(state);addImpact(state==="critical"?"255,76,76":"255,198,72",state==="critical"?.16:.10);}
  lineFeedbackStage=Math.max(lineFeedbackStage,stage);
}
let roundNum=0, bossRound=false, bossEverSeen=false, bossDone=false;
let forcedStep=0;
let goalSeen=false, tutUpgradeDone=false, firstReelDone=false;
let shake=0, impactFlash=0, impactFlashColor="255,255,255", paused=window.CatFishGame.PlatformSystem.getState().paused===true, controlOn=false;
let controlBeforePause=false;
const settings=()=>window.CatFishGame.SettingsSystem&&window.CatFishGame.SettingsSystem.load()||{};
const reducedMotion=()=>settings().reducedMotion===true;
function addShake(amount){if(!reducedMotion())shake=Math.max(shake,amount);}
function addImpact(color,duration){impactFlashColor=color||"255,255,255";impactFlash=Math.max(impactFlash,reducedMotion()?Math.min(.08,duration||.12):(duration||.12));}
function feelPulse(kind){const feedback=window.CatFishGame.UIFeedbackSystem;if(feedback&&feedback.pulse)feedback.pulse(kind);}
window.CatFishGame.GameEvents.on(window.CatFishGame.GameEvents.EVENTS.APP_PAUSED,function(){
  if(!paused)controlBeforePause=controlOn;
  paused=true;controlOn=false;releaseJoy();resetHookBoost();syncProgression();suspendAudioForLifecycle();
});
window.CatFishGame.GameEvents.on(window.CatFishGame.GameEvents.EVENTS.APP_RESUMED,function(){
  if(paused)controlOn=controlBeforePause;
  paused=false;resumeAudioForLifecycle();
});
let camX=0, camY=0;
let curZoom=ZOOM_BOAT, tarZoom=ZOOM_BOAT;  // 动态镜头缩放,启动时近船
// 左侧短码头的首帧安全锚点；实际值随后由 drawHomePierSurface 的人物帧挂点持续更新。
let rodTipX=278, rodTipY=WATER_Y-92; // 鱼竿尖(每帧动态更新,鱼竿和鱼线共用)
let rodHandX=263, rodHandY=WATER_Y-72; // 渔夫持竿的手
let catDrawAnchor=null; // 船体坐标由 drawBoat 每帧更新，CatSystem 只读取该锚点绘制。
let lineHL=false, ctaDelay=0;

const hook={x:WORLD_W/2,y:WATER_Y-40,vx:0,vy:0,state:"idle",stun:0,trail:[],lineTrail:[]};
function isMainHomeIdle(){
  const bridge=window.CatFishGame&&window.CatFishGame.HomeFishingBridgeSystem;
  return !!(bridge&&bridge.getState&&!bridge.getState().isFishing);
}
const hookedFish=[];      // 本杆收获队列；捕获后沿鱼线轨迹排队跟随
let fishes=[], particles=[], pops=[], bubbles=[], dust=[];
let bossFish=null, guideFish=null, bossCaught=false;
// 海王擦边:动态概率(50→75→100),出现后下一关禁,越出现越近
let firstCastDone=false;      // 整局是否已经下过第一钩
let bossGrazeRolled=false;    // 本关是否命中擦边(startRound 时掷骰)
let bossGrazeDone=false;      // 本关是否已生成过擦边
let bossGrazeCooldownJust=false; // 本关是因"上关刚出现"被跳过(不计入 miss streak)
let bossGrazeCooldown=0;      // >0 时下关强制不出现(消耗后归零)
let bossGrazeMissStreak=0;    // 连续"应出未出"的关数(只在正常掷骰时累积)
let bossGrazeCount=0;         // 累计出现次数(用于距离逐步缩近)
let grazeFish=null;           // {x,y,vx,ph} 独立于 bossFish,不参与碰撞
let tutSteerDone=false;   // 首轮:玩家首次碰到鱼后,不再显示「按住拖动」操控引导
let tutDemoDismissed=false; // 首轮:玩家点/按屏幕后,解除弧线演示暂停

/* ---------- Canvas UI 状态(单一真相源,取代 DOM 弹窗的 classList.hidden) ---------- */
// curPanel: null=无弹窗 | 'goal' | 'settle' | 'upgrade' | 'cta';panelT=开关动画进度(0→1 弹出,关闭瞬时)
let curPanel=null, panelT=0;
const panelOpen=()=>curPanel!==null;
function setPanel(name){ if(curPanel===name)return; curPanel=name; panelT=0; if(name) try{SFX.menuOpen();}catch(e){} }
window.__setCurPanel=setPanel;   // 供调试编辑器换页时显示对应弹窗
// 屏幕坐标 → 虚拟 540×960(UI 层,无镜头缩放/平移;HUD/按钮/弹窗都画在这个空间)
function uiPos(e){ const r=cvs.getBoundingClientRect(), p=e.touches?e.touches[0]:e;
  return { x:(p.clientX-r.left)/r.width*VW, y:(p.clientY-r.top)/r.height*VH }; }

/* ---------- 收线结算动画(取代弹窗) ---------- */
const SETTLE_GRID={x0:40, y0:178, cellW:92, cellH:82, cols:5, maxRows:4};
const ROUND_BASKET_UI={x:398,y:62,w:128,h:154};
const settleAnim={active:false,fishes:[],groups:[],coins:[],stage:"idle",time:0,revealIndex:0,wasBoss:false,credited:false};

/* ---------- 输入:完全跟手 ---------- */
// 虚拟摇杆(浮动):钓鱼时按下屏幕即在按点出现,拖动控制鱼钩转向。坐标 = 虚拟屏幕 540×960。
const JOY_R=FEEL.joystickRadius||78, JOY_DEAD=FEEL.joystickDeadZone||7;
let JOY_SHOW=true;   // 按住时显示轻量浮动摇杆，让输入方向和幅度可见
const joy={active:false,pointerId:null,bx:0,by:0,kx:0,ky:0,dx:0,dy:0,strength:0};
// 世界坐标"指哪打哪"控制:pointer.x/y = 玩家手指按下位置的世界坐标
const pointer={active:false, x:0, y:0};
// v0.15: first short tap arms the next nearby press; holding alone never boosts.
const hookBoost={held:false,multiplier:1,tap:null,press:null};
// Presentation-only: world-space bubbles and cached alpha-silhouette outline.
const boostFx={bubbles:[],carry:0,x:null,y:null,outlines:new WeakMap()};
function updateBoostFx(dt){
  for(let i=boostFx.bubbles.length-1;i>=0;i--){
    const p=boostFx.bubbles[i];p.age+=dt;p.x+=p.vx*dt;p.y-=p.rise*dt;
    if(p.age>=p.life)boostFx.bubbles.splice(i,1);
  }
  const moving=boostFx.x!==null&&Math.hypot(hook.x-boostFx.x,hook.y-boostFx.y)>.01;
  const emitting=hook.state==="swim"&&hookBoost.held&&hookBoost.multiplier>1.03&&moving;
  if(emitting){
    const reduced=window.CatFishGame.SettingsSystem.load().reducedMotion;
    boostFx.carry+=dt*(reduced?15:30)*Math.min(1,(hookBoost.multiplier-1)/.6);
    const count=Math.floor(boostFx.carry);boostFx.carry-=count;
    const speed=Math.hypot(hook.vx,hook.vy)||1,dx=hook.vx/speed,dy=hook.vy/speed;
    const jump=Math.hypot(hook.x-boostFx.x,hook.y-boostFx.y)>80;
    for(let i=0;i<count;i++){
      const f=(i+1)/Math.max(1,count),side=(Math.random()+Math.random()-1)*10;
      const x=jump?hook.x:boostFx.x+(hook.x-boostFx.x)*f,y=jump?hook.y:boostFx.y+(hook.y-boostFx.y)*f;
      boostFx.bubbles.push({x:x-dx*17-dy*side,y:y-dy*17+dx*side,r:1.8+Math.random()*3,age:0,life:.4+Math.random()*.4,vx:(Math.random()-.5)*9,rise:8+Math.random()*12});
    }
    if(boostFx.bubbles.length>40)boostFx.bubbles.splice(0,boostFx.bubbles.length-40);
  }else boostFx.carry=0;
  boostFx.x=hook.x;boostFx.y=hook.y;
}
function drawBoostBubbles(){
  ctx.save();ctx.lineWidth=1;
  for(const p of boostFx.bubbles){
    const left=1-p.age/p.life,r=p.r*left;if(r<.2)continue;
    ctx.globalAlpha=left*.78;ctx.strokeStyle="#b9f4ff";ctx.fillStyle="rgba(148,226,245,.12)";
    ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle="#efffff";ctx.beginPath();ctx.arc(p.x-r*.12,p.y-r*.12,r*.65,Math.PI*1.1,Math.PI*1.65);ctx.stroke();
  }
  ctx.restore();
}
function drawBoostOutline(im){
  if(hook.state!=="swim"||hookBoost.multiplier<=1.03)return;
  let outline=boostFx.outlines.get(im);
  if(!outline){
    const tint=document.createElement("canvas");tint.width=tint.height=64;const t=tint.getContext("2d");
    t.drawImage(im,0,0,64,64);t.globalCompositeOperation="source-in";t.fillStyle="#c1f5ff";t.fillRect(0,0,64,64);
    outline=document.createElement("canvas");outline.width=outline.height=72;const c=outline.getContext("2d");
    for(let i=0;i<12;i++){const a=i*Math.PI/6;c.drawImage(tint,4+Math.cos(a)*3,4+Math.sin(a)*3);}
    c.globalCompositeOperation="destination-out";c.drawImage(tint,4,4);
    boostFx.outlines.set(im,outline);
  }
  ctx.save();ctx.globalAlpha=Math.min(1,(hookBoost.multiplier-1)/.6)*.9;
  ctx.drawImage(outline,-18,-18,36,36);ctx.restore();
}
const boostGuide={wait:0,age:0,active:false,slow:false,scale:1,shown:false,success:0};
function resetBoostGuide(){Object.assign(boostGuide,{wait:0,age:0,active:false,slow:false,scale:1,shown:false,success:0});}
function learnBoost(){
  const e=progressionSave.exploration;
  window.CatFishGame.AnalyticsSystem.boost(!e.boostLearned,Math.max(0,(hook.y-WATER_Y)/10));
  if(!e.boostLearned){e.boostLearned=true;syncProgression();boostGuide.success=1.8;}
  boostGuide.active=false;
}
function tickBoostGuide(dt,blocked){
  if(blocked||hook.state!=="swim"){boostGuide.active=false;boostGuide.scale=1;boostGuide.success=0;return 1;}
  const e=progressionSave.exploration;
  boostGuide.wait+=dt;boostGuide.success=Math.max(0,boostGuide.success-dt);
  if(!e.boostLearned&&!boostGuide.shown&&(e.boostGuideShows||0)<3&&boostGuide.wait>=2.5){
    boostGuide.active=true;boostGuide.shown=true;boostGuide.age=0;
    window.CatFishGame.AnalyticsSystem.tutorial('double_tap_boost','show');
    boostGuide.slow=!(e.boostGuideShows||0);e.boostGuideShows=(e.boostGuideShows||0)+1;syncProgression();
    tutDemoDismissed=true;window.__TUT_HOOK_PAUSE=false;
  }
  if(boostGuide.active){boostGuide.age+=dt;if(boostGuide.age>=4)boostGuide.active=false;}
  const target=boostGuide.active&&boostGuide.slow?.35:1;
  boostGuide.scale+=Math.sign(target-boostGuide.scale)*Math.min(Math.abs(target-boostGuide.scale),.65*dt/(target<1?.3:.25));
  return boostGuide.scale;
}
function drawBoostGuide(){
  if(paused||panelOpen()||editing()||hook.state!=="swim"||(!boostGuide.active&&!boostGuide.success))return;
  const hx=(hook.x-camX)*curZoom,hy=(hook.y-camY)*curZoom;
  const x=clamp(hx+65,130,VW-130),y=clamp(hy+48,220,VH-230);
  ctx.save();
  ctx.globalAlpha=boostGuide.success?Math.min(1,boostGuide.success*3):Math.min(1,boostGuide.age*5,(4-boostGuide.age)*4);
  ctx.fillStyle="rgba(7,43,67,.78)";ctx.beginPath();ctx.roundRect(x-126,y+80,252,57,14);ctx.fill();
  ctx.textAlign="center";ctx.fillStyle="#fff6cd";ctx.font="bold 19px sans-serif";
  ctx.fillText(boostGuide.success?"加速成功":"点一下，再按住加速",x,y+104);
  ctx.font="13px sans-serif";ctx.fillStyle="#c9f2f2";ctx.fillText(boostGuide.success?"松手恢复原速":"水下空白处操作 · 按住时可拖动转向",x,y+125);
  if(boostGuide.active){
    const t=boostGuide.age%1.8,second=t>=.42,hold=second&&t<1.25,elapsed=second?t-.42:t;
    ctx.strokeStyle=hold?"#fff4b0":"#b8f4ff";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(x,y,hold?21:14+Math.min(elapsed,.4)*55,0,Math.PI*2);ctx.stroke();
    if(hold){ctx.fillStyle="rgba(201,250,242,.18)";ctx.beginPath();ctx.arc(x,y,21,0,Math.PI*2);ctx.fill();}
    drawGuideFinger(x,y+(hold?0:-8),45,ctx.globalAlpha);
    ctx.font="bold 13px sans-serif";ctx.fillStyle="#fff9d9";ctx.fillText(hold?"按住":t<.25?"轻点":"",x+48,y+5);
  }
  ctx.restore();
}
function resetHookBoost(){hookBoost.held=false;hookBoost.multiplier=1;hookBoost.tap=null;hookBoost.press=null;}
function boostPress(e,p){
  const now=performance.now(),tap=hookBoost.tap;
  hookBoost.held=!!(hook.state==="swim"&&tap&&now-tap.at<=300&&Math.hypot(p.x-tap.x,p.y-tap.y)<=40&&tap.type===e.pointerType);
  if(hookBoost.held)learnBoost();
  hookBoost.press={at:now,x:p.x,y:p.y,moved:0,type:e.pointerType,boost:hookBoost.held};
  hookBoost.tap=null;
}
function boostRelease(e){
  const p=hookBoost.press;
  if(p&&e){const up=uiPos(e);p.moved=Math.max(p.moved,Math.hypot(up.x-p.x,up.y-p.y));}
  if(p&&e&&e.type==="pointerup"&&!p.boost&&hook.state==="swim"&&performance.now()-p.at<=180&&p.moved<=12)
    hookBoost.tap={at:p.at,x:p.x,y:p.y,type:p.type};
  else hookBoost.tap=null;
  hookBoost.held=false;hookBoost.press=null;
}
addEventListener("blur",()=>{releaseJoy();resetHookBoost();});
document.addEventListener("pointerdown",e=>{if(e.target!==cvs)hookBoost.tap=null;},true);
// 开钓:由圆形「开钓」按钮触发(原"按住屏幕")。钩下沉、鱼线计数、镜头推远、按钮切换。
function startCast(){
  if(paused||!sessionSafety.canInteract()||editing())return false;
  if(!controlOn||hook.state!=="idle")return false;
  if(phase!=="tut_aim"&&phase!=="ready")return false;
  audio();
  firstCastDone=true;  // 整局第一次下钩后,后续关卡才可能出现海王擦边
  phase="fishing";
  window.CatFishGame.CoastSystem.cast(T);
  tutDemoDismissed=true;
  hook.state="cast";
  hook.x=castX(); // 钩从鱼竿尖正下方下水(鱼线垂直无拐弯)
  hook.y=WATER_Y-30;
  hook.lineTrail=[];
  lineDrain=true;
  tarZoom=ZOOM_FISH;
  SFX.cast();
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.FISHING_STARTED,{save:progressionSave,round:roundNum});
  return true;
}
// 画布按下:先做 Canvas UI 命中(按钮/弹窗),否则=钓鱼操控转向
// 屏幕坐标 → 世界坐标(考虑镜头缩放/平移)
function screenToWorld(sx,sy){
  return {x: sx/curZoom + camX, y: sy/curZoom + camY};
}
// 操作:浮动式虚拟摇杆。按住时显示低透明度方向与力度反馈。
// 按下 = 摇杆基点定在按下位置;拖动 = 相对基点算方向(joy.dx/dy 单位向量);松手 = 摇杆归零。
// 松手后 hook 保留当前速度方向继续匀速直行(不停),直到下次按下再改变方向。
cvs.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  if(editing())return;
  if(paused||!sessionSafety.canInteract()){e.preventDefault();return;}
  audio();
  lastTouchAt=performance.now();
  window._infLastTapAt=performance.now();
  if(curPanel==="upgrade"&&typeof bumpUpgradeIdle==="function") bumpUpgradeIdle();
  const up=uiPos(e), act=uiHitTest(up.x,up.y);
  if(act){ hookBoost.tap=null;e.preventDefault(); if(act!=="panel:swallow")uiClick(act); return; }
  if(!controlOn)return;
  // 弧线新手引导:手指走完至少半圈(700ms)才允许点击解除
  if(!tutDemoDismissed){
    const startAt=window.__arcGuideStartAt||0;
    if(startAt>0 && performance.now()-startAt>=700) tutDemoDismissed=true;
  }
  if(phase==="fishing"||phase==="boss"){
    if(joy.active&&joy.pointerId!==e.pointerId)return;
    e.preventDefault();
    joy.active=true;joy.pointerId=e.pointerId;joy.bx=up.x;joy.by=up.y;joy.kx=up.x;joy.ky=up.y;joy.dx=0;joy.dy=0;joy.strength=0;
    boostPress(e,up);
    try{cvs.setPointerCapture(e.pointerId);}catch(error){}
  }
});
addEventListener("pointermove",e=>{
  if(!joy.active||joy.pointerId!==e.pointerId)return;
  e.preventDefault();
  const up=uiPos(e);
  if(hookBoost.press)hookBoost.press.moved=Math.max(hookBoost.press.moved,Math.hypot(up.x-hookBoost.press.x,up.y-hookBoost.press.y));
  joy.kx=up.x; joy.ky=up.y;
  let ddx=joy.kx-joy.bx, ddy=joy.ky-joy.by; const d=Math.hypot(ddx,ddy);
  // 长距离拖动时基点随手指平移，避免拇指滑出屏幕后失去可控行程。
  if(d>JOY_R*(FEEL.joystickRecentreDistance||1.55)){
    joy.bx=up.x-ddx/d*JOY_R;joy.by=up.y-ddy/d*JOY_R;ddx=up.x-joy.bx;ddy=up.y-joy.by;
  }
  const dd=Math.hypot(ddx,ddy);
  if(dd>JOY_R){ddx=ddx/dd*JOY_R;ddy=ddy/dd*JOY_R;}
  joy.kx=joy.bx+ddx;joy.ky=joy.by+ddy;
  const feel=window.CatFishGame.FishingFeelConfig;
  const steer=feel?feel.steering(ddx,ddy):{x:ddx/(dd||1),y:ddy/(dd||1),strength:dd>JOY_DEAD?1:0};
  joy.dx=steer.x;joy.dy=steer.y;joy.strength=steer.strength;
});
function releaseJoy(e){if(!joy.active||e&&joy.pointerId!==e.pointerId)return;boostRelease(e);try{if(e)cvs.releasePointerCapture(e.pointerId);}catch(error){}joy.active=false;joy.pointerId=null;joy.dx=0;joy.dy=0;joy.strength=0;}
addEventListener("pointerup",releaseJoy);
addEventListener("pointercancel",releaseJoy);
// Unexpected capture loss cancels; normal pointerup has already cleared joy.
cvs.addEventListener("lostpointercapture",e=>{if(joy.active&&joy.pointerId===e.pointerId){releaseJoy();resetHookBoost();}});
/* ---------- 实体工厂 ---------- */
function makeFish(kind,band,edge){
  const t=FISH_TYPES[kind];
  const side=Math.random()<.5?-1:1;
  const f={
    type:t,band,hp:t.hp,r:t.r,
    x:edge?(side<0?Math.max(t.r+4,camX-rand(80,180)):Math.min(WORLD_W-t.r-4,camX+VW/curZoom+rand(80,180))):rand(50,WORLD_W-50),
    y:rand(band.min+20,band.max-20),
    vx:rand(t.spd[0],t.spd[1])*(edge?-side:(Math.random()<.5?-1:1)),
    vy:0, wob:Math.random()*7, hitCd:0, flash:0, hpShow:0,
    aiState:"patrol", fleeT:0, slowT:0,
    hooked:false, dirX:1, dirY:0
  };
  if(!edge) pushOutOfRock(f); // 屏内随机出生点不要落在礁石里
  f.y=clamp(f.y,band.min+f.r,band.max-f.r);
  f.catalogFish=window.CatFishGame.FishCatalogSystem.resolveCatch(kind,"tide_dock",(f.y-WATER_Y)/10);
  return f;
}
function pop(x,y,txt,color,big){pops.push({x,y,txt,color:color||"#ffd966",t:0,big});}
function burst(x,y,c,n){const count=reducedMotion()?Math.min(3,n||8):(n||8);for(let i=0;i<count;i++){const a=rand(0,6.28),s=rand(40,140);
  particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0,life:rand(.3,.6),c});}}

/* ---------- 鱼群维持(屏内 4-5 条) ---------- */
let spawnTimer=0, commonFishTimer=0;
// v0.33: additive common small fish only; never change the original rarity pool.
function makeCommonExtra(edge){
  const fish=makeFish("s",BANDS[0],edge);
  const choices=window.CatFishGame.FishCatalogSystem.list().filter(f=>
    f.legacyTypeKey==="s"&&f.rarity==="common"&&
    (fish.y-WATER_Y)/10>=f.depthMin&&(f.depthMax==null||(fish.y-WATER_Y)/10<f.depthMax));
  if(!choices.length)return null;
  fish.catalogFish=choices[Math.floor(Math.random()*choices.length)];
  fish.commonExtra=true;
  return fish;
}
function keepCommonExtras(dt,viewW){
  commonFishTimer=Math.max(0,commonFishTimer-dt);
  if(hook.y<BANDS[0].min||hook.y>=BANDS[0].max)return;
  const live=fishes.filter(f=>f.commonExtra&&!f.hooked);
  // One extra nearby, at most two swimming extras including offscreen arrivals.
  if(commonFishTimer>0||live.length>=2||live.some(f=>
    Math.abs(f.y-hook.y)<VH*.6&&Math.abs(f.x-hook.x)<viewW*.9))return;
  commonFishTimer=2;
  const fish=makeCommonExtra(true);
  if(fish)fishes.push(fish);
}
function keepPopulation(dt){
  // 在玩家附近的水层中保持 4-5 条非挂载鱼
  const cy=hook.y;
  const viewW=VW/Math.max(.01,curZoom);
  fishes=fishes.filter(f=>f.hooked||f.guide||(
    Math.abs(f.x-hook.x)<viewW*2.5&&Math.abs(f.y-cy)<VH*2.2
  ));
  keepCommonExtras(dt,viewW);
  let near=0;
  for(const f of fishes)if(!f.hooked&&!f.commonExtra&&Math.abs(f.y-cy)<VH*.6&&Math.abs(f.x-hook.x)<viewW*.9)near++;
  const keepMax=5;
  if(near>=keepMax)return;
  spawnTimer-=dt;
  if(spawnTimer>0)return;
  spawnTimer=rand(.4,.9);
  // 选择鱼钩附近的水层
  let band=BANDS[0];
  for(const b of BANDS)if(cy>=b.min&&cy<b.max){band=b;break;}
  const kinds=mapKindsForBand(band.kinds);
  if(!kinds.length)return;
  const kind=kinds[Math.floor(Math.random()*kinds.length)];
  fishes.push(makeFish(kind,band,true));
}
function initPopulation(){
  fishes=[];
  spawnTimer=0;commonFishTimer=2;
  for(let i=0;i<BANDS.length;i++){
    const b=BANDS[i];
    const n=b.count;
    for(let j=0;j<n;j++){
      const kinds=mapKindsForBand(b.kinds);
      if(!kinds.length)continue;
      const kind=kinds[j%kinds.length];
      const fish=makeFish(kind,b);
      fish.x=clamp(hook.x+rand(-420,420),fish.r+4,WORLD_W-fish.r-4);
      fishes.push(fish);
    }
  }
  const extra=makeCommonExtra(false);
  if(extra){
    extra.x=clamp(hook.x+rand(-240,240),extra.r+4,WORLD_W-extra.r-4);
    extra.y=rand(BANDS[0].min+80,Math.min(BANDS[0].max-80,BANDS[0].min+500));
    pushOutOfRock(extra);
    extra.y=clamp(extra.y,BANDS[0].min+extra.r,BANDS[0].max-extra.r);
    fishes.push(extra);
  }
}

/* ---------- 回合控制 ---------- */
function startRound(){
  boostFx.bubbles.length=0;boostFx.carry=0;boostFx.x=boostFx.y=null;
  resetBoostGuide();
  resetHookBoost();
  window.CatFishGame.DepthSystem.reset();
  roundNum++;
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.ROUND_STARTED,{round:roundNum});
  roundValue=0;roundBaseValue=0;roundSettlementBonus=0;roundValueFinalized=false;roundCatch={};settleAnim.credited=false;
  lineMax=LINE_LV[lineLv]*(TURBO?.3:1);lineLeft=lineMax;
  lineDrain=false;lineFeedbackStage=0; // 玩家按下才开始计数；告警每轮只触发一次
  hook.x=castX();hook.y=WATER_Y-30;hook.state="idle";hook.stun=0;hook.vx=0;hook.vy=0;
  hook.trail=[]; hook.lineTrail=[];
  hookedFish.length=0;
  // v0.3 保持旧自动海王回合关闭，避免移除追逐模块后意外恢复旧关卡。
  bossRound=false;
  if(bossRound)bossFish=null; // 一入水即在 updateHook 里生成(无深度门槛)
  // 海王擦边:动态概率
  //   - 出现后下一关强制跳过(cooldown)
  //   - 连续 2 关未出 → 下关 75%
  //   - 连续 3 关未出 → 下关 100%
  bossGrazeDone=false;
  grazeFish=null;
  bossGrazeCooldownJust=false;
  const rollGood=(firstCastDone && !bossRound);
  if(!rollGood){
    bossGrazeRolled=false;
  } else if(bossGrazeCooldown>0){
    bossGrazeRolled=false;
    bossGrazeCooldown=0;
    bossGrazeCooldownJust=true;  // 本关是被冷却跳过的,不计入 miss streak
  } else {
    let p=0.5;
    if(bossGrazeMissStreak>=3) p=1.0;
    else if(bossGrazeMissStreak>=2) p=0.75;
    // 第二次下钩(roundNum=2,教学关之后的第一关)必出擦边海王
    if(roundNum===2) p=1.0;
    bossGrazeRolled=(Math.random()<p);
  }
  console.log("[GRAZE] round=",roundNum," firstCast=",firstCastDone," bossRound=",bossRound,
              " missStreak=",bossGrazeMissStreak," count=",bossGrazeCount,
              " cooldownJust=",bossGrazeCooldownJust," rolled=",bossGrazeRolled);
  // 重新铺鱼群
  if(roundNum>1)initPopulation();
  controlOn=true;
  phase="ready";
  tarZoom=ZOOM_BOAT;              // 镜头近船
}
function endRound(reason='other'){
  boostGuide.active=false;boostGuide.scale=1;boostGuide.success=0;
  resetHookBoost();
  window.CatFishGame.DepthSystem.flush();
  // 玩家手动或鱼线归零都走这里 → 进入收线
  if(hook.state==="retract"||hook.state==="idle")return;
  window.CatFishGame.AnalyticsSystem.reel(reason);
  // 必须在清空 lineTrail 前记录真实线长；同时参考已消耗线长，防止曲线平滑后低估。
  const linePath=fishingLinePath();
  let visibleLineLength=0;
  for(let i=1;i<linePath.length;i++)visibleLineLength+=Math.hypot(linePath[i].x-linePath[i-1].x,linePath[i].y-linePath[i-1].y);
  const spentLineLength=Math.max(0,lineMax-lineLeft);
  hook.retractLineLength=Math.max(LINE_SAMPLE,visibleLineLength,spentLineLength);
  hook.retractDur=clamp(hook.retractLineLength/REEL_LINE_SPEED,REEL_MIN_DURATION,REEL_MAX_DURATION);
  hook.retractT=0;
  hook.retractX0=hook.x;hook.retractY0=hook.y;
  hook.state="retract";
  hook.lineTrail=[];     // 清空轨迹,鱼线变直线收回
  hook.fishLaunched=false; // 每轮收线开始前重置弹鱼标志
  hook.fishLaunchStarted=false;hook.fishLaunchCooldown=0;
  // 收杆总进度由实际线长决定；阶段仅用于切换渔夫动画，不再分别按空间距离计时。
  hook.retractPhase = 1;
  releaseJoy();
  SFX.reel();
  feelPulse("reel");
}
function endRetract(){
  // 收线到水面 → 展示本杆全部鱼获，再依次投入鱼篓。
  hook.state="idle";
  lineDrain=false;
  firstReelDone=true;      // 升级按钮在此之后才允许显示
  controlOn=true;          // 允许用户开钓,但实际开钓只在 ready 触发
  const wasBossSeen=bossEverSeen&&bossFish;
  if(wasBossSeen)alEvent("CHALLENGE_FAILED");
  settleAnim.wasBoss=wasBossSeen;
  finalizeRoundValue();
  // 首轮教学奖励已按需求移除:第一次钓到鱼只按实际鱼获入账,不再外加 60
  totalEarned+=roundValue;
  if(totalEarned>=350)alEvent("CHALLENGE_PASS_50");
  // 擦边海王:本关结束时更新状态(用于下关判定)
  if(bossGrazeDone){
    bossGrazeCooldown=1; bossGrazeMissStreak=0; bossGrazeCount++;
  } else if(!bossGrazeCooldownJust){
    bossGrazeMissStreak++;  // 只在真正掷了骰的关卡计入 miss streak
  }
  // 鱼获只保留在本杆临时队列，结算动画中统一换算金币，不再写入背包。
  window.CatFishGame.CoastSystem.happy(T);
  hookedFish.length=0;
  settleAnim.active=false;settleAnim.stage="home-return";settleAnim.time=0;
  phase="settleWait";
}

function finalizeRoundValue(){
  if(roundValueFinalized)return;
  roundBaseValue=Math.max(0,Math.floor(roundValue));
  const bucketLevel=window.CatFishGame.FacilitySystem.getLevel(progressionSave,"fish_bucket");
  const result=BALANCE.settlement(roundBaseValue,bucketLevel);
  roundSettlementBonus=result.bonus;roundValue=result.total;roundValueFinalized=true;
}
function creditRoundSettlement(){
  if(settleAnim.credited)return;
  if(roundValue>0)economyWallet.add(roundValue,"fishing_round_settlement");
  settleAnim.credited=true;syncProgression();
}

function startSettleAnim(){
  const groups=[];
  hookedFish.forEach(f=>{
    const name=f.catchName||f.type.name;
    let group=groups.find(item=>item.catchName===name);
    if(group)group.count++;
    else groups.push({type:f.type,catchName:name,count:1,phase:"hidden",popT:0,scale:0,alpha:1});
  });
  // 鱼获按从左到右的六列网格排列，第 7 种鱼开始自动换行。
  const cols=6,rows=Math.max(1,Math.ceil(groups.length/cols));
  const panelX=70,panelY=82,panelW=400,cellH=68;
  const gridX=84,gridW=372,cellW=gridW/cols,gridTop=148;
  settleAnim.panel={x:panelX,y:panelY,w:panelW,h:126+rows*cellH};
  settleAnim.footerY=settleAnim.panel.y+settleAnim.panel.h+30;
  groups.forEach((group,index)=>{
    const col=index%cols,row=Math.floor(index/cols);
    group.x=gridX+cellW*(col+.5);
    group.y=gridTop+cellH*row+20;
    group.cellW=cellW;group.cellH=cellH;
  });
  settleAnim.fishes=groups;
  settleAnim.groups=groups;
  settleAnim.coins=[];
  settleAnim.stage="reveal";settleAnim.time=0;settleAnim.revealIndex=0;
  settleAnim.credited=false;
  settleAnim.active=true;
  hookedFish.length=0;
}

let claimableHarvest=null;
function onSettleDone(){
  syncProgression();
  const settlement={round:roundNum,value:roundValue,baseValue:roundBaseValue,bonus:roundSettlementBonus,catches:Object.assign({},roundCatch)};
  claimableHarvest=settlement;
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.ROUND_SETTLED,{
    round:settlement.round,
    value:settlement.value,
    baseValue:settlement.baseValue,
    bonus:settlement.bonus,
    catches:settlement.catches,
    save:progressionSave
  });
  if(settleAnim.wasBoss){bossDone=true;forcedStep=0;bossFish=null;settleAnim.wasBoss=false;}
  // 先把钓鱼运行时恢复到未下钩状态，再让主界面层退出 fishing-live。
  // 主界面和钓鱼共用同一画布，因此这里只切换状态，不切换或重载游戏场景。
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.RETURNED_HOME,{
    round:settlement.round,value:settlement.value,baseValue:settlement.baseValue,bonus:settlement.bonus,reason:"settlement",save:progressionSave
  });
  startRound();
  const homeSystem=window.CatFishGame&&window.CatFishGame.HomeSystem;
  if(homeSystem&&typeof homeSystem.showHarvest==="function") homeSystem.showHarvest(settlement);
  else if(homeSystem&&typeof homeSystem.show==="function") homeSystem.show();
  else{
    const bridge=window.CatFishGame&&window.CatFishGame.HomeFishingBridgeSystem;
    if(bridge&&typeof bridge.returnHome==="function") bridge.returnHome();
  }
}

function updateSettleAnim(dt){
  if(settleAnim.stage==="home-return"){
    settleAnim.time+=dt;
    const home=window.CatFishGame.CoastSystem.camera();
    if(settleAnim.time>=1.35&&Math.abs(camY-home.y)<4&&Math.abs(camX-home.x)<4){
      settleAnim.stage="idle";creditRoundSettlement();onSettleDone();
    }
    return;
  }
  if(!settleAnim.active)return;
  settleAnim.time+=dt;
  if(settleAnim.stage==="reveal"){
    const nextAt=0.18+settleAnim.revealIndex*0.34;
    if(settleAnim.revealIndex<settleAnim.groups.length&&settleAnim.time>=nextAt){
      const group=settleAnim.groups[settleAnim.revealIndex++];group.phase="visible";group.popT=0;
      try{SFX.click();}catch(e){}
    }
    settleAnim.groups.forEach(group=>{if(group.phase==="visible")group.popT+=dt;});
    if(settleAnim.revealIndex>=settleAnim.groups.length&&settleAnim.time>=nextAt+0.85){
      settleAnim.stage="burst";settleAnim.time=0;
      settleAnim.groups.forEach((group,groupIndex)=>{
        group.phase="burst";group.burstT=0;
        const amount=Math.max(3,Math.min(7,group.count+3));
        for(let i=0;i<amount;i++){
          // 金币只在鱼图标的下方半圆爆开，随后继续受重力向下掉落。
          const spread=amount<=1?.5:i/(amount-1);
          const angle=(28+spread*124+(groupIndex%2?2:-2))*Math.PI/180;
          const speed=170+Math.random()*150;
          // 每组金币从对应鱼图标的中心爆开。
          const burstX=group.x,burstY=group.y;
          settleAnim.coins.push({x:burstX,y:burstY,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed+35,
            phase:"fall",delay:groupIndex*.035+i*.018,scale:.82+Math.random()*.38,spin:Math.random()*6,angle:0,alpha:1});
        }
      });
      try{SFX.kill("coin");}catch(e){}
    }
  }else if(settleAnim.stage==="burst"){
    settleAnim.groups.forEach(group=>group.burstT+=dt);
    // 金币以结算面板底框为地面；减去图标半径，让金币底边正好落在边框上。
    const panel=settleAnim.panel||{y:82,h:194};
    const coinFloorY=panel.y+panel.h-18;
    settleAnim.coins.forEach(coin=>{
      if(coin.delay>0){coin.delay-=dt;return;}
      coin.x+=coin.vx*dt;coin.y+=coin.vy*dt;coin.vx*=Math.pow(.12,dt);coin.vy+=430*dt;coin.angle+=coin.spin*dt;
      if(coin.y>=coinFloorY){coin.y=coinFloorY;coin.vx=0;coin.vy=0;coin.phase="landed";}
    });
    if(settleAnim.time>=.9){
      settleAnim.stage="collect";settleAnim.time=0;
      settleAnim.coins.forEach((coin,index)=>{coin.phase="collect";coin.collectDelay=index*.025;coin.sx=coin.x;coin.sy=coin.y;coin.t=0;});
      // 飞币开始回收时统一结算，金币数字会与粒子飞向右上角同步滚动。
      creditRoundSettlement();
    }
  }else if(settleAnim.stage==="collect"){
    let done=0;
    settleAnim.coins.forEach(coin=>{
      if(coin.collectDelay>0){coin.collectDelay-=dt;return;}
      coin.t+=dt;const p=Math.min(1,coin.t/.48),ease=p*p*(3-2*p);
      // 精确吸收到结算金币栏的金币图标中心，而不是飞到屏幕右上角边缘。
      const coinTargetX=VW-96,coinTargetY=35;
      coin.x=coin.sx+(coinTargetX-coin.sx)*ease;coin.y=coin.sy+(coinTargetY-coin.sy)*ease-Math.sin(p*Math.PI)*55;
      coin.scale=Math.max(.28,1-p*.55);if(p>=1){coin.phase="done";coin.alpha=0;done++;}
    });
    if(done===settleAnim.coins.length){
      window.__hudCoinPop=performance.now();settleAnim.active=false;settleAnim.stage="idle";onSettleDone();
    }
  }
}

// 按钮显示/位置已由 Canvas(drawCanvasButtons/btnVisible/btnRect)接管,这些旧 DOM 助手保留为空兼容
function updateUpgradeBtn(){}

function updateCastBtn(){}

function drawSettleAnim(){
  if(!settleAnim.active)return;
  ctx.save();
  ctx.fillStyle="rgba(3,20,28,.70)";ctx.fillRect(0,0,VW,VH);
  const panel=settleAnim.panel||{x:70,y:82,w:400,h:194};
  ctx.fillStyle="rgba(16,53,58,.96)";ctx.strokeStyle="#f2c96b";ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(panel.x,panel.y,panel.w,panel.h,22);ctx.fill();ctx.stroke();
  ctx.fillStyle="#fff1b2";ctx.font="900 22px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText(settleAnim.stage==="reveal"?"本次钓获":"收获结算",VW/2,panel.y+26);
  ctx.fillStyle="#bde9df";ctx.font="bold 11px sans-serif";ctx.fillText("本次收益 · +"+roundValue+" 金币",VW/2,panel.y+51);
  ctx.fillStyle="rgba(6,31,39,.9)";ctx.beginPath();ctx.roundRect(VW-116,16,100,38,19);ctx.fill();
  drawCoinIcon(VW-96,35,27);ctx.fillStyle="#ffe294";ctx.font="900 14px sans-serif";ctx.textAlign="left";ctx.fillText(coinsShown(),VW-76,35);
  for(const group of settleAnim.groups){
    if(group.phase==="hidden")continue;
    let scale=1,alpha=1;
    if(group.phase==="visible"){
      const p=Math.min(1,group.popT/.42);
      scale=p<.58?(1.18*(p/.58)):(1.18-(p-.58)/.42*.18);
    }else if(group.phase==="burst"){
      const p=Math.min(1,group.burstT/.30);scale=1+p*.48;alpha=1-p;
    }
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(group.x,group.y);ctx.scale(scale,scale);
    const t=group.type;
    const r=Math.max(12,Math.min(20,(group.cellW||62)*.3,t.r*.82));
    const key="fish_"+t.key,img=IMG[key];
    // 不绘制卡片或边框：鱼名在图标下方，数量在图标右上角。
    if(img&&img.width)ctx.drawImage(img,-r*1.3,-r*.72,r*2.6,r*1.44);
    else{ctx.fillStyle=t.c1||"#77cbd6";ctx.beginPath();ctx.ellipse(0,0,r,r*.54,0,0,Math.PI*2);ctx.fill();}
    const textSize=9;
    ctx.fillStyle="#fff3c2";ctx.font="900 "+textSize+"px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(group.catchName,0,r*.82+10,(group.cellW||62)-4);
    ctx.fillStyle="#ffd36a";ctx.strokeStyle="rgba(0,0,0,.8)";ctx.lineWidth=3;ctx.font="900 10px sans-serif";ctx.textAlign="left";
    const countX=r*.82,countY=-r*.62;
    ctx.strokeText("×"+group.count,countX,countY);ctx.fillText("×"+group.count,countX,countY);
    ctx.restore();
  }
  for(const coin of settleAnim.coins){
    if(coin.delay>0||coin.phase==="done")continue;
    ctx.save();ctx.globalAlpha=coin.alpha;ctx.translate(coin.x,coin.y);ctx.rotate(coin.angle||0);ctx.scale(coin.scale,coin.scale);
    drawCoinIcon(0,0,36);ctx.restore();
  }
  if(settleAnim.stage==="burst"||settleAnim.stage==="collect"){
    ctx.fillStyle="#ffe69a";ctx.font="900 14px sans-serif";ctx.textAlign="center";
    ctx.fillText(settleAnim.stage==="burst"?"鱼获正在兑换金币":"金币结算中……",VW/2,settleAnim.footerY||312);
  }
  ctx.restore();
}

/* ---------- 礁石碰撞:贴边滑行(不反弹) ----------
   撞入实心 → 回退到碰前位置,用掩码采样估计表面外法向,
   沿"法向的垂线(切向)"中与玩家指向同侧的那条继续走 → 钩贴着礁石边缘绕行。
   每帧转向逻辑会重新朝 pointer 拉,再次撞墙再次滑 → 自然形成沿边缘爬行,
   指向离开墙面时则顺势脱离。切向被堵(凹角)时按 15° 一档向外法向偏转找缝。 */
function resolveColliders(prevX,prevY){
  if(!rockSolidAt(hook.x,hook.y)) return;
  // 轻量触碰反馈：提示这里是实体障碍，但不打断方向控制或修改钓鱼数值。
  if(T-(hook._rockFxT||-9)>.22){
    hook._rockFxT=T;burst(hook.x,hook.y,"#bceef2",4);addShake(.055);
  }
  const moveLen=Math.max(1.2, Math.hypot(hook.x-prevX,hook.y-prevY)); // 本帧应走的路程
  // 期望方向 = 摇杆方向(拖动中,joy.dx/dy 屏幕空间);没按住用当前速度方向
  let dx,dy;
  if(joy.active && (joy.dx||joy.dy)){ dx=joy.dx; dy=joy.dy; }
  else { dx=hook.vx; dy=hook.vy; }
  const dl=Math.hypot(dx,dy)||1; dx/=dl; dy/=dl;
  hook.x=prevX; hook.y=prevY;   // 回退到碰前
  // 表面外法向估计:16 个方向、3 档半径采样实心,负和即指向外侧
  let nx=0,ny=0;
  for(let a=0;a<16;a++){
    const ang=a*Math.PI/8, cx=Math.cos(ang), cy=Math.sin(ang);
    for(const r of [5,10,15]){
      if(rockSolidAt(prevX+cx*r, prevY+cy*r)){ nx-=cx; ny-=cy; break; }
    }
  }
  const nl=Math.hypot(nx,ny);
  if(nl<0.001){ // 无梯度(极端):按来向反推
    nx=-dx; ny=-dy;
  } else { nx/=nl; ny/=nl; }
  // 切向 = 法向垂线,取与玩家指向同侧的一条。
  // 绕行承诺:一旦选定绕行方向就坚持,只有指向明显反向(|切向分量|≥0.5)
  // 或已脱离墙面 0.35s 以上才允许换边 —— 否则轮廓上的小凸包/凹口会让方向来回横跳,
  // 钩卡在口袋里出不来(实测:贴边爬到海草疙瘩处往复摆动)
  if(T-(hook._slideT||-9)>0.35) hook._slideSign=null;   // 脱墙足够久,重新选边
  let tx=-ny, ty=nx;
  const side=tx*dx+ty*dy;
  let sign;
  if(hook._slideSign && Math.abs(side)<0.5) sign=hook._slideSign;
  else sign=side>=0?1:-1;
  hook._slideSign=sign; hook._slideT=T;
  tx*=sign; ty*=sign;
  // 沿切向走完本帧路程;被堵则向外法向逐档偏转(15°/档)找可走方向
  for(let i=0;i<=5;i++){
    const th=i*(Math.PI/12);
    const mx=tx*Math.cos(th)+nx*Math.sin(th);
    const my=ty*Math.cos(th)+ny*Math.sin(th);
    const px2=prevX+mx*moveLen, py2=prevY+my*moveLen;
    if(!rockSolidAt(px2,py2)){
      hook.x=px2; hook.y=py2;
      hook.vx=mx*HOOK_SPD; hook.vy=my*HOOK_SPD;
      return;
    }
  }
  // 全堵(深凹角):沿法向小步顶出去,速度朝外,防卡死
  const px3=prevX+nx*3, py3=prevY+ny*3;
  if(!rockSolidAt(px3,py3)){ hook.x=px3; hook.y=py3; }
  hook.vx=nx*HOOK_SPD; hook.vy=ny*HOOK_SPD;
}

/* ---------- 水下漂浮粒子(碎屑/灰尘,营造纵深感) ---------- */
function updateDust(dt){
  const minY=Math.max(WATER_Y+30, camY+30);
  const maxY=Math.min(WORLD_H-50, camY+VH/curZoom+30);
  if(maxY>minY && Math.random()<dt*(reducedMotion()?4:18)){
    dust.push({
      x:rand(0,WORLD_W),
      y:rand(minY,maxY),
      r:rand(0.6,1.8),
      vx:rand(-10,10),
      vy:rand(-4,8),
      life:rand(6,12),
      t:0
    });
  }
  for(let i=dust.length-1;i>=0;i--){
    const d=dust[i];
    d.x+=d.vx*dt;
    d.y+=d.vy*dt;
    d.t+=dt;
    if(d.t>d.life||d.y<WATER_Y+10)dust.splice(i,1);
  }
  if(dust.length>240)dust.splice(0,dust.length-240);
}
function drawDust(){
  for(const d of dust){
    const fade=Math.min(0.55, d.t/1.5)*Math.min(1,(d.life-d.t)/1.5);
    if(fade<0.02)continue;
    ctx.fillStyle="rgba(220,240,255,"+fade+")";
    ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,7);ctx.fill();
  }
}

/* ---------- 持续气泡(水下沉浸感) ---------- */
function updateBubbles(dt){
  // 持续生成:在玩家镜头附近水域生成,避免离屏渲染浪费
  const minY=Math.max(WATER_Y+24, camY+50);
  const maxY=Math.min(WORLD_H-50, camY+VH/curZoom+50);
  if(maxY>minY && Math.random()<dt*(reducedMotion()?3:10)){
    bubbles.push({
      x:rand(20,WORLD_W-20),
      y:rand(minY,maxY),
      r:rand(1.4,3.6),
      vy:-rand(22,55),
      ph:Math.random()*7
    });
  }
  for(let i=bubbles.length-1;i>=0;i--){
    const b=bubbles[i];
    b.y+=b.vy*dt;
    b.x+=Math.sin(T*1.8+b.ph)*0.5;
    if(b.y<WATER_Y+24){bubbles.splice(i,1);}
  }
  // 上限
  if(bubbles.length>120)bubbles.splice(0,bubbles.length-120);
}

/* ---------- 鱼线轨迹采样:每隔 LINE_SAMPLE 像素记一个"圈圈位置"点 ---------- */
// 鱼线接钩顶圈圈,不接钩中心 — 采样也用圈圈位,否则末段会先冲到中心再折回圈圈
// 钩图本身画得斜(圈圈在右上、尖在左下,倾斜约 26°),给一个校正角把它扶正
const HOOK_TILT_CORRECT=-26*Math.PI/180;
const HOOK_RING_DX=11;  // 校正后圈圈相对钩中心的 local X(向右偏 → 钩视觉上向左让 10px)
const HOOK_RING_DY=-16; // 圈圈相对钩中心的 local Y(向上为负)
function hookRingPos(){
  let ang=Math.PI/2;
  if(Math.hypot(hook.vx,hook.vy)>5)ang=Math.atan2(hook.vy,hook.vx);
  const rot=ang-Math.PI/2+HOOK_TILT_CORRECT;
  const dx=HOOK_RING_DX, dy=HOOK_RING_DY;
  return {x:hook.x + Math.cos(rot)*dx - Math.sin(rot)*dy,
          y:hook.y + Math.sin(rot)*dx + Math.cos(rot)*dy};
}
function sampleLineTrail(){
  const lt=hook.lineTrail;
  const p=hookRingPos();
  const last=lt[lt.length-1];
  if(!last||Math.hypot(p.x-last.x,p.y-last.y)>=LINE_SAMPLE){
    lt.push({x:p.x,y:p.y});
  }
}

// 构建屏幕上真正绘制的鱼线路径。已捕获鱼与 drawHook 必须共用这组点，
// 避免鱼按 hook.trail 移动、鱼线按 lineTrail 绘制造成视觉脱线。
function fishingLinePath(){
  const ring=hookRingPos();
  const raw=[{x:rodTipX,y:rodTipY}, ...hook.lineTrail, {x:ring.x,y:ring.y}];
  const pruned=[raw[0]];
  for(let i=1;i<raw.length;i++){
    const p=pruned[pruned.length-1], q=raw[i];
    if(i===raw.length-1 || Math.hypot(q.x-p.x,q.y-p.y)>=8) pruned.push(q);
  }
  if(pruned.length===1)pruned.push({x:ring.x,y:ring.y});
  const softened=[pruned[0]];
  for(let i=1;i<pruned.length-1;i++){
    const a=pruned[i-1], b=pruned[i], c=pruned[i+1];
    const ax=a.x-b.x, ay=a.y-b.y, cx=c.x-b.x, cy=c.y-b.y;
    const la=Math.hypot(ax,ay)||1, lc=Math.hypot(cx,cy)||1;
    const cos=(ax*cx+ay*cy)/(la*lc);
    if(cos>-0.5){
      softened.push({x:b.x+ax/la*Math.min(la*0.5,10),y:b.y+ay/la*Math.min(la*0.5,10)});
      softened.push({x:b.x+cx/lc*Math.min(lc*0.5,10),y:b.y+cy/lc*Math.min(lc*0.5,10)});
    }else softened.push(b);
  }
  softened.push(pruned[pruned.length-1]);
  const chaikin=(arr)=>{
    if(arr.length<3)return arr;
    const out=[arr[0]];
    for(let i=0;i<arr.length-1;i++){
      const a=arr[i],b=arr[i+1];
      out.push({x:a.x*0.75+b.x*0.25,y:a.y*0.75+b.y*0.25});
      out.push({x:a.x*0.25+b.x*0.75,y:a.y*0.25+b.y*0.75});
    }
    out.push(arr[arr.length-1]);
    return out;
  };
  let points=softened;
  for(let i=0;i<3;i++)points=chaikin(points);
  return points;
}

// 从鱼钩圈沿真实鱼线向鱼竿方向回溯指定距离，返回线上的位置与切线。
function pointBackOnFishingLine(points,distance){
  let left=Math.max(0,distance);
  for(let i=points.length-1;i>0;i--){
    const from=points[i],to=points[i-1];
    const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);
    if(left<=len){
      const t=left/(len||1);
      return {x:from.x+dx*t,y:from.y+dy*t,dirX:dx,dirY:dy};
    }
    left-=len;
  }
  const first=points[0],next=points[1]||first;
  return {x:first.x,y:first.y,dirX:first.x-next.x,dirY:first.y-next.y};
}

/* ---------- 更新:鱼钩(匀速+永动) ---------- */
function updateHook(dt){
  if(hook.state==="idle")return;  // 还没开钓:不更新轨迹/不绘制
  if(window.__TUT_HOOK_PAUSE) return; // 新手弧线演示:钩暂停,其他系统正常
  // 拖尾历史
  hook.trail.unshift({x:hook.x,y:hook.y});
  if(hook.trail.length>240)hook.trail.length=240;

  if(hook.stun>0){hook.stun-=dt;return;}

  if(hook.state==="cast"){
    // 等"开始钓鱼"序列帧播完一次后再让钩下落 + 显现
    const animReady=window.CatFishGame.CoastSystem.castReady(T);
    hook.castHidden = !animReady;   // drawHook 读这个决定是否显示
    if(animReady){
      hook.y+=120*dt;
      sampleLineTrail();
      if(hook.y>WATER_Y+90){hook.state="swim";hook.vx=0;hook.vy=HOOK_SPD;hook.castHidden=false;} // 进入 swim 钩立即匀速下沉
    }
  }
  else if(hook.state==="swim"){
    const targetBoost=hookBoost.held&&joy.active?1.6:1;
    const inputDt=dt/boostGuide.scale;
    hookBoost.multiplier+=Math.sign(targetBoost-hookBoost.multiplier)*Math.min(Math.abs(targetBoost-hookBoost.multiplier),.6*inputDt/(targetBoost>1?.3:.2));
    const swimSpeed=HOOK_SPD*hookBoost.multiplier;
    const prevX=hook.x, prevY=hook.y;
    // 浮动摇杆:joy.dx/dy 是屏幕空间单位向量(死区外才非零),按下+拖动才有值;
    // 松手后 joy.dx=dy=0,不再改方向,归一化速度让 hook 沿最后方向继续匀速前进
    if(joy.active && (joy.dx||joy.dy)){
      const tx=joy.dx*swimSpeed, ty=joy.dy*swimSpeed;
      const currentLen=Math.hypot(hook.vx,hook.vy)||1,targetLen=Math.hypot(tx,ty)||1;
      const dot=(hook.vx*tx+hook.vy*ty)/(currentLen*targetLen);
      const k=Math.min(1,(dot<0?HOOK_REVERSE_TURN:HOOK_TURN)*inputDt);
      hook.vx+=(tx-hook.vx)*k;
      hook.vy+=(ty-hook.vy)*k;
    }
    // 永不停:把速度强制归一化为 HOOK_SPD(始终匀速)
    const v=Math.hypot(hook.vx,hook.vy);
    if(v<1){hook.vx=0;hook.vy=swimSpeed;} // 极端情况下保底向下
    else{hook.vx=hook.vx/v*swimSpeed; hook.vy=hook.vy/v*swimSpeed;}
    // 位移
    hook.x+=hook.vx*dt; hook.y+=hook.vy*dt;
    // 边界反弹(沿边法线反射,切向速度保留)
    if(hook.x<22){hook.x=22;hook.vx=Math.abs(hook.vx);}
    if(hook.x>WORLD_W-22){hook.x=WORLD_W-22;hook.vx=-Math.abs(hook.vx);}
    if(hook.y<WATER_Y+30){hook.y=WATER_Y+30;hook.vy=Math.abs(hook.vy);}
    if(hook.y>WORLD_H-40){hook.y=WORLD_H-40;hook.vy=-Math.abs(hook.vy);}
    // 礁石碰撞(传本帧起点,分轴判定)
    resolveColliders(prevX,prevY);
    if(!window.UI_EDIT_MODE&&!window.PANEL_EDIT_MODE)window.CatFishGame.DepthSystem.update(hook.y-WATER_Y,progressionSave,syncProgression);

    // 鱼线轨迹采样(画笔轨迹)
    sampleLineTrail();

    // 鱼线消耗 = 实际位移路径长
    if(lineDrain){
      const moved=Math.hypot(hook.x-prevX, hook.y-prevY);
      lineLeft-=moved;
      updateLineFeedback();
      if(lineLeft<=0){lineLeft=0;endRound('line_empty');}
    }
    // 触发海王:本轮为 boss 轮 → 一入水即刻出现,之后按鱼线剩余量切"巡逻/追钩"两态
    if(bossRound&&!bossFish){
      spawnBoss();
    }
  }
  else if(hook.state==="retract"){
    hook.vx=0; hook.vy=0;
    const SURFACE_Y=WATER_Y-80, REVEAL_Y=WATER_Y+300; // 给钩下竖列留出出水空间
    if(hook.retractPhase===3){
      // 杆已经收完，仍按短间隔逐条甩鱼；全部离屏后再进入结算。
      launchNextFishAboveWater(dt);
      if(allHookedFishOutsideView())endRetract();
      return;
    }
    hook.retractT+=dt;
    const p=Math.min(1,hook.retractT/(hook.retractDur||REEL_MIN_DURATION));
    const eased=1-(1-p)*(1-p);
    hook.x=hook.retractX0+(castX()-hook.retractX0)*eased;
    hook.y=hook.retractY0+(SURFACE_Y-hook.retractY0)*eased;
    if(hook.retractPhase===1&&hook.y<=REVEAL_Y)hook.retractPhase=2;
    // 哪条鱼先完整离开水面，哪条先飞；同一时刻最多释放一条。
    launchNextFishAboveWater(dt);
    if(p>=1){
      hook.x=castX();hook.y=SURFACE_Y;hook.castHidden=true;hook.retractPhase=3;
      if(allHookedFishOutsideView())endRetract();
    }
  }
}

/* ---------- 更新:挂在鱼线上的鱼(和 drawHook 共用真实鱼线路径) ---------- */
function launchNextFishAboveWater(dt){
  const count=hookedFish.length;
  if(!count){hook.fishLaunched=true;return;}
  hook.fishLaunchCooldown=Math.max(0,(hook.fishLaunchCooldown||0)-dt);
  if(hook.fishLaunchCooldown>0)return;
  const ready=[];
  hookedFish.forEach((f,index)=>{
    // drawFish 的鱼身高度约 1.8r；必须鱼身底边越过水面才进入甩出队列。
    if(!f.fanActive&&f.y+f.r*.9<=WATER_Y-2)ready.push({f,index});
  });
  if(!ready.length)return;
  // 已出水最多的鱼优先，保证视觉顺序是“出水一个、飞出一个”。
  ready.sort((a,b)=>a.f.y-b.f.y);
  const item=ready[0],f=item.f,index=item.index;
  // 扇形始终以上方(-90°)为中心：鱼越多展开越宽，最多接近左右水平线但不向下甩。
  // 1 条鱼直向上；2 条约 48°；之后每增加一条扩宽 18°，上限 170°。
  const fanSpan=count<=1?0:Math.min(170,48+(count-2)*18);
  const fanStart=-90-fanSpan/2;
  const t=count<=1?.5:index/(count-1);
  const angle=(fanStart+t*fanSpan)*Math.PI/180;
  const speed=(1000+index%3*90)/Math.max(.75,curZoom);
  f.fanActive=true;f.fanVX=Math.cos(angle)*speed;f.fanVY=Math.sin(angle)*speed;
  f.fanSpin=(index%2?1:-1)*(4.5+index*.35);f.fanAngle=0;
  hook.fishLaunchCooldown=.10;
  hook.fishLaunched=hookedFish.every(x=>x.fanActive);
  if(!hook.fishLaunchStarted){hook.fishLaunchStarted=true;try{SFX.reel();}catch(e){}}
}
function allHookedFishOutsideView(){
  if(!hookedFish.length)return true;
  return hookedFish.every(f=>{
    if(!f.fanActive)return false;
    const sx=(f.x-camX)*curZoom,sy=(f.y-camY)*curZoom;
    // drawFish 的主体约为 2.6r × 1.8r；额外留出发光边缘，确保视觉上完全离屏。
    const halfW=(f.r*1.5+18)*curZoom,halfH=(f.r*1.05+18)*curZoom;
    return sx+halfW<0||sx-halfW>VW||sy+halfH<0||sy-halfH>VH;
  });
}
function updateHookedFish(dt){
  // 参考原地图包：收杆期间不再沿整条鱼线分布，而是从鱼钩下方依次挂成竖列。
  // 前一条鱼飞出后，后面的鱼自动补到钩下第一格，形成“出水一个、甩出一个”。
  if(hook.state==="retract"){
    let slot=0;
    for(const f of hookedFish){
      if(f.fanActive){
        f.x+=f.fanVX*dt;f.y+=f.fanVY*dt;f.fanVY+=190/Math.max(.75,curZoom)*dt;f.fanAngle+=f.fanSpin*dt;
        continue;
      }
      slot++;
      const spacing=34;
      f.x=hook.x;
      f.y=hook.y+spacing*slot;
      f.dirX=0;f.dirY=-1;
    }
    return;
  }
  const path=fishingLinePath();
  // 始终保持固定挂线间距，不再因收杆线变短而把所有鱼压缩到一起。
  const spacing=34;
  for(let i=0;i<hookedFish.length;i++){
    const f=hookedFish[i];
    if(f.fanActive){
      f.x+=f.fanVX*dt;f.y+=f.fanVY*dt;f.fanVY+=190/Math.max(.75,curZoom)*dt;f.fanAngle+=f.fanSpin*dt;
      continue;
    }
    const p=pointBackOnFishingLine(path,spacing*(i+1));
    f.x=p.x;f.y=p.y;f.dirX=p.dirX;f.dirY=p.dirY;
  }
}

/* ---------- 更新:鱼 AI(三阶段) ---------- */
function updateFish(f,dt){
  if(f.hooked)return;
  f.hitCd=Math.max(0,f.hitCd-dt);
  f.flash=Math.max(0,f.flash-dt);
  f.hpShow=Math.max(0,f.hpShow-dt);
  if(f.guide)return;   // 新手引导鱼:固定不动(计时器照常),避免游出画面导致指引跟不上

  const px=f.x, py=f.y;  // 本帧起点(上一帧已确保不在礁石内)
  let dx=0, dy=0;
  if(f.aiState==="flee"){
    // 爆发位移
    f.fleeT-=dt;
    dx=f.vx*3.4*dt; dy=f.vy*3.4*dt;
    if(f.fleeT<=0){f.aiState="slow";f.slowT=1.0;f.vy=0;}
  }else if(f.aiState==="slow"){
    // 速度骤降
    f.slowT-=dt;
    dx=f.vx*0.3*dt;
    dy=Math.sin(T*1.5+f.wob)*8*dt;
    if(f.slowT<=0){f.aiState="patrol";}
  }else{
    // 巡逻
    f.aiState="patrol";
    dx=f.vx*dt;
    dy=Math.sin(T*1.7+f.wob)*14*dt;
    if(Math.random()<.004)f.vx*=-1; // 偶尔变向
  }
  f.x+=dx; f.y+=dy;
  // 礁石避障:分轴判定,撞入则该轴回退(横向额外掉头),让鱼贴着礁石游而不钻入
  if(rockSolidAt(f.x,f.y)){
    const blockH=rockSolidAt(f.x,py);
    const blockV=rockSolidAt(px,f.y);
    if(blockH&&!blockV){ f.x=px; f.vx=-f.vx; }
    else if(blockV&&!blockH){ f.y=py; }
    else { f.x=px; f.y=py; f.vx=-f.vx; }
  }
  // 边界 & 水层
  if(f.x<f.r&&f.vx<0)f.vx=Math.abs(f.vx);
  if(f.x>WORLD_W-f.r&&f.vx>0)f.vx=-Math.abs(f.vx);
  if(f.band){
    if(f.y<f.band.min+f.r)f.y=f.band.min+f.r;
    if(f.y>f.band.max-f.r)f.y=f.band.max-f.r;
  }
  // 兜底:仍嵌在礁石内(出生点/礁石被拖动覆盖)→ 多步朝最近空侧推出
  pushOutOfRock(f);
}

/* 把一个 {x,y} 实体推出礁石实心区(最多几步,优先横向) */
function pushOutOfRock(o){
  for(let s=0;s<6 && rockSolidAt(o.x,o.y);s++){
    const step=12;
    if(!rockSolidAt(o.x-step,o.y)) o.x-=step;
    else if(!rockSolidAt(o.x+step,o.y)) o.x+=step;
    else if(!rockSolidAt(o.x,o.y-step)) o.y-=step;
    else if(!rockSolidAt(o.x,o.y+step)) o.y+=step;
    else { o.x-=step; } // 全被包围:强行向左挪,下一帧再试
  }
}

/* ---------- 鱼钩 vs 鱼:击中 ---------- */
function checkHookHit(){
  if(hook.state!=="swim"||hook.stun>0)return;
  const hookR=10+ATK_LV[atkLv].prongs*3;
  for(const f of fishes){
    if(f.hooked||f.hitCd>0)continue;
    if(dist(f.x,f.y,hook.x,hook.y)<f.r+hookR)hitFish(f);
  }
}
function hitFish(f){
  if(!tutSteerDone)window.CatFishGame.AnalyticsSystem.tutorial('steer','complete');
  tutSteerDone=true;   // 碰到鱼 → 说明已学会操控,收起拖动引导
  const atk=ATK_LV[atkLv];
  f.hp-=atk.dmg;f.hitCd=atk.cd;f.flash=.18;f.hpShow=1.6;
  // 击杀那一下只播捕获音,不再同帧叠 hit 音(iOS 同帧两个 HTMLAudio.play = 两次解码 = 掉帧)
  if(f.hp>0) SFX.hit();
  if(f.hp<=0){
    addShake(FEEL.catchShake||.18);addImpact("255,218,92",.20);feelPulse("catch");
    // 捕获 → 立即离开水下画面，进入本杆收获队列。
    f.hooked=true;
    f.hookedAt=T;
    const catalogFish=f.catalogFish||window.CatFishGame.FishCatalogSystem.resolveCatch(f.type.key,"tide_dock",(f.y-WATER_Y)/10);
    f.catchName=catalogFish.name;
    f.hookedDir=f.vx>=0?1:-1;
    f.fanActive=false;f.fanAngle=0;
    hookedFish.push(f);
    burst(f.x,f.y,"#ffd966",10);SFX.kill(f.type.key);
    pop(f.x,f.y,"收获 "+catalogFish.name+"！","#ffd966");
    const catchValue=Math.max(0,Math.floor(catalogFish.value||f.type.value));
    roundValue+=catchValue;
    roundCatch[catalogFish.name]=(roundCatch[catalogFish.name]||0)+1;
    const fishBookResult=window.CatFishGame.FishBookSystem.recordCatch(progressionSave,catalogFish.id,f.r);
    if(fishBookResult.ok){
      window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.FISH_CAUGHT,{
        save:progressionSave,
        fishId:fishBookResult.fish.id,
        legacyTypeKey:f.type.key,
        size:f.r,
        value:catchValue,
        firstDiscovery:fishBookResult.firstDiscovery
      });
      if(fishBookResult.firstDiscovery){
        window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.FISH_FIRST_DISCOVERED,{
          fishId:fishBookResult.fish.id,
          legacyTypeKey:f.type.key
        });
      }
    }
    // 捕获只写入图鉴；金币在本杆收线结算时统一入账。
    syncProgression();
    updateReelCount();
    // 击杀引导鱼不再暂停,正常入手挂在钩后
  }else{
    addShake(FEEL.hitShake||.10);addImpact("255,255,255",.10);feelPulse("hit");
    // 爆发逃逸
    const dx=f.x-hook.x,dy=f.y-hook.y;
    const d=Math.hypot(dx,dy)||1;
    const sp=f.type.spd[1];
    f.vx=dx/d*sp;f.vy=dy/d*sp;
    f.aiState="flee";f.fleeT=.5;
    pop(f.x,f.y,"-"+atk.dmg,"#ff8d7a");
    burst(f.x,f.y,f.type.c1,6);
  }
}

/* ---------- 海王 ---------- */
function spawnBoss(){
  // 出生位置:x 随机偏左或偏右 300px 两侧出现;y 世界深度按鱼线等级查表
  // lv0=1000, lv1=1200, lv2=1500, lv3=2000
  const SPAWN_Y_BY_LV=[1000,1200,1500,2000];
  const y=SPAWN_Y_BY_LV[Math.min(3,Math.max(0,lineLv))];
  const side=Math.random()<0.5?-1:1;
  const x=clamp(hook.x+side*300, 40, WORLD_W-40);
  // 巡逻初速:横向游走,像普通鱼一样匀速漂,方向随出生侧决定
  bossFish={ x, y, vx:-side*40, vy:0, flash:0, ph:0 };
  // 每次新 boss 出生都重置 CTA 单发闸,允许该 boss 的碰撞触发一次跳转
  window.__ctaFired=false;
  bossCaught=false;
  bossEverSeen=true;SFX.boss();shake=.7;
  // 「SEA KING! HIT IT!」pop 提示已按需求移除
  alEvent("CHALLENGE_PASS_75");
}
/* ---------- 海王擦边:掠过屏幕,不可碰 ---------- */
function spawnBossGraze(){
  // 安全距离(钩边到海王边):第 0 次 8~18 单位,每次出现 ×0.78 缩近,
  // 下限 2.2 单位(22px,对齐动态闪避的最小边距)绝不为 0
  const shrink=Math.pow(0.78, bossGrazeCount);
  const baseUnits=(4+Math.random()*5)*shrink;
  const safetyUnits=Math.max(2.2,baseUnits);
  const safetyPx=safetyUnits*10;
  // 位置优先算够:理想纵向 gap = lineLeft + 海王半高150 + 钩半径16 + safetyPx
  // (触发后鱼钩总行程 ≤ lineLeft,这个距离玩家全力直冲也差 safetyPx 碰不到)。
  // 屏幕放不下理想值时按可见边缘封顶 —— 差额由 updateGrazeFish 的静默投影兜底,
  // 只有玩家真的全程直线追击才会触到兜底,平时海王行为完全自然。
  const bossR=(window.GAME_CFG&&window.GAME_CFG.bossR)||130;
  const ideal = Math.max(0,lineLeft) + 150 + 16 + safetyPx;
  // 屏幕可见范围(fishY=0.4:下方 60%、上方 40%)
  const visibleBelow=(VH*0.6)/curZoom - 40;
  const visibleAbove=(VH*0.4)/curZoom - 40;
  const MAX_Y=WORLD_H-40-bossR, MIN_Y=WATER_Y+120+bossR;
  const gapB=Math.min(ideal, visibleBelow), gapA=Math.min(ideal, visibleAbove);
  let y=null;
  if(hook.y+gapB<=MAX_Y) y=hook.y+gapB;              // 优先下方(可见边缘封顶)
  else if(hook.y-gapA>=MIN_Y) y=hook.y-gapA;         // 不行试上方
  if(y===null) return;   // 世界边界都放不下(极端贴边)→ 不消耗机会,下帧重试
  // 方向随机:左→右 (dir=1) 或右→左 (dir=-1)
  const dir=Math.random()<0.5?1:-1;
  const startX=dir>0?(-160):(WORLD_W+160);
  // 速度:300 px/s 匀速 → 世界宽 900 + 边界余量 = 约 3.7s
  grazeFish={x:startX, y, vx:300*dir, ph:0};
}
function updateGrazeFish(dt){
  if(!grazeFish) return;
  const b=grazeFish;
  b.ph+=dt;
  b.x+=b.vx*dt;
  // 静默兜底(非躲避):出生位置已尽量算够,但 25% 触发时屏幕放不下全额提前量,
  // 玩家全程直线追击的极端情况下用椭圆投影保住"差一点点碰不到";平时该分支不会触发
  {
    const rx=230+16+8, ry=150+16+8;   // 椭圆半轴 = 海王半宽/半高 + 钩半径 + 8px 边距
    const dx=b.x-hook.x, dy=b.y-hook.y;
    const n=Math.hypot(dx/rx, dy/ry);
    if(n<1){
      const nn=Math.max(n,0.001);
      b.x=hook.x+dx/nn;
      b.y=hook.y+dy/nn;
    }
  }
  // 出屏移除
  if(b.vx>0 && b.x>WORLD_W+180) grazeFish=null;
  else if(b.vx<0 && b.x<-180) grazeFish=null;
}
function drawGrazeFish(){
  if(!grazeFish) return;
  const b=grazeFish, dir=b.vx>=0?1:-1;
  ctx.save();
  ctx.translate(b.x,b.y);
  ctx.scale(dir,1);
  if(IMG.seaking){
    // AE 锚点式形变:与主海王同款(40 段密切片 + 1.5px 微重叠,尾自然弯曲)
    const imgL=-230, imgR=230, imgW=460, imgT=-150, imgH=300;
    const pivotFx=0.55, wagSpd=4.2, wagAmp=0.22;
    const wagAngle=Math.sin(T*wagSpd + (b.ph||0))*wagAmp;
    const pivotX=imgL+pivotFx*imgW;
    const tailLen=pivotX-imgL;
    const SLICES=40, sliceW=tailLen/SLICES, OV=1.5;
    const paint=()=>ctx.drawImage(IMG.seaking, imgL, imgT, imgW, imgH);
    ctx.save();
    ctx.beginPath(); ctx.rect(pivotX, imgT-200, imgR-pivotX+400, imgH+400); ctx.clip();
    paint();
    ctx.restore();
    for(let i=0;i<SLICES;i++){
      const xR=pivotX-i*sliceW, xL=xR-sliceW;
      const t01=(pivotX-(xL+xR)/2)/Math.max(1,tailLen);
      const rot=wagAngle*t01*t01;
      ctx.save();
      ctx.translate(pivotX,0); ctx.rotate(rot); ctx.translate(-pivotX,0);
      ctx.beginPath();
      const extL=(i===SLICES-1)?260:OV;
      ctx.rect(xL-extL, imgT-200, sliceW+extL+OV, imgH+400); ctx.clip();
      paint();
      ctx.restore();
    }
  } else {
    // 无图 → 简单椭圆当占位
    ctx.fillStyle="#27406e";
    ctx.beginPath(); ctx.ellipse(0,0,200,120,0,0,7); ctx.fill();
  }
  ctx.restore();
}
function updateBoss(dt){
  if(!bossFish)return;
  const b=bossFish;
  b.ph+=dt; b.flash=Math.max(0,b.flash-dt);
  b.hitCd=Math.max(0,(b.hitCd||0)-dt);
  b.shake2T=Math.max(0,(b.shake2T||0)-dt);
  // 二段震屏:0.25s 后补第二下
  if(b.shake2Pending&&b.shake2T===0){addShake(FEEL.bossShake||.7);b.shake2Pending=false;}
  // 追钩触发:鱼线剩余 ≤60% 才开始追。此前海王一直巡逻(像普通鱼)
  if(!b.chasing){
    if(lineMax>0 && lineLeft/lineMax<=0.60) b.chasing=true;
  }
  // 加速条件:鱼线剩 ≤25% 且仍在追 → 追钩速度 ×1.5,防最后关头追不上
  const baseSpd=(window.GAME_CFG&&window.GAME_CFG.bossSpd)||150;
  const spd = (lineMax>0 && lineLeft/lineMax<=0.25) ? baseSpd*1.5 : baseSpd;
  if(b.chasing){
    // 主动追钩(带纵向摆动)
    const dx=hook.x-b.x, dy=hook.y-b.y, d=Math.hypot(dx,dy)||1;
    b.vx=dx/d*spd; b.vy=dy/d*spd;
    b.x+=b.vx*dt; b.y+=b.vy*dt+Math.sin(b.ph*3)*18*dt;
  }
  // 朝向锁定 + 转向冷却:海王转过一次身后 10 秒内不再翻朝向,即便钩绕到另一边身体也不掉头
  {
    if(b.faceDir===undefined) b.faceDir=(b.vx>=0)?1:-1;
    b.faceCd=Math.max(0,(b.faceCd||0)-dt);
    const wantDir=(hook.x-b.x>=0)?1:-1;
    if(wantDir!==b.faceDir && b.faceCd===0){
      b.faceDir=wantDir;
      b.faceCd=10;    // 下一次翻转必须再等 10 秒
    }
  }
  if(!b.chasing){
    // 巡逻态:像普通鱼一样匀速横向漂移 + 微小纵向摆动;撞世界边就反弹换向
    // vx 初值在 spawnBoss 里设成 ±40,这里持续位移;方向翻转时朝向冷却也接着更新
    b.x+=b.vx*dt;
    b.y+=Math.sin(b.ph*0.9)*8*dt;
    if(b.x<80 && b.vx<0) b.vx=Math.abs(b.vx);
    else if(b.x>WORLD_W-80 && b.vx>0) b.vx=-Math.abs(b.vx);
    b.vy=0;
  }
  b.x=clamp(b.x,40,WORLD_W-40);
  // Y 上限从 WATER_Y+120 放开到 WATER_Y+30(与钩最浅位置一致),海王能追到贴海面的鱼钩
  b.y=clamp(b.y,WATER_Y+30,WORLD_H-120);
  // 撞到鱼钩 → 震屏反馈 + 直接跳转商店(无结算/终卡界面)
  const hookR=10+ATK_LV[atkLv].prongs*3, bossR=(window.GAME_CFG&&window.GAME_CFG.bossR)||130;
  if(b.hitCd===0 && dist(b.x,b.y,hook.x,hook.y)<bossR+hookR){
    addShake(FEEL.bossShake||.7);      // 第一下
    addImpact("200,90,255",.22);feelPulse("boss");
    b.shake2Pending=true; b.shake2T=0.25; // 0.25s 后补第二下
    // 命中不再触发海王闪光(需求:海王撞钩就直接跳,不要视觉高亮)
    try{SFX.boss();}catch(e){}
    b.hitCd=1.0;                       // 冷却 1s,避免重叠状态每帧触发
    if(!b.jumped){
      b.jumped=true;
      // 鱼王碰撞改为正常收线，不再离开当前游戏。
      endRound('sea_king_collision');
    }
  }
}

/* ---------- 主更新 ---------- */
function update(dt){
  T+=dt;
  if(shake>0)shake=Math.max(0,shake-dt*1.6);
  if(impactFlash>0)impactFlash=Math.max(0,impactFlash-dt);
  if(paused)return;
  window.CatFishGame.CatSystem.update(dt,{hookState:hook.state});
  // 刷新、首次进入和收杆回到码头时，空闲鱼钩必须始终跟随左侧渔夫的竿尖。
  // 这样镜头不会继续追踪旧船场景留下的初始坐标，把主角裁出画面。
  if(hook.state==="idle"&&(phase==="intro"||phase==="tut_aim"||phase==="ready")){
    hook.x=rodTipX;
    hook.y=WATER_Y-30;
  }

  /* 镜头阶段化(每帧根据 phase 设 tarZoom,这样 ZOOM_CFG 滑块实时生效) */
  if(phase==="intro"||phase==="tut_aim"||phase==="ready") tarZoom=ZOOM_BOAT;
  else if(phase==="fishing"||phase==="boss") tarZoom=ZOOM_FISH;

  /* intro → 静止待操作(镜头近船,钩不下沉) */
  if(phase==="intro"){
    introT+=dt;
    if(introT>=0.6&&!guideFish){  // 0.6 秒后刷引导鱼+提示(让画面有过门)
      guideFish=makeFish("s",BANDS[0]);
      guideFish.band=null;              // 引导鱼固定不动,不受水层约束
      guideFish.x=castX()+80;           // 略偏离下钩中线(镜头以钩居中,必在可视范围内)
      guideFish.y=WATER_Y+150;          // 刚入水下、稳定在船景镜头可见区
      guideFish.vx=-18;                 // 仅决定朝向(面朝左),不产生位移
      guideFish.guide=true;
      fishes.push(guideFish);
      controlOn=true;phase="tut_aim";
      alEvent("CHALLENGE_STARTED");
    }
    // 不 return:让鱼自由游动,玩家能看到"水下世界已就绪"
  }

  /* 钓鱼/收线/教学 */
  // Small movement steps retain reef and fish hit detection at boosted speed.
  const hookSteps=hook.state==="swim"?Math.max(1,Math.ceil(dt/(1/120))):1;
  for(let step=0;step<hookSteps;step++){updateHook(dt/hookSteps);if(hook.state==="swim")checkHookHit();}
  updateBoostFx(dt);
  updateFisher(dt);
  for(const f of fishes)updateFish(f,dt);
  updateHookedFish(dt);
  checkHookHit();
  if(bossFish)updateBoss(dt);
  // 海王擦边:鱼线剩 20% 起尝试(仅本关掷骰命中)。位置放不下(线还太长)时不消耗机会,
  // 随线继续消耗每帧重试,直到摆得下"数学上碰不到"的位置才真正出场
  if(bossGrazeRolled && !bossGrazeDone && !grazeFish && hook.state==="swim"
     && lineMax>0 && (lineLeft/lineMax)<=0.25){
    spawnBossGraze();
    if(grazeFish){
      bossGrazeDone=true;
      console.log("[GRAZE] 出场!hook.y=",hook.y|0," lineLeft=",lineLeft|0,"/",lineMax|0,
        " pos=(",grazeFish.x|0,",",grazeFish.y|0,") vx=",grazeFish.vx);
    }
  }
  if(grazeFish) updateGrazeFish(dt);
  // 屏内 4-5 条
  if(phase!=="retract"&&phase!=="settleWait")keepPopulation(dt);

  /* 粒子/飘字 */
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];
    p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=160*dt;
    if(p.t>p.life)particles.splice(i,1);}
  for(let i=pops.length-1;i>=0;i--){pops[i].t+=dt;if(pops[i].t>1.2)pops.splice(i,1);}

  /* 持续气泡(水下沉浸感) */
  updateBubbles(dt);
  updateDust(dt);
  /* 收线结算动画 */
  updateSettleAnim(dt);
  /* 升级按钮显隐 + 跟随鱼钩 */
  updateUpgradeBtn();
  /* 开钓按钮显隐 */
  updateCastBtn();

  /* v0.4: one continuous world, centered hook, clamped camera. */
  const coast=window.CatFishGame.CoastSystem,homeCam=coast.camera();
  const follow=hook.state==="swim"||hook.state==="cast"&&coast.castReady(T)||hook.state==="retract";
  // No zoom jump; physical hook speed and collision coordinates are untouched.
  curZoom=tarZoom=1;
  const VWZ=VW,VHZ=VH;
  const nearHome=hook.state==="retract"?Math.max(0,Math.min(1,(hook.y-WATER_Y)/300)):1;
  const tx=clamp(hook.x-VWZ*.5,0,WORLD_W-VWZ),ty=clamp(hook.y-VHZ*.5,homeCam.y,WORLD_H-VHZ);
  const tCamX=follow?homeCam.x+(tx-homeCam.x)*nearHome:homeCam.x;
  const tCamY=follow?homeCam.y+(ty-homeCam.y)*nearHome:homeCam.y;
  camX+=(tCamX-camX)*Math.min(1,5*dt);
  camY+=(tCamY-camY)*Math.min(1,5*dt);

  /* 阶段标签同步 */
  // 钓鱼阶段镜头标准化(防御性,玩家按下时已设过)
  tarZoom=1;
  if(bossFish&&phase==="fishing")phase="boss";
}

function updateReelCount(){}  // 收线数已由 Canvas reel 角标直接读 hookedFish.length

/* ================================================================
   绘制 —— 占位 LowPoly,有素材时 drawImage 替换
   ================================================================ */
function poly(pts,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(pts[0],pts[1]);
  for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);ctx.closePath();ctx.fill();}

/* --- 背景:天空+海面 + 水下分层 + 遮挡物 --- */
/* ===================== 美术增强版(优先使用素材) ===================== */
function drawHomePierSurface(layerMode){
  const game=window.CatFishGame,coast=game.CoastSystem;
  const a=coast.anchors(T,hook.state);
  rodTipX=a.tip.x;rodTipY=a.tip.y;rodHandX=a.hand.x;rodHandY=a.hand.y;
  window.__FISHER_DRAW=null;catDrawAnchor=null;
  window.__MAIN_SCENE_WORLD_RECTS=game.MainSceneLayoutSystem.getConfig().components;
  if(layerMode!=="overlay")coast.drawWorld(ctx,IMG,camX,camY,curZoom,WORLD_H,WATER_Y);
}

// 仅供独立主界面布局编辑器读取；不参与玩法状态修改。
window.__getMainSceneEditorState=function(){
  const rects=window.__MAIN_SCENE_WORLD_RECTS||{};
  const screenRects={};
  Object.keys(rects).forEach(id=>{
    const r=rects[id];if(id==="camera")return;
    if(id==="start"){screenRects[id]=Object.assign({},r);return;}
    if(id==="upgrade"){const c=rects.cat;screenRects[id]={x:c.x+c.w/2-camX-r.w/2+r.x,y:c.y-camY+r.y,w:r.w,h:r.h,hidden:!!r.hidden};return;}
    screenRects[id]={x:(r.x-camX)*curZoom,y:(r.y-camY)*curZoom,w:r.w*curZoom,h:r.h*curZoom,hidden:!!r.hidden};
  });
  return {zoom:curZoom,camX:camX,camY:camY,waterY:WATER_Y,rects:screenRects};
};

function drawWorld(){
  drawHomePierSurface("background");
  drawBubbles();drawDust();
  // Preserve collision-bearing scenery and original fish resources.
  if(camY>WATER_Y-180)drawScenery();
}

function drawHillLayer(h, color, freq, amp){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(0,WATER_Y);
  ctx.lineTo(0,WATER_Y-h);
  for(let x=0;x<=WORLD_W;x+=20){
    ctx.lineTo(x, WATER_Y-h - Math.max(0, Math.sin(x*freq)*amp + Math.sin(x*freq*2.3+1)*amp*0.4));
  }
  ctx.lineTo(WORLD_W,WATER_Y);
  ctx.closePath();ctx.fill();
}

function drawTower(x, baseY, scale){
  const s=scale||1;
  const h=120*s, w=30*s;
  // 塔身
  ctx.fillStyle="#8a9098";
  ctx.fillRect(x, baseY-h, w, h);
  // 暗面
  ctx.fillStyle="#5d636b";
  ctx.fillRect(x, baseY-h, w*0.25, h);
  // 塔基
  ctx.fillStyle="#5d636b";
  ctx.fillRect(x-4, baseY-2, w+8, 4);
  // 锯齿垛口
  ctx.fillStyle="#8a9098";
  for(let i=0;i<4;i++)ctx.fillRect(x-4+i*((w+4)/4)*1.05, baseY-h-8, ((w+4)/4)*0.7, 8);
  // 窗(深色)
  ctx.fillStyle="#2a3340";
  ctx.fillRect(x+w*0.35, baseY-h*0.7, w*0.3, h*0.12);
  ctx.fillRect(x+w*0.35, baseY-h*0.45, w*0.3, h*0.12);
  // 顶尖小帽
  ctx.fillStyle="#5d636b";
  ctx.beginPath();
  ctx.moveTo(x+w*0.3, baseY-h-8);
  ctx.lineTo(x+w*0.5, baseY-h-22);
  ctx.lineTo(x+w*0.7, baseY-h-8);
  ctx.closePath();ctx.fill();
}

function cloudPuff(x,y,s){
  ctx.fillStyle="rgba(255,255,255,.92)";
  ctx.beginPath();
  ctx.ellipse(x, y, 44*s, 13*s, 0, 0, 7);
  ctx.ellipse(x-20*s, y-2*s, 22*s, 12*s, 0, 0, 7);
  ctx.ellipse(x+20*s, y-2*s, 22*s, 12*s, 0, 0, 7);
  ctx.ellipse(x-8*s, y-9*s, 24*s, 11*s, 0, 0, 7);
  ctx.ellipse(x+12*s, y-8*s, 22*s, 11*s, 0, 0, 7);
  ctx.fill();
  // 云底淡阴影
  ctx.fillStyle="rgba(180,210,230,.4)";
  ctx.beginPath();
  ctx.ellipse(x, y+5*s, 38*s, 5*s, 0, 0, 7);
  ctx.fill();
}

function drawSeagulls(){
  ctx.strokeStyle="rgba(40,60,80,.7)";
  ctx.lineWidth=1.8;
  ctx.lineCap="round";
  const flap=Math.sin(T*4)*2;
  for(const[bx,by,s] of [[WORLD_W*.30,42,1],[WORLD_W*.55,30,.8],[WORLD_W*.62,58,.9],[WORLD_W*.36,80,.7]]){
    const w=12*s;
    ctx.beginPath();
    ctx.moveTo(bx-w,by+flap*s*.4);
    ctx.quadraticCurveTo(bx-w*.5,by-flap*s-3*s, bx,by);
    ctx.quadraticCurveTo(bx+w*.5,by-flap*s-3*s, bx+w,by+flap*s*.4);
    ctx.stroke();
  }
}

/* 水面波浪曲线(参考视频:水面不是直线,有起伏的厚波浪) */
function waveY(x){
  return WATER_Y + Math.sin(x*0.018+T*1.5)*7 + Math.sin(x*0.045+T*2.3)*3.5;
}
function drawWaterSurface(){
  // 1) 水面下方深色基底(让水面浪花顶部有"切面厚度"感)
  ctx.fillStyle="#1d6a78";
  ctx.beginPath();
  ctx.moveTo(0,WATER_Y+44);
  for(let x=0;x<=WORLD_W;x+=10){ctx.lineTo(x,waveY(x));}
  ctx.lineTo(WORLD_W,WATER_Y+44);
  ctx.closePath();ctx.fill();

  // 2) 水面波浪深色描边
  ctx.strokeStyle="#0e3c4a";ctx.lineWidth=2.5;ctx.lineCap="round";
  ctx.beginPath();
  for(let x=0;x<=WORLD_W;x+=10){
    const wy=waveY(x);
    if(x===0)ctx.moveTo(x,wy);else ctx.lineTo(x,wy);
  }
  ctx.stroke();

  // 3) 浪尖白色泡沫(每个波峰一段)
  ctx.fillStyle="rgba(255,255,255,.9)";
  for(let x=0;x<WORLD_W;x+=30){
    const wy=waveY(x);
    const wyL=waveY(x-4), wyR=waveY(x+4);
    if(wy<wyL&&wy<wyR){ // 是波峰
      ctx.beginPath();
      ctx.moveTo(x-12,wy+2);
      ctx.quadraticCurveTo(x,wy-3,x+12,wy+2);
      ctx.lineTo(x+10,wy+4);
      ctx.quadraticCurveTo(x,wy-1,x-10,wy+4);
      ctx.closePath();ctx.fill();
    }
  }
  // 高光小线
  ctx.fillStyle="rgba(255,255,255,.55)";
  for(let x=0;x<WORLD_W;x+=18){
    const wy=waveY(x);
    ctx.fillRect(x, wy+2, 8, 1.2);
  }

  // 4) ★ 水下"灯罩"光晕(参考视频核心特征:中央向外散射的明亮区) ★
  const haloCX=WORLD_W/2;
  const haloCY=WATER_Y-80;
  const haloR=Math.min(WORLD_W*.6, 420);
  const halo=ctx.createRadialGradient(haloCX,haloCY,80,haloCX,WATER_Y+260,haloR);
  halo.addColorStop(0,"rgba(255,250,220,.35)");
  halo.addColorStop(0.3,"rgba(220,250,235,.22)");
  halo.addColorStop(0.7,"rgba(180,230,220,.08)");
  halo.addColorStop(1,"rgba(140,210,200,0)");
  ctx.save();
  // 只把 halo 限制在水下区域
  ctx.beginPath();
  ctx.rect(0,WATER_Y+2,WORLD_W,500);
  ctx.clip();
  ctx.fillStyle=halo;
  ctx.fillRect(0,WATER_Y,WORLD_W,520);
  ctx.restore();

  // 5) 水下顶部圆弧波纹倒影(从水面向下的圆弧条纹)
  ctx.strokeStyle="rgba(245,255,250,.28)";
  ctx.lineWidth=2;
  for(let i=0;i<5;i++){
    const r=120+i*60;
    const yOff=i*15;
    ctx.beginPath();
    ctx.arc(WORLD_W/2, WATER_Y-20+yOff, r, Math.PI*0.16+Math.sin(T*0.2+i)*0.04, Math.PI*0.84+Math.sin(T*0.2+i)*0.04);
    ctx.stroke();
  }

  // 6) 水面下浅色折射厚度带(只在波浪下侧 30px)
  const fg=ctx.createLinearGradient(0,WATER_Y+12,0,WATER_Y+44);
  fg.addColorStop(0,"rgba(180,240,225,.5)");
  fg.addColorStop(1,"rgba(110,200,185,0)");
  ctx.fillStyle=fg;
  ctx.beginPath();
  ctx.moveTo(0,WATER_Y+44);
  for(let x=0;x<=WORLD_W;x+=10){ctx.lineTo(x,waveY(x)+2);}
  ctx.lineTo(WORLD_W,WATER_Y+44);
  ctx.closePath();ctx.fill();
}

function drawUnderwaterGradient(){
  // 蓝色调(对齐参考图风格)
  const grad=ctx.createLinearGradient(0,WATER_Y+30,0,WORLD_H);
  grad.addColorStop(0,    "#3b81c8");  // 浅蓝(衔接 bg_surface 底部)
  grad.addColorStop(0.15, "#2f6cb0");
  grad.addColorStop(0.35, "#235698");
  grad.addColorStop(0.6,  "#173e7a");
  grad.addColorStop(0.85, "#0c285a");
  grad.addColorStop(1,    "#04183c");  // 极深
  ctx.fillStyle=grad;
  ctx.fillRect(0,WATER_Y+30,WORLD_W,WORLD_H-WATER_Y-30);
  const pixelWorld=window.CatFishGame&&window.CatFishGame.PixelWorldSystem;
  if(pixelWorld)pixelWorld.drawUnderwater(ctx,IMG);
  const studio=window.CatFishGame&&window.CatFishGame.MapEditorSystem;
  if(studio)studio.drawWorld(ctx,{x:0,y:WATER_Y+30,w:WORLD_W,h:WORLD_H-WATER_Y-30});
  const expedition=window.CatFishGame&&window.CatFishGame.MapExpeditionSystem;
  if(expedition)expedition.drawTiles(ctx,{x:0,y:WATER_Y+30,w:WORLD_W,h:WORLD_H-WATER_Y-30});
}

/* 水下顶部:横向滚动的波浪图(seamless 平铺,从左向右循环) */
function drawWaterFlow(){
  if(!IMG.wave)return;
  const img=IMG.wave, C=window.WAVE_CFG;
  const imgW=C.width;
  const imgH=imgW*img.height/img.width*C.heightScale;
  const y=WATER_Y+imgH*C.yOffset;
  const offset=(T*C.speed)%imgW;
  const left=camX-imgW, right=camX+VW/curZoom+imgW;
  const startX=Math.floor(left/imgW)*imgW - offset;
  for(let x=startX; x<right; x+=imgW){
    ctx.drawImage(img, x, y, imgW, imgH);
  }
}

/* 海面↔水下过渡半透明带:柔化水面图与水下渐变的接缝。
   yCenter 决定整带位置,hUp/hDown 分别决定中心向上/下的渐变宽度(可不对称)。
   峰值 alpha 总是锚定在中心 → 改宽度形状不被扭。
   挂载了 wave_transition 图片则改用图片拉伸,渐变参数忽略。*/
function drawWaveTransition(){
  const TC=window.WAVE_TRANS_CFG; if(!TC)return;
  const yC=WATER_Y+TC.yCenter;
  const yTop=yC-Math.max(0,TC.hUp);
  const yBot=yC+Math.max(0,TC.hDown);
  const h=yBot-yTop;
  if(h<=0)return;
  // ---- 图片覆盖路径 ----
  const img = TC.imageKey && IMG[TC.imageKey];
  if(img){
    ctx.save();
    ctx.globalAlpha = TC.alpha;
    ctx.drawImage(img, 0, yTop, WORLD_W, h);
    ctx.restore();
    return;
  }
  // ---- 程序化渐变 ----
  const hue=TC.hue, sat=TC.sat, light=TC.light, A=TC.alpha;
  const c=(a)=>`hsla(${hue},${sat}%,${light}%,${(a*A).toFixed(3)})`;
  const midT = h>0 ? (yC-yTop)/h : 0.5;   // 中心在 strip 内的归一化位置(对称时 0.5)
  // 5 段 alpha 包络:两端 0,中心 1.0;上下两侧各加一个中间 stop 让过渡更平滑
  const g=ctx.createLinearGradient(0,yTop,0,yBot);
  g.addColorStop(0,                 c(0));
  g.addColorStop(midT*0.5,          c(0.72));
  g.addColorStop(midT,              c(1.00));
  g.addColorStop(midT+(1-midT)*0.5, c(0.52));
  g.addColorStop(1,                 c(0));
  ctx.fillStyle=g;
  ctx.fillRect(0,yTop,WORLD_W,h);
}

/* 深水雾气:越深越浓的蓝色覆盖,模拟远处看不清 */
function drawDepthFog(){
  // 从世界 y=1300 起开始有雾,1900 起完全雾
  if(camY+VH/curZoom<1300)return;
  const fogStart=1300, fogFull=1900;
  const grad=ctx.createLinearGradient(0,fogStart,0,fogFull);
  grad.addColorStop(0,"rgba(20,50,90,0)");
  grad.addColorStop(1,"rgba(8,28,60,0.55)");
  ctx.fillStyle=grad;
  ctx.fillRect(0,fogStart,WORLD_W,WORLD_H-fogStart);
}

function drawSunRays(){
  // 多条扇形光柱,从水面中央向下散开(暖白色,符合参考视频)
  ctx.save();
  const RAYS=7;
  for(let i=0;i<RAYS;i++){
    // 让光柱从水面中央向外扇形散射(模拟头顶阳光)
    const angle=(i/(RAYS-1)-0.5)*0.4;  // -0.2 ~ +0.2 rad
    const cx=WORLD_W/2 + Math.sin(T*.3+i)*10;
    const topY=WATER_Y+18;
    const bottomY=1400;
    const bottomCX=cx + Math.tan(angle)*(bottomY-topY);
    const topW=14+Math.sin(T*.5+i*1.7)*3;
    const botW=80;
    const g=ctx.createLinearGradient(0,topY,0,bottomY);
    g.addColorStop(0,   "rgba(255,250,210,.30)");
    g.addColorStop(0.35,"rgba(245,250,230,.16)");
    g.addColorStop(1,   "rgba(200,235,215,0)");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(cx-topW/2, topY);
    ctx.lineTo(cx+topW/2, topY);
    ctx.lineTo(bottomCX+botW/2, bottomY);
    ctx.lineTo(bottomCX-botW/2, bottomY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBubbles(){
  ctx.fillStyle="rgba(225,250,255,.55)";
  for(const b of bubbles){
    ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();
  }
  // 大气泡的高光点
  ctx.fillStyle="rgba(255,255,255,.85)";
  for(const b of bubbles){
    if(b.r>=2.2){
      ctx.beginPath();ctx.arc(b.x-b.r*.35,b.y-b.r*.35,b.r*.3,0,7);ctx.fill();
    }
  }
}

/* 画一块礁石图片(x,y = 左上角 / w = 宽 / flip = -1 水平翻转) */
/* 礁石图绘制:从 ASSET_LIST 取对应 IMG[key],flip<0 时左右镜像。
   key 是 IMG 里的资源名(如 "rock"、"rock_b"、"rock_c"),默认 "rock"。*/
function drawRock(x,y,w,flip,key){
  const img = IMG[key||"rock"];
  if(!img)return;
  const h=w*img.height/img.width;
  if(flip<0){ctx.save();ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(img,0,0,w,h);ctx.restore();}
  else ctx.drawImage(img,x,y,w,h);
}

function drawScenery(){
  if(window.CatFishGame&&window.CatFishGame.PixelWorldSystem)return;
  // 全部从 window.SCENERY_CFG 读 — 调试面板「场景编辑」直接拖动可改。
  // 每项 {key,x,y,w,flip}。wreck 也走 drawRock(IMG.wreck 已收录)。
  const list = window.SCENERY_CFG || [];
  for(const it of list){
    drawRock(it.x, it.y, it.w, it.flip, it.key);
  }
  // edit mode 时调试层绘制选框 / 拖拽手柄
  if(window.drawSceneryEditOverlay) window.drawSceneryEditOverlay();
  // 注:海底地形已由 bg_water 包含,不再程序绘制
}

/* LowPoly 礁石:主色+暗面+亮面切片 */
function rockPoly(pts, mainColor, darkColor, lightColor){
  // 主体
  ctx.fillStyle=mainColor;
  ctx.beginPath();ctx.moveTo(pts[0],pts[1]);
  for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);
  ctx.closePath();ctx.fill();
  // 找最高点(顶角)
  let topIdx=0, topY=pts[1];
  for(let i=2;i<pts.length;i+=2){if(pts[i+1]<topY){topY=pts[i+1];topIdx=i;}}
  // 亮面:从顶到顶后下一点
  if(topIdx<pts.length-2 && lightColor){
    const x0=pts[topIdx], y0=pts[topIdx+1];
    const x1=pts[topIdx+2], y1=pts[topIdx+3];
    // 中线作为亮/暗分界
    let prevIdx=(topIdx-2+pts.length)%pts.length;
    const x2=pts[prevIdx], y2=pts[prevIdx+1];
    ctx.fillStyle=lightColor;
    ctx.beginPath();
    ctx.moveTo(x0,y0);
    ctx.lineTo(x1,y1);
    ctx.lineTo((x1+x0)/2, (y1+y0)/2+(y1-y0)*0.6);
    ctx.lineTo((x0+x2)/2, (y0+y2)/2);
    ctx.closePath();ctx.fill();
  }
  // 暗面:从顶到顶前一点
  if(darkColor){
    let prevIdx=(topIdx-2+pts.length)%pts.length;
    const x0=pts[topIdx], y0=pts[topIdx+1];
    const x2=pts[prevIdx], y2=pts[prevIdx+1];
    let prev2=(prevIdx-2+pts.length)%pts.length;
    const x3=pts[prev2], y3=pts[prev2+1];
    ctx.fillStyle=darkColor;
    ctx.beginPath();
    ctx.moveTo(x0,y0);
    ctx.lineTo(x2,y2);
    ctx.lineTo(x3,y3);
    ctx.lineTo((x0+x2)/2,(y0+y2)/2+(y0-y2)*0.4);
    ctx.closePath();ctx.fill();
  }
  // 顶部高光线
  ctx.strokeStyle="rgba(190,220,235,.35)";ctx.lineWidth=1.5;
  ctx.beginPath();
  let prevIdx=(topIdx-2+pts.length)%pts.length;
  ctx.moveTo(pts[prevIdx],pts[prevIdx+1]);
  ctx.lineTo(pts[topIdx],pts[topIdx+1]);
  if(topIdx<pts.length-2)ctx.lineTo(pts[topIdx+2],pts[topIdx+3]);
  ctx.stroke();
}

function drawStarfish(x,y,r,color){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(Math.sin(x*0.01)*0.5);
  ctx.fillStyle=color;
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const a1=(i/5)*Math.PI*2-Math.PI/2;
    const a2=((i+0.5)/5)*Math.PI*2-Math.PI/2;
    ctx.lineTo(Math.cos(a1)*r, Math.sin(a1)*r);
    ctx.lineTo(Math.cos(a2)*r*0.42, Math.sin(a2)*r*0.42);
  }
  ctx.closePath();ctx.fill();
  // 中心更暗
  ctx.fillStyle="rgba(0,0,0,.2)";
  ctx.beginPath();ctx.arc(0,0,r*.25,0,7);ctx.fill();
  ctx.restore();
}

function drawWeed(x,y,n){
  // 海草:LowPoly 三角段,有明暗,会摆动
  for(let k=0;k<n;k++){
    const ox=x+k*7-n*3;
    const sway=Math.sin(T*1.3+k+ox*0.01);
    // 暗色描边
    ctx.strokeStyle="#1f5a3a";ctx.lineWidth=5;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(ox,y);
    for(let i=1;i<=4;i++)
      ctx.lineTo(ox+sway*5*i*.5, y-i*14);
    ctx.stroke();
    // 主色
    ctx.strokeStyle="#4ea668";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(ox,y);
    for(let i=1;i<=4;i++)
      ctx.lineTo(ox+sway*5*i*.5, y-i*14);
    ctx.stroke();
    // 顶端亮色
    ctx.strokeStyle="#86d49d";ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(ox+sway*5*3*.5,y-3*14);
    ctx.lineTo(ox+sway*5*4*.5,y-4*14);
    ctx.stroke();
  }
}

/* ---------- 渔夫状态机 ----------
   4 个状态:idle / cast / fishing / reel。每个状态一张精灵图(水平条,列=帧)。
   cast 和 reel 是一次性(播完最后一帧停住),idle 和 fishing 循环。
   缺图 → drawBoat 里回退到静态 IMG.fisher。 */
// 精灵图 = cols × rows 网格,frames 从左到右、从上到下顺序读取。
// frames 留空 → 自动 = cols*rows;想跳过尾部空白格,把 frames 设成实际帧数。
// 用 ||= 守卫:调试面板写回 DEBUG_CFG 块后,这里不覆盖已写回的值
window.FISHER_ANIM=window.FISHER_ANIM||{
  idle:    {cols:6, rows:1, frames:0, fps:8,  loop:true },
  cast:    {cols:5, rows:1, frames:0, fps:14, loop:false},
  fishing: {cols:6, rows:1, frames:0, fps:10, loop:true },
  reel:    {cols:5, rows:1, frames:0, fps:14, loop:false}
};
// 竿尖逐帧挂点表:FISHER_TIP[state][frameIdx]={fx,fy}(渔夫图内 0~1 比例)
// 由调试面板「竿尖逐帧标注」点画布生成;某帧缺表 → 回退 BOAT_CFG.fisherTipFx/Fy
window.FISHER_TIP=window.FISHER_TIP||{idle:[],cast:[],fishing:[],reel:[]};
const fisherFsm={state:"idle", t:0, prevHookState:"idle"};
function updateFisher(dt){
  // 由 hook.state 驱动:idle → idle,cast → cast(一次),swim → fishing,retract → reel(一次)
  // 调试面板锁定预览时不自动切
  if(!window.FISHER_PREVIEW){
    const hs=hook.state;
    let want="idle";
    if(hs==="cast") want="cast";
    else if(hs==="swim") want="fishing";
    else if(hs==="retract"){
      // 阶段 1(上升到可见)保持钓鱼动画;阶段 2 才切收鱼动画
      want = (hook.retractPhase>=2) ? "reel" : "fishing";
    }
    if(want!==fisherFsm.state){ fisherFsm.state=want; fisherFsm.t=0; }
  }
  fisherFsm.t+=dt;
}
function pickFisherFrame(){
  // 竿尖标注模式(FISHER_TIP_EDIT):锁定指定状态+帧,方便在画布上点挂点
  const ed=window.FISHER_TIP_EDIT;
  const st=ed?ed.state:fisherFsm.state;
  const cfg=(window.FISHER_ANIM&&window.FISHER_ANIM[st])||null;
  if(!cfg) return null;
  const img=IMG["fisher_"+st]; if(!img||!img.width) return null;
  const cols=Math.max(1,cfg.cols|0);
  const rows=Math.max(1,cfg.rows|0);
  const fw=img.width/cols, fh=img.height/rows;
  const totalFrames=(cfg.frames&&cfg.frames>0)?Math.min(cfg.frames,cols*rows):cols*rows;
  let idx;
  if(ed){ idx=Math.min(totalFrames-1,Math.max(0,ed.frame|0)); }
  else{
    const f=fisherFsm.t*(cfg.fps||10);
    idx=cfg.loop ? (Math.floor(f)%totalFrames) : Math.min(totalFrames-1, Math.floor(f));
  }
  // 优先用逐帧 canvas 缓存(常驻位图,无解码开销);没切好前回退原精灵条子矩形
  const cache=FISHER_FRAMES[st];
  if(cache&&cache.frames[idx]){
    const fc=cache.frames[idx];
    // 首次真绘制 reel/cast 帧 → 关闭对应 keep-alive,后续每帧真绘制会自然保温
    if(st==="reel" && !window.__REEL_HOT) window.__REEL_HOT=true;
    if(st==="cast" && !window.__CAST_HOT) window.__CAST_HOT=true;
    return {img:fc, sx:0, sy:0, fw:fc.width, fh:fc.height, state:st, idx, totalFrames};
  }
  const c=idx%cols, r=(idx/cols)|0;
  return {img, sx:c*fw, sy:r*fh, fw, fh, state:st, idx, totalFrames};
}
function drawBoat(){
  const bob=Math.sin(T*1.4)*2.5;
  const cx=WORLD_W/2+((window.GAME_CFG&&window.GAME_CFG.boatDX)||0);
  if(IMG.boat){
    // 分层合成:船体(hull)→ 渔夫(fisher)→ 鱼竿(rod);各层相对船体框(bx,by,bw,bh)定位,可在调试面板调
    const B=window.BOAT_CFG||{}, bc=(k,d)=>(B[k]!=null?B[k]:d);
    const bw=bc("boatW",BOAT_W_WORLD), bh=bw*IMG.boat.height/IMG.boat.width;
    const bx=cx-bw/2;
    const by=WATER_Y - bh*bc("waterFrac",0.86) + BOAT_BOTTOM_OFFSET + bob;
    ctx.drawImage(IMG.boat, bx, by, bw, bh);
    const catCfg=window.CatFishGame.CatConfig.boatAnchor;
    catDrawAnchor={
      x:bx+bw*catCfg.x,
      y:by+bh*catCfg.y,
      size:bw*catCfg.scale
    };
    // 渔夫(内含鱼竿的合成序列帧):脚底中心锚在 (fX,fY)·船体框
    // 竿尖位置 = 渔夫图内比例(fisherTipFx/Fy,0~1),鱼线从这里射出。
    // 渔夫不在这里画:登记绘制参数,主循环里在鱼线(drawHook)之后再画 → 角色盖在鱼线上层
    let fisherRect=null, fisherSpr=null;
    window.__FISHER_DRAW=null;
    {
      const spr=pickFisherFrame();
      if(spr){
        const fw=bw*bc("fisherScale",0.26);
        const fh=fw * (spr.fh/spr.fw);
        const ax=bx+bw*bc("fX",0.6), ay=by+bh*bc("fY",0.96);
        const fL=ax-fw/2, fT=ay-fh;
        window.__FISHER_DRAW={img:spr.img,sx:spr.sx,sy:spr.sy,sw:spr.fw,sh:spr.fh,dx:fL,dy:fT,dw:fw,dh:fh};
        fisherRect={L:fL,T:fT,w:fw,h:fh};
        fisherSpr=spr;
      } else if(IMG.fisher){
        const fw=bw*bc("fisherScale",0.26), fh=fw*IMG.fisher.height/IMG.fisher.width;
        const ax=bx+bw*bc("fX",0.6), ay=by+bh*bc("fY",0.96);
        const fL=ax-fw/2, fT=ay-fh;
        window.__FISHER_DRAW={img:IMG.fisher,dx:fL,dy:fT,dw:fw,dh:fh};
        fisherRect={L:fL,T:fT,w:fw,h:fh};
      }
    }
    window.__FISHER_RECT=fisherRect; // 世界坐标,供调试面板「竿尖标注」换算点击位置
    // 竿尖 / 手锚点计算 — 优先逐帧挂点表,其次渔夫图内固定比例,再回退 rod 图 / 船比例
    if(fisherRect){
      let tip=null;
      if(fisherSpr&&window.FISHER_TIP){
        const tab=window.FISHER_TIP[fisherSpr.state];
        if(tab){
          // 当前帧有标 → 用当前帧;没标 → 向前找最近有标注的帧;都没找到 → 用第一个有标的
          if(tab[fisherSpr.idx]) tip=tab[fisherSpr.idx];
          else{
            for(let i=fisherSpr.idx-1;i>=0;i--) if(tab[i]){tip=tab[i];break;}
            if(!tip) for(let i=0;i<tab.length;i++) if(tab[i]){tip=tab[i];break;}
          }
        }
      }
      rodTipX = fisherRect.L + fisherRect.w * (tip?tip.fx:bc("fisherTipFx",0.88));
      rodTipY = fisherRect.T + fisherRect.h * (tip?tip.fy:bc("fisherTipFy",0.08));
      rodHandX = fisherRect.L + fisherRect.w * bc("fisherHandFx",0.65);
      rodHandY = fisherRect.T + fisherRect.h * bc("fisherHandFy",0.45);
    } else if(IMG.rod){
      const rw=bw*bc("rodScale",0.64), rh=rw*IMG.rod.height/IMG.rod.width;
      const hx=bx+bw*bc("rX",0.72), hy=by+bh*bc("rY",0.62);
      const rL=hx-rw*bc("rodHandFx",0.07), rT=hy-rh*bc("rodHandFy",0.93);
      ctx.drawImage(IMG.rod, rL, rT, rw, rh);
      rodTipX=rL+rw*bc("rodTipFx",0.86); rodTipY=rT+rh*bc("rodTipFy",0.08);
      rodHandX=hx; rodHandY=hy;
    }else{
      rodTipX=bx+bw*rodTipFx(); rodTipY=by+bh*rodTipFy();
      rodHandX=bx+bw*0.768; rodHandY=by+bh*0.523;
    }
    // 调试示意点(window.BOAT_MARK,由调试面板「示意点」开;投放剥 debug.js 后永不显示)
    if(window.BOAT_MARK){
      ctx.save();
      ctx.strokeStyle="rgba(127,231,255,.8)"; ctx.lineWidth=1.5; ctx.strokeRect(bx,by,bw,bh);  // 船体框
      const mark=(x,y,col,lab)=>{ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(x-10,y);ctx.lineTo(x+10,y); ctx.moveTo(x,y-10);ctx.lineTo(x,y+10); ctx.stroke();
        ctx.beginPath(); ctx.arc(x,y,3.5,0,7); ctx.fill();
        ctx.font="bold 12px sans-serif"; ctx.textAlign="left"; ctx.strokeStyle="rgba(0,0,0,.7)"; ctx.lineWidth=3;
        ctx.strokeText(lab,x+12,y-5); ctx.fillStyle=col; ctx.fillText(lab,x+12,y-5); };
      mark(rodTipX,rodTipY,"#ff3b3b","竿尖(线起点)");
      mark(rodHandX,rodHandY,"#37e07a","手");
      ctx.restore();
    }
    return;
  }
  const y=WATER_Y-22+bob;
  catDrawAnchor={x:cx-8,y:y-44,size:BOAT_W_WORLD*0.20};

  // 桅杆
  ctx.fillStyle="#5a3520";
  ctx.fillRect(cx-30, y-94, 4, 84);
  ctx.fillRect(cx-50, y-66, 44, 3); // 横臂

  // 主帆(三角)
  ctx.fillStyle="#e6d8b8";
  ctx.beginPath();
  ctx.moveTo(cx-28, y-92);
  ctx.lineTo(cx+44, y-76);
  ctx.lineTo(cx-28, y-30);
  ctx.closePath();ctx.fill();
  // 帆暗面
  ctx.fillStyle="#b0a280";
  ctx.beginPath();
  ctx.moveTo(cx-28, y-92);
  ctx.lineTo(cx-28, y-30);
  ctx.lineTo(cx-10, y-58);
  ctx.closePath();ctx.fill();
  // 帆缝线
  ctx.strokeStyle="rgba(120,100,70,.4)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(cx-28,y-78);ctx.lineTo(cx+8,y-72);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-28,y-58);ctx.lineTo(cx-2,y-54);ctx.stroke();

  // 海盗旗杆顶
  ctx.fillStyle="#1a1820";
  ctx.fillRect(cx-30, y-100, 14, 8); // 旗
  // 旗上骷髅(简化:白点 + 两个黑眼)
  ctx.fillStyle="#fff";
  ctx.beginPath();ctx.arc(cx-23, y-95, 2.4, 0, 7);ctx.fill();

  // 船体下部(主)
  ctx.fillStyle="#a85530";
  ctx.beginPath();
  ctx.moveTo(cx-124, y);
  ctx.lineTo(cx+124, y);
  ctx.lineTo(cx+96, y+28);
  ctx.lineTo(cx-96, y+28);
  ctx.closePath();ctx.fill();
  // 船体高光带
  ctx.fillStyle="#c97250";
  ctx.fillRect(cx-124, y, 248, 5);
  // 白色护栏带
  ctx.fillStyle="#f2e8d4";
  ctx.beginPath();
  ctx.moveTo(cx-124,y+5);
  ctx.lineTo(cx+124,y+5);
  ctx.lineTo(cx+116,y+14);
  ctx.lineTo(cx-116,y+14);
  ctx.closePath();ctx.fill();
  // 护栏柱(白色小竖条)
  ctx.fillStyle="#a85530";
  for(let i=0;i<6;i++)ctx.fillRect(cx-100+i*40, y+5, 2, 9);
  // 船尾舵
  ctx.fillStyle="#5a3520";
  ctx.fillRect(cx+108, y, 4, 22);
  ctx.beginPath();ctx.arc(cx+112, y+22, 5, 0, 7);ctx.fill();

  // 烟囱
  ctx.fillStyle="#3a3a3e";
  ctx.fillRect(cx-72, y-52, 14, 26);
  ctx.fillStyle="#5a5a5e";
  ctx.fillRect(cx-72, y-52, 3, 26);
  ctx.fillStyle="#1a1a1e";
  ctx.fillRect(cx-72, y-52, 14, 3); // 顶部黑边
  // 烟雾
  for(let i=0;i<3;i++){
    const sy=y-58-i*14;
    const sx=cx-65+Math.sin(T*0.9+i)*7;
    ctx.fillStyle="rgba(220,220,220,"+(0.6-i*0.15)+")";
    ctx.beginPath();ctx.arc(sx,sy, 6-i*0.6, 0, 7);ctx.fill();
  }

  // 舱室
  ctx.fillStyle="#c0b8a8";
  ctx.fillRect(cx-58, y-46, 68, 46);
  ctx.fillStyle="#a8a090";
  ctx.fillRect(cx-58, y-46, 68, 4);  // 顶部色带
  ctx.fillStyle="#8a8272";
  ctx.fillRect(cx-58, y-46, 4, 46);  // 暗面
  // 窗(蓝玻璃)
  ctx.fillStyle="#3a6a86";
  ctx.fillRect(cx-46, y-36, 30, 22);
  ctx.fillStyle="rgba(255,255,255,.3)";
  ctx.fillRect(cx-44, y-34, 4, 8);

  // 锈迹
  ctx.fillStyle="rgba(70,30,15,.45)";
  ctx.fillRect(cx-58, y+9, 12, 4);
  ctx.fillRect(cx+40, y+11, 8, 4);
  ctx.fillRect(cx+78, y+8, 10, 4);

  // 渔夫
  drawFisherman(cx+34, y-8, bob);
}

function drawFisherman(gx, gy, bob){
  const sway=Math.sin(T*2.2)*2.5;
  const breath=Math.sin(T*1.6)*0.8;
  // === 鱼竿全局位置:渔夫的手 → 鱼竿尖端,鱼线起点共用此点 ===
  rodHandX = gx + 14;
  rodHandY = gy - 30 - breath + sway*2;
  rodTipX  = gx + 82;       // 鱼竿延伸到渔夫右上方,明显斜上 45 度
  rodTipY  = gy - 92 - breath;
  if(IMG.girl){
    ctx.drawImage(IMG.girl,gx-20,gy-58,40,66);
    // 鱼竿
    ctx.strokeStyle="#5a3520";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(rodHandX,rodHandY);
    ctx.quadraticCurveTo(rodHandX+24,rodHandY-30,rodTipX,rodTipY);
    ctx.stroke();
    return;
  }
  // 红外衣
  ctx.fillStyle="#d04050";
  ctx.beginPath();
  ctx.moveTo(gx-10,gy);
  ctx.lineTo(gx+10,gy);
  ctx.lineTo(gx+8,gy-28);
  ctx.lineTo(gx-8,gy-28);
  ctx.closePath();ctx.fill();
  // 红衣暗面
  ctx.fillStyle="#9a2838";
  ctx.beginPath();
  ctx.moveTo(gx-10,gy);
  ctx.lineTo(gx-8,gy-28);
  ctx.lineTo(gx-3,gy-28);
  ctx.lineTo(gx-2,gy);
  ctx.closePath();ctx.fill();
  // 腰带
  ctx.fillStyle="#5a3520";
  ctx.fillRect(gx-10,gy-12,20,3);
  // 脖子
  ctx.fillStyle="#f4cba0";ctx.fillRect(gx-3,gy-32-breath,6,5);
  // 头
  ctx.fillStyle="#f4cba0";
  ctx.beginPath();ctx.arc(gx,gy-40-breath,9,0,7);ctx.fill();
  // 头暗面
  ctx.fillStyle="#d8a880";
  ctx.beginPath();ctx.arc(gx-4,gy-40-breath,5,0,7);ctx.fill();
  // 头发(后)
  ctx.fillStyle="#5a3a20";
  ctx.beginPath();ctx.arc(gx+sway*0.3,gy-46-breath,10,Math.PI,Math.PI*2);ctx.fill();
  // 头发(刘海)
  ctx.fillStyle="#7a4a30";
  ctx.beginPath();
  ctx.moveTo(gx-8,gy-44-breath);
  ctx.quadraticCurveTo(gx+sway*0.5,gy-50-breath, gx+8,gy-44-breath);
  ctx.lineTo(gx+6,gy-40-breath);
  ctx.quadraticCurveTo(gx,gy-46-breath, gx-6,gy-40-breath);
  ctx.closePath();ctx.fill();
  // 帽(船长帽)
  ctx.fillStyle="#3a2820";
  ctx.fillRect(gx-12,gy-50-breath,24,5);
  ctx.beginPath();
  ctx.moveTo(gx-10,gy-50-breath);
  ctx.lineTo(gx+10,gy-50-breath);
  ctx.lineTo(gx+8,gy-58-breath);
  ctx.lineTo(gx-8,gy-58-breath);
  ctx.closePath();ctx.fill();
  // 帽徽
  ctx.fillStyle="#ffd966";
  ctx.beginPath();ctx.arc(gx,gy-54-breath,1.5,0,7);ctx.fill();
  // 眼睛
  ctx.fillStyle="#2a1a10";
  ctx.beginPath();ctx.arc(gx+2,gy-40-breath,0.9,0,7);ctx.fill();
  // 持竿手臂(从肩到 rodHand)
  ctx.strokeStyle="#f4cba0";ctx.lineWidth=4;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(gx+5,gy-24);ctx.lineTo(rodHandX,rodHandY);ctx.stroke();
  // 鱼竿(从手 → 鱼竿尖,弯曲)
  ctx.strokeStyle="#5a3520";ctx.lineWidth=3.5;ctx.lineCap="round";
  ctx.beginPath();
  ctx.moveTo(rodHandX,rodHandY);
  ctx.quadraticCurveTo(rodHandX+20,rodHandY-34, rodTipX,rodTipY);
  ctx.stroke();
  // 鱼竿尖小白点(让落点更清晰)
  ctx.fillStyle="#d4c4a0";
  ctx.beginPath();ctx.arc(rodTipX,rodTipY,2.2,0,7);ctx.fill();
}

/* ---------- 鱼发光贴图缓存 ----------
   预渲染"精灵 + 金色光晕"到离屏 canvas(每种鱼只做一次),运行时单次 drawImage。
   呼吸用 alpha + 缩放模拟,视觉等效,光栅成本降到 1/10 以下。 */
const _fishGlowCache={};
window.clearFishGlowCache=()=>{ for(const k in _fishGlowCache) delete _fishGlowCache[k]; };
function fishGlowSprite(key,r,artW=r*2.6,artH=r*1.8){
  const ck=key+"|"+r+"|"+artW+"|"+artH;
  if(ck in _fishGlowCache) return _fishGlowCache[ck];
  const im=IMG[key];
  if(!im||!im.width) return null;     // 图未就绪:不写缓存,下帧再试
  try{
    const S=2;                          // 2× 分辨率,放大绘制仍柔和清晰
    const w=artW, h=artH, pad=36;    // 光晕与本体使用相同长宽，竖直海马不产生横向重影。
    const oc=document.createElement("canvas");
    oc.width=Math.ceil((w+pad*2)*S); oc.height=Math.ceil((h+pad*2)*S);
    const c=oc.getContext("2d");
    c.scale(S,S);
    c.shadowColor="rgba(255,217,102,1)";
    c.shadowBlur=26;
    for(let i=0;i<3;i++) c.drawImage(im,pad,pad,w,h);  // 一次性:3 层叠加浓光晕
    const entry={cv:oc, dw:w+pad*2, dh:h+pad*2};
    _fishGlowCache[ck]=entry;
    return entry;
  }catch(e){ _fishGlowCache[ck]=null; return null; }
}
/* --- 鱼 / 钩 / 拖尾 / 水母 / 海王 --- */
function drawFish(f,asHooked){
  const t=f.type,r=f.r*1.15; // v0.6 visual only: physics/capture radius is unchanged.
  let dir=f.vx>=0?1:-1;
  if(asHooked){ // 挂上的鱼朝向锁定为挂钩瞬间的方向,不再跟拖尾方向翻转
    if(f.hookedDir!==undefined) dir=f.hookedDir;
    else if(Math.abs(f.dirX)>1) dir=f.dirX>=0?-1:1;
  }
  ctx.save();ctx.translate(f.x,f.y);if(asHooked&&f.fanAngle)ctx.rotate(f.fanAngle);ctx.scale(dir,1);
  const key=f.catalogFish&&IMG[f.catalogFish.iconKey]?f.catalogFish.iconKey:"fish_"+t.key;
  // 挂钩鱼:先用 shadowColor+shadowBlur 画一版"只发光不看主体",再正常画本体覆盖上去
  // → 结果 = 主体清晰 + 周围一圈金色外发光(不再是硬边圆环)
  // 尾巴摆动:AE 网格形变风格 — 竖切片累进旋转
  // 锚点右侧(头/身)竖切片保持原位;左侧每一条竖切片,离锚点越远旋转角度越大
  // (二次曲线累加),形成连续弯曲,无接缝
  const wagCfg=(window.FISH_WAG&&window.FISH_WAG[t.key])||t.wag||null;
  const pivotFx=wagCfg?wagCfg.pivotFx:0.35;
  const wagSpd=wagCfg?wagCfg.speed:6;
  const wagAmp=wagCfg?wagCfg.amp:0.20;
  // 挂钩鱼:不再摆尾(死鱼状态,静止跟着钩)
  const upright=f.catalogFish&&f.catalogFish.id==="fish_19";
  const wagAngle = asHooked||upright ? 0 : Math.sin(T*wagSpd + (f.wob||0))*wagAmp;
  // Preserve individual medium/large silhouettes. Visual sizing never changes collision radius.
  let artW=r*2.6,artH=r*1.8;
  if((t.key==="m"||t.key==="l")&&IMG[key]){
    const id=f.catalogFish&&f.catalogFish.id;
    const image=IMG[key],maxW=r*(id==="fish_20"||id==="fish_28"?3.1:2.6),maxH=r*(upright?2.6:1.8);
    const fit=Math.min(maxW/image.width,maxH/image.height);artW=image.width*fit;artH=image.height*fit;
  }
  const imgL=-artW/2, imgR=artW/2, imgW=artW;
  const imgT=-artH/2, imgH=artH;
  const pivotX=imgL+pivotFx*imgW;
  const tailLen=pivotX-imgL;                                   // 尾巴段长度
  const SLICES=10;                                              // 尾巴段切片数(越多越平滑)
  const sliceW=tailLen/SLICES;
  const drawFull=()=>{
    if(IMG[key]) ctx.drawImage(IMG[key],imgL,imgT,imgW,imgH);
    else{
      poly([-r,0,-r*.3,-r*.62,r*.7,-r*.4,r,0,r*.7,r*.42,-r*.3,r*.62],t.c1);
      poly([-r*.3,-r*.62,r*.7,-r*.4,r,0,-r*.1,-r*.1],t.c2);
      poly([-r,0,-r*.3,r*.62,-r*.1,r*.1],t.c3);
      poly([-r,-r*.04,-r*1.55,-r*.5,-r*1.55,r*.5,-r,r*.04],t.c2);
      poly([r*.05,-r*.5,r*.4,-r*.95,r*.5,-r*.4],t.c2);
      ctx.fillStyle="#10222e";ctx.beginPath();ctx.arc(r*.55,-r*.1,r*.13,0,7);ctx.fill();
    }
  };
  const drawSprite=(paint)=>{
    paint=paint||drawFull;
    // Body(锚点右):一次画完(严格边界,不越过 pivotX,避免和尾切片重叠)
    ctx.save();
    ctx.beginPath();
    ctx.rect(pivotX, imgT-200, imgR-pivotX+200, imgH+400);
    ctx.clip();
    paint();
    ctx.restore();
    // Tail(锚点左):切成 SLICES 竖条,累进二次旋转
    for(let i=0;i<SLICES;i++){
      const xR=pivotX-i*sliceW;
      const xL=xR-sliceW;
      const t01=(pivotX-(xL+xR)/2)/Math.max(1,tailLen);
      const rot=wagAngle*t01*t01;
      ctx.save();
      ctx.translate(pivotX,0); ctx.rotate(rot); ctx.translate(-pivotX,0);
      ctx.beginPath();
      // 严格边界,不重叠(避免 alpha 边缘叠加变浓)
      // 最外侧切片向左多扩 240px:光晕贴图比鱼图宽一圈(pad),尾尖外的光晕也要归入该切片
      const ext=(i===SLICES-1)?240:0;
      ctx.rect(xL-ext, imgT-200, sliceW+ext, imgH+400);
      ctx.clip();
      paint();
      ctx.restore();
    }
  };
  // 引导鱼 / 挂钩鱼:金色呼吸外发光 — 用预渲染发光贴图(fishGlowSprite),
  // 每帧只做一次普通 drawImage。之前的"每帧 3 次 shadowBlur"在光栅线程开销巨大,
  // 是收鱼阶段掉帧的主因之一(JS 计时看不到光栅线程,所以之前测不出来)。
  if(asHooked || f.guide){
    const glow=IMG[key]?fishGlowSprite(key,r,artW,artH):null;
    if(glow){
      const pulse=0.5+0.5*Math.sin(T*2.4);
      // 不缩放(会露鱼影);且光晕也走同一套摆尾切片 —— 贴图里烤入的鱼身跟真鱼逐像素对齐,
      // 摆尾时不再露出静止姿势的重影(开场引导鱼重叠的根因)
      ctx.save();
      ctx.globalAlpha=0.55+0.45*pulse;
      drawSprite(()=>ctx.drawImage(glow.cv, -glow.dw/2, -glow.dh/2, glow.dw, glow.dh));
      ctx.restore();
    }
    drawSprite();   // 本体压在光晕上
  } else {
    drawSprite();
  }
  if(f.flash>0 && IMG[key]){ // 命中高亮:也走同一套摆尾切片,不然摆动时露出静态鱼影
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    ctx.globalAlpha=Math.min(1,f.flash*5);
    drawSprite();
    ctx.restore();
  }
  ctx.restore();
  // 引导鱼的黄圈已改为金色呼吸外发光(在 drawSprite 里的 shadow),此处不再画环
  if(f.hpShow>0&&!f.hooked){
    // 黑底黑框 + 红格样式:整条黑底 + 每个 HP 单元红色实心格 + 单元间黑色分隔线
    // 消耗方向:从左往右,即每掉 1 HP 最左边的红格消失(与惯例相反,按需求实现)
    const cw=14, ch=7, cx0=f.x-t.hp*cw/2, cy0=f.y-r-16;
    const totalW=t.hp*cw;
    // 底(黑)+ 外框(黑)
    ctx.fillStyle="#000";
    ctx.fillRect(cx0, cy0, totalW, ch);
    ctx.strokeStyle="#000"; ctx.lineWidth=1;
    ctx.strokeRect(cx0-0.5, cy0-0.5, totalW+1, ch+1);
    for(let i=0;i<t.hp;i++){
      // 从右侧保留 f.hp 个红格(即 i >= t.hp - f.hp);从左往右逐个消失
      if(i >= t.hp - f.hp){
        ctx.fillStyle="#e63b3b";
        ctx.fillRect(cx0+i*cw+1, cy0+1, cw-2, ch-2);
      }
      // 格子分隔竖线(始终画)
      if(i>0){
        ctx.fillStyle="#000";
        ctx.fillRect(cx0+i*cw-0.5, cy0, 1, ch);
      }
    }
  }
}
// 鱼线纹理:assets/line_tex.png 存在时用平铺 pattern 描边(建议 8~16px 见方的细密纹理)
let _lineTexPat;
function lineTexPattern(){
  if(_lineTexPat!==undefined) return _lineTexPat;
  const im=IMG.line_tex;
  // 未加载完先返回 null,不写缓存(IMG 加载后会被转成 canvas:canvas 无 complete/naturalWidth,用 width 判)
  if(!im||!im.width) return null;
  if(im.naturalWidth!==undefined && (!im.complete||!im.naturalWidth)) return null;
  try{ _lineTexPat=ctx.createPattern(im,"repeat"); }catch(e){ _lineTexPat=null; }
  return _lineTexPat;
}
window.clearLineTexPattern=()=>{ _lineTexPat=undefined; }; // 调试面板换图后重建
// 渔夫顶层绘制:drawBoat 登记参数,这里在鱼线之后执行 → 角色压在鱼线上面
function drawFisherTop(){
  const d=window.__FISHER_DRAW; if(!d)return;
  if(d.sw!=null) ctx.drawImage(d.img,d.sx,d.sy,d.sw,d.sh,d.dx,d.dy,d.dw,d.dh);
  else ctx.drawImage(d.img,d.dx,d.dy,d.dw,d.dh);
}
function drawHook(){
  drawBoostBubbles();
  if(hook.state==="idle")return;
  if(hook.castHidden)return;   // 开始钓鱼动画播完前,鱼钩+鱼线都不画
  // 鱼线终点 = 钩顶圈圈(sampleLineTrail 也用圈圈位,末段才不会折)
  const a=ATK_LV[atkLv];
  const key=["hook_cu","hook_ag","hook_au","hook_dia"][atkLv];
  let ang=Math.PI/2; // 默认朝下
  if(Math.hypot(hook.vx,hook.vy)>5)ang=Math.atan2(hook.vy,hook.vx);
  // 鱼线绘制和挂鱼位置共享同一条平滑路径。
  const sm=fishingLinePath();
  const pathLine=()=>{
    ctx.beginPath();
    ctx.moveTo(sm[0].x, sm[0].y);
    for(let i=1;i<sm.length;i++) ctx.lineTo(sm[i].x, sm[i].y);
  };
  // 阴影底层(深色描边,提升可见性)
  ctx.strokeStyle="rgba(20,40,40,.35)";ctx.lineWidth=3.2;
  ctx.lineCap="round";ctx.lineJoin="round";
  pathLine(); ctx.stroke();
  // 主鱼线:有 line_tex 贴图 → 平铺纹理描边;否则白色 + 编织纹叠层
  const pat=lineTexPattern();
  ctx.strokeStyle=pat||"rgba(248,253,250,.95)";ctx.lineWidth=pat?2.8:2.2;
  pathLine(); ctx.stroke();
  if(!pat){
    ctx.strokeStyle="rgba(130,170,185,.55)";ctx.lineWidth=1.2;
    ctx.setLineDash([4,6]); ctx.lineDashOffset=-(T*36)%10;
    pathLine(); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.save();
  ctx.translate(hook.x,hook.y);
  ctx.rotate(ang-Math.PI/2+HOOK_TILT_CORRECT); // 移动方向 + 图片本身歪的校正
  // Enlarge around the line attachment, keeping the existing line path unchanged.
  ctx.translate(HOOK_RING_DX,HOOK_RING_DY);
  ctx.scale(1.15,1.15);
  ctx.translate(-HOOK_RING_DX,-HOOK_RING_DY);
  if(IMG[key]){drawBoostOutline(IMG[key]);ctx.drawImage(IMG[key],-16,-16,32,32);}
  else{
    ctx.strokeStyle=a.c;ctx.lineWidth=3.4;
    for(let i=0;i<a.prongs;i++){
      const off=(i-(a.prongs-1)/2)*11;
      ctx.beginPath();ctx.arc(off,0,8,-.3,3.4);ctx.stroke();
    }
    ctx.fillStyle="#ff8d4a";ctx.fillRect(-2,-14,4,7);
  }
  ctx.restore();
  // 触电闪烁
  if(hook.stun>0&&((T*12)|0)%2===0){
    ctx.strokeStyle="#fff176";ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<3;i++){
      const a2=T*20+i*2.1;
      ctx.moveTo(hook.x,hook.y);
      ctx.lineTo(hook.x+Math.cos(a2)*22,hook.y+Math.sin(a2)*22);
    }
    ctx.stroke();
  }
}
function drawBoss(){
  if(!bossFish)return;
  // 朝向读锁定值 b.faceDir(转向后 10s 冷却期内不允许再翻,由 updateBoss 维护)
  const b=bossFish, dir=(b.faceDir!==undefined?b.faceDir:(b.vx>=0?1:-1));
  ctx.save();ctx.translate(b.x,b.y);ctx.scale(dir,1);
  if(IMG.seaking){
    // AE 锚点式形变:锚点右侧(头/身)整块保持不动;锚点左侧(尾)沿脊柱做柔弯曲线
    // —— 竖切片累进旋转,但切片开得很密(40 段)+ 相邻小幅重叠 1.5px,视觉上就是一段
    // 连续弯曲的身体,而不是"切成很多块"的段感
    const imgL=-230, imgR=230, imgW=460, imgT=-150, imgH=300;
    const pivotFx=0.55, wagSpd=4.2, wagAmp=0.22;
    const wagAngle=Math.sin(T*wagSpd + (b.ph||0))*wagAmp;
    const pivotX=imgL+pivotFx*imgW;
    const tailLen=pivotX-imgL;
    const SLICES=40;                       // 切得越密,弯曲越连续、seam 越隐蔽
    const sliceW=tailLen/SLICES;
    const OV=1.5;                          // 相邻切片重叠 1.5px:小到不显重影、大到能盖住 sub-pixel 缝
    const paint=()=>ctx.drawImage(IMG.seaking, imgL, imgT, imgW, imgH);
    const drawSprite=()=>{
      // 身体(锚点右):一次画完,严格右起
      ctx.save();
      ctx.beginPath(); ctx.rect(pivotX, imgT-200, imgR-pivotX+400, imgH+400); ctx.clip();
      paint();
      ctx.restore();
      // 尾巴(锚点左):累进二次旋转 + 每片微重叠
      for(let i=0;i<SLICES;i++){
        const xR=pivotX-i*sliceW, xL=xR-sliceW;
        const t01=(pivotX-(xL+xR)/2)/Math.max(1,tailLen);
        const rot=wagAngle*t01*t01;
        ctx.save();
        ctx.translate(pivotX,0); ctx.rotate(rot); ctx.translate(-pivotX,0);
        ctx.beginPath();
        // 最外一片额外向左扩 260px 收进尾尖光影
        const extL=(i===SLICES-1)?260:OV;
        ctx.rect(xL-extL, imgT-200, sliceW+extL+OV, imgH+400); ctx.clip();
        paint();
        ctx.restore();
      }
    };
    drawSprite();
    if(b.flash>0){
      ctx.globalCompositeOperation="lighter";
      ctx.globalAlpha=Math.min(1,b.flash*5);
      drawSprite();
      ctx.globalAlpha=1; ctx.globalCompositeOperation="source-over";
    }
  }
  else{
    // 海王(中鱼 ≈10x 体积):放大到 240×160 半径
    const R=200;
    poly([-R*.8,0,-R*.3,-R*.55,R*.5,-R*.45,R*.85,-R*.05,R*.85,R*.05,R*.5,R*.45,-R*.3,R*.55],"#27406e");
    poly([-R*.3,-R*.55,R*.5,-R*.45,R*.85,-R*.05,-R*.05,-R*.15],"#1a2c52");
    poly([-R*.8,0,-R*.3,R*.55,-R*.05,R*.15],"#3a5a8e");
    poly([-R*.8,-R*.04,-R*1.25,-R*.45,-R*1.13,R*.05,-R*1.3,R*.42,-R*.81,R*.08],"#1a2c52"); // 尾
    poly([-R*.25,-R*.55,-R*.08,-R*.92,R*.08,-R*.55],"#ffd24a");                            // 背刺
    poly([R*.12,-R*.5,R*.32,-R*.82,R*.45,-R*.45],"#ffd24a");
    poly([R*.32,-R*.18,R*.62,-R*.28,R*.72,-R*.05,R*.55,-R*.01],"#16243f");                  // 头部
    ctx.fillStyle="#ff5a4a";ctx.beginPath();ctx.arc(R*.55,-R*.18,11,0,7);ctx.fill();        // 眼
    ctx.fillStyle="#ffe9a0";ctx.beginPath();ctx.arc(R*.58,-R*.20,4,0,7);ctx.fill();
    poly([R*.72,0,R*.85,-R*.02,R*.79,R*.08],"#eef6ff");                                     // 牙
    poly([R*.62,R*.05,R*.74,R*.02,R*.68,R*.14],"#eef6ff");
    poly([R*.35,-R*.62,R*.42,-R*.88,R*.52,-R*.64,R*.6,-R*.86,R*.66,-R*.6,R*.58,-R*.52,R*.42,-R*.54],"#ffd24a"); // 王冠
  }
  ctx.restore();
}

/* ================================================================
   Canvas UI:按钮 + 弹窗(全部画在虚拟 540×960 屏幕层,命中测试同一空间)
   ================================================================ */
const inRect=(x,y,r)=>r&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
// 取主界面按钮矩形(UI_CFG;follow=跟随鱼钩屏幕位,锚点=中心)
function btnRect(id){
  const c=window.UI_CFG&&window.UI_CFG[id]; if(!c)return null;
  const im=uiImg(id), w=c.w, h=im?c.w*im.height/im.width:c.h;
  if(c.follow){ const cx=(hook.x-camX)*curZoom+(c.x||0), cy=(hook.y-camY)*curZoom+(c.y||0);
    return {x:cx-w/2,y:cy-h/2,w,h,img:c.img}; }
  return {x:c.x,y:c.y,w,h,img:c.img};
}
// 各按钮可见性(取代原 updateCastBtn/updateUpgradeBtn 的 DOM .show)
const editing=()=>window.SCENERY_EDIT_MODE||window.UI_EDIT_MODE||window.PANEL_EDIT_MODE;
function btnVisible(id){
  if(panelOpen()) return false;
  if(window.CatFishGame.CoastSystem)return id==="reelBtn"&&(hook.state==="swim"||hook.state==="cast");
  if(id==="castBtn"){
    if(!(controlOn&&hook.state==="idle"&&(phase==="ready"||phase==="tut_aim")&&!editing())) return false;
    // 第一次钓鱼结束后:upgradeBtn 先出现,cast 延后 400ms 再出现;
    // 后续所有回合都直接一起显示(_castBtnStagerDone 保持 true)
    if(!window.__castBtnStagerDone){
      if(!firstReelDone) return true;                    // 教学抛钩阶段:直接可见
      if(!window.__upBtnFirstShownAt) return false;      // 等 upgradeBtn 先出现
      if(performance.now()-window.__upBtnFirstShownAt<400) return false;
      window.__castBtnStagerDone=true;
    }
    return true;
  }
  if(id==="reelBtn")   return false;   // 收钩按钮已按需求移除:线用完自动收钩,不再显示手动按钮
  if(id==="exitBtn") return controlOn&&hook.state==="idle"&&(phase==="ready"||phase==="tut_aim")&&!editing();
  if(id==="upgradeBtn"){
    if(!(firstReelDone&&hook.state==="idle"&&(phase==="ready"||phase==="tut_aim"||phase==="intro")&&!editing())) return false;
    // 结算动画在跑 / 有金币在飞 → 藏(记录时间戳,用于结算完再多等 300ms)
    if(settleAnim.active){ window.__settleDoneAt=0; return false; }
    // 结算刚结束 → 记录时间,再多等 300ms 缓冲(让金币数字稳一下)
    if(!window.__settleDoneAt) window.__settleDoneAt=performance.now();
    const ok=(performance.now()-window.__settleDoneAt)>=300;
    if(ok && !window.__upBtnFirstShownAt){ window.__upBtnFirstShownAt=performance.now(); try{SFX.alert();}catch(e){} }
    return ok;
  }
  if(id==="downloadBtn")return false;
  return false;
}
// 画一个图槽:有图 drawImage 到 (x,y,w,h),无图圆角矩形回退 + 可选标签
// ---------- 按钮按下动画:回弹 + 发亮 ----------
// 按下 → 三段缩放(0.9→1.08→1.0),同时发白光。0.35s 内跑完。
const _btnPress={};
function pressButton(key){ _btnPress[key]=performance.now(); try{SFX.click();}catch(e){} }
function pressState(key){
  const t=_btnPress[key]; if(!t) return null;
  const dt=(performance.now()-t)/1000;
  if(dt>0.35){ delete _btnPress[key]; return null; }
  let s;
  if(dt<0.08) s=1-0.10*(dt/0.08);        // 缩小
  else if(dt<0.22) s=0.9+0.18*((dt-0.08)/0.14); // 弹到 1.08
  else s=1.08-0.08*((dt-0.22)/0.13);     // 回归 1.0
  return {s, glow:Math.max(0,1-dt/0.35)};
}
function pressBox(key,r,fn){
  const st=pressState(key);
  if(!st){ fn(); return; }
  const cx=r.x+r.w/2, cy=r.y+r.h/2;
  ctx.save();
  try{
    ctx.translate(cx,cy); ctx.scale(st.s,st.s); ctx.translate(-cx,-cy);
    fn();                                     // 底层正常绘制
    if(st.glow>0.02){                         // glow ≈ 0 时跳过第二次 fn(),省一次绘制
      ctx.globalCompositeOperation="lighter";
      ctx.globalAlpha=0.6*st.glow;
      fn();                                    // 亮度叠加,让按钮本身变亮
    }
  } finally {
    ctx.restore();                             // fn() 抛异常也保证还原 ctx 栈
  }
}
function uiSprite(r, imgKey, fallFill, label, labCol){
  const im=imgKey&&uiImgKey(imgKey);
  if(im){ ctx.drawImage(im,r.x,r.y,r.w,r.h); }
  else{ ctx.fillStyle=fallFill||"rgba(8,40,60,.92)"; ctx.beginPath(); ctx.roundRect(r.x,r.y,r.w,r.h,Math.min(16,r.h/2)); ctx.fill();
    ctx.strokeStyle="rgba(127,231,255,.5)"; ctx.lineWidth=2; ctx.stroke(); }
  if(label){ ctx.fillStyle=labCol||"#dff4ff"; ctx.font="bold "+Math.min(20,r.h*0.42)+"px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(label, r.x+r.w/2, r.y+r.h/2); ctx.textBaseline="alphabetic"; ctx.textAlign="left"; }
}
function uiImgKey(k){ return (UI_IMG_READY&&IMG[k])||null; }
// 动态数字/文字(canvas 实时画)
function uiText(str,x,y,size,color,align,strokeCol){
  ctx.font="bold "+(size||20)+"px sans-serif"; ctx.textAlign=align||"center"; ctx.textBaseline="middle";
  if(strokeCol){ ctx.strokeStyle=strokeCol; ctx.lineWidth=Math.max(3,size*0.18); ctx.strokeText(str,x,y); }
  ctx.fillStyle=color||"#fff"; ctx.fillText(str,x,y);
  ctx.textBaseline="alphabetic"; ctx.textAlign="left";
}
// 统一金币图标(全游戏共用 IMG.coin = COIN.png;缺图回退金色圆)。以 (cx,cy) 为中心,宽 d 等比。
function drawCoinIcon(cx,cy,d){
  const im=IMG.coin;
  if(im&&im.width){ const h=d*im.height/im.width; ctx.drawImage(im, cx-d/2, cy-h/2, d, h); return; }
  ctx.fillStyle="#ffd966";ctx.beginPath();ctx.arc(cx,cy,d*0.46,0,7);ctx.fill();
  ctx.fillStyle="#b8860b";ctx.beginPath();ctx.arc(cx,cy,d*0.28,0,7);ctx.fill();
  ctx.fillStyle="#fff5b0";ctx.beginPath();ctx.arc(cx-d*0.12,cy-d*0.12,d*0.1,0,7);ctx.fill();
}
// 统一程序文字:按 TEXT_CFG[key] 的 size/fill/stroke/sw/align 在 (x+dx, y+dy) 绘制
function txt(key,str,x,y,colOverride){
  const c=(window.TEXT_CFG&&window.TEXT_CFG[key])||{};
  const size=c.size||18;
  ctx.font="bold "+size+"px sans-serif"; ctx.textAlign=c.align||"center"; ctx.textBaseline="middle";
  const px=x+(c.dx||0), py=y+(c.dy||0);
  if(c.stroke&&c.sw>0){ ctx.strokeStyle=c.stroke; ctx.lineWidth=c.sw; ctx.strokeText(str,px,py); }
  ctx.fillStyle=colOverride||c.fill||"#fff"; ctx.fillText(str,px,py);
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
}
const txtCfg=key=>(window.TEXT_CFG&&window.TEXT_CFG[key])||{};
// 「金币图标 + 数字」整体居中于 (cx,cy);数字样式取 TEXT_CFG[key](size/fill/stroke/sw),整体可用 dx/dy 位移
function drawCoinNum(cx,cy,num,key){
  const c=txtCfg(key), size=c.size||24, t=""+num;
  const font="bold "+size+"px sans-serif";
  const tw=measureTextCached(font,t), ic=size*1.2, gap=size*0.22, total=ic+gap+tw;
  ctx.font=font;
  const sx=cx+(c.dx||0)-total/2, cyy=cy+(c.dy||0);
  // 用 actualBoundingBox 精确算数字的视觉中心,把它对齐到金币图标中心 cyy
  // (baseline=middle 是字体 em 盒中心,不是字形视觉中心,数字看起来会偏低)
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  const mm=ctx.measureText(t);
  const asc=mm.actualBoundingBoxAscent||size*0.72, desc=mm.actualBoundingBoxDescent||size*0.05;
  const numY = cyy + (asc-desc)/2;
  drawCoinIcon(sx+ic/2, cyy, ic);
  if(c.stroke&&c.sw>0){ ctx.strokeStyle=c.stroke; ctx.lineWidth=c.sw; ctx.strokeText(t, sx+ic+gap, numY); }
  ctx.fillStyle=c.fill||"#ffd966"; ctx.fillText(t, sx+ic+gap, numY);
}
// 工具图标画到 canvas 指定矩形(沿用 ui_ico_* 图或程序回退)
function drawToolIcon(kind,lv,r){
  // 每级独立图:ui_ico_line_lv1..4 / ui_ico_hook_lv1..4;找不到分级图 → 回退到通用 ui_ico_line / ui_ico_atk
  const level=Math.min(3,Math.max(0,lv|0))+1; // lv 是内部 0-3,图标编号用 1-4
  const perLvKey = kind==="line"?("ui_ico_line_lv"+level):("ui_ico_hook_lv"+level);
  const im = uiImgKey(perLvKey) || uiImgKey(kind==="line"?"ui_ico_line":"ui_ico_atk");
  // 升级回弹动画:buy() 时会记录 iconBounce.line / iconBounce.atk 的时间戳
  const bt=window.__iconBounce&&window.__iconBounce[kind];
  let scale=1;
  if(bt){
    const dt=(performance.now()-bt)/1000;
    const DUR=0.45;
    if(dt<DUR){
      // 三段:0-0.10 小 0.8 → 0.10-0.28 弹到 1.28 → 0.28-0.45 回到 1.0
      if(dt<0.10) scale=1-0.20*(dt/0.10);
      else if(dt<0.28) scale=0.8+0.48*((dt-0.10)/0.18);
      else scale=1.28-0.28*((dt-0.28)/0.17);
    }
  }
  if(im){
    const cx=r.x+r.w/2, cy=r.y+r.h/2;
    if(scale!==1){ ctx.save(); ctx.translate(cx,cy); ctx.scale(scale,scale); ctx.translate(-cx,-cy); }
    ctx.drawImage(im,r.x,r.y,r.w,r.h);
    if(scale!==1) ctx.restore();
    return;
  }
  // 全部缺图 → 程序回退
  ctx.save(); ctx.translate(r.x,r.y); const S=r.w/46;
  if(kind==="line"){ ctx.strokeStyle="#5fd3ff";ctx.lineWidth=3;ctx.beginPath();
    ctx.moveTo(8*S,38*S);ctx.quadraticCurveTo(23*S,4*S,38*S,30*S);ctx.stroke();
    ctx.fillStyle="#ffd966";ctx.fillRect(34*S,28*S,8*S,8*S); }
  else{ const a=ATK_LV[lv];ctx.strokeStyle=a.c;ctx.lineWidth=3;
    for(let i=0;i<a.prongs;i++){const off=(i-(a.prongs-1)/2)*10*S;
      ctx.beginPath();ctx.arc(23*S+off,22*S,8*S,-.3,3.4);ctx.stroke();} }
  ctx.restore();
}
// 去色图缓存:用 saturation 混合生成灰度版按钮图(iOS 安全,不用 ctx.filter)
const _grayImgCache={};
function grayImage(key){
  const im=uiImgKey(key); if(!im) return null;
  let g=_grayImgCache[key]; if(g) return g;
  try{
    const oc=document.createElement("canvas"); oc.width=im.width; oc.height=im.height;
    const c=oc.getContext("2d");
    c.drawImage(im,0,0);
    c.globalCompositeOperation="saturation";          // 饱和度归零 → 灰度
    c.fillStyle="#888"; c.fillRect(0,0,oc.width,oc.height);
    c.globalCompositeOperation="destination-in";      // 恢复原图透明区域
    c.drawImage(im,0,0);
    _grayImgCache[key]=oc; return oc;
  }catch(e){ return null; }
}
window.clearGrayImageCache=k=>{ if(k)delete _grayImgCache[k]; else for(const x in _grayImgCache)delete _grayImgCache[x]; };
// measureText 缓存:font+text 相同时命中,避免升级面板每帧重复算 3-4 次文字宽度
const _mtCache={};
function measureTextCached(font,str){
  const key=font+"|"+str;
  const hit=_mtCache[key];
  if(hit!==undefined) return hit;
  ctx.font=font;
  const w=ctx.measureText(str).width;
  _mtCache[key]=w;
  return w;
}
// 进度点(pips)
function drawPips(lv,r){
  const n=3, gap=r.w/n, d=Math.min(gap*0.6,r.h);
  for(let i=0;i<n;i++){ const cx=r.x+gap*i+gap/2, cy=r.y+r.h/2;
    const on=i<lv, imk=on?"ui_pip_on":"ui_pip", im=uiImgKey(imk);
    if(im) ctx.drawImage(im,cx-d/2,cy-d/2,d,d);
    else{ ctx.fillStyle=on?"#ffd966":"rgba(255,255,255,.25)"; ctx.beginPath(); ctx.arc(cx,cy,d/2,0,7); ctx.fill(); } }
}
// 升级面板「是否显示 TAP TO FISH」+「强制高亮哪一行」(沿用旧 refreshUpgrade 逻辑)
function upGoFishShown(){
  if(forcedStep>0) return false;
  if(roundNum===1&&!tutUpgradeDone) return false;
  return true;
}
function upForcedRow(){
  if(forcedStep>0){ if(lineLv<LINE_COST.length)return 0; if(atkLv<3)return 1; return -1; }
  if(roundNum===1&&!tutUpgradeDone&&coins>=LINE_COST[0]&&lineLv===0) return 0;
  return -1;
}
// 单行矩形(模板复用)
function upRowRect(i){ const P=window.PANEL_UI; return {x:P.upRowX,y:P.upRows[i],w:P.upRowW,h:P.upRowH}; }
const relRect=(base,off)=>({x:base.x+off.dx,y:base.y+off.dy,w:off.w,h:off.h});

function drawDimmer(){ ctx.fillStyle="rgba(0,0,0,.58)"; ctx.fillRect(0,0,VW,VH); }

function drawUpgradePanel(){
  const P=window.PANEL_UI;
  drawDimmer();
  // 买不起点击反馈:整个面板水平抖 0.4s(衰减正弦),坐标只影响绘制,不影响点击判定
  const denyAge=(performance.now()-buyDenyFx.at)/1000;
  const denyActive=buyDenyFx.at>0 && denyAge<0.4;
  ctx.save();
  if(denyActive){
    const k=1-denyAge/0.4;                       // 线性衰减
    // 水平为主 + 竖向副频(频率错开,轨迹呈乱抖而非斜线)
    ctx.translate(Math.sin(denyAge*55)*8*k, Math.sin(denyAge*38+1.7)*4*k);
  }
  uiSprite(P.upCard, P.upCard.img, "rgba(10,44,64,.97)");
  // 玩家金币:黑色胶囊底框 + 金币图标 + 数
  {
    const c=(window.TEXT_CFG&&window.TEXT_CFG.upCoins)||{}, size=c.size||24;
    const tStr=""+coinsShown();
    const font="bold "+size+"px sans-serif";
    const tw=measureTextCached(font,tStr), ic=size*1.2, gap=size*0.22;
    const contentW=ic+gap+tw;
    // 胶囊底框:比内容宽一圈,圆角=高度的一半
    const padX=size*0.7, padY=size*0.3;
    const capW=contentW+padX*2, capH=size+padY*2;
    const capX=P.upCoins.x-capW/2, capY=P.upCoins.y-capH/2;
    ctx.save();
    ctx.fillStyle="rgba(0,0,0,.72)";
    ctx.beginPath(); ctx.roundRect(capX,capY,capW,capH,capH/2); ctx.fill();
    ctx.strokeStyle="rgba(255,217,102,.35)"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(capX,capY,capW,capH,capH/2); ctx.stroke();
    ctx.restore();
    drawCoinNum(P.upCoins.x, P.upCoins.y, coinsShown(), "upCoins");
  }
  // 两行:line / atk
  const rows=[{kind:"line",lv:lineLv,cost:LINE_COST,lab:(LINE_LV[lineLv]/10)+"m",nm:"LINE",nmImg:P.upName.imgLine},
              {kind:"atk", lv:atkLv, cost:ATK_COST, lab:"Damage: "+((ATK_LV[atkLv]||{}).dmg||""), nm:"HOOK",nmImg:P.upName.imgAtk}];
  const fr=upForcedRow();
  rows.forEach((row,i)=>{
    const rr=upRowRect(i);
    uiSprite(rr, P.upRowImg, "rgba(8,40,60,.9)");
    if(i===fr){ ctx.strokeStyle="rgba(255,217,102,"+(0.6+Math.sin(T*7)*0.3)+")"; ctx.lineWidth=4;
      ctx.beginPath(); ctx.roundRect(rr.x-3,rr.y-3,rr.w+6,rr.h+6,12); ctx.stroke(); }
    drawToolIcon(row.kind,row.lv,relRect(rr,P.upIco));
    // 道具名:有图画图,否则文字
    const nr=relRect(rr,P.upName), nim=row.nmImg&&uiImgKey(row.nmImg);
    if(nim) ctx.drawImage(nim,nr.x,nr.y,nr.w,nr.h);
    else txt("upName",row.nm,nr.x,nr.y+nr.h/2);
    // 等级文字(两行显示:LV1 / 100m +50)
    const lr=relRect(rr,P.upLv);
    if(row.lv>=row.cost.length){
      txt("upLv","MAX",lr.x,lr.y,"#9fe0a0");
    } else {
      const lvSize=(window.TEXT_CFG&&window.TEXT_CFG.upLv&&window.TEXT_CFG.upLv.size)||14;
      const gap=lvSize+6;
      const subSize=Math.round(lvSize*2/3);
      const c=(window.TEXT_CFG&&window.TEXT_CFG.upLv)||{};
      // 计算升级增量文字
      let delta="";
      if(row.kind==="line" && row.lv+1<LINE_LV.length){
        delta="+"+((LINE_LV[row.lv+1]-LINE_LV[row.lv])/10);
      } else if(row.kind==="atk" && row.lv+1<ATK_LV.length){
        // 增量上限锁 +1:金 → 钻石 内部 dmg=999(CTA 不可达占位),显示不能是 +996
        delta="+"+Math.min(1, ATK_LV[row.lv+1].dmg-ATK_LV[row.lv].dmg);
      }
      ctx.save();
      // 中等字重:Segoe UI 支持 500 Medium,视觉上介于 Regular(400) 和 Bold(700) 之间
      const WEIGHT="500";
      const FAMILY="'Segoe UI',sans-serif";
      const lvFont=WEIGHT+" "+lvSize+"px "+FAMILY;
      const subFont=WEIGHT+" "+subSize+"px "+FAMILY;
      ctx.textAlign=c.align||"left"; ctx.textBaseline="middle";
      // 第一行:LV + 编号
      const x1=lr.x+(c.dx||0), y1=lr.y+(c.dy||0);
      ctx.font=lvFont;
      if(c.stroke&&c.sw>0){ ctx.strokeStyle=c.stroke; ctx.lineWidth=c.sw; ctx.strokeText("LV"+(row.lv+1), x1, y1); }
      ctx.fillStyle="#ffffff";
      ctx.fillText("LV"+(row.lv+1), x1, y1);
      // 第二行:数值 + 绿色增量
      const y2=lr.y+gap+(c.dy||0);
      ctx.font=subFont;
      if(c.stroke&&c.sw>0){ ctx.strokeStyle=c.stroke; ctx.lineWidth=c.sw; ctx.strokeText(row.lab, x1, y2); }
      ctx.fillStyle="#ffffff";
      ctx.fillText(row.lab, x1, y2);
      if(delta){
        const labW=measureTextCached(subFont, row.lab);
        const gx=x1+labW+subSize*0.35;
        ctx.strokeStyle="#000"; ctx.lineWidth=Math.max(2,subSize*0.16); ctx.lineJoin="round";
        ctx.strokeText(delta, gx, y2);
        ctx.fillStyle="#3ce866";
        ctx.fillText(delta, gx, y2);
      }
      ctx.restore();
    }
    // 买按钮(单独绘制;价格在下面独立画,不参与按钮的按下动画)
    const br=relRect(rr,P.upBuy);
    const buyKey=row.kind==="line"?"up:buyLine":"up:buyAtk";
    const afford=coins>=row.cost[row.lv];
    if(afford) buyDeny[row.kind]=false;  // 又买得起了 → 恢复正常配色
    pressBox(buyKey, br, ()=>{
      if(row.lv>=row.cost.length){ uiSprite(br,P.upBuy.img,"rgba(80,80,90,.9)","MAX","#cfd6dd"); }
      else if(!afford&&buyDeny[row.kind]){
        // 买不起且点过一次 → 去色(灰度)按钮
        const g=grayImage(P.upBuy.img);
        if(g) ctx.drawImage(g,br.x,br.y,br.w,br.h);
        else uiSprite(br,null,"rgba(115,115,120,.95)");
        if(!uiImgKey(P.upBuy.img)) uiText("UPGRADE", br.x+br.w/2, br.y+br.h*0.72, 11, "#c8c8c8");
      }
      else{
        uiSprite(br,P.upBuy.img,afford?"rgba(40,140,80,.95)":"rgba(80,80,90,.9)");
        if(!uiImgKey(P.upBuy.img)) uiText("UPGRADE", br.x+br.w/2, br.y+br.h*0.72, 11, "#dfffe8");
      }
      // 买不起点击反馈:该行按钮红色闪烁 + 红色外发光,0.4s(随面板震动同步衰减)
      if(denyActive && buyDenyFx.kind===row.kind){
        const k=1-denyAge/0.4;
        const blink=0.6+0.4*Math.sin(denyAge*40);
        ctx.save();
        // 外发光:红描边 + shadowBlur(仅这 0.4s 存在,小面积,光栅可承受)
        ctx.globalAlpha=Math.min(1,1.2*k)*blink;
        ctx.shadowColor="rgba(255,30,30,1)";
        ctx.shadowBlur=34;
        ctx.strokeStyle="#ff2222"; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.roundRect(br.x-3,br.y-3,br.w+6,br.h+6,12);
        ctx.stroke(); ctx.stroke(); ctx.stroke(); ctx.stroke();   // 4 层 stroke 叠浓光晕
        ctx.shadowBlur=0;
        // 按钮面红色闪烁
        ctx.globalAlpha=0.55*k*blink;
        ctx.fillStyle="#ff2222";
        ctx.beginPath(); ctx.roundRect(br.x,br.y,br.w,br.h,10); ctx.fill();
        ctx.restore();
      }
    });
    // 独立部件:金币 + 价格(在按钮上方,不随按钮回弹)。位置可调:P.upPrice.dx/dy
    if(row.lv<row.cost.length){
      const P2=P.upPrice||{dx:0,dy:-16};
      const priceSize=(window.TEXT_CFG&&window.TEXT_CFG.upPrice&&window.TEXT_CFG.upPrice.size)||20;
      const px=br.x+br.w/2+(P2.dx||0), py=br.y+(P2.dy||-16);
      const t=""+row.cost[row.lv], ic=priceSize*1.2, gap=priceSize*0.22;
      ctx.save();
      const priceFont="bold "+priceSize+"px sans-serif";
      const tw=measureTextCached(priceFont,t), total=ic+gap+tw;
      ctx.font=priceFont;
      const sx=px-total/2;
      drawCoinIcon(sx+ic/2, py, ic);
      ctx.textAlign="left"; ctx.textBaseline="middle";
      ctx.fillStyle=afford?"#ffffff":"#ff4444"; // 买不起 → 红色价格
      ctx.fillText(t, sx+ic+gap, py);
      ctx.restore();
    }
  });
  if(upGoFishShown()) pressBox("up:gofish", P.upGoFish, ()=>uiSprite(P.upGoFish, P.upGoFish.img, "rgba(40,140,80,.95)", uiImgKey(P.upGoFish.img)?"":"TAP TO FISH","#eaffe8"));
  pressBox("up:close", P.upClose, ()=>uiSprite(P.upClose, P.upClose.img, "rgba(180,60,60,.9)", uiImgKey(P.upClose.img)?"":"✕","#fff"));
  // 闲置 3s → 手指引导(按买得起状态动态选择目标位置)
  {
    const idleMs = performance.now()-upgradeIdleStart;
    if(idleMs>3000){
      const affordL = lineLv<LINE_COST.length && coins>=LINE_COST[lineLv];
      const affordA = atkLv<3 && coins>=ATK_COST[atkLv];
      // 目标位置列表:两个都买得起 → 双 UPGRADE;只买得起一个 → 那个;都不行 → TAP TO FISH
      const targets=[];
      if(affordL) targets.push(relRect(upRowRect(0), P.upBuy));
      if(affordA) targets.push(relRect(upRowRect(1), P.upBuy));
      if(targets.length===0 && upGoFishShown()) targets.push(P.upGoFish);
      if(targets.length===0){ ctx.restore(); return; }  // 早退也要收掉震动 translate
      // 计算手指基准点(可能带来回移动)
      let fx, fy;
      if(targets.length===1){
        fx=targets[0].x+targets[0].w/2;
        fy=targets[0].y+targets[0].h/2;
      } else {
        // 双目标:每个停留 3s,中间 0.5s 平滑移动
        const STAY=3.0, TRANS=0.5, HALF=STAY+TRANS, CYCLE=2*HALF;
        const t=((idleMs-3000)/1000)%CYCLE;
        let idx, prog;
        if(t<STAY){ idx=0; prog=1; }
        else if(t<HALF){ idx=1; prog=(t-STAY)/TRANS; }
        else if(t<HALF+STAY){ idx=1; prog=1; }
        else { idx=0; prog=(t-HALF-STAY)/TRANS; }
        const ease=1-Math.pow(1-prog,3);
        const tgt=targets[idx], prev=targets[1-idx];
        const tx=tgt.x+tgt.w/2, ty=tgt.y+tgt.h/2;
        const px=prev.x+prev.w/2, py=prev.y+prev.h/2;
        fx=px+(tx-px)*ease; fy=py+(ty-py)*ease;
      }
      // 全体手指位置向右偏 30、向下偏 15
      fx+=30; fy+=15;
      // 呼吸缩放(0.91→1.09,300ms 周期)
      const pulse=1+Math.sin(performance.now()/300)*0.09;
      const fadeIn=Math.min(1,(idleMs-3000)/300);
      ctx.save();
      ctx.translate(fx,fy); ctx.scale(pulse,pulse); ctx.translate(-fx,-fy);
      drawGuideFinger(fx, fy, 66, 0.95*fadeIn);
      ctx.restore();
    }
  }
  ctx.restore();  // 收掉买不起震动的 translate
}
function drawGoalPanel(){
  const P=window.PANEL_UI; drawDimmer();
  uiSprite(P.goalCard, P.goalCard.img, "rgba(12,52,72,.97)");
  if(!uiImgKey(P.goalCard.img)){
    txt("panelTitle","GAME GOAL", P.goalCard.x+P.goalCard.w/2, P.goalCard.y+70);
    txt("panelSub","Catch the Sea King!", P.goalCard.x+P.goalCard.w/2, P.goalCard.y+140);
    uiText("Dive for fish, upgrade your gear.", P.goalCard.x+P.goalCard.w/2, P.goalCard.y+200, 15, "#cfe6f2");
  }
  pressBox("goal:go", P.goalBtn, ()=>uiSprite(P.goalBtn, P.goalBtn.img, "rgba(40,110,180,.95)", uiImgKey(P.goalBtn.img)?"":"GO","#fff"));
}
function drawSettlePanel(){
  const P=window.PANEL_UI; drawDimmer();
  uiSprite(P.setCard, P.setCard.img, "rgba(12,52,72,.97)");
  if(!uiImgKey(P.setCard.img)) txt("panelTitle", settleAnim.wasBoss?"SO CLOSE…":"CATCH", P.setCard.x+P.setCard.w/2, P.setCard.y+56);
  drawCoinNum(P.setCoin.x, P.setCoin.y, "+"+roundValue, "setCoin");
  txt("setBalance","Coins: "+coinsShown(), P.setBalance.x, P.setBalance.y);
  const homeButton=Object.assign({},P.setBtnUp,{img:null});
  pressBox("settle:up",   P.setBtnUp,   ()=>uiSprite(homeButton,   null,   "rgba(40,110,180,.95)", "返回小屋","#fff"));
  pressBox("settle:fish", P.setBtnFish, ()=>uiSprite(P.setBtnFish, P.setBtnFish.img, "rgba(40,140,80,.95)", uiImgKey(P.setBtnFish.img)?"":"CONTINUE","#eaffe8"));
}
function drawCtaPanel(){
  const P=window.PANEL_UI; drawDimmer();
  uiSprite(P.ctaCard, P.ctaCard.img, "rgba(12,52,64,.97)");
  if(!uiImgKey(P.ctaCard.img)){
    txt("panelTitle","UNLOCK DIAMOND HOOK", P.ctaCard.x+P.ctaCard.w/2, P.ctaCard.y+70);
    txt("panelSub","Conquer the Sea King!", P.ctaCard.x+P.ctaCard.w/2, P.ctaCard.y+130);
  }
  const pulse=0.85+Math.sin(T*5)*0.15;
  ctx.save(); ctx.globalAlpha=pulse;
  pressBox("cta:go", P.ctaBtn, ()=>uiSprite(P.ctaBtn, P.ctaBtn.img, "rgba(40,170,90,.98)", uiImgKey(P.ctaBtn.img)?"":"UNLOCK NOW","#fff"));
  ctx.restore();
}
function drawPanels(){
  if(curPanel==="upgrade")drawUpgradePanel();
  else if(curPanel==="goal")drawGoalPanel();
  else if(curPanel==="settle")drawSettlePanel();
  else if(curPanel==="cta")drawCtaPanel();
}
// 引导手指:有 ui_finger 图 → 按尺寸画,指尖对齐 (x,y);无图 → 回退到 👆 emoji
function drawGuideFinger(x,y,size,alpha){
  const im=IMG.ui_finger;
  if(im&&im.width){
    const w=size, h=size*(im.height/im.width);
    ctx.save(); ctx.globalAlpha=alpha!=null?alpha:1;
    ctx.drawImage(im, x-w*0.5, y-h*0.15, w, h); // 指尖偏上,底盘朝下
    ctx.restore();
  } else {
    ctx.save(); ctx.globalAlpha=alpha!=null?alpha:1;
    ctx.font=Math.round(size*0.75)+"px sans-serif"; ctx.textAlign="center";
    ctx.fillText("👆",x,y+size*0.5);
    ctx.restore(); ctx.textAlign="left";
  }
}
// tut_aim 阶段:在 FISH 按钮下面画一层金色呼吸光晕(按钮盖住"内部",视觉上就是纯金色向外呼吸)
function drawCastBtnGlow(){
  if(phase!=="tut_aim") return;
  if(editing()||panelOpen()) return;
  if(!btnVisible("castBtn")) return;
  const r=btnRect("castBtn"); if(!r) return;
  const cx=r.x+r.w/2, cy=r.y+r.h/2;
  const btnR=Math.min(r.w,r.h)/2;
  const pulse=0.5+0.5*Math.sin(T*3.6);                 // 呼吸周期 ~1.75s(比原来快一倍)
  // 半径 + 亮度同时呼吸,幅度大 → 视觉明显
  const glowR=btnR+18+pulse*70;                        // btnR+18 → btnR+88(大幅扩张收缩)
  const peak=0.35+0.65*pulse;                          // 亮度 0.35 → 1.0(明暗)
  const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,glowR);
  const rr=btnR/glowR;
  grad.addColorStop(0.0,"rgba(255,205,60,"+peak.toFixed(3)+")");
  grad.addColorStop(rr,"rgba(255,205,60,"+peak.toFixed(3)+")");
  grad.addColorStop(rr+(1-rr)*0.25,"rgba(255,205,60,"+(peak*0.55).toFixed(3)+")");
  grad.addColorStop(rr+(1-rr)*0.55,"rgba(255,205,60,"+(peak*0.22).toFixed(3)+")");
  grad.addColorStop(rr+(1-rr)*0.80,"rgba(255,205,60,"+(peak*0.07).toFixed(3)+")");
  grad.addColorStop(1.0,"rgba(255,205,60,0)");
  ctx.save();
  ctx.fillStyle=grad;
  ctx.beginPath(); ctx.arc(cx,cy,glowR,0,7); ctx.fill();
  ctx.restore();
}
// 升级按钮虚拟手指提示:按钮"出现后 3 秒内无操作"才显示。轻微呼吸缩放 + 淡入淡出。
// 判定:按钮可见 → 记 idleStart;每次 pointerdown 也刷新 idleStart;now - idleStart ≥ 3s → 手指浮现。
const _upBtnHint={alpha:0, last:0, wasVisible:false, idleStart:0, everShown:false};
let lastTouchAt=performance.now();  // 全局最后交互时间(pointerdown 会刷新)
function drawUpgradeBtnHint(){
  const now=performance.now();
  const dtMs=_upBtnHint.last?Math.min(100, now-_upBtnHint.last):0;
  _upBtnHint.last=now;
  const vis=btnVisible("upgradeBtn");
  // 按钮从"不可见"变"可见"的瞬间 → 从零开始计时
  // 首次出现时直接把 idleStart 回退 3.1s + 拉低 lastTouchAt,让手指立即显示(不等 3s 闲置)
  if(vis && !_upBtnHint.wasVisible){
    if(!_upBtnHint.everShown){
      _upBtnHint.everShown=true;
      _upBtnHint.idleStart=now-3100;
      if(lastTouchAt>now-3100) lastTouchAt=now-3100;
    } else {
      _upBtnHint.idleStart=now;
    }
  }
  _upBtnHint.wasVisible=vis;
  // 任何 pointerdown 会更新 lastTouchAt;取它和 idleStart 的最大值作为"最近一次时间锚"
  const anchor=Math.max(_upBtnHint.idleStart, lastTouchAt);
  const idle=(now-anchor)>=3000;
  const target=(vis && idle)?1:0;
  const speed=3.5/1000;
  const step=Math.min(Math.abs(target-_upBtnHint.alpha), speed*dtMs);
  _upBtnHint.alpha += Math.sign(target-_upBtnHint.alpha)*step;
  if(_upBtnHint.alpha<=0.01) return;
  const r=btnRect("upgradeBtn"); if(!r) return;
  // 手指指尖对准按钮几何中心 (cx, cy)
  // 手指整体向右偏 50px(仅升级商店图标 hint)
  const fx=r.x+r.w/2+50, cy=r.y+r.h/2;
  const pulse=1+Math.sin(now/300)*0.09;
  ctx.save();
  ctx.translate(fx, cy);
  ctx.scale(pulse, pulse);
  ctx.translate(-fx, -cy);
  drawGuideFinger(fx, cy, 56, 0.95*_upBtnHint.alpha);
  ctx.restore();
}
// 按钮出现动画:visible 从 false 转 true 时记录起始时间,用于"从下往上缩放弹出"
const _btnAppear={};
function drawCanvasButtons(){
  const force=window.UI_EDIT_MODE&&!panelOpen();   // UI 编辑(主界面页)→ 强制显示全部按钮便于摆位
  ["upgradeBtn","reelBtn","castBtn","exitBtn"].forEach(id=>{
    // 即使按钮已不可见,只要按下动画还在跑就继续画,让回弹/发亮播完
    const animating=!!pressState("btn:"+id);
    const visible=btnVisible(id);
    if(!force&&!animating&&!visible)return;
    // 追踪 visible 上升沿(false → true)记录起弹时间
    const st=_btnAppear[id]||(_btnAppear[id]={was:false,t0:0});
    if(visible && !st.was){ st.t0=performance.now(); }
    st.was=visible;
    const r=btnRect(id); if(!r)return;
    // upgradeBtn 独享"从下往上缩放弹出"动画;其他按钮不需要
    const APPEAR_DUR=380; // ms
    let appearP=1;
    if(id==="upgradeBtn"){
      const el=performance.now()-st.t0;
      appearP=Math.min(1, Math.max(0, el/APPEAR_DUR));
    }
    // ease-out cubic + 轻微超弹到 1.06 再回到 1.0
    const ease=1-Math.pow(1-appearP,3);
    const scale=appearP<1?(ease*1.06):1;
    ctx.save();
    // 以按钮底边为锚点,从下往上缩放弹出(仅 upgradeBtn 有出现动画,其他 scale=1 无变化)
    ctx.translate(r.x+r.w/2, r.y+r.h);
    ctx.scale(scale,scale);
    ctx.translate(-(r.x+r.w/2), -(r.y+r.h));
    pressBox("btn:"+id, r, ()=>{
      if(id==="reelBtn"&&IMG.coast_ui){
        ctx.save();ctx.translate(r.x,r.y);
        window.CatFishGame.CoastSystem.drawUI(ctx,IMG.coast_ui,3,r.w,r.h);
        ctx.restore();
        uiText("手动收线",r.x+r.w/2,r.y+r.h/2,18,"#fff6d7");
        return;
      }
      const im=uiImg(id);
      if(im) ctx.drawImage(im,r.x,r.y,r.w,r.h);
      else{ // 回退:圆角矩形 + 标签
        const lab={castBtn:"FISH",reelBtn:"REEL",upgradeBtn:"UPGRADE",downloadBtn:"Download",exitBtn:"返回"}[id];
        ctx.fillStyle=id==="downloadBtn"?"rgba(255,160,40,.95)":id==="exitBtn"?"rgba(12,48,65,.9)":"rgba(20,90,130,.95)";
        ctx.beginPath();ctx.roundRect(r.x,r.y,r.w,r.h,Math.min(r.h/2,18));ctx.fill();
        uiText(lab,r.x+r.w/2,r.y+r.h/2,Math.min(16,r.h*0.4),"#fff"); }
      if(id==="reelBtn"){ // 收线数 badge
        uiText(hookedFish.length, r.x+r.w/2, r.y+r.h*0.32, 14, "#ffd966");
      }
      // 升级按钮右上角红点:金币足够任一升级时提示
      if(id==="upgradeBtn"){
        const canBuy = (lineLv<LINE_COST.length && coins>=LINE_COST[lineLv]) || (atkLv<3 && coins>=ATK_COST[atkLv]);
        if(canBuy){
          const dr=Math.max(4, r.h*0.11);
          const dx=r.x+r.w-dr*0.55, dy=r.y+dr*0.55;
          const pulse=1+Math.sin(T*8)*0.12;
          ctx.save();
          ctx.fillStyle="#ffffff";
          ctx.beginPath(); ctx.arc(dx,dy,dr*pulse+1.5,0,7); ctx.fill();
          ctx.fillStyle="#ff3838";
          ctx.beginPath(); ctx.arc(dx,dy,dr*pulse,0,7); ctx.fill();
          ctx.restore();
        }
      }
    });
    ctx.restore();
  });
}
// 统一命中测试:返回动作字符串或 null。优先弹窗,其次按钮。
function uiHitTest(x,y){
  const P=window.PANEL_UI;
  if(curPanel==="upgrade"){
    if(inRect(x,y,P.upClose)) return "up:close";
    if(upGoFishShown()&&inRect(x,y,P.upGoFish)) return "up:gofish";
    if(inRect(x,y,relRect(upRowRect(0),P.upBuy))) return "up:buyLine";
    if(inRect(x,y,relRect(upRowRect(1),P.upBuy))) return "up:buyAtk";
    return "panel:swallow";
  }
  if(curPanel==="goal"){ if(inRect(x,y,P.goalBtn))return "goal:go"; return "panel:swallow"; }
  if(curPanel==="settle"){ if(inRect(x,y,P.setBtnUp))return "settle:up"; if(inRect(x,y,P.setBtnFish))return "settle:fish"; return "panel:swallow"; }
  if(curPanel==="cta"){ if(inRect(x,y,P.ctaBtn))return "cta:go"; return "panel:swallow"; }
  // 无弹窗:主界面按钮
  for(const id of ["exitBtn","upgradeBtn","reelBtn","castBtn"]){
    if(btnVisible(id)&&inRect(x,y,btnRect(id))) return "btn:"+id;
  }
  return null;
}
// 动作分发
// 会切换/关闭面板的按钮保留 90ms 按压确认，反馈清楚但不拖慢连续操作。
const DELAY_ACTIONS=new Set(["goal:go","settle:up","settle:fish","up:close","up:gofish","cta:go","btn:castBtn","btn:reelBtn","btn:upgradeBtn","btn:exitBtn"]);
const pendingUiActions=new Set();
function uiClick(act){
  if(pendingUiActions.has(act))return;
  pressButton(act); // 所有按钮点击触发回弹+发亮动画
  const run=()=>{
    switch(act){
      case "btn:castBtn": startCast(); break;
      case "btn:reelBtn": if(phase==="fishing"||phase==="boss")endRound('manual'); break;
      case "btn:upgradeBtn": audio(); openUpgrade(); break;
      case "btn:downloadBtn": break;
      case "btn:exitBtn": exitFishingToHome(); break;
      case "goal:go": audio(); goalGo(); break;
      case "settle:up": audio(); settleToUpgrade(); break;
      case "settle:fish": audio(); settleContinue(); break;
      case "up:close": audio(); goFishFromPanel(); break;             // ✕ 关闭 → 回到 ready 等玩家点 FISH
      case "up:gofish": audio(); goFishFromPanel(); startCast(); break; // TAP TO FISH → 关面板并直接下钩
      case "up:buyLine": buy("line"); break;
      case "up:buyAtk": buy("atk"); break;
      case "cta:go": setPanel(null); exitFishingToHome(); break;
    }
  };
  if(DELAY_ACTIONS.has(act)){
    pendingUiActions.add(act);
    setTimeout(()=>{pendingUiActions.delete(act);run();},INTERACTION.canvasButtonDelayMs);
  }
  else run();
}

// 引导箭头:红色实心直角三角形(尖朝 boss,底边内凹圆弧)+ 红描边外发光。
// shadowBlur 每帧现画是光栅大户 → 预渲染到离屏 canvas(2×),运行时仅 drawImage。
const ARROW_HW=22, ARROW_BULGE=7, ARROW_PAD=18;   // 半宽 / 底边内凹量 / 发光留白
let _arrowSpr=null;
function arrowSprite(){
  if(_arrowSpr) return _arrowSpr;
  const hw=ARROW_HW, pad=ARROW_PAD;
  const w=hw+pad*2, h=hw*2+pad*2;                 // 局部坐标:底边在 x=0,尖在 x=+hw
  const S=2;
  const oc=document.createElement("canvas");
  oc.width=Math.ceil(w*S); oc.height=Math.ceil(h*S);
  const c=oc.getContext("2d");
  c.scale(S,S);
  c.translate(pad, pad+hw);
  const path=()=>{
    c.beginPath();
    c.moveTo(hw,0);                                // 尖
    c.lineTo(0,hw);                                // 直边 → 底一端
    c.quadraticCurveTo(ARROW_BULGE,0,0,-hw);       // 内凹底边 → 另一端
    c.closePath();
  };
  c.shadowColor="rgba(255,40,40,.95)"; c.shadowBlur=11;
  c.fillStyle="#ff7a5a"; c.lineJoin="round";
  path(); c.fill(); c.fill();                      // 双 fill 叠浓发光
  c.shadowBlur=0;
  c.strokeStyle="#ff2222"; c.lineWidth=2.5;
  path(); c.stroke();                              // 红描边
  _arrowSpr={cv:oc, w, h};
  return _arrowSpr;
}
function drawArrow(x1,y1,x2,y2,col){
  const spr=arrowSprite(); if(!spr) return;
  const ang=Math.atan2(y2-y1,x2-x1);
  const baseD=38;                                  // 底边距钩心距离
  ctx.save();
  ctx.globalAlpha=0.7+0.3*Math.sin(T*6);
  ctx.translate(x1,y1); ctx.rotate(ang); ctx.translate(baseD,0);
  ctx.drawImage(spr.cv, -ARROW_PAD, -(ARROW_HW+ARROW_PAD), spr.w, spr.h);
  ctx.restore();
}
// 新手/阶段引导(和玩法对齐):开局指 FISH 钮 → 下钩后教「按住拖动」→ 海王来了引导撞钩
// 手指淡入淡出:线性 alpha 追踪目标(1=显示 / 0=隐藏),用实时时钟保证冻结时仍能过渡
const _fingerAlpha={tut:0, arc:0, inf:0};
let _fingerLastNow=0, _fingerFrameDt=0;
const FINGER_FADE_SPEED=3.5;
// 每帧开头调一次,用这一帧的 dt 供所有 updateFingerAlpha 共用(避免同帧多次调用 dt≈0)
function _tickFingerFadeClock(){
  const now=performance.now();
  _fingerFrameDt=_fingerLastNow?Math.min(0.1,(now-_fingerLastNow)/1000):0;
  _fingerLastNow=now;
}
function updateFingerAlpha(key,target){
  const cur=_fingerAlpha[key]||0;
  const delta=target-cur;
  const step=Math.min(Math.abs(delta),FINGER_FADE_SPEED*_fingerFrameDt);
  _fingerAlpha[key]=cur+Math.sign(delta)*step;
  return _fingerAlpha[key];
}
function drawGuides(){
  if(boostGuide.active||boostGuide.success)return;
  _tickFingerFadeClock();  // 本帧只算一次 dt,给下面所有 updateFingerAlpha 共用
  if(editing()||panelOpen()){ // 冻结/编辑仍推进 fade 使其自然消失
    updateFingerAlpha("tut",0); updateFingerAlpha("arc",0); updateFingerAlpha("inf",0);
    return;
  }
  const hx=(hook.x-camX)*curZoom, hy=(hook.y-camY)*curZoom;
  // 海王阶段:无引导箭头、无文字提示(需求)—— 保留 fade 归零防其它引导残留
  if(bossFish&&!bossCaught){
    updateFingerAlpha("tut",0); updateFingerAlpha("arc",0); updateFingerAlpha("inf",0);
    return;
  }
  // 开局待机:tap-to-cast 手指(带线性淡入淡出)
  {
    const targetT=(phase==="tut_aim")?1:0;
    const a=updateFingerAlpha("tut",targetT);
    if(a>0.01){
      const r=btnRect("castBtn");
      if(r){ const cx=r.x+r.w/2, cy=r.y+r.h/2;
        // FISH 按钮的手指专门向右偏 70px(仅此处,不影响其他手指)
        const fx=cx+70;
        const pulse=1+Math.sin(performance.now()/300)*0.09;
        ctx.save();
        ctx.translate(fx,cy); ctx.scale(pulse,pulse); ctx.translate(-fx,-cy);
        drawGuideFinger(fx, cy, 60, 0.95*a);
        ctx.restore();
        ctx.save(); ctx.globalAlpha=a;
        txt("guide","TAP TO CAST",cx,r.y-16);
        ctx.restore();
      }
    }
    if(phase==="tut_aim") return;
  }
  // 弧线演示:弧线本身硬切(不淡出),只有手指线性淡入淡出
  const arcActive=(phase==="fishing"&&roundNum===1&&!tutSteerDone&&!tutDemoDismissed&&hook.y>WATER_Y+60);
  if(arcActive)window.CatFishGame.AnalyticsSystem.tutorial('steer','show');
  // 记录弧线引导首次激活时间戳,pointerdown 里靠它算"手指是否已走完一圈"
  if(arcActive && !window.__arcGuideStartAt) window.__arcGuideStartAt=performance.now();
  const aArc=updateFingerAlpha("arc", arcActive?1:0);
  // 计算弧线几何(只有 active 时才有意义,否则用上一帧缓存让手指原地淡出)
  const fingerBuf=(window.__ARC_FINGER_BUF||(window.__ARC_FINGER_BUF={}));
  if(arcActive){
    let tf=(guideFish&&!guideFish.hooked)?guideFish:null;
    if(!tf){ let bd=1e18; for(const f of fishes){ if(f.hooked)continue; const dd=dist(f.x,f.y,hook.x,hook.y); if(dd<bd){bd=dd;tf=f;} } }
    if(tf){
      const bx=(tf.x-camX)*curZoom, by=(tf.y-camY)*curZoom;
      const mx=(hx+bx)/2, my=(hy+by)/2;
      const ddx=bx-hx, ddy=by-hy;
      const len=Math.max(1,Math.hypot(ddx,ddy));
      let nx=-ddy/len, ny=ddx/len;
      if(ny<0){nx=-nx; ny=-ny;}
      const bend=Math.min(120,len*0.35);
      const cpx=mx+nx*bend, cpy=my+ny*bend;
      // 弧线本体:立即显示/隐藏,不参与 fade
      ctx.save();
      ctx.strokeStyle="rgba(255,255,255,.95)"; ctx.lineWidth=3.5; ctx.lineCap="round"; ctx.lineJoin="round";
      // 弧线只画中段(去掉靠近钩和鱼的两端 15%),路径不变、手指仍走全程
      const LINE_TRIM=0.15;
      ctx.beginPath();
      const bez=(t)=>{ const u=1-t; return [u*u*hx+2*u*t*cpx+t*t*bx, u*u*hy+2*u*t*cpy+t*t*by]; };
      const [sxL,syL]=bez(LINE_TRIM);
      ctx.moveTo(sxL,syL);
      const SEG=18;
      for(let i=1;i<=SEG;i++){
        const t=LINE_TRIM+(1-2*LINE_TRIM)*(i/SEG);
        const [px,py]=bez(t);
        ctx.lineTo(px,py);
      }
      ctx.stroke();
      ctx.restore();
      const p=((performance.now()/1400)%1);
      const u=1-p;
      const fx=u*u*hx + 2*u*p*cpx + p*p*bx;
      const fy=u*u*hy + 2*u*p*cpy + p*p*by;
      // 循环末尾 → 起点的跳变用 alpha 线性淡出/淡入:开头淡入 15%,末尾淡出 15%
      const FADE=0.15;
      let cycleA=1;
      if(p<FADE) cycleA=p/FADE;
      else if(p>1-FADE) cycleA=(1-p)/FADE;
      fingerBuf.fx=fx; fingerBuf.fy=fy;
      drawGuideFinger(fx, fy+22, 60, 0.95*aArc*cycleA);
      txt("guide","HOLD & DRAG TO THE FISH",VW/2,VH-72);
    }
  } else if(aArc>0.01 && fingerBuf.fx!=null){
    // 弧线已隐藏,手指在最后位置原地线性淡出
    drawGuideFinger(fingerBuf.fx, fingerBuf.fy+22, 60, 0.95*aArc);
  }
  // 3 秒无操作 → ∞ 路径闲置引导:白色半透明 lemniscate + 手指沿路径循环
  // 触发:fishing 中(非 boss/弧线教学),pointer 已释放且 >3s;hook 处于 swim 状态才有意义
  {
    // 浮动摇杆操作:按下 joy.active=true,松开归 false。松手后累计时间 ≥3s 就出闲置引导
    if(joy.active) window._infLastTapAt=performance.now();
    const idleMs=performance.now()-(window._infLastTapAt||performance.now());
    const infActive=(phase==="fishing")&&!bossFish&&!arcActive&&
                    hook.state==="swim"&&!joy.active&&idleMs>=3000;
    const aInf=updateFingerAlpha("inf", infActive?1:0);
    if(aInf>0.01){
      // 固定在屏幕中下位置(不随鱼钩移动);半宽 100px
      // lemniscate of Bernoulli:x=a·cost/(1+sin²t), y=a·sint·cost/(1+sin²t)
      const cx=VW/2, cy=VH*0.72;
      const A=100;
      ctx.save();
      ctx.strokeStyle="rgba(255,255,255,"+(0.55*aInf).toFixed(3)+")";
      ctx.lineWidth=16; ctx.lineCap="round"; ctx.lineJoin="round";
      ctx.beginPath();
      const SEG=64;
      for(let i=0;i<=SEG;i++){
        const t=i/SEG*Math.PI*2;
        const s=Math.sin(t), c=Math.cos(t);
        const denom=1+s*s;
        const px=cx+A*c/denom;
        const py=cy+A*s*c/denom;
        if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.stroke();
      ctx.restore();
      // ∞ 上方文字:白底黑描边"Drag to Move"(字号扩大 1/2 → 42)
      {
        const sz=42;
        ctx.save();
        ctx.globalAlpha=aInf;
        ctx.font="bold "+sz+"px 'Segoe UI',sans-serif";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        const tx=cx, ty=cy - A*0.55 - sz;
        ctx.lineJoin="round"; ctx.lineWidth=8; ctx.strokeStyle="#000";
        ctx.strokeText("Drag to Move", tx, ty);
        ctx.fillStyle="#fff";
        ctx.fillText("Drag to Move", tx, ty);
        ctx.restore();
      }
      // 手指沿路径循环:3s 一圈
      const LOOP=3000;
      const t=(performance.now()%LOOP)/LOOP*Math.PI*2;
      const s=Math.sin(t), c=Math.cos(t);
      const denom=1+s*s;
      const fx=cx+A*c/denom;
      const fy=cy+A*s*c/denom;
      // 手指的左上角对齐路径中心点 (fx,fy)。drawGuideFinger 内部把 (x,y) 视为
      // "指尖上方"(image top-left = x-w/2, y-h*0.15),所以要 +w/2 和 +h*0.15
      const _fSize=56;
      const _fIm=IMG.ui_finger;
      const _fH=(_fIm&&_fIm.width)?_fSize*(_fIm.height/_fIm.width):_fSize;
      drawGuideFinger(fx+_fSize*0.5, fy+_fH*0.15, _fSize, 0.9*aInf);
    }
  }
}

function drawRoundBasketHUD(){
  if(settleAnim.active)return;
  const source=hookedFish;
  if(!source.length)return;
  const groups=[];
  for(const fish of source){
    const name=fish.catchName||fish.type.name,found=groups.find(item=>item.name===name);
    if(found)found.count++;
    else groups.push({name:name,count:1,type:fish.type});
  }
  const r=ROUND_BASKET_UI;
  ctx.save();
  ctx.fillStyle="rgba(5,31,40,.82)";ctx.strokeStyle="rgba(255,226,151,.82)";ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(r.x,r.y,r.w,r.h,15);ctx.fill();ctx.stroke();
  ctx.fillStyle="#ffe39a";ctx.font="900 12px sans-serif";ctx.textAlign="left";ctx.textBaseline="middle";
  ctx.fillText("▣ 鱼篓  ×"+source.length,r.x+12,r.y+19);
  const shown=groups.slice(0,4);
  shown.forEach((item,index)=>{
    const y=r.y+44+index*24,key="fish_"+item.type.key,img=IMG[key];
    if(img&&img.width)ctx.drawImage(img,r.x+10,y-9,27,18);
    else{ctx.fillStyle=item.type.c1||"#80d7e5";ctx.beginPath();ctx.ellipse(r.x+24,y,13,7,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle="#f5fbf7";ctx.font="bold 10px sans-serif";ctx.textAlign="left";
    const label=item.name.length>6?item.name.slice(0,6)+"…":item.name;
    ctx.fillText(label,r.x+42,y);
    ctx.fillStyle="#ffd77a";ctx.textAlign="right";ctx.fillText("×"+item.count,r.x+r.w-10,y);
  });
  if(groups.length>4){ctx.fillStyle="#adc9c5";ctx.font="9px sans-serif";ctx.textAlign="center";ctx.fillText("还有 "+(groups.length-4)+" 种鱼",r.x+r.w/2,r.y+r.h-8);}
  ctx.restore();
}

/* --- HUD(屏幕坐标,位置/皮肤走 UI_CFG) --- */
function drawHUD(){
  drawRoundBasketHUD();
  // 金币 HUD 三部分:① 底框 hudCoin ② 金币图标 hudCoinIcon(独立,统一 COIN.png)③ 数字
  {
    const r=uiBox("hudCoin"), img=uiImg("hudCoin"), cy=r.y+r.h/2;
    if(img) ctx.drawImage(img,r.x,r.y,r.w,r.h);
    else { ctx.fillStyle="rgba(5,28,42,.72)";ctx.beginPath();ctx.roundRect(r.x,r.y,r.w,r.h,r.h/2);ctx.fill(); }
    // 金币图标(独立 UI 元素,可在编辑器单独调位/缩放)
    let numX=r.x+r.h*0.5;
    const ic=uiBox("hudCoinIcon");
    if(ic){
      // 金币吸收入账时触发一次缩放回弹:1 → 1.35 → 1(sin 半周期,不会先缩小)
      const popAt=window.__hudCoinPop||0;
      const age=(performance.now()-popAt)/1000;
      let scale=1;
      if(age>=0 && age<0.30){
        scale=1+Math.sin(age/0.30*Math.PI)*0.35;
      }
      const w=ic.w*scale, cx=ic.x+ic.w/2, cy2=ic.y+ic.h/2;
      drawCoinIcon(cx, cy2, w);
      numX=ic.x+ic.w+4;   // 数字位置以基础宽算,不随缩放漂移
    }
    if(r.txt) txt("coin", coinsShown(), numX, cy);
  }
  // 目标横幅:开始钓鱼淡入 / 收鱼时淡出(线性 alpha)。UI 编辑模式强制显示,方便摆位。
  {
    const now=performance.now();
    if(!window._hudGoalFade) window._hudGoalFade={v:0,last:now};
    const st=window._hudGoalFade;
    const dtMs=Math.min(100, now-st.last); st.last=now;
    // 收线阶段和结算动画期间都藏(否则 hook 一 idle 又满足条件 → 短暂闪回)
    // 钓鱼/Boss 阶段 + 不在收线 + 没有结算动画 → 显示。移除旧 goalSeen 门槛(在新流程从未被置 true)
    const want = window.UI_EDIT_MODE || ((phase==="fishing"||phase==="boss")&&hook.state!=="retract"&&!settleAnim.active) ? 1 : 0;
    const speed=3.5/1000;                               // 线性,约 285ms 完成过渡
    const step=Math.min(Math.abs(want-st.v), speed*dtMs);
    st.v += Math.sign(want-st.v)*step;
    // 恢复目标横幅"图标"(图片本身即含 TARGET: SEA KING 文字);
    // 只不再叠画程序化 txt("goalBanner",…) 文字,防止和图片自带文字重叠
    if(st.v>0.01){
      const r=uiBox("hudGoal"), img=uiImg("hudGoal");
      ctx.save(); ctx.globalAlpha=st.v;
      if(img) ctx.drawImage(img,r.x,r.y,r.w,r.h);
      else { ctx.fillStyle="rgba(120,20,30,.78)"; ctx.beginPath(); ctx.roundRect(r.x,r.y,r.w,r.h,r.h/2); ctx.fill(); }
      ctx.restore();
    }
  }
  // 鱼线进度条(图=整条槽,等比;填充与文字按盒高居中)
  if(!settleAnim.active){
    const r=uiBox("hudLine"), img=uiImg("hudLine");
    const bx=r.x,by=r.y,bw=r.w,bh=r.h;
    if(lineHL){
      ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(0,0,VW,VH);
      ctx.strokeStyle="rgba(255,217,102,"+(0.7+Math.sin(T*7)*.3)+")";ctx.lineWidth=5;
      ctx.beginPath();ctx.roundRect(bx-8,by-8,bw+16,bh+16,(bh+16)/2);ctx.stroke();
    }
    const ratio=clamp(lineLeft/lineMax,0,1);
    const feel=window.CatFishGame.FishingFeelConfig;
    const lineState=feel?feel.lineState(ratio):(ratio<=.12?"critical":ratio<=.3?"warning":"safe");
    if(img){
      ctx.drawImage(img,bx,by,bw,bh);                          // 图当作整条槽(含边框),等比
    }else{
      ctx.fillStyle="rgba(5,28,42,.72)";ctx.beginPath();ctx.roundRect(bx-6,by-6,bw+12,bh+12,(bh+12)/2);ctx.fill();
      ctx.fillStyle="#0d4a66";ctx.beginPath();ctx.roundRect(bx,by,bw,bh,bh/2);ctx.fill();
    }
    // 填充:槽内留内边距(图模式下避免盖住边框)
    const pad=img?bh*0.22:0, iy=by+pad, ih=bh-pad*2, iw=bw-pad*2, ix=bx+pad;
    // 有 ui_line_fill 图 → 用贴图作为进度条填充(裁切显示 iw*ratio 宽度);无图 → 纯色回退
    if(ratio>0){
      const fillImg=IMG.ui_line_fill;
      ctx.save();
      ctx.beginPath(); ctx.roundRect(ix,iy,iw*ratio,ih,ih/2); ctx.clip();
      if(fillImg&&fillImg.width){
        // 等比缩放到条整宽 iw × 条高 ih;clip 裁掉右侧未占部分
        ctx.drawImage(fillImg, ix, iy, iw, ih);
      } else {
        ctx.fillStyle="#1dc4fe";
        ctx.fillRect(ix, iy, iw, ih);
      }
      ctx.restore();
    }
    if(lineState!=="safe"){
      const pulse=reducedMotion()?1:(.72+Math.sin(T*(lineState==="critical"?10:6))*.28);
      ctx.save();ctx.globalAlpha=(lineState==="critical"?.32:.20)*pulse;
      ctx.fillStyle=lineState==="critical"?"#ff394f":"#ffb52f";
      ctx.beginPath();ctx.roundRect(ix,iy,iw*ratio,ih,ih/2);ctx.fill();
      ctx.strokeStyle=lineState==="critical"?"#ff5366":"#ffd05a";ctx.lineWidth=lineState==="critical"?3:2;
      ctx.beginPath();ctx.roundRect(bx-3,by-3,bw+6,bh+6,(bh+6)/2);ctx.stroke();ctx.restore();
    }
    if(r.txt){ // 分段绘制:白字黑描边;剩余低于一半 → 变黄
      // 显示剩余,不显示已用:从 "LINE: 100 / 100m" → "LINE: 0 / 100m"
      const remain=Math.max(0,Math.round(lineLeft/10)), total=Math.round(lineMax/10);
      const c=txtCfg("line"), size=c.size||16;
      const font="900 "+size+"px sans-serif";
      const seg1="LINE: ", seg2=""+remain, seg3=" / "+total+"m";
      let x=bx+bw/2-(measureTextCached(font,seg1)+measureTextCached(font,seg2)+measureTextCached(font,seg3))/2+(c.dx||0);
      const y=by+bh/2+1+(c.dy||0);
      ctx.save();
      ctx.font=font; ctx.textAlign="left"; ctx.textBaseline="middle";
      ctx.strokeStyle="#000"; ctx.lineWidth=Math.max(1.5,size*0.12); ctx.lineJoin="round";
      const numCol = lineState==="critical"?"#ff6574":lineState==="warning"?"#ffd23e":"#ffffff";
      const seg=(s,col)=>{ ctx.strokeText(s,x,y); ctx.fillStyle=col; ctx.fillText(s,x,y); x+=measureTextCached(font,s); };
      seg(seg1,"#ffffff"); seg(seg2,numCol); seg(seg3,"#ffffff");
      ctx.restore();
    }
    if(lineState==="critical"&&hook.state==="swim"){
      ctx.save();ctx.globalAlpha=reducedMotion()?1:(.78+Math.sin(T*8)*.22);
      ctx.font="900 11px sans-serif";ctx.textAlign="center";ctx.textBaseline="top";
      ctx.strokeStyle="rgba(0,0,0,.85)";ctx.lineWidth=4;ctx.strokeText("鱼线告急 · 准备收线",bx+bw/2,by+bh+7);
      ctx.fillStyle="#ffdf8a";ctx.fillText("鱼线告急 · 准备收线",bx+bw/2,by+bh+7);ctx.restore();
    }
  }

  // (海王血条已移除:海王现为撞钩即通关,无血量机制)

  // 虚拟摇杆：只在玩家按住时出现，不遮挡松手后的航行画面。
  if(joy.active&&JOY_SHOW){
    ctx.save();
    ctx.globalAlpha=.78;
    ctx.fillStyle="rgba(4,28,43,.24)";ctx.beginPath();ctx.arc(joy.bx,joy.by,JOY_R,0,7);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.62)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.bx,joy.by,JOY_R,0,7);ctx.stroke();
    const knobR=18+10*(joy.strength||0);
    ctx.fillStyle="rgba(255,211,91,.88)";ctx.beginPath();ctx.arc(joy.kx,joy.ky,knobR,0,7);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
  }
  // UI 编辑模式:调试面板挂的覆盖层(选框)
  if(window.drawUiEditOverlay) window.drawUiEditOverlay();
  if(window.drawDebugHighlights) window.drawDebugHighlights();
  if(window.drawTipMarkOverlay) window.drawTipMarkOverlay();
}

/* --- 主绘制 --- */
function draw(){
  if(isMainHomeIdle()){
    const c=window.CatFishGame.CoastSystem.camera();camX=c.x;camY=c.y;curZoom=1;
  }
  ctx.save();
  if(shake>0&&!reducedMotion())ctx.translate(rand(-1,1)*shake*9,rand(-1,1)*shake*9);

  // 摄像机:先缩放(镜头更近),再平移到 (camX,camY)
  ctx.save();
  ctx.scale(curZoom,curZoom);
  ctx.translate(-camX|0,-camY|0);
  drawWorld();
  // drawWorld 会按当前动画帧刷新鱼竿尖；用最新锚点再次贴线，消除角色摆动导致的一帧偏差。
  if(hookedFish.length)updateHookedFish(0);
  // 普通鱼
  for(const f of fishes)if(!f.hooked)drawFish(f,false);
  // 捕获鱼压在鱼线下方绘制，看起来像挂在线上并沿轨迹移动。
  for(const f of hookedFish)drawFish(f,true);
  // 水母
  // 海王
  drawBoss();drawGrazeFish();
  // 已捕获的鱼不再挂在鱼钩上绘制。
  drawHook();
  window.CatFishGame.CoastSystem.drawCharacter(ctx,IMG,T,hook.state);
  // 旧海浪与水面过渡层已停用，地图原画直接作为最终水面。
  // 粒子/飘字
  for(const p of particles){ctx.globalAlpha=1-p.t/p.life;ctx.fillStyle=p.c;
    ctx.fillRect(p.x-3,p.y-3,6,6);ctx.globalAlpha=1;}
  for(const p of pops){
    ctx.globalAlpha=1-p.t/1.2;
    const pc=txtCfg("pop"), ps=(pc.size||19)*(p.big?1.25:1), px=p.x+(pc.dx||0), py=p.y-p.t*42+(pc.dy||0);
    ctx.font="bold "+ps+"px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    if(pc.stroke&&pc.sw>0){ ctx.strokeStyle=pc.stroke; ctx.lineWidth=pc.sw; ctx.strokeText(p.txt,px,py); }
    ctx.fillStyle=p.color||pc.fill||"#ffd966"; ctx.fillText(p.txt,px,py);
    ctx.globalAlpha=1;
  }
  ctx.restore();

  if(impactFlash>0){
    ctx.save();ctx.globalAlpha=Math.min(.13,impactFlash*.65);ctx.fillStyle="rgb("+impactFlashColor+")";ctx.fillRect(0,0,VW,VH);ctx.restore();
  }

  drawSettleAnim();  // 屏幕坐标层:飞行的鱼 + 金币粒子
  if(!isMainHomeIdle()){
    window.CatFishGame.CoastSystem.hud(ctx,lineLeft,lineMax,hook.y-WATER_Y,hook.state==="retract");
    window.CatFishGame.DepthSystem.hud(ctx,hook.y-WATER_Y,hook.state==="retract");
    drawBoostGuide();
    drawCanvasButtons();
  }
  drawPanels();          // Canvas 弹窗(goal/settle/upgrade/cta,最上层)
  ctx.restore();
}

/* ================================================================
   DOM 流程(结算/升级/CTA)
   ================================================================ */
function showSettle(wasBoss){
  settleAnim.wasBoss=wasBoss;   // drawSettlePanel 读它显示标题
  if(roundNum===1&&!tutUpgradeDone) alEvent("CHALLENGE_PASS_25");
  setPanel("settle");
}
function settleToUpgrade(){
  setPanel(null);
  if(bossEverSeen){bossDone=true;forcedStep=0;bossFish=null;}
  syncProgression();
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.RETURNED_HOME,{round:roundNum,value:roundValue,reason:"settlement",save:progressionSave});
  window.CatFishGame.HomeSystem.show();
}
function settleContinue(){
  // 新手未升级 / boss 回合 → 强制走升级,不允许直接继续
  if((roundNum===1&&!tutUpgradeDone)||settleAnim.wasBoss){ settleToUpgrade(); return; }
  setPanel(null);
  preRound();
}

// 升级面板闲置计时:面板打开 + 每次面板内的点击都刷新;闲置 3s 后开始出现手指引导
let upgradeIdleStart=0;
let _upPanelEverOpened=false;
function bumpUpgradeIdle(){ upgradeIdleStart=performance.now(); }
function openUpgrade(){
  // 正式游戏的升级入口位于局外小屋，局内不再打开旧升级面板。
  if(window.CatFishGame.HomeSystem){window.CatFishGame.HomeSystem.show();return;}
  setPanel("upgrade");
  // 首次开面板:idleStart 回退 3.1s 让手指立即出现;之后开面板走正常 3s 闲置
  if(!_upPanelEverOpened){
    _upPanelEverOpened=true;
    upgradeIdleStart=performance.now()-3100;
  } else {
    bumpUpgradeIdle();
  }
}
const buyDeny={line:false,atk:false}; // 买不起被点过一次 → 按钮去色,直到又买得起
const buyDenyFx={kind:null,at:0};     // 买不起点击的即时反馈:按钮闪红 + 面板震动(0.4s)
function buy(kind){
  const analyticsBefore={level:kind==='line'?lineLv:atkLv,coins:coins};
  if(window.PANEL_EDIT_MODE||window.UI_EDIT_MODE)return;   // 编辑时不触发购买
  audio();
  if(kind==="line"&&lineLv<LINE_COST.length&&economyWallet.spend(LINE_COST[lineLv],"line_upgrade").ok){
    lineLv++;
    // 实时应用:立即扩容线长上限,同步补齐剩余量
    const prevMax=lineMax;
    lineMax=LINE_LV[lineLv]*(TURBO?.3:1);
    lineLeft=Math.min(lineMax, lineLeft+(lineMax-prevMax));
  }
  else if(kind==="atk"&&atkLv<3&&economyWallet.spend(ATK_COST[atkLv],"hook_upgrade").ok){atkLv++;}
  else {
    // 买不起:按钮去色 + 本次点击反馈(按钮闪红 + 面板震一下)
    if(kind==="line"&&lineLv<LINE_COST.length)buyDeny.line=true;
    if(kind==="atk"&&atkLv<3)buyDeny.atk=true;
    buyDenyFx.kind=kind; buyDenyFx.at=performance.now();
    try{SFX.coinLack();}catch(e){}   // 金币不足反馈音
    return;
  }
  // 升级成功 → 记录图标回弹时间戳(drawToolIcon 里读)
  window.__iconBounce=window.__iconBounce||{};
  window.__iconBounce[kind]=performance.now();
  SFX.upgrade();
  syncProgression();
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.UPGRADE_PURCHASED,{
    kind:kind,
    previousLevel:analyticsBefore.level,cost:analyticsBefore.coins-coins,
    level:kind==="line"?lineLv:atkLv,
    save:progressionSave
  });
  if(roundNum===1&&!tutUpgradeDone){ tutUpgradeDone=true; return; }  // 升一次即解锁 TAP TO FISH(upGoFishShown 控制)
}
// 局外小屋的窄桥接：沿用相同的钱包、等级上限和存档，不让 HomeSystem 接触钓鱼状态。
let homeMapEntered=false;
function exitFishingToHome(){
  // 退出仅允许在鱼钩尚未下水时触发，作为 UI 可见条件之外的二次保护。
  if(hook.state!=="idle"||!(phase==="ready"||phase==="tut_aim"))return;
  joy.active=false;
  controlOn=false;
  setPanel(null);
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.RETURNED_HOME,{round:roundNum,value:roundValue,reason:"manual_exit",save:progressionSave});
  window.CatFishGame.HomeSystem.show();
}
function upgradeFromHome(kind){
  const target=kind==="line"?"line":kind==="hook"?"atk":null;
  if(!target)return {ok:false,reason:"unknown_upgrade"};
  const level=target==="line"?lineLv:atkLv;
  const costs=target==="line"?LINE_COST:ATK_COST;
  if(level>=costs.length)return {ok:false,reason:"max_level"};
  const result=economyWallet.spend(costs[level],target+"_upgrade");
  if(!result.ok)return {ok:false,reason:"insufficient_coins"};
  if(target==="line"){
    lineLv++;
    const previousMax=lineMax;
    lineMax=LINE_LV[lineLv]*(TURBO?.3:1);
    lineLeft=Math.min(lineMax,lineLeft+(lineMax-previousMax));
  }else atkLv++;
  syncProgression();
  try{SFX.upgrade();}catch(e){}
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.UPGRADE_PURCHASED,{
    kind:target,level:target==="line"?lineLv:atkLv,previousLevel:level,cost:costs[level],source:"home",save:progressionSave
  });
  return {ok:true,kind:target,level:target==="line"?lineLv:atkLv};
}
function getFacilityStateFromHome(facilityId){
  return window.CatFishGame.FacilitySystem.getView(progressionSave,facilityId);
}
function upgradeFacilityFromHome(facilityId){
  const facility=getFacilityStateFromHome(facilityId);
  if(!facility)return {ok:false,reason:"unknown_facility"};
  if(facility.isMax)return {ok:false,reason:"max_level",facility:facility};
  if(facility.linkedUpgrade){
    const result=upgradeFromHome(facility.linkedUpgrade);
    return Object.assign({},result,{facility:getFacilityStateFromHome(facilityId)});
  }
  const payment=economyWallet.spend(facility.nextCost,"facility_"+facilityId);
  if(!payment.ok)return {ok:false,reason:"insufficient_coins",facility:facility};
  window.CatFishGame.FacilitySystem.setLevel(progressionSave,facilityId,facility.level+1);
  syncProgression();
  try{SFX.upgrade();}catch(e){}
  const updated=getFacilityStateFromHome(facilityId);
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.UPGRADE_PURCHASED,{kind:"facility",facilityId:facilityId,level:updated.level,previousLevel:facility.level,cost:facility.nextCost,source:"home",save:progressionSave});
  return {ok:true,kind:"facility",facility:updated};
}
window.CatFishGame.GameSession=Object.freeze({
  careCat:kind=>{
    if(window.CatFishGame.SceneRouterSystem.get().scene!=="interior"||!sessionSafety.canInteract())return {ok:false,reason:"unavailable"};
    return window.CatFishGame.CatCareSystem.interact(kind,progressionSave,economyWallet,syncProgression);
  },
  claimHarvestDouble:result=>{
    if(!result||result!==claimableHarvest||result.doubled||!(result.value>0))return {ok:false};
    result.doubled=true;economyWallet.add(result.value,"fishing_round_double");syncProgression();return {ok:true,amount:result.value};
  },
  getSave:()=>progressionSave,
  getProgress:()=>({coins:coins,rodLevel:lineLv,hookLevel:atkLv,nextRodCost:lineLv<LINE_COST.length?LINE_COST[lineLv]:null,nextHookCost:atkLv<3?ATK_COST[atkLv]:null}),
  getFacilityState:getFacilityStateFromHome,
  upgrade:upgradeFromHome,
  upgradeFacility:upgradeFacilityFromHome,
  startFromHome:function(mapId){
    if(paused||!sessionSafety.canInteract()||editing()||hook.state!=="idle")return false;
    if(homeMapEntered&&(!controlOn||(phase!=="ready"&&phase!=="tut_aim")))return false;
    const map=window.CatFishGame.MapConfig.getById(mapId);
    if(!map)return false;
    window.CatFishGame.activeMapId=map.id;
    window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.MAP_ENTERED,{mapId:map.id,mapName:map.name,source:"home_pier",save:progressionSave});
    setPanel(null);
    // 首次出海创建第1轮；返航结算已经预备好下一轮，再次出海不能重复递增。
    if(!homeMapEntered)preRound();
    homeMapEntered=true;
    const started=startCast();
    if(started)claimableHarvest=null;
    return started;
  },
  enterMap:function(mapId){
    const map=window.CatFishGame.MapConfig.getById(mapId);
    if(!map)return false;
    window.CatFishGame.activeMapId=map.id;
    window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.MAP_ENTERED,{mapId:map.id,mapName:map.name,save:progressionSave});
    if(homeMapEntered){setPanel(null);preRound();}
    homeMapEntered=true;
    return true;
  }
});
// 升级面板「TAP TO FISH」/ X 关闭:收起面板,首次则开局
function goFishFromPanel(){
  if(window.PANEL_EDIT_MODE)return;
  setPanel(null);
  if(!goalSeen)preRound();
}
function goalGo(){ setPanel(null); startRound(); }
function preRound(){
  goalSeen=true;          // 保留标志:HUD 横幅 / 兜底逻辑仍引用
  startRound();
}
/* ---------- 初始化 ---------- */
function init(){
  initPopulation();
  // 真正从码头出发时才进入第1轮，避免首轮在结果页显示为第2轮。
  roundNum=0;
  lineMax=LINE_LV[lineLv]*(TURBO?.3:1);lineLeft=lineMax;lineDrain=false;
  hook.x=castX();hook.y=WATER_Y-30;hook.state="idle";hook.vx=0;hook.vy=0;
  curZoom=tarZoom=1;
  camX=window.CatFishGame.CoastSystem.camera().x; camY=window.CatFishGame.CoastSystem.camera().y;  // 镜头以鱼竿尖(=hook 起始位置)为中央
  phase="intro";introT=0;
  window.CatFishGame.GameEvents.emit(window.CatFishGame.GameEvents.EVENTS.GAME_STARTED,{
    coins:coins,
    rodLevel:lineLv,
    hookLevel:atkLv,
    cat:progressionSave.cat,
    save:progressionSave
  });
}
init();

/* ---------- 主循环 ---------- */
let last=performance.now(),displayed=false,lastIdleCanvasFrame=0;
let nativeHarvestScene=null;
function idleCanvasInterval(){
  if(!isMainHomeIdle())return 0;
  const route=window.CatFishGame.SceneRouterSystem&&window.CatFishGame.SceneRouterSystem.get();
  const overlay=window.CatFishGame.OverlayManagerSystem&&window.CatFishGame.OverlayManagerSystem.get();
  // Canvas settlement animation must not inherit the 8 FPS background throttle.
  if(window.WeChatHost&&overlay&&overlay.active==='harvest')return 1000/30;
  const covered=!!(overlay&&overlay.active)||!!(route&&["map","collection","bag"].includes(route.scene));
  return 1000/(covered?INTERACTION.performance.coveredCanvasFps:INTERACTION.performance.homeCanvasFps);
}
function drawCoastLoading(progress,now){
  document.body.classList.add("maomao-loading");
  const LU=window.LOADING_UI||{};
  const titleY=LU.titleY??28,titleW=LU.titleW??350,titleH=LU.titleH??220;
  const pierX=LU.pierX??-112,pierY=LU.pierY??430,pierW=LU.pierW??570;
  const catX=LU.catX??130,catY=LU.catY??330,catSize=LU.catSize??280;
  const barX=LU.barX??65,barY=LU.barY??755,barW=LU.barW??410,barH=LU.barH??58;
  const p=Math.max(0,Math.min(1,progress||0));

  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(cvs.width/VW,cvs.width/VW);

  // 即使首张图片还未解码，也立即显示同色系背景，避免黑屏。
  const fallback=ctx.createLinearGradient(0,0,0,VH);
  fallback.addColorStop(0,"#4dc9f5");
  fallback.addColorStop(.52,"#26b8e7");
  fallback.addColorStop(1,"#087db9");
  ctx.fillStyle=fallback;ctx.fillRect(0,0,VW,VH);
  const surface=IMG.coast_surface;
  if(surface&&surface.width){
    const sc=Math.max(VW/surface.width,VH/surface.height);
    const dw=surface.width*sc,dh=surface.height*sc;
    ctx.drawImage(surface,(VW-dw)/2,(VH-dh)/2,dw,dh);
  }

  // 海面轻微光斑，让加载画面保持活力但不干扰信息阅读。
  for(let i=0;i<5;i++){
    const sx=54+((i*113+now*.012)%470),sy=600+Math.sin(now/520+i*1.4)*18+i*22;
    const a=.18+.12*Math.sin(now/430+i);
    ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.sin(now/700+i)*.18);
    ctx.fillStyle=`rgba(255,255,235,${Math.max(.06,a)})`;
    ctx.beginPath();ctx.moveTo(0,-9);ctx.quadraticCurveTo(2,-2,10,0);ctx.quadraticCurveTo(2,2,0,9);ctx.quadraticCurveTo(-2,2,-10,0);ctx.quadraticCurveTo(-2,-2,0,-9);ctx.fill();ctx.restore();
  }

  // 木码头与初始猫咪使用首页同一套美术资源。
  const pier=IMG.coast_pier;
  if(pier&&pier.width){
    const ph=pierW*(pier.height/pier.width);
    ctx.drawImage(pier,pierX,pierY,pierW,ph);
  }
  const cat=IMG.coast_cat;
  if(cat&&cat.width){
    const bob=Math.sin(now/620)*2.5;
    ctx.drawImage(cat,0,0,cat.width,cat.height,catX,catY+bob,catSize,catSize);
  }

  // 标题木牌取自统一 UI 图集；素材未到时使用同风格手绘木牌兜底。
  const plaqueX=(VW-titleW)/2;
  const ui=IMG.coast_ui;
  if(ui&&ui.width){
    ctx.drawImage(ui,0,ui.height*.035,ui.width*.258,ui.height*.205,plaqueX,titleY,titleW,titleH);
  }else{
    ctx.save();ctx.shadowColor="rgba(39,76,93,.38)";ctx.shadowBlur=15;ctx.shadowOffsetY=8;
    ctx.fillStyle="#9a4f2d";ctx.strokeStyle="#63301f";ctx.lineWidth=7;
    ctx.beginPath();ctx.roundRect(plaqueX+16,titleY+50,titleW-32,titleH-92,22);ctx.fill();ctx.stroke();ctx.restore();
  }
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";
  ctx.strokeStyle="#754020";ctx.lineWidth=9;ctx.fillStyle="#fff0b2";
  ctx.font="900 43px 'Microsoft YaHei','PingFang SC',sans-serif";
  ctx.strokeText("猫与鱼",VW/2,titleY+105);ctx.fillText("猫与鱼",VW/2,titleY+105);
  ctx.strokeStyle="#754020";ctx.lineWidth=5;ctx.fillStyle="#ffd56e";
  ctx.font="800 20px 'Microsoft YaHei','PingFang SC',sans-serif";
  ctx.strokeText("潮 汐 码 头",VW/2,titleY+148);ctx.fillText("潮 汐 码 头",VW/2,titleY+148);

  // 木框进度条：深色槽、绿色填充、高光和清晰百分比。
  ctx.save();ctx.shadowColor="rgba(17,75,91,.42)";ctx.shadowBlur=16;ctx.shadowOffsetY=8;
  ctx.fillStyle="#6f351f";ctx.strokeStyle="#3e2419";ctx.lineWidth=5;
  ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,barH/2);ctx.fill();ctx.stroke();ctx.restore();
  const inset=8,ix=barX+inset,iy=barY+inset,iw=barW-inset*2,ih=barH-inset*2;
  ctx.fillStyle="#3b2c24";ctx.beginPath();ctx.roundRect(ix,iy,iw,ih,ih/2);ctx.fill();
  if(p>0){
    ctx.save();ctx.beginPath();ctx.roundRect(ix,iy,iw,ih,ih/2);ctx.clip();
    const fill=ctx.createLinearGradient(0,iy,0,iy+ih);
    fill.addColorStop(0,"#d7f45b");fill.addColorStop(.48,"#8fd62d");fill.addColorStop(1,"#55a91e");
    ctx.fillStyle=fill;ctx.fillRect(ix,iy,Math.max(ih,iw*p),ih);
    ctx.fillStyle="rgba(255,255,255,.3)";ctx.fillRect(ix+8,iy+5,Math.max(0,iw*p-16),7);ctx.restore();
  }
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 22px 'Microsoft YaHei','PingFang SC',sans-serif";
  ctx.strokeStyle="#53301f";ctx.lineWidth=5;ctx.fillStyle="#fff7d2";
  const pct=Math.round(p*100)+"%";ctx.strokeText(pct,VW/2,barY+barH/2+1);ctx.fillText(pct,VW/2,barY+barH/2+1);

  let status=p<.3?"正在整理鱼竿":p<.62?"正在准备鱼篓":p<.9?"正在观察海面":"准备出海";
  const dots=".".repeat(Math.floor(now/420)%4);
  ctx.fillStyle="#fff7dc";ctx.strokeStyle="rgba(87,53,35,.78)";ctx.lineWidth=5;
  ctx.font="800 21px 'Microsoft YaHei','PingFang SC',sans-serif";
  ctx.strokeText(status+dots,VW/2,LU.messageY??842);ctx.fillText(status+dots,VW/2,LU.messageY??842);
  ctx.fillStyle="rgba(255,250,224,.94)";ctx.strokeStyle="rgba(30,90,111,.72)";ctx.lineWidth=4;
  ctx.font="700 15px 'Microsoft YaHei','PingFang SC',sans-serif";
  const tip="小提示：礁石会阻挡鱼钩，可以沿边绕行";
  ctx.strokeText(tip,VW/2,LU.tipY??892);ctx.fillText(tip,VW/2,LU.tipY??892);
  ctx.textAlign="right";ctx.fillStyle="rgba(255,255,255,.72)";ctx.font="700 13px sans-serif";ctx.fillText("v0.33",VW-18,VH-17);
  ctx.restore();
}
function loop(now){
  // 素材未全部加载完 或 finalizeLoading 未跑完(iOS Safari decode 延迟)→ 只画纯色底
  // iOS 上 onload 会先于 data URI 真正解码触发,若不等 finalize 完成就跑 update/draw,
  // ensureRockMask 会用未解码的图建 mask,得到全零 grid 并永久缓存 → 碰撞失效
  // 停留条件:资源没加载完 / finalize 没跑完 / 预览模式 / 平滑进度还没到 100%
  // (最后一条保证条子必须视觉滚到 100% 才进游戏,而不是加载完立刻切走)
  const _smoothedP = (window.__loadProg && window.__loadProg.v) || 0;
  if(pending>0 || !window._loadingFinalized || window.CatFishGame.PlatformSystem.isBlocking() || window.__loadingPreview || _smoothedP<0.999){
    // 加载界面:深色底 + 标题 + 进度条 + 百分比
    // 进度用 asset 加载比例;pending==0 但 finalize 未完(iOS decode 中)封顶 98% 表达"快好了"
    const total=Object.keys(ASSET_LIST).length;
    const loadedRatio = total>0 ? (total-pending)/total : 1;
    let target = loadedRatio;
    if(pending===0 && !window._loadingFinalized) target=Math.min(0.98, Math.max(0.9, loadedRatio));
    // 平滑:每帧朝目标 lerp,避免瞬跳
    const lp = window.__loadProg||(window.__loadProg={v:0,last:now});
    const dtMs=Math.min(100, now-lp.last); lp.last=now;
    lp.v += (target-lp.v) * Math.min(1, dtMs/120);
    // 预览模式:调试面板"⏳加载"tab 激活时强制 p=0.5,便于实时看条与遮罩/星星
    const p = window.__loadingPreview ? 0.5 : Math.max(0,Math.min(1,lp.v));

    // 与首页共用海边资源，首张图未解码时也会立即绘制渐变兜底。
    drawCoastLoading(p,now);
    last=now;if(!displayed){displayed=true;alEvent("DISPLAYED");}requestAnimationFrame(loop);return;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    const S=cvs.width/VW;
    ctx.scale(S,S);
    // 加载界面素材没齐(bg/框/条/遮罩任一未就绪)→ 只画纯深色底,不出"占位符"半成品 UI
    const bgImg = (typeof IMG!=="undefined") && IMG.bg_loading;
    const _lf=(typeof IMG!=="undefined")&&IMG.ui_loading_frame;
    const _lfil=(typeof IMG!=="undefined")&&IMG.ui_loading_fill;
    const _lmask=(typeof IMG!=="undefined")&&IMG.ui_loading_mask;
    const loadingAssetsReady = bgImg&&bgImg.width && _lf&&_lf.width && _lfil&&_lfil.width && _lmask&&_lmask.width;
    if(!loadingAssetsReady){
      const bg=ctx.createLinearGradient(0,0,0,VH);
      bg.addColorStop(0,"#0d2233"); bg.addColorStop(1,"#03101a");
      ctx.fillStyle=bg; ctx.fillRect(0,0,VW,VH);
      ctx.restore();
      last=now;
      if(!displayed){displayed=true;alEvent("DISPLAYED");}
      requestAnimationFrame(loop);
      return;
    }
    // 背景 cover 模式:等比缩放填满屏幕(可能裁剪),保持画面完整感
    {
      const iw=bgImg.width, ih=bgImg.height;
      const sc=Math.max(VW/iw, VH/ih);
      const dw=iw*sc, dh=ih*sc, dx=(VW-dw)/2, dy=(VH-dh)/2;
      ctx.drawImage(bgImg, dx, dy, dw, dh);
    }
    // 加载条框:用 Loading_.png(内嵌"Loading..."标题 + 金框进度条槽)
    // 图片本地坐标:948×404,进度条内槽区约 x[0.105,0.949] y[0.458,0.676]
    const loadingFrame = (typeof IMG!=="undefined") && IMG.ui_loading_frame;
    // 尺寸:2/3 基础上再放大 1/3(500 * 2/3 * 4/3 ≈ 444);位置:水平居中,垂直 85% 处
    // 新版 Loading_.png 尺寸 948×301
    // 新 frame 图尺寸 909×294 → 按此计算高宽比
    const imgW=Math.round(500*2/3*4/3), imgH=imgW*294/909;
    const imgX=(VW-imgW)/2, imgY=VH*0.85-imgH/2;
    // 内槽在屏幕上的坐标 —— 走 LOADING_UI 配置(可在调试面板 ⏳加载 调整)
    const LU=window.LOADING_UI||{fillW:0.898,fillH:0.25,fillDX:0,fillDY:0,starSize:60};
    const bw=imgW*LU.fillW, bh=imgH*LU.fillH;
    const bx=imgX+(imgW-bw)/2+(LU.fillDX||0);
    const by=imgY+(imgH-bh)/2+(LU.fillDY||0);
    // 先画框图(框内槽是不透明深蓝底),然后进度填充**画在框之上**,防止被深蓝底盖掉
    if(loadingFrame && loadingFrame.width){
      ctx.drawImage(loadingFrame, imgX, imgY, imgW, imgH);
    } else {
      ctx.strokeStyle="rgba(255,215,120,.9)"; ctx.lineWidth=3;
      ctx.beginPath(); ctx.roundRect(bx-4,by-4,bw+8,bh+8,(bh+8)/2); ctx.stroke();
    }
    // 进度填充:用 等待.png(ui_loading_mask)作为形状遮罩(白=显示,黑=隐藏)
    // 流程:
    // ① 把 mask 一次性预处理成"白 → alpha 255、黑 → alpha 0"的 alpha canvas(缓存 window.__loadMaskA)
    // ② 每帧:在离屏 canvas 上画满进度条填充图 + destination-in 应用遮罩,得到"只保留白区形状"的填充
    // ③ 用左对齐的进度宽度 clip 从左往右灌到主画布
    // 填充图整体放大到 1.5×,溢出被遮罩剪掉
    if(p>0){
      const fillImg=(typeof IMG!=="undefined") && IMG.ui_loading_fill;
      const maskImg=(typeof IMG!=="undefined") && IMG.ui_loading_mask;
      // 预处理 mask:把亮度写进 alpha,便于用 destination-in 直接 mask。
      // iOS 教训:加载期图片 onload 已触发但没真正解码好,drawImage 会静默产出全黑
      // → alpha 全 0 的 maskA 被永久缓存,destination-in 把填充全擦掉 = 条子从此消失。
      // 修:构建后抽样验证,有白色像素才缓存;全黑则本帧放弃,下帧重试(直到解码好)。
      if(maskImg && maskImg.width && !window.__loadMaskA){
        try{
          const mc=document.createElement("canvas");
          mc.width=maskImg.width; mc.height=maskImg.height;
          const mcx=mc.getContext("2d");
          mcx.drawImage(maskImg,0,0);
          const im=mcx.getImageData(0,0,mc.width,mc.height), d=im.data;
          let hasWhite=false;
          for(let i=0;i<d.length;i+=4){
            d[i+3]=d[i];   // alpha = R(灰度图 R≈亮度)
            if(d[i]>128) hasWhite=true;
          }
          if(hasWhite){
            mcx.putImageData(im,0,0);
            window.__loadMaskA=mc;
          }
        }catch(e){}
      }
      const maskA=window.__loadMaskA;
      if(fillImg && fillImg.width && maskA){
        // 离屏合成:离屏尺寸 = 进度条框整张(imgW×imgH),这样 mask 的白色区域正好落在
        // frame 的内槽位置。之前离屏取 slot 大小 → mask 的白色带被压得非常薄,填充就只剩细线。
        const oc=window.__loadFillFrame || (window.__loadFillFrame=document.createElement("canvas"));
        const OW=Math.max(1, Math.ceil(imgW)), OH=Math.max(1, Math.ceil(imgH));
        if(oc.width!==OW) oc.width=OW; if(oc.height!==OH) oc.height=OH;
        const ocx=oc.getContext("2d");
        ocx.clearRect(0,0,OW,OH);
        // 画填充铺满整张离屏(mask 会剪出白色形状,再交给主画布 clip 控制进度宽)
        // 条图缩放/偏移:LOADING_UI.fillImgW/H/DX/DY,以离屏中心为锚
        const fW=OW*(LU.fillImgW||1), fH=OH*(LU.fillImgH||1);
        const fX=(OW-fW)/2+(LU.fillImgDX||0), fY=(OH-fH)/2+(LU.fillImgDY||0);
        // 源矩形按比例取(原 1024×1024 里的 61,442,901,138):导出降采样后图会变小,
        // 写死像素坐标会切错区域 → 条子消失。比例化后任何尺寸都切对
        const sW=fillImg.naturalWidth||fillImg.width, sH=fillImg.naturalHeight||fillImg.height;
        ocx.drawImage(fillImg, sW*0.0596, sH*0.4316, sW*0.8799, sH*0.1348, fX,fY, fW,fH);
        ocx.globalCompositeOperation="destination-in";
        // mask 尺寸/位置也走 LOADING_UI:整体缩放 + 偏移(相对离屏中心)
        const mW=OW*(LU.maskW||1), mH=OH*(LU.maskH||1);
        const mX=(OW-mW)/2+(LU.maskDX||0), mY=(OH-mH)/2+(LU.maskDY||0);
        ocx.drawImage(maskA, mX,mY, mW,mH);
        ocx.globalCompositeOperation="source-over";
        // 主画布:左对齐 clip 到进度宽度,把整张离屏绘到 frame 位置
        ctx.save();
        ctx.beginPath(); ctx.rect(bx, by, bw*p, bh); ctx.clip();
        ctx.drawImage(oc, imgX, imgY, imgW, imgH);
        ctx.restore();
      } else {
        // 图未就绪的回退:纯蓝渐变 + 圆角矩形裁剪
        ctx.save();
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh/2); ctx.clip();
        ctx.beginPath(); ctx.rect(bx, by, bw*p, bh); ctx.clip();
        const fg=ctx.createLinearGradient(0,by,0,by+bh);
        fg.addColorStop(0,"#7ce6ff"); fg.addColorStop(1,"#1dc4fe");
        ctx.fillStyle=fg; ctx.fillRect(bx,by,bw,bh);
        ctx.restore();
      }
    }
    // (百分比数字已按需求移除)
    // ★ 进度条前端竖向发光四角星:先在离屏上画,再对左侧做羽化(destination-out 渐变擦除),最后贴到主画布
    if(p>0 && p<1){
      const sx=bx+bw*p, sy=by+bh/2+(LU.starDY||0), S=LU.starSize||60;
      const OSS=Math.ceil(S*4), cx=OSS/2, cy=OSS/2;
      const soc=window.__loadStarOC||(window.__loadStarOC=document.createElement("canvas"));
      if(soc.width!==OSS) soc.width=OSS;
      if(soc.height!==OSS) soc.height=OSS;
      const stx=soc.getContext("2d");
      stx.clearRect(0,0,OSS,OSS);
      // 1) 蓝色光晕(多层径向渐变):增加中间过渡 stop、终点提前变 0,边缘更柔
      for(const [r,a] of [[S*2.2,0.22],[S*1.4,0.45],[S*0.8,0.75]]){
        const g=stx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0.0,`rgba(220,245,255,${a})`);
        g.addColorStop(0.3,`rgba(140,215,255,${a*0.7})`);
        g.addColorStop(0.55,`rgba(80,190,255,${a*0.35})`);
        g.addColorStop(0.8,`rgba(60,170,255,${a*0.08})`);
        g.addColorStop(1.0,"rgba(60,170,255,0)");
        stx.fillStyle=g;
        stx.beginPath(); stx.arc(cx,cy,r,0,Math.PI*2); stx.fill();
      }
      // 2) 竖向光柱:改为"横向也软"的径向渐变 + scale 拉长,消除原椭圆的硬横边
      {
        stx.save();
        stx.translate(cx,cy);
        stx.scale(0.28, 1.6);   // 横向压扁 + 纵向拉长
        const g=stx.createRadialGradient(0,0,0, 0,0, S);
        g.addColorStop(0.0,"rgba(220,245,255,0.75)");
        g.addColorStop(0.35,"rgba(160,225,255,0.45)");
        g.addColorStop(0.65,"rgba(120,215,255,0.18)");
        g.addColorStop(1.0,"rgba(120,215,255,0)");
        stx.fillStyle=g;
        stx.beginPath(); stx.arc(0,0, S, 0, Math.PI*2); stx.fill();
        stx.restore();
      }
      // 3) 星体
      stx.save();
      stx.translate(cx,cy);
      stx.shadowColor="#7fdcff"; stx.shadowBlur=S*0.8;
      const H=S*1.3, W=S*0.42, IH=H*0.18, IW=W*0.30;
      stx.beginPath();
      stx.moveTo(0,-H/2); stx.lineTo(IW,-IH); stx.lineTo(W/2,0);
      stx.lineTo(IW,IH); stx.lineTo(0,H/2); stx.lineTo(-IW,IH);
      stx.lineTo(-W/2,0); stx.lineTo(-IW,-IH); stx.closePath();
      stx.fillStyle="#ffffff";
      stx.fill(); stx.fill(); stx.fill();
      stx.shadowBlur=S*0.3; stx.shadowColor="#e8faff";
      stx.beginPath(); stx.arc(0,0, S*0.08, 0, Math.PI*2); stx.fill();
      stx.restore();
      // 4) 左侧羽化:destination-out 用横向渐变从最左往里擦到 alpha 0
      const feather=Math.max(0, Math.min(1, LU.starFeatherL||0));
      if(feather>0){
        const fW=OSS*feather;
        const g=stx.createLinearGradient(0,0, fW,0);
        g.addColorStop(0,"rgba(0,0,0,1)");
        g.addColorStop(1,"rgba(0,0,0,0)");
        stx.globalCompositeOperation="destination-out";
        stx.fillStyle=g;
        stx.fillRect(0,0, fW, OSS);
        stx.globalCompositeOperation="source-over";
      }
      // 5) 贴到主画布(以 sx,sy 为星中心)
      ctx.drawImage(soc, sx-cx, sy-cy);
    }
    ctx.restore();
    last=now;
    if(!displayed){displayed=true;alEvent("DISPLAYED");}
    requestAnimationFrame(loop);
    return;
  }
  document.body.classList.remove("maomao-loading");
  window.CatFishGame.AnalyticsSystem.ready();
  const idleGame=window.CatFishGame;
  const idleRoute=idleGame.SceneRouterSystem.get(),idleOverlay=idleGame.OverlayManagerSystem.get();
  const idleFrozen=paused||document.hidden||panelOpen()||!!idleOverlay.active||idleRoute.scene!=="yard"||window.SCENERY_EDIT_MODE||window.UI_EDIT_MODE||window.PANEL_EDIT_MODE;
  idleGame.CoastSystem.tickIdle(now,isMainHomeIdle()&&!idleFrozen,idleFrozen);
  const idleInterval=idleCanvasInterval();
  if(idleInterval&&now-lastIdleCanvasFrame<idleInterval-1){last=now;requestAnimationFrame(loop);return;}
  if(idleInterval)lastIdleCanvasFrame=now;
  let dt=(now-last)/1000;last=now;
  const rawMs=dt*1000;
  if(dt>.05)dt=.05;
  const homeIdle=isMainHomeIdle();
  // 局外只需低频重绘背景，不再推进钓鱼模拟；弹窗和编辑模式同样完全冻结。
  const frozen = homeIdle || panelOpen() || window.SCENERY_EDIT_MODE || window.UI_EDIT_MODE || window.PANEL_EDIT_MODE;
  // 首轮弧线演示暂停:只冻结鱼钩(其他:波浪/鱼群/渔夫序列帧/粒子照常动)
  window.__TUT_HOOK_PAUSE = (phase==="fishing"&&roundNum===1&&!tutSteerDone&&!tutDemoDismissed&&hook.y>WATER_Y+60);
  const t0=performance.now();
  const tutorialScale=tickBoostGuide(dt,frozen||paused||document.hidden);
  if(!frozen) update(dt*tutorialScale);
  const t1=performance.now();
  // 震屏值必须在暂停时也衰减,否则弹结算/CTA 后 shake 停在正值 → 一直在抖
  if(frozen && shake>0) shake=Math.max(0,shake-dt*1.6);
  if(frozen && impactFlash>0) impactFlash=Math.max(0,impactFlash-dt);
  // 渔夫动画预览:暂停/编辑模式下也让预览帧继续走
  if(frozen && window.FISHER_PREVIEW && typeof fisherFsm!=="undefined") fisherFsm.t+=dt;
  updateDispCoins();   // 金币滚动显示:冻结(弹窗购买)时也要滚,所以放 update 之外
  const nativeHarvest=!!(window.WeChatHost&&homeIdle&&idleOverlay.active==='harvest');
  const reuseHarvest=nativeHarvest&&nativeHarvestScene&&nativeHarvestScene.width===cvs.width&&nativeHarvestScene.height===cvs.height;
  if(reuseHarvest){
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(nativeHarvestScene,0,0);ctx.restore();
  }else{
    draw();
    if(nativeHarvest){
      nativeHarvestScene=document.createElement('canvas');nativeHarvestScene.width=cvs.width;nativeHarvestScene.height=cvs.height;
      nativeHarvestScene.getContext('2d').drawImage(cvs,0,0);
    }else nativeHarvestScene=null;
  }
  // Composite native menus only over a fresh scene, never over a skipped frame.
  if(!reuseHarvest&&window.WeChatHost&&window.WeChatHost.captureBackground)window.WeChatHost.captureBackground();
  if(window.WeChatHost&&window.CatFishGame.WeChatView)window.CatFishGame.WeChatView.draw(ctx);
  keepTexturesHot();   // 只保温"闲置小图"(cast/reel 帧/光晕/面板图),常驻大图不碰
  const t2=performance.now();
  // 帧尖峰记录:上一帧间隔 >80ms 时,打印本帧各段耗时 + 游戏状态,定位掉帧元凶。
  // rawMs 大但 update/draw 都小 → 说明卡在 JS 之外(GC / 解码 / 合成器),看 DevTools Performance。
  if(rawMs>80 && displayed && !homeIdle){
    console.warn("[帧尖峰] 帧间隔:"+rawMs.toFixed(1)+"ms | update:"+(t1-t0).toFixed(1)+"ms draw:"+(t2-t1).toFixed(1)+"ms"
      +" | hook:"+hook.state+(hook.retractPhase?("/p"+hook.retractPhase):"")
      +" fisher:"+fisherFsm.state+" phase:"+phase
      +" fishes:"+fishes.length+" particles:"+particles.length);
  }
  // ?fpsdbg:屏上实时性能面板(iPhone 上没 DevTools,靠它截图定位掉帧)
  // 显示:当前帧间隔 / update / draw / 最近 3 秒最差帧间隔 及其 update/draw 拆分
  if(window.__fpsdbg===undefined) window.__fpsdbg=/[?&]fpsdbg/.test(location.search);
  if(window.__fpsdbg){
    const st=window.__fpsSt||(window.__fpsSt={worst:0,wu:0,wd:0,at:0});
    const nowMs=performance.now();
    if(rawMs>st.worst){ st.worst=rawMs; st.wu=t1-t0; st.wd=t2-t1; st.at=nowMs; }
    if(nowMs-st.at>3000){ st.worst=rawMs; st.wu=t1-t0; st.wd=t2-t1; st.at=nowMs; }
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    const S2=cvs.width/VW; ctx.scale(S2,S2);
    ctx.fillStyle="rgba(0,0,0,.75)";
    ctx.fillRect(4,80,300,64);
    ctx.fillStyle="#0f0"; ctx.font="12px monospace"; ctx.textAlign="left"; ctx.textBaseline="top";
    ctx.fillText("frame:"+rawMs.toFixed(1)+"ms u:"+(t1-t0).toFixed(1)+" d:"+(t2-t1).toFixed(1),10,86);
    ctx.fillText("worst3s:"+st.worst.toFixed(1)+"ms u:"+st.wu.toFixed(1)+" d:"+st.wd.toFixed(1),10,102);
    ctx.fillText("hook:"+hook.state+" fish:"+fishes.length+" basket:"+hookedFish.length+" ptc:"+particles.length,10,118);
    ctx.restore();
  }
  if(!displayed){displayed=true;alEvent("DISPLAYED");}
  requestAnimationFrame(loop);
}
if(window.WeChatHost)window.WeChatHost.connect({
  images:IMG,canvas:cvs,context:ctx,
  status:()=>({phase,hook:hook.state,depth:Math.max(0,(hook.y-WATER_Y)/10),lineLeft,lineMax,paused,pending,ready:!!window._loadingFinalized}),
  reel:()=>endRound('manual'),
  drawOverlay:()=>window.CatFishGame.WeChatView&&window.CatFishGame.WeChatView.draw(ctx)
});
requestAnimationFrame(loop);
