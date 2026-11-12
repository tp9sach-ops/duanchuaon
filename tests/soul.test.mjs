// Hồn quái bay vào hồ lô (Phiên 126): js/world/soul.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUL_S, orbPos, orbScale, soulColor, diffMons, killed } from '../js/world/soul.js';

const A = { x: 10, y: 0.8, z: -4 }, B = { x: 0, y: 0.4, z: 0 };

test('orbPos: bắt đầu ở quái, kết thúc ở hồ lô, bay vòng lên cao, hữu hạn', () => {
  const s = orbPos(A, B, 0), e = orbPos(A, B, 1);
  assert.deepEqual([s.x, s.y, s.z], [A.x, A.y, A.z]);
  assert.ok(Math.abs(e.x - B.x) < 1e-9 && Math.abs(e.y - B.y) < 1e-9 && Math.abs(e.z - B.z) < 1e-9);
  let top = -Infinity; for (let u = 0; u <= 1; u += 0.05) { const p = orbPos(A, B, u); for (const k of ['x', 'y', 'z']) assert.ok(Number.isFinite(p[k])); top = Math.max(top, p.y); }
  assert.ok(top > A.y + 0.3);
  assert.deepEqual(orbPos(A, B, -3), orbPos(A, B, 0)); assert.deepEqual(orbPos(A, B, 9), orbPos(A, B, 1));
  assert.ok(SOUL_S > 0.3 && SOUL_S < 2);
});

test('orbPos: nhanh dần khi gần hồ lô', () => {
  const d = (u0, u1) => { const p = orbPos(A, B, u0), q = orbPos(A, B, u1); return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z); };
  assert.ok(d(0.8, 0.9) > d(0.1, 0.2));
});

test('orbScale: nở rồi nhỏ dần, không bao giờ biến mất hẳn', () => {
  for (let u = 0; u <= 1.001; u += 0.05) { const s = orbScale(u); assert.ok(s >= 0.12 && s <= 1.01, `u=${u} s=${s}`); }
  assert.ok(orbScale(0.3) > orbScale(1));
});

test('soulColor: theo Hệ, có dấu hay không đều được, lạ → vàng nhạt', () => {
  assert.equal(soulColor('Kim'), soulColor('kim')); assert.equal(soulColor('Mộc'), 0x9cf59c); assert.equal(soulColor('thủy'), 0x8fd4ff);
  assert.equal(soulColor('Hỏa'), 0xff9a6b); assert.equal(soulColor('Thổ'), 0xe6c27a);
  assert.equal(soulColor(''), 0xffe29a); assert.equal(soulColor(null), 0xffe29a); assert.equal(soulColor('zzz'), 0xffe29a);
});

test('diffMons + killed: chỉ quái vừa biến mất, ở gần, ngay sau khi ra đòn mới tính là bị hạ', () => {
  const t0 = 10000, m1 = [{ uid: 'a', x: 5, z: 5, he: 'Mộc' }, { uid: 'b', x: 40, z: 0 }, { uid: 'c', x: 2, z: 2 }];
  const r1 = diffMons(null, m1, t0); assert.equal(r1.next.size, 3); assert.deepEqual(r1.gone, []);
  const r2 = diffMons(r1.next, [{ uid: 'c', x: 2, z: 2 }], t0 + 40);
  assert.deepEqual(r2.gone.map((g) => g.uid).sort(), ['a', 'b']);
  const base = { now: t0 + 40, lastAttack: t0 - 100, player: { x: 0, z: 0 } };
  assert.deepEqual(killed(r2.gone, base).map((g) => g.uid), ['a']);                                  // b ở quá xa
  assert.deepEqual(killed(r2.gone, { ...base, lastAttack: t0 - 5000 }), []);                         // lâu rồi không ra đòn (quái chỉ hết hạn/đi xa)
  assert.deepEqual(killed(r2.gone, { ...base, now: t0 + 5000 }), []);                                // mới thấy cách đây quá lâu
  assert.deepEqual(killed([], base), []); assert.deepEqual(killed(r2.gone, {}), []); assert.deepEqual(killed(null, base), []);
  const r3 = diffMons(r2.next, [{ uid: 'q', x: NaN, z: 1 }, null, { uid: null, x: 1, z: 1 }], t0 + 80); assert.equal(r3.next.size, 0);
});
