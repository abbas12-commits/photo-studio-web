// يفتح التطبيق من النسخة المحفوظة داخل الجهاز فوراً (بدون انتظار الإنترنت)
// وإذا كان فيه إنترنت يجيب آخر نسخة بالخلفية وتظهر في المرة القادمة
const CACHE = 'suwar-v2';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // مكتبات الإنترنت (فصل الخلفية) تبقى كما هي

  const isPage = req.mode === 'navigate';
  const key = isPage ? './index.html' : req;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(key, { ignoreSearch: true }).then(saved => {
        const update = fetch(req).then(res => {
          if (res && res.ok) cache.put(key, res.clone());
          return res;
        }).catch(() => null);
        if (saved) { e.waitUntil(update); return saved; } // فتح فوري من المحفوظ
        return update.then(res => res || cache.match('./index.html'));
      })
    )
  );
});
