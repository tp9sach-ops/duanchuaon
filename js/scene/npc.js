// Dựng NPC (Phiên 14g, mở rộng Phiên 17): dùng lại nhân vật chibi của người chơi (avatar.js). NPC đứng yên, thở nhẹ, quay mặt về người chơi khi lại gần (≤ 9 m).
// Thêm dân làng đi lại (WALKERS, chỉ để cho vui mắt): đi tới lui giữa hai đầu đường, tới đầu thì quay lại.
// Phiên 28: trời mưa thì mở dù (mưa nhỏ trở lên); mưa lớn dân làng đi tìm chỗ trú, hết mưa quay lại (logic ở world/shelter.js, có test).
import * as THREE from 'three';
import { createAvatar } from '../world/avatar.js';
import { groundY } from '../world/layout.js';
import { NPCS } from '../world/npc.js';
import { WALKERS } from '../world/outside.js';
import { lanternGlow, lanternSway, candleFlicker, carriesLantern, PHASE } from '../world/lantern.js';
import { isCovered, umbrellaOpen, newWalker, stepWalker } from '../world/shelter.js';

// Dù: tán hình nón hơi bẹt + cán mảnh, cầm ở tay phải, tán che trên đầu. Hình học dùng chung; mỗi người một màu (vật liệu dùng chung theo màu).
const UMB_COLORS = [0xd9382f, 0xe8b82a, 0x2f8f4e, 0x2e6fb5, 0xf2efe6];
const umbGeo = { canopy: null, pole: null }, umbMat = new Map(), poleMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.7 });
function makeUmbrella(i) {
  umbGeo.canopy = umbGeo.canopy || new THREE.ConeGeometry(0.7, 0.28, 16, 1, true); umbGeo.pole = umbGeo.pole || new THREE.CylinderGeometry(0.014, 0.014, 0.78, 6);
  const c = UMB_COLORS[i % UMB_COLORS.length]; let m = umbMat.get(c);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, side: THREE.DoubleSide }); umbMat.set(c, m); }
  const g = new THREE.Group(); g.position.set(0.34, 1.0, 0.05);   // gốc xoay/thu = bàn tay
  const pole = new THREE.Mesh(umbGeo.pole, poleMat); pole.position.y = 0.39; g.add(pole);
  const canopy = new THREE.Mesh(umbGeo.canopy, m); canopy.position.set(-0.34, 0.78, -0.05); g.add(canopy);
  g.visible = false; g.scale.setScalar(0.001); return g;
}

const lanGeo = {};
function makeLantern(i) {   // lồng đèn giấy cầm bằng cây tre ngắn ở tay trái; gốc xoay = bàn tay
  lanGeo.body = lanGeo.body || new THREE.SphereGeometry(0.15, 14, 10); lanGeo.stick = lanGeo.stick || new THREE.CylinderGeometry(0.01, 0.01, 0.34, 5);
  const g = new THREE.Group(); g.position.set(-0.32, 0.78, 0.12);
  const stick = new THREE.Mesh(lanGeo.stick, poleMat); stick.position.y = 0.12; g.add(stick);
  const hang = new THREE.Group(); hang.position.y = 0.28; g.add(hang);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff8a3a, emissive: 0xff7a1e, emissiveIntensity: 0.4, roughness: 0.6 });
  const body = new THREE.Mesh(lanGeo.body, mat); body.scale.set(1, 1.15, 1); body.position.y = -0.2; hang.add(body);
  return { g, hang, mat, ph: PHASE(i) };
}

import { startFlight, poseAt } from '../world/npcThrow.js';

