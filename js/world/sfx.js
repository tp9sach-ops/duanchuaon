// Tiếng kỹ năng / chiến đấu (Phiên 109). LOGIC THUẦN (không DOM, có test): tests/sfx.test.mjs. Phát tiếng: js/ui/sfx.js.
// 15 file trong assets/sfx/ (Gp gửi, đã cắt đuôi + chuẩn hóa to nhỏ + nén mono 80 kbps, tổng ~290 KB). Mỗi "cue" = một sự kiện trong game → một hoặc vài file, có thể cách nhau vài chục mili giây.
// Mọi cue đều có tiếng tổng hợp dự phòng (fb) để game vẫn kêu khi file chưa được tải lên GitHub hoặc mạng lỗi.

export const SFX_DIR = 'assets/sfx/';
export const sfxUrl = (id) => `${SFX_DIR}${id}.mp3`;

/** Tên file (không đuôi) → mô tả. Mỗi file PHẢI nằm trong assets/sfx/ và được ít nhất một cue dùng (test kiểm). */
export const SFX_FILES = {
  swoosh: 'Vút gió ngắn (nhảy, ném)',
  'thuong-1': 'Chém/đâm gió, kiểu 1', 'thuong-2': 'Chém/đâm gió, kiểu 2', 'thuong-3': 'Chém mạnh, kiểu 3',
  'dam-trung': 'Lưỡi đâm trúng thân', 'va-cham': 'Kiếm va nhẹ', 'va-nang': 'Va chạm nặng lên giáp',
  'bi-danh': 'Mình bị đánh trúng', 'rut-guom': 'Rút kiếm', 'tran-danh': 'Giao chiến dài',
  'chem-khi': 'Kỹ năng: luồng khí', 'thiet-dau': 'Kỹ năng: lao đầu', 'len-bac': 'Lên bậc / mở kỹ năng',
  'thu-phuc': 'Thu phục yêu quái (kết thúc lớn)', 'ha-quai': 'Hạ quái bãi rừng',
};
export const SFX_IDS = Object.keys(SFX_FILES);

