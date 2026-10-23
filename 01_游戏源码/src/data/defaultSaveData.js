"use strict";
/* ================================================================
   猫与鱼 · 默认存档数据
   ----------------------------------------------------------------
   这是纯数据工厂。调用者每次都会得到独立对象，避免运行时修改污染默认值。
   此文件暂不接入 localStorage，接入工作由后续 save/saveSystem.js 负责。
   ================================================================ */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const schema = game.DataSchema;

  if (!schema) {
    throw new Error("defaultSaveData.js requires config/gameDataSchema.js first.");
  }

  function createDefaultFishBookEntry() {
    return {
      discovered: false,
      catchCount: 0,
      maxSize: 0
    };
  }

  function createDefaultSaveData() {
    return {
      version: schema.VERSION,

      player: {
        coins: game.BalanceConfig ? game.BalanceConfig.startingCoins : 60,
        rodLevel: 0,
        hookLevel: 0,
        unlockedMaps: ["tide_dock"]
      },

      // 以唯一目录的 fishId 为 key。例如：fishBook.fish_01。
      // 具体条目由 FishBookSystem 在首次捕获时创建。
      fishBook: {},
      // 独立于旧猫咪经验/亲密度，所有外观共用，旧存档从 0 开始。
      catCare: { affection: 0, lastPetRewardAt: 0 },
      exploration: { deepestMeters: 0, boostLearned: false, boostGuideShows: 0 },
      // Retired inventory: retain inert fields only for legacy save compatibility.
      inventory: { items: [] },
      // 首次体验的持久化进度。只记录里程碑，不参与战斗数值。
      onboarding: {
        voyagesStarted: 0,
        fishCaught: 0,
        roundsSettled: 0,
        returnsHome: 0,
        gearUpgrades: 0,
        completed: false
      },
      // Retired objective records: read/write compatibility only; no rewards issued.
      mapProgress: { objectives: {} },
      home: {
        level: 1,
        furniture: {
          tackle_station: { owned: true, placed: true },
          simple_bed: { owned: false, placed: false },
          wood_cabinet: { owned: false, placed: false },
          woven_rug: { owned: false, placed: false },
          shell_lamp: { owned: false, placed: false },
          glass_aquarium: { owned: false, placed: false },
          trophy_cabinet: { owned: false, placed: false }
        },
        facilities: { fish_bucket: 1 }
      },

      // 仅预留，不在本阶段参与任何玩法或界面。
      cat: {
        level: 1,
        exp: 0,
        intimacy: 0,
        skills: [],
        // 猫的外观只能由图鉴中配置的特殊鱼解锁。
        unlockedAppearances: ["default"],
        activeAppearance: "default"
      }
    };
  }

  game.SaveData = Object.freeze({
    createDefault: createDefaultSaveData,
    createDefaultFishBookEntry: createDefaultFishBookEntry
  });
})(window);
