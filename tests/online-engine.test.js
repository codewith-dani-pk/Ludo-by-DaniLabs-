import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAction,newOnlineState,publicState,currentColor,rememberAction,hasAction,timeoutAction} from '../api/_online-engine.js';

test('online Color Cards isolates private hands and draw-pile order',()=>{
 const st=newOnlineState(2,'color-cards'),me=currentColor(st),view=publicState(st,me);
 assert.equal(view.game.kind,'color-cards');
 assert.equal(view.game.players.find(p=>p.id===me).hand.length,7);
 assert.equal(view.game.players.find(p=>p.id!==me).hand.length,0);
 assert.equal(view.game.players.find(p=>p.id!==me).handCount,7);
 assert.equal(view.game.drawPile.length,0);
 assert.ok(view.game.drawCount>0);
});

test('public reconnect view can be regenerated without mutating authoritative state',()=>{
 const st=newOnlineState(3,'color-cards'),before=st.game.drawPile.length,viewer=currentColor(st);
 const a=publicState(st,viewer),b=publicState(st,viewer);
 assert.deepEqual(a,b);assert.equal(st.game.drawPile.length,before);assert.equal(a.game.players.find(p=>p.id===viewer).hand.length,7);
});

test('online action IDs are remembered and deduplicatable',()=>{
 const st=newOnlineState(2,'classic');rememberAction(st,'action_12345');assert.equal(hasAction(st,'action_12345'),true);rememberAction(st,'action_12345');assert.equal(st.meta.recentActionIds.filter(x=>x==='action_12345').length,1);
});

test('online Ludo uses authoritative dice/move state',()=>{
 const st=newOnlineState(2,'classic'),c=currentColor(st);const rolled=applyAction(st,c,'roll');assert.ok([1,2,3,4,5,6].includes(rolled.game.roll)||rolled.game.phase==='roll');if(rolled.game.phase==='move'){const moved=applyAction(rolled,c,'move',{token:0});assert.ok(moved.game.players[0].pawns[0].progress>=0)}
});

test('expired online turn uses a server-controlled legal fallback',()=>{
 const st=newOnlineState(2,'classic');st.meta.deadlineAt=new Date(Date.now()-1000).toISOString();const out=timeoutAction(st);assert.notEqual(out.meta.deadlineAt,st.meta.deadlineAt);assert.ok(['roll','move','over'].includes(out.game.phase));
});

test('timeout cannot be forced before deadline',()=>{
 const st=newOnlineState(2,'classic');assert.throws(()=>timeoutAction(st),/has not expired/);
});

test('authoritative engine counts mission events and redacts counters',()=>{
 const l=newOnlineState(2,'classic'),lc=currentColor(l),lp=l.game.players.find(p=>p.id===lc).pawns[0];lp.progress=56;lp.state='home';l.game.phase='move';l.game.roll=1;const lm=applyAction(l,lc,'move',{token:0});assert.equal(lm.meta.rewardMetrics[lc].ludoFinishes,1);assert.equal(publicState(lm,lc).meta.rewardMetrics,undefined);
 const st=newOnlineState(2,'color-cards'),cc=currentColor(st),p=st.game.players.find(x=>x.id===cc),top=st.game.discard.at(-1);p.hand[0]={id:'mission-action',color:top.color,value:'skip'};const out=applyAction(st,cc,'play',{card:0});assert.equal(out.meta.rewardMetrics[cc].cardActions,1);
});
