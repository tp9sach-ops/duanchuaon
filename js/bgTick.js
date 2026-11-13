// Bộ nhịp chung (Phiên 143): mọi vòng lặp game (quái bãi rừng, quái đánh trả, nhân vật đi/lao) đăng ký vào đây thay vì tự setInterval,
// để khi người chơi chuyển sang tab khác game VẪN chạy tiếp (nhân vật vẫn đánh, vẫn đi). Nhịp phát từ Web Worker (js/tickWorker.js);
// không có Worker thì rơi về setInterval thường (tab ẩn sẽ chậm lại). Hình 3D vẫn không vẽ khi tab ẩn (tiết kiệm pin) — chỉ phần logic chạy.
const STEP_MS = 100;
const subs = new Set();
let worker = null, timer = 0, started = false;
function fire() { for (const f of [...subs]) { try { f(); } catch (e) { console.warn('[Diệu Giang Tự] Nhịp nền lỗi:', e && e.message); } } }
function fallback() { if (worker) { try { worker.terminate(); } catch (_) { /* bỏ qua */ } worker = null; } if (!timer) { timer = setInterval(fire, STEP_MS); if (timer && typeof timer.unref === 'function') timer.unref(); } }
function start() {
  if (started) return; started = true;
  try {
    if (typeof Worker === 'undefined') throw new Error('no-worker');
    worker = new Worker(new URL('./tickWorker.js', import.meta.url));
    worker.onmessage = fire; worker.onerror = fallback; worker.postMessage(STEP_MS);
  } catch (_) { fallback(); }
}
export const bgTick = {
  /** Đăng ký hàm chạy ~10 lần/giây, cả khi tab ẩn. Trả hàm hủy đăng ký. */
  on(fn) { subs.add(fn); start(); return () => subs.delete(fn); },
  get hidden() { return typeof document !== 'undefined' && !!document.hidden; },
  get usingWorker() { return !!worker; },
};
