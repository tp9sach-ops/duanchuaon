import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SPOTS, spotById, distTo, faceAngle, raySphere, pickSpot, createArrival } from '../js/world/spots.js';
import { findPath, free } from '../js/world/path.js';
import { createNavigator, walkStep } from '../js/world/worldLogic.js';
import { SPAWN, canStep, blocked } from '../js/world/layout.js';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('mỗi điểm đến khớp một <section id> trong index.html và đủ 6 chương', () => {
  assert.equal(SPOTS.length, 6);
  for (const s of SPOTS) assert.ok(html.includes('id="' + s.id + '"'), 'thiếu section #' + s.id);
  assert.equal(new Set(SPOTS.map((s) => s.id)).size, SPOTS.length);
  assert.equal(spotById('temple').label, 'Chánh điện');
  assert.equal(spotById('khong-co'), null);
});

test('điểm đứng đi được (không bị chặn, chừa sát tường) và nằm đúng chỗ', () => {
  for (const s of SPOTS) {
    assert.equal(blocked(s.stand.x, s.stand.z), false, s.id + ' bị chặn');
    assert.equal(free(s.stand.x, s.stand.z), true, s.id + ' sát vật cản');
    assert.ok(Math.hypot(s.stand.x - s.face[0], s.stand.z - s.face[2]) > 1, s.id + ' đứng đè lên vật');
  }
});

test('raySphere: trúng, trượt, ở phía sau, gốc tia trong khối cầu', () => {
  const o = { x: 0, y: 0, z: 10 }, d = { x: 0, y: 0, z: -1 };
  assert.ok(Math.abs(raySphere(o, d, [0, 0, 0], 2) - 8) < 1e-9);
  assert.equal(raySphere(o, d, [5, 0, 0], 2), null);
  assert.equal(raySphere(o, { x: 0, y: 0, z: 1 }, [0, 0, 0], 2), null);
  assert.equal(raySphere({ x: 0, y: 0, z: 0 }, d, [0, 0, 0], 2), 0);
});

test('pickSpot: lấy vật gần nhất dọc tia; xa quá thì bỏ', () => {
  // đứng ở sân, nhìn thẳng vào lư hương (0,1.6,-8): trúng "Lá bùa" trước, chánh điện ở sau
  const h = pickSpot({ x: 0, y: 1.6, z: 5 }, { x: 0, y: 0, z: -1 });
  assert.equal(h.spot.id, 'summary'); assert.ok(Math.abs(h.t - 10.8) < 0.05);
  assert.equal(pickSpot({ x: 0, y: 1.6, z: 5 }, { x: 0, y: 0, z: -1 }, 3), null);   // xa hơn 3 m thì bỏ
  assert.equal(pickSpot({ x: 0, y: 60, z: 5 }, { x: 0, y: 1, z: 0 }), null);
});

test('createArrival: tới nơi, bị kẹt, đang đi, hủy', () => {
  const s = spotById('summary'), a = createArrival();
  assert.equal(a.step({ x: 0, z: 40 }, true), null);                       // không có gì chờ
  a.start(s); assert.equal(a.step({ x: 0, z: 40 }, true), null);           // đang đi
  assert.deepEqual(a.step({ x: 0, z: 40 }, false), { failed: s });         // ngừng đi mà còn xa
  assert.equal(a.spot, null);
  a.start(s); assert.deepEqual(a.step({ x: 0.5, z: s.stand.z + 1 }, true), { arrived: s });   // trong bán kính
  a.start(s); a.cancel(); assert.equal(a.step({ x: 0, z: s.stand.z }, true), null);
});

test('faceAngle: đứng ở nam nhìn lên bắc (-z) thì quay ry = π; nhìn sang +x thì π/2', () => {
  const p = { x: 0, z: 0 };
  assert.ok(Math.abs(Math.abs(faceAngle(p, { face: [0, 0, -5] })) - Math.PI) < 1e-9);
  assert.ok(Math.abs(faceAngle(p, { face: [5, 0, 0] }) - Math.PI / 2) < 1e-9);
});

test('từ chỗ xuất hiện, tìm được đường tới MỌI điểm đứng và từng đoạn đều đi được', () => {
  for (const s of SPOTS) {
    const path = findPath(SPAWN.x, SPAWN.z, s.stand.x, s.stand.z);
    assert.ok(path && path.length, s.id + ': không có đường');
    const last = path[path.length - 1];
    assert.ok(Math.hypot(last.x - s.stand.x, last.z - s.stand.z) < 0.6, s.id + ': đường không tới đích');
    let a = { x: SPAWN.x, z: SPAWN.z };
    for (const b of path) {
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25)); let px = a.x, pz = a.z;
      for (let k = 1; k <= n; k++) { const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n; assert.ok(canStep(px, pz, x, z), s.id + ': đoạn xuyên vật cản'); px = x; pz = z; }
      a = b;
    }
  }
});

// Mô phỏng ĐI THẬT (walkStep + navigator + createArrival, 60 khung/giây) từ điểm xuất hiện tới từng chương, rồi từ chương này sang chương khác
function simulate(from, spot) {
  const P = { x: from.x, z: from.z }, nav = createNavigator(), arr = createArrival(), dt = 1 / 60;
  const path = findPath(P.x, P.z, spot.stand.x, spot.stand.z);
  if (path && path.length) nav.setPath(path); else nav.setTarget(spot.stand.x, spot.stand.z);
  arr.start(spot);
  for (let f = 0; f < 60 * 180; f++) {
    const d = nav.dir(P, dt);
    if (d) { const r = walkStep(P, d, dt, 4.4 * (d.mag ?? 1)); P.x = r.x; P.z = r.z; }
    const ev = arr.step(P, nav.active);
    if (ev) return { ...ev, frames: f, P };
  }
  return { timeout: true };
}
test('mô phỏng đi thật: từ chỗ xuất hiện tới từng chương đều "tới nơi" trong 3 phút', () => {
  for (const s of SPOTS) { const r = simulate(SPAWN, s); assert.ok(r.arrived, s.id + ': ' + JSON.stringify(r.failed ? 'bị kẹt' : r)); assert.ok(r.frames < 60 * 60, s.id + ': quá lâu'); }
});
test('mô phỏng đi thật: đi giữa mọi cặp chương (36 chuyến) đều tới nơi', () => {
  for (const a of SPOTS) for (const b of SPOTS) {
    if (a.id === b.id) continue;
    const r = simulate(a.stand, b); assert.ok(r.arrived, a.id + ' → ' + b.id + ' không tới được');
  }
});
