// Logic thuần của khung nhìn (Phiên 31): phân loại kích thước màn hình (Z Fold bìa/trong, iPhone, Android, máy tính bảng),
// đo thanh công cụ trình duyệt ở DƯỚI (Safari iOS, Chrome Android) và hệ số co giãn HUD. Không đụng DOM nên test được bằng Node.
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : d);

/** Phân loại. size: 'xs' (<360: Galaxy Z Fold bìa ngoài 280–344, iPhone SE cũ 320), 'sm' (<430: đa số điện thoại dọc),
 *  'md' (<600: điện thoại lớn/ngang nhỏ), 'fold' (600–899: Z Fold mở ra, Flip ngang, máy tính bảng nhỏ), 'lg' (≥900: máy tính).
 *  Cờ: landscape, short (cao ≤ 500: điện thoại nằm ngang), tall (tỉ lệ dọc < 0,44: màn hình rất dài như Fold bìa ≈ 23:9, 0,39–0,43), square (0,75–1,33: Fold mở). */
export function classify(w, h) {
  w = num(w, 390); h = num(h, 800);
  const ar = w / h;
  const size = w < 360 ? 'xs' : w < 430 ? 'sm' : w < 600 ? 'md' : w < 900 ? 'fold' : 'lg';
  return { size, landscape: w > h, short: h <= 500, tall: ar < 0.44, square: ar >= 0.75 && ar <= 1.33, ar: Math.round(ar * 1000) / 1000 };
}

/** Phần dưới của khung layout bị thanh công cụ trình duyệt đè lên (px). Bàn phím ảo (>150px) KHÔNG tính là thanh công cụ.
 *  layoutH = innerHeight, vv = { height, offsetTop } của visualViewport (có thể thiếu trên trình duyệt cũ). */
export function bottomBar(layoutH, vv) {
  layoutH = num(layoutH, 0);
  if (!vv || !isFinite(vv.height) || !layoutH) return 0;
  const gap = layoutH - vv.height - (isFinite(vv.offsetTop) ? vv.offsetTop : 0);
  return gap > 0 && gap <= 150 ? Math.round(gap) : 0;
}
/** Bàn phím ảo đang mở (khung nhìn thấp đi hơn 150px so với layout). */
export const keyboardOpen = (layoutH, vv) => !!(vv && isFinite(vv.height) && num(layoutH, 0) - vv.height - (isFinite(vv.offsetTop) ? vv.offsetTop : 0) > 150);

/** Hệ số co giãn HUD 0,78–1,12 theo cạnh nhỏ nhất của khung nhìn nhìn thấy (390×700 = 1). */
export const hudScale = (w, h) => Math.round(clamp(Math.min(num(w, 390) / 390, num(h, 700) / 700), 0.78, 1.12) * 100) / 100;

/** Tất cả giá trị cần ghi ra :root (--vvw, --vvh, --vv-bar, --hud-s) và data-* (vp, orient, short, tall, square, kbd). */
export function viewportState({ innerW, innerH, vv } = {}) {
  const w = num(vv && vv.width, num(innerW, 390)), h = num(vv && vv.height, num(innerH, 800));
  const c = classify(w, h), kbd = keyboardOpen(innerH, vv);
  return {
    vars: { '--vvw': w + 'px', '--vvh': h + 'px', '--vv-bar': bottomBar(innerH, vv) + 'px', '--hud-s': String(hudScale(w, kbd ? Math.max(h, 520) : h)) },
    data: { vp: c.size, orient: c.landscape ? 'landscape' : 'portrait', short: String(c.short && !kbd), tall: String(c.tall), square: String(c.square), kbd: String(kbd) },
    cls: c,
  };
}
