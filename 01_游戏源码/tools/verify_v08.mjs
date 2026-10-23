import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const game=read('src/game.js');
const debug=read('src/debug.js');
const html=read('index.html');
const style=read('src/style.css');

const assetBlock=game.match(/const ASSET_LIST=\{([\s\S]*?)\n\};/);
assert.ok(assetBlock,'应能读取素材清单');
for(const key of ['bg_loading','ui_loading_frame','ui_loading_fill','ui_loading_mask']){
  assert.doesNotMatch(assetBlock[1],new RegExp('\\b'+key+'\\s*:'),`不应继续加载旧版素材 ${key}`);
}
for(const key of ['coast_surface','coast_pier','coast_cat','coast_ui']){
  assert.match(game,new RegExp('IMG\\.'+key),`加载界面应复用 ${key}`);
}
assert.match(game,/function drawCoastLoading\(progress,now\)/);
assert.match(game,/小提示：礁石会阻挡鱼钩，可以沿边绕行/);
assert.match(game,/classList\.add\("maomao-loading"\)/);
assert.match(game,/classList\.remove\("maomao-loading"\)/);
assert.match(style,/body\.maomao-loading #homeScreen/);
assert.match(style,/display:none!important/);
for(const key of ['titleY','pierX','catX','barX','messageY','tipY']){
  assert.match(game,new RegExp('\\b'+key+'\\s*:'),`LOADING_UI 应包含 ${key}`);
}
for(const id of ['ldTY','ldPX','ldCX','ldBX','ldTipY']){
  assert.match(debug,new RegExp(id),`加载编辑器应包含 ${id}`);
}
assert.match(html,/潮汐码头 -v0\.8/);
assert.match(html,/game\.js\?v=53/);
console.log('[v0.8] 海边加载构图、进度状态、即时兜底、编辑参数和旧素材停载检查通过');
