// GLSL DÙNG CHUNG cho hiệu ứng chiêu 3D (Phiên 201, docs/KE_HOACH_HIEU_UNG_3D_V2.md, MỤC 1). Chỉ là CHUỖI (không import three) nên test được trong Node: tests/fxshader.test.mjs.
// Dùng bởi js/scene/fxShader.js (dựng vật liệu three.js). CHƯA nhìn bằng mắt (môi trường AI không có WebGL): mở fx-preview.html để xem; lỗi biên dịch shader sẽ hiện chữ đỏ trên trang đó.
// Quy ước: mọi số thực viết có dấu chấm (1.0), mỗi uniform/varying một dòng riêng, không dùng #version (three.js tự thêm).

/** Nhiễu giá trị 3D + fbm 4 tầng (0..~0.94): nền của lửa, khói, năng lượng. */
export const NOISE = `
float h31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(h31(i), h31(i + vec3(1.0, 0.0, 0.0)), f.x);
  float b = mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x);
  float c = mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x);
  float d = mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}
float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int k = 0; k < 4; k++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}
`;

/** Bảng màu theo NHIỆT ĐỘ (0 nguội → 1 nóng trắng): than đen → đỏ sẫm → cam → vàng → trắng ngà. */
export const RAMP_LUA = `
vec3 rampLua(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = mix(vec3(0.05, 0.0, 0.0), vec3(0.6, 0.05, 0.01), smoothstep(0.0, 0.22, t));
  c = mix(c, vec3(1.0, 0.3, 0.03), smoothstep(0.2, 0.45, t));
  c = mix(c, vec3(1.0, 0.68, 0.14), smoothstep(0.42, 0.68, t));
  c = mix(c, vec3(1.0, 0.93, 0.62), smoothstep(0.66, 0.88, t));
  c = mix(c, vec3(1.0, 1.0, 0.96), smoothstep(0.86, 1.0, t));
  return c;
}
`;

