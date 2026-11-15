// TOÁN THUẦN cho hiệu ứng HỎA 3D (Phiên 202, docs/KE_HOACH_HIEU_UNG_3D_V2.md, MỤC 2). Không import three → test được trong Node: tests/hoafx.test.mjs. Dựng hình: js/scene/fxHoa.js.
// Mỗi chiêu Hỏa có CHỮ KÝ hình ảnh riêng (không còn "cùng một chùm lưỡi lửa"): sao chổi · áo lửa · rồng lửa nhiều đốt · mưa thiên thạch · hơi thở rồng · sen lửa 9 cánh.

/** id chiêu (js/data/chieuFx.js) → kiểu hình. Tên chiêu: hoa_1 Liệt Hỏa Chưởng, hoa_2 Cuồng Long Phẫn Nộ, hoa_3 Hỏa Long Xuất Hải, hoa_liethoa_4 Bạo Liệt Hỏa Vũ, hoa_hoalong_4 Long Tức Trảm, hoa_tuyet Liên Hoa Hỏa Thế. */
export const HOA_KIEU = Object.freeze({ hoa_1: 'sao_choi', hoa_2: 'ao_lua', hoa_3: 'rong_lua', hoa_liethoa_4: 'thien_thach', hoa_hoalong_4: 'long_tuc', hoa_tuyet: 'sen_lua' });
export const kieuHoa = (id) => (Object.prototype.hasOwnProperty.call(HOA_KIEU, id) ? HOA_KIEU[id] : null);

const M = (mesh, hat, khoi, vong = 0, trong = 0) => ({ mesh, hat, khoi, vong, trong });
/** Số khối lửa / hạt / tấm khói theo bậc máy (yeu < vua < cao). vong = số vòng cánh (sen lửa), trong = số lưỡi vòng trong (áo lửa). */
const DEM = {
  sao_choi: { yeu: M(2, 40, 1), vua: M(3, 90, 2), cao: M(3, 150, 3) },
  ao_lua: { yeu: M(5, 40, 0), vua: M(7, 90, 0), cao: M(9, 150, 0, 0, 6) },
  rong_lua: { yeu: M(6, 40, 2), vua: M(9, 90, 3), cao: M(12, 150, 4) },
  thien_thach: { yeu: M(4, 40, 0), vua: M(6, 90, 0), cao: M(9, 150, 0) },
  long_tuc: { yeu: M(2, 40, 1), vua: M(3, 90, 3), cao: M(3, 150, 4) },
  sen_lua: { yeu: M(6, 40, 0, 1), vua: M(9, 90, 0, 1), cao: M(9, 150, 0, 2) },
};
export function demHoa(kieu, tier) { const b = DEM[kieu]; if (!b) return M(0, 0, 0); return { ...(b[tier] || b.vua) }; }

/** Số giả ngẫu nhiên ổn định 0..1 theo (chỉ số, muối) — hạt/lưỡi lửa tự dựng lại giống nhau ở mọi máy. */
export function h01(i, salt = 0) { const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return s - Math.floor(s); }
/** Tuổi hạt 0..1 lặp vòng (không cần lưu trạng thái): hạt thứ i, thời gian t, tốc độ rate (vòng/giây). */
export const tuoiHat = (i, t, rate) => (((i * 0.6180339 + t * rate) % 1) + 1) % 1;

/** Rồng lửa: đốt thứ i trong n đốt. Đầu (i = 0) ở pz; thân uốn lượn phía sau; mới phát thì các đốt dồn lại gần nhau rồi giãn ra. s = tỉ lệ cỡ (đuôi nhỏ dần). */
export function songRong(i, t, pz, n) {
  const f = n > 1 ? i / (n - 1) : 0, gian = 0.6 * Math.min(1, 0.15 + Math.max(0, pz) / (Math.max(1, n) * 0.6));
  return { x: Math.sin(t * 7 - i * 0.85) * 0.55 * (0.45 + 0.55 * f), y: 1.2 + 0.28 * Math.sin(t * 5.5 - i * 1.05), z: pz - i * gian, s: 1 - 0.62 * f };
}

/** Mưa thiên thạch: viên thứ j trong m viên. Trả điểm rơi (x,z) trong bán kính 0,85·R quanh tâm, độ trễ, thời gian rơi, thời gian nổ, độ lệch ngang lúc bắt đầu (rơi chéo) và độ cao bắt đầu. Cả trận kết thúc trước 0,97 s (vòng đời chiêu ≈ 0,95 s). */
export function thienThach(j, m, R) {
  const r = R * 0.85 * Math.sqrt(h01(j, 2)), a = h01(j, 3) * 6.283185307;
  return { delay: (j / Math.max(1, m)) * 0.22 + h01(j, 1) * 0.05, fall: 0.24, burst: 0.45, x: Math.cos(a) * r, z: Math.sin(a) * r, dx: -4 - 2 * h01(j, 4), dz: (h01(j, 5) - 0.5) * 3, h: 9 };
}

/** Sen lửa nở: 0 (búp) → 1 (nở hết) trong `dur` giây, mượt hai đầu. */
export function nuHoa(after, dur = 0.7) { const u = Math.max(0, Math.min(1, after / dur)); return u * u * (3 - 2 * u); }
/** Hơi thở rồng: chiều dài tia (m) sau `after` giây từ lúc phát, tối đa min(reach, max), phóng nhanh trong 0,28 s. */
export function hoiRong(after, reach, max = 8) { const u = Math.max(0, Math.min(1, after / 0.28)); return Math.min(reach, max) * (1 - (1 - u) * (1 - u)); }
