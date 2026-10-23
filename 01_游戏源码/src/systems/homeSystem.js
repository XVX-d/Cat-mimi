"use strict";
/* 局外生活场景：场景负责导航，浮层负责操作；不持有钓鱼核心状态。 */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={});
 const saveApi=game.SaveSystem;
 const facilities=game.FacilitySystem,catMood=game.CatHomeSystem,state=game.HomeStateSystem;
 const router=game.SceneRouterSystem,overlays=game.OverlayManagerSystem,feedback=game.UIFeedbackSystem;
 const interaction=game.InteractionFeelConfig,swipeFeel=interaction.swipe,safety=game.SessionSafetySystem;
 let screen,harvestResult=null;
 const esc=s=>String(s||"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 const session=()=>game.GameSession,save=()=>session()&&session().getSave?session().getSave():saveApi.load();
 function resultPulse(ok){if(feedback&&feedback.pulse)feedback.pulse(ok?"success":"error");}
 function scale(){if(screen)screen.style.transform="translate(-50%,-50%) scale("+Math.min(innerWidth/540,innerHeight/960)+")";}
 function sceneTitle(scene){return ({yard:"潮汐码头",interior:"小屋内部",collection:"收藏图鉴"}[scene]||"海边小屋");}
 function header(s,route){return '<header class="life-header">'+(route.canBack?'<button class="life-back" data-action="back" aria-label="返回">←</button>':'<span class="life-brand">CAT &amp; FISH</span>')+'<strong>'+sceneTitle(route.scene)+'</strong><div class="life-actions"><span class="life-coins">◉ <b>'+s.player.coins+'</b></span><button data-action="open-settings" aria-label="设置">⚙</button></div></header>';}
 function catNode(s){const mood=catMood.getMood(),show=game.CatShowcaseSystem.render(s);return '<div class="home-cat-wrap cat-'+mood+'">'+show+'<small class="cat-mood">'+({idle:"悠闲陪伴中",happy:"今天很开心！",sleepy:"想打个盹",alert:"准备出海"}[mood]||"陪伴中")+'</small></div>';}
 function guideNode(s){const guide=game.ProgressGuideSystem.get(s);return '<button class="progress-guide" data-guide-kind="'+guide.kind+'" data-guide-target="'+guide.target+'"><i>'+guide.icon+'</i><span><small>接下来可以</small><b>'+esc(guide.title)+'</b><em>'+esc(guide.detail)+'</em></span><strong>›</strong>'+(guide.badge?'<mark>'+guide.badge+'</mark>':"")+'</button>';}
 function yard(s,st,route){return game.CoastSystem.yard(s,st);}
 function interior(s,st,route){return game.CatCareSystem.html(s);}
 function collectionScene(s,st,route){if(st.collectionTab==="furniture"){state.set({collectionTab:"fish"});st=state.get();}const tabs=[["fish","鱼图鉴"],["king","鱼王"],["cat","猫咪"]],entries=game.FishBookSystem.getSummary(s),found=entries.filter(x=>x.entry.discovered).length;return '<div class="life-shell scene-collection">'+header(s,route)+'<section class="life-world collection-world"><div class="collection-heading"><div><small>每一次发现都有记录</small><h2>收藏图鉴</h2></div><span>已发现 '+found+'/'+entries.length+'</span></div><div class="collection-stage"><div class="catalog-content">'+game.CollectionViewSystem.render(st.collectionTab,s)+'</div><aside class="catalog-tabs">'+tabs.map(x=>'<button data-collection-tab="'+x[0]+'" class="'+(st.collectionTab===x[0]?"active":"")+'">'+x[1]+'</button>').join("")+'</aside></div></section>'+'</div>';}
 function scene(s,st,route){return ({yard:yard,interior:interior,collection:collectionScene}[route.scene]||yard)(s,st,route);}
 function toggle(name,on,label){return '<button class="setting-row" data-setting="'+name+'" aria-pressed="'+on+'"><span>'+label+'</span><i class="'+(on?"on":"")+'"></i></button>';}
 function settingsOverlay(){const opt=game.SettingsSystem.load(),platform=game.PlatformSystem.getState(),saveStatus=saveApi.getStatus(),platformName=({web:"网页测试环境",crazygames:"CrazyGames",douyin:"抖音小游戏"}[platform.name]||platform.name),saveLabel=saveStatus.recovered?(saveStatus.recoverySource==="backup"?"已从安全备份恢复":"已重建安全存档"):saveStatus.ok?"正常":"暂时无法写入";return '<div class="life-overlay" data-action="close-overlay"><section class="bottom-sheet" data-sheet><header><div><small>游戏偏好</small><h2>设置</h2></div><button data-action="close-overlay">×</button></header><div class="sheet-scroll">'+toggle("sound",opt.sound,"音效")+toggle("vibration",opt.vibration,"震动反馈")+toggle("reducedMotion",opt.reducedMotion,"减少动态效果")+'<div class="setting-caption">竖屏 540 × 960<br>运行平台：'+esc(platformName)+'<br>存档方式：'+esc(platform.capabilities.storage||"本地")+'<br>存档状态：'+esc(saveLabel)+'</div><button class="setting-link" data-action="editor">开发者：打开地图工作室</button></div></section></div>';}
 function tackleOverlay(s){return game.CoastSystem.tackle(s);}
 function catOverlay(s){return game.CoastSystem.wardrobe(s);}
 function harvestOverlay(s){return game.CoastSystem.harvest(s,harvestResult);}
 function overlay(s){const current=overlays.get().active;return current==="settings"?settingsOverlay():current==="tackle"?tackleOverlay(s):current==="cat"?catOverlay(s):current==="harvest"?harvestOverlay(s):"";}
function render(){if(!screen)return;const s=save(),st=state.get(),route=router.get();game.CatCollectionSystem.ensure(s);screen.classList.toggle("reduced-motion",game.SettingsSystem.load().reducedMotion);screen.innerHTML=scene(s,st,route)+overlay(s);if(overlays.get().active==="settings"){const content=screen.querySelector(".sheet-scroll");if(content)content.insertAdjacentHTML("afterbegin",game.LocalizationSystem.controls()+'<p class="setting-caption">基础埋点仅保存在本机，最多500条，不上传服务器。</p><button class="setting-link" data-action="analytics-export">导出测试数据</button>');}if(game.HomeLayoutSystem)game.HomeLayoutSystem.apply(screen,route.scene);game.CoastSystem.afterRender(screen,s,route);game.CatCareSystem.afterRender(screen);game.LocalizationSystem.apply();}
 function goScene(name){overlays.close();router.home();if(name!=="yard")router.go(name);catMood.interact(name==="map"?"alert":"idle");render();}
 function startFishing(st){if(!safety.claim("start_fishing")){feedback.toast("正在准备出海");return false;}overlays.close();router.home();render();const bridge=game.HomeFishingBridgeSystem,ok=bridge&&bridge.start(st.selectedMap);if(!ok){safety.release("start_fishing");feedback.toast("当前海域暂时无法进入");}return ok;}
 function click(e){
   const t=e.target.closest("button");if(!t||t.disabled)return;feedback.tap();if(t.dataset.action==="harvest-skip"){game.CoastSystem.skipHarvest(screen);return;}
   if(t.dataset.action==="harvest-double"){game.HarvestPresentationSystem.double(screen,harvestResult);return;}
   const s=save(),st=state.get(),sceneName=t.dataset.scene,upgrade=t.dataset.upgrade,tab=t.dataset.collectionTab,setting=t.dataset.setting,item=t.dataset.collectionItem,action=t.dataset.action,facilityDestination=t.dataset.facilityDestination,tackleUpgrade=t.dataset.tackleUpgrade,catAppearance=t.dataset.catAppearance,guideKind=t.dataset.guideKind,guideTarget=t.dataset.guideTarget;
   if(!safety.canInteract())return;
   if(action==="analytics-export"){game.AnalyticsSystem.exportData();return;}
   if(action==="care-pet"||action==="care-feed"){
     const result=session().careCat(action==="care-pet"?"pet":"feed");
     if(result.ok){game.CatCareSystem.present(screen,result);resultPulse(true);}
     else if(result.reason!=="busy")feedback.toast(result.reason==="insufficient_coins"?"金币不足":result.reason==="save_failed"?"存档暂时无法保存，本次未扣金币":"请稍后重试");
     return;
   }
   if(action==="care-book"){state.set({collectionTab:"fish"});goScene("collection");return;}
   if((upgrade||tackleUpgrade)&&!safety.claim("home_transaction")){feedback.toast("操作处理中");return;}
   if(guideKind==="scene"){goScene(guideTarget);return;}
   if(guideKind==="overlay"){overlays.close();router.home();if(guideTarget!=="tackle")router.go("interior");overlays.open(guideTarget);catMood.interact("alert");render();return;}
   if(guideKind==="action"&&guideTarget==="start-fishing"){startFishing(st);return;}
   if(sceneName){goScene(sceneName);return;}
   if(tab){state.set({collectionTab:tab});render();return;}
   if(setting){const value=!game.SettingsSystem.load()[setting];game.SettingsSystem.set(setting,value);feedback.toast(value?"已开启":"已关闭");render();return;}
   if(upgrade){const before=session().getProgress().coins;session().upgrade(upgrade);const after=session().getProgress().coins,ok=after!==before;catMood.interact(ok?"happy":"alert");resultPulse(ok);feedback.toast(ok?"升级完成！":"金币不足",ok?"success":"");render();return;}
   if(tackleUpgrade){const result=session().upgradeFacility(tackleUpgrade),stepAfter=result.ok&&game.OnboardingSystem?game.OnboardingSystem.getStep(save()):null;catMood.interact(result.ok?"happy":"alert");resultPulse(result.ok);feedback.toast(result.ok?(stepAfter&&stepAfter.id==="second_voyage"?"升级完成！下一步再次出海":"渔具升级完成 · "+result.facility.currentBenefit):result.reason==="max_level"?"已经满级":"金币不足",result.ok?"success":"");render();return;}
   if(catAppearance){const ok=game.CatShowcaseSystem.select(s,catAppearance);catMood.interact(ok?"happy":"alert");feedback.toast(ok?"猫咪外观已更换":"该外观尚未解锁",ok?"success":"");render();return;}
   if(facilityDestination){overlays.close();goScene(facilityDestination);return;}
   if(item){const parts=item.split(":");if(parts[0]==="cat"&&game.CatShowcaseSystem.select(s,parts[1])){feedback.toast("已换上新外观");render();}else if(parts[0]==="cat")feedback.toast("尚未解锁该猫咪外观");return;}
   if(action==="back"){overlays.close();if(router.get().scene==="interior")transitionHomeScene("yard",-1);else{router.back();render();}return;}
   if(action==="enter-interior"){transitionHomeScene("interior",1);return;}
   if(action==="open-settings"){overlays.open("settings");render();return;}
   if(action==="open-tackle"){overlays.open("tackle");catMood.interact("alert");render();return;}
   if(action==="open-cat"){overlays.open("cat");catMood.interact("happy");render();return;}
   if(action==="close-overlay"){if(t.hasAttribute("data-sheet"))return;overlays.close();render();return;}
   if(action==="harvest-upgrade"){harvestResult=null;overlays.close();router.home();router.go("interior");overlays.open("tackle");catMood.interact("alert");render();return;}
   if(action==="harvest-continue"){harvestResult=null;startFishing(st);return;}
   if(action==="harvest-home"){harvestResult=null;overlays.close();router.home();render();return;}
   if(action==="editor"){if(game.MapEditorSystem)game.MapEditorSystem.open();return;}
   if(action==="start"||action==="start-fishing"){startFishing(st);}
 }
 let houseSwipe=null,sceneTransitioning=false;
 const sceneScale=()=>Math.min(innerWidth/540,innerHeight/960)||1;
 function removeSwipePreview(){
   if(!screen)return;
   screen.classList.remove("scene-swiping");
   const preview=screen.querySelector(".scene-swipe-preview");if(preview)preview.remove();
   const current=screen.querySelector(".scene-swipe-current");
   if(current){current.classList.remove("scene-swipe-current");current.style.transition="";current.style.transform="";current.style.opacity="";}
 }
 function setRouteForSwipe(target){if(target==="yard")router.home();else router.go(target);}
 function transitionHomeScene(target,direction,fromDrag){
   if(sceneTransitioning||!screen)return;
   const current=screen.querySelector(".life-shell:not(.scene-swipe-preview)");
   if(!current){setRouteForSwipe(target);render();return;}
   sceneTransitioning=true;
   const reduced=game.SettingsSystem.load().reducedMotion;
   if(reduced){removeSwipePreview();setRouteForSwipe(target);if(target==="interior")catMood.interact("happy");render();sceneTransitioning=false;return;}
   let preview=screen.querySelector(".scene-swipe-preview");
   if(!preview){
     const holder=document.createElement("div");
     holder.innerHTML=scene(save(),state.get(),{scene:target,canBack:target!=="yard",stack:target==="yard"?["yard"]:["yard",target]});
     preview=holder.firstElementChild;preview.classList.add("scene-swipe-preview");preview.setAttribute("aria-hidden","true");
     preview.style.transform="translate3d("+(-direction*540)+"px,0,0)";screen.insertBefore(preview,current);
   }
   current.classList.add("scene-swipe-current");
   current.style.transition="transform "+swipeFeel.transitionMs+"ms cubic-bezier(.22,.82,.26,1),opacity "+swipeFeel.transitionMs+"ms ease";
   preview.style.transition="transform "+swipeFeel.transitionMs+"ms cubic-bezier(.22,.82,.26,1),opacity "+swipeFeel.transitionMs+"ms ease";
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
     current.style.transform="translate3d("+(direction*540)+"px,0,0)";current.style.opacity=".86";
     preview.style.transform="translate3d(0,0,0)";preview.style.opacity="1";
   }));
   root.setTimeout(()=>{
     setRouteForSwipe(target);if(target==="interior")catMood.interact("happy");
     screen.classList.remove("scene-swiping");render();sceneTransitioning=false;houseSwipe=null;
   },swipeFeel.transitionMs+20);
 }
 function swipeStart(e){
   if(sceneTransitioning||!screen||screen.classList.contains("hidden")||screen.classList.contains("fishing-live")||overlays.get().active)return;
   const currentScene=router.get().scene;if(currentScene!=="yard"&&currentScene!=="interior")return;
   const control=e.target&&e.target.closest&&e.target.closest("button,input,textarea");
   if(control)return;
   const direction=currentScene==="yard"?1:-1,target=currentScene==="yard"?"interior":"yard";
   const current=screen.querySelector(".life-shell");if(!current)return;
   // 这里只记录候选手势；确认横向滑动后再创建完整预览，避免普通点按触发无意义 DOM 构建。
   houseSwipe={x:e.clientX,y:e.clientY,time:performance.now(),id:e.pointerId,direction:direction,target:target,current:current,preview:null,dragging:false,logicalDx:0};
 }
 function swipeMove(e){
   const swipe=houseSwipe;if(!swipe||swipe.id!==e.pointerId||sceneTransitioning)return;
   const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;
   if(!swipe.dragging){
     if(Math.hypot(dx,dy)<swipeFeel.startDistance)return;
     if(Math.abs(dx)<=Math.abs(dy)*swipeFeel.directionRatio||dx*swipe.direction<=0){removeSwipePreview();houseSwipe=null;return;}
     const holder=document.createElement("div");
     holder.innerHTML=scene(save(),state.get(),{scene:swipe.target,canBack:swipe.target!=="yard",stack:swipe.target==="yard"?["yard"]:["yard",swipe.target]});
     swipe.preview=holder.firstElementChild;swipe.preview.classList.add("scene-swipe-preview");swipe.preview.setAttribute("aria-hidden","true");
     swipe.preview.style.transform="translate3d("+(-swipe.direction*540)+"px,0,0)";screen.insertBefore(swipe.preview,swipe.current);
     swipe.current.classList.add("scene-swipe-current");swipe.dragging=true;screen.classList.add("scene-swiping");
   }
   e.preventDefault();
   const logical=Math.max(0,Math.min(540,dx*swipe.direction/sceneScale()))*swipe.direction;
   swipe.logicalDx=logical;
   swipe.current.style.transition="none";swipe.preview.style.transition="none";
   swipe.current.style.transform="translate3d("+logical+"px,0,0)";
   swipe.current.style.opacity=String(1-Math.abs(logical)/540*.14);
   swipe.preview.style.transform="translate3d("+(logical-swipe.direction*540)+"px,0,0)";
 }
 function swipeEnd(e){
   if(!houseSwipe||houseSwipe.id!==e.pointerId)return;
   const swipe=houseSwipe,elapsed=Math.max(1,performance.now()-swipe.time),distance=Math.abs(swipe.logicalDx),velocity=distance/elapsed;
   if(swipe.dragging&&(distance>=swipeFeel.commitDistance||(distance>=swipeFeel.flickDistance&&velocity>=swipeFeel.flickVelocity))){transitionHomeScene(swipe.target,swipe.direction,true);return;}
   if(swipe.dragging){
     swipe.current.style.transition="transform "+swipeFeel.reboundMs+"ms cubic-bezier(.2,.8,.25,1),opacity "+swipeFeel.reboundMs+"ms ease";
     swipe.preview.style.transition="transform "+swipeFeel.reboundMs+"ms cubic-bezier(.2,.8,.25,1)";
     swipe.current.style.transform="translate3d(0,0,0)";swipe.current.style.opacity="1";
     swipe.preview.style.transform="translate3d("+(-swipe.direction*540)+"px,0,0)";
     root.setTimeout(()=>{removeSwipePreview();houseSwipe=null;},swipeFeel.reboundMs+10);
   }else{removeSwipePreview();houseSwipe=null;}
 }
 function cancelSwipe(){if(!houseSwipe)return;removeSwipePreview();houseSwipe=null;sceneTransitioning=false;}
 function mount(){if(screen)return;screen=document.createElement("section");screen.id="homeScreen";screen.className="home-screen life-screen canvas-home";screen.style.setProperty("--mobile-tap-target",interaction.mobile.minTapTarget+"px");screen.style.setProperty("--mobile-caption-size",interaction.mobile.minCaptionSize+"px");const inline=root.ASSET_INLINE||{},asset=(name,path)=>inline[name]||path;screen.style.setProperty("--home-main-background",'url("'+asset("home_main_background.jpg","../assets/home_main_background.jpg")+'")');screen.style.setProperty("--home-upper-background",'url("'+asset("home_upper_background.jpg","../assets/home_upper_background.jpg")+'")');screen.style.setProperty("--home-sea-background",'url("'+asset("bg_surface.jpg","../assets/bg_surface.jpg")+'")');screen.style.setProperty("--home-hut-sprite",'url("'+asset("home_hut_sprite.webp","../assets/home_hut_sprite.webp")+'")');screen.style.setProperty("--home-interior-background",'url("'+asset("home_interior_pixel.jpg","../assets/home_interior_pixel.jpg")+'")');screen.style.setProperty("--cat-sheet",'url("'+asset("cat_companion_sheet_small.png","../assets/cat_companion_sheet_small.png")+'")');[["nav","ui_life_nav.webp"],["panel","ui_life_panel.webp"],["coin","ui_life_coin.webp"],["primary","ui_life_primary.webp"],["plaque","ui_life_plaque.webp"],["card","ui_life_card.webp"],["card-selected","ui_life_card_selected.webp"],["round","ui_life_round.webp"]].forEach(x=>screen.style.setProperty("--ui-life-"+x[0],'url("'+asset(x[1],"../assets/"+x[1])+'")'));document.body.appendChild(screen);screen.addEventListener("click",click);root.addEventListener("pointerdown",swipeStart,true);root.addEventListener("pointermove",swipeMove,{capture:true,passive:false});root.addEventListener("pointerup",swipeEnd,true);root.addEventListener("pointercancel",cancelSwipe,true);scale();render();}
 function revealAfterLoading(){
   const progress=root.__loadProg&&root.__loadProg.v||0;
   if(root._loadingFinalized&&progress>=.999){screen.classList.remove("hidden");render();return;}
   root.requestAnimationFrame(revealAfterLoading);
 }
 root.addEventListener("resize",scale);
 root.addEventListener("DOMContentLoaded",()=>{mount();screen.classList.add("hidden");revealAfterLoading();});
 game.HomeSystem=Object.freeze({mount:mount,show:()=>{mount();harvestResult=null;overlays.close();if(game.HomeFishingBridgeSystem)game.HomeFishingBridgeSystem.returnHome();screen.inert=false;screen.removeAttribute("aria-hidden");screen.classList.remove("hidden","fishing-live");render();},showHarvest:result=>{mount();harvestResult=result||null;router.home();overlays.open("harvest");if(game.HomeFishingBridgeSystem)game.HomeFishingBridgeSystem.returnHome();screen.inert=false;screen.removeAttribute("aria-hidden");screen.classList.remove("hidden","fishing-live");render();},beginFishing:()=>{mount();screen.inert=true;screen.setAttribute("aria-hidden","true");screen.classList.add("fishing-live");},hide:()=>screen&&screen.classList.add("hidden"),render:render});
})(window);
