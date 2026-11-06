// Lắp ráp cảnh, vòng lặp render, hậu kỳ, PERF governor, MOOD, điểm sáng bấm được.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, damp, isCoarse, prefersReduced } from '../util.js';
import { softDot } from './textures.js';
import { makeMaterials, buildTamQuan, buildBellTower, buildCenser } from './temple.js';
import { buildChanhDien } from './chanhdien.js';
import { buildProps } from './props.js';
import { buildGarden } from './garden.js';
import { buildHouses } from './nhato.js';
import { loadTemple } from './model.js';
import { buildStars, buildSky, buildMountains, buildGround, buildPond, buildBodhi, buildBamboo, buildRocks, buildLowPolyTrees } from './nature.js';
import { DAY } from './theme.js';
import { TREES, farTrees } from '../world/placements.js';
import { buildFireflies, buildPetals, buildSmoke } from './particles.js';
import { createRail } from './rail.js';
import { createHotspots } from './hotspots.js';
import { createWorld } from '../world/world.js';
import { buildCushions } from './boduon.js';
import { buildHoaSen } from './hoasen.js';
import { buildNpcs } from './npc.js';
import { buildLandscape } from './landscape.js';
import { buildOutside } from './outside.js';
import { createGovernor, levelPlan, startLevel, loadSaved, save as savePerf } from './perfLogic.js';
import { buildGlbTrees } from './glbprops.js';
import { inHall } from '../world/landscape.js';
import { seasonState, parseSeasonParam, seasonColor, isLeafGreen } from '../world/season.js';
import { dayState, lerpHex, lightDir, moonDir, parseHourParam, wrapHour, clockText, HOURS_PER_SECOND } from '../world/daycycle.js';

/* Biến toàn cục MOOD (-1..1): điểm số sẽ điều khiển màu đèn, độ sáng trăng, tông hậu kỳ.
   -1 = lạnh/xanh, 0 = trung tính, +1 = vàng ấm. Dùng: window.LGT.setMood(0.6) hoặc ?mood=0.6
   LGT.panelOpen: true khi một bảng nội dung đang mở (cảnh dịch sang trái, ẩn điểm sáng). */
export const LGT = (window.LGT = window.LGT || { mood: 0, _target: 0, setMood(v) { this._target = clamp(+v || 0, -1, 1); } });
LGT.panelOpen = false;

