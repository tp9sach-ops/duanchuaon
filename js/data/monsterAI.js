// Số liệu quái bãi rừng ĐÁNH TRẢ và Sinh Lực người chơi (Phiên 115; GDD v2 mục 4, 6.4, 8 và kế hoạch G1.6). Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1).
// Chỉ sửa số ở file này; logic ở js/world/monsterAttack.js (có test: tests/monsterattack.test.mjs). Tinh thần "không bạo lực": quái gồng chiêu báo trước, người chơi hết Sinh Lực chỉ được đưa về cửa chùa nghỉ, không mất đồ, không mất cấp.
export const ATTACK_CFG = Object.freeze({
  tam: true,
  speed: Object.freeze({ normal: 2.6, elite: 3.2 }),       // m/s khi đuổi theo người chơi
  reach: Object.freeze({ normal: 2.4, elite: 3.4 }),       // m: tầm đánh tính từ tâm quái tới người chơi
  windup: 0.7,                                             // giây gồng chiêu báo trước (quái phồng lên); người chơi chạy ra khỏi tầm trong lúc này thì né được
  interval: Object.freeze({ normal: 2.4, elite: 2.8 }),    // giây giữa hai lần bắt đầu gồng
  heSo: Object.freeze({ normal: 0.6, elite: 0.9 }),        // hệ số sát thương lên Sinh Lực người chơi (nhân Công của quái)
  maxHitPct: 0.35,                                         // một đòn không bao giờ mất quá 35% Sinh Lực tối đa (không bị hạ trong một đòn)
  stopFrac: 0.8,                                           // đuổi tới khi cách người chơi ≤ reach × 0,8 thì đứng lại đánh
  missSlack: 1.3,                                          // cuối gồng chiêu: người chơi còn trong reach × 1,3 mới bị trúng
  leash: 22,                                               // m: người chơi chạy xa hơn thì quái bỏ đuổi
  giveUp: 12,                                              // giây: quá ngần này không bị đánh và người chơi cách > 2 × reach thì quái bỏ đuổi
});
// Phiên 125: chiêu thứ hai của BOSS vùng — "Giậm Đất": cứ `slamEvery` đòn thì một đòn là giậm đất, gồng LÂU hơn (báo bằng vòng đỏ to), trúng mọi người trong bán kính `slamReach` (quay vòng, không chỉ trước mặt). Chạy ra ngoài vòng (hoặc nhảy khinh công) là né được. TẠM.
export const BOSS_ATTACK_CFG = Object.freeze({ tam: true, slamEvery: 3, slamWindup: 1.3, slamReach: 7.5, slamHeSo: 1.2 });
export const VITALS_CFG = Object.freeze({
  tam: true,
  regenDelay: 6,           // giây không giao tranh thì bắt đầu hồi Sinh Lực
  regenPctPerSec: 0.04,    // hồi 4% Sinh Lực tối đa mỗi giây
  hitGrace: 0.5,           // giây bất tử ngắn sau khi bị đánh (nhiều quái không đánh cùng một khung hình)
  koGrace: 4,              // giây bất tử sau khi được đưa về cửa chùa
  autoStopFrac: 0.3,       // Tự Động Hàng Yêu tự dừng khi Sinh Lực dưới 30%
});
