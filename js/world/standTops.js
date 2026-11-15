// MẶT ĐỨNG (`top`, m) của các vật còn lại trong chùa + ngoài chùa (Phiên 202, mục 1). Cùng quy ước với layout.js (Phiên 200): chân cao ≥ top − 0,05 thì bay/đi QUA PHÍA TRÊN và đáp xuống đứng lên;
// thấp hơn thì vẫn bị chặn (không xuyên). Vật không có top/h chặn mọi độ cao. Mọi con số là QUY ƯỚC TẠM — ptg thử rồi báo vật nào đứng chìm/lơ lửng bao nhiêu để chỉnh Ở ĐÂY (một nơi duy nhất).
// Cách làm: tìm vật đã đăng ký trong CIRCLES/RECTS (khớp toạ độ) rồi gắn `top`, nên không phải sửa outside.js / layout.js. Import file này là tự gắn (một lần). Nhà/đá/cây/tượng/tháp của landscape.js và placements.js đã gắn top ngay lúc đăng ký.
// LƯU Ý: mái cửa hàng phố nằm ngoài vùng đi được (OUT_WALKS) nên chỉ đứng được ở dải sát vỉa hè; núi/vách biên bản đồ là ranh giới chặn, chưa có độ cao (chờ ptg chỉ rõ núi nào).
import { CIRCLES, RECTS, BELL, CENSER } from './layout.js';
import { TREES, TREE_R } from './placements.js';
import { OUT_ROCKS, DA_LANG, GIENG, CO_THU, STREET_LAMPS, VILLAGE_GATE, STALLS, DINH_NGHI, MIEU, DAI_PHAT, BAO_THAP, STORE_9SACH, STORE_TACHHOA, STORE_DIDONG, STORE_DIENMAY, STORE_KIMHOAN } from './outside.js';

const same = (a, b) => Math.abs(a - b) < 1e-6;
const hasTop = (o) => Number.isFinite(+o.top) || Number.isFinite(+o.h);
/** Gắn top cho vật tròn đã đăng ký khớp {x, z, r}. Trả true nếu gắn được. */
export function markCircle(c, top) { const o = CIRCLES.find((q) => same(q.x, c.x) && same(q.z, c.z) && same(q.r, c.r)); if (o && !hasTop(o)) { o.top = top; return true; } return false; }
/** Gắn top cho vật chữ nhật đã đăng ký khớp {x0, x1, z0, z1}. Trả true nếu gắn được. */
export function markRect(r, top) { const o = RECTS.find((q) => same(q.x0, r.x0) && same(q.x1, r.x1) && same(q.z0, r.z0) && same(q.z1, r.z1)); if (o && !hasTop(o)) { o.top = top; return true; } return false; }

let done = false;
/** Gắn mặt đứng cho vật trong chùa (gác chuông, lư hương, cây bồ đề, bụi tre, cây sân) và ngoài chùa (đá, cổ thụ, giếng, trụ đèn, cổng làng, quầy chợ, đình, miếu, bảo tháp, đèn đá, cửa hàng). Trả số vật đã gắn. */
export function registerTops() {
  if (done) return 0; done = true; let n = 0;
  const c = (o, t) => { if (markCircle(o, t)) n++; }, r = (o, t) => { if (markRect(o, t)) n++; };
  // trong chùa
  c({ x: BELL.x, z: BELL.z, r: BELL.r }, 7.5);   // gác chuông
  c({ x: CENSER.x, z: CENSER.z, r: 1.9 }, 2.2);   // lư hương
  [[-24, 6, 1.0], [24, 26, 1.0], [-34, -16, 1.1]].forEach(([x, z, rr]) => c({ x, z, r: rr }, 8));   // cây bồ đề
  [[-40, 12, 2.4], [42, 8, 2.4]].forEach(([x, z, rr]) => c({ x, z, r: rr }, 4));   // bụi tre
  TREES.forEach((t) => c({ x: t.x, z: t.z, r: TREE_R }, 7 * t.s));   // thân cây sân (tán đã có deck 3,6 ở placements.js)
  // ngoài chùa
  OUT_ROCKS.forEach((o) => c(o, Math.max(0.9, o.r * 0.9)));
  c(DA_LANG, 5.5); c(CO_THU, 5.5); c(GIENG, 1.0);
  STREET_LAMPS.forEach((o) => c(o, 3.0));
  VILLAGE_GATE.posts.forEach((x) => c({ x, z: VILLAGE_GATE.z, r: VILLAGE_GATE.r }, 4.0));
  STALLS.forEach((s) => r(s, 2.4));
  r(DINH_NGHI, 4.8); r(MIEU, 3.8);
  r(DAI_PHAT.bac, 1.0); DAI_PHAT.den.forEach((o) => c(o, 1.2));   // bậc đá + hai đèn đá trước Đại Phật (vách đá lớn chưa có độ cao)
  c({ x: BAO_THAP.cx, z: BAO_THAP.cz, r: BAO_THAP.r }, 14); BAO_THAP.den.forEach((o) => c(o, 1.5));   // Bảo tháp + 4 đèn đá
  for (const st of [STORE_9SACH, STORE_TACHHOA, STORE_DIDONG, STORE_DIENMAY, STORE_KIMHOAN]) r(st.than, 4.6);   // mái cửa hàng phố
  return n;
}
registerTops();
