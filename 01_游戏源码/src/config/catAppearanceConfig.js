"use strict";
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={});
 const rows=[
 ["default","蓝衣小橘",-1,null,0,null,0],
 ["cowboy","海风牛仔",1,"fish_05",3,"fish_01",2],
 ["tennis","活力网球手",3,"fish_08",3,"fish_02",5],
 ["chef","海味小厨师",4,"fish_12",3,"fish_11",4],
 ["rocker","摇滚海浪",0,"fish_18",3,"fish_03",6],
 ["clown","彩虹小丑",6,"fish_15",3,"fish_04",6],
 ["bunny","软萌小兔",7,"fish_19",3,"fish_06",8],
 ["police","码头巡逻员",2,"fish_23",3,"fish_16",8],
 ["vampire","月夜伯爵",5,"fish_27",3,"fish_22",6],
 ["santa","圣诞喵喵",8,"fish_29",3,"fish_21",8]];
 const appearances=rows.map(([id,name,frame,f1,n1,f2,n2])=>Object.freeze({id,name,frame,accessory:"",requiredFishId:f1,
 recipe:Object.freeze(f1?[Object.freeze({fishId:f1,count:n1}),Object.freeze({fishId:f2,count:n2})]:[]),
 description:id==="default"?"免费初始外观":"累计钓获指定鱼解锁 · 共用成长与钓具"}));
 game.CatAppearanceConfig=Object.freeze({list:()=>appearances.slice(),getById:id=>appearances.find(x=>x.id===id)||null,
 getUnlockByFishId:id=>appearances.find(x=>x.recipe.some(r=>r.fishId===id))||null,
 getUnlocksByFishId:id=>appearances.filter(x=>x.recipe.some(r=>r.fishId===id))});
})(window);
