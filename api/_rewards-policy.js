export const RESET_TZ='UTC';
export const DAILY_COINS=[50,60,75,90,110,140,200];
export const COSMETICS=Object.freeze([
{id:'avatar-royal-fox',type:'avatar',name:'Royal Fox',price:300},
{id:'frame-gold',type:'frame',name:'Gold Frame',price:250},
{id:'board-midnight',type:'board',name:'Midnight Board',price:500},
{id:'pawn-gem',type:'pawn',name:'Gem Pawns',price:400},
{id:'cards-crown',type:'card_back',name:'Crown Card Back',price:350}
]);
export const MISSIONS=Object.freeze([
{key:'daily_complete_1',period:'daily',metric:'matches',target:1,coins:60,label:'Complete 1 verified online match'},
{key:'daily_win_1',period:'daily',metric:'wins',target:1,coins:90,label:'Win 1 verified online match'},
{key:'daily_ludo_finish_2',period:'daily',metric:'ludoFinishes',target:2,coins:80,label:'Finish 2 Ludo pawns online'},
{key:'daily_cards_actions_5',period:'daily',metric:'cardActions',target:5,coins:70,label:'Play 5 Color Cards action cards online'},
{key:'weekly_complete_5',period:'weekly',metric:'matches',target:5,coins:300,label:'Complete 5 verified online matches'},
{key:'weekly_win_3',period:'weekly',metric:'wins',target:3,coins:350,label:'Win 3 verified online matches'}
]);
export const utcDay=(now=new Date())=>now.toISOString().slice(0,10);
export function periodKey(period,now=new Date()){if(period==='daily')return utcDay(now);const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())),day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day);return d.toISOString().slice(0,10)}
export function nextStreak(lastDate,lastStreak,now=new Date()){const today=utcDay(now);if(lastDate===today)return null;const d=new Date(now);d.setUTCDate(d.getUTCDate()-1);return lastDate===utcDay(d)?Number(lastStreak||0)>=7?1:Number(lastStreak||0)+1:1}
export const leaderboardEligible=r=>r?.status==='completed'&&['classic','color-cards'].includes(r.game);
