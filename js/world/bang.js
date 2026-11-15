// BĂNG THẬT + NƯỚC THẬT (Phiên 180, mục 2 của docs/KE_HOACH_HIEU_UNG_3D.md). LOGIC THUẦN (không three.js), có test: tests/bang.test.mjs.
// Băng thật không phải chấm xanh: là các TINH THỂ 3D (lăng trụ sáu cạnh nhọn đầu) MỌC từ mặt đất (nhanh, hơi vọt quá rồi hạ lại), đứng một lúc rồi VỠ thành mảnh bay tung rơi xuống;
// sương lạnh trôi sát đất; mặt đất đóng băng loang dần. Nước thật là dải nước cuộn + sóng vành + giọt rơi bắn tóe + bọt trắng + vòng sóng loang.
// File này chỉ tính SỐ (vị trí, cỡ, độ mờ); phần vẽ nằm ở js/scene/fxBang.js. Số TẠM, chờ nhìn bằng mắt.

/** Số vật thể theo bậc máy. yếu: ít tinh thể, bỏ sương/mảnh/giọt/bọt/vòng sóng. */
export const BANG_BAC = Object.freeze({
  yeu: { tinhThe: 5, suong: 0, manh: 0, giot: 0, bot: 0, song: 1 },
  vua: { tinhThe: 12, suong: 5, manh: 18, giot: 24, bot: 4, song: 2 },
  cao: { tinhThe: 22, suong: 9, manh: 36, giot: 48, bot: 7, song: 3 },
});
export const SO_KIEU_BANG = 3;   // 3 tỉ lệ tinh thể khác nhau (ngắn bè · vừa · dài gai)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fract = (v) => v - Math.floor(v);
const sm = (k) => { const t = clamp(k, 0, 1); return t * t * (3 - 2 * t); };
/** Số giả ngẫu nhiên cố định 0..1 theo (i, k). */
export const bam = (i, k = 0) => fract(Math.abs(Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453));

/** Chiêu nào dùng băng / nước thật (chỉ Hệ thủy; loại 'bang' → băng, 'nuoc' → nước). */
export const dungBang = (he, loai) => he === 'thuy' && loai === 'bang';
export const dungNuoc = (he, loai) => he === 'thuy' && loai === 'nuoc';

/**
 * Kế hoạch băng: bậc máy + kiểu bay → hạt giống cố định. `co` = cỡ lõi chiêu (0.25 thường · 0.35 chiêu 4 · 0.5 tuyệt học).
 * Mỗi tinh thể: phi (pha), r (0..1 khoảng cách tương đối), a (góc), cao (m), rong (bán kính chân), ngh (nghiêng rad), tre (trễ mọc, giây), kieu, xoay.
 */
export function lapBang(tier = 'vua', mode = 'no', { co = 0.25 } = {}) {
  const b = BANG_BAC[tier] || BANG_BAC.vua, kc = 1 + clamp(co, 0.1, 0.8) * 2.4;   // hệ số cỡ: ~1,6 / 1,8 / 2,2
  const tinhThe = [], suong = [], manh = [], giot = [], bot = [];
  for (let i = 0; i < b.tinhThe; i++) tinhThe.push({ phi: bam(i, 1), r: bam(i, 2), a: bam(i, 3) * Math.PI * 2, cao: (0.9 + bam(i, 4) * 1.5) * kc, rong: (0.16 + bam(i, 5) * 0.16) * kc, ngh: (bam(i, 6) - 0.5) * 0.5, tre: bam(i, 7) * 0.22, kieu: i % SO_KIEU_BANG, xoay: bam(i, 8) * Math.PI, vet: bam(i, 9) });
  for (let i = 0; i < b.suong; i++) suong.push({ phi: bam(i, 11), r: bam(i, 12), a: bam(i, 13) * Math.PI * 2, toc: 0.6 + bam(i, 14) * 0.7, co: 0.8 + bam(i, 15) * 0.6 });
  for (let i = 0; i < b.manh; i++) manh.push({ goc: i % Math.max(1, b.tinhThe), a: bam(i, 21) * Math.PI * 2, vx: bam(i, 22) - 0.5, vy: 0.4 + bam(i, 23), vz: bam(i, 24) - 0.5, co: 0.5 + bam(i, 25) * 0.8, quay: (bam(i, 26) - 0.5) * 14 });
  for (let i = 0; i < b.giot; i++) giot.push({ a: bam(i, 31) * Math.PI * 2, r: Math.sqrt(bam(i, 32)), vy: 3 + bam(i, 33) * 4.5, vr: 0.6 + bam(i, 34) * 1.8, tre: bam(i, 35) * 0.25, co: 0.5 + bam(i, 36) * 0.7, toc: 0.8 + bam(i, 37) * 0.4 });
  for (let i = 0; i < b.bot; i++) bot.push({ a: bam(i, 41) * Math.PI * 2, r: bam(i, 42), co: 0.7 + bam(i, 43) * 0.7, phi: bam(i, 44), toc: 0.5 + bam(i, 45) * 0.5 });
  return { tier: BANG_BAC[tier] ? tier : 'vua', mode, kc, nTinhThe: b.tinhThe, nSuong: b.suong, nManh: b.manh, nGiot: b.giot, nBot: b.bot, nSong: b.song, tinhThe, suong, manh, giot, bot };
}

