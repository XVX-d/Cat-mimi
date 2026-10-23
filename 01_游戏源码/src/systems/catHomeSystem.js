"use strict";
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={}),events=game.GameEvents;
  let mood="idle",until=0;
  const set=(next,ms)=>{mood=next;until=ms?Date.now()+ms:0;return mood;};
  const get=()=>until&&Date.now()>until?(mood="idle",until=0,mood):mood;
  if(events){
    events.on(events.EVENTS.FISH_CAUGHT,()=>set("happy",1800));
    events.on(events.EVENTS.FISHING_STARTED,()=>set("alert",0));
    events.on(events.EVENTS.ROUND_SETTLED,p=>set(p&&p.value>0?"happy":"sleepy",2200));
    events.on(events.EVENTS.UPGRADE_PURCHASED,()=>set("happy",2200));
  }
  game.CatHomeSystem=Object.freeze({getMood:get,setMood:set,interact:next=>set(next,2600)});
})(window);
