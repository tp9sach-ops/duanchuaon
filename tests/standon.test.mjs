import test from 'node:test';
import assert from 'node:assert/strict';
import { addCircle, addDeck, blocked, floorAt } from '../js/world/layout.js';
import { walkStep } from '../js/world/worldLogic.js';
import { createJump } from '../js/world/skills.js';
import { floorRel, landingAt } from '../js/world/standOn.js';
import { TREES } from '../js/world/placements.js';
import { registerGlbTrees, TEAHOUSE } from '../js/world/landscape.js';
import '../js/world/standTops.js';
import { BAO_THAP } from '../js/world/outside.js';

// vật thử: trụ đá r=1 cao 2,5 m ở khoảng đất trống phía Đông sân chùa
addCircle({ x: 66, z: -30, r: 1, top: 2.5 });

test('floorRel: mặt đứng chỉ hiện khi chân đã ở gần/trên mặt vật', () => {
  assert.equal(floorRel(66, -30, 0).fl, 0);
  assert.equal(floorRel(66, -30, 1.8).fl, 0, 'còn thấp hơn mặt vật quá 0,6 m');
  assert.equal(floorRel(66, -30, 2.0).fl, 2.5);
  assert.equal(floorRel(66, -30, 1.0, 1.0).fl, 2.5, 'nhìn trước quãng đang rơi');
  assert.equal(floorRel(10, 50, 3).fl, 0, 'chỗ trống: không có mặt đứng');
  assert.equal(floorRel(66, -30, NaN, NaN).fl, 0);
});

test('vật có top: thấp hơn thì chặn, đủ cao thì bay qua phía trên', () => {
  assert.equal(blocked(66, -30, 0), true);
  assert.equal(blocked(66, -30, 1.5), true);
  assert.equal(blocked(66, -30, 2.5), false);
});

test('landingAt: lao/lướt dừng trước vật khi chân thấp, đi qua khi chân cao; feetH bỏ trống = như cũ', () => {
  const low = landingAt(60, -30, Math.PI / 2, 8), none = landingAt(60, -30, Math.PI / 2, 8, 0), high = landingAt(60, -30, Math.PI / 2, 8, 2.6);
  assert.ok(low.dist < 6 && low.x <= 65.01, 'dừng trước trụ: ' + low.x);
  assert.deepEqual(low, none);
  assert.equal(high.dist, 8);
  assert.ok(landingAt(60, -30, 0, NaN).dist === 0 && landingAt(60, -30, 0, 999, NaN).dist <= 30);
});

test('walkStep có feetH: chân thấp trượt/dừng ở trụ, chân cao đi xuyên qua phía trên', () => {
  const run = (feetH) => { let p = { x: 60, z: -30 }; for (let i = 0; i < 90; i++) { const r = walkStep(p, { x: 1, z: 0 }, 1 / 60, 7, feetH); p = { x: r.x, z: r.z }; } return p.x; };
  assert.ok(run(0) < 65, 'không xuyên trụ: ' + run(0));
  assert.ok(run(2.6) > 69, 'bay qua phía trên: ' + run(2.6));
});

test('cú nhảy đáp lên mặt đứng, đứng yên, bước ra mép thì rơi', () => {
  const j = createJump(); assert.equal(j.start(4), true);
  let peak = 0; for (let i = 0; i < 600 && j.air; i++) peak = Math.max(peak, j.step(1 / 60, 2));
  assert.ok(peak > 3.7 && peak < 4.1, 'lên qua mặt đứng tới đỉnh: ' + peak);
  assert.equal(j.air, false); assert.equal(j.standing, true); assert.equal(j.y, 2); assert.equal(j.vy, 0);
  for (let i = 0; i < 30; i++) assert.equal(j.step(1 / 60, 2), 2);
  j.step(1 / 60, 0); assert.equal(j.air, true); assert.equal(j.standing, false);
  for (let i = 0; i < 600 && j.air; i++) j.step(1 / 60, 0);
  assert.equal(j.air, false); assert.equal(j.y, 0); assert.equal(j.standing, false);
});

test('đang đứng trên mặt cao thì nhảy tiếp từ độ cao đó rồi đáp lại', () => {
  const j = createJump(); j.start(4); for (let i = 0; i < 600 && j.air; i++) j.step(1 / 60, 2);
  assert.equal(j.standing, true);
  assert.equal(j.start(1.5), true); assert.equal(j.standing, false); assert.ok(j.apex >= 3.4);
  let peak = 0; for (let i = 0; i < 600 && j.air; i++) peak = Math.max(peak, j.step(1 / 60, 2));
  assert.ok(peak > 3.3 && peak < 3.6, 'đỉnh ~3,5 m: ' + peak); assert.equal(j.y, 2); assert.equal(j.standing, true);
  j.reset(); assert.equal(j.y, 0); assert.equal(j.standing, false);
});

test('bay lướt hạ xuống mặt đứng: dừng đúng mặt, không lún', () => {
  const j = createJump(); j.start(4); j.step(0.2, 0); assert.equal(j.glide(1.4), true);
  for (let i = 0; i < 1200 && j.air; i++) j.step(1 / 60, 2);
  assert.equal(j.air, false); assert.equal(j.y, 2); assert.equal(j.standing, true);
});

test('mặc định không có mặt đứng: cú nhảy cũ giữ nguyên (đáp về 0)', () => {
  const j = createJump(); j.start(1.1); for (let i = 0; i < 300 && j.air; i++) j.step(1 / 60);
  assert.equal(j.y, 0); assert.equal(j.air, false); assert.equal(j.standing, false);
});

test('standTops + cảnh quan: bảo tháp, mái trà thất, cây sân, cây GLB đứng được; thấp hơn vẫn chặn', () => {
  assert.equal(blocked(BAO_THAP.cx, BAO_THAP.cz, 0), true); assert.equal(blocked(BAO_THAP.cx, BAO_THAP.cz, 14), false); assert.equal(floorAt(BAO_THAP.cx, BAO_THAP.cz, 13.5), 14);
  assert.equal(blocked(TEAHOUSE.cx, TEAHOUSE.cz, 0), true); assert.equal(blocked(TEAHOUSE.cx, TEAHOUSE.cz, 3.8), false); assert.equal(floorAt(TEAHOUSE.cx, TEAHOUSE.cz, 3.4), 3.8);
  const t = TREES[0]; assert.equal(blocked(t.x, t.z, 0), true); assert.equal(blocked(t.x, t.z, 7.4), false);
  registerGlbTrees([{ model: 'gn', x: -50, z: 20, s: 1 }]);
  assert.equal(blocked(-50, 20, 0), true); assert.equal(blocked(-50, 20, 9), false); assert.equal(floorAt(-48.8, 20, 3.0), 3.4, 'tán cây GLB là mặt đứng');
  addDeck({ x: 70, z: -40, r: 2, top: 3 }); assert.equal(blocked(70, -40, 0), false, 'tán (deck) không chắn đường đi bên dưới'); assert.equal(floorAt(70, -40, 2.5), 3);
});
