import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ROOM_CFG, pollInterval, chatOk, cleanPlayer, validId, angleDiff, createRemotes } from '../js/engines/room.js';
import { createRoomClient, createLocalTransport } from '../js/net/roomClient.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- logic thuần (js/engines/room.js)
test('pollInterval: thưa dần theo số người, kẹp 1,5–8 giây', () => {
  assert.equal(pollInterval(1), 1500); assert.equal(pollInterval(5), 1750); assert.equal(pollInterval(30), 8000); assert.equal(pollInterval(500), 8000); assert.equal(pollInterval(undefined), 1500);
});
test('chatOk: cắt 80 ký tự, chặn link/email/số điện thoại, bỏ khoảng trắng thừa', () => {
  assert.equal(chatOk('  xin   chào  '), 'xin chào');
  assert.equal(Array.from(chatOk('a'.repeat(200))).length, 80);
  for (const bad of ['vào http://x.com', 'www.abc', 'mail a@b', 'gọi 0912 345 678', 'abc.vn', '', '   ', null]) assert.equal(chatOk(bad), '', String(bad));
});
test('cleanPlayer: id sai thì bỏ; tọa độ bị kẹp; trạng thái lạ về idle; tên sạch', () => {
  assert.equal(cleanPlayer({ id: 'abc' }), null); assert.equal(cleanPlayer(null), null); assert.equal(validId('abcdefgh'), true);
  const p = cleanPlayer({ id: 'player-0001', n: '  An   <b>', c: '9sach', h: 'BUI!', x: 9999, z: -9999, y: 'x', r: 100, s: 'fly' });
  assert.equal(p.x, ROOM_CFG.limit); assert.equal(p.z, -ROOM_CFG.limit); assert.equal(p.y, 0); assert.equal(p.r, 7); assert.equal(p.s, 'idle');
  assert.equal(p.c, '9sach'); assert.equal(p.h, 'troc'); assert.ok(!/[<>]/.test(p.n));
  assert.equal(cleanPlayer({ id: 'player-0001', s: 'bow' }).s, 'bow');
});
test('angleDiff: đi đường ngắn qua ±π', () => {
  assert.ok(Math.abs(angleDiff(3.0, -3.0) - (2 * Math.PI - 6.0)) < 1e-9); assert.ok(Math.abs(angleDiff(0, 1) - 1) < 1e-9);
});
test('createRemotes: người mới hiện đúng chỗ, người rời bị bỏ, bỏ chính mình, nội suy dần tới đích', () => {
  const R = createRemotes();
  R.ingest([{ id: 'aaaaaaaa', x: 0, z: 0 }, { id: 'selfself1', x: 5, z: 5 }, { id: 'bbbbbbbb', x: 1, z: 1 }], 'selfself1');
  assert.equal(R.size, 2); assert.equal(R.has('selfself1'), false);
  R.ingest([{ id: 'aaaaaaaa', x: 4, z: 0, s: 'walk' }], 'selfself1');
  assert.equal(R.size, 1, 'bbbbbbbb đã rời');
  let o = R.step(0.1)[0]; assert.ok(o.x > 0 && o.x < 4); assert.equal(o.state, 'walk'); assert.ok(o.speed > 0);
  for (let i = 0; i < 100; i++) o = R.step(0.1)[0]; assert.ok(Math.abs(o.x - 4) < 0.01);
});
test('createRemotes: dịch chuyển xa (>12 m) thì nhảy tới luôn; tối đa 30 người', () => {
  const R = createRemotes(); R.ingest([{ id: 'aaaaaaaa', x: 0, z: 0 }]); R.ingest([{ id: 'aaaaaaaa', x: 50, z: 0 }]);
  assert.equal(R.step(0.016)[0].x, 50);
  const many = Array.from({ length: 40 }, (_, i) => ({ id: 'player' + String(i).padStart(4, '0'), x: i, z: 0 })); R.ingest(many);
  assert.equal(R.size, ROOM_CFG.maxPlayers);
});

