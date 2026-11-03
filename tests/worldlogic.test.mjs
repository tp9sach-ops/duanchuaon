import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/placements.js';
import { forwardOf, rightOf, facingOf, moveVector, joyVector, walkStep, createNavigator, camPose, dragCamera, zoomCamera, CAM_DIST, CAM_PITCH, WALK_SPEED } from '../js/world/worldLogic.js';
import { SPAWN, blocked, POND } from '../js/world/layout.js';

const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

test('yaw 0: đi lên là -z, sang phải là +x; yaw 90°: đi lên là -x', () => {
  assert.ok(near(forwardOf(0).z, -1) && near(forwardOf(0).x, 0)); assert.ok(near(rightOf(0).x, 1));
  assert.ok(near(forwardOf(Math.PI / 2).x, -1) && near(forwardOf(Math.PI / 2).z, 0, 1e-9));
});
test('phím: ngược nhau triệt tiêu, chéo được chuẩn hóa độ dài 1', () => {
  assert.equal(moveVector({ f: true, b: true }, null, 0).mag, 0);
  const d = moveVector({ f: true, r: true }, null, 0); assert.ok(near(Math.hypot(d.x, d.z), 1)); assert.ok(d.x > 0 && d.z < 0);
  const w = moveVector({ f: true }, null, 1.2); assert.ok(near(w.x, forwardOf(1.2).x) && near(w.z, forwardOf(1.2).z));
});
test('joystick: vùng chết, đẩy lên = đi lên, đẩy hết cỡ = 1', () => {
  assert.deepEqual(joyVector(3, 3, 60), { x: 0, y: 0 });
  const j = joyVector(0, -60, 60); assert.ok(near(j.y, -1) && near(j.x, 0));
  const v = moveVector({}, j, 0); assert.ok(v.z < -0.99);
  assert.ok(Math.hypot(joyVector(500, 500, 60).x, joyVector(500, 500, 60).y) <= 1 + 1e-9);
});
test('bước đi: tốc độ đúng, tường chặn, ao sen chặn, khung hình chậm không xuyên tường', () => {
  const a = walkStep({ x: 0, z: 54 }, { x: 0, z: -1 }, 0.5, WALK_SPEED); assert.ok(near(a.moved, 2, 1e-6) && near(a.z, 52, 1e-6));
  let p = { x: -20, z: 30 }; for (let i = 0; i < 10; i++) { const q = walkStep(p, { x: 0, z: 1 }, 0.1, WALK_SPEED); p = q; }
  assert.ok(p.z < 32.2 && !blocked(p.x, p.z), 'dừng trước tường tam quan: ' + p.z);
  const big = walkStep({ x: -20, z: 30 }, { x: 0, z: 1 }, 3, 7); assert.ok(!blocked(big.x, big.z), 'dt lớn vẫn không xuyên tường');
  let q = { x: 12, z: 14 }; for (let i = 0; i < 60; i++) q = walkStep(q, { x: -1, z: 0 }, 0.05, WALK_SPEED); assert.ok(!blocked(q.x, q.z));
  assert.ok(walkStep({ x: 0, z: 14 }, { x: 0, z: 0 }, 0.1, 4).y > 0.3, 'đứng trên cầu đá thì cao hơn mặt đất');
});
test('bấm-để-đi: tới nơi thì dừng; điểm trong ao (không tới được) thì tự bỏ khi kẹt', () => {
  const nav = createNavigator(); let p = { x: SPAWN.x, z: SPAWN.z };
  nav.setTarget(6, 44); assert.ok(nav.active);
  for (let i = 0; i < 400 && nav.active; i++) { const d = nav.dir(p, 0.02); if (d) p = walkStep(p, d, 0.02, 4.4); }
  assert.equal(nav.active, false); assert.ok(Math.hypot(p.x - 6, p.z - 44) < 0.5, 'đã tới: ' + JSON.stringify(p));
  const n2 = createNavigator(); let r = { x: 12, z: 14 }; n2.setTarget(POND.x + 3, POND.z);
  let steps = 0; while (n2.active && steps++ < 600) { const d = n2.dir(r, 0.02); if (d) r = walkStep(r, d, 0.02, 4.4); }
  assert.ok(steps < 600, 'phải tự bỏ khi kẹt'); assert.ok(!blocked(r.x, r.z));
});
test('camera theo sau: nằm phía sau người, nhìn vào ngang vai, cách đúng khoảng', () => {
  const c = camPose({ x: 5, y: 0, z: 10 }, 0, 0.36, 6.6);
  assert.ok(c.pos.z > c.look.z && near(c.pos.x, 5)); assert.ok(near(Math.hypot(c.pos.x - c.look.x, c.pos.y - c.look.y, c.pos.z - c.look.z), 6.6, 1e-9));
  assert.ok(near(c.look.y, 1.1)); assert.ok(camPose({ x: 0, y: 1.5, z: 0 }, 1, 0.3, 5).look.y > 2.5);
});
test('kéo/zoom camera bị kẹp trong giới hạn', () => {
  const d = dragCamera(0, 0.3, 100, 5000); assert.ok(d.yaw < 0 && d.pitch === CAM_PITCH.max);
  assert.equal(dragCamera(0, 0.3, 0, -5000).pitch, CAM_PITCH.min);
  assert.equal(zoomCamera(6, 1e6), CAM_DIST.max); assert.equal(zoomCamera(6, -1e6), CAM_DIST.min);
});
test('hướng nhìn nhân vật khớp quy ước ry (0 = +z)', () => {
  assert.ok(near(facingOf(0, 1), 0)); assert.ok(near(facingOf(1, 0), Math.PI / 2)); assert.ok(near(Math.abs(facingOf(0, -1)), Math.PI));
});
