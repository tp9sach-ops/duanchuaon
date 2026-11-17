// Phiên 224: sói khí vàng (Gậy dạy chó, đòn 3) ĐỒNG BỘ ONLINE — mọi người thấy sói của nhau (quy tắc docs/QUY_TAC_DONG_BO.md).
// Chạy: node --test tests/wolfsync224.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { packAction, unpackAction, unpackActions } from '../js/world/combatShare.js';
import { createCombatLink } from '../js/net/combatLink.js';

function makeWorld() {
  const calls = { wolf: [], sent: [] };
  const av = { group: { position: { x: 0, z: 0 }, rotation: { y: 0, x: 0 } }, state: 'idle', cast: () => 1, swing: (a) => a || 'ngang' };
  const remoteAv = { group: { position: { x: 3, y: 0.5, z: 4 } }, setFacing() {}, cast() {}, swing() {}, setStance() {} };
  const farAv = { group: { position: { x: 500, z: 500 } }, setFacing() {}, cast() {}, swing() {}, setStance() {} };
  const LGT = { farmView: { mons: [], target: '' }, zones: null, combatPose: { stance: false } };
  const incoming = []; let t = 1_000_000;
  const tr = { sendCombat: (p) => calls.sent.push(p), combat: () => incoming.map((x) => ({ ...x })) };
  const W = { pos: { x: 0, z: 0 }, avatar: av, facing: 0 };
  const wolfFx = { spawn: (pos, ry, rg, remote) => { calls.wolf.push({ pos, ry, rg, remote }); return true; }, update() {} };
  const link = createCombatLink({ LGT, W, getTransport: () => tr, avatarOf: (id) => (id === 'peer1' ? remoteAv : id === 'far1' ? farAv : null), roomOf: () => 'main', now: () => t, perf: () => t, wolfFx, ghostView: { update() {} } });
  return { calls, remoteAv, incoming, link, advance: (ms) => { t += ms; } };
}

test('mã hóa hành động "w": khứ hồi hướng + tầm vồ, kẹp tầm, hỏng → null', () => {
  const s = packAction({ k: 'w', seq: 4, ry: 1.234, rg: 6.5 });
  assert.deepEqual(unpackAction(s), { k: 'w', seq: 4, ry: 1.23, rg: 6.5 });
  assert.equal(unpackAction(packAction({ k: 'w', seq: 1, ry: -2, rg: 999 })).rg, 20, 'tầm vồ kẹp ở 20 m');
  assert.equal(unpackAction(packAction({ k: 'w', seq: 1, ry: 0, rg: -5 })).rg, 0);
  assert.equal(unpackAction('1,w,5'), null); assert.equal(unpackAction('1,w,5,6,7'), null);
});

test('sói của MÌNH được phát; của người khác vồ ra từ chỗ họ đứng (không phát lại), xa quá thì bỏ', () => {
  const w = makeWorld(); w.link.tick(); assert.ok(w.link.sendWolf(0.5, 6) > 0);
  w.advance(100); w.link.tick();
  assert.ok(w.calls.sent.some((p) => unpackActions(p.a).some((x) => x.k === 'w' && x.rg === 6)));
  const o = makeWorld(); o.incoming.push({ id: 'peer1', r: 'main', t: 1, a: '', m: '' }); o.link.tick();
  o.incoming[0] = { id: 'peer1', r: 'main', t: 2, a: packAction({ k: 'w', seq: 1, ry: 0.8, rg: 7.5 }), m: '' }; o.link.tick();
  assert.equal(o.calls.wolf.length, 1); const c = o.calls.wolf[0];
  assert.deepEqual(c.pos, { x: 3, y: 0.5, z: 4 }); assert.equal(c.ry, 0.8); assert.equal(c.rg, 7.5); assert.equal(c.remote, true);
  const f = makeWorld(); f.incoming.push({ id: 'far1', r: 'main', t: 1, a: '', m: '' }); f.link.tick();
  f.incoming[0] = { id: 'far1', r: 'main', t: 2, a: packAction({ k: 'w', seq: 1, ry: 0, rg: 5 }), m: '' }; f.link.tick();
  assert.equal(f.calls.wolf.length, 0);
});

test('nối dây: wolfFx tự phát sói của mình, room.js dựng bộ sói riêng, items.js gọi onHit đòn 3, farm/yeuquai nhân ×3', () => {
  const r = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
  const wf = r('../js/ui/wolfFx.js'); assert.match(wf, /spawn\(pos, heading = 0, range = WOLF\.rangeAir, remote = false\)/); assert.match(wf, /combatLink\.sendWolf\(h, r\)/);
  const rm = r('../js/net/room.js'); assert.match(rm, /createWolfFx\(scene, \{ max: 6 \}\)/); assert.match(rm, /dragonFx, wolfFx,/);
  const it = r('../js/ui/items.js'); assert.match(it, /function onHit\(step, target\)/); assert.match(it, /if \(step < BASIC\.steps\) return;/); assert.match(it, /createWolfFx\(scene/);
  const fm = r('../js/ui/farm.js'); assert.match(fm, /weaponFx\(ck\.step, t\)/); assert.match(fm, /stepMulFor\(ck\.step\)/);
  const yq = r('../js/ui/yeuquai.js'); assert.match(yq, /LGT\.items\.onHit\(step, boss\)/);
  const rg = r('../js/net/room.js'); assert.match(rg, /bamboo: !!s\.tre && !!lo && lo\.weapon === 'tre'/);
});
