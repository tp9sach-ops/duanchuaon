// Số liệu quái bãi rừng ĐÁNH TRẢ và Sinh Lực người chơi (Phiên 115; GDD v2 mục 4, 6.4, 8 và kế hoạch G1.6). Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1).
// Chỉ sửa số ở file này; logic ở js/world/monsterAttack.js (có test: tests/monsterattack.test.mjs). Tinh thần "không bạo lực": quái gồng chiêu báo trước, người chơi hết Sinh Lực chỉ được đưa về cửa chùa nghỉ, không mất đồ, không mất cấp.
export const ATTACK_CFG = Object.freeze({
  tam: true,
  speed: Object.freeze({ normal: 2.6, elite: 3.2 }),       // m/s khi đuổi theo người chơi
  reach: Object.freeze({ normal: 2.4, elite: 3.4 }),       // m: tầm đánh tính từ tâm quái tới người chơi
  windup: 0.7,                                             // giây gồng chiêu báo trước (quái phồng lên); người chơi chạy ra khỏi tầm trong lúc này thì né được
  interval: Object.freeze({ normal: 2.0, elite: 2.3 }),   // Phiên 127: đánh dồn dập hơn (trước 2,4 / 2,8)    // giây giữa hai lần bắt đầu gồng
  heSo: Object.freeze({ normal: 0.9, elite: 1.35 }),   // Phiên 127: SÁT THƯƠNG CAO HƠN ×1,5 (trước 0,6 / 0,9)        // hệ số sát thương lên Sinh Lực người chơi (nhân Công của quái)
  maxHitPct: 0.35,                                         // một đòn không bao giờ mất quá 35% Sinh Lực tối đa (không bị hạ trong một đòn)
  stopFrac: 0.8,                                           // đuổi tới khi cách người chơi ≤ reach × 0,8 thì đứng lại đánh
  missSlack: 1.3,                                          // cuối gồng chiêu: người chơi còn trong reach × 1,3 mới bị trúng
  leash: 22,                                               // m: người chơi chạy xa hơn thì quái bỏ đuổi
  giveUp: 12,                                              // giây: quá ngần này không bị đánh và người chơi cách > 2 × reach thì quái bỏ đuổi
});
// Phiên 125: chiêu thứ hai của BOSS vùng — "Giậm Đất": cứ `slamEvery` đòn thì một đòn là giậm đất, gồng LÂU hơn (báo bằng vòng đỏ to), trúng mọi người trong bán kính `slamReach` (quay vòng, không chỉ trước mặt). Chạy ra ngoài vòng (hoặc nhảy khinh công) là né được. TẠM.
export const BOSS_ATTACK_CFG = Object.freeze({ tam: true, slamEvery: 3, slamWindup: 1.3, slamReach: 7.5, slamHeSo: 1.8 });
export const VITALS_CFG = Object.freeze({
  tam: true,
  regenDelay: 6,           // giây không giao tranh thì bắt đầu hồi Sinh Lực
  regenPctPerSec: 0.04,    // hồi 4% Sinh Lực tối đa mỗi giây
  hitGrace: 0.5,           // giây bất tử ngắn sau khi bị đánh (nhiều quái không đánh cùng một khung hình)
  koGrace: 4,              // giây bất tử sau khi được đưa về cửa chùa
  autoStopFrac: 0.3,       // Tự Động Hàng Yêu tự dừng khi Sinh Lực dưới 30%
});

// Phiên 232 (mục 1): KIỂU ĐÒN của quái — mỗi loại quái có 2 kiểu đòn luân phiên; vùng đánh có HƯỚNG (khóa theo hướng quái đang nhìn lúc bắt đầu gồng, nên chạy ngang là né được).
// kieu: 'non' (quạt: góc `goc` độ), 'duong' (lao thẳng: rộng `rong` m, quái lao tới ~`lao` m), 'tron' (đập quanh thân). `k` nhân với tầm (reach × missSlack) để ra chiều dài / bán kính vùng đánh. TẠM, chờ ptg duyệt.
export const PATTERNS = Object.freeze({
  vuot: Object.freeze({ id: 'vuot', ten: 'Vuốt quét', kieu: 'non', goc: 120, k: 1.0 }),
  chem: Object.freeze({ id: 'chem', ten: 'Chém dọc', kieu: 'non', goc: 70, k: 1.15 }),
  nen: Object.freeze({ id: 'nen', ten: 'Đập đất', kieu: 'tron', k: 0.95 }),
  lao: Object.freeze({ id: 'lao', ten: 'Lao tới', kieu: 'duong', rong: 1.6, k: 1.45, lao: 1.6 }),
  xoay: Object.freeze({ id: 'xoay', ten: 'Xoay vòng', kieu: 'tron', k: 1.05 }),
  xung: Object.freeze({ id: 'xung', ten: 'Xung thẳng', kieu: 'duong', rong: 2.2, k: 1.7, lao: 2.4 }),
});
/** Hai kiểu đòn luân phiên cho từng loại quái (đòn chẵn → [0], lẻ → [1]). Loại lạ → ['vuot', 'nen']. */
export const MON_PATTERNS = Object.freeze({
  dameo: ['lao', 'vuot'], reutinh: ['nen', 'vuot'], daotac: ['chem', 'vuot'], cuopduong: ['chem', 'xoay'], thuyquy: ['vuot', 'lao'], lyngu: ['xung', 'xoay'],
  thachtinh: ['nen', 'vuot'], hothap: ['nen', 'xung'], laomoc: ['vuot', 'nen'], soncuoc: ['chem', 'xung'], thachlinh: ['nen', 'xoay'], thuymau: ['xoay', 'xung'],
  hoaly: ['lao', 'chem'], viemma: ['chem', 'xoay'], viemde: ['xung', 'nen'], cotmoc: ['vuot', 'nen'], thuvuong: ['xoay', 'vuot'], thumau: ['nen', 'xoay'],
  kimgiap: ['chem', 'lao'], kimtuong: ['xung', 'chem'], kimvuong: ['chem', 'xoay'], nhamcu: ['nen', 'vuot'], nhamvuong: ['nen', 'xung'], solinh: ['xoay', 'nen'],
});
