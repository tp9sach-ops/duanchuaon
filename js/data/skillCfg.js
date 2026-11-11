// Số liệu bộ máy kỹ năng (GDD v2 mục 6.1, 6.4; kế hoạch G2.3). Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1).
// Chỉ sửa số ở file này; logic ở js/world/skillEngine.js (có test: tests/skillengine.test.mjs).
export const SKILL_LV = Object.freeze({
  tam: true,
  max: 10,            // cấp skill tối đa
  perLevel: 0.06,     // mỗi cấp +6% hệ số (cấp 1 = số GDD gốc; cấp n = gốc × (1 + 0,06 × (n − 1)))
  tuViPerLevel: 10,   // cấp skill tối đa = Tu Vi ÷ 10 (làm tròn xuống, kẹp ở max)
  tamAnMax: 5,        // Tâm Ấn tối đa
  tamAnPerHit: 1,     // mỗi đòn đánh thường trúng +1 Tâm Ấn
});
