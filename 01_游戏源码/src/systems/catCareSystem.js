"use strict";
/* v0.33 十种外观共享互动状态，按需载入各自的八帧动作图。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  const LIMIT=100, GAIN=10, COST=10, COOLDOWN=300000;
  const durations={pet:2300,feed:2800};
  let busyUntil=0, currentAction=null, animationStart=0, timer=0, raf=0;
  const asset=name=>(root.ASSET_INLINE&&root.ASSET_INLINE[name])||"assets/"+name;
  const esc=s=>String(s).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const mono=()=>root.performance.now();
  function ensure(save){
    const old=save.catCare&&typeof save.catCare==="object"?save.catCare:{};
    save.catCare={affection:Number.isFinite(old.affection)?Math.max(0,Math.min(LIMIT,Math.floor(old.affection))):0,
      lastPetRewardAt:Number.isFinite(old.lastPetRewardAt)?Math.max(0,Math.min(Date.now(),old.lastPetRewardAt)):0};
    return save.catCare;
  }
  function status(save,at=Date.now()){
    const c=ensure(save),full=c.affection>=LIMIT;
    return {affection:c.affection,full,remaining:c.lastPetRewardAt?Math.max(0,Math.min(COOLDOWN,COOLDOWN-(at-c.lastPetRewardAt))):0,
      feedCost:full?0:COST,busy:mono()<busyUntil};
  }
  function interact(kind,save,wallet,commit,at=Date.now()){
    if(!durations[kind])return {ok:false,reason:"unknown_action"};
    if(mono()<busyUntil)return {ok:false,reason:"busy"};
    const before=Object.assign({},ensure(save)),s=status(save,at),balance=wallet.getBalance();
    const cost=kind==="feed"?s.feedCost:0;
    if(cost&&!wallet.spend(cost,"cat_care_feed").ok)return {ok:false,reason:"insufficient_coins"};
    const eligible=!s.full&&(kind==="feed"||s.remaining===0);
    const gain=eligible?Math.min(GAIN,LIMIT-s.affection):0;
    save.catCare.affection+=gain;
    if(kind==="pet"&&gain)save.catCare.lastPetRewardAt=at;
    if(cost||gain){
      if(commit()===false){
        save.catCare=before;wallet.setBalance(balance,"cat_care_rollback");wallet.writeToSave(save);
        return {ok:false,reason:"save_failed"};
      }
    }
    animationStart=mono();busyUntil=animationStart+durations[kind];currentAction=kind;
    return {ok:true,kind,gain,cost,full:save.catCare.affection>=LIMIT,remaining:s.remaining};
  }
  function html(save){
    const s=status(save),a=game.CatShowcaseSystem.get(save).appearance;
    return '<div class="life-shell scene-interior care-room"><img class="care-backdrop" src="'+asset("care_room_v018.png")+'" alt="">'+
      '<header class="life-header care-header"><button class="care-back" data-action="back" aria-label="返回码头">‹</button><h1><canvas class="coast-icon" data-coast-art="0" aria-hidden="true"></canvas><span>猫咪小屋</span></h1><div class="care-coins"><canvas class="coast-icon" data-coast-art="13" aria-hidden="true"></canvas><b>'+save.player.coins+'</b></div></header>'+
      '<section class="care-world" aria-label="猫咪培养区"><div class="care-affection"><span class="care-heart" aria-hidden="true">♥</span><b>好感度</b><div class="care-meter" role="progressbar" aria-label="好感度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+s.affection+'"><i style="width:'+s.affection+'%"></i></div><strong data-care-total>'+s.affection+' / 100</strong></div>'+
      '<button class="care-wardrobe" data-action="open-cat"><canvas class="coast-icon" data-coast-art="9" aria-hidden="true"></canvas><b>更换外观</b></button>'+
      '<button class="care-aquarium" data-action="care-book" aria-label="点击鱼缸打开鱼图鉴"><span>图鉴</span></button>'+
      '<div class="care-cat" data-appearance="'+esc(a.id)+'"><canvas class="care-cat-canvas" width="640" height="860" role="img" aria-label="'+esc(a.name)+'"></canvas><div class="care-hearts" aria-hidden="true"><i>♥</i><i>♥</i><i>♥</i></div><span class="care-float" aria-live="polite"></span></div>'+
      '<p class="care-caption">'+esc(a.name)+' · 摸摸头，陪它吃点东西</p>'+
      '<button class="care-interact care-pet" data-action="care-pet" aria-label="抚摸小猫"><canvas aria-hidden="true" class="care-button-art"></canvas><span><b>抚摸</b><em data-care-pet-gain>好感度 +10</em><small data-care-pet-status>奖励已就绪</small></span></button>'+
      '<button class="care-interact care-feed" data-action="care-feed" aria-label="喂养小猫"><canvas aria-hidden="true" class="care-button-art"></canvas><span><b>喂养</b><em data-care-feed-gain>好感度 +10</em><small data-care-feed-status>10 金币</small></span></button>'+
      '<p class="care-help">满额后免费互动 · 不影响钓鱼能力</p><small class="care-version">v0.33</small></section></div>';
  }
  // Chroma-keying is done once at runtime; the approved RGB source atlas stays intact.
  // Tight atlas cells are cached as canvases, then drawn with a single animation loop.
  const cache={}, atlases=new Map();
  const sheetNames=Object.freeze({default:"care_cat_v018.png",cowboy:"care_cowboy_v019.png",tennis:"care_tennis_v019.png",
    chef:"care_chef_v019.png",rocker:"care_rocker_v019.png",clown:"care_clown_v019.png",bunny:"care_bunny_v019.png",
    police:"care_police_v019.png",vampire:"care_vampire_v019.png",santa:"care_santa_v019.png"});
  function image(name){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=asset(name);});}
  function keyed(im,kind){
    const c=document.createElement("canvas");c.width=im.width;c.height=im.height;
    const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0);
    const frame=x.getImageData(0,0,c.width,c.height),p=frame.data;
    for(let i=0;i<p.length;i+=4){
      const r=p[i],g=p[i+1],b=p[i+2];
      const excess=kind==="green"?g-Math.max(r,b):Math.min(r,b)-g;
      if(excess>45){p[i+3]=Math.round(p[i+3]*Math.max(0,1-(excess-45)/55));
        if(kind==="green")p[i+1]=Math.min(g,Math.max(r,b));
      }
    }
    x.putImageData(frame,0,0);return c;
  }
  function cell(im,x,y,w,h,tight=false){
    const c=document.createElement("canvas");c.width=Math.round(w);c.height=Math.round(h);
    const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(im,x,y,w,h,0,0,c.width,c.height);
    if(!tight)return c;
    const d=ctx.getImageData(0,0,c.width,c.height).data;
    let left=c.width,top=c.height,right=0,bottom=0;
    for(let py=0;py<c.height;py++)for(let px=0;px<c.width;px++)if(d[(py*c.width+px)*4+3]>30){left=Math.min(left,px);top=Math.min(top,py);right=Math.max(right,px);bottom=Math.max(bottom,py);}
    return right>left?cell(c,left,top,right-left+1,bottom-top+1):c;
  }
  function loadButtons(){
    if(!cache.promise)cache.promise=image("care_buttons_v018.png").then(buttons=>{
      const b=keyed(buttons,"magenta");
      cache.buttons=[cell(b,0,0,b.width/2,b.height,true),cell(b,b.width/2,0,b.width/2,b.height,true)];
      return cache.buttons;
    }).catch(e=>{cache.promise=null;throw e;});
    return cache.promise;
  }
  function loadAtlas(id){
    if(!Object.prototype.hasOwnProperty.call(sheetNames,id))return Promise.reject(new Error("Unknown cat appearance"));
    let entry=atlases.get(id);
    if(entry){atlases.delete(id);atlases.set(id,entry);return entry;}
    entry=image(sheetNames[id]).then(cat=>{
      const c=keyed(cat,"green");
      return Array.from({length:8},(_,i)=>{
        const frame=cell(c,(i%4)*c.width/4,Math.floor(i/4)*c.height/2,c.width/4,c.height/2);
        const ctx=frame.getContext("2d"),data=ctx.getImageData(0,0,frame.width,frame.height).data;
        let bottom=0;
        for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++)if(data[(y*frame.width+x)*4+3]>100)bottom=y;
        const aligned=document.createElement("canvas");aligned.width=frame.width;aligned.height=frame.height;
        aligned.getContext("2d").drawImage(frame,0,Math.round(frame.height*.965)-bottom);
        return aligned;
      });
    }).catch(e=>{if(atlases.get(id)===entry)atlases.delete(id);throw e;});
    atlases.set(id,entry);
    // Keep at most three decoded sheets, not all ten (mobile memory).
    while(atlases.size>3)atlases.delete(atlases.keys().next().value);
    return entry;
  }
  const clock=ms=>{const t=Math.ceil(ms/1000);return Math.floor(t/60)+":"+String(t%60).padStart(2,"0");};
  function update(screen){
    const room=screen.querySelector(".care-room");if(!room)return;
    const save=game.GameSession.getSave(),s=status(save),pet=room.querySelector(".care-pet"),feed=room.querySelector(".care-feed");
    room.querySelector("[data-care-total]").textContent=s.affection+" / 100";
    const meter=room.querySelector(".care-meter");meter.setAttribute("aria-valuenow",s.affection);meter.firstElementChild.style.width=s.affection+"%";
    room.querySelector(".care-coins b").textContent=game.GameSession.getProgress().coins;
    room.querySelector("[data-care-pet-gain]").textContent=s.full?"好感度已满":s.remaining?"随时可以抚摸":"好感度 +10";
    room.querySelector("[data-care-pet-status]").textContent=s.full?"开心陪伴":s.remaining?clock(s.remaining)+" 后可再 +10":"奖励已就绪";
    room.querySelector("[data-care-feed-gain]").textContent=s.full?"好感度已满":"好感度 +10";
    room.querySelector("[data-care-feed-status]").textContent=s.full?"免费喂养":game.GameSession.getProgress().coins<COST?"10 金币 · 不足":"10 金币";
    const loading=room.dataset.careReady!=="true";
    pet.disabled=loading||s.busy;feed.disabled=loading||s.busy||(!s.full&&game.GameSession.getProgress().coins<COST);
    room.classList.toggle("care-is-busy",s.busy);
    if(!s.busy)room.querySelector(".care-cat").classList.remove("care-celebrate");
  }
  function drawActor(canvas,frames){
    const ctx=canvas.getContext("2d"),at=mono(),elapsed=at-animationStart;
    const active=at<busyUntil?currentAction:null,reduced=game.SettingsSystem.load().reducedMotion;
    let frame=0;
    if(active==="pet")frame=elapsed<250?0:elapsed<650?1:elapsed<1700?2:elapsed<2150?3:0;
    if(active==="feed")frame=elapsed<550?4:elapsed<1000?5:elapsed<2150?6:7;
    if(!active&&at%6200>6040)frame=2;
    const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.save();
    const breath=reduced?0:Math.sin(at/900)*.004,chew=!reduced&&active==="feed"&&elapsed>1000&&elapsed<2150?Math.sin(elapsed/65)*.005:0;
    ctx.translate(w/2,h*.96);ctx.scale(1+breath,1-breath+chew);ctx.translate(-w/2,-h*.96);
    ctx.drawImage(frames[frame],0,0,w,h);
    ctx.restore();canvas.dataset.pose=active?active+"-"+frame:"idle";
  }
  function stop(){root.clearInterval(timer);root.cancelAnimationFrame(raf);timer=0;raf=0;}
  function afterRender(screen){
    stop();const room=screen.querySelector(".care-room");if(!room)return;
    update(screen);timer=root.setInterval(()=>update(screen),250);
    const appearance=game.CatShowcaseSystem.get(game.GameSession.getSave()).appearance;
    room.setAttribute("aria-busy","true");
    Promise.all([loadButtons(),loadAtlas(appearance.id)]).then(([,frames])=>{
      if(!room.isConnected)return;
      room.querySelectorAll(".care-button-art").forEach((canvas,i)=>{canvas.width=500;canvas.height=216;canvas.getContext("2d").drawImage(cache.buttons[i],0,0,500,216);});
      const canvas=room.querySelector(".care-cat-canvas");canvas.dataset.atlas=sheetNames[appearance.id];
      room.dataset.careReady="true";room.setAttribute("aria-busy","false");update(screen);
      function tick(){if(!room.isConnected)return;if(!document.hidden)drawActor(canvas,frames);raf=root.requestAnimationFrame(tick);}tick();
    }).catch(()=>{if(room.isConnected)game.UIFeedbackSystem.toast("小屋素材加载失败，请刷新重试");});
  }
  function present(screen,result){
    const actor=screen.querySelector(".care-cat");if(!actor)return;
    actor.classList.remove("care-celebrate");void actor.offsetWidth;actor.classList.add("care-celebrate");
    actor.querySelector(".care-float").textContent=result.gain?"好感度 +"+result.gain:result.full?"好喜欢你！":"开心陪伴";
    update(screen);
  }
  game.CatCareSystem=Object.freeze({ensure,status,interact,html,afterRender,present,stop,loadAtlas,loadButtons,drawActor,constants:{LIMIT,GAIN,COST,COOLDOWN},durations});
})(window);
