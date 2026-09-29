'use strict';
/* Cosmetic-only 3D dice and pawn motion. */
(function(){const ROT={1:'',2:'rotateY(-90deg)',3:'rotateX(-90deg)',4:'rotateX(90deg)',5:'rotateY(90deg)',6:'rotateY(180deg)'},oldFace=face;
const dots={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
face=function(n,dim){const d=$('#die');if(!n){d.classList.remove('d3');return oldFace(n,dim)}d.classList.add('d3');d.innerHTML='<div class="cube">'+[1,2,3,4,5,6].map(v=>'<span class="f f'+v+'">'+Array.from({length:9},(_,i)=>'<i class="'+(dots[v].includes(i+1)?'p':'')+'"></i>').join('')+'</span>').join('')+'</div>';d.querySelector('.cube').style.transform=ROT[n]||'';d.setAttribute('aria-label','Dice '+n)};
const oldRender=render;render=function(){oldRender();if(G)document.body.dataset.turn=cur()};
})();