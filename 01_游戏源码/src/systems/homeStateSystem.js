"use strict";
/* 局外主界面的单一状态源：不依赖 FishingSystem。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  const state={selectedMap:"tide_dock",collectionTab:"fish"};
  const listeners=[];
  function snapshot(){return Object.assign({},state);}
  function set(patch){Object.assign(state,patch||{});listeners.slice().forEach(fn=>fn(snapshot()));return snapshot();}
  function reset(){return set({selectedMap:"tide_dock",collectionTab:"fish"});}
  function subscribe(fn){listeners.push(fn);return ()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  game.HomeStateSystem=Object.freeze({get:snapshot,set:set,reset:reset,subscribe:subscribe});
})(window);
