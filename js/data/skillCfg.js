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

// Lễ Khai Ngộ (GDD v2 mục 5.2, 5.6; kế hoạch G2.4). TẠM, chờ ptg duyệt và playtest (G8.1).
// Logic ở js/world/khaiNgo.js (có test: tests/khaingo.test.mjs).
export const KHAI_NGO = Object.freeze({
  tam: true,
  tuViMin: 10,        // đủ Tu Vi 10 mới được làm lễ
  trialSec: 60,       // thời gian dùng thử Skill 1 sau khi ngồi vào bồ đoàn một Hệ
  taiKhaiLa: 20,      // Tái Khai Ngộ (đổi sang Hệ khác): 20 lá bồ đề
  heKey: 'lgt.he',    // khóa localStorage lưu Hệ đã chọn (khóa lgt.* tự đồng bộ theo tài khoản)
});
