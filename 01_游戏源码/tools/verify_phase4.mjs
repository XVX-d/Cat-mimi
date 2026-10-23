import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(rootDir, relative), "utf8");
const stored = new Map();
const wrap = { appendChild() {} };
const runtime = {
  console, Map, Set, Math, Date, JSON, Object, Array, Number, String, Boolean,
  localStorage: {
    getItem: key => stored.has(key) ? stored.get(key) : null,
    setItem: (key, value) => stored.set(key, String(value)),
    removeItem: key => stored.delete(key)
  },
  document: {
    createElement: () => ({ id: "", textContent: "" }),
    getElementById: id => id === "wrap" ? wrap : null
  },
  addEventListener() {}, setTimeout, clearTimeout
};
runtime.window = runtime;
vm.createContext(runtime);
[
  "src/config/gameDataSchema.js", "src/config/interactionFeelConfig.js", "src/config/balanceConfig.js", "src/config/fishCatalogConfig.js",
  "src/config/fishConfig.js", "src/data/defaultSaveData.js", "src/save/saveSystem.js",
  "src/systems/gameEventBus.js", "src/systems/fishBookSystem.js", "src/config/mapConfig.js",
  "src/systems/mapObjectiveSystem.js", "src/config/homeFurnitureConfig.js",
  "src/systems/homeFurnitureSystem.js", "src/config/houseConfig.js",
  "src/systems/homeProgressionSystem.js", "src/config/catProgressionConfig.js",
  "src/systems/catProgressionSystem.js"
].forEach(relative => vm.runInContext(read(relative), runtime, { filename: relative }));

const game = runtime.CatFishGame;
const balance = game.BalanceConfig;
const fish = game.FishCatalogConfig.list();
assert.equal(fish.length, 30);
for (const type of ["s", "m", "l"]) {
  const group = fish.filter(item => item.legacyTypeKey === type);
  assert.equal(group.length, 10);
  group.slice(1).forEach((item, index) => {
    assert.ok(item.value > group[index].value, `${type} 鱼价值必须随稀有度严格上升`);
    assert.ok(item.weight <= group[index].weight, `${type} 鱼权重必须随稀有度下降`);
  });
}

const weightedMean = values => values.reduce((sum, value, index) => sum + value * balance.fishWeights[index], 0) /
  balance.fishWeights.reduce((sum, weight) => sum + weight, 0);
const expected = Object.fromEntries(Object.entries(balance.fishValues).map(([type, values]) => [type, weightedMean(values)]));
assert.ok(expected.s >= 10 && expected.s <= 13);
assert.ok(expected.m >= 28 && expected.m <= 36);
assert.ok(expected.l >= 70 && expected.l <= 90);
assert.ok(balance.startingCoins >= balance.gear.rod.costs[0], "开局必须能购买第一档鱼竿");
assert.ok(balance.startingCoins >= balance.gear.hook.costs[0], "开局必须能购买第一档鱼钩");
assert.ok(balance.startingCoins < balance.gear.rod.costs[0] + balance.gear.hook.costs[0], "开局不能一次买完两件升级");

const totalSinks = [balance.gear.rod.costs, balance.gear.hook.costs, balance.gear.bucket.costs]
  .flat().concat(Object.values(balance.furniturePrices)).reduce((sum, value) => sum + value, 0);
const totalObjectiveRewards = Object.values(balance.maps).reduce((sum, item) => sum + item.objectiveReward, 0);
assert.ok(totalSinks >= 2500, "成长消费必须支撑中期目标");
assert.ok(totalObjectiveRewards < totalSinks * 0.2, "地图一次性奖励不能压垮长期经济");
assert.deepEqual(JSON.parse(JSON.stringify(balance.settlement(199, 1))), { base: 199, bonus: 0, total: 199, rate: 0 });
assert.deepEqual(JSON.parse(JSON.stringify(balance.settlement(199, 2))), { base: 199, bonus: 15, total: 214, rate: 0.08 });
assert.deepEqual(JSON.parse(JSON.stringify(balance.settlement(199, 3))), { base: 199, bonus: 35, total: 234, rate: 0.18 });

let objectiveRewards = 0;
game.GameEvents.on(game.GameEvents.EVENTS.MAP_OBJECTIVE_COMPLETED, payload => { objectiveRewards += payload.reward; });
const objectiveSave = game.SaveSystem.getDefault();
game.MapObjectiveSystem.start({ mapId: "tide_dock", save: objectiveSave });
for (const [fishId, legacyTypeKey] of [["fish_01", "s"], ["fish_11", "m"], ["fish_21", "l"]]) {
  game.FishBookSystem.recordCatch(objectiveSave, fishId, 20);
  game.MapObjectiveSystem.recordCatch({ save: objectiveSave, fishId, legacyTypeKey });
}
assert.equal(objectiveRewards, balance.maps.tide_dock.objectiveReward);
assert.equal(objectiveSave.mapProgress.objectives.tide_dock.rewardClaimed, true);
game.MapObjectiveSystem.start({ mapId: "tide_dock", save: objectiveSave });
game.MapObjectiveSystem.recordCatch({ save: objectiveSave, fishId: "fish_02", legacyTypeKey: "s" });
assert.equal(objectiveRewards, balance.maps.tide_dock.objectiveReward, "重复进入和捕获不得重复发奖");

const catSave = game.SaveSystem.getDefault();
const firstCatch = game.CatProgressionSystem.applyCatch({ save: catSave, fishId: "fish_01", firstDiscovery: true });
assert.equal(firstCatch.expGain, 5, "首次发现应包含额外猫咪经验");
catSave.home.level = 2;
const housedCatch = game.CatProgressionSystem.applyCatch({ save: catSave, fishId: "fish_02", firstDiscovery: false });
assert.equal(housedCatch.expGain, 2, "房屋加成必须作用于猫咪经验并向上取整");

const source = read("src/game.js");
const home = read("src/systems/homeSystem.js");
assert.ok(source.includes("BALANCE.settlement(roundBaseValue,bucketLevel)"));
assert.ok(source.includes("catalogFish.value||f.type.value"));
const upgradeView=read("src/systems/coastSystem.js");
assert.ok(upgradeView.includes("currentBenefit") && upgradeView.includes("nextBenefit"));
assert.ok(upgradeView.includes("包含鱼篓加成") && home.includes("目标奖励仅可领取一次"));
assert.equal(game.InteractionFeelConfig.swipe.flickDistance, 68, "快速短甩距离门槛必须避免轻微误切");
assert.equal(game.InteractionFeelConfig.swipe.flickVelocity, .70, "快速短甩速度门槛必须避免轻微误切");
const swipeStartSource = home.slice(home.indexOf("function swipeStart"), home.indexOf("function swipeMove"));
const swipeMoveSource = home.slice(home.indexOf("function swipeMove"), home.indexOf("function swipeEnd"));
assert.ok(!swipeStartSource.includes("createElement"), "普通点按阶段不得提前创建完整横滑预览");
assert.ok(swipeMoveSource.includes("holder=document.createElement"), "确认横向手势后必须创建跟手预览");
assert.ok(source.includes("INTERACTION.canvasButtonDelayMs"), "Canvas 按钮动作反馈必须读取统一配置");

console.log(`[phase4] 数值平衡、一次性奖励、鱼篓结算、房屋成长与系统反馈验证通过（期望鱼价 ${expected.s.toFixed(1)}/${expected.m.toFixed(1)}/${expected.l.toFixed(1)}，总消费 ${totalSinks}）`);
