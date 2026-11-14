// Chống CHỒNG CHÉO giao diện cột trái (Phiên 159f, sửa lại ở 160): thẻ "Việc kế tiếp" + nút Dẫn đường (.st-wrap, top cố định 268px), cột +/−/⟲ (.hud-zoom, top 46%)
// và nút "Giao lưu" (.dl-chip, top 46%) đều đặt theo toạ độ cố định nên đè lên cột trên cùng bên trái (.hud-tl) khi cửa sổ thấp / cột dài.
// Mỗi 0,4 giây đo lại và ĐẨY XUỐNG: wrap ngay dưới .hud-tl → .hud-zoom dưới wrap → .dl-chip dưới zoom.
// Phiên 160: bản cũ "hết chỗ thì giữ nguyên" nên cửa sổ thấp (~650px) vẫn đè nhau. Bản này LUÔN đẩy xuống; nếu cột +/−/⟲ không đủ chỗ thì xếp NGANG (thay vì dọc);
// nếu nút Giao lưu vẫn không đủ chỗ thì đặt cạnh phải cột +/−/⟲. Chế độ thấp (data-short, thẻ ở giữa trên) và điện thoại (zoom nằm dưới, top:auto) không bị đụng.
// Mọi thứ chỉ là style.top/left/flexDirection nên bỏ file này đi là về như cũ.
export function initHudFit(hud) {
  const q = (s) => (hud && hud.querySelector(s)) || document.querySelector(s);
  const px = (n) => `${Math.round(n)}px`;
  function fit() {
    const tl = q('.hud-tl'); if (!tl || (hud && hud.hidden)) return;
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
        if (y + r.height > floor) zoom.style.flexDirection = 'row';   // hết chỗ dọc → xếp ngang
        zoom.style.top = px(y); r = zoom.getBoundingClientRect();
      }
      zr = r; y = Math.max(y, r.bottom + gap);
    }
    if (chip && !chip.hidden) {
      chip.style.top = ''; chip.style.left = '';
      const r = chip.getBoundingClientRect();
      if (r.top < y) {
        if (y + r.height > floor && zr) { chip.style.left = px(zr.right + gap); chip.style.top = px(zr.top); }   // hết chỗ dọc → đặt cạnh phải cột +/−/⟲
        else chip.style.top = px(y);
      }
    }
  }
  setInterval(() => { try { fit(); } catch (_) { /* không để lỗi đo đạc làm hỏng game */ } }, 400);
  addEventListener('resize', () => { try { fit(); } catch (_) { /* bỏ qua */ } });
  return { fit };
}
