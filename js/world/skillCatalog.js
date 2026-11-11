// Tra cứu kỹ năng chiến đấu (G2.2). LOGIC THUẦN, có test: tests/combatskills.test.mjs. Dữ liệu: js/data/combatSkills.js (TẠM).
// Bộ máy hồi chiêu / Tâm Ấn / cấp skill là G2.3 (js/world/skillEngine.js), chưa làm ở đây.
import { COMBAT_SKILLS, PHAP_MON, SKILL_CAP } from '../data/combatSkills.js';
import { normHe } from './elements.js';

const slotKey = (s) => (s === 'tuyet' || s === 'Tuyet' ? 'tuyet' : Number.isFinite(+s) ? Math.floor(+s) : null);

/** Skill theo id; lạ → null. */
export const skillById = (id) => COMBAT_SKILLS.find((s) => s.id === id) || null;
/** Mọi skill của một Hệ (theo thứ tự 1,2,3,4,tuyệt học); Hệ lạ → []. */
export const skillsOfHe = (he) => { const h = normHe(he); return h ? COMBAT_SKILLS.filter((s) => s.he === h) : []; };
/** Pháp Môn theo id; lạ → null. */
export const phapMonById = (id) => PHAP_MON.find((p) => p.id === id) || null;
/** Hai Pháp Môn của một Hệ; Hệ lạ → []. */
export const phapMonOfHe = (he) => { const h = normHe(he); return h ? PHAP_MON.filter((p) => p.he === h) : []; };
/**
 * Skill ở ô `slot` (1|2|3|4|'tuyet') của Hệ `he`. Ô 4 cần `phapMon` (id) thuộc đúng Hệ đó; thiếu hoặc sai → null.
 */
export function skillFor(he, slot, phapMon) {
  const h = normHe(he), k = slotKey(slot);
  if (!h || k === null) return null;
  const list = COMBAT_SKILLS.filter((s) => s.he === h && s.slot === k);
  if (k === 4) return list.find((s) => s.phapMon === phapMon) || null;
  return list[0] || null;
}
/** Cấp Tu Vi mở khóa của ô; lạ → null. */
export const capOfSlot = (slot) => { const k = slotKey(slot); return k !== null && k in SKILL_CAP ? SKILL_CAP[k] : null; };
/** Các ô đã mở ở Tu Vi `tuvi` (đúng mốc GDD 4.3): [1] từ cấp 10, +2 từ 14, +3 từ 20, +4 từ 30, +'tuyet' từ 60. Tu Vi lạ → []. */
export function slotsUnlocked(tuvi) {
  const t = Number.isFinite(+tuvi) ? +tuvi : 0;
  return Object.keys(SKILL_CAP).map(slotKey).filter((k) => t >= SKILL_CAP[k]);
}
