// Số liệu QUÁI CỐ ĐỊNH Ở BÃI RỪNG (GDD v2 mục 8; kế hoạch G3.6). Mọi con số ở đây là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1).
// Chỉ sửa số ở file này; logic nằm ở js/world/spawn.js (có test: tests/spawn.test.mjs).
// Tên quái, cấp và Hệ lấy từ bảng GDD mục 8. GDD ghi chung "Quái thường / tinh anh" mà không chỉ rõ con nào là tinh anh:
// quy ước TẠM ở đây: con đứng sau trong mỗi vùng (Rêu Tinh, Cướp Đường) là TINH ANH. Quái tinh anh hồi sinh 5 phút (GDD), quái thường 30–60 giây (GDD).
// Quái thường sinh CỤC BỘ theo từng người (không đồng bộ mạng): GDD mục 8 và câu 10. Boss vùng (Lão Mộc Tinh, Sơn Cước Đầu Mục) là việc của G4.1, KHÔNG nằm ở đây.
export const MON_CFG = Object.freeze({
  tam: true,
  // Oán Khí tối đa = (oanBase + oanPerLv × cấp) × (tinh anh ? eliteMul : 1). Dã Mèo Rừng cấp 3 = 66.
  oanBase: 30, oanPerLv: 12, eliteMul: 3,
});

// drop: khi quái được thu phục (Oán Khí về 0): xác suất `chance` rơi Hạt Sen trong khoảng [min, max]. Hạt sen là phần "công đức" hàng yêu đem lại (GDD mục 13).
export const MONSTERS = Object.freeze({
  dameo: Object.freeze({ id: 'dameo', ten: 'Dã Mèo Rừng', lv: 3, he: 'moc', elite: false, drop: Object.freeze({ chance: 0.5, min: 1, max: 1 }) }),
  reutinh: Object.freeze({ id: 'reutinh', ten: 'Rêu Tinh', lv: 10, he: 'moc', elite: true, drop: Object.freeze({ chance: 1, min: 3, max: 5 }) }),
  daotac: Object.freeze({ id: 'daotac', ten: 'Đạo Tặc Sơn Cước', lv: 15, he: 'kim', elite: false, drop: Object.freeze({ chance: 0.5, min: 1, max: 2 }) }),
  cuopduong: Object.freeze({ id: 'cuopduong', ten: 'Cướp Đường', lv: 22, he: 'kim', elite: true, drop: Object.freeze({ chance: 1, min: 4, max: 6 }) }),
});

// Hồi sinh (giây, giữ GDD mục 8): thường 30–60, tinh anh 5 phút.
export const RESPAWN_CFG = Object.freeze({ normal: Object.freeze([30, 60]), elite: Object.freeze([300, 300]) });
// Đặt quái: cách nhau ≥ minGap m, cách người chơi ≥ minFromPlayer m, thử tối đa `tries` lần mỗi chỗ, đặt không được thì thử lại sau `retry` giây.
export const SPAWN_CFG = Object.freeze({ minGap: 3, minFromPlayer: 6, tries: 30, retry: 5 });

// Hai vùng đầu. `rects` NẰM TRỌN trong vùng đi bộ OUT_WALKS (js/world/outside.js), chừa lề ≥ 1 m; `avoid` = hình tròn tránh (miếu, cổ thụ, hồ + thủy tạ).
// Các hình chữ nhật của hai vùng KHÔNG chồng nhau. cap = tối đa số quái cùng lúc (GDD: ~12); eliteMax ≤ cap.
export const FARM_ZONES = Object.freeze({
  biaRungThong: Object.freeze({
    id: 'biaRungThong', ten: 'Bìa Rừng Thông', lvMin: 3, lvMax: 20, he: 'moc', cap: 12, eliteMax: 1,
    normal: Object.freeze(['dameo']), elite: Object.freeze(['reutinh']),
    rects: Object.freeze([{ x0: -117, x1: -91, z0: 73, z1: 107 }, { x0: -90, x1: -72, z0: 85, z1: 93 }]),
    avoid: Object.freeze([{ x: -100.5, z: 75.5, r: 3.2 }, { x: -106, z: 90, r: 3.6 }, { x: -110, z: 102, r: 8.5 }]),
  }),
  duongMon: Object.freeze({
    id: 'duongMon', ten: 'Đường Mòn Đông–Tây', lvMin: 12, lvMax: 25, he: 'kim', cap: 12, eliteMax: 1,
    normal: Object.freeze(['daotac']), elite: Object.freeze(['cuopduong']),
    rects: Object.freeze([{ x0: -66, x1: -18, z0: 85, z1: 93 }, { x0: 20, x1: 80, z0: 100, z1: 108 }]),
    avoid: Object.freeze([]),
  }),
});
