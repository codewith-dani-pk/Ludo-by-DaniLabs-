'use strict';
/* UNO-style core card game: offline pass-and-play / bots plus server-authoritative online rooms. */
const CGK=['r','g','y','b'],CGCOL={r:'red',g:'green',y:'yellow',b:'blue'},CGCOLORNAME={red:'Red',green:'Green',yellow:'Yellow',blue:'Blue'},CGSYM={S:'⊘',R:'⇄',D:'+2',W:'★',F:'+4'};
let CG=null,cgModalFn=null,cgOnlineWinnerShown='';

const cgRnd=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const cgShuf=d=>{for(let i=d.length-1;i>0;i--){const j=cgRnd(i+1);[d[i],d[j]]=[d[j],d[i]]}return d};
function cgDeck(){const d=[];CGK.forEach(c=>{d.push({c,v:'0'});for(let v=1;v<=9;v++)d.push({c,v:String(v)},{c,v:String(v)});['S','R','D'].forEach(v=>d.push({c,v},{c,v}))});for(let i=0;i<4;i++)d.push({c:'w',v:'W'},{c:'w',v:'F'});return cgShuf(d)}
const cgCur=()=>CG.pl[CG.turn],cgTop=()=>CG.disc[CG.disc.length-1],cgName=p=>NAMES[p.col]+(p.bot?' 🤖':'');
const cgCount=p=>Number.isFinite(+p.handCount)?+p.handCount:p.hand.length;
const cgMine=()=>!CG.online||cgCur().col===CG.myColor;
const cgAdv=(k=1)=>{for(let i=0;i<k;i++)CG.turn=(CG.turn+CG.dir+CG.pl.length)%CG.pl.length};

