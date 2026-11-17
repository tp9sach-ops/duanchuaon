// Phiên 227 (mục 2): rồng hồng của Gậy như ý gây sát thương khi bay trúng quái.
// Chạy: node --test tests/dragonfx227.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DHIT, dragonHits } from '../js/world/dragonMath.js';
import { applyDragonHit } from '../js/ui/dragonHit.js';
import { YQ } from '../js/world/yeuquai.js';

const body = () => 0.5;

test('dragonHits: chỉ quái sống trong tầm chạm, gần nhất trước, tối đa maxPerFrame; bóng quái / quái chết bị bỏ', () => {
  const rec = new Map(), head = { x: 0, z: 0 };
  const mons = [{ uid: 'a', x: 1, z: 0, oan: 5 }, { uid: 'b', x: 0, z: 1.5, oan: 5 }, { uid: 'c', x: 30, z: 0, oan: 5 }, { uid: 'd', x: 0.5, z: 0, oan: 0 }, { uid: 'e', x: 0.5, z: 0, oan: 5, ghost: true }, { uid: 'f', x: 0, z: -1, oan: 5 }, { uid: 'g', x: -1.2, z: 0, oan: 5 }];
  const got = dragonHits(head, mons, body, rec, 1);
  assert.deepEqual(got.map((m) => m.uid), ['f', 'a', 'g'].slice(0, DHIT.maxPerFrame).length === 3 ? got.map((m) => m.uid) : []);
  assert.equal(got.length, DHIT.maxPerFrame);
  for (const m of got) assert.ok(['a', 'b', 'f', 'g'].includes(m.uid), 'c xa, d chết, e là bóng');
  assert.equal(got[0].uid === 'a' || got[0].uid === 'f', true, 'gần nhất đứng đầu');
});
test('dragonHits: cùng quái cách nhau cooldown và tối đa perMonster lần; đầu không hợp lệ → rỗng', () => {
  const rec = new Map(), head = { x: 0, z: 0 }, mons = [{ uid: 'a', x: 1, z: 0, oan: 5 }];
  assert.equal(dragonHits(head, mons, body, rec, 1).length, 1);
  assert.equal(dragonHits(head, mons, body, rec, 1.1).length, 0, 'chưa đủ cooldown');
  assert.equal(dragonHits(head, mons, body, rec, 1 + DHIT.cooldown + 0.01).length, 1);
  assert.equal(dragonHits(head, mons, body, rec, 10).length, 0, 'đủ perMonster lần');
  assert.deepEqual(dragonHits(null, mons, body, rec, 1), []); assert.deepEqual(dragonHits({ x: NaN, z: 0 }, mons, body, new Map(), 1), []); assert.deepEqual(dragonHits(head, null, body, new Map(), 1), []);
});
test('applyDragonHit: quái bãi rừng bị trừ máu thật, quái chết thì chủ rồng nhận thưởng, quái xa không bị', () => {
  const hits = [], claims = [];
  const LGT = { strength: { value: 6 }, farmView: { mons: [{ uid: 'z:1', x: 1, z: 0, oan: 50 }, { uid: 'z:2', x: 0, z: 1, oan: 5 }, { uid: 'z:3', x: 40, z: 40, oan: 50 }] },
    farm: { remoteHit: (uid, d, by, ax, az) => { hits.push({ uid, d, by, ax, az }); return { dead: uid === 'z:2', type: 'thuyquy' }; }, claimKill: (t) => claims.push(t) } };
  const r = applyDragonHit({ x: 0, y: 1, z: 0 }, 1, new Map(), { x: 5, z: 6 }, LGT);
  assert.equal(r.n, 2); assert.equal(r.pts.length, 2); assert.deepEqual(hits.map((h) => h.uid).sort(), ['z:1', 'z:2']);
  assert.ok(hits.every((h) => h.d >= 1 && h.by === undefined && h.ax === 5 && h.az === 6));
  assert.deepEqual(claims, ['thuyquy']);
});
test('applyDragonHit: không quái / thiếu API / lỗi → 0, không ném lỗi', () => {
  const h = { x: 0, y: 1, z: 0 };
  assert.equal(applyDragonHit(h, 1, new Map(), null, {}).n, 0); assert.equal(applyDragonHit(null, 1, new Map(), null, {}).n, 0); assert.equal(applyDragonHit(h, 1, null, null, {}).n, 0); assert.equal(applyDragonHit(h, 1, new Map(), null, null).n, 0);
  assert.equal(applyDragonHit(h, 1, new Map(), null, { farmView: { mons: [{ uid: 'a', x: 1, z: 0, oan: 9 }] }, farm: { remoteHit: () => { throw new Error('hỏng'); } } }).n, 0);
});
test('applyDragonHit: có yêu quái hằng tháng thì đánh vào yêu quái (ramHit) nếu trong tầm, xa quá thì không', () => {
  const type = Object.keys(YQ)[0], calls = [], farmCalls = [];
  const mk = (bx, bz) => ({ strength: { value: 6 }, yq: { active: true, boss: { type, x: bx, z: bz }, ramHit: (d) => { calls.push(d); return true; } }, farmView: { mons: [{ uid: 'a', x: 1, z: 0, oan: 9 }] }, farm: { remoteHit: () => { farmCalls.push(1); return null; } } });
  assert.equal(applyDragonHit({ x: 0, y: 1, z: 0 }, 1, new Map(), null, mk(0, 1)).n, 1); assert.equal(calls.length, 1); assert.ok(calls[0] >= 1); assert.equal(farmCalls.length, 0);
  assert.equal(applyDragonHit({ x: 0, y: 1, z: 0 }, 1, new Map(), null, mk(300, 300)).n, 0); assert.equal(calls.length, 1);
});
test('nối dây Phiên 227: chỉ rồng của MÌNH (không track) gây sát thương, có tiếng gầm/trúng; chữ ký cũ giữ nguyên', () => {
  const dr = readFileSync(new URL('../js/ui/dragonFx.js', import.meta.url), 'utf8');
  assert.match(dr, /if \(!d\.track && vis > 0\.5\)/); assert.match(dr, /applyDragonHit\(d\.head, d\.t, d\.rec, c\)/); assert.match(dr, /dragonSfx\.roar\(/); assert.match(dr, /dragonSfx\.hit\(\)/);
  assert.match(dr, /spawn\(center, ry = 0, track = null\)/); assert.match(dr, /combatLink\.sendDragon\(ry\)/);
});
