"use strict";
/* ================================================================
   猫与鱼 · SaveSystem
   ----------------------------------------------------------------
   统一处理存档读取、校验与写入。当前默认使用 localStorage，
   未来 CrazyGames / 抖音版本可用 setStorageAdapter() 替换实现。
   本模块不持有运行时金币，也不主动修改游戏逻辑。
   ================================================================ */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const schema = game.DataSchema;
  const fishCatalog = game.FishCatalogConfig;
  const saveData = game.SaveData;

  if (!schema || !fishCatalog || !saveData) {
    throw new Error("saveSystem.js requires gameDataSchema.js, fishCatalogConfig.js and defaultSaveData.js first.");
  }

  const STORAGE_KEY = "cat-and-fish.save.v1";
  const RECOVERY_KEY = STORAGE_KEY + ".recovery";
  const BACKUP_KEY = STORAGE_KEY + ".backup";
  let storageAdapter = null;
  let lastError = null;
  let recovered = false;
  let recoverySource = null;
  let lastSavedAt = 0;
  let revision = 0;

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function finiteNumber(value, fallback, integer) {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    const result = Math.max(0, value);
    return integer ? Math.floor(result) : result;
  }

  function cloneEntry(entry) {
    const fallback = saveData.createDefaultFishBookEntry();
    if (!isObject(entry)) return fallback;
    const catchCount = finiteNumber(entry.catchCount, fallback.catchCount, true);
    return {
      discovered: entry.discovered === true || catchCount > 0,
      catchCount: catchCount,
      maxSize: finiteNumber(entry.maxSize, fallback.maxSize, false)
    };
  }

  function mergeBookEntries(left, right) {
    const a = cloneEntry(left);
    const b = cloneEntry(right);
    return {
      discovered: a.discovered || b.discovered,
      catchCount: a.catchCount + b.catchCount,
      maxSize: Math.max(a.maxSize, b.maxSize)
    };
  }

  // v2：30种鱼成为唯一目录；旧鱼篓余额一次性折算为金币，之后鱼获直接结算。
  // v3：增加首次体验里程碑；旧存档自动从未完成状态继续，不重复发放奖励。
  // v4：增加永久海域目标记录，目标奖励只能领取一次。
  function migrate(raw) {
    if (!isObject(raw)) return {};
    const migrated = Object.assign({}, raw);
    migrated.player = isObject(raw.player) ? Object.assign({}, raw.player) : {};
    migrated.inventory = isObject(raw.inventory) ? Object.assign({}, raw.inventory) : {};
    migrated.fishBook = isObject(raw.fishBook) ? Object.assign({}, raw.fishBook) : {};
    const version = finiteNumber(raw.version, 1, true) || 1;
    const hadLegacyFish = Array.isArray(migrated.inventory.fish) && migrated.inventory.fish.length > 0;

    if (version < 2) {
      Object.keys(fishCatalog.legacyAliases).forEach(function (legacyId) {
        if (!migrated.fishBook[legacyId]) return;
        const canonicalId = fishCatalog.canonicalizeId(legacyId);
        migrated.fishBook[canonicalId] = mergeBookEntries(migrated.fishBook[canonicalId], migrated.fishBook[legacyId]);
        delete migrated.fishBook[legacyId];
      });
      const legacyFish = Array.isArray(migrated.inventory.fish) ? migrated.inventory.fish : [];
      const credit = legacyFish.reduce(function (total, fish) {
        return total + (isObject(fish) ? finiteNumber(fish.value, 0, true) : 0);
      }, 0);
      migrated.player.coins = finiteNumber(migrated.player.coins, 0, true) + credit;
      delete migrated.inventory.fish;
    }

    if (version < 3 && !isObject(migrated.onboarding)) {
      const historicCatches = Object.keys(migrated.fishBook).reduce(function (total, fishId) {
        const entry = migrated.fishBook[fishId];
        return total + (isObject(entry) ? finiteNumber(entry.catchCount, entry.discovered === true ? 1 : 0, true) : 0);
      }, 0);
      const historicGear = finiteNumber(migrated.player.rodLevel, 0, true) + finiteNumber(migrated.player.hookLevel, 0, true);
      const returningPlayer = hadLegacyFish || historicCatches > 0 || historicGear > 0;
      migrated.onboarding = returningPlayer ? {
        voyagesStarted: 2,
        fishCaught: Math.max(1, historicCatches),
        roundsSettled: 2,
        returnsHome: 2,
        gearUpgrades: Math.max(1, historicGear),
        completed: true
      } : {};
    }

    // v5: preserve purchased line length when expanding three upgrades to ten.
    if (version < 5) migrated.player.rodLevel = [0, 3, 5, 8][Math.min(3, finiteNumber(migrated.player.rodLevel, 0, true))];
    migrated.version = schema.VERSION;
    return migrated;
  }

  function sanitize(raw) {
    const base = saveData.createDefault();
    const source = migrate(raw);
    const player = isObject(source.player) ? source.player : {};
    const cat = isObject(source.cat) ? source.cat : {};
    const home = isObject(source.home) ? source.home : {};
    const onboarding = isObject(source.onboarding) ? source.onboarding : {};
    const mapProgress = isObject(source.mapProgress) ? source.mapProgress : {};

    base.player.coins = finiteNumber(player.coins, base.player.coins, true);
    base.player.rodLevel = finiteNumber(player.rodLevel, base.player.rodLevel, true);
    base.player.hookLevel = finiteNumber(player.hookLevel, base.player.hookLevel, true);
    const exploration = isObject(source.exploration) ? source.exploration : {};
    base.exploration = { deepestMeters: Math.min(356, finiteNumber(exploration.deepestMeters, 0, true)), boostLearned: exploration.boostLearned === true, boostGuideShows: Math.min(3, finiteNumber(exploration.boostGuideShows, 0, true)) };
    base.home.level = Math.min(3, Math.max(1, finiteNumber(home.level, base.home.level, true)));
    if (isObject(home.furniture)) {
      const legacyFurniture = home.furniture;
      base.home.furniture = Object.keys(base.home.furniture).reduce(function (result, id) {
        const value = legacyFurniture[id];
        const fallback = base.home.furniture[id];
        result[id] = isObject(value)
          ? { owned: value.owned === true, placed: value.owned === true && value.placed === true }
          : { owned: fallback.owned === true, placed: fallback.placed === true };
        return result;
      }, {});
      if (legacyFurniture.workbench) base.home.furniture.tackle_station = { owned: true, placed: true };
      if (legacyFurniture.cat_bed) base.home.furniture.simple_bed = { owned: true, placed: true };
      if (legacyFurniture.aquarium) base.home.furniture.glass_aquarium = { owned: true, placed: true };
    }
    base.home.facilities = isObject(home.facilities) ? Object.keys(base.home.facilities).reduce(function (result, id) {
      result[id] = Math.min(3, Math.max(1, finiteNumber(home.facilities[id], base.home.facilities[id], true)));
      return result;
    }, {}) : base.home.facilities;
    base.player.unlockedMaps = Array.isArray(player.unlockedMaps)
      ? Array.from(new Set(player.unlockedMaps.filter(function (mapId) { return typeof mapId === "string"; }).concat(["tide_dock"])))
      : ["tide_dock"];

    if (isObject(source.fishBook)) {
      Object.keys(source.fishBook).forEach(function (sourceId) {
        const fishId = fishCatalog.canonicalizeId(sourceId);
        if (!fishCatalog.getById(fishId)) return;
        base.fishBook[fishId] = base.fishBook[fishId]
          ? mergeBookEntries(base.fishBook[fishId], source.fishBook[sourceId])
          : cloneEntry(source.fishBook[sourceId]);
      });
    }
    base.inventory.items = isObject(source.inventory) && Array.isArray(source.inventory.items)
      ? source.inventory.items.filter(function (item) { return isObject(item); }).map(function (item) {
        return { id: typeof item.id === "string" ? item.id : "item", name: typeof item.name === "string" ? item.name : "未知道具",
          icon: typeof item.icon === "string" ? item.icon : "🎁", count: Math.max(1, finiteNumber(item.count, 1, true)),
          rarity: typeof item.rarity === "string" ? item.rarity : "common", isNew: item.isNew === true };
      }) : [];

    Object.keys(base.onboarding).forEach(function (key) {
      if (key === "completed") return;
      base.onboarding[key] = finiteNumber(onboarding[key], 0, true);
    });
    base.onboarding.completed = onboarding.completed === true || (
      base.onboarding.voyagesStarted >= 2 &&
      base.onboarding.fishCaught >= 1 &&
      base.onboarding.roundsSettled >= 2 &&
      base.onboarding.returnsHome >= 2 &&
      base.onboarding.gearUpgrades >= 1
    );

    const objectives = isObject(mapProgress.objectives) ? mapProgress.objectives : {};
    base.mapProgress.objectives = Object.keys(objectives).reduce(function (result, mapId) {
      if (typeof mapId !== "string" || !isObject(objectives[mapId])) return result;
      const record = objectives[mapId];
      const completed = record.completed === true || record.rewardClaimed === true;
      result[mapId] = {
        best: finiteNumber(record.best, 0, true),
        completed: completed,
        rewardClaimed: record.rewardClaimed === true
      };
      return result;
    }, {});

    // Legacy growth fields are retained for save compatibility, but no longer advance.
    if (cat.nestLevel !== undefined) base.cat.nestLevel = finiteNumber(cat.nestLevel, 0, true);
    base.cat.level = Math.max(1, finiteNumber(cat.level, base.cat.level, true));
    base.cat.exp = finiteNumber(cat.exp, base.cat.exp, true);
    base.cat.intimacy = finiteNumber(cat.intimacy, base.cat.intimacy, true);
    const care = isObject(source.catCare) ? source.catCare : {};
    base.catCare = {
      affection: Math.min(100, finiteNumber(care.affection, 0, true)),
      lastPetRewardAt: Math.min(Date.now(), finiteNumber(care.lastPetRewardAt, 0, true))
    };
    base.cat.skills = Array.isArray(cat.skills)
      ? cat.skills.filter(function (skill) { return typeof skill === "string"; })
      : [];
    base.cat.unlockedAppearances = Array.isArray(cat.unlockedAppearances)
      ? Array.from(new Set(cat.unlockedAppearances.filter(function (appearance) {
        return typeof appearance === "string";
      }).concat(["default"])))
      : ["default"];
    base.cat.activeAppearance = typeof cat.activeAppearance === "string" &&
      base.cat.unlockedAppearances.indexOf(cat.activeAppearance) >= 0
      ? cat.activeAppearance
      : "default";
    base.version = schema.VERSION;

    return base;
  }

  function getStorage() {
    if (storageAdapter) return storageAdapter;
    try {
      return root.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function load() {
    const storage = getStorage();
    if (!storage) return saveData.createDefault();
    let raw = null;
    try {
      raw = storage.getItem(STORAGE_KEY);
      lastError = null;
      recovered = false;
      recoverySource = null;
      return raw ? sanitize(JSON.parse(raw)) : saveData.createDefault();
    } catch (error) {
      lastError = "read_failed";
      if (raw) {
        try {
          storage.setItem(RECOVERY_KEY, raw);
        } catch (backupError) {}
      }
      try {
        const backupRaw = storage.getItem(BACKUP_KEY);
        if (backupRaw) {
          const normalized = sanitize(JSON.parse(backupRaw));
          storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          recovered = true;
          recoverySource = "backup";
          lastError = null;
          return normalized;
        }
      } catch (backupError) {}
      try { storage.removeItem(STORAGE_KEY); } catch (removeError) {}
      recovered = true;
      recoverySource = "default";
      lastError = "corrupt_recovered";
      return saveData.createDefault();
    }
  }

  function save(value) {
    const normalized = sanitize(value);
    const storage = getStorage();
    if (!storage) return normalized;
    try {
      const serialized = JSON.stringify(normalized);
      const previous = storage.getItem(STORAGE_KEY);
      if (previous !== serialized) {
        if (previous) {
          try { JSON.parse(previous); storage.setItem(BACKUP_KEY, previous); } catch (backupError) {}
        }
        storage.setItem(STORAGE_KEY, serialized);
        revision++;
      }
      lastSavedAt = Date.now();
      lastError = null;
    } catch (error) {
      // 存储不可用或容量不足时，仍返回规范化数据供当前会话继续使用。
      lastError = "write_failed";
    }
    return normalized;
  }

  function clear() {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(BACKUP_KEY);
      storage.removeItem(RECOVERY_KEY);
    } catch (error) {}
  }

  function setStorageAdapter(adapter) {
    if (adapter !== null && (!adapter || typeof adapter.getItem !== "function" ||
      typeof adapter.setItem !== "function" || typeof adapter.removeItem !== "function")) {
      throw new Error("SaveSystem storage adapter must implement getItem, setItem, and removeItem.");
    }
    storageAdapter = adapter;
  }

  function getStatus() {
    return { ok: lastError === null, error: lastError, recovered: recovered, recoverySource: recoverySource,
      recoveryKey: RECOVERY_KEY, backupKey: BACKUP_KEY, lastSavedAt: lastSavedAt, revision: revision };
  }

  function restoreRecovery() {
    const storage = getStorage();
    if (!storage) return false;
    try {
      const raw = storage.getItem(BACKUP_KEY) || storage.getItem(RECOVERY_KEY);
      if (!raw) return false;
      const normalized = sanitize(JSON.parse(raw));
      storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      lastError = null;
      recovered = false;
      recoverySource = null;
      return true;
    } catch (error) { lastError = "recovery_failed"; return false; }
  }

  game.SaveSystem = Object.freeze({
    STORAGE_KEY: STORAGE_KEY,
    RECOVERY_KEY: RECOVERY_KEY,
    BACKUP_KEY: BACKUP_KEY,
    getDefault: saveData.createDefault,
    sanitize: sanitize,
    migrate: migrate,
    load: load,
    save: save,
    clear: clear,
    setStorageAdapter: setStorageAdapter,
    getStatus: getStatus,
    restoreRecovery: restoreRecovery
  });
})(window);
