// Hằng số tấm vách đá khắc Đại Phật (Phiên 83) — module THUẦN (không three.js) để test được trên CI.
// Phải khớp tools/make-daiphat-da.py (khung ảnh 1024x1280 = 16 m x 20 m) và js/scene/outside.js (mặt vách thác phẳng ở CLIFF_FLAT).
/** Tấm vách vòm (m): rộng w, cao h (chữ nhật archTop + nửa tròn bán kính r). back = độ lùi mặt tấm vào trong vách so với DAI_PHAT.face; relief/bias = displacementScale/Bias (độ nổi). */
export const PANEL = { w: 16, h: 20, archTop: 12, r: 8, back: 2.35, relief: 1.3, bias: -0.25, segX: 128, segY: 160, texW: 1024, texH: 1280 };
/** Mặt trước vách thác được làm phẳng ở đoạn z ≥ THAC.fallZ: toạ độ địa phương của khối vách và toạ độ thế giới tương ứng. */
export const CLIFF_FLAT = { xLocal: -11.5, world: 116.0 };

/** Điểm trên đường viền vòm (toạ độ tấm: x ngang từ giữa, y từ đáy), t ∈ [0,1) đi một vòng (bỏ cạnh đáy chạm đất), `out` = lùi ra ngoài (m). */
export function archOutline(t, out = 0) {
  const { r, archTop } = PANEL, arcL = Math.PI * r, total = archTop * 2 + arcL;
  let d = t * total;
  if (d < archTop) return { x: r + out, y: d };
  d -= archTop;
  if (d < arcL) { const a = d / r; return { x: Math.cos(a) * (r + out), y: archTop + Math.sin(a) * (r + out) }; }
  d -= arcL; return { x: -r - out, y: archTop - d };
}

/** x thế giới của: mặt nền tấm (chỗ khắc sâu nhất), đỉnh khối nổi cao nhất (gần người nhất). Mặt nền ứng với độ cao ~0,30 trong bản đồ độ cao, đỉnh nổi ~0,95. */
export function panelWorldX(face, height01 = 0.3) { return face + PANEL.back - (height01 * PANEL.relief + PANEL.bias); }