export function buildNpcs(scene, LGT) {
  let ui = 0;
  const list = NPCS.map((n) => {
    const a = createAvatar({ name: n.ten, color: n.color, hair: n.hair, beard: n.beard || '' });
    if (n.scale) a.group.scale.setScalar(n.scale);
    a.group.position.set(n.x, groundY(n.x, n.z), n.z); a.setFacing(n.ry, true); scene.add(a.group);
    const umb = isCovered(n.id) ? null : makeUmbrella(ui++); if (umb) a.group.add(umb);
    return { n, a, umb, open: 0 };
  });
  const walkers = WALKERS.map((w, i) => {
    const a = createAvatar({ name: '', color: w.color, hair: w.hair });
    if (w.scale) a.group.scale.setScalar(w.scale);
    a.group.children.forEach((c) => { if (c.isSprite) c.visible = false; });   // không hiện nhãn tên
    const k = newWalker(w); a.group.position.set(k.x, 0, k.z); scene.add(a.group);
    const umb = makeUmbrella(i + 2); a.group.add(umb);
    const lan = carriesLantern(w) ? makeLantern(i) : null; if (lan) a.group.add(lan.g);
    return { w, a, k, umb, lan, open: 0 };
  });
  const byId = Object.fromEntries(list.map(({ n, a }) => [n.id, a]));
  LGT.npcs = byId;
  const setUmb = (o, want, dt) => {   // mở/thu dù mượt (~0,3 giây)
    o.open += ((want ? 1 : 0) - o.open) * Math.min(1, 7 * dt);
    if (!want && o.open < 0.02) o.open = 0;
    o.umb.visible = o.open > 0.02; o.umb.scale.setScalar(Math.max(0.001, o.open));
  };
  // Phiên 89: ném NPC — o.thr = { th (bay), home }; trong lúc bị ném bỏ qua đi/đứng bình thường, xong thì trở lại.
  const clock = () => performance.now() / 1000;
  const ents = () => [
    ...list.map((o) => ({ id: o.n.id, ten: o.n.ten, x: o.a.group.position.x, z: o.a.group.position.z, scale: o.n.scale || 1, held: !!o.thr })),
    ...walkers.map((o, i) => ({ id: 'w' + i, ten: 'Dân làng', x: o.a.group.position.x, z: o.a.group.position.z, scale: o.w.scale || 1, held: !!o.thr || !!o.k.hidden })),
  ];
  const thrown = (o, home, baseY, dt, isWalker) => {   // trả true nếu đang bị ném (đã đặt vị trí)
    if (!o.thr) return false;
    const p = poseAt(o.thr.th, clock(), home);
    if (p.phase === 'done') { o.thr = null; o.a.group.rotation.x = 0; o.a.group.position.set(home.x, baseY(home.x, home.z), home.z); if (!isWalker) o.a.setState('idle'); return false; }
    o.a.group.position.set(p.x, baseY(p.x, p.z) + p.y, p.z); o.a.group.rotation.x = p.phase === 'fly' ? p.spin : 0;
    if (p.phase === 'back') { o.a.setState('walk', 1.2); o.a.setFacing(Math.atan2(home.x - o.thr.th.to.x, home.z - o.thr.th.to.z)); } else o.a.setState(p.sit ? 'sit' : 'idle', 0);
    o.a.update(dt); return true;
  };
  const api = {
    byId,
    entities: ents,
    /** Ném NPC `id` từ chỗ đang đứng tới `to` {x,z}. Trả true nếu có NPC đó và chưa đang bị ném. */
    launch(id, to) {
      const o = list.find((e) => e.n.id === id) || walkers.find((e, i) => 'w' + i === id); if (!o || o.thr) return false;
      const g = o.a.group.position; o.thr = { th: startFlight({ x: g.x, z: g.z }, to, clock()) }; return true;
    },
    update(dt, pos) {
      const level = LGT.weather ? LGT.weather.level : 0, rainy = umbrellaOpen(level);
      for (const o of list) {
        const { n, a } = o, dx = pos.x - n.x, dz = pos.z - n.z;
        if (thrown(o, { x: n.x, z: n.z }, (x, z) => groundY(x, z), dt, false)) continue;
        a.setFacing(Math.hypot(dx, dz) <= 9 ? Math.atan2(dx, dz) : n.ry);
        if (o.umb) setUmb(o, rainy, dt);
        a.update(dt);
      }
      for (const o of walkers) {
        const { w, a, k } = o;
        if (thrown(o, { x: k.x, z: k.z }, () => 0, dt, true)) continue;
        const r = stepWalker(k, w, dt, level);
        if (r.moving) { a.setState('walk', r.speed); if (r.face != null) a.setFacing(r.face); } else a.setState('idle');
        a.group.visible = !k.hidden;   // trẻ em vào nhà tránh mưa lớn
        setUmb(o, rainy && k.mode !== 'in' && !k.hidden, dt);   // đang đứng dưới mái chỗ trú thì thu dù
        a.group.position.set(k.x, 0, k.z); a.update(dt);
        if (o.lan) { const t = performance.now() / 1000; o.lan.hang.rotation.z = lanternSway(t, r.moving ? r.speed : 0, o.lan.ph); o.lan.mat.emissiveIntensity = lanternGlow(LGT.night || 0) * candleFlicker(t, o.lan.ph); }
      }
    },
  };
  LGT.npcCtl = api;   // Phiên 89: js/ui/npcThrow.js dùng entities() + launch()
  return api;
}
