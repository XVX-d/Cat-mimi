import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(rootDir, relative), "utf8");
const source = read("src/game.js");
const forbidden = /BossChaseSystem|bossChaseSystem|boss_chase|enterBossChase|leaveBossChase|drawPixelPortal|map_abyss_portal|boss_swim_cat|boss_tentacle/;
for (const relative of ["index.html", "src/game.js", "src/config/pixelWorldConfig.js", "src/systems/pixelWorldSystem.js"]) {
  assert.doesNotMatch(read(relative), forbidden, `${relative} 不得残留传送门运行入口或素材请求`);
}
assert.ok(!read("build_standalone.py").includes('"src/systems/bossChaseSystem.js"'));

const runtime = { Math, Object, Array, Number };
runtime.window = runtime;
vm.createContext(runtime);
for (const relative of ["src/config/pixelWorldConfig.js", "src/systems/pixelWorldSystem.js"]) {
  vm.runInContext(read(relative), runtime, { filename: relative });
}
const world = runtime.CatFishGame.PixelWorldSystem;
// The v0.4 cast animation is presentation-only; this test begins after its release.
runtime.CatFishGame.CoastSystem={castReady:()=>true};
runtime.T=1;
assert.equal(runtime.CatFishGame.PixelWorldConfig.portal, undefined);
for (const name of ["canEnter", "getPortal", "drawPortal"]) assert.equal(world[name], undefined);
assert.equal(world.regionAt(450).id, "catpaw_lagoon");
assert.equal(world.solidAt(450, 430), false, "原传送门位置应是普通可通行水域");
assert.equal(world.solidAt(450, 3800), true, "世界底部碰撞必须保留");
world.drawUnderwater({}, {});
assert.equal(world.drawSurface({}, {}), false);

function extract(name) {
  const match = source.match(new RegExp("^function " + name + "\\([^]*?^\\}", "m"));
  assert.ok(match, `缺少实际运行函数 ${name}`);
  return match[0];
}

let completedRetractions = 0;
Object.assign(runtime, {
  hook: { x: 350, y: 430, vx: 100, vy: 0, state: "swim", stun: 0, trail: [], lineTrail: [] },
  joy: { active: false, dx: 0, dy: 0 }, phase: "fishing",
  HOOK_SPD: 100, HOOK_TURN: 8, HOOK_REVERSE_TURN: 12,
  WORLD_W: 6144, WORLD_H: 3800, WATER_Y: 205,
  lineDrain: true, lineLeft: 1000, lineMax: 1000, bossRound: false, bossFish: null,
  LINE_SAMPLE: 5, REEL_LINE_SPEED: 300, REEL_MIN_DURATION: 0.5, REEL_MAX_DURATION: 4,
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  resolveColliders() {}, updateLineFeedback() {},
  sampleLineTrail() { runtime.hook.lineTrail.push({ x: runtime.hook.x, y: runtime.hook.y }); },
  fishingLinePath: () => [{ x: 278, y: 175 }, { x: runtime.hook.x, y: runtime.hook.y }],
  releaseJoy() { runtime.joy.active = false; }, SFX: { reel() {} }, feelPulse() {},
  castX: () => 278, launchNextFishAboveWater() {}, allHookedFishOutsideView: () => true,
  endRetract() { completedRetractions++; runtime.hook.state = "idle"; },
  spawnBoss() { assert.fail("移除传送门后不得意外触发旧海王回合"); }
});
vm.runInContext(extract("endRound") + "\n" + extract("updateHook"), runtime);

runtime.updateHook(1);
assert.equal(runtime.hook.x, 450);
assert.equal(runtime.hook.y, 430);
assert.equal(runtime.hook.state, "swim", "经过原传送门中心仍须保持钓鱼");
assert.equal(runtime.phase, "fishing");
assert.equal(runtime.lineLeft, 900, "经过原入口须正常消耗鱼线");
assert.equal(runtime.hook.lineTrail.length, 1, "经过原入口须继续记录鱼线路径");
runtime.updateHook(1);
runtime.hook.vx = -100;
runtime.updateHook(1);
assert.equal(runtime.hook.x, 450);
assert.equal(runtime.phase, "fishing", "重复经过原入口不应切换场景");
assert.equal(runtime.lineLeft, 700);

runtime.endRound();
assert.equal(runtime.hook.state, "retract", "手动收线仍有效");
runtime.updateHook(5);
assert.equal(runtime.hook.state, "idle");
assert.equal(completedRetractions, 1);

Object.assign(runtime.hook, { x: 450, y: 430, vx: 100, vy: 0, state: "swim", stun: 0 });
runtime.lineLeft = 1;
runtime.updateHook(0.1);
assert.equal(runtime.lineLeft, 0);
assert.equal(runtime.hook.state, "retract", "鱼线耗尽仍须自动收线");
runtime.updateHook(5);
assert.equal(completedRetractions, 2);

Object.assign(runtime.hook, { x: 278, y: 290, vx: 0, vy: 0, state: "cast" });
runtime.updateHook(0.1);
assert.equal(runtime.hook.state, "swim", "抛钩入水流程必须保留");

const bossRoundAssignment = extract("startRound").match(/^\s*bossRound=([^;]+);/m);
assert.ok(bossRoundAssignment);
for (const coins of [0, 899, 900, 100000]) {
  Object.assign(runtime, { totalEarned: coins, GOAL_COINS: 900, bossDone: false });
  assert.equal(vm.runInContext(bossRoundAssignment[1], runtime), false,
    "移除追逐模块后，达到金币门槛也不能自动开启原本关闭的旧海王关卡");
}
for (const token of ["drawGrazeFish();", "drawHook();", "ROUND_SETTLED", "RETURNED_HOME"]) {
  assert.ok(source.includes(token), `现有钓鱼与返航链路须保留 ${token}`);
}
if (process.argv.includes("--release")) {
  assert.doesNotMatch(read("seaking_standalone.html"), forbidden, "试玩包也必须移除追逐代码和专用内嵌素材");
  assert.doesNotMatch(read("src/assets_b64.js"), forbidden);
  assert.doesNotMatch(read("src/_export_src.js"), forbidden);
}
console.log("[v0.3] 原传送门位置通行、重复经过、鱼线消耗、抛钩、手动/自动收线、旧海王回合保持关闭验证通过");
