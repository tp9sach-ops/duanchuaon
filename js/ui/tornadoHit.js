// SÁT THƯƠNG CƠN LỐC CỦA CHỔI (Phiên 234): cơn lốc quét trúng quái thì quái mất máu thật. Chỉ máy CỦA NGƯỜI ĐÁNH gọi (lốc của người khác chỉ để xem) → không trừ máu hai lần.
// Cùng đường đánh với rồng hồng (js/ui/dragonHit.js): quái bãi rừng = LGT.farm.remoteHit (+ claimKill nếu hạ được); yêu quái hằng tháng = LGT.yq.ramHit.
import { tornadoHits } from '../world/tornadoMath.js';
import { stoneDamage, YQ } from '../world/yeuquai.js';

const bodyOf = (m) => (m.boss ? 1.8 : m.elite ? 1.1 : 0.55);   // bán kính thân (m), giống js/ui/farm.js

/** tn: thông số cơn lốc (tornadoPlan); pt {x,y,z}: chỗ cơn lốc; t: giây tuổi; rec: Map của RIÊNG cơn lốc này; origin {x,z}: chỗ người chơi. Trả { n, pts }. Không bao giờ ném lỗi. */
export function applyTornadoHit(tn, pt, t, rec, origin, LGT = globalThis.LGT) {
  const none = { n: 0, pts: [] };
  try {
    if (!tn || !pt || !rec || !LGT) return none;
    const str = LGT.strength && Number.isFinite(+LGT.strength.value) ? +LGT.strength.value : 6;
    let buff = 1; try { const b = LGT.buffMul ? +LGT.buffMul() : 1; if (b > 1 && b < 10) buff = b; } catch (_) { buff = 1; }
    const dmg = Math.max(1, Math.round(stoneDamage(str) * tn.dmgMul * buff));
    const yq = LGT.yq;
    if (yq && yq.active && yq.boss && typeof yq.ramHit === 'function') {
      const b = yq.boss, spec = YQ[b.type], body = spec && Number.isFinite(+spec.body) ? +spec.body : 1.8;
      const got = tornadoHits(tn, pt, [{ uid: 'yq', x: b.x, z: b.z, oan: 1 }], () => body, rec, t);
      if (!got.length || !yq.ramHit(dmg)) return none;
      return { n: 1, pts: [{ x: b.x, y: pt.y, z: b.z }] };
    }
    const F = LGT.farm, mons = LGT.farmView && LGT.farmView.mons;
    if (!F || typeof F.remoteHit !== 'function' || !mons || !mons.length) return none;
    const list = tornadoHits(tn, pt, mons, bodyOf, rec, t), pts = [];
    for (const m of list) {
      const r = F.remoteHit(m.uid, dmg, undefined, origin && origin.x, origin && origin.z);
      if (!r) continue;
      pts.push({ x: m.x, y: pt.y, z: m.z });
      if (r.dead && typeof F.claimKill === 'function') F.claimKill(r.type);
    }
    return { n: pts.length, pts };
  } catch (_) { return none; }   // sát thương lỗi thì thôi, không làm hỏng hiệu ứng / game
}
