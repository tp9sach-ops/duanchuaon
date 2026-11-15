// KẺ ĐỊCH TRÚNG ĐÒN (prompt chiêu thức 3D mục 7, mục 14 điểm 6). LOGIC THUẦN, có test: tests/chieutrung.test.mjs. Hình dựng: js/scene/chieuTrungFx.js. Mọi con số là TẠM, chờ nhìn bằng mắt.
// Gồm: 3 mức trúng (nhẹ/vừa/nặng) · hướng phản ứng theo hướng đòn (trước/sau/trái/phải/trên không) · 7 trạng thái nhìn thấy được · đồng hồ khống chế + "kháng" mờ dần
//       số sát thương nảy · phản ứng giữa Hệ (chữ nổi 0,5 s) · chất liệu kẻ địch (truyền cho âm trúng) · boss (giáp phá) · hiệu ứng chết theo Hệ chiêu kết liễu.
import { COMBAT_SKILLS } from '../data/combatSkills.js';
import { PHAN_UNG, LUAT } from '../data/luatChien.js';
import { MONSTERS } from '../data/monsters.js';

const slotOf = (id) => COMBAT_SKILLS.find((s) => s.id === id)?.slot;
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const r3 = (v) => Math.round(v * 1000) / 1000 + 0;   // +0: tránh −0
const own = (o, k) => (typeof k === 'string' && Object.hasOwn(o, k) ? o[k] : undefined);   // tra khóa an toàn (không dính '__proto__')
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const vaiTrung = (id) => { const s = slotOf(id); return s === 'tuyet' ? 'tuyet' : s === 4 ? 'chieu4' : 'thuong'; };

// ───── 1. Ba mức trúng ─────
/** Mỗi mức: giật thân (ms, khoảng), lùi (m, khoảng), khựng hình (ms, khoảng), tia lóe, màu số, rung màn, sóng chấn, âm nặng. Khựng chỉ áp cho hai nhân vật liên quan (xem chieuFx onHitStop). */
export const MUC = Object.freeze({
  nhe: Object.freeze({ giatMs: [80, 120], lui: [0, 0], dungMs: [0, 0], tia: 'nho', so: 'trang', rung: 0, songChan: false, amNang: false, nga: false }),
  vua: Object.freeze({ giatMs: [140, 200], lui: [0.3, 0.8], dungMs: [40, 60], tia: 'lon', so: 'vang', rung: 0.25, songChan: false, amNang: false, nga: false }),
  nang: Object.freeze({ giatMs: [200, 300], lui: [1, 3], dungMs: [80, 120], tia: 'lon', so: 'do', rung: 0.8, songChan: true, amNang: true, nga: true }),
});
export const THU_TU_MUC = Object.freeze(['nhe', 'vua', 'nang']);
const noiSuy = (kh, k) => r3(kh[0] + (kh[1] - kh[0]) * clamp(k, 0, 1));

/**
 * Chọn mức trúng. Nặng: chiêu 4, Tuyệt học, chí mạng, kết liễu (kẻ địch chết). Nhẹ: đòn nhỏ (đánh thường, nhát phụ, tick cháy/độc). Còn lại: vừa.
 * `chiMang`/`ketLieu`/`nho` là cờ do nơi tính sát thương truyền vào; không biết chiêu (id lạ/null) mà không có cờ → vừa.
 */
export function mucTrung({ id = null, chiMang = false, ketLieu = false, nho = false } = {}) {
  if (ketLieu || chiMang) return 'nang';
  const v = id ? vaiTrung(id) : null;
  if (v === 'chieu4' || v === 'tuyet') return 'nang';
  if (nho) return 'nhe';
  return 'vua';
}

// ───── 2. Hướng phản ứng ─────
export const HUONG = Object.freeze(['truoc', 'sau', 'trai', 'phai', 'trenkhong']);
/**
 * Hướng đòn so với mặt của kẻ địch. Tọa độ (x,z), ry = góc nhìn của kẻ địch (cùng quy ước Math.atan2(dx, dz) của game). `trenKhong` = đang lơ lửng.
 * Trả { huong, giat:[gx,gz] (vector đơn vị HƯỚNG THÂN BỊ ĐẨY: đánh từ trái thì giật sang phải), goc (độ, 0 = đòn đến từ phía trước mặt) }.
 */
