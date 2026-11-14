// Luyện chiêu (Phiên 150): danh sách chiêu để thử + mô tả hiệu ứng bằng tiếng Việt. LOGIC THUẦN, có test: tests/luyenchieu.test.mjs.
// Ở khu luyện tập MỌI chiêu của Hệ đều thử được, không khóa cấp, hồi chiêu rút ngắn (DEMO_CD_MAX), không trừ gì, không ảnh hưởng chỉ số thật.
import { COMBAT_SKILLS, PHAP_MON, SKILL_CAP } from '../data/combatSkills.js';
import { normHe } from './elements.js';

export const DEMO_CD_MAX = 2.5;      // giây: hồi chiêu tối đa khi tập
export const DEMO_BASE_DMG = 100;    // sức đánh mẫu; số hiện trên mộc nhân = làm tròn(DEMO_BASE_DMG × heSo)
const SLOT_ORDER = [1, 2, 3, 4, 'tuyet'];
const SLOT_TXT = { 1: 'Chiêu 1', 2: 'Chiêu 2', 3: 'Chiêu 3', 4: 'Chiêu 4', tuyet: 'Tuyệt học' };

/** Mô tả một chiêu: từng hiệu ứng (fx) → câu ngắn. Khóa lạ bị bỏ qua. */
const FX_TXT = [
  ['choang', 'Làm choáng'], ['cham', 'Làm chậm'], ['chamQuai', 'Làm chậm quái'], ['dongBang', 'Đóng băng'], ['troi', 'Trói chân'], ['giap', 'Tăng giáp'],
  ['hoiSinhLuc', 'Hồi sinh lực'], ['hoiSinhLucDoi', 'Hồi sinh lực cả đội'], ['khienBang', 'Khiên băng'], ['hapThu', 'Khiên hấp thụ'], ['khienDoi', 'Khiên cho đội'],
  ['xoaDebuff', 'Xóa hiệu ứng xấu'], ['anThan', 'Ẩn thân'], ['tocChay', 'Tăng tốc chạy'], ['tocDanh', 'Tăng tốc đánh'], ['chiMang', 'Tăng chí mạng'],
  ['noLan', 'Nổ lan'], ['dienRong', 'Đánh diện rộng'], ['lao', 'Lao tới trước'], ['hatVang', 'Hất văng'], ['keQuai', 'Kéo quái lại gần'], ['giamQuai', 'Ép quái yếu đi'],
  ['suongDoc', 'Khói mê quanh người'], ['docLan', 'Khói mê lan rộng'], ['doc', 'Làm mờ mắt theo thời gian'], ['mon', 'Bào mòn theo thời gian'], ['thieu', 'Cháy theo thời gian'],
  ['vung', 'Lập vùng chậm'], ['mua', 'Mưa lửa rơi xuống'], ['song', 'Sóng nước lan rộng'], ['duongRong', 'Rồng lửa bay thẳng'], ['tia', 'Tia sáng xuyên'], ['xuyen', 'Xuyên giáp'], ['giamGiap', 'Giảm giáp quái'],
  ['batKhaXamPham', 'Bất khả xâm phạm'], ['giamSatThuong', 'Giảm sát thương nhận'], ['mienKhongChe', 'Miễn khống chế'], ['phanDon', 'Phản đòn'], ['laoSauLung', 'Lao ra sau lưng'], ['anThanSuotChieu', 'Ẩn thân suốt chiêu'],
];
export function describeSkill(sk) {
  if (!sk) return '';
  const fx = sk.fx || {}, parts = [];
  for (const [k, t] of FX_TXT) if (fx[k]) parts.push(t);
  const dmg = sk.heSo > 0 ? `Gây ${Math.round(DEMO_BASE_DMG * sk.heSo)} (mẫu)` : '';
  return [dmg, ...parts].filter(Boolean).join(' · ') || 'Chiêu hỗ trợ';
}

/** Mọi chiêu của Hệ để thử, theo thứ tự ô 1,2,3,4 (cả hai Pháp Môn), tuyệt học. Mỗi mục: { skill, label, cap, support (không gây sát thương trực tiếp), demoCd }. Hệ lạ → []. */
export function listForHe(he) {
  const h = normHe(he); if (!h) return [];
  const out = [];
  for (const slot of SLOT_ORDER) {
    for (const sk of COMBAT_SKILLS.filter((s) => s.he === h && s.slot === slot)) {
      const pm = sk.phapMon ? PHAP_MON.find((p) => p.id === sk.phapMon) : null;
      out.push({ skill: sk, label: SLOT_TXT[slot] + (pm ? ` · ${pm.ten}` : ''), cap: SKILL_CAP[slot], support: !(sk.heSo > 0), demoCd: Math.min(DEMO_CD_MAX, Math.max(0.5, sk.cd || 0)) });
    }
  }
  return out;
}

/** Bộ hồi chiêu tập: cast(id, now) → { ok, left?, dmg } ; cd rút ngắn. Không đọc đồng hồ. */
export function createDemoRuntime() {
  const ready = new Map();
  return {
    cast(item, now) {
      if (!item || !item.skill) return { ok: false, reason: 'khong-co-chieu' };
      const t = Number.isFinite(+now) ? +now : 0, at = ready.get(item.skill.id) || 0;
      if (t < at) return { ok: false, reason: 'hoi-chieu', left: Math.round((at - t) * 100) / 100 };
      ready.set(item.skill.id, t + item.demoCd);
      return { ok: true, dmg: item.skill.heSo > 0 ? Math.round(DEMO_BASE_DMG * item.skill.heSo) : 0 };
    },
    left(item, now) { const at = ready.get(item && item.skill ? item.skill.id : '') || 0; return Math.max(0, at - (Number.isFinite(+now) ? +now : 0)); },
    reset() { ready.clear(); },
  };
}
