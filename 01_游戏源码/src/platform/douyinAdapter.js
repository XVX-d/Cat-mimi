"use strict";
/* 抖音小游戏预留适配。网页环境不会执行；所有API均先判断存在性。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const platform = game.PlatformSystem, tt = root.tt;
  if (!platform || !tt) return;

  const adapter = {
    capabilities: { storage: "tt-sync", lifecycle: "tt", ads: false },
    createStorageAdapter: function () {
      return {
        getItem: function (key) { try { const value = tt.getStorageSync(key); return value == null || value === "" ? null : String(value); } catch (error) { return null; } },
        setItem: function (key, value) { if (typeof tt.setStorageSync === "function") tt.setStorageSync(key, value); },
        removeItem: function (key) { if (typeof tt.removeStorageSync === "function") tt.removeStorageSync(key); }
      };
    },
    init: function () {
      const onHide = typeof tt.onHide === "function" ? tt.onHide : tt.onAppHide;
      const onShow = typeof tt.onShow === "function" ? tt.onShow : tt.onAppShow;
      if (typeof onHide === "function") onHide.call(tt, platform.pause);
      if (typeof onShow === "function") onShow.call(tt, platform.resume);
      return true;
    },
    loadingStart: function () {}, loadingStop: function () {}, gameplayStart: function () {}, gameplayStop: function () {}, happytime: function () {}
  };

  platform.register("douyin", adapter);
  game.DouyinPlatform = Object.freeze({ enabled: platform.getState().name === "douyin", capabilities: adapter.capabilities });
})(window);
