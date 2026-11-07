// Cảnh 3D câu cá (Phiên 48, mục 1.2): quả cầu bay xuống nước, vòng sóng, bóng cá lượn quanh, phao nhún, hoa sen nở đúng cửa sổ bấm.
// Chỉ VẼ: mọi mốc thời gian và hình học ở js/world/fishingView.js (có test), phiên câu ở js/world/fishing.js (LGT.fishing.session từ js/ui/fishing.js).
import * as THREE from 'three';
import { castTarget, flightPoint, rippleAt, rippleTimes, fishShadow, bobY, lotusBloom, orbColor, sessionKey, waterY, FLIGHT } from '../world/fishingView.js';

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.45, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** opts: { reduce (giảm chuyển động), perf: () => bậc PERF hiện tại (0..5) }. Trả { group, update(t, dt) }. */
export function buildFishing(LGT, { reduce = false, perf = () => 0 } = {}) {
  const group = new THREE.Group(); group.name = 'cau-ca'; group.visible = false;
  const orbMat = new THREE.MeshStandardMaterial({ color: 0xb07a43, emissive: 0x442200, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.25 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), orbMat); group.add(orb);
  const glowTex = glowTexture();
  const orbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd9a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); orbGlow.scale.set(1, 1, 1); orb.add(orbGlow);

  const ringMat = () => new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const ripples = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), ringMat()); m.rotation.x = -Math.PI / 2; m.visible = false; group.add(m); ripples.push(m); }

  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x0b1a24, transparent: true, opacity: 0, depthWrite: false });
  const fishShade = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), shadowMat); fishShade.rotation.x = -Math.PI / 2; fishShade.scale.set(1, 0.4, 1); fishShade.visible = false; group.add(fishShade);

  // hoa sen nở: cùng kiểu hoa sen vàng ở hoasen.js nhưng màu hồng trắng
  const lotus = new THREE.Group(); lotus.visible = false; group.add(lotus);
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xffd3e6, emissive: 0xff8fbf, emissiveIntensity: 0.75, roughness: 0.5 });
  const petalG = new THREE.SphereGeometry(0.3, 10, 8); petalG.scale(0.45, 1, 0.22); petalG.translate(0, 0.3, 0);
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(petalG, petalMat), a = (i / 8) * Math.PI * 2 + ring * 0.39; p.rotation.set(0, a, 0); p.rotateX(0.55 - ring * 0.5); p.scale.setScalar(1 - ring * 0.18); lotus.add(p); }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })); core.position.y = 0.12; lotus.add(core);
  const lotusGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb3d6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); lotusGlow.scale.set(3, 3, 1); lotusGlow.position.y = 0.5; lotus.add(lotusGlow);

  const st = { key: '', from: null, to: null, y: 0.1, ended: 0, endAt: null };   // st.endAt = điểm nổi sóng cuối khi phiên vừa kết thúc

  function hideAll() { orb.visible = false; lotus.visible = false; fishShade.visible = false; for (const r of ripples) r.visible = false; }
  function ripple(m, k, x, z, y, big = 1) {
    if (k < 0) { m.visible = false; return; }
    m.visible = true; m.position.set(x, y + 0.015, z);
    const sc = reduce ? 1.2 * big : (0.35 + 1.9 * k) * big; m.scale.set(sc, sc, sc); m.material.opacity = 0.7 * (1 - k);
  }

  function update(t, dt) {
    const F = LGT.fishing, s = F && F.session, W = LGT.world;
    if (!s || !W || !W.pos) {   // không có phiên: nếu vừa có thì để lại một vòng sóng cuối ~1 giây (cá lên / cá thoát)
      if (st.key) { st.key = ''; st.ended = 1.0; }
      if (st.ended > 0 && st.to) {
        st.ended -= dt || 0.016; group.visible = true; hideAll();
        ripple(ripples[0], Math.max(0, Math.min(1, 1 - st.ended / 1.0)), st.to.x, st.to.z, st.y, 1.3);
        if (st.ended <= 0) { group.visible = false; st.to = null; }
      } else group.visible = false;
      return;
    }
    const key = sessionKey(s);
    if (key !== st.key) {   // phiên mới: nhớ chỗ tay và chỗ rơi
      st.key = key; st.ended = 0; const p = W.pos; st.from = { x: p.x, y: (p.y || 0) + 1.3, z: p.z }; st.to = castTarget(p, s.water); st.y = waterY(s.water);
      orbMat.color.setHex(orbColor(s.orb)); orbMat.emissive.setHex(orbColor(s.orb)); orbMat.emissiveIntensity = 0.35; orbGlow.material.color.setHex(orbColor(s.orb));
    }
    group.visible = true; const low = perf() >= 4;
    // cầu: bay rồi nổi nhún theo nhịp rỉa
    orb.visible = true;
    if (s.t < FLIGHT && !reduce) { const q = flightPoint(s.t / FLIGHT, st.from, st.to, st.y + 0.05); orb.position.set(q.x, q.y, q.z); orbGlow.scale.setScalar(0.8); }
    else { orb.position.set(st.to.x, st.y + 0.07 + bobY(s), st.to.z); orbGlow.scale.setScalar(0.9 + 0.25 * Math.sin(t * 4)); }
    // sóng: lúc cầu chạm nước và mỗi lần cá rỉa
    const times = rippleTimes(s);
    for (let i = 0; i < ripples.length; i++) { const k = i < times.length && !(low && i > 1) ? rippleAt(s.t, times[i]) : -1; ripple(ripples[i], k, st.to.x, st.to.z, st.y, i === 0 ? 1.4 : 1); }
    // bóng cá
    const f = low ? null : fishShadow(s);
    if (f) { fishShade.visible = true; fishShade.position.set(st.to.x + Math.cos(f.ang) * f.rad, st.y + 0.02, st.to.z + Math.sin(f.ang) * f.rad); fishShade.rotation.z = -f.ang - Math.PI / 2; shadowMat.opacity = f.alpha; } else fishShade.visible = false;
    // hoa sen nở đúng cửa sổ bấm
    const b = lotusBloom(s);
    if (b > 0) { lotus.visible = true; lotus.position.set(st.to.x + 0.55, st.y, st.to.z); const k = reduce ? 1 : 0.2 + 0.8 * b; lotus.scale.setScalar(k); lotus.rotation.y = reduce ? 0 : t * 0.8; lotusGlow.material.opacity = 0.6 + (reduce ? 0 : 0.3 * Math.sin(t * 8)); } else lotus.visible = false;
  }
  return { group, update };
}
