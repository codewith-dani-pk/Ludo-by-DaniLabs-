import crypto from 'node:crypto';
import {db,enc} from '../_db.js';
import {playerIdFrom} from '../_social-policy.js';
import {realtimePublicConfig} from '../_realtime.js';
import {normalizeUsername,validUsername,validPassword,passwordHash,passwordMatches,sha,createSession,revokeSession,optionalUser,requireUser,requireSameOrigin,sessionCookie,clearSessionCookie,recoveryCode,userPublic} from '../_auth.js';

const send=(res,status,data)=>res.status(status).json(data);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const account=async username=>{const a=await db('online_accounts?username=eq.'+enc(username)+'&select=*&limit=1');return a&&a[0]};
const weakMessage='Use a passphrase of at least 15 characters.';
function ipHash(req,username){const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();return sha('login|'+ip+'|'+username)}
async function throttle(req,username){
 const key=ipHash(req,username),cut=new Date(Date.now()-10*60*1000).toISOString(),rows=await db('online_auth_limits?key_hash=eq.'+enc(key)+'&select=*&limit=1'),x=rows&&rows[0];
 if(!x||x.window_start<cut){await db('online_auth_limits?key_hash=eq.'+enc(key),{method:'DELETE'}).catch(()=>{});await db('online_auth_limits',{method:'POST',body:{key_hash:key,attempts:1,window_start:new Date().toISOString()}});return}
 if(x.attempts>=10)throw Object.assign(new Error('Too many attempts. Try again later.'),{status:429});
 await db('online_auth_limits?key_hash=eq.'+enc(key),{method:'PATCH',body:{attempts:x.attempts+1}});
}
async function issue(res,u){const token=await createSession(u.user_id);res.setHeader('Set-Cookie',sessionCookie(token));return userPublic(u)}
export default async function handler(req,res){
 try{
  if(req.method==='GET'){
   if(String(req.query?.realtime||'')==='1'){const c=realtimePublicConfig();if(!c)return send(res,503,{error:'Realtime is not configured'});res.setHeader('Cache-Control','private, max-age=300');return send(res,200,c)}
   if(String(req.query?.health||'')==='1'){await db('online_rooms?select=id&limit=1');const u=await optionalUser(req);return send(res,200,{ok:true,service:'danilabs-online',database:'ready',user:userPublic(u)})}
   const u=await optionalUser(req);return send(res,200,{user:userPublic(u)})
  }
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  requireSameOrigin(req);const b=req.body||{},action=String(b.action||'');
  if(action==='register'){
   const username=normalizeUsername(b.username),password=String(b.password||'');if(!validUsername(username))return send(res,400,{error:'Use 4–24 lowercase letters, numbers or underscores for username.'});if(!validPassword(password))return send(res,400,{error:weakMessage});
   await throttle(req,username);const exists=await account(username);if(exists){await sleep(250);return send(res,409,{error:'Could not create account with those details.'})}
   const {salt,hash}=await passwordHash(password),user_id=crypto.randomUUID(),code=recoveryCode();
   try{await db('online_accounts',{method:'POST',body:{user_id,username,display_name:username,password_salt:salt,password_hash:hash,recovery_hash:sha(code)}})}
   catch(e){return send(res,409,{error:'Could not create account with those details.'})}
   await db('online_profiles?on_conflict=user_id',{method:'POST',body:{user_id,username,display_name:username,player_id:playerIdFrom(user_id),avatar:'avatar-1',last_seen:new Date().toISOString()},prefer:'resolution=merge-duplicates,return=minimal'});
   const user=await issue(res,{user_id,username,display_name:username});return send(res,200,{user,recoveryCode:code})
  }
  if(action==='login'){
   const started=Date.now(),username=normalizeUsername(b.username),password=String(b.password||'');if(!validUsername(username)||password.length>128){await sleep(450);return send(res,401,{error:'Invalid username or password.'})}
   await throttle(req,username);const u=await account(username),fakeSalt='d8c2a71d4e09b35f45bc984e64316d82',fakeHash='00'.repeat(64);let ok=false;
   try{ok=await passwordMatches(password,u?u.password_salt:fakeSalt,u?u.password_hash:fakeHash)}catch(e){}
   if(!u||!ok){await sleep(Math.max(0,500-(Date.now()-started)));return send(res,401,{error:'Invalid username or password.'})}
   await db('online_profiles?on_conflict=user_id',{method:'POST',body:{user_id:u.user_id,username:u.username,display_name:u.display_name,last_seen:new Date().toISOString()},prefer:'resolution=merge-duplicates,return=minimal'});
   return send(res,200,{user:await issue(res,u)})
  }
  if(action==='logout'){await revokeSession(req);res.setHeader('Set-Cookie',clearSessionCookie());return send(res,200,{ok:true})}
  if(action==='change-password'){
   const u=await requireUser(req),old=String(b.currentPassword||''),next=String(b.newPassword||'');if(!validPassword(next))return send(res,400,{error:weakMessage});const row=await account(u.username);if(!row||!(await passwordMatches(old,row.password_salt,row.password_hash)))return send(res,401,{error:'Current password is incorrect.'});
   const h=await passwordHash(next);await db('online_accounts?user_id=eq.'+enc(u.id),{method:'PATCH',body:{password_salt:h.salt,password_hash:h.hash,updated_at:new Date().toISOString()}});await db('online_sessions?user_id=eq.'+enc(u.id),{method:'DELETE'});return send(res,200,{user:await issue(res,row)})
  }
  if(action==='recover'){
   const username=normalizeUsername(b.username),code=String(b.recoveryCode||''),next=String(b.newPassword||'');if(!validPassword(next))return send(res,400,{error:weakMessage});await throttle(req,username||'unknown');const row=validUsername(username)?await account(username):null,good=row&&code.length>=24&&crypto.timingSafeEqual(Buffer.from(sha(code)),Buffer.from(String(row.recovery_hash||'').padEnd(64,'0').slice(0,64)));
   if(!good){await sleep(500);return send(res,401,{error:'Recovery details are invalid.'})}
   const h=await passwordHash(next),newCode=recoveryCode();await db('online_accounts?user_id=eq.'+enc(row.user_id),{method:'PATCH',body:{password_salt:h.salt,password_hash:h.hash,recovery_hash:sha(newCode),updated_at:new Date().toISOString()}});await db('online_sessions?user_id=eq.'+enc(row.user_id),{method:'DELETE'});res.setHeader('Set-Cookie',clearSessionCookie());return send(res,200,{ok:true,recoveryCode:newCode})
  }
  return send(res,400,{error:'Unknown account action'})
 }catch(e){return send(res,e.status&&e.status<600?e.status:500,{error:e.message||'Account request failed'})}
}
