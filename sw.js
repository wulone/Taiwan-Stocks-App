const CACHE_NAME = 'twstock-screener-v14';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first：只要能連上網路，一律拿最新版本（並順便更新快取）；
// 只有在離線抓不到網路時，才退回使用上次快取的版本。
// （舊版曾用「快取優先」策略，會導致改版後使用者永遠看到舊畫面，這裡修正。）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAppShell = APP_SHELL.some((p) => url.pathname.endsWith(p.replace('./', '')));
  if (event.request.method !== 'GET' || !isAppShell) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