// ---------- máy chủ gas/Room.gs chạy trong vm với dịch vụ giả
function makeServer() {
  const store = {}; let t = 1_000_000, lockOk = true;
  const ctx = { Date: { now: () => t }, CacheService: { getScriptCache: () => ({ get: (k) => store[k] ?? null, put: (k, v) => { store[k] = v; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => lockOk, releaseLock() {} }) } };
  vm.createContext(ctx); vm.runInContext(readFileSync(path.join(root, 'gas/Room.gs'), 'utf8'), ctx);
  const sync = (req) => JSON.parse(JSON.stringify(vm.runInContext('roomSync_', ctx)(req)));
  return { sync, advance: (ms) => { t += ms; }, setLock: (v) => { lockOk = v; }, store };
}
const me = (id, extra = {}) => ({ action: 'sync', id, n: 'An', c: '9sach', h: 'troc', x: 1, y: 0, z: 2, r: 0.5, s: 'idle', since: 0, ...extra });

test('Room.gs: vào phòng, thấy người khác nhưng không thấy chính mình; count đúng', () => {
  const S = makeServer();
  assert.deepEqual(S.sync(me('page-aaaaaa')).players, []);
  const r = S.sync(me('page-bbbbbb', { n: 'Bình', x: 3 }));
  assert.equal(r.ok, true); assert.equal(r.count, 2); assert.equal(r.players.length, 1); assert.equal(r.players[0].id, 'page-aaaaaa'); assert.equal(r.players[0].x, 1);
  assert.equal(S.sync(me('page-aaaaaa')).players[0].n, 'Bình');
  assert.ok(!('t' in r.players[0]) && !('sa' in r.players[0]), 'không lộ trường nội bộ');
});
test('Room.gs: id sai bị từ chối; không có userKey nào được lưu', () => {
  const S = makeServer();
  assert.equal(S.sync(me('x')).error, 'bad_id'); assert.equal(S.sync({ action: 'sync' }).error, 'bad_id'); assert.equal(S.sync(me('có dấu !!!!!')).error, 'bad_id');
  S.sync(me('page-aaaaaa', { userKey: 'SECRET-USER-KEY' })); assert.ok(!JSON.stringify(S.store).includes('SECRET-USER-KEY'));
});
test('Room.gs: quá 12 giây không gửi thì bị coi là đã rời', () => {
  const S = makeServer(); S.sync(me('page-aaaaaa')); S.advance(11000); assert.equal(S.sync(me('page-bbbbbb')).count, 2);
  S.advance(13000); const r = S.sync(me('page-bbbbbb')); assert.equal(r.count, 1); assert.deepEqual(r.players, []);
});
test('Room.gs: đủ 30 người thì người thứ 31 bị từ chối, người cũ vẫn gửi được', () => {
  const S = makeServer(); for (let i = 0; i < 30; i++) assert.equal(S.sync(me('page-' + String(i).padStart(6, '0'))).ok, true);
  assert.equal(S.sync(me('page-extra000')).error, 'room_full'); assert.equal(S.sync(me('page-000000')).ok, true);
});
test('Room.gs: làm sạch dữ liệu (tọa độ, trạng thái, tên, màu)', () => {
  const S = makeServer();
  S.sync(me('page-aaaaaa', { x: 1e9, z: 'abc', y: -99, r: 99, s: 'teleport', n: '  <b>Tên rất rất rất dài quá mức cho phép</b> ', c: 'BAD COLOR', h: '' }));
  const p = S.sync(me('page-bbbbbb')).players[0];
  assert.equal(p.x, 200); assert.equal(p.z, 0); assert.equal(p.y, -5); assert.equal(p.r, 7); assert.equal(p.s, 'idle'); assert.equal(p.c, 'nau'); assert.equal(p.h, 'troc');
  assert.ok(p.n.length <= 20 && !/[<>]/.test(p.n));
});
test('Room.gs: lời nhắn có thứ tự, chặn link/số điện thoại, 1 lời / 2 giây, mốc since', () => {
  const S = makeServer(); S.sync(me('page-aaaaaa')); S.sync(me('page-bbbbbb'));
  let r = S.sync(me('page-aaaaaa', { say: 'xin chào cả nhà' })); assert.equal(r.seq, 1);
  r = S.sync(me('page-bbbbbb', { since: 0 })); assert.equal(r.chat.length, 1); assert.equal(r.chat[0].m, 'xin chào cả nhà'); assert.equal(r.chat[0].id, 'page-aaaaaa');
  assert.equal(S.sync(me('page-bbbbbb', { since: 1 })).chat.length, 0);
  assert.equal(S.sync(me('page-aaaaaa', { say: 'http://spam.com' })).seq, 1, 'link bị chặn');
  assert.equal(S.sync(me('page-aaaaaa', { say: 'gọi 0912 345 678' })).seq, 1, 'số điện thoại bị chặn');
  assert.equal(S.sync(me('page-aaaaaa', { say: 'lần hai' })).seq, 1, 'chưa đủ 2 giây');
  S.advance(2500); assert.equal(S.sync(me('page-aaaaaa', { say: 'lần hai' })).seq, 2);
});
test('Room.gs: chỉ giữ 20 lời nhắn gần nhất', () => {
  const S = makeServer(); S.sync(me('page-aaaaaa'));
  for (let i = 0; i < 30; i++) { S.advance(2100); S.sync(me('page-aaaaaa', { say: 'câu ' + i })); S.sync(me('page-bbbbbb')); }
  const r = S.sync(me('page-bbbbbb', { since: 0 })); assert.equal(r.chat.length, 20); assert.equal(r.chat[19].m, 'câu 29');
});
test('Room.gs: bị khóa (đang đông) thì trả busy chứ không treo; bộ nhớ hỏng thì tự dựng lại phòng', () => {
  const S = makeServer(); S.setLock(false); assert.equal(S.sync(me('page-aaaaaa')).error, 'busy'); S.setLock(true);
  S.store['dgt_room_main_v1'] = '{không phải json'; const r = S.sync(me('page-aaaaaa')); assert.equal(r.ok, true); assert.equal(r.count, 1);
});
test('Room.gs: pollMs tăng theo số người', () => {
  const S = makeServer(); assert.equal(S.sync(me('page-aaaaaa')).pollMs, 1500);
  for (let i = 0; i < 20; i++) S.sync(me('page-' + String(i + 1).padStart(6, '0'))); assert.ok(S.sync(me('page-aaaaaa')).pollMs >= 7000);
});
test('Code.gs: doPost có nhánh sync nối tới roomSync_', () => {
  assert.match(readFileSync(path.join(root, 'gas/Code.gs'), 'utf8'), /case 'sync':\s+return json_\(roomSync_\(req\)\)/);
});

// ---------- khách (js/net/roomClient.js) với nhân vật/mạng giả
function fakeEnv({ self = { n: 'Tôi', c: '9sach', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle' } } = {}) {
  const scene = { kids: new Set(), add(g) { this.kids.add(g); }, remove(g) { this.kids.delete(g); } };
  const made = [], online = [], reqs = []; const env = { self, responses: [], scene, made, online, reqs, timers: [] };
  env.makeAvatar = (p) => { const av = { p, group: { position: { set() {} } }, said: [], disposed: false, state: null, setFacing() {}, setState(s) { av.state = s; }, say(t) { av.said.push(t); }, update() {}, dispose() { av.disposed = true; } }; made.push(av); return av; };
  env.call = async (req) => { reqs.push(req); return env.responses.shift() ?? { ok: true, players: [], chat: [], seq: 0, count: 1, pollMs: 1500 }; };
  env.client = createRoomClient({ call: env.call, getSelf: () => env.self, makeAvatar: env.makeAvatar, scene, onOnline: (n) => online.push(n), pageId: 'page-self0001', schedule: (fn, ms) => { env.timers.push(ms); return env.timers.length; }, cancel() {} });
  return env;
}
const P = (id, extra = {}) => ({ id, n: id, c: 'nau', h: 'troc', x: 1, y: 0, z: 1, r: 0, s: 'idle', ...extra });

test('roomClient: gửi trạng thái của mình, dựng người khác, báo số online, bỏ người đã rời', async () => {
  const E = fakeEnv(); E.client.start(); E.responses.push({ ok: true, players: [P('other-0001'), P('other-0002')], chat: [], seq: 0, count: 3, pollMs: 2000 });
  await E.client.tick(); E.client.frame(0.016);
  assert.equal(E.reqs[0].action, 'sync'); assert.equal(E.reqs[0].id, 'page-self0001'); assert.equal(E.reqs[0].n, 'Tôi'); assert.ok(!('userKey' in E.reqs[0]));
  assert.equal(E.made.length, 2); assert.equal(E.scene.kids.size, 2); assert.deepEqual(E.online, [3]); assert.equal(E.timers.at(-1), 2000);
  E.responses.push({ ok: true, players: [P('other-0001')], chat: [], seq: 0, count: 2, pollMs: 1500 });
  await E.client.tick(); E.client.frame(0.016);
  assert.equal(E.scene.kids.size, 1); assert.equal(E.made.filter((a) => a.disposed).length, 1); assert.equal(E.client.remoteCount, 1);
});
test('roomClient: đổi tên/áo của người khác thì dựng lại; đứng yên không hoạt ảnh đi', async () => {
  const E = fakeEnv(); E.responses.push({ ok: true, players: [P('other-0001', { s: 'walk' })], chat: [], seq: 0, count: 2 });
  await E.client.tick(); E.client.frame(0.016); assert.equal(E.made[0].state, 'idle', 'chưa di chuyển thì không bước');
  E.responses.push({ ok: true, players: [P('other-0001', { c: 'lam' })], chat: [], seq: 0, count: 2 });
  await E.client.tick(); E.client.frame(0.016); assert.equal(E.made.length, 2); assert.equal(E.made[0].disposed, true);
});
test('roomClient: lời nhắn cũ lúc mới vào không hiện lại, lời mới hiện trên đầu người nói, của chính mình bị bỏ', async () => {
  const E = fakeEnv(); E.responses.push({ ok: true, players: [P('other-0001')], chat: [{ i: 5, id: 'other-0001', n: 'x', m: 'cũ' }], seq: 5, count: 2 });
  await E.client.tick(); E.client.frame(0.016); assert.deepEqual(E.made[0].said, []);
  E.responses.push({ ok: true, players: [P('other-0001')], chat: [{ i: 6, id: 'other-0001', n: 'x', m: 'mới' }, { i: 7, id: 'page-self0001', n: 'Tôi', m: 'của mình' }], seq: 7, count: 2 });
  await E.client.tick(); assert.deepEqual(E.made[0].said, ['mới']); assert.equal(E.reqs[1].since, 5);
});
test('roomClient.say: làm sạch, gửi ở lượt sau; gửi lỗi thì giữ lại gửi tiếp', async () => {
  const E = fakeEnv(); assert.equal(E.client.say('http://x.com'), ''); assert.equal(E.client.say('  nam mô  '), 'nam mô');
  E.responses.push({ ok: false, error: 'busy' }); await E.client.tick(); assert.equal(E.reqs[0].say, 'nam mô');
  await E.client.tick(); assert.equal(E.reqs[1].say, 'nam mô', 'lần trước lỗi nên gửi lại'); await E.client.tick(); assert.equal(E.reqs[2].say, '');
});
test('roomClient: lỗi liên tiếp thì thưa dần (tối đa 10 giây); chưa vào chùa thì không gọi mạng; đầy phòng báo null', async () => {
  const E = fakeEnv(); for (let i = 0; i < 6; i++) E.responses.push({ ok: false, error: 'network' });
  E.client.start(); for (let i = 0; i < 6; i++) await E.client.tick();
  const waits = E.timers.slice(1); assert.ok(waits[1] > waits[0]); assert.ok(Math.max(...waits) <= 10000);
  const F = fakeEnv(); F.self = null; await F.client.tick(); assert.equal(F.reqs.length, 0);
  const G = fakeEnv(); G.responses.push({ ok: false, error: 'room_full' }); await G.client.tick(); assert.deepEqual(G.online, [null]);
});
test('roomClient: tab ẩn thì chờ ≥ 15 giây; stop() dọn hết nhân vật', async () => {
  const E = fakeEnv(); E.client.start(); E.responses.push({ ok: true, players: [P('other-0001')], chat: [], seq: 0, count: 2 }); await E.client.tick(); E.client.frame(0.016);
  E.client.setActive(false); await E.client.tick(); assert.ok(E.timers.at(-1) >= 15000);
  E.client.stop(); assert.equal(E.scene.kids.size, 0);
});
test('createLocalTransport: hai tab cùng trình duyệt thấy nhau; người im quá 6 giây thì biến mất', async () => {
  let t = 0; const a = createLocalTransport({ now: () => t }), b = createLocalTransport({ now: () => t });
  assert.ok(a && b);
  const mk = (id) => ({ id, n: id, c: 'nau', h: 'troc', x: 1, y: 0, z: 1, r: 0, s: 'idle' });
  await a(mk('page-aaaaaa')); await b(mk('page-bbbbbb')); await new Promise((r) => setTimeout(r, 60));
  const ra = await a(mk('page-aaaaaa')); assert.deepEqual(ra.players.map((p) => p.id), ['page-bbbbbb']); assert.equal(ra.count, 2);
  t = 7000; assert.equal((await a(mk('page-aaaaaa'))).players.length, 0);
  a.close(); b.close();
  assert.equal(createLocalTransport({ BC: null }), null);
});

// ---------- nối thật: js/net/room.js + three giả + Room.gs thật (tests/sim/room-sim.mjs)
import { execFileSync } from 'node:child_process';
test('initRoom (nối thật): gửi vị trí/áo của mình, thấy người khác trong cảnh, cập nhật số online, dọn khi dừng', () => {
  const dir = path.join(root, 'tests', 'sim');
  const out = execFileSync(process.execPath, ['--import', './reg.mjs', 'room-sim.mjs'], { cwd: dir, encoding: 'utf8', timeout: 60000 }).trim().split('\n').pop();
  const r = JSON.parse(out);
  assert.equal(r.started, true); assert.deepEqual(r.sent, { action: 'sync', n: 'Tg', c: '9sach', x: 2, z: 3, s: 'walk', noUserKey: true });
  assert.equal(r.online, '2 đang online'); assert.equal(r.remotes, 1); assert.equal(r.roomApi, 'function'); assert.equal(r.afterStop, 0);
});
