import test from 'node:test';
import assert from 'node:assert/strict';
import { withGasBridge } from '../js/net/bridge.js';
import { createTransportManager } from '../js/net/transportManager.js';

const P = (id, x = 0) => ({ id, n: 'An', c: 'nau', h: 'troc', x, y: 0, z: 0, r: 0, s: 'idle' });
const fb = (players = [], extra = {}) => ({ kind: 'firebase', name: 'Chùa 1', uid: 'uid-firebase-A1', calls: 0, async call() { this.calls++; return { ok: true, players: players.map((p) => ({ ...p })), chat: [], seq: 0, count: players.length + 1, pollMs: 250 }; }, ...extra });
const tick = () => new Promise((r) => setImmediate(r));
const REQ = { n: 'An', c: 'nau', h: 'troc', x: 1, y: 0, z: 2, r: 0, s: 'idle', since: 0, say: '' };

test('Cầu nối: người ở Firebase thấy người chỉ ở Apps Script; mình cũng báo lên Apps Script bằng uid Firebase', async () => {
  const T = { t: 0 }, sent = [], t = withGasBridge(fb([P('uid-firebase-B2')]), { now: () => T.t, gasCall: async (r) => { sent.push(r); return { ok: true, players: [P('page-gas-only-C3', 5)] }; } });
  let r = await t.call(REQ); await tick();
  assert.equal(sent.length, 1); assert.equal(sent[0].action, 'sync'); assert.equal(sent[0].id, 'uid-firebase-A1'); assert.equal(sent[0].x, 1); assert.equal(sent[0].say, '');
  assert.deepEqual(r.players.map((p) => p.id), ['uid-firebase-B2'], 'lần gọi đầu chưa có dữ liệu Apps Script');
  T.t += 300; r = await t.call(REQ);
  assert.deepEqual(r.players.map((p) => p.id).sort(), ['page-gas-only-C3', 'uid-firebase-B2']); assert.equal(r.count, 3); assert.equal(r.pollMs, 250, 'giữ nhịp nhanh của Firebase');
});
test('Cầu nối: trùng id thì chỉ giữ một; không bao giờ thấy chính mình; chỉ gọi Apps Script mỗi 4 giây', async () => {
  const T = { t: 0 }; let n = 0;
  const t = withGasBridge(fb([P('uid-firebase-B2')]), { now: () => T.t, gasCall: async () => { n++; return { ok: true, players: [P('uid-firebase-B2', 9), P('uid-firebase-A1', 9)] }; } });
  await t.call(REQ); await tick(); T.t += 500; const r = await t.call(REQ);
  assert.deepEqual(r.players.map((p) => p.id), ['uid-firebase-B2']); assert.equal(r.players[0].x, 0, 'ưu tiên dữ liệu Firebase (mới hơn)');
  for (let i = 0; i < 6; i++) { T.t += 500; await t.call(REQ); await tick(); } assert.equal(n, 1, 'trong 4 giây chỉ gọi 1 lần'); T.t += 1000; await t.call(REQ); await tick(); assert.equal(n, 2);
});
test('Cầu nối: Apps Script lỗi/chậm không làm hỏng Firebase; dữ liệu Apps Script cũ quá 15 giây bị bỏ', async () => {
  const T = { t: 0 }; let mode = 'ok';
  const t = withGasBridge(fb([]), { now: () => T.t, gasCall: async () => { if (mode === 'throw') throw new Error('x'); if (mode === 'bad') return { ok: false }; return { ok: true, players: [P('page-gas-only-C3')] }; } });
  await t.call(REQ); await tick(); T.t += 100; assert.equal((await t.call(REQ)).players.length, 1);
  mode = 'throw'; T.t += 5000; assert.equal((await t.call(REQ)).players.length, 1, 'còn mới thì giữ'); await tick();
  T.t += 20000; const r = await t.call(REQ); assert.equal(r.ok, true); assert.equal(r.players.length, 0, 'quá 15 giây: bỏ'); await tick();
  mode = 'bad'; T.t += 5000; assert.equal((await t.call(REQ)).ok, true);
});
test('Cầu nối: không đụng tới kết quả lỗi của Firebase, hay khi thiếu gasCall', async () => {
  const bad = fb([], { async call() { return { ok: false, error: 'offline' }; } }); let called = 0;
  const t = withGasBridge(bad, { gasCall: async () => { called++; return { ok: true, players: [] }; } }); assert.equal((await t.call(REQ)).error, 'offline'); assert.equal(called, 0);
  const raw = fb([]); assert.equal(withGasBridge(raw, {}), raw);
});
test('Chuỗi: ở nơi dự phòng thì thử lại Firebase sau 15 giây, thất bại thì thưa dần (30 s, 60 s, 120 s)', async () => {
  const T = { t: 0 }; let up = false, tries = 0;
  const m = createTransportManager({ rooms: [{ type: 'firebase', name: 'F' }, { type: 'gas', name: 'G' }], now: () => T.t,
    makeTransport: (e) => e.name === 'F' ? { kind: 'firebase', name: 'F', connect: async () => { tries++; if (!up) throw new Error('x'); }, call: async () => ({ ok: true }), close() {} } : { kind: 'gas', name: 'G', call: async () => ({ ok: true }) } });
  await m.call({}); assert.equal(m.current.index, 1); assert.equal(tries, 1);
  T.t += 14000; await m.call({}); await tick(); assert.equal(tries, 1, 'chưa tới 15 giây');
  T.t += 2000; await m.call({}); await tick(); assert.equal(tries, 2, 'đủ 15 giây: thử lại');
  T.t += 29000; await m.call({}); await tick(); assert.equal(tries, 2, 'lần sau phải chờ 30 giây');
  T.t += 2000; await m.call({}); await tick(); assert.equal(tries, 3);
  T.t += 61000; await m.call({}); await tick(); assert.equal(tries, 4); T.t += 121000; await m.call({}); await tick(); assert.equal(tries, 5);
  T.t += 119000; await m.call({}); await tick(); assert.equal(tries, 5, 'trần 120 giây'); up = true; T.t += 2000; await m.call({}); await tick(); await tick();
  assert.equal(m.current.index, 0, 'Firebase sống lại thì quay về ngay lần thử kế'); assert.equal(m.current.kind, 'firebase');
});
