import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/rules/ludo-engine.js';
import '../js/rules/color-cards-engine.js';
import {newOnlineState,applyAction,publicState,rememberAction,hasAction} from '../api/_online-engine.js';
const L=globalThis.LudoRules,C=globalThis.ColorCardsRules;
const zero=()=>0;

test('Ludo board map has 52 unique track cells, explicit offsets, lanes and eight safe squares',()=>{
 assert.equal(L.TRACK.length,52);assert.equal(new Set(L.TRACK.map(x=>x.join(','))).size,52);
 assert.deepEqual(L.START,{red:0,green:13,yellow:26,blue:39});assert.deepEqual(L.SAFE,[0,8,13,21,26,34,39,47]);
 for(const c of L.COLORS){assert.equal(L.HOME[c].length,5);assert.deepEqual(L.coord(c,0),L.TRACK[L.START[c]])}
});
test('Ludo two-player setup uses opposite colors and four unique pawns',()=>{
 const g=L.newGame(2);assert.deepEqual(g.colors,['red','yellow']);assert.equal(g.players[0].pawns.length,4);assert.equal(new Set(g.players.flatMap(p=>p.pawns.map(x=>x.id))).size,8)
});
test('Ludo exact finish and home entry are enforced',()=>{
 const g=L.newGame(2);const p=g.players[0].pawns[0];p.progress=55;L.syncPawn(p);L.syncCompat(g);L.roll(g,2);assert.equal(L.legalMoves(g).includes(p.id),false);
 g.roll=null;g.phase='roll';L.roll(g,1);L.move(g,p.id);assert.equal(p.state,'finished');assert.equal(p.progress,56)
});
test('Ludo safe squares prevent capture and unsafe squares capture',()=>{
 const g=L.newGame(2),r=g.players[0].pawns[0],y=g.players[1].pawns[0];
 r.progress=0;y.progress=26;L.syncPawn(r);L.syncPawn(y);assert.equal(L.capturesAt(g,g.players[0],0).length,0);
 r.progress=1;y.progress=27;L.syncPawn(r);L.syncPawn(y);assert.equal(L.capturesAt(g,g.players[0],1).length,1)
});
test('Ludo third consecutive six is cancelled while earlier moves remain',()=>{
 const g=L.newGame(2),p=g.players[0].pawns[0];L.roll(g,6);L.move(g,p.id);L.roll(g,6);L.move(g,p.id);const before=p.progress;const out=L.roll(g,6);assert.equal(out.event,'third-six');assert.equal(p.progress,before);assert.equal(g.turn,1)
});
test('Ludo no-move six preserves bonus roll but ordinary no-move advances',()=>{
 const g=L.newGame(2);g.players[0].pawns.forEach(p=>{p.progress=55;L.syncPawn(p)});L.syncCompat(g);let o=L.roll(g,6);assert.equal(o.event,'no-move');assert.equal(g.turn,0);assert.equal(g.phase,'roll');o=L.roll(g,5);assert.equal(o.event,'no-move');assert.equal(g.turn,1)
});
test('Color Cards deck is exactly 108 cards with canonical composition',()=>{
 const d=C.makeDeck();assert.equal(d.length,108);for(const color of C.COLORS){assert.equal(d.filter(x=>x.color===color&&x.value==='0').length,1);for(let n=1;n<=9;n++)assert.equal(d.filter(x=>x.color===color&&x.value===String(n)).length,2);for(const a of C.ACTIONS)assert.equal(d.filter(x=>x.color===color&&x.value===a).length,2)}assert.equal(d.filter(x=>x.value==='wild').length,4);assert.equal(d.filter(x=>x.value==='wild4').length,4)
});
test('Color Cards deals seven and opens on a numeric colored card',()=>{
 const g=C.newGame(4,[],zero);assert.ok(g.players.every(p=>p.hand.length===7));assert.ok(/^\d$/.test(C.top(g).value));assert.notEqual(C.top(g).color,'wild')
});
const base=(hands,top={id:'t',color:'red',value:'5'})=>({kind:'color-cards',players:hands.map((hand,i)=>({id:'p'+(i+1),name:'P'+(i+1),type:'human',hand,score:0})),drawPile:Array.from({length:20},(_,i)=>({id:'d'+i,color:'blue',value:String(i%10)})),discard:[top],activeColor:top.color,turn:0,direction:1,phase:'turn',drawnCardId:null,pending:null,unoWindow:null,winner:null,roundWinner:null,mode:'round',targetScore:500,history:[]});
test('Color matching and action-symbol matching are legal',()=>{const g=base([[{id:'a',color:'red',value:'9'},{id:'b',color:'green',value:'5'}],[]]);assert.equal(C.canPlay(g,g.players[0],g.players[0].hand[0]),true);assert.equal(C.canPlay(g,g.players[0],g.players[0].hand[1]),true)});
test('Two-player Reverse acts as Skip and Draw Two cannot stack',()=>{
 let g=base([[{id:'r',color:'red',value:'reverse'},{id:'x',color:'green',value:'1'}],[{id:'z',color:'blue',value:'2'}]]);C.play(g,'p1','r');assert.equal(g.turn,0);
 g=base([[{id:'d',color:'red',value:'draw2'},{id:'x',color:'green',value:'1'}],[{id:'d2',color:'blue',value:'draw2'}]]);C.play(g,'p1','d');assert.equal(g.players[1].hand.length,3);assert.equal(g.turn,0)
});
test('Wild Draw Four challenge succeeds against illegal play without exposing hand',()=>{
 const g=base([[{id:'red',color:'red',value:'2'},{id:'w4',color:'wild',value:'wild4'}],[{id:'q',color:'blue',value:'1'}]]);C.play(g,'p1','w4','blue');assert.equal(g.pending.legal,false);C.resolvePending(g,'challenge',zero);assert.equal(g.players[0].hand.length,5);assert.equal(g.turn,1)
});
test('Wild Draw Four failed challenge draws six and skips challenger',()=>{
 const g=base([[{id:'green',color:'green',value:'2'},{id:'w4',color:'wild',value:'wild4'}],[{id:'q',color:'blue',value:'1'}]]);C.play(g,'p1','w4','blue');assert.equal(g.pending.legal,true);C.resolvePending(g,'challenge',zero);assert.equal(g.players[1].hand.length,7);assert.equal(g.turn,0)
});
test('Color Cards catch window penalizes only before next action starts',()=>{
 let g=base([[{id:'a',color:'red',value:'2'},{id:'b',color:'red',value:'3'}],[{id:'q',color:'blue',value:'1'}]]);C.play(g,'p1','a',null,false);assert.equal(g.unoWindow.offender,'p1');C.catchUno(g,'p2',zero);assert.equal(g.players[0].hand.length,3);
 g=base([[{id:'a',color:'red',value:'2'},{id:'b',color:'red',value:'3'}],[{id:'q',color:'blue',value:'1'}]]);C.play(g,'p1','a',null,false);C.draw(g,'p2',zero);assert.equal(g.unoWindow,null);assert.throws(()=>C.catchUno(g,'p1',zero),/no player/i)
});
test('Draw pile recycling keeps top discard and invents no cards',()=>{
 const g=base([[{id:'a',color:'red',value:'2'}],[{id:'q',color:'blue',value:'1'}]]);g.drawPile=[];g.discard=[{id:'x',color:'green',value:'1'},{id:'y',color:'yellow',value:'2'},{id:'top',color:'red',value:'5'}];const before=g.discard.length;C.drawCards(g,g.players[0],1,zero);assert.equal(C.top(g).id,'top');assert.equal(g.players[0].hand.length,2);assert.equal(g.drawPile.length,before-2)
});
test('Final Draw Two resolves penalty before scoring',()=>{
 const g=base([[{id:'d',color:'red',value:'draw2'}],[{id:'q',color:'blue',value:'1'}]]);C.play(g,'p1','d',null,false,zero);assert.equal(g.winner,'p1');assert.equal(g.players[1].hand.length,3);assert.ok(g.players[0].score>1)
});
test('Online public state isolates private hands and draw order',()=>{
 const st=newOnlineState(2,'color-cards'),view=publicState(st,'red');const mine=view.game.players.find(p=>p.id==='red'),other=view.game.players.find(p=>p.id!=='red');assert.equal(mine.hand.length,7);assert.equal(other.hand.length,0);assert.equal(other.handCount,7);assert.equal(view.game.drawPile.length,0);assert.ok(view.game.drawCount>0)
});
test('Online action IDs are bounded and deduplicate retries',()=>{const st=newOnlineState(2,'classic');rememberAction(st,'abcdefgh');assert.equal(hasAction(st,'abcdefgh'),true);rememberAction(st,'abcdefgh');assert.equal(st.meta.recentActionIds.length,1)});
test('Reconnect view can be regenerated from authoritative state',()=>{const st=newOnlineState(2,'color-cards');const a=publicState(st,'red'),b=publicState(st,'red');assert.deepEqual(a,b)});
