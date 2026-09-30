import {db} from '../_db.js';
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});
 try{
  const rows=await db('online_rooms?select=id&limit=1');
  return res.status(200).json({ok:true,service:'danilabs-online',database:'ready'});
 }catch(e){
  return res.status(503).json({ok:false,service:'danilabs-online',database:'unavailable'});
 }
}
