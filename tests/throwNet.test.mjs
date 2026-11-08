// Ném người qua mạng: chạy NGUYÊN FILE gas/Throw.gs trong máy ảo Node + đối chiếu với throwCheck của máy khách.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import '../js/world/outside.js';
import { throwCheck, throwRange, PLAYER_KG } from '../js/world/strength.js';
import { nearestPlayer, planThrow, reasonText, lastThrown, stateReq } from '../js/world/throwNet.js';

function server() {
  let clock = 1e12; const store = new Map(), ctx = {
    CacheService: { getScriptCache: () => ({ get: (k) => store.get(k) ?? null, put: (k, v) => store.set(k, v) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) }, Math, JSON, Number, String, Object, Array, isFinite, RegExp,
    Date: { now: () => clock } };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../gas/Room.gs', import.meta.url), 'utf8').split('function roomSync_')[0], ctx);
  vm.runInContext(readFileSync(new URL('../gas/Throw.gs', import.meta.url), 'utf8'), ctx);
  const f = (req) => JSON.parse(JSON.stringify(ctx.thrSync_(req))); f.tick = (ms) => { clock += ms; }; f.ctx = ctx; return f;
}
const A = 'player-aaaaaaaa', B = 'player-bbbbbbbb';
const base = (id, o = {}) => ({ id, n: id.slice(7, 8), lv: 5, str: 60, x: 0, z: 60, ...o });

test('ném thành công: người bị ném nhận đúng điểm rơi một lần; người ném thấy thrown', () => {
  const s = server();
  s(base(B, { lv: 2, str: 20, x: 1, z: 61 }));
  const r = s({ ...base(A), ty: B, lx: 3, lz: 66 }); assert.equal(r.thrown, true);
  const got = s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); assert.deepEqual(got.inbox, [{ f: A, n: 'a', x: 3, z: 66 }]);
  assert.deepEqual(s(base(B, { lv: 2, str: 20 })).inbox, [], 'chỉ giao một lần');
});
test('từ chối: cấp/sức mạnh không nhỏ hơn, trong chùa, đang thiền, xa, quá tầm, không có người đó', () => {
  const s = server(); s(base(B, { lv: 2, str: 20, x: 1, z: 61 }));
  assert.equal(s({ ...base(A, { lv: 2 }), ty: B, lx: 2, lz: 62 }).reason, 'level');
  assert.equal(s({ ...base(A, { str: 20 }), ty: B, lx: 2, lz: 62 }).reason, 'strength');
  assert.equal(s({ ...base(A, { x: 0, z: 10 }), ty: B, lx: 0, lz: 12 }).reason, 'temple');
  assert.equal(s({ ...base(A), ty: B, lx: 40, lz: 60 }).reason, 'range');
  assert.equal(s({ ...base(A), ty: 'player-zzzzzzzz', lx: 1, lz: 61 }).reason, 'invalid');
  s(base(B, { lv: 2, str: 20, x: 30, z: 61 })); assert.equal(s({ ...base(A), ty: B, lx: 1, lz: 61 }).reason, 'far');
  s(base(B, { lv: 2, str: 20, x: 1, z: 61, med: true })); assert.equal(s({ ...base(A), ty: B, lx: 2, lz: 62 }).reason, 'meditating');
  s(base(B, { lv: 1, str: 0, x: 1, z: 61 })); assert.equal(s({ ...base(A, { str: 3, lv: 9 }), ty: B, lx: 2, lz: 62 }).reason, 'weight');
});
test('hồi chiêu 10 giây cho mỗi cặp, cặp khác không bị ảnh hưởng, hết giờ ném lại được', () => {
  const s = server(), C = 'player-cccccccc'; s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); s(base(C, { lv: 2, str: 20, x: 1, z: 62 }));
  assert.equal(s({ ...base(A), ty: B, lx: 3, lz: 64 }).thrown, true);
  s.tick(4000); const w = s({ ...base(A), ty: B, lx: 3, lz: 64 }); assert.equal(w.reason, 'cooldown'); assert.ok(w.wait >= 5 && w.wait <= 6);
  assert.equal(s({ ...base(A), ty: C, lx: 3, lz: 64 }).thrown, true, 'cặp khác ném được');
  s.tick(7000); s(base(B, { lv: 2, str: 20, x: 3, z: 64 })); s(base(C, { lv: 2, str: 20, x: 3, z: 64 }));
  assert.equal(s({ ...base(A), ty: B, lx: 5, lz: 66 }).thrown, true);
});
test('người rời quá 15 giây bị bỏ; không ném được người đã rời', () => {
  const s = server(); s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); s.tick(16000);
  assert.equal(s({ ...base(A), ty: B, lx: 2, lz: 62 }).reason, 'invalid');
});
test('đối chiếu máy chủ ↔ throwCheck máy khách trên lưới (cùng kết luận cho level/strength/weight/temple)', () => {
  for (const [alv, astr, tlv, tstr, ax, az] of [[5, 60, 2, 20, 0, 60], [5, 60, 5, 20, 0, 60], [5, 60, 2, 60, 0, 60], [9, 3, 1, 0, 0, 60], [5, 60, 2, 20, 0, 20], [5, 60, 2, 20, 0, 34.5], [5, 60, 2, 20, 0, 36.6], [5, 60, 2, 20, 80, 60]]) {
    const s = server(); s(base(B, { lv: tlv, str: tstr, x: ax + 0.5, z: az + 0.5 }));
    const net = s({ ...base(A, { lv: alv, str: astr, x: ax, z: az }), ty: B, lx: ax + 1, lz: az + 1.5 });
    const cl = throwCheck({ att: { lv: alv, str: astr, x: ax, z: az }, tgt: { lv: tlv, str: tstr, x: ax + 0.5, z: az + 0.5 }, attId: A, tgtId: B });
    assert.equal(net.thrown === true, cl.ok, JSON.stringify({ alv, astr, tlv, tstr, ax, az, net, cl }));
  }
});
test('máy khách: nearestPlayer, planThrow (lý do + điểm rơi), reasonText, lastThrown', () => {
  const list = [{ id: 'x', x: 0, z: 0 }, { id: 'y', x: 1, z: 0.5 }]; assert.equal(nearestPlayer(list, 0.8, 0.4).id, 'y'); assert.equal(nearestPlayer(list, 9, 9), null);
  const me = { lv: 5, str: 60, x: 0, z: 60 }, tgt = { id: B, lv: 2, str: 20, x: 1, z: 60, meditating: false };
  const p = planThrow({ pageId: A, name: 'An', me, tgt, ry: 0 }); assert.equal(p.ok, true); assert.equal(p.req.ty, B); assert.ok(p.req.lz > 60 && p.req.lz <= 60 + throwRange(60, PLAYER_KG));
  assert.equal(planThrow({ pageId: A, name: 'An', me, tgt: { ...tgt, lv: 5 } }).reason, 'level');
  assert.match(reasonText('cooldown', 3.2), /4 giây/); assert.match(reasonText('temple'), /chùa/);
  assert.deepEqual(lastThrown([{ n: 'a', x: 1, z: 2 }, { n: 'b', x: 3, z: 4 }]), { x: 3, z: 4, from: 'b' }); assert.equal(lastThrown([]), null);
  assert.equal(stateReq({ pageId: A, name: 'An', lv: 1, str: 2, x: 3, z: 4, med: 0 }).med, false);
});
