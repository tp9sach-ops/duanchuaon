// Phiên 166 (mục 1): đồng bộ vật phẩm qua mạng để người khác thấy gậy / nón / cưỡi / bánh.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { encodeGear, decodeGear, cleanGear, sameGear } from '../js/world/gearSync.js';
import { cleanPlayer, createRemotes } from '../js/engines/room.js';
import { createFirebaseTransport } from '../js/net/firebaseTransport.js';
import { createRoomClient, createLocalTransport } from '../js/net/roomClient.js';
import { withGasBridge } from '../js/net/bridge.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('encodeGear / decodeGear: khứ hồi đủ món, không có gì thì rỗng, chỉ một món cưỡi', () => {
  assert.equal(encodeGear({}), ''); assert.equal(encodeGear(null), ''); assert.equal(encodeGear({ ride: 'xe' }), '');
  const all = encodeGear({ staff: true, hat: true, ride: 'nhuy', regen: true, revive: true });
  assert.deepEqual(decodeGear(all), { staff: true, hat: true, ride: 'nhuy', regen: true, revive: true });
  for (const r of ['thuong', 'nhuy', 'van']) assert.equal(decodeGear(encodeGear({ ride: r })).ride, r);
  assert.deepEqual(decodeGear(''), { staff: false, hat: false, ride: '', regen: false, revive: false });
  assert.equal(encodeGear({ staff: 1, hat: 'yes' }), '', 'chỉ true thật mới tính');
});
test('cleanGear: chữ lạ / quá dài / hoa / không phải chuỗi → bỏ; trùng chữ gộp', () => {
  assert.equal(cleanGear('nk'), 'nk'); assert.equal(cleanGear('nnk'), 'nk'); assert.equal(cleanGear('NK'), ''); assert.equal(cleanGear('n k'), '');
  assert.equal(cleanGear('abcdefghi'), ''); assert.equal(cleanGear(null), ''); assert.equal(cleanGear({}), ''); assert.equal(cleanGear('zzz'), '');
  assert.equal(decodeGear('pq').ride, 'thuong', 'nhiều chữ cưỡi thì lấy chữ đầu'); assert.equal(sameGear('kn', 'kn'), true); assert.equal(sameGear('kn', 'nk'), false);
});
test('cleanPlayer: có đồ thì giữ trường i, không có thì KHÔNG thêm trường (gói tin cũ không đổi)', () => {
  assert.equal(cleanPlayer({ id: 'player-0001', i: 'nkh' }).i, 'nkh');
  assert.ok(!('i' in cleanPlayer({ id: 'player-0001' }))); assert.ok(!('i' in cleanPlayer({ id: 'player-0001', i: '<script>' })));
});
test('createRemotes: đồ của người khác đi theo từng bước và được bỏ khi họ cất', () => {
  const R = createRemotes(); R.ingest([{ id: 'aaaaaaaa', x: 0, z: 0, i: 'nk' }]);
  assert.equal(R.step(0.1)[0].i, 'nk');
  R.ingest([{ id: 'aaaaaaaa', x: 0, z: 0 }]); assert.equal(R.step(0.1)[0].i, '', 'cất đồ → rỗng');
});

// ---------- Firebase giả (rút gọn): kiểm trường i đi qua và tự lùi khi luật cũ từ chối
function fakeFb({ rejectGear = false } = {}) {
  const tree = { players: {}, chat: {} }, sets = [], listeners = [];
  const snap = (key, val) => ({ key, val: () => val, forEach() {} });
  const sdk = {
    initializeApp: () => ({}), initializeAuth: () => ({}), inMemoryPersistence: {}, getAuth: () => ({}),
    signInAnonymously: async () => ({ user: { uid: 'uid0000000001abcdefghij' } }), getDatabase: () => ({}), ref: (db, p) => ({ p }),
    query: (ref) => ({ ref }), limitToLast: () => ({}),
    onValue: (ref, cb) => { cb({ val: () => true }); return () => {}; }, onDisconnect: () => ({ remove: async () => {} }),
    get: async () => ({ val: () => null, forEach() {} }),
    onChildAdded: () => () => {}, onChildChanged: (r, cb) => { listeners.push(cb); return () => {}; }, onChildRemoved: () => () => {},
    set: async (ref, val) => { sets.push({ ...val }); if (rejectGear && 'i' in val) throw new Error('PERMISSION_DENIED'); tree.players[ref.p.split('/')[1]] = val; },
    push: async () => {}, remove: async () => {}, goOffline() {}, deleteApp: async () => {},
  };
  return { sdk, sets, tree, loadSdk: async () => sdk };
}
const st = (extra = {}) => ({ action: 'sync', n: 'An', c: '9sach', h: 'troc', x: 1, y: 0, z: 2, r: 0.5, s: 'idle', since: 0, ...extra });
const tick = () => new Promise((r) => setTimeout(r, 5));