export function huongTrung({ ax = 0, az = 0, x = 0, z = 0, ry = 0, trenKhong = false } = {}) {
  const dx = num(ax) - num(x), dz = num(az) - num(z), d = Math.hypot(dx, dz);
  let g = [0, 1];   // trùng điểm: coi như đẩy về trước mặt
  if (d > 1e-6) g = [-dx / d, -dz / d];
  if (trenKhong) return { huong: 'trenkhong', giat: [r3(g[0]), r3(g[1])], goc: 0 };
  const fx = Math.sin(num(ry)), fz = Math.cos(num(ry));   // vector mặt
  const rx = fz, rz = -fx;                                  // vector bên phải của kẻ địch (quay −90° quanh Y từ vector mặt trong hệ x–z của game)
  const tuMat = d > 1e-6 ? (dx * fx + dz * fz) / d : 1;     // >0: kẻ tấn công ở phía trước mặt
  const tuPhai = d > 1e-6 ? (dx * rx + dz * rz) / d : 0;     // >0: kẻ tấn công ở bên phải
  const goc = Math.round(Math.abs(Math.atan2(tuPhai, tuMat)) * 180 / Math.PI);
  let huong;
  if (Math.abs(tuMat) >= Math.abs(tuPhai)) huong = tuMat >= 0 ? 'truoc' : 'sau'; else huong = tuPhai >= 0 ? 'phai' : 'trai';
  return { huong, giat: [r3(g[0]), r3(g[1])], goc };
}

/** Hệ số bị đẩy theo cỡ kẻ địch: thường 1, tinh anh 0,7, boss 0,3 (boss "ít bị hất" nhưng có vòng giáp phá). */
export const HE_SO_DAY = Object.freeze({ thuong: 1, elite: 0.7, boss: 0.3 });
export const coKeDich = (monsterId) => { const m = own(MONSTERS, monsterId); return m ? (m.boss ? 'boss' : m.elite ? 'elite' : 'thuong') : 'thuong'; };

/**
 * Kế hoạch phản ứng trúng: { muc, huong, giatMs, lui (m), giat:[gx,gz], dungMs, rung, songChan, nga, tia, mauSo, hoatAnh }.
 * `luc` 0..1 chọn vị trí trong khoảng của mức (mặc định 0,5). Kẻ địch lơ lửng: không lùi trên mặt đất, giật theo phương ngang ngắn + xoay nhẹ.
 */
export function phanUngTrung({ muc = 'vua', co = 'thuong', luc = 0.5, ...hg } = {}) {
  const M = own(MUC, muc) || MUC.vua, mu = own(MUC, muc) ? muc : 'vua', h = huongTrung(hg), hs = own(HE_SO_DAY, co) ?? 1;
  let lui = noiSuy(M.lui, luc) * hs; const trenKhong = h.huong === 'trenkhong';
  if (trenKhong) lui = r3(Math.min(lui, 0.35));
  const nga = M.nga && co !== 'boss' && !trenKhong;   // boss không ngã vì đòn nặng; chỉ giật + vòng giáp phá
  return {
    muc: mu, huong: h.huong, goc: h.goc, co,
    giatMs: Math.round(noiSuy(M.giatMs, luc)), lui: r3(lui), giat: h.giat,
    dungMs: Math.round(noiSuy(M.dungMs, luc) * (co === 'boss' ? 0.75 : 1)),
    rung: M.rung, songChan: M.songChan, nga, tia: M.tia, mauSo: M.so, amNang: M.amNang,
    hoatAnh: `trung-${mu}-${h.huong}`,   // khóa hoạt ảnh: 3 mức × 5 hướng = 15 bộ
    xoay: trenKhong ? 0.15 : 0,           // rad, xoay nhẹ khi lơ lửng
  };
}
export const HOAT_ANH_TRUNG = Object.freeze(THU_TU_MUC.flatMap((m) => HUONG.map((h) => `trung-${m}-${h}`)));

