"use strict";
/* 商业成长平衡：收入、消费、解锁与长期成长的唯一数值源。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const fishValues = Object.freeze({
    s: Object.freeze([8, 9, 10, 11, 12, 13, 14, 15, 16, 20]),
    m: Object.freeze([24, 26, 28, 30, 32, 35, 38, 42, 48, 58]),
    l: Object.freeze([60, 66, 72, 80, 88, 98, 110, 124, 142, 180])
  });
  const fishWeights = Object.freeze([18, 16, 14, 12, 10, 7, 5, 3.5, 2, 1]);
  const rarityBySlot = Object.freeze(["common", "common", "common", "common", "common", "uncommon", "uncommon", "uncommon", "rare", "epic"]);
  const rarityLabels = Object.freeze({ common: "常见", uncommon: "少见", rare: "稀有", epic: "珍奇" });
  const typeLabels = Object.freeze({ s: "小型", m: "中型", l: "大型" });

  const gear = Object.freeze({
    rod: Object.freeze({ costs: Object.freeze([120, 180, 260, 360, 480, 650, 850, 1100, 1400, 1800]), lineDistances: Object.freeze([1000, 1250, 1550, 1900, 2200, 2800, 3100, 3500, 3950, 4300, 4700]) }),
    hook: Object.freeze({ costs: Object.freeze([60, 220, 520]), damage: Object.freeze([1, 2, 3, 999]) }),
    bucket: Object.freeze({ costs: Object.freeze([140, 420]), settlementBonus: Object.freeze([0, 0.08, 0.18]) })
  });
  function fishTuning(order, typeKey) {
    const slot = Math.max(0, Math.min(9, (order - 1) % 10));
    return Object.freeze({
      value: fishValues[typeKey][slot],
      weight: fishWeights[slot],
      rarity: rarityBySlot[slot],
      rarityLabel: rarityLabels[rarityBySlot[slot]],
      typeLabel: typeLabels[typeKey]
    });
  }

  function settlement(baseValue, bucketLevel) {
    const base = Math.max(0, Math.floor(Number(baseValue) || 0));
    const level = Math.max(1, Math.min(gear.bucket.settlementBonus.length, Math.floor(bucketLevel || 1)));
    const rate = gear.bucket.settlementBonus[level - 1];
    const bonus = Math.floor(base * rate);
    return { base: base, bonus: bonus, total: base + bonus, rate: rate };
  }

  game.BalanceConfig = Object.freeze({
    startingCoins: 60,
    fishValues: fishValues,
    fishWeights: fishWeights,
    rarityLabels: rarityLabels,
    typeLabels: typeLabels,
    fishTuning: fishTuning,
    gear: gear,
    boss: Object.freeze({ triggerEarnings: 900, reward: 300 }),
    settlement: settlement
  });
})(window);
