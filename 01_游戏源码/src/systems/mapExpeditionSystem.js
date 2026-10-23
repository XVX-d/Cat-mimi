"use strict";
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  const palettes={tide_dock:["#1b91bd","#216e9d","#174e7d"]};
  function theme(id){return palettes[id]||palettes.tide_dock;}
  function drawTiles(ctx,world){const id=(game.activeMapId||"tide_dock"),p=theme(id),start=Math.floor(world.y/96)*96,end=world.y+world.h+96;ctx.save();ctx.globalAlpha=.18;for(let y=start;y<end;y+=96){const band=Math.max(0,Math.min(2,Math.floor((y-205)/1200)));ctx.fillStyle=p[band];for(let x=((Math.floor(y/96)%2)*48)-48;x<900;x+=96){ctx.fillRect(x,y,44,5);ctx.fillRect(x+18,y+18,5,5);}}ctx.restore();}
  game.MapExpeditionSystem=Object.freeze({theme:theme,drawTiles:drawTiles});
})(window);
