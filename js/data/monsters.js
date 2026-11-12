// Số liệu QUÁI CỐ ĐỊNH Ở BÃI RỪNG (GDD v2 mục 8; kế hoạch G3.6). Mọi con số ở đây là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1).
// Chỉ sửa số ở file này; logic nằm ở js/world/spawn.js (có test: tests/spawn.test.mjs).
// Tên quái, cấp và Hệ lấy từ bảng GDD mục 8. GDD ghi chung "Quái thường / tinh anh" mà không chỉ rõ con nào là tinh anh:
// quy ước TẠM ở đây: con đứng sau trong mỗi vùng (Rêu Tinh, Cướp Đường) là TINH ANH. Hồi sinh: xem RESPAWN_CFG bên dưới (Phiên 129 làm nhanh hơn GDD: thường 10–20 giây, tinh anh 2 phút).
// Quái thường sinh CỤC BỘ theo từng người (không đồng bộ mạng): GDD mục 8 và câu 10. Boss vùng (Lão Mộc Tinh, Sơn Cước Đầu Mục) là việc của G4.1, KHÔNG nằm ở đây.
export const MON_CFG = Object.freeze({
  tam: true,
  // Oán Khí tối đa = (oanBase + oanPerLv × cấp) × (tinh anh ? eliteMul : 1). Dã Mèo Rừng cấp 3 = 66.
  // Phiên 123: BOSS vùng = (oanBase + oanPerLv × cấp) × bossMul. Lão Mộc Tinh cấp 20 = (30+240)×8 = 2160.
  oanBase: 50, oanPerLv: 25, eliteMul: 3, bossMul: 5,   // Phiên 127: QUÁI TRÂU HƠN (trước: 30 + 12×cấp, boss ×8). Dã Mèo cấp 3 = 125; Rêu Tinh (tinh anh) = 900; Lão Mộc Tinh = 2750. TẠM, chờ ptg duyệt
});

// drop: khi quái được thu phục (Oán Khí về 0): xác suất `chance` rơi Hạt Sen trong khoảng [min, max]. Hạt sen là phần "công đức" hàng yêu đem lại (GDD mục 13).
export const MONSTERS = Object.freeze({
  dameo: Object.freeze({ id: 'dameo', ten: 'Dã Mèo Rừng', lv: 3, he: 'moc', elite: false, drop: Object.freeze({ chance: 0.5, min: 1, max: 1 }) }),
  reutinh: Object.freeze({ id: 'reutinh', ten: 'Rêu Tinh', lv: 10, he: 'moc', elite: true, drop: Object.freeze({ chance: 1, min: 3, max: 5 }) }),
  daotac: Object.freeze({ id: 'daotac', ten: 'Đạo Tặc Sơn Cước', lv: 15, he: 'kim', elite: false, drop: Object.freeze({ chance: 0.5, min: 1, max: 2 }) }),
  cuopduong: Object.freeze({ id: 'cuopduong', ten: 'Cướp Đường', lv: 22, he: 'kim', elite: true, drop: Object.freeze({ chance: 1, min: 4, max: 6 }) }),
  // Phiên 114: vùng thứ ba (Hồ Thác Đại Phật, Hệ Thủy). Quy ước TẠM như trên: Lý Ngư Tinh (con sau) là TINH ANH. Hạt sen rơi nhỉnh hơn vùng trước vì cấp cao hơn; vẫn bị trần FARM_CFG.senCapNgay.
  thuyquy: Object.freeze({ id: 'thuyquy', ten: 'Thủy Quỷ Hồ Thác', lv: 28, he: 'thuy', elite: false, drop: Object.freeze({ chance: 0.5, min: 1, max: 3 }) }),
  lyngu: Object.freeze({ id: 'lyngu', ten: 'Lý Ngư Tinh', lv: 38, he: 'thuy', elite: true, drop: Object.freeze({ chance: 1, min: 5, max: 8 }) }),
  // Phiên 123: BOSS VÙNG (GDD mục 8). Mỗi vùng 1 con, hiện CẢ NGÀY LẪN ĐÊM (quái thường mới chỉ ban đêm), nằm ngủ trong bụi; bị đánh mới đứng dậy. Tính là nguồn Tu Vi 'boss' (trần 3 lần/ngày). Hạt sen rơi nhiều hơn, vẫn bị trần ngày.
  laomoc: Object.freeze({ id: 'laomoc', ten: 'Lão Mộc Tinh', lv: 20, he: 'moc', elite: false, boss: true, drop: Object.freeze({ chance: 1, min: 12, max: 20 }) }),
  soncuoc: Object.freeze({ id: 'soncuoc', ten: 'Sơn Cước Đầu Mục', lv: 25, he: 'kim', elite: false, boss: true, drop: Object.freeze({ chance: 1, min: 15, max: 25 }) }),
  thuymau: Object.freeze({ id: 'thuymau', ten: 'Thủy Mẫu Hồ Thác', lv: 45, he: 'thuy', elite: false, boss: true, drop: Object.freeze({ chance: 1, min: 20, max: 30 }) }),
});

