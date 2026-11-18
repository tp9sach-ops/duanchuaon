// ĐẬP CHỔI + GIÓ (Phiên 230, mục 2): cầm Chổi đánh thường — mỗi đòn có LUỒNG GIÓ NHẸ thổi lên từ phía sau người đánh; đòn THỨ 3 có chiếc CHỔI KHỔNG LỒ giơ lên rồi ĐẬP xuống phía trước, LÁ / CÁT / ĐÁ tung lên rồi rơi lại.
// Chuyển động + quỹ đạo: js/world/broomMath.js (có test). Đây chỉ là hình khối + vẽ (khối đơn giản của three.js; chổi dùng lại js/ui/broomMesh.js). CHƯA nhìn bằng mắt trên máy thật — kích thước là số TẠM.
// remote = true (của NGƯỜI KHÁC): không phát lại ra mạng. Của MÌNH (remote = false) tự phát qua LGT.combatLink.sendBroom để mọi người cùng thấy (như sói Gậy dạy chó). Sát thương KHÔNG ở đây (đòn 3 đã ×1,5 + lan trong chuỗi đánh thường).
import * as THREE from 'three';
import { BROOM, IMPACT_T, slamPose, debrisPlan, debrisAt, windAt } from '../world/broomMath.js';
import { buildBroom, loadBroomGlb, dustTexture } from './broomMesh.js';
import { TORN, tornadoPlan, tornadoOrigin, tornadoAt } from '../world/tornadoMath.js';
import { makeTornadoMesh, poseTornado, disposeTornadoMesh } from './tornadoFx.js';

const BROOM_HALF = 0.75;   // nửa chiều dài chổi chuẩn hóa (broomMesh.BROOM_LEN = 1,5): đầu rơm ở -y
const COL = { la: [0x6f9a2e, 0x9bb83c, 0xc9a227, 0x8a5a1c], cat: [0xd9c28a], da: [0x7a7468, 0x5e5a52] };
let G = null;
const geos = () => G || (G = { leaf: new THREE.PlaneGeometry(1, 0.6), sand: new THREE.SphereGeometry(1, 6, 5), stone: new THREE.DodecahedronGeometry(1, 0) });

function makeSlam(scene, pos, heading, range, seed, remote) {
  const g = geos(), root = new THREE.Group(), broom = buildBroom(); loadBroomGlb(broom);
  broom.scale.setScalar(1.6); const arm = new THREE.Group(); arm.add(broom); root.add(arm);   // Phiên 234: GLB + chổi khối đều có đầu rơm ở -y → KHÔNG lật (trước đây xoay π làm CÁN chổi đập xuống); đặt chổi cho ĐẦU rơm nằm đúng gốc `arm`, mỗi khung hình trong update()
  const px = pos.x + Math.sin(heading) * range, pz = pos.z + Math.cos(heading) * range;
  root.position.set(px, pos.y, pz); root.rotation.y = heading; scene.add(root);
  const parts = debrisPlan(seed).map((d, i) => {
    const mat = new THREE.MeshStandardMaterial({ color: COL[d.kind][i % COL[d.kind].length], roughness: 0.95, transparent: true, opacity: 1, side: THREE.DoubleSide });
    const m = new THREE.Mesh(d.kind === 'la' ? g.leaf : d.kind === 'cat' ? g.sand : g.stone, mat); m.scale.setScalar(d.size); m.visible = false; scene.add(m); return { d, m };
  });
  return { scene, root, arm, broom, parts, x: px, y: pos.y, z: pz, t: 0, hit: false, remote, mat: null, mats: [] };
}
// Phiên 233 (sửa chổi bị mờ): root.clone(true) của mô hình GLB DÙNG CHUNG chất liệu với chổi cầm tay / chổi cưỡi. Trước đây cú đập hạ opacity ngay trên chất liệu dùng chung đó
// → sau đòn 3 cây chổi cầm tay bị mờ (thậm chí tàng hình). Giờ mỗi cú đập CLONE chất liệu riêng cho chổi khổng lồ (làm lười, vì GLB nạp bất đồng bộ) rồi chỉ chỉnh bản riêng.
function ownMaterials(s) {
  s.arm.traverse((o) => {
    if (!o.isMesh || !o.material || o.userData.ownMat) return;
    const own = (m) => { const c = m.clone(); c.transparent = true; s.mats.push(c); return c; };
    o.material = Array.isArray(o.material) ? o.material.map(own) : own(o.material); o.userData.ownMat = true;
  });
}
function disposeSlam(s) {
  s.scene.remove(s.root);   // hình khối dùng chung với chổi cầm tay → không hủy; chỉ hủy chất liệu RIÊNG (clone) của cú đập
  for (const m of s.mats) m.dispose();
  for (const sp of s.broom.userData.halo || []) sp.material.dispose();   // Phiên 234: quầng sáng có chất liệu riêng
  for (const p of s.parts) { s.scene.remove(p.m); p.m.material.dispose(); }
}

function makeWind(scene, pos, heading) {
  const sprites = [];
  for (let i = 0; i < BROOM.windCount; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTexture(), transparent: true, opacity: 0, depthWrite: false, fog: false })); sp.scale.set(0.9, 0.5, 1); scene.add(sp); sprites.push(sp); }
  return { scene, sprites, pos: { x: pos.x, y: pos.y, z: pos.z }, heading, t: 0 };
}
function disposeWind(w) { for (const sp of w.sprites) { w.scene.remove(sp); sp.material.dispose(); } }

