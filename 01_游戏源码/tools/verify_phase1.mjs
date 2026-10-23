import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(rootDir, relative), "utf8");

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

function createRuntime() {
  const listeners = {};
  const wrap = { appendChild(node) { this.child = node; } };
  const context = {
    console,
    Map,
    Set,
    Math,
    Date,
    JSON,
    Object,
    Array,
    Number,
    String,
    Boolean,
    localStorage: createStorage(),
    document: {
      createElement: () => ({ id: "", textContent: "" }),
      getElementById: id => id === "wrap" ? wrap : null
    },
    addEventListener(type, listener) {
      (listeners[type] || (listeners[type] = [])).push(listener);
    },
    setTimeout,
    clearTimeout
  };
  context.window = context;
  vm.createContext(context);
  return context;
}

function load(context, relative) {
  vm.runInContext(read(relative), context, { filename: relative });
}

const runtime = createRuntime();
[
  "src/config/gameDataSchema.js",
  "src/config/balanceConfig.js",
  "src/config/fishCatalogConfig.js",
  "src/config/fishConfig.js",
  "src/data/defaultSaveData.js",
  "src/save/saveSystem.js",
  "src/systems/fishCatalogSystem.js",
  "src/systems/gameEventBus.js",
  "src/systems/fishBookSystem.js",
  "src/config/mapConfig.js",
  "src/systems/mapProgressionSystem.js",
  "src/config/catAppearanceConfig.js",
  "src/config/homeFurnitureConfig.js",
  "src/systems/mapObjectiveSystem.js"
].forEach(relative => load(runtime, relative));

const game = runtime.CatFishGame;
const fish = game.FishConfig.list();
assert.equal(fish.length, 30, "统一鱼类目录应包含30种鱼");
assert.equal(new Set(fish.map(entry => entry.id)).size, 30, "鱼类ID必须唯一");
assert.deepEqual(Array.from(game.FishCatalogConfig.legacyAliases ? Object.keys(game.FishCatalogConfig.legacyAliases) : []), ["fish_small", "fish_medium", "fish_large"]);

game.MapConfig.list().forEach(map => {
  map.fishKinds.forEach(typeKey => {
    assert.ok(game.FishCatalogConfig.listForMap(map.id, typeKey).length > 0, `${map.id} 缺少 ${typeKey} 体型鱼池`);
    const caught = game.FishCatalogSystem.resolveCatch(typeKey, map.id);
    assert.ok(caught && caught.mapIds.includes(map.id), `${map.id} 捕获结果必须属于当前海域`);
  });
});
game.CatAppearanceConfig.list().filter(item => item.requiredFishId).forEach(item => {
  assert.ok(game.FishConfig.getById(item.requiredFishId), `猫外观引用未知鱼类 ${item.requiredFishId}`);
});
game.HomeFurnitureConfig.list().filter(item => item.unlock && item.unlock.fishId).forEach(item => {
  assert.ok(game.FishConfig.getById(item.unlock.fishId), `家具引用未知鱼类 ${item.unlock.fishId}`);
});

const migrated = game.SaveSystem.sanitize({
  version: 1,
  player: { coins: 7, rodLevel: 0, hookLevel: 0, unlockedMaps: ["tide_dock"] },
  fishBook: {
    fish_small: { discovered: true, catchCount: 2, maxSize: 16 },
    fish_large: { discovered: true, catchCount: 1, maxSize: 34 }
  },
  inventory: {
    fish: [{ id: "fish_small", value: 5 }, { id: "fish_medium", value: 15 }],
    items: [{ id: "ticket", name: "测试券", count: 2 }]
  }
});
assert.equal(migrated.version, 4, "旧存档必须迁移到当前版本");
assert.equal(migrated.player.coins, 27, "旧鱼篓价值必须且只能折算一次");
assert.equal(migrated.fishBook.fish_01.catchCount, 2, "旧小鱼记录必须迁移");
assert.equal(migrated.fishBook.fish_23.catchCount, 1, "旧大鱼记录必须迁移");
assert.ok(!("fish" in migrated.inventory), "当前存档不得继续保存鱼篓");
assert.equal(game.SaveSystem.sanitize(migrated).player.coins, 27, "重复校验不得再次发放迁移金币");

const progress = game.SaveSystem.getDefault();
["fish_01", "fish_11", "fish_21"].forEach(id => game.FishBookSystem.recordCatch(progress, id, 10));
game.MapProgressionSystem.evaluate(progress);
assert.ok(progress.player.unlockedMaps.includes("coral_cove"), "发现三种体型后应解锁珊瑚湾");
for (let index = 0; index < 8; index++) game.FishBookSystem.recordCatch(progress, index % 2 ? "fish_21" : "fish_22", 30);
game.MapProgressionSystem.evaluate(progress);
assert.ok(progress.player.unlockedMaps.includes("deep_blue"), "累计捕获8条大型鱼后应解锁深蓝海沟");

const objectiveSave = game.SaveSystem.getDefault();
game.MapObjectiveSystem.start({ mapId: "tide_dock", save: objectiveSave });
game.MapObjectiveSystem.recordCatch({ save: objectiveSave, fishId: "fish_01", legacyTypeKey: "s" });
game.MapObjectiveSystem.recordCatch({ save: objectiveSave, fishId: "fish_11", legacyTypeKey: "m" });
game.MapObjectiveSystem.recordCatch({ save: objectiveSave, fishId: "fish_21", legacyTypeKey: "l" });
assert.equal(JSON.stringify(game.MapObjectiveSystem.getState()), JSON.stringify({ mapId: "tide_dock", value: 3, target: 3, done: true, reward: 60 }));

const policy = JSON.parse(read("tools/asset-policy.json"));
const generated = new Set(policy.generated);
const optionalFallback = new Set(policy.optionalFallback);
const indexHtml = read("index.html");
const linkedFiles = Array.from(indexHtml.matchAll(/(?:src|href)="\.\/(src\/[^"?]+)/g), match => match[1]);
linkedFiles.forEach(relative => {
  assert.ok(generated.has(relative) || fs.existsSync(path.join(rootDir, relative)), `入口引用缺失文件 ${relative}`);
});
const gameSource = read("src/game.js");
const assetBlock = gameSource.match(/const ASSET_LIST=\{([\s\S]*?)\n\};/);
assert.ok(assetBlock, "无法读取ASSET_LIST");
const runtimeAssets = Array.from(assetBlock[1].matchAll(/:\s*"([^"\n]+\.(?:png|jpe?g|webp))"/g), match => match[1]);
runtimeAssets.forEach(file => {
  const exists = fs.existsSync(path.join(rootDir, "assets", file));
  assert.ok(exists || optionalFallback.has(file), `运行素材缺失且未声明回退策略 ${file}`);
});

assert.ok(!indexHtml.includes("fishingBagSystem.js"), "入口不得加载旧鱼篓系统");
assert.ok(!gameSource.includes("FishingBagSystem"), "核心游戏不得保留旧鱼篓调用");

console.log("[phase1] 30种鱼目录、地图规则、存档迁移、结算规则与资源策略验证通过");
