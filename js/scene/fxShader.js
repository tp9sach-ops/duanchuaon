// VẬT LIỆU SHADER cho hiệu ứng chiêu 3D (Phiên 201, docs/KE_HOACH_HIEU_UNG_3D_V2.md, MỤC 1). GLSL nằm ở js/world/fxGlsl.js (có test). CHƯA nhìn bằng mắt: xem ở fx-preview.html.
// Khác lối cũ (Sprite kết cấu canvas, phẳng như tờ giấy): đây là KHỐI có thể tích (mặt trụ thon, nhìn từ mọi hướng), mật độ + màu tính từng điểm ảnh bằng nhiễu fbm theo nhiệt độ,
// hạt tròn mềm có cỡ/tuổi riêng, khói/sương nhiễu, vũng sáng nền. Không đèn động. Chưa nối vào chieuFx.js — các mục 2–8 sẽ nối dần (mỗi Hệ một mục) để không làm hỏng hiệu ứng đang chạy.
// Mọi hàm dựng bọc try ở chỗ gọi (chieuFx.js đã nuốt lỗi); file này không chạm window/document.
import * as THREE from 'three';
import { LUA_VERT, LUA_FRAG, KHOI_VERT, KHOI_FRAG, HAT_VERT, HAT_FRAG, VUNG_VERT, VUNG_FRAG } from '../world/fxGlsl.js';

const mat = (vs, fs, uniforms, o = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms, transparent: true, depthWrite: false, ...o });

/** Khối lửa: mặt trụ hở cao `cao` m (gốc ở y = 0, thon dần lên ngọn), bán kính gốc `bk`. seed 0..1 làm mỗi lưỡi lửa khác nhau; heat nhân nhiệt độ (1 = chuẩn; >1 nóng trắng, <1 đỏ sẫm); power nhân độ đục. */
export function taoLuaMesh({ seed = 0, heat = 1, power = 1, bk = 0.5, cao = 1, dai = 22, doc = 14 } = {}) {
  const g = new THREE.CylinderGeometry(bk * 0.35, bk, 1, dai, doc, true); g.translate(0, 0.5, 0);
  const m = mat(LUA_VERT, LUA_FRAG, { uTime: { value: 0 }, uSeed: { value: seed }, uPower: { value: power }, uHeat: { value: heat } }, { blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m); mesh.scale.y = cao; mesh.frustumCulled = false; mesh.renderOrder = 2; return mesh;
}

/** Tấm khói/sương luôn quay mặt về camera, rộng = scale.x. col = màu (số hex). alpha = độ đục tối đa. */
export function taoKhoiMesh({ seed = 0, alpha = 0.5, col = 0x2a2521 } = {}) {
  const m = mat(KHOI_VERT, KHOI_FRAG, { uTime: { value: 0 }, uSeed: { value: seed }, uAlpha: { value: alpha }, uCol: { value: new THREE.Color(col) } }, { side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); mesh.frustumCulled = false; mesh.renderOrder = 1; return mesh;
}

/**
 * Bộ hạt tròn mềm (cộng sáng). n hạt; ghi vị trí vào geometry.attributes.position, tuổi 0..1 vào aAge, cỡ (m) vào aSize, hạt giống vào aSeed rồi đặt needsUpdate = true.
 * px = số điểm ảnh cho vật cao 1 m ở cách camera 1 m (≈ chiều cao màn hình ÷ (2·tan(fov/2))); spark > 0 thêm tia sao 4 cánh (tia lửa, kim loại).
 */
export function taoHatPoints(n, { colA = 0xffd25a, colB = 0xff4a10, spark = 0, px = 600 } = {}) {
  const g = new THREE.BufferGeometry(), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) seed[i] = Math.random();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n).fill(0.1), 1));
  g.setAttribute('aAge', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const m = mat(HAT_VERT, HAT_FRAG, { uPx: { value: px }, uColA: { value: new THREE.Color(colA) }, uColB: { value: new THREE.Color(colB) }, uSpark: { value: spark } }, { blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 3; p.userData.n = n; return p;
}

/** Vũng sáng tròn bán kính r nằm trên mặt đất (y = 0.02). */
export function taoVungMesh({ r = 2, power = 1 } = {}) {
  const m = mat(VUNG_VERT, VUNG_FRAG, { uTime: { value: 0 }, uR: { value: r }, uPower: { value: power } }, { blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 40), m); mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.02; mesh.frustumCulled = false; mesh.renderOrder = 0; return mesh;
}

/** Ghi thời gian t (giây) vào mọi vật liệu shader có uniform uTime dưới `root`. Gọi mỗi khung hình. */
export function capNhatThoiGian(root, t) {
  root.traverse((o) => { const u = o.material && o.material.uniforms; if (u && u.uTime) u.uTime.value = t; });
}

/** Giải phóng hình + vật liệu dưới `root` (khi hiệu ứng kết thúc). */
export function huyFx(root) {
  root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
}
