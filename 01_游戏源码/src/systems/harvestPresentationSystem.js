"use strict";
(function(root){
 const game=root.CatFishGame;
 const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 let current=null,raf=0,audioCtx=null,coinArt=null;
 const rank=r=>({common:0,uncommon:1,rare:2,epic:3,legendary:3}[r]??0);
 const reduced=()=>game.SettingsSystem.load().reducedMotion;
 function groups(result){
  return Object.entries(result.catches||{}).filter(([,n])=>n>0).map(([name,count])=>{
   const fish=game.FishConfig.list().find(f=>f.name===name)||{name,iconKey:"fish_s",value:0,rarity:"common"};
   return {fish,count,subtotal:fish.value*count,tier:rank(fish.rarity)};
  }).sort((a,b)=>a.tier-b.tier);
 }
 function html(s,r){
  r=r||{value:0,catches:{}};const list=groups(r);
  current={result:r,list,done:false,screen:null};
  const cards=list.map(g=>'<article class="harvest-fish-card tier-'+g.tier+'"><div class="harvest-fish">'+game.CoastSystem.fishImage(g.fish)+'<strong>×'+g.count+'</strong></div><span>'+esc(g.fish.name)+'</span><small>单价 '+g.fish.value+' 金币</small><b>+'+g.subtotal+'</b><em>已结算</em></article>').join("");
  return '<div class="life-overlay coast-overlay harvest-overlay"><section class="coast-panel coast-harvest harvest-v09"><canvas class="coast-frame-art" aria-hidden="true"></canvas><div class="harvest-rays" aria-hidden="true"></div><header><small>第 '+(r.round||1)+' 杆 · '+list.reduce((n,g)=>n+g.count,0)+' 条鱼</small><button class="harvest-skip" data-action="harvest-skip">跳过</button></header><div class="harvest-grid">'+cards+'</div>'+(!list.length?'<p class="harvest-empty">本杆没有鱼获，再试一次吧。</p>':"")+'<div class="harvest-income"><small>本杆总收益</small><div><span class="harvest-currency">●</span> <b data-harvest-total aria-live="polite">0</b><span> 金币</span></div><p>'+(r.bonus?'含鱼篓加成 +'+r.bonus:'鱼获自动出售')+'</p></div><button class="harvest-double coast-gold" data-action="harvest-double" disabled>翻倍收益 <strong>+'+Number(r.value||0)+'</strong></button><div class="coast-result-actions"><button data-action="harvest-home" disabled>完成</button><button class="coast-gold" data-action="harvest-continue" disabled>再钓一次</button></div><div class="harvest-coins" aria-hidden="true"></div></section></div>';
 }
 function sound(tier=0){
  if(!game.SettingsSystem.load().sound)return;
  try{
   const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return;
   audioCtx=audioCtx||new AC();if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
   [0,4,7].slice(0,tier>=2?3:2).forEach((step,i)=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+i*.045;
    o.type="sine";o.frequency.value=620*Math.pow(2,(step+tier*2)/12);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.22);
    o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+.24);
   });
  }catch(e){}
 }
 function burst(from,count,tier=0){
  if(!current||!current.screen)return;
  const panel=current.screen.querySelector(".harvest-v09"),target=panel.querySelector(".harvest-income"),layer=panel.querySelector(".harvest-coins");
  const pr=panel.getBoundingClientRect(),fr=from.getBoundingClientRect(),tr=target.getBoundingClientRect(),scale=pr.width/panel.offsetWidth;
  const x=(fr.left+fr.width/2-pr.left)/scale,y=(fr.top+fr.height/2-pr.top)/scale;
  const tx=(tr.left+tr.width/2-pr.left)/scale,ty=(tr.top+tr.height/2-pr.top)/scale;
  if(!reduced())for(let i=0;i<Math.min(16,4+count*2);i++){
   const c=document.createElement("canvas");c.width=64;c.height=64;c.className="harvest-flying-coin";layer.append(c);
   if(coinArt&&coinArt.complete&&coinArt.naturalWidth)game.CoastSystem.drawUI(c.getContext("2d"),coinArt,13,64,64);
   c.style.left=x+"px";c.style.top=y+"px";
   const a=c.animate([{transform:"translate(-50%,-50%) scale(.5)",opacity:0},{transform:"translate("+((i%5-2)*22)+"px,"+(-45-i%3*16)+"px) scale(1.2)",opacity:1,offset:.28},{transform:"translate("+(tx-x)+"px,"+(ty-y)+"px) scale(.4)",opacity:0}],{duration:580,delay:i*14,easing:"ease-in"});
   a.onfinish=()=>c.remove();a.oncancel=()=>c.remove();
  }
  sound(tier);game.UIFeedbackSystem.pulse(tier>=2?"success":"catch");
 }
 function finish(){
  if(!current||!current.screen)return;
  cancelAnimationFrame(raf);current.done=true;
  const panel=current.screen.querySelector(".harvest-v09");if(!panel)return;
  panel.querySelectorAll(".harvest-fish-card").forEach(c=>c.classList.add("revealed","sold"));
  panel.querySelector("[data-harvest-total]").textContent=current.result.value*(current.result.doubled?2:1);
  panel.querySelectorAll(".coast-result-actions button").forEach(b=>b.disabled=false);
  const b=panel.querySelector("[data-action=harvest-double]");b.disabled=current.result.value<=0||!!current.result.doubled;
  if(current.result.doubled)b.textContent="已翻倍";
  panel.querySelector("[data-action=harvest-skip]").hidden=true;
  panel.classList.add("harvest-complete");
 }
