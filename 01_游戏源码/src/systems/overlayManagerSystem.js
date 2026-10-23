"use strict";
/* 局外统一浮层：设置、升级和收获共用一个状态入口。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  let active=null,data=null;
  const listeners=[];
  function snapshot(){return {active:active,data:data};}
  function emit(){const value=snapshot();listeners.slice().forEach(fn=>fn(value));return value;}
  function open(name,payload){active=name||null;data=payload||null;return emit();}
  function close(){active=null;data=null;return emit();}
  function subscribe(fn){listeners.push(fn);return ()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  game.OverlayManagerSystem=Object.freeze({get:snapshot,open:open,close:close,subscribe:subscribe});
})(window);
