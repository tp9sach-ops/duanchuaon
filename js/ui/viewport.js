// Khung nhìn thích ứng (Phiên 31): đo khung nhìn THẬT (visualViewport) và ghi biến CSS + data-* để css/responsive.css dùng.
// Chạy tốt trên Chrome/Edge/Samsung/Firefox Android, Safari iOS (thanh công cụ dưới co giãn), Z Fold (gập/mở), xoay màn hình.
import { viewportState } from './viewportLogic.js';

export function initViewport(root = document.documentElement) {
  let raf = 0, last = '', frame = null;
  const apply = () => {
    raf = 0;
    const vv = window.visualViewport || null;
    const st = viewportState({ innerW: window.innerWidth, innerH: window.innerHeight, vv: vv ? { width: vv.width, height: vv.height, offsetTop: vv.offsetTop } : null, frame });
    const key = JSON.stringify(st.vars) + JSON.stringify(st.data); if (key === last) return; last = key;
    for (const k in st.vars) root.style.setProperty(k, st.vars[k]);
    for (const k in st.data) root.dataset[k] = st.data[k];
    try { window.dispatchEvent(new CustomEvent('lgt:viewport', { detail: st })); } catch (_) { /* bỏ qua */ }
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
  const on = (t, e) => { try { t.addEventListener(e, schedule, { passive: true }); } catch (_) { /* bỏ qua */ } };
  on(window, 'resize'); on(window, 'orientationchange'); on(window, 'pageshow');
  if (window.visualViewport) { on(window.visualViewport, 'resize'); on(window.visualViewport, 'scroll'); }
  if (screen.orientation) on(screen.orientation, 'change');
  try { const mq = window.matchMedia('(horizontal-viewport-segments: 2)'); mq.addEventListener ? mq.addEventListener('change', schedule) : mq.addListener && mq.addListener(schedule); } catch (_) { /* trình duyệt không hỗ trợ màn hình gập kép */ }
  watchFrame((r) => { frame = r; schedule(); }, on);
  apply();
  setTimeout(schedule, 400); setTimeout(schedule, 1500);   // Safari iOS đôi khi báo kích thước muộn sau khi trang nạp / thanh công cụ thu lại
  return { refresh: apply };
}

/** Phiên 129: game chạy trong khung (iframe). Đo vùng khung THẬT SỰ nhìn thấy để HUD/nút không bị khuất dưới thanh trình duyệt hoặc phần khung nằm ngoài màn hình.
 *  Cách 1: IntersectionObserver (trang cha khác tên miền vẫn dùng được). Cách 2 (tuỳ chọn): trang cha gửi postMessage {dgt:'frame', top, bottom} (toạ độ trong khung). */
function watchFrame(set, on) {
  let inFrame = false;
  try { inFrame = window.self !== window.top; } catch (_) { inFrame = true; }
  if (!inFrame) return;
  try { document.documentElement.dataset.embedded = 'true'; } catch (_) { /* bỏ qua */ }
  try {
    if (typeof IntersectionObserver === 'function') {
      const s = document.createElement('div');
      s.setAttribute('aria-hidden', 'true');
      s.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;visibility:hidden;z-index:-1';
      document.body.appendChild(s);
      const th = []; for (let i = 0; i <= 100; i++) th.push(i / 100);
      const io = new IntersectionObserver((es) => {
        const e = es[es.length - 1]; if (!e) return;
        const r = e.intersectionRect;
        set(e.isIntersecting && r ? { top: r.top, bottom: r.bottom } : null);
      }, { threshold: th });
      io.observe(s);
    }
  } catch (_) { /* trình duyệt cũ: giữ cách đo cũ */ }
  try {
    window.addEventListener('message', (ev) => {
      const d = ev && ev.data; if (!d || d.dgt !== 'frame') return;
      set({ top: Number(d.top), bottom: Number(d.bottom) });
    });
  } catch (_) { /* bỏ qua */ }
}
