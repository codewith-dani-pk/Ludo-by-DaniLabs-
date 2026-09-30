import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {db,enc} from './_db.js';

const scrypt=promisify(crypto.scrypt);
const COOKIE='__Host-dl_session',SESSION_DAYS=7;
const SCRYPT={N:32768,r:8,p:3,maxmem:128*1024*1024};
const bad=new Set(['password','password123','123456789012345','qwertyuiopasdfgh','letmein123456789','iloveyou1234567','admin1234567890','1234567890123456']);

export const normalizeUsername=v=>String(v||'').trim().toLowerCase();
export const validUsername=v=>/^[a-z0-9_]{4,24}$/.test(v)&&!['admin','administrator','moderator','support','danilabs','system','root'].includes(v);
export const validPassword=v=>typeof v==='string'&&v.length>=15&&v.length<=128&&Buffer.byteLength(v,'utf8')<=512&&!bad.has(v.toLowerCase());
export const sha=v=>crypto.createHash('sha256').update(v).digest('hex');

export async function passwordHash(password,salt=crypto.randomBytes(16).toString('hex')){
 const out=await scrypt(password,salt,64,SCRYPT);
 return {salt,hash:Buffer.from(out).toString('hex')};
}
export async function passwordMatches(password,salt,expected){
 const out=await passwordHash(password,salt),a=Buffer.from(out.hash,'hex'),b=Buffer.from(String(expected||''),'hex');
 return a.length===b.length&&a.length>0&&crypto.timingSafeEqual(a,b);
}
function cookies(req){
 if(req.cookies)return req.cookies;
 return Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return i<0?[x,'']:[x.slice(0,i),decodeURIComponent(x.slice(i+1))]}));
}
export function sessionToken(req){return cookies(req)[COOKIE]||''}
export function sessionCookie(token,maxAge=SESSION_DAYS*86400){return COOKIE+'='+token+'; Path=/; Max-Age='+maxAge+'; HttpOnly; Secure; SameSite=Strict'}
export function clearSessionCookie(){return COOKIE+'=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'}
export function requireSameOrigin(req){
 const site=String(req.headers['sec-fetch-site']||'');if(site==='cross-site')throw Object.assign(new Error('Cross-site request blocked'),{status:403});
 const origin=req.headers.origin;if(origin){let oh='';try{oh=new URL(origin).host}catch(e){}const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();if(!oh||oh!==host)throw Object.assign(new Error('Request origin rejected'),{status:403})}
}
export async function createSession(userId){
 const token=crypto.randomBytes(32).toString('base64url'),token_hash=sha(token),expires=new Date(Date.now()+SESSION_DAYS*86400000).toISOString();
 await db('online_sessions',{method:'POST',body:{token_hash,user_id:userId,expires_at:expires}});
 return token;
}
export async function revokeSession(req){const token=sessionToken(req);if(token)await db('online_sessions?token_hash=eq.'+enc(sha(token)),{method:'DELETE'}).catch(()=>{})}
export async function optionalUser(req){
 const token=sessionToken(req);if(!token)return null;
 const now=new Date().toISOString(),ss=await db('online_sessions?token_hash=eq.'+enc(sha(token))+'&expires_at=gt.'+enc(now)+'&select=user_id&limit=1'),row=ss&&ss[0];if(!row)return null;
 const a=await db('online_accounts?user_id=eq.'+enc(row.user_id)+'&select=user_id,username,display_name&limit=1'),u=a&&a[0];
 return u?{id:u.user_id,username:u.username,display_name:u.display_name}:null;
}
export async function requireUser(req){const u=await optionalUser(req);if(!u)throw Object.assign(new Error('Sign in required'),{status:401});return u}
export async function getProfile(id){const a=await db('online_accounts?user_id=eq.'+enc(id)+'&select=user_id,username,display_name&limit=1'),u=a&&a[0];return u?{id:u.user_id,username:u.username,display_name:u.display_name}:null}
export function recoveryCode(){return crypto.randomBytes(24).toString('base64url')}
export function userPublic(u){return u?{id:u.id||u.user_id,username:u.username,display_name:u.display_name}:null}