/** Bản CPU của rampLua (cùng các mốc) — để test và để chọn màu hạt/ánh sáng phía JS cho khớp. Trả [r,g,b] 0..1. */
export function mauLuaCPU(t) {
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const ss = (a, b, x) => { const k = cl((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const mix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
  t = cl(t, 0, 1);
  let c = mix([0.05, 0, 0], [0.6, 0.05, 0.01], ss(0, 0.22, t));
  c = mix(c, [1, 0.3, 0.03], ss(0.2, 0.45, t));
  c = mix(c, [1, 0.68, 0.14], ss(0.42, 0.68, t));
  c = mix(c, [1, 0.93, 0.62], ss(0.66, 0.88, t));
  return mix(c, [1, 1, 0.96], ss(0.86, 1, t));
}

// ---- KHỐI LỬA (mặt trụ hở, thon dần lên, lắc theo gió; màu theo nhiệt độ; mép bị nhiễu "ăn" nên rách như lửa thật) ----
export const LUA_VERT = `
uniform float uTime;
uniform float uSeed;
varying vec3 vP;
varying float vH;
varying vec3 vNrm;
varying vec3 vView;
void main() {
  vec3 p = position;
  float h = clamp(p.y, 0.0, 1.0);
  p.xz *= pow(1.0 - h, 0.75);
  p.x += sin(uTime * 3.0 + h * 6.0 + uSeed * 6.28) * 0.16 * h * h;
  p.z += cos(uTime * 2.3 + h * 5.0 + uSeed * 3.1) * 0.12 * h * h;
  vP = p;
  vH = h;
  vNrm = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;
export const LUA_FRAG = NOISE + RAMP_LUA + `
uniform float uTime;
uniform float uSeed;
uniform float uPower;
uniform float uHeat;
varying vec3 vP;
varying float vH;
varying vec3 vNrm;
varying vec3 vView;
void main() {
  vec3 q = vec3(vP.x * 3.0, vP.y * 2.2 - uTime * 1.9, vP.z * 3.0) + uSeed * 11.0;
  float n = fbm(q);
  float n2 = fbm(q * 2.1 + 5.0);
  float rim = abs(dot(normalize(vNrm), normalize(vView)));
  float d = (1.0 - vH) * 1.15 + (n - 0.5) * 0.9 + (n2 - 0.5) * 0.35 - vH * 0.35;
  float edge = smoothstep(0.12, 0.5, d);
  float heat = clamp(d * 0.9 + rim * 0.45 - vH * 0.25, 0.0, 1.0) * uHeat;
  vec3 col = rampLua(heat);
  float a = edge * (0.25 + 0.75 * rim) * uPower;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col * (0.6 + heat * 1.4), a);
}
`;

// ---- KHÓI / SƯƠNG (tấm luôn quay mặt về camera, mật độ theo nhiễu fbm; kích cỡ = scale của mesh) ----
export const KHOI_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  vec2 s = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * s;
  gl_Position = projectionMatrix * mv;
}
`;
export const KHOI_FRAG = NOISE + `
uniform float uTime;
uniform float uSeed;
uniform float uAlpha;
uniform vec3 uCol;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float n = fbm(vec3(p * 1.6 + uSeed * 7.0, uTime * 0.35 + uSeed * 3.0));
  float d = (1.0 - smoothstep(0.15, 1.0, r)) * (0.35 + n * 1.1);
  float a = smoothstep(0.18, 0.62, d) * uAlpha;
  if (a < 0.005) discard;
  gl_FragColor = vec4(uCol * (0.55 + 0.45 * n), a);
}
`;

// ---- HẠT TRÒN MỀM (tàn lửa, bụi, đom đóm…): kích cỡ từng hạt, tuổi từng hạt; lõi sáng + quầng + tia sao tùy chọn. KHÔNG còn ô vuông. ----
export const HAT_VERT = `
uniform float uPx;
attribute float aSize;
attribute float aAge;
attribute float aSeed;
varying float vAge;
varying float vSeed;
void main() {
  vAge = aAge;
  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float life = clamp(1.0 - aAge, 0.0, 1.0);
  gl_PointSize = max(1.0, aSize * uPx / max(0.1, -mv.z) * (0.35 + 0.65 * life));
}
`;
export const HAT_FRAG = `
uniform vec3 uColA;
uniform vec3 uColB;
uniform float uSpark;
varying float vAge;
varying float vSeed;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  float core = exp(-r * r * 7.0);
  float halo = exp(-r * 2.8) * 0.28;
  float ray = (exp(-abs(c.x) * 55.0) + exp(-abs(c.y) * 55.0)) * (1.0 - r) * uSpark;
  float a = (core + halo + max(ray, 0.0)) * (1.0 - smoothstep(0.7, 1.0, vAge));
  a *= step(r, 1.0);
  if (a < 0.01) discard;
  float tw = 0.75 + 0.25 * sin(vSeed * 40.0 + vAge * 30.0);
  vec3 col = mix(uColA, uColB, smoothstep(0.0, 0.9, vAge));
  gl_FragColor = vec4(col * tw, a);
}
`;

// ---- VŨNG SÁNG TRÊN NỀN (ánh lửa/ánh năng lượng chiếu xuống đất, nhấp nháy theo nhiễu) ----
export const VUNG_VERT = `
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const VUNG_FRAG = NOISE + RAMP_LUA + `
uniform float uTime;
uniform float uR;
uniform float uPower;
varying vec2 vXY;
void main() {
  float r = length(vXY) / max(uR, 0.001);
  float n = fbm(vec3(vXY * 1.8, uTime * 0.7));
  float flick = 0.82 + 0.1 * sin(uTime * 23.0) + 0.08 * sin(uTime * 37.0 + 1.3);
  float a = pow(1.0 - smoothstep(0.0, 1.0, r), 1.6) * (0.6 + 0.8 * n) * flick * uPower;
  if (a < 0.004) discard;
  gl_FragColor = vec4(rampLua(0.45 + 0.35 * (1.0 - r)), a);
}
`;

/** Mọi cặp (đỉnh, mảnh) để test kiểm tra tự động. */
export const CAC_CAP = Object.freeze({ lua: [LUA_VERT, LUA_FRAG], khoi: [KHOI_VERT, KHOI_FRAG], hat: [HAT_VERT, HAT_FRAG], vung: [VUNG_VERT, VUNG_FRAG] });
