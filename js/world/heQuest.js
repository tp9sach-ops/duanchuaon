// Gia nhập phái + học chiêu (Phiên 141). LOGIC THUẦN (không DOM, có test: tests/hequest.test.mjs).
// "Cấp" người chơi thấy có HAI con số: Tu Vi (từ thu phục quái, js/world/farm.js) và Cấp công hạnh (thanh "Cấp N", js/world/quests.js).
// Lễ Khai Ngộ + các ô chiêu mở theo MỘT cấp hiệu dụng = số lớn hơn của hai con số, để ai thấy "Cấp 10" cũng được gia nhập phái.
import { SKILL_CAP } from '../data/combatSkills.js';

export const SECT_LV = 10;                              // cấp hiệu dụng tối thiểu để gia nhập phái (= SKILL_CAP[1])
export const SECT_QUESTS = Object.freeze(['m-khaingo', 'm-chieu1']);
const num = (x, d = 0) => (Number.isFinite(+x) ? Math.max(0, Math.floor(+x)) : d);

/** Cấp hiệu dụng = max(Tu Vi, cấp công hạnh). Giá trị lạ → 0. */
export const effLevel = (tuvi, capCongHanh) => Math.max(num(tuvi), num(capCongHanh));
/** Đủ cấp để gia nhập phái? */
export const canJoinSect = (eff) => num(eff) >= SECT_LV;
/** Các ô chiêu (1|2|3|4) đã mở ở cấp hiệu dụng `eff` (không gồm Tuyệt Học). */
export const openSlots = (eff) => [1, 2, 3, 4].filter((s) => num(eff) >= SKILL_CAP[s]);
/** Hệ số sát thương của một chiêu: sức mạnh gốc × heSo (đã nhân cấp chiêu). Chiêu không gây sát thương (heSo 0) → 0. */
export const skillDamage = (baseDmg, heSo) => (Number.isFinite(+heSo) && +heSo > 0 ? Math.max(1, Math.round(num(baseDmg, 1) * +heSo)) : 0);