// Phiên 234: onTornadoHit(tn, pt, t, rec) → { n, pts } — CHỈ máy của người đánh truyền vào (js/ui/items.js) để cơn lốc làm quái mất máu; người khác không truyền → lốc chỉ để xem.
export function createBroomFx(scene, { max = BROOM.max, onTornadoHit = null } = {}) {
  const slams = [], winds = [], torns = []; let seedN = 1;
  function launchTornadoes(w, pos, heading, range, remote) {
    for (const tn of tornadoPlan(w, heading)) {
      if (torns.length >= TORN.maxLive) break;
      const o = tornadoOrigin(tn, pos, heading, range);
      torns.push({ tn, mesh: makeTornadoMesh(scene, tn.kind === 'big'), ox: o.x, oz: o.z, oy: pos.y, t: -tn.delay, rec: new Map(), remote });
    }
  }
  return {
    get count() { return slams.length; },
    get tornadoes() { return torns.length; },
    get scene() { return scene; },
    /** Cú đập chổi (đòn 3). seed: người khác dùng đúng seed của người đánh để mảnh bay GIỐNG nhau (không có thì tự đếm). */
    spawn(pos, heading = 0, range = BROOM.rangeAir, remote = false, seed = 0, w = 0) {
      if (!scene || !pos) return false;
      const h = Number.isFinite(+heading) ? +heading : 0, r = Number.isFinite(+range) && +range > 0 ? +range : BROOM.rangeAir, sd = seed > 0 ? seed : (seedN = (seedN % 997) + 1), wk = Math.max(0, Math.min(2, Math.floor(+w) || 0));
      let ok = false;
      if (slams.length < max) { slams.push(makeSlam(scene, pos, h, r, sd, remote)); ok = true; }
      if (wk > 0) launchTornadoes(wk, pos, h, r, remote);   // Phiên 234: đòn 3 = 3 lốc nhỏ; đòn 9 = thêm lốc to từ sau lưng
      if (ok && !remote) { try { const L = globalThis.LGT; if (L && L.combatLink && L.combatLink.sendBroom) L.combatLink.sendBroom(h, r, wk); } catch (_) { /* phát lỗi không làm hỏng hiệu ứng của mình */ } }
      return ok || wk > 0;
    },
    /** Gió nhẹ thổi lên từ phía sau người đánh (mỗi đòn). */
    wind(pos, heading = 0) { if (!scene || !pos || winds.length >= 4) return false; winds.push(makeWind(scene, pos, Number.isFinite(+heading) ? +heading : 0)); return true; },
    update(dt) {
      if (!slams.length && !winds.length && !torns.length) return;
      const step = Math.max(0, Math.min(0.1, +dt || 0));
      for (let i = slams.length - 1; i >= 0; i--) {
        const s = slams[i]; s.t += step; const p = slamPose(s.t);
        if (p.done) { disposeSlam(s); slams.splice(i, 1); continue; }
        s.arm.position.y = p.lift; s.arm.rotation.x = p.tilt; s.broom.scale.setScalar(1.6 * p.grow); s.broom.position.y = BROOM_HALF * 1.6 * p.grow - 0.05; for (const sp of s.broom.userData.halo || []) sp.material.opacity = 0.6 * p.fade;   // Phiên 234: quầng sáng mờ theo chổi   // Phiên 234: đáy ĐẦU rơm chạm đúng điểm đập (lún 5 cm), cán chổi chổng lên trời
        ownMaterials(s); for (const m of s.mats) m.opacity = p.fade;   // chỉ chỉnh chất liệu RIÊNG của chổi khổng lồ, KHÔNG đụng chất liệu dùng chung
        if (s.t >= IMPACT_T) {
          const u = s.t - IMPACT_T;
          for (const q of s.parts) {
            const a = debrisAt(q.d, u); q.m.visible = true; q.m.position.set(s.x + Math.cos(q.d.ang) * a.r, s.y + 0.1 + a.y, s.z + Math.sin(q.d.ang) * a.r);
            if (!a.landed) q.m.rotation.set(q.d.spin * u, q.d.spin * u * 0.7, 0);
            q.m.material.opacity = Math.max(0, Math.min(1, (BROOM.life - s.t) / 0.4));
          }
        }
      }
      for (let i = torns.length - 1; i >= 0; i--) {   // Phiên 234: cơn lốc — đi thẳng theo hướng, nở dần, tan; của MÌNH (không remote) thì quét trúng quái là trừ máu
        const q = torns[i]; q.t += step;
        if (q.t < 0) continue;
        const a = tornadoAt(q.tn, q.t);
        if (a.done) { disposeTornadoMesh(scene, q.mesh); torns.splice(i, 1); continue; }
        const at = { x: q.ox + a.x, y: q.oy, z: q.oz + a.z }; poseTornado(q.mesh, a, at, q.t);
        if (!q.remote && onTornadoHit && a.a > 0.5) { try { onTornadoHit(q.tn, at, q.t, q.rec); } catch (_) { /* sát thương lỗi không làm hỏng hiệu ứng */ } }
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
    clear() { while (torns.length) disposeTornadoMesh(scene, torns.pop().mesh); while (slams.length) disposeSlam(slams.pop()); while (winds.length) disposeWind(winds.pop()); },
  };
}
