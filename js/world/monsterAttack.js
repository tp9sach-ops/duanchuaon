// Quái bãi rừng ĐÁNH TRẢ + Sinh Lực người chơi (Phiên 115, G1.6 phần còn thiếu). LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ, không Math.random): `dt` là giây do nơi gọi truyền.
// Quái chỉ nổi giận (eng) khi BỊ ĐÁNH (provoke); lúc đó đuổi theo người chơi trong vùng của nó, gồng chiêu báo trước rồi đánh. Số liệu: js/data/monsterAI.js (TẠM). Test: tests/monsterattack.test.mjs.
// Các hàm sửa quái / vitals TẠI CHỖ (giống spawn.js). Nối giao diện: js/ui/farmCombat.js.
import { rectsOf } from './spawn.js';
import { ATTACK_CFG as A, BOSS_ATTACK_CFG, VITALS_CFG as V } from '../data/monsterAI.js';
import { FARM_ZONES } from '../data/monsters.js';
import { monsterStats } from './spawn.js';
import { damageOf } from './combat.js';
import { sinhLucOf } from './stats.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const kind = (m) => (m && (m.elite || m.boss) ? 'elite' : 'normal');   // Phiên 123: boss đánh như tinh anh (nhanh, tầm xa, Hệ số cao)

/** Điểm (x, z) có đi được trong vùng farm `zoneId` không: nằm trong một hình chữ nhật của vùng và không nằm trong hình tròn tránh. Vùng lạ → true (không chặn). */
export function walkable(zoneId, x, z, night = false) {
  const zone = FARM_ZONES[zoneId]; if (!zone) return true;
  const px = num(x, NaN), pz = num(z, NaN);
  if (!rectsOf(zone, night).some((r) => px >= r.x0 && px <= r.x1 && pz >= r.z0 && pz <= r.z1)) return false;
  return !zone.avoid.some((c) => Math.hypot(px - c.x, pz - c.z) <= c.r);
}

/** Quái nổi giận (khi bị đánh): bắt đầu đuổi và đánh. */
export function provoke(m) { if (m) { m.eng = true; m.engT = 0; } }
/** Quái hết giận: đứng yên, huỷ đòn đang gồng. */
export function calm(m) { if (m) { m.eng = false; m.wind = 0; m.engT = 0; m.slam = false; } }

/**
 * Sát thương một đòn của quái lên người chơi. in: m ({ type, elite }), { thu (Thủ người chơi), max (Sinh Lực tối đa), rel = 'thuong' | 'loi' | 'bat' (quan hệ Hệ: quái đánh người) }.
 * Dùng damageOf (Công quái × hệ số × K_hệ × 100/(100+Thủ)), tối thiểu 1 và không quá maxHitPct × Sinh Lực tối đa. Loại quái lạ → 0.
 */
export function strikeDamage(m, { thu = 0, max = 1, rel = 'thuong' } = {}) {
  const st = m && monsterStats(m.type); if (!st) return 0;
  const raw = damageOf({ cong: st.cong, heSo: m.slam ? BOSS_ATTACK_CFG.slamHeSo : A.heSo[kind(m)], rel, thu });
  return Math.max(1, Math.min(raw, Math.max(1, Math.floor(num(max, 1) * A.maxHitPct))));
}

/**
 * Tiến quái `m` thêm `dt` giây (kẹp 0..0,25). `player` = { x, z }; ctx = { thu, max, rel } dùng khi trúng đòn. Quái chưa nổi giận → null.
 * Trả null (không có gì mới) hoặc một sự kiện:
 *   { k: 'windup' }            bắt đầu gồng chiêu (phồng lên, người chơi còn kịp chạy)
 *   { k: 'strike', dmg }       gồng xong và người chơi còn trong tầm → trúng
 *   { k: 'miss' }              gồng xong nhưng người chơi đã ra khỏi tầm
 *   { k: 'calm' }              bỏ cuộc (người chơi quá xa hoặc quá lâu không bị đánh)
 */
