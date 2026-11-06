// Đom đóm (Phiên 31): vùng bay + chuyển động mượt, thuần logic (không three) để kiểm thử.
// Mỗi con có một vùng "nhà"; vận tốc đổi hướng từ từ (lái về mục tiêu lang thang), tối đa MAX_SPEED m/s.
import { mulberry32, TAU } from '../util.js';
import { POND } from './layout.js';
import { ZEN, KOI } from './landscape.js';
import { THAC } from './outside.js';

export const MAX_SPEED = 1.6;
// Vùng: tâm (x,z), bán kính r, độ cao y0..y1, trọng số. Bãi thông là ước lượng quanh cổ thụ (-106,90) — cần chủ dự án xem lại.
export const ZONES = [
  { id: 'aosen', x: POND.x, z: POND.z, r: POND.r + 3, y0: 0.5, y1: 2.2, w: 3 },
  { id: 'sanchua', x: 0, z: -6, r: 14, y0: 0.8, y1: 3.5, w: 2 },
  { id: 'vuonthien', x: (ZEN.x0 + ZEN.x1) / 2, z: (ZEN.z0 + ZEN.z1) / 2, r: 9, y0: 0.6, y1: 2.6, w: 2 },
  { id: 'aoca', x: KOI.x, z: KOI.z, r: KOI.r + 3, y0: 0.5, y1: 2.2, w: 3 },
  { id: 'bongthong', x: -106, z: 90, r: 12, y0: 0.8, y1: 4, w: 3 },
  { id: 'hothac', x: THAC.pool.x, z: THAC.pool.z, r: THAC.pool.r + 5, y0: 0.6, y1: 3, w: 3 },
];

/** Độ sáng nền theo độ tối (0..1) và mưa (0..1): tối dần lên, mưa thì tắt. */
export const fireflyLevel = (night, rain) => Math.max(0, Math.min(1, (night - 0.5) / 0.4)) * Math.max(0, 1 - rain / 0.08);

/** Chia n con vào các vùng theo trọng số (tổng luôn = n). */
export function allocate(n, zones = ZONES) {
  const tw = zones.reduce((s, z) => s + z.w, 0), out = zones.map((z) => Math.floor((n * z.w) / tw));
  let left = n - out.reduce((s, v) => s + v, 0);
  for (let i = 0; left > 0; i = (i + 1) % zones.length, left--) out[i]++;
  return out;
}

export function createSwarm(n, seed = 12, zones = ZONES) {
  const rnd = mulberry32(seed), flies = [], counts = allocate(n, zones);
  zones.forEach((z, zi) => {
    for (let k = 0; k < counts[zi]; k++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * z.r;
      flies.push({ z, x: z.x + Math.cos(a) * d, y: z.y0 + rnd() * (z.y1 - z.y0), zz: z.z + Math.sin(a) * d,
        vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0, retarget: 0, ph: rnd() * TAU, rate: 0.6 + rnd() * 1.4, tmax: 0.5 + rnd() * (MAX_SPEED - 0.5) });
    }
  });
  const pick = (f) => {   // mục tiêu mới gần con đó, trong vùng
    const z = f.z, a = Math.random() * TAU, d = Math.sqrt(Math.random()) * z.r;
    f.tx = z.x + Math.cos(a) * d; f.tz = z.z + Math.sin(a) * d; f.ty = z.y0 + Math.random() * (z.y1 - z.y0); f.retarget = 2 + Math.random() * 4;
  };
  flies.forEach(pick);
  return {
    flies,
    step(dt) {
      dt = Math.min(dt, 0.1);
      for (const f of flies) {
        f.retarget -= dt; if (f.retarget <= 0) pick(f);
        const dx = f.tx - f.x, dy = f.ty - f.y, dz = f.tz - f.zz, L = Math.hypot(dx, dy, dz) || 1;
        const k = 1 - Math.exp(-1.2 * dt);   // lái mượt: vận tốc tiến dần về hướng mục tiêu
        f.vx += (dx / L * f.tmax - f.vx) * k; f.vy += (dy / L * f.tmax * 0.5 - f.vy) * k; f.vz += (dz / L * f.tmax - f.vz) * k;
        const sp = Math.hypot(f.vx, f.vy, f.vz); if (sp > MAX_SPEED) { const s = MAX_SPEED / sp; f.vx *= s; f.vy *= s; f.vz *= s; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.zz += f.vz * dt;
        if (f.y < f.z.y0 - 0.3) f.y = f.z.y0 - 0.3;
      }
    },
    /** Độ nhấp nháy 0..1 của con i tại thời điểm t (mỗi con một nhịp, có lúc tối hẳn). */
    blink(i, t) { const f = flies[i], s = Math.sin(t * f.rate + f.ph); return s > -0.2 ? 0.55 + 0.45 * Math.sin(t * f.rate * 2.3 + f.ph) : 0.05; },
  };
}
