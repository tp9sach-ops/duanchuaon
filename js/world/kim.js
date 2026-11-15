// KIM LOẠI + SÉT THẬT (Phiên 181, mục 3 của docs/KE_HOACH_HIEU_UNG_3D.md). LOGIC THUẦN (không three.js), có test: tests/kim.test.mjs.
// Kim thật không phải chấm trắng: là VỆT CHÉM LƯỠI LIỀM (dải cong thon hai đầu, sáng giữa mờ mép) bay đi / quét vòng / tỏa ra,
// MẢNH KIM LOẠI hình mũi nhọn xoay lật lấp lánh, và TIA SÉT zích zắc (gấp khúc, nhấp nháy, giáng từ trời hoặc chạy dọc đường chiêu).
// File này chỉ tính SỐ (vị trí, góc, cỡ, độ mờ, điểm của tia sét); phần vẽ nằm ở js/scene/fxKim.js. Số TẠM, chờ nhìn bằng mắt.

/** Số vật thể theo bậc máy. yếu: chỉ 1 vệt chém, không mảnh/sét/lóe (nhẹ cho điện thoại). */
export const KIM_BAC = Object.freeze({
  yeu: { liem: 1, manh: 0, set: 0, loe: 0 },
  vua: { liem: 3, manh: 10, set: 2, loe: 5 },
  cao: { liem: 5, manh: 22, set: 4, loe: 10 },
});
export const DIEM_SET = 9;   // số điểm của một tia sét (đầu + cuối cố định, ở giữa gấp khúc)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fract = (v) => v - Math.floor(v);
const sm = (k) => { const t = clamp(k, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 2.4);
/** Số giả ngẫu nhiên cố định 0..1 theo (i, k). */
export const bam = (i, k = 0) => fract(Math.abs(Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453));

/** Chiêu nào dùng kim loại/sét thật (chỉ Hệ kim, loại 'kim'). */
export const dungKim = (he, loai) => he === 'kim' && loai === 'kim';

/** Mốc thời gian (giây): vệt chém sống bao lâu · tia sét sống bao lâu · số lần nhấp nháy sét mỗi giây. */
export const T_KIM = Object.freeze({ liem: 0.6, set: 0.3, nhay: 30 });

/**
 * Kế hoạch kim: bậc máy + kiểu bay → hạt giống cố định. `co` = cỡ lõi chiêu (0.25 thường · 0.35 chiêu 4 · 0.5 tuyệt học).
 * liem: vệt chém (tre = trễ, ngh = góc nghiêng rad, cao = độ cao m, rong = bề rộng m, quay = chiều xoay ±1, a0 = pha)
 * manh: mảnh kim loại (a, r, r2, y, vx/vy/vz, quay, toc, phi, kich)   set: tia sét (tre, a, r, hat = hạt giống nhánh, dai)
 */
export function lapKim(tier = 'vua', mode = 'no', { co = 0.25 } = {}) {
  const b = KIM_BAC[tier] || KIM_BAC.vua, kc = 1 + clamp(co, 0.1, 0.8) * 2.4;   // hệ số cỡ: ~1,6 / 1,8 / 2,2
  const liem = [], manh = [], set = [];
  for (let i = 0; i < b.liem; i++) liem.push({ tre: i * 0.085 + bam(i, 1) * 0.04, ngh: (bam(i, 2) - 0.5) * 1.3, cao: 0.6 + bam(i, 3) * 0.9, rong: (1.5 + bam(i, 4) * 0.9) * kc * 0.55, quay: i % 2 ? -1 : 1, a0: bam(i, 5) * Math.PI * 2 });
  for (let i = 0; i < b.manh; i++) manh.push({ a: bam(i, 11) * Math.PI * 2, r: bam(i, 12), r2: bam(i, 13), y: bam(i, 14), vx: bam(i, 15) - 0.5, vy: 0.5 + bam(i, 16), vz: bam(i, 17) - 0.5, quay: 4 + bam(i, 18) * 10, toc: 0.7 + bam(i, 19) * 0.6, phi: bam(i, 20), kich: (0.7 + bam(i, 21) * 0.7) * (0.8 + kc * 0.2) });
  for (let i = 0; i < b.set; i++) set.push({ tre: i * 0.11 + bam(i, 31) * 0.05, a: bam(i, 32) * Math.PI * 2, r: Math.sqrt(bam(i, 33)), hat: i * 17 + 3, dai: 0.8 + bam(i, 34) * 0.5 });
  return { tier: KIM_BAC[tier] ? tier : 'vua', mode, kc, nLiem: b.liem, nManh: b.manh, nSet: b.set, nLoe: b.loe, liem, manh, set };
}

/**
 * Một vệt chém lưỡi liềm ở giây `after` (từ lúc phát). ctx = { reach, R2 }.
 * Trả { hien, kieu ('song' = liềm bay thẳng · 'vong' = liềm quét vòng quanh người), x, y, z, ry (xoay quanh trục đứng), roll (nghiêng), co (cỡ, m), op, k (0..1 tiến độ) }.
 * - tia: liềm bay thẳng tới trước, rộng dần rồi tan; mỗi vệt nghiêng một góc khác nhau (chém chéo)
 * - xoay: liềm quét vòng quanh người, mỗi vệt một độ cao, xoay nhanh dần rồi tan
 * - no: liềm vòng tỏa ra từ tâm như sóng chém, vệt sau trễ và nhỏ hơn
 */
export function lietLiem(s, mode, after, ctx) {
  const { reach = 4, R2 = 2 } = ctx || {}, t = after - s.tre;
  if (t < 0 || t > T_KIM.liem) return { hien: false, kieu: 'song', x: 0, y: 0, z: 0, ry: 0, roll: 0, co: 0, op: 0, k: 0 };
  const k = clamp(t / T_KIM.liem, 0, 1), vao = clamp(k * 9, 0, 1), ra = 1 - sm((k - 0.5) / 0.5);
  if (mode === 'tia') {
    const e = easeOut(k * 1.15);
    return { hien: true, kieu: 'song', x: 0, y: 0.5 + s.cao * 0.55, z: Math.max(0.3, reach * e), ry: 0, roll: s.ngh, co: s.rong * (0.45 + 0.55 * sm(k * 2.2)), op: vao * ra, k };
  }
  if (mode === 'xoay') {
    return { hien: true, kieu: 'vong', x: 0, y: 0.35 + s.cao * 0.9, z: 0, ry: s.a0 + s.quay * (t * 9 + k * k * 8), roll: s.ngh * 0.15, co: Math.max(0.9, R2) * (0.62 + 0.22 * k), op: vao * ra, k };
  }
  const e = easeOut(k);
  return { hien: true, kieu: 'vong', x: 0, y: 0.3 + s.cao * 0.3, z: 0, ry: s.a0 + s.quay * k * 2.4, roll: s.ngh * 0.1, co: Math.max(0.6, R2 * (0.2 + 0.95 * e) * (1 - s.tre * 0.9)), op: vao * ra, k };
}

/**
 * Mảnh kim loại ở giây `after` (t = giây từ lúc gồng, cho nhấp nháy). Trả { hien, x, y, z, rx, ry, rz (góc xoay), kich, op, loe 0..1 (độ lóe sáng) }.
 * - xoay: xếp thành vành lưỡi dao quay quanh người, mũi nhọn chỉ theo hướng quay
 * - tia: rải dọc đường đi, lật xoay, đuổi theo đầu chiêu
 * - no: bắn tung ra rồi rơi theo trọng lực
 */
export function manhKim(m, mode, t, after, ctx) {
  const { reach = 4, R2 = 2, W = 1.2 } = ctx || {};
  const ra = 1 - sm((after - 0.7) / 0.3), loe = Math.pow(Math.max(0, Math.sin(t * (9 + m.phi * 8) + m.phi * 40)), 10);
  if (after < 0) return { hien: false, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, kich: m.kich, op: 0, loe: 0 };
  const k = clamp(after / 0.85, 0, 1), vao = clamp(after / 0.08, 0, 1);
  if (mode === 'xoay') {
    const a = m.a + after * 6 * m.toc, rr = Math.max(0.9, R2) * (0.45 + 0.4 * m.r);
    return { hien: ra > 0.01, x: Math.sin(a) * rr, y: 0.3 + m.y * 1.6, z: Math.cos(a) * rr, rx: Math.PI / 2, ry: a + Math.PI / 2, rz: after * m.quay * 0.8, kich: m.kich, op: vao * ra, loe };
  }
  if (mode === 'tia') {
    const z0 = reach * (0.1 + 0.9 * m.r2), e = easeOut((after - m.phi * 0.18) / 0.5);
    return { hien: after > m.phi * 0.18 && ra > 0.01, x: (m.r - 0.5) * 2 * W * 0.7 + m.vx * k, y: 0.5 + m.y * 1.1 + m.vy * k * 0.5, z: z0 * e, rx: after * m.quay, ry: m.a, rz: after * m.quay * 0.7, kich: m.kich, op: vao * ra, loe };
  }
  const rr = R2 * m.r * easeOut(k), y = Math.max(0.05, 0.4 + m.vy * 4.2 * k - 4.9 * k * k * 2.2);
  return { hien: ra > 0.01, x: Math.sin(m.a) * rr, y, z: Math.cos(m.a) * rr, rx: after * m.quay, ry: m.a, rz: after * m.quay * 0.6, kich: m.kich, op: vao * ra, loe };
}

/**
 * Tia sét zích zắc từ điểm a đến điểm b ([x,y,z]), `n` điểm (đầu và cuối ĐỨNG YÊN), `bien` = biên độ lệch (m), `tick` = lần nhấp nháy
 * (đổi tick thì hình tia sét đổi, cùng tick thì giống hệt nhau). Lệch lớn nhất ở giữa, nhỏ dần về hai đầu → trông như điện thật, không đều tăm tắp.
 */
export function zicZac(seed, tick, n, a, b, bien) {
  const pts = [], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
  const d = [dx / L, dy / L, dz / L];
  let u = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];   // vector bất kỳ không song song với hướng tia
  let p = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const pl = Math.hypot(p[0], p[1], p[2]) || 1; p = [p[0] / pl, p[1] / pl, p[2] / pl];
  const q = [d[1] * p[2] - d[2] * p[1], d[2] * p[0] - d[0] * p[2], d[0] * p[1] - d[1] * p[0]];
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0 : i / (n - 1), env = Math.sin(f * Math.PI), r1 = (bam(seed * 13 + i, tick * 7 + 1) - 0.5) * 2, r2 = (bam(seed * 29 + i, tick * 5 + 2) - 0.5) * 2;
    if (i === 0) { pts.push([a[0], a[1], a[2]]); continue; }
    if (i === n - 1) { pts.push([b[0], b[1], b[2]]); continue; }   // hai đầu gán thẳng (tránh lệch số thực)
    const o1 = r1 * bien * env, o2 = r2 * bien * env;
    pts.push([a[0] + dx * f + p[0] * o1 + q[0] * o2, a[1] + dy * f + p[1] * o1 + q[1] * o2, a[2] + dz * f + p[2] * o1 + q[2] * o2]);
  }
  return pts;
}

