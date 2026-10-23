"use strict";
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const catalog = game.FishCatalogConfig;
  if (!catalog) throw new Error("fishCatalogSystem.js requires fishCatalogConfig.js first.");
  const customNames = {};

  function decorate(entry) {
    return entry && Object.assign({}, entry, { name: customNames[entry.id] || entry.name });
  }

  function list() {
    return catalog.list().map(decorate);
  }

  function resolveCatch(typeKey, mapId, depthMeters) {
    const pool = Number.isFinite(depthMeters) ? catalog.listForDepth(depthMeters, typeKey) : catalog.listForMap("tide_dock", typeKey);
    const fallback = catalog.listByLegacyType(typeKey);
    const choices = Number.isFinite(depthMeters) ? pool : (pool.length ? pool : fallback);
    if (!choices.length) return null;
    const total = choices.reduce(function (sum, item) { return sum + Math.max(0, item.weight || 1); }, 0);
    let roll = Math.random() * total;
    for (let index = 0; index < choices.length; index++) {
      roll -= Math.max(0, choices[index].weight || 1);
      if (roll <= 0) return decorate(choices[index]);
    }
    return decorate(choices[choices.length - 1]);
  }

  function rename(id, name) {
    const entry = catalog.getById(id);
    if (entry && typeof name === "string" && name.trim()) customNames[entry.id] = name.trim();
  }

  game.FishCatalogSystem = Object.freeze({
    list: list,
    getById: function (id) { return decorate(catalog.getById(id)); },
    resolveCatch: resolveCatch,
    rename: rename
  });
})(window);
