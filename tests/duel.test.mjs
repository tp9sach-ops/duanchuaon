// Phiên 137: giao lưu võ thuật — mã hoá gói tin, bộ máy trận (chạy hai bên qua mạng giả), zone Võ đài.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../js/world/duel.js';
import { chatOk } from '../js/engines/room.js';
import { createZoneManager, HUB_ID } from '../js/world/zones.js';
import { registerVoDai, VODAI_ID, VODAI_DEF } from '../js/world/zoneVoDai.js';
import { HUB_DEF } from '../js/world/zoneRuntime.js';
import * as layout from '../js/world/layout.js';
import '../js/world/placements.js';

const { MOVES, DUEL } = D;
const A0 = D.toWorld(-5, 0), B0 = D.toWorld(5, 0);   // cách nhau 10 m trên trục x

test('mã hoá: gói tin chỉ gồm chữ, qua bộ lọc chat, ≤ 80 ký tự, giải mã lại đúng', () => {
  const to = D.tagOf('abcDEF123-uid-xyz');
  const list = [D.pack.invite(to), D.pack.accept(to), D.pack.decline(to), D.pack.bye(to), D.pack.state(to, { seq: 7, phase: 2, hp: 1000 }),
    D.pack.atk(to, { id: 3, kind: 'b', fat: 2, x: A0.x, z: A0.z, ry: 1.57 }), D.pack.res(to, { id: 3, res: 'g', dmg: 21 })];
  for (const s of list) { assert.ok(D.isSignal(s)); assert.equal(chatOk(s), s); assert.ok(s.length <= 80); assert.ok(!/\d/.test(s)); assert.equal(D.decode(s).to, to); }
  const k = D.decode(list[5]); assert.equal(k.kind, 'b'); assert.equal(k.fat, 2); assert.ok(Math.abs(k.x - A0.x) < 0.11 && Math.abs(k.z - A0.z) < 0.11); assert.ok(Math.abs(k.ry - 1.57) < 0.1);
  assert.deepEqual(D.decode(list[4]), { type: 'state', to, seq: 7, phase: 2, hp: 1000 });
  assert.deepEqual(D.decode(list[6]), { type: 'res', to, id: 3, res: 'g', dmg: 21 });
});
test('mã hoá: tag ổn định, khác nhau; gói hỏng/thiếu/thừa/loại lạ → null; lời chat thường không là gói', () => {
  assert.equal(D.tagOf('x'), D.tagOf('x')); assert.notEqual(D.tagOf('x'), D.tagOf('y')); assert.equal(D.tagOf('x').length, 6);
  const to = D.tagOf('p'), ok = D.pack.state(to, { seq: 1, phase: 1, hp: 5 });
  for (const bad of [ok.slice(0, -1), ok + 'a', '#dgz' + to, '#dgi' + to + 'a', '#dgs' + to + 'aXaaa', '#dg', '', null, 'xin chào', '#dgk' + to + 'azaaaaaaa', '#dgrr' + to]) assert.equal(D.decode(bad), null, String(bad));
  assert.equal(D.isSignal('xin chào'), false); assert.equal(D.isSignal('#dgi' + to), true);
});
test('võ đài: toạ độ mượn qua mạng khớp hai chiều và nằm trong ±200', () => {
  const w = D.toWorld(7, -4), n = D.toNet(w.x, w.z), b = D.fromNet(n.x, n.z);
  assert.ok(Math.abs(b.x - w.x) < 1e-9 && Math.abs(b.z - w.z) < 1e-9);
  for (const a of [0, 1, 2, 3, 4, 5]) { const q = D.toNet(D.ARENA.cx + Math.sin(a) * 13, D.ARENA.cz + Math.cos(a) * 13); assert.ok(Math.abs(q.x) <= 200 && Math.abs(q.z) <= 200); assert.ok(D.inNetBox(q.x, q.z)); }
  assert.equal(D.inNetBox(0, 0), false);
});
test('verdict', () => {
  assert.equal(D.verdict({ myHp: 90, oppHp: 80 }).winner, 'me'); assert.equal(D.verdict({ myHp: 70, oppHp: 80 }).winner, 'opp'); assert.equal(D.verdict({ myHp: 80, oppHp: 80 }).winner, 'draw');
  assert.equal(D.verdict({ myHp: 0, oppHp: 5 }).winner, 'opp'); assert.equal(D.verdict({ myHp: 0, oppHp: 0 }).winner, 'draw'); assert.equal(D.verdict({ myHp: 1, oppHp: 999, why: 'left' }).winner, 'me');
});

