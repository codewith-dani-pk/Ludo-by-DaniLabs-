'use strict';
/* DaniLabs lobby: profile, cosmetic coins, daily reward, mode cards, Collection. No rules/odds touched. */
(function(){
const P=Object.assign({name:'Guest player',av:0,coins:0,last:'',streak:0},Store.get('ldb_prof',{})),AV=['🦊','🐼','🦁','🐙','🚀','👑'];
const profileName=s=>String(s||'').replace(/[<>&"'\x60]/g,'').trim().slice(0,12);
P.name=profileName(P.name)||'Guest player';P.av=Math.max(0,Math.min(AV.length-1,Math.floor(+P.av||0)));P.coins=Math.max(0,Math.floor(+P.coins||0));P.streak=Math.max(0,Math.min(7,Math.floor(+P.streak||0)));P.last=typeof P.last==='string'?P.last:'';
const dayKey=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),save=()=>Store.set('ldb_prof',P),today=()=>dayKey();
function paint(){$('#pName').textContent=P.name;$('#avatar').textContent=AV[P.av%AV.length];$('#coins').textContent=P.coins;
 const d=$('#bDaily'),ok=P.last!==today(),n=Math.min(P.streak+1,7)*25;d.className='daily '+(ok?'ready':'done');$('#dailyT').textContent=ok?'Daily reward':'Reward claimed';$('#dailyS').textContent=ok?'+'+n+' ◎':'Come back tomorrow'}
function claim(){if(P.last===today()){toast('Already claimed today');return}
 const yd=new Date();yd.setDate(yd.getDate()-1);const y=dayKey(yd);P.streak=P.last===y?Math.min(P.streak+1,7):1;const n=P.streak*25;P.coins+=n;P.last=today();save();paint();Snd.play('win');buzz(60);toast('+'+n+' coins · day '+P.streak)}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800)}
$('#bDaily').onclick=$('#nDaily').onclick=claim;$('#avatar').onclick=e=>{e.stopPropagation();P.av=(P.av+1)%AV.length;save();paint();document.dispatchEvent(new Event('danilabs-profile'))};
/* in-app profile editor (replaces browser prompt) */
let editAv=P.av;
function profileGrid(){const g=$('#profAvatars');if(!g)return;g.innerHTML='';AV.forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.textContent=a;b.className=i===editAv?'on':'';b.setAttribute('aria-label','Avatar '+(i+1));b.onclick=()=>{editAv=i;$('#profPreview').textContent=AV[i];profileGrid()};g.appendChild(b)})}
$('#bProf').onclick=()=>{editAv=P.av;$('#profName').value=P.name;$('#profPreview').textContent=AV[editAv%AV.length];$('#profPreviewName').textContent=P.name;profileGrid();modal('#mProfile')};
$('#profName').addEventListener('input',e=>{$('#profPreviewName').textContent=e.target.value.trim().slice(0,12)||'Guest player'});
$('#bProfSave').onclick=()=>{const v=$('#profName').value;P.name=v.replace(/[<>&"'`]/g,'').trim().slice(0,12)||'Guest player';P.av=editAv;save();paint();modal('#mProfile',false);document.dispatchEvent(new Event('danilabs-profile'));Snd.play('tap')};
/* finished games earn cosmetic coins */
const add=Stats.add;Stats.add=function(c){add.call(this,c);P.coins+=25;save();paint()};
/* start buttons */
const go=(n,bots)=>{Snd.play('tap');$('#sBots').checked=!!bots;startGame(n,!!bots,$('#sVar').value)};
document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>go(+b.dataset.play,false));
document.querySelectorAll('[data-bot]').forEach(b=>b.onclick=()=>go(+b.dataset.bot,true));
/* mode cards: party toggles the visible party options in Game options */
function setMode(m,apply=true){m=['classic','quick','rush','party'].includes(m)?m:'classic';document.querySelectorAll('#modes [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));
 const party=m==='party';$('#sVar').value=party?'classic':m;if(apply){O.chaos=party?1:0;O.cards=party?1:0;O.events=party?1:0;saveO()}Store.set('ldb_mode',m)}
document.querySelectorAll('#modes [data-mode]').forEach(b=>b.onclick=()=>{Snd.play('tap');setMode(b.dataset.mode)});
setMode(Store.get('ldb_mode','classic'),false);
$('#logo3').onclick=logoTap; /* private login: 5 taps on any logo */
/* Collection */
const SW={t:{classic:'linear-gradient(90deg,#e63946 25%,#2a9d5c 25% 50%,#f4b400 50% 75%,#2f6fed 75%)',vegas:'linear-gradient(90deg,#3b0a4d,#ffd23f,#ff2e9a)',beach:'linear-gradient(90deg,#21b5d6,#fff3d6)',snow:'linear-gradient(90deg,#6aa7e0,#f4fbff)',royal:'linear-gradient(90deg,#4a1d8a,#ffd24a)',neon:'linear-gradient(90deg,#19f0ff,#ff2ea6)',space:'linear-gradient(90deg,#050a24,#8b7bff)'},
 d:{classic:'#fff',galaxy:'radial-gradient(circle,#8b5cf6,#0b0424)',wood:'#c98a4b',ice:'linear-gradient(145deg,#f0fbff,#6cb8e6)',gold:'linear-gradient(145deg,#fff2a8,#c98a00)',neon:'#0a0630;box-shadow:0 0 10px #19f0ff'}};
let tab='t';const L={t:THEMES,d:DICE,p:PAWN};
function grid(){const g=$('#cGrid');g.innerHTML='';Object.entries(L[tab]).forEach(([k,v])=>{const b=document.createElement('button');b.className=TH[tab]===k?'on':'';
 b.innerHTML=(tab==='p'?'<span class="tok-pv" style="background:'+HEX.red+'"></span>':'<span class="sw3" style="background:'+SW[tab][k]+'"></span>')+'<b>'+v+'</b>';
 b.onclick=()=>{TH[tab]=k;applyTheme();grid();Snd.play('tap')};g.appendChild(b)})}
document.querySelectorAll('#cTabs [data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;document.querySelectorAll('#cTabs button').forEach(x=>x.classList.toggle('on',x===b));grid()});
$('#nColl').onclick=()=>{grid();modal('#mColl')};
const rh=refreshHome;refreshHome=function(){rh();paint()};paint();
})();