// ───── 3. Chất liệu kẻ địch (cho âm trúng: da thịt / kim loại / đá) ─────
const CHAT_LIEU_HE = Object.freeze({ kim: 'kimloai', tho: 'da', moc: 'dathit', thuy: 'dathit', hoa: 'dathit' });
const CHAT_LIEU_RIENG = Object.freeze({ thachtinh: 'da', thachlinh: 'da', nhamcu: 'da', nhamvuong: 'da', solinh: 'da', cotmoc: 'dathit' });
/** Quái → chất liệu: riêng theo id nếu có, còn lại theo Hệ (Kim = kim loại, Thổ = đá, còn lại da thịt). `mocnhan`/'coc' = gỗ → da thịt (tiếng thịch). Lạ → da thịt. */
export function chatLieuKeDich(loai) {
  const m = own(MONSTERS, loai);
  if (own(CHAT_LIEU_RIENG, loai)) return CHAT_LIEU_RIENG[loai];
  if (m && own(CHAT_LIEU_HE, m.he)) return CHAT_LIEU_HE[m.he];
  return 'dathit';
}

// ───── 4. Bảy trạng thái nhìn thấy được ─────
/** dauHieu = dấu hiệu trên người; thanhMau = biểu tượng cạnh thanh máu; vong = có vòng đếm ngược dưới chân; khong = hạng khống chế (tính kháng lũy tiến). Màu #rrggbb. */
export const TRANG_THAI = Object.freeze({
  thieuDot: Object.freeze({ chu: 'Thiêu đốt', icon: 'lua', mau: '#e8582a', dauHieu: ['lua-nho-bam-nguoi', 'khoi', 'da-nong', 'bieu-tuong-tang'], thanhMau: 'lua+tang', vong: false, khong: false, vaoMs: 0, tanAm: null }),
  choang: Object.freeze({ chu: 'Choáng', icon: 'sao', mau: '#f2d34a', dauHieu: ['sao-quay-tren-dau', 'than-lao-dao'], thanhMau: 'sao', vong: true, khong: true, vaoMs: 0, tanAm: null }),
  hatTung: Object.freeze({ chu: 'Hất tung', icon: 'mui-ten-len', mau: '#cfd8e3', dauHieu: ['bay-len-xoay-nhe', 'dap-xuong-bui'], thanhMau: 'mui-ten', vong: true, khong: true, vaoMs: 0, tanAm: 'chamdat' }),
  troi: Object.freeze({ chu: 'Trói chân', icon: 'xich', mau: '#6fbf5a', dauHieu: ['day-leo-xich-co-chan', 'chan-dinh-dat'], thanhMau: 'xich', vong: true, khong: true, vaoMs: 0, tanAm: null }),
  lamCham: Object.freeze({ chu: 'Làm chậm', icon: 'oc-sen', mau: '#5aa7e8', dauHieu: ['hoat-anh-cham-that', 'vet-xanh'], thanhMau: 'oc-sen', vong: false, khong: false, vaoMs: 0, tanAm: null }),
  dongBang: Object.freeze({ chu: 'Đóng băng', icon: 'tinh-the', mau: '#bfe6ff', dauHieu: ['phu-bang-tu-chan-len', 'anh-xanh-trang'], thanhMau: 'tinh-the', vong: true, khong: true, vaoMs: 200, tanAm: 'vobang' }),   // phủ băng dần từ chân lên trong 0,2 s; tan có tiếng vỡ + mảnh bay
  moMat: Object.freeze({ chu: 'Mờ mắt', icon: 'khoi-me', mau: '#8f7aa8', dauHieu: ['hat-khoi-quanh-dau', 'mo-vien-man-nguoi-bi'], thanhMau: 'khoi-me', vong: false, khong: false, vaoMs: 0, tanAm: null }),
});
export const DS_TRANG_THAI = Object.freeze(Object.keys(TRANG_THAI));

/** Đồng hồ khống chế dưới chân: { dangBi, chu, conLai (s, làm tròn 0,1), tiLe 0..1 (còn lại/tổng, cho vòng quay), vong }. Không phải khống chế → chỉ { dangBi, chu }. */
export function dongHoTrangThai(loai, conLai, tong) {
  const t = own(TRANG_THAI, loai); if (!t) return null;
  const c = Math.max(0, num(conLai)), T = Math.max(c, num(tong, c));
  const o = { dangBi: c > 0, loai, chu: t.chu, icon: t.icon, vong: t.vong };
  if (!t.vong) return o;
  return { ...o, conLai: Math.round(c * 10) / 10, tiLe: T > 0 ? r3(c / T) : 0 };
}
/** Hiện chữ "kháng" mờ dần: sau khi hết khống chế, kháng lũy tiến (luật lõi: cửa sổ 8 s) hiển thị mờ dần theo thời gian kháng còn lại. { hien, doDuc 0..1, chu }. */
export function hienKhang(conLaiKhang, cuaSo = LUAT.khang.cuaSo) {
  const c = Math.max(0, num(conLaiKhang)), T = Math.max(0.001, num(cuaSo, LUAT.khang.cuaSo));
  return { hien: c > 0, doDuc: r3(clamp(c / T, 0, 1)), chu: 'kháng' };
}
/** Vòng thanh máu: danh sách biểu tượng [{loai, icon, tang}] của các trạng thái đang bị; thiêu đốt kèm số tầng (tối đa theo luật). */
export function bieuTuongThanhMau(dang = {}) {
  const out = [];
  for (const k of DS_TRANG_THAI) {
    const v = dang[k]; if (!v) continue;
    const tang = k === 'thieuDot' ? clamp(Math.round(num(v.tang ?? v, 1)), 1, LUAT.thieuDot.toiDaTang) : 1;
    out.push({ loai: k, icon: TRANG_THAI[k].icon, mau: TRANG_THAI[k].mau, tang });
  }
  return out;
}