/**
 * Tia sét thứ `s` ở giây `after`. ctx = { reach, R2, zD, pz (đầu chiêu) }.
 * Trả { hien, tick, a, b (hai đầu), bien (m), rong (m), op (nhấp nháy), lop (0..1 chớp trúng đất, để vẽ tia lóe) }.
 * - no: sét GIÁNG từ trên cao xuống một điểm quanh tâm, chớp ~0,3 s (nhấp nháy mạnh rồi tắt)
 * - tia: sét chạy dọc đường chiêu, bám theo đầu chiêu
 * - xoay: sét nhảy từ người ra vành quanh người, đổi chỗ liên tục
 */
export function setSet(s, mode, after, ctx) {
  const { reach = 4, R2 = 2, zD = 0, pz = 0 } = ctx || {}, off = { hien: false, tick: 0, a: [0, 0, 0], b: [0, 0, 0], bien: 0, rong: 0, op: 0, lop: 0 };
  if (mode === 'no') {
    const t = after - s.tre; if (t < 0 || t > T_KIM.set) return off;
    const tick = Math.floor(t * T_KIM.nhay), k = t / T_KIM.set, rr = R2 * 0.9 * s.r, x = Math.sin(s.a) * rr, z = zD + Math.cos(s.a) * rr;
    const nhay = bam(s.hat, tick) > 0.28 ? 1 : 0.35;
    return { hien: true, tick, a: [x + Math.sin(s.a * 2) * 1.2, 9, z + Math.cos(s.a * 2) * 1.2], b: [x, 0.08, z], bien: 0.9 * s.dai, rong: 0.16 + 0.1 * (1 - k), op: nhay * (1 - sm((k - 0.55) / 0.45)), lop: clamp(1 - k * 1.8, 0, 1) };
  }
  if (mode === 'tia') {
    const t = after - s.tre * 0.5; if (t < 0 || t > 0.6) return off;
    const tick = Math.floor(t * T_KIM.nhay), z1 = Math.max(0.5, Math.min(reach, pz || reach * 0.5)), z0 = Math.max(0, z1 - reach * (0.45 + 0.2 * s.dai)), k = t / 0.6;
    const lech = (s.r - 0.5) * 0.9;
    return { hien: true, tick, a: [lech, 1.1, z0], b: [-lech * 0.5, 1.1, z1], bien: 0.34 * s.dai, rong: 0.09, op: (bam(s.hat, tick) > 0.3 ? 1 : 0.4) * (1 - sm((k - 0.6) / 0.4)), lop: clamp(1 - k * 2, 0, 1) * 0.6 };
  }
  const t = after - s.tre; if (t < 0 || t > 0.9) return off;
  const tick = Math.floor(t * 12), g = bam(s.hat, tick) * Math.PI * 2, rr = Math.max(0.9, R2) * (0.5 + 0.35 * bam(s.hat, tick + 9)), k = t / 0.9;
  return { hien: true, tick: Math.floor(t * T_KIM.nhay), a: [0, 1.1, 0], b: [Math.sin(g) * rr, 0.5 + bam(s.hat, tick + 4) * 1.2, Math.cos(g) * rr], bien: 0.3 * s.dai, rong: 0.08, op: (bam(s.hat, Math.floor(t * T_KIM.nhay)) > 0.3 ? 1 : 0.4) * (1 - sm((k - 0.6) / 0.4)), lop: 0 };
}
