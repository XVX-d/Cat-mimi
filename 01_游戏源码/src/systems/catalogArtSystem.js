"use strict";
/* v0.16: selected C atlas, presentation only. Does not access or mutate fish data. */
(function(root){
 const game=root.CatFishGame||(root.CatFishGame={});
 let atlas=null,observer=null;
 const rects={panel:[27,110,520,823],card:[578,405,155,230],purple:[751,405,156,231],gold:[928,405,154,230],red:[578,659,155,231],gray:[751,659,155,231],selected:[923,651,166,245],tab:[1111,250,192,78],tabOn:[1111,149,192,82],back:[1118,674,79,84],close:[1230,674,80,84],settings:[1347,674,84,84],popup:[593,126,462,243],button:[1127,366,376,84]};
 function paint(c,bounds){
  if(!atlas)return;
  const el=bounds||c.parentElement,w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;
  const dpr=Math.min(2,root.devicePixelRatio||1);c.width=Math.ceil(w*dpr);c.height=Math.ceil(h*dpr);
  const ctx=c.getContext('2d');ctx.scale(dpr,dpr);
  const key=c.dataset.journalArt,r=rects[key]||rects.card;
  const sx=r[0]*atlas.width/1536,sy=r[1]*atlas.height/1024,sw=r[2]*atlas.width/1536,sh=r[3]*atlas.height/1024;
  ctx.save();ctx.beginPath();ctx.roundRect(0,0,w,h,['back','close','settings'].includes(key)?Math.min(w,h)/2:key==='panel'?25:10);ctx.clip();
  if(['back','close','settings'].includes(key)){ctx.drawImage(atlas,sx,sy,sw,sh,0,0,w,h);}
  else {
   const top=key==='panel'?125:key==='popup'?45:34,bottom=key==='panel'?95:32,side=key==='panel'?64:25;
   const dx=Math.min(side,w*.22),dt=Math.min(top,h*.30),db=Math.min(bottom,h*.22);
   const xs=[0,side,r[2]-side,r[2]],ys=[0,top,r[3]-bottom,r[3]],xx=[0,dx,w-dx,w],yy=[0,dt,h-db,h];
   for(let row=0;row<3;row++)for(let col=0;col<3;col++)
    ctx.drawImage(atlas,sx+xs[col]*sw/r[2],sy+ys[row]*sh/r[3],(xs[col+1]-xs[col])*sw/r[2],(ys[row+1]-ys[row])*sh/r[3],xx[col],yy[row],xx[col+1]-xx[col],yy[row+1]-yy[row]);
  }
  ctx.restore();
 }
 function add(el,key){
  if(!el)return;let c=el.querySelector(':scope > .journal-art');
  if(!c){c=document.createElement('canvas');c.className='journal-art';c.setAttribute('aria-hidden','true');el.prepend(c);}
  c.dataset.journalArt=key;paint(c);if(observer)observer.observe(el);
 }
 function mount(screen){
  if(observer)observer.disconnect();
  observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(entries=>entries.forEach(e=>{const c=e.target.querySelector(':scope > .journal-art');if(c)paint(c);})):null;
  const page=screen.querySelector('.scene-collection');if(!page)return;
  page.classList.add('journal-collection');add(page,'panel');
  // The selected panel already contains the back/settings art; keep live hit targets only.
  page.querySelectorAll('.catalog-tabs button').forEach(el=>add(el,el.classList.contains('active')?'tabOn':'tab'));
  page.querySelectorAll('.catalog-card').forEach(el=>add(el,el.classList.contains('locked')?'gray':el.classList.contains('selected')?'selected':el.classList.contains('rarity-epic')?'red':el.classList.contains('rarity-rare')?'gold':el.classList.contains('rarity-uncommon')?'purple':'card'));
  page.querySelectorAll('.coast-look').forEach(el=>add(el,el.classList.contains('selected')?'selected':'card'));
  page.querySelectorAll('.coast-look button').forEach(el=>add(el,'button'));
 }
 function prepare(image){atlas=image;const screen=document.querySelector('.coast-screen');if(screen)mount(screen);}
 game.CatalogArtSystem=Object.freeze({prepare,mount,paint});
})(window);
