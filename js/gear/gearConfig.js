// Phiên 210 (S2, "Prompt nâng cấp sức hấp dẫn"): SỐ LIỆU nền cho hệ trang bị MỚI. Tất cả số là TẠM, chờ ptg thử chơi rồi chỉnh ở đây (không rải trong mã).
// Hệ này CHỈ CỘNG THÊM: không đụng loadout.js / items.js / gearSync.js. Cờ CONFIG.features.gear mặc định TẮT.
export const GEAR_KEY = 'lgt.gear.v1';
export const GEAR_VER = 1;

/** Bảy ô trang bị. Thứ tự cố định (dùng cho giao diện và gói mạng sau này). */
export const SLOTS = [
  { id: 'dau', ten: 'Đầu' },
  { id: 'than', ten: 'Thân' },
  { id: 'daivai', ten: 'Dải vai' },
  { id: 'co', ten: 'Cổ' },
  { id: 'tay', ten: 'Tay' },
  { id: 'chan', ten: 'Chân' },
  { id: 'linhvat', ten: 'Linh vật' },
];

/** Bốn bậc hiếm: màu viền thẻ + số nội tại tối đa (theo prompt mục 2.2). */
export const RARITY = [
  { id: 1, ten: 'Thường', mau: '#cfc8b4', noiTai: 0 },
  { id: 2, ten: 'Hiếm', mau: '#4aa58a', noiTai: 1 },
  { id: 3, ten: 'Quý', mau: '#d9b25f', noiTai: 2 },
  { id: 4, ten: 'Thánh', mau: '#e8a0b8', noiTai: 3 },
];

export const MAX_UPGRADE = 4;
/** Chi phí nâng từ bậc (lv) lên lv+1 (TẠM). la = lá bồ đề; nl = số nguyên liệu theo bậc hiếm (nhân thêm ở upgradeCost). Luôn thành công, không ngẫu nhiên. */
export const UPGRADE_COST = [
  { la: 50, nl: 0 },    // 0 → 1
  { la: 120, nl: 1 },   // 1 → 2
  { la: 250, nl: 2 },   // 2 → 3
  { la: 500, nl: 3 },   // 3 → 4
];
/** Trần tổng hệ số cộng thêm của mọi nội tại trang bị (TẠM, +25%). */
export const BONUS_CAP = 0.25;
