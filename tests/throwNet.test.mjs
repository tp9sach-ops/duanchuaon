// Ném người qua mạng: chạy NGUYÊN FILE gas/Throw.gs trong máy ảo Node + đối chiếu với throwCheck của máy khách.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import '../js/world/outside.js';
import { throwCheck, throwRange, PLAYER_KG } from '../js/world/strength.js';
import { nearestPlayer, planThrow, planGrab, planHeldThrow, holdLeft, heldInfo, HOLD_MS, HELD_MAX_MS, reasonText, lastThrown, stateReq } from '../js/world/throwNet.js';

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
/** Phiên 91: khiêng rồi ném (đúng luồng của máy khách). Trả kết quả lệnh ném; nếu khiêng hỏng thì trả kết quả khiêng. */
const grabThrow = (s, a, b, lx, lz, wait = 2000) => { const g = s({ ...a, ty: b, g: 1 }); if (!g.grabbed) return g; s.tick(wait); return s({ ...a, ty: b, lx, lz }); };

test('ném thành công: người bị ném nhận đúng điểm rơi một lần; người ném thấy thrown', () => {
  const s = server();
  s(base(B, { lv: 2, str: 20, x: 1, z: 61 }));
  const r = grabThrow(s, base(A), B, 3, 66); assert.equal(r.thrown, true);
  const got = s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); assert.deepEqual(got.inbox, [{ f: A, n: 'a', x: 3, z: 66 }]);
  assert.deepEqual(s(base(B, { lv: 2, str: 20 })).inbox, [], 'chỉ giao một lần');
});
test('từ chối: cấp/sức mạnh không nhỏ hơn, trong chùa, đang thiền, xa, quá tầm, không có người đó', () => {
  const s = server(); s(base(B, { lv: 2, str: 20, x: 1, z: 61 }));
  const G = (a, extra = {}) => s({ ...a, ty: B, g: 1, ...extra });   // lệnh KHIÊNG
  assert.equal(G(base(A, { lv: 2 })).reason, 'level');
  assert.equal(G(base(A, { str: 20 })).reason, 'strength');
  assert.equal(G(base(A, { x: 0, z: 10 })).reason, 'temple');
  assert.equal(s({ ...base(A), ty: 'player-zzzzzzzz', g: 1 }).reason, 'invalid');
  assert.equal(s({ ...base(A), ty: A, g: 1 }).reason, 'invalid', 'không tự khiêng mình');
  s(base(B, { lv: 2, str: 20, x: 30, z: 61 })); assert.equal(G(base(A)).reason, 'far');
  s(base(B, { lv: 2, str: 20, x: 1, z: 61, med: true })); assert.equal(G(base(A)).reason, 'meditating');
  s(base(B, { lv: 1, str: 0, x: 1, z: 61 })); assert.equal(G(base(A, { str: 3, lv: 9 })).reason, 'weight');
  // quá tầm ném: khiêng được nhưng điểm rơi quá xa thì bị từ chối lúc ném
  s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); assert.equal(G(base(A)).grabbed, true); assert.equal(s({ ...base(A), ty: B, lx: 40, lz: 60 }).reason, 'range');
});
test('hồi chiêu 10 giây cho mỗi cặp, cặp khác không bị ảnh hưởng, hết giờ ném lại được', () => {
  const s = server(), C = 'player-cccccccc'; s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); s(base(C, { lv: 2, str: 20, x: 1, z: 62 }));
  assert.equal(grabThrow(s, base(A), B, 3, 64).thrown, true);   // khiêng 2 s rồi ném (đồng hồ đã trôi 2 s)
  s.tick(2000); const w = s({ ...base(A), ty: B, g: 1 }); assert.equal(w.reason, 'cooldown'); assert.ok(w.wait >= 5 && w.wait <= 7, 'khiêng lại ngay: chờ hồi chiêu ' + w.wait);
  assert.equal(grabThrow(s, base(A), C, 3, 64).thrown, true, 'cặp khác khiêng-ném được');
  s.tick(12000); s(base(B, { lv: 2, str: 20, x: 3, z: 64 })); s(base(C, { lv: 2, str: 20, x: 3, z: 64 }));
  assert.equal(grabThrow(s, base(A), B, 5, 66).thrown, true);
});
test('người rời quá 15 giây bị bỏ; không ném được người đã rời', () => {
  const s = server(); s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); s.tick(16000);
  assert.equal(s({ ...base(A), ty: B, g: 1 }).reason, 'invalid');
});
test('đối chiếu máy chủ ↔ throwCheck máy khách trên lưới (cùng kết luận cho level/strength/weight/temple)', () => {
  for (const [alv, astr, tlv, tstr, ax, az] of [[5, 60, 2, 20, 0, 60], [5, 60, 5, 20, 0, 60], [5, 60, 2, 60, 0, 60], [9, 3, 1, 0, 0, 60], [5, 60, 2, 20, 0, 20], [5, 60, 2, 20, 0, 34.5], [5, 60, 2, 20, 0, 36.6], [5, 60, 2, 20, 80, 60]]) {
    const s = server(); s(base(B, { lv: tlv, str: tstr, x: ax + 0.5, z: az + 0.5 }));
    const net = grabThrow(s, base(A, { lv: alv, str: astr, x: ax, z: az }), B, ax + 1, az + 1.5, 1500);
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

// ---------- Phiên 91: KHIÊNG 2 giây rồi ném ----------
test('khiêng: trả grabbed + holdMs; người bị khiêng nhận held (tên, mã người khiêng, còn bao lâu) cho tới khi bị ném', () => {
  const s = server(); s(base(B, { lv: 2, str: 20, x: 1, z: 61 }));
  const g = s({ ...base(A), ty: B, g: 1 }); assert.equal(g.grabbed, true); assert.equal(g.holdMs, 2000); assert.equal(g.thrown, undefined);
  const h = s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); assert.equal(h.held.f, A); assert.equal(h.held.n, 'a'); assert.ok(h.held.ms > 0 && h.held.ms <= 4500);
  s.tick(2000); const h2 = s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); assert.equal(h2.held.f, A, 'vẫn bị khiêng qua các lượt báo vị trí của chính mình');
  assert.equal(s({ ...base(A), ty: B, lx: 3, lz: 66 }).thrown, true);
  const after = s(base(B, { lv: 2, str: 20, x: 3, z: 66 })); assert.equal(after.held, undefined, 'bị ném xong thì không còn bị khiêng'); 
});
test('không khiêng thì không ném được (nothold); đã ném rồi không ném lần hai; người khác không ném hộ được', () => {
  const s = server(), C = 'player-cccccccc'; s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); s(base(C));
  assert.equal(s({ ...base(A), ty: B, lx: 3, lz: 66 }).reason, 'nothold');
  assert.equal(s({ ...base(A), ty: B, g: 1 }).grabbed, true);
  assert.equal(s({ ...base(C), ty: B, lx: 3, lz: 66 }).reason, 'nothold', 'C không khiêng B nên không ném được');
  assert.equal(s({ ...base(C), ty: B, g: 1 }).reason, 'held', 'B đang được A khiêng: C không khiêng chen vào');
  assert.equal(s({ ...base(A), ty: B, lx: 3, lz: 66 }).thrown, true);
  assert.equal(s({ ...base(A), ty: B, lx: 3, lz: 66 }).reason, 'nothold', 'ném rồi thì thôi');
});
test('hết hạn khiêng (người khiêng mất mạng): người bị khiêng tự được thả và không ném muộn được', () => {
  const s = server(); s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); s({ ...base(A), ty: B, g: 1 });
  s.tick(4400); assert.ok(s(base(B, { lv: 2, str: 20, x: 1, z: 61 })).held, 'còn trong hạn 4,5 s');
  s.tick(300); assert.equal(s(base(B, { lv: 2, str: 20, x: 1, z: 61 })).held, undefined, 'quá hạn: thả');
  assert.equal(s({ ...base(A), ty: B, lx: 3, lz: 66 }).reason, 'nothold');
});
test('thả xuống (rl): người bị khiêng đứng lại được, hồi chiêu vẫn tính, không bị dời đi', () => {
  const s = server(); s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); s({ ...base(A), ty: B, g: 1 });
  const r = s({ ...base(A), ty: B, rl: 1 }); assert.equal(r.released, true);
  const b = s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); assert.equal(b.held, undefined); assert.deepEqual(b.inbox, []);
  assert.equal(s({ ...base(A), ty: B, g: 1 }).reason, 'cooldown');
  assert.equal(s({ ...base(A), ty: B, lx: 3, lz: 66 }).reason, 'nothold');
  const C = 'player-cccccccc'; s(base(C)); s({ ...base(A), ty: B, g: 1, id: A }); // người khác thả hộ không có tác dụng:
  s.tick(11000); s(base(B, { lv: 2, str: 20, x: 1, z: 61 })); s({ ...base(A), ty: B, g: 1 }); s({ ...base(C), ty: B, rl: 1 });
  assert.equal(s(base(B, { lv: 2, str: 20, x: 1, z: 61 })).held.f, A, 'C không thả được người A đang khiêng');
});
test('đang khiêng thì không khiêng thêm người thứ hai khi chính mình đang bị khiêng (busy)', () => {
  const s = server(), C = 'player-cccccccc'; s(base(A, { lv: 3, str: 30 })); s(base(C, { lv: 1, str: 5, x: 1, z: 61 }));
  assert.equal(s({ ...base(B, { lv: 9, str: 99 }), ty: A, g: 1 }).grabbed, true, 'B khiêng A');
  assert.equal(s({ ...base(A, { lv: 3, str: 30 }), ty: C, g: 1 }).reason, 'busy', 'A đang nằm trên vai B nên không khiêng được ai');
});
test('máy khách: planGrab (lý do/gói g:1), planHeldThrow (điểm rơi + gói), holdLeft, heldInfo, lý do mới', () => {
  const me = { lv: 5, str: 60, x: 0, z: 60 }, tgt = { id: B, lv: 2, str: 20, x: 1, z: 60 };
  const g = planGrab({ pageId: A, name: 'An', me, tgt }); assert.equal(g.ok, true); assert.equal(g.req.g, 1); assert.equal(g.req.ty, B); assert.equal(g.req.lx, undefined);
  assert.equal(planGrab({ pageId: A, name: 'An', me, tgt: { ...tgt, lv: 5 } }).reason, 'level');
  assert.equal(planGrab({ pageId: A, name: 'An', me: { ...me, z: 10 }, tgt: { ...tgt, z: 10 } }).reason, 'temple');
  assert.equal(planGrab({ pageId: A, name: 'An', me, tgt, cd: { [`${A}>${B}`]: 6.1 } }).reason, 'cooldown');
  const t = planHeldThrow({ pageId: A, name: 'An', me, tgtId: B, ry: 0 }); assert.equal(t.req.ty, B); assert.ok(t.land.z > 60 && t.land.z <= 60 + throwRange(60, PLAYER_KG)); assert.equal(t.req.lz, t.land.z);
  assert.equal(HOLD_MS, 2000); assert.equal(holdLeft(1000, 1000), 2); assert.equal(holdLeft(1000, 2500), 0.5); assert.equal(holdLeft(1000, 3500), 0); assert.equal(holdLeft('x', 'y'), 2);
  assert.deepEqual(heldInfo({ held: { f: A, n: 'An', ms: 3000 } }), { f: A, n: 'An', ms: 3000 });
  assert.equal(heldInfo({ held: { f: A, n: 'An', ms: 99999 } }).ms, HELD_MAX_MS);
  for (const bad of [null, {}, { held: null }, { held: { f: '', n: 'x', ms: 5 } }, { held: { f: A, ms: 0 } }, { held: { f: A, ms: NaN } }, 'x']) assert.equal(heldInfo(bad), null);
  assert.match(reasonText('held'), /khiêng/); assert.match(reasonText('nothold'), /chưa khiêng/); assert.match(reasonText('busy'), /bận/);
});
