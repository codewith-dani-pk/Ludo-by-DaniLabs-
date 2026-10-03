export const validRoomCode=v=>/^[A-Z0-9]{6}$/.test(String(v||'').trim().toUpperCase());
export const roomExpired=(room,now=Date.now())=>!!room?.expires_at&&room.status==='waiting'&&now>Date.parse(room.expires_at);
export const canJoin=(room,members,userId,now=Date.now())=>{if(!room||roomExpired(room,now))return{ok:false,error:'Room not found or expired'};if(room.status!=='waiting')return{ok:false,error:'Match already started'};if(members.some(m=>m.user_id===userId))return{ok:true,existing:true};if(members.length>=room.max_players)return{ok:false,error:'Room is full'};return{ok:true}};
export const nextHost=members=>members.slice().sort((a,b)=>a.seat-b.seat)[0]?.user_id||null;
export const connected=(member,graceMs,now=Date.now())=>Number.isFinite(Date.parse(member?.last_seen_at||''))&&now-Date.parse(member.last_seen_at)<=graceMs;