// Hồi sinh (giây). Phiên 129: NHANH HƠN theo yêu cầu ptg (trước theo GDD mục 8: thường 30–60, tinh anh 300). Nay: thường 10–20, tinh anh 120. Boss vùng giữ 45 phút. TẠM, chờ ptg duyệt.
export const RESPAWN_CFG = Object.freeze({ normal: Object.freeze([10, 20]), elite: Object.freeze([120, 120]), boss: Object.freeze([2700, 2700]) });   // boss vùng 45 phút (GDD mục 8); Phiên 123: sinh LOCAL theo từng người, chung phòng qua Firebase để sau
// Đặt quái: cách nhau ≥ minGap m, cách người chơi ≥ minFromPlayer m, thử tối đa `tries` lần mỗi chỗ, đặt không được thì thử lại sau `retry` giây.
export const SPAWN_CFG = Object.freeze({ minGap: 3, minFromPlayer: 6, tries: 30, retry: 5 });

// Ba vùng (hai vùng đầu Phiên 107, vùng Hồ Thác Phiên 114). `rects` NẰM TRỌN trong vùng đi bộ OUT_WALKS (js/world/outside.js), chừa lề ≥ 1 m; `avoid` = hình tròn tránh (miếu, cổ thụ, hồ + thủy tạ).
// Các hình chữ nhật của hai vùng KHÔNG chồng nhau. cap = tối đa số quái cùng lúc (GDD: ~12); eliteMax ≤ cap.
export const FARM_ZONES = Object.freeze({
  // Phiên 119: vùng Mộc cũng DỜI khỏi bãi rừng thông (miếu, cổ thụ, Hồ Rừng + thủy tạ để chụp hình) vào khoảng đất trống 'rung-sau-bac'. Id giữ nguyên.
  biaRungThong: Object.freeze({
    id: 'biaRungThong', nightOnly: true, ten: 'Rừng Sâu Phía Bắc', lvMin: 3, lvMax: 20, he: 'moc', cap: 12, eliteMax: 1,
    normal: Object.freeze(['dameo']), elite: Object.freeze(['reutinh']), boss: 'laomoc',
    rects: Object.freeze([{ x0: -76.5, x1: -47.5, z0: 51.5, z1: 76.5 }]),
    avoid: Object.freeze([]),
  }),
  // Phiên 118: hai vùng sau DỜI khỏi đường mòn và bãi dưới thác (để đường thông thoáng, Đại Phật + thác để chụp hình) vào hai khoảng đất trống rừng sâu mới (OUT_WALKS 'rung-sau-dong' / 'rung-sau-tay'). Id giữ nguyên để lưu/test không đổi.
  duongMon: Object.freeze({
    id: 'duongMon', nightOnly: true, ten: 'Rừng Sâu Phía Đông', lvMin: 12, lvMax: 25, he: 'kim', cap: 12, eliteMax: 1,
    normal: Object.freeze(['daotac']), elite: Object.freeze(['cuopduong']), boss: 'soncuoc',
    rects: Object.freeze([{ x0: 37.5, x1: 66.5, z0: 121.5, z1: 140.5 }]),
    avoid: Object.freeze([]),
  }),
  hoThac: Object.freeze({
    id: 'hoThac', nightOnly: true, ten: 'Rừng Sâu Phía Tây', lvMin: 25, lvMax: 45, he: 'thuy', cap: 12, eliteMax: 1,
    normal: Object.freeze(['thuyquy']), elite: Object.freeze(['lyngu']), boss: 'thuymau',
    rects: Object.freeze([{ x0: -76.5, x1: -47.5, z0: 105.5, z1: 128.5 }]),
    avoid: Object.freeze([]),
  }),
});

// Farm quái bãi rừng (Phiên 107, G1.6a). TẠM, chờ ptg duyệt và playtest (G8.1).
// senCapNgay: trần HẠT SEN (công đức) nhận từ hàng yêu mỗi ngày giờ Việt Nam. Vượt trần vẫn được Tu Vi (EXP), chỉ không rơi hạt sen,
// để kinh tế hạt sen → lá bồ đề → đất (js/world/merit.js: các nguồn khác đều có trần ngày) không bị cày vô hạn. 100 hạt sen = 10 lá bồ đề mỗi ngày.
// nearMargin: người chơi cách vùng farm ≤ số mét này thì quái được vẽ và chạy; xa hơn thì quái đứng yên (không vẽ, không tốn máy).
// maxVisible: số quái tối đa vẽ cùng lúc (bể mô hình của js/scene/farm.js). Hai vùng sát nhau (Bìa Rừng Thông và Đường Mòn) có thể cùng hiện: 2 × 12 = 24 ≤ 26.
export const FARM_CFG = Object.freeze({ tam: true,
  // Phiên 116: quái bãi rừng CHỈ hiện khi trời tối trong game (LGT.night > nightAt); ban ngày bãi trống để chụp hình check-in. (Boss to ban ngày: G4.1.)
  nightAt: 0.55,
  senCapNgay: 100, nearMargin: 40, maxVisible: 26,
  // Tự Động Hàng Yêu (GDD v2 mục 12, câu 7; TẠM): tự đánh quái trong tầm autoRange (m), tối đa autoSecNgay giây mỗi ngày giờ VN (60 phút).
  autoRange: 15, autoSecNgay: 3600 });
