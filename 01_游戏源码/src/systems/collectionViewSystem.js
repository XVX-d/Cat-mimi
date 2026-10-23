"use strict";
/* 图鉴页面的数据映射层，避免 HomeSystem 直接拼接多种收集数据。 */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={});
 const esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 function fish(save){return game.FishBookSystem.getSummary(save).map(x=>{const fish=x.fish,e=x.entry,ok=e.discovered;return {id:fish.id,ok:ok,name:ok?fish.name:"？？？",meta:ok?fish.rarityLabel+" · "+fish.typeLabel+" · "+fish.value+" 金币 · 捕获 "+e.catchCount+" 次":"尚未发现 · 继续探索海域",icon:"🐟",kind:"fish",rarity:ok?fish.rarity:"unknown"};});}
 function kings(){return [{id:"king_1",ok:false,name:"？？？",meta:"鱼王即将现身",icon:"♛",kind:"king"}];}
 function cats(save){game.CatCollectionSystem.ensure(save);const c=save.cat||{},unlocked=c.unlockedAppearances||["default"];return game.CatAppearanceConfig.list().map(x=>{const ok=unlocked.indexOf(x.id)>=0;return {id:x.id,ok:ok,name:ok?x.name:"？？？",meta:ok?(c.activeAppearance===x.id?"当前使用 · ":"")+x.description:"累计钓到指定数量的鱼后解锁",icon:ok?(x.accessory||"🐱"):"🐱",kind:"cat",active:c.activeAppearance===x.id};});}
 function list(tab,save){return ({fish:fish,king:kings,cat:cats}[tab]||fish)(save);}
 function art(x){return x.kind==="fish"&&game.CoastSystem?game.CoastSystem.fishImage(game.FishConfig.getById(x.id),x.ok):(x.ok?x.icon:"?");}
 function render(tab,save){if(tab==='cat'&&game.CoastSystem)return game.CoastSystem.wardrobe(save,true);return '<div class="catalog-grid">'+list(tab,save).map(x=>'<button class="catalog-card rarity-'+(x.rarity||"none")+' '+(x.ok?"":"locked")+(x.active?" selected":"")+'" data-collection-item="'+x.kind+':'+x.id+'"><span class="catalog-icon">'+art(x)+'</span><b>'+esc(x.name)+'</b><small>'+esc(x.meta)+'</small></button>').join("")+'</div>';}
 game.CollectionViewSystem=Object.freeze({render:render,list:list});
})(window);
