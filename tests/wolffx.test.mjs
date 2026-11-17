// Phiên 224 (mục 1): chuyển động sói khí vàng của Gậy tre. Phiên 227: sát thương cú ngoạm + bầy chó chạy theo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WOLF, wolfRange, headingTo, wolfPose, bitePoint, biteTargets, biteDamages } from '../js/world/wolfMath.js';
import { applyBite } from '../js/ui/wolfHit.js';
import { YQ } from '../js/world/yeuquai.js';
import { DOGS, wrapAngle, slotWorld, followStep, turnToward, fadeStep, gaitRate } from '../js/world/dogMath.js';

test('wolfRange: kẹp trong khoảng, không mục tiêu thì tầm vung không khí', () => {
  assert.equal(wolfRange(0), WOLF.rangeAir); assert.equal(wolfRange(NaN), WOLF.rangeAir); assert.equal(wolfRange(-4), WOLF.rangeAir);
  assert.equal(wolfRange(1), WOLF.rangeMin); assert.equal(wolfRange(99), WOLF.rangeMax); assert.equal(wolfRange(5), 5);
});
test('headingTo: đúng hướng, trùng điểm thì giữ hướng cũ', () => {
  assert.ok(Math.abs(headingTo({ x: 0, z: 0 }, { x: 1, z: 0 }) - Math.PI / 2) < 1e-9);
  assert.equal(headingTo({ x: 1, z: 1 }, { x: 1, z: 1 }, 0.7), 0.7); assert.equal(headingTo(null, { x: 1, z: 1 }, 0.3), 0.3);
});
test('wolfPose: hiện → vồ tới đúng tầm → ngoạm → tan, hết đời thì done', () => {
  const R = 6, a = wolfPose(0, R); assert.equal(a.done, false); assert.ok(a.vis < 0.01);
  const mid = wolfPose(WOLF.life * 0.4, R); assert.ok(mid.dist > 0.35 && mid.dist < R); assert.ok(mid.up > 0); assert.equal(mid.vis, 1);
  const bite = wolfPose(WOLF.life * 0.68, R); assert.equal(bite.bite, true); assert.equal(bite.dist, R);
  const fade = wolfPose(WOLF.life * 0.9, R); assert.ok(fade.vis < 1 && fade.vis > 0);
  assert.equal(wolfPose(WOLF.life, R).done, true); assert.equal(wolfPose(99, R).vis, 0);
  for (const bad of [NaN, undefined, 'x', -3]) assert.equal(wolfPose(bad, R).done, false);
});

