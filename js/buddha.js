// Tượng Phật ngồi thiền (thiền định ấn) bằng khối hình học: đài sen, thân áo cà sa, đầu tóc xoắn ốc, hào quang.
// Gốc tọa độ: tâm đáy đài sen, nhìn về +z. Cao khoảng 3,6 đơn vị (chưa nhân tỉ lệ).
import * as THREE from 'three';

const TAU = Math.PI * 2;

export function goldMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xe2b95c, roughness: 0.38, metalness: 0.6, emissive: 0x7a5410, emissiveIntensity: 0.95 });
}

// Thanh trụ nối hai điểm (tay, cánh tay)
function limb(a, b, r, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 10), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}

export function buildBuddha() {
  const g = new THREE.Group();
  const gold = goldMaterial();
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a2410, roughness: 0.8 });
  const lotusMat = new THREE.MeshStandardMaterial({ color: 0xd9a84e, roughness: 0.45, metalness: 0.5, emissive: 0x6a4410, emissiveIntensity: 0.8 });

  // --- Đài sen: đế tròn + hai lớp cánh sen
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, 0.28, 32), lotusMat); base.position.y = 0.14; g.add(base);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.22, 32), lotusMat); neck.position.y = 0.39; g.add(neck);
  const petalGeo = new THREE.SphereGeometry(0.34, 10, 8);
  const ring = (n, rad, y, sc, tilt) => {
    const im = new THREE.InstancedMesh(petalGeo, lotusMat, n), d = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      d.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad);
      d.rotation.set(0, -a, 0); d.rotateZ(tilt);
      d.scale.set(sc[0], sc[1], sc[2]); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
    }
    im.instanceMatrix.needsUpdate = true; return im;
  };
  g.add(ring(18, 1.5, 0.48, [0.62, 1.1, 0.3], -0.55));   // lớp cánh ngoài
  g.add(ring(14, 1.18, 0.78, [0.55, 1.0, 0.28], -0.35)); // lớp cánh trong
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.16, 28), lotusMat); seat.position.y = 0.88; g.add(seat);

  // --- Hai chân xếp bằng (kiết già): ellipsoid rộng
  const legs = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), gold);
  legs.scale.set(1.5, 0.34, 0.98); legs.position.set(0, 1.12, 0.05); g.add(legs);
  for (const s of [-1, 1]) {                                         // đầu gối
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), gold);
    k.scale.set(1.2, 0.8, 1); k.position.set(s * 1.28, 1.1, 0.35); g.add(k);
  }

  // --- Thân áo cà sa: Lathe + dẹt theo chiều sâu
  const prof = [[0.0, 1.1], [0.95, 1.2], [0.9, 1.5], [0.76, 1.95], [0.7, 2.4], [0.5, 2.7], [0.22, 2.84], [0.0, 2.86]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), gold);
  torso.scale.set(1, 1, 0.72); g.add(torso);
  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 8, 28), lotusMat);   // dải áo ngang bụng
  sash.rotation.x = Math.PI / 2; sash.scale.set(1, 0.74, 1); sash.position.y = 1.62; g.add(sash);
  const fold = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 8, 24, Math.PI * 0.9), lotusMat); // nếp áo vắt chéo vai
  fold.rotation.set(0.2, 0, 2.4); fold.position.set(0, 2.2, 0.45); g.add(fold);

  // --- Tay: vai → khuỷu → hai tay đặt trên lòng (thiền định ấn)
  for (const s of [-1, 1]) {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), gold); sh.position.set(s * 0.72, 2.35, 0.02); g.add(sh);
    g.add(limb([s * 0.72, 2.35, 0.02], [s * 1.0, 1.55, 0.3], 0.19, gold));
    g.add(limb([s * 1.0, 1.55, 0.3], [s * 0.2, 1.3, 0.78], 0.16, gold));
  }
  const hands = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), gold); hands.scale.set(1.1, 0.5, 0.75); hands.position.set(0, 1.28, 0.8); g.add(hands);
  const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), gold); thumb.position.set(0, 1.42, 0.98); g.add(thumb);

  // --- Cổ + đầu
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.3, 14), gold); nk.position.y = 2.95; g.add(nk);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 18), gold); head.scale.set(0.92, 1.1, 0.95); head.position.y = 3.35; g.add(head);
  const usn = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), gold); usn.position.y = 3.85; g.add(usn);          // nhục kế
  const jewel = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 8), lotusMat); jewel.position.y = 4.08; g.add(jewel);
  // Tóc xoắn ốc: các hạt nhỏ phủ nửa trên đầu
  const curlGeo = new THREE.SphereGeometry(0.058, 6, 5), curls = [], rc = new THREE.Vector3();
  for (let i = 0; i < 150; i++) {
    const u = (i * 0.61803398875) % 1, v = (i / 150);
    const th = u * TAU, ph = Math.acos(1 - v * 0.95);           // ph nhỏ = gần đỉnh
    rc.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
    if (rc.y < 0.12) continue;
    if (rc.z > 0.45 && rc.y < 0.6) continue;                       // chừa trán
    curls.push(rc.clone());
  }
  const hair = new THREE.InstancedMesh(curlGeo, dark, curls.length), dm = new THREE.Object3D();
  curls.forEach((c, i) => {
    const onUsn = c.y > 0.82;
    const R = onUsn ? 0.27 : 0.5, cy = onUsn ? 3.85 : 3.35, sy = onUsn ? 1 : 1.1;
    dm.position.set(c.x * R * 0.95, cy + c.y * R * sy, c.z * R * 0.97); dm.rotation.set(0, 0, 0); dm.scale.setScalar(1); dm.updateMatrix(); hair.setMatrixAt(i, dm.matrix);
  });
  hair.instanceMatrix.needsUpdate = true; g.add(hair);
  // Mặt: mắt khép, mũi, miệng, bạch hào, tai dài
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 5, 10, Math.PI), dark);
    eye.rotation.z = Math.PI; eye.position.set(s * 0.17, 3.37, 0.42); g.add(eye);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), gold); ear.scale.set(0.6, 2.4, 0.6); ear.position.set(s * 0.46, 3.18, 0.02); g.add(ear);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), gold); nose.rotation.x = Math.PI / 2; nose.position.set(0, 3.27, 0.5); g.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 5, 10, Math.PI), dark); mouth.position.set(0, 3.12, 0.44); g.add(mouth);
  const urna = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), lotusMat); urna.position.set(0, 3.52, 0.46); g.add(urna);

  // --- Hào quang: vòng đôi + đĩa sáng mờ + tia
  const halo = new THREE.Group(); halo.position.set(0, 3.2, -0.5);
  const hr1 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.07, 8, 56), lotusMat); halo.add(hr1);
  const hr2 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.05, 8, 56), lotusMat); halo.add(hr2);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.3, 40), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }));
  disc.position.z = -0.03; halo.add(disc);
  const rayGeo = new THREE.ConeGeometry(0.07, 0.42, 5);
  const rays = new THREE.InstancedMesh(rayGeo, lotusMat, 28), rd = new THREE.Object3D();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU;
    rd.position.set(Math.cos(a) * 1.93, Math.sin(a) * 1.93, 0); rd.rotation.set(0, 0, a - Math.PI / 2); rd.updateMatrix(); rays.setMatrixAt(i, rd.matrix);
  }
  rays.instanceMatrix.needsUpdate = true; halo.add(rays);
  g.add(halo);
  return g;
}
