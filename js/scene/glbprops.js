// Cây GLB (Phiên 14f, Bước 3): rải theo glbTrees() của js/world/landscape.js bằng InstancedMesh (mỗi loại cây × mỗi vật liệu = 1 lần vẽ).
// File GLB trong assets/models/trees/ đã được xử lý sẵn: sau khi áp ma trận node của mesh (chỉ co/dịch do nén toạ độ), cây cao đúng 1 đơn vị, gốc ở (0,0,0).
// Nạp nền, không chặn màn hình chờ. Cây nào nạp lỗi thì KHÔNG đăng ký va chạm (không có vật cản vô hình).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { TREE_MODELS, glbTrees, registerGlbTrees } from '../world/landscape.js';

export const TREE_URL = (id) => `assets/models/trees/${id}.glb`;

/** Trả { group, ready }. group có ngay (rỗng); cây hiện dần khi từng loại nạp xong. ready = Promise (số loại cây nạp được). */
export function buildGlbTrees(list = glbTrees(90)) {
  const group = new THREE.Group(); group.name = 'glb-trees';
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const hOf = Object.fromEntries(TREE_MODELS.map((m) => [m.id, m.h]));
  const m4 = new THREE.Matrix4(), place = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  const jobs = TREE_MODELS.map((m) => new Promise((resolve) => {
    const mine = list.filter((t) => t.model === m.id);
    if (!mine.length) return resolve(0);
    loader.load(TREE_URL(m.id), (gltf) => {
      try {
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          const im = new THREE.InstancedMesh(o.geometry, o.material, mine.length);
          // o.matrixWorld bù phép nén toạ độ (quantize) lưu ở node của mesh
          mine.forEach((t, i) => { const h = hOf[t.model] * t.s; q.setFromAxisAngle(up, t.ry); pos.set(t.x, 0, t.z); sc.set(h, h, h); place.compose(pos, q, sc); im.setMatrixAt(i, m4.multiplyMatrices(place, o.matrixWorld)); });
          im.instanceMatrix.needsUpdate = true;
          im.castShadow = !o.material.transparent; im.receiveShadow = true; im.name = 'tree-' + m.id;
          group.add(im);
        });
        registerGlbTrees(mine);   // chỉ cây đã dựng mới có va chạm
        resolve(1);
      } catch (e) { console.warn('[Diệu Giang Tự] Không dựng được cây', m.id, e); resolve(0); }
    }, undefined, (err) => { console.warn('[Diệu Giang Tự] Chưa nạp được cây', m.id, err && err.message ? err.message : err); resolve(0); });
  }));
  return { group, ready: Promise.all(jobs).then((a) => a.reduce((x, y) => x + y, 0)) };
}
