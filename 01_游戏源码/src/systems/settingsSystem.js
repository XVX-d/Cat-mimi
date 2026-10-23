"use strict";
/* 与玩家养成存档分离的设备设置，未来可替换为平台设置接口。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={}),KEY="cat-and-fish.settings.v1";
  const defaults={sound:true,vibration:true,reducedMotion:false};
  let current;
  function load(){if(current)return current;try{current=Object.assign({},defaults,JSON.parse(root.localStorage.getItem(KEY)||"{}"));}catch(e){current=Object.assign({},defaults);}return current;}
  function save(){try{root.localStorage.setItem(KEY,JSON.stringify(load()));}catch(e){}return current;}
  function set(key,value){if(!(key in defaults))return load();load()[key]=!!value;return save();}
  game.SettingsSystem=Object.freeze({load:load,set:set});
})(window);
