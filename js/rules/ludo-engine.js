(function(root){
'use strict';
const COLORS=['red','green','yellow','blue'];
const START={red:0,green:13,yellow:26,blue:39};
const SAFE=[0,8,13,21,26,34,39,47];
const TRACK=[[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
const HOME={red:[[7,1],[7,2],[7,3],[7,4],[7,5]],green:[[1,7],[2,7],[3,7],[4,7],[5,7]],yellow:[[7,13],[7,12],[7,11],[7,10],[7,9]],blue:[[13,7],[12,7],[11,7],[10,7],[9,7]]};
const colorsFor=n=>n===2?['red','yellow']:n===3?['red','green','yellow']:COLORS.slice();
const clone=x=>JSON.parse(JSON.stringify(x));
function pawn(owner,index){return{id:owner+'-'+(index+1),owner,state:'yard',progress:-1}}
function syncPawn(p){p.state=p.progress<0?'yard':p.progress<=50?'track':p.progress<=55?'home':p.progress===56?'finished':'yard';return p}
function newGame(n=2,players=[]){if(![2,3,4].includes(n))throw Error('Ludo supports 2-4 players');const colors=colorsFor(n);return{kind:'ludo',rulesVersion:1,colors,players:colors.map((color,i)=>({id:players[i]?.id||color,name:players[i]?.name||color,color,type:players[i]?.type||'human',pawns:[0,1,2,3].map(k=>pawn(color,k))})),turn:0,phase:'roll',roll:null,consecutiveSixes:0,winner:null,history:[],paused:false}}
const current=g=>g.players[g.turn];
const globalCell=(color,progress)=>progress>=0&&progress<=50?(START[color]+progress)%52:null;
function destination(pawn,roll){if(pawn.state==='finished')return null;if(pawn.state==='yard')return roll===6?0:null;const d=pawn.progress+roll;return d<=56?d:null}
function legalMoves(g,roll=g.roll){if(!roll||g.winner)return[];return current(g).pawns.filter(p=>destination(p,roll)!==null).map(p=>p.id)}
function capturesAt(g,mover,dest){const cell=globalCell(mover.color,dest);if(cell==null||SAFE.includes(cell))return[];const out=[];for(const pl of g.players)if(pl.color!==mover.color)for(const p of pl.pawns)if(globalCell(pl.color,p.progress)===cell)out.push(p);return out}
function endTurn(g){g.roll=null;g.consecutiveSixes=0;g.turn=(g.turn+1)%g.players.length;g.phase='roll'}
function roll(g,value){if(g.winner)throw Error('Match is finished');if(g.paused)throw Error('Match is paused');if(g.phase!=='roll'||g.roll!=null)throw Error('You cannot roll now');if(!Number.isInteger(value)||value<1||value>6)throw Error('Invalid dice result');g.roll=value;g.consecutiveSixes=value===6?g.consecutiveSixes+1:0;g.history.push({type:'roll',player:current(g).id,value});if(g.consecutiveSixes===3){g.history.push({type:'turn-end',reason:'third-six'});endTurn(g);return{event:'third-six',legal:[]}}const legal=legalMoves(g,value);if(!legal.length){g.history.push({type:'no-move',player:current(g).id,value});if(value===6){g.roll=null;g.phase='roll'}else endTurn(g);return{event:'no-move',legal:[]}}g.phase='move';return{event:'rolled',legal}}
function move(g,pawnId){if(g.winner)throw Error('Match is finished');if(g.phase!=='move'||!g.roll)throw Error('Roll before moving');const pl=current(g),p=pl.pawns.find(x=>x.id===pawnId);if(!p)throw Error('Select one of your pawns');if(!legalMoves(g).includes(pawnId))throw Error('That pawn has no legal move');const r=g.roll,d=destination(p,r),from=p.progress;p.progress=d;syncPawn(p);const captured=capturesAt(g,pl,d);captured.forEach(x=>{x.progress=-1;syncPawn(x)});const finished=d===56;if(pl.pawns.every(x=>x.state==='finished'))g.winner=pl.id;g.history.push({type:'move',player:pl.id,pawn:p.id,from,to:d,roll:r,captured:captured.map(x=>x.id),finished});g.roll=null;if(g.winner){g.phase='over';return{event:'win',winner:g.winner,captured:captured.map(x=>x.id),finished}}const bonus=r===6||captured.length>0||finished;if(bonus){g.phase='roll'}else endTurn(g);return{event:'moved',bonus,captured:captured.map(x=>x.id),finished}}
function apply(state,action){const g=clone(state);if(action.type==='roll')roll(g,action.value);else if(action.type==='move')move(g,action.pawnId);else if(action.type==='pause')g.paused=!!action.value;else throw Error('Unknown Ludo action');return g}
function view(g){return clone(g)}
function coord(color,progress){if(progress<0||progress>56)return null;if(progress<=50)return TRACK[(START[color]+progress)%52];if(progress<=55)return HOME[color][progress-51];return[7,7]}
function validate(g){for(const pl of g.players)for(const p of pl.pawns)syncPawn(p);return g}
root.LudoRules=Object.freeze({COLORS,START,SAFE,TRACK,HOME,colorsFor,newGame,current,globalCell,destination,legalMoves,capturesAt,roll,move,apply,view,coord,validate,syncPawn});
})(globalThis);
