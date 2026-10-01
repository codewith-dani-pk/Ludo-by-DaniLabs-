'use strict';
/* Color Cards UI/controller. Rules live only in js/rules/color-cards-engine.js. */
const CCR=globalThis.ColorCardsRules,CCHEX={red:'#e63946',yellow:'#f4b400',green:'#2a9d5c',blue:'#2f6fed'},CCSYM={skip:'⊘',reverse:'⇄',draw2:'+2',wild:'★',wild4:'+4'};
let CG=null,cgModalFn=null,cgOnlineWinnerShown='',cgDeclare=false,cgPassNeeded=false;
const ccRand=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296};
const ccSave=()=>{if(CG&&!CG.online)Store.set('ldb_color_cards',{game:CG.game,humans:CG.humans});else if(!CG)Store.del('ldb_color_cards')};
const ccPlayer=()=>CCR.current(CG.game),ccMine=()=>!CG.online||ccPlayer().id===CG.myColor,ccName=p=>(p.name||NAMES[p.id]||p.id)+(p.type==='bot'?' 🤖':'');
const ccCount=p=>Number.isFinite(+p.handCount)?+p.handCount:p.hand.length;
function cgStart(n){
 if(window.OnlinePlay&&OnlinePlay.prepareLocal)OnlinePlay.prepareLocal();Snd.ac();
 const bots=$('#cgBots').checked,mode=$('#cgMode')?.value||'round',ids=LudoRules.colorsFor(n);
 const players=ids.map((id,i)=>({id,name:NAMES[id],type:bots&&i>0?'bot':'human'}));
 CG={online:false,game:CCR.newGame(n,players,ccRand,mode),humans:bots?1:n,busy:false,cover:false};cgDeclare=false;ccSave();show('cg');modal('#mCg',false);cgTurn(true)
}
function cgResume(){const s=Store.get('ldb_color_cards',null);if(!s?.game)return false;CG={online:false,game:s.game,humans:s.humans||s.game.players.filter(p=>p.type!=='bot').length,busy:false,cover:false};show('cg');cgTurn(true);return true}
function cgTurn(){
 if(!CG)return;const g=CG.game;if(g.phase==='over'||g.phase==='round-over')return cgEnd();
 if(g.phase==='color')return chooseColor(col=>ccAct('color',{color:col}));
 if(g.phase==='challenge')return cgChallenge();
 const p=ccPlayer();cgDeclare=false;
 if(!CG.online&&CG.humans>1&&p.type!=='bot'){CG.cover=true;cgRender();modalCg('<h2>Pass device</h2><p>'+ccName(p)+', your hand stays hidden until you are ready.</p><button class="btn" id="cgReady">I am ready</button>',()=>{CG.cover=false;cgRender();cgHint()});return}
 CG.cover=false;cgRender();cgHint();if(!CG.online&&p.type==='bot')setTimeout(cgBot,500*S.speed)
}
function cgHint(){if(!CG)return;const g=CG.game,p=ccPlayer();if(CG.online&&p.id!==CG.myColor)return cgSay('Waiting for '+ccName(p));if(g.drawnCardId)cgSay(ccName(p)+': play only the card you drew, or Pass');else cgSay(ccName(p)+': play one card or draw one')}
const cgSay=t=>{$('#cgMsg').textContent=t||''};
function modalCg(html,fn){$('#mCgBody').innerHTML=html;cgModalFn=fn;modal('#mCg',true)}
$('#mCgBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const f=cgModalFn;if(b.dataset.col){modal('#mCg',false);f&&f(b.dataset.col)}else if(b.dataset.challenge){modal('#mCg',false);f&&f(b.dataset.challenge)}else if(b.id==='cgReady'){modal('#mCg',false);f&&f()}else if(b.id==='cgAgain'){modal('#mCg',false);cgStart(CG.game.players.length)}else if(b.id==='cgNext'){modal('#mCg',false);CG.game=CCR.nextRound(CG.game,ccRand);ccSave();cgTurn()}else if(b.id==='cgHomeB'){modal('#mCg',false);show('home');refreshHome()}})
function cardEl(c,cls){return'<button class="ucard '+(c.color==='wild'?'w':c.color)+' '+(cls||'')+'" data-card="'+c.id+'" aria-label="'+c.color+' '+(CCSYM[c.value]||c.value)+'"><span>'+(CCSYM[c.value]||c.value)+'</span></button>'}
function viewer(){return CG.online?CG.game.players.find(p=>p.id===CG.myColor):ccPlayer()}
function cgRender(){
 if(!CG)return;const g=CG.game,p=ccPlayer();$('#cgOpp').innerHTML=g.players.map((x,i)=>'<div class="chip '+(i===g.turn&&!g.winner?'act':'')+'" style="--c:'+(CCHEX[x.id]||'#8d72ff')+'">'+ccName(x)+' · '+ccCount(x)+(x.score?' · '+x.score+' pts':'')+'</div>').join('');
 const t=CCR.top(g);if(t){$('#cgTop').className='ucard '+(t.color==='wild'?'w':t.color);$('#cgTop').innerHTML='<span>'+(CCSYM[t.value]||t.value)+'</span>'}
 $('#cgCol').style.background=CCHEX[g.activeColor]||'#5b3ba8';$('#cgCol').textContent=(g.direction>0?'↻ ':'↺ ')+(g.activeColor||'');
 const dr=$('#cgDraw');dr.textContent=g.drawnCardId&&ccMine()?'Pass':'Draw';dr.disabled=CG.cover||g.phase!=='turn'||!ccMine()||p.type==='bot';
 const v=viewer(),hand=v?.hand||[];$('#cgHand').innerHTML=CG.cover?'<p class="hint">Hand hidden</p>':hand.map(card=>{const can=v===p&&ccMine()&&(!g.drawnCardId||g.drawnCardId===card.id)&&CCR.canPlay(g,v,card);return cardEl(card,can?'ok':'no')}).join('');
 $('#cgUno').disabled=CG.cover||!ccMine()||g.phase!=='turn'||p.hand.length!==2;$('#cgUno').classList.toggle('on',cgDeclare);$('#cgCatch').disabled=!g.unoWindow||g.unoWindow.offender===CG.myColor
}
function chooseColor(done){modalCg('<h2>Choose active color</h2><div class="row">'+CCR.COLORS.map(k=>'<button class="btn" data-col="'+k+'" style="background:'+CCHEX[k]+';color:#fff">'+k+'</button>').join('')+'</div>',done)}
function cgChallenge(){const g=CG.game,p=ccPlayer();if(CG.online&&p.id!==CG.myColor){cgRender();return cgSay('Waiting for Wild Draw Four decision')};modalCg('<h2>Wild Draw Four</h2><p>Accept four cards, or challenge whether the previous player had a card matching the active color.</p><div class="row"><button class="btn" data-challenge="accept">Accept</button><button class="btn ghost" data-challenge="challenge">Challenge</button></div>',choice=>ccAct('challenge',{choice}))}
function ccAct(type,payload={}){
 if(!CG)return;try{
  if(CG.online){if(type==='play'){const p=viewer(),idx=p.hand.findIndex(c=>c.id===payload.cardId);return CG.send('play',{card:idx,color:payload.color,calledUno:!!payload.calledUno})}return CG.send(type,payload)}
  const id=ccPlayer().id;if(type==='play')CCR.play(CG.game,id,payload.cardId,payload.color,payload.calledUno,ccRand);else if(type==='draw')CCR.draw(CG.game,id,ccRand);else if(type==='pass')CCR.pass(CG.game,id);else if(type==='color')CCR.resolvePending(CG.game,payload.color,ccRand);else if(type==='challenge')CCR.resolvePending(CG.game,payload.choice,ccRand);else if(type==='catch')CCR.catchUno(CG.game,payload.playerId||id,ccRand);else if(type==='uno')CCR.callUno(CG.game,id);ccSave();cgTurn()
 }catch(e){toast(e.message);cgRender()}
}
$('#cgHand').onclick=e=>{const b=e.target.closest('[data-card]');if(!b||!CG||CG.cover||!ccMine())return;const card=viewer()?.hand.find(c=>c.id===b.dataset.card);if(!card||!CCR.canPlay(CG.game,viewer(),card))return;const go=color=>ccAct('play',{cardId:card.id,color,calledUno:cgDeclare});if(card.color==='wild')chooseColor(go);else go(null)};
$('#cgDraw').onclick=()=>{if(!CG||CG.cover||!ccMine())return;ccAct(CG.game.drawnCardId?'pass':'draw')};
$('#cgUno').onclick=()=>{if(!CG||!ccMine())return;cgDeclare=!cgDeclare;toast(cgDeclare?'UNO declaration armed for this play':'UNO declaration cancelled');cgRender()};
$('#cgCatch').onclick=()=>{if(!CG||!CG.game.unoWindow)return;ccAct('catch',{playerId:CG.online?CG.myColor:ccPlayer().id})};
function cgBot(){
 if(!CG||CG.online||CG.game.phase!=='turn')return;const g=CG.game,p=ccPlayer();if(p.type!=='bot')return;
 const legal=p.hand.filter(c=>(!g.drawnCardId||g.drawnCardId===c.id)&&CCR.canPlay(g,p,c));
 if(!legal.length){ccAct(g.drawnCardId?'pass':'draw');return}
 const counts=Object.fromEntries(CCR.COLORS.map(c=>[c,p.hand.filter(x=>x.color===c).length]));
 legal.sort((a,b)=>{const val=x=>(x.value==='wild4'?7:x.value==='wild'?5:['draw2','skip','reverse'].includes(x.value)?4:0)+(x.color==='wild'?0:counts[x.color]);return val(b)-val(a)});
 const card=legal[0],color=card.color==='wild'?CCR.COLORS.slice().sort((a,b)=>counts[b]-counts[a])[0]:null;ccAct('play',{cardId:card.id,color,calledUno:p.hand.length===2})
}
function cgEnd(){cgRender();const g=CG.game,w=g.players.find(p=>p.id===(g.winner||g.roundWinner));if(!w)return;const scores=g.players.map(p=>ccName(p)+': '+p.score).join(' · ');if(g.phase==='round-over')modalCg('<h2>'+ccName(w)+' wins the round</h2><p>'+scores+'</p><button class="btn" id="cgNext">Next round</button>');else modalCg('<h2>'+ccName(w)+' wins Color Cards!</h2><p>'+scores+'</p><div class="row"><button class="btn" id="cgAgain">Play again</button><button class="btn ghost" id="cgHomeB">Home</button></div>')}
function cgApplyOnline(st,room,members,mine,send){if(!st?.game||st.game.kind!=='color-cards')return;CG={online:true,myColor:mine,send,roomId:room.id,game:st.game,humans:st.game.players.length,busy:false,cover:false};show('cg');modal('#mOnline',false);cgRender();cgHint();if(CG.game.phase==='color'&&ccMine())chooseColor(col=>ccAct('color',{color:col}));else if(CG.game.phase==='challenge')cgChallenge();if(CG.game.winner&&cgOnlineWinnerShown!==room.id+':'+CG.game.winner){cgOnlineWinnerShown=room.id+':'+CG.game.winner;cgEnd()}}
const Stats2={get:()=>Object.assign({games:0,wins:{}},Store.get('ldb_cgstats',{}))};
function cgStatsLine(){const s=Stats2.get();$('#cgStats').textContent=s.games?s.games+' Color Cards games':''}
$('#bCards').onclick=()=>{Snd.play('tap');cgStatsLine();show('cgHome')};$('#cgBack').onclick=()=>{refreshHome();show('home')};document.querySelectorAll('[data-cn]').forEach(b=>b.onclick=()=>cgStart(+b.dataset.cn));$('#cgMenu').onclick=()=>{ccSave();refreshHome();show('home')};
window.OnlineCards={applyState:cgApplyOnline,isActive:()=>!!(CG&&CG.online&&!CG.game.winner),currentColor:()=>CG?.online?CCR.current(CG.game)?.id:null,clear:()=>{if(CG?.online)CG=null},resume:cgResume};
