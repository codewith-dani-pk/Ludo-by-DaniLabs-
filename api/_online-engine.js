import crypto from 'node:crypto';

const COLORS=['red','green','yellow','blue'];
const START={red:0,green:13,yellow:26,blue:39};
const SAFE=new Set([0,8,13,21,26,34,39,47]);
const UNO_COLORS=['r','g','y','b'];
const colsFor=n=>n===2?['red','yellow']:n===3?['red','green','yellow']:COLORS.slice();

function newLudoState(n,variant='classic'){
 const cols=colsFor(n),pos=Object.fromEntries(COLORS.map(c=>[c,[-1,-1,-1,-1]]));
 if(variant==='quick')cols.forEach(c=>{pos[c][2]=56;pos[c][3]=56});
 if(variant==='rush')cols.forEach(c=>{pos[c]=[0,0,0,0]});
 const game={kind:'ludo',cols,pos,turn:0,roll:null,sixes:0,ranks:[],bots:[],variant,online:1};
 return {game,phase:'roll',message:cols[0]+' to roll'}
}

function unoDeck(){
 const d=[];
 UNO_COLORS.forEach(c=>{
  d.push({c,v:'0'});
  for(let v=1;v<=9;v++)d.push({c,v:String(v)},{c,v:String(v)});
  ['S','R','D'].forEach(v=>d.push({c,v},{c,v}));
 });
 for(let i=0;i<4;i++)d.push({c:'w',v:'W'},{c:'w',v:'F'});
 return shuffle(d)
}
function shuffle(a){
 for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}
 return a
}
function unoDrawOne(g,p){
 if(!g.deck.length){
  const top=g.disc.pop(),rest=g.disc.splice(0);
  g.deck=shuffle(rest);
  g.disc=[top];
 }
 const c=g.deck.pop();if(c)p.hand.push(c);return c||null
}
function unoDrawN(g,p,n){for(let i=0;i<n;i++)if(!unoDrawOne(g,p))break}
function newUnoState(n){
 const cols=colsFor(n),players=cols.map(col=>({col,hand:[]})),deck=unoDeck(),disc=[];
 const game={kind:'uno',players,deck,disc,turn:0,dir:1,color:null,drew:false,drawnIndex:-1,over:false,winner:null,online:1};
 players.forEach(p=>unoDrawN(game,p,7));
 let first=-1;
 for(let i=game.deck.length-1;i>=0;i--)if(game.deck[i].c!=='w'&&!['S','R','D'].includes(game.deck[i].v)){first=i;break}
 if(first<0)first=game.deck.length-1;
 const card=game.deck.splice(first,1)[0];game.disc.push(card);game.color=card.c;
 return {game,phase:'play',message:cols[0]+' to play'}
}

export function newOnlineState(n,variant='classic'){
 return variant==='uno'?newUnoState(n):newLudoState(n,variant)
}

/* Ludo: fair server-side dice and standard core rules. */
const ludoDest=(p,r)=>p<0?(r===6?0:null):p>=56?null:(p+r<=56?p+r:null);
const ludoCell=(c,p)=>p>=0&&p<=50?(START[c]+p)%52:-1;
const ludoLegal=(g,c,r)=>g.pos[c].map((p,i)=>ludoDest(p,r)!==null?i:-1).filter(i=>i>=0);
function ludoCaptures(g,c,np){
 const cl=ludoCell(c,np);if(cl<0||SAFE.has(cl))return[];
 const out=[];
 for(const o of g.cols)if(o!==c){
  const here=[];g.pos[o].forEach((q,k)=>{if(ludoCell(o,q)===cl)here.push([o,k])});
  if(here.length>=2)continue;
  out.push(...here)
 }
 return out
}
const ludoCur=g=>g.cols[g.turn];
function ludoNext(g){do g.turn=(g.turn+1)%g.cols.length;while(g.ranks.includes(ludoCur(g)))}
function ludoFinishTurn(st,extra=false){
 const g=st.game,c=ludoCur(g);g.roll=null;if(g.ranks.includes(c))extra=false;
 if(!extra){g.sixes=0;ludoNext(g)}
 st.phase='roll';st.message=(extra?c:ludoCur(g))+(extra?' rolls again':' to roll');return st
}
function applyLudo(st,color,kind,payload){
 const g=st.game;if(g.over)throw new Error('Match is finished');const c=ludoCur(g);if(color!==c)throw new Error('Wait for your turn');
 if(kind==='roll'){
  if(st.phase!=='roll'||g.roll!=null)throw new Error('Dice is not ready');
  const r=crypto.randomInt(1,7);g.roll=r;g.sixes=r===6?g.sixes+1:0;
  if(g.sixes>=3){st.message='Three 6s in a row - turn lost';return ludoFinishTurn(st,false)}
  const moves=ludoLegal(g,c,r);if(!moves.length){st.message=c+' rolled '+r+' - no move';return ludoFinishTurn(st,false)}
  st.phase='move';st.message=c+' rolled '+r+' - choose a token';return st
 }
 if(kind==='move'){
  if(st.phase!=='move'||!g.roll)throw new Error('Roll first');
  const i=Math.floor(+payload.token);if(i<0||i>3||!ludoLegal(g,c,g.roll).includes(i))throw new Error('That token cannot move');
  const r=g.roll,np=ludoDest(g.pos[c][i],r);g.pos[c][i]=np;let extra=r===6;
  const caps=ludoCaptures(g,c,np);if(caps.length){caps.forEach(([o,k])=>g.pos[o][k]=-1);extra=true}
  if(np===56)extra=true;
  if(g.pos[c].every(p=>p===56)&&!g.ranks.includes(c))g.ranks.push(c);
  const left=g.cols.filter(x=>!g.ranks.includes(x));
  if(left.length<=1){if(left[0])g.ranks.push(left[0]);g.over=true;g.roll=null;st.phase='over';st.message=(g.ranks[0]||c)+' wins';return st}
  return ludoFinishTurn(st,extra)
 }
 throw new Error('Unknown Ludo action')
}