test('Firebase: có đồ thì ghi kèm i; không có đồ thì KHÔNG có khóa i', async () => {
  const F = fakeFb(), T = { t: 1_000_000 }, a = createFirebaseTransport({ config: {}, loadSdk: F.loadSdk, now: () => T.t }); await a.connect();
  await a.call(st()); assert.ok(!('i' in F.sets.at(-1)));
  T.t += 300; await a.call(st({ i: 'nkh' })); assert.equal(F.sets.at(-1).i, 'nkh');
  T.t += 300; await a.call(st({ i: '' })); assert.ok(!('i' in F.sets.at(-1)), 'cất hết đồ → bản ghi mới không còn i');
});
test('Firebase: luật cũ từ chối trường i → gửi lại KHÔNG kèm i, người chơi không biến mất', async () => {
  const F = fakeFb({ rejectGear: true }), T = { t: 1_000_000 }, a = createFirebaseTransport({ config: {}, loadSdk: F.loadSdk, now: () => T.t }); await a.connect();
  const warn = console.warn; let warned = 0; console.warn = () => { warned++; };
  try {
    await a.call(st({ i: 'n' })); await tick();
    T.t += 300; await a.call(st({ i: 'n' })); await tick();
    assert.ok(F.sets.some((s) => 'i' in s), 'lần đầu có thử gửi i'); assert.ok(!('i' in F.sets.at(-1)), 'sau khi bị từ chối thì thôi gửi i');
    assert.ok(F.tree.players['uid0000000001abcdefghij'], 'bản ghi của mình vẫn được ghi'); assert.equal(warned, 1, 'chỉ cảnh báo một lần');
    T.t += 300; await a.call(st({ i: 'nk' })); await tick(); assert.ok(!('i' in F.sets.at(-1)), 'không thử lại mãi');
  } finally { console.warn = warn; }
});

// ---------- Apps Script (gas/Room.gs) trong vm
function makeServer() {
  const store = {}; let t = 1_000_000;
  const ctx = { Date: { now: () => t }, CacheService: { getScriptCache: () => ({ get: (k) => store[k] ?? null, put: (k, v) => { store[k] = v; } }) }, LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) } };
  vm.createContext(ctx); vm.runInContext(readFileSync(path.join(root, 'gas/Room.gs'), 'utf8'), ctx);
  return { sync: (req) => JSON.parse(JSON.stringify(vm.runInContext('roomSync_', ctx)(req))) };
}
test('Room.gs: lưu và trả lại trường i; giá trị bậy → rỗng', () => {
  const S = makeServer(), a = { action: 'sync', n: 'An', c: '9sach', h: 'troc', x: 1, y: 0, z: 2, r: 0.5, s: 'idle', since: 0 };
  S.sync({ ...a, id: 'page-aaaaaa', i: 'nkp' }); S.sync({ ...a, id: 'page-cccccc', i: '<b>' });
  const r = S.sync({ ...a, id: 'page-bbbbbb' }), byId = Object.fromEntries(r.players.map((p) => [p.id, p]));
  assert.equal(byId['page-aaaaaa'].i, 'nkp'); assert.equal(byId['page-cccccc'].i, '');
});
test('firebase/database.rules.json: có luật cho trường i (chữ thường 1–8 ký tự)', () => {
  const rules = JSON.parse(readFileSync(path.join(root, 'firebase/database.rules.json'), 'utf8')), p = rules.rules.players.$uid;
  assert.ok(p.i && /a-z/.test(p.i['.validate']) && /1,8/.test(p.i['.validate'])); assert.equal(p.$other['.validate'], false, 'vẫn chặn trường lạ khác');
  assert.ok(!/'i'/.test(p['.validate']), 'i không bắt buộc (người không có đồ không gửi)');
});

