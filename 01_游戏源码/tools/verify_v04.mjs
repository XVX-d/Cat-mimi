import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>fs.readFileSync(path.join(base,f),"utf8");
const values=new Map();
const context={console,Math,JSON,Object,Array,Number,String,Boolean,Set,Map,Date,performance:{now:()=>1000},
 localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},setTimeout(){},setInterval(){},clearInterval(){},clearTimeout(){}};
context.window=context;vm.createContext(context);
for(const f of ["src/config/gameDataSchema.js","src/config/balanceConfig.js","src/config/fishCatalogConfig.js","src/config/fishConfig.js",
 "src/data/defaultSaveData.js","src/save/saveSystem.js","src/systems/gameEventBus.js","src/systems/fishBookSystem.js",
 "src/config/catAppearanceConfig.js","src/systems/catCollectionSystem.js","src/config/mainLayoutConfig.js","src/systems/mainSceneLayoutSystem.js","src/systems/coastSystem.js"])
 vm.runInContext(read(f),context,{filename:f});
const g=context.CatFishGame,save=g.SaveSystem.getDefault(),cfg=g.CatAppearanceConfig;
assert.equal(cfg.list().length,10);
assert.equal(new Set(cfg.list().map(x=>x.id)).size,10);
assert.equal(g.CatCollectionSystem.select(save,"cowboy"),false);
save.fishBook.fish_05={discovered:true,catchCount:2};save.fishBook.fish_01={discovered:true,catchCount:2};
g.CatCollectionSystem.ensure(save);
assert.deepEqual([...save.cat.unlockedAppearances],["default"],"发现过但次数不足，不直接补发");
g.FishBookSystem.recordCatch(save,"fish_05",1);
g.GameEvents.emit(g.GameEvents.EVENTS.FISH_CAUGHT,{save,fishId:"fish_05"});
assert.ok(save.cat.unlockedAppearances.includes("cowboy"));
assert.equal(save.fishBook.fish_05.catchCount,3);assert.equal(save.fishBook.fish_01.catchCount,2);
assert.equal(save.cat.activeAppearance,"default","不能自动装备");
assert.equal(g.CatCollectionSystem.select(save,"cowboy"),true);
g.CatCollectionSystem.reconcile(save,true);assert.equal(save.cat.unlockedAppearances.filter(x=>x==="cowboy").length,1);
const reloaded=g.SaveSystem.load();assert.equal(reloaded.cat.activeAppearance,"cowboy");
assert.ok(reloaded.cat.unlockedAppearances.includes("cowboy"));
for(const a of cfg.list()){for(const r of a.recipe)save.fishBook[r.fishId]={discovered:true,catchCount:r.count};}
g.CatCollectionSystem.reconcile(save,false);assert.equal(save.cat.unlockedAppearances.length,10,"旧存档按真实次数补发所有达标外观");
const fresh=g.SaveSystem.getDefault(),html=g.CoastSystem.wardrobe(fresh);
assert.equal((html.match(/class="coast-look /g)||[]).length,10);
assert.equal((html.match(/class="recipe-fish silhouette"/g)||[]).length,18);
assert.ok(!html.includes("月光鱼")&&!html.includes("星海鱼"),"未发现鱼不泄露名字");
const shots=[];
g.SettingsSystem={load:()=>({reducedMotion:true})};
g.GameSession={getSave:()=>save};
const ctx=new Proxy({drawImage:(...x)=>shots.push(x)}, {get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>(t[k]=v,true)});
const imgs={coast_cat:{width:1536,height:1024,id:"default"},coast_skins:{width:1254,height:1254,id:"skins"}};
for(const state of ["idle","cast","swim","retract"]){shots.length=0;g.CoastSystem.drawCharacter(ctx,imgs,10,state);assert.equal(shots[0][0].id,"skins","装备外观在每个阶段都保持");}
const layout=g.MainSceneLayoutSystem;
assert.equal(layout.get("cat").w,242.25);assert.equal(layout.get("hut"),null);assert.equal(layout.get("fisher"),null);
layout.set("cat",{x:230,w:300});assert.equal(layout.get("cat").x,230);layout.reset("cat");assert.equal(layout.get("cat").x,105);
const result=g.CoastSystem.harvest(save,{round:2,value:30,catches:{"泡泡小鱼":3}});
assert.equal((result.match(/class="coast-catch"/g)||[]).length,3,"重复鱼逐条排列，不合并");
assert.ok(result.includes("harvest-home")&&result.includes("harvest-continue"));
const source=read("src/game.js");
function extract(name){return source.match(new RegExp("^function "+name+"\\([^]*?^\\}","m"))[0];}
let credits=0,coins=0,syncs=0;
Object.assign(context,{settleAnim:{credited:false},roundValue:125,economyWallet:{add:n=>{credits++;coins+=n;}},syncProgression:()=>syncs++});
vm.runInContext(extract("creditRoundSettlement"),context);
context.creditRoundSettlement();context.creditRoundSettlement();assert.equal(credits,1);assert.equal(coins,125);
assert.ok(source.includes('id==="reelBtn"&&(hook.state==="swim"||hook.state==="cast")'));
assert.ok(!read("src/systems/homeSystem.js").includes('data-action="open-tackle"><span class="tackle-art"'));
assert.ok(read("index.html").includes("coastSystem.js"));assert.ok(read("build_standalone.py").includes('"src/systems/coastSystem.js"'));
console.log("[v0.4] 十种外观、累计配方、旧存档补算、非消耗、静态装备保持、未知鱼轮廓、逐条鱼获、金币幂等、编辑器与构建入口通过");
