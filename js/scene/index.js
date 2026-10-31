// Lắp ráp cảnh, vòng lặp render, hậu kỳ, PERF governor, MOOD.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, damp, lerp, isCoarse, prefersReduced } from '../util.js';
import { softDot } from './textures.js';
import { makeMaterials, buildTamQuan, buildHall, buildBellTower, buildCenser } from './temple.js';
import { buildSky, buildMountains, buildGround, buildPond, buildBodhi, buildBamboo, buildRocks } from './nature.js';
import { buildFireflies, buildPetals, buildSmoke } from './particles.js';
import { createRail } from './rail.js';

/* Biến toàn cục MOOD (-1..1): điểm số sẽ điều khiển màu đèn, độ sáng trăng, tông hậu kỳ.
   -1 = lạnh/xanh, 0 = trung tính, +1 = vàng ấm. Dùng: window.LGT.setMood(0.6) hoặc ?mood=0.6 */
export const LGT = (window.LGT = window.LGT || { mood: 0, _target: 0, setMood(v) { this._target = clamp(+v || 0, -1, 1); } });

export function createScene(canvas, { onProgress } = {}) {
  const coarse = isCoarse() || innerWidth < 760;
  const reduce = prefersReduced();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, powerPreference: 'high-performance' });
  // Nếu không có WebGL, new WebGLRenderer ném lỗi → main.js bắt và bật fallback.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b14);
  scene.fog = new THREE.FogExp2(0x0b1424, 0.0085);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1400);

  makeMaterials(); onProgress?.(0.15);

  // --- ánh sáng
  const hemi = new THREE.HemisphereLight(0x6f86b8, 0x120d10, 0.55);
  const moonLight = new THREE.DirectionalLight(0xcfd8ff, 0.8); moonLight.position.set(60, 90, -120);
  const warm1 = new THREE.PointLight(0xffa24a, 90, 60, 2); warm1.position.set(0, 6, -10);
  const warm2 = new THREE.PointLight(0xff8a3a, 60, 50, 2); warm2.position.set(0, 7, 31);
  scene.add(hemi, moonLight, warm1, warm2);

  // --- bầu trời, núi, nền
  const { sky, moon, moonMat } = buildSky();
  scene.add(sky, moon, buildMountains(), buildGround()); onProgress?.(0.3);

  // --- kiến trúc (hướng chính về +z, camera nhìn từ +z)
  const tam = buildTamQuan(); tam.position.set(0, 0, 34);
  const hall = buildHall(); hall.position.set(0, 0, -28);
  const tower = buildBellTower(); tower.group.position.set(28, 0, -4); tower.group.rotation.y = -0.25;
  const censer = buildCenser(); censer.group.position.set(0, 0, -8);
  scene.add(tam, hall, tower.group, censer.group); onProgress?.(0.55);

  // --- cây, tre, đá, ao sen
  scene.add(buildBodhi(-24, 6, 1.1), buildBodhi(24, 26, 0.95), buildBodhi(-34, -16, 1.2));
  scene.add(buildBamboo(-40, 12), buildBamboo(42, 8), buildBamboo(-30, 40));
  scene.add(buildRocks(18, 90, -10, 60));
  const pond = buildPond(new THREE.Vector3(0, 0, 14), 10, coarse ? 10 : 18); scene.add(pond.group);
  onProgress?.(0.75);

  // --- hạt
  const dot = softDot();
  const fireflies = buildFireflies(dot, coarse ? 70 : 170);
  const petals = buildPetals(dot, coarse ? 50 : 120);
  const smoke = buildSmoke(dot, new THREE.Vector3(0, 3.2, -8), coarse ? 40 : 70);
  scene.add(fireflies.obj, petals.obj, smoke.obj);

  // --- hậu kỳ: bloom (tắt trên mobile yếu / khi PERF hạ cấp)
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.7, 0.82);
  composer.addPass(bloom); composer.addPass(new OutputPass());
  let bloomOn = true;

  const rail = createRail(camera);

  // --- PERF governor: 0 = đầy đủ; 1 = pixelRatio 1; 2 = tắt bloom; 3 = giảm hạt + pixelRatio .75
  let level = coarse ? 1 : 0, framesAcc = 0, timeAcc = 0, warm = 0;
  const applyLevel = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const pr = level >= 3 ? 0.75 : level >= 1 ? 1 : dpr;
    renderer.setPixelRatio(pr); composer.setPixelRatio(pr);
    bloomOn = level < 2;
    if (level >= 3) { fireflies.setCount(40); petals.setCount(30); }
    resize();
  };
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h;
    // Màn hình dọc: mở rộng FOV để vẫn thấy được cả cổng chùa
    camera.fov = w / h < 0.8 ? 68 : 52; camera.updateProjectionMatrix();
    document.documentElement.style.setProperty('--vw', w + 'px');
  }
  addEventListener('resize', resize);

  const qMood = new URLSearchParams(location.search).get('mood');
  if (qMood !== null) LGT.setMood(qMood);

  const clock = new THREE.Clock(); let running = true, frameCount = 0, mouseX = 0, mouseY = 0, mx = 0, my = 0;
  addEventListener('pointermove', (e) => { mouseX = e.clientX / innerWidth - 0.5; mouseY = e.clientY / innerHeight - 0.5; }, { passive: true });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.getDelta(); });

  const cWarm = new THREE.Color(0x2a1d10), cCool = new THREE.Color(0x0b1830), cNeutral = new THREE.Color(0x0b1424), tmp = new THREE.Color();

  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;

    // MOOD: damp rồi áp lên đèn, trăng, sương, bloom
    LGT.mood = damp(LGT.mood, LGT._target, 2.2, dt);
    const m = LGT.mood;
    moonLight.intensity = 0.8 + 0.35 * m;
    moonLight.color.setHex(m >= 0 ? 0xe9e0c8 : 0xbccaf5);
    warm1.intensity = 90 + 50 * Math.max(0, m); warm2.intensity = 60 + 40 * Math.max(0, m);
    tmp.copy(cNeutral).lerp(m >= 0 ? cWarm : cCool, Math.abs(m) * 0.7);
    scene.fog.color.copy(tmp); scene.background.copy(tmp);
    moonMat.color.setRGB(1, 1 - 0.08 * Math.max(0, -m), 1 - 0.2 * Math.max(0, -m));
    bloom.strength = 0.55 + 0.25 * Math.max(0, m);

    // Camera + hiệu ứng nhẹ theo con trỏ (tắt khi reduced-motion)
    rail.update(dt, reduce);
    if (!reduce && !coarse) {
      mx = damp(mx, mouseX, 2, dt); my = damp(my, mouseY, 2, dt);
      camera.position.x += mx * 1.2; camera.position.y += -my * 0.6;
    }

    sky.rotation.y = t * 0.004;
    if (!reduce) {
      fireflies.update(t); petals.update(t, dt); smoke.update(t, dt);
      pond.update(t);
      tower.bell.rotation.z = Math.sin(t * 0.6) * 0.012;
      censer.embers.forEach((e, i) => { e.material.color.setRGB(1, 0.25 + 0.2 * Math.sin(t * 3 + i), 0.12); });
      warm1.intensity *= 0.96 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    }

    if (bloomOn) composer.render(); else renderer.render(scene, camera);

    // PERF governor: đo trung bình sau 60 khung đầu, đánh giá mỗi 2 giây
    frameCount++;
    if (frameCount > 60) {
      framesAcc++; timeAcc += dt;
      if (timeAcc >= 2) {
        const fps = framesAcc / timeAcc;
        if (fps < 38 && level < 3) { level++; applyLevel(); warm = 0; }
        framesAcc = 0; timeAcc = 0;
      }
    }
    if (frameCount === 3) onProgress?.(1);
  }

  applyLevel(); rail.snap(); frame();
  return { renderer, scene, camera, rail, getLevel: () => level, LGT };
}
