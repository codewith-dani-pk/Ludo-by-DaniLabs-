'use strict';
/* Host options + visible party modes. Every mode here is announced on screen to all players. */
const DEFN={red:'Red',green:'Green',yellow:'Yellow',blue:'Blue'};
const PAL=[{red:'#e63946',green:'#2a9d5c',yellow:'#f4b400',blue:'#2f6fed'},{red:'#d55e00',green:'#009e73',yellow:'#f0e442',blue:'#0072b2'}];
const CARDS={shield:['Shield','🛡','Your tokens cannot be captured until your next turn'],reroll:['Re-roll','🎲','After rolling, roll again'],freeze:['Freeze','❄','The next player skips a turn']};
const defO=()=>({rules:{leave:'six',exact:1,three6:1,capExtra:1,undo:1},diff:'normal',names:{},chaos:0,cards:0,events:0,underdog:0,helper:{},pal:0,pin:null});
let O=(()=>{const d=defO(),s=Store.get('ldb_opts',{})||{};return Object.assign(d,s,{rules:Object.assign(d.rules,s.rules||{}),names:s.names||{},helper:s.helper||{}})})();
const saveO=()=>Store.set('ldb_opts',O),clean=s=>String(s||'').replace(/[<>&"'`]/g,'').trim().slice(0,10);
COLORS.forEach(c=>{O.names[c]=clean(O.names[c]);O.helper[c]=+!!O.helper[c]});O.diff=['easy','normal','hard'].includes(O.diff)?O.diff:'normal';O.rules.leave=['six','any','onesix'].includes(O.rules.leave)?O.rules.leave:'six';['exact','three6','capExtra','undo'].forEach(k=>O.rules[k]=+!!O.rules[k]);['chaos','cards','events','underdog','pal'].forEach(k=>O[k]=+!!O[k]);
function applyLook(){COLORS.forEach(c=>{NAMES[c]=clean(O.names[c])||DEFN[c];HEX[c]=PAL[O.pal?1:0][c];document.documentElement.style.setProperty('--'+c,HEX[c])})}
applyLook();

/* ---- per-game state ---- */
const nowModes=()=>({chaos:O.chaos,cards:O.cards,events:O.events,underdog:O.underdog,helper:Object.assign({},O.helper)});
function modeText(){const m=G.mx,a=[];if(m.chaos)a.push('Wild star dice');if(m.cards)a.push('Power cards');if(m.events)a.push('Party events');if(m.underdog)a.push('Underdog boost');const h=G.cols.filter(c=>m.helper[c]);if(h.length)a.push('Helper re-roll: '+h.map(c=>NAMES[c]).join(', '));return a.join(' | ')}
function ensureExtras(){G.bots=Array.isArray(G.bots)?G.bots.filter(c=>G.cols.includes(c)):[];G.cards=G.cards&&typeof G.cards==='object'?G.cards:{};COLORS.forEach(c=>{const a=Array.isArray(G.cards[c])?G.cards[c]:[];G.cards[c]=[...new Set(a)].filter(k=>CARDS[k]).slice(0,3)});G.shield=G.shield&&typeof G.shield==='object'?G.shield:{};G.peace=Math.max(0,+G.peace||0);G.tc=Math.max(0,+G.tc||0);G.skip=G.cols.includes(G.skip)?G.skip:null;G.rep=Array.isArray(G.rep)?G.rep:[];G.secretPowers=G.secretPowers&&typeof G.secretPowers==='object'?G.secretPowers:{};G.mx=G.mx&&typeof G.mx==='object'?G.mx:{chaos:0,cards:0,events:0,underdog:0,helper:{}};G.mx.helper=G.mx.helper&&typeof G.mx.helper==='object'?G.mx.helper:{}}
const frame=(c,r)=>({p:Object.fromEntries(G.cols.map(k=>[k,G.pos[k].slice()])),c:c||null,r:r||null});
function rec(c,r){G.rep.push(frame(c,r));if(G.rep.length>700)G.rep.splice(1,G.rep.length-700)}
function initExtras(){G.mx=nowModes();ensureExtras();G.cols.forEach(c=>{G.cards[c]=[]});if(G.mx.cards){const starter=Object.keys(CARDS);G.cols.forEach(c=>giveCard(c,starter[Math.floor(Math.random()*starter.length)],true))}G.rep=[frame()];Undo.h=[];const t=modeText();if(t)setTimeout(()=>toast('Modes: '+t),300)}

/* ---- power cards, events, underdog ---- */
function giveCard(c,t,quiet){G.cards[c]=G.cards[c]||[];const a=G.cards[c],available=Object.keys(CARDS).filter(k=>!a.includes(k));if(a.length>=3||!available.length)return;if(t&&a.includes(t))return;t=t||available[Math.floor(Math.random()*available.length)];if(!CARDS[t])return;a.push(t);if(!quiet)toast(NAMES[c]+' got '+CARDS[t][1]+' '+CARDS[t][0])}
const captureCard=c=>{if(G.mx&&G.mx.cards)giveCard(c)};
function nextColor(){let i=G.turn;do i=(i+1)%G.cols.length;while(G.ranks.includes(G.cols[i]));return G.cols[i]}
function useCard(t){if(!G||busy||REPLAYING||G.over)return;const c=cur(),a=G.cards[c]||[],ix=a.indexOf(t);if(ix<0||isBot(c))return;
 if(t==='reroll'){if(G.roll==null||(phase!=='move'&&phase!=='roll'))return;if(G.roll===6)G.sixes=Math.max(0,G.sixes-1);G.roll=null;phase='roll';say(NAMES[c]+' uses Re-roll - roll again')}
 else{if(phase!=='roll')return;if(t==='shield'){G.shield[c]=1;toast(NAMES[c]+' is shielded until their next turn')}else{G.skip=nextColor();toast(NAMES[G.skip]+' will skip a turn')}}
 a.splice(ix,1);Snd.play('tap');saveG();render()}
function botCards(c){if(!G.cards||!G.cards[c])return;const a=G.cards[c];let i=a.indexOf('shield');if(i>=0&&!G.shield[c]&&Math.random()<.4){a.splice(i,1);G.shield[c]=1;toast(NAMES[c]+' uses Shield')}i=a.indexOf('freeze');if(i>=0&&Math.random()<.3){a.splice(i,1);G.skip=nextColor();toast(NAMES[G.skip]+' will skip a turn (Freeze)')}}
function botMaybeReroll(c,r,b){if(!G||!isBot(c)||G.roll!==r||(phase!=='move'&&phase!=='roll')||!G.cards||!G.cards[c])return false;const a=G.cards[c],i=a.indexOf('reroll');if(i<0)return false;const f=Rules.feats(G,c,r),noMove=!Rules.legal(G,c,r).length,weak=noMove||(!f.cap&&!f.fin&&!f.out&&(r<=2||f.danger>.7)),chance=O.diff==='hard'?.72:O.diff==='easy'?.28:.5;if(!weak||Math.random()>chance)return false;a.splice(i,1);if(r===6)G.sixes=Math.max(0,G.sixes-1);G.roll=null;phase='roll';busy=false;toast(NAMES[c]+' uses 🎲 Re-roll');saveG();render();setTimeout(()=>{if(G&&!G.over&&cur()===c&&isBot(c)&&phase==='roll'&&!busy)doRoll()},420*S.speed);return true}
const prog=c=>G.pos[c].reduce((n,p)=>n+(p<0?0:p+1),0);
function hostTick(){if(!G||!G.mx)return;const act=G.cols.filter(c=>!G.ranks.includes(c));
 if(G.mx.events&&G.tc%10===0){const e=Math.floor(Math.random()*3);if(e===0){const c=cur();giveCard(c);toast('Party gift for '+NAMES[c])}else if(e===1){G.peace=G.cols.length;toast('Peace time: no captures for one round')}else{const w=act.slice().sort((a,b)=>prog(a)-prog(b))[0];giveCard(w,'reroll');toast('Comeback: '+NAMES[w]+' gets a Re-roll')}}
 if(G.mx.underdog&&G.tc%8===0&&act.length>1){const s=act.slice().sort((a,b)=>prog(a)-prog(b));if(prog(s[s.length-1])-prog(s[0])>30){giveCard(s[0],'reroll');toast('Underdog boost: '+NAMES[s[0]]+' gets a Re-roll')}}}
function renderExtras(){const box=$('#cards'),u=$('#bUndo'),pk=$('#pick');if(!G||REPLAYING||!G.cols){box.innerHTML=pk.innerHTML='';u.hidden=true;return}
 box.innerHTML=''; // powers live on each player's own panel
 pk.innerHTML=''; // Wild Star picker lives on the active player's panel
 u.hidden=!(O.rules.undo&&Undo.h.length&&!G.over)}
$('#cards').onclick=e=>{const b=e.target.closest('[data-card]');if(b)useCard(b.dataset.card)};

/* ---- undo ---- */
const Undo={h:[],push(){if(!O.rules.undo||!G||G.over)return;this.h.push(JSON.stringify(G));if(this.h.length>40)this.h.shift()},
 run(){if(busy||REPLAYING||!G||phase==='wait')return;let k=-1;for(let i=this.h.length-1;i>=0;i--){const g=JSON.parse(this.h[i]);if(!g.bots.includes(g.cols[g.turn])){k=i;break}}if(k<0){toast('Nothing to undo');return}G=JSON.parse(this.h[k]);this.h.length=k;ensureExtras();phase='move';busy=false;buildBoard();saveG();say(NAMES[cur()]+': move undone - choose again');render()}};
$('#bUndo').onclick=()=>Undo.run();

/* ---- replay ---- */
function saveReplay(){try{Store.set('ldb_replay',{cols:G.cols,frames:G.rep})}catch(e){}}
async function replayLast(){const R=Store.get('ldb_replay',null);if(!R||!R.frames||!R.frames.length){toast('No finished game to replay yet');return}
 modal('#mHost',false);Snd.music(0);REPLAYING=true;G={cols:R.cols,pos:Object.fromEntries(COLORS.map(c=>[c,[-1,-1,-1,-1]])),turn:0,roll:null,sixes:0,ranks:[],bots:[],cards:{},shield:{},peace:0,tc:0,rep:[],mx:{helper:{}}};buildBoard();show('game');busy=true;phase='wait';
 for(let n=0;n<R.frames.length&&REPLAYING;n++){const f=R.frames[n];R.cols.forEach(c=>G.pos[c]=f.p[c].slice());if(f.c){G.turn=R.cols.indexOf(f.c);G.roll=f.r}render();say(f.c?'Replay '+n+'/'+(R.frames.length-1)+': '+NAMES[f.c]+' rolled '+f.r:'Replay: start');await sleep(650*S.speed)}
 const done=REPLAYING;REPLAYING=false;G=null;busy=false;phase='roll';refreshHome();if(done){toast('Replay finished');show('home')}}

/* ---- host options screen ---- */
let unlocked=false;
const yn=(k,v)=>'<input type="checkbox" data-o="'+k+'"'+(v?' checked':'')+'>';
const opt=(k,vals,v)=>'<select data-o="'+k+'">'+vals.map(([a,t])=>'<option value="'+a+'"'+(String(a)===String(v)?' selected':'')+'>'+t+'</option>').join('')+'</select>';
const sw=(t,k,v)=>'<label class="sw">'+t+yn(k,v)+'</label>';
function renderHost(){const B=$('#hostbody');
 if(O.pin&&!unlocked){B.innerHTML='<p class="hint">Enter the PIN to change game options.</p><input id="hpin" type="password" inputmode="numeric" placeholder="PIN" autocomplete="off"><p id="herr" class="err"></p><button class="btn" data-h="unlock">Unlock</button>';return}
 const r=O.rules;
 B.innerHTML='<p class="hint">Party modes and helper settings are announced to every player when a game starts. They apply to the next new game. House rules apply immediately.</p>'+
 '<div class="card" style="--c:#ffd24a"><h3>House rules</h3><label>Leaving the yard'+opt('rules.leave',[['six','Roll a 6'],['onesix','Roll a 1 or a 6'],['any','Any roll']],r.leave)+'</label>'+sw('Exact roll needed to finish','rules.exact',r.exact)+sw('Three 6s in a row lose the turn','rules.three6',r.three6)+sw('Capture gives another turn','rules.capExtra',r.capExtra)+sw('Paired tokens are safe','stack',S.stack)+sw('Allow undo (takes back one move)','rules.undo',r.undo)+'</div>'+
 '<div class="card" style="--c:#7dffb0"><h3>Computer players</h3><label>Difficulty'+opt('diff',[['easy','Easy'],['normal','Normal'],['hard','Hard']],O.diff)+'</label></div>'+
 '<div class="card" style="--c:#e63946"><h3>Party modes</h3>'+sw('Wild star dice: about 1 in 8 rolls lets you pick 1 to 6','chaos',O.chaos)+sw('Power cards: Shield, Re-roll, Freeze (earned by captures)','cards',O.cards)+sw('Party events every 10 turns','events',O.events)+sw('Underdog boost: trailing player gets a Re-roll','underdog',O.underdog)+'</div>'+
 '<div class="card" style="--c:#2f6fed"><h3>Helper re-roll</h3><p class="hint">Shown as a sparkle on the player chip. If that player rolls a number with no move, they roll once more. Good for kids and beginners.</p><div class="g3">'+COLORS.map(c=>'<label class="sw">'+DEFN[c]+yn('helper.'+c,O.helper[c])+'</label>').join('')+'</div></div>'+
 '<div class="card" style="--c:#f4b400"><h3>Players</h3>'+COLORS.map(c=>'<label>'+DEFN[c]+' name<input data-o="name.'+c+'" maxlength="10" value="'+(O.names[c]||'')+'" placeholder="'+DEFN[c]+'"></label>').join('')+sw('Colorblind-friendly colors','pal',O.pal)+'</div>'+
 '<div class="card" style="--c:#2a9d5c"><h3>Stats, replay and backup</h3><p class="hint" id="hst"></p><div class="row"><button class="btn" data-h="replay">Watch last game</button><button class="btn ghost" data-h="statsreset">Reset stats</button></div><textarea id="hjson" rows="3" placeholder="Backup JSON"></textarea><div class="row"><button class="btn" data-h="exp">Export</button><button class="btn" data-h="imp">Import</button></div></div>'+
 '<div class="card" style="--c:#cbb8ff"><h3>Options PIN</h3><input id="hnew" type="password" inputmode="numeric" placeholder="New PIN (4 to 8 digits)" autocomplete="off"><div class="row"><button class="btn" data-h="pin">Save PIN</button>'+(O.pin?'<button class="btn ghost" data-h="pinclear">Remove PIN</button>':'')+'</div><p class="err" id="herr2"></p></div>';
 const st=Stats.get();$('#hst').textContent=st.games?st.games+' games played. Wins: '+Object.entries(st.wins).map(([c,n])=>(NAMES[c]||c)+' '+n).join(', '):'No games finished yet.'}
function openHost(){unlocked=!O.pin;renderHost();modal('#mHost')}
$('#bHost').onclick=()=>{modal('#mSet',false);openHost()};
$('#hostbody').addEventListener('change',e=>{const t=e.target,k=t.dataset.o;if(!k)return;const v=t.type==='checkbox'?+t.checked:t.value;
 if(k.startsWith('rules.'))O.rules[k.slice(6)]=k==='rules.leave'?v:+v;
 else if(k==='diff')O.diff=v;
 else if(k==='stack'){S.stack=+v;saveS()}
 else if(['chaos','cards','events','underdog'].includes(k))O[k]=+v;
 else if(k.startsWith('helper.'))O.helper[k.slice(7)]=+v;
 else if(k.startsWith('name.')){O.names[k.slice(5)]=clean(v);t.value=O.names[k.slice(5)];applyLook();if(G&&!REPLAYING)render()}
 else if(k==='pal'){O.pal=+v;applyLook();if(G&&!REPLAYING&&G.cols){buildBoard();render()}}
 saveO()});
$('#hostbody').addEventListener('click',async e=>{const b=e.target.closest('[data-h]');if(!b)return;const a=b.dataset.h;
 if(a==='unlock'){const v=$('#hpin').value;if(await hash(O.pin.salt+v)===O.pin.h){unlocked=true;renderHost()}else{$('#herr').textContent='Wrong PIN';$('#hpin').value=''}}
 else if(a==='replay')replayLast();
 else if(a==='statsreset'){if(confirm('Reset all win statistics?')){Store.del('ldb_stats');renderHost()}}
 else if(a==='exp'){const o=JSON.parse(JSON.stringify(O));delete o.pin;$('#hjson').value=JSON.stringify({stats:Stats.get(),opts:o,stack:S.stack})}
 else if(a==='imp'){try{const o=JSON.parse($('#hjson').value),d=defO();
   if(o.stats&&typeof o.stats.games==='number'){const w={};COLORS.forEach(c=>{if(+o.stats.wins[c]>0)w[c]=Math.floor(+o.stats.wins[c])});Store.set('ldb_stats',{games:Math.max(0,Math.floor(o.stats.games)),wins:w})}
   if(o.opts){const x=o.opts,r=x.rules||{};if(['six','onesix','any'].includes(r.leave))O.rules.leave=r.leave;['exact','three6','capExtra','undo'].forEach(k=>{if(k in r)O.rules[k]=+!!r[k]});if(['easy','normal','hard'].includes(x.diff))O.diff=x.diff;['chaos','cards','events','underdog','pal'].forEach(k=>{if(k in x)O[k]=+!!x[k]});COLORS.forEach(c=>{if(x.names&&x.names[c]!==undefined)O.names[c]=clean(x.names[c]);if(x.helper&&c in x.helper)O.helper[c]=+!!x.helper[c]})}
   if('stack' in o){S.stack=+!!o.stack;saveS()}saveO();applyLook();renderHost();toast('Imported')}catch(er){$('#hjson').value='Invalid backup'}}
 else if(a==='pin'){const v=$('#hnew').value;if(!/^\d{4,8}$/.test(v)){$('#herr2').textContent='Use 4 to 8 digits';return}const salt=Math.random().toString(36).slice(2);O.pin={salt,h:await hash(salt+v)};saveO();unlocked=true;renderHost();toast('PIN saved')}
 else if(a==='pinclear'){O.pin=null;saveO();renderHost();toast('PIN removed')}});
