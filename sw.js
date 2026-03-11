// ══════════════════════════════════════════════════════
//  NearShop Drive — Service Worker v5
//  Stratégie : Network First + offline fallback
// ══════════════════════════════════════════════════════

const CACHE_NAME = 'nearshop-v5';

const PRECACHE = [
  './app.html',
  './index.html',
  './manifest.json',
  './icon.svg',
];

const BYPASS_HOSTS = [
  'firebase', 'googleapis', 'gstatic', 'cloudinary',
  'leaflet', 'openstreetmap', 'nominatim', 'cdn.jsdelivr',
  'unpkg.com', 'fonts.gstatic', 'google.com/vt',
];

function shouldBypass(url) {
  return BYPASS_HOSTS.some(h => url.includes(h));
}

self.addEventListener('install', e => {
  console.log('[SW] Install v5');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  console.log('[SW] Activate v5');
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (shouldBypass(e.request.url)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          if (e.request.mode === 'navigate') return caches.match('./app.html');
        })
      )
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
