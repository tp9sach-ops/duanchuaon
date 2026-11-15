// LỬA THẬT (Phiên 177, mục 1 của docs/KE_HOACH_HIEU_UNG_3D.md). LOGIC THUẦN (không three.js), có test: tests/lua.test.mjs.
// Lửa thật không phải ô màu: nhiều "lưỡi lửa" hình giọt, mỗi lưỡi sống một vòng ngắn — sinh ở gốc (trắng vàng nóng), bốc lên, thon dần, chuyển cam rồi đỏ sẫm, mờ dần;
// lưỡi nào cũng đung đưa/nhấp nháy khác nhau; phía trên có khói đen mỏng, xung quanh có tàn lửa bay lên rồi tắt.
// File này chỉ tính SỐ (vị trí, cỡ, độ mờ, màu theo "độ nguội"); phần vẽ nằm ở js/scene/fxLua.js. Số TẠM, chờ nhìn bằng mắt.

/** Số lưỡi lửa / khói / tàn theo bậc máy (yếu: chỉ lưỡi lửa, bỏ khói + tàn + vũng sáng). */
export const LUA_BAC = Object.freeze({ yeu: { luoi: 6, khoi: 0, tan: 0 }, vua: { luoi: 14, khoi: 5, tan: 24 }, cao: { luoi: 26, khoi: 9, tan: 48 } });
export const SO_KIEU = 3;   // số kết cấu lưỡi lửa khác nhau (để các lưỡi không giống hệt nhau)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fract = (v) => v - Math.floor(v);
/** Số giả ngẫu nhiên cố định 0..1 theo (i, k): cùng đầu vào luôn ra cùng kết quả (hiệu ứng ổn định, test được). */
export const bam = (i, k = 0) => fract(Math.abs(Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453));

/** Kế hoạch lửa: bậc máy + kiểu bay → danh sách "hạt giống" cố định cho từng lưỡi/khói/tàn. `co` = cỡ lõi của chiêu (0.25 thường · 0.35 chiêu 4 · 0.5 tuyệt học). */
export function lapLua(tier = 'vua', mode = 'no', { co = 0.25 } = {}) {
  const b = LUA_BAC[tier] || LUA_BAC.vua, kichCo = 0.8 + clamp(co, 0.1, 0.8) * 3;   // cao một lưỡi (m): ~1,6 / 1,9 / 2,3
  const luoi = [], khoi = [], tan = [];
  for (let i = 0; i < b.luoi; i++) luoi.push({ phi: bam(i, 1), r: bam(i, 2), a: bam(i, 3) * Math.PI * 2, toc: 0.75 + bam(i, 4) * 0.6, co: 0.65 + bam(i, 5) * 0.45, kieu: i % SO_KIEU, dau: i < Math.ceil(b.luoi * 0.3), vet: bam(i, 6), tre: bam(i, 7), gong: i < 3 });
  for (let i = 0; i < b.khoi; i++) khoi.push({ phi: bam(i, 11), r: bam(i, 12), a: bam(i, 13) * Math.PI * 2, toc: 0.7 + bam(i, 14) * 0.6, co: 0.7 + bam(i, 15) * 0.5, vet: bam(i, 16) });
  for (let i = 0; i < b.tan; i++) tan.push({ phi: bam(i, 21), r: bam(i, 22), a: bam(i, 23) * Math.PI * 2, toc: 0.6 + bam(i, 24) * 0.8, co: 0.5 + bam(i, 25) * 0.9, vx: bam(i, 26) - 0.5, vz: bam(i, 27) - 0.5, vet: bam(i, 28) });
  return { tier: LUA_BAC[tier] ? tier : 'vua', mode, kichCo, nLuoi: b.luoi, nKhoi: b.khoi, nTan: b.tan, luoi, khoi, tan };
}