function cgDrawN(p,n){
 for(let i=0;i<n;i++){
  if(!CG.deck.length){const t=CG.disc.pop(),rest=CG.disc.splice(0);CG.deck=cgShuf(rest);CG.disc=[t]}
  if(!CG.deck.length)break;
  p.hand.push(CG.deck.pop())
 }
}
function cgOk(c,p=cgCur(),i=p.hand.indexOf(c)){
 if(!c)return false;
 if(CG.drew&&i!==CG.drawnIndex)return false;
 const t=cgTop();
 if(c.v==='F'&&p.hand.some((x,k)=>k!==i&&x.c===CG.color))return false;
 return c.c==='w'||c.c===CG.color||c.v===t.v
}
function cgStart(n){
 if(window.OnlinePlay&&OnlinePlay.prepareLocal)OnlinePlay.prepareLocal();
 Snd.ac();const cols=n===2?['red','yellow']:n===3?['red','green','yellow']:COLORS.slice();
 const bots=$('#cgBots').checked;
 CG={online:false,pl:cols.map((c,i)=>({col:c,bot:bots&&i>0,hand:[]})),deck:cgDeck(),disc:[],turn:0,dir:1,color:null,drew:false,drawnIndex:-1,over:false,busy:false,cover:false,humans:bots?1:n};
 CG.pl.forEach(p=>cgDrawN(p,7));
 let ix=-1;for(let i=CG.deck.length-1;i>=0;i--)if(CG.deck[i].c!=='w'&&!['S','R','D'].includes(CG.deck[i].v)){ix=i;break}
 const f=CG.deck.splice(ix<0?CG.deck.length-1:ix,1)[0];CG.disc.push(f);CG.color=f.c;
 show('cg');modal('#mCg',false);cgTurn(true)
}
function cgTurn(){
 const p=cgCur();if(CG.over)return;CG.drew=false;CG.drawnIndex=-1;
 if(CG.humans>1&&!p.bot){CG.cover=true;cgRender();cgSay('');modalCg('<h2>Pass the device</h2><p>'+cgName(p)+', it is your turn.</p><button class="btn" id="cgReady">I am ready</button>',()=>{CG.cover=false;cgRender();cgHint()});return}
 cgRender();cgHint();if(p.bot)setTimeout(cgBot,800*S.speed)
}
function cgHint(){
 const p=cgCur();if(CG.online){cgSay(CG.message||((p.col===CG.myColor?'Your turn':'Waiting for '+cgName(p))));return}
 if(p.bot)return cgSay(cgName(p)+' is thinking...');
 cgSay(CG.drew?cgName(p)+': play the drawn card or pass':cgName(p)+': play a card or draw one')
}
const cgSay=t=>{$('#cgMsg').textContent=t||''};
function modalCg(html,fn){$('#mCgBody').innerHTML=html;cgModalFn=fn;modal('#mCg',true)}
$('#mCgBody').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const f=cgModalFn;
 if(b.dataset.col){modal('#mCg',false);f&&f(b.dataset.col)}
 else if(b.id==='cgReady'){modal('#mCg',false);f&&f()}
 else if(b.id==='cgAgain'){modal('#mCg',false);if(CG&&!CG.online)cgStart(CG.pl.length)}
 else if(b.id==='cgHomeB'){modal('#mCg',false);if(CG&&CG.online&&window.OnlinePlay)OnlinePlay.leave();else{show('home');refreshHome()}}
});
function cardEl(c,cls){return'<button class="ucard '+(c.c==='w'?'w':CGCOL[c.c])+' '+(cls||'')+'" aria-label="'+(c.c==='w'?'wild':CGCOL[c.c])+' '+(CGSYM[c.v]||c.v)+'"><span>'+(CGSYM[c.v]||c.v)+'</span></button>'}
function cgRender(){
 if(!CG)return;const cur=cgCur();
 $('#cgOpp').innerHTML=CG.pl.map((p,i)=>'<div class="chip '+(i===CG.turn&&!CG.over?'act':'')+'" style="--c:'+HEX[p.col]+'">'+cgName(p)+' · '+cgCount(p)+'</div>').join('');
 const t=cgTop();if(!t)return;
 $('#cgTop').className='ucard '+(t.c==='w'?'w':CGCOL[t.c]);$('#cgTop').innerHTML='<span>'+(CGSYM[t.v]||t.v)+'</span>';
 $('#cgCol').style.background=HEX[CGCOL[CG.color]];$('#cgCol').textContent=(CG.dir>0?'↻ ':'↺ ')+CGCOLORNAME[CGCOL[CG.color]];
 const dr=$('#cgDraw');dr.textContent=CG.drew&&cgMine()?'Pass':'Draw';dr.disabled=CG.busy||CG.cover||CG.over||!cgMine()||cur.bot;
 const viewer=CG.online?CG.pl.find(p=>p.col===CG.myColor):(CG.humans===1?CG.pl[0]:cur);
 const hand=viewer&&viewer.hand||[];
 $('#cgHand').innerHTML=CG.cover?'<p class="hint">Hand hidden</p>':hand.map((c,i)=>{
  const can=viewer===cur&&!cur.bot&&cgMine()&&cgOk(c,viewer,i);
  return cardEl(c,can?'ok':'no').replace('<button','<button data-i="'+i+'"')
 }).join('')
}
function chooseColor(done){modalCg('<h2>Choose a color</h2><div class="row">'+CGK.map(k=>'<button class="btn" data-col="'+k+'" style="background:'+HEX[CGCOL[k]]+';color:#fff">'+CGCOLORNAME[CGCOL[k]]+'</button>').join('')+'</div>',done)}
$('#cgHand').onclick=e=>{
 const b=e.target.closest('[data-i]');if(!b||!CG||CG.over||CG.busy||CG.cover||!cgMine())return;
 const p=CG.online?CG.pl.find(x=>x.col===CG.myColor):cgCur(),i=+b.dataset.i,c=p&&p.hand[i];
 if(!p||p!==cgCur()||!cgOk(c,p,i)){Snd.play('cap');return}
 if(c.c==='w')chooseColor(col=>CG.online?CG.send('play',{card:i,color:col}):cgPlayLocal(i,col));
 else CG.online?CG.send('play',{card:i}):cgPlayLocal(i,null)
};
$('#cgDraw').onclick=()=>{
 if(!CG||CG.over||CG.busy||CG.cover||!cgMine())return;
 if(CG.online){CG.send(CG.drew?'pass':'draw');return}
 const p=cgCur();if(!p.bot)cgDrawLocal(p)
};
function cgDrawLocal(p){
 Snd.play('tap');
 if(CG.drew){CG.drew=false;CG.drawnIndex=-1;cgAdv();return cgTurn()}
 cgDrawN(p,1);const i=p.hand.length-1,last=p.hand[i];
 if(last&&cgOk(last,p,i)){CG.drew=true;CG.drawnIndex=i;cgRender();cgSay(cgName(p)+': play the drawn card or tap Pass');if(p.bot)setTimeout(cgBot,650*S.speed)}
 else{cgAdv();cgTurn()}
}
function cgPlayLocal(i,col){
 const p=cgCur(),c=p.hand[i];if(!cgOk(c,p,i))return;
 p.hand.splice(i,1);CG.disc.push(c);CG.color=c.c==='w'?col:c.c;CG.drew=false;CG.drawnIndex=-1;Snd.play(c.c==='w'?'six':'move');
 if(!p.hand.length){CG.over=true;cgRender();return cgWin(p)}
 if(p.hand.length===1){toast(cgName(p)+': UNO!');Snd.play('home')}
 const fin=()=>cgTurn();
 if(c.v==='S'){cgAdv(2);return fin()}
 if(c.v==='R'){CG.dir*=-1;cgAdv(CG.pl.length===2?2:1);return fin()}
 if(c.v==='D'||c.v==='F'){const n=c.v==='D'?2:4;cgAdv();const q=cgCur();cgDrawN(q,n);toast(cgName(q)+' draws '+n);Snd.play('cap');cgAdv();return fin()}
 cgAdv();fin()
}
function cgBot(){
 if(!CG||CG.online||CG.over)return;const p=cgCur();if(!p.bot||CG.cover||!$('#cg').classList.contains('on'))return;
 const pool=p.hand.map((c,i)=>({c,i})).filter(o=>cgOk(o.c,p,o.i));
 if(!pool.length)return cgDrawLocal(p);
 const cnt={r:0,g:0,y:0,b:0};p.hand.forEach(c=>{if(c.c!=='w')cnt[c.c]++});
 pool.forEach(o=>{let s=Math.random();if(o.c.c==='w')s-=2;if('SRDF'.includes(o.c.v))s+=2;if(o.c.c!=='w')s+=cnt[o.c.c]*.3;o.s=s});
 pool.sort((a,b)=>b.s-a.s);const pick=pool[0];let col=null;
 if(pick.c.c==='w'){col=CGK.slice().sort((a,b)=>cnt[b]-cnt[a])[0];if(!cnt[col])col=CGK[cgRnd(4)]}
 cgPlayLocal(pick.i,col)
}
function cgWin(p){
 Stats2.add(p.col);confetti();Snd.play('win');buzz(200);
 modalCg('<h2>'+cgName(p)+' wins UNO!</h2><p class="hint">'+CG.pl.map(q=>cgName(q)+': '+q.hand.length+' cards').join(' · ')+'</p><div class="row"><button class="btn" id="cgAgain">Play again</button><button class="btn ghost" id="cgHomeB">Home</button></div>')
}
function cgApplyOnline(st,room,members,mine,send){
 if(!st||!st.game||st.game.kind!=='uno')return;
 const g=st.game;
 CG={online:true,myColor:mine,send,roomId:room.id,pl:g.players.map(p=>({col:p.col,bot:false,hand:Array.isArray(p.hand)?p.hand:[],handCount:p.handCount})),deck:[],deckCount:g.deckCount||0,disc:g.disc||[],turn:g.turn,dir:g.dir,color:g.color,drew:!!g.drew,drawnIndex:Number.isInteger(g.drawnIndex)?g.drawnIndex:-1,over:!!g.over,winner:g.winner||null,busy:false,cover:false,humans:g.players.length,message:st.message};
 show('cg');modal('#mOnline',false);cgRender();cgHint();
 if(CG.over&&CG.winner&&cgOnlineWinnerShown!==room.id+':'+CG.winner){cgOnlineWinnerShown=room.id+':'+CG.winner;confetti();Snd.play('win');modalCg('<h2>'+NAMES[CG.winner]+' wins UNO!</h2><p class="hint">Online match complete.</p><button class="btn" id="cgHomeB">Home</button>')}
}
const Stats2={get:()=>Object.assign({games:0,wins:{}},Store.get('ldb_cgstats',{})),add(c){const s=this.get();s.games++;s.wins[c]=(s.wins[c]||0)+1;Store.set('ldb_cgstats',s)}};
function cgStatsLine(){const s=Stats2.get();$('#cgStats').textContent=s.games?s.games+' UNO games · '+Object.entries(s.wins).map(([c,n])=>NAMES[c]+' '+n).join(' · '):''}
$('#bCards').onclick=()=>{Snd.play('tap');cgStatsLine();show('cgHome')};
$('#cgBack').onclick=()=>{refreshHome();show('home')};
document.querySelectorAll('[data-cn]').forEach(b=>b.onclick=()=>{Snd.play('tap');cgStart(+b.dataset.cn)});
$('#cgMenu').onclick=()=>{if(CG&&CG.online&&window.OnlinePlay){OnlinePlay.leave();return}CG&&(CG.over=true);modal('#mCg',false);refreshHome();show('home')};
window.OnlineCards={applyState:cgApplyOnline,isActive:()=>!!(CG&&CG.online&&!CG.over),currentColor:()=>CG&&CG.online&&CG.pl[CG.turn]?CG.pl[CG.turn].col:null,clear:()=>{if(CG&&CG.online)CG=null}};
