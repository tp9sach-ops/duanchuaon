// Service worker: mở lại được khi mất mạng. Mạng trước, bộ nhớ đệm sau (để luôn thấy bản mới khi có mạng).
// Đổi VERSION mỗi khi muốn buộc làm mới toàn bộ.
// Phiên 228: dgt-v214 (rồng hồng Gậy như ý tạo hình lại theo ảnh mẫu: mờ, nhìn xuyên được như khí, vảy chuyển màu hồng-cam, bụng xanh, sừng chẻ nhánh, râu lượn sóng).
// Phiên 227 (mục 2): dgt-v213 (rồng hồng Gậy như ý to/ngầu hơn + bay trúng quái gây sát thương).
// Phiên 227 (mục 1): dgt-v212 (sói khí vàng to/ngầu hơn + gây sát thương, bầy chó chạy theo khi cưỡi Gậy dạy chó).
// Phiên 219: dgt-v206 (nút toàn màn hình trên lớp phim, thẻ xoay ngang, điện thoại bắt đầu ở chất lượng đầy đủ).
// Phiên 160: file cùng trang luôn hỏi lại máy chủ (cache:'no-cache') để không bị kẹt bản JS/CSS cũ trong bộ nhớ đệm của trình duyệt ~10 phút sau khi đẩy code.
// Phiên 230: Chổi (js/ui/broomMesh.js, broomFx.js, data/broomGlb.js nạp lười) → v216.
const VERSION = 'dgt-v218';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(VERSION).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'assets/icon.svg', 'assets/icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (r.headers.has('range') || /\.(m4a|mp3|ogg)$/.test(new URL(r.url).pathname)) return;   // nhạc nền: để trình duyệt tự tải theo từng đoạn (không đưa vào bộ nhớ đệm)
  // Không đụng tới lời gọi backend (Apps Script) hay mọi thứ ngoài danh sách tin cậy
  const ok = u.origin === location.origin || u.hostname === 'cdn.jsdelivr.net' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!ok) return;
  e.respondWith((u.origin === location.origin ? fetch(r, { cache: 'no-cache' }) : fetch(r)).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r).then((m) => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
