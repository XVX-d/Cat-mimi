"use strict";
/* 局外场景路由：只管理游戏内场景，不改变 URL，也不依赖 FishingSystem。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  const valid=new Set(["yard","interior","collection"]);
  let stack=["yard"];
  const listeners=[];
  function current(){return stack[stack.length-1];}
  function snapshot(){return {scene:current(),canBack:stack.length>1,stack:stack.slice()};}
  function emit(){const value=snapshot();listeners.slice().forEach(fn=>fn(value));return value;}
  function go(scene,options){
    if(!valid.has(scene))return snapshot();
    const replace=!!(options&&options.replace);
    if(replace)stack[stack.length-1]=scene;
    else if(current()!==scene)stack.push(scene);
    return emit();
  }
  function back(){if(stack.length>1)stack.pop();return emit();}
  function home(){stack=["yard"];return emit();}
  function subscribe(fn){listeners.push(fn);return ()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  game.SceneRouterSystem=Object.freeze({get:snapshot,go:go,back:back,home:home,subscribe:subscribe});
})(window);
