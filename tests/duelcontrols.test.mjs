// Phiên 164 (mục 1 lộ trình mới): điều khiển CHUNG giữa Võ đài và đánh quái ngoài rừng — bảng phím, gói tin chiêu mới, tầm đánh của Thương / Chiêu 1–3.
// Chạy: node --test tests/duelcontrols.test.mjs (bộ test chính của giao lưu: tests/duel.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../js/world/duel.js';
import { chatOk } from '../js/engines/room.js';

const { MOVES, DUEL } = D;
const A0 = D.toWorld(-5, 0), B0 = D.toWorld(5, 0);

function pair() {
  const a = { x: A0.x, z: A0.z, ry: Math.PI / 2 }, b = { x: B0.x, z: B0.z, ry: -Math.PI / 2 };
  let now = 0; const q = [];
  const A = D.createDuel({ send: (o) => q.push({ at: now + 0.1, to: 'b', o }) }), B = D.createDuel({ send: (o) => q.push({ at: now + 0.1, to: 'a', o }) });
  const step = (dt = 1 / 30) => {
    now += dt;
    for (let i = 0; i < q.length;) { if (q[i].at <= now) { const m = q.splice(i, 1)[0]; (m.to === 'a' ? A : B).receive(D.decode(D.packObj(D.tagOf('t'), m.o))); } else i++; }
    A.tick(dt, a); B.tick(dt, b);
  };
  const until = (f, n = 600) => { for (let i = 0; i < n; i++) { if (f()) return true; step(); } return f(); };
  return { A, B, a, b, step, until };
}
const fighting = (m) => { assert.ok(m.until(() => m.A.phase === 'fight' && m.B.phase === 'fight'), 'vào trận'); return m; };

test('điều khiển chung: phím → chiêu, mọi chiêu tấn công đều có phím và hình dạng hợp lệ', () => {
  const K = D.KEY_CODES;
  assert.equal(K.Digit1, 'a'); assert.equal(K.Digit2, 't'); assert.equal(K.KeyR, 't'); assert.equal(K.Digit3, 'b'); assert.equal(K.Digit4, 'c');
  assert.equal(K.KeyQ, 'q'); assert.equal(K.KeyW, 'w'); assert.equal(K.KeyE, 'e'); assert.equal(K.Digit6, 'g');
  for (const k of D.ATTACKS) { assert.ok(MOVES[k], k); assert.ok(['melee', 'wave', 'dash'].includes(MOVES[k].shape), k); assert.ok(Object.values(K).includes(k), 'có phím cho ' + k); }
  for (const v of Object.values(K)) assert.ok(MOVES[v], 'phím trỏ tới chiêu có thật: ' + v);
});
test('gói tin: chiêu mới (Thương, Q, W, E) mã hoá/giải mã đúng, vẫn chỉ chữ cái', () => {
  const to = D.tagOf('p');
  for (const kind of ['t', 'q', 'w', 'e']) { const s = D.pack.atk(to, { id: 2, kind, fat: 1, x: A0.x, z: A0.z, ry: 0.5 }); assert.ok(D.isSignal(s) && chatOk(s) === s && !/\d/.test(s)); assert.equal(D.decode(s).kind, kind); }
});
test('Thương với tới xa hơn Đánh thường; Chiêu 1 (khí), Chiêu 2 (quét) và Chiêu 3 (lao) trúng đúng tầm', () => {
  let m = fighting(pair()); m.a.x = m.b.x - 3.2; m.A.cast('a', m.a); for (let i = 0; i < 40; i++) m.step(); assert.equal(m.B.hp, DUEL.hp);   // 3,2 m: đánh thường (tầm 2,6) trượt
  m = fighting(pair()); m.a.x = m.b.x - 3.2; assert.equal(m.A.cast('t', m.a).ok, true); for (let i = 0; i < 40; i++) m.step(); assert.equal(m.B.hp, DUEL.hp - MOVES.t.dmg);
  m = fighting(pair()); m.A.cast('q', m.a); assert.ok(m.until(() => m.B.hp < DUEL.hp, 120)); assert.equal(m.B.hp, DUEL.hp - MOVES.q.dmg);
  m = fighting(pair()); m.a.x = m.b.x - 6; m.A.cast('e', m.a); for (let i = 0; i < 60; i++) m.step(); assert.equal(m.B.hp, DUEL.hp - MOVES.e.dmg);
  m = fighting(pair()); m.a.x = m.b.x - 3.8; m.A.cast('w', m.a); for (let i = 0; i < 40; i++) m.step(); assert.equal(m.B.hp, DUEL.hp - MOVES.w.dmg);   // Chiêu 2 quét rộng 4,4 m
});
