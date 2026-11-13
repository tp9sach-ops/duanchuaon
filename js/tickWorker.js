// Nhịp nền (Phiên 143): chạy trong Web Worker để KHÔNG bị trình duyệt hãm nhịp khi tab bị ẩn (setInterval ở tab ẩn chỉ còn ~1 lần/giây, có khi 1 lần/phút).
// Nhận số mili-giây → cứ chừng đó lại gửi một tin về trang. Gửi 0 để dừng.
let id = 0;
self.onmessage = (e) => { const ms = +e.data || 0; clearInterval(id); id = ms > 0 ? setInterval(() => self.postMessage(1), ms) : 0; };
