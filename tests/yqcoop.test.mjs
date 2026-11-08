// Yêu quái đánh chung: chạy NGUYÊN FILE gas/Yq.gs trong máy ảo Node (có CacheService/LockService giả) + logic máy khách.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import '../js/world/outside.js';
import { createBoss } from '../js/world/yeuquai.js';
import { buildReq, applyServer, lootFromServer, leavesGranted, coopKeyOk } from '../js/world/yqCoop.js';

function server() {
  const store = new Map(), ctx = {
    CacheService: { getScriptCache: () => ({ get: (k) => store.get(k) ?? null, put: (k, v) => store.set(k, v) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) }, Math, JSON, Date, Number, String, Object, Array, isFinite, RegExp };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../gas/Room.gs', import.meta.url), 'utf8').split('function roomSync_')[0], ctx);   // chỉ cần roomId_ & hằng
  vm.runInContext(readFileSync(new URL('../gas/Yq.gs', import.meta.url), 'utf8'), ctx);
  return (req) => JSON.parse(JSON.stringify(ctx.yqSync_(req)));
}
const A = 'player-aaaaaaaa', B = 'player-bbbbbbbb', K = '2026-11-cao';

test('máu chung: tổng sát thương mọi người; gửi lại không tính đôi; chỉ tăng', () => {
  const s = server();
  let r = s({ id: A, key: K, max: 200, d: 50 }); assert.equal(r.ok, true); assert.equal(r.hp, 150); assert.equal(r.max, 200);
  r = s({ id: B, key: K, max: 9999, d: 70 }); assert.equal(r.hp, 80, 'B không đổi được máu tối đa'); assert.equal(r.mine, 70); assert.equal(r.players, 2);
  r = s({ id: A, key: K, max: 200, d: 50 }); assert.equal(r.hp, 80, 'gửi lại cùng số: không tính đôi');
  r = s({ id: A, key: K, max: 200, d: 10 }); assert.equal(r.mine, 50, 'không giảm');
  r = s({ id: A, key: K, max: 200, d: 99999 }); assert.ok(r.mine <= 50 + 600, 'chặn tăng vọt');
});
test('hết máu: hạt giống + chỗ rơi cố định; mỗi túi lá chỉ một người nhận (ai xin trước)', () => {
  const s = server();
  s({ id: A, key: K, max: 100, d: 60 }); let r = s({ id: B, key: K, max: 100, d: 60, at: { x: 3, z: 90 } });
  assert.equal(r.dead, true); assert.ok(r.seed > 0); assert.deepEqual(r.at, { x: 3, z: 90 });
  const seed = r.seed; r = s({ id: A, key: K, max: 100, d: 60, at: { x: 50, z: 50 } }); assert.equal(r.seed, seed); assert.deepEqual(r.at, { x: 3, z: 90 });
  const ra = s({ id: A, key: K, d: 60, claim: [1, 2, 3] }), rb = s({ id: B, key: K, d: 60, claim: [3, 4] });
  assert.deepEqual(ra.granted, [1, 2, 3]); assert.deepEqual(rb.granted, [4], 'túi 3 đã bị A lấy');
  assert.deepEqual(s({ id: A, key: K, d: 60, claim: [1] }).granted, [], 'không nhận lại');
});
test('chưa hết máu thì không nhặt được; key/id sai bị từ chối; key khác tách riêng', () => {
  const s = server();
  assert.deepEqual(s({ id: A, key: K, max: 100, d: 10, claim: [1] }).granted, []);
  assert.equal(s({ id: 'x', key: K }).error, 'bad_id'); assert.equal(s({ id: A, key: 'thu-da' }).error, 'bad_key');
  assert.equal(s({ id: A, key: '2026-11-trung', max: 100, d: 5 }).total, 5);
});
test('máy khách: áp máu chung, trừ phần chưa gửi, báo bị người khác kết liễu', () => {
  const b = createBoss('da', { n: 1, diff: 'cao' });
  assert.deepEqual(applyServer(b, { ok: true, max: b.max, total: 40, mine: 10, hp: b.max - 40, dead: false }, 25), { killedByOthers: false });
  assert.equal(b.hp, b.max - 40 - 15); assert.equal(b.dmgBy.ban, 10); assert.equal(b.dmgBy.khac, 30);
  applyServer(b, { ok: true, max: b.max, total: b.max, mine: 10, hp: 0, dead: true }, 10);
  assert.equal(b.dead, true); assert.equal(b.hp, 0);
  assert.equal(applyServer(null, {}, 0).killedByOthers, false);
});
test('túi lá: mọi máy dựng GIỐNG nhau từ hạt giống; bỏ túi đã có người nhận; leavesGranted cộng đúng', () => {
  const b = createBoss('lua', { diff: 'cao' }), res = { ok: true, dead: true, seed: 12345, at: { x: 1, z: 2 }, claimed: {}, granted: [] };
  const d1 = lootFromServer(res, b), d2 = lootFromServer(res, b);
  assert.deepEqual(d1, d2); assert.ok(d1.length >= 12);
  const left = lootFromServer({ ...res, claimed: { [d1[0].id]: B } }, b); assert.equal(left.length, d1.length - 1);
  assert.equal(leavesGranted({ granted: [d1[0].id, d1[1].id] }, d1), d1[0].la + d1[1].la);
  assert.deepEqual(lootFromServer({ ok: true, dead: false, seed: 5 }, b), []);
});
test('buildReq + coopKeyOk', () => {
  const b = createBoss('da', {}); const q = buildReq({ pageId: A, key: K, boss: b, dealt: 12.7, claim: [1, 2] });
  assert.equal(q.d, 12); assert.equal(q.max, b.max); assert.deepEqual(q.claim, [1, 2]);
  assert.ok(coopKeyOk('2026-11-trung') && !coopKeyOk('thu-da') && !coopKeyOk('2026-11'));
});
