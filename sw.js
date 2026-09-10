// TNS Boekhouding — service worker
// Zorgt dat de app een geïnstalleerd "echt app" gevoel heeft en offline een
// nette start toont. Cachet alleen de schil (index.html), niet de data —
// alle data komt gewoon live uit Supabase zoals altijd.
const CACHE = 'tns-boekhouding-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Nooit Supabase-verkeer (data/auth/functions) cachen — dat moet altijd live zijn.
  if (url.hostname.endsWith('supabase.co')) return;
  // Alleen navigatie-requests (het openen van de app zelf) via cache-first afhandelen.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put('./index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  }
});
