"use strict";
(async function () {
  const outputs=new Map();
  let sdk=null, active=false, frozen=false, loading=false, playing=false, muted=false;
  const local=()=>window.localStorage;
  const bridge=window.CGBridge={
    get active(){return active;},
    get muted(){return muted;},
    storage:{
      getItem(key){return (active?sdk.data:local()).getItem(key);},
      setItem(key,value){if(frozen)throw Error("Account changed; reloading");return (active?sdk.data:local()).setItem(key,value);},
      removeItem(key){if(frozen)throw Error("Account changed; reloading");return (active?sdk.data:local()).removeItem(key);}
    },
    audioDestination(context){
      if(!outputs.has(context)){
        const gain=context.createGain();gain.gain.value=muted?0:1;
        gain.connect(context.destination);outputs.set(context,gain);
      }
      return outputs.get(context);
    }
  };
  function settings(value){
    muted=!!value.muteAudio;
    outputs.forEach(g=>{g.gain.value=muted?0:1;});
  }
  function call(name){if(active&&typeof sdk.game[name]==="function")sdk.game[name]();}
  bridge.adapter={
    capabilities:{storage:"CrazyGames Data",lifecycle:"crazygames-v3",ads:false},
    init(){return true;},
    loadingStart(){if(!loading){call("loadingStart");loading=true;}},
    loadingStop(){if(loading){call("loadingStop");loading=false;}},
    gameplayStart(){if(!playing){call("gameplayStart");playing=true;}},
    gameplayStop(){if(playing){call("gameplayStop");playing=false;}}
  };
  function script(url){
    return new Promise((resolve,reject)=>{
      const tag=document.createElement("script");tag.src=url;
      const timer=setTimeout(()=>reject(Error("Script timeout: "+url)),20000);
      tag.onload=()=>{clearTimeout(timer);resolve();};
      tag.onerror=()=>{clearTimeout(timer);reject(Error("Script unavailable: "+url));};
      document.head.appendChild(tag);
    });
  }
  function timeout(p){
    let timer;
    return Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error("SDK initialization timed out")),20000);})]).finally(()=>clearTimeout(timer));
  }
  const panel=document.createElement("div");
  panel.id="cg-connection";
  panel.style.cssText="position:fixed;inset:0;background:#10394b;color:white;z-index:999999;display:grid;place-content:center;text-align:center;padding:24px;font:18px sans-serif";
  panel.textContent="Connecting… / 正在连接平台";
  document.body.appendChild(panel);
  try {
    // file:// is an explicit offline preview. Platform builds require SDK success.
    if(location.protocol!=="file:"){
      if(!window.CrazyGames?.SDK)await script("https://sdk.crazygames.com/crazygames-sdk-v3.js");
      sdk=window.CrazyGames.SDK;
      await timeout(sdk.init());
      active=sdk.environment==="crazygames"||sdk.environment==="local";
      if(active){
        const main="cat-and-fish.crazy-basic.save.v1", marker=main+".sdk-migrated";
        // Probe the data module before any game code can create defaults.
        const remote=sdk.data.getItem(main);
        if(sdk.data.getItem(marker)==null){
          if(remote==null){
            for(const key of [main,main+".backup",main+".recovery","cat-and-fish.crazy-basic.settings.v1","cat-and-fish.crazy-basic.language.v1"]){
              let value=null;
              try{value=local().getItem(key);}catch(_){}
              if(value!=null&&sdk.data.getItem(key)==null)sdk.data.setItem(key,value);
            }
          }
          sdk.data.setItem(marker,"1");
        }
        settings(sdk.game.settings||{});
        sdk.game.addSettingsChangeListener(settings);
        if(sdk.user?.addAuthListener)sdk.user.addAuthListener(()=>{
          // Never save the previous account's in-memory progress into new account data.
          frozen=true;location.reload();
        });
        bridge.adapter.loadingStart();
      }
    }
    for(const url of window.CG_GAME_SCRIPTS)await script(url);
    window.dispatchEvent(new Event("cg-game-ready"));
    panel.remove();
  }catch(error){
    console.error("CrazyGames startup failed",error);
    panel.textContent="Unable to connect. Please enable CrazyGames SDK Data in the submission settings, then retry. / 连接失败，请确认后台已选择 SDK Data 存档后重试。";
    const retry=document.createElement("button");
    retry.textContent="Retry / 重试";retry.style.cssText="margin:24px;padding:14px;cursor:pointer";
    retry.onclick=()=>location.reload();panel.appendChild(retry);
  }
})();
