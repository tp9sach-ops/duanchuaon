// Thân nhân vật chibi từ file GLB (Phiên 99): nạp mô hình, chuẩn hóa (cao 1,5 m, chân ở y = 0, nhìn +z), tính trọng số xương + vùng màu, rồi dựng SkinnedMesh có bộ xương cho từng nhân vật.
// Logic xương/vùng màu THUẦN nằm ở js/world/chibiRig.js (có test). File này chỉ lo three.js. Lỗi nạp thì chibiReady() = false và avatar.js giữ nhân vật dựng bằng khối (không bao giờ hỏng game).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CHIBI_H, LM, BONES, skinOf, zoneOf } from '../world/chibiRig.js';

export const CHIBI_GLB = { low: 'assets/models/chibi/chibi-low.glb', mid: 'assets/models/chibi/chibi-mid.glb' };   // low: 700 đỉnh (mặc định, nhẹ cho đa người); mid: 7.000 đỉnh
export const ZONES = ['skin', 'shirt', 'sleeve', 'pants', 'shoe'];
let tpl = null, pending = null;
export const chibiReady = () => !!tpl;
export const chibiTemplate = () => tpl;

/** Chuẩn hóa một BufferGeometry (đã ở hệ tọa độ vật, Y lên, mặt +z) thành bản mẫu: không chỉ mục (tô phẳng từng tam giác), cao CHIBI_H, + skinIndex/skinWeight/zone + số đo đầu/thân. Xuất ra để test bằng node. */
export function prepareChibi(src) {
  const g = src.index ? src.toNonIndexed() : src.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
  g.computeBoundingBox();
  const bb = g.boundingBox, H = bb.max.y - bb.min.y, s = CHIBI_H / H, pos = g.attributes.position, n = pos.count;
  let zs = 0, zn = 0;
  for (let i = 0; i < n; i++) if ((pos.getY(i) - bb.min.y) / H < 0.2) { zs += pos.getZ(i); zn++; }
  const cx = (bb.min.x + bb.max.x) / 2, cz = zn ? zs / zn : 0;
  for (let i = 0; i < n; i++) pos.setXYZ(i, (pos.getX(i) - cx) * s, (pos.getY(i) - bb.min.y) * s, (pos.getZ(i) - cz) * s);
  pos.needsUpdate = true; g.computeVertexNormals();
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), zone = new Uint8Array(n);
  const head = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 }, torso = { zf: -1e9, zb: 1e9 };
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nx = x / CHIBI_H, ny = y / CHIBI_H, k = skinOf(nx, ny);
    for (let j = 0; j < 4; j++) { si[i * 4 + j] = k.idx[j]; sw[i * 4 + j] = k.w[j]; }
    if (ny > 0.53) { head.x0 = Math.min(head.x0, x); head.x1 = Math.max(head.x1, x); head.y0 = Math.min(head.y0, y); head.y1 = Math.max(head.y1, y); head.z0 = Math.min(head.z0, z); head.z1 = Math.max(head.z1, z); }
    if (ny > 0.3 && ny < 0.42 && Math.abs(nx) < 0.1) { torso.zf = Math.max(torso.zf, z); torso.zb = Math.min(torso.zb, z); }
  }
  for (let t = 0; t < n; t += 3) {
    const cxn = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3 / CHIBI_H, cyn = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3 / CHIBI_H;
    zone[t] = zone[t + 1] = zone[t + 2] = ZONES.indexOf(zoneOf(cxn, cyn));
  }
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.computeBoundingSphere();
  const hd = { cx: (head.x0 + head.x1) / 2, cy: (head.y0 + head.y1) / 2, cz: (head.z0 + head.z1) / 2, rx: (head.x1 - head.x0) / 2, ry: (head.y1 - head.y0) / 2, rz: (head.z1 - head.z0) / 2 };
  return { geo: g, zone, head: hd, torso, verts: n };
}

/** Bắt đầu nạp mô hình (một lần). Trả Promise<boolean>. ?chibi=off tắt (giữ nhân vật dựng bằng khối), ?chibi=mid dùng mô hình 7.000 đỉnh. */
export function loadChibi(kind) {
  if (pending) return pending;
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('chibi') : null;
  if (q === 'off') return (pending = Promise.resolve(false));
  const url = CHIBI_GLB[kind || (q === 'mid' ? 'mid' : 'low')];
  pending = new Promise((resolve) => {
    try {
      new GLTFLoader().load(new URL('../../' + url, import.meta.url).href, (gltf) => {
        try {
          let mesh = null; gltf.scene.updateMatrixWorld(true); gltf.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
          if (!mesh) throw new Error('GLB không có lưới');
          const g = mesh.geometry.clone(); g.applyMatrix4(mesh.matrixWorld); tpl = prepareChibi(g); resolve(true);
        } catch (err) { console.warn('[Diệu Giang Tự] Không xử lý được mô hình nhân vật:', err); resolve(false); }
      }, undefined, (err) => { console.warn('[Diệu Giang Tự] Chưa nạp được mô hình nhân vật:', err && err.message ? err.message : err); resolve(false); });
    } catch (err) { console.warn('[Diệu Giang Tự] Không nạp được mô hình nhân vật:', err); resolve(false); }
  });
  return pending;
}

/** Dựng thân có xương cho một nhân vật. palette = { skin, shirt, sleeve, pants, shoe } (số hex). Trả { mesh, bones, skeleton, head, torso, dispose }. */
export function buildChibi(palette, t = tpl) {
  if (!t) return null;
  const g = t.geo.clone(), n = t.verts, col = new Float32Array(n * 3), cc = ZONES.map((z) => new THREE.Color(palette[z] ?? 0xffffff));
  for (let i = 0; i < n; i++) { const c = cc[t.zone[i]]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.68, metalness: 0 });
  const H = CHIBI_H, b = {}; for (const nm of BONES) { b[nm] = new THREE.Bone(); b[nm].name = nm; }
  b.hips.position.set(0, LM.crotch * H, 0); b.hips.add(b.spine, b.legL, b.legR);
  b.head.position.set(0, (LM.neck - LM.crotch) * H, 0); b.spine.add(b.head, b.armL, b.armR);
  b.armL.position.set(LM.shoulderX * H, (LM.shoulderY - LM.crotch) * H, 0); b.armR.position.set(-LM.shoulderX * H, (LM.shoulderY - LM.crotch) * H, 0);
  b.legL.position.set(LM.legX * H, 0, 0); b.legR.position.set(-LM.legX * H, 0, 0);
  const mesh = new THREE.SkinnedMesh(g, mat); mesh.add(b.hips); mesh.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(BONES.map((nm) => b[nm])); mesh.bind(skeleton);
  mesh.frustumCulled = false;   // hộp bao tính theo thế T; tay giơ/ngả vẫn nằm trong nhưng thôi khỏi cắt nhầm khi lăn trên vai
  mesh.castShadow = true;
  return { mesh, bones: b, skeleton, head: t.head, torso: t.torso, dispose() { g.dispose(); mat.dispose(); skeleton.dispose(); } };
}

/** Đặt tư thế (kết quả chibiPose) lên xương. */
export function applyChibiPose(bones, pose) {
  bones.hips.position.y = LM.crotch * CHIBI_H - pose.hipsDrop;
  bones.spine.rotation.set(pose.spine.x, pose.spine.y, pose.spine.z); bones.head.rotation.set(pose.head.x, 0, 0);
  for (const k of ['armL', 'armR', 'legL', 'legR']) bones[k].rotation.set(pose[k].x, pose[k].y, pose[k].z);
}
