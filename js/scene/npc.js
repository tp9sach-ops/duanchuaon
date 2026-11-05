// Dựng NPC (Phiên 14g, mở rộng Phiên 17): dùng lại nhân vật chibi của người chơi (avatar.js). NPC đứng yên, thở nhẹ, quay mặt về người chơi khi lại gần (≤ 9 m).
// Thêm dân làng đi lại (WALKERS, chỉ để cho vui mắt): đi tới lui giữa hai đầu đường, tới đầu thì quay lại.
import { createAvatar } from '../world/avatar.js';
import { groundY } from '../world/layout.js';
import { NPCS } from '../world/npc.js';
import { WALKERS } from '../world/outside.js';

export function buildNpcs(scene, LGT) {
  const list = NPCS.map((n) => {
    const a = createAvatar({ name: n.ten, color: n.color, hair: n.hair, beard: n.beard || '' });
    if (n.scale) a.group.scale.setScalar(n.scale);
    a.group.position.set(n.x, groundY(n.x, n.z), n.z); a.setFacing(n.ry, true); scene.add(a.group);
    return { n, a };
  });
  const walkers = WALKERS.map((w) => {
    const a = createAvatar({ name: '', color: w.color, hair: w.hair });
    if (w.scale) a.group.scale.setScalar(w.scale);
    a.group.children.forEach((c) => { if (c.isSprite) c.visible = false; });   // không hiện nhãn tên
    const [x, z] = w.path[0]; a.group.position.set(x, 0, z); scene.add(a.group);
    return { w, a, x, z, to: 1, wait: 0 };
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
      for (const k of walkers) {
        const { w, a } = k;
        if (k.wait > 0) { k.wait -= dt; a.setState('idle'); a.update(dt); continue; }
        const [tx, tz] = w.path[k.to], dx = tx - k.x, dz = tz - k.z, d = Math.hypot(dx, dz), step = w.speed * dt;
        if (d <= step) { k.x = tx; k.z = tz; k.to = 1 - k.to; k.wait = 2 + (k.x * 7 % 3); a.setState('idle'); }
        else { k.x += dx / d * step; k.z += dz / d * step; a.setState('walk', w.speed); a.setFacing(Math.atan2(dx, dz)); }
        a.group.position.set(k.x, 0, k.z); a.update(dt);
      }
    },
  };
}
