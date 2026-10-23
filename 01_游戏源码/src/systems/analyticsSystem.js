"use strict";
/* Local-only diagnostics; bounded storage, no network or player identifiers. */
(function(root){
 const g=root.CatFishGame,KEY='cat-and-fish.analytics.v1',LIMIT=500;
 const schema={game_ready:['load_ms'],fishing_start:['round_id','rod_level','hook_level'],fishing_end:['round_id','duration_ms','max_depth_m','fish_count','coins_earned','reel_reason','boost_count'],gear_upgrade:['item','from_level','to_level','coins_spent'],tutorial_step:['guide','step','round_id'],boost_first_success:['round_id','depth_m'],session_hide:['reason','screen','segment_ms','session_ms','in_fishing']};
 let rows=[],dirty=false,storageOk=true,active=!document.hidden,start=performance.now(),elapsed=0,ready=false,seq=0,round=null;
 const session=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),seen=new Set();
 const safe=fn=>(...args)=>{try{return fn(...args);}catch(e){return false;}};
 const number=x=>Number.isFinite(Number(x))?Math.max(0,Math.round(Number(x))):0;
 function clean(name,data){const out={};for(const k of schema[name]||[]){const v=data&&data[k];if(typeof v==='string')out[k]=v.slice(0,80);else if(typeof v==='boolean')out[k]=v;else if(typeof v==='number'&&Number.isFinite(v))out[k]=v;}return out;}
 try{const old=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(old))rows=old.slice(-LIMIT).filter(r=>r&&schema[r.event]).map(r=>({event:r.event,event_id:String(r.event_id||'').slice(0,90),session_id:String(r.session_id||'').slice(0,60),version:String(r.version||'').slice(0,24),at:number(r.at),data:clean(r.event,r.data)}));}catch(e){storageOk=false;}
 function version(){return (document.title.match(/v\d+\.\d+/)||['unknown'])[0];}
 function track(name,data){if(!schema[name])return false;rows.push({event:name,event_id:session+':'+(++seq),session_id:session,version:version(),at:Date.now(),data:clean(name,data)});if(rows.length>LIMIT)rows.splice(0,rows.length-LIMIT);dirty=true;return true;}
 function flush(){if(!dirty)return;try{localStorage.setItem(KEY,JSON.stringify(rows));dirty=false;storageOk=true;}catch(e){storageOk=false;}}
 function clock(){return elapsed+(active?Math.max(0,performance.now()-start):0);}
 function screen(){const scene=g.SceneRouterSystem?.get().scene||'loading',overlay=g.OverlayManagerSystem?.get().active;return round?'fishing':overlay||scene;}
 function hide(reason){if(!active)return;const segment=Math.max(0,performance.now()-start);elapsed+=segment;active=false;track('session_hide',{reason,screen:screen(),segment_ms:number(segment),session_ms:number(elapsed),in_fishing:!!round});flush();}
 function resume(){if(active||document.hidden)return;active=true;start=performance.now();}
 function tutorial(guide,step){const id=guide+':'+step+':'+(round?.id||'session');if(seen.has(id))return;seen.add(id);track('tutorial_step',{guide,step,round_id:round?.id||''});}
function fishingStart(p){if(round)return;seen.clear();round={id:session+':rod-'+(++seq),sourceRound:p.round,at:clock(),depth:0,reason:'unknown',boosts:0};track('fishing_start',{round_id:round.id,rod_level:number(p.save?.player.rodLevel),hook_level:number(p.save?.player.hookLevel)});flush();}
 function fishingEnd(p){if(!round||p.round!==round.sourceRound)return;const count=Object.values(p.catches||{}).reduce((a,b)=>a+number(b),0);track('fishing_end',{round_id:round.id,duration_ms:number(clock()-round.at),max_depth_m:round.depth,fish_count:count,coins_earned:number(p.value),reel_reason:round.reason,boost_count:round.boosts});round=null;flush();}
 function depth(m){if(round)round.depth=Math.max(round.depth,number(m));}
 function boost(first,m){if(!round)return;round.boosts++;depth(m);if(first){track('boost_first_success',{round_id:round.id,depth_m:number(m)});tutorial('double_tap_boost','complete');}}
 function readyEvent(){if(ready)return;ready=true;track('game_ready',{load_ms:number(performance.now())});flush();}
function exportData(){flush();const body={schema_version:1,mode:'local_only',limit:LIMIT,storage_ok:storageOk,exported_at:new Date().toISOString(),events:rows};const text=JSON.stringify(body,null,2);const host=document.querySelector('.sheet-scroll');if(host){let box=host.querySelector('[data-analytics-json]');if(!box){box=document.createElement('textarea');box.setAttribute('data-analytics-json','');box.readOnly=true;box.style.cssText='width:100%;height:140px;box-sizing:border-box;font:12px monospace;margin:8px 0';host.appendChild(box);}box.setAttribute('aria-label',g.LocalizationSystem?.getLanguage()==='en'?'Test data — copy if download is blocked':'测试数据：下载受限时可全选复制');box.value=text;box.focus();box.select();}const url='data:application/json;charset=utf-8,'+encodeURIComponent(text);const a=document.createElement('a');a.href=url;a.download='cat-and-fish-analytics-'+version()+'-'+Date.now()+'.json';document.body.appendChild(a);a.click();a.remove();return true;}
 const events=g.GameEvents;
 events.on(events.EVENTS.FISHING_STARTED,safe(fishingStart));
 events.on(events.EVENTS.ROUND_SETTLED,safe(fishingEnd));
 events.on(events.EVENTS.UPGRADE_PURCHASED,safe(p=>{track('gear_upgrade',{item:p.facilityId||p.kind,from_level:number(p.previousLevel),to_level:number(p.level),coins_spent:number(p.cost)});flush();}));
 root.addEventListener('blur',safe(()=>hide('blur')));root.addEventListener('focus',safe(resume));
 root.addEventListener('pagehide',safe(()=>hide('pagehide')));root.addEventListener('pageshow',safe(resume));
 document.addEventListener('visibilitychange',safe(()=>document.hidden?hide('hidden'):resume()));
 setInterval(safe(flush),5000);
 g.AnalyticsSystem=Object.freeze({ready:safe(readyEvent),depth:safe(depth),reel:safe(reason=>{if(round&&round.reason==='unknown')round.reason=reason;}),tutorial:safe(tutorial),boost:safe(boost),exportData:safe(exportData),flush:safe(flush),snapshot:()=>JSON.parse(JSON.stringify(rows)),status:()=>({localOnly:true,count:rows.length,limit:LIMIT,storageOk})});
})(window);
