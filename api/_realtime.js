const cfg=()=>{const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SECRET_KEY;if(!u||!k)return null;return{u:u.replace(/\/$/,''),k}};
export async function broadcastRoom(roomId,event='room_changed',payload={}){
 const c=cfg();if(!c||!roomId)return false;
 try{const r=await fetch(c.u+'/realtime/v1/api/broadcast',{method:'POST',headers:{apikey:c.k,...(!c.k.startsWith('sb_secret_')?{Authorization:'Bearer '+c.k}:{}),'Content-Type':'application/json'},body:JSON.stringify({messages:[{topic:'room:'+roomId,event,payload}]})});return r.ok}catch(e){return false}
}
export function realtimePublicConfig(){const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;return u&&k?{url:u.replace(/\/$/,''),key:k}:null}
