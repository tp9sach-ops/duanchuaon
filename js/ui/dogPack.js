// BẦY CHÓ CHẠY THEO khi cưỡi Gậy dạy chó (Phiên 227): vài con chó vàng chạy theo sau người cưỡi; xuống gậy thì chó mờ dần rồi biến mất.
// Logic chạy/ô đứng/mờ dần: js/world/dogMath.js (có test). Đây là hình khối + vẽ. Tiếng sủa một lần lúc chó hiện ra (chỉ máy mình): js/ui/wolfSfx.js.
// - Máy MÌNH: startLocalDogs() (gọi từ js/ui/wolfFx.js khi nạp) chạy vòng requestAnimationFrame, đọc LGT.board.on + LGT.loadout.hold === 'tre' (không sửa js/ui/board.js).
// - Người KHÁC: js/ui/remoteGear.js gọi createDogPack().update(av, dt, ride === 'tre') — dùng sẵn trường cưỡi trong gói tin (gearSync), KHÔNG thêm gói mạng.
// Chó chạy trong cảnh của nhân vật (av.group.parent), đứng dưới đất = độ cao người − độ nâng cưỡi. CHƯA nhìn bằng mắt trên máy thật (môi trường AI không có WebGL) — kích thước / ô đứng là số TẠM (DOGS).
import * as THREE from 'three';
import { glowTexture } from './staffMesh.js';
import { DOGS, slotWorld, followStep, turnToward, fadeStep, gaitRate } from '../world/dogMath.js';
import { wolfSfx } from './wolfSfx.js';

const PALETTE = [
  { fur: 0xd89a3a, dark: 0x8a5a1e, belly: 0xf3deb0 },
  { fur: 0xb9783a, dark: 0x6b4318, belly: 0xefd7a6 },
  { fur: 0xe6c27a, dark: 0xa8782f, belly: 0xfff0cf },
  { fur: 0x8a6a45, dark: 0x4f3a22, belly: 0xe9d6b0 },
];
const FIXED = { nose: 0x1c1208, eye: 0x140c06, tongue: 0xe0505a };
const LEGH = 0.46;   // m: từ tâm thân tới đất (chân dài ~0,4)

let G = null;
const geos = () => G || (G = { ball: new THREE.SphereGeometry(1, 12, 9), cone: new THREE.ConeGeometry(1, 2, 8) });

function buildDog(pal) {
  const g = geos(), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = (c, em) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: em, roughness: 0.8, transparent: true, opacity: 0 });
  const m = { fur: mat(pal.fur, 0.2), dark: mat(pal.dark, 0.15), belly: mat(pal.belly, 0.25), nose: mat(FIXED.nose, 0.05), eye: mat(FIXED.eye, 0.05), tongue: mat(FIXED.tongue, 0.3) };
  const part = (geo, mt, sx, sy, sz, x, y, z, parent) => { const o = new THREE.Mesh(geo, mt); o.scale.set(sx, sy, sz); o.position.set(x, y, z); (parent || body).add(o); return o; };
  part(g.ball, m.fur, 0.17, 0.17, 0.36, 0, 0, -0.02);        // thân
  part(g.ball, m.fur, 0.18, 0.2, 0.2, 0, 0.02, 0.22);        // ngực
  part(g.ball, m.belly, 0.11, 0.12, 0.13, 0, -0.04, 0.3);    // ngực sáng
  part(g.ball, m.dark, 0.13, 0.06, 0.3, 0, 0.14, -0.02);     // yên lưng sẫm
  const head = new THREE.Group(); head.position.set(0, 0.2, 0.46); body.add(head);
  const hp = (geo, mt, sx, sy, sz, x, y, z, parent) => part(geo, mt, sx, sy, sz, x, y, z, parent || head);
  hp(g.ball, m.fur, 0.11, 0.1, 0.12, 0, 0, 0);               // sọ
  hp(g.ball, m.belly, 0.06, 0.055, 0.11, 0, -0.035, 0.13);   // mõm
  hp(g.ball, m.nose, 0.026, 0.02, 0.022, 0, -0.022, 0.235);  // mũi
  const ears = [];
  for (const s of [-1, 1]) {
    hp(g.ball, m.eye, 0.016, 0.016, 0.016, s * 0.05, 0.03, 0.095);                                   // mắt
    const ear = hp(g.cone, m.dark, 0.045, 0.1, 0.03, s * 0.085, 0.075, -0.01); ear.rotation.z = -s * 2.0; ears.push({ ear, s });   // tai cụp
  }
  const tongue = hp(g.ball, m.tongue, 0.022, 0.01, 0.06, 0, -0.075, 0.17);                           // lưỡi thè
  const tail = new THREE.Group(); tail.position.set(0, 0.1, -0.36); tail.rotation.x = 0.9; body.add(tail);
  part(g.cone, m.fur, 0.04, 0.17, 0.04, 0, 0, -0.16, tail).rotation.x = -Math.PI / 2;
  part(g.ball, m.belly, 0.04, 0.04, 0.06, 0, 0, -0.33, tail);
  const legs = [];
  for (const [x, z, off] of [[-0.09, 0.2, 0], [0.09, 0.2, Math.PI], [-0.09, -0.22, Math.PI], [0.09, -0.22, 0]]) {   // chạy nước kiệu: chân chéo cùng pha
    const hip = new THREE.Group(); hip.position.set(x, -0.06, z); body.add(hip);
    part(g.cone, m.fur, 0.05, 0.12, 0.05, 0, -0.12, 0, hip).rotation.x = Math.PI;
    part(g.cone, m.dark, 0.032, 0.1, 0.032, 0, -0.28, 0.01, hip).rotation.x = Math.PI;
    part(g.ball, m.belly, 0.045, 0.025, 0.06, 0, -0.37, 0.025, hip);
    legs.push({ hip, off });
  }
  return { root, body, head, tail, ears, tongue, legs, mats: Object.values(m) };
}

