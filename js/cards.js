'use strict';
/* Color Cards: an original matching card game (pass-and-play or vs computer). */
const CGK=['r','g','y','b'],CGCOL={r:'red',g:'green',y:'yellow',b:'blue'},CGSYM={S:'⊘',R:'⇄',D:'+2',W:'★',F:'+4'};
let CG=null;
const cgRnd=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const cgShuf=d=>{for(let i=d.length-1;i>0;i--){const j=cgRnd(i+1);[d[i],d[j]]=[d[j],d[i]]}return d};
function cgDeck(){const d=[];CGK.forEach(c=>{d.push({c,v:'0'});for(let v=1;v<=9;v++)d.push({c,v:''+v},{c,v:''+v});['S','R','D'].forEach(v=>d.push({c,v},{c,v}))});for(let i=0;i<4;i++)d.push({c:'w',v:'W'},{c:'w',v:'F'});return cgShuf(d)}
const cgCur=()=>CG.pl[CG.turn],cgTop=()=>CG.disc[CG.disc.length-1],cgName=p=>NAMES[p.col]+(p.bot?' 🤖':'');
const cgAdv=(k=1)=>{for(let i=0;i<k;i++)CG.turn=(CG.turn+CG.dir+CG.pl.length)%CG.pl.length};
function cgDrawN(p,n){for(let i=0;i<n;i++){if(!CG.deck.length){const t=CG.disc.pop();CG.deck=cgShuf(CG.disc);CG.disc=[t]}if(!CG.deck.length)break;p.hand.push(CG.deck.pop())}}
function cgOk(c){const t=cgTop();if(CG.pend>0)return c.v==='F'||(c.v==='D'&&t.v==='D');return c.c==='w'||c.c===CG.color||c.v===t.v}
function cgStart(n){Snd.ac();const cols=n===2?['red','yellow']:n===3?['red','green','yellow']:COLORS.slice(),bots=$('#cgBots').checked;
 CG={pl:cols.map((c,i)=>({col:c,bot:bots&&i>0,hand:[]})),deck:cgDeck(),disc:[],turn:0,dir:1,color:null,pend:0,drew:false,over:false,busy:false,cover:false,humans:bots?1:n,o:{stack:$('#cgStack').checked,swap:$('#cgSwap').checked,dp:$('#cgDp').checked}};
 CG.pl.forEach(p=>cgDrawN(p,7));let f;do{f=CG.deck.pop();if(f.c==='w'||'SRD'.includes(f.v))CG.deck.unshift(f);else break}while(true);CG.disc.push(f);CG.color=f.c;
 show('cg');modal('#mCg',false);cgTurn(true)}
