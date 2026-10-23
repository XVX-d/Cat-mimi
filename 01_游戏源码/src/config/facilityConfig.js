"use strict";
/* 小屋设施配置：数值、文案与外观阶段集中维护。 */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={}),balance=game.BalanceConfig;
 const facilities=[
  {id:"rod_rack",name:"鱼竿架",icon:"🎣",description:"整理并强化鱼竿，前往更深的水域。",benefit:"提升最大探索深度",benefitValues:balance.gear.rod.lineDistances.map(value=>Math.round(value/10)+"米鱼线"),linkedUpgrade:"line",maxLevel:balance.gear.rod.lineDistances.length,costs:balance.gear.rod.costs.slice(),appearances:["旧木架","结实鱼竿架","专业渔具架","大师陈列架"],position:"left-low"},
  {id:"hook_bench",name:"鱼钩工作台",icon:"⚓",description:"打磨鱼钩，让捕获大型鱼更轻松。",benefit:"提升鱼钩捕获伤害",benefitValues:balance.gear.hook.damage.map(value=>value>=999?"必定捕获":"每次命中 "+value+" 点伤害"),linkedUpgrade:"hook",maxLevel:4,costs:balance.gear.hook.costs.slice(),appearances:["简易工具箱","铜制工作台","精工工作台","海王工作台"],position:"center-low"},
  {id:"fish_bucket",name:"收获鱼篓",icon:"🪣",description:"妥善保存鱼获，提高每次返航的结算收益。",benefit:"提高返航结算金币",benefitValues:balance.gear.bucket.settlementBonus.map(value=>"结算 +"+Math.round(value*100)+"%"),maxLevel:3,costs:balance.gear.bucket.costs.slice(),appearances:["旧木鱼篓","加固鱼箱","恒温收藏箱"],position:"right-low"}
 ];
 game.FacilityConfig=Object.freeze({list:()=>facilities.map(x=>Object.assign({},x)),getById:id=>{const found=facilities.find(x=>x.id===id);return found?Object.assign({},found):null;}});
})(window);