/* UNO: one-card draw, no stacking, Draw Four only when no current-color card is held. */
const unoTop=g=>g.disc[g.disc.length-1];
const unoCur=g=>g.players[g.turn];
function unoAdvance(g,n=1){for(let i=0;i<n;i++)g.turn=(g.turn+g.dir+g.players.length)%g.players.length}
function unoCanPlay(g,p,card,index){
 if(!card)return false;
 if(g.drew&&index!==g.drawnIndex)return false;
 const top=unoTop(g);
 if(card.v==='F'&&p.hand.some((x,i)=>i!==index&&x.c===g.color))return false;
 return card.c==='w'||card.c===g.color||card.v===top.v
}
function unoMessage(st){const p=unoCur(st.game);st.message=p.col+(st.game.drew?' may play the drawn card or pass':' to play');return st}
function applyUno(st,color,kind,payload){
 const g=st.game;if(g.over)throw new Error('Match is finished');const p=unoCur(g);if(!p||p.col!==color)throw new Error('Wait for your turn');
 if(kind==='draw'){
  if(g.drew)throw new Error('Play the drawn card or pass');
  const card=unoDrawOne(g,p);if(!card)throw new Error('No cards left to draw');
  const i=p.hand.length-1;
  if(unoCanPlay(g,p,card,i)){g.drew=true;g.drawnIndex=i;return unoMessage(st)}
  g.drew=false;g.drawnIndex=-1;unoAdvance(g);return unoMessage(st)
 }
 if(kind==='pass'){
  if(!g.drew)throw new Error('Draw a card before passing');
  g.drew=false;g.drawnIndex=-1;unoAdvance(g);return unoMessage(st)
 }
 if(kind==='play'){
  const i=Math.floor(+payload.card),card=p.hand[i];
  if(!Number.isInteger(i)||i<0||i>=p.hand.length||!unoCanPlay(g,p,card,i))throw new Error('That card cannot be played');
  if(card.c==='w'&&!UNO_COLORS.includes(payload.color))throw new Error('Choose a color');
  p.hand.splice(i,1);g.disc.push(card);g.color=card.c==='w'?payload.color:card.c;g.drew=false;g.drawnIndex=-1;
  if(!p.hand.length){g.over=true;g.winner=p.col;st.phase='over';st.message=p.col+' wins';return st}
  if(card.v==='S'){unoAdvance(g,2)}
  else if(card.v==='R'){g.dir*=-1;unoAdvance(g,g.players.length===2?2:1)}
  else if(card.v==='D'){unoAdvance(g);unoDrawN(g,unoCur(g),2);unoAdvance(g)}
  else if(card.v==='F'){unoAdvance(g);unoDrawN(g,unoCur(g),4);unoAdvance(g)}
  else unoAdvance(g);
  return unoMessage(st)
 }
 throw new Error('Unknown UNO action')
}

export function applyAction(state,color,kind,payload={}){
 const st=structuredClone(state),g=st.game;if(!g)throw new Error('Match state is missing');
 return g.kind==='uno'?applyUno(st,color,kind,payload):applyLudo(st,color,kind,payload)
}

export const currentColor=state=>{
 const g=state&&state.game;if(!g)return null;
 return g.kind==='uno'?(g.players[g.turn]&&g.players[g.turn].col):ludoCur(g)
};

export function publicState(state,viewerColor){
 const st=structuredClone(state),g=st&&st.game;if(!g||g.kind!=='uno')return st;
 g.players=g.players.map(p=>({col:p.col,hand:p.col===viewerColor?p.hand:[],handCount:p.hand.length}));
 g.deckCount=g.deck.length;g.deck=[];
 g.disc=g.disc.length?[g.disc[g.disc.length-1]]:[];
 return st
}
