// Cây CHỔI 3D (Phiên 230, mục 2; id nội bộ 'choi'; Điện Máy Lam Sen, 50 lá bồ đề): dùng chung cho cầm tay (js/ui/items.js, js/ui/bag.js) và cưỡi bay (js/ui/board.js, js/ui/remoteGear.js). Cùng giao diện với js/ui/bambooMesh.js (build / load / pulse) để js/ui/weaponKit.js gom chung.
// - buildBroom(): chổi khối (cán gỗ, nút buộc đỏ, chụm rơm hình nón ở đầu -y). Dài BROOM_LEN m, trục y, gốc ở giữa. Dùng tạm khi GLB chưa nạp xong / lỗi.
// - loadBroomGlb(g): nạp mô hình nhúng base64 (js/data/broomGlb.js, ~760 KB) bằng import() ĐỘNG — người không dính tới chổi không tải thêm 760 KB; giải mã MỘT lần rồi nhân bản. Lỗi thì giữ chổi khối.
// - pulseBroom(g, t, hot): KHÔNG có ánh sáng chớp (chổi là đồ thường); hot (đang đánh / bay) thì đầu chổi đưa qua đưa lại nhẹ (quét).
// - buildBroomMount(len): chổi nằm ngang để cưỡi bay (cán hướng về trước, chụm rơm ra sau), kèm vệt bụi rơm phía sau.
// CHƯA nhìn bằng mắt trên máy thật (môi trường AI không có màn hình thật) — kích thước / hướng cầm là số TẠM (BROOM_SCALE...).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const BROOM_LEN = 1.5;
export const BROOM_SCALE = 1.3;        // cầm tay to hơn cây côn mặc định (dài 2,1 m → chổi ~1,95 m)
export const BROOM_COLOR = 0xd9b878;   // màu rơm/bụi (vòng sáng lan, vệt bay, lá cát bay)

let TEX = null;
/** Đốm bụi mềm màu rơm (dùng cho vệt bay + gió). */
export function dustTexture() {
  if (TEX) return TEX;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(236,214,160,.95)'); gr.addColorStop(0.5, 'rgba(214,184,120,.45)'); gr.addColorStop(1, 'rgba(200,170,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  TEX = new THREE.CanvasTexture(c); TEX.colorSpace = THREE.SRGBColorSpace; return TEX;
}

export function buildBroom() {
  const g = new THREE.Group(); g.name = 'choi'; const holder = new THREE.Group(); holder.name = 'dau-choi'; g.add(holder); const body = new THREE.Group(); body.name = 'than'; holder.add(body);
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.7, metalness: 0.02 });
  const straw = new THREE.MeshStandardMaterial({ color: 0xc79a4d, roughness: 0.9, metalness: 0 });
  const bind = new THREE.MeshStandardMaterial({ color: 0xc8261e, roughness: 0.6 });
  const put = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; body.add(m); return m; };
  put(new THREE.CylinderGeometry(0.018, 0.022, 1.5, 10), wood, 0);
  put(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), bind, -0.45);
  const head = put(new THREE.ConeGeometry(0.15, 0.48, 14, 1, true), straw, -0.7); head.rotation.x = Math.PI; head.material.side = THREE.DoubleSide;   // chụm rơm xòe ra phía dưới
  g.userData.holder = holder; g.userData.body = body;
  return g;
}

// Giải mã GLB nhúng MỘT lần (Promise<THREE.Group đã chuẩn hóa>), các lần sau chỉ nhân bản (dùng chung hình khối + chất liệu).
let GLB = null;
function broomScene() {
  if (GLB) return GLB;
  GLB = import('../data/broomGlb.js').then(({ BROOM_GLB_B64 }) => new Promise((ok, no) => {
    try {
      const bin = atob(BROOM_GLB_B64), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      new GLTFLoader().parse(buf.buffer, '', (gltf) => {
        try {
          const holder = new THREE.Group(); holder.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
          const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
          if (size.x >= size.y && size.x >= size.z) holder.rotation.z = Math.PI / 2; else if (size.z >= size.y && size.z >= size.x) holder.rotation.x = Math.PI / 2;
          gltf.scene.scale.setScalar(BROOM_LEN / Math.max(size.x, size.y, size.z, 1e-6));
          const root = new THREE.Group(); root.add(holder); root.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3()); holder.position.set(-c.x, -c.y, -c.z);
          root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
          ok(root);
        } catch (e) { no(e); }
      }, no);
    } catch (e) { no(e); }
  }));
  GLB.catch(() => { GLB = null; });   // lỗi thì lần sau thử lại
  return GLB;
}

/** Thay thân khối bằng mô hình GLB (bất đồng bộ). Chuẩn hóa: trục dài nhất → y, dài BROOM_LEN, gốc ở giữa. */
export function loadBroomGlb(g) {
  if (!g || g.userData.glbTried) return; g.userData.glbTried = true;
  broomScene().then((root) => { g.userData.body.visible = false; const c = root.clone(true); g.userData.holder.add(c); g.userData.glb = c; })
    .catch((err) => console.warn('[Diệu Giang Tự] Không nạp được Chổi 3D, giữ chổi khối:', err && err.message ? err.message : err));
}

/** Nhịp đưa chổi (rad) tại giây t — hàm thuần để test. hot = 0 khi không đánh. */
export const broomSway = (t, hot) => (hot ? 0.09 * Math.sin(t * 14) : 0.015 * Math.sin(t * 2));

/** Đầu chổi đưa qua đưa lại (quét) khi đang đánh / bay. t = giây, hot = đang đánh / bay. */
export function pulseBroom(g, t, hot) {
  const h = g && g.userData && g.userData.holder; if (!h) return;
  h.rotation.z = broomSway(t, hot);
}

/** Chổi cưỡi bay: nằm ngang, dài len m, cán hướng về trước (+z), chụm rơm ra sau; vệt bụi rơm phía sau (thấy khi bay). userData.staff = cây chổi (cho pulseBroom), userData.trail = vệt. */
export function buildBroomMount(len) {
  const g = new THREE.Group(); g.name = 'cuoi-choi'; g.visible = false;
  const s = buildBroom(); s.rotation.x = Math.PI / 2; s.scale.setScalar(len * 1.25 / BROOM_LEN); s.position.y = -0.07; g.add(s); loadBroomGlb(s);
  const trail = [];
  for (let i = 0; i < 9; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTexture(), transparent: true, opacity: 0, depthWrite: false, fog: false }));
    sp.position.set(0, -0.07, -(len * 1.25 / 2 + 0.3 + i * 0.3)); const k = 0.5 + i * 0.07; sp.scale.set(k, k, 1); g.add(sp); trail.push(sp);
  }
  g.userData.staff = s; g.userData.trail = trail;
  return g;
}
