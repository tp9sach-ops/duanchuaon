// Phiên 223: MỌI NGƯỜI THẤY NHAU (game online) — (1) rồng hồng của Gậy như ý, (2) thế sẵn sàng chiến đấu TRƯỚC khi đánh, (3) cú nhảy của người khác.
// Chạy: node --test tests/sync223.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { packAction, unpackAction, unpackActions, createOutbox } from '../js/world/combatShare.js';
import { createCombatLink } from '../js/net/combatLink.js';
import { createRoomClient } from '../js/net/roomClient.js';
import { createRemotes, ROOM_CFG } from '../js/engines/room.js';

function makeWorld(over = {}) {
  const calls = { stance: [], dragon: [], sent: [] };
  const av = { group: { position: { x: 0, z: 0 }, rotation: { y: 0, x: 0 } }, state: 'idle', cast: () => 1, swing: (a) => a || 'ngang' };
  const remoteAv = { group: { position: { x: 3, z: 4 } }, setFacing() {}, cast() {}, swing() {}, setStance: (on) => calls.stance.push(on) };
  const farAv = { group: { position: { x: 500, z: 500 } }, setFacing() {}, cast() {}, swing() {}, setStance() {} };
  const LGT = { farmView: { mons: [], target: '' }, zones: null, combatPose: { stance: false }, ...over };
  const incoming = []; let t = 1_000_000;
  const tr = { sendCombat: (p) => calls.sent.push(p), combat: () => incoming.map((x) => ({ ...x })) };
  const W = { pos: { x: 0, z: 0 }, avatar: av, facing: 0 };
  const dragonFx = { spawn: (c, ry, track) => { calls.dragon.push({ c, ry, track }); return true; }, update() {} };
  const link = createCombatLink({ LGT, W, getTransport: () => tr, avatarOf: (id) => (id === 'peer1' ? remoteAv : id === 'far1' ? farAv : null), roomOf: () => 'main', now: () => t, perf: () => t, dragonFx, ghostView: { update() {} } });
  return { calls, LGT, av, remoteAv, incoming, link, W, advance: (ms) => { t += ms; } };
}
const pose = (mode) => packAction({ k: 'f', seq: 0, mode, tilt: 0 });

test('Phiên 223: mã hóa tư thế "s" (thế chiến đấu) và hành động "r" (rồng hồng)', () => {
  assert.deepEqual(unpackAction(pose('s')), { k: 'f', seq: 0, mode: 's', tilt: 0 });
  const r = packAction({ k: 'r', seq: 7, ry: 1.234 });
  assert.deepEqual(unpackAction(r), { k: 'r', seq: 7, ry: 1.23 });
  assert.equal(unpackActions(r + ';' + pose('s')).length, 2);
  assert.equal(unpackAction('7,r'), null);   // thiếu hướng
  const ob = createOutbox(); ob.setPose({ mode: 's', tilt: 0 });
  const p = ob.packet(0); assert.ok(p && unpackActions(p.a).some((x) => x.k === 'f' && x.mode === 's'));
});

test('Phiên 223: người khác vào giao chiến → mình thấy thế sẵn sàng NGAY (chưa cần vung đòn); hết giao chiến thì hạ thế', () => {
  const w = makeWorld(); w.incoming.push({ id: 'peer1', r: 'main', t: 1, a: '', m: '' }); w.link.tick();
  w.incoming[0] = { id: 'peer1', r: 'main', t: 2, a: pose('s'), m: '' }; w.link.tick();
  assert.deepEqual(w.calls.stance, [true]);
  assert.equal(w.link.poseOf('peer1'), null);   // 's' không đổi trạng thái đi/đứng
  w.advance(2000); w.incoming[0] = { id: 'peer1', r: 'main', t: 3, a: pose('n'), m: '' }; w.link.tick();
  assert.deepEqual(w.calls.stance, [true, false]);
});

test('Phiên 223: MÌNH đứng thế chiến đấu → phát tư thế "s"; hết thì phát "n" một lần', () => {
  const w = makeWorld(); w.LGT.combatPose.stance = true; w.link.tick();
  assert.ok(unpackActions(w.calls.sent.at(-1).a).some((x) => x.k === 'f' && x.mode === 's'));
  w.LGT.combatPose.stance = false; w.advance(200); w.link.tick();
  assert.ok(unpackActions(w.calls.sent.at(-1).a).some((x) => x.k === 'f' && x.mode === 'n'));
});

