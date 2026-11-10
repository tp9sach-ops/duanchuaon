import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RANGE, khiDamage, tickCd, dirOf, aim, planWave, wavePoint, swingPose, SWING_S, inAimRange } from '../js/world/conKhi.js';
import { dockButtons } from '../js/world/dock.js';

test('Côn Khí Trảm: sát thương theo sức mạnh, hồi chiêu không âm', () => {
  assert.equal(khiDamage(0), 45); assert.equal(khiDamage(6), 50); assert.equal(khiDamage('x'), 45);
  assert.equal(tickCd(3, 1), 2); assert.equal(tickCd(0.2, 5), 0);
});
test('hướng: ry = 0 là +z', () => { const d = dirOf(0); assert.ok(Math.abs(d.dx) < 1e-9 && Math.abs(d.dz - 1) < 1e-9); });
test('tự ngắm: yêu quái trong tầm thì quay về nó; xa hoặc đã chết thì giữ hướng', () => {
  const boss = { x: 10, z: 0 };
  assert.ok(Math.abs(aim({ x: 0, z: 0 }, 0, boss).ry - Math.PI / 2) < 1e-9);
  assert.equal(aim({ x: 0, z: 0 }, 0.3, { x: 100, z: 0 }).aimed, false);
  assert.equal(aim({ x: 0, z: 0 }, 0.3, { x: 5, z: 0, dead: true }).ry, 0.3);
  assert.equal(inAimRange({ x: 0, z: 0 }, { x: RANGE + 1.5, z: 0 }), true);
  assert.equal(inAimRange({ x: 0, z: 0 }, { x: RANGE + 1.6, z: 0 }), false);
});
test('kế hoạch luồng khí: trúng thì dừng ở mép thân, trượt thì bay hết tầm', () => {
  const hit = planWave(0, 0, 0, { x: 0, z: 10 }); assert.ok(hit.hit && hit.dist < 10 && hit.dist > 5);
  const miss = planWave(0, 0, 0, { x: 20, z: 5 }); assert.equal(miss.hit, false); assert.equal(miss.dist, RANGE);
  assert.equal(planWave(0, 0, 0, null).hit, false);
  const w = planWave(0, 0, 0, { x: 0, z: 10 }); assert.equal(wavePoint(w, 1).z, w.dist); assert.equal(wavePoint(w, 0).z, 0);
});
test('tư thế vung: ẩn ngoài thời gian vung, hiện côn giữa lúc vung', () => {
  assert.equal(swingPose(-1).vis, 0); assert.equal(swingPose(SWING_S + 1).vis, 0); assert.equal(swingPose(0.25).vis, 1);
});
test('nút Chém khí chỉ hiện khi có yêu quái ở làng (và có ngữ cảnh khi)', () => {
  const ids = (k) => dockButtons(k).map((b) => b.id);
  assert.ok(ids({ free: true, yq: { active: true }, khi: { cd: 0 } }).includes('chemkhi'));
  assert.ok(!ids({ free: true, yq: { active: false }, khi: { cd: 0 } }).includes('chemkhi'));
  assert.ok(!ids({ free: true, yq: { active: true } }).includes('chemkhi'));
  assert.equal(dockButtons({ free: true, yq: { active: true }, khi: { cd: 2 } }).find((b) => b.id === 'chemkhi').wait, true);
});
