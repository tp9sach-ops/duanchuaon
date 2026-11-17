// Phiên 225: người chơi bị quái đánh trúng → mọi người cùng thấy (tiếng + giật người). Chạy: node --test tests/hurt225.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { packAction, unpackAction, unpackActions } from '../js/world/combatShare.js';
import { createCombatLink } from '../js/net/combatLink.js';

function make() {
  const sent = [], sfx = [], incoming = []; let t = 1_000_000;
  const av = { group: { position: { x: 0, z: 0 }, rotation: { y: 0, x: 0 } }, state: 'idle', cast: () => 1, swing: (a) => a || 'ngang' };
  const peer = { group: { position: { x: 3, z: 4 } }, setFacing() {}, setStance() {} };
  const LGT = { farmView: { mons: [], target: '' }, zones: null, sfx: { play: (c) => sfx.push(c) } };
  const tr = { sendCombat: (p) => sent.push(p), combat: () => incoming.map((x) => ({ ...x })) };
  const link = createCombatLink({ LGT, W: { pos: { x: 0, z: 0 }, avatar: av, facing: 0 }, getTransport: () => tr, avatarOf: (id) => (id === 'peer1' ? peer : null), roomOf: () => 'main', now: () => t, perf: () => t, ghostView: { update() {} } });
  return { sent, sfx, incoming, link, adv: (ms) => { t += ms; } };
}

test('Phiên 225: mã hóa hành động "p" (bị đánh trúng)', () => {
  assert.deepEqual(unpackAction(packAction({ k: 'p', seq: 3, lv: 5 })), { k: 'p', seq: 3, lv: 5 });
  assert.equal(unpackAction(packAction({ k: 'p', seq: 3, lv: 99 })).lv, 9);
  assert.equal(unpackAction('3,p'), null);
});

test('Phiên 225: MÌNH bị đánh → phát "p"; người khác bị đánh → mình nghe tiếng + thấy họ giật người rồi hết', () => {
  const m = make(); m.link.tick(); assert.ok(m.link.sendHurt(4) > 0); m.adv(100); m.link.tick();
  assert.ok(m.sent.some((p) => unpackActions(p.a).some((x) => x.k === 'p' && x.lv === 4)));
  const o = make(); o.incoming.push({ id: 'peer1', r: 'main', t: 1, a: '', m: '' }); o.link.tick();
  o.incoming[0] = { id: 'peer1', r: 'main', t: 2, a: packAction({ k: 'p', seq: 1, lv: 5 }), m: '' }; o.link.tick();
  assert.ok(o.sfx.includes('da-trung'));
  o.adv(150); const po = o.link.poseOf('peer1'); assert.ok(po && po.tilt < 0, 'đang giật người');
  o.adv(600); assert.equal(o.link.poseOf('peer1'), null);
});

test('Phiên 225: tĩnh — farmCombat phát tiếng + báo khi bị trúng', () => {
  const s = readFileSync(new URL('../js/ui/farmCombat.js', import.meta.url), 'utf8');
  assert.match(s, /combatLink\.sendHurt/); assert.match(s, /'da-trung'/);
});
