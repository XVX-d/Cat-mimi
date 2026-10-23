import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(rootDir, relative), "utf8");

function storage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

const runtime = { console, Map, Set, Math, Date, JSON, Object, Array, Number, String, Boolean, localStorage: storage() };
runtime.window = runtime;
vm.createContext(runtime);
[
  "src/config/gameDataSchema.js",
  "src/config/balanceConfig.js",
  "src/config/fishCatalogConfig.js",
  "src/config/fishConfig.js",
  "src/data/defaultSaveData.js",
  "src/save/saveSystem.js",
  "src/systems/gameEventBus.js",
  "src/systems/onboardingSystem.js"
].forEach(relative => vm.runInContext(read(relative), runtime, { filename: relative }));

const game = runtime.CatFishGame;
const save = game.SaveSystem.getDefault();
assert.deepEqual(JSON.parse(JSON.stringify(game.OnboardingSystem.getState(save))), {
  voyagesStarted: 0, fishCaught: 0, roundsSettled: 0, returnsHome: 0, gearUpgrades: 0, completed: false
});
assert.equal(game.OnboardingSystem.getStep(save).id, "first_voyage");

game.GameEvents.emit(game.GameEvents.EVENTS.MAP_ENTERED, { source: "home_pier", save });
game.GameEvents.emit(game.GameEvents.EVENTS.FISH_CAUGHT, { save });
game.GameEvents.emit(game.GameEvents.EVENTS.ROUND_SETTLED, { save });
game.GameEvents.emit(game.GameEvents.EVENTS.RETURNED_HOME, { reason: "settlement", save });
assert.equal(game.OnboardingSystem.getStep(save).id, "first_upgrade", "首次返航后必须引导渔具升级");

game.GameEvents.emit(game.GameEvents.EVENTS.UPGRADE_PURCHASED, { kind: "line", source: "home", save });
assert.equal(game.OnboardingSystem.getStep(save).id, "second_voyage", "首次升级后必须引导再次出海");
game.GameEvents.emit(game.GameEvents.EVENTS.MAP_ENTERED, { source: "home_pier", save });
game.GameEvents.emit(game.GameEvents.EVENTS.ROUND_SETTLED, { save });
game.GameEvents.emit(game.GameEvents.EVENTS.RETURNED_HOME, { reason: "settlement", save });
assert.equal(game.OnboardingSystem.getStep(save), null);
assert.equal(game.OnboardingSystem.isComplete(save), true, "第二次返航后首次体验必须完成");

const persisted = game.SaveSystem.load();
assert.equal(persisted.onboarding.completed, true, "首次体验进度必须跨会话保存");
const beforeManual = persisted.onboarding.returnsHome;
game.GameEvents.emit(game.GameEvents.EVENTS.RETURNED_HOME, { reason: "manual_exit", save: persisted });
assert.equal(persisted.onboarding.returnsHome, beforeManual, "手动退出不能冒充一次完整返航");

const v2 = game.SaveSystem.sanitize({ version: 2, player: { coins: 80 } });
assert.equal(v2.version, 4);
assert.equal(v2.onboarding.completed, false);
const returning = game.SaveSystem.sanitize({
  version: 2,
  player: { coins: 80, rodLevel: 0, hookLevel: 0 },
  fishBook: { fish_01: { discovered: true, catchCount: 1, maxSize: 12 } }
});
assert.equal(returning.onboarding.completed, true, "已有历史鱼获的玩家不应被强制重走新手流程");
assert.equal(game.OnboardingSystem.getStep(returning), null);

const index = read("index.html");
const gameSource = read("src/game.js");
const homeSource = read("src/systems/homeSystem.js");
assert.ok(index.indexOf("gameEventBus.js") < index.indexOf("onboardingSystem.js"), "新手系统必须在事件总线之后加载");
assert.ok(gameSource.includes("showHarvest(settlement)"), "完整结算后必须展示可选择的返航结果");
assert.ok(gameSource.includes("roundNum=0"), "首次出海前轮次必须从0等待创建");
assert.ok(gameSource.includes("if(!homeMapEntered)preRound()"), "再次出海不得重复递增已预备的轮次");
["harvest-upgrade", "harvest-continue", "harvest-home"].forEach(action => {
  assert.ok(homeSource.includes(action), `结算界面缺少 ${action} 动作`);
});

console.log("[phase2] 首次出海、捕获、结算、升级、再次出海与返航闭环验证通过");
