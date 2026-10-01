'use strict';
window.DaniRealtime=(()=>{
 let ws=null,topic='',ref=0,heartbeat=null,retry=null,closed=true,onEvent=()=>{},onState=()=>{},cfg=null;
 const state=s=>{try{onState(s)}catch(e){}},send=(event,payload={},t=topic)=>{if(ws?.readyState===1)ws.send(JSON.stringify({topic:t,event,payload,ref:String(++ref)}))};
 function stopSocket(){clearInterval(heartbeat);clearTimeout(retry);if(ws){ws.onclose=null;try{ws.close()}catch(e){}}ws=null}
 async function config(){if(cfg)return cfg;const r=await fetch('/api/online/realtime',{credentials:'same-origin'});if(!r.ok)throw Error('Realtime unavailable');return cfg=await r.json()}
 async function connect(roomId,eventCb,stateCb){disconnect();closed=false;topic='realtime:room:'+roomId;onEvent=eventCb||(()=>{});onState=stateCb||(()=>{});state('Connecting');
  try{const c=await config(),base=c.url.replace(/^http/,'ws').replace(/\/$/,'');ws=new WebSocket(base+'/realtime/v1/websocket?apikey='+encodeURIComponent(c.key)+'&vsn=1.0.0');
   ws.onopen=()=>{send('phx_join',{config:{broadcast:{ack:false,self:false},presence:{enabled:false},postgres_changes:[],private:false},access_token:c.key});heartbeat=setInterval(()=>send('heartbeat',{},'phoenix'),25000)};
   ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}if(m.topic!==topic)return;if(m.event==='phx_reply'&&m.payload?.status==='ok')state('Connected');else if(m.event==='broadcast'){try{onEvent(m.payload?.payload||{})}catch(x){}}};
   ws.onerror=()=>state('Reconnecting');ws.onclose=()=>{clearInterval(heartbeat);if(closed){state('Disconnected');return}state('Reconnecting');retry=setTimeout(()=>connect(roomId,onEvent,onState),1500)};
  }catch(e){state('Reconnecting');if(!closed)retry=setTimeout(()=>connect(roomId,onEvent,onState),2500)}
 }
 function disconnect(){closed=true;stopSocket();state('Disconnected')}
 return{connect,disconnect};
})();