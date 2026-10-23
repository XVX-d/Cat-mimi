import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(rootDir, relative), "utf8");
const vibrations = [];
const stored = new Map();
const runtime = {
  console, Math, Object, Array, Number, String, Boolean,
  localStorage: {
    getItem: key => stored.has(key) ? stored.get(key) : null,
    setItem: (key, value) => stored.set(key, String(value))
  },
  navigator: { vibrate: pattern => { vibrations.push(pattern); return true; } },
  document: {
    body: { appendChild() {} },
    createElement: () => ({ className: "", textContent: "", setAttribute() {}, classList: { add() {}, remove() {} } })
  },
  requestAnimationFrame: callback => callback(),
  setTimeout, clearTimeout
};
runtime.window = runtime;
vm.createContext(runtime);
["src/config/fishingFeelConfig.js", "src/systems/settingsSystem.js", "src/systems/uiFeedbackSystem.js"]
  .forEach(relative => vm.runInContext(read(relative), runtime, { filename: relative }));

const feel = runtime.CatFishGame.FishingFeelConfig;
assert.deepEqual(JSON.parse(JSON.stringify(feel.steering(3, 2))), { x: 0, y: 0, strength: 0 }, "死区内不能产生漂移");
const full = feel.steering(feel.values.joystickRadius, 0);
assert.equal(full.strength, 1, "拖到摇杆外圈必须达到完整转向输入");
assert.equal(full.x, 1);
const diagonal = feel.steering(55, 55);
assert.ok(diagonal.strength > 0.9 && Math.abs(diagonal.x - diagonal.y) < 0.0001, "斜向拖动必须保持方向和强度");
assert.equal(feel.lineState(0.31), "safe");
assert.equal(feel.lineState(0.30), "warning");
assert.equal(feel.lineState(0.12), "critical");

runtime.CatFishGame.UIFeedbackSystem.pulse("hit");
runtime.CatFishGame.UIFeedbackSystem.pulse("catch");
assert.equal(vibrations.length, 2);
assert.equal(vibrations[0], 12);
assert.ok(Array.isArray(vibrations[1]), "捕获反馈必须与普通命中有不同震动节奏");
runtime.CatFishGame.SettingsSystem.set("vibration", false);
runtime.CatFishGame.UIFeedbackSystem.pulse("critical");
assert.equal(vibrations.length, 2, "关闭震动后核心玩法不得继续触发设备震动");

const source = read("src/game.js");
[
  "setPointerCapture", "pointercancel", "HOOK_REVERSE_TURN", "updateLineFeedback", "鱼线告急 · 准备收线",
  "reducedMotion()", "feelPulse(\"catch\")", "releaseJoy();"
].forEach(token => assert.ok(source.includes(token), `核心手感链路缺少 ${token}`));
assert.ok(source.includes("const LINE_COST=BALANCE.gear.rod.costs.slice()") && source.includes("const ATK_COST=BALANCE.gear.hook.costs.slice()"), "阶段4后成长价格必须来自统一配置");
assert.ok(source.includes("roundCatch[catalogFish.name]"), "返航明细必须显示正式鱼名而不是内部体型名");
assert.ok(!source.includes("roundCatch[f.type.name]"));

console.log("[phase3] 转向曲线、触控边界、鱼线告警、分级震动与减少动态效果验证通过");
