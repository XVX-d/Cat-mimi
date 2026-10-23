"use strict";
(function () {
  const frame = document.getElementById("gamePreview"), wrap = document.getElementById("previewWrap");
  const layerList = document.getElementById("layerList"), form = document.getElementById("propertyForm");
  const emptyState = document.getElementById("emptyState"), statusText = document.getElementById("statusText");
  const configText = document.getElementById("configText"), zoomValue = document.getElementById("zoomValue");
  const props = { dx: document.getElementById("propX"), dy: document.getElementById("propY"), width: document.getElementById("propW"), height: document.getElementById("propH"), zIndex: document.getElementById("propZ"), opacity: document.getElementById("propOpacity"), hidden: document.getElementById("propHidden") };
  let scene = document.body.dataset.initialScene === "interior" ? "interior" : "yard", selected = null, zoom = .75, dragging = null, ready = false, history = [], future = [], propertySnapshotTaken = false;

  function win() { return frame.contentWindow; }
  function system() { return win().CatFishGame && win().CatFishGame.HomeLayoutSystem; }
  function home() { return win().document.getElementById("homeScreen"); }
  function targetInfo(id) { return system().getTargets(scene).find(function (item) { return item.id === id; }); }
  function elementFor(id) { const info = targetInfo(id); return info && home() ? home().querySelector(info.selector) : null; }
  function status(text) { statusText.textContent = text; }
  function snapshot() { return system().getConfig(); }
  function pushHistory() { history.push(snapshot()); if (history.length > 60) history.shift(); future = []; }
  function restore(value) { system().replace(value); renderPreview(); select(selected); }
  function setZoom(value) {
    zoom = Math.max(.3, Math.min(1.25, value));
    wrap.style.transform = "scale(" + zoom + ")";
    wrap.style.marginBottom = Math.round(960 * (zoom - 1)) + "px";
    zoomValue.textContent = Math.round(zoom * 100) + "%";
  }
  function fit() {
    const area = document.querySelector(".canvas-scroll");
    setZoom(Math.min(.95, (area.clientHeight - 82) / 960, (area.clientWidth - 86) / 540));
  }
  function renderPreview() {
    if (!ready) return;
    win().CatFishGame.HomeSystem.render();
    system().apply(home(), scene);
    refreshLayers();
    refreshConfig();
  }
  function showScene(next) {
    if (!ready) return;
    scene = next;
    selected = null;
    const router = win().CatFishGame.SceneRouterSystem;
    router.home();
    if (scene === "interior") router.go("interior");
    renderPreview();
    document.querySelectorAll("[data-scene]").forEach(function (button) { button.classList.toggle("active", button.dataset.scene === scene); });
    select(null);
    status(scene === "yard" ? "正在编辑：院子" : "正在编辑：小屋内部");
  }
  function refreshLayers() {
    if (!ready) return;
    layerList.innerHTML = system().getTargets(scene).map(function (item) {
      return '<button data-layer="' + item.id + '" class="' + (selected === item.id ? "active " : "") + (elementFor(item.id) ? "" : "missing") + '">' + item.label + '</button>';
    }).join("");
  }
  function select(id) {
    if (!ready) return;
    const old = frame.contentDocument.querySelector(".home-editor-picked");
    if (old) old.classList.remove("home-editor-picked");
    selected = id && elementFor(id) ? id : null;
    refreshLayers();
    if (!selected) {
      form.classList.add("hidden"); emptyState.classList.remove("hidden");
      document.getElementById("propName").value = "";
      return;
    }
    const element = elementFor(selected), item = system().get(scene, selected), rect = element.getBoundingClientRect();
    element.classList.add("home-editor-picked");
    emptyState.classList.add("hidden"); form.classList.remove("hidden");
    document.getElementById("propName").value = targetInfo(selected).label;
    props.dx.value = Math.round(item.dx || 0); props.dy.value = Math.round(item.dy || 0);
    props.width.value = Math.round(item.width || rect.width); props.height.value = Math.round(item.height || rect.height);
    props.zIndex.value = Number.isFinite(item.zIndex) ? item.zIndex : Number(win().getComputedStyle(element).zIndex) || 1;
    props.opacity.value = item.opacity == null ? 1 : item.opacity; props.hidden.checked = item.hidden === true;
    status("已选择：" + targetInfo(selected).label);
  }
  function updateSelected(patch) {
    if (!selected) return;
    system().set(scene, selected, patch);
    system().apply(home(), scene);
    refreshConfig();
  }
  function refreshConfig() { if (ready) configText.value = JSON.stringify(system().getConfig(), null, 2); }
  function findTarget(node) {
    if (!ready || !home()) return null;
    return system().getTargets(scene).find(function (item) { const element = elementFor(item.id); return element && element.contains(node); });
  }
  function installFrameControls() {
    const doc = frame.contentDocument;
    doc.documentElement.classList.add("home-editor-preview");
    const style = doc.createElement("style");
    style.textContent = "#debugPanel,#wrap,#mapAtmosphere,#mapNamePlate,#mapObjective{display:none!important}.home-screen{display:block!important}.life-overlay{display:none!important}body{background:#07151a!important}";
    doc.head.appendChild(style);
    doc.addEventListener("pointerover", function (event) { const item = findTarget(event.target); if (item && item.id !== selected) elementFor(item.id).classList.add("home-editor-hover"); }, true);
    doc.addEventListener("pointerout", function (event) { const item = findTarget(event.target); if (item) elementFor(item.id).classList.remove("home-editor-hover"); }, true);
    doc.addEventListener("pointerdown", function (event) {
      const item = findTarget(event.target); if (!item || event.button !== 0) return;
      event.preventDefault(); event.stopImmediatePropagation(); select(item.id); pushHistory();
      const value = system().get(scene, selected); dragging = { x: event.clientX, y: event.clientY, dx: value.dx || 0, dy: value.dy || 0, id: event.pointerId };
      event.target.setPointerCapture && event.target.setPointerCapture(event.pointerId);
    }, true);
    doc.addEventListener("pointermove", function (event) {
      if (!dragging) return; event.preventDefault(); event.stopImmediatePropagation();
      const dx = Math.round(dragging.dx + event.clientX - dragging.x), dy = Math.round(dragging.dy + event.clientY - dragging.y);
      updateSelected({ dx: dx, dy: dy }); props.dx.value = dx; props.dy.value = dy;
    }, true);
    doc.addEventListener("pointerup", function (event) { if (dragging) { event.preventDefault(); event.stopImmediatePropagation(); dragging = null; status("位置已保存"); } }, true);
    doc.addEventListener("click", function (event) { if (findTarget(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  }
  function downloadConfig() {
    const blob = new Blob([JSON.stringify(system().getConfig(), null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "cat_and_fish_home_layout.json"; link.click(); URL.revokeObjectURL(link.href);
  }
  function command(name) {
    if (!ready && name !== "open-game") return;
    if (name === "zoom-in") setZoom(zoom * 1.12);
    if (name === "zoom-out") setZoom(zoom / 1.12);
    if (name === "fit") fit();
    if (name === "undo" && history.length) { future.push(snapshot()); restore(history.pop()); }
    if (name === "redo" && future.length) { history.push(snapshot()); restore(future.pop()); }
    if (name === "export") downloadConfig();
    if (name === "copy") navigator.clipboard.writeText(configText.value).then(function () { status("配置已复制"); });
    if (name === "open-game") window.open("./index.html?nodebug", "_blank");
    if (name === "reset-target" && selected) { pushHistory(); system().reset(scene, selected); renderPreview(); select(selected); }
    if (name === "reset-scene") { pushHistory(); system().reset(scene); renderPreview(); select(null); }
  }

  document.addEventListener("click", function (event) {
    const sceneButton = event.target.closest("[data-scene]"), layerButton = event.target.closest("[data-layer]"), commandButton = event.target.closest("[data-command]");
    if (sceneButton) showScene(sceneButton.dataset.scene);
    if (layerButton) select(layerButton.dataset.layer);
    if (commandButton) command(commandButton.dataset.command);
  });
  Object.keys(props).forEach(function (key) {
    const input = props[key];
    input.addEventListener("focus", function () { if (!propertySnapshotTaken) { pushHistory(); propertySnapshotTaken = true; } });
    input.addEventListener("blur", function () { propertySnapshotTaken = false; });
    input.addEventListener("input", function () {
      if (!selected) return;
      const value = key === "hidden" ? input.checked : Number(input.value);
      updateSelected({ [key]: value }); status("属性已保存");
    });
  });
  document.getElementById("gridToggle").onchange = function (event) { wrap.classList.toggle("grid", event.target.checked); };
  document.getElementById("guideToggle").onchange = function (event) { wrap.classList.toggle("guides", event.target.checked); };
  document.getElementById("importFile").onchange = function (event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = function () { try { pushHistory(); system().replace(JSON.parse(reader.result)); renderPreview(); select(null); status("配置已导入"); } catch (error) { status("导入失败：JSON 格式不正确"); } }; reader.readAsText(file);
  };
  document.querySelector(".canvas-scroll").addEventListener("wheel", function (event) { if (!event.ctrlKey) return; event.preventDefault(); setZoom(zoom * (event.deltaY < 0 ? 1.08 : .92)); }, { passive: false });
  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); command(event.shiftKey ? "redo" : "undo"); return; }
    if (!selected || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    event.preventDefault(); pushHistory(); const amount = event.shiftKey ? 10 : 1, item = system().get(scene, selected);
    updateSelected({ dx: item.dx + (event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0), dy: item.dy + (event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0) }); select(selected);
  });
  frame.addEventListener("load", function () {
    const timer = setInterval(function () {
      if (!frame.contentWindow.CatFishGame || !frame.contentWindow.CatFishGame.HomeSystem || !frame.contentWindow.CatFishGame.HomeLayoutSystem) return;
      clearInterval(timer); ready = true; installFrameControls(); showScene(scene); fit(); refreshConfig(); status(scene === "interior" ? "小屋家具已载入，可以开始调整" : "主界面已载入，可以开始调整");
    }, 50);
  });
})();
