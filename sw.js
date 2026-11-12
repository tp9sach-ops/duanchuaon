// Service worker: mở lại được khi mất mạng. Mạng trước, bộ nhớ đệm sau (để luôn thấy bản mới khi có mạng).
// Đổi VERSION mỗi khi muốn buộc làm mới toàn bộ.
const VERSION = 'dgt-v109';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(VERSION).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'assets/icon.svg', 'assets/icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (r.headers.has('range') || /\.(m4a|mp3|ogg)$/.test(new URL(r.url).pathname)) return;   // nhạc nền: để trình duyệt tự tải theo từng đoạn (không đưa vào bộ nhớ đệm)
  // Không đụng tới lời gọi backend (Apps Script) hay mọi thứ ngoài danh sách tin cậy
  const ok = u.origin === location.origin || u.hostname === 'cdn.jsdelivr.net' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!ok) return;
  e.respondWith(fetch(r).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r).then((m) => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
