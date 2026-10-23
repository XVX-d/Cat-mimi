"use strict";
/* 地图氛围层：以 Canvas 上方的混色遮罩区分海域，不改原有场景绘制顺序。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const events = game.GameEvents;
  const maps = game.MapConfig;
  if (!events || !maps) throw new Error("mapVisualSystem.js dependencies missing.");
  let activeMapId = "tide_dock";
  let atmosphere = null;
  let plate = null;

  function ensureElements() {
    const wrap = document.getElementById("wrap");
    if (!wrap) return false;
    if (!atmosphere) {
      atmosphere = document.createElement("div");
      atmosphere.id = "mapAtmosphere";
      wrap.appendChild(atmosphere);
      plate = document.createElement("div");
      plate.id = "mapNamePlate";
      wrap.appendChild(plate);
    }
    return true;
  }
  function apply(mapId) {
    if (!ensureElements()) return;
    activeMapId = mapId || "tide_dock";
    const map = maps.getById(activeMapId) || maps.getById("tide_dock");
    const theme = root.MAP_THEME_CFG[map.id] || root.MAP_THEME_CFG.tide_dock;
    atmosphere.style.background = theme.color;
    atmosphere.style.opacity = String(Math.max(0, Math.min(0.8, Number(theme.opacity) || 0)));
    plate.textContent = theme.label || map.name;
    plate.classList.remove("map-plate-show");
    root.requestAnimationFrame(function () { plate.classList.add("map-plate-show"); });
  }
  events.on(events.EVENTS.GAME_STARTED, function () { apply(activeMapId); });
  events.on(events.EVENTS.MAP_ENTERED, function (payload) { apply(payload && payload.mapId); });
  root.addEventListener("DOMContentLoaded", function () { apply(activeMapId); });
  game.MapVisualSystem = Object.freeze({ apply: apply, preview: apply, getActiveMapId: function () { return activeMapId; } });
})(window);
