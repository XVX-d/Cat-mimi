"use strict";
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={}),events=game.GameEvents,cfg=game.CatAppearanceConfig;
 function ensureCat(save){
  if(!save||!save.cat)return null;
  const c=save.cat,valid=new Set(cfg.list().map(x=>x.id));
  // Old accessory IDs are not new recipe-based skins; catches are retained for migration.
  c.unlockedAppearances=Array.from(new Set(["default"].concat(c.unlockedAppearances||[]))).filter(id=>valid.has(id));
  if(!c.unlockedAppearances.includes(c.activeAppearance))c.activeAppearance="default";
  return c;
 }
 function progress(save,appearance){return appearance.recipe.map(r=>{
  const entry=save.fishBook&&save.fishBook[r.fishId]||{};
  return {fishId:r.fishId,required:r.count,count:Math.max(0,Math.floor(Number(entry.catchCount)||0)),discovered:!!entry.discovered||entry.catchCount>0};
 });}
 function reconcile(save,notify){
  const c=ensureCat(save);if(!c)return [];
  const added=cfg.list().filter(a=>a.recipe.length&&!c.unlockedAppearances.includes(a.id)&&progress(save,a).every(p=>p.count>=p.required));
  added.forEach(a=>{c.unlockedAppearances.push(a.id);if(notify)events.emit(events.EVENTS.CAT_APPEARANCE_UNLOCKED,{appearance:a,save});});
  if(added.length&&game.SaveSystem)game.SaveSystem.save(save);
  return added;
 }
 function select(save,id){reconcile(save,false);const c=ensureCat(save);if(!c||!c.unlockedAppearances.includes(id))return false;c.activeAppearance=id;game.SaveSystem.save(save);events.emit(events.EVENTS.CAT_APPEARANCE_CHANGED,{appearanceId:id,save});return true;}
 function unlockFromCatch(payload){return reconcile(payload&&payload.save,true);}
 events.on(events.EVENTS.FISH_CAUGHT,unlockFromCatch);
 game.CatCollectionSystem=Object.freeze({ensure:s=>{reconcile(s,false);return ensureCat(s);},reconcile,select,progress,unlockFromCatch});
})(window);
