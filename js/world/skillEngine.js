// Bộ máy kỹ năng chiến đấu (G2.3, GDD v2 mục 6.1 và 6.4). LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ: `now` là giây do người gọi đưa vào), có test: tests/skillengine.test.mjs.
//   Hồi chiêu theo từng skill · Tâm Ấn (+1 mỗi đòn trúng, tối đa 5; Tuyệt Học tiêu 5) · cấp skill 1–10 (+6% hệ số mỗi cấp, trần = Tu Vi ÷ 10).
// Dữ liệu skill: js/data/combatSkills.js; tra cứu: js/world/skillCatalog.js; số liệu bộ máy: js/data/skillCfg.js (TẠM).
// CHƯA có: chi phí nâng cấp skill (điểm dùng skill + hạt sen), áp dụng hiệu ứng (choáng, độc, khiên...) và nối giao diện. Đó là các mục sau.
import { SKILL_LV as L } from '../data/skillCfg.js';
import { SKILL_CAP } from '../data/combatSkills.js';
import { skillFor } from './skillCatalog.js';
import { normHe } from './elements.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const round4 = (x) => Math.round(x * 1e4) / 1e4;

/** Cấp skill tối đa theo Tu Vi: floor(Tu Vi ÷ 10), kẹp 0..10. Tu Vi lạ → 0. */
export const skillLevelCap = (tuvi) => Math.max(0, Math.min(L.max, Math.floor(num(tuvi) / L.tuViPerLevel)));
/** Hệ số nhân theo cấp skill: 1 + 0,06 × (cấp − 1); cấp kẹp 1..10. */
export const levelMult = (lv) => round4(1 + L.perLevel * (Math.max(1, Math.min(L.max, Math.floor(num(lv, 1)))) - 1));
/** Hệ số sát thương thật của skill ở cấp `lv` (heSo gốc × levelMult). Skill lạ → 0. */
export const effectiveHeSo = (skill, lv) => (skill && Number.isFinite(+skill.heSo) ? round4(skill.heSo * levelMult(lv)) : 0);
/** Còn nâng được cấp skill này ở Tu Vi `tuvi` không? (cấp hiện tại < trần theo Tu Vi). */
export const canUpgradeLevel = (lv, tuvi) => Math.max(1, Math.floor(num(lv, 1))) < skillLevelCap(tuvi);

/**
 * Trạng thái kỹ năng của một người chơi.
 * opts: { he, phapMon, tuvi }. Mọi thời gian `now` tính bằng giây (số tăng dần, do người gọi đưa vào).
 */
export function createSkillRuntime(opts = {}) {
  const o = opts && typeof opts === 'object' ? opts : {};
  let he = normHe(o.he), phapMon = typeof o.phapMon === 'string' ? o.phapMon : null, tuvi = Math.max(0, num(o.tuvi));
  let tamAn = 0;
  let levels = {};       // id skill → cấp đã nâng
  let readyAt = {};      // id skill → thời điểm (giây) dùng lại được

  const levelOf = (id) => Math.max(1, Math.floor(num(levels[id], 1)));
  const effLevel = (id) => Math.max(1, Math.min(levelOf(id), skillLevelCap(tuvi)));

  return {
    get he() { return he; }, get phapMon() { return phapMon; }, get tuvi() { return tuvi; }, get tamAn() { return tamAn; },
    /** Đặt Tu Vi (lạ → 0). */
    setTuVi(v) { tuvi = Math.max(0, num(v)); },
    /** Chọn Hệ + Pháp Môn. Đổi sang Hệ KHÁC → kỹ năng về cấp 1, xóa hồi chiêu (GDD 5.6). Cùng Hệ chỉ đổi Pháp Môn. Hệ lạ → false, không đổi. */
    setHe(newHe, newPhapMon = null) {
      const h = normHe(newHe); if (!h) return false;
      if (h !== he) { levels = {}; readyAt = {}; }
      he = h; phapMon = typeof newPhapMon === 'string' ? newPhapMon : null; return true;
    },
    /** Cấp đã nâng của skill (mặc định 1). */
    levelOf,
    /** Cấp dùng thật khi đánh: min(cấp đã nâng, trần theo Tu Vi), ít nhất 1. */
    effectiveLevel: effLevel,
    /** Nâng skill lên cấp `lv`: kẹp vào 1..trần theo Tu Vi; không hạ cấp. Trả cấp sau khi đặt; skill lạ → 0. */
    setLevel(id, lv) {
      if (typeof id !== 'string' || !id) return 0;
      const cap = Math.max(1, skillLevelCap(tuvi));
      levels[id] = Math.max(levelOf(id), Math.min(cap, Math.floor(num(lv, 1)))); return levels[id];
    },
    /** Đòn đánh thường trúng `n` lần: +1 Tâm Ấn mỗi đòn, tối đa 5. Trả Tâm Ấn mới. `n` lạ/âm → không đổi. */
    onHit(n = 1) { const k = Math.max(0, Math.floor(num(n))); tamAn = Math.min(L.tamAnMax, tamAn + k * L.tamAnPerHit); return tamAn; },
    /** Số giây còn lại của hồi chiêu skill `id` tại `now` (0 nếu dùng được). */
    cooldownLeft(id, now) { return Math.max(0, round4(num(readyAt[id], 0) - num(now))); },
    /**
     * Thử dùng skill ở ô `slot` (1|2|3|4|'tuyet') tại thời điểm `now`.
     * Thất bại: { ok:false, reason } với reason = 'khong-co' (chưa chọn Hệ / ô 4 thiếu Pháp Môn / ô lạ) | 'chua-mo' (+ need = cấp Tu Vi cần) | 'hoi-chieu' (+ left giây) | 'tam-an' (+ have, need).
     * Thành công: { ok:true, skill, level, heSo (đã nhân cấp), cdUntil }, đồng thời bắt đầu hồi chiêu và (Tuyệt Học) trừ 5 Tâm Ấn.
     */
    tryCast(slot, now) {
      const skill = he ? skillFor(he, slot, phapMon) : null;
      if (!skill) return { ok: false, reason: 'khong-co' };
      if (tuvi < skill.cap) return { ok: false, reason: 'chua-mo', need: skill.cap };
      const t = num(now), left = num(readyAt[skill.id], 0) - t;
      if (left > 0) return { ok: false, reason: 'hoi-chieu', left: round4(left) };
      const need = num(skill.tamAn, 0);
      if (need > 0 && tamAn < need) return { ok: false, reason: 'tam-an', have: tamAn, need };
      readyAt[skill.id] = t + skill.cd; tamAn -= need;
      const level = effLevel(skill.id);
      return { ok: true, skill, level, heSo: effectiveHeSo(skill, level), cdUntil: readyAt[skill.id] };
    },
    /** Các ô đang mở theo Tu Vi (nhắc lại mốc 10/14/20/30/60). */
    unlockedSlots() { return Object.keys(SKILL_CAP).map((k) => (k === 'tuyet' ? 'tuyet' : +k)).filter((k) => tuvi >= SKILL_CAP[k]); },
  };
}
