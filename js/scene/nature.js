// Thiên nhiên: bầu trời, trăng, núi, nền sân, ao sen, cây bồ đề, tre.
import * as THREE from 'three';
import { skyTexture, daySkyTexture, moonTexture, brickTexture, pavingTexture, slabTexture, dayPathTexture } from './textures.js';
import { DAY } from './theme.js';
import { mulberry32, TAU } from '../util.js';

export function buildSky() {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(520, 32, 20),
    new THREE.MeshBasicMaterial({ map: DAY ? daySkyTexture() : skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false })
  );
  const moonMat = new THREE.SpriteMaterial({ map: moonTexture(), fog: false, depthWrite: false, transparent: true });
  const moon = new THREE.Sprite(moonMat); moon.visible = !DAY;
  moon.position.set(110, 105, -400);
  moon.scale.set(150, 150, 1);
  return { sky, moon, moonMat };
}

// Núi: ba lớp bóng, lớp xa nhạt và xanh hơn (phối cảnh khí quyển)
export function buildMountains() {
  const g = new THREE.Group();
  const layers = [
    { z: -150, h: 60, c: DAY ? 0xa4cdbd : 0x2c4058, seed: 3, span: 520 },
    { z: -105, h: 44, c: DAY ? 0x86bba0 : 0x213349, seed: 9, span: 420 },
    { z: -70,  h: 30, c: DAY ? 0x69a785 : 0x16253a, seed: 14, span: 340 },
  ];
  layers.forEach((L) => {
    const rnd = mulberry32(L.seed), pts = [];
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const x = (i / n - 0.5) * L.span;
      const f = i / n;
      const big = Math.sin(f * 7 + L.seed) * 0.5 + Math.sin(f * 17 + L.seed * 2) * 0.28 + rnd() * 0.22;
      pts.push(new THREE.Vector2(x, 2 + (0.45 + 0.55 * big) * L.h));
    }
    const s = new THREE.Shape();
    s.moveTo(-L.span / 2, -6);
    pts.forEach((p) => s.lineTo(p.x, p.y));
    s.lineTo(L.span / 2, -6); s.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: L.c }));
    m.position.z = L.z; g.add(m);
  });
  return g;
}

export function buildGround() {
  const g = new THREE.Group();
  const bt = DAY ? pavingTexture() : brickTexture(); bt.repeat.set(DAY ? 22 : 16, DAY ? 22 : 16);
  const court = new THREE.Mesh(new THREE.PlaneGeometry(130, 130),
    new THREE.MeshStandardMaterial({ map: bt, roughness: 0.8, metalness: 0 }));
  court.rotation.x = -Math.PI / 2; g.add(court);
  // Lối đi lát đá xanh từ Tam quan vòng qua ao sen lên chính điện
  // (đoạn qua ao sen là cầu đá, dựng trong buildPond)
  const st = DAY ? dayPathTexture() : slabTexture(); st.repeat.set(1, DAY ? 14 : 12);
  const slabMat = new THREE.MeshStandardMaterial({ map: st, roughness: 0.6, metalness: 0.1, color: 0xffffff });
  [[24.4, 66], [-13, 3.6]].forEach(([z0, z1]) => {
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(5, z1 - z0), slabMat);
    seg.rotation.x = -Math.PI / 2; seg.position.set(0, 0.03, (z0 + z1) / 2); g.add(seg);
  });
  // Nền đất tối kéo dài đến chân núi
  const far = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: DAY ? 0x7fb35a : 0x14201f, roughness: 1 }));
  far.rotation.x = -Math.PI / 2; far.position.y = -0.06; g.add(far);
  return g;
}

/* Ao sen: mặt nước shader (gợn sóng + ánh trăng), lá sen, hoa sen.
   Trả về { group, update(t) } để hoa và lá nhấp nhô. */
