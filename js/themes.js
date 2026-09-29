'use strict';
/* Board themes + dice skins. Cosmetic only: never touches rules, dice odds or game state. */
const THEMES={classic:'DaniLabs Classic',vegas:'Vegas Night',beach:'Beach Day',snow:'Snow Peak',royal:'Royal',neon:'Neon',space:'Space'},PAWN={classic:'Classic disc',gem:'Gem',neon:'Neon',candy:'Candy',pearl:'Pearl',royal:'Royal'},DICE={classic:'DaniLabs Classic',galaxy:'Galaxy',wood:'Wood',ice:'Ice',gold:'Gold',neon:'Neon'};
let TH=Object.assign({t:'classic',d:'classic',p:'classic'},Store.get('ldb_theme',{}));
if(!THEMES[TH.t])TH.t='classic';if(!DICE[TH.d])TH.d='classic';if(!PAWN[TH.p])TH.p='classic';
function applyTheme(){document.body.dataset.theme=TH.t;document.body.dataset.dice=TH.d;document.body.dataset.pawn=TH.p;Store.set('ldb_theme',TH);
 const m=document.querySelector('meta[name=theme-color]');if(m)m.content={classic:'#1b1140',vegas:'#12021f',beach:'#0b6e8a',snow:'#1d3f7a',royal:'#160736',neon:'#0a0630',space:'#050a24'}[TH.t]}
applyTheme();
