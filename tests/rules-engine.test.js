import test from 'node:test';
import assert from 'node:assert/strict';
await import('../js/rules/ludo-engine.js');
await import('../js/rules/color-cards-engine.js');
const L=globalThis.LudoRules,C=globalThis.ColorCardsRules;
const fixed=()=>0.314159;
const game=(n=2)=>L.newGame(n,L.colorsFor(n).map(id=>({id,name:id,type:'human'})));

test('Ludo board map has 52 explicit outer coordinates, opposite two-player colors and eight safe cells',()=>{
 assert.equal(L.TRACK.length,52);assert.equal(new Set(L.TRACK.map(x=>x.join(','))).size,52);
 assert.deepEqual(L.colorsFor(2),['red','yellow']);assert.deepEqual(L.SAFE,[0,8,13,21,26,34,39,47]);
 assert.deepEqual(L.coord('red',0),L.TRACK[0]);assert.deepEqual(L.coord('green',0),L.TRACK[13]);
 assert.deepEqual(L.coord('red',51),L.TRACK[51]);assert.deepEqual(L.coord('red',52),L.HOME.red[0]);assert.deepEqual(L.coord('red',57),[7,7]);
});

test('Ludo exact finish rejects overshoot and accepts exact roll',()=>{
 const g=game();const p=g.players[0].pawns[0];p.progress=56;L.syncPawn(p);
 L.roll(g,2);assert.equal(g.phase,'roll');assert.equal(g.turn,1);
 const h=game();const q=h.players[0].pawns[0];q.progress=56;L.syncPawn(q);L.roll(h,1);assert.deepEqual(L.legalMoves(h),[q.id]);L.move(h,q.id);assert.equal(q.state,'finished');
});

test('Ludo captures on unsafe squares but never on safe squares',()=>{
 const g=game(),r=g.players[0],y=g.players[1];r.pawns[0].progress=6;y.pawns[0].progress=33;L.syncPawn(r.pawns[0]);L.syncPawn(y.pawns[0]);L.roll(g,1);L.move(g,r.pawns[0].id);assert.equal(y.pawns[0].progress,-1);
 const h=game(),r2=h.players[0],y2=h.players[1];r2.pawns[0].progress=7;y2.pawns[0].progress=34;L.syncPawn(r2.pawns[0]);L.syncPawn(y2.pawns[0]);L.roll(h,1);L.move(h,r2.pawns[0].id);assert.equal(y2.pawns[0].progress,34);
});

test('Ludo third consecutive six cancels only the third roll and ends sequence',()=>{
 const g=game();let x=L.roll(g,6);L.move(g,x.legal[0]);x=L.roll(g,6);L.move(g,x.legal.find(id=>id!==g.players[0].pawns[0].id)||x.legal[0]);const before=g.players[0].pawns.map(p=>p.progress);x=L.roll(g,6);assert.equal(x.event,'third-six');assert.deepEqual(g.players[0].pawns.map(p=>p.progress),before);assert.equal(g.turn,1);assert.equal(g.consecutiveSixes,0);
});

test('Ludo no-move handling advances on normal roll but preserves six bonus sequence',()=>{
 const g=game();L.roll(g,3);assert.equal(g.turn,1);
 const h=game();const p=h.players[0];p.pawns.forEach((x,i)=>{x.progress=i?57:56;L.syncPawn(x)});const out=L.roll(h,6);assert.equal(out.event,'no-move');assert.equal(h.turn,0);assert.equal(h.phase,'roll');assert.equal(h.consecutiveSixes,1);
});

test('Ludo bonus conditions grant one extra roll and friendly sharing is not a blockade',()=>{
 const g=game(),p=g.players[0];p.pawns[0].progress=5;p.pawns[1].progress=11;L.syncPawn(p.pawns[0]);L.syncPawn(p.pawns[1]);L.roll(g,6);L.move(g,p.pawns[0].id);assert.equal(p.pawns[0].progress,11);assert.equal(g.turn,0);assert.equal(g.phase,'roll');
});

