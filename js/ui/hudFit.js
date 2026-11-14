// Chống CHỒNG CHÉO giao diện cột trái (Phiên 159f): thẻ "Việc kế tiếp" + nút Dẫn đường (.st-wrap, top cố định 268px), cột +/−/⟲ (.hud-zoom, top 46%)
// và nút "Giao lưu" (.dl-chip, top 46%) đều đặt theo toạ độ cố định nên đè lên cột trên cùng bên trái (.hud-tl) khi cửa sổ thấp / cột dài.
// Mỗi 0,4 giây đo lại và ĐẨY XUỐNG: wrap ngay dưới .hud-tl → .hud-zoom dưới wrap → .dl-chip dưới zoom (chỉ đẩy xuống, không kéo lên; hết chỗ thì giữ nguyên).
// Chế độ thấp (data-short, thẻ ở giữa trên) và điện thoại (zoom nằm dưới, top:auto) không bị đụng. Mọi thứ chỉ là style.top/left nên bỏ file này đi là về như cũ.
export function initHudFit(hud) {
  const q = (s) => (hud && hud.querySelector(s)) || document.querySelector(s);
  const px = (n) => `${Math.round(n)}px`;
  function fit() {
    const tl = q('.hud-tl'); if (!tl || (hud && hud.hidden)) return;
    const wrap = q('.st-wrap'), zoom = q('.hud-zoom'), chip = q('.dl-chip'), H = innerHeight, short = document.documentElement.dataset.short === 'true';
    const gap = 8; let y = tl.getBoundingClientRect().bottom + gap;
    if (wrap) {
      wrap.style.top = '';
      if (!short && !wrap.hidden) {
        const r = wrap.getBoundingClientRect();
        if (r.top < y && y + r.height < H - 90) wrap.style.top = px(y);
        y = Math.max(y, wrap.getBoundingClientRect().bottom + gap);
      }
    }
    if (zoom && getComputedStyle(zoom).top !== 'auto') {
      zoom.style.top = '';
      const r = zoom.getBoundingClientRect();
      if (r.top < y && y + r.height < H - 90) zoom.style.top = px(y);
      y = Math.max(y, zoom.getBoundingClientRect().bottom + gap);
    }
    if (chip && !chip.hidden) {
      chip.style.top = ''; chip.style.left = '';
      const r = chip.getBoundingClientRect();
      if (r.top < y && y + r.height < H - 90) chip.style.top = px(y);
    }
  }
  setInterval(() => { try { fit(); } catch (_) { /* không để lỗi đo đạc làm hỏng game */ } }, 400);
  addEventListener('resize', () => { try { fit(); } catch (_) { /* bỏ qua */ } });
  return { fit };
}
