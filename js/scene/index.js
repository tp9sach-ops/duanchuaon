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
import { fireflyLevel } from '../world/fireflies.js';
import { buildFireflies, buildPetals, buildSmoke, buildRain } from './particles.js';
import { createRail } from './rail.js';
import { createHotspots } from './hotspots.js';
import { createWorld } from '../world/world.js';
import { buildCushions } from './boduon.js';
import { buildHoaSen } from './hoasen.js';
import { buildNpcs } from './npc.js';
import { buildLandscape } from './landscape.js';
import { buildOutside } from './outside.js';
import { buildLand } from './land.js';
import { buildInterior } from './interior.js';
import { createGovernor, levelPlan, startLevel, loadSaved, save as savePerf } from './perfLogic.js';
import { buildGlbTrees } from './glbprops.js';
import { buildFishing } from './fishing.js';
import { buildCarry } from './carry.js';
import { createCarry } from '../world/strength.js';
import { inHall, PLAZA } from '../world/landscape.js';
import { groundY, blocked } from '../world/layout.js';
import { createWeather, parseWeatherParam, changeMessage } from '../world/weather.js';
import { mulberry32 } from '../util.js';
import { snapToTexel, shadowBias, SHADOW_R } from '../world/shadowSnap.js';
import { seasonState, parseSeasonParam, seasonColor, isLeafGreen } from '../world/season.js';
import { dayState, lerpHex, lightDir, moonDir, parseHourParam, wrapHour, clockText, HOURS_PER_SECOND, sharedHour, usesSharedClock } from '../world/daycycle.js';

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
  // Phiên 28b: R lấy từ shadowSnap.js; đèn cách mục tiêu ~125 m nên near/far thu hẹp để độ sâu mịn hơn
  { const sh = moonLight.shadow, R = SHADOW_R; /* R chung với shadowSnap.js */ const ms = +new URLSearchParams(location.search).get('shadow') || (coarse ? 1024 : 2048); sh.mapSize.set(ms, ms); Object.assign(sh.camera, { left: -R, right: R, top: R, bottom: -R, near: 30, far: 260 }); sh.bias = -0.0006; sh.normalBias = 0.05; sh.radius = 2.5; sh.camera.updateProjectionMatrix(); }
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
  const fishing = buildFishing(LGT, { reduce, perf: () => level }); scene.add(fishing.group);   // Phiên 48: cảnh câu cá 3D (đọc LGT.fishing.session)
  const carryWorld = LGT.carryWorld || (LGT.carryWorld = createCarry()); const carry = buildCarry(carryWorld); scene.add(shade(carry.group));   // Phiên 63: vật khiêng/ném được
  const npcs = buildNpcs(scene, LGT);   // NPC: Trụ trì, Tri khách, cư sĩ vườn thiền (Phiên 14g)   // hoa sen vàng nhận lộc
  const land = buildLandscape(); scene.add(shade(land.group));   // cảnh quan mở rộng (Phiên 14f)
  const xomScene = buildLand(); scene.add(shade(xomScene.group)); LGT.landScene = xomScene;
  const interior = buildInterior(); scene.add(interior.group); LGT.interiorScene = interior;   // phòng bên trong nhà (Phiên 38, 3d-2b): ẩn tới khi người chơi vào nhà   // khu dân cư + nhà người chơi (Phiên 36)
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
  const rain = buildRain(coarse ? 700 : 1500); scene.add(rain.obj);   // mưa 3D (Phiên 25)
  // Vũng nước (Phiên 25): hiện khi mặt đất đã ướt; màu lấy theo bầu trời nên chớp lóe cũng phản chiếu lên vũng. Đây là phản chiếu GIẢ (không có bản đồ môi trường).
  const puddleMat = new THREE.MeshBasicMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const puddles = new THREE.Group(); puddles.visible = false;
  { const r = mulberry32(25), geo = new THREE.CircleGeometry(1, 20), areas = [[PLAZA.x0 + 2, PLAZA.x1 - 2, PLAZA.z0 + 2, PLAZA.z1 - 2, 14], [-9, 9, 70, 128, 8]];
    for (const [x0, x1, z0, z1, n] of areas) for (let i = 0, tries = 0; i < n && tries < n * 40; tries++) {
      const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), rx = 0.7 + r() * 1.5, rz = rx * (0.6 + r() * 0.5);
      if (groundY(x, z) !== 0 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => blocked(x + a * rx, z + b * rz)) || blocked(x, z)) continue;   // chỉ đặt trên nền bằng, không đè vật cản
      const m = new THREE.Mesh(geo, puddleMat); m.rotation.x = -Math.PI / 2; m.rotation.z = r() * Math.PI; m.scale.set(rx, rz, 1); m.position.set(x, 0.035, z); puddles.add(m); i++;
    } }
  scene.add(puddles);

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
  LGT.view = { camera, canvas };   // Phiên 43: chế độ chỉnh sửa trong nhà cần camera + canvas để chọn đồ bằng chuột

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
    outside.group.traverse((o) => { if (o.isInstancedMesh) { if (o.userData.full == null) o.userData.full = o.count; o.visible = plan.forest; o.count = Math.max(1, Math.round(o.userData.full * plan.forestDensity)); o.castShadow = plan.forest && plan.forestShadow; } });   // trong khu ngoài chùa chỉ rừng dùng InstancedMesh (outside.js, hàm mk)
    rainCap = plan.particles === 'low' ? 0.4 : level >= 3 ? 0.7 : 1;
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
  addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 120)); addEventListener('lgt:viewport', resize);   // Phiên 31: xoay/gập Z Fold/thanh công cụ Safari co giãn

  const qMood = new URLSearchParams(location.search).get('mood');
  if (qMood !== null) LGT.setMood(qMood);

  const clock = new THREE.Clock(); let running = true, frameCount = 0, mouseX = 0, mouseY = 0, mx = 0, my = 0, viewX = 0;
  addEventListener('pointermove', (e) => { mouseX = e.clientX / innerWidth - 0.5; mouseY = e.clientY / innerHeight - 0.5; }, { passive: true });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.getDelta(); });

  // --- chu kỳ ngày đêm (ban ngày mặc định; ?dem=1 vẫn là đêm cố định như cũ; ?gio=19.5 cố định giờ, ?gio=thuc theo giờ máy)
  const hp = parseHourParam(location.search);
  const sharedClock = usesSharedClock(location.search); LGT.sharedClock = sharedClock; LGT.clockOffsetMs = LGT.clockOffsetMs || 0;   // Phiên 26: giờ game dùng chung (24 phút thật = 24 giờ game), clockOffsetMs để chỉnh lệch đồng hồ máy sau này
  const gameNow = () => sharedHour(Date.now() + LGT.clockOffsetMs);
  LGT.hour = sharedClock ? gameNow() : hp.hour; LGT.night = DAY ? 0 : 1; LGT.clock = clockText(LGT.hour); LGT.phase = '';
  const glowMats = new Set(); scene.traverse((o) => { if (o.material && o.material.userData && o.material.userData.nightGlow) glowMats.add(o.material); });
  const cA = new THREE.Color(), cB = new THREE.Color();

  // --- bốn mùa (mặc định theo tháng thật; ?mua=xuan|ha|thu|dong): đổi màu lá + cỏ MỘT LẦN khi dựng, hạt rơi, sương, ánh ấm
  const SEA = seasonState(parseSeasonParam(location.search)); LGT.season = SEA.name;
  // Thời tiết (Phiên 25): gió làm lá lay (đỉnh tán lay nhiều hơn, mạnh theo cấp mưa), mặt đất ướt thì sẫm và bóng hơn
  const windU = { value: 0 }, timeU = { value: 0 }, wetMats = [];
  const swayPatch = (shader) => {
    shader.uniforms.uWind = windU; shader.uniforms.uT = timeU;
    shader.vertexShader = 'uniform float uWind; uniform float uT;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      { float ph = position.x * 0.7 + position.z * 0.9; float k = (0.012 + uWind * 0.05) * max(position.y, 0.0);
        transformed.x += sin(uT * (1.4 + uWind * 1.6) + ph) * k; transformed.z += cos(uT * (1.1 + uWind * 1.3) + ph * 1.3) * k * 0.7; }`);
  };
  { const seen = new Set(); let li = 0;
    scene.traverse((o) => {
      const m = o.material; if (!m || Array.isArray(m) || seen.has(m) || !m.color || m.isMeshBasicMaterial || m.isPointsMaterial || m.isSpriteMaterial) return; seen.add(m);
      const base = m.color.getHex();
      if (m.userData.season === 'grass') m.color.setHex(seasonColor(SEA, 'grass', base, 0, !!m.map));
      else if (!m.map && !m.userData.nightGlow && isLeafGreen(base)) { m.color.setHex(seasonColor(SEA, 'leaf', base, li++)); m.onBeforeCompile = swayPatch; }
      if (m.userData.season === 'grass' || m.userData.wet) wetMats.push({ m, color: m.color.clone(), rough: m.roughness });
    }); }
  const WX = parseWeatherParam(location.search);
  const weather = createWeather({ season: SEA.name, level: DAY ? (WX.fixed ? WX.level : null) : 0, shared: DAY && !WX.fixed, nowMs: Date.now() + (LGT.clockOffsetMs || 0) });   // ?dem=1 (đêm cố định cũ) không có thời tiết
  LGT.weather = weather; let wxLevel = weather.level, wetApplied = -1, rainCap = 1;
  petals.mul = SEA.petals.mul; petals.speed = SEA.petals.speed; petals.setCount(PETAL_BASE);
  petals.obj.material.color.setHex(SEA.petals.color); petals.obj.material.size = SEA.petals.size; petals.obj.material.opacity = SEA.petals.opacity;
  function applyDay(dt) {
    if (sharedClock) LGT.hour = gameNow(); else if (!hp.fixed) LGT.hour = wrapHour(LGT.hour + dt * HOURS_PER_SECOND);   // giờ chung đọc lại từ đồng hồ thật mỗi khung: không trôi, đổi tab quay lại vẫn đúng giờ
    const evs = weather.update(dt, Date.now() + (LGT.clockOffsetMs || 0)), E = weather.fx, fl = (reduce ? 0.3 : 1) * weather.flash;   // fl: độ lóe chớp (người bật "giảm chuyển động" chỉ thấy lóe nhẹ, tránh nhấp nháy mạnh)
    for (const e of evs) window.dispatchEvent(new CustomEvent('lgt:thunder', { detail: e }));
    if (weather.level !== wxLevel) { const msg = changeMessage(wxLevel, weather.level); wxLevel = weather.level; if (msg && LGT.toast) LGT.toast(msg, 4200); }
    const S = dayState(LGT.hour, SEA.warmBias), L = lightDir(LGT.hour), M = moonDir(LGT.hour);
    LGT.night = S.night; LGT.clock = clockText(LGT.hour); LGT.phase = S.phase;
    let bgc = lerpHex(S.bg, SEA.haze, SEA.hazeK * (1 - S.night));   // sương/ánh mùa phủ ban ngày
    bgc = lerpHex(bgc, lerpHex(0x8f9aa6, 0x0d1220, S.night), E.grey);   // trời mưa xám đi
    if (fl > 0) bgc = lerpHex(bgc, 0xeef2ff, Math.min(0.75, fl * 0.7));   // chớp: cả bầu trời lóe
    scene.background.setHex(bgc); scene.fog.color.setHex(bgc); scene.fog.density = S.fogDensity * (1 + (SEA.fogMul - 1) * (1 - S.night)) * (1 + E.fog);
    sky.material.color.setHex(lerpHex(lerpHex(S.skyTint, SEA.haze, SEA.hazeK * 0.6 * (1 - S.night)), lerpHex(0x9aa5b1, 0x151b2a, S.night), E.grey * 0.9));
    moonLight.color.setHex(S.sun.color); moonLight.intensity = S.sun.i * (1 - 0.75 * E.dim); sunOffset.set(L.x * 125, L.y * 125, L.z * 125);   { const b = shadowBias(L.y); moonLight.shadow.bias = b.bias; moonLight.shadow.normalBias = b.normalBias; }   // nắng thấp: tăng độ lệch bóng để hết sọc ngang   // mây dày: nắng yếu, bóng đổ nhạt
    hemi.color.setHex(S.hemi.sky); hemi.groundColor.setHex(S.hemi.ground); hemi.intensity = S.hemi.i * (1 - 0.42 * E.dim) + fl * 3.2;
    ambient.color.setHex(S.amb.color); ambient.intensity = S.amb.i * (1 - 0.3 * E.dim) + fl * 1.4;
    warm1.intensity = S.warm1; warm2.intensity = S.warm2;
    renderer.toneMappingExposure = S.exposure; bloom.strength = S.bloom + fl * 0.5;
    stars.material.opacity = S.stars * (1 - E.cloud); moonMat.opacity = S.moon * (1 - 0.9 * E.cloud); moon.position.set(M.x * 430, M.y * 430, M.z * 430);   // mây che trăng sao
    fireflies.setLevel(fireflyLevel(S.night, E.rain)); fireflies.obj.visible = fireflyLevel(S.night, E.rain) > 0.01;   // đom đóm không bay khi mưa
    // gió + mưa + mặt đất ướt + gợn ao + vũng nước
    windU.value = E.wind; petals.wind = E.wind;
    const rp = world ? world.pos : camera.position, sheltered = (!!world && inHall(rp.x, rp.z)) || !!LGT.inHouse;   // trong chánh điện có mái: không thấy mưa rơi quanh người
    rain.setLevel(sheltered ? 0 : E.drops, rainCap * (reduce ? 0.5 : 1)); rain.setColor(lerpHex(0xe6eef8, 0x6a7b94, S.night), 0.5 + 0.2 * (1 - S.night));
    rain.update(dt, rp.x, rp.z, 0, E.wind, E.streak);
    pond.setRain(E.rain > 0.02 ? Math.min(1, E.rain * 1.7) : 0);
    const wet = weather.wet;
    puddles.visible = wet > 0.15; puddleMat.opacity = 0.45 * Math.min(1, (wet - 0.15) / 0.6); puddleMat.color.setHex(lerpHex(bgc, 0xffffff, 0.12));
    if (Math.abs(wet - wetApplied) > 0.01) { wetApplied = wet; for (const w of wetMats) { w.m.color.copy(w.color).multiplyScalar(1 - 0.32 * wet); if (w.rough != null) w.m.roughness = w.rough * (1 - 0.55 * wet); } }
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

    if (world) { const wp = world.pos, sp = snapToTexel(wp.x, wp.z, sunOffset, (2 * SHADOW_R) / appliedShadowSize); moonLight.target.position.set(sp.x, sp.y, sp.z); moonLight.position.set(sp.x + sunOffset.x, sp.y + sunOffset.y, sp.z + sunOffset.z); }   // Phiên 28b: nhích vùng bóng theo từng texel (hết răng cưa bò khi đi)   // sunOffset do applyDay cập nhật theo giờ   // vùng đổ bóng đi theo người chơi
    interior.update(LGT.night || 0); timeU.value = t; hoaSen.update(t); fishing.update(t, dt); carry.update(t, world && world.pos, LGT.carryNear); land.update(t); outside.update(t); if (world) npcs.update(dt, world.pos);
    sky.rotation.y = t * 0.004;
    if (!reduce) {
      if (!DAY || fireflies.obj.visible) fireflies.update(t, dt); petals.update(t, dt); smoke.update(t, dt);
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
