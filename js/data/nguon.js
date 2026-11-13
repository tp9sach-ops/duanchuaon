// Số liệu NGUỒN TU VI (GDD v2 mục 4.3; kế hoạch G1.4). Mọi con số ở đây là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1).
// Chỉ sửa số ở file này; logic nằm ở js/world/nguonTuVi.js (có test: tests/nguontuvi.test.mjs).
// Một lần nhận EXP = (EXP cần để lên cấp kế của người chơi) × moiLan × hệ số. Tỉ lệ GDD (40/30/15/15%) = số lần × moiLan (xem test):
//   hàng yêu 10 lần × 0,04 = 40% (Phiên 129: gấp đôi EXP mỗi lần thu phục, trước 20 lần × 0,02); nhiệm vụ 3 lần × 0,10 = 30%; hoạt động chùa (3 loại × 5 lần/ngày) 15 lần × 0,01 = 15%; boss/phó bản 1 lần × 0,15 = 15%.
export const NGUON_CFG = Object.freeze({
  tam: true,
  nguon: Object.freeze({
    hangYeu: Object.freeze({ tyLe: 0.40, moiLan: 0.04, lanChuan: 10 }),
    nhiemVu: Object.freeze({ tyLe: 0.30, moiLan: 0.10, lanChuan: 3 }),
    // Hoạt động chùa: mỗi LOẠI tối đa `tranNgay` lần/ngày (ngày tính theo giờ Việt Nam, UTC+7).
    hoatDong: Object.freeze({ tyLe: 0.15, moiLan: 0.01, loai: Object.freeze(['thien', 'tung', 'lay']), tranNgay: 5 }),
    boss: Object.freeze({ tyLe: 0.15, moiLan: 0.15, lanChuan: 1 }),
  }),
  // Chống cày quái quá yếu (chỉ hàng yêu, khi biết cấp quái): chênh ≤ mienGiam cấp → đủ EXP;
  // mỗi cấp chênh vượt mức đó giảm giamMoiCap (trừ vào hệ số), thấp nhất `san`.
  chenhLech: Object.freeze({ mienGiam: 5, giamMoiCap: 0.1, san: 0.1 }),
  // Phiên 122: TRẦN Tu Vi mỗi ngày (giờ VN) cho các nguồn có thể cày lặp (hàng yêu bãi rừng 30 lần/ngày, thu phục yêu quái hằng tháng 3 lần/ngày).
  // Phiên 138: ptg yêu cầu KHÔNG GIỚI HẠN trần kinh nghiệm → đặt Infinity (mọi lần thu phục đều có Tu Vi). Muốn có lại trần thì đặt số hữu hạn (hạt sen vẫn có trần riêng ở FARM_CFG.senCapNgay).
  tranNgay: Object.freeze({ hangYeu: Infinity, boss: Infinity }),
  muiGio: 7,   // Việt Nam UTC+7
});
