// GLSL cho hiệu ứng THỦY 3D (Phiên 203, docs/KE_HOACH_HIEU_UNG_3D_V2.md, MỤC 3). Chỉ là CHUỒI (không import three) → test được trong Node: tests/thuyfx.test.mjs. Dựng vật liệu: js/scene/fxThuy.js.
// CHƯA nhìn bằng mắt (môi trường AI không có WebGL): mở fx-thuy.html; lỗi biên dịch shader hiện chữ đỏ. Quy ước như fxGlsl.js: số thực có dấu chấm, mỗi uniform/varying một dòng, không #version.
import { NOISE } from './fxGlsl.js';

// ---- TINH THỂ BĂNG: lăng trụ lục giác nhọn đầu, mặt phẳng từng mặt (pháp tuyến phẳng), viền sáng Fresnel, ánh phản chiếu, vết rạn nứt bên trong, trong suốt ở giữa ----
export const BANG_VERT = `
varying vec3 vN;
varying vec3 vV;
varying vec3 vPos;
void main() {
  vPos = position;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;
export const BANG_FRAG = NOISE + `
uniform float uTime;
uniform float uSeed;
uniform float uPower;
uniform vec3 uTint;
varying vec3 vN;
varying vec3 vV;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.2);
  vec3 L = normalize(vec3(0.5, 0.8, 0.4));
  float dif = 0.5 + 0.5 * dot(n, L);
  vec3 r = reflect(-v, n);
  float spec = pow(max(dot(r, L), 0.0), 26.0) * (0.75 + 0.25 * sin(uTime * 8.0 + uSeed * 20.0));
  float cr = vnoise(vec3(vPos.x * 5.0, vPos.y * 2.0, vPos.z * 5.0) + uSeed * 9.0);
  float vein = smoothstep(0.6, 0.68, cr);
  vec3 col = mix(uTint * 0.5, vec3(0.88, 0.98, 1.0), clamp(dif * 0.65 + fres * 0.7, 0.0, 1.0));
  col += vec3(spec) + vein * 0.2 * uTint;
  float a = clamp(0.34 + 0.5 * fres + spec + vein * 0.2 + (1.0 - clamp(vPos.y, 0.0, 1.0)) * 0.12, 0.0, 1.0) * uPower;
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}
`;

// ---- NƯỚC: thân nước trong, màu sâu→nhạt theo nhiễu chảy, Fresnel, ánh phản chiếu, BỌT trắng ở đỉnh sóng (uv.y cao); đỉnh lợn sóng nhờn theo uWave ----
export const NUOC_VERT = `
uniform float uTime;
uniform float uWave;
varying vec3 vN;
varying vec3 vV;
varying vec3 vPos;
varying float vY;
void main() {
  vec3 p = position;
  float w = sin(uTime * 3.0 + position.y * 9.0 + position.x * 5.0 + position.z * 4.0);
  p += normal * uWave * w * 0.5;
  vPos = p;
  vY = uv.y;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;
export const NUOC_FRAG = NOISE + `
uniform float uTime;
uniform float uSeed;
uniform float uPower;
uniform float uFoam;
uniform vec3 uDeep;
uniform vec3 uLight;
varying vec3 vN;
varying vec3 vV;
varying vec3 vPos;
varying float vY;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 L = normalize(vec3(0.5, 0.8, 0.4));
  float dif = 0.5 + 0.5 * dot(n, L);
  vec3 r = reflect(-v, n);
  float spec = pow(max(dot(r, L), 0.0), 40.0);
  vec3 q = vec3(vPos.x * 3.0, vPos.y * 3.0 - uTime * 1.2, vPos.z * 3.0) + uSeed * 7.0;
  float n1 = fbm(q);
  vec3 col = mix(uDeep, uLight, clamp(0.25 + 0.5 * dif + (n1 - 0.5) * 0.5, 0.0, 1.0));
  col += fres * vec3(0.6, 0.85, 1.0) * 0.7 + vec3(spec);
  float foam = smoothstep(0.6, 0.95, vY) * smoothstep(0.35, 0.62, n1) * uFoam;
  col = mix(col, vec3(0.96, 1.0, 1.0), foam);
  float a = clamp((0.42 + 0.4 * fres + foam * 0.5 + spec * 0.5) * uPower, 0.0, 1.0);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}
`;

// ---- VŨNG SÁNG LẠNH trên nền (ánh xanh lạnh/ngọc, nhiễu fbm nhẹ) ----
export const VUNG_LANH_VERT = `
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const VUNG_LANH_FRAG = NOISE + `
uniform float uTime;
uniform float uR;
uniform float uPower;
uniform vec3 uCol;
varying vec2 vXY;
void main() {
  float r = length(vXY) / max(uR, 0.001);
  float n = fbm(vec3(vXY * 2.2, uTime * 0.4));
  float a = pow(1.0 - smoothstep(0.0, 1.0, r), 1.4) * (0.55 + 0.7 * n) * uPower;
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uCol, vec3(0.9, 1.0, 1.0), (1.0 - r) * 0.5), a);
}
`;

/** Mọi cặp (đỉnh, mảnh) để test kiểm tra tự động. */
export const CAC_CAP_THUY = Object.freeze({ bang: [BANG_VERT, BANG_FRAG], nuoc: [NUOC_VERT, NUOC_FRAG], vungLanh: [VUNG_LANH_VERT, VUNG_LANH_FRAG] });
