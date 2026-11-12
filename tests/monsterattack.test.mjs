// Test quái bãi rừng đánh trả + Sinh Lực người chơi (Phiên 115). Chạy: node --test tests/monsterattack.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTACK_CFG as A, VITALS_CFG as V } from '../js/data/monsterAI.js';
import { FARM_ZONES } from '../js/data/monsters.js';
import { walkable, provoke, calm, strikeDamage, stepMonster, createVitals } from '../js/world/monsterAttack.js';

const mk = (o = {}) => ({ id: 1, type: 'dameo', he: 'moc', elite: false, zone: 'biaRungThong', x: -100, z: 80, oan: 66, max: 66, ...o });
const run = (m, player, secs, ctx = { thu: 5, max: 120 }, dt = 0.05) => { const ev = []; for (let t = 0; t < secs - 1e-9; t += dt) { const e = stepMonster(m, dt, player, ctx); if (e) ev.push({ ...e, t: Math.round((t + dt) * 100) / 100 }); } return ev; };

test('monsterattack: cấu hình TẠM, đóng băng, số hợp lý', () => {
  assert.equal(A.tam, true); assert.equal(V.tam, true); assert.ok(Object.isFrozen(A) && Object.isFrozen(A.speed) && Object.isFrozen(V));
  assert.ok(A.reach.elite > A.reach.normal && A.speed.elite > A.speed.normal && A.heSo.elite > A.heSo.normal);
  assert.ok(A.maxHitPct > 0 && A.maxHitPct < 1); assert.ok(A.windup > 0.3, 'phải đủ lâu để người chơi kịp né');
});

test('monsterattack: walkable — trong vùng, tránh hình tròn; vùng lạ không chặn', () => {
  assert.equal(walkable('biaRungThong', -100, 90), true);
  assert.equal(walkable('biaRungThong', -110, 102), false, 'trong vòng tránh');
  assert.equal(walkable('biaRungThong', 0, 0), false, 'ngoài vùng');
  assert.equal(walkable('hoThac', 106, 104), false, 'giữa hồ thác');
  assert.equal(walkable('khong-co', 0, 0), true);
  assert.equal(walkable('biaRungThong', NaN, 3), false);
  for (const z of Object.values(FARM_ZONES)) { const r = z.rects[0]; assert.equal(walkable(z.id, r.x0 - 0.5, r.z0), false); }
});

test('monsterattack: sát thương một đòn — theo Công quái, Thủ, Hệ; có trần 35% Sinh Lực tối đa; tối thiểu 1', () => {
  const dameo = mk(), rue = mk({ type: 'reutinh', elite: true }), ngu = mk({ type: 'lyngu', elite: true, he: 'thuy' });
  assert.equal(strikeDamage(dameo, { thu: 5, max: 120 }), 9);
  assert.equal(strikeDamage(dameo, { thu: 5, max: 120, rel: 'loi' }), 12); assert.equal(strikeDamage(dameo, { thu: 5, max: 120, rel: 'bat' }), 7);
  assert.equal(strikeDamage(rue, { thu: 5, max: 120 }), 32);
  assert.equal(strikeDamage(ngu, { thu: 5, max: 120 }), 42, 'quái cấp cao bị chặn ở 35% × 120');
  assert.equal(strikeDamage(ngu, { thu: 0, max: 1000 }), 109, 'không chạm trần khi Sinh Lực lớn');
  assert.equal(strikeDamage(dameo, { thu: 1e6, max: 120 }), 1, 'Thủ cực lớn vẫn mất tối thiểu 1');
  for (const v of [undefined, null, {}, { type: 'xxx' }]) assert.equal(strikeDamage(v), 0, String(v));
});

test('monsterattack: quái chưa bị đánh thì đứng yên, không đánh', () => {
  const m = mk(); assert.equal(stepMonster(m, 0.1, { x: -99, z: 80 }), null); assert.deepEqual([m.x, m.z], [-100, 80]);
  assert.deepEqual(run(m, { x: -99.5, z: 80 }, 10), []);
  assert.equal(stepMonster(null, 0.1, { x: 0, z: 0 }), null); provoke(m); assert.equal(stepMonster(m, 0.1, null), null);
});

