// Gió làm cây lung lay (chỉ đổi đỉnh trong shader, không đụng tới va chạm hay hình học).
// Tự nhận ra tán cây / thông / tre / cây GLB theo loại hình + màu xanh, rồi gắn đoạn shader vào vật liệu của chúng.
// Cây GLB nạp nền nên quét lại định kỳ trong 90 giây đầu. Tôn trọng prefers-reduced-motion (không lay).
const U = { uWindT: { value: 0 }, uWindH: { value: 11 }, uWindAmp: { value: 0.55 } };
const seen = new WeakSet();

const HEAD = 'uniform float uWindT; uniform float uWindH; uniform float uWindAmp;';
const BODY = `
{
  vec4 wP = vec4(transformed, 1.0);
  vec3 org = modelMatrix[3].xyz;
  #ifdef USE_INSTANCING
    wP = instanceMatrix * wP;
    org = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
  #endif
  wP = modelMatrix * wP;
  float hf = clamp(wP.y / uWindH, 0.0, 1.0);
  hf *= hf;
  float ph = org.x * 0.21 + org.z * 0.17;
  float gust = 0.65 + 0.35 * sin(uWindT * 0.35 + org.x * 0.02);
  float sx = sin(uWindT * 1.15 + ph) + 0.45 * sin(uWindT * 2.6 + ph * 1.9 + wP.y * 0.4);
  float sz = 0.5 * sin(uWindT * 0.95 + ph * 1.3 + 1.7) + 0.25 * sin(uWindT * 2.2 + ph + wP.x * 0.5);
  vec3 off = vec3(sx + 0.4, 0.0, sz + 0.15) * (uWindAmp * hf * gust);
  mvPosition.xyz += (viewMatrix * vec4(off, 0.0)).xyz;
  gl_Position = projectionMatrix * mvPosition;
}`;

function patch(m) {
  if (seen.has(m)) return; seen.add(m);
  const prev = m.onBeforeCompile, pk = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(m, sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('void main() {', HEAD + '\nvoid main() {').replace('#include <project_vertex>', '#include <project_vertex>\n' + BODY);
  };
  m.customProgramCacheKey = function () { return (pk ? pk.call(this) : '') + '|wind'; };
  m.needsUpdate = true;
}

function isFoliage(o) {
  if (!o.isMesh || !o.geometry) return false;
  const m = o.material;
  if (!m || Array.isArray(m) || m.isShaderMaterial || m.isMeshBasicMaterial || m.isSpriteMaterial) return false;
  if (o.isInstancedMesh && typeof o.name === 'string' && o.name.startsWith('tree-')) return true;   // cây GLB (glbprops.js)
  const c = m.color; if (!c || !(c.g >= c.r * 0.95 && c.g > c.b)) return false;                       // chỉ vật liệu xanh lá
  const g = o.geometry, t = g.type, p = g.parameters || {};
  if (t === 'IcosahedronGeometry') return (p.radius || 0) >= 1;                                        // tán cây
  if (t === 'ConeGeometry') return (p.height || 99) < 8 && (p.radialSegments || 0) >= 6;               // tầng thông (loại núi, mái)
  if (t === 'CylinderGeometry') return (p.height || 0) >= 8;                                          // thân tre
  return false;
}

export function initWind(scene) {
  if (!scene || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  const scan = () => { scene.traverse((o) => { if (isFoliage(o)) patch(o.material); }); };
  scan();
  const t0 = performance.now(), timer = setInterval(() => { scan(); if (performance.now() - t0 > 90000) clearInterval(timer); }, 3000);
  const tick = () => { U.uWindT.value = performance.now() / 1000; requestAnimationFrame(tick); };
  tick();
}
