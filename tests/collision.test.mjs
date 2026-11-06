// Phiên 29: va chạm theo THÂN người (không còn là một điểm), bậc thềm rời, thành bậc, mép nền chính điện. Thuần hàm, không three.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/placements.js';
import { bodyBlocked, moveBody, canStepBody, PLAYER_R, STAIRS, STAIR_RAILS, blocked, groundY, region, HALL, CIRCLES, RECTS, CENSER, SPAWN } from '../js/world/layout.js';
import { walkStep, WALK_SPEED, RUN_SPEED, MAX_SUBSTEP } from '../js/world/worldLogic.js';
import { BUILDINGS } from '../js/world/placements.js';

const EPS = 1e-6;
/** Đi liên tục `frames` khung theo hướng v; trả vị trí cuối. */
function walk(p, v, frames, dt, speed) { let q = { x: p.x, z: p.z }; for (let i = 0; i < frames; i++) { const r = walkStep(q, v, dt, speed); q = { x: r.x, z: r.z }; } return q; }

test('bán kính thân nhỏ hơn khoảng chừa của tìm đường và bước con nhỏ hơn bán kính thân', () => {
  assert.ok(PLAYER_R < 0.45 && PLAYER_R > 0.2); assert.ok(MAX_SUBSTEP < PLAYER_R);
  assert.equal(bodyBlocked(SPAWN.x, SPAWN.z), false);
});

test('bậc thềm: mặt đi theo đúng 5 bậc đá rời (không còn dốc nằm dưới bậc), tăng dần tới mặt sàn', () => {
  const s = HALL.step;
  assert.equal(STAIRS.n, 5); assert.ok(Math.abs(STAIRS.run - 0.88) < 1e-9, 'bậc sâu 0,88 m như chanhdien.js');
  for (let i = 0; i < 5; i++) { const z = s.z1 - STAIRS.run * (i + 0.5); assert.equal(region(0, z), 'step'); assert.ok(Math.abs(groundY(0, z) - (i + 1) * HALL.h / 5) < 1e-9, 'bậc ' + i); }
  assert.equal(groundY(0, s.z1 + 0.05), 0, 'ngoài bậc đầu là sân');
  assert.ok(Math.abs(groundY(0, HALL.platZ1 + 0.01) - HALL.h) < 1e-9, 'bậc cuối bằng sàn điện');
  let prev = -1; for (let z = s.z1; z >= HALL.platZ1; z -= 0.05) { const y = groundY(0, z); assert.ok(y >= prev - 1e-9, 'không hạ xuống giữa cầu thang'); prev = y; }
  assert.ok(groundY(0, -15.5) > 0 && groundY(0, -15.5) < HALL.h);
});

test('thành bậc và dải nền đá hai bên là vật cản; lối giữa cầu thang và sàn điện vẫn đi được', () => {
  for (const r of STAIR_RAILS) assert.equal(blocked((r.x0 + r.x1) / 2, -15.5), true);
  assert.equal(blocked(0, -15.5), false); assert.equal(blocked(0, -30), false);
  assert.equal(blocked(21.8, -30), true); assert.equal(blocked(-21.8, -25), true, 'dải sát nền: khối đá');
  assert.equal(blocked(10, -12), false, 'sân trước nền vẫn đi được');
});

test('đi sát thành bậc: thân dừng cách thành đúng bán kính, không lún vào đá', () => {
  const p = walk({ x: 3, z: -15 }, { x: 1, z: 0 }, 100, 0.05, WALK_SPEED);
  const inner = Math.min(...STAIR_RAILS.filter((r) => r.x0 > 0).map((r) => r.x0));
  assert.ok(p.x <= inner - PLAYER_R + EPS, 'x=' + p.x); assert.ok(p.x > inner - PLAYER_R - 0.25, 'có đi tới sát: ' + p.x);
  const q = walk({ x: -3, z: -15 }, { x: -1, z: 0 }, 100, 0.05, WALK_SPEED); assert.ok(q.x >= -inner + PLAYER_R - EPS, 'bên trái x=' + q.x);
});

test('không leo lên nền chính điện từ bên hông; thân không gác lên mép nền; lên bằng cầu thang giữa thì được', () => {
  const a = walk({ x: 10, z: -12 }, { x: 0, z: -1 }, 100, 0.05, WALK_SPEED);
  assert.equal(region(a.x, a.z), 'ground'); assert.ok(a.z >= HALL.platZ1 + PLAYER_R - EPS, 'z=' + a.z);
  const b = walk({ x: 3, z: -12 }, { x: 0, z: -1 }, 200, 0.05, WALK_SPEED);   // x=3 để tránh lư hương
  assert.ok(b.z < -20 && b.z > -45, 'đã lên điện: ' + b.z); assert.ok(Math.abs(groundY(b.x, b.z) - HALL.h) < 1e-9);
});

