// Số liệu chỉ số chiến đấu theo Tu Vi (GDD v2 mục 4, 6.4; kế hoạch G1.1). Mọi con số ở đây là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1).
// Chỉ sửa số ở file này; logic nằm ở js/world/stats.js (có test: tests/stats.test.mjs).
// Tu Vi (cấp 1..150) là hệ RIÊNG, không đè 10 bậc công hạnh `level` (xem docs/GDD_v2_DOICHIEU.md mục 2).
export const STATS_CFG = Object.freeze({
  tam: true,                 // đánh dấu: số liệu tạm
  tuViMin: 1,
  tuViMax: 150,
  // Mỗi chỉ số = base + perLevel × (Tu Vi − 1), làm tròn xuống.
  cong: Object.freeze({ base: 10, perLevel: 3 }),        // Công:   cấp 1 = 10,  cấp 150 = 457
  thu: Object.freeze({ base: 5, perLevel: 2 }),          // Thủ:    cấp 1 = 5,   cấp 150 = 303
  sinhLuc: Object.freeze({ base: 120, perLevel: 25 }),   // Sinh Lực: cấp 1 = 120, cấp 150 = 3845
});
// Đường cong Tu Vi (GDD v2 mục 4.2, G1.2): EXP để lên từ cấp n lên cấp n+1 = heSo × n^mu, làm tròn. Các mốc "≈ 1.200 / 6.900 / 21.000..." trong GDD chính là giá trị này tại n = 10 / 30 / 60... (không phải tổng tích lũy).
export const EXP_CFG = Object.freeze({ tam: true, heSo: 30, mu: 1.6 });
