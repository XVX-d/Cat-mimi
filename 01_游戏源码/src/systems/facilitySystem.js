"use strict";
/* 设施存档与展示状态；支付由 GameSession 的经济适配层负责。 */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={}),config=game.FacilityConfig;
 function ensure(save){save.home=save.home||{};save.home.facilities=save.home.facilities||{};config.list().forEach(x=>{if(!x.linkedUpgrade&&!save.home.facilities[x.id])save.home.facilities[x.id]=1;});return save.home.facilities;}
 function level(save,id){const item=config.getById(id);if(!item)return 0;if(item.linkedUpgrade==="line")return Math.min(item.maxLevel,(save.player.rodLevel||0)+1);if(item.linkedUpgrade==="hook")return Math.min(item.maxLevel,(save.player.hookLevel||0)+1);return Math.min(item.maxLevel,Math.max(1,ensure(save)[id]||1));}
 function view(save,id){const item=config.getById(id);if(!item)return null;const current=level(save,id);return Object.assign({},item,{level:current,isMax:current>=item.maxLevel,nextCost:current<item.maxLevel?item.costs[current-1]:null,appearance:item.appearances[current-1]||item.appearances[item.appearances.length-1],currentBenefit:item.benefitValues&&item.benefitValues[current-1]||item.benefit,nextBenefit:current<item.maxLevel&&item.benefitValues&&item.benefitValues[current]||null});}
 function setLevel(save,id,value){const item=config.getById(id);if(!item||item.linkedUpgrade)return false;ensure(save)[id]=Math.min(item.maxLevel,Math.max(1,Math.floor(value||1)));return true;}
 function list(save){ensure(save);return config.list().map(x=>view(save,x.id));}
 game.FacilitySystem=Object.freeze({ensure:ensure,getLevel:level,getView:view,setLevel:setLevel,list:list});
})(window);
