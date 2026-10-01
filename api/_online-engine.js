import crypto from 'node:crypto';
import '../js/rules/ludo-engine.js';
import '../js/rules/color-cards-engine.js';
const L=globalThis.LudoRules,C=globalThis.ColorCardsRules;
const secureRand=()=>crypto.randomInt(0,0x100000000)/0x100000000;
const colors=n=>L.colorsFor(n);
const wrap=(game,message='')=>({game,phase:game.phase,message,meta:{recentActionIds:[]}});
export function newOnlineState(n,variant='classic'){
 const ids=colors(n).map(id=>({id,name:id,type:'online'}));
 return variant==='color-cards'||variant==='uno'?wrap(C.newGame(n,ids,secureRand,'round'),'Color Cards ready'):wrap(L.newGame(n,ids),'Ludo ready');
}
export const currentColor=state=>{const g=state?.game;if(!g)return null;return g.kind==='color-cards'?C.current(g)?.id:L.current(g)?.id};
function ludoAction(st,color,kind,payload){
 const g=st.game;if(L.current(g).id!==color)throw Error('Wait for your turn');
 if(kind==='roll'){const value=crypto.randomInt(1,7);L.roll(g,value)}
 else if(kind==='move'){const p=L.current(g).pawns[Number(payload.token)];if(!p)throw Error('Unknown pawn');L.move(g,p.id)}
 else throw Error('Unsupported Ludo action');
 st.phase=g.phase;st.message=g.winner?g.winner+' wins':g.phase==='move'?color+' rolled '+g.roll+' - choose a pawn':L.current(g).id+' to roll';return st
}
function cardsAction(st,color,kind,payload){
 const g=st.game,p=C.current(g);if(['play','draw','pass'].includes(kind)&&p.id!==color)throw Error('Wait for your turn');
 if(kind==='play'){const card=p.hand[Number(payload.card)];if(!card)throw Error('Unknown card');C.play(g,color,card.id,payload.color,payload.calledUno,secureRand)}
 else if(kind==='draw')C.draw(g,color,secureRand);
 else if(kind==='pass')C.pass(g,color);
 else if(kind==='color')C.resolvePending(g,payload.color,secureRand);
 else if(kind==='challenge')C.resolvePending(g,payload.choice,secureRand);
 else if(kind==='uno')C.callUno(g,color);
 else if(kind==='catch')C.catchUno(g,color,secureRand);
 else throw Error('Unsupported Color Cards action');
 st.phase=g.phase;st.message=g.winner?g.winner+' wins':g.phase==='challenge'?'Wild Draw Four: accept or challenge':g.phase==='color'?'Choose the active color':(C.current(g)?.id||'')+' to play';return st
}
export function applyAction(state,color,kind,payload={}){
 const st=structuredClone(state);if(!st?.game)throw Error('Match state is missing');
 return st.game.kind==='color-cards'?cardsAction(st,color,kind,payload):ludoAction(st,color,kind,payload);
}
export function rememberAction(state,id){if(!id)return state;state.meta=state.meta||{};const a=state.meta.recentActionIds=Array.isArray(state.meta.recentActionIds)?state.meta.recentActionIds:[];if(!a.includes(id))a.push(id);if(a.length>100)a.splice(0,a.length-100);return state}
export const hasAction=(state,id)=>!!id&&!!state?.meta?.recentActionIds?.includes(id);
export function publicState(state,viewer){
 const st=structuredClone(state);if(st?.game?.kind==='color-cards')st.game=C.publicView(st.game,viewer);return st
}
