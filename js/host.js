'use strict';
/* Standard Ludo options only: no weighted dice, secret powers, party cards or hidden match modifiers. */
const DEFN={red:'Red',green:'Green',yellow:'Yellow',blue:'Blue'};
const PAL=[{red:'#e63946',green:'#2a9d5c',yellow:'#f4b400',blue:'#2f6fed'},{red:'#d55e00',green:'#009e73',yellow:'#f0e442',blue:'#0072b2'}];
const defO=()=>({diff:'normal',names:{},pal:0,pin:null});
let O=(()=>{const d=defO(),s=Store.get('ldb_opts',{})||{};return Object.assign(d,{diff:s.diff,names:s.names||{},pal:s.pal,pin:s.pin})})();
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

let unlocked=false;
const opt=(k,vals,v)=>'<select data-o="'+k+'">'+vals.map(([a,t])=>'<option value="'+a+'"'+(String(a)===String(v)?' selected':'')+'>'+t+'</option>').join('')+'</select>';
function renderHost(){
 const B=$('#hostbody');
 if(O.pin&&!unlocked){B.innerHTML='<div class="host-lock"><h3>Game options locked</h3><p class="hint">Enter the local PIN to change display and computer options.</p><input id="hpin" type="password" inputmode="numeric" placeholder="PIN" autocomplete="off"><p id="herr" class="err"></p><button class="btn" data-h="unlock">Unlock</button></div>';return}
 B.innerHTML='<div class="host-intro"><b>Ludo game options</b><small>Gameplay uses fair random dice and the same core rules online and offline.</small></div>'+
 '<div class="card host-core" style="--c:#ffd24a"><h3>Core Ludo rules</h3><p class="hint">Roll 6 to leave the yard · exact roll to finish · three 6s loses the turn · capture and reaching home give another turn · paired tokens are safe.</p></div>'+
 '<div class="host-two"><div class="card" style="--c:#7dffb0"><h3>Computer</h3><label>Difficulty'+opt('diff',[['easy','Easy'],['normal','Normal'],['hard','Hard']],O.diff)+'</label></div><div class="card" style="--c:#f4b400"><h3>Accessibility</h3><label class="sw">Colorblind-friendly colors<input type="checkbox" data-o="pal"'+(O.pal?' checked':'')+'></label></div></div>'+
 '<details class="host-section"><summary>Player names</summary><div class="host-detail-body"><div class="host-names">'+COLORS.map(c=>'<label>'+DEFN[c]+' name<input data-o="name.'+c+'" maxlength="12" value="'+(O.names[c]||'')+'" placeholder="'+DEFN[c]+'"></label>').join('')+'</div></div></details>'+
 '<details class="host-section host-tools"><summary>Stats, replay & privacy</summary><div class="host-detail-body"><p class="hint" id="hst"></p><div class="row"><button class="btn" data-h="replay">Watch last game</button><button class="btn ghost" data-h="statsreset">Reset stats</button></div><h3>Backup</h3><textarea id="hjson" rows="3" placeholder="Backup JSON"></textarea><div class="row"><button class="btn" data-h="exp">Export</button><button class="btn" data-h="imp">Import</button></div><h3>Options PIN</h3><input id="hnew" type="password" inputmode="numeric" placeholder="New PIN (4 to 8 digits)" autocomplete="off"><div class="row"><button class="btn" data-h="pin">Save PIN</button>'+(O.pin?'<button class="btn ghost" data-h="pinclear">Remove PIN</button>':'')+'</div><p class="err" id="herr2"></p></div></details>';
 const st=Stats.get();$('#hst').textContent=st.games?st.games+' Ludo games · '+Object.entries(st.wins).map(([c,n])=>(NAMES[c]||c)+' '+n).join(' · '):'No Ludo games finished yet.'
}
function openHost(){unlocked=!O.pin;renderHost();modal('#mHost')}
$('#bHost').onclick=()=>{modal('#mSet',false);openHost()};
$('#hostbody').addEventListener('change',e=>{
 const t=e.target,k=t.dataset.o;if(!k)return;const v=t.type==='checkbox'?+t.checked:t.value;
 if(k==='diff')O.diff=v;
 else if(k.startsWith('name.')){O.names[k.slice(5)]=clean(v);t.value=O.names[k.slice(5)];applyLook();if(G&&!REPLAYING)render()}
 else if(k==='pal'){O.pal=+v;applyLook();if(G&&!REPLAYING&&G.cols){buildBoard();render()}}
 saveO()
});
$('#hostbody').addEventListener('click',async e=>{
 const b=e.target.closest('[data-h]');if(!b)return;const a=b.dataset.h;
 if(a==='unlock'){const v=$('#hpin').value;if(await hash(O.pin.salt+v)===O.pin.h){unlocked=true;renderHost()}else{$('#herr').textContent='Wrong PIN';$('#hpin').value=''}}
 else if(a==='replay')replayLast();
 else if(a==='statsreset'){if(confirm('Reset all Ludo win statistics?')){Store.del('ldb_stats');renderHost()}}
 else if(a==='exp'){const o=JSON.parse(JSON.stringify(O));delete o.pin;$('#hjson').value=JSON.stringify({stats:Stats.get(),opts:o})}
 else if(a==='imp'){try{const x=JSON.parse($('#hjson').value);if(x.stats&&typeof x.stats.games==='number'){const w={};COLORS.forEach(c=>{if(+x.stats.wins[c]>0)w[c]=Math.floor(+x.stats.wins[c])});Store.set('ldb_stats',{games:Math.max(0,Math.floor(x.stats.games)),wins:w})}if(x.opts){if(['easy','normal','hard'].includes(x.opts.diff))O.diff=x.opts.diff;O.pal=+!!x.opts.pal;COLORS.forEach(c=>{if(x.opts.names&&x.opts.names[c]!==undefined)O.names[c]=clean(x.opts.names[c])})}saveO();applyLook();renderHost();toast('Imported')}catch(er){$('#hjson').value='Invalid backup'}}
 else if(a==='pin'){const v=$('#hnew').value;if(!/^\\d{4,8}$/.test(v)){$('#herr2').textContent='Use 4 to 8 digits';return}const salt=Math.random().toString(36).slice(2);O.pin={salt,h:await hash(salt+v)};saveO();unlocked=true;renderHost();toast('PIN saved')}
 else if(a==='pinclear'){O.pin=null;saveO();renderHost();toast('PIN removed')}
});
