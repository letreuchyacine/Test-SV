const CACHE = 'streamvault-v3';

// Installation — on met en cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/index.html','/manifest.json','/icon.png']))
  );
  self.skipWaiting();
});

// Activation — on supprime les vieux caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST pour index.html (toujours la dernière version)
// Cache first pour les autres assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Pour index.html : réseau en priorité, cache en fallback
  if(url.pathname === '/' || url.pathname === '/index.html'){
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Pour le reste : cache en priorité
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