// ---- hai bên qua mạng giả (độ trễ 0,1 giây)
function pair() {
  const a = { x: A0.x, z: A0.z, ry: Math.PI / 2 }, b = { x: B0.x, z: B0.z, ry: -Math.PI / 2 };
  let now = 0; const q = []; const log = { a: [], b: [] };
  const A = D.createDuel({ send: (o) => q.push({ at: now + 0.1, to: 'b', o }) }), B = D.createDuel({ send: (o) => q.push({ at: now + 0.1, to: 'a', o }) });
  const step = (dt = 1 / 30, fn) => {
    now += dt; if (fn) fn();
    for (let i = 0; i < q.length;) { if (q[i].at <= now) { const m = q.splice(i, 1)[0]; (m.to === 'a' ? A : B).receive(D.decode(D.packObj(D.tagOf('t'), m.o))); } else i++; }
    log.a.push(...A.tick(dt, a)); log.b.push(...B.tick(dt, b));
  };
  const until = (f, n = 600) => { for (let i = 0; i < n; i++) { if (f()) return true; step(); } return f(); };
  return { A, B, a, b, step, until, log };
}
const fighting = (m) => { assert.ok(m.until(() => m.A.phase === 'fight' && m.B.phase === 'fight'), 'vào trận'); return m; };

test('trận: chờ → đếm ngược → đánh khi cả hai đã thấy nhau', () => {
  const m = pair(); assert.equal(m.A.phase, 'wait'); fighting(m); assert.equal(m.A.hp, DUEL.hp); assert.equal(m.B.hp, DUEL.hp);
  assert.ok(m.log.a.some((e) => e.type === 'count') && m.log.a.some((e) => e.type === 'fight'));
});
test('trận: không ai tới → hòa (noshow)', () => {
  const A = D.createDuel(); const ev = []; for (let i = 0; i < DUEL.waitS * 10 + 20; i++) ev.push(...A.tick(0.1, { x: 0, z: 0, ry: 0 }));
  assert.equal(A.phase, 'over'); assert.equal(A.result.winner, 'draw'); assert.equal(A.result.why, 'noshow');
});
test('chém khí đứng yên → trúng: B mất máu, A nhận ack, có hồi chiêu', () => {
  const m = fighting(pair()); const r = m.A.cast('b', m.a); assert.equal(r.ok, true);
  assert.ok(m.until(() => m.B.hp < DUEL.hp, 120)); assert.equal(m.B.hp, DUEL.hp - MOVES.b.dmg);
  assert.ok(m.until(() => m.A.oppHp < DUEL.hp, 60)); assert.ok(m.log.a.some((e) => e.type === 'ack-hit')); assert.ok(m.log.b.some((e) => e.type === 'incoming' && e.kind === 'b'));
  assert.ok(m.A.cdLeft('b') > 0); assert.equal(m.A.cast('b', m.a).reason, 'hoi-chieu');
});
test('chém khí: B né sang ngang → không mất máu, A nhận ack-miss', () => {
  const m = fighting(pair()); m.A.cast('b', m.a);
  assert.ok(m.until(() => m.B.incomingCount > 0, 60)); m.b.z += 3;   // bước sang bên
  for (let i = 0; i < 90; i++) m.step();
  assert.equal(m.B.hp, DUEL.hp); assert.ok(m.log.a.some((e) => e.type === 'ack-miss')); assert.ok(m.log.b.some((e) => e.type === 'dodge'));
});
test('đánh thường chỉ trúng khi đứng sát; thiết đầu công né sang bên được, đứng yên thì trúng', () => {
  let m = fighting(pair()); m.a.x = m.b.x - 2; m.A.cast('a', m.a); for (let i = 0; i < 40; i++) m.step(); assert.equal(m.B.hp, DUEL.hp - MOVES.a.dmg);
  m = fighting(pair()); m.A.cast('a', m.a); for (let i = 0; i < 40; i++) m.step(); assert.equal(m.B.hp, DUEL.hp);   // xa 10 m
  m = fighting(pair()); m.A.cast('c', m.a); for (let i = 0; i < 60; i++) m.step(); assert.equal(m.B.hp, DUEL.hp);   // lao 7 m chưa tới B (10 m)
  m = fighting(pair()); m.a.x = m.b.x - 5; m.A.cast('c', m.a); for (let i = 0; i < 60; i++) m.step(); assert.equal(m.B.hp, DUEL.hp - MOVES.c.dmg);
  m = fighting(pair()); m.a.x = m.b.x - 5; m.A.cast('c', m.a); assert.ok(m.until(() => m.B.incomingCount > 0, 60)); m.b.z += 3; for (let i = 0; i < 60; i++) m.step(); assert.equal(m.B.hp, DUEL.hp);
});
test('Hộ thân đỡ hoàn hảo (canh đúng lúc): không mất máu và đối thủ bị phản; đỡ thường giảm 70%', () => {
  let m = fighting(pair()); m.a.x = m.b.x - 2; m.A.cast('a', m.a);
  assert.ok(m.until(() => m.B.incomingCount > 0, 60)); assert.equal(m.B.cast('g', m.b).ok, true);
  for (let i = 0; i < 60; i++) m.step(); assert.equal(m.B.hp, DUEL.hp); assert.equal(m.B.stats.perfects, 1); assert.equal(m.A.hp, DUEL.hp - MOVES.g.counter);
  m = fighting(pair()); m.a.x = m.b.x - 2; m.B.cast('g', m.b); for (let i = 0; i < 20; i++) m.step();   // giơ đỡ sớm hơn đòn quá 0,45 s
  m.A.cast('a', m.a); for (let i = 0; i < 60; i++) m.step();
  assert.ok(m.B.hp < DUEL.hp && m.B.hp > DUEL.hp - MOVES.a.dmg, 'đỡ thường chỉ mất một phần');
});
test('spam một chiêu thì yếu dần', () => {
  const m = fighting(pair()); m.a.x = m.b.x - 2; const dm = [];
  for (let i = 0; i < 3; i++) { const h = m.B.hp; m.A.cast('a', m.a); for (let k = 0; k < 60; k++) m.step(); dm.push(h - m.B.hp); }
  assert.ok(dm[0] > dm[1] && dm[1] > dm[2], 'giảm dần: ' + dm);
});
test('hết sinh lực là thua; hết giờ so sinh lực; đối thủ rời thì mình thắng', () => {
  let m = fighting(pair()); m.a.x = m.b.x - 2; let n = 0;
  while (m.B.phase !== 'over' && n++ < 80) { for (let k = 0; k < 40; k++) { m.step(); m.A.cast('a', m.a); if (m.B.phase === 'over') break; } m.a.x = m.b.x - 2; }
  assert.equal(m.B.phase, 'over'); assert.equal(m.B.result.winner, 'opp'); assert.ok(m.until(() => m.A.phase === 'over', 120)); assert.equal(m.A.result.winner, 'me');
  m = fighting(pair()); m.a.x = m.b.x - 2; m.A.cast('a', m.a); for (let i = 0; i < 60; i++) m.step();
  assert.ok(m.until(() => m.A.phase === 'over' && m.B.phase === 'over', 30 * (DUEL.timeS + 8))); assert.equal(m.A.result.winner, 'me'); assert.equal(m.B.result.winner, 'opp');
  m = fighting(pair()); m.B.oppLeft(); assert.equal(m.B.result.winner, 'me'); m.A.forfeit(); assert.equal(m.A.result.winner, 'opp');
});
test('mất tín hiệu quá lâu → bên còn lại thắng vì đối thủ rời', () => {
  const m = fighting(pair()); const A = m.A;
  for (let i = 0; i < 30 * (DUEL.silenceS + 2) && A.phase !== 'over'; i++) A.tick(1 / 30, m.a);
  assert.equal(A.phase, 'over'); assert.equal(A.result.winner, 'me'); assert.equal(A.result.why, 'left');
});
test('chiêu: chưa vào trận / đang ra đòn / chiêu lạ đều bị từ chối', () => {
  const A = D.createDuel(); assert.equal(A.cast('a', { x: 0, z: 0, ry: 0 }).reason, 'chua-danh'); assert.equal(A.cast('z', {}).reason, 'khong-co');
  const m = fighting(pair()); m.A.cast('a', m.a); assert.equal(m.A.cast('b', m.a).reason, 'dang-ra-don');
});

