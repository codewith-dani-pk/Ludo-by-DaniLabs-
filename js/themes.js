'use strict';
/* Board themes + dice skins. Cosmetic only: never touches rules, dice odds or game state. */
const THEMES={classic:'Classic',vegas:'Vegas Night',beach:'Beach Day',snow:'Snow Peak'},PAWN={classic:'Classic disc',gem:'Gem',neon:'Neon',candy:'Candy',pearl:'Pearl'},DICE={classic:'Classic',galaxy:'Galaxy',wood:'Wood',ice:'Ice',gold:'Gold'};
let TH=Object.assign({t:'classic',d:'classic',p:'classic'},Store.get('ldb_theme',{}));
if(!THEMES[TH.t])TH.t='classic';if(!DICE[TH.d])TH.d='classic';if(!PAWN[TH.p])TH.p='classic';
function applyTheme(){document.body.dataset.theme=TH.t;document.body.dataset.dice=TH.d;document.body.dataset.pawn=TH.p;Store.set('ldb_theme',TH);
 const m=document.querySelector('meta[name=theme-color]');if(m)m.content={classic:'#1b1140',vegas:'#12021f',beach:'#0b6e8a',snow:'#1d3f7a'}[TH.t]}
applyTheme();
(function(){const host=document.querySelector('.home-options');if(!host)return;
 const opt=o=>Object.entries(o).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
 const box=document.createElement('div');box.className='home-options look-options';
 box.innerHTML=`<label class="sw home-select"><span>Board theme<small>Pick a look</small></span><select id="sTheme" aria-label="Board theme">${opt(THEMES)}</select></label><label class="sw home-select"><span>Dice skin<small>Pick your dice</small></span><select id="sDice" aria-label="Dice skin">${opt(DICE)}</select></label><label class="sw home-select pawn-sel"><span>Pawn style<small>Pick your tokens</small></span><select id="sPawn" aria-label="Pawn style">${opt(PAWN)}</select></label>`;
 host.after(box);
 const a=box.querySelector('#sTheme'),b=box.querySelector('#sDice');a.value=TH.t;b.value=TH.d;
 const c=box.querySelector('#sPawn');c.value=TH.p;c.onchange=()=>{TH.p=c.value;applyTheme()};
 a.onchange=()=>{TH.t=a.value;applyTheme()};b.onchange=()=>{TH.d=b.value;applyTheme()}})();
