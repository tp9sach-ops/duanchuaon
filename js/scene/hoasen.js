// Hoa sen vàng phát sáng trong sân (nhận lộc). Vị trí/hồi chiêu ở js/world/loc.js; ở đây chỉ dựng hình và kiểm tra mỗi khung.
import * as THREE from 'three';
import { createLoc, loadLoc } from '../world/loc.js';

const K = 'lgt.loc';
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,236,150,.95)'); gr.addColorStop(0.4, 'rgba(255,200,80,.4)'); gr.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** LGT: window.LGT (lấy vị trí người từ LGT.world.pos; gọi LGT.onLoc() khi nhận lộc). Trả { group, update(t) }. */
export function buildHoaSen(LGT) {
  let saved = null; try { saved = localStorage.getItem(K); } catch (_) { /* bỏ qua */ }
  const loc = createLoc(loadLoc(saved));
  const group = new THREE.Group(); group.name = 'hoasen-vang';
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xf5c453, emissive: 0xffa726, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.2 });
  const petalG = new THREE.SphereGeometry(0.3, 10, 8); petalG.scale(0.45, 1, 0.22); petalG.translate(0, 0.3, 0);   // cánh hình giọt, gốc ở tâm hoa
  const lotus = new THREE.Group(); lotus.position.y = 0.55; group.add(lotus);
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(petalG, petalMat), a = (i / 8) * Math.PI * 2 + ring * 0.39;
    p.rotation.set(0, a, 0); p.rotateX(0.55 - ring * 0.5); p.scale.setScalar(1 - ring * 0.18); lotus.add(p);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })); core.position.y = 0.14; lotus.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  glow.scale.set(3.4, 3.4, 1); glow.position.y = 0.7; group.add(glow);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 40), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; group.add(ring);

  let shown = null;
  LGT.loc = { active: () => loc.active(), get spot() { return loc.spot(); }, msLeft: () => loc.msLeft() };
  function update(t) {
    const now = Date.now(), on = loc.active(now);
    group.visible = on;
    if (!on) { shown = null; return; }
    const s = loc.spot();
    if (shown !== s) { shown = s; group.position.set(s.x, 0, s.z); }
    lotus.position.y = 0.55 + Math.sin(t * 2) * 0.08; lotus.rotation.y = t * 0.6;
    glow.material.opacity = 0.75 + 0.25 * Math.sin(t * 3); const k = 1 + 0.08 * Math.sin(t * 3); ring.scale.set(k, k, k);
    const W = LGT.world; if (!W || LGT.panelOpen) return;
    const r = loc.tryCollect(W.pos, now);
    if (r) { try { localStorage.setItem(K, JSON.stringify(r.state)); } catch (_) { /* bỏ qua */ } LGT.onLoc && LGT.onLoc(r); }
  }
  return { group, update };
}
