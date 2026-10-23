"use strict";
/* 唯一鱼类目录：稳定 ID、体型、稀有度、图鉴顺序和海域分布均从这里读取。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const balance = game.BalanceConfig;
  const names = [
    "泡泡小鱼", "银鳍鱼", "斑点鱼", "橘尾鱼", "月光鱼",
    "海草鱼", "珊瑚雀鲷", "玻璃鱼", "小丑鱼", "蓝纹鱼",
    "金线鱼", "贝壳鱼", "星点鱼", "霞光鱼", "棱镜鱼",
    "潮汐鲷", "珊瑚石斑", "火焰鱼", "海马", "绸带鱼",
    "暮光鱼", "幽蓝鱼", "深海紫鱼", "鲸歌鱼", "灯笼鱼",
    "黑曜鱼", "月影鱼", "海沟鱼", "星海鱼", "海王幼体"
  ];
  const legacyAliases = Object.freeze({
    fish_small: "fish_01",
    fish_medium: "fish_11",
    fish_large: "fish_23"
  });

  function mapIdsFor(order, typeKey) {
    return ["tide_dock"];
  }

  const depthBands = Object.freeze([
    Object.freeze({ min: 0, max: 120, name: "晴光浅湾", kinds: Object.freeze(["s"]), count: 5 }),
    Object.freeze({ min: 120, max: 220, name: "蓝翠礁林", kinds: Object.freeze(["m"]), count: 4 }),
    Object.freeze({ min: 220, max: 300, name: "静谧沉船", kinds: Object.freeze(["l"]), count: 4 }),
    Object.freeze({ min: 300, max: null, name: "星辉深海", kinds: Object.freeze(["l"]), count: 2 })
  ]);

  const entries = names.map(function (name, index) {
    const order = index + 1;
    const typeKey = order <= 10 ? "s" : order <= 20 ? "m" : "l";
    const tuning = balance.fishTuning(order, typeKey);
    return Object.freeze({
      id: "fish_" + String(order).padStart(2, "0"),
      name: name,
      rarity: tuning.rarity,
      rarityLabel: tuning.rarityLabel,
      typeLabel: tuning.typeLabel,
      value: tuning.value,
      weight: tuning.weight,
      legacyTypeKey: typeKey,
      iconKey: "fish_" + String(order).padStart(2, "0") + (typeKey === "s" ? "_v021" : typeKey === "m" ? "_v025" : "_v026"),
      mapIds: Object.freeze(mapIdsFor(order, typeKey)),
      depthMin: depthBands[order <= 10 ? 0 : order <= 20 ? 1 : order <= 25 ? 2 : 3].min,
      depthMax: depthBands[order <= 10 ? 0 : order <= 20 ? 1 : order <= 25 ? 2 : 3].max,
      bookOrder: order
    });
  });
  const byId = Object.fromEntries(entries.map(function (entry) { return [entry.id, entry]; }));

  function canonicalizeId(id) {
    return legacyAliases[id] || id;
  }

  function getById(id) {
    return byId[canonicalizeId(id)] || null;
  }

  function list() {
    return entries.slice();
  }

  function listByLegacyType(typeKey) {
    return entries.filter(function (entry) { return entry.legacyTypeKey === typeKey; });
  }

  function listForMap(mapId, typeKey) {
    if (mapId === "coral_cove" || mapId === "deep_blue") mapId = "tide_dock";
    return entries.filter(function (entry) {
      return (!typeKey || entry.legacyTypeKey === typeKey) && entry.mapIds.indexOf(mapId) >= 0;
    });
  }

  game.FishCatalogConfig = Object.freeze({
    depthBands: depthBands,
    listForDepth: function (meters, typeKey) {
      return entries.filter(function (entry) {
        return (!typeKey || entry.legacyTypeKey === typeKey) &&
          meters >= entry.depthMin && (entry.depthMax === null || meters < entry.depthMax);
      });
    },
    list: list,
    getById: getById,
    canonicalizeId: canonicalizeId,
    listByLegacyType: listByLegacyType,
    listForMap: listForMap,
    legacyAliases: legacyAliases
  });
})(window);
