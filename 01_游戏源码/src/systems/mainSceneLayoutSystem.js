"use strict";
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  // Keep the previous editor layout under its original key for recovery.
  const STORAGE_KEY = "cat-and-fish.main-scene-layout.v06";
  const UI_DEFINITIONS = Object.freeze([
    {id:"hudLine",label:"鱼线长度条",x:12,y:18,w:517,h:31,minW:120,minH:18},
    {id:"hudCoin",label:"金币底框",x:14,y:69,w:95,h:32,minW:45,minH:22},
    {id:"hudCoinIcon",label:"金币图标",x:16,y:70,w:30,h:30,minW:16,minH:16},
    {id:"hudGoal",label:"当前目标",x:8,y:108,w:147,h:36,minW:70,minH:20},
    {id:"reelBtn",label:"手动收线按钮",x:397,y:800,w:107,h:78,minW:54,minH:42},
    {id:"exitBtn",label:"离开钓鱼按钮",x:16,y:18,w:82,h:31,minW:44,minH:24}
  ]);
  const DEFINITIONS = Object.freeze([
    {id:"pier",label:"木码头",x:-55,y:12,w:412.25,h:274.55,minW:100,minH:60},
    {id:"cat",label:"玩家猫咪",x:105,y:-87,w:242.25,h:242.25,minW:60,minH:60},
    {id:"camera",label:"首页镜头（x/y）",x:0,y:-462,w:540,h:960,minW:540,minH:960},
    {id:"upgrade",label:"头顶升级偏移（x/y）",x:34,y:-58,w:170,h:66,minW:100,minH:44},
    {id:"start",label:"开始按钮（屏幕坐标）",x:106,y:790,w:328,h:102,minW:150,minH:60}
  ]);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function definition(id) { return DEFINITIONS.find(function (item) { return item.id === id; }); }
  function clampNumber(value, fallback, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }
  function defaults() {
    const result = { version: 4, components: {}, ui: {} };
    DEFINITIONS.forEach(function (item) {
      result.components[item.id] = { x: item.x, y: item.y, w: item.w, h: item.h, hidden: false };
    });
    UI_DEFINITIONS.forEach(function (item) {
      result.ui[item.id] = { x: item.x, y: item.y, w: item.w, h: item.h };
    });
    return result;
  }
  function sanitize(value) {
    const result = defaults();
    const source = value && value.components && typeof value.components === "object" ? value.components : {};
    DEFINITIONS.forEach(function (item) {
      // v2 更换为正面横向码头；仅重置旧码头比例，其他已编辑部件原样保留。
      const legacyPier = Number(value && value.version || 1) < 3;
      const current = !legacyPier && source[item.id] && typeof source[item.id] === "object" ? source[item.id] : {};
      result.components[item.id] = {
        x: clampNumber(current.x, item.x, -1200, 1800),
        y: clampNumber(current.y, item.y, -1200, 4200),
        w: clampNumber(current.w, item.w, item.minW, 1500),
        h: clampNumber(current.h, item.h, item.minH, 1500),
        hidden: current.hidden === true
      };
    });
    const uiSource = value && value.ui && typeof value.ui === "object" ? value.ui : {};
    UI_DEFINITIONS.forEach(function (item) {
      const current = uiSource[item.id] && typeof uiSource[item.id] === "object" ? uiSource[item.id] : {};
      result.ui[item.id] = {
        x: clampNumber(current.x, item.x, -1000, 1500),
        y: clampNumber(current.y, item.y, -1200, 1800),
        w: clampNumber(current.w, item.w, item.minW, 1000),
        h: clampNumber(current.h, item.h, item.minH, 1000)
      };
    });
    return result;
  }
  function load() {
    try { const built=root.MAOMAO_LAYOUT&&root.MAOMAO_LAYOUT.canvas; const local=JSON.parse(root.localStorage.getItem(STORAGE_KEY)||"{}"); return sanitize(built||local); }
    catch (error) { return defaults(); }
  }
  let config = load();
  function persist() {
    try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); return true; }
    catch (error) { return false; }
  }
  function get(id) {
    const item = config.components[id];
    return item ? Object.assign({}, item) : null;
  }
  function set(id, patch) {
    const item = definition(id);
    if (!item) return false;
    const next = clone(config);
    next.components[id] = Object.assign({}, next.components[id], patch || {});
    config = sanitize(next);
    persist();
    return get(id);
  }
  function setUI(id, patch) {
    const item = UI_DEFINITIONS.find(function (entry) { return entry.id === id; });
    if (!item) return false;
    const next = clone(config);
    next.ui[id] = Object.assign({}, next.ui[id], patch || {});
    config = sanitize(next);
    persist();
    return Object.assign({}, config.ui[id]);
  }
  function replace(value) { config = sanitize(value); persist(); return clone(config); }
  function reset(id) {
    if (!id) config = defaults();
    else {
      const item = definition(id);
      if (!item) return false;
      config.components[id] = { x: item.x, y: item.y, w: item.w, h: item.h, hidden: false };
    }
    persist();
    return true;
  }
  function resetUI(id) {
    if (!id) UI_DEFINITIONS.forEach(function (item) { config.ui[item.id] = {x:item.x,y:item.y,w:item.w,h:item.h}; });
    else {
      const item = UI_DEFINITIONS.find(function (entry) { return entry.id === id; });
      if (!item) return false;
      config.ui[id] = {x:item.x,y:item.y,w:item.w,h:item.h};
    }
    persist();
    return true;
  }

  game.MainSceneLayoutSystem = Object.freeze({
    STORAGE_KEY: STORAGE_KEY,
    getDefinitions: function () { return DEFINITIONS.map(function (item) { return Object.assign({}, item); }); },
    getUIDefinitions: function () { return UI_DEFINITIONS.map(function (item) { return Object.assign({}, item); }); },
    getConfig: function () { return clone(config); },
    getUIConfig: function () { return clone(config.ui); },
    get: get,
    set: set,
    setUI: setUI,
    replace: replace,
    reset: reset,
    resetUI: resetUI
  });
})(window);
