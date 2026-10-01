'use strict';
(async()=>{
 try{
  const r=await fetch('data/game-catalog.json'),cat=await r.json();
  if(cat.brand!=='LudoByDaniLabs'||!Array.isArray(cat.games))throw Error('Invalid game catalog');
  window.DaniGameCatalog=cat;
  for(const el of document.querySelectorAll('[data-catalog]')){
   const g=cat.games.find(x=>x.id===el.dataset.catalog);if(!g)continue;
   el.dataset.status=g.status;el.disabled=g.status!=='available';
   const small=el.querySelector('small');if(small)small.textContent=g.status==='available'?'Available':g.status==='coming_soon'?'Coming Soon':'Unavailable';
  }
 }catch(e){document.querySelectorAll('[data-catalog]').forEach(el=>{if(el.dataset.catalog!=='color-cards')el.disabled=true})}
})();