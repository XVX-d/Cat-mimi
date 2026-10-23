import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(rootDir, relative), "utf8");
const stored = new Map();
const storage = {
  getItem: key => stored.has(key) ? stored.get(key) : null,
  setItem: (key, value) => stored.set(key, String(value)),
  removeItem: key => stored.delete(key)
};
let clock = 1000;
const runtime = {
  console, Map, Set, Math, Date, JSON, Object, Array, Number, String, Boolean,
  localStorage: storage,
  performance: { now: () => clock },
  setTimeout: fn => { fn(); return 1; },
  clearTimeout() {}
};
runtime._loadingFinalized = true;
runtime.window = runtime;
vm.createContext(runtime);
[
  "src/config/gameDataSchema.js", "src/config/interactionFeelConfig.js", "src/config/balanceConfig.js",
  "src/config/fishCatalogConfig.js", "src/data/defaultSaveData.js", "src/save/saveSystem.js",
  "src/systems/gameEventBus.js"
].forEach(relative => vm.runInContext(read(relative), runtime, { filename: relative }));

const game = runtime.CatFishGame;
const first = game.SaveSystem.getDefault();
game.SaveSystem.save(first);
first.player.coins = 100;
game.SaveSystem.save(first);
first.player.coins = 150;
game.SaveSystem.save(first);
assert.equal(JSON.parse(stored.get(game.SaveSystem.BACKUP_KEY)).player.coins, 100, "备份必须保留上一份有效存档");
stored.set(game.SaveSystem.STORAGE_KEY, "{broken-json");
const recovered = game.SaveSystem.load();
assert.equal(recovered.player.coins, 100, "主存档损坏时必须从最近安全备份恢复");
assert.equal(game.SaveSystem.getStatus().recovered, true);
assert.equal(game.SaveSystem.getStatus().recoverySource, "backup");
assert.equal(JSON.parse(stored.get(game.SaveSystem.STORAGE_KEY)).player.coins, 100, "恢复后必须立即修复主存档");

let toastMessage = "";
game.UIFeedbackSystem = { toast: message => { toastMessage = message; } };
vm.runInContext(read("src/systems/sessionSafetySystem.js"), runtime, { filename: "sessionSafetySystem.js" });
let activeSave = recovered;
game.SessionSafetySystem.registerSaveProvider(() => activeSave);
assert.ok(toastMessage.includes("恢复最近安全进度"), "自动恢复必须向玩家给出明确提示");
assert.equal(game.SessionSafetySystem.claim("purchase"), true);
assert.equal(game.SessionSafetySystem.claim("purchase"), false, "同一高价值操作在冷却期内只能提交一次");
clock += game.InteractionFeelConfig.session.actionCooldownMs + 1;
assert.equal(game.SessionSafetySystem.claim("purchase"), true);
game.GameEvents.emit(game.GameEvents.EVENTS.APP_PAUSED, {});
assert.equal(game.SessionSafetySystem.getState().lastReason, "app_paused");
game.GameEvents.emit(game.GameEvents.EVENTS.APP_RESUMED, {});
assert.equal(game.SessionSafetySystem.canInteract(), false, "恢复瞬间必须屏蔽误触");
clock += game.InteractionFeelConfig.session.resumeGuardMs + 1;
assert.equal(game.SessionSafetySystem.canInteract(), true);

const source = read("src/game.js");
const home = read("src/systems/homeSystem.js");
const platform = read("src/platform/platformSystem.js");
const html = read("index.html");
const build = read("build_standalone.py");
assert.ok(home.includes("session().getSave"), "局外界面必须读取钓鱼运行时持有的同一份会话存档");
assert.ok(source.includes("getSave:()=>progressionSave"));
assert.ok(source.includes("pendingUiActions.has(act)") && source.includes("pendingUiActions.delete(act)"));
assert.ok(source.includes("suspendAudioForLifecycle") && source.includes("resumeAudioForLifecycle"));
assert.ok(source.includes("!sessionSafety.canInteract()"));
assert.ok(platform.includes('addEventListener("pagehide", pause)'));
assert.ok(platform.includes('addEventListener("blur", pause)'));
assert.ok(html.indexOf("sessionSafetySystem.js") < html.indexOf("src/game.js"));
assert.ok(build.includes('"src/systems/sessionSafetySystem.js"'));

game.SaveSystem.clear();
assert.equal(stored.has(game.SaveSystem.STORAGE_KEY), false);
assert.equal(stored.has(game.SaveSystem.BACKUP_KEY), false);
assert.equal(stored.has(game.SaveSystem.RECOVERY_KEY), false);
console.log("[phase6] 会话单一存档、上一版本备份、损坏恢复、后台检查点、恢复防误触与重复提交防护验证通过");
