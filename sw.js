const V='ludo-danilabs-v15',FILES=['./','index.html','manifest.json','css/style.css','css/upgrade.css','js/app.js','js/themes.js','js/host.js','js/cards.js','assets/icons/icon.svg','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const q=e.request;if(q.method!=='GET'||new URL(q.url).origin!==location.origin)return;
  if(q.mode==='navigate'){e.respondWith(fetch(q).then(n=>{const cp=n.clone();caches.open(V).then(c=>c.put('index.html',cp));return n}).catch(()=>caches.match('index.html')));return}
  e.respondWith(caches.match(q).then(hit=>{const net=fetch(q).then(n=>{if(n.ok){const cp=n.clone();caches.open(V).then(c=>c.put(q,cp))}return n}).catch(()=>hit);return hit||net}));
});
