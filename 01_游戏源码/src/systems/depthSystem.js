"use strict";
/* v0.12 continuous depth atmosphere; no zone gates or combat changes. */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={});
 const layers=Object.freeze([
  {name:"晴光浅湾",min:0,color:"#8af4dd",hint:"阳光穿过海面，探索从这里开始"},
  {name:"蓝翠礁林",min:120,color:"#52d7cf",hint:"沿着礁石间的空隙，继续向下"},
  {name:"静谧沉船",min:220,color:"#80b9ff",hint:"旧船的轮廓，藏着海底的故事"},
  {name:"星辉深海",min:300,color:"#b9a7ff",hint:"循着微光，发现更深的秘密"}
 ]);
 let visited=new Set(),notice=null,lastWrite=0,dirty=false,activeSave=null,persist=null;
 const layer=d=>layers.reduce((a,b)=>d>=b.min?b:a,layers[0]);
 function reset(){visited=new Set();notice=null;}
 function flush(){if(dirty&&persist){persist();dirty=false;lastWrite=performance.now();}}
 function update(depth,save,write){
  if(!Number.isFinite(depth))return;
  activeSave=save;persist=write;
  const m=Math.min(356,Math.max(0,Math.floor(depth/10)));
  if(game.AnalyticsSystem)game.AnalyticsSystem.depth(m);
  save.exploration=save.exploration||{deepestMeters:0};
  if(m>save.exploration.deepestMeters){save.exploration.deepestMeters=m;dirty=true;}
  const current=layer(m);
  if(!visited.has(current.min)){visited.add(current.min);notice={...current,at:performance.now()};}
  if(performance.now()-lastWrite>2000)flush();
 }
 root.addEventListener("pagehide",flush);
 root.document.addEventListener("visibilitychange",()=>{if(root.document.hidden)flush();});
 function summary(save){
  const lv=Math.max(0,Math.min(10,save.player.rodLevel||0)),best=save.exploration?.deepestMeters||0;
  const target=lv<2?{lv:2,name:layers[1].name,min:120}:lv<5?{lv:5,name:layers[2].name,min:220}:lv<8?{lv:8,name:layers[3].name,min:300}:null;
  return "历史最深 "+best+" 米 · "+layer(best).name+"<br>"+(target?"探索目标："+target.name+" "+target.min+"米 · 建议鱼线 Lv."+target.lv+"（再升 "+(target.lv-lv)+" 次）":"已具备深海探索线长，继续升级可增加绕行与追鱼余量")+"<br>鱼线按行进路径消耗，海域不设等级锁。";
 }
 function atmosphere(ctx,x,y,w,h,waterY){
  ctx.save();
  const g=ctx.createLinearGradient(0,waterY,0,waterY+3560);
  for(const [d,c] of [[0,"rgba(38,216,195,0)"],[105,"rgba(24,181,163,.04)"],[135,"rgba(4,115,129,.20)"],[205,"rgba(9,86,141,.23)"],[235,"rgba(19,47,111,.48)"],[285,"rgba(25,41,100,.5)"],[315,"rgba(43,27,99,.64)"],[356,"rgba(26,22,79,.72)"]])g.addColorStop(d/356,c);
  ctx.fillStyle=g;ctx.fillRect(x,Math.max(y,waterY),w,h);
  // Deep bioluminescent motes: decorative only, stable world positions.
  const reduced=game.SettingsSystem.load().reducedMotion,t=reduced?0:performance.now()/1000;
  for(let row=0;row<9;row++)for(let col=Math.floor(x/180)-1;col<Math.ceil((x+w)/180)+1;col++){
   const px=col*180+55+Math.sin(row*9+col)*55,py=waterY+2850+row*86+Math.cos(col*7+row)*28;
   if(py<y-30||py>y+h+30)continue;
   const a=.24+.13*Math.sin(t*.8+row+col),r=12+row%3*3;
   const glow=ctx.createRadialGradient(px,py,0,px,py,r);
   glow.addColorStop(0,"rgba(125,241,239,"+a+")");glow.addColorStop(1,"rgba(117,153,255,0)");
   ctx.fillStyle=glow;ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="rgba(175,245,255,.55)";ctx.beginPath();ctx.arc(px,py,1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 function hud(ctx,depth,retract){
  const m=Math.max(0,Math.floor(depth/10)),current=layer(m),best=activeSave?.exploration?.deepestMeters||0;
  ctx.save();ctx.textAlign="center";ctx.font="600 15px sans-serif";
  ctx.fillStyle=current.color;ctx.shadowColor="#092b50";ctx.shadowBlur=4;
  ctx.fillText(current.name+" · 历史最深 "+best+" 米",270,retract?158:126);
  const left=160,top=retract?173:142,width=220;
  ctx.fillStyle="rgba(5,25,58,.5)";ctx.fillRect(left,top,width,4);
  for(const a of layers){ctx.fillStyle=a.color;ctx.fillRect(left+width*a.min/356,top-2,2,8);}
  ctx.fillStyle="#fff6c9";ctx.beginPath();ctx.arc(left+width*Math.min(356,m)/356,top+2,4,0,Math.PI*2);ctx.fill();
  if(notice&&!retract){
   const age=(performance.now()-notice.at)/1000;
   if(age<3.6){
    ctx.globalAlpha=Math.min(1,age*3,(3.6-age)*2);ctx.shadowBlur=0;
    ctx.fillStyle="rgba(8,32,62,.75)";ctx.beginPath();ctx.roundRect(88,184,364,72,18);ctx.fill();
    ctx.fillStyle=notice.color;ctx.font="bold 22px sans-serif";ctx.fillText(notice.name+" · "+notice.min+"米",270,213);
    ctx.fillStyle="#d6eff1";ctx.font="14px sans-serif";ctx.fillText(notice.hint,270,239);
   }
  }
  ctx.restore();
 }
 game.DepthSystem=Object.freeze({layers,layer,reset,update,flush,summary,atmosphere,hud});
})(window);
