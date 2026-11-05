import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createFirebaseTransport, loadFirebaseSdk, FIREBASE_SDK_VERSION } from '../js/net/firebaseTransport.js';
import { createTransportManager } from '../js/net/transportManager.js';
import { createRoomClient } from '../js/net/roomClient.js';
import { createRemotes, ROOM_CFG } from '../js/engines/room.js';
import { STATES } from '../js/world/avatarLogic.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- Firebase giả (bộ nhớ): đủ các hàm mà firebaseTransport.js dùng, nhiều "khách" dùng chung một cơ sở dữ liệu
function makeFakeFirebase() {
  const B = { tree: { players: {}, chat: {} }, online: true, listeners: [], onConnWatchers: [], disconnects: new Map(), uidN: 0, pushN: 0, sets: [], authFail: false };
  const snap = (key, val) => ({ key, val: () => val, forEach: (fn) => { /* không dùng */ } });
  const emit = (coll, ev, key) => { for (const l of B.listeners) if (l.coll === coll && l.ev === ev) l.cb(snap(key, B.tree[coll][key])); };
  const sdk = {
    initializeApp: (config, name) => ({ config, name }),
    initializeAuth: () => ({}), inMemoryPersistence: {}, getAuth: () => ({}),
    signInAnonymously: async () => { if (B.authFail) throw new Error('auth/operation-not-allowed'); B.uidN++; return { user: { uid: 'uid' + String(B.uidN).padStart(10, '0') + 'abcdefghij' } }; },
    getDatabase: (app) => ({ app }),
    ref: (db, p) => ({ db, p }),
    query: (ref, ...cs) => ({ ref, limit: (cs.find((c) => c && c.limit) || {}).limit }),
    limitToLast: (n) => ({ limit: n }),
    onValue: (ref, cb) => { if (ref.p !== '.info/connected') return () => {}; const w = (v) => cb({ val: () => v }); B.onConnWatchers.push(w); w(B.online); return () => { B.onConnWatchers = B.onConnWatchers.filter((x) => x !== w); }; },
    onDisconnect: (ref) => ({ remove: async () => { B.disconnects.set(ref.p, true); } }),
    get: async (rq) => {
      const r = rq.ref || rq, coll = r.p, data = B.tree[coll] || {}, keys = Object.keys(data), use = rq.limit ? keys.slice(-rq.limit) : keys;
      const out = {}; for (const k of use) out[k] = data[k];
      return { val: () => (use.length ? out : null), forEach: (fn) => { for (const k of use) fn({ key: k, val: () => data[k] }); } };
    },
    onChildAdded: (rq, cb) => {
      const r = rq.ref || rq, coll = r.p, data = B.tree[coll], keys = Object.keys(data), init = rq.limit ? keys.slice(-rq.limit) : keys;
      for (const k of init) cb(snap(k, data[k]));
      const l = { coll, ev: 'added', cb }; B.listeners.push(l); return () => { B.listeners = B.listeners.filter((x) => x !== l); };
    },
    onChildChanged: (r, cb) => { const l = { coll: r.p, ev: 'changed', cb }; B.listeners.push(l); return () => { B.listeners = B.listeners.filter((x) => x !== l); }; },
    onChildRemoved: (r, cb) => { const l = { coll: r.p, ev: 'removed', cb }; B.listeners.push(l); return () => { B.listeners = B.listeners.filter((x) => x !== l); }; },
    set: async (ref, val) => { B.sets.push(ref.p); const [coll, key] = ref.p.split('/'), had = key in B.tree[coll]; B.tree[coll][key] = val; emit(coll, had ? 'changed' : 'added', key); },
    push: async (ref, val) => { const key = 'k' + String(++B.pushN).padStart(5, '0'); B.tree[ref.p][key] = val; emit(ref.p, 'added', key); },
    remove: async (ref) => { const [coll, key] = ref.p.split('/'); if (key in B.tree[coll]) { const old = B.tree[coll][key]; delete B.tree[coll][key]; for (const l of B.listeners) if (l.coll === coll && l.ev === 'removed') l.cb(snap(key, old)); } },
    goOffline: () => {}, deleteApp: async () => {},
  };
  return { B, sdk, loadSdk: async () => sdk, setOnline(v) { B.online = v; for (const w of [...B.onConnWatchers]) w(v); } };
}
const CFG = { databaseURL: 'https://x-default-rtdb.firebasedatabase.app' };
const mk = (F, T, extra = {}) => createFirebaseTransport({ config: CFG, name: 'Chùa 1', loadSdk: F.loadSdk, now: () => T.t, ...extra });
const state = (x = 1, extra = {}) => ({ action: 'sync', n: 'An', c: '9sach', h: 'troc', x, y: 0, z: 2, r: 0.5, s: 'idle', since: 0, ...extra });

