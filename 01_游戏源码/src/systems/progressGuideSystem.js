"use strict";
/* 经营循环推荐层：只读取已有系统状态，不创建任务或奖励。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});

  function get(save) {
    const onboarding = game.OnboardingSystem && game.OnboardingSystem.getStep(save);
    if (onboarding) return onboarding;
    const discovered = game.FishBookSystem.getSummary(save).filter(function (item) { return item.entry.discovered; }).length;
    const facilities = game.FacilitySystem.list(save);
    const coins = save.player.coins || 0;

    if (!discovered) return { id: "first_voyage", icon: "🎣", title: "第一次出海", detail: "选择潮汐码头，发现你的第一条鱼", kind: "action", target: "start-fishing" };

    const facility = facilities.find(function (item) { return !item.isMax && item.nextCost <= coins; });
    if (facility) return { id: "upgrade_tackle", icon: "🧰", title: "渔具可以升级", detail: facility.name + "升级需要 " + facility.nextCost + " 金币", kind: "overlay", target: "tackle" };


    return { id: "next_voyage", icon: "⚓", title: "继续探索海域", detail: "带上猫咪伙伴，寻找新的图鉴鱼", kind: "action", target: "start-fishing" };
  }

  game.ProgressGuideSystem = Object.freeze({ get: get });
})(window);
