// Hồn quái bay vào HỒ LÔ ở eo (Phiên 126): LOGIC THUẦN (không three.js, không đọc đồng hồ), có test: tests/soul.test.mjs.
// Quái bị hạ thì biến mất khỏi LGT.farmView.mons; js/ui/combatPose.js so danh sách từng nhịp (diffMons), quái vừa biến mất ngay sau khi người chơi ra đòn gần đó (killed)
// thì thả một đốm hồn bay từ chỗ quái tới hồ lô (orbPos); js/scene/soulFx.js vẽ.
const clamp01 = (v) => Math.min(1, Math.max(0, +v || 0));
export const SOUL_S = 0.9;   // giây hồn bay từ quái tới hồ lô

/** Vị trí đốm hồn tại u (0..1): đường cong bậc hai từ A (chỗ quái) lên cao rồi lao xuống B (hồ lô); chậm lúc đầu, nhanh dần khi gần hồ lô. */
export function orbPos(a, b, u, lift = 1.6) {
  const k = clamp01(u), e = Math.pow(k, 1.6), cx = (a.x + b.x) / 2, cy = Math.max(a.y, b.y) + lift, cz = (a.z + b.z) / 2, m = 1 - e;
  return { x: m * m * a.x + 2 * m * e * cx + e * e * b.x, y: m * m * a.y + 2 * m * e * cy + e * e * b.y, z: m * m * a.z + 2 * m * e * cz + e * e * b.z };
}
/** Cỡ đốm hồn tại u: nở ra lúc đầu rồi nhỏ dần khi chui vào hồ lô. */
export const orbScale = (u) => { const k = clamp01(u); return Math.max(0.12, (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, k * 1.4))) * (1 - 0.75 * k)); };

const strip = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
/** Màu đốm hồn theo Hệ quái (Kim trắng vàng, Mộc xanh lá, Thủy xanh nước, Hỏa cam đỏ, Thổ vàng đất). Hệ lạ/trống → vàng nhạt. */
export function soulColor(he) {
  const h = strip(he);
  if (/(^|[^a-z])kim|metal/.test(h)) return 0xfff1b8;
  if (/moc|wood/.test(h)) return 0x9cf59c;
  if (/thuy|water/.test(h)) return 0x8fd4ff;
  if (/hoa|fire/.test(h)) return 0xff9a6b;
  if (/tho|earth/.test(h)) return 0xe6c27a;
  return 0xffe29a;
}

/** So danh sách quái nhịp trước (prev: Map uid → {x,z,he,t}) với nhịp này (mons: [{uid,x,z,he}]). Trả { next, gone }: gone = quái vừa biến mất (kèm vị trí cuối). */
export function diffMons(prev, mons, now) {
  const next = new Map(), gone = [];
  for (const m of mons || []) if (m && m.uid != null && Number.isFinite(+m.x) && Number.isFinite(+m.z)) next.set(m.uid, { x: +m.x, z: +m.z, he: m.he || '', t: now });
  if (prev) for (const [uid, e] of prev) if (!next.has(uid)) gone.push({ uid, ...e });
  return { next, gone };
}
/**
 * Lọc "quái bị hạ" trong gone: người chơi vừa ra đòn (lastAttack trong `window` ms), quái ở gần (≤ maxDist m) và mới thấy gần đây (≤ fresh ms, tránh quái đã vắng từ lâu).
 * ctx: { now, lastAttack, player: {x,z}, window = 2500, maxDist = 32, fresh = 600 }. Thiếu dữ liệu → [].
 */
export function killed(gone, ctx = {}) {
  const { now, lastAttack, player, window = 2500, maxDist = 32, fresh = 600 } = ctx;
  if (!gone || !gone.length || !player || !Number.isFinite(now) || !Number.isFinite(lastAttack) || now - lastAttack > window) return [];
  return gone.filter((e) => now - e.t <= fresh && Math.hypot(e.x - player.x, e.z - player.z) <= maxDist);
}
