"use strict";
(function (root) {
  if (!/[?&]main-layout-editor=1(?:&|$)/.test(root.location.search)) return;
  const TYPE_CMD = "CF_MAIN_EDITOR_CMD";
  const TYPE_STATE = "CF_MAIN_EDITOR_STATE";
  const game = root.CatFishGame;
  const canvasSystem = game && game.MainSceneLayoutSystem;
  const domSystem = game && game.HomeLayoutSystem;
  const homeSystem = game && game.HomeSystem;
  const router = game && game.SceneRouterSystem;
  if (!canvasSystem || !domSystem || !homeSystem || !router) return;
  let activeView = "yard", viewReady = false;

  function home() { return root.document.getElementById("homeScreen"); }
  function homeTargets() { return activeView === "fishing" ? [] : domSystem.getTargets(activeView); }
  function applyFishingConfig() {
    const saved = canvasSystem.getUIConfig();
    Object.keys(saved).forEach(function (id) {
      if (root.UI_CFG && root.UI_CFG[id]) Object.assign(root.UI_CFG[id], saved[id]);
    });
  }
  function showView(view) {
    activeView = ["yard","fishing","collection","interior"].includes(view) ? view : "yard";
    if (!root._loadingFinalized) { viewReady = false; return; }
    if (activeView === "fishing") {
      root.UI_EDIT_MODE = true;
      const bridge = game.HomeFishingBridgeSystem;
      if (bridge && !bridge.getState().isFishing) {
        const state = game.HomeStateSystem.get();
        bridge.start(state.selectedMap);
      }
      if (home()) home().classList.add("hidden");
      applyFishingConfig();
      root.setTimeout(sendState, 500);
      viewReady = true;
      return;
    }
    if (!home()) { viewReady = false; return; }
    root.UI_EDIT_MODE = false;
    homeSystem.show();
    router.home();
    if (activeView !== "yard") router.go(activeView);
    homeSystem.render();
    domSystem.apply(home(), activeView);
    viewReady = true;
    root.requestAnimationFrame(sendState);
  }
  function sendState() {
    if (!root._loadingFinalized) return;
    const canvasState = root.__getMainSceneEditorState ? root.__getMainSceneEditorState() : { zoom: 1, rects: {} };
    const domRects = {};
    homeTargets().forEach(function (target) {
      const element = home() && home().querySelector(target.selector);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const style = root.getComputedStyle(element);
      domRects[target.id] = { x: rect.left, y: rect.top, w: rect.width, h: rect.height, hidden: style.visibility === "hidden" };
    });
    const ui = canvasSystem.getUIConfig();
    const uiRects = {};
    canvasSystem.getUIDefinitions().forEach(function (item) {
      const value = ui[item.id];
      uiRects[item.id] = {x:value.x,y:value.y,w:value.w,h:value.h,hidden:false};
    });
    root.parent.postMessage({ type: TYPE_STATE, state: {
      activeView: activeView,
      zoom: canvasState.zoom || 1,
      canvasRects: activeView === "yard" ? (canvasState.rects || {}) : {},
      canvasDefinitions: activeView === "yard" ? canvasSystem.getDefinitions() : [],
      fishingRects: activeView === "fishing" ? uiRects : {},
      fishingDefinitions: activeView === "fishing" ? canvasSystem.getUIDefinitions() : [],
      canvasConfig: canvasSystem.getConfig(),
      domConfig: domSystem.getConfig(),
      domDefinitions: homeTargets(),
      domRects: domRects
    } }, "*");
  }
  function rerenderDom() {
    homeSystem.render();
    domSystem.apply(home(), activeView);
  }
  root.addEventListener("message", function (event) {
    const message = event.data;
    if (!message || message.type !== TYPE_CMD) return;
    const payload = message.payload || {};
    if (message.command === "hello") { sendState(); return; }
    if (message.command === "set-view") { showView(payload.view); return; }
    if (message.command === "set-canvas") canvasSystem.set(payload.id, payload.patch || {});
    if (message.command === "set-ui") {
      const value = canvasSystem.setUI(payload.id, payload.patch || {});
      if (value && root.UI_CFG && root.UI_CFG[payload.id]) Object.assign(root.UI_CFG[payload.id], value);
    }
    if (message.command === "set-dom") {
      domSystem.set(activeView, payload.id, payload.patch || {});
      domSystem.apply(home(), activeView);
    }
    if (message.command === "replace") {
      canvasSystem.replace(payload.canvas || {});
      domSystem.replace(payload.dom || {});
      applyFishingConfig();
      if (activeView !== "fishing") rerenderDom();
    }
    if (message.command === "reset-canvas") canvasSystem.reset(payload.id || null);
    if (message.command === "reset-ui") { canvasSystem.resetUI(payload.id || null); applyFishingConfig(); }
    if (message.command === "reset-dom") { domSystem.reset(activeView, payload.id); rerenderDom(); }
    if (message.command === "reset-view") {
      if (activeView === "yard") { canvasSystem.reset(); domSystem.reset("yard"); rerenderDom(); }
      else if (activeView === "fishing") { canvasSystem.resetUI(); applyFishingConfig(); }
      else { domSystem.reset(activeView); rerenderDom(); }
    }
    if(game.CoastSystem&&home()&&activeView!=="fishing")game.CoastSystem.placeUI(home());
    root.requestAnimationFrame(sendState);
  });
  root.setInterval(function () {
    if (!viewReady && home()) showView(activeView);
    else sendState();
  }, 180);
  root.setTimeout(function () { showView("yard"); }, 100);
})(window);
