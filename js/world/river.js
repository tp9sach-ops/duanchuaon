// Sông + hồ (Phiên 74, ptg yêu cầu 09/11): dòng sông chảy ra từ hồ chân thác về phía Tây-Nam, có cầu đá bắc qua ở bãi thác; hồ nhỏ trong bãi rừng thông.
// LOGIC THUẦN: tọa độ + vật cản (nước = chuỗi hình tròn trong layout.WATERS, đi được trên cầu). Cảnh 3D: js/scene/river.js. Test: tests/river.test.mjs.
import { addWater, addCircle } from './layout.js';

/** Sông Thác: đường gấp khúc [x, z] bắt đầu ở mép hồ thác (hồ tâm 106,104 r7,5), hw = nửa bề rộng. Đoạn đầu nằm trong bãi thác (đi được), phần sau chảy ra xa (chỉ để ngắm). */
export const RIVER = {
  id: 'songthac', ten: 'Sông Thác', hw: 1.7, step: 1.4,
  pts: [[100.6, 110.4], [97, 115], [94, 119.5], [91.5, 124], [86, 131], [78, 140], [66, 150], [52, 158]],
  // cầu đá bắc qua sông ở bãi thác (hình chữ nhật theo trục; y = độ cao mặt cầu). Hai đầu cầu là đất liền, tránh tảng đá (101,117 r1,5).
  bridge: { x0: 94, x1: 98.6, z0: 114.4, z1: 117.8, y: 0.45 },
};
/** Hồ Rừng: hồ nhỏ ở bãi rừng thông (Tây), nằm trong vùng đi bộ để đứng ngắm / (sau này) câu cá. */
export const LAKE = { id: 'horung', ten: 'Hồ Rừng', x: -112, z: 102, r: 4.5 };

/** Suối Trong (Phiên 76): đoạn sông gần hồ thác, bờ Đông bãi thác — nước thứ 4 câu được (js/world/fishing.js). Hình tròn nhỏ đặt đúng giữa dòng để quăng cầu rơi vào sông. */
export const SUOI = { id: 'suoitrong', ten: 'Suối Trong', x: 99.2, z: 112.7, r: 2 };

/** Nhà Thủy tạ Hồ Rừng (Phiên 75): sàn gỗ nhô ra giữa hồ + lối đi gỗ từ bờ Đông; 4 trụ mái (vật cản nhỏ), mái ngói. Đứng trên sàn ngắm hồ = "đã ghé" nơi 'thuyta'. */
export const THUY_TA = {
  deck: { x0: -114.2, x1: -109.8, z0: 99.8, z1: 104.2, y: 0.4 },
  pier: { x0: -109.8, x1: -106.6, z0: 101, z1: 103, y: 0.4 },
  posts: [[-113.6, 100.4], [-110.4, 100.4], [-113.6, 103.6], [-110.4, 103.6]], postR: 0.25, stand: { x: -112, z: 102 },
};

/** Các hình tròn nước dọc sông (cách nhau ≤ step, phủ kín dải rộng 2·hw). */
export function riverCircles(R = RIVER) {
  const out = [];
  for (let i = 0; i + 1 < R.pts.length; i++) {
    const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / R.step));
    for (let k = 0; k < n; k++) { const t = k / n; out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, r: R.hw }); }
  }
  const [lx, lz] = R.pts[R.pts.length - 1]; out.push({ x: lx, z: lz, r: R.hw });
  return out;
}
/** Làm mượt đường gấp khúc (Chaikin) cho dòng chảy tự nhiên; giữ nguyên hai đầu. */
export function smooth(pts, n = 2) {
  let p = pts; for (let k = 0; k < n; k++) { const o = [p[0]]; for (let i = 0; i + 1 < p.length; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(p[p.length - 1]); p = o; }
  return p;
}
/** Dải rộng 2·hw theo đường gấp khúc: trả { verts: [[xTrái,zTrái],[xPhải,zPhải],…], idx: chỉ số tam giác }. Cảnh 3D dựng mặt nước/bờ từ đây. */
export function ribbonStrip(pts, hw) {
  const verts = [], idx = [];
  pts.forEach(([x, z], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    verts.push([x - dz * hw, z + dx * hw], [x + dz * hw, z - dx * hw]);
    if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  });
  return { verts, idx };
}
let done = false;
export function registerRiver() {
  if (done) return; done = true;
  const cs = riverCircles(), b = RIVER.bridge;
  // cầu gắn vào hình tròn gần giữa cầu nhất (bridgeAt xét mọi hồ nên một chỗ gắn là đủ)
  let bi = 0, bd = Infinity; cs.forEach((c, i) => { const d = Math.hypot(c.x - (b.x0 + b.x1) / 2, c.z - (b.z0 + b.z1) / 2); if (d < bd) { bd = d; bi = i; } });
  cs.forEach((c, i) => addWater({ x: c.x, z: c.z, r: c.r, bridges: i === bi ? [{ ...b }] : [] }));
  addWater({ x: LAKE.x, z: LAKE.z, r: LAKE.r, bridges: [{ ...THUY_TA.deck }, { ...THUY_TA.pier }] });   // sàn + lối gỗ thủy tạ: đi được trên mặt hồ
  THUY_TA.posts.forEach(([x, z]) => addCircle({ x, z, r: THUY_TA.postR }));
}
