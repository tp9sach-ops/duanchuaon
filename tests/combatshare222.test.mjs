// Phiên 222: đồng bộ chiến đấu giai đoạn 2 — đòn lên bóng quái (d), quái chết (k), tư thế bay / lao (f), người mới vào nhận ngay hành động đầu, nối vào roomClient.
// Chạy: node --test tests/combatshare222.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { COMBAT, COMBAT_CHARSET, packAction, unpackAction, unpackActions, packMons, createOutbox, createInbox, createGhosts } from '../js/world/combatShare.js';
import { createCombatLink } from '../js/net/combatLink.js';
import { tagOf } from '../js/world/duel.js';
import { createRoomClient } from '../js/net/roomClient.js';

const mon = (o = {}) => ({ uid: 'hoThac:12', type: 'thuyquy', x: 10.26, z: -5.04, ry: 1.5, oan: 60, max: 120, eng: true, wind: 0, slam: false, ...o });

function makeWorld() {
  const calls = { cast: [], swing: [], hit: [], sent: [], slash: [], fx: [], sfx: [], remote: [], ghostFrames: 0 };
  const av = { group: { position: { x: 0, z: 0 }, rotation: { y: 0 } }, cast: (id) => { calls.cast.push(id); return 1.2; }, swing: (a) => { calls.swing.push(a); return a || 'ngang'; } };
  const remoteAv = { group: { position: { x: 3, z: 4 } }, setFacing() {}, cast: (id) => calls.remote.push(['cast', id]), swing: (k) => calls.remote.push(['swing', k]), setStance: (on) => calls.remote.push(['stance', on]) };
  const LGT = { farmView: { mons: [], target: '' }, hitReact: { onHit: (m, o) => { calls.hit.push([m.uid, o.dmg]); return 'rx'; } }, sfx: { play: (c) => calls.sfx.push(c) }, zones: null };
  const incoming = []; let t = 1_000_000;
  const tr = { sendCombat: (p) => calls.sent.push(p), combat: () => incoming.map((x) => ({ ...x })) };
  const Wobj = { pos: { x: 0, z: 0 }, avatar: av, facing: 0.5 };
  const link = createCombatLink({
    LGT, W: Wobj, getTransport: () => tr, avatarOf: (id) => (id === 'peer1' ? remoteAv : null), roomOf: () => 'main', now: () => t, perf: () => t,
    makeSlash: () => ({ slash: (k) => { calls.slash.push(k); return true; }, update() {}, dispose() {} }), castFx: (id, o) => calls.fx.push([id, o]), ghostView: { update() { calls.ghostFrames++; } },
  });
  return { calls, LGT, av, remoteAv, incoming, link, tr, W: Wobj, advance: (ms) => { t += ms; }, get t() { return t; } };
}

