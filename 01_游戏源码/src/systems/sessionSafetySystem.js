"use strict";
/* 会话安全：统一存档检查点、切后台恢复保护和高价值操作去重。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  const events=game.GameEvents,saveApi=game.SaveSystem;
  const cfg=game.InteractionFeelConfig.session;
  const locks=new Map();
  let saveProvider=null,lastCheckpointAt=0,lastReason="boot",resumeGuardUntil=0,recoveryNotified=false;

  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function registerSaveProvider(provider){
    if(typeof provider!=="function")throw new Error("SessionSafetySystem requires a save provider function.");
    saveProvider=provider;
    notifyRecovery();
  }
  function notifyRecovery(){
    if(recoveryNotified||!game.UIFeedbackSystem)return;
    const status=saveApi.getStatus();
    if(!status.recovered)return;
    recoveryNotified=true;
    const message=status.recoverySource==="backup"?"检测到异常存档，已恢复最近安全进度":"检测到异常存档，已建立新的安全存档";
    (function showWhenReady(){
      if(!root._loadingFinalized){root.setTimeout(showWhenReady,150);return;}
      game.UIFeedbackSystem.toast(message,status.recoverySource==="backup"?"success":"error");
    })();
  }
  function checkpoint(reason,force){
    if(!saveProvider)return false;
    const at=now();
    if(!force&&at-lastCheckpointAt<cfg.checkpointMinIntervalMs)return false;
    const save=saveProvider();
    if(!save)return false;
    saveApi.save(save);
    lastCheckpointAt=at;
    lastReason=reason||"unspecified";
    return saveApi.getStatus().ok;
  }
  function canInteract(){return now()>=resumeGuardUntil;}
  function claim(key,cooldown){
    if(!canInteract())return false;
    const at=now(),until=locks.get(key)||0;
    if(at<until)return false;
    locks.set(key,at+Math.max(0,cooldown==null?cfg.actionCooldownMs:cooldown));
    return true;
  }
  function release(key){locks.delete(key);}
  function snapshot(){return {canInteract:canInteract(),resumeGuardUntil:resumeGuardUntil,lastCheckpointAt:lastCheckpointAt,lastReason:lastReason,locks:locks.size};}

  if(events){
    events.on(events.EVENTS.APP_PAUSED,function(){checkpoint("app_paused",true);});
    events.on(events.EVENTS.APP_RESUMED,function(){
      resumeGuardUntil=now()+cfg.resumeGuardMs;
      root.setTimeout(function(){if(game.UIFeedbackSystem)game.UIFeedbackSystem.toast("游戏已恢复 · 进度已保存","success");},cfg.resumeGuardMs);
    });
    [events.EVENTS.ROUND_SETTLED,events.EVENTS.UPGRADE_PURCHASED,
      events.EVENTS.CAT_APPEARANCE_CHANGED,events.EVENTS.RETURNED_HOME].forEach(function(name){
      events.on(name,function(){checkpoint(name,false);});
    });
  }

  game.SessionSafetySystem=Object.freeze({registerSaveProvider:registerSaveProvider,checkpoint:checkpoint,
    canInteract:canInteract,claim:claim,release:release,getState:snapshot});
})(window);