export function stepMonster(m, dt, player, ctx = {}) {
  if (!m || !m.eng || !player) return null;
  const d0 = clamp(num(dt), 0, 0.25), kd = kind(m), reach = A.reach[kd];
  m.engT = num(m.engT) + d0; m.atkT = Math.max(0, num(m.atkT) - d0);
  const px = num(player.x), pz = num(player.z);
  let dx = px - m.x, dz = pz - m.z, dist = Math.hypot(dx, dz);
  if (dist > A.leash || (m.engT > A.giveUp && dist > reach * 2)) { calm(m); return { k: 'calm' }; }
  if (dist > 1e-6) m.ry = Math.atan2(dx, dz);
  if (m.wind > 0) {                                   // đang gồng: đứng yên
    m.wind -= d0; if (m.wind > 0) return null;
    m.wind = 0; m.atkT = A.interval[kd];
    const slam = !!m.slam, hitR = slam ? BOSS_ATTACK_CFG.slamReach : reach * A.missSlack;
    const ev = dist <= hitR ? { k: 'strike', dmg: strikeDamage(m, ctx) } : { k: 'miss' };
    m.slam = false; if (slam) ev.slam = true; return ev;
  }
  if (dist > reach * A.stopFrac) {                    // đuổi theo, không đi ra ngoài vùng
    const step = Math.min(A.speed[kd] * d0, dist - reach * A.stopFrac), ux = dx / dist, uz = dz / dist;
    const tries = [[m.x + ux * step, m.z + uz * step], [m.x + ux * step, m.z], [m.x, m.z + uz * step]];
    for (const [nx, nz] of tries) if (walkable(m.zone, nx, nz, m.night)) { m.x = nx; m.z = nz; break; }
    dx = px - m.x; dz = pz - m.z; dist = Math.hypot(dx, dz);
  }
  if (dist <= reach && m.atkT <= 0) {
    m.atkN = num(m.atkN) + 1; m.slam = !!(m.boss && m.atkN % BOSS_ATTACK_CFG.slamEvery === 0);   // boss: cứ 3 đòn có 1 đòn giậm đất
    m.wind = m.slam ? BOSS_ATTACK_CFG.slamWindup : A.windup; return m.slam ? { k: 'windup', slam: true } : { k: 'windup' };
  }
  return null;
}

/**
 * Sinh Lực người chơi. opts: { tuvi }. Tự hồi sau VITALS_CFG.regenDelay giây không giao tranh; sau mỗi đòn bị đánh có hitGrace giây bất tử; hết Sinh Lực → `down` (nơi gọi đưa về cửa chùa rồi gọi revive).
 * `touch()` báo "đang giao tranh" (người chơi đánh quái) để chưa hồi.
 */
export function createVitals({ tuvi = 1 } = {}) {
  let max = sinhLucOf(tuvi), hpf = max, sinceFight = 999, grace = 0, down = false;   // hpf: Sinh Lực dạng số thực (hồi từng chút), hp = phần nguyên
  return {
    get hp() { return Math.floor(hpf + 1e-9); }, get max() { return max; }, get down() { return down; }, get grace() { return grace; },
    get pct() { return max > 0 ? hpf / max : 0; },
    /** Đổi Tu Vi: Sinh Lực tối đa đổi theo, giữ nguyên tỉ lệ hiện có. */
    setTuVi(tv) { const nm = sinhLucOf(tv); if (nm !== max) { const r = max > 0 ? hpf / max : 1; max = nm; hpf = down ? 0 : Math.max(1, Math.min(max, r * max)); } },
    touch() { sinceFight = 0; },
    /** Bị đánh `dmg`: trả { taken, down }. Đang bất tử / đã down / dmg không hợp lệ → taken 0. */
    take(dmg) {
      const n = Math.floor(num(dmg)); if (down || grace > 0 || n <= 0) return { taken: 0, down };
      const t = Math.min(Math.floor(hpf + 1e-9), n); hpf -= t; sinceFight = 0; grace = V.hitGrace;
      if (hpf < 1) { hpf = 0; down = true; }
      return { taken: t, down };
    },
    /** Tiến `dt` giây (kẹp 0..0,25): hết bất tử, hồi Sinh Lực khi đã yên đủ lâu. */
    step(dt) {
      const d = clamp(num(dt), 0, 0.25); grace = Math.max(0, grace - d); sinceFight += d;
      if (!down && hpf < max && sinceFight >= V.regenDelay) hpf = Math.min(max, hpf + max * V.regenPctPerSec * d);
    },
    /** Hồi sinh đầy Sinh Lực, bất tử koGrace giây. */
    revive() { hpf = max; down = false; grace = V.koGrace; sinceFight = 999; },
  };
}
