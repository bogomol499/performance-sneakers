/* Service worker: сайт открывается без интернета.
   Меняйте номер версии, когда обновляете файлы. */
const VERSION = 'pf-sneakers-v2';
const FILES = ['./', './index.html', './css/style.css', './js/data.js', './js/app.js', './js/motion.js', './manifest.webmanifest', './icons/favicon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  // свои файлы, шрифты и фото кроссовок кешируем по мере загрузки
  const ok = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || url.hostname === 'images.unsplash.com';
  if (!ok) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