export function createScene(canvas, { onProgress, onPick, onArrive } = {}) {
  const coarse = isCoarse() || innerWidth < 760;
  const reduce = prefersReduced();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, powerPreference: 'high-performance' });
  // Nếu không có WebGL, new WebGLRenderer ném lỗi → main.js bắt và bật fallback.
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;   // đổ bóng: mặt trời/trăng chiếu theo người chơi
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = DAY ? 1.05 : 1.5;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(DAY ? 0xcfe8f5 : 0x1a2b48);
  scene.fog = new THREE.FogExp2(DAY ? 0xcfe8f5 : 0x1a2b48, DAY ? 0.0021 : 0.0042);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1400);

  makeMaterials(); onProgress?.(0.15);

  // --- ánh sáng
  const hemi = DAY ? new THREE.HemisphereLight(0xe3f2ff, 0xb9a487, 1.5) : new THREE.HemisphereLight(0x9bb2e6, 0x3a2e30, 1.6);
  const moonLight = DAY ? new THREE.DirectionalLight(0xfff0d2, 2.9) : new THREE.DirectionalLight(0xdfe6ff, 2.2);   // mặt trời / trăng
  if (DAY) moonLight.position.set(45, 80, 85); else moonLight.position.set(60, 90, -120);
  const warm1 = new THREE.PointLight(0xffa24a, DAY ? 60 : 220, 80, 2); warm1.position.set(0, 6, -10);
  const warm2 = new THREE.PointLight(0xff8a3a, DAY ? 12 : 160, 70, 2); warm2.position.set(0, 7, 31);
  const ambient = DAY ? new THREE.AmbientLight(0xffffff, 0.5) : new THREE.AmbientLight(0xb4c2ea, 0.9);
  const sunOffset = moonLight.position.clone();
  moonLight.castShadow = true;
  { const sh = moonLight.shadow, R = 46; const ms = +new URLSearchParams(location.search).get('shadow') || (coarse ? 1024 : 2048); sh.mapSize.set(ms, ms); Object.assign(sh.camera, { left: -R, right: R, top: R, bottom: -R, near: 20, far: 300 }); sh.bias = -0.0006; sh.normalBias = 0.05; sh.radius = 2.5; sh.camera.updateProjectionMatrix(); }
  scene.add(hemi, ambient, moonLight, moonLight.target, warm1, warm2);
  /** Cho mọi khối đặc của `obj` đổ và nhận bóng (khối sáng tự phát / trong suốt bỏ qua). */
  const shade = (obj, receive = true) => { obj.traverse((o) => { if (o.isMesh && !o.material.isMeshBasicMaterial && !o.material.transparent) { o.castShadow = true; o.receiveShadow = receive; } }); return obj; };

  // --- bầu trời, núi (lùi ra sau để nhường chỗ cho quần thể chùa), nền
  const { sky, moon, moonMat } = buildSky();
  const stars = buildStars(coarse ? 400 : 700); if (DAY) scene.add(stars);
  const mountains = buildMountains(); mountains.scale.setScalar(1.5); mountains.position.z = -30;
  scene.add(sky, moon, mountains, buildGround()); onProgress?.(0.3);

  // --- kiến trúc (hướng chính về +z, camera nhìn từ +z)
  const tam = buildTamQuan(); tam.position.set(0, 0, 34);
  const chanh = buildChanhDien();   // tọa độ thế giới (dựng theo layout.js)
  const tower = buildBellTower(); tower.group.position.set(28, 0, -4); tower.group.rotation.y = -0.25;
  const censer = buildCenser(); censer.group.position.set(0, 0, -8);
  scene.add(shade(tam), chanh.group, shade(tower.group), shade(censer.group), shade(buildProps()), shade(buildGarden()), shade(buildHouses()), shade(buildCushions())); onProgress?.(0.55);
  const hoaSen = buildHoaSen(LGT); scene.add(hoaSen.group);
  const npcs = buildNpcs(scene, LGT);   // NPC: Trụ trì, Tri khách, cư sĩ vườn thiền (Phiên 14g)   // hoa sen vàng nhận lộc
  const land = buildLandscape(); scene.add(shade(land.group));   // cảnh quan mở rộng (Phiên 14f)
  const outside = buildOutside(); scene.add(shade(outside.group));   // khu ngoài chùa: làng, chợ, rừng, thác (Phiên 17)
  scene.add(buildGlbTrees().group);   // cây GLB rải trong vườn (Phiên 14f, Bước 3): nạp nền, từng loại hiện khi nạp xong

  // --- quần thể chùa (GLB): nạp nền, không chặn màn hình chờ. Lỗi thì bỏ qua.
  loadTemple().then((m) => { if (m) scene.add(m); });

  // --- cây, tre, đá, ao sen
  scene.add(shade(buildBodhi(-24, 6, 1.1)), shade(buildBodhi(24, 26, 0.95)), shade(buildBodhi(-34, -16, 1.2)));
  scene.add(buildBamboo(-40, 12), buildBamboo(42, 8), buildBamboo(-30, 40));
  scene.add(buildRocks(18, 90, -10, 60));
  if (DAY) scene.add(shade(buildLowPolyTrees([...TREES, ...farTrees()].filter((t) => !inHall(t.x ?? t[0], t.z ?? t[1])))));   // cây low-poly xanh như ảnh mẫu
  const pond = buildPond(new THREE.Vector3(0, 0, 14), 10, coarse ? 10 : 18); scene.add(pond.group);
  onProgress?.(0.75);

  // --- hạt
  const dot = softDot();
  const fireflies = buildFireflies(dot, coarse ? 70 : 170);
  const PETAL_BASE = coarse ? 50 : 120, petals = buildPetals(dot, Math.round(PETAL_BASE * 1.6));   // dư chỗ cho mùa xuân (nhiều hoa)
  const smoke = buildSmoke(dot, new THREE.Vector3(0, 3.2, -8), coarse ? 40 : 70);
  scene.add(fireflies.obj, petals.obj, smoke.obj); fireflies.obj.visible = !DAY;

  // --- hậu kỳ: bloom (tắt trên mobile yếu / khi PERF hạ cấp)
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), DAY ? 0.18 : 0.5, 0.6, DAY ? 1.05 : 0.9);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  const rail = createRail(camera);
  const hotspots = createHotspots(camera, (id) => onPick?.(id));
  // Chế độ đi bộ (mặc định). Thêm ?rail=1 vào địa chỉ để quay lại chế độ camera bay cũ.
  const useRail = new URLSearchParams(location.search).get('rail') === '1';
  const world = useRail ? null : createWorld({ scene, camera, canvas, coarse, LGT, onArrive });

  // --- PERF governor (logic ở perfLogic.js, có test): bậc 0 = đầy đủ … 5 = nhẹ nhất; chỉ hạ, nhớ bậc đã hạ 7 ngày. ?perf=N (0–5) ép cố định.
  const store = (() => { try { return window.localStorage; } catch { return null; } })();
  const shadowBase = moonLight.shadow.mapSize.x;
  const start = startLevel({ coarse, saved: loadSaved(store), query: location.search });
  const gov = createGovernor({ start: start.level, fixed: start.fixed });
  let level = gov.level, appliedShadowSize = shadowBase, bloomOn = true;
  const applyLevel = () => {
    const plan = levelPlan(level, { dpr: devicePixelRatio || 1, shadowBase });
    renderer.setPixelRatio(plan.pixelRatio); composer.setPixelRatio(plan.pixelRatio);
    bloomOn = plan.bloom;
    if (plan.shadowSize !== appliedShadowSize) { appliedShadowSize = plan.shadowSize; moonLight.shadow.mapSize.set(plan.shadowSize, plan.shadowSize); if (moonLight.shadow.map) { moonLight.shadow.map.dispose(); moonLight.shadow.map = null; } }
    moonLight.castShadow = plan.shadows;
    outside.group.traverse((o) => { if (o.isInstancedMesh) { o.visible = plan.forest; o.castShadow = plan.forest && plan.forestShadow; } });   // trong khu ngoài chùa chỉ rừng dùng InstancedMesh (outside.js, hàm mk)
    if (plan.particles === 'low') { fireflies.setCount(40); petals.setCount(30); }
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

  const clock = new THREE.Clock(); let running = true, frameCount = 0, mouseX = 0, mouseY = 0, mx = 0, my = 0, viewX = 0;
  addEventListener('pointermove', (e) => { mouseX = e.clientX / innerWidth - 0.5; mouseY = e.clientY / innerHeight - 0.5; }, { passive: true });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.getDelta(); });

  // --- chu kỳ ngày đêm (ban ngày mặc định; ?dem=1 vẫn là đêm cố định như cũ; ?gio=19.5 cố định giờ, ?gio=thuc theo giờ máy)
  const hp = parseHourParam(location.search);
  LGT.hour = hp.hour; LGT.night = DAY ? 0 : 1; LGT.clock = clockText(LGT.hour); LGT.phase = '';
  const glowMats = new Set(); scene.traverse((o) => { if (o.material && o.material.userData && o.material.userData.nightGlow) glowMats.add(o.material); });
  const cA = new THREE.Color(), cB = new THREE.Color();

  // --- bốn mùa (mặc định theo tháng thật; ?mua=xuan|ha|thu|dong): đổi màu lá + cỏ MỘT LẦN khi dựng, hạt rơi, sương, ánh ấm
  const SEA = seasonState(parseSeasonParam(location.search)); LGT.season = SEA.name;
  { const seen = new Set(); let li = 0;
    scene.traverse((o) => {
      const m = o.material; if (!m || Array.isArray(m) || seen.has(m) || !m.color || m.isMeshBasicMaterial || m.isPointsMaterial || m.isSpriteMaterial) return; seen.add(m);
      const base = m.color.getHex();
      if (m.userData.season === 'grass') m.color.setHex(seasonColor(SEA, 'grass', base, 0, !!m.map));
      else if (!m.map && !m.userData.nightGlow && isLeafGreen(base)) m.color.setHex(seasonColor(SEA, 'leaf', base, li++));
    }); }
  petals.mul = SEA.petals.mul; petals.speed = SEA.petals.speed; petals.setCount(PETAL_BASE);
  petals.obj.material.color.setHex(SEA.petals.color); petals.obj.material.size = SEA.petals.size; petals.obj.material.opacity = SEA.petals.opacity;
  function applyDay(dt) {
    if (!hp.fixed) LGT.hour = wrapHour(LGT.hour + dt * HOURS_PER_SECOND);
    const S = dayState(LGT.hour, SEA.warmBias), L = lightDir(LGT.hour), M = moonDir(LGT.hour);
    LGT.night = S.night; LGT.clock = clockText(LGT.hour); LGT.phase = S.phase;
    const bgc = lerpHex(S.bg, SEA.haze, SEA.hazeK * (1 - S.night));   // sương/ánh mùa phủ ban ngày
    scene.background.setHex(bgc); scene.fog.color.setHex(bgc); scene.fog.density = S.fogDensity * (1 + (SEA.fogMul - 1) * (1 - S.night));
    sky.material.color.setHex(lerpHex(S.skyTint, SEA.haze, SEA.hazeK * 0.6 * (1 - S.night)));
    moonLight.color.setHex(S.sun.color); moonLight.intensity = S.sun.i; sunOffset.set(L.x * 125, L.y * 125, L.z * 125);
    hemi.color.setHex(S.hemi.sky); hemi.groundColor.setHex(S.hemi.ground); hemi.intensity = S.hemi.i;
    ambient.color.setHex(S.amb.color); ambient.intensity = S.amb.i;
    warm1.intensity = S.warm1; warm2.intensity = S.warm2;
    renderer.toneMappingExposure = S.exposure; bloom.strength = S.bloom;
    stars.material.opacity = S.stars; moonMat.opacity = S.moon; moon.position.set(M.x * 430, M.y * 430, M.z * 430);
    fireflies.obj.visible = S.night > 0.6;
    for (const m of glowMats) { const g = m.userData.nightGlow; m.emissiveIntensity = g.day + (g.night - g.day) * S.lamps; if (g.nightColor != null) m.emissive.copy(cA.setHex(g.dayColor)).lerp(cB.setHex(g.nightColor), S.lamps); }
  }

  const cWarm = new THREE.Color(0x3d2d1c), cCool = new THREE.Color(0x14305a), cNeutral = new THREE.Color(0x1a2b48), tmp = new THREE.Color();

  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;
    const rawDt = clock.getDelta(), dt = Math.min(rawDt, 0.1), t = clock.elapsedTime;

    // MOOD: damp rồi áp lên đèn, trăng, sương, bloom
    if (!DAY) {
      LGT.mood = damp(LGT.mood, LGT._target, 2.2, dt);
      const m = LGT.mood;
      moonLight.intensity = 2.2 + 0.6 * m;
      moonLight.color.setHex(m >= 0 ? 0xe9e0c8 : 0xbccaf5);
      warm1.intensity = 220 + 80 * Math.max(0, m); warm2.intensity = 160 + 60 * Math.max(0, m);
      tmp.copy(cNeutral).lerp(m >= 0 ? cWarm : cCool, Math.abs(m) * 0.7);
      scene.fog.color.copy(tmp); scene.background.copy(tmp);
      moonMat.color.setRGB(1, 1 - 0.08 * Math.max(0, -m), 1 - 0.2 * Math.max(0, -m));
      bloom.strength = 0.45 + 0.25 * Math.max(0, m);
    } else applyDay(dt);   // ban ngày mặc định: chu kỳ ngày đêm (bình minh, ban ngày, hoàng hôn, ban đêm); đèn trong điện lập lòe áp lên phía dưới

    // Camera + hiệu ứng nhẹ theo con trỏ (tắt khi reduced-motion)
    if (world && !LGT.freeCam) world.update(dt); else if (!world) rail.update(dt, reduce);   // freeCam: chỉ dùng khi chụp thử (?debug=1)
    if (!world && !reduce && !coarse) {
      mx = damp(mx, mouseX, 2, dt); my = damp(my, mouseY, 2, dt);
      camera.position.x += mx * 1.2; camera.position.y += -my * 0.6;
    }
    // Khi bảng nội dung mở bên phải (màn hình rộng), dịch khung hình sang trái để cảnh vẫn nhìn thấy
    const w = innerWidth, h = innerHeight;
    const want = LGT.panelOpen && w >= 900 ? w * 0.17 : 0;
    viewX = reduce ? want : damp(viewX, want, 4, dt);
    if (Math.abs(viewX) > 0.5) camera.setViewOffset(w, h, viewX, 0, w, h); else if (camera.view && camera.view.enabled) camera.clearViewOffset();

    if (world) { const wp = world.pos; moonLight.target.position.set(wp.x, 0, wp.z); moonLight.position.set(wp.x + sunOffset.x, sunOffset.y, wp.z + sunOffset.z); }   // sunOffset do applyDay cập nhật theo giờ   // vùng đổ bóng đi theo người chơi
    hoaSen.update(t); land.update(t); outside.update(t); if (world) npcs.update(dt, world.pos);
    sky.rotation.y = t * 0.004;
    if (!reduce) {
      if (!DAY || fireflies.obj.visible) fireflies.update(t); petals.update(t, dt); smoke.update(t, dt);
      pond.update(t); chanh.update(t, camera);
      tower.bell.rotation.z = Math.sin(t * 0.6) * 0.012;
      censer.embers.forEach((e, i) => { e.material.color.setRGB(1, 0.25 + 0.2 * Math.sin(t * 3 + i), 0.12); });
      warm1.intensity *= 0.97 + 0.06 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    }

    if (bloomOn) composer.render(); else renderer.render(scene, camera);

    // Điểm sáng: chỉ hiện khi không có bảng nào mở
    hotspots.setVisible(!LGT.panelOpen);
    hotspots.update(w, h);

    // PERF governor: đo FPS theo cửa sổ 2 giây; chậm 2 cửa sổ liền thì hạ một bậc (xem perfLogic.js)
    frameCount++;
    const down = gov.feed(rawDt);   // dt thô: khung ≥ 0,5 s (đổi tab) bị bỏ qua
    if (down) { level = down.level; applyLevel(); savePerf(store, level); LGT.perfLevel = level; }
    if (frameCount === 3) onProgress?.(1);
  }

  if (new URLSearchParams(location.search).get('debug') === '1') LGT.dbg = { scene, camera, renderer, THREE };   // móc chụp thử, không ảnh hưởng người dùng
  applyLevel(); LGT.perfLevel = level; rail.snap(); frame();
  return { renderer, scene, camera, rail, world, getLevel: () => level, LGT };
}
