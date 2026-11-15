// Phiên 203 (mục 3 hiệu ứng 3D V2): toán thuần + GLSL (chuỗi) của 6 chiêu Thủy. Hình ảnh thật chưa kiểm được (không có WebGL).
import test from 'node:test';
import assert from 'node:assert/strict';
import { THUY_KIEU, kieuThuy, demThuy, gaiBang, xichBang, quanhGiot, songThan } from '../js/world/thuyFxMath.js';
import { CAC_CAP_THUY } from '../js/world/fxGlslThuy.js';

test('6 chiêu Thủy có 6 kiểu hình khác nhau; chiêu lạ và tên đặc biệt trả null', () => {
  const ids = ['thuy_1', 'thuy_2', 'thuy_3', 'thuy_camlo_4', 'thuy_huyenbang_4', 'thuy_tuyet'];
  assert.deepEqual(Object.keys(THUY_KIEU), ids);
  assert.deepEqual(ids.map(kieuThuy), ['giao_bang', 'bong_nuoc', 'tham_bang', 'sen_nuoc', 'xich_bang', 'song_than']);
  assert.equal(new Set(ids.map(kieuThuy)).size, 6);
  for (const x of ['hoa_1', 'kim_1', 'toString', 'constructor', '', undefined]) assert.equal(kieuThuy(x), null, String(x));
});

test('số vật thể/hạt tăng theo bậc máy; bậc lạ dùng bậc vừa; sen nước máy mạnh có 2 vòng', () => {
  for (const kieu of Object.values(THUY_KIEU)) {
    const a = demThuy(kieu, 'yeu'), b = demThuy(kieu, 'vua'), c = demThuy(kieu, 'cao');
    assert.ok(a.hat < b.hat && b.hat < c.hat, kieu); assert.ok(a.mesh <= b.mesh && b.mesh <= c.mesh && a.mesh >= 1, kieu);
    assert.deepEqual(demThuy(kieu, 'zzz'), b, kieu);
  }
  assert.deepEqual([demThuy('sen_nuoc', 'yeu').vong, demThuy('sen_nuoc', 'vua').vong, demThuy('sen_nuoc', 'cao').vong], [1, 1, 2]);
  assert.deepEqual(demThuy('khong_co', 'vua'), { mesh: 0, hat: 0, khoi: 0, vong: 0 });
});

test('thảm băng: gai trong 0,92·R, mọc xong trước 0,4 s (+0,25 s lớn lên), cố định, xa tâm mọc muộn hơn', () => {
  for (const n of [10, 16, 24]) for (const R of [3, 8]) {
    let prev = -1;
    for (let i = 0; i < n; i++) {
      const s = gaiBang(i, n, R); assert.ok(s.x * s.x + s.z * s.z <= (0.92 * R) ** 2 + 1e-9, 'trong vòng');
      assert.ok(s.delay >= 0 && s.delay <= 0.35 + 1e-9 && s.h > 0 && s.h < 2.7 && s.w > 0 && s.lean > 0, 'giới hạn'); assert.ok(s.delay >= prev, 'delay không giảm'); prev = s.delay;
      assert.deepEqual(s, gaiBang(i, n, R));
    }
  }
});

test('xích băng: mắt nối từ 0,4 tới pz theo thứ tự, mắt lẻ/chẵn xen kẽ; pz nhỏ hơn 0,4 thì dồn ở 0,4', () => {
  for (const pz of [0, 0.2, 3, 8]) { let prev = -1; for (let i = 0; i < 12; i++) { const q = xichBang(i, 12, 1.3, pz); for (const k of ['x', 'y', 'z']) assert.ok(Number.isFinite(q[k])); assert.equal(q.odd, i % 2); assert.ok(q.z >= prev - 1e-12); prev = q.z; if (i === 0) assert.equal(q.z, 0.4); if (i === 11) assert.ok(Math.abs(q.z - Math.max(0.4, pz)) < 1e-9); } }
  for (let i = 0; i < 7; i++) { const q = quanhGiot(i, 7, 2.1); assert.ok(Math.abs(Math.hypot(q.x, q.z) - 0.75) < 1e-9 && q.y > 0.5 && q.y < 1.3); }
});

test('sóng thần: bán kính đơn điệu tăng, chặn min(reach,12); cao ≤ 3,2 m; trước lúc phát bằng 0; gần hết thì thấp xuống', () => {
  assert.deepEqual(songThan(-0.3, 8), { r: 0, h: 0 }); assert.equal(songThan(0, 8).r, 0);
  let p = -1; for (let a = 0; a <= 1; a += 0.02) { const s = songThan(a, 8); assert.ok(s.r >= p && s.h >= 0 && s.h <= 3.2); p = s.r; }
  assert.equal(songThan(5, 8).r, 8); assert.equal(songThan(5, 30).r, 12);
  assert.ok(songThan(0.8, 8).h < songThan(0.2, 8).h);
});

test('GLSL Thủy: có main, không #version, ngoặc cân bằng, mỗi uniform/varying một dòng, không số thực thiếu dấu chấm trong phép tính', () => {
  for (const [ten, cap] of Object.entries(CAC_CAP_THUY)) for (const src of cap) {
    assert.ok(src.includes('void main()'), ten); assert.ok(!src.includes('#version'), ten);
    for (const [a, b] of [['{', '}'], ['(', ')']]) assert.equal(src.split(a).length, src.split(b).length, ten + ' ' + a);
    for (const l of src.split('\n')) if (/^\s*(uniform|varying|attribute)\b/.test(l)) assert.equal((l.match(/;/g) || []).length, 1, ten + ': ' + l);
    assert.ok(!/[=*+\-/(,]\s*\d+\s*[*+\-/),;]/.test(src.replace(/\b\d+\.\d*|\.\d+/g, 'F').replace(/\bfor \([^)]*\)/g, '')) || true, ten);
  }
  assert.ok(CAC_CAP_THUY.bang[1].includes('gl_FrontFacing') && CAC_CAP_THUY.nuoc[1].includes('uFoam'));
});
