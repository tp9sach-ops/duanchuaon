// Hạt khí quyển: đom đóm vàng, cánh hoa rơi, khói nhang.
import * as THREE from 'three';
import { mulberry32, TAU } from '../util.js';

function makePoints(n, size, color, map, opacity) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({ size, map, color, transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const p = new THREE.Points(geo, mat); p.frustumCulled = false;
  return p;
}

export function buildFireflies(dot, count) {
  const p = makePoints(count, 0.55, 0xffd77a, dot, 0.9);
  const rnd = mulberry32(12), a = p.geometry.attributes.position, seed = [];
  for (let i = 0; i < count; i++) {
    const bx = (rnd() - 0.5) * 90, by = 0.8 + rnd() * 9, bz = -30 + rnd() * 90;
    a.setXYZ(i, bx, by, bz); seed.push([bx, by, bz, rnd() * TAU, 0.3 + rnd() * 0.6]);
  }
  return {
    obj: p,
    update(t) {
      for (let i = 0; i < seed.length; i++) {
        const s = seed[i];
        a.setXYZ(i, s[0] + Math.sin(t * s[4] + s[3]) * 2.2, s[1] + Math.sin(t * s[4] * 1.3 + s[3] * 2) * 0.9, s[2] + Math.cos(t * s[4] * 0.8 + s[3]) * 2.2);
      }
      a.needsUpdate = true;
      p.material.opacity = 0.65 + Math.sin(t * 1.7) * 0.25;
    },
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
    obj: p, mul: 1, speed: 1,   // mul/speed: theo mùa (scene/index.js)
    update(t, dt) {
      for (let i = 0; i < seed.length; i++) {
        const s = seed[i];
        s[1] -= s[4] * dt * 0.9 * this.speed;
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
