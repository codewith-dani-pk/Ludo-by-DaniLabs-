'use strict';
/* DaniLabs match-room presentation. No rules, odds or private settings are changed here. */
(function(){
const AV=['🦊','🐼','🦁','🐙','🚀','👑'];
const AV_POOL=['🐯','🐵','🐰','🐻','🐨','🐺','🐱','🐶','🐸','🐧','🦉','🦅','🦄','🤖','👽','🐲','🦋','🐬'];
let lastGame=null,lastTurn='',lastPos={},lastRoll={},rollHistory={};
const prof=()=>Object.assign({name:'Guest player',av:0},Store.get('ldb_prof',{}));
const DEFAULT_NAME={red:'Red',green:'Green',yellow:'Yellow',blue:'Blue'};
const humanName=c=>NAMES[c]!==DEFAULT_NAME[c]?NAMES[c]:(c==='red'?(prof().name||'Guest player'):(NAMES[c]+' player'));
const displayName=c=>isBot(c)?NAMES[c]+' Bot':humanName(c),safeText=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function ensureRoomAvatars(){if(!G)return{};G.uiAvatars=G.uiAvatars||{};const used=new Set(Object.values(G.uiAvatars));let changed=false;G.cols.forEach(c=>{if(c==='red'&&!isBot(c))return;if(!G.uiAvatars[c]){const choices=AV_POOL.filter(a=>!used.has(a)),a=(choices.length?choices:AV_POOL)[Math.floor(Math.random()*(choices.length||AV_POOL.length))];G.uiAvatars[c]=a;used.add(a);changed=true}});if(changed)saveG();return G.uiAvatars}
const playerAvatar=c=>c==='red'&&!isBot(c)&&(!G.online||!window.OnlinePlay||OnlinePlay.myColor()===c)?AV[(prof().av||0)%AV.length]:(ensureRoomAvatars()[c]||'🎮');
function playerToolsHTML(c){return '<div class="player-tools"><div class="player-react-wrap"><button type="button" class="player-react-btn" data-player-react="'+c+'" aria-label="'+NAMES[c]+' reactions">☺</button><div class="player-reaction-tray" data-player-reaction-tray="'+c+'" hidden><button type="button" aria-label="Thumbs up">👍</button><button type="button" aria-label="Laugh">😂</button><button type="button" aria-label="Celebrate">🎉</button><button type="button" aria-label="Surprised">😮</button><button type="button" aria-label="Applause">👏</button></div></div></div><div class="player-reaction-pop" data-player-reaction-pop="'+c+'" aria-live="polite"></div>'}
const targetTokens=()=>G&&G.variant==='quick'?2:4;
const homeCount=c=>G?G.pos[c].slice(0,targetTokens()).filter(p=>p===56).length:0;
const progressPct=c=>{if(!G)return 0;const a=G.pos[c].slice(0,targetTokens()),max=57*a.length,done=a.reduce((n,p)=>n+(p<0?0:Math.min(57,p+1)),0);return max?Math.round(done/max*100):0};
const MINI_PIPS=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
const miniFace=n=>'<span class="mini-die-face">'+Array.from({length:9},(_,i)=>'<i'+(MINI_PIPS[n].includes(i)?' class="p"':'')+'></i>').join('')+'</span>';
function playerDieHTML(c){const mine=!G.online||!window.OnlinePlay||OnlinePlay.myColor()===c,active=c===cur()&&!G.over,canRoll=active&&mine&&phase==='roll'&&!busy&&!isBot(c),rolling=active&&busy&&phase==='roll',n=(active&&G.roll)||lastRoll[c]||1;const face=miniFace(n);return '<button type="button" class="player-die '+(active?'active ':'')+(canRoll?'can-roll ':'')+(rolling?'rolling ':'')+(isBot(c)?'bot-die':'')+'" data-player-die="'+c+'" aria-label="'+NAMES[c]+' dice'+(canRoll?' — tap to roll':'')+'" '+(canRoll?'':'disabled')+'>'+face+'<small>'+(rolling?'ROLLING':canRoll?'ROLL':active&&isBot(c)?'BOT':'DICE')+'</small></button>'}
const historyHTML=c=>{const h=(rollHistory[c]||[]).slice(-3);return '<div class="roll-history" aria-label="'+NAMES[c]+' recent rolls">'+(h.length?h.map((n,i)=>'<span class="'+(i===h.length-1?'latest':'')+'">'+n+'</span>').join(''):'<span class="empty">–</span>')+'</div>'};
function paintPlayerDice(n){
 if(!G)return;const c=cur(),d=document.querySelector('[data-player-die="'+c+'"] .mini-die-face');if(!d)return;
 d.innerHTML=Array.from({length:9},(_,i)=>'<i'+(MINI_PIPS[n].includes(i)?' class="p"':'')+'></i>').join('');
 const b=d.closest('.player-die');if(b){b.classList.remove('dice-pop');void b.offsetWidth;b.classList.add('dice-pop')}
}

function playerHTML(c){
 const rank=G.ranks.indexOf(c),active=c===cur()&&!G.over,done=rank>=0,mine=!isBot(c)&&(!G.online||!window.OnlinePlay||OnlinePlay.myColor()===c),pct=done?100:progressPct(c);
 const stat=done?'#'+(rank+1)+' FINISH':pct+'%';
 const progress='<div class="player-progress" aria-label="'+pct+' percent progress"><i style="width:'+pct+'%"></i><span>'+homeCount(c)+'/'+targetTokens()+' home</span></div>';
 return '<article class="room-player '+(active?'active ':'')+(active&&mine?'mine-turn ':'')+(done?'finished ':'')+'" style="--pc:'+HEX[c]+'" data-player="'+c+'">'+
 '<div class="room-avatar" aria-hidden="true">'+playerAvatar(c)+'</div><div class="room-player-copy"><b>'+safeText(displayName(c))+'</b><small>'+(isBot(c)?'Computer':G.online?'Online player':'Local player')+'</small>'+progress+historyHTML(c)+'</div><div class="room-score"><b>'+stat+'</b><small>'+(active?'playing':done?'ranked':'progress')+'</small></div>'+playerToolsHTML(c)+playerDieHTML(c)+'</article>';
}
function placePanels(){if(!G)return;const top=$('#playersTop'),bottom=$('#playersBottom');if(!top||!bottom)return;
 const has=c=>G.cols.includes(c);let a=[],b=[];
 if(G.cols.length===2){a=has('red')?['red']:[G.cols[0]];b=G.cols.filter(c=>!a.includes(c))}
 else{a=['red','green'].filter(has);b=['blue','yellow'].filter(has);G.cols.forEach(c=>{if(!a.includes(c)&&!b.includes(c))b.push(c)})}
 top.innerHTML=a.map(playerHTML).join('');bottom.innerHTML=b.map(playerHTML).join('');
 top.className='room-players room-players-top'+(a.length===1?' single-left':'');
 bottom.className='room-players room-players-bottom'+(b.length===1?' single-right':'');
}
function publicTurn(){if(!G)return['Ready','Roll to begin'];const c=cur(),name=displayName(c),mine=!isBot(c)&&(!G.online||!window.OnlinePlay||OnlinePlay.myColor()===c);
 if(G.over)return['Match complete','Final ranking'];
 if(busy||phase==='wait')return[name+' is moving','Pawn in motion'];
 if(isBot(c))return[name+"'s turn",phase==='move'?'Computer is choosing':'Computer is rolling'];
 if(G.online&&!mine)return[name+"'s turn",'Waiting for '+name];
 if(phase==='move')return[name+"'s turn",'Choose a glowing pawn'];
 return[name+"'s turn",S.shake?'Tap dice or shake phone':'Roll the dice'];
}
function decorateTurn(){if(!G)return;const c=cur(),banner=$('#turnBanner'),[title,sub]=publicTurn();
 document.documentElement.style.setProperty('--turn',HEX[c]);if(banner)banner.style.setProperty('--pc',HEX[c]);
 if($('#turnTitle'))$('#turnTitle').textContent=title;if($('#turnSub'))$('#turnSub').textContent=sub;
 const savedMode=Store.get('ldb_mode',G.variant||'classic'),mode=G.online?(G.variant||'classic'):(G.variant||savedMode||'classic');if($('#roomMode'))$('#roomMode').textContent=String(mode).toUpperCase();const meta=document.querySelector('.game-room-meta');if(meta){const a=meta.querySelector(':scope>span'),z=meta.querySelector(':scope>i');if(a)a.textContent=G.online?'ONLINE MATCH':'OFFLINE MATCH';if(z)z.textContent=G.online?'LIVE':'LOCAL'}
 const order=$('#turnOrder');if(order)order.innerHTML=G.cols.map(x=>'<i class="'+(x===c?'on':'')+(G.ranks.includes(x)?' done':'')+'" style="--oc:'+HEX[x]+'" title="'+NAMES[x]+'"></i>').join('<span>›</span>');
 const rb=$('#bRoll');if(rb){const sp=rb.querySelector('span'),sm=$('#rollHint');let main='Roll dice',hint='Tap to roll';
  if(isBot(c)){main='Bot turn';hint=busy?'Rolling…':'Thinking…'}else if(phase==='move'){main='Choose pawn';hint='Tap a glowing pawn'}else if(busy){main='Rolling…';hint='Dice in motion'}
  if(sp)sp.textContent=main;if(sm)sm.textContent=hint;
 }
 if(lastTurn&&lastTurn!==c&&banner){banner.classList.remove('turn-change');void banner.offsetWidth;banner.classList.add('turn-change');setTimeout(()=>banner.classList.remove('turn-change'),420)}lastTurn=c;
}
function animatePositions(){if(!G)return;const fresh=G!==lastGame;if(fresh){lastGame=G;lastPos={};lastRoll={};rollHistory={};G.cols.forEach(c=>G.pos[c].forEach((p,i)=>lastPos[c+i]=p));return}
 G.cols.forEach(c=>G.pos[c].forEach((p,i)=>{const k=c+i,prev=lastPos[k],t=T[k];if(t&&prev!==undefined&&prev!==p){t.classList.remove('room-hop','room-finish');void t.offsetWidth;t.classList.add(p===56?'room-finish':'room-hop');if(p===56){buzz(55);setTimeout(()=>t.classList.remove('room-finish'),560)}else setTimeout(()=>t.classList.remove('room-hop'),260)}lastPos[k]=p}))
}
function roomPaint(){if(!G)return;placePanels();decorateTurn();animatePositions();const legacy=$('#cards');if(legacy)legacy.innerHTML='';const oldReact=$('#reactionTray');if(oldReact)oldReact.hidden=true}
const baseFace=face;face=function(n,dim){const out=baseFace(n,dim);if(G&&n>0)paintPlayerDice(n);return out};
const baseRender=render;render=function(){baseRender();roomPaint()};
const baseSettle=settle;settle=async function(c,r,again){lastRoll[c]=r;rollHistory[c]=(rollHistory[c]||[]).concat(r).slice(-3);buzz(r===6?48:28);return baseSettle(c,r,again)};
const baseOver=over;over=function(){const winner=G&&G.ranks&&G.ranks[0];const out=baseOver();if(winner){const n=displayName(winner);if($('#victoryTitle'))$('#victoryTitle').textContent=n+' wins!';if($('#victorySub'))$('#victorySub').textContent='DaniLabs match complete · '+NAMES[winner]+' takes 1st place'}return out};
document.addEventListener('click',e=>{const d=e.target.closest('[data-player-die]');if(!d||!G)return;const c=d.dataset.playerDie;if(c!==cur()||isBot(c)||busy||phase!=='roll'||G.over)return;Snd.play('tap');doRoll()});
/* Local reaction controls. */
document.addEventListener('click',e=>{const rb=e.target.closest('[data-player-react]');if(rb){const c=rb.dataset.playerReact;document.querySelectorAll('[data-player-reaction-tray]').forEach(x=>{if(x.dataset.playerReactionTray!==c)x.hidden=true});const tr=document.querySelector('[data-player-reaction-tray="'+c+'"]');if(tr){tr.hidden=!tr.hidden;Snd.play('tap')}return}const em=e.target.closest('[data-player-reaction-tray] button');if(em){const tr=em.closest('[data-player-reaction-tray]'),c=tr.dataset.playerReactionTray;tr.hidden=true;const p=document.querySelector('[data-player-reaction-pop="'+c+'"]');if(p){p.textContent=em.textContent;p.classList.remove('on');void p.offsetWidth;p.classList.add('on');setTimeout(()=>p.classList.remove('on'),1300)}Snd.play('tap');buzz(18);return}if(!e.target.closest('[data-player-reaction-tray]'))document.querySelectorAll('[data-player-reaction-tray]').forEach(x=>x.hidden=true)});
document.addEventListener('danilabs-profile',()=>{if(G&&$('#game').classList.contains('on'))placePanels()});
})();
