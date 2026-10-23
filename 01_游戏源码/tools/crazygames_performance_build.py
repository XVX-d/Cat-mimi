"""v0.48 draw-only optimization: preserve fish populations, collisions and economy."""
def once(s, old, new):
    if s.count(old)!=1:raise ValueError("Performance anchor mismatch: "+old[:70])
    return s.replace(old,new,1)

def performance_transform(name,s):
    if not name.endswith("game.js"):return s
    s=once(s,'Math.min(window.devicePixelRatio||1,1.25,720/(VW*s))',
             'Math.min(window.devicePixelRatio||1,1,540/(VW*s))')
    s=once(s,'function drawFish(f,asHooked){',
        '''function drawFish(f,asHooked){
  // Conservative bounds include tail, rotation, glow and damage labels.
  // Rendering only: all offscreen fish keep their simulation/collision state.
  const margin=f.r*4+80;
  if(f.x+margin<camX||f.x-margin>camX+VW/curZoom||
     f.y+margin<camY||f.y-margin>camY+VH/curZoom)return;''')
    s=once(s,'const SLICES=10;','const SLICES=4;')
    s=once(s,'paint=paint||drawFull;',
             'paint=paint||drawFull;\n    if(Math.abs(wagAngle)<.0001){paint();return;}')
    s=once(s,'let nativeHarvestScene=null;',
        '''let nativeHarvestScene=null;
// 30 FPS render budget. Skips never update `last`, so simulation receives the
// full elapsed time at the next rendered frame (no half-speed fishing).
let cgNextRender=0;
const cgFrameSamples=[];
window.CGPerformance={targetFps:30,frames:0,lastFrame:0,report:function(){
 const rows=cgFrameSamples.slice(),sorted=rows.map(x=>x.interval).sort((a,b)=>a-b);
 return {targetFps:30,frames:this.frames,samples:rows.length,
  fps:rows.length?1000/(rows.reduce((n,x)=>n+x.interval,0)/rows.length):0,
  p95Ms:sorted[Math.floor(sorted.length*.95)]||0,canvas:[cvs.width,cvs.height]};
}};''')
    s=once(s,'const idleGame=window.CatFishGame;',
        '''if(!isMainHomeIdle()){
    if(now<cgNextRender-.5){requestAnimationFrame(loop);return;}
    cgNextRender+=1000/30;
    if(cgNextRender<=now)cgNextRender=now+1000/30;
  }else cgNextRender=0;
  const idleGame=window.CatFishGame;''')
    s=once(s,'const t2=performance.now();',
        '''const t2=performance.now();
  const cgStats=window.CGPerformance;
  if(!homeIdle&&!paused&&!document.hidden){
    if(cgStats.lastFrame)cgFrameSamples.push({interval:now-cgStats.lastFrame,cost:t2-t0});
    if(cgFrameSamples.length>120)cgFrameSamples.shift();
    cgStats.frames++;cgStats.lastFrame=now;
  }else cgStats.lastFrame=0;''')
    return s
