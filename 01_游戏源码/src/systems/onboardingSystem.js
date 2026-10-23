"use strict";
/* 首次十分钟流程：事件只写里程碑，所有界面都从同一状态推导下一步。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const events = game.GameEvents;
  const saveApi = game.SaveSystem;

  function ensure(save) {
    const defaults = game.SaveData.createDefault().onboarding;
    save.onboarding = save.onboarding || {};
    Object.keys(defaults).forEach(function (key) {
      if (key === "completed") return;
      const value = save.onboarding[key];
      save.onboarding[key] = typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : defaults[key];
    });
    refresh(save.onboarding);
    return save.onboarding;
  }

  function refresh(state) {
    state.completed = state.completed === true || (state.voyagesStarted >= 2 && state.fishCaught >= 1 &&
      state.roundsSettled >= 2 && state.returnsHome >= 2 && state.gearUpgrades >= 1);
    return state;
  }

  function snapshot(save) {
    return Object.assign({}, ensure(save));
  }

  function increment(save, field, amount) {
    if (!save) return null;
    const state = ensure(save);
    state[field] = Math.min(999999, state[field] + Math.max(1, Math.floor(amount || 1)));
    refresh(state);
    saveApi.save(save);
    return Object.assign({}, state);
  }

  function getStep(save) {
    const state = ensure(save);
    if (state.completed) return null;
    if (state.voyagesStarted < 1) return {
      id: "first_voyage", icon: "🎣", title: "第一次出海",
      detail: "先去潮汐码头，完成一次抛钩与收线", kind: "action", target: "start-fishing"
    };
    if (state.fishCaught < 1 || state.roundsSettled < 1 || state.returnsHome < 1) return {
      id: "first_catch", icon: "🐟", title: "完成第一次捕获",
      detail: "拖动控制鱼钩，碰到鱼后收线返航", kind: "action", target: "start-fishing"
    };
    if (state.gearUpgrades < 1) return {
      id: "first_upgrade", icon: "🧰", title: "升级一件渔具",
      detail: "点击首页的钓具升级，用本次收益强化鱼竿或鱼钩", kind: "overlay", target: "tackle", badge: "必做"
    };
    if (state.voyagesStarted < 2 || state.roundsSettled < 2 || state.returnsHome < 2) return {
      id: "second_voyage", icon: "⚓", title: "再次出海验证升级",
      detail: "再完成一轮钓鱼并平安返航", kind: "action", target: "start-fishing", badge: "最后一步"
    };
    return null;
  }

  function isGearUpgrade(payload) {
    return payload && (payload.kind === "line" || payload.kind === "atk" ||
      payload.facilityId === "rod_rack" || payload.facilityId === "hook_bench");
  }

  if (events) {
    events.on(events.EVENTS.MAP_ENTERED, function (payload) {
      if (payload && payload.source === "home_pier") increment(payload.save, "voyagesStarted");
    });
    events.on(events.EVENTS.FISH_CAUGHT, function (payload) { increment(payload && payload.save, "fishCaught"); });
    events.on(events.EVENTS.ROUND_SETTLED, function (payload) { increment(payload && payload.save, "roundsSettled"); });
    events.on(events.EVENTS.RETURNED_HOME, function (payload) {
      if (!payload || payload.reason !== "manual_exit") increment(payload && payload.save, "returnsHome");
    });
    events.on(events.EVENTS.UPGRADE_PURCHASED, function (payload) {
      if (isGearUpgrade(payload)) increment(payload.save, "gearUpgrades");
    });
  }

  game.OnboardingSystem = Object.freeze({
    ensure: ensure,
    getState: snapshot,
    getStep: getStep,
    isComplete: function (save) { return ensure(save).completed; }
  });
})(window);
