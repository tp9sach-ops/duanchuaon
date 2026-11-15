// Phiên 202 (mục 2 hiệu ứng 3D V2): toán thuần của 6 chiêu Hỏa. Hình ảnh thật chưa kiểm được (không có WebGL).
import test from 'node:test';
import assert from 'node:assert/strict';
import { HOA_KIEU, kieuHoa, demHoa, h01, tuoiHat, songRong, thienThach, nuHoa, hoiRong } from '../js/world/hoaFxMath.js';

test('6 chiêu Hỏa có 6 kiểu hình khác nhau; chiêu lạ và tên đặc biệt trả null', () => {
  const ids = ['hoa_1', 'hoa_2', 'hoa_3', 'hoa_liethoa_4', 'hoa_hoalong_4', 'hoa_tuyet'];
  assert.deepEqual(Object.keys(HOA_KIEU), ids);
  assert.deepEqual(ids.map(kieuHoa), ['sao_choi', 'ao_lua', 'rong_lua', 'thien_thach', 'long_tuc', 'sen_lua']);
  assert.equal(new Set(ids.map(kieuHoa)).size, 6);
  for (const x of ['kim_1', 'thuy_1', 'toString', 'constructor', '', undefined]) assert.equal(kieuHoa(x), null, String(x));
});

test('số khối/hạt tăng theo bậc máy; bậc lạ dùng bậc vừa; sen lửa máy mạnh có 2 vòng cánh', () => {
  for (const kieu of Object.values(HOA_KIEU)) {
    const a = demHoa(kieu, 'yeu'), b = demHoa(kieu, 'vua'), c = demHoa(kieu, 'cao');
    assert.ok(a.hat < b.hat && b.hat < c.hat, kieu); assert.ok(a.mesh <= b.mesh && b.mesh <= c.mesh, kieu); assert.ok(a.mesh >= 2, kieu);
    assert.deepEqual(demHoa(kieu, 'zzz'), b, kieu);
  }
  assert.deepEqual([demHoa('sen_lua', 'yeu').vong, demHoa('sen_lua', 'vua').vong, demHoa('sen_lua', 'cao').vong], [1, 1, 2]);
  assert.equal(demHoa('sen_lua', 'vua').mesh, 9);   // 9 cánh
  assert.deepEqual(demHoa('khong_co', 'vua'), { mesh: 0, hat: 0, khoi: 0, vong: 0, trong: 0 });
});

test('h01 và tuổi hạt: trong [0,1), cùng đầu vào cho cùng kết quả', () => {
  for (let i = 0; i < 500; i++) { const v = h01(i, i % 9), a = tuoiHat(i, i * 0.137, 0.9); assert.ok(v >= 0 && v < 1, 'h01 ' + i); assert.ok(a >= 0 && a < 1, 'tuoi ' + i); assert.equal(h01(i, 3), h01(i, 3)); }
  assert.ok(tuoiHat(3, -5.5, 0.7) >= 0);   // t âm vẫn hợp lệ
});

test('rồng lửa: đầu ở pz, các đốt nối đuôi phía sau, nhỏ dần, hữu hạn; mới phát thì dồn lại', () => {
  const n = 12;
  for (const pz of [0, 1, 5, 12]) for (const t of [0, 0.7, 3.3]) {
    let prev = null;
    for (let i = 0; i < n; i++) { const q = songRong(i, t, pz, n); for (const k of ['x', 'y', 'z', 's']) assert.ok(Number.isFinite(q[k]), k); if (i === 0) assert.equal(q.z, pz); if (prev) { assert.ok(q.z < prev.z, 'z giảm dần'); assert.ok(q.s < prev.s, 's nhỏ dần'); } prev = q; }
    assert.ok(prev.s >= 0.37 && prev.s <= 0.39);
  }
  assert.ok(songRong(0, 0, 0, 12).z - songRong(11, 0, 0, 12).z < songRong(0, 0, 12, 12).z - songRong(11, 0, 12, 12).z);
});

test('mưa thiên thạch: điểm rơi trong 0,85·R, cả trận kết thúc trước 0,97 s, cố định theo viên', () => {
  for (const m of [4, 6, 9]) for (const R of [3, 8]) for (let j = 0; j < m; j++) {
    const s = thienThach(j, m, R); assert.ok(s.x * s.x + s.z * s.z <= (0.85 * R) ** 2 + 1e-9, 'trong vòng');
    assert.ok(s.delay >= 0 && s.delay + s.fall + s.burst <= 0.97, 'kết thúc sớm'); assert.ok(s.dx < 0 && s.h > 0);
    assert.deepEqual(s, thienThach(j, m, R));
  }
  assert.ok(thienThach(5, 6, 8).delay > thienThach(0, 6, 8).delay);
});

test('sen lửa nở 0→1 đơn điệu; hơi thở rồng dài ra đơn điệu, chặn bởi reach và max', () => {
  assert.equal(nuHoa(-1), 0); assert.equal(nuHoa(0), 0); assert.equal(nuHoa(0.7), 1); assert.equal(nuHoa(9), 1);
  let p = -1; for (let a = 0; a <= 1; a += 0.05) { const v = nuHoa(a); assert.ok(v >= p); p = v; }
  assert.equal(hoiRong(0, 10), 0); assert.equal(hoiRong(1, 10), 8); assert.equal(hoiRong(1, 3), 3); assert.equal(hoiRong(1, 10, 12), 10);
  p = -1; for (let a = 0; a <= 0.4; a += 0.02) { const v = hoiRong(a, 10); assert.ok(v >= p); p = v; }
});
