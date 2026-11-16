// Phiên 207: VÙNG TUNG CHIÊU HIỆN TRÊN MẶT ĐẤT khi lướt tay dùng chiêu định hướng (như Liên Quân / Liên Minh): kéo ngón tay thì thấy vùng chiêu xoay theo hướng kéo, nhả tay mới tung.
// LOGIC THUẦN (không DOM, không three.js), có test: tests/aimpreview.test.mjs. Cảnh 3D vẽ vùng này: js/scene/aimPreview.js. Dùng chung mọi nơi (đánh quái, bình thường, khu luyện tập, võ đài) qua js/ui/heSkill.js.
// Toạ độ CỤC BỘ: gốc = chân người chơi, +z = hướng chiêu, +x = bên phải (cùng quy ước js/scene/chieuFx.js: root.rotation.y = ry).
// Số đo thiếu thì dùng mặc định trùng js/world/aimSwipe.js (nón dài 8 m, góc 70°); đường thiếu bề rộng → 2 m.

/**
 * Đa giác vùng tung chiêu: mảng [x, z]. 'duong' → 4 góc hình chữ nhật; 'non' → đỉnh [0,0] rồi cung tròn (seg+1 điểm).
 * Hình lạ / vòng tròn / null → null (không vẽ xem trước). Đỉnh đầu tiên luôn là điểm bắt đầu của quạt tam giác để tô.
 */
export function previewPoly(h, seg = 14) {
  if (!h || typeof h !== 'object') return null;
  const dai = Number(h.dai) > 0 ? Number(h.dai) : 8;
  if (h.kieu === 'duong') {
    const w = (Number(h.rong) > 0 ? Number(h.rong) : 2) / 2;
    return [[-w, 0], [w, 0], [w, dai], [-w, dai]];
  }
  if (h.kieu === 'non') {
    const a = ((Number(h.goc) > 0 ? Number(h.goc) : 70) * Math.PI) / 360, n = Math.max(2, Math.floor(Number(seg)) || 14), pts = [[0, 0]];
    for (let i = 0; i <= n; i++) { const t = -a + (2 * a * i) / n; pts.push([Math.sin(t) * dai, Math.cos(t) * dai]); }
    return pts;
  }
  return null;
}
