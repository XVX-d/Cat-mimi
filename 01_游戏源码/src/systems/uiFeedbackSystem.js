"use strict";
/* 全局轻反馈：局外页面、图鉴与后续商城共用。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  let host,timer;
  function ensure(){if(host)return host;host=document.createElement("div");host.className="ui-toast hidden";host.setAttribute("aria-live","polite");document.body.appendChild(host);return host;}
  function toast(message,kind){const el=ensure();el.textContent=message;el.className="ui-toast "+(kind||"");clearTimeout(timer);requestAnimationFrame(()=>el.classList.add("show"));timer=setTimeout(()=>el.classList.remove("show"),1900);}
  const patterns={tap:8,success:[12,28,22],error:[26,36,26],hit:12,catch:[14,24,26],warning:[18,34,18],critical:[28,32,28],reel:10,boss:[38,28,46]};
  function pulse(kind){const opt=game.SettingsSystem&&game.SettingsSystem.load();if(!opt||!opt.vibration||!root.navigator||!navigator.vibrate)return false;try{return navigator.vibrate(patterns[kind]||patterns.tap)!==false;}catch(e){return false;}}
  function tap(){return pulse("tap");}
  game.UIFeedbackSystem=Object.freeze({toast:toast,tap:tap,pulse:pulse});
})(window);
