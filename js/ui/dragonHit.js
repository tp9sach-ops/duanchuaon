// SÁT THƯƠNG RỒNG HỒNG (Phiên 227): rồng của Gậy như ý bay trúng quái thì quái mất máu thật (trước đây rồng chỉ là hiệu ứng).
// Chỉ máy CỦA CHỦ rồng mới gọi hàm này (rồng của người khác vẽ với track ≠ null, không gây sát thương) → không trừ máu hai lần.
// - Quái bãi rừng: LGT.farm.remoteHit (trừ máu thật, có từ Phiên 222) rồi LGT.farm.claimKill nếu quái chết để chủ rồng nhận thưởng.
// - Yêu quái hằng tháng: LGT.yq.ramHit (đường đánh có sẵn của Thiết đầu công).
import { DHIT, dragonHits } from '../world/dragonMath.js';
import { stoneDamage, YQ } from '../world/yeuquai.js';

const bodyOf = (m) => (m.boss ? 1.8 : m.elite ? 1.1 : 0.55);   // bán kính thân (m), giống js/ui/farm.js

/** head {x,y,z}: đầu rồng; t: giây tuổi con rồng; rec: Map của con rồng; origin {x,z}: chỗ người chơi. Trả { n, pts } (số quái trúng + toạ độ để vẽ tia sáng). Không bao giờ ném lỗi. */
export function applyDragonHit(head, t, rec, origin, LGT = globalThis.LGT) {
  const none = { n: 0, pts: [] };
  try {
    if (!head || !rec || !LGT) return none;
    const str = LGT.strength && Number.isFinite(+LGT.strength.value) ? +LGT.strength.value : 6;
    let buff = 1; try { const b = LGT.buffMul ? +LGT.buffMul() : 1; if (b > 1 && b < 10) buff = b; } catch (_) { buff = 1; }
    const dmg = Math.max(1, Math.round(stoneDamage(str) * DHIT.dmgMul * buff));
    const yq = LGT.yq;
    if (yq && yq.active && yq.boss && typeof yq.ramHit === 'function') {   // đang có yêu quái hằng tháng
      const b = yq.boss, spec = YQ[b.type], body = spec && Number.isFinite(+spec.body) ? +spec.body : 1.8;
      const got = dragonHits(head, [{ uid: 'yq', x: b.x, z: b.z, oan: 1 }], () => body, rec, t);
      if (!got.length || !yq.ramHit(dmg)) return none;
      return { n: 1, pts: [{ x: b.x, y: head.y, z: b.z }] };
    }
    const F = LGT.farm, mons = LGT.farmView && LGT.farmView.mons;
    if (!F || typeof F.remoteHit !== 'function' || !mons || !mons.length) return none;
    const list = dragonHits(head, mons, bodyOf, rec, t), pts = [];
    for (const m of list) {
      const r = F.remoteHit(m.uid, dmg, undefined, origin && origin.x, origin && origin.z);
      if (!r) continue;
      pts.push({ x: m.x, y: head.y, z: m.z });
      if (r.dead && typeof F.claimKill === 'function') F.claimKill(r.type);   // đòn cuối của mình → nhận thưởng
    }
    return { n: pts.length, pts };
  } catch (_) { return none; }   // sát thương lỗi thì thôi, không làm hỏng hiệu ứng / game
}