/** Một lưỡi lửa ở giây `t`: p = tuổi 0..1 (0 = vừa sinh ở gốc, 1 = tắt). Trả cao (m), cỡ ngang/dọc (nhân), độ mờ, màu nhân (trắng nóng → cam → đỏ sẫm), độ nghiêng do gió/đung đưa. */
export function ngonLua(s, t) {
  const p = fract(t * s.toc * 1.15 + s.phi), nhay = 0.9 + 0.1 * Math.sin(t * 17 + s.phi * 40) + 0.05 * Math.sin(t * 31 + s.phi * 13);
  const vao = clamp(p / 0.12, 0, 1), ra = clamp((1 - p) / 0.45, 0, 1), op = vao * vao * (3 - 2 * vao) * ra;
  return { p, cao: p * 0.95 * s.co, sx: (1 - 0.55 * p) * nhay * s.co, sy: (0.8 + 0.5 * p) * nhay * s.co, op: clamp(op * nhay, 0, 1), tint: [1, 1 - 0.45 * p, 1 - 0.78 * p], lac: Math.sin(t * 3.1 + s.phi * 9) * 0.22 * (0.3 + p) };
}
/** Một cuộn khói ở giây `t`: ở phía trên lưỡi lửa, to dần, chậm hơn, rất mờ. */
export function khoiLua(s, t) {
  const p = fract(t * 0.38 * s.toc + s.phi), vao = clamp(p / 0.2, 0, 1), ra = clamp((1 - p) / 0.6, 0, 1);
  return { p, cao: 1.1 + p * 2.4 * s.co, kichCo: (0.7 + p * 2.0) * s.co, op: 0.3 * vao * ra, x: Math.sin(t * 0.9 + s.phi * 12) * 0.35 * p, z: Math.cos(t * 0.7 + s.phi * 8) * 0.35 * p };
}
/** Một tàn lửa ở giây `t`: bốc lên chậm dần rồi tắt; nhấp nháy nhanh. Trả vị trí lệch so với gốc + độ sáng 0..1. */
export function tanLua(s, t) {
  const p = fract(t * 0.85 * s.toc + s.phi), e = 1 - (1 - p) * (1 - p);
  return { p, x: s.vx * e * 2.2 + Math.sin(t * 5 + s.phi * 20) * 0.12 * p, y: 0.25 + e * 2.8 * s.co, z: s.vz * e * 2.2 + Math.cos(t * 4 + s.phi * 17) * 0.12 * p, op: clamp((1 - p) * (0.65 + 0.35 * Math.sin(t * 29 + s.phi * 60)), 0, 1) * clamp(p / 0.05, 0, 1) };
}

/**
 * Chỗ đặt gốc một lưỡi lửa theo kiểu bay của chiêu. ctx = { reach, W, R2, zD, pz, after (giây từ lúc phát), u (0..1) }.
 * - tia: quả cầu lửa ở đầu chiêu (pz) + đuôi lửa rải dọc đường đã đi (nhỏ dần về phía sau)
 * - no: cột lửa bùng từ tâm, lan ra khắp vùng
 * - xoay: lốc lửa xoáy quanh người
 * - mua: sao băng lửa rơi từ trên xuống rồi cháy tại chỗ rơi
 * Trả { x, y0, z, mul (nhân cỡ), roi (đang rơi: không bốc lên), hien (có hiện không) }.
 */
export function viTriLua(mode, s, ctx) {
  const { reach = 4, R2 = 2, zD = 0, pz = 0, after = 0, u = 0 } = ctx || {}, e = 1 - (1 - clamp(u, 0, 1)) * (1 - clamp(u, 0, 1));
  switch (mode) {
    case 'tia': {
      if (s.dau) return { x: (s.r - 0.5) * 0.5, y0: 0.9, z: clamp(pz, 0, reach), mul: 1, roi: false, hien: true };
      const z = clamp(pz, 0, reach) * s.vet; return { x: (s.r - 0.5) * 0.7, y0: 0.85, z, mul: 0.4 + 0.5 * s.vet, roi: false, hien: true };
    }
    case 'xoay': { const a = s.a + Math.max(0, after) * 3 * s.toc, rr = Math.max(0.6, (R2 || 1.5)) * (0.45 + 0.55 * s.r); return { x: Math.sin(a) * rr, y0: 0.05, z: Math.cos(a) * rr, mul: 0.75 + 0.25 * s.co, roi: false, hien: true }; }
    case 'mua': {
      const d = 0.05 + 0.55 * s.tre, tCham = d + 0.28, rr = reach * Math.sqrt(s.r), x = Math.sin(s.a) * rr, z = Math.cos(s.a) * rr;
      if (after < d) return { x, y0: 6, z, mul: 0, roi: true, hien: false };
      if (after < tCham) return { x, y0: 6 * (1 - (after - d) / 0.28), z, mul: 0.7, roi: true, hien: true };
      return { x, y0: 0, z, mul: 1.1, roi: false, hien: true };
    }
    default: { const rr = R2 * s.r * (0.25 + 0.75 * e); return { x: Math.sin(s.a) * rr, y0: 0, z: zD + Math.cos(s.a) * rr, mul: 1.5 - 0.7 * s.r, roi: false, hien: true }; }   // 'no'
  }
}

/** Chiêu nào dùng lửa thật: chỉ Hệ hỏa (các Hệ khác sẽ có bộ riêng ở các mục sau của kế hoạch). */
export const dungLua = (he) => he === 'hoa';
