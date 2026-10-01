import {realtimePublicConfig} from '../_realtime.js';
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});const c=realtimePublicConfig();if(!c)return res.status(503).json({error:'Realtime is not configured'});res.setHeader('Cache-Control','private, max-age=300');return res.status(200).json(c)}
