import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAction,newOnlineState,publicState,currentColor} from '../api/_online-engine.js';

test('UNO deals seven cards and hides opponent hands',()=>{
 const st=newOnlineState(2,'uno');
 assert.equal(st.game.kind,'uno');
 assert.equal(st.game.players[0].hand.length,7);
 assert.equal(st.game.players[1].hand.length,7);
 const view=publicState(st,'red');
 assert.equal(view.game.players[0].hand.length,7);
 assert.equal(view.game.players[1].hand.length,0);
 assert.equal(view.game.players[1].handCount,7);
 assert.equal(view.game.deck.length,0);
 assert.ok(view.game.deckCount>0);
});

test('UNO Wild Draw Four is rejected when current color is held',()=>{
 const st={phase:'play',message:'',game:{kind:'uno',players:[{col:'red',hand:[{c:'r',v:'5'},{c:'w',v:'F'}]},{col:'yellow',hand:[{c:'b',v:'2'}]}],deck:[{c:'g',v:'1'}],disc:[{c:'r',v:'9'}],turn:0,dir:1,color:'r',drew:false,drawnIndex:-1,over:false,winner:null,online:1}};
 assert.throws(()=>applyAction(st,'red','play',{card:1,color:'b'}),/cannot be played/);
});

test('UNO Draw Two makes the next player draw and skips them',()=>{
 const st={phase:'play',message:'',game:{kind:'uno',players:[{col:'red',hand:[{c:'r',v:'D'},{c:'g',v:'1'}]},{col:'yellow',hand:[{c:'b',v:'2'}]}],deck:[{c:'g',v:'4'},{c:'y',v:'3'},{c:'b',v:'8'}],disc:[{c:'r',v:'9'}],turn:0,dir:1,color:'r',drew:false,drawnIndex:-1,over:false,winner:null,online:1}};
 const out=applyAction(st,'red','play',{card:0});
 assert.equal(out.game.players[1].hand.length,3);
 assert.equal(currentColor(out),'red');
});

test('Ludo online move uses standard yard and exact-finish rules',()=>{
 const st={phase:'move',message:'',game:{kind:'ludo',cols:['red','yellow'],pos:{red:[-1,-1,-1,-1],yellow:[-1,-1,-1,-1],green:[-1,-1,-1,-1],blue:[-1,-1,-1,-1]},turn:0,roll:6,sixes:1,ranks:[],bots:[],variant:'classic',online:1}};
 const out=applyAction(st,'red','move',{token:0});
 assert.equal(out.game.pos.red[0],0);
 assert.equal(currentColor(out),'red');
});