// ───── 5. Số sát thương ─────
export const SO = Object.freeze({
  mau: Object.freeze({ trang: '#ffffff', vang: '#ffd75a', do: '#ff4a3a', thieuDot: '#ffa45a', doc: '#9be37a' }),
  coCoBan: 22, coNang: 32, coDot: 15,   // px
  phongTo: 1.2, parabolCao: 0.9,        // phóng 120% rồi co; cung nảy cao ~0,9 m
  song: 0.9,                             // giây sống
});
/** Màu/cỡ số theo loại: 'thuong'|'chiMang'|'ketLieu'|'thieuDot'|'doc' và mức trúng. Số cháy/độc nhỏ hơn và màu nhạt. */
export function kieuSo({ loai = 'thuong', muc = 'vua' } = {}) {
  if (loai === 'thieuDot') return { mau: SO.mau.thieuDot, co: SO.coDot, dam: false };
  if (loai === 'doc') return { mau: SO.mau.doc, co: SO.coDot, dam: false };
  const m = own(MUC, muc) ? muc : 'vua', mauKey = (loai === 'chiMang' || loai === 'ketLieu') ? 'do' : MUC[m].so;
  return { mau: SO.mau[mauKey], co: mauKey === 'do' ? SO.coNang : SO.coCoBan, dam: mauKey === 'do' };
}
/** Quỹ đạo số tại t giây: parabol nhỏ (lên rồi xuống nhẹ), phóng 120% lúc đầu rồi co về 100%, mờ ở 30% cuối. `lech` (−1..1) dịch ngang để số không chồng nhau/không che nhân vật. */
export function soNay(t, { lech = 0 } = {}) {
  const k = clamp(num(t) / SO.song, 0, 1);
  const y = 4 * SO.parabolCao * k * (1 - k) + 0.6 * k + 1.7;   // m trên chân; cung cao rồi trôi nhẹ lên, luôn trên đầu người (≥ 1,7 m)
  const scale = k < 0.25 ? 1 + (SO.phongTo - 1) * (k / 0.25) : SO.phongTo - (SO.phongTo - 1) * Math.min(1, (k - 0.25) / 0.25);
  return { y: r3(y), x: r3(clamp(lech, -1, 1) * 0.6 * k), scale: r3(scale), alpha: r3(k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1), het: k >= 1 };
}

// ───── 6. Phản ứng giữa Hệ ─────
export const PHAN_UNG_FX = Object.freeze({
  bungChay: Object.freeze({ mau: '#ff7a2a', hat: 'tia-lua', chu: 'Bùng cháy' }),
  hoiNuoc: Object.freeze({ mau: '#dff3ff', hat: 'hoi-nuoc', chu: 'Hơi nước' }),
  nongChay: Object.freeze({ mau: '#ffb04a', hat: 'kim-chay', chu: 'Nóng chảy' }),
  bunLay: Object.freeze({ mau: '#8a6a3a', hat: 'bun-ban', chu: 'Bùn lầy' }),
  gionLanh: Object.freeze({ mau: '#aee4ff', hat: 'manh-bang', chu: 'Giòn lạnh' }),
});
export const GIAY_PHAN_UNG = 0.5;
/** Hiệu ứng riêng 0,5 s + chữ nổi ngắn trên đầu mục tiêu. Hệ không phản ứng (cùng Hệ / thiếu) → null. Chữ lấy từ luật lõi (data/luatChien.js). */
export function hieuUngPhanUng(heA, heB) {
  const luat = PHAN_UNG.find((p) => p.he.includes(heA) && p.he.includes(heB) && heA !== heB);
  if (!luat) return null;
  const f = PHAN_UNG_FX[luat.id];
  return { id: luat.id, chu: luat.chu, mau: f.mau, hat: f.hat, giay: GIAY_PHAN_UNG, soNay: { ...soNay(0.2), chu: luat.chu } };
}