test('Color Cards deck is exactly the classic 108-card composition',()=>{
 const d=C.makeDeck();assert.equal(d.length,108);assert.equal(new Set(d.map(x=>x.id)).size,108);
 for(const color of C.COLORS){assert.equal(d.filter(x=>x.color===color&&x.value==='0').length,1);for(let n=1;n<=9;n++)assert.equal(d.filter(x=>x.color===color&&x.value===String(n)).length,2);for(const a of C.ACTIONS)assert.equal(d.filter(x=>x.color===color&&x.value===a).length,2)}
 assert.equal(d.filter(x=>x.value==='wild').length,4);assert.equal(d.filter(x=>x.value==='wild4').length,4);
});

test('Color Cards opening discard is numeric and seven cards are dealt',()=>{
 const g=C.newGame(4,[],fixed);assert.ok(/^\d$/.test(C.top(g).value));assert.notEqual(C.top(g).color,'wild');assert.ok(g.players.every(p=>p.hand.length===7));assert.equal(g.drawPile.length,79);
});

test('Color Cards matches color, number/action symbol, or Wild',()=>{
 const g=C.newGame(2,[],fixed);g.discard=[{id:'t',color:'red',value:'5'}];g.activeColor='red';const p=g.players[0];
 assert.equal(C.canPlay(g,p,{id:'a',color:'red',value:'9'}),true);assert.equal(C.canPlay(g,p,{id:'b',color:'blue',value:'5'}),true);assert.equal(C.canPlay(g,p,{id:'c',color:'wild',value:'wild'}),true);assert.equal(C.canPlay(g,p,{id:'d',color:'blue',value:'7'}),false);
});

test('two-player Reverse acts like Skip and Draw Two never stacks',()=>{
 const g=C.newGame(2,[],fixed),a=g.players[0],b=g.players[1];a.hand=[{id:'r',color:'red',value:'reverse'},{id:'x',color:'blue',value:'1'}];b.hand=[{id:'b',color:'red',value:'draw2'}];g.discard=[{id:'t',color:'red',value:'4'}];g.activeColor='red';C.play(g,a.id,'r');assert.equal(C.current(g).id,a.id);
 const h=C.newGame(2,[],fixed),p=h.players[0],q=h.players[1];p.hand=[{id:'d',color:'red',value:'draw2'},{id:'x',color:'blue',value:'1'}];q.hand=[{id:'q',color:'red',value:'draw2'}];h.discard=[{id:'t',color:'red',value:'4'}];h.activeColor='red';const before=q.hand.length;C.play(h,p.id,'d',null,false,fixed);assert.equal(q.hand.length,before+2);assert.equal(C.current(h).id,p.id);
});

test('Wild Draw Four challenge succeeds on illegal play without exposing hand',()=>{
 const g=C.newGame(2,[],fixed),a=g.players[0],b=g.players[1];a.hand=[{id:'w4',color:'wild',value:'wild4'},{id:'r',color:'red',value:'2'}];b.hand=[{id:'b',color:'blue',value:'3'}];g.discard=[{id:'t',color:'red',value:'7'}];g.activeColor='red';C.play(g,a.id,'w4','blue',false,fixed);assert.equal(g.phase,'challenge');assert.equal(g.pending.legal,false);const before=a.hand.length;C.resolvePending(g,'challenge',fixed);assert.equal(a.hand.length,before+4);assert.equal(C.current(g).id,b.id);
 const view=C.publicView(g,b.id);assert.equal(view.players.find(p=>p.id===a.id).hand.length,0);
});

test('Wild Draw Four failed challenge draws six and skips challenger',()=>{
 const g=C.newGame(3,[],fixed),a=g.players[0],b=g.players[1];a.hand=[{id:'w4',color:'wild',value:'wild4'},{id:'g',color:'green',value:'2'}];g.discard=[{id:'t',color:'red',value:'7'}];g.activeColor='red';const before=b.hand.length;C.play(g,a.id,'w4','blue',false,fixed);assert.equal(g.pending.legal,true);C.resolvePending(g,'challenge',fixed);assert.equal(b.hand.length,before+6);assert.equal(C.current(g).id,g.players[2].id);
});