export function buildPond(center = new THREE.Vector3(0, 0, 14), radius = 10, flowerCount = 18) {
  const group = new THREE.Group(); group.position.copy(center);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 56),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uTint: { value: new THREE.Color(0xd9b25f) } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vP; uniform float uTime; uniform vec3 uTint;
        void main(){
          float r = length(vP) / ${radius.toFixed(1)};
          float w = sin(vP.x*1.6 + uTime*.7) * sin(vP.y*1.9 - uTime*.55);
          float rip = smoothstep(.55,1.,w) * .10;
          vec3 base = mix(vec3(.06,.14,.20), vec3(.12,.24,.32), 1.-r);
          float glint = pow(max(0.,1.-abs(vP.x*.07 + vP.y*.01 - .0)), 8.) * smoothstep(1.,.2,r) * (.35 + .25*sin(uTime*1.3 + vP.y*2.));
          gl_FragColor = vec4(base + rip*vec3(.4,.5,.6) + glint*uTint*.55, 1.);
        }`,
    })
  );
  water.rotation.x = -Math.PI / 2; water.position.y = 0.04; group.add(water);
  // Cầu đá bắc ngang ao, nối lối đi hai bên
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.34, radius * 2 + 1.2), new THREE.MeshStandardMaterial({ color: 0x59636b, roughness: 0.85 }));
  bridge.position.y = 0.17; group.add(bridge);
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.55, radius * 2 + 1.2), new THREE.MeshStandardMaterial({ color: 0x6c767d, roughness: 0.85 }));
    rail.position.set(sx * 1.6, 0.6, 0); group.add(rail);
  }
  // Bờ đá
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.35, 0.4, 8, 64), new THREE.MeshStandardMaterial({ color: 0x6a737c, roughness: 0.9 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.1; group.add(rim);

  const rnd = mulberry32(77), floaters = [];
  const padMat = new THREE.MeshStandardMaterial({ color: 0x2f7a5a, roughness: 0.7, side: THREE.DoubleSide });
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xf3b6c8, emissive: 0x7a3a50, emissiveIntensity: 0.7, roughness: 0.6 });
  const petalGeo = new THREE.ConeGeometry(0.24, 0.72, 6);
  petalGeo.translate(0, 0.36, 0);
  const spot = () => { const a = rnd() * TAU, r = Math.sqrt(rnd()) * (radius - 1.4); return [Math.cos(a) * r, Math.sin(a) * r]; };

  for (let i = 0; i < 34; i++) {
    const [x, z] = spot();
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.6 + rnd() * 0.5, 0.6 + rnd() * 0.5, 0.03, 18), padMat);
    pad.position.set(x, 0.08, z); group.add(pad); floaters.push({ o: pad, ph: rnd() * TAU, amp: 0.012 });
  }
  for (let i = 0; i < flowerCount; i++) {
    const [x, z] = spot();
    const f = new THREE.Group(); f.position.set(x, 0.08, z);
    for (let k = 0; k < 9; k++) {
      const p = new THREE.Mesh(petalGeo, petalMat), a = (k / 9) * TAU;
      p.rotation.set(0.55, a, 0); p.rotation.order = 'YXZ'; f.add(p);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
    core.position.y = 0.3; f.add(core);
    f.scale.setScalar(0.7 + rnd() * 0.6);
    group.add(f); floaters.push({ o: f, ph: rnd() * TAU, amp: 0.03 });
  }
  return {
    group,
    update(t) {
      water.material.uniforms.uTime.value = t;
      floaters.forEach((f) => { f.o.position.y = 0.08 + Math.sin(t * 0.8 + f.ph) * f.amp; });
    },
  };
}

// Cây bồ đề: thân + tán lá icosahedron tối, lá hình tim sẽ làm sau
export function buildBodhi(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 8, 10), new THREE.MeshStandardMaterial({ color: DAY ? 0x7a5236 : 0x4a3a30, roughness: 1 }));
  trunk.position.y = 4; g.add(trunk);
  const leaf = new THREE.MeshStandardMaterial({ color: DAY ? 0x62ad4a : 0x3a7a58, roughness: 0.85, flatShading: true });
  const rnd = mulberry32(Math.floor(x * 13 + z * 7 + 3));
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8 + rnd() * 1.6, 1), leaf);
    c.position.set((rnd() - 0.5) * 6, 9 + rnd() * 4, (rnd() - 0.5) * 6); g.add(c);
  }
  return g;
}

export function buildBamboo(x, z, n = 14) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const mat = new THREE.MeshStandardMaterial({ color: DAY ? 0x6dbb5e : 0x4a9468, roughness: 0.7 });
  const rnd = mulberry32(Math.floor(x * 5 + z * 11 + 1));
  for (let i = 0; i < n; i++) {
    const h = 9 + rnd() * 6, c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, h, 6), mat);
    c.position.set((rnd() - 0.5) * 4, h / 2, (rnd() - 0.5) * 4); c.rotation.z = (rnd() - 0.5) * 0.12; g.add(c);
  }
  return g;
}

// Đá tảng rải rác cho tiền cảnh
export function buildRocks(count, spreadX, zMin, zMax, seed = 31) {
  const g = new THREE.Group(), rnd = mulberry32(seed);
  const mat = new THREE.MeshStandardMaterial({ color: DAY ? 0x9a9c98 : 0x59636c, roughness: 1, flatShading: true });
  for (let i = 0; i < count; i++) {
    const r = 0.5 + rnd() * 1.3, m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat);
    m.position.set((rnd() - 0.5) * spreadX, r * 0.4, zMin + rnd() * (zMax - zMin));
    m.scale.y = 0.6; m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); g.add(m);
  }
  return g;
}

// Cây low-poly dễ thương như ảnh mẫu: thân nâu mập + hai khối tán xanh tròn. Dùng chung hình học/vật liệu cho nhẹ.
const TREE_GREENS = [0x58a844, 0x6bb74a, 0x4f9a3f, 0x7cc255];
export function buildLowPolyTrees(list) {   // list: [{ x, z, s }]
  const g = new THREE.Group(), rnd = mulberry32(404);
  const trunkG = new THREE.CylinderGeometry(0.2, 0.32, 2.4, 6); trunkG.translate(0, 1.2, 0);
  const crownG = new THREE.IcosahedronGeometry(1.6, 1), topG = new THREE.IcosahedronGeometry(1.05, 1);
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x84573a, roughness: 1, flatShading: true });
  const leafMs = TREE_GREENS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true }));
  list.forEach(({ x, z, s = 1 }) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); t.rotation.y = rnd() * TAU;
    const m = leafMs[Math.floor(rnd() * leafMs.length)];
    t.add(new THREE.Mesh(trunkG, trunkM));
    const c1 = new THREE.Mesh(crownG, m); c1.position.y = 3.6; c1.scale.set(1, 0.92, 1); t.add(c1);
    const c2 = new THREE.Mesh(topG, m); c2.position.set(0.35, 5.0, 0.2); t.add(c2);
    g.add(t);
  });
  return g;
}