/** Mốc thời gian (giây từ lúc phát) của vòng đời tinh thể: mọc xong → bắt đầu vỡ → vỡ xong. */
export const T_BANG = Object.freeze({ moc: 0.22, vo0: 0.48, vo1: 0.74 });

/**
 * Một tinh thể ở giây `after` (từ lúc phát). Trả { hien, moc 0..1 (độ dài đã mọc, có vọt nhẹ rồi về 1), vo 0..1 (tiến độ vỡ), op 0..1 }.
 * Mọc: nhanh (ease-out, vọt ~8% rồi hạ). Đứng yên (có "thở" rất nhẹ). Từ vo0 thì co dần + mờ, đến vo1 biến mất (mảnh vỡ thay thế).
 */
export function tinhTheBang(s, after, tre0 = 0) {
  const t = after - s.tre - tre0;
  if (t < 0) return { hien: false, moc: 0, vo: 0, op: 0 };
  const k = clamp(t / T_BANG.moc, 0, 1), vot = 1 - Math.pow(1 - k, 3), nay = k < 1 ? Math.sin(k * Math.PI) * 0.08 : 0;
  const vo = clamp((after - tre0 - T_BANG.vo0 - s.tre * 0.5) / (T_BANG.vo1 - T_BANG.vo0), 0, 1);
  const tho = k >= 1 ? 1 + 0.015 * Math.sin(after * 9 + s.phi * 30) : 1;
  return { hien: vo < 1, moc: clamp((vot + nay) * tho, 0, 1.12), vo, op: clamp(k * 3, 0, 1) * (1 - sm(vo * 1.3)) };
}

/**
 * Chỗ đặt chân một tinh thể theo kiểu bay (ctx = { reach, R2, zD, pz (đầu chiêu), after }).
 * - tia: gai băng mọc dọc ĐƯỜNG ĐI, chỗ nào đầu chiêu bay tới thì gai mọc (trễ `tre` theo vị trí)
 * - no: gai băng tỏa từ tâm ra khắp vùng, gần tâm cao và to hơn
 * Trả { x, z, mul (nhân cỡ), tre (trễ thêm, giây), hien }.
 */
export function viTriBang(mode, s, ctx) {
  const { reach = 4, R2 = 2, zD = 0, pz = 0 } = ctx || {};
  if (mode === 'tia') {
    const z = reach * (0.12 + 0.88 * s.vet), x = (s.r - 0.5) * Math.min(2.4, reach * 0.35);
    const zz = clamp(z / Math.max(0.1, reach), 0, 0.999), tre = 0.18 * (1 - Math.sqrt(1 - zz));   // giây (từ lúc phát) đầu chiêu bay tới chỗ này (đầu chiêu bay ~0,35 s; ở đây nén về ≤ 0,18 s cho gọn)
    return { x, z, mul: 0.6 + 0.3 * (1 - s.vet) + 0.4 * s.r, tre, hien: true };
  }
  const rr = R2 * Math.sqrt(s.r);
  return { x: Math.sin(s.a) * rr, z: zD + Math.cos(s.a) * rr, mul: 1.35 - 0.8 * (rr / Math.max(0.5, R2)), tre: (rr / Math.max(0.5, R2)) * 0.12, hien: true };
}

/** Mảnh băng vỡ: bay ra từ chân tinh thể `goc` lúc vỡ, rơi theo trọng lực. Trả { hien, d (độ dời so với gốc tinh thể), y, quay, op, co }. */
export function manhBang(m, after, goc, tre0 = 0) {
  const t0 = T_BANG.vo0 + tre0 + (goc ? goc.tre * 0.5 : 0), t = after - t0;
  if (t < 0 || t > 1.4) return { hien: false, dx: 0, dy: 0, dz: 0, quay: 0, op: 0, co: m.co };
  const g = 9.5, dy = (goc ? goc.cao * 0.55 : 0.8) + m.vy * 3.2 * t - 0.5 * g * t * t;
  return { hien: dy > -0.05 || t < 0.9, dx: m.vx * 5 * t, dy: Math.max(0, dy), dz: m.vz * 5 * t, quay: m.quay * t, op: clamp((1.4 - t) / 0.5, 0, 1), co: m.co };
}

/** Sương lạnh: trôi sát đất, loang rộng dần, rất mờ. Trả { x, z, y, kichCo, op }. */
export function suongBang(s, t, R2 = 2) {
  const p = fract(t * 0.3 * s.toc + s.phi), vao = clamp(p / 0.25, 0, 1), ra = clamp((1 - p) / 0.55, 0, 1), rr = R2 * (0.2 + 0.8 * s.r);
  return { p, x: Math.sin(s.a + t * 0.25) * rr * (0.6 + 0.4 * p), z: Math.cos(s.a + t * 0.25) * rr * (0.6 + 0.4 * p), y: 0.15 + p * 0.7, kichCo: (1.4 + p * 2.2) * s.co, op: 0.34 * vao * ra };
}

