"use strict";
/* Single ocean. Depth progression is owned by DepthSystem, not map unlocks. */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={});
 const ocean=Object.freeze({id:"tide_dock",name:"潮汐码头",description:"同一片海域，按深度探索",defaultUnlocked:true,fishKinds:["s","m","l"]});
 game.MapConfig=Object.freeze({list:()=>[ocean],getById:id=>id==="tide_dock"?ocean:null});
})(window);
