"use strict";
/* ================================================================
   猫与鱼 · GameEventBus
   ----------------------------------------------------------------
   模块间的单向通知层。事件订阅者的异常会被隔离，不能中断核心玩法。
   当前文件只定义接口；接入 game.js 的事件派发将在独立的小步中完成。
   ================================================================ */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const listeners = new Map();

  const EVENTS = Object.freeze({
    GAME_STARTED: "game_started",
    ROUND_STARTED: "round_started",
    FISHING_STARTED: "fishing_started",
    FISH_CAUGHT: "fish_caught",
    FISH_FIRST_DISCOVERED: "fish_first_discovered",
    ROUND_SETTLED: "round_settled",
    UPGRADE_PURCHASED: "upgrade_purchased",
    RARE_FISH_SIGHTED: "rare_fish_sighted",
    CAT_APPEARANCE_UNLOCKED: "cat_appearance_unlocked",
    CAT_APPEARANCE_CHANGED: "cat_appearance_changed",
    MAP_ENTERED: "map_entered",
    RETURNED_HOME: "returned_home",
    MAP_UNLOCKED: "map_unlocked",
    MAP_OBJECTIVE_COMPLETED: "map_objective_completed",
    PLATFORM_READY: "platform_ready",
    APP_PAUSED: "app_paused",
    APP_RESUMED: "app_resumed"
  });

  function on(eventName, listener) {
    if (typeof listener !== "function") {
      throw new Error("GameEventBus listener must be a function.");
    }
    const group = listeners.get(eventName) || new Set();
    group.add(listener);
    listeners.set(eventName, group);
    return function unsubscribe() {
      off(eventName, listener);
    };
  }

  function once(eventName, listener) {
    let unsubscribe = null;
    unsubscribe = on(eventName, function (payload) {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  function off(eventName, listener) {
    const group = listeners.get(eventName);
    if (!group) return;
    group.delete(listener);
    if (group.size === 0) listeners.delete(eventName);
  }

  function emit(eventName, payload) {
    const group = listeners.get(eventName);
    if (!group) return 0;
    let delivered = 0;
    // 复制 Set，允许监听器在回调里安全取消自己或其他监听器。
    Array.from(group).forEach(function (listener) {
      try {
        listener(payload);
        delivered++;
      } catch (error) {
        console.warn("[GameEventBus] listener failed for", eventName, error);
      }
    });
    return delivered;
  }

  function clear(eventName) {
    if (eventName === undefined) {
      listeners.clear();
      return;
    }
    listeners.delete(eventName);
  }

  game.GameEvents = Object.freeze({
    EVENTS: EVENTS,
    on: on,
    once: once,
    off: off,
    emit: emit,
    clear: clear
  });
})(window);
