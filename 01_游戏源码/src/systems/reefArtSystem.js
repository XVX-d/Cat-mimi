"use strict";
/* v0.11 选定方案 B：运行时图集切片、轮廓碰撞与纯展示装饰。 */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={});
 const sprites={},masks={};
 let backdrop=null;
 const rects={reef_small:[45,190,330,210],reef_pillar:[500,0,235,405],reef_ledge:[827,185,420,210],reef_cliff:[20,426,384,402],reef_boulder:[427,477,418,355],reef_kelp:[936,420,265,425],reef_barrel:[15,913,360,280],reef_broken:[410,927,385,279],reef_wreck:[798,868,450,346]};
 const aliases={rock:'reef_boulder',rock_b:'reef_pillar',rock_c:'reef_small',rock_d:'reef_cliff',rock_e:'reef_ledge',rock_f:'reef_pillar',wreck:'reef_wreck'};
 function prepare(images){
  const atlas=images.reef_atlas;if(!atlas||!atlas.width)return false;
  // Generated magenta is a deliberate chroma key, never part of the underwater palette.
  for(const [key,r] of Object.entries(rects)){
   const c=document.createElement('canvas');c.width=r[2];c.height=r[3];
   const ctx=c.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(atlas,r[0]*atlas.width/1254,r[1]*atlas.height/1254,r[2]*atlas.width/1254,r[3]*atlas.height/1254,0,0,c.width,c.height);
   const px=ctx.getImageData(0,0,c.width,c.height),d=px.data;
   let left=c.width,right=0,top=c.height,bottom=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4;
    if(d[i]>d[i+1]+32&&d[i+2]>d[i+1]+32){d[i+3]=0;continue;}
    if(d[i+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   }
   if(right<=left||bottom<=top)continue;
   ctx.putImageData(px,0,0);
   const out=document.createElement('canvas');out.width=right-left+1;out.height=bottom-top+1;
   out.getContext('2d').drawImage(c,left,top,out.width,out.height,0,0,out.width,out.height);
   sprites[key]=images[key]=out;
   const data=out.getContext('2d').getImageData(0,0,out.width,out.height).data;
   masks[key]={width:out.width,height:out.height,data};
  }
  for(const [key,value] of Object.entries(aliases))if(sprites[value]){images[key]=sprites[value];masks[key]=masks[value];}
  if(images.reef_scene){
   const im=images.reef_scene;backdrop=document.createElement('canvas');backdrop.width=556;backdrop.height=1024;
   const ctx=backdrop.getContext('2d');ctx.drawImage(im,0,0,im.width*556/1536,im.height,0,0,556,1024);
   const fade=ctx.createLinearGradient(0,0,0,86);fade.addColorStop(0,'transparent');fade.addColorStop(1,'white');
   ctx.globalCompositeOperation='destination-in';ctx.fillStyle=fade;ctx.fillRect(0,0,556,1024);ctx.globalCompositeOperation='source-over';
  }
  return true;
 }
 function hit(item,x,y){
  const m=masks[item.key];if(!m)return null;
  const h=item.w*m.height/m.width,u=(x-item.x)/item.w,v=(y-item.y+h)/h;
  if(u<0||u>=1||v<0||v>=1)return false;
  const ix=Math.min(m.width-1,Math.floor((item.flip<0?1-u:u)*m.width)),iy=Math.floor(v*m.height);
  return m.data[(iy*m.width+ix)*4+3]>110;
 }
 function placed(ctx,img,x,y,w,alpha,flip){
  if(!img)return;const h=w*img.height/img.width;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+(flip?w:0),y-h);if(flip)ctx.scale(-1,1);ctx.drawImage(img,0,0,w,h);ctx.restore();
 }
 function background(ctx,images,camX,camY,width,height,waterY,worldH){
  const im=backdrop;if(!im)return;
  ctx.save();
  // Fixed world coordinates; subdued backdrop is distinct from solid foreground reefs.
  const tile=1080,start=waterY+240,dh=worldH-start;
  // Alpha feather prepared once: a single draw avoids translucent band seams.
  ctx.globalAlpha=.48;
  for(let col=Math.floor(camX/tile);col<=Math.floor((camX+width)/tile);col++){
   ctx.save();ctx.translate(col*tile+(col%2?tile:0),start);if(col%2)ctx.scale(-1,1);ctx.drawImage(im,0,0,tile,dh);ctx.restore();
  }
  ctx.restore();
 }
 function decorations(ctx,images,camX,camY,width,height){
  const cfg=game.PixelWorldConfig;
  // Roots/resting barrels sit on actual rock contours, not floating in open water.
  cfg.structures.filter(o=>o.obstacle&&o.key!=='wreck').forEach((o,i)=>{
   const m=masks[o.key];if(!m||o.x+o.w<camX||o.x>camX+width||o.y<camY||o.y-o.w*2>camY+height)return;
   const u=i%2?.68:.30,x=o.x+o.w*u;
   let yy=0;const ix=Math.min(m.width-1,Math.floor((o.flip<0?1-u:u)*m.width));
   while(yy<m.height&&m.data[(yy*m.width+ix)*4+3]<110)yy++;
   if(yy===m.height)return;
   const y=o.y-o.w*m.height/m.width+yy*o.w/m.width+5;
   const depth=(y-cfg.waterY)/10;
   if(depth>300&&i%3!==0)return;
   const key=depth<120?'reef_kelp':depth<220?(i%3?'reef_kelp':'reef_barrel'):depth<300?(i%2?'reef_broken':'reef_barrel'):'reef_kelp';
   const w=key==='reef_kelp'?Math.min(58,o.w*.26):Math.min(65,o.w*.28);
   placed(ctx,images[key],x-w/2,y,w,depth>300?.38:.72,i%2);
  });
  // Background wrecks sit on distant ledges. Decoration never enters collision list.
  for(const [x,y,w] of [[70,2530,270],[545,2930,300],[45,3470,320],[1530,2620,290],[2720,2820,300],[4210,2780,340],[5410,2700,280]]){
   if(x+w<camX||x>camX+width||y<camY||y-320>camY+height)continue;
   placed(ctx,images.reef_ledge,x-35,y+75,w+90,.28,false);
   placed(ctx,images.reef_wreck,x,y,w,.35,false);
   placed(ctx,images.reef_broken,x+w*.8,y+12,55,.4,true);
  }
 }
 game.ReefArtSystem=Object.freeze({prepare,hit,background,decorations});
})(window);