// ---- Phiên 227: sát thương cú ngoạm ----
test('Phiên 227: sói to hơn bản đầu (1,7 → lớn hơn) và có số sát thương', () => {
  assert.ok(WOLF.scale > 1.7); assert.ok(WOLF.dmgMul > 0); assert.ok(WOLF.biteReach > 0); assert.ok(WOLF.biteMax >= 1); assert.ok(WOLF.splashPct > 0 && WOLF.splashPct <= 1);
});
test('bitePoint: chỗ đứng + tầm theo hướng; số lạ thì dùng mặc định', () => {
  const p = bitePoint({ x: 1, z: 2 }, 0, 5); assert.ok(Math.abs(p.x - 1) < 1e-9 && Math.abs(p.z - 7) < 1e-9);
  const e = bitePoint({ x: 0, z: 0 }, Math.PI / 2, 4); assert.ok(Math.abs(e.x - 4) < 1e-9 && Math.abs(e.z) < 1e-9);
  const bad = bitePoint(null, NaN, -1); assert.ok(Math.abs(bad.z - WOLF.rangeAir) < 1e-9 && bad.x === 0);
});
test('biteTargets: chỉ quái còn sống trong tầm ăn, gần nhất trước, tối đa biteMax; bóng quái bị bỏ', () => {
  const mons = [{ uid: 'a', x: 0, z: 5, oan: 9 }, { uid: 'b', x: 2, z: 5, oan: 9 }, { uid: 'c', x: 40, z: 40, oan: 9 }, { uid: 'd', x: 0, z: 5.5, oan: 0 }, { uid: 'e', x: 0, z: 5, oan: 9, ghost: true }, { uid: 'f', x: 0, z: 6, oan: 9 }, { uid: 'g', x: 1, z: 6, oan: 9 }];
  const t = biteTargets({ x: 0, z: 5 }, mons, () => 0.5);
  assert.deepEqual(t.map((m) => m.uid), ['a', 'f', 'g'], 'a gần nhất; c xa, d chết, e là bóng bị bỏ; còn b/f/g lấy tối đa 3 gần nhất');
  assert.equal(t.length, WOLF.biteMax);
  assert.deepEqual(biteTargets({ x: 0, z: 0 }, [], null), []); assert.deepEqual(biteTargets({ x: 0, z: 0 }, null, null), []);
});
test('biteDamages: con đầu đủ sát thương, con sau theo splashPct, tối thiểu 1', () => {
  assert.deepEqual(biteDamages(100, 3), [100, Math.round(100 * WOLF.splashPct), Math.round(100 * WOLF.splashPct)]);
  assert.deepEqual(biteDamages(1, 2), [1, 1]); assert.deepEqual(biteDamages(10, 0), []); assert.equal(biteDamages(NaN, 1)[0], 1);
});
test('applyBite: quái bãi rừng trong tầm bị trừ máu thật, quái xa không bị; quái chết thì chủ sói nhận thưởng', () => {
  const hits = [], claims = [];
  const LGT = {
    strength: { value: 6 },
    farmView: { mons: [{ uid: 'z:1', x: 0, z: 5, oan: 50 }, { uid: 'z:2', x: 1, z: 6, oan: 5 }, { uid: 'z:3', x: 40, z: 40, oan: 50 }] },
    farm: { remoteHit: (uid, d, by, ax, az) => { hits.push({ uid, d, by, ax, az }); return { dead: uid === 'z:2', type: 'thuyquy' }; }, claimKill: (type) => claims.push(type) },
  };
  const n = applyBite({ pos: { x: 0, y: 0, z: 0 }, heading: 0, range: 5 }, LGT);
  assert.equal(n, 2); assert.deepEqual(hits.map((h) => h.uid), ['z:1', 'z:2']);
  assert.ok(hits[0].d >= 1 && hits[1].d >= 1 && hits[0].d >= hits[1].d, 'con gần nhất nhận nhiều nhất');
  assert.equal(hits[0].by, undefined); assert.equal(hits[0].ax, 0); assert.equal(hits[0].az, 0);
  assert.deepEqual(claims, ['thuyquy'], 'chỉ con chết (z:2) mới gọi claimKill');
});
test('applyBite: không quái / thiếu API / lỗi → 0, không ném lỗi', () => {
  const w = { pos: { x: 0, y: 0, z: 0 }, heading: 0, range: 5 };
  assert.equal(applyBite(w, {}), 0); assert.equal(applyBite(null, {}), 0); assert.equal(applyBite(w, null), 0);
  assert.equal(applyBite(w, { farmView: { mons: [{ uid: 'a', x: 0, z: 5, oan: 9 }] }, farm: { remoteHit: () => { throw new Error('hỏng'); } } }), 0);
  assert.equal(applyBite(w, { farmView: { mons: [{ uid: 'a', x: 0, z: 5, oan: 9 }] }, farm: {} }), 0);
});
test('applyBite: có yêu quái hằng tháng thì đánh vào yêu quái (ramHit) nếu trong tầm, xa quá thì không', () => {
  const type = Object.keys(YQ)[0], calls = [], farmCalls = [];
  const mk = (bx, bz) => ({ strength: { value: 6 }, yq: { active: true, boss: { type, x: bx, z: bz }, ramHit: (d) => { calls.push(d); return true; } }, farmView: { mons: [{ uid: 'a', x: 0, z: 5, oan: 9 }] }, farm: { remoteHit: () => { farmCalls.push(1); return null; } } });
  const w = { pos: { x: 0, y: 0, z: 0 }, heading: 0, range: 5 };
  assert.equal(applyBite(w, mk(0, 5)), 1); assert.equal(calls.length, 1); assert.ok(calls[0] >= 1); assert.equal(farmCalls.length, 0, 'có yêu quái thì không đụng quái bãi rừng');
  assert.equal(applyBite(w, mk(300, 300)), 0); assert.equal(calls.length, 1);
});
test('nối dây Phiên 227: chỉ sói của MÌNH gây sát thương, có tiếng gầm/ngoạm, chó chạy theo khởi động từ wolfFx và remoteGear', () => {
  const r = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
  const wf = r('../js/ui/wolfFx.js');
  assert.match(wf, /if \(!w\.remote\) hits = applyBite\(w\)/); assert.match(wf, /wolfSfx\.howl\(/); assert.match(wf, /wolfSfx\.bite\(/); assert.match(wf, /startLocalDogs\(\)/);
  assert.match(wf, /spawn\(pos, heading = 0, range = WOLF\.rangeAir, remote = false\)/);
  const rg = r('../js/ui/remoteGear.js');
  assert.match(rg, /createDogPack\(\{ sound: false \}\)/); assert.match(rg, /s\.dogs\.update\(av, dt, g\.ride === 'tre'\)/); assert.match(rg, /s\.dogs\.dispose\(\)/);
});

// ---- Phiên 227: bầy chó chạy theo khi cưỡi Gậy dạy chó ----
test('dogMath: ô đứng xoay theo hướng người (sau lưng, đúng trái/phải)', () => {
  const a = slotWorld({ x: 0, z: 0 }, 0, [1, -2]); assert.ok(Math.abs(a.x - 1) < 1e-9 && Math.abs(a.z + 2) < 1e-9);
  const b = slotWorld({ x: 10, z: 10 }, Math.PI / 2, [1, -2]); assert.ok(Math.abs(b.x - 8) < 1e-9 && Math.abs(b.z - 9) < 1e-9, 'người quay sang +x: phía sau là −x, bên phải là −z');
  assert.deepEqual(slotWorld(null, NaN, null), { x: 0, z: 0 });
  assert.ok(DOGS.count >= 2 && DOGS.slots.length >= DOGS.count);
});
test('dogMath.followStep: chạy tới đích, không vượt đích, không quá tốc độ tối đa, quá xa thì nhảy thẳng', () => {
  const a = followStep({ x: 0, z: 0 }, { x: 20, z: 0 }, 0.1); assert.ok(a.x > 0 && a.x <= DOGS.maxSpeed * 0.1 + 1e-9 && a.speed <= DOGS.maxSpeed + 1e-9);
  const b = followStep({ x: 0, z: 0 }, { x: 0.01, z: 0 }, 1); assert.ok(b.x <= 0.01 + 1e-9 && b.x > 0);
  assert.deepEqual(followStep({ x: 0, z: 0 }, { x: 0, z: 0 }, 0.1), { x: 0, z: 0, speed: 0 });
  const j = followStep({ x: 0, z: 0 }, { x: 500, z: 0 }, 0.1); assert.equal(j.x, 500); assert.equal(j.speed, 0);
});
test('dogMath: quay theo đường ngắn, mờ dần hiện/ẩn, nhịp chạy', () => {
  assert.ok(Math.abs(turnToward(3, -3, 100, 100) - (3 + (2 * Math.PI - 6))) < 1e-9, 'từ 3 rad sang −3 rad đi đường ngắn qua ±π');
  assert.ok(Math.abs(turnToward(0, 2, 0.1, 5) - 0.5) < 1e-9);
  assert.ok(Math.abs(wrapAngle(7) - (7 - 2 * Math.PI)) < 1e-9);
  assert.equal(fadeStep(0, true, DOGS.fadeIn), 1); assert.ok(Math.abs(fadeStep(1, false, 0.1) - (1 - 0.1 / DOGS.fadeOut)) < 1e-9);
  assert.equal(fadeStep(0.01, false, 5), 0); assert.equal(fadeStep(0.99, true, 5), 1);
  assert.equal(gaitRate(0), 0); assert.ok(gaitRate(10) > gaitRate(2) && gaitRate(2) > 0);
});
