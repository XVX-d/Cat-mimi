"use strict";
/* ================================================================
   猫与鱼 · FishBookSystem
   ----------------------------------------------------------------
   图鉴只消费“已成功捕获”的结果：记录发现状态、捕获次数和最大尺寸。
   不参与鱼生成、掉率、伤害、碰撞、金币或结算。
   ================================================================ */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const fishConfig = game.FishConfig;
  const saveData = game.SaveData;

  if (!fishConfig || !saveData) {
    throw new Error("fishBookSystem.js requires fishConfig.js and defaultSaveData.js first.");
  }

  function normalizeSize(size) {
    if (typeof size !== "number" || !Number.isFinite(size)) return 0;
    return Math.max(0, size);
  }

  function ensureBook(save) {
    if (!save || typeof save !== "object") {
      throw new Error("FishBookSystem requires a SaveData object.");
    }
    if (!save.fishBook || typeof save.fishBook !== "object" || Array.isArray(save.fishBook)) {
      save.fishBook = {};
    }
    return save.fishBook;
  }

  function getEntry(save, fishId) {
    const fish = fishConfig.getById(fishId);
    if (!fish || !save || !save.fishBook) return null;
    const entry = save.fishBook[fish.id];
    if (!entry) return null;
    return {
      discovered: entry.discovered === true,
      catchCount: Math.max(0, Math.floor(entry.catchCount || 0)),
      maxSize: normalizeSize(entry.maxSize)
    };
  }

  function isDiscovered(save, fishId) {
    const entry = getEntry(save, fishId);
    return !!(entry && entry.discovered);
  }

  function recordCatch(save, fishId, size) {
    const fish = fishConfig.getById(fishId);
    if (!fish) {
      return { ok: false, reason: "unknown_fish", entry: null };
    }

    const book = ensureBook(save);
    const previous = getEntry(save, fish.id) || saveData.createDefaultFishBookEntry();
    const caughtSize = normalizeSize(size);
    const firstDiscovery = !previous.discovered;
    const entry = {
      discovered: true,
      catchCount: previous.catchCount + 1,
      maxSize: Math.max(previous.maxSize, caughtSize)
    };
    book[fish.id] = entry;

    return {
      ok: true,
      fish: fish,
      entry: Object.assign({}, entry),
      firstDiscovery: firstDiscovery
    };
  }

  function recordCatchByLegacyType(save, typeKey, size) {
    const fish = fishConfig.getByLegacyTypeKey(typeKey);
    if (!fish) return { ok: false, reason: "unknown_legacy_type", entry: null };
    return recordCatch(save, fish.id, size);
  }

  function getSummary(save) {
    return fishConfig.list().map(function (fish) {
      return {
        fish: fish,
        entry: getEntry(save, fish.id) || saveData.createDefaultFishBookEntry()
      };
    });
  }

  game.FishBookSystem = Object.freeze({
    getEntry: getEntry,
    isDiscovered: isDiscovered,
    recordCatch: recordCatch,
    recordCatchByLegacyType: recordCatchByLegacyType,
    getSummary: getSummary
  });
})(window);
