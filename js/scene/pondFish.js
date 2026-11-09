// Cá 3D trong ao cá riêng = Hồ Rừng (Phiên 77). CHỈ VẼ: đường bơi + kiểu dáng ở js/world/pondFish.js (có test). Đọc LGT.fishing.state.pond (cá người chơi đã "Thu cá"); chỉ máy mình thấy.
import * as THREE from 'three';
import { fishLook, fishPose, shownFish } from '../world/pondFish.js';

const mats = new Map();
const mat = (c) => { let m = mats.get(c); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }); mats.set(c, m); } return m; };

/** Một con: thân (cầu dẹt) + đuôi/chi theo loài. Mũi quay về +z. Trả { g, tail }. */
function makeFish(look) {
  const g = new THREE.Group(), L = look.len; let tail = null;
  if (look.shape === 'rua' || look.shape === 'baba') {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), mat(look.c1)); shell.scale.set(L * 0.55, L * 0.22, L * 0.72); g.add(shell);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), mat(look.c2)); head.scale.set(L * 0.2, L * 0.17, L * 0.28); head.position.set(0, 0, L * 0.5); g.add(head);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), mat(look.c2)); f.scale.set(L * 0.28, L * 0.07, L * 0.14); f.position.set(sx * L * 0.34, -L * 0.04, sz * L * 0.22); g.add(f); }
  } else if (look.shape === 'muc') {
    const body = new THREE.Mesh(new THREE.ConeGeometry(L * 0.2, L * 0.9, 8), mat(look.c1)); body.rotation.x = -Math.PI / 2; body.position.z = -L * 0.1; g.add(body);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), mat(look.c2)); fin.scale.set(L * 0.5, L * 0.04, L * 0.3); fin.position.z = -L * 0.4; g.add(fin);
    tail = new THREE.Group(); tail.position.z = L * 0.38; for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.02, L * 0.035, L * 0.4, 5), mat(look.c2)); t.rotation.x = Math.PI / 2; t.position.set((i - 1.5) * L * 0.05, 0, L * 0.2); tail.add(t); } g.add(tail);
  } else {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat(look.c1)); body.scale.set(L * 0.28, L * 0.3, L); g.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), mat(look.c2)); belly.scale.set(L * 0.22, L * 0.16, L * 0.8); belly.position.y = -L * 0.05; g.add(belly);
    tail = new THREE.Group(); tail.position.z = -L * 0.5; const tf = new THREE.Mesh(new THREE.ConeGeometry(L * 0.18, L * 0.38, 4), mat(look.c2)); tf.rotation.x = -Math.PI / 2; tf.position.z = -L * 0.19; tail.add(tf); g.add(tail);
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(L * 0.06, L * 0.2, 4), mat(look.c1)); dorsal.position.set(0, L * 0.18, -L * 0.05); g.add(dorsal);
  }
  return { g, tail };
}

/** Trả { group, update(t) }. Dựng lại đàn cá khi danh sách cá trong ao đổi (so theo uid:loài:cỡ); mỗi khung chỉ cập nhật vị trí. */
export function buildPondFish(LGT, { reduce = false } = {}) {
  const group = new THREE.Group(); group.name = 'ca-ao-rieng'; let sig = '', fish = [], clock = 0;
  function rebuild(list) {
    for (const f of fish) group.remove(f.obj.g); fish = [];
    for (const f of list) { const look = fishLook(f.sp, f.lon === true), obj = makeFish(look); group.add(obj.g); fish.push({ f, obj }); }
  }
  return {
    group,
    update(t) {
      const st = LGT && LGT.fishing && LGT.fishing.state, list = shownFish(st && st.pond), s = list.map((f) => `${f.uid}:${f.sp}:${f.lon ? 1 : 0}`).join(',');
      if (s !== sig) { sig = s; rebuild(list); }
      group.visible = fish.length > 0; if (!group.visible) return;
      const tt = reduce ? 0 : t, nowT = reduce ? 0 : t; clock = nowT;
      for (const { f, obj } of fish) { const p = fishPose(f, tt); obj.g.position.set(p.x, p.y, p.z); obj.g.rotation.y = p.ry; if (obj.tail) obj.tail.rotation.y = p.tail * 0.45; }
    },
  };
}