/** sound: true = sủa một tiếng khi bầy hiện ra (chỉ dùng cho máy mình). */
export function createDogPack({ sound = false } = {}) {
  let st = null;

  function spawn(scene, P, heading) {
    const dogs = [];
    for (let i = 0; i < DOGS.count; i++) {
      const d = buildDog(PALETTE[i % PALETTE.length]), s0 = slotWorld(P, heading, DOGS.slots[i % DOGS.slots.length]);
      const pm = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd98a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), poof = new THREE.Sprite(pm);
      poof.scale.set(1.8, 1.8, 1); d.root.visible = false;
      scene.add(d.root); scene.add(poof);
      dogs.push({ ...d, i, poof, pm, pos: { x: s0.x, z: s0.z }, heading, speed: 0, phase: i * 1.3 });
    }
    st = { scene, dogs, k: 0, t: 0, lift: 0 };
    if (sound) { try { wolfSfx.bark(); } catch (_) { /* tiếng lỗi thì thôi */ } }
  }

  function dispose() {
    if (!st) return;
    for (const d of st.dogs) { st.scene.remove(d.root); st.scene.remove(d.poof); for (const m of d.mats) m.dispose(); d.pm.dispose(); }
    st = null;
  }

  /** av: nhân vật (cần av.group). want: có đang cưỡi Gậy dạy chó không. Gọi mỗi khung hình (sau khi vị trí nhân vật đã cập nhật). */
  function update(av, dt, want) {
    const g = av && av.group, scene = g && g.parent, step = Math.max(0, Math.min(0.1, +dt || 0));
    if (st && (!scene || st.scene !== scene)) dispose();   // đổi cảnh (vào / ra nhà...) → dọn, dựng lại nếu vẫn đang cưỡi
    if (!st) { if (!want || !scene || !g.position) return; spawn(scene, g.position, g.rotation ? g.rotation.y : 0); }
    st.t += step; st.k = fadeStep(st.k, !!want, step); st.lift += ((want ? DOGS.lift : 0) - st.lift) * Math.min(1, 14 * step);
    if (!want && st.k <= 0) { dispose(); return; }
    const P = g.position, heading = g.rotation ? g.rotation.y : 0, ground = P.y - st.lift, k = st.k, t = st.t;
    for (const d of st.dogs) {
      const slot = DOGS.slots[d.i % DOGS.slots.length];
      const tgt = slotWorld(P, heading, [slot[0] + Math.sin(t * 1.3 + d.i * 1.7) * 0.35, slot[1] + Math.sin(t * 0.9 + d.i * 2.3) * 0.45]);
      const r = followStep(d.pos, tgt, step), dx = r.x - d.pos.x, dz = r.z - d.pos.z;
      d.pos.x = r.x; d.pos.z = r.z; d.speed += (r.speed - d.speed) * Math.min(1, step * 10);
      d.heading = turnToward(d.heading, d.speed > 0.8 ? Math.atan2(dx, dz) : heading, step, 9);
      d.phase += step * gaitRate(d.speed);
      const run = d.speed > DOGS.still ? Math.min(1, d.speed / 4) : 0;
      for (const l of d.legs) l.hip.rotation.x = Math.sin(d.phase + l.off) * 0.85 * run;
      d.body.position.y = Math.abs(Math.sin(d.phase)) * 0.045 * run;
      d.body.rotation.x = Math.sin(d.phase * 2) * 0.03 * run;
      d.head.rotation.x = Math.sin(d.phase * 2 + 0.8) * 0.06 * run;
      d.tail.rotation.y = Math.sin(t * 14 + d.i) * 0.55; d.tail.rotation.x = 0.9 - 0.3 * run;
      d.tongue.rotation.x = 0.2 + Math.sin(d.phase * 2) * 0.25 * run;
      for (const e of d.ears) e.ear.rotation.z = -e.s * (2.0 - 0.18 * run * (1 + Math.sin(d.phase * 2)));
      d.root.position.set(d.pos.x, ground + LEGH * DOGS.size, d.pos.z);
      d.root.rotation.set(0, d.heading, 0);
      d.root.scale.setScalar(DOGS.size * (0.7 + 0.3 * k));
      d.root.visible = k > 0.01;
      for (const m of d.mats) m.opacity = k;
      d.poof.position.set(d.pos.x, ground + 0.5, d.pos.z); d.pm.opacity = 0.6 * Math.sin(Math.PI * k);   // chớp sáng nhẹ lúc hiện ra / biến mất
    }
  }

  return { update, dispose, get alive() { return !!st; } };
}

/** Máy MÌNH: bật vòng cập nhật bầy chó một lần (gọi lại cũng chỉ trả bầy đã có). Không có trình duyệt (chạy test) thì không làm gì. */
export function startLocalDogs() {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return null;
  const LGT = window.LGT || (window.LGT = {});
  if (LGT.dogPack) return LGT.dogPack;
  const pack = createDogPack({ sound: true });
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    try {
      const av = LGT.world && LGT.world.avatar;
      const want = !!(av && LGT.board && LGT.board.on && LGT.loadout && LGT.loadout.hold === 'tre');   // đang cưỡi Gậy dạy chó
      pack.update(av, dt, want);
    } catch (_) { /* hiệu ứng chó lỗi không làm hỏng game */ }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  LGT.dogPack = pack;
  return pack;
}
