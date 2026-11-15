// Phiên 192 (Mục 1): BỐ CỤC NÚT KIỂU MOBA (theo ảnh mẫu Liên Quân) — một cụm duy nhất ở góc phải-dưới, dùng CHUNG cho bãi rừng / trong chùa / khu luyện tập / thu phục yêu quái.
//   • Đánh thường (ô A, to nhất) sát ngón cái ở góc. Cùng HÀNG ĐÁY, đi dần sang trái: Thương, Nhảy, Thiết đầu, Chém khí/Khiêng người, Tự động, Cưỡi (mỗi nút một ô cố định — không dời chỗ).
//   • Chiêu phái xếp CUNG TRÒN quanh nút Đánh thường: chiêu 1, 2, 3 ở vòng trong (trái → trên), Pháp Môn (4) và Tuyệt Học ở vòng ngoài, nhỏ hơn 20%. Ngón cái xoay quanh nút đánh là chạm được mọi chiêu.
//   • Màn hình thấp: tự thu nhỏ cung (tối thiểu 55%) để không chạm thanh trên cùng; người chơi còn chỉnh thêm bằng nút ⚙ Cỡ nút (--btn-k).
// Chỉ chỉnh VỊ TRÍ/CỠ bằng CSS + style nội tuyến; logic nút vẫn ở js/world/dock.js và js/ui/heSkill.js. Hàm thuần arcPoints/fitFactor có test (tests/heskillui.test.mjs).
const rad = (d) => (d * Math.PI) / 180;
/** Góc (độ, ngược chiều kim đồng hồ từ trục +x, tâm = tâm nút Đánh thường) và vòng của từng ô chiêu. */
export const ARC_POS = { 1: [150, 1], 2: [120, 1], 3: [90, 1], 4: [135, 2], tuyet: [105, 2] };
/** Cột (tính từ phải, A = 7) của từng ô trong hàng đáy. */
export const SLOT_COL = { A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, T1: 1 };

/** Vị trí các nút chiêu so với tâm nút Đánh thường. rA = bán kính nút Đánh thường, base = đường kính nút chiêu, f = hệ số thu nhỏ. Trả { pts: { khoá: { dx, dy (lên là dương), s } }, up = phần cung nhô lên trên tâm }. */
export function arcPoints(rA, base, f = 1) {
  const s = base * f, s2 = s * 0.8, R1 = Math.max(rA + 8 + s / 2 + 6, (s + 8) / (2 * Math.sin(rad(15)))), R2 = R1 + ((s + s2) / 2) * 0.95;
  const pts = {}; let up = 0;
  for (const k of Object.keys(ARC_POS)) {
    const [deg, ring] = ARC_POS[k], R = ring === 1 ? R1 : R2, sz = ring === 1 ? s : s2, dx = R * Math.cos(rad(deg)), dy = R * Math.sin(rad(deg));
    pts[k] = { dx, dy, s: sz }; up = Math.max(up, dy + sz / 2);
  }
  return { pts, up };
}
/** Hệ số thu nhỏ lớn nhất (≤ 1, ≥ 0.55) để cung nhô lên không quá `avail` px. */
export function fitFactor(avail, rA, base) {
  for (let f = 1; f >= 0.55; f -= 0.05) if (arcPoints(rA, base, f).up <= avail) return Math.round(f * 100) / 100;
  return 0.55;
}

export const ARC_CSS = '.dk-grid{display:grid!important;grid-template-columns:repeat(6,var(--dk-m)) var(--dk-a)!important;grid-template-rows:var(--dk-a)!important;align-items:center!important;justify-items:center!important}'
  + '.dk-b{grid-row:1!important}.dk-b[data-slot="A"]{grid-column:7!important}.dk-b[data-slot="B"]{grid-column:6!important}.dk-b[data-slot="C"]{grid-column:5!important}.dk-b[data-slot="D"]{grid-column:4!important}.dk-b[data-slot="E"]{grid-column:3!important}.dk-b[data-slot="F"]{grid-column:2!important}.dk-b[data-slot="T1"],.dk-b[data-slot^="X"]{grid-column:1!important}'
  + '#hs-bar .hs-b{position:fixed!important;margin:0!important;transition:none}';

export function initActionArc() {
  if (document.getElementById('arc-css')) return;
  const st = document.createElement('style'); st.id = 'arc-css'; st.textContent = ARC_CSS; document.head.appendChild(st);
  const last = new WeakMap();
  function arrange() {
    const bar = document.getElementById('hs-bar'); if (!bar || bar.hidden) return;
    const dock = document.getElementById('dock'), A = dock && !dock.hidden ? dock.querySelector('.dk-b[data-slot="A"]') : null;
    const vw = innerWidth, vh = innerHeight, k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--btn-k')) || 1;
    let cx, cy, rA;
    if (A) { const r = A.getBoundingClientRect(); if (!r.width) return; cx = r.left + r.width / 2; cy = r.top + r.height / 2; rA = r.width / 2; }
    else { rA = 38 * k; cx = vw - 12 - rA; cy = vh - 214 - rA; }   // không có nút Đánh thường (đang câu cá/bơi...): giữ cung ở vị trí cũ
    const base = k * Math.max(64, Math.min(92, 0.11 * Math.min(vw, vh))), f = fitFactor(cy - 56, rA, base), { pts, up } = arcPoints(rA, base, f);
    for (const b of bar.querySelectorAll('.hs-b')) {
      if (b.hidden) continue; const p = pts[b.dataset.slot]; if (!p) continue;
      const x = Math.max(4, Math.round(cx + p.dx - p.s / 2)), y = Math.round(cy - p.dy - p.s / 2), key = x + ',' + y + ',' + Math.round(p.s);
      if (last.get(b) === key) continue; last.set(b, key);
      b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.setProperty('--hs-s', p.s.toFixed(1) + 'px');
    }
    if (dock) dock.style.setProperty('--hs-h', Math.max(0, Math.ceil(up - rA + 4)) + 'px');   // bong bóng chỉ chỗ nằm trên cung
  }
  setInterval(arrange, 120); addEventListener('resize', arrange); arrange();
}