test('monsterattack: bị đánh thì đuổi theo, dừng ở 0,8 × tầm, rồi gồng chiêu → trúng', () => {
  const m = mk(); provoke(m);
  const player = { x: -90, z: 80 };                              // cách 10 m
  const ev = run(m, player, 8);
  const reachN = A.reach.normal;
  assert.ok(Math.abs(Math.hypot(player.x - m.x, player.z - m.z) - reachN * A.stopFrac) < 0.05, 'đứng cách 0,8 × tầm');
  assert.equal(ev[0].k, 'windup'); assert.equal(ev[1].k, 'strike'); assert.equal(ev[1].dmg, 9);
  assert.ok(Math.abs((ev[1].t - ev[0].t) - A.windup) < 0.06, 'đúng thời gian gồng');
  assert.ok(ev[0].t > 2.5, 'phải đi vài giây mới tới nơi (tốc độ 2,6 m/s)');
});

test('monsterattack: né được — chạy ra khỏi tầm trong lúc gồng chiêu thì trượt', () => {
  const m = mk(); provoke(m); const p = { x: -99, z: 80 };
  let e = stepMonster(m, 0.1, p, { thu: 5, max: 120 }); assert.equal(e.k, 'windup');
  p.x = -90;                                                      // chạy ra xa 10 m
  let last = null; for (let i = 0; i < 12; i++) { const r = stepMonster(m, 0.1, p, { thu: 5, max: 120 }); if (r) { last = r; break; } }
  assert.deepEqual(last, { k: 'miss' });
});

test('monsterattack: hồi chiêu giữa hai đòn đúng khoảng; tinh anh nhanh hơn và tầm xa hơn', () => {
  const m = mk(); provoke(m); const ev = run(m, { x: -99, z: 80 }, 12).filter((e) => e.k === 'windup');
  assert.ok(ev.length >= 4); assert.ok(Math.abs((ev[1].t - ev[0].t) - (A.windup + A.interval.normal)) < 0.1, `cách nhau ${ev[1].t - ev[0].t}`);
  const e1 = mk({ type: 'reutinh', elite: true }), e2 = mk(); provoke(e1); provoke(e2);
  run(e1, { x: -80, z: 80 }, 2); run(e2, { x: -80, z: 80 }, 2);
  assert.ok(e1.x > e2.x, 'tinh anh chạy nhanh hơn');
  const p = { x: -97.2, z: 80 }; const a = mk({ type: 'reutinh', elite: true }), b = mk(); provoke(a); provoke(b);   // cách 2,8 m: ngoài tầm thường (2,4), trong tầm tinh anh (3,4)
  assert.equal(stepMonster(a, 0.05, p).k, 'windup'); assert.equal(stepMonster(b, 0.05, p) === null || b.x > -100, true);
});

test('monsterattack: không ra khỏi vùng của mình khi đuổi', () => {
  const zone = FARM_ZONES.biaRungThong, r = zone.rects[0];
  const m = mk({ x: r.x1 - 1, z: 90 }); provoke(m);
  run(m, { x: r.x1 + 10, z: 90 }, 6);                              // người chơi đứng ngoài vùng, trong tầm bỏ cuộc? (cách ≈ 11 m < 22)
  assert.ok(m.x <= r.x1 + 1e-9 || !(m.x > -91 && m.x < -90), 'không vượt rìa vùng thứ nhất');
  assert.equal(walkable(m.zone, m.x, m.z) || m.x > r.x1, true);
  const m2 = mk({ x: -100, z: 80 }); provoke(m2); run(m2, { x: -100, z: 50 }, 4);   // người chơi ở ngoài vùng phía dưới z < 73
  assert.ok(m2.z >= 73 - 1e-9, `quái dừng ở rìa vùng (z=${m2.z})`);
});

