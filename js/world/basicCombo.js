// Phiên 198 (mục 2): ĐÁNH THƯỜNG = LAO TỚI + COMBO 3 ĐÒN. LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ: `now` do nơi gọi đưa vào), có test: tests/basiccombo.test.mjs.
//  • Bấm Đánh thường khi quái còn xa tầm đâm nhưng trong tầm lao (DASH_RANGE) → nhân vật LAO tới sát quái (chưa ra đòn). Bấm tiếp → ra đòn 1.
//  • Chuỗi 3 đòn, 3 động tác khác nhau (js/world/combo.js CHAIN): 1 = chém ngang trái→phải, 2 = chém ngược phải→trái, 3 = XOAY 360° — đòn 3 có SÁT THƯƠNG LAN quanh người chơi.
//  • Quái nào dính sát thương thì nổi giận đánh lại (js/ui/farmCombat.js thấy Oán Khí giảm là cho quái đánh trả — không cần sửa ở đây).
//  • Không có quái (hoặc quái quá xa) vẫn đánh thường được: vung vào không khí, chuỗi vẫn nối, KHÔNG gây sát thương ai.
// Mọi con số là QUY ƯỚC TẠM (tam: true), chờ ptg chơi thử rồi chỉnh.
export const BASIC = Object.freeze({
  tam: true,
  steps: 3,            // số đòn trong một chuỗi
  dashRange: 8,        // m: quái cách mép thân ≤ ngần này (và còn xa tầm đâm) thì bấm Đánh thường = lao tới
  resetGap: 1.1,       // giây: quá ngần này kể từ đòn trước thì chuỗi về đòn 1
  stepMul: Object.freeze([1, 1, 1.5]),   // hệ số sát thương theo đòn (đòn 3 mạnh hơn)
  splashR: 4.2,        // m: bán kính sát thương lan của đòn 3 (trùng tầm vệt xoay 360° trong combo.js SLASH.xoay.reach)
  splashPct: 0.7,      // quái phụ (không phải mục tiêu chính) nhận 70% sát thương đòn 3
  dashCd: 0.45,        // giây: sau khi lao chưa bấm đòn ngay được (chống bấm dồn)
});

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);

/**
 * Bấm Đánh thường thì làm gì. in: { has (có mục tiêu), gap (m, người chơi → TÂM quái), body (bán kính thân quái), melee (tầm đâm), dashRange }.
 * Trả 'air' (không có quái) | 'hit' (trong tầm đâm: ra đòn) | 'dash' (xa tầm đâm nhưng trong tầm lao) | 'far' (quá xa: vung không khí).
 */
export function planTap({ has = false, gap = Infinity, body = 0, melee = 3.6, dashRange = BASIC.dashRange } = {}) {
  if (!has) return 'air';
  const edge = num(gap, Infinity) - num(body);
  if (edge <= num(melee, 3.6)) return 'hit';
  return edge - num(melee, 3.6) <= num(dashRange, BASIC.dashRange) ? 'dash' : 'far';
}

/** Đòn kế tiếp (1..3). prev = đòn vừa ra (0 = chưa), since = số giây từ đòn đó. Quá hạn hoặc vừa xong đòn 3 → về 1. */
export function nextStep(prev, since) {
  const p = Math.floor(num(prev));
  return p >= 1 && p < BASIC.steps && num(since, Infinity) <= BASIC.resetGap ? p + 1 : 1;
}

/** Sát thương nhân theo đòn (đòn lạ → 1). */
export const stepMul = (step) => BASIC.stepMul[Math.floor(num(step)) - 1] || 1;

/**
 * Quái dính đòn lan: mọi quái trong `r` m (tính từ MÉP thân) quanh `center`, trừ quái `exceptUid`. mons: [{ uid, x, z, ... }]; bodyOf(m) = bán kính thân.
 * Trả mảng quái (đúng thứ tự đưa vào).
 */
export function splashTargets(center, mons, r = BASIC.splashR, exceptUid = '', bodyOf = () => 0) {
  if (!center || !Array.isArray(mons)) return [];
  const cx = num(center.x, NaN), cz = num(center.z, NaN); if (!Number.isFinite(cx) || !Number.isFinite(cz)) return [];
  return mons.filter((m) => m && m.uid !== exceptUid && Math.hypot(num(m.x, 1e9) - cx, num(m.z, 1e9) - cz) - num(bodyOf(m)) <= r);
}