test('zone Võ đài: đăng ký hợp lệ, có đường từ hub, khoá phòng riêng, sàn tròn chặn ngoài vòng', async () => {
  const mgr = createZoneManager({ layout }); mgr.register({ ...HUB_DEF, spawns: { default: { ...HUB_DEF.spawns.default } } });
  registerVoDai(mgr); registerVoDai(mgr);   // gọi lại không đăng ký trùng
  assert.deepEqual(mgr.validate(), []); assert.equal(mgr.roomKey('main', VODAI_ID), 'main:' + VODAI_ID);
  assert.equal(mgr.gateNear(18, 13).to, VODAI_ID);
  const r = await mgr.travel(VODAI_ID, { spawn: 'b' }); assert.equal(r.ok, true); assert.equal(r.spawn.x, D.ARENA.cx + 9);
  assert.equal(layout.blocked(D.ARENA.cx, D.ARENA.cz), false); assert.equal(layout.blocked(D.ARENA.cx + 14, D.ARENA.cz), true); assert.equal(layout.blocked(D.ARENA.cx + 8, D.ARENA.cz), false);
  for (const k of ['default', 'a', 'b']) assert.equal(layout.blocked(VODAI_DEF.spawns[k].x, VODAI_DEF.spawns[k].z), false);
  const back = await mgr.useGate('ve-chua'); assert.equal(back.ok, true); assert.equal(mgr.current, HUB_ID); assert.equal(layout.blocked(-20, 34), true);
});
