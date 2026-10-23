"use strict";
(function () {
  const frame=document.getElementById("gamePreview"),wrap=document.getElementById("previewWrap"),selectionLayer=document.getElementById("selectionLayer");
  const canvasLayers=document.getElementById("canvasLayers"),domLayers=document.getElementById("domLayers"),statusText=document.getElementById("statusText"),configText=document.getElementById("configText");
  const form=document.getElementById("propertyForm"),empty=document.getElementById("emptyState"),zoomValue=document.getElementById("zoomValue");
  const inputs={x:document.getElementById("propX"),y:document.getElementById("propY"),w:document.getElementById("propW"),h:document.getElementById("propH"),zIndex:document.getElementById("propZ"),opacity:document.getElementById("propOpacity"),hidden:document.getElementById("propHidden")};
  const viewNames={yard:"首页",fishing:"钓鱼中",collection:"图鉴",map:"海域",bag:"背包",interior:"猫咪小屋"};
  let ready=false,state=null,view="yard",zoom=.75,selected=null,drag=null,history=[],future=[],propertySnapshot=false;
  const key=item=>item.kind+":"+item.id;
  const send=(command,payload)=>frame.contentWindow.postMessage({type:"CF_MAIN_EDITOR_CMD",command:command,payload:payload||{}},"*");
  function canvasDefs(){return state&&state.canvasDefinitions||[];}
  function uiDefs(){return state&&state.fishingDefinitions||[];}
  function domDefs(){return state&&state.domDefinitions||[];}
  function allItems(){
    return canvasDefs().map(x=>Object.assign({kind:"canvas"},x))
      .concat(uiDefs().map(x=>Object.assign({kind:"ui"},x)))
      .concat(domDefs().map(x=>Object.assign({kind:"dom"},x)));
  }
  function itemFromKey(value){
    if(!value)return null;
    const parts=value.split(":"),source=parts[0]==="canvas"?canvasDefs():parts[0]==="ui"?uiDefs():domDefs();
    const item=source.find(x=>x.id===parts[1]);
    return item&&Object.assign({kind:parts[0]},item);
  }
  function status(text){statusText.textContent=text;}
  function snapshot(){return JSON.parse(JSON.stringify({canvas:state.canvasConfig,dom:state.domConfig}));}
  function pushHistory(){if(!state)return;history.push(snapshot());if(history.length>80)history.shift();future=[];}
  function restore(value){send("replace",value);}
  function setZoom(value){zoom=Math.max(.3,Math.min(1.25,value));wrap.style.transform="scale("+zoom+")";zoomValue.textContent=Math.round(zoom*100)+"%";}
  function fit(){const area=document.querySelector(".stage-scroll");setZoom(Math.min(.95,(area.clientHeight-84)/960,(area.clientWidth-86)/540));}
  function rectFor(item){
    if(item.kind==="canvas")return state.canvasRects[item.id]||null;
    if(item.kind==="ui")return state.fishingRects[item.id]||null;
    return state.domRects[item.id]||null;
  }
  function domSaved(id){const source=state.domConfig&&state.domConfig[view]||{};return source[id]||{dx:0,dy:0,opacity:1,hidden:false};}
  function valueFor(item){
    if(item.kind==="canvas")return state.canvasConfig.components[item.id];
    if(item.kind==="ui")return state.canvasConfig.ui[item.id];
    const saved=domSaved(item.id),rect=rectFor(item)||{w:1,h:1};
    return{x:saved.dx||0,y:saved.dy||0,w:saved.width||Math.round(rect.w),h:saved.height||Math.round(rect.h),zIndex:Number.isFinite(saved.zIndex)?saved.zIndex:1,opacity:saved.opacity==null?1:saved.opacity,hidden:!!saved.hidden};
  }
  function refreshLayers(){
    const button=item=>'<button data-item="'+key(item)+'" class="'+(selected===key(item)?"active":"")+'">'+item.label+'</button>';
    canvasLayers.innerHTML=canvasDefs().map(x=>button(Object.assign({kind:"canvas"},x))).join("");
    domLayers.innerHTML=uiDefs().map(x=>button(Object.assign({kind:"ui"},x))).concat(domDefs().map(x=>button(Object.assign({kind:"dom"},x)))).join("");
    document.getElementById("canvasSection").classList.toggle("hidden",!canvasDefs().length);
    document.getElementById("uiHeading").textContent=view==="fishing"?"钓鱼 HUD":"界面部件";
  }
  function refreshBoxes(){
    if(!ready)return;
    selectionLayer.innerHTML=allItems().map(function(item){
      const r=rectFor(item);if(!r)return"";
      return '<div class="selection-box '+(selected===key(item)?"selected ":"")+(r.hidden?"hidden-part":"")+'" data-box="'+key(item)+'" style="left:'+r.x+'px;top:'+r.y+'px;width:'+Math.max(8,r.w)+'px;height:'+Math.max(8,r.h)+'px"><span>'+item.label+'</span><i class="resize-handle" data-resize="1"></i></div>';
    }).join("");
  }
  function refreshConfig(){if(state)configText.value=JSON.stringify(snapshot(),null,2);}
  function select(value){
    selected=value;refreshLayers();refreshBoxes();const item=itemFromKey(value);
    if(!item){form.classList.add("hidden");empty.classList.remove("hidden");return;}
    const v=valueFor(item),isDom=item.kind==="dom";
    empty.classList.add("hidden");form.classList.remove("hidden");document.getElementById("propName").value=item.label;
    inputs.x.value=Math.round(v.x);inputs.y.value=Math.round(v.y);inputs.w.value=Math.round(v.w);inputs.h.value=Math.round(v.h);
    inputs.zIndex.value=isDom?Math.round(v.zIndex||1):"";inputs.opacity.value=isDom?(v.opacity==null?1:v.opacity):"";inputs.hidden.checked=isDom?!!v.hidden:false;
    inputs.zIndex.disabled=inputs.opacity.disabled=inputs.hidden.disabled=!isDom;
    status("已选择："+item.label);
  }
  function setLocal(item,patch){
    if(item.kind==="canvas")Object.assign(state.canvasConfig.components[item.id],patch);
    else if(item.kind==="ui")Object.assign(state.canvasConfig.ui[item.id],patch);
    else{
      const saved=state.domConfig[view][item.id]||(state.domConfig[view][item.id]={});
      if("x"in patch)saved.dx=patch.x;if("y"in patch)saved.dy=patch.y;if("w"in patch)saved.width=patch.w;if("h"in patch)saved.height=patch.h;
      if("zIndex"in patch)saved.zIndex=patch.zIndex;if("opacity"in patch)saved.opacity=patch.opacity;if("hidden"in patch)saved.hidden=patch.hidden;
    }
  }
  function setItem(item,patch){
    setLocal(item,patch);
    if(item.kind==="canvas")send("set-canvas",{id:item.id,patch:patch});
    else if(item.kind==="ui")send("set-ui",{id:item.id,patch:patch});
    else{
      const out={};if("x"in patch)out.dx=patch.x;if("y"in patch)out.dy=patch.y;if("w"in patch)out.width=patch.w;if("h"in patch)out.height=patch.h;
      if("zIndex"in patch)out.zIndex=patch.zIndex;if("opacity"in patch)out.opacity=patch.opacity;if("hidden"in patch)out.hidden=patch.hidden;
      send("set-dom",{id:item.id,patch:out});
    }
    refreshConfig();
  }
  function refresh(){refreshLayers();refreshBoxes();refreshConfig();if(selected)select(selected);}
  function showView(next){
    if(next===view&&ready)return;
    view=next;selected=null;drag=null;
    form.classList.add("hidden");empty.classList.remove("hidden");
    document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    status("正在载入："+viewNames[view]);send("set-view",{view:view});
  }
  function command(name){
    if(!ready&&name!=="open")return;
    if(name==="zoom-in")setZoom(zoom*1.12);if(name==="zoom-out")setZoom(zoom/1.12);if(name==="fit")fit();
    if(name==="undo"&&history.length){future.push(snapshot());restore(history.pop());}if(name==="redo"&&future.length){history.push(snapshot());restore(future.pop());}
    if(name==="open")window.open("./index.html?nodebug","_blank");
    if(name==="copy")navigator.clipboard.writeText(configText.value).then(()=>status("配置已复制"));
    if(name==="export"){const blob=new Blob([configText.value],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cat_and_fish_global_ui_layout.json";a.click();URL.revokeObjectURL(a.href);status("配置已导出");}
    if(name==="reset-one"&&selected){pushHistory();const item=itemFromKey(selected);send(item.kind==="canvas"?"reset-canvas":item.kind==="ui"?"reset-ui":"reset-dom",{id:item.id});}
    if(name==="reset-all"){pushHistory();send("reset-view");selected=null;}
  }
  window.addEventListener("message",function(event){
    const message=event.data;if(!message||message.type!=="CF_MAIN_EDITOR_STATE"||event.source!==frame.contentWindow)return;
    state=message.state;view=state.activeView||view;const first=!ready;ready=true;refresh();
    if(first){fit();status("编辑器已载入：请选择板块和部件");}
  });
  document.addEventListener("click",function(event){
    const layer=event.target.closest("[data-item]"),cmd=event.target.closest("[data-command]"),viewButton=event.target.closest("[data-view]");
    if(layer)select(layer.dataset.item);if(cmd)command(cmd.dataset.command);if(viewButton)showView(viewButton.dataset.view);
  });
  selectionLayer.addEventListener("pointerdown",function(event){
    const box=event.target.closest("[data-box]");if(!box)return;event.preventDefault();select(box.dataset.box);pushHistory();
    const item=itemFromKey(selected),value=valueFor(item);
    drag={item:item,mode:event.target.dataset.resize?"resize":"move",sx:event.clientX,sy:event.clientY,start:value,worldScale:item.kind==="canvas"?(state.zoom||1):1};
    selectionLayer.setPointerCapture(event.pointerId);
  });
  selectionLayer.addEventListener("pointermove",function(event){
    if(!drag)return;const dx=(event.clientX-drag.sx)/zoom/drag.worldScale,dy=(event.clientY-drag.sy)/zoom/drag.worldScale,patch={};
    if(drag.mode==="move"){patch.x=Math.round(drag.start.x+dx);patch.y=Math.round(drag.start.y+dy);}
    else{patch.w=Math.max(8,Math.round(drag.start.w+dx));patch.h=Math.max(8,Math.round(drag.start.h+dy));if(document.getElementById("lockRatio").checked)patch.h=Math.round(patch.w*drag.start.h/drag.start.w);}
    setItem(drag.item,patch);const value=valueFor(drag.item);inputs.x.value=Math.round(value.x);inputs.y.value=Math.round(value.y);inputs.w.value=Math.round(value.w);inputs.h.value=Math.round(value.h);
  });
  selectionLayer.addEventListener("pointerup",function(){if(drag){drag=null;status("已自动保存");}});
  Object.keys(inputs).forEach(function(name){
    const input=inputs[name];input.addEventListener("focus",()=>{if(!propertySnapshot){pushHistory();propertySnapshot=true;}});input.addEventListener("blur",()=>propertySnapshot=false);
    input.addEventListener("input",function(){const item=itemFromKey(selected);if(!item||input.disabled)return;setItem(item,{[name]:name==="hidden"?input.checked:Number(input.value)});status("已自动保存");});
  });
  document.getElementById("gridToggle").onchange=e=>wrap.classList.toggle("grid",e.target.checked);
  document.getElementById("guideToggle").onchange=e=>wrap.classList.toggle("guides",e.target.checked);
  document.getElementById("importFile").onchange=function(event){const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=function(){try{pushHistory();restore(JSON.parse(reader.result));status("配置已导入并自动保存");}catch(error){status("导入失败：JSON 格式不正确");}};reader.readAsText(file);};
  document.querySelector(".stage-scroll").addEventListener("wheel",e=>{if(!e.ctrlKey)return;e.preventDefault();setZoom(zoom*(e.deltaY<0?1.08:.92));},{passive:false});
  document.addEventListener("keydown",function(event){
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){event.preventDefault();command(event.shiftKey?"redo":"undo");return;}
    if(!selected||!/Arrow/.test(event.key)||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
    const item=itemFromKey(selected),value=valueFor(item),amount=event.shiftKey?10:1,patch={};
    if(event.key==="ArrowLeft")patch.x=value.x-amount;if(event.key==="ArrowRight")patch.x=value.x+amount;if(event.key==="ArrowUp")patch.y=value.y-amount;if(event.key==="ArrowDown")patch.y=value.y+amount;
    if(Object.keys(patch).length){event.preventDefault();pushHistory();setItem(item,patch);select(selected);}
  });
  frame.addEventListener("load",function(){status("游戏已载入，正在连接布局数据……");send("hello");});
  setInterval(function(){if(!ready)send("hello");},500);
})();
