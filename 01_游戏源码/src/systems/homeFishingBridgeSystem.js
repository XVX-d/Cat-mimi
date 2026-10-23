"use strict";
/* 主界面与钓鱼运行时之间的窄桥接：只负责切换状态，不接触鱼 AI、鱼钩或碰撞。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  let mode="home";

  function getState(){return {mode:mode,isFishing:mode==="fishing"};}

  function start(mapId){
    if(mode!=="home")return false;
    const session=game.GameSession;
    if(!session||typeof session.startFromHome!=="function")return false;
    mode="starting";
    try{
      if(session.startFromHome(mapId)!==true)return false;
      mode="fishing";
    }finally{
      if(mode==="starting")mode="home";
    }
    if(game.HomeSystem&&game.HomeSystem.beginFishing)game.HomeSystem.beginFishing();
    return true;
  }

  function returnHome(){mode="home";}

  game.HomeFishingBridgeSystem=Object.freeze({
    start:start,
    returnHome:returnHome,
    getState:getState
  });
})(window);