test('Firebase: hai khách thấy nhau (không thấy chính mình), count đúng, dữ liệu đúng khuôn luật', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 }, a = mk(F, T), b = mk(F, T);
  await a.connect(); await b.connect();
  await a.call(state(1, { n: 'An' })); await b.call(state(5, { n: 'Binh' }));
  const ra = await a.call(state(1)), rb = await b.call(state(5));
  assert.equal(ra.ok, true); assert.equal(ra.players.length, 1); assert.equal(ra.players[0].n, 'Binh'); assert.equal(ra.players[0].x, 5); assert.equal(ra.count, 2);
  assert.equal(rb.players.length, 1); assert.equal(rb.players[0].id, a.uid);
  const rec = F.B.tree.players[a.uid]; assert.deepEqual(Object.keys(rec).sort(), ['c', 'h', 'n', 'r', 's', 't', 'x', 'y', 'z']);
  assert.ok(STATES.includes(rec.s)); assert.ok(F.B.disconnects.has('players/' + a.uid), 'đã đăng ký tự xóa khi rớt mạng');
});
test('Firebase: nhịp trả lời nhanh và tự khai hệ số bám/chu kỳ khi tab ẩn', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 }, a = mk(F, T); await a.connect();
  const r = await a.call(state()); assert.ok(r.minPollMs <= 250 && r.pollMs <= 500); assert.ok(r.hiddenMs < ROOM_CFG.ttlMs / 2); assert.ok(r.follow > 1.4);
});
test('Firebase: điều tiết gửi — tối đa 4 lần/giây khi di chuyển; đứng yên chỉ báo còn sống mỗi 5 giây', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 }, a = mk(F, T); await a.connect();
  F.B.sets.length = 0;
  for (let i = 0; i < 20; i++) { T.t += 50; await a.call(state(i)); }            // 1 giây, đổi vị trí mỗi 50 ms
  assert.ok(F.B.sets.length <= 5 && F.B.sets.length >= 3, 'gửi ' + F.B.sets.length);
  F.B.sets.length = 0;
  for (let i = 0; i < 40; i++) { T.t += 100; await a.call(state(100)); }         // 4 giây đứng yên
  assert.ok(F.B.sets.length <= 1, 'đứng yên gửi ' + F.B.sets.length);
  T.t += 5000; await a.call(state(100)); assert.ok(F.B.sets.length >= 1 && F.B.sets.length <= 2, 'báo còn sống');
});
test('Firebase: góc quay lớn được quy về ±π (khớp luật |r| ≤ 7); tọa độ ngoài chùa bị kẹp', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 }, a = mk(F, T); await a.connect();
  await a.call(state(9999, { r: 40, z: -9999 })); const rec = F.B.tree.players[a.uid];
  assert.ok(Math.abs(rec.r) <= Math.PI + 1e-9); assert.equal(rec.x, ROOM_CFG.limit); assert.equal(rec.z, -ROOM_CFG.limit);
});
test('Firebase: người im quá 15 giây bị bỏ; người xóa mình (rớt mạng) biến mất ngay', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 }, a = mk(F, T), b = mk(F, T); await a.connect(); await b.connect();
  await b.call(state(5, { n: 'Binh' })); assert.equal((await a.call(state())).players.length, 1);
  T.t += 16000; assert.equal((await a.call(state())).players.length, 0, 'quá 15 giây không có tin');
  T.t += 10; await b.call(state(6, { n: 'Binh' })); assert.equal((await a.call(state())).players.length, 1);
  await F.sdk.remove({ p: 'players/' + b.uid }); assert.equal((await a.call(state())).players.length, 0, 'xóa là mất ngay');
});
test('Firebase: lời nhắn tới người khác (không về chính mình), lọc link, lời cũ không hiện lại', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 };
  F.B.tree.chat.old00001 = { id: 'someone-else-0001', n: 'Cu', m: 'lời cũ', t: 1 };
  const a = mk(F, T), b = mk(F, T); await a.connect(); await b.connect();
  await a.call(state()); await b.call(state(2));
  assert.equal((await b.call(state(2))).chat.length, 0, 'lời cũ chỉ đánh dấu, không hiện lại');
  await a.call(state(1, { say: 'xin chào' })); const rb = await b.call(state(2)), ra = await a.call(state(1));
  assert.equal(rb.chat.length, 1); assert.equal(rb.chat[0].m, 'xin chào'); assert.equal(rb.chat[0].id, a.uid); assert.equal(ra.chat.length, 0);
  T.t += 3000; await a.call(state(1, { say: 'vào http://x.com' })); assert.equal((await b.call(state(2, { since: rb.seq }))).chat.length, 0, 'link bị chặn');
  T.t += 3000; await a.call(state(1, { say: 'nhanh 1' })); T.t += 100; await a.call(state(1, { say: 'nhanh 2' }));
  const r2 = await b.call(state(2, { since: rb.seq })); assert.equal(r2.chat.length, 1, 'cách nhau dưới 2 giây chỉ nhận 1 lời'); assert.equal(r2.chat[0].m, 'nhanh 1');
});
test('Firebase: phòng đã đủ 30 người thì người thứ 31 bị từ chối khi vào (room_full)', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 };
  for (let i = 0; i < ROOM_CFG.maxPlayers; i++) F.B.tree.players['other' + String(i).padStart(8, '0') + 'zzzz'] = { n: 'P' + i, c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle', t: T.t };
  await assert.rejects(() => mk(F, T).connect(), /room_full/);
  delete F.B.tree.players['other' + '00000000' + 'zzzz']; await mk(F, T).connect();
});
test('Firebase: bóng ma cũ (>1 phút) không chiếm chỗ; không kết nối được thì quá hạn; đăng nhập lỗi thì ném lỗi', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 };
  for (let i = 0; i < 40; i++) F.B.tree.players['ghost' + String(i).padStart(8, '0') + 'zzzz'] = { n: 'M', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle', t: 5 };
  await mk(F, T).connect();
  const G = makeFakeFirebase(); G.setOnline(false); await assert.rejects(() => mk(G, T).connect(30), /timeout/);
  const H = makeFakeFirebase(); H.B.authFail = true; await assert.rejects(() => mk(H, T).connect(500), /auth/);
  const K = createFirebaseTransport({ config: CFG, loadSdk: async () => { throw new Error('mạng chặn gstatic'); }, now: () => T.t }); await assert.rejects(() => K.connect(500), /gstatic/);
});
test('Firebase: mất kết nối thì call trả ok:false (offline); nối lại thì chạy tiếp; close dọn nhân vật của mình', async () => {
  const F = makeFakeFirebase(), T = { t: 1_000_000 }, a = mk(F, T); await a.connect(); await a.call(state());
  F.setOnline(false); assert.deepEqual(await a.call(state()), { ok: false, error: 'offline' });
  F.setOnline(true); assert.equal((await a.call(state())).ok, true);
  a.close(); await new Promise((r) => setImmediate(r)); assert.equal(F.B.tree.players[a.uid], undefined); assert.equal((await a.call(state())).ok, false);
});
test('loadFirebaseSdk: tải 3 mô-đun đúng phiên bản ghim từ gstatic', async () => {
  const urls = []; const sdk = await loadFirebaseSdk('9.9.9', async (u) => { urls.push(u); return { [u.split('/').pop().replace('.js', '')]: 1 }; });
  assert.deepEqual(urls.sort(), ['https://www.gstatic.com/firebasejs/9.9.9/firebase-app.js', 'https://www.gstatic.com/firebasejs/9.9.9/firebase-auth.js', 'https://www.gstatic.com/firebasejs/9.9.9/firebase-database.js']);
  assert.equal(Object.keys(sdk).length, 3); assert.match(FIREBASE_SDK_VERSION, /^\d+\.\d+\.\d+$/);
});