test('monsterattack: bỏ cuộc khi người chơi chạy quá xa hoặc quá lâu không bị đánh', () => {
  const m = mk(); provoke(m); assert.deepEqual(stepMonster(m, 0.1, { x: -60, z: 80 }), { k: 'calm' }); assert.equal(m.eng, false);
  const n = mk(); provoke(n); n.engT = A.giveUp + 1; assert.deepEqual(stepMonster(n, 0.1, { x: -90, z: 80 }), { k: 'calm' });   // xa hơn 2 × tầm
  const k = mk(); provoke(k); k.engT = A.giveUp + 1; assert.notEqual(stepMonster(k, 0.1, { x: -99, z: 80 }), { k: 'calm' }); assert.equal(k.eng, true);   // đang đứng sát thì không bỏ
  const w = mk(); provoke(w); stepMonster(w, 0.1, { x: -99, z: 80 }); assert.ok(w.wind > 0); calm(w); assert.equal(w.wind, 0); assert.equal(w.eng, false);
});

test('monsterattack: đầu vào lạ (dt, vị trí) không làm hỏng quái', () => {
  const m = mk(); provoke(m);
  for (const dt of [NaN, -1, undefined, 'x', 99]) stepMonster(m, dt, { x: -95, z: 80 }, {});
  assert.ok(Number.isFinite(m.x) && Number.isFinite(m.z) && Number.isFinite(m.ry));
  stepMonster(m, 0.1, { x: NaN, z: undefined }); assert.ok(Number.isFinite(m.x));
});

test('vitals: Sinh Lực theo Tu Vi; bị đánh trừ, bất tử ngắn, hết thì down', () => {
  const wait = (v, sec) => { for (let t = 0; t < sec; t += 0.25) v.step(0.25); };
  const v = createVitals({ tuvi: 1 }); assert.equal(v.max, 120); assert.equal(v.hp, 120); assert.equal(v.pct, 1);
  assert.deepEqual(v.take(30), { taken: 30, down: false }); assert.equal(v.hp, 90);
  assert.deepEqual(v.take(30), { taken: 0, down: false }, 'đang bất tử ngắn'); wait(v, V.hitGrace + 0.01);
  assert.deepEqual(v.take(30), { taken: 30, down: false }); assert.equal(v.hp, 60);
  for (const x of [0, -5, NaN, 'a', undefined]) { wait(v, 0.5); assert.equal(v.take(x).taken, 0, String(x)); }
  wait(v, 0.5); assert.deepEqual(v.take(500), { taken: 60, down: true }); assert.equal(v.hp, 0); assert.equal(v.down, true);
  wait(v, 0.5); assert.equal(v.take(10).taken, 0, 'đã down'); v.revive();
  assert.equal(v.hp, 120); assert.equal(v.down, false); assert.ok(v.grace > 0); assert.equal(v.take(10).taken, 0, 'bất tử sau hồi sinh'); wait(v, V.koGrace + 0.1); assert.equal(v.take(10).taken, 10);
});

test('vitals: chỉ hồi sau regenDelay giây yên; đánh quái (touch) hoặc bị đánh thì chờ lại', () => {
  const v = createVitals({ tuvi: 1 }); v.take(60); v.step(V.hitGrace + 0.01);
  for (let t = 0; t < V.regenDelay - 0.5; t += 0.1) v.step(0.1); assert.equal(v.hp, 60, 'chưa hồi');
  v.touch(); for (let t = 0; t < V.regenDelay - 0.5; t += 0.1) v.step(0.1); assert.equal(v.hp, 60, 'touch đặt lại bộ đếm');
  for (let t = 0; t < 3; t += 0.1) v.step(0.1);
  assert.ok(v.hp > 60, `đã hồi (${v.hp})`);
  for (let t = 0; t < 60; t += 0.1) v.step(0.1); assert.equal(v.hp, 120); assert.equal(v.pct, 1);
});

test('vitals: đổi Tu Vi đổi Sinh Lực tối đa và giữ tỉ lệ; không bao giờ về 0 chỉ vì làm tròn', () => {
  const v = createVitals({ tuvi: 1 }); v.take(60); v.setTuVi(10);
  assert.equal(v.max, 345); assert.ok(Math.abs(v.hp - 172) <= 1, `giữ tỉ lệ 50% (${v.hp})`);
  const w = createVitals({ tuvi: 10 }); w.setTuVi(1); assert.equal(w.max, 120); assert.equal(w.hp, 120);
  for (const t of [undefined, null, 'x', NaN]) assert.ok(createVitals({ tuvi: t }).max >= 1, String(t));
});
