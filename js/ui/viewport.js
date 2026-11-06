// Khung nhìn thích ứng (Phiên 31): đo khung nhìn THẬT (visualViewport) và ghi biến CSS + data-* để css/responsive.css dùng.
// Chạy tốt trên Chrome/Edge/Samsung/Firefox Android, Safari iOS (thanh công cụ dưới co giãn), Z Fold (gập/mở), xoay màn hình.
import { viewportState } from './viewportLogic.js';

export function initViewport(root = document.documentElement) {
  let raf = 0, last = '';
  const apply = () => {
    raf = 0;
    const vv = window.visualViewport || null;
    const st = viewportState({ innerW: window.innerWidth, innerH: window.innerHeight, vv: vv ? { width: vv.width, height: vv.height, offsetTop: vv.offsetTop } : null });
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
  apply();
  setTimeout(schedule, 400); setTimeout(schedule, 1500);   // Safari iOS đôi khi báo kích thước muộn sau khi trang nạp / thanh công cụ thu lại
  return { refresh: apply };
}
