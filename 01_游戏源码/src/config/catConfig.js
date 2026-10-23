"use strict";
/* ================================================================
   猫与鱼 · 陪伴猫视觉配置
   ----------------------------------------------------------------
   只包含视觉位置、颜色和状态时长；不含成长数值或玩法效果。
   后续猫皮肤、等级和亲密度可在此基础上扩展。
   ================================================================ */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});

  game.CatConfig = Object.freeze({
    boatAnchor: Object.freeze({
      // 锚点定位在船舱屋顶，避开渔夫和鱼线。
      x: 0.63,
      y: 0.48,
      scale: 0.20
    }),

    palette: Object.freeze({
      fur: "#f5a348",
      furShadow: "#c86d2b",
      earInner: "#f7c6b7",
      belly: "#ffe3bf",
      eye: "#183447",
      outline: "#56301e",
      accent: "#fff1a8"
    }),

    transientDuration: Object.freeze({
      excited: 0.75,
      happy: 1.35,
      sad: 1.05,
      upgrade: 1.50
    })
  });
})(window);