test('UNO catch window opens only for undeclared one-card play and closes on next action',()=>{
 const g=C.newGame(2,[],fixed),a=g.players[0],b=g.players[1];a.hand=[{id:'a',color:'red',value:'5'},{id:'x',color:'blue',value:'2'}];g.discard=[{id:'t',color:'red',value:'9'}];g.activeColor='red';C.play(g,a.id,'a',null,false,fixed);assert.equal(g.unoWindow.offender,a.id);const before=a.hand.length;C.catchUno(g,b.id,fixed);assert.equal(a.hand.length,before+2);
 const h=C.newGame(2,[],fixed),p=h.players[0];p.hand=[{id:'a',color:'red',value:'5'},{id:'x',color:'blue',value:'2'}];h.discard=[{id:'t',color:'red',value:'9'}];h.activeColor='red';C.play(h,p.id,'a',null,false,fixed);const nxt=C.current(h);C.draw(h,nxt.id,fixed);assert.equal(h.unoWindow,null);assert.throws(()=>C.catchUno(h,p.id,fixed),/no player to catch/i);
});

test('draw pile recycles all but top discard and invents no cards',()=>{
 const g=C.newGame(2,[],fixed),p=g.players[0];g.drawPile=[];g.discard=[{id:'a',color:'red',value:'1'},{id:'b',color:'blue',value:'2'},{id:'top',color:'green',value:'3'}];const got=C.drawCards(g,p,2,fixed);assert.equal(got.length,2);assert.equal(g.discard.length,1);assert.equal(g.discard[0].id,'top');
 g.drawPile=[];g.discard=[g.discard[0]];assert.equal(C.drawCards(g,p,1,fixed).length,0);
});

test('final Draw Two penalty resolves before round scoring',()=>{
 const g=C.newGame(2,[],fixed),a=g.players[0],b=g.players[1];a.hand=[{id:'d',color:'red',value:'draw2'}];b.hand=[{id:'n',color:'blue',value:'5'}];g.drawPile=[{id:'x',color:'green',value:'9'},{id:'y',color:'yellow',value:'1'}];g.discard=[{id:'t',color:'red',value:'7'}];g.activeColor='red';C.play(g,a.id,'d',null,false,fixed);assert.equal(b.hand.length,3);assert.equal(g.winner,a.id);assert.equal(a.score,15);
});

test('500-point mode preserves scores into the next round',()=>{
 const g=C.newGame(2,[{id:'a',score:490},{id:'b',score:0}],fixed,'500');g.phase='round-over';g.players[0].score=495;const n=C.nextRound(g,fixed);assert.equal(n.mode,'500');assert.equal(n.players[0].score,495);
});

test('Color Cards unresolved challenge and catch windows survive JSON save/restore',()=>{
 const g=C.newGame(2,[],fixed),a=g.players[0];a.hand=[{id:'w4save',color:'wild',value:'wild4'},{id:'redsave',color:'red',value:'2'}];g.discard=[{id:'topsave',color:'red',value:'7'}];g.activeColor='red';C.play(g,a.id,'w4save','blue',false,fixed);const restored=JSON.parse(JSON.stringify(g));assert.equal(restored.phase,'challenge');assert.equal(restored.pending.type,'wild4');assert.equal(restored.pending.legal,false);
 const h=C.newGame(2,[],fixed),p=h.players[0];p.hand=[{id:'onesave',color:'red',value:'5'},{id:'leftsave',color:'blue',value:'2'}];h.discard=[{id:'top2save',color:'red',value:'9'}];h.activeColor='red';C.play(h,p.id,'onesave',null,false,fixed);const restoredCatch=JSON.parse(JSON.stringify(h));assert.equal(restoredCatch.unoWindow.offender,p.id);assert.equal(restoredCatch.players[0].hand.length,1);
});
