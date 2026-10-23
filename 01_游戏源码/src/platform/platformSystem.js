"use strict";
/* 统一平台生命周期。平台适配器只实现能力，游戏系统只消费统一事件。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const events = game.GameEvents;
  const adapters = {};
  const state = { name: detect(), ready: false, settled: false, loadingDone: false, wantsPlaying: false, playing: false, paused: false };
  let active = null, initPromise = null;

  function detect() {
    if (root.wx && typeof root.wx.createCanvas === "function") return "wechat";
    if (root.tt && (typeof root.tt.getSystemInfoSync === "function" || typeof root.tt.getEnvInfoSync === "function")) return "douyin";
    const host = root.location && root.location.hostname || "";
    const search = root.location && root.location.search || "";
    if (/(^|\.)crazygames\.com$/i.test(host) || /[?&](crazygames|isCrazyGames)=1/i.test(search)) return "crazygames";
    return "web";
  }

  function safeCall(name) {
    if (!active || typeof active[name] !== "function") return;
    try { return active[name](); } catch (error) {}
  }

  function activate(name) {
    if (name !== state.name || !adapters[name] || active === adapters[name]) return initPromise;
    active = adapters[name];
    if (active.createStorageAdapter && game.SaveSystem) {
      try { game.SaveSystem.setStorageAdapter(active.createStorageAdapter()); } catch (error) {}
    }
    initPromise = Promise.resolve(typeof active.init === "function" ? active.init() : true).then(function (ok) {
      state.ready = ok !== false;
      state.settled = true;
      if (state.loadingDone) safeCall("loadingStop"); else safeCall("loadingStart");
      if (state.wantsPlaying && !state.paused) { safeCall("gameplayStart"); state.playing = true; }
      events.emit(events.EVENTS.PLATFORM_READY, getState());
      return state.ready;
    }).catch(function () { state.ready = false; state.settled = true; return false; });
    return initPromise;
  }

  function register(name, adapter) { adapters[name] = adapter || {}; activate(name); return adapter; }
  function loadingComplete() { state.loadingDone = true; if (state.ready) safeCall("loadingStop"); }
  function gameplayStart() { state.wantsPlaying = true; if (state.ready && !state.paused && !state.playing) { safeCall("gameplayStart"); state.playing = true; } }
  function gameplayStop() { state.wantsPlaying = false; if (state.ready && state.playing) safeCall("gameplayStop"); state.playing = false; }
  function pause() {
    if (state.paused) return;
    state.paused = true;
    if (state.ready && state.playing) safeCall("gameplayStop");
    state.playing = false;
    events.emit(events.EVENTS.APP_PAUSED, getState());
  }
  function resume() {
    if (!state.paused) return;
    state.paused = false;
    events.emit(events.EVENTS.APP_RESUMED, getState());
    if (state.ready && state.wantsPlaying) { safeCall("gameplayStart"); state.playing = true; }
  }
  function happytime() { if (state.ready) safeCall("happytime"); }
  function getState() { return Object.assign({}, state, { capabilities: active && active.capabilities || {} }); }

  register("web", { init: function () { return true; }, capabilities: { storage: "local", lifecycle: "browser" } });
  events.on(events.EVENTS.MAP_ENTERED, gameplayStart);
  events.on(events.EVENTS.RETURNED_HOME, gameplayStop);
  root.document.addEventListener("visibilitychange", function () { root.document.hidden ? pause() : resume(); });
  root.addEventListener("pagehide", pause);
  root.addEventListener("pageshow", function () { if (!root.document.hidden) resume(); });
  root.addEventListener("blur", pause);
  root.addEventListener("focus", function () { if (!root.document.hidden) resume(); });
  (function waitForLoading() { if (root._loadingFinalized) loadingComplete(); else root.setTimeout(waitForLoading, 150); })();

  game.PlatformSystem = Object.freeze({
    register: register,
    ready: function () { return initPromise || Promise.resolve(state.ready); },
    isBlocking: function () { return state.name === "crazygames" && !state.settled; },
    loadingComplete: loadingComplete,
    gameplayStart: gameplayStart,
    gameplayStop: gameplayStop,
    pause: pause,
    resume: resume,
    happytime: happytime,
    getState: getState
  });
})(window);
