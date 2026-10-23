import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(rootDir, relative), "utf8");

const runtime = { console };
runtime.window = runtime;
vm.createContext(runtime);
vm.runInContext(read("src/config/interactionFeelConfig.js"), runtime, { filename: "interactionFeelConfig.js" });

const feel = runtime.CatFishGame.InteractionFeelConfig;
assert.ok(Object.isFrozen(feel) && Object.isFrozen(feel.swipe) && Object.isFrozen(feel.performance));
assert.deepEqual(JSON.parse(JSON.stringify(feel.swipe)), {
  startDistance: 12,
  directionRatio: 1.25,
  commitDistance: 128,
  flickDistance: 68,
  flickVelocity: .70,
  transitionMs: 280,
  reboundMs: 230
});
assert.equal(feel.canvasButtonDelayMs, 90);
assert.ok(feel.performance.homeCanvasFps <= 24 && feel.performance.homeCanvasFps >= 15);
assert.ok(feel.performance.coveredCanvasFps <= 10 && feel.performance.coveredCanvasFps >= 6);
assert.ok(feel.performance.coveredCanvasFps < feel.performance.homeCanvasFps);
assert.equal(feel.mobile.minTapTarget, 66);
assert.ok(feel.mobile.minCaptionSize >= 12);

const home = read("src/systems/homeSystem.js");
const game = read("src/game.js");
const css = read("src/lifeScene.css");
const html = read("index.html");
const build = read("build_standalone.py");

assert.ok(home.includes("swipeFeel=interaction.swipe"));
for (const key of ["startDistance", "directionRatio", "commitDistance", "flickDistance", "flickVelocity", "transitionMs", "reboundMs"]) {
  assert.ok(home.includes(`swipeFeel.${key}`), `主界面滑动必须读取 ${key}`);
}
assert.ok(!home.includes("SWIPE_START_DISTANCE") && !home.includes("SWIPE_FLICK_VELOCITY"), "不应保留重复的滑动常量");
assert.ok(game.includes("INTERACTION.canvasButtonDelayMs"));
assert.ok(game.includes("INTERACTION.performance.coveredCanvasFps"));
assert.ok(game.includes("INTERACTION.performance.homeCanvasFps"));
assert.ok(game.includes("const frozen = homeIdle ||"), "局外状态必须停止推进钓鱼模拟");
assert.ok(game.includes("now-lastIdleCanvasFrame<idleInterval"), "局外 Canvas 必须实施帧率门控");
assert.ok(game.includes("displayed && !homeIdle"), "低帧率局外模式不应误报帧尖峰");

assert.ok(game.includes("window.ASSET_INLINE&&!window.ASSET_INLINE[fname]"), "内嵌清单存在时必须跳过缺失的可选素材");
assert.ok(game.includes("finishAssetRequest();continue;"), "跳过素材也必须推进加载完成计数");
assert.ok(home.includes('"--mobile-tap-target",interaction.mobile.minTapTarget+"px"'));
assert.ok(css.includes("min-width:var(--mobile-tap-target,66px);min-height:var(--mobile-tap-target,66px)"));
assert.ok(css.includes("touch-action:manipulation"));
assert.ok(css.includes("env(safe-area-inset-top)"));
assert.ok(css.includes("font-size:10px"));

const interactionTag = html.indexOf("src/config/interactionFeelConfig.js");
assert.ok(interactionTag > html.indexOf("src/config/fishingFeelConfig.js"));
assert.ok(interactionTag < html.indexOf("src/game.js"));
assert.ok(interactionTag < html.indexOf("src/systems/homeSystem.js"));
assert.ok(build.includes('"src/config/interactionFeelConfig.js"'));

console.log(`[phase5] 统一交互参数、局外 ${feel.performance.homeCanvasFps}/${feel.performance.coveredCanvasFps} FPS、移动端 44 实际像素热区与无效素材请求治理验证通过`);
