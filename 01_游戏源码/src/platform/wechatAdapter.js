"use strict";
(function(root){
  if(!root.wx||!root.CatFishGame)return;
  const game=root.CatFishGame,wx=root.wx;
  game.PlatformSystem.register('wechat',{
    capabilities:{storage:'微信本地存档',lifecycle:'wechat'},
    createStorageAdapter:()=>({
      getItem:key=>{const v=wx.getStorageSync(key);return v===''?null:v;},
      setItem:(key,value)=>wx.setStorageSync(key,value),
      removeItem:key=>wx.removeStorageSync(key)
    }),
    init:()=>true
  });
})(window);
