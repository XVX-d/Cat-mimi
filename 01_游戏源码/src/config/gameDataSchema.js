"use strict";
/* ================================================================
   猫与鱼 · 游戏数据契约
   ----------------------------------------------------------------
   只描述持久化数据的结构，不读取存档、不修改运行时数值。
   后续 SaveSystem、EconomySystem、FishBookSystem 与 CatSystem 均以此为准。
   ================================================================ */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});

  game.DataSchema = Object.freeze({
    VERSION: 6,

    CAT_CARE: Object.freeze({ affection: "number", lastPetRewardAt: "number" }),

    PLAYER: Object.freeze({
      coins: "number",
      rodLevel: "number",
      hookLevel: "number",
      unlockedMaps: "array"
    }),

    FISH_BOOK_ENTRY: Object.freeze({
      discovered: "boolean",
      catchCount: "number",
      maxSize: "number"
    }),

    ONBOARDING: Object.freeze({
      voyagesStarted: "number",
      fishCaught: "number",
      roundsSettled: "number",
      returnsHome: "number",
      gearUpgrades: "number",
      completed: "boolean"
    }),

    MAP_OBJECTIVE: Object.freeze({
      best: "number",
      completed: "boolean",
      rewardClaimed: "boolean"
    }),

    // 猫系统在后续阶段实现；字段现在锁定，避免未来存档结构反复变化。
    CAT: Object.freeze({
      level: "number",
      exp: "number",
      intimacy: "number",
      skills: "array"
    })
  });
})(window);
