// Hạt khí quyển: đom đóm vàng, cánh hoa rơi, khói nhang.
import * as THREE from 'three';
import { mulberry32, TAU } from '../util.js';
import { createSwarm } from '../world/fireflies.js';

function makePoints(n, size, color, map, opacity) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({ size, map, color, transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const p = new THREE.Points(geo, mat); p.frustumCulled = false;
  return p;
}

export function buildFireflies(dot, count) {
  // Phiên 31: đom đóm theo vùng (ao sen, sân chùa, vườn thiền, ao cá, bãi thông, hồ thác), bay mượt, mỗi con nhấp nháy riêng.
  const p = makePoints(count, 0.45, 0xffe08a, dot, 0.95);
  const swarm = createSwarm(count, 12), a = p.geometry.attributes.position;
  const col = new Float32Array(count * 3); p.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); p.material.vertexColors = true;
  let level = 1;
  return {
    obj: p,
    update(t, dt = 0.016) {
      swarm.step(dt);
      for (let i = 0; i < swarm.flies.length; i++) {
        const f = swarm.flies[i], b = swarm.blink(i, t) * level;
        a.setXYZ(i, f.x, f.y, f.zz); col[i * 3] = b; col[i * 3 + 1] = b * 0.9; col[i * 3 + 2] = b * 0.55;
      }
      a.needsUpdate = true; p.geometry.attributes.color.needsUpdate = true;
    },
    setLevel(v) { level = v; },   // 0..1: trời tối dần thì sáng dần
    setCount(n) { p.geometry.setDrawRange(0, n); },
  };
}

// Cánh sen / hoa đào rơi chậm, lặp vòng
export function buildPetals(dot, count) {
  const p = makePoints(count, 0.3, 0xf6c4d2, dot, 0.85);
  p.material.blending = THREE.NormalBlending;
  const rnd = mulberry32(44), a = p.geometry.attributes.position, seed = [];
  for (let i = 0; i < count; i++) {
    seed.push([(rnd() - 0.5) * 80, rnd() * 26, -20 + rnd() * 80, rnd() * TAU, 0.5 + rnd() * 0.9]);
    a.setXYZ(i, seed[i][0], seed[i][1], seed[i][2]);
  }
  return {
    obj: p, mul: 1, speed: 1, wind: 0,   // mul/speed: theo mùa; wind 0..1: gió thổi cánh hoa/lá bay ngang (thời tiết, scene/index.js)
    update(t, dt) {
      for (let i = 0; i < seed.length; i++) {
        const s = seed[i];
        s[1] -= s[4] * dt * 0.9 * this.speed;
        if (this.wind > 0.01) { s[0] += this.wind * dt * (3 + s[4] * 4); if (s[0] > 44) s[0] -= 88; }   // gió thổi sang +x, hết vùng thì quay lại đầu kia
        if (s[1] < 0) s[1] = 26;
        a.setXYZ(i, s[0] + Math.sin(t * 0.5 + s[3]) * 3, s[1], s[2] + Math.cos(t * 0.4 + s[3]) * 2);
      }
      a.needsUpdate = true;
    },
    setCount(n) { p.geometry.setDrawRange(0, Math.min(count, Math.round(n * this.mul))); },
  };
}

// Khói nhang: bay lên, nở dần, tan
export function buildSmoke(dot, origin, count = 70) {
  const p = makePoints(count, 0.9, 0xc9ccd6, dot, 0.22);
  p.material.blending = THREE.NormalBlending;
  const rnd = mulberry32(90), a = p.geometry.attributes.position, life = [];
  for (let i = 0; i < count; i++) life.push(rnd());
  return {
    obj: p,
    update(t, dt) {
      for (let i = 0; i < count; i++) {
        life[i] = (life[i] + dt * 0.12) % 1;
        const l = life[i];
        a.setXYZ(i, origin.x + Math.sin(l * 9 + i) * (0.12 + l * 0.9), origin.y + l * 7, origin.z + Math.cos(l * 7 + i * 1.7) * (0.12 + l * 0.9));
      }
      a.needsUpdate = true;
    },
  };
}

// Mưa 3D (Phiên 25): mỗi hạt là một vệt (đoạn thẳng) rơi nhanh, nghiêng theo gió; khối mưa 36 × 26 × 36 m NẰM TRONG THẾ GIỚI quanh người chơi
// (hạt đứng yên theo thế giới, ra khỏi khối thì quay vòng sang phía đối diện nên đi bộ không thấy mưa "dính" theo người).
// setLevel(drops 0..1, cap 0..1): số hạt hiển thị = tỉ lệ * trần PERF; update(dt, cx, cz, camY, wind, streak) mỗi khung.
export function buildRain(count) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 6);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xcfdcea, transparent: true, opacity: 0.5, depthWrite: false });
  const lines = new THREE.LineSegments(geo, mat); lines.frustumCulled = false; lines.visible = false;
  const W = 36, H = 26, rnd = mulberry32(2026), d = [];
  for (let i = 0; i < count; i++) d.push([rnd() * W, rnd() * H, rnd() * W, 17 + rnd() * 9, 0.7 + rnd() * 0.6]);   // x,y,z cục bộ trong khối; tốc độ rơi; hệ số dài
  let shown = 0, cap = 1;
  return {
    obj: lines, count,
    setLevel(drops, c = cap) { cap = c; shown = Math.round(count * Math.max(0, Math.min(1, drops)) * cap); geo.setDrawRange(0, shown * 2); lines.visible = shown > 0; },
    get shown() { return shown; },
    update(dt, cx, cz, baseY, wind = 0, streak = 1) {
      if (!shown) return;
      const sx = wind * 0.34, sz = wind * 0.12;                        // gió làm vệt nghiêng
      for (let i = 0; i < shown; i++) {
        const q = d[i]; q[1] -= q[3] * dt * (0.85 + 0.3 * wind); q[0] += sx * q[3] * dt * 0.5;
        if (q[1] < 0) q[1] += H;
        q[0] = ((q[0] % W) + W) % W; q[2] = ((q[2] % W) + W) % W;
        const x = cx - W / 2 + (((q[0] - (cx - W / 2)) % W) + W) % W, z = cz - W / 2 + (((q[2] - (cz - W / 2)) % W) + W) % W, y = Math.max(0, baseY - 6) + q[1];
        const L = 0.5 * streak * q[4], j = i * 6;
        pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; pos[j + 3] = x - sx * L; pos[j + 4] = y + L; pos[j + 5] = z - sz * L;
      }
      geo.attributes.position.needsUpdate = true;
    },
    setColor(hex, opacity) { mat.color.setHex(hex); mat.opacity = opacity; },
  };
}
