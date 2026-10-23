"use strict";
/* 主界面布局配置：编辑器只写这一层，不修改主界面业务与钓鱼逻辑。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const STORAGE_KEY = "cat-and-fish.home-layout.v06";
  const TARGETS = Object.freeze({
    yard: Object.freeze([
      { id: "header", label: "顶部状态栏", selector: ".life-header" },
      { id: "guide", label: "钓具升级", selector: ".coast-upgrade" },
      { id: "cast", label: "开始钓鱼按钮", selector: ".home-cast-entry" },
      { id: "quickActions", label: "右上功能按钮", selector: ".yard-quick-actions" }
    ]),
    interior: Object.freeze([
      { id: "careHeader", label: "顶部状态栏", selector: ".care-header" },
      { id: "careCat", label: "互动小猫", selector: ".care-cat" },
      { id: "affection", label: "好感度条", selector: ".care-affection" },
      { id: "wardrobe", label: "更换外观", selector: ".care-wardrobe" },
      { id: "careAquarium", label: "鱼缸图鉴入口", selector: ".care-aquarium" },
      { id: "pet", label: "抚摸按钮", selector: ".care-pet" },
      { id: "feed", label: "喂养按钮", selector: ".care-feed" },
      { id: "careCaption", label: "小猫名称提示", selector: ".care-caption" }
    ]),
    collection: Object.freeze([
      { id: "header", label: "顶部状态栏", selector: ".life-header" },
      { id: "heading", label: "图鉴统计区", selector: ".collection-heading" },
      { id: "tabs", label: "图鉴分类按钮", selector: ".catalog-tabs" },
      { id: "content", label: "图鉴卡片区域", selector: ".catalog-content" },
      { id: "nav", label: "底部主菜单", selector: ".life-nav" }
    ]),
  });
  let config = load();

  function empty() { return { version: 2, yard: {}, interior: {}, collection: {} }; }
  function number(value, fallback, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }
  function cleanItem(value) {
    value = value && typeof value === "object" ? value : {};
    const result = {
      dx: number(value.dx, 0, -1000, 1000),
      dy: number(value.dy, 0, -1200, 1200),
      opacity: number(value.opacity, 1, 0, 1),
      hidden: value.hidden === true
    };
    if (Number.isFinite(Number(value.width))) result.width = number(value.width, 1, 1, 1000);
    if (Number.isFinite(Number(value.height))) result.height = number(value.height, 1, 1, 1200);
    if (Number.isFinite(Number(value.zIndex))) result.zIndex = number(value.zIndex, 1, -10, 200);
    return result;
  }
  function sanitize(value) {
    const result = empty();
    Object.keys(TARGETS).forEach(function (scene) {
      const source = value && value[scene] && typeof value[scene] === "object" ? value[scene] : {};
      TARGETS[scene].forEach(function (target) {
        if (source[target.id]) result[scene][target.id] = cleanItem(source[target.id]);
      });
    });
    return result;
  }
  function load() {
    try {
      const built=root.MAOMAO_LAYOUT&&root.MAOMAO_LAYOUT.dom;
      const local=root.localStorage.getItem(STORAGE_KEY);
      const previous=JSON.parse(root.localStorage.getItem("cat-and-fish.home-layout.v1")||"{}");
      // New home composition; preserve both old layout data and current interior layout.
      return sanitize(built||(local?JSON.parse(local):{interior:previous.interior||{}}));
    }
    catch (error) { return empty(); }
  }
  function persist() {
    try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); return true; }
    catch (error) { return false; }
  }
  function getConfig() { return JSON.parse(JSON.stringify(config)); }
  function get(scene, id) {
    const item = config[scene] && config[scene][id];
    return item ? Object.assign({}, item) : cleanItem({});
  }
  function set(scene, id, value) {
    if (!TARGETS[scene] || !TARGETS[scene].some(function (target) { return target.id === id; })) return false;
    config[scene][id] = cleanItem(Object.assign({}, get(scene, id), value));
    persist();
    return true;
  }
  function replace(value) { config = sanitize(value); persist(); return getConfig(); }
  function reset(scene, id) {
    if (!scene) config = empty();
    else if (!id) config[scene] = {};
    else delete config[scene][id];
    persist();
  }
  function apply(screen, scene) {
    if (!screen || !TARGETS[scene]) return;
    TARGETS[scene].forEach(function (target) {
      const element = screen.querySelector(target.selector);
      if (!element) return;
      const item = config[scene][target.id];
      element.dataset.homeLayoutTarget = target.id;
      if (!item) return;
      element.style.setProperty("translate", item.dx + "px " + item.dy + "px", "important");
      element.style.setProperty("opacity", String(item.opacity), "important");
      element.style.setProperty("visibility", item.hidden ? "hidden" : "visible", "important");
      if (item.width) element.style.setProperty("width", item.width + "px", "important");
      if (item.height) {
        element.style.setProperty("height", item.height + "px", "important");
        element.style.setProperty("min-height", item.height + "px", "important");
      }
      if (Number.isFinite(item.zIndex)) element.style.setProperty("z-index", String(item.zIndex), "important");
    });
  }

  game.HomeLayoutSystem = Object.freeze({
    STORAGE_KEY: STORAGE_KEY,
    TARGETS: TARGETS,
    getTargets: function (scene) { return (TARGETS[scene] || []).slice(); },
    getConfig: getConfig,
    get: get,
    set: set,
    replace: replace,
    reset: reset,
    apply: apply
  });
})(window);
