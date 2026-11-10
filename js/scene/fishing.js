// Cảnh 3D câu cá (Phiên 48, mục 1.2): quả cầu bay xuống nước, vòng sóng, bóng cá lượn quanh, phao nhún, hoa sen nở đúng cửa sổ bấm.
// Chỉ VẼ: mọi mốc thời gian và hình học ở js/world/fishingView.js (có test), phiên câu ở js/world/fishing.js (LGT.fishing.session từ js/ui/fishing.js).
import * as THREE from 'three';
import { fishLook } from '../world/pondFish.js';
import { makeFish } from './pondFish.js';
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

  // Phiên 89: hoa sen nở TRÊN ĐẦU nhân vật (rung mạnh) đúng lúc cá cắn — thấy ngay dù đang nhìn nhân vật, không cần dán mắt vào phao
  const headLotus = new THREE.Group(); headLotus.visible = false; group.add(headLotus);
  const hl = lotus.clone(true); hl.visible = true; hl.position.set(0, 0, 0); hl.scale.setScalar(1); headLotus.add(hl);
  const hlGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd0e4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, depthTest: false })); hlGlow.scale.set(1.5, 1.5, 1); hlGlow.position.y = 0.45; hlGlow.renderOrder = 999; headLotus.add(hlGlow);
  hl.traverse((o) => { if (o.material && o.material !== petalMat) { o.material = o.material.clone(); } });
  let vibKey = '';
  // Phiên 89: cá vừa câu được VĂNG LÊN TAY nhân vật — thấy ngay đó là cá gì, to hay nhỏ (cỡ lớn dài 1,5 lần; loài hiếm to hơn chút)
  const held = new THREE.Group(); held.visible = false; group.add(held);
  const hs = { fish: null, t0: 0, from: null, obj: null };
  const st = { key: '', from: null, to: null, y: 0.1, ended: 0, endAt: null };   // st.endAt = điểm nổi sóng cuối khi phiên vừa kết thúc

  function hideAll() { orb.visible = false; lotus.visible = false; fishShade.visible = false; for (const r of ripples) r.visible = false; }
  function ripple(m, k, x, z, y, big = 1) {
    if (k < 0) { m.visible = false; return; }
    m.visible = true; m.position.set(x, y + 0.015, z);
    const sc = reduce ? 1.2 * big : (0.35 + 1.9 * k) * big; m.scale.set(sc, sc, sc); m.material.opacity = 0.7 * (1 - k);
  }

  function update(t, dt) {
    const F = LGT.fishing, s = F && F.session, W = LGT.world;
    const cf = F && F.caught;
    if (cf && !s && W && W.pos) {   // đang cầm cá vừa câu
      group.visible = true;
      if (hs.fish !== cf) {
        hs.fish = cf; hs.t0 = t; hs.from = st.to ? { x: st.to.x, y: st.y, z: st.to.z } : { x: W.pos.x, y: (W.pos.y || 0) + 0.2, z: W.pos.z };
        if (hs.obj) held.remove(hs.obj.g); hs.obj = makeFish(fishLook(cf.sp, cf.lon === true)); held.add(hs.obj.g);
      }
      const p = W.pos, ry = Number.isFinite(W.facing) ? W.facing : 0, k = reduce ? 1 : Math.min(1, (t - hs.t0) / 0.7);
      const hx = p.x + Math.sin(ry) * 0.5, hz = p.z + Math.cos(ry) * 0.5, hy = (p.y || 0) + 0.95;
      held.visible = true;
      held.position.set(hs.from.x + (hx - hs.from.x) * k, hs.from.y + (hy - hs.from.y) * k + Math.sin(Math.PI * k) * 1.5, hz + (hs.from.z - hz) * (1 - k));
      held.position.z = hs.from.z + (hz - hs.from.z) * k;
      const flap = reduce || k < 1 ? 0 : Math.sin(t * 14);
      held.rotation.set(0, ry + 1.1 + (k < 1 ? k * 6.3 : 0), flap * 0.15); if (hs.obj.tail) hs.obj.tail.rotation.y = Math.sin(t * 16) * 0.5;
      if (k >= 1 && !reduce) held.position.y += Math.sin(t * 3) * 0.02;
      for (const r of ripples) r.visible = false; orb.visible = false; lotus.visible = false; headLotus.visible = false; fishShade.visible = false;
      return;
    }
    if (hs.fish) { hs.fish = null; held.visible = false; }
    if (!s || !W || !W.pos) {
      headLotus.visible = false; vibKey = '';   // không có phiên: nếu vừa có thì để lại một vòng sóng cuối ~1 giây (cá lên / cá thoát)
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
      st.key = key; st.ended = 0; const p = W.pos; st.from = { x: p.x, y: (p.y || 0) + 1.3, z: p.z }; st.to = castTarget(p, s.water, s.ry); st.y = waterY(s.water);
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
    if (b > 0) {   // hoa trên đầu: nảy lên rồi rung tới khi hết cửa sổ
      const p = W.pos, k = reduce ? 1 : 0.3 + 0.7 * b, sh = reduce ? 0 : Math.sin(t * 70) * 0.06 * b;
      headLotus.visible = true; headLotus.position.set(p.x + sh, (p.y || 0) + 2.05 + (reduce ? 0 : Math.abs(Math.sin(t * 18)) * 0.08), p.z); headLotus.scale.setScalar(k * 0.9); headLotus.rotation.z = reduce ? 0 : Math.sin(t * 55) * 0.14; hl.rotation.y = reduce ? 0 : t * 3;
      hlGlow.material.opacity = 0.4 + (reduce ? 0 : 0.2 * Math.sin(t * 20));
      if (vibKey !== key) { vibKey = key; if (!reduce) { try { navigator.vibrate && navigator.vibrate([90, 40, 90, 40, 90, 40, 90, 40, 120]); } catch (_) { /* bỏ qua */ } } }
    } else headLotus.visible = false;
    if (b > 0) { lotus.visible = true; lotus.position.set(st.to.x + 0.55, st.y, st.to.z); const k = reduce ? 1 : 0.2 + 0.8 * b; lotus.scale.setScalar(k); lotus.rotation.y = reduce ? 0 : t * 0.8; lotusGlow.material.opacity = 0.6 + (reduce ? 0 : 0.3 * Math.sin(t * 8)); } else lotus.visible = false;
  }
  return { group, update };
}
