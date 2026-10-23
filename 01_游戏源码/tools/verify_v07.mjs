import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const env={console};env.window=env;vm.createContext(env);
vm.runInContext(read('src/config/pixelWorldConfig.js'),env);
vm.runInContext(read('src/systems/pixelWorldSystem.js'),env);

const cfg=env.CatFishGame.PixelWorldConfig;
const world=env.CatFishGame.PixelWorldSystem;
const obstacles=cfg.structures.filter(x=>x.obstacle);
assert.ok(obstacles.length>=20,'礁石障碍应覆盖多段水域');
assert.ok(cfg.backdrops.length>=10,'水下应有独立远景礁石层');
assert.equal(world.solidAt(420,980),true,'中层礁石应阻挡鱼钩');
assert.equal(world.solidAt(620,980),false,'礁石旁应保留绕行通道');
assert.equal(world.solidAt(370,2850),true,'深水礁石应阻挡鱼钩');
assert.equal(world.solidAt(600,600),false,'远景礁石不能参与碰撞');
for(const y of [650,1000,1300,1600,1900,2200,2500,2800]){
  assert.ok(Array.from({length:31},(_,i)=>i*30).some(x=>!world.solidAt(x,y)),`深度 ${y} 必须保留通路`);
}
const coast=read('src/systems/coastSystem.js'),game=read('src/game.js'),html=read('index.html');
assert.match(coast,/function drawUnderwaterDetails\(/);
assert.match(coast,/cfg\.backdrops/);
assert.match(game,/hook\._rockFxT/);
assert.match(html,/潮汐码头 -v0\.7/);
console.log('[v0.7] 水下远景分层、全深度礁石、绕行通道、碰撞与触碰反馈检查通过');
