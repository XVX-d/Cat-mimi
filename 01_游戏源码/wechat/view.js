/* Canvas presentation for the original v0.33 systems; no duplicate economy or physics. */
module.exports=function installView(root){
 const g=root.CatFishGame,host=root.WeChatHost;
 let page='yard',overlay='',tab='fish',scroll=0,limit=0,hits=[],gesture=null,result=null,resultAt=0,skip=false,frames=null,frameId='',careLoading=false,careButtons=null,notice='',noticeUntil=0;
 const cache=new Map(),loaded=new Map();
 let harvestList=[],harvestCount=0;
 const now=()=>root.performance.now(),session=()=>g.GameSession,save=()=>session().getSave();
 const t=s=>g.LocalizationSystem.t(String(s));
 // Success is already visible in the animation, counters and button states.
 // Keep actionable failures and export-location notices, not routine success banners.
 const silentFeedback=new Set(['开心陪伴','好感度 +10','升级完成！','猫咪外观已更换','收益已翻倍']);
 function toast(s){if(silentFeedback.has(s))return;notice=s;noticeUntil=now()+2200;}
 function image(file){if(loaded.has(file))return loaded.get(file);const im=new root.Image();loaded.set(file,im);im.src=root.ASSET_INLINE[file]||'assets/'+file;return im;}
 const ready=im=>im&&im.width>0;
 function art(ctx,key,x,y,w,h){const a=host.getEngine().images.coast_ui;if(!a)return;ctx.save();ctx.translate(x,y);g.CoastSystem.drawUI(ctx,a,key,w,h);ctx.restore();}
 function text(ctx,s,x,y,size=24,color='#60341c',align='center',max=480){ctx.fillStyle=color;ctx.font='bold '+size+'px sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(t(s),x,y,max);}
 function paragraph(ctx,s,x,y,w,size=19){ctx.font=size+'px sans-serif';ctx.fillStyle='#65472f';ctx.textAlign='left';ctx.textBaseline='top';let line='',row=0;for(const ch of t(s)){if(ctx.measureText(line+ch).width>w){ctx.fillText(line,x,y+row*27);row++;line='';}line+=ch;}if(line)ctx.fillText(line,x,y+row*27);return (row+1)*27;}
 function button(ctx,label,x,y,w,h,fn,key=2,enabled=true){ctx.save();if(!enabled)ctx.globalAlpha=.5;art(ctx,key,x,y,w,h);text(ctx,label,x+w/2,y+h/2,Math.min(25,h*.36),'#fff8d9','center',w-24);ctx.restore();if(enabled)hits.push({x,y,w,h,fn});}
 function box(ctx,x,y,w,h,fill='#f7d9a0'){ctx.fillStyle=fill;ctx.strokeStyle='#b47b42';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.fill();ctx.stroke();}
 function cachedArt(ctx,key,w,h,painter,x,y){const k=key+':'+w+':'+h;let c=cache.get(k);if(!c){c=root.document.createElement('canvas');c.width=w;c.height=h;if(painter(c)===false)return false;cache.set(k,c);}ctx.drawImage(c,x,y,w,h);return true;}
 function harvestArt(ctx,key,x,y,w,h){return cachedArt(ctx,'harvest-'+key,w,h,c=>g.HarvestArtSystem.part(c,key,w,h),x,y);}
 function harvestButton(ctx,label,x,y,w,h,fn,key,enabled=true){ctx.save();if(!enabled)ctx.globalAlpha=.5;harvestArt(ctx,key,x,y,w,h);text(ctx,label,x+w/2,y+h/2,Math.min(25,h*.36),'#fff8d9','center',w-24);ctx.restore();if(enabled)hits.push({x,y,w,h,fn});}
 function journal(ctx,key,x,y,w,h){cachedArt(ctx,'journal-'+key,w,h,c=>{c.dataset.journalArt=key;g.CatalogArtSystem.paint(c,{clientWidth:w,clientHeight:h});},x,y);}
 function fish(ctx,f,known,x,y,w,h){const im=image(f.iconKey+'.png');if(!ready(im))return;let src=im;if(!known){const key='shadow-'+f.id;if(!cache.has(key)){const c=root.document.createElement('canvas');c.width=160;c.height=120;const cc=c.getContext('2d');cc.drawImage(im,0,0,160,120);cc.globalCompositeOperation='source-in';cc.fillStyle='#283b43';cc.fillRect(0,0,160,120);cache.set(key,c);}src=cache.get(key);}const k=Math.min(w/src.width,h/src.height);ctx.drawImage(src,x+(w-src.width*k)/2,y+(h-src.height*k)/2,src.width*k,src.height*k);}
 function cat(ctx,a,x,y,w,h){const im=image(a.id==='default'?'coast_cat_pose_v027.png':'coast_skins_v04.png');if(!ready(im))return;const cols=a.id==='default'?1:3,frame=a.id==='default'?0:a.frame,sw=im.width/cols,sh=im.height/cols,k=Math.min(w/sw,h/sh);ctx.drawImage(im,frame%cols*sw,Math.floor(frame/cols)*sh,sw,sh,x+(w-sw*k)/2,y+(h-sh*k)/2,sw*k,sh*k);}
 function go(p){if(!['yard','interior','collection'].includes(p))p='yard';overlay='';page=p;scroll=0;g.OverlayManagerSystem.close();g.SceneRouterSystem.home();if(p!=='yard')g.SceneRouterSystem.go(p);if(p==='collection')bookNew=false;}
 function open(o){overlay=o;scroll=0;g.OverlayManagerSystem.open(o);}
 function close(){overlay='';scroll=0;g.OverlayManagerSystem.close();}
 function start(){close();go('yard');try{if(!g.HomeFishingBridgeSystem.start('tide_dock'))toast('当前暂时无法开始钓鱼，请稍后重试');}catch(e){toast('出海失败，请重试');console.error(e);}}
 function header(ctx,title,showCoins=true){art(ctx,0,145,-35,250,170);text(ctx,title,270,95,27,'#fff1c2');button(ctx,'‹',15,45,65,60,()=>{if(overlay)close();else go('yard');},3);if(showCoins)text(ctx,'● '+session().getProgress().coins,465,75,22,'#fff4c9','center',125);}
 let bookNew=false;
 g.GameEvents.on(g.GameEvents.EVENTS.FISH_FIRST_DISCOVERED,()=>{bookNew=true;});
 function home(ctx){
  art(ctx,0,150,-35,244,195);text(ctx,'潮汐码头',272,97,36,'#fff0b9');
  box(ctx,13,44,126,51,'#88512e');art(ctx,13,7,39,53,53);text(ctx,session().getProgress().coins,102,70,28,'#fff1ce');
  // Inventory gameplay has been retired; legacy save fields remain compatible.
  const nav=[['图鉴',4,()=>go('collection')],['设置',7,()=>open('settings')],['房间',8,()=>go('interior')],['外观',9,()=>open('cat')]];
  nav.forEach((a,i)=>{const y=60+i*90;art(ctx,a[1],449,y,82,82);text(ctx,a[0],490,y+69,20,'#fff8dc');hits.push({x:449,y,w:82,h:87,fn:a[2]});if(i===0&&bookNew){ctx.fillStyle='#ed4545';ctx.beginPath();ctx.arc(522,y+7,7,0,Math.PI*2);ctx.fill();}});
  const layout=g.MainSceneLayoutSystem,up=layout.get('upgrade'),c=layout.get('cat'),cam=g.CoastSystem.camera(),st=layout.get('start'),ux=c.x+c.w/2-cam.x-up.w/2+up.x,uy=c.y-cam.y+up.y;
  if(!up.hidden){button(ctx,'',ux,uy,up.w,up.h,()=>open('tackle'));art(ctx,10,ux+8,uy+8,46,46);text(ctx,'钓具升级',ux+up.w*.62,uy+up.h/2,25,'#fff0ce','center',up.w-58);}
  if(!st.hidden){button(ctx,'',st.x,st.y,st.w,st.h,start,1);art(ctx,11,st.x+24,st.y+15,60,68);text(ctx,'开始钓鱼',st.x+st.w*.61,st.y+st.h/2,40,'#fff6ba','center',st.w-100);}
 }
 function tackle(ctx){
  art(ctx,15,35,175,470,630);text(ctx,'钓具升级',270,225,32);
  ['rod_rack','hook_bench','fish_bucket'].forEach((id,i)=>{const f=session().getFacilityState(id),y=270+i*155;art(ctx,10+i,58,y,78,94);text(ctx,['鱼线','鱼钩','鱼篓'][i]+' Lv.'+(id==='rod_rack'?f.level-1:f.level),160,y+12,25,'#60341c','left',300);paragraph(ctx,f.currentBenefit,155,y+42,305,17);button(ctx,f.isMax?'已满级':f.nextCost+' 金币 · 升级',195,y+87,250,50,()=>{const r=session().upgradeFacility(id);toast(r.ok?'升级完成！':r.reason==='max_level'?'已经满级':'金币不足');},2,!f.isMax&&save().player.coins>=f.nextCost);});
  button(ctx,'完成',170,750,200,55,close,3);
 }
 function wardrobe(ctx){
  const list=g.CatAppearanceConfig.list();g.CatCollectionSystem.ensure(save());
  limit=Math.max(0,Math.ceil(list.length/2)*310-690);
  ctx.save();ctx.beginPath();ctx.rect(30,160,480,690);ctx.clip();
  list.forEach((a,i)=>{const x=35+(i%2)*240,y=170+Math.floor(i/2)*310-scroll,owned=save().cat.unlockedAppearances.includes(a.id),active=save().cat.activeAppearance===a.id;if(y>850||y+300<160)return;
   box(ctx,x,y,230,295);cat(ctx,a,x+35,y+8,160,135);text(ctx,a.name,x+115,y+150,22,'#60341c','center',215);
   const req=g.CatCollectionSystem.progress(save(),a);req.forEach((r,j)=>{const f=g.FishConfig.getById(r.fishId);fish(ctx,f,r.discovered,x+12+j*105,y+172,55,42);text(ctx,r.count+'/'+r.required,x+76+j*105,y+195,17);});
   button(ctx,active?'当前使用':owned?'使用外观':'尚未解锁',x+20,y+242,190,42,()=>{if(g.CatShowcaseSystem.select(save(),a.id)){frameId='';toast('猫咪外观已更换');}},active?3:1,owned&&!active);
  });ctx.restore();
 }
 function collection(ctx){
  journal(ctx,'panel',12,22,516,908);
  // The journal panel already includes its header, back and settings artwork.
  text(ctx,'收藏图鉴',282,77,25,'#674b31','center',245);
  hits.push({x:43,y:40,w:80,h:80,fn:()=>go('yard')},{x:435,y:40,w:80,h:80,fn:()=>open('settings')});
  [['fish','鱼图鉴'],['king','鱼王'],['cat','猫咪']].forEach((a,i)=>{const x=60+i*143;journal(ctx,tab===a[0]?'tabOn':'tab',x,135,136,48);text(ctx,a[1],x+68,162,20,tab===a[0]?'#276c65':'#70583d','center',116);hits.push({x,y:135,w:136,h:48,fn:()=>{tab=a[0];scroll=0;}});});
  if(tab==='cat'){wardrobe(ctx);return;}
  const entries=g.CollectionViewSystem.list(tab,save());limit=Math.max(0,Math.ceil(entries.length/3)*200-680);
  ctx.save();ctx.beginPath();ctx.rect(56,195,440,675);ctx.clip();
  entries.forEach((e,i)=>{const x=60+i%3*143,y=200+Math.floor(i/3)*200-scroll;if(y>870||y+190<195)return;const key=!e.ok?'gray':({uncommon:'purple',rare:'gold',epic:'red'}[e.rarity]||'card');journal(ctx,key,x,y,136,190);
   if(tab==='fish'){const f=g.FishConfig.getById(e.id);fish(ctx,f,e.ok,x+9,y+12,118,88);text(ctx,e.name,x+68,y+118,20,'#59331b','center',116);if(e.ok){text(ctx,f.value+' 金币',x+68,y+146,17);text(ctx,'捕获 '+save().fishBook[e.id].catchCount+' 次',x+68,y+170,15);}else text(ctx,'尚未发现',x+68,y+160,18);}else{text(ctx,'?',x+68,y+75,42);text(ctx,e.meta,x+68,y+145,17,'#59331b','center',116);}
  });ctx.restore();
 }
 function room(ctx){
  const bg=image('care_room_v018.png');if(ready(bg))ctx.drawImage(bg,0,0,540,960);
  header(ctx,'猫咪小屋',true);const s=g.CatCareSystem.status(save());box(ctx,45,145,450,65);text(ctx,'♥ 好感度 '+s.affection+' / 100',270,177,26,'#bd5373');
  const id=g.CatShowcaseSystem.get(save()).appearance.id;
  if(frameId!==id&&!careLoading){careLoading=true;frameId=id;frames=null;g.CatCareSystem.loadAtlas(id).then(f=>{frames=f;careLoading=false;}).catch(e=>{careLoading=false;frameId='';toast('小屋素材加载失败');console.error(e);});}
  if(frames){let c=cache.get('actor');if(!c){c=root.document.createElement('canvas');c.width=480;c.height=645;cache.set('actor',c);}g.CatCareSystem.drawActor(c,frames);ctx.drawImage(c,115,270,310,417);}
  else text(ctx,'加载猫咪动作…',270,490,24);
  // Match the original room's aquarium hotspot, without an extra floating button.
  hits.push({x:413,y:331,w:123,h:162,fn:()=>{tab='fish';go('collection');}});
  if(!careButtons){g.CatCareSystem.loadButtons().then(b=>{careButtons=b;}).catch(()=>{});}
  ['pet','feed'].forEach((kind,i)=>{const x=30+i*260,y=736,w=250,h=110;if(careButtons)ctx.drawImage(careButtons[i],x,y,w,h);else art(ctx,2,x,y,w,h);text(ctx,i?'喂养':'抚摸',x+165,y+26,26);text(ctx,s.full?'好感度已满':i?'好感度 +10':s.remaining?'随时可以抚摸':'好感度 +10',x+165,y+60,16,'#663c26','center',145);text(ctx,i?(s.feedCost?s.feedCost+' 金币':'免费喂养'):(s.remaining?Math.ceil(s.remaining/1000)+' 秒后 +10':'奖励已就绪'),x+165,y+87,15,'#98623c','center',145);
   hits.push({x,y,w,h,fn:()=>{if(!frames)return;const r=session().careCat(kind);toast(r.ok?(r.gain?'好感度 +10':'开心陪伴'):r.reason==='insufficient_coins'?'金币不足':'请稍后重试');}});
  });text(ctx,'满额后免费互动 · 不影响钓鱼能力',270,885,19);
 }
 function settings(ctx){art(ctx,15,35,170,470,670);text(ctx,'设置',270,220,32);const opt=g.SettingsSystem.load();[['sound','音效'],['vibration','震动反馈'],['reducedMotion','减少动态效果']].forEach((a,i)=>button(ctx,a[1]+'：'+(opt[a[0]]?'开':'关'),80,270+i*85,380,60,()=>{g.SettingsSystem.set(a[0],!opt[a[0]]);if(a[0]==='sound'&&opt.sound)host.stopAll();},opt[a[0]]?1:3));text(ctx,'语言 / Language',270,555,23);button(ctx,'简体中文',70,590,190,55,()=>g.LocalizationSystem.setLanguage('zh-CN'),3);button(ctx,'English',280,590,190,55,()=>g.LocalizationSystem.setLanguage('en'),3);text(ctx,'微信本地存档 · '+(g.SaveSystem.getStatus().ok?'正常':'写入失败'),270,690,21);button(ctx,'导出测试数据',100,730,340,55,()=>{g.AnalyticsSystem.exportData();toast('测试数据已保存到微信用户目录');},3);}
 function harvest(ctx){
  const r=result||{catches:{},value:0},list=harvestList,n=list.length;
  const elapsed=now()-resultAt,revealStep=Math.min(190,1400/Math.max(1,n)),sellStep=Math.min(360,1700/Math.max(1,n)),revealEnd=n*revealStep+550,end=revealEnd+n*sellStep+620,done=skip||elapsed>=end||!n;
  if(!cachedArt(ctx,'harvest-panel',470,780,c=>g.HarvestArtSystem.frame(c,{clientWidth:470,clientHeight:780}),35,120)){box(ctx,35,120,470,780);text(ctx,'加载中…',270,460,24);return;}
  text(ctx,'第 '+r.round+' 杆 · '+harvestCount+' 条鱼',230,165,23);if(!done)button(ctx,'跳过',398,143,82,42,()=>{skip=true;},3);
  limit=Math.max(0,Math.ceil(n/3)*173-360);ctx.save();ctx.beginPath();ctx.rect(50,195,440,360);ctx.clip();
  list.forEach((a,i)=>{if(!done&&elapsed<i*revealStep)return;const x=58+i%3*143,y=205+Math.floor(i/3)*173-scroll,sold=done||elapsed>revealEnd+i*sellStep;harvestArt(ctx,['blue','purple','gold','red'][{common:0,uncommon:1,rare:2,epic:3}[a.f.rarity]||0],x,y,135,160);fish(ctx,a.f,true,x+5,y+5,125,70);text(ctx,a.f.name,x+67,y+88,18,'#60341c','center',125);text(ctx,'×'+a.count+' · 单价 '+a.f.value,x+67,y+114,15,'#60341c','center',125);text(ctx,sold?'+'+a.count*a.f.value:'…',x+67,y+140,23);
  });ctx.restore();
  if(!n)text(ctx,'本杆没有鱼获，再试一次吧。',270,350,23);
  if(!done&&!g.SettingsSystem.load().reducedMotion){
    // A tiny cached sprite and a global cap keep large catches cheap to animate.
    let coin=cache.get('harvest-coin');if(!coin&&host.getEngine().images.coast_ui){coin=root.document.createElement('canvas');coin.width=48;coin.height=48;art(coin.getContext('2d'),13,0,0,48,48);cache.set('harvest-coin',coin);}
    let budget=24;
    for(let i=0;i<n&&budget>0;i++){const a=list[i],dt=elapsed-revealEnd-i*sellStep,x=125+i%3*143,y=280+Math.floor(i/3)*173-scroll;
      if(dt<0||dt>800||y<195||y>555)continue;
      for(let j=0;j<Math.min(8,3+a.count);j++){const p=Math.max(0,Math.min(1,(dt-j*22)/580));if(p<=0||p>=1||!coin)continue;
        const arc=Math.sin(p*Math.PI);ctx.drawImage(coin,x+(270-x)*p+(j%5-2)*20*arc,y+(610-y)*p-65*arc,24,24);if(--budget<=0)break;
      }
    }
  }
  harvestArt(ctx,'income',65,575,410,125);text(ctx,'本杆总收益',270,602,21);const fraction=done?1:Math.max(0,Math.min(1,(elapsed-revealEnd)/(n*sellStep+400)));text(ctx,'● '+Math.floor(r.value*fraction)*(r.doubled?2:1),270,649,38);harvestButton(ctx,r.doubled?'已翻倍':'翻倍收益 +'+r.value,65,720,410,60,()=>{if(session().claimHarvestDouble(r).ok)toast('收益已翻倍');},'double',done&&!r.doubled&&r.value>0);harvestButton(ctx,'完成',65,805,195,60,()=>{result=null;close();},'home',done);harvestButton(ctx,'再钓一次',280,805,195,60,start,'again',done);
 }
 function draw(ctx){const e=host.getEngine();if(!e||!e.status().ready||(root.__loadProg?.v||0)<.999)return;hits=[];limit=0;ctx.save();const s=e.canvas.width/540;ctx.setTransform(s,0,0,s,0,0);
  if(!g.HomeFishingBridgeSystem.getState().isFishing){if(page==='yard')home(ctx);else if(page==='interior')room(ctx);else{ctx.fillStyle='#e5efe3';ctx.fillRect(0,0,540,960);if(page==='collection')collection(ctx);}if(overlay){hits=[];ctx.fillStyle='rgba(10,35,42,.45)';ctx.fillRect(0,0,540,960);if(overlay==='harvest')harvest(ctx);else{if(overlay==='tackle')tackle(ctx);if(overlay==='settings')settings(ctx);if(overlay==='cat'){box(ctx,20,100,500,800);wardrobe(ctx);}button(ctx,'×',452,104,58,52,close,3);}}}
  if(noticeUntil>now()){ctx.fillStyle='rgba(30,30,30,.84)';ctx.beginPath();ctx.roundRect(40,875,460,50,15);ctx.fill();text(ctx,notice,270,900,22,'#fff');}ctx.restore();
 }
 function touch(type,p){const fishing=g.HomeFishingBridgeSystem.getState().isFishing;if(fishing)return false;if(type==='pointerdown'){gesture={...p,lastY:p.y,moved:false};return true;}if(type==='pointermove'&&gesture){if(Math.abs(p.y-gesture.y)>8)gesture.moved=true;if(gesture.moved){scroll=Math.max(0,Math.min(limit,scroll+gesture.lastY-p.y));gesture.lastY=p.y;}return true;}if(type==='pointerup'&&gesture){const g0=gesture;gesture=null;if(!g0.moved){const h=hits.slice().reverse().find(h=>p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h&&g0.x>=h.x&&g0.x<=h.x+h.w&&g0.y>=h.y&&g0.y<=h.y+h.h);if(h){try{h.fn();}catch(e){console.error(e);toast('操作未完成，请稍后重试');}}}return true;}if(type==='pointercancel')gesture=null;return true;}
 g.WeChatView={draw,touch,getState:()=>({page,overlay,tab}),go,open};
 g.HomeSystem={mount(){},render(){},hide(){},beginFishing(){overlay='';},show(){go('yard');g.HomeFishingBridgeSystem.returnHome();},showHarvest(r){go('yard');result=r;const fishByName=new Map(g.FishConfig.list().map(f=>[f.name,f]));harvestList=Object.entries(r.catches||{}).filter(([,n])=>n>0).map(([name,count])=>({f:fishByName.get(name),count})).filter(a=>a.f);harvestCount=harvestList.reduce((sum,a)=>sum+a.count,0);resultAt=now();skip=false;open('harvest');g.HomeFishingBridgeSystem.returnHome();}};
};