test('cột chính điện và lư hương: thân dừng cách mặt vật đúng bán kính thân', () => {
  const c = CIRCLES.find((q) => q.x === 2.5 && q.z === -21.5), p = walk({ x: 2.5, z: -18 }, { x: 0, z: -1 }, 100, 0.05, WALK_SPEED);
  assert.ok(Math.hypot(p.x - c.x, p.z - c.z) >= c.r + PLAYER_R - EPS, 'cột: ' + JSON.stringify(p));
  const l = walk({ x: 3.5, z: -8 }, { x: -1, z: 0 }, 100, 0.05, WALK_SPEED);
  assert.ok(Math.hypot(l.x - CENSER.x, l.z - CENSER.z) >= 1.9 + PLAYER_R - EPS, 'lư hương: ' + JSON.stringify(l));
});

test('Nhà Tổ / Nhà Khách: đi thẳng vào tường nhà (đi bộ, chạy, khung hình rất chậm) đều dừng ở mặt tường, không xuyên', () => {
  for (const b of BUILDINGS) {
    const zFace = b.cz + b.d / 2, start = { x: b.cx, z: zFace + 4 };
    for (const [dt, sp] of [[0.016, WALK_SPEED], [0.016, RUN_SPEED], [0.5, RUN_SPEED], [3, RUN_SPEED]]) {
      const p = walk(start, { x: 0, z: -1 }, Math.ceil(6 / dt), dt, sp);
      assert.ok(p.z >= zFace + PLAYER_R - EPS, `${b.id} dt=${dt} sp=${sp}: z=${p.z}`);
    }
    const side = walk({ x: b.cx + b.w / 2 + 3, z: b.cz }, { x: -1, z: 0 }, 400, 0.05, RUN_SPEED);
    assert.ok(side.x >= b.cx + b.w / 2 + PLAYER_R - EPS, b.id + ' hông: x=' + side.x);
  }
});

test('góc nhà: đi chéo vào góc thì trượt dọc tường, thân không lọt vào trong', () => {
  const b = BUILDINGS[0], x1 = b.cx + b.w / 2, z1 = b.cz + b.d / 2;
  let q = { x: x1 + 2, z: z1 + 2 };
  for (let i = 0; i < 300; i++) { const r = walkStep(q, { x: -0.7071, z: -0.7071 }, 0.016, RUN_SPEED); q = { x: r.x, z: r.z }; assert.equal(bodyBlocked(q.x, q.z), false, `khung ${i}: ${JSON.stringify(q)}`); }
  for (const r of RECTS) assert.equal(q.x > r.x0 && q.x < r.x1 && q.z > r.z0 && q.z < r.z1, false);
});

test('qua cổng giữa Tam quan và cầu đá ao sen bằng thân người vẫn lọt', () => {
  const g = walk({ x: 0, z: 40 }, { x: 0, z: -1 }, 100, 0.05, WALK_SPEED); assert.ok(g.z < 30, 'qua cổng: ' + g.z);
  const h = walk({ x: 8.1, z: 40 }, { x: 0, z: -1 }, 40, 0.05, WALK_SPEED); assert.ok(h.z < 33, 'qua cổng phụ: ' + h.z);
  const b = walk({ x: 0, z: 26 }, { x: 0, z: -1 }, 130, 0.05, WALK_SPEED); assert.ok(b.z < 1, 'hết cầu đá: ' + b.z);
});

test('đang kẹt sát vật cản (vừa dịch chuyển tới) vẫn bước ra được, không đứng chết', () => {
  const b = BUILDINGS[0], x = b.cx, z = b.cz + b.d / 2 + 0.1;   // ngoài tường 0,1 m: tâm chưa chạm nhưng thân đã chạm
  assert.equal(blocked(x, z), false); assert.equal(bodyBlocked(x, z), true);
  const p = walk({ x, z }, { x: 0, z: 1 }, 60, 0.05, WALK_SPEED); assert.ok(p.z > z + 3, 'đã bước ra: ' + p.z); assert.equal(bodyBlocked(p.x, p.z), false);
  assert.deepEqual(moveBody(x, z, 0, 0.1), { x, z: z + 0.1 });
});

test('canStepBody chặn bước làm thân chạm vật; bước tự do vẫn cho qua', () => {
  assert.equal(canStepBody(0, 54, 0, 53.8), true); assert.equal(canStepBody(0, -9, 0, -8.5), false, 'lư hương');
});
