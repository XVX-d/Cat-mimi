"use strict";
/* CrazyGames v3 适配器；初始化失败时由 PlatformSystem 静默退化。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const platform = game.PlatformSystem;
  if (!platform) throw new Error("crazyGamesAdapter.js requires platformSystem.js first.");
  let ready = false, lastHappy = 0;

  function loadSdk() {
    if (root.CrazyGames && root.CrazyGames.SDK) return Promise.resolve(root.CrazyGames.SDK);
    return new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      const timeout = root.setTimeout(function () { reject(new Error("CrazyGames SDK timeout")); }, 8000);
      script.src = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
      script.async = true;
      script.onload = function () { root.clearTimeout(timeout); resolve(root.CrazyGames && root.CrazyGames.SDK); };
      script.onerror = function (error) { root.clearTimeout(timeout); reject(error); };
      document.head.appendChild(script);
    });
  }
  function sdkGame() { return ready && root.CrazyGames && root.CrazyGames.SDK && root.CrazyGames.SDK.game; }
  function call(name) { const api = sdkGame(); if (!api || typeof api[name] !== "function") return; try { return api[name](); } catch (error) {} }

  const adapter = {
    capabilities: { storage: "CrazyGames Data", lifecycle: "crazygames-v3", ads: false },
    createStorageAdapter: function () {
      const local = root.localStorage;
      function data() { return ready && root.CrazyGames && root.CrazyGames.SDK && root.CrazyGames.SDK.data; }
      return {
        getItem: function (key) { const remote = data(); if (remote) return remote.getItem(key); return local ? local.getItem(key) : null; },
        setItem: function (key, value) { if (local) local.setItem(key, value); const remote = data(); if (remote) remote.setItem(key, value); },
        removeItem: function (key) { if (local) local.removeItem(key); const remote = data(); if (remote) remote.removeItem(key); }
      };
    },
    init: function () {
      return loadSdk().then(function (sdk) {
        if (!sdk) return false;
        return sdk.init().then(function () {
          ready = sdk.environment !== "disabled";
          if (ready && sdk.data && root.localStorage) {
            const key = game.SaveSystem.STORAGE_KEY;
            const remoteValue = sdk.data.getItem(key), localValue = root.localStorage.getItem(key);
            if (remoteValue == null && localValue != null) sdk.data.setItem(key, localValue);
          }
          return ready;
        });
      }).catch(function () { return false; });
    },
    loadingStart: function () { call("loadingStart"); },
    loadingStop: function () { call("loadingStop"); },
    gameplayStart: function () { call("gameplayStart"); },
    gameplayStop: function () { call("gameplayStop"); },
    happytime: function () { if (Date.now() - lastHappy < 30000) return; lastHappy = Date.now(); call("happytime"); }
  };

  platform.register("crazygames", adapter);
  game.CrazyGamesPlatform = Object.freeze({ enabled: platform.getState().name === "crazygames", ready: function () { return ready; }, capabilities: adapter.capabilities });
})(window);