// ---------- cầu nối + kênh cục bộ + roomClient
test('bridge: chuyển trường i sang Apps Script', async () => {
  const calls = []; let n = 0; const t = { uid: 'uid-fb-aaaaaaaa', call: async () => ({ ok: true, players: [], count: 1 }) };
  withGasBridge(t, { gasCall: async (req) => { calls.push(req); return { ok: true, players: [] }; }, now: () => (n += 5000) });
  await t.call({ n: 'An', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle', i: 'nk' }); await tick();
  assert.equal(calls[0].i, 'nk');
});
test('kênh cục bộ: trường i đi giữa các tab', async () => {
  const bus = new Set(); class BC { constructor() { this.onmessage = null; bus.add(this); } postMessage(d) { for (const o of bus) if (o !== this && o.onmessage) o.onmessage({ data: d }); } close() {} }
  const A = createLocalTransport({ BC }), B = createLocalTransport({ BC });
  await A({ id: 'tab-aaaaaaaa', n: 'A', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle', i: 'q' });
  const r = await B({ id: 'tab-bbbbbbbb', n: 'B', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle' });
  assert.equal(r.players.find((p) => p.id === 'tab-aaaaaaaa').i, 'q');
});
test('roomClient: gửi i của mình; gọi applyGear mỗi khung với chuỗi của người khác; dropGear khi họ rời hoặc đổi áo', async () => {
  const scene = { add() {}, remove() {} }, reqs = [], applied = [], dropped = [], responses = [];
  const makeAvatar = () => ({ group: { position: { set() {} } }, setFacing() {}, setState() {}, say() {}, update() {}, dispose() {} });
  const c = createRoomClient({ call: async (r) => { reqs.push(r); return responses.shift() ?? { ok: true, players: [], chat: [], seq: 0, count: 1 }; }, getSelf: () => ({ n: 'T', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle', i: 'nk' }), makeAvatar, scene, pageId: 'page-self0001', schedule: () => 1, cancel() {},
    applyGear: (av, tok, dt) => applied.push([tok, dt]), dropGear: (av) => dropped.push(av) });
  const P = (extra = {}) => ({ id: 'other-0001', n: 'Binh', c: 'nau', h: 'troc', x: 1, y: 0, z: 1, r: 0, s: 'idle', ...extra });
  responses.push({ ok: true, players: [P({ i: 'q' })], chat: [], seq: 0, count: 2 }); await c.tick(); c.frame(0.05);
  assert.equal(reqs[0].i, 'nk'); assert.deepEqual(applied.at(-1), ['q', 0.05]);
  responses.push({ ok: true, players: [P()], chat: [], seq: 0, count: 2 }); await c.tick(); c.frame(0.05); assert.equal(applied.at(-1)[0], '', 'cất đồ → chuỗi rỗng');
  responses.push({ ok: true, players: [P({ n: 'Binh2' })], chat: [], seq: 0, count: 2 }); await c.tick(); c.frame(0.05); assert.equal(dropped.length, 1, 'đổi tên → dựng lại → dọn đồ cũ');
  responses.push({ ok: true, players: [], chat: [], seq: 0, count: 1 }); await c.tick(); c.frame(0.05); assert.equal(dropped.length, 2, 'rời chùa → dọn đồ');
  c.start(); c.stop(); assert.equal(c.remoteCount, 0);
});
test('roomClient: applyGear ném lỗi thì người vẫn hiện, đồng bộ không hỏng', async () => {
  const scene = { add() {}, remove() {} }; let up = 0;
  const c = createRoomClient({ call: async () => ({ ok: true, players: [{ id: 'other-0001', n: 'B', c: 'nau', h: 'troc', x: 1, y: 0, z: 1, r: 0, s: 'idle' }], chat: [], seq: 0, count: 2 }), getSelf: () => ({ n: 'T', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle' }), pageId: 'page-self0001', schedule: () => 1, cancel() {}, scene,
    makeAvatar: () => ({ group: { position: { set() {} } }, setFacing() {}, setState() {}, say() {}, update() { up++; }, dispose() {} }), applyGear: () => { throw new Error('hỏng'); } });
  await c.tick(); c.frame(0.05); c.frame(0.05); assert.equal(up, 2); assert.equal(c.remoteCount, 1);
});