/** Mặt đất đóng băng: bán kính loang theo giây từ lúc phát (nhanh rồi chậm), độ mờ giữ đến gần hết `tNen` rồi tan. Trả { k 0..1 (cỡ), op 0..1 }. */
export function nenBang(after, tNen = 3) {
  if (after < 0) return { k: 0, op: 0 };
  const k = 1 - Math.pow(1 - clamp(after / 0.7, 0, 1), 2.4), tan = clamp((tNen - after) / Math.max(0.4, tNen * 0.35), 0, 1);
  return { k, op: sm(after / 0.25) * tan };
}

// ================= NƯỚC =================

/**
 * Sóng vành (nước cuộn tỏa ra từ tâm, như vòng sóng mép cuộn): i = thứ tự vành (0..), after = giây từ lúc phát. Trả { hien, k (0..1 tiến độ), ban kinh (m), cao (m), op }.
 * Mỗi vành sau trễ hơn, nhỏ dần về độ cao; vành đầu to nhất.
 */
export function songNuoc(i, after, R2 = 2, co = 0.25) {
  const tre = i * 0.16, t = after - tre; if (t < 0) return { hien: false, k: 0, banKinh: 0, cao: 0, op: 0 };
  const k = clamp(t / 0.85, 0, 1), e = 1 - Math.pow(1 - k, 2.2), tuyet = clamp(co / 0.25, 1, 2.2) * 0.5 + 0.5;
  return { hien: k < 1, k, banKinh: Math.max(0.2, R2 * (0.15 + 0.95 * e)), cao: (0.55 + 0.5 * tuyet) * (1 - i * 0.22) * Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5) * (1 - 0.6 * k), op: clamp(k * 6, 0, 1) * (1 - sm((k - 0.45) / 0.55)) };
}

/** Cột nước giữa (chỉ chiêu 'no' nước: nước bùng lên rồi sập xuống): trả { hien, cao (m), banKinh (m), op }. `co` lớn (tuyệt học) cao hơn. */
export function cotNuoc(after, co = 0.25, R2 = 2) {
  if (after < 0 || after > 1.1) return { hien: false, cao: 0, banKinh: 0, op: 0 };
  const hi = 1.6 + co * 7, up = 1 - Math.pow(1 - clamp(after / 0.3, 0, 1), 3), down = after < 0.45 ? 1 : 1 - sm((after - 0.45) / 0.6);
  return { hien: true, cao: hi * up * (0.35 + 0.65 * down), banKinh: Math.min(R2 * 0.45, 0.35 + co * 1.2) * (0.6 + 0.4 * up) * (0.7 + 0.3 * down), op: clamp(after / 0.08, 0, 1) * down };
}

/** Dải nước xoáy quanh người (thuy_2): i-th dải, trả { goc (xoay quanh người), y (độ cao), banKinh, op }. */
export function xoayNuoc(i, n, after, R2 = 2) {
  const k = clamp(after / 0.9, 0, 1), vao = sm(after / 0.2), ra = 1 - sm((after - 0.65) / 0.3);
  return { goc: after * 6 + (i / Math.max(1, n)) * Math.PI * 2, y: 0.1 + k * 1.3, banKinh: Math.max(0.8, R2) * (0.55 + 0.25 * k), op: clamp(vao * ra, 0, 1) };
}

/** Giọt nước: bắn lên từ tâm rồi rơi, chạm đất thì tan (tóe). Trả { hien, x, y, z, op, dai (độ kéo dài theo vận tốc) }. */
export function giotNuoc(g, after, R2 = 2) {
  const t = (after - g.tre) * g.toc; if (t < 0) return { hien: false, x: 0, y: 0, z: 0, op: 0, dai: 1 };
  const G = 11, y = 0.2 + g.vy * t - 0.5 * G * t * t, r = g.r * R2 * 0.55 + g.vr * t * 0.9;
  if (y < 0 && t > 0.15) return { hien: false, x: 0, y: 0, z: 0, op: 0, dai: 1 };
  const vv = g.vy - G * t;
  return { hien: true, x: Math.sin(g.a) * r, y: Math.max(0.02, y), z: Math.cos(g.a) * r, op: clamp((1.3 - t) / 0.3, 0, 1) * clamp(t / 0.04, 0, 1), dai: 1 + clamp(Math.abs(vv) * 0.12, 0, 1.6) };
}

/** Bọt trắng ở chân (nổi rồi tan). Trả { x, z, y, kichCo, op }. */
export function botNuoc(b, t, R2 = 2) {
  const p = fract(t * 0.55 * b.toc + b.phi), vao = clamp(p / 0.2, 0, 1), ra = clamp((1 - p) / 0.5, 0, 1), rr = R2 * (0.25 + 0.7 * b.r);
  return { x: Math.sin(b.a) * rr, z: Math.cos(b.a) * rr, y: 0.12 + p * 0.25, kichCo: (0.6 + p * 0.9) * b.co, op: 0.45 * vao * ra };
}
