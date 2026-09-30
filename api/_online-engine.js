import crypto from 'node:crypto';
const COLORS=['red','green','yellow','blue'],START={red:0,green:13,yellow:26,blue:39},SAFE=new Set([0,8,13,21,26,34,39,47]);
const colsFor=n=>n===2?['red','yellow']:n===3?['red','green','yellow']:COLORS.slice();
export function newOnlineState(n,variant='classic'){
 const cols=colsFor(n),pos=Object.fromEntries(COLORS.map(c=>[c,[-1,-1,-1,-1]]));
 if(variant==='quick')cols.forEach(c=>{pos[c][2]=56;pos[c][3]=56});
 if(variant==='rush')cols.forEach(c=>{pos[c]=[0,0,0,0]});
 const game={cols,pos,turn:0,roll:null,sixes:0,ranks:[],bots:[],cards:{},shield:{},skip:null,peace:0,tc:0,rep:[],secretPowers:{},matchPower:{},mx:{helper:{}},variant,online:1};
 return {game,phase:'roll',message:cols[0]+' to roll'}
}
const dest=(p,r)=>p<0?(r===6?0:null):p>=56?null:(p+r<=56?p+r:null);
const cell=(c,p)=>p>=0&&p<=50?(START[c]+p)%52:-1;
const legal=(g,c,r)=>g.pos[c].map((p,i)=>dest(p,r)!==null?i:-1).filter(i=>i>=0);
function captures(g,c,np){const cl=cell(c,np);if(cl<0||SAFE.has(cl))return[];const out=[];for(const o of g.cols)if(o!==c){const here=[];g.pos[o].forEach((q,k)=>{if(cell(o,q)===cl)here.push([o,k])});if(here.length>=2)continue;out.push(...here)}return out}
const cur=g=>g.cols[g.turn];
function next(g){do g.turn=(g.turn+1)%g.cols.length;while(g.ranks.includes(cur(g)))}
function finishTurn(st,extra=false){const g=st.game,c=cur(g);g.roll=null;if(g.ranks.includes(c))extra=false;if(!extra){g.sixes=0;next(g);g.tc=(g.tc||0)+1}st.phase='roll';st.message=(extra?c:cur(g))+(extra?' rolls again':' to roll');return st}
export function applyAction(state,color,kind,payload={}){
 const st=structuredClone(state),g=st.game;if(!g||g.over)throw new Error('Match is finished');const c=cur(g);if(color!==c)throw new Error('Wait for your turn');
 if(kind==='roll'){
  if(st.phase!=='roll'||g.roll!=null)throw new Error('Dice is not ready');const r=crypto.randomInt(1,7);g.roll=r;g.sixes=r===6?g.sixes+1:0;
  if(g.sixes>=3){st.message='Three 6s in a row - turn lost';return finishTurn(st,false)}
  const moves=legal(g,c,r);if(!moves.length){st.message=c+' rolled '+r+' - no move';return finishTurn(st,false)}
  st.phase='move';st.message=c+' rolled '+r+' - choose a token';return st
 }
 if(kind==='move'){
  if(st.phase!=='move'||!g.roll)throw new Error('Roll first');const i=Math.floor(+payload.token);if(i<0||i>3||!legal(g,c,g.roll).includes(i))throw new Error('That token cannot move');const r=g.roll,np=dest(g.pos[c][i],r);g.pos[c][i]=np;let extra=r===6;
  const caps=captures(g,c,np);if(caps.length){caps.forEach(([o,k])=>g.pos[o][k]=-1);extra=true}
  if(np===56)extra=true;if(g.pos[c].every(p=>p===56)&&!g.ranks.includes(c))g.ranks.push(c);
  const left=g.cols.filter(x=>!g.ranks.includes(x));if(left.length<=1){if(left[0])g.ranks.push(left[0]);g.over=true;g.roll=null;st.phase='over';st.message=(g.ranks[0]||c)+' wins';return st}
  return finishTurn(st,extra)
 }
 throw new Error('Unknown action')
}
export const currentColor=state=>state&&state.game?cur(state.game):null;
