'use strict';
/* Standard Ludo options and local replay/stat controls. */
const DEFN={red:'Red',green:'Green',yellow:'Yellow',blue:'Blue'};
const PAL=[{red:'#e63946',green:'#2a9d5c',yellow:'#f4b400',blue:'#2f6fed'},{red:'#d55e00',green:'#009e73',yellow:'#f0e442',blue:'#0072b2'}];
const defO=()=>({diff:'normal',names:{},pal:0});
let O=(()=>{const d=defO(),s=Store.get('ldb_opts',{})||{};return Object.assign(d,{diff:s.diff,names:s.names||{},pal:s.pal})})();
const saveO=()=>Store.set('ldb_opts',O),clean=s=>String(s||'').replace(/[<>&"'\x60]/g,'').trim().slice(0,12);
COLORS.forEach(c=>O.names[c]=clean(O.names[c]));O.diff=['easy','normal','hard'].includes(O.diff)?O.diff:'normal';O.pal=+!!O.pal;
function applyLook(){COLORS.forEach(c=>{NAMES[c]=clean(O.names[c])||DEFN[c];HEX[c]=PAL[O.pal?1:0][c];document.documentElement.style.setProperty('--'+c,HEX[c])})}
applyLook();

function ensureExtras(){G.bots=Array.isArray(G.bots)?G.bots.filter(c=>G.cols.includes(c)):[];G.rep=Array.isArray(G.rep)?G.rep:[]}
const frame=(c,r)=>({p:Object.fromEntries(G.cols.map(k=>[k,G.pos[k].slice()])),c:c||null,r:r||null});
function rec(c,r){G.rep.push(frame(c,r));if(G.rep.length>700)G.rep.splice(1,G.rep.length-700)}
function initExtras(){ensureExtras();G.rep=[frame()]}
function renderExtras(){const box=$('#cards'),pk=$('#pick');if(box)box.innerHTML='';if(pk)pk.innerHTML=''}

function saveReplay(){try{Store.set('ldb_replay',{cols:G.cols,frames:G.rep})}catch(e){}}
async function replayLast(){
 const R=Store.get('ldb_replay',null);if(!R||!R.frames||!R.frames.length){toast('No finished game to replay yet');return}
 modal('#mHost',false);Snd.music(0);REPLAYING=true;
 G={cols:R.cols,pos:Object.fromEntries(COLORS.map(c=>[c,[-1,-1,-1,-1]])),turn:0,roll:null,sixes:0,ranks:[],bots:[],rep:[]};
 buildBoard();show('game');busy=true;phase='wait';
 for(let n=0;n<R.frames.length&&REPLAYING;n++){const f=R.frames[n];R.cols.forEach(c=>G.pos[c]=f.p[c].slice());if(f.c){G.turn=R.cols.indexOf(f.c);G.roll=f.r}render();say(f.c?'Replay '+n+'/'+(R.frames.length-1)+': '+NAMES[f.c]+' rolled '+f.r:'Replay: start');await sleep(650*S.speed)}
 const done=REPLAYING;REPLAYING=false;G=null;busy=false;phase='roll';refreshHome();if(done){toast('Replay finished');show('home')}
}

const opt=(k,vals,v)=>'<select data-o="'+k+'">'+vals.map(([a,t])=>'<option value="'+a+'"'+(String(a)===String(v)?' selected':'')+'>'+t+'</option>').join('')+'</select>';
function renderHost(){
 const B=$('#hostbody');
 B.innerHTML='<div class="host-intro"><b>Ludo game options</b><small>These settings change presentation or computer strategy only. Dice odds and core rules stay fixed.</small></div>'+
 '<div class="card" style="--c:#8d72ff"><h3>Start Classic Ludo</h3><label>Seat types<select id="hostSeats"><option value="human">All local humans</option><option value="cpu">One human + computers</option><option value="mixed">Mixed · two humans, remaining computers</option></select></label><div class="row"><button class="btn" data-h="start2">2 players</button><button class="btn" data-h="start3">3 players</button><button class="btn" data-h="start4">4 players</button></div><p class="hint">2-player matches use opposite red and yellow seats. Player colors are fixed by board seat so routes and safe squares remain correct.</p></div><div class="card host-core" style="--c:#ffd24a"><h3>Verified core rules</h3><p class="hint">Roll 6 to leave the yard · exact roll to finish · three 6s loses the turn · capture and reaching home give another turn · friendly pawns may share/pass and do not form blockades.</p></div>'+
 '<div class="host-two"><div class="card" style="--c:#7dffb0"><h3>Computer</h3><label>Difficulty'+opt('diff',[['easy','Easy · mostly advances'],['normal','Normal · balances safety/captures'],['hard','Hard · prioritizes finish/capture/threat escape']],O.diff)+'</label><p class="hint">Bots receive only legal moves. Difficulty changes move selection, never dice results.</p></div><div class="card" style="--c:#f4b400"><h3>Accessibility</h3><label class="sw">Colorblind-friendly colors<input type="checkbox" data-o="pal"'+(O.pal?' checked':'')+'></label></div></div>'+
 '<details class="host-section"><summary>Player names</summary><div class="host-detail-body"><div class="host-names">'+COLORS.map(c=>'<label>'+DEFN[c]+' name<input data-o="name.'+c+'" maxlength="12" value="'+(O.names[c]||'')+'" placeholder="'+DEFN[c]+'"></label>').join('')+'</div></div></details>'+
 '<details class="host-section host-tools"><summary>Stats & replay</summary><div class="host-detail-body"><p class="hint" id="hst"></p><div class="row"><button class="btn" data-h="replay">Watch last game</button><button class="btn ghost" data-h="statsreset">Reset stats</button></div></div></details>';
 const st=Stats.get();$('#hst').textContent=st.games?st.games+' Ludo games · '+Object.entries(st.wins).map(([c,n])=>(NAMES[c]||c)+' '+n).join(' · '):'No Ludo games finished yet.'
}
function openHost(){renderHost();modal('#mHost')}
$('#bHost').onclick=()=>{modal('#mSet',false);openHost()};
$('#hostbody').addEventListener('change',e=>{
 const t=e.target,k=t.dataset.o;if(!k)return;const v=t.type==='checkbox'?+t.checked:t.value;
 if(k==='diff')O.diff=v;
 else if(k.startsWith('name.')){O.names[k.slice(5)]=clean(v);t.value=O.names[k.slice(5)];applyLook();if(G&&!REPLAYING)render()}
 else if(k==='pal'){O.pal=+v;applyLook();if(G&&!REPLAYING&&G.cols){buildBoard();render()}}
 saveO()
});
$('#hostbody').addEventListener('click',e=>{
 const b=e.target.closest('[data-h]');if(!b)return;
 if(/^start[234]$/.test(b.dataset.h)){const n=+b.dataset.h.slice(-1),mode=$('#hostSeats')?.value||'human',cols=LudoRules.colorsFor(n),bots=mode==='cpu'?cols.slice(1):mode==='mixed'?cols.slice(2):[];modal('#mHost',false);startGame(n,bots)}
 else if(b.dataset.h==='replay')replayLast();
 else if(b.dataset.h==='statsreset'&&confirm('Reset all Ludo win statistics?')){Store.del('ldb_stats');renderHost()}
});
