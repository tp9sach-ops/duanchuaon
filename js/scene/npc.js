// Dựng NPC (Phiên 14g): dùng lại nhân vật chibi của người chơi (avatar.js). NPC đứng yên, thở nhẹ, quay mặt về người chơi khi lại gần (≤ 9 m).
import { createAvatar } from '../world/avatar.js';
import { groundY } from '../world/layout.js';
import { NPCS } from '../world/npc.js';

export function buildNpcs(scene, LGT) {
  const list = NPCS.map((n) => {
    const a = createAvatar({ name: n.ten, color: n.color, hair: n.hair });
    a.group.position.set(n.x, groundY(n.x, n.z), n.z); a.setFacing(n.ry, true); scene.add(a.group);
    return { n, a };
  });
  const byId = Object.fromEntries(list.map(({ n, a }) => [n.id, a]));
  LGT.npcs = byId;
  return {
    byId,
    update(dt, pos) {
      for (const { n, a } of list) {
        const dx = pos.x - n.x, dz = pos.z - n.z;
        a.setFacing(Math.hypot(dx, dz) <= 9 ? Math.atan2(dx, dz) : n.ry);
        a.update(dt);
      }
    },
  };
}
