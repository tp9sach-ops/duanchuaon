// Test nền tảng đồ họa hiệu ứng 3D (Phiên 201, mục 1): kiểm shader dạng CHUỖI (không cần WebGL) + nối dây file + bảng màu lửa.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { NOISE, RAMP_LUA, CAC_CAP, mauLuaCPU } from '../js/world/fxGlsl.js';

const decl = (src, kw) => [...src.matchAll(new RegExp(`^\\s*${kw}\\s+(\\w+)\\s+(\\w+)\\s*;`, 'gm'))].map((m) => m[1] + ' ' + m[2]);
const dem = (s, a, b) => s.split(a).length - s.split(b).length;
const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

test('mỗi shader có void main và ngoặc cân bằng', () => {
  for (const [ten, cap] of Object.entries(CAC_CAP)) for (const [i, s] of cap.entries()) {
    const nhan = `${ten}/${i ? 'mảnh' : 'đỉnh'}`;
    assert.match(s, /void\s+main\s*\(\s*\)/, nhan + ' thiếu void main');
    assert.equal(dem(s, '{', '}'), 0, nhan + ' lệch ngoặc nhọn');
    assert.equal(dem(s, '(', ')'), 0, nhan + ' lệch ngoặc tròn');
    assert.ok(!/#version/.test(s), nhan + ': không được tự thêm #version (three.js thêm)');
  }
});

test('varying của shader mảnh phải khớp (tên + kiểu) với shader đỉnh', () => {
  for (const [ten, [vs, fs]] of Object.entries(CAC_CAP)) {
    const v = new Set(decl(vs, 'varying')), f = decl(fs, 'varying');
    for (const x of f) assert.ok(v.has(x), `${ten}: varying "${x}" có ở shader mảnh mà shader đỉnh không khai báo`);
  }
});

test('hàm dùng ở shader mảnh đều có định nghĩa (fbm, vnoise, h31, rampLua)', () => {
  for (const [ten, [, fs]] of Object.entries(CAC_CAP)) for (const fn of ['fbm', 'vnoise', 'h31', 'rampLua']) {
    const dung = new RegExp(`\\b${fn}\\s*\\(`).test(fs.replace(new RegExp(`(float|vec3)\\s+${fn}\\s*\\(`, 'g'), ''));
    const co = new RegExp(`(float|vec3)\\s+${fn}\\s*\\(`).test(fs);
    if (dung) assert.ok(co, `${ten}: gọi ${fn}() mà chưa định nghĩa`);
  }
});

test('số thực GLSL luôn có dấu chấm (tránh lỗi biên dịch "int → float")', () => {
  for (const [ten, cap] of Object.entries(CAC_CAP)) for (const s of cap) {
    for (const m of s.matchAll(/(?:vec[234]|float)\s*\(([^)]*)\)/g)) {
      for (const a of m[1].split(',')) { const t = a.trim(); if (/^-?\d+$/.test(t)) assert.fail(`${ten}: số nguyên trần "${t}" trong ${m[0]}`); }
    }
  }
});

test('mỗi uniform dùng trong shader đều được khai báo', () => {
  for (const [ten, cap] of Object.entries(CAC_CAP)) for (const s of cap) {
    const khai = new Set(decl(s, 'uniform').map((x) => x.split(' ')[1]));
    for (const m of s.matchAll(/\b(u[A-Z]\w*)\b/g)) assert.ok(khai.has(m[1]), `${ten}: dùng ${m[1]} mà chưa khai báo uniform`);
  }
});

test('bảng màu lửa: nóng hơn thì sáng hơn, đầu lạnh tối, đầu nóng gần trắng, đỏ trội ở giữa', () => {
  let trc = -1;
  for (let i = 0; i <= 20; i++) { const l = luma(mauLuaCPU(i / 20)); assert.ok(l >= trc - 1e-9, 'độ sáng phải không giảm theo nhiệt độ'); trc = l; }
  assert.ok(luma(mauLuaCPU(0)) < 0.05);
  const nong = mauLuaCPU(1); assert.ok(nong[0] > 0.95 && nong[1] > 0.95 && nong[2] > 0.9);
  const giua = mauLuaCPU(0.4); assert.ok(giua[0] > giua[1] && giua[1] > giua[2], 'giữa dải là cam: R > G > B');
  assert.deepEqual(mauLuaCPU(-5), mauLuaCPU(0)); assert.deepEqual(mauLuaCPU(9), mauLuaCPU(1));
});

test('NOISE và RAMP_LUA nằm trong shader mảnh cần chúng', () => {
  assert.ok(CAC_CAP.lua[1].includes(NOISE) && CAC_CAP.lua[1].includes(RAMP_LUA));
  assert.ok(CAC_CAP.khoi[1].includes(NOISE));
  assert.ok(CAC_CAP.vung[1].includes(NOISE) && CAC_CAP.vung[1].includes(RAMP_LUA));
});

test('nối dây: fxShader.js nhập đúng tên từ fxGlsl.js; trang xem thử có importmap three', () => {
  const sh = readFileSync(new URL('../js/scene/fxShader.js', import.meta.url), 'utf8');
  const m = sh.match(/import\s*\{([^}]*)\}\s*from\s*'\.\.\/world\/fxGlsl\.js'/); assert.ok(m, 'fxShader.js phải nhập từ fxGlsl.js');
  const ten = m[1].split(',').map((x) => x.trim()).filter(Boolean), gl = readFileSync(new URL('../js/world/fxGlsl.js', import.meta.url), 'utf8');
  for (const t of ten) assert.match(gl, new RegExp(`export\\s+(const|function)\\s+${t}\\b`), `fxGlsl.js không xuất ${t}`);
  for (const f of ['taoLuaMesh', 'taoKhoiMesh', 'taoHatPoints', 'taoVungMesh', 'capNhatThoiGian', 'huyFx']) assert.match(sh, new RegExp(`export\\s+function\\s+${f}\\b`), 'fxShader.js thiếu ' + f);
  assert.ok(existsSync(new URL('../fx-preview.html', import.meta.url)) && existsSync(new URL('../js/fxPreview.js', import.meta.url)), 'thiếu trang xem thử');
  const html = readFileSync(new URL('../fx-preview.html', import.meta.url), 'utf8');
  assert.match(html, /"three"\s*:\s*"https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.1\//); assert.match(html, /js\/fxPreview\.js/);
  const pv = readFileSync(new URL('../js/fxPreview.js', import.meta.url), 'utf8');
  assert.match(pv, /onShaderError/, 'trang xem thử phải hiện lỗi biên dịch shader');
  for (const f of ['taoLuaMesh', 'taoKhoiMesh', 'taoHatPoints', 'taoVungMesh']) assert.match(pv, new RegExp(f));
});