// f: tên file hoặc mảng tên file (chọn ngẫu nhiên một); g: độ lớn 0..1; r: tốc độ phát (số hoặc [nhỏ, lớn] chọn ngẫu nhiên → mỗi lần nghe hơi khác nhau); d: trễ (giây).
// fb: tiếng tổng hợp dự phòng [tần số, giây, { type, gain, decay, slide }].
export const CUES = {
  nhay: { parts: [{ f: 'swoosh', g: 0.45, r: [1.1, 1.3] }], fb: [[520, 0.16, { type: 'triangle', gain: 0.1, decay: 0.14, slide: 360 }]], gap: 120 },
  'nem-da': { parts: [{ f: 'swoosh', g: 0.55, r: [1.5, 1.8] }], fb: [[700, 0.14, { type: 'triangle', gain: 0.1, decay: 0.12, slide: -380 }]], gap: 90 },
  'da-trung': { parts: [{ f: 'va-cham', g: 0.5, r: [1.2, 1.4] }], fb: [[160, 0.16, { type: 'square', gain: 0.12, decay: 0.14, slide: -60 }]], gap: 80 },
  thuong: { parts: [{ f: ['thuong-1', 'thuong-2', 'thuong-3'], g: 0.7, r: [0.95, 1.1] }, { f: 'dam-trung', g: 0.65, d: 0.14 }], fb: [[900, 0.16, { type: 'sawtooth', gain: 0.07, decay: 0.14, slide: -600 }], [140, 0.2, { type: 'square', gain: 0.14, decay: 0.18, slide: -60 }]], gap: 120 },
  'chem-khi-vung': { parts: [{ f: ['thuong-2', 'thuong-3'], g: 0.55, r: [0.8, 0.9] }], fb: [[700, 0.22, { type: 'sawtooth', gain: 0.06, decay: 0.2, slide: -450 }]], gap: 150 },
  'chem-khi': { parts: [{ f: 'chem-khi', g: 0.85 }], fb: [[1200, 0.3, { type: 'triangle', gain: 0.07, decay: 0.28, slide: -700 }]], gap: 250 },
  'chem-khi-trung': { parts: [{ f: 'va-nang', g: 0.85 }], fb: [[130, 0.3, { type: 'square', gain: 0.16, decay: 0.28, slide: -70 }]], gap: 120 },
  'thiet-dau': { parts: [{ f: 'swoosh', g: 0.6, r: [0.8, 0.9] }, { f: 'thiet-dau', g: 0.9, d: 0.03 }], fb: [[900, 0.3, { type: 'sawtooth', gain: 0.07, decay: 0.28, slide: -700 }]], gap: 250 },
  'thiet-dau-trung': { parts: [{ f: 'va-nang', g: 1 }, { f: 'va-cham', g: 0.55, d: 0.06, r: 0.85 }], fb: [[110, 0.35, { type: 'square', gain: 0.18, decay: 0.3, slide: -60 }], [1500, 0.18, { gain: 0.06, decay: 0.15 }]], gap: 150 },
  'len-bac': { parts: [{ f: 'len-bac', g: 0.9 }], fb: [[660, 0.5, { type: 'triangle', gain: 0.14, decay: 0.45 }], [990, 0.5, { gain: 0.06, decay: 0.45 }]], gap: 500 },
  'tu-dong-bat': { parts: [{ f: 'rut-guom', g: 0.8 }], fb: [[1800, 0.14, { gain: 0.06, decay: 0.12 }]], gap: 400 },
  'tu-dong-tat': { parts: [{ f: 'rut-guom', g: 0.4, r: 0.8 }], fb: [[900, 0.12, { gain: 0.05, decay: 0.1 }]], gap: 400 },
  'yq-xuat-hien': { parts: [{ f: 'rut-guom', g: 0.7 }, { f: 'tran-danh', g: 0.5, d: 0.25 }], fb: [[110, 0.6, { type: 'square', gain: 0.1, decay: 0.55, slide: -40 }]], gap: 2000 },
  'yq-thu-phuc': { parts: [{ f: 'thu-phuc', g: 1 }], fb: [[523, 0.9, { type: 'triangle', gain: 0.16, decay: 0.85 }], [784, 1.2, { gain: 0.08, decay: 1.1 }]], gap: 2000 },
  'quai-ha': { parts: [{ f: 'ha-quai', g: 0.8 }], fb: [[440, 0.4, { type: 'triangle', gain: 0.12, decay: 0.35 }]], gap: 300 },
  'bi-danh': { parts: [{ f: 'bi-danh', g: 0.8, r: [0.95, 1.05] }], fb: [[120, 0.3, { type: 'square', gain: 0.16, decay: 0.28, slide: -50 }]], gap: 400 },
  'nem-yq': { parts: [{ f: 'swoosh', g: 0.7, r: [0.7, 0.8] }, { f: 'va-nang', g: 1, d: 0.35 }], fb: [[110, 0.35, { type: 'square', gain: 0.18, decay: 0.3, slide: -60 }]], gap: 500 },
  nem: { parts: [{ f: 'swoosh', g: 0.6, r: [0.9, 1.05] }], fb: [[600, 0.16, { type: 'triangle', gain: 0.09, decay: 0.14, slide: -300 }]], gap: 150 },
  khieng: { parts: [{ f: 'swoosh', g: 0.3, r: [0.6, 0.7] }], fb: [[300, 0.12, { type: 'triangle', gain: 0.07, decay: 0.1 }]], gap: 200 },
};
export const CUE_IDS = Object.keys(CUES);

const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
const pickFrom = (a, rng) => { const r = rng(); return a[Math.min(a.length - 1, Math.floor((isNum(r) && r > 0 ? r : 0) * a.length))]; };   // rng() chỉ gọi MỘT lần

/** Khoảng chờ tối thiểu (ms) giữa hai lần phát cùng một cue — chống dồn tiếng khi bấm/tự động đánh liên tục. */
export const gapOf = (name) => (CUES[name] ? CUES[name].gap : 0);

/**
 * Lập kế hoạch phát cho một cue. volume = hệ số từ cài đặt "Hiệu ứng" (0 = tắt tiếng). Trả mảng { file, gain, rate, delay } (rỗng nếu cue lạ / tắt tiếng).
 * rng() ∈ [0,1) truyền vào để test ra kết quả cố định.
 */
export function planCue(name, { rng = Math.random, volume = 1 } = {}) {
  const cue = CUES[name]; const v = isNum(volume) ? Math.max(0, Math.min(1.5, volume)) : 1;
  if (!cue || v <= 0) return [];
  return cue.parts.map((p) => {
    const file = Array.isArray(p.f) ? pickFrom(p.f, rng) : p.f;
    const r = Array.isArray(p.r) ? p.r[0] + (p.r[1] - p.r[0]) * rng() : (isNum(p.r) ? p.r : 1);
    return { file, gain: Math.min(1, Math.max(0, p.g * v)), rate: Math.round(r * 1000) / 1000, delay: isNum(p.d) ? p.d : 0 };
  });
}

/** Tiếng tổng hợp dự phòng của một cue: mảng [freq, dur, opts]. */
export const fallbackOf = (name) => (CUES[name] ? CUES[name].fb : []);

/** Tên các file mà một cue có thể dùng (để kiểm tra đủ file). */
export function filesOf(name) {
  const c = CUES[name]; if (!c) return [];
  return [...new Set(c.parts.flatMap((p) => (Array.isArray(p.f) ? p.f : [p.f])))];
}