test('Phiên 223: rồng hồng của MÌNH được phát; của người khác bay quanh avatar họ (bám vị trí sống), xa quá thì bỏ', () => {
  const w = makeWorld(); w.link.tick(); assert.ok(w.link.sendDragon(0.5) > 0);
  w.advance(100); w.link.tick();
  assert.ok(w.calls.sent.some((p) => unpackActions(p.a).some((x) => x.k === 'r')));
  const o = makeWorld(); o.incoming.push({ id: 'peer1', r: 'main', t: 1, a: '', m: '' }); o.link.tick();
  o.incoming[0] = { id: 'peer1', r: 'main', t: 2, a: packAction({ k: 'r', seq: 1, ry: 0.8 }), m: '' }; o.link.tick();
  assert.equal(o.calls.dragon.length, 1);
  assert.equal(o.calls.dragon[0].track, o.remoteAv.group.position);   // bám theo vị trí sống của avatar người đó
  assert.equal(o.calls.dragon[0].ry, 0.8);
  const f = makeWorld(); f.incoming.push({ id: 'far1', r: 'main', t: 1, a: '', m: '' }); f.link.tick();
  f.incoming[0] = { id: 'far1', r: 'main', t: 2, a: packAction({ k: 'r', seq: 1, ry: 0 }), m: '' }; f.link.tick();
  assert.equal(f.calls.dragon.length, 0);
});

test('Phiên 223: cú nhảy của người khác không bị bóp phẳng (độ cao bám nhanh)', () => {
  const r = createRemotes(); r.ingest([{ id: 'peerpeer01', n: 'A', c: 'nau', h: 'troc', x: 1, y: 0, z: 3, r: 0, s: 'idle' }], 'me'); r.step(1 / 60);
  r.ingest([{ id: 'peerpeer01', n: 'A', c: 'nau', h: 'troc', x: 1, y: 1.2, z: 3, r: 0, s: 'idle' }], 'me');
  let y = 0; for (let i = 0; i < 4; i++) y = r.step(1 / 60)[0].y;
  assert.ok(y > 0.6, 'sau 4 khung hình y = ' + y);
});

test('Phiên 223: mình đang nhảy (đường truyền nhanh) → tick dày ≤ airPollMs', async () => {
  const waits = []; let y = 1.5;
  const rc = createRoomClient({ call: async () => ({ ok: true, players: [], chat: [], seq: 0, count: 1, pollMs: 250, minPollMs: 200 }), getSelf: () => ({ n: 'B', c: 'nau', h: 'troc', x: 0, y, z: 0, r: 0, s: 'idle' }),
    makeAvatar: () => ({}), scene: { add() {}, remove() {} }, pageId: 'selfselfself', schedule: (fn, ms) => { waits.push(ms); return 0; }, cancel() {} });
  rc.start(); await rc.tick(); assert.ok(waits.at(-1) <= ROOM_CFG.airPollMs, 'chờ ' + waits.at(-1));
  y = 0; await rc.tick(); assert.ok(waits.at(-1) <= ROOM_CFG.airPollMs, 'tick nốt lúc chạm đất');
  await rc.tick(); assert.ok(waits.at(-1) >= 200, 'đứng yên: nhịp thường ' + waits.at(-1));
  rc.stop();
});

test('Phiên 223: tĩnh — Firebase gửi dày khi trên không; rồng có thể bám người khác', () => {
  const fb = readFileSync(new URL('../js/net/firebaseTransport.js', import.meta.url), 'utf8');
  assert.match(fb, /SEND_AIR_MS\s*=\s*80/); assert.match(fb, /air \? SEND_AIR_MS : SEND_MIN_MS/);
  const dr = readFileSync(new URL('../js/ui/dragonFx.js', import.meta.url), 'utf8');
  assert.match(dr, /spawn\(center, ry = 0, track = null\)/); assert.match(dr, /createDragonFx\(scene, max = DRAGON\.max\)/);
  assert.match(dr, /combatLink\.sendDragon\(ry\)/);   // rồng của mình (không track) tự phát; rồng người khác (có track) không phát lại
});
