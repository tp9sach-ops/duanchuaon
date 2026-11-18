// ĐẬP CHỔI + GIÓ (Phiên 230, mục 2): cầm Chổi đánh thường — mỗi đòn có LUỒNG GIÓ NHẸ thổi lên từ phía sau người đánh; đòn THỨ 3 có chiếc CHỔI KHỔNG LỒ giơ lên rồi ĐẬP xuống phía trước, LÁ / CÁT / ĐÁ tung lên rồi rơi lại.
// Chuyển động + quỹ đạo: js/world/broomMath.js (có test). Đây chỉ là hình khối + vẽ (khối đơn giản của three.js; chổi dùng lại js/ui/broomMesh.js). CHƯA nhìn bằng mắt trên máy thật — kích thước là số TẠM.
// remote = true (của NGƯỜI KHÁC): không phát lại ra mạng. Của MÌNH (remote = false) tự phát qua LGT.combatLink.sendBroom để mọi người cùng thấy (như sói Gậy dạy chó). Sát thương KHÔNG ở đây (đòn 3 đã ×1,5 + lan trong chuỗi đánh thường).
import * as THREE from 'three';
import { BROOM, IMPACT_T, slamPose, debrisPlan, debrisAt, windAt } from '../world/broomMath.js';
import { buildBroom, loadBroomGlb, dustTexture } from './broomMesh.js';

const COL = { la: [0x6f9a2e, 0x9bb83c, 0xc9a227, 0x8a5a1c], cat: [0xd9c28a], da: [0x7a7468, 0x5e5a52] };
let G = null;
const geos = () => G || (G = { leaf: new THREE.PlaneGeometry(1, 0.6), sand: new THREE.SphereGeometry(1, 6, 5), stone: new THREE.DodecahedronGeometry(1, 0) });

function makeSlam(scene, pos, heading, range, seed, remote) {
  const g = geos(), root = new THREE.Group(), broom = buildBroom(); loadBroomGlb(broom);
  broom.scale.setScalar(1.6); const arm = new THREE.Group(); arm.add(broom); broom.rotation.x = Math.PI; broom.position.y = 1.2; root.add(arm);   // đầu rơm hướng xuống, cán lên trời
  const px = pos.x + Math.sin(heading) * range, pz = pos.z + Math.cos(heading) * range;
  root.position.set(px, pos.y, pz); root.rotation.y = heading; scene.add(root);
  const parts = debrisPlan(seed).map((d, i) => {
    const mat = new THREE.MeshStandardMaterial({ color: COL[d.kind][i % COL[d.kind].length], roughness: 0.95, transparent: true, opacity: 1, side: THREE.DoubleSide });
    const m = new THREE.Mesh(d.kind === 'la' ? g.leaf : d.kind === 'cat' ? g.sand : g.stone, mat); m.scale.setScalar(d.size); m.visible = false; scene.add(m); return { d, m };
  });
  return { scene, root, arm, broom, parts, x: px, y: pos.y, z: pz, t: 0, hit: false, remote, mat: null };
}
function disposeSlam(s) {
  s.scene.remove(s.root);   // hình chổi nhân bản dùng chung với chổi cầm tay → không hủy
  for (const p of s.parts) { s.scene.remove(p.m); p.m.material.dispose(); }
}

function makeWind(scene, pos, heading) {
  const sprites = [];
  for (let i = 0; i < BROOM.windCount; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTexture(), transparent: true, opacity: 0, depthWrite: false, fog: false })); sp.scale.set(0.9, 0.5, 1); scene.add(sp); sprites.push(sp); }
  return { scene, sprites, pos: { x: pos.x, y: pos.y, z: pos.z }, heading, t: 0 };
}
function disposeWind(w) { for (const sp of w.sprites) { w.scene.remove(sp); sp.material.dispose(); } }

export function createBroomFx(scene, { max = BROOM.max } = {}) {
  const slams = [], winds = []; let seedN = 1;
  return {
    get count() { return slams.length; },
    get scene() { return scene; },
    /** Cú đập chổi (đòn 3). seed: người khác dùng đúng seed của người đánh để mảnh bay GIỐNG nhau (không có thì tự đếm). */
    spawn(pos, heading = 0, range = BROOM.rangeAir, remote = false, seed = 0) {
      if (!scene || !pos || slams.length >= max) return false;
      const h = Number.isFinite(+heading) ? +heading : 0, r = Number.isFinite(+range) && +range > 0 ? +range : BROOM.rangeAir, sd = seed > 0 ? seed : (seedN = (seedN % 997) + 1);
      slams.push(makeSlam(scene, pos, h, r, sd, remote));
      if (!remote) { try { const L = globalThis.LGT; if (L && L.combatLink && L.combatLink.sendBroom) L.combatLink.sendBroom(h, r); } catch (_) { /* phát lỗi không làm hỏng hiệu ứng của mình */ } }
      return true;
    },
    /** Gió nhẹ thổi lên từ phía sau người đánh (mỗi đòn). */
    wind(pos, heading = 0) { if (!scene || !pos || winds.length >= 4) return false; winds.push(makeWind(scene, pos, Number.isFinite(+heading) ? +heading : 0)); return true; },
    update(dt) {
      if (!slams.length && !winds.length) return;
      const step = Math.max(0, Math.min(0.1, +dt || 0));
      for (let i = slams.length - 1; i >= 0; i--) {
        const s = slams[i]; s.t += step; const p = slamPose(s.t);
        if (p.done) { disposeSlam(s); slams.splice(i, 1); continue; }
        s.arm.position.y = p.lift; s.arm.rotation.x = p.tilt; s.broom.scale.setScalar(1.6 * p.grow);
        s.root.traverse((o) => { if (o.material && o.material.transparent !== undefined && o.isMesh) { o.material.transparent = true; o.material.opacity = p.fade; } });
        if (s.t >= IMPACT_T) {
          const u = s.t - IMPACT_T;
          for (const q of s.parts) {
            const a = debrisAt(q.d, u); q.m.visible = true; q.m.position.set(s.x + Math.cos(q.d.ang) * a.r, s.y + 0.1 + a.y, s.z + Math.sin(q.d.ang) * a.r);
            if (!a.landed) q.m.rotation.set(q.d.spin * u, q.d.spin * u * 0.7, 0);
            q.m.material.opacity = Math.max(0, Math.min(1, (BROOM.life - s.t) / 0.4));
          }
        }
      }
      for (let i = winds.length - 1; i >= 0; i--) {
        const w = winds[i]; w.t += step; let allDone = true;
        w.sprites.forEach((sp, k) => {
          const a = windAt(k, w.t); if (!a.done) allDone = false;
          const sx = Math.cos(w.heading), sz = -Math.sin(w.heading), bx = -Math.sin(w.heading), bz = -Math.cos(w.heading);   // phải / sau lưng người đánh
          sp.position.set(w.pos.x + bx * a.back + sx * a.side, w.pos.y + a.y, w.pos.z + bz * a.back + sz * a.side); sp.material.opacity = Math.max(0, a.a);
        });
        if (allDone) { disposeWind(w); winds.splice(i, 1); }
      }
    },
    clear() { while (slams.length) disposeSlam(slams.pop()); while (winds.length) disposeWind(winds.pop()); },
  };
}
