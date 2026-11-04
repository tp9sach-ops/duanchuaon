// Tượng Phật (Phiên 14e): dùng ảnh assets/buddha.webp (đã vẽ lại phần đế sen) dán lên tấm phẳng có nền trong suốt,
// kèm hào quang vàng phát sáng phía sau. Tấm phẳng tự xoay quanh trục đứng về phía người nhìn (tối đa ±35°) để không bị mỏng khi nhìn nghiêng.
// Gốc tọa độ: giữa đáy đế sen, nhìn +z. Dùng: const b = buildBuddha(cao); b.group; mỗi khung: b.face(camera).
import * as THREE from 'three';
import { haloGlowTexture } from './textures.js';

const ASPECT = 560 / 900;
let shared = null;
function buddhaTexture() {
  if (shared) return shared;
  shared = new THREE.TextureLoader().load(new URL('../../assets/buddha.webp', import.meta.url).href);
  shared.colorSpace = THREE.SRGBColorSpace; shared.anisotropy = 8; return shared;
}

export function buildBuddha(height = 7) {
  const group = new THREE.Group(), w = height * ASPECT;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.9, w * 1.9), new THREE.MeshBasicMaterial({ map: haloGlowTexture(), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.set(0, height * 0.66, -0.35); group.add(glow);
  const mat = new THREE.MeshStandardMaterial({ map: buddhaTexture(), alphaTest: 0.45, roughness: 0.55, metalness: 0.15, emissive: 0xffc060, emissiveMap: buddhaTexture(), emissiveIntensity: 0.42, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.PlaneGeometry(w, height), mat); body.position.y = height / 2; body.castShadow = true;
  group.add(body);
  const pivot = body;
  function face(camera) {
    const p = new THREE.Vector3(); group.getWorldPosition(p);
    const a = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    pivot.rotation.y = Math.max(-0.61, Math.min(0.61, a)); glow.rotation.y = pivot.rotation.y;
  }
  return { group, face };
}
