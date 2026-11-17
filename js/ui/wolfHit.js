// SÁT THƯƠNG CÚ NGOẠM của sói khí vàng (Phiên 227): sói vồ ra TRÚNG quái thì quái mất máu thật (trước đây sói chỉ là hiệu ứng).
// Chỉ máy CỦA CHỦ sói mới tính sát thương (sói của người khác vẽ ra với remote = true, không gọi hàm này) → không bị trừ máu hai lần.
// - Quái bãi rừng: LGT.farm.remoteHit(uid, dmg, by, ax, az) trừ máu thật (đã có từ Phiên 222) rồi LGT.farm.claimKill(type) nếu quái chết để chủ sói nhận thưởng như tự thu phục.
// - Yêu quái hằng tháng: LGT.yq.ramHit(dmg) (đường đánh chung có sẵn của Thiết đầu công).
// Sát thương = stoneDamage(sức mạnh) × WOLF.dmgMul (× hiệu lực chiêu hỗ trợ nếu có); con gần nhất nhận đủ, tối đa WOLF.biteMax con dính, con phụ nhận WOLF.splashPct.
import { WOLF, bitePoint, biteTargets, biteDamages } from '../world/wolfMath.js';
import { stoneDamage, YQ } from '../world/yeuquai.js';

const bodyOf = (m) => (m.boss ? 1.8 : m.elite ? 1.1 : 0.55);   // bán kính thân (m), giống js/ui/farm.js

/** w: { pos {x,y,z}, heading, range }. Trả số quái bị trúng (0 nếu không trúng ai / lỗi). Không bao giờ ném lỗi. */
export function applyBite(w, LGT = globalThis.LGT) {
  try {
    if (!w || !LGT) return 0;
    const pt = bitePoint(w.pos, w.heading, w.range);
    const str = LGT.strength && Number.isFinite(+LGT.strength.value) ? +LGT.strength.value : 6;
    let buff = 1; try { const b = LGT.buffMul ? +LGT.buffMul() : 1; if (b > 1 && b < 10) buff = b; } catch (_) { buff = 1; }
    const base = Math.max(1, Math.round(stoneDamage(str) * WOLF.dmgMul * buff));
    const yq = LGT.yq;
    if (yq && yq.active && yq.boss && typeof yq.ramHit === 'function') {   // đang có yêu quái hằng tháng
      const b = yq.boss, spec = YQ[b.type], body = spec && Number.isFinite(+spec.body) ? +spec.body : 1.8;
      return Math.hypot(b.x - pt.x, b.z - pt.z) <= body + WOLF.biteReach && yq.ramHit(base) ? 1 : 0;
    }
    const F = LGT.farm, mons = LGT.farmView && LGT.farmView.mons;
    if (!F || typeof F.remoteHit !== 'function' || !mons || !mons.length) return 0;
    const list = biteTargets(pt, mons, bodyOf), dmg = biteDamages(base, list.length);
    let n = 0;
    list.forEach((m, i) => {
      const r = F.remoteHit(m.uid, dmg[i], undefined, w.pos.x, w.pos.z);
      if (!r) return;
      n++;
      if (r.dead && typeof F.claimKill === 'function') F.claimKill(r.type);   // đòn cuối của mình → nhận thưởng
    });
    return n;
  } catch (_) { return 0; }   // sát thương lỗi thì thôi, không làm hỏng hiệu ứng / game
}