function mount(screen){
  if(!coinArt){coinArt=new Image();coinArt.src=(root.ASSET_INLINE&&root.ASSET_INLINE["coast_ui_v04.png"])||"assets/coast_ui_v04.png";}
  cancelAnimationFrame(raf);
  if(!current||!screen.querySelector(".harvest-v09"))return;
  current.screen=screen;const token=current;
  const cards=[...screen.querySelectorAll(".harvest-fish-card")],n=cards.length;
  if(!n||reduced()){finish();return;}
  const start=performance.now(),revealStep=Math.min(190,1400/n),sellStep=Math.min(360,1700/n);
  const revealEnd=n*revealStep+550,end=revealEnd+n*sellStep+620;
  let shown=-1,sold=-1;
  function tick(now){
   if(current!==token||!cards[0].isConnected)return;
   const t=now-start;
   const ri=Math.min(n-1,Math.floor(t/revealStep));
   while(shown<ri){const c=cards[++shown];c.classList.add("revealed");if(token.list[shown].tier>=2){c.classList.add("rare-pop");sound(token.list[shown].tier);}}
   const si=Math.min(n-1,Math.floor((t-revealEnd)/sellStep));
   while(sold<si){const c=cards[++sold];c.classList.add("sold");c.parentElement.scrollTo({top:Math.max(0,c.offsetTop-c.parentElement.offsetTop-30),behavior:"smooth"});burst(c,token.list[sold].count,token.list[sold].tier);}
   const fraction=Math.max(0,Math.min(1,(t-revealEnd)/(n*sellStep+400)));
   screen.querySelector("[data-harvest-total]").textContent=Math.floor(token.result.value*fraction);
   if(t>=end){finish();sound(3);game.UIFeedbackSystem.pulse("success");return;}
   raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
 }
 function skip(){if(current&&!current.done){finish();sound(2);}}
 function double(screen,result){
  if(!current||!current.done||current.result!==result||result.doubled)return;
  const reply=game.GameSession.claimHarvestDouble(result);if(!reply.ok)return;
  const panel=screen.querySelector(".harvest-v09"),button=panel.querySelector("[data-action=harvest-double]");
  button.disabled=true;button.textContent="已翻倍";
  const total=panel.querySelector("[data-harvest-total]"),start=performance.now(),token=current;
  burst(button,8,3);
  const wallet=screen.querySelector(".coast-coins b");if(wallet)wallet.textContent=game.GameSession.getSave().player.coins;
  function tick(now){
   if(current!==token||!total.isConnected)return;
   const p=reduced()?1:Math.min(1,(now-start)/850);
   total.textContent=Math.round(result.value*(1+p));
   if(p<1)raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
 }
 game.HarvestPresentationSystem=Object.freeze({html,mount,skip,double,groups});
})(window);
