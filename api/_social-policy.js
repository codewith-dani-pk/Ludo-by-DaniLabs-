export const pairKey=(a,b)=>[String(a),String(b)].sort().join('|');
export const playerIdFrom=(userId)=>'DL-'+String(userId||'').replace(/-/g,'').slice(0,10).toUpperCase();
export const validPlayerId=v=>/^DL-[A-Z0-9]{8,16}$/.test(String(v||'').trim().toUpperCase());
export const canSocial=(a,b,blocks=[])=>a!==b&&!blocks.some(x=>(x.blocker_id===a&&x.blocked_id===b)||(x.blocker_id===b&&x.blocked_id===a));
export const statsFrom=rows=>{const games=rows.length,wins=rows.filter(x=>x.won).length;return{gamesPlayed:games,wins,winRate:games?Math.round(wins*1000/games)/10:0}};