test('Phiên 222: mã hóa d (đánh bóng quái), k (hạ quái), h có người đánh, f (tư thế bay/lao)', () => {
  const d = packAction({ k: 'd', seq: 4, key: 'hoThac:12', owner: tagOf('uidA'), dmg: 77.4, ax: 3, az: -2 });
  assert.deepEqual(unpackAction(d), { k: 'd', seq: 4, key: 'hoThac:12', owner: tagOf('uidA'), dmg: 77, ax: 3, az: -2 });
  const k = packAction({ k: 'k', seq: 5, key: 'hoThac:12', type: 'thuyquy', killer: tagOf('uidB') });
  assert.deepEqual(unpackAction(k), { k: 'k', seq: 5, key: 'hoThac:12', type: 'thuyquy', killer: tagOf('uidB') });
  assert.equal(packAction({ k: 'k', seq: 1, key: 'hoThac:12', type: 'khongco', killer: tagOf('x') }), '');
  assert.equal(packAction({ k: 'd', seq: 1, key: 'x y', owner: 'abcdef', dmg: 5 }), '');
  assert.equal(unpackAction(packAction({ k: 'h', seq: 6, key: 'hoThac:1', dmg: 9, by: tagOf('uidB') })).by, tagOf('uidB'));
  const f = packAction({ k: 'f', seq: 0, mode: 'd', tilt: 1.15 }); assert.deepEqual(unpackAction(f), { k: 'f', seq: 0, mode: 'd', tilt: 1.15 });
  assert.equal(packAction({ k: 'f', seq: 0, mode: 'x', tilt: 0 }), ''); assert.equal(unpackAction('0,f,q,5'), null);
  assert.ok(COMBAT_CHARSET.test(d + k + f));
});
test('Phiên 222: hộp nhận — người MỚI xuất hiện sau khi mình vào thì hành động đầu tiên cũng được phát', () => {
  const inb = createInbox(), a = packAction({ k: 's', seq: 1, kind: 'ngang', x: 0, z: 0, ry: 0 });
  assert.equal(inb.take('o1', a).length, 0); assert.equal(inb.take('o2', a, true).length, 1);
});
test('Phiên 222: bóng quái đoán trước sát thương rồi theo máu thật của chủ', () => {
  const g = createGhosts(), q = (pct) => [{ key: 'hoThac:1', x: 0, z: 0, ry: 0, pct, ph: 0, slam: false, type: 'thuyquy' }];
  g.ingest('own', q(80), 0); const m = g.list()[0]; assert.ok(m.real > 100); m.oan = 60; m.predUntil = 500;
  g.ingest('own', q(70), 100); assert.equal(m.oan, 60); g.ingest('own', q(50), 100); assert.equal(m.oan, 50); g.ingest('own', q(65), 900); assert.equal(m.oan, 65);
});
test('Phiên 222: hộp gửi — tư thế bay/lao không chiếm chỗ hành động, báo hết đúng một lần, người nhận đọc được', () => {
  const o = createOutbox(); o.setRoom('main'); o.push({ k: 's', kind: 'ngang', x: 0, z: 0, ry: 0 }, 0); o.setPose({ mode: 'g', tilt: 0.52 });
  const p1 = o.packet(1000); const acts = unpackActions(p1.a); assert.deepEqual(acts.map((x) => x.k).sort(), ['f', 's']); assert.equal(acts.find((x) => x.k === 'f').mode, 'g');
  assert.ok(o.packet(1100) === null, 'không đổi: chưa đến nhịp báo còn đây'); assert.ok(o.packet(1000 + COMBAT.keepAliveMs + 10), 'đang bay: báo còn đây');
  o.setPose({ mode: 'n', tilt: 0 }); const p2 = o.packet(6000); assert.equal(unpackActions(p2.a).find((x) => x.k === 'f').mode, 'n'); assert.equal(o.packet(12000), null, 'hết bay rồi thì im');
});
test('Phiên 222: người khác bay lướt / lao → poseOf trả tư thế, hết hạn thì thôi; mình bay thì phát', () => {
  const w = makeWorld(); w.incoming.push({ id: 'peer1', r: 'main', t: 1, a: '', m: '' }); w.link.tick();
  w.incoming[0] = { id: 'peer1', r: 'main', t: 2, a: packAction({ k: 'f', seq: 0, mode: 'g', tilt: 0.5 }), m: '' }; w.link.tick();
  assert.deepEqual(w.link.poseOf('peer1'), { state: 'glide', speed: 0, tilt: 0.5 });
  w.incoming[0] = { id: 'peer1', r: 'main', t: 3, a: packAction({ k: 'f', seq: 0, mode: 'r', tilt: 0 }), m: '' }; w.link.tick(); assert.equal(w.link.poseOf('peer1').state, 'walk');
  w.advance(5000); assert.equal(w.link.poseOf('peer1'), null);
  w.incoming[0] = { id: 'peer1', r: 'main', t: 4, a: packAction({ k: 'f', seq: 0, mode: 'g', tilt: 0.5 }), m: '' }; w.link.tick();
  w.incoming[0] = { id: 'peer1', r: 'main', t: 5, a: packAction({ k: 'f', seq: 0, mode: 'n', tilt: 0 }), m: '' }; w.link.tick(); assert.equal(w.link.poseOf('peer1'), null);
  const m = makeWorld(); m.av.state = 'glide'; m.av.group.rotation.x = 0.4; m.link.tick();
  const f = unpackActions(m.calls.sent.at(-1).a).find((x) => x.k === 'f'); assert.ok(f && f.mode === 'g' && Math.abs(f.tilt - 0.4) < 0.06);
  const d = makeWorld(); d.link.tick(); d.advance(100); d.W.dashing = true; d.av.group.rotation.x = 0.9; d.link.tick(); assert.equal(unpackActions(d.calls.sent.at(-1).a).find((x) => x.k === 'f').mode, 'd');
});
test('Phiên 222: roomClient vẽ tư thế bay lướt của người khác (poseOf) thay trạng thái mạng', () => {
  const states = [], av = { group: { position: { set() {} }, rotation: { x: 0 } }, setFacing() {}, setState: (s, sp) => states.push([s, sp]), update() {}, dispose() {}, say() {} };
  const rc = createRoomClient({ call: async () => ({ ok: true, players: [{ id: 'peerpeer01', n: 'A', c: 'nau', h: 'troc', x: 1, y: 2, z: 3, r: 0, s: 'idle' }], chat: [], seq: 0, count: 2 }), getSelf: () => ({ n: 'B', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle' }),
    makeAvatar: () => av, scene: { add() {}, remove() {} }, pageId: 'selfselfself', schedule: () => 0, cancel() {}, poseOf: (id) => (id === 'peerpeer01' ? { state: 'glide', speed: 0, tilt: 0.7 } : null) });
  return rc.tick().then(() => { rc.frame(0.05); assert.deepEqual(states.at(-1), ['glide', 0]); assert.equal(av.group.rotation.x, 0.7); });
});
test('Phiên 222: MÁU DÙNG CHUNG — chủ trừ máu thật khi khách đánh; đòn cuối của khách → khách nhận thưởng, chủ không', () => {
  const ownerId = 'ownerUid1', guestId = 'guestUid2', hits = []; let rewarded = 0;
  const O = makeWorld(); O.LGT.room = { selfId: () => ownerId };
  O.LGT.farm = { remoteHit: (key, dmg, by) => { hits.push([key, dmg, by]); return { dead: dmg >= 100, type: 'thuyquy' }; }, claimKill: () => { rewarded++; } };
  O.link.tick(); O.advance(5000); O.link.tick();
  O.incoming.push({ id: guestId, r: 'main', t: 9, a: packAction({ k: 'd', seq: 1, key: 'hoThac:12', owner: tagOf(ownerId), dmg: 100 }), m: '' }); O.link.tick();
  assert.equal(hits.length, 1); assert.equal(hits[0][2], tagOf(guestId)); assert.equal(rewarded, 0);
  O.advance(100); O.link.tick(); assert.ok(O.calls.sent.some((p) => unpackActions(p.a).some((x) => x.k === 'k' && x.killer === tagOf(guestId) && x.type === 'thuyquy')));
  const G = makeWorld(); let got = 0; G.LGT.room = { selfId: () => guestId }; G.LGT.farm = { remoteHit: () => null, claimKill: (t) => { got++; assert.equal(t, 'thuyquy'); } };
  G.link.tick(); G.advance(5000); G.link.tick();
  G.incoming.push({ id: ownerId, r: 'main', t: 3, a: packAction({ k: 'k', seq: 1, key: 'hoThac:12', type: 'thuyquy', killer: tagOf(guestId) }), m: '' }); G.link.tick(); assert.equal(got, 1);
  const T = makeWorld(); let got3 = 0; T.LGT.room = { selfId: () => 'thirdUid3' }; T.LGT.farm = { remoteHit: () => null, claimKill: () => { got3++; } };
  T.link.tick(); T.advance(5000); T.link.tick(); T.incoming.push({ id: ownerId, r: 'main', t: 3, a: packAction({ k: 'k', seq: 1, key: 'hoThac:12', type: 'thuyquy', killer: tagOf(guestId) }), m: '' }); T.link.tick(); assert.equal(got3, 0);
});
test('Phiên 222: sendDamage đoán trước máu bóng quái và gửi d; hook gắn lại khi nhân vật bị dựng lại (setProfile)', async () => {
  const w = makeWorld(); w.LGT.room = { selfId: () => 'guestUid2' };
  w.incoming.push({ id: 'peer1', r: 'main', t: 1, m: packMons([mon({ oan: 100, max: 100 })]), a: '' }); w.link.tick();
  const g = w.link.ghosts.list()[0]; assert.ok(g); const before = g.oan;
  assert.equal(w.link.sendDamage(g, 30), true); assert.ok(g.oan < before && g.oan >= 1);
  await new Promise((r) => setTimeout(r, 5)); w.advance(100); w.link.tick(); assert.ok(w.calls.sent.some((p) => unpackActions(p.a).some((x) => x.k === 'd' && x.dmg === 30 && x.owner === tagOf('peer1'))));
  const W2 = { pos: { x: 0, z: 0 }, avatar: null }, mk = () => ({ group: { rotation: { y: 0 } }, cast: () => 1, swing: () => 'ngang' });
  const l = createCombatLink({ LGT: { farmView: { mons: [] } }, W: W2, getTransport: () => ({ sendCombat() {} }), now: () => 5000, perf: () => 5000 });
  W2.avatar = mk(); l.tick(); W2.avatar.swing(); assert.equal(l.outbox.seq, 1);
  W2.avatar = mk(); l.tick(); W2.avatar.swing(); assert.equal(l.outbox.seq, 2, 'nhân vật mới (sau setProfile) vẫn phát đòn');
});
