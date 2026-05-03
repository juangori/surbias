// Surbias service worker.
// Strategy:
//   - HTML pages       → network-first (fall back to cache only when offline)
//   - /api/*           → network-first
//   - Static assets    → stale-while-revalidate (instant load, refresh in background)
//   - Bumping CACHE_VERSION nukes old caches on next activate.

const CACHE_VERSION = 'v4';
const STATIC_CACHE = `surbias-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `surbias-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/styles/global.css',
  '/logo.png',
  '/favicon.svg',
  '/favicon.ico',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  // Activate immediately so the new SW takes over without a second tab close.
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

function isHtmlRequest(req) {
  if (req.mode === 'navigate') return true;
  const accept = req.headers.get('accept') || '';
  return accept.includes('text/html');
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/styles/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never intercept cross-origin

  // Never cache: API, auth, admin, sitemap (always fresh)
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin/') ||
    url.pathname.startsWith('/login') ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/feed.xml' ||
    url.pathname === '/robots.txt'
  ) {
    return; // let browser handle natively (respects Cache-Control)
  }

  // HTML: network-first (so users see new design without hard refresh)
  if (isHtmlRequest(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Don't cache 4xx/5xx
          if (!res.ok) return res;
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }
  // anything else: just let browser handle it
});

// Allow the page to nuke caches on demand (e.g. after a deploy).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHES') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
