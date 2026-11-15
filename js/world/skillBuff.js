// Hiệu lực TẠM của chiêu HỖ TRỢ (heSo = 0: khiên, giáp, hồi sinh, ẩn thân...) — Phiên 184. LOGIC THUẦN (không DOM, không đồng hồ: `now` là giây do người gọi đưa vào), có test: tests/skillbuff.test.mjs.
// Trước Phiên 184 bấm chiêu hỗ trợ chỉ hiện chữ "sắp có". Giờ bấm là TUNG THẬT: hồi chiêu, tư thế + hiệu ứng 3D theo id chiêu, và một "hiệu lực" có giờ hiện trên nút.
// Hiệu quả thật lên trận đánh HIỆN CÓ chỉ là TĂNG SÁT THƯƠNG (Cuồng Long Phẫn Nộ: chiMang). Phòng thủ/hồi máu/ẩn thân/khống chế chưa có chỗ tác dụng (nhân vật chưa có thanh máu ở bãi rừng) → chỉ hiện hiệu lực + hiệu ứng, ghi rõ ở `note`.
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const DUR_KEYS = ['anThan', 'hoiSinhLuc', 'vung', 'dongBang', 'suongDoc', 'mua', 'batKhaXamPham', 'song'];   // fx.<khóa>.dur — thời gian nằm trong khối con
export const DEFAULT_DUR = 4;   // chiêu không ghi thời gian (hồi máu đội, kéo quái...): hiệu lực 4 giây cho nút có chuyển động
export const MAX_DUR = 30;

/** Thời gian hiệu lực (giây) của chiêu: fx.dur, hoặc dur trong khối con, hoặc mặc định. Kẹp 1..MAX_DUR. */
export function buffDuration(skill) {
  const fx = skill && isObj(skill.fx) ? skill.fx : {};
  let d = num(fx.dur, 0);
  if (!(d > 0)) for (const k of DUR_KEYS) { if (isObj(fx[k]) && num(fx[k].dur, 0) > 0) { d = num(fx[k].dur); break; } }
  return Math.max(1, Math.min(MAX_DUR, d > 0 ? d : DEFAULT_DUR));
}
/** Hệ số nhân sát thương trong lúc hiệu lực: 1 + chiMang (Cuồng Long Phẫn Nộ +40%). Chiêu khác = 1. */
export function buffDamageMul(skill) {
  const fx = skill && isObj(skill.fx) ? skill.fx : {};
  const m = num(fx.chiMang, 0);
  return m > 0 ? Math.round((1 + m) * 1e4) / 1e4 : 1;
}
/** Loại hiệu lực để hiện chữ: 'tang-dame' (có tác dụng thật) | 'phong-thu' | 'hoi-sinh' | 'an-than' | 'khong-che' | 'khac'. */
export function buffKind(skill) {
  const fx = skill && isObj(skill.fx) ? skill.fx : {};
  if (num(fx.chiMang, 0) > 0) return 'tang-dame';
  if (fx.anThan || fx.anThanSuotChieu) return 'an-than';
  if (fx.hoiSinhLuc || fx.hoiSinhLucDoi) return 'hoi-sinh';
  if (fx.giap || fx.khienBang || fx.hapThu || fx.khienDoi || fx.giamSatThuong || fx.batKhaXamPham) return 'phong-thu';
  if (fx.dongBang || fx.vung || fx.suongDoc || fx.keQuai || fx.cham || fx.choang) return 'khong-che';
  return 'khac';
}
const KIND_TEXT = { 'tang-dame': 'tăng sát thương', 'phong-thu': 'phòng thủ', 'hoi-sinh': 'hồi sinh lực', 'an-than': 'ẩn thân', 'khong-che': 'khống chế', khac: 'hỗ trợ' };
/** Câu báo khi tung chiêu hỗ trợ. */
export function buffNote(skill, level = 1) {
  const k = buffKind(skill), d = buffDuration(skill), m = buffDamageMul(skill);
  const real = m > 1 ? ` · sát thương +${Math.round((m - 1) * 100)}%` : '';
  const lazy = m > 1 ? '' : ' (tác dụng lên trận đánh sẽ mở khi quái biết đánh trả)';
  return `${skill && skill.ten ? skill.ten : 'Chiêu'} Lv${Math.max(1, Math.floor(num(level, 1)))}: ${KIND_TEXT[k]} ${d} giây${real}${lazy}`;
}

/** Bộ nhớ hiệu lực đang chạy. now = giây. */
export function createBuffs() {
  let list = [];   // { id, slot, until, mul }
  const prune = (now) => { list = list.filter((b) => b.until > now); };
  return {
    /** Bắt đầu hiệu lực của chiêu (cùng chiêu bấm lại = làm mới, không cộng dồn). Trả { until, dur, mul }. */
    start(skill, slot, now) {
      if (!skill || typeof skill.id !== 'string') return null; const t = num(now), dur = buffDuration(skill), mul = buffDamageMul(skill);
      prune(t); list = list.filter((b) => b.id !== skill.id); const b = { id: skill.id, slot, until: t + dur, mul }; list.push(b); return { until: b.until, dur, mul };
    },
    /** Còn bao nhiêu giây hiệu lực của chiêu này (0 = hết / chưa bật). */
    left(id, now) { const b = list.find((x) => x.id === id); return b ? Math.max(0, Math.round((b.until - num(now)) * 1e3) / 1e3) : 0; },
    /** Hệ số nhân sát thương đang có (nhân các hiệu lực còn hạn). */
    damageMul(now) { prune(num(now)); return Math.round(list.reduce((a, b) => a * b.mul, 1) * 1e4) / 1e4; },
    clear() { list = []; },
    get count() { return list.length; },
  };
}