// ---------- chuỗi dự phòng
function fakeTransport(name, opts = {}) {
  const t = { name, kind: opts.kind || 'firebase', calls: 0, closed: false, mode: opts.mode || 'ok',
    async connect() { if (opts.connectFail) throw new Error(opts.connectFail); },
    async call() { t.calls++; if (t.mode === 'throw') throw new Error('x'); return t.mode === 'ok' ? { ok: true, players: [], chat: [], seq: 0, count: 1 } : { ok: false, error: t.mode }; },
    close() { t.closed = true; } };
  return t;
}
function mkManager(entries, T, extra = {}) {
  const made = {}, switches = [];
  const m = createTransportManager({ rooms: entries.map((e) => ({ type: e.kind || 'firebase', name: e.name })), now: () => T.t, onSwitch: (s) => switches.push(s),
    makeTransport: (entry) => { const e = entries.find((x) => x.name === entry.name); return (made[e.name] = e.make ? e.make() : fakeTransport(e.name, e)); }, ...extra });
  return { m, made, switches };
}

test('Chuỗi: dùng nơi đầu tiên khi được; báo nơi đang dùng', async () => {
  const T = { t: 0 }, { m, made, switches } = mkManager([{ name: 'Chùa 1' }, { name: 'Chùa 2' }, { name: 'Dự phòng', kind: 'gas' }], T);
  assert.equal((await m.call({})).ok, true); assert.equal(made['Chùa 1'].calls, 1); assert.equal(made['Chùa 2'], undefined);
  assert.deepEqual(switches.map((s) => [s.name, s.first]), [['Chùa 1', true]]); assert.equal(m.current.index, 0);
});
test('Chuỗi: không kết nối được / phòng đầy → sang nơi kế; hết Firebase → Apps Script; ghi lý do', async () => {
  const T = { t: 0 }, errs = [], { m, made, switches } = mkManager([{ name: 'Chùa 1', connectFail: 'timeout' }, { name: 'Chùa 2', connectFail: 'room_full' }, { name: 'Dự phòng', kind: 'gas' }], T, { onError: (e) => errs.push(e.name + ':' + e.error.message) });
  assert.equal((await m.call({})).ok, true); assert.deepEqual(errs, ['Chùa 1:timeout', 'Chùa 2:room_full']);
  assert.equal(switches.length, 1); assert.equal(switches[0].name, 'Dự phòng'); assert.equal(switches[0].kind, 'gas'); assert.equal(made['Chùa 1'].closed, true); assert.equal(made['Chùa 2'].closed, true);
});
test('Chuỗi: giữa chừng lỗi liên tục ≥ 6 giây thì chuyển (lỗi ngắn thì không); báo onSwitch để client dọn', async () => {
  const T = { t: 0 }, { m, made, switches } = mkManager([{ name: 'Chùa 1' }, { name: 'Dự phòng', kind: 'gas' }], T);
  await m.call({}); made['Chùa 1'].mode = 'offline';
  T.t += 1000; await m.call({}); T.t += 3000; await m.call({}); assert.equal(m.current.index, 0, 'mới lỗi 3 giây');
  made['Chùa 1'].mode = 'ok'; T.t += 100; await m.call({}); made['Chùa 1'].mode = 'offline'; T.t += 100; await m.call({}); T.t += 5000; await m.call({});
  assert.equal(m.current.index, 0, 'lỗi đã ngắt quãng, đếm lại từ đầu');
  T.t += 7000; await m.call({}); assert.equal(m.current.index, 1); assert.equal(made['Chùa 1'].closed, true);
  assert.deepEqual(switches.map((s) => s.name), ['Chùa 1', 'Dự phòng']); assert.equal(switches[1].first, false);
});
test('Chuỗi: cuối chuỗi thì ở lại (không bỏ Apps Script); phòng Apps Script đầy không kích hoạt chuyển', async () => {
  const T = { t: 0 }, { m, made } = mkManager([{ name: 'Dự phòng', kind: 'gas' }], T);
  await m.call({}); made['Dự phòng'].mode = 'offline'; T.t += 20000; assert.equal((await m.call({})).ok, false); T.t += 20000; await m.call({}); assert.equal(m.current.index, 0);
  const U = { t: 0 }, M2 = mkManager([{ name: 'A' }, { name: 'B' }], U); await M2.m.call({}); M2.made.A.mode = 'room_full'; U.t += 30000; await M2.m.call({}); U.t += 30000; await M2.m.call({}); assert.equal(M2.m.current.index, 0, 'room_full không đổi nơi');
});
test('Chuỗi: không có nơi nào dùng được → no_transport, lần sau thử lại từ đầu', async () => {
  const T = { t: 0 }; let ok = false;
  const { m } = mkManager([{ name: 'A', make: () => ({ kind: 'firebase', name: 'A', connect: async () => { if (!ok) throw new Error('x'); }, call: async () => ({ ok: true }) }) }], T);
  assert.equal((await m.call({})).error, 'no_transport'); ok = true; assert.equal((await m.call({})).ok, true);
});
test('Chuỗi: đang ở nơi dự phòng thì cứ 10 phút thử lại nơi ưu tiên và quay về khi được', async () => {
  const T = { t: 0 }; let up = false;
  const { m, switches } = mkManager([{ name: 'Chùa 1', make: () => ({ kind: 'firebase', name: 'Chùa 1', connect: async () => { if (!up) throw new Error('x'); }, call: async () => ({ ok: true, players: [], chat: [], seq: 0, count: 1 }), close() {} }) }, { name: 'Dự phòng', kind: 'gas' }], T);
  await m.call({}); assert.equal(m.current.index, 1);
  T.t += 300000; await m.call({}); assert.equal(m.current.index, 1, 'chưa tới 10 phút');
  up = true; T.t += 400000; await m.call({}); await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
  assert.equal(m.current.index, 0); assert.equal(switches.at(-1).name, 'Chùa 1');
});

