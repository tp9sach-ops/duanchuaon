// Chống CHỒNG CHÉO giao diện cột trái (Phiên 159f → 160 → 161).
// Phiên 161: bỏ cách cũ "đo rồi đặt top/left cho từng khối" (cứ 0,4 giây đo lại nên khối nhảy lên xuống, và khi cột trên đổi chiều cao thì đè nhau).
// Cách mới (chơi bằng chuột, khung không quá thấp): gom .hud-tl, .hud-zoom, .dl-chip, .st-wrap vào MỘT cột .hud-col xếp theo dòng chảy CSS (css/hudcol.css) → không thể đè nhau.
// Thứ tự: hồ sơ/menu trên cùng → +/−/⟲ (xếp ngang) → Giao lưu → thẻ Việc kế tiếp + Dẫn đường (cuối cùng vì chiều cao hay đổi, không đẩy nút phía trên).
// Cảm ứng (điện thoại) và khung thấp (data-short) giữ bố cục cũ + bản đo-đẩy xuống cũ (legacyFit). Bỏ file này đi là về như cũ.
const ORDER = ['.hud-tl', '.hud-zoom', '.dl-chip', '.st-wrap'];
export function initHudFit(hud) {
  injectCss();
  const col = document.createElement('div'); col.className = 'hud-col'; hud.insertBefore(col, hud.firstChild);
  const q = (s) => (hud && hud.querySelector(s)) || document.querySelector(s);
  const px = (n) => `${Math.round(n)}px`;
  const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  let wasOn = null;

  function clearInline(n) { n.style.top = ''; n.style.left = ''; n.style.flexDirection = ''; }

  function columnMode() {
    // gom (hoặc giữ đúng thứ tự) các khối vào cột
    let prev = null;
    for (const sel of ORDER) {
      const n = q(sel); if (!n) continue;
      if (n.parentNode !== col || n.previousElementSibling !== prev) { clearInline(n); col.insertBefore(n, prev ? prev.nextSibling : col.firstChild); }
      prev = n;
    }
  }

  function release() {
    // trả các khối về HUD như cũ (khung thấp / cảm ứng)
    while (col.firstElementChild) { const n = col.firstElementChild; clearInline(n); hud.insertBefore(n, col); }
  }

  // Bản cũ (Phiên 160) cho cảm ứng / khung thấp: ĐẨY XUỐNG các khối đặt theo toạ độ riêng cho khỏi đè nhau.
  function legacyFit() {
    const tl = q('.hud-tl'); if (!tl) return;
    const wrap = q('.st-wrap'), zoom = q('.hud-zoom'), chip = q('.dl-chip'), H = innerHeight, short = document.documentElement.dataset.short === 'true';
    const gap = 8, floor = H - 24; let y = tl.getBoundingClientRect().bottom + gap, zr = null;
    if (wrap) {
      wrap.style.top = '';
      if (!short && !wrap.hidden) {
        const r = wrap.getBoundingClientRect();
        if (r.top < y) wrap.style.top = px(y);
        y = Math.max(y, wrap.getBoundingClientRect().bottom + gap);
      }
    }
    if (zoom && getComputedStyle(zoom).top !== 'auto') {
      zoom.style.top = ''; zoom.style.flexDirection = '';
      let r = zoom.getBoundingClientRect();
      if (r.top < y) {
        if (y + r.height > floor) zoom.style.flexDirection = 'row';
        zoom.style.top = px(y); r = zoom.getBoundingClientRect();
      }
      zr = r; y = Math.max(y, r.bottom + gap);
    }
    if (chip && !chip.hidden) {
      chip.style.top = ''; chip.style.left = '';
      const r = chip.getBoundingClientRect();
      if (r.top < y) {
        if (y + r.height > floor && zr) { chip.style.left = px(zr.right + gap); chip.style.top = px(zr.top); }
        else chip.style.top = px(y);
      }
    }
  }

  function fit() {
    if (!hud || hud.hidden) return;
    const short = document.documentElement.dataset.short === 'true';
    const on = !coarse && !short;
    if (on !== wasOn) { wasOn = on; hud.classList.toggle('col-mode', on); if (!on) release(); }
    if (on) columnMode(); else legacyFit();
  }
  const safe = () => { try { fit(); } catch (_) { /* không để lỗi đo đạc làm hỏng game */ } };
  setInterval(safe, 400);
  addEventListener('resize', safe);
  addEventListener('lgt:viewport', safe);
  try { new MutationObserver(safe).observe(hud, { childList: true }); } catch (_) { /* trình duyệt cũ: vẫn có vòng 0,4 giây */ }   // khối tạo muộn (Giao lưu...) vào cột ngay
  safe();
  return { fit: safe };
}

function injectCss() {
  try {
    if (document.querySelector('link[data-hudcol]')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.hudcol = '1';
    l.href = new URL('../../css/hudcol.css', import.meta.url).href; document.head.appendChild(l);
  } catch (_) { /* không để lỗi nạp CSS làm hỏng game */ }
}
