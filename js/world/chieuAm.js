// ÂM THANH 30 chiêu (prompt chiêu thức 3D mục 5 + mục 14 điểm 5). LOGIC THUẦN, có test: tests/chieuam.test.mjs. Kho file: js/data/chieuAmKho.js (tạo tự động bởi tools/make-chieu-am.py).
// Ba lớp tiếng mỗi chiêu: GỒNG (báo hiệu) · PHÁT (bùng nổ, đỉnh nhọn 0–80 ms) · TRÚNG (theo chất liệu kẻ địch: da thịt / kim loại / đá), cộng DƯ ÂM 0,5–1,5 s theo Hệ.
// Pha trộn: Tuyệt học to hơn chiêu thường ~6 dB (hệ số 1,0 so với 0,5); Chiêu 4 ở giữa. Bộ nén chung của js/ui/sfx.js giữ không chói. Âm của người ở xa nhỏ dần theo khoảng cách (xa(d)).
// CHƯA có: tiếng hô nhân vật (nam/nữ, 3 biến thể mỗi tiếng) — cần người thu âm, xem docs/CHIEU_AM_THANH.md. Tiếng ở đây là tổng hợp TẠM, chờ nghe bằng tai.
import { KHO_AM } from '../data/chieuAmKho.js';
import { COMBAT_SKILLS } from '../data/combatSkills.js';

export const CHAT_LIEU = Object.freeze(['dathit', 'kimloai', 'da']);
const TRUNG = Object.freeze({ dathit: 'trung-dathit', kimloai: 'trung-kimloai', da: 'trung-da' });
/** Hệ số độ lớn theo vai chiêu: Tuyệt học = 2 × chiêu thường = +6 dB. */
export const DO_LON = Object.freeze({ thuong: 0.5, chieu4: 0.7, tuyet: 1 });
/** Dư âm bắt đầu sau lúc phát bao nhiêu giây (nối đuôi tiếng phát, không đè lên đỉnh). */
export const TRE_DU_AM = 0.12;
export const NGUONG_XA = Object.freeze({ gan: 4, xa: 40 });   // mét: trong 4 m nghe đủ, ngoài 40 m không nghe

const slotOf = (id) => COMBAT_SKILLS.find((s) => s.id === id)?.slot;
export const vaiAm = (id) => { const s = slotOf(id); return s === 'tuyet' ? 'tuyet' : s === 4 ? 'chieu4' : 'thuong'; };
/** Hệ số nghe theo khoảng cách d (m) tới người ra chiêu: 1 gần → 0 xa, giảm mượt. */
export function xa(d) { const x = Number.isFinite(+d) ? Math.max(0, +d) : 0, { gan, xa: far } = NGUONG_XA; if (x <= gan) return 1; if (x >= far) return 0; const k = (x - gan) / (far - gan); return Math.round((1 - k) ** 2 * 1000) / 1000; }

/**
 * Kế hoạch âm thanh của chiêu `id`: { gong, phat, trung, duAm } mỗi mục { file (khóa trong KHO_AM), gain 0..1, tre (giây sau lúc phát; gong: 0 tại lúc bắt đầu gồng) }.
 * chatLieu = vật liệu kẻ địch (mặc định da thịt). Chiêu lạ → null. Chiêu hỗ trợ/có lợi (không gây trúng): trung = null (thẻ chiêu quyết, truyền coTrung).
 */
export function lapAm(id, { chatLieu = 'dathit', coTrung = true, khoangCach = 0 } = {}) {
  const s = COMBAT_SKILLS.find((x) => x.id === id); if (!s) return null;
  const he = s.he, v = DO_LON[vaiAm(id)], g = Math.round(v * xa(khoangCach) * 1000) / 1000, cl = CHAT_LIEU.includes(chatLieu) ? chatLieu : 'dathit';
  return {
    id, he, vai: vaiAm(id),
    gong: { file: `${he}-gong`, gain: g, tre: 0 },
    phat: { file: `${he}-phat`, gain: g, tre: 0 },
    trung: coTrung ? { file: TRUNG[cl], gain: g, tre: 0.12 } : null,
    duAm: { file: `${he}-duam`, gain: Math.round(g * 0.7 * 1000) / 1000, tre: TRE_DU_AM },
  };
}
/** Âm cảnh báo cho người bị nhắm: nghe ngay cả khi không thấy kẻ ra chiêu → tiếng gồng KHÔNG bị cắt theo khoảng cách ngắn, tối thiểu 0,35 trong 40 m. */
export function lapCanhBao(id, khoangCach = 0) {
  const p = lapAm(id, { khoangCach }); if (!p) return null;
  const d = Math.max(0, +khoangCach || 0); return { file: p.gong.file, gain: d > NGUONG_XA.xa ? 0 : Math.max(p.gong.gain, 0.35) };
}
export { KHO_AM };
