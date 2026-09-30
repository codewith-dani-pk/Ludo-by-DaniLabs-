'use strict';
/* DaniLabs lobby: verified profile controls and Ludo launch options only. */
(function(){
const P=Object.assign({name:'Guest player',av:0},Store.get('ldb_prof',{})),AV=['🦊','🐼','🦁','🐙','🚀','👑'];
const profileName=s=>String(s||'').replace(/[<>&"'\x60]/g,'').trim().slice(0,12);
P.name=profileName(P.name)||'Guest player';P.av=Math.max(0,Math.min(AV.length-1,Math.floor(+P.av||0)));
const save=()=>Store.set('ldb_prof',{name:P.name,av:P.av});
function paint(){$('#pName').textContent=P.name;$('#avatar').textContent=AV[P.av%AV.length]}
$('#avatar').onclick=e=>{e.stopPropagation();P.av=(P.av+1)%AV.length;save();paint();document.dispatchEvent(new Event('danilabs-profile'))};
let editAv=P.av;
function profileGrid(){const g=$('#profAvatars');if(!g)return;g.innerHTML='';AV.forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.textContent=a;b.className=i===editAv?'on':'';b.setAttribute('aria-label','Avatar '+(i+1));b.onclick=()=>{editAv=i;$('#profPreview').textContent=AV[i];profileGrid()};g.appendChild(b)})}
$('#bProf').onclick=()=>{editAv=P.av;$('#profName').value=P.name;$('#profPreview').textContent=AV[editAv%AV.length];$('#profPreviewName').textContent=P.name;profileGrid();modal('#mProfile')};
$('#profName').addEventListener('input',e=>{$('#profPreviewName').textContent=e.target.value.trim().slice(0,12)||'Guest player'});
$('#bProfSave').onclick=()=>{P.name=profileName($('#profName').value)||'Guest player';P.av=editAv;save();paint();modal('#mProfile',false);document.dispatchEvent(new Event('danilabs-profile'));Snd.play('tap')};
const go=(n,bots)=>{Snd.play('tap');$('#sBots').checked=!!bots;startGame(n,!!bots,$('#sVar').value)};
document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>go(+b.dataset.play,false));
document.querySelectorAll('[data-bot]').forEach(b=>b.onclick=()=>go(+b.dataset.bot,true));
function setMode(m){m=['classic','quick','rush'].includes(m)?m:'classic';document.querySelectorAll('#modes [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));$('#sVar').value=m;Store.set('ldb_mode',m)}
document.querySelectorAll('#modes [data-mode]').forEach(b=>b.onclick=()=>{Snd.play('tap');setMode(b.dataset.mode)});
setMode(Store.get('ldb_mode','classic'));
const rh=refreshHome;refreshHome=function(){rh();paint()};paint();
})();