function cgTurn(first){const p=cgCur();if(CG.over)return;CG.drew=false;if(CG.humans>1&&!p.bot){CG.cover=true;cgRender();cgSay('');modalCg('<h2>Pass the device</h2><p>'+cgName(p)+', it is your turn.</p><button class="btn" id="cgReady">I am ready</button>',()=>{CG.cover=false;cgRender();cgHint()});return}cgRender();cgHint();if(p.bot)setTimeout(cgBot,900*S.speed)}
function cgHint(){const p=cgCur();if(p.bot)return cgSay(cgName(p)+' is thinking...');cgSay(CG.pend>0?cgName(p)+': stack a draw card or draw '+CG.pend:cgName(p)+': play a card or draw')}
const cgSay=t=>{$('#cgMsg').textContent=t};
let cgModalFn=null;function modalCg(html,fn){$('#mCgBody').innerHTML=html;cgModalFn=fn;modal('#mCg',true)}
$('#mCgBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const f=cgModalFn;if(b.dataset.col){modal('#mCg',false);f&&f(b.dataset.col)}else if(b.dataset.tg){modal('#mCg',false);f&&f(+b.dataset.tg)}else if(b.id==='cgReady'){modal('#mCg',false);f&&f()}else if(b.id==='cgAgain'){modal('#mCg',false);cgStart(CG.pl.length)}else if(b.id==='cgHomeB'){modal('#mCg',false);show('home');refreshHome()}});
function cardEl(c,cls){return'<button class="ucard '+(c.c==='w'?'w':CGCOL[c.c])+' '+(cls||'')+'" aria-label="'+(c.c==='w'?'wild':CGCOL[c.c])+' '+(CGSYM[c.v]||c.v)+'"><span>'+(CGSYM[c.v]||c.v)+'</span></button>'}
function cgRender(){if(!CG)return;const cur=cgCur();$('#cgOpp').innerHTML=CG.pl.map((p,i)=>'<div class="chip '+(i===CG.turn&&!CG.over?'act':'')+'" style="--c:'+HEX[p.col]+'">'+cgName(p)+' · '+p.hand.length+(CG.dir>0?'':'')+'</div>').join('');
 const t=cgTop();$('#cgTop').className='ucard '+(t.c==='w'?'w':CGCOL[t.c]);$('#cgTop').innerHTML='<span>'+(CGSYM[t.v]||t.v)+'</span>';$('#cgCol').style.background=HEX[CGCOL[CG.color]];$('#cgCol').textContent=(CG.dir>0?'↻ ':'↺ ')+NAMES[CGCOL[CG.color]];
 const dr=$('#cgDraw');dr.textContent=CG.pend>0?'Draw '+CG.pend:CG.drew?'Pass':'Draw';dr.disabled=cur.bot||CG.busy||CG.cover||CG.over;
 const viewer=CG.humans===1?CG.pl[0]:cur;$('#cgHand').innerHTML=CG.cover?'<p class="hint">Hand hidden</p>':viewer.hand.map((c,i)=>cardEl(c,viewer===cur&&!cur.bot&&cgOk(c)?'ok':'no').replace('<button','<button data-i="'+i+'"')).join('')}
$('#cgHand').onclick=e=>{const b=e.target.closest('[data-i]');if(!b||!CG||CG.over||CG.busy||CG.cover)return;const p=cgCur();if(p.bot)return;const i=+b.dataset.i,c=p.hand[i];if(!cgOk(c)){Snd.play('cap');return}
 if(c.c==='w')modalCg('<h2>Choose a color</h2><div class="row">'+CGK.map(k=>'<button class="btn" data-col="'+k+'" style="background:'+HEX[CGCOL[k]]+';color:#fff">'+NAMES[CGCOL[k]]+'</button>').join('')+'</div>',col=>cgPlay(i,col));else cgPlay(i,null)};
$('#cgDraw').onclick=()=>{if(!CG||CG.over||CG.busy||CG.cover)return;const p=cgCur();if(p.bot)return;cgDrawTurn(p)};
function cgDrawTurn(p){Snd.play('tap');if(CG.pend>0){cgDrawN(p,CG.pend);toast(cgName(p)+' draws '+CG.pend);CG.pend=0;cgAdv();return cgTurn()}
 if(CG.drew){cgAdv();return cgTurn()}
 cgDrawN(p,1);if(CG.o.dp){while(!cgOk(p.hand[p.hand.length-1])&&(CG.deck.length||CG.disc.length>1))cgDrawN(p,1)}
 const last=p.hand[p.hand.length-1];if(last&&cgOk(last)){CG.drew=true;cgRender();cgSay(cgName(p)+': play the drawn card or tap Pass');if(p.bot)setTimeout(cgBot,800*S.speed)}else{cgAdv();cgTurn()}}
function cgPlay(i,col){const p=cgCur(),c=p.hand.splice(i,1)[0];CG.disc.push(c);CG.color=c.c==='w'?col:c.c;CG.drew=false;Snd.play(c.c==='w'?'six':'move');
 if(!p.hand.length){CG.over=true;cgRender();return cgWin(p)}
 if(p.hand.length===1){toast(cgName(p)+': last card!');Snd.play('home')}
 const fin=()=>cgTurn();
 if(c.v==='S'){cgAdv(2);return fin()}
 if(c.v==='R'){CG.dir*=-1;cgAdv(CG.pl.length===2?2:1);return fin()}
 if(c.v==='D'||c.v==='F'){const n=c.v==='D'?2:4;if(CG.o.stack){CG.pend+=n;cgAdv();return fin()}cgAdv();const q=cgCur();cgDrawN(q,n);toast(cgName(q)+' draws '+n);Snd.play('cap');cgAdv();return fin()}
 if(CG.o.swap&&c.v==='7'){const pick=t=>{const a=p.hand;p.hand=CG.pl[t].hand;CG.pl[t].hand=a;toast(cgName(p)+' swaps hands with '+cgName(CG.pl[t]));cgAdv();fin()};
  if(p.bot){let t=-1;CG.pl.forEach((q,k)=>{if(k!==CG.turn&&(t<0||q.hand.length<CG.pl[t].hand.length))t=k});return pick(t)}
  return modalCg('<h2>Swap hands with</h2><div class="row">'+CG.pl.map((q,k)=>k===CG.turn?'':'<button class="btn" data-tg="'+k+'">'+cgName(q)+' ('+q.hand.length+')</button>').join('')+'</div>',pick)}
 if(CG.o.swap&&c.v==='0'){const hs=CG.pl.map(q=>q.hand),n=hs.length;CG.pl.forEach((q,k)=>{q.hand=hs[(k-CG.dir+n)%n]});toast('Everyone passes their hand along');cgAdv();return fin()}
 cgAdv();fin()}
function cgBot(){if(!CG||CG.over)return;const p=cgCur();if(!p.bot||CG.cover||!$('#cg').classList.contains('on'))return;
 const nxt=CG.pl[(CG.turn+CG.dir+CG.pl.length)%CG.pl.length],pool=p.hand.map((c,i)=>({c,i})).filter(o=>cgOk(o.c));
 if(!pool.length||(CG.drew&&false))return cgDrawTurn(p);
 const cnt={r:0,g:0,y:0,b:0};p.hand.forEach(c=>{if(c.c!=='w')cnt[c.c]++});
 pool.forEach(o=>{let s=Math.random();if(o.c.c==='w')s-=6;if('SRDF'.includes(o.c.v)&&nxt.hand.length<=2)s+=8;else if('SRD'.includes(o.c.v))s+=1;if(o.c.c!=='w')s+=cnt[o.c.c]*.4;o.s=s});
 pool.sort((a,b)=>b.s-a.s);const pick=pool[0];let col=null;if(pick.c.c==='w'){col=CGK.slice().sort((a,b)=>cnt[b]-cnt[a])[0];if(!cnt[col])col=CGK[cgRnd(4)]}
 if(CG.drew&&pick.c.c==='w'&&false)return;cgPlay(pick.i,col)}
function cgWin(p){Stats2.add(p.col);confetti();Snd.play('win');buzz(200);const st=Stats2.get();modalCg('<h2>'+cgName(p)+' wins!</h2><p class="hint">'+CG.pl.map(q=>cgName(q)+': '+q.hand.length+' left').join(' · ')+'</p><div class="row"><button class="btn" id="cgAgain">Play again</button><button class="btn ghost" id="cgHomeB">Home</button></div>')}
const Stats2={get:()=>Object.assign({games:0,wins:{}},Store.get('ldb_cgstats',{})),add(c){const s=this.get();s.games++;s.wins[c]=(s.wins[c]||0)+1;Store.set('ldb_cgstats',s)}};
function cgStatsLine(){const s=Stats2.get();$('#cgStats').textContent=s.games?s.games+' card games · '+Object.entries(s.wins).map(([c,n])=>NAMES[c]+' '+n).join(' · '):''}
$('#bCards').onclick=()=>{Snd.play('tap');cgStatsLine();show('cgHome')};
$('#cgBack').onclick=()=>{refreshHome();show('home')};
document.querySelectorAll('[data-cn]').forEach(b=>b.onclick=()=>{Snd.play('tap');cgStart(+b.dataset.cn)});
$('#cgMenu').onclick=()=>{CG&&(CG.over=true);modal('#mCg',false);refreshHome();show('home')};