// ───── 7. Chết ─────
export const TAN_THEO_HE = Object.freeze({ kim: 'manh-bac', moc: 'la-bao-tu', thuy: 'tan-nuoc', tho: 'vun-da', hoa: 'tro-lua' });
/** Hiệu ứng chết: tan theo Hệ của chiêu kết liễu; Tuyệt học/boss tan chậm hơn (giây). Hệ lạ → khói trắng. */
export function hieuUngChet({ he = null, boss = false, vai = 'thuong' } = {}) {
  return { kieu: own(TAN_THEO_HE, he) || 'khoi-trang', giay: boss ? 1.6 : vai === 'tuyet' ? 1.2 : 0.8, ngaTruoc: !boss };   // ngã rồi mới tan (quái thường)
}

// ───── 8. Boss: mức giáp phá ─────
/** Vòng sáng trên người boss: tiLe 0..1 = giáp phá còn lại (1 = nguyên); đầy → sáng mờ, càng thủng càng đậm/đỏ. Khống chế boss bị giảm (ít bị hất). */
export function vongGiapPha(giapCon, giapMax) {
  const mx = Math.max(1, num(giapMax, 1)), tiLe = clamp(num(giapCon) / mx, 0, 1);
  return { tiLe: r3(tiLe), doDuc: r3(0.25 + 0.6 * (1 - tiLe)), mau: tiLe > 0.5 ? '#cfd8e3' : tiLe > 0.2 ? '#f2b84a' : '#ff5a3a', vo: tiLe <= 0 };
}
/** Thời gian khống chế sau khi trừ theo cỡ kẻ địch: boss ngắn lại (hất tung ×0,3 …) — nhưng không dài hơn trần luật lõi. */
export const HE_SO_KHONG_CHE_BOSS = Object.freeze({ hatTung: 0.3, choang: 0.5, troi: 0.5, dongBang: 0.5 });
export function giayKhongCheBoss(loai, giay, co = 'boss') {
  const g = Math.max(0, num(giay)); if (co !== 'boss') return r3(g);
  return r3(g * (own(HE_SO_KHONG_CHE_BOSS, loai) ?? 1));
}

// ───── 9. Từ hiệu ứng của chiêu → trạng thái hiển thị ─────
/** Khóa `fx` của chiêu (data/combatSkills.js) → trạng thái nhìn thấy được. (Hất tung chưa có chiêu nào khai báo trong `fx`: nối ở phiên có chiêu hất.) */
export const FX_SANG_TRANG_THAI = Object.freeze({ choang: 'choang', cham: 'lamCham', troi: 'troi', dongBang: 'dongBang', thieu: 'thieuDot', suongDoc: 'moMat', docLan: 'moMat' });
/**
 * Danh sách [{ loai, giay }] chiêu gây ra (mỗi trạng thái một lần). Thời gian lấy từ `dur`/`giay` của hiệu ứng (mặc định 2 s), khống chế bị cắt theo trần luật lõi (PvE).
 * Bỏ qua tỉ lệ `chance` — dùng cho cảnh luyện/hiển thị khi đã xác nhận trúng; nơi tính sát thương tự quyết có áp dụng hay không.
 */
export function trangThaiTuChieu(fx = {}) {
  const out = [], seen = new Set();
  for (const k of Object.keys(FX_SANG_TRANG_THAI)) {
    if (!fx || !Object.hasOwn(fx, k)) continue;
    const loai = FX_SANG_TRANG_THAI[k]; if (seen.has(loai)) continue; seen.add(loai);
    const v = fx[k], d = v && typeof v === 'object' ? num(v.dur ?? v.giay, 2) : num(v, 2);
    const tran = LUAT.gioiHanKhongChe[loai] ? LUAT.gioiHanKhongChe[loai][0] : Infinity;
    out.push({ loai, giay: r3(Math.min(Math.max(0.2, d > 0 ? d : 2), tran)) });
  }
  return out;
}