// ---------- roomClient dùng nhịp do đường truyền khai + reset khi đổi nơi
function deps(call, extra = {}) {
  const timers = []; const added = [];
  return { timers, added, call, pageId: 'page-self-0001', scene: { add: (g) => added.push(g), remove() {} }, getSelf: () => ({ n: 'An', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle' }),
    makeAvatar: () => ({ group: { position: { set() {} } }, setFacing() {}, setState() {}, say() {}, update() {}, dispose() {} }), schedule: (fn, ms) => { timers.push(ms); return timers.length; }, cancel() {}, ...extra };
}
test('roomClient: chu kỳ ngắn do đường truyền khai được tôn trọng (Apps Script không khai thì vẫn ≥ 1,5 giây); tab ẩn dùng hiddenMs', async () => {
  const fast = deps(async () => ({ ok: true, players: [], chat: [], seq: 0, count: 1, pollMs: 250, minPollMs: 200, hiddenMs: 4000, follow: 5 }));
  const c1 = createRoomClient(fast); c1.start(); await c1.tick(); assert.equal(fast.timers.at(-1), 250);
  c1.setActive(false); await c1.tick(); assert.equal(fast.timers.at(-1), 4000);
  const slow = deps(async () => ({ ok: true, players: [], chat: [], seq: 0, count: 1, pollMs: 250 }));
  const c2 = createRoomClient(slow); c2.start(); await c2.tick(); assert.equal(slow.timers.at(-1), ROOM_CFG.minPollMs);
  c2.setActive(false); await c2.tick(); assert.ok(slow.timers.at(-1) >= 9000);
});
test('roomClient.reset: quên mốc lời nhắn nơi cũ (lần đầu ở nơi mới chỉ lấy mốc) và bỏ người của nơi cũ', async () => {
  const seen = []; let seq = 5;
  const d = deps(async (req) => { seen.push(req.since); return { ok: true, players: [{ id: 'other-0001', n: 'B', c: 'nau', h: 'troc', x: 1, y: 0, z: 1, r: 0, s: 'idle' }], chat: [{ id: 'other-0001', m: 'cũ' }], seq, count: 2 }; });
  const shown = []; d.onChat = (c) => shown.push(c.text);
  const c = createRoomClient(d); await c.tick(); c.frame(0.1); assert.equal(c.remoteCount, 1);
  seq = 9; await c.tick(); assert.deepEqual(seen, [0, 5]); assert.equal(shown.length, 1, 'lần thứ hai hiện lời nhắn mới');
  c.reset(); c.frame(0.1); assert.equal(c.remoteCount, 0, 'đã dọn người của nơi cũ'); seq = 2; await c.tick(); assert.equal(seen.at(-1), 0); assert.equal(shown.length, 1, 'lần đầu sau reset không hiện lại lời nhắn cũ');
});
test('createRemotes.follow: bám sát hơn thì đuổi kịp nhanh hơn; vẫn không vượt 6,5 m/s', () => {
  const run = (follow) => { const R = createRemotes(); R.follow = follow; R.ingest([{ id: 'aaaaaaaa', x: 0, z: 0 }]); R.ingest([{ id: 'aaaaaaaa', x: 3, z: 0, s: 'walk' }]); let o; for (let i = 0; i < 10; i++) o = R.step(0.05)[0]; return o; };
  const slow = run(1.4), fast = run(5); assert.ok(fast.x > slow.x); assert.ok(fast.x <= 6.5 * 0.5 + 1e-9, 'tối đa 6,5 m/s trong 0,5 giây');
});

// ---------- luật Firebase khớp quy tắc của code
test('firebase/database.rules.json: hợp lệ, khớp danh sách trạng thái/giới hạn của code, chỉ ghi vào chỗ của mình', () => {
  const rules = JSON.parse(readFileSync(path.join(root, 'firebase/database.rules.json'), 'utf8')).rules;
  assert.equal(rules['.read'], false); assert.equal(rules['.write'], false);
  const pl = rules.players.$uid; assert.match(pl['.write'], /auth\.uid === \$uid/);
  const sRule = pl.s['.validate']; for (const s of STATES) assert.ok(sRule.includes("'" + s + "'"), 'thiếu trạng thái ' + s);
  assert.equal((sRule.match(/'[a-z]+'/g) || []).length, STATES.length);
  assert.ok(pl.x['.validate'].includes(String(ROOM_CFG.limit))); assert.ok(pl.z['.validate'].includes(String(ROOM_CFG.limit))); assert.ok(pl.r['.validate'].includes('7'));
  assert.ok(pl.n['.validate'].includes('20')); assert.ok(rules.chat.$id.m['.validate'].includes(String(ROOM_CFG.chatMax)));
  assert.match(rules.chat.$id['.validate'], /auth\.uid/); assert.equal(pl.$other['.validate'], false); assert.equal(rules.chat.$id.$other['.validate'], false);
});
test('config.js: rooms có Firebase trước, Apps Script (gas) ở cuối; khóa Firebase chỉ là cấu hình công khai (không có private_key)', async () => {
  const { CONFIG } = await import('../js/config.js');
  assert.ok(Array.isArray(CONFIG.rooms) && CONFIG.rooms.length >= 2); assert.equal(CONFIG.rooms.at(-1).type, 'gas');
  for (const r of CONFIG.rooms.filter((x) => x.type === 'firebase')) { assert.match(r.firebaseConfig.databaseURL, /^https:\/\//); assert.ok(r.firebaseConfig.apiKey && r.firebaseConfig.projectId); }
  assert.ok(!/private_key|client_secret/i.test(readFileSync(path.join(root, 'js/config.js'), 'utf8')));
  assert.match(CONFIG.firebaseSdkVersion, /^\d+\.\d+\.\d+$/);
});
