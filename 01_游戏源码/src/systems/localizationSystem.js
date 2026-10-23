"use strict";
/* Display-only localization. Chinese catalog names remain stable save/settlement keys. */
(function(root){
 const game=root.CatFishGame,KEY="cat-and-fish.language.v1";
 let language=/^zh\b/i.test((navigator.languages||[])[0]||navigator.language||"en")?"zh-CN":"en",persisted=true;
 try{const saved=localStorage.getItem(KEY);if(saved==="en"||saved==="zh-CN")language=saved;}catch(e){persisted=false;}
 const pairs=(game.LocalizationConfig||[]).concat([
  ["小屋内部","Cat Cabin"],["海边小屋","Seaside Cabin"],["已经满级","Max Level"],["潮 汐 码 头","Tidewater Pier"],
  ["点击首页的钓具升级，用本次收益强化鱼竿或鱼钩","Open Upgrade Gear on the home screen to improve your rod or hook."],
  ["累计钓到指定数量的鱼后解锁","Catch the required amounts to unlock."],
  ["语言选择仅在本次有效，浏览器未允许保存。","Language changed for this session. Browser storage is unavailable."],
  ["可用金币","Coins:"],["升级后","Next:"],["运行平台：","Platform: "],["存档方式：","Save storage: "],["存档状态：","Save status: "],
  ["手动收线","Reel In"],["收线","Reel In"],["鱼竿架","Rod Rack"],["鱼钩工作台","Hook Workbench"],["收获鱼篓","Catch Basket"],
  ["摸摸头，陪它吃点东西","Time for pets and treats."],["金币","coins"],["米鱼线","m of line"],
  ["最大探索深度","Max Depth"],["整理并强化鱼竿，前往更深的水域。","Improve your rod and explore deeper waters."],
  ["打磨鱼钩，让捕获大型鱼更轻松。","Sharpen your hook to catch bigger fish."],["妥善保存鱼获，提高每次返航的结算收益。","Keep your catch safe and earn more each cast."],
  ["选择钓鱼海域","Choose Your Waters"],["单价","Each:"],["已获得","Obtained"],["解锁","Unlock"],
  ["鱼线","Line"],["结算收益","Earnings"],["首次发现","New Discovery"],["新发现！","New Discovery!"],
  ["新海域开放","New Waters Unlocked!"],["从小屋出发","Available on the Sea Chart"],
  ["从海边小屋出发的第一片海域","Your first fishing spot by the seaside cabin."],
  ["主菜单","Main Menu"],["目标 · ","Goal · "],["已领取 ","Claimed: "],["奖励 ","Reward: "],
  ["按住屏幕","Press and hold"],["返回小屋","Back to Cabin"],["水下世界已就绪","The underwater world is ready!"],
  ["正在整理鱼竿","Getting your rod ready…"],["正在准备鱼篓","Preparing your basket…"],["正在观察海面","Checking the waters…"],
  ["小提示：礁石会阻挡鱼钩，可以沿边绕行","Tip: Reefs block your hook. Steer around their edges."],
  ["快好了","Almost ready…"],["⏳加载","Loading…"],["近岸浅滩","Coastal Shallows"],
  ["已摆放","Placed"],["已拥有","Owned"],["已可从小屋出发","Available on the Sea Chart"]
 ]);
 const exact=new Map(pairs),escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 const templates=pairs.filter(p=>p[0].includes("{")).map(([zh,en])=>{
   const names=[];let cursor=0,pattern="";
   zh.replace(/\{(\w+)\}/g,(m,n,i)=>{pattern+=escape(zh.slice(cursor,i))+"(.+?)";names.push(n);cursor=i+m.length;});
   pattern+=escape(zh.slice(cursor));return {re:new RegExp("^"+pattern+"$"),names,en};
 });
 const words=pairs.filter(([zh])=>!zh.includes("{")&&/[\u3400-\u9fff]/.test(zh)).sort((a,b)=>b[0].length-a[0].length);
 function english(value,depth=0){
  const text=String(value),trim=text.trim();
  if(exact.has(trim))return text.replace(trim,exact.get(trim));
  if(!/[\u3400-\u9fff]/.test(text))return text;
  if(depth<3)for(const t of templates){const m=trim.match(t.re);if(m){let out=t.en;t.names.forEach((n,i)=>{out=out.replaceAll("{"+n+"}",english(m[i+1],depth+1));});return text.replace(trim,out);}}
  // Inline nodes and compact numeric labels have whitespace variants in legacy renderers.
  let out=text.replace(/探索目标：(.+?) (\d+)米/g,(_,name,d)=>"Next stop: "+english(name,depth+1)+" · "+d+" m")
   .replace(/建议鱼线 Lv\.(\d+)（再升 (\d+) 次）/g,"Suggested line Lv. $1 · $2 upgrades to go")
   .replace(/每次命中\s*(\d+)\s*点伤害/g,"$1 damage per hit").replace(/捕获\s*(\d+)\s*次/g,"Caught: $1")
   .replace(/历史最深\s*(\d+)\s*米/g,"Best Depth: $1 m").replace(/下沉深度\s*(\d+)\s*米/g,"Depth: $1 m")
   .replace(/好感度\s*\+\s*(\d+)/g,"Affection +$1").replace(/(\d+:\d+) 后可再 \+10/g,"+10 again in $1")
   .replace(/(\d+)\s*米/g,"$1 m").replace(/结算\s*\+(\+?\d+)%/g,"Earnings +$1%");
  for(const [zh,en] of words)out=out.split(zh).join(en);
  return out.replace(/\b1 coins\b/g,"1 coin").replace(/\b1 upgrades\b/g,"1 upgrade");
 }
 function t(value){return language==="en"?english(value).replace(/\b1 coins\b/g,"1 coin").replace(/\b1 upgrades\b/g,"1 upgrade").replace(/(?<![\w.])\d{4,}(?![\w.])/g,n=>Number(n).toLocaleString("en-US")):String(value);}
 const nodes=new WeakMap(),attrs=new WeakMap();
 const scope="#homeScreen,.ui-toast,.collection-feedback,#mapObjective,.map-objective-toast,.onboarding-guide";
 function excluded(el){return !el||!!el.closest('[data-no-i18n],#debugPanel,.map-editor,.main-scene-editor');}
 function textNode(node){
  if(excluded(node.parentElement))return;
  let entry=nodes.get(node);if(!entry||node.nodeValue!==entry.output)entry={original:node.nodeValue};
  const output=t(entry.original);entry.output=output;nodes.set(node,entry);if(node.nodeValue!==output)node.nodeValue=output;
 }
 function element(el){
  if(excluded(el))return;
  for(const name of ["aria-label","title","alt","placeholder"]){if(!el.hasAttribute(name))continue;
   let map=attrs.get(el);if(!map){map={};attrs.set(el,map);}let entry=map[name],value=el.getAttribute(name);
   if(!entry||entry.output!==value)entry={original:value};entry.output=t(entry.original);map[name]=entry;
   if(value!==entry.output)el.setAttribute(name,entry.output);
  }
  if(el.hasAttribute("data-language"))el.setAttribute("aria-pressed",String(el.dataset.language===language));
 }
 function translateTree(el){if(excluded(el))return;element(el);const walk=document.createTreeWalker(el,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode;if(n.nodeType===3)textNode(n);else element(n);}}
 let observer;
 function apply(){
  if(observer)observer.disconnect();
  document.documentElement.lang=language;document.title=language==="en"?"Cat & Fish · Tidewater Pier -v0.33":"猫与鱼 · 潮汐码头 -v0.33";
  document.querySelectorAll(scope).forEach(translateTree);
  document.querySelectorAll('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.language===language)));
  if(observer)observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["aria-label","title","alt","placeholder"]});
 }
 function setLanguage(next){if(next!=="en"&&next!=="zh-CN")return false;language=next;
  try{localStorage.setItem(KEY,next);persisted=true;}catch(e){persisted=false;}apply();
  if(game.UIFeedbackSystem)game.UIFeedbackSystem.toast(persisted?"语言已切换":"语言选择仅在本次有效，浏览器未允许保存。");return persisted;
 }
 function controls(){return '<div class="language-setting" data-no-i18n><strong>语言 / Language</strong><div role="group" aria-label="语言 / Language"><button type="button" data-language="zh-CN" aria-pressed="'+(language==="zh-CN")+'">简体中文</button><button type="button" data-language="en" aria-pressed="'+(language==="en")+'">English</button></div></div>';}
 function installCanvas(ctx){
  for(const method of ["fillText","strokeText"]){const original=ctx[method].bind(ctx);ctx[method]=function(value,x,y,maxWidth){
   const output=t(value);if(language!=="en"||output===String(value))return maxWidth===undefined?original(output,x,y):original(output,x,y,maxWidth);
   // Keep canvas HUD inside its safe area without changing world positions or hitboxes.
   const cap=maxWidth||Math.max(80,Math.min(480,this.textAlign==="center"?Math.min(x,540-x)*2-20:520-x));
   return original(output,x,y,cap);
  };}
  const measure=ctx.measureText.bind(ctx);ctx.measureText=value=>measure(t(value));
 }
 function init(){observer=new MutationObserver(()=>apply());apply();document.addEventListener("click",e=>{const b=e.target.closest("[data-language]");if(b){e.preventDefault();setLanguage(b.dataset.language);}},true);}
 game.LocalizationSystem=Object.freeze({t,setLanguage,getLanguage:()=>language,controls,apply,installCanvas});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);
