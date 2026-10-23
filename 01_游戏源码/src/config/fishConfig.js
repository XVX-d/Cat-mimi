"use strict";
/* 兼容门面：所有鱼类内容均来自 FishCatalogConfig，不再维护第二套三鱼目录。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const catalog = game.FishCatalogConfig;
  if (!catalog) throw new Error("fishConfig.js requires fishCatalogConfig.js first.");

  function getByLegacyTypeKey(typeKey) {
    const entries = catalog.listByLegacyType(typeKey);
    return entries.length ? entries[0] : null;
  }

  game.FishConfig = Object.freeze({
    getById: catalog.getById,
    getByLegacyTypeKey: getByLegacyTypeKey,
    list: catalog.list,
    canonicalizeId: catalog.canonicalizeId
  });
})(window);
