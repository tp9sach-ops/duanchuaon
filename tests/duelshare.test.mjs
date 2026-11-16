// Phiên 208: Võ đài dùng CHUNG thanh chiêu (heSkill.js) + cụm nút dock (dock.js); chiêu phái có lướt tay + vùng tung chiêu đúng hình vùng trúng của Võ đài; Đánh thường lao tới + chuỗi 3 đòn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MOVES, SLOT_MOVE, hinhOfMove, createDuel, ARENA } from '../js/world/duel.js';
import { previewPoly } from '../js/world/aimPreview.js';
import { planTap } from '../js/world/basicCombo.js';
import { rushTarget } from '../js/world/autoHunt.js';
import { inArena } from '../js/world/duel.js';
const r = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');

test('SLOT_MOVE: ô 1/2/3 của thanh chiêu chung = Q/W/E của Võ đài; ô 4 và Tuyệt Học không dùng', () => {
  assert.deepEqual({ ...SLOT_MOVE }, { 1: 'q', 2: 'w', 3: 'e' });
  assert.equal(SLOT_MOVE[4], undefined); assert.equal(SLOT_MOVE.tuyet, undefined);
});

test('hinhOfMove: khớp số đo trúng của createDuel (khí = dải, lao = dải, cận chiến = quạt); Hộ thân / lạ → null', () => {
  assert.deepEqual(hinhOfMove('q'), { kieu: 'duong', dai: MOVES.q.range, rong: (MOVES.q.halfW + 0.3) * 2 });
  assert.deepEqual(hinhOfMove('e'), { kieu: 'duong', dai: MOVES.e.dash, rong: (MOVES.e.halfW + 0.3) * 2 });
  const w = hinhOfMove('w'); assert.equal(w.kieu, 'non'); assert.ok(Math.abs(w.dai - (MOVES.w.range + 0.4)) < 1e-9); assert.ok(Math.abs(w.goc - 131.8) < 0.2);   // nửa góc 1,15 rad
  assert.equal(hinhOfMove('g'), null); assert.equal(hinhOfMove('zz'), null);
  for (const k of ['q', 'w', 'e', 'a', 't', 'b', 'c']) assert.ok(previewPoly(hinhOfMove(k)), k + ' vẽ được vùng xem trước');
});

test('vùng xem trước ĐÚNG phép trúng: Khí Q — đối thủ ở trong hành lang vẽ ra thì trúng, ngoài hành lang thì né (chạy bằng engine thật)', () => {
  const hq = hinhOfMove('q'), cx = ARENA.cx, cz = ARENA.cz;
  const duelAt = (lat, along) => {
    const a = createDuel({ send: (o) => B2.receive(o) }), B2 = createDuel({ send: (o) => a.receive(o) });
    for (let i = 0; i < 40; i++) { a.tick(0.1, { x: cx - 9, z: cz, ry: Math.PI / 2 }); B2.tick(0.1, { x: cx - 9 + along, z: cz - lat, ry: -Math.PI / 2 }); }
    assert.equal(a.phase, 'fight'); assert.equal(B2.phase, 'fight');
    assert.ok(a.cast('q', { x: cx - 9, z: cz, ry: Math.PI / 2 }).ok);   // ry = π/2 → bay về +x
    for (let i = 0; i < 30; i++) { a.tick(0.05, { x: cx - 9, z: cz, ry: Math.PI / 2 }); B2.tick(0.05, { x: cx - 9 + along, z: cz - lat, ry: -Math.PI / 2 }); }
    return B2.hp < B2.hpMax;
  };
  assert.equal(duelAt(hq.rong / 2 - 0.1, 5), true, 'sát mép trong hành lang → trúng');
  assert.equal(duelAt(hq.rong / 2 + 0.4, 5), false, 'ngoài hành lang → né');
  assert.equal(duelAt(0, hq.dai + 1.5), false, 'xa hơn tầm vẽ → né');
});

test('createDuel: chiêu có hướng lướt — ry truyền vào cast được gửi đi nguyên vẹn (bên kia thấy đúng hướng)', () => {
  const sent = []; const a = createDuel({ send: (o) => sent.push(o) });
  a.receive({ type: 'state', seq: 0, phase: 1, hp: 1000 });
  for (let i = 0; i < 40; i++) a.tick(0.1, { x: ARENA.cx - 9, z: ARENA.cz, ry: 0 });
  assert.equal(a.phase, 'fight');
  const out = a.cast('q', { x: ARENA.cx - 9, z: ARENA.cz, ry: 1.0 }); assert.ok(out.ok);
  const atk = sent.find((o) => o.type === 'atk'); assert.ok(atk && atk.kind === 'q' && Math.abs(atk.ry - 1.0) < 1e-9);
});

test('Đánh thường ở Võ đài: xa tầm đánh nhưng trong tầm lao → lao tới (dừng cách đối thủ ~2 m, KHÔNG ra khỏi sàn); sát rồi thì đánh', () => {
  const me = { x: ARENA.cx - 9, z: ARENA.cz }, op = { x: ARENA.cx + 1, z: ARENA.cz };
  const gap = Math.hypot(op.x - me.x, op.z - me.z);
  assert.equal(planTap({ has: true, gap, body: 0.5, melee: MOVES.a.range }), 'dash');
  const to = rushTarget(me, op, { body: 0.5, stand: 2.0, isBlocked: (x, z) => !inArena(x, z) });
  assert.ok(to && to.dist > 0.4); assert.ok(inArena(to.x, to.z));
  assert.ok(Math.hypot(op.x - to.x, op.z - to.z) <= MOVES.a.range + 0.4 + 0.5, 'dừng đủ gần để bấm tiếp là trúng');
  assert.equal(planTap({ has: true, gap: 2.4, body: 0.5, melee: MOVES.a.range }), 'hit');
  assert.equal(planTap({ has: true, gap: 40, body: 0.5, melee: MOVES.a.range }), 'far');
});

test('nối dây: heSkill.js / dock.js / duel.js dùng chung — không còn ẩn thanh chiêu, hàng nút riêng chỉ còn chiêu chỉ có ở Võ đài', () => {
  const hs = r('../js/ui/heSkill.js'), dk = r('../js/ui/dock.js'), du = r('../js/ui/duel.js');
  assert.ok(!/body\.dl-arena #hs-bar\{display:none/.test(du), 'không ẩn #hs-bar ở Võ đài nữa');
  assert.match(du, /ONLY_HERE = \['b', 'c', 'g'\]/); assert.match(du, /LGT\.duel = \{.*castSlot, basic, status, cdOfSlot, hinhOf/);
  assert.match(hs, /if \(inArena\(\)\) return arenaCast\(slot, swipe\)/); assert.match(hs, /LGT\.duel\.hinhOf\(slot\)/); assert.match(hs, /D\.castSlot\(slot, sd \? sd\.ry : null\)/); assert.match(hs, /arena && \(s === 4 \|\| s === 'tuyet'\)/);
  assert.match(dk, /const luyen = \(\) => \{ const L = LGT\.luyenChieu; if \(L && L\.inside\) return L; const D = LGT\.duel; return D && D\.mode === 'arena' \? D : null; \}/);   // luyen() trả cả LGT.duel → Đánh thường / Thương / combat / hồi chiêu dùng chung
  assert.match(dk, /da: \(\) => \{ const L = luyen\(\); return L \? L\.basic\('da'\)/); assert.match(dk, /thuong: \(\) => \{ const L = luyen\(\); return L \? L\.basic\('thuong'\)/); assert.match(dk, /\|\| !!lc,/);
});

test('sửa lỗi cũ: Thiết đầu công / Chiêu 3 lao bằng { x, z } của landing() (landing không có .to)', () => {
  const du = r('../js/ui/duel.js');
  assert.ok(!/path\.to/.test(du)); assert.match(du, /w\.dash\(\{ x: path\.x, z: path\.z \}/);
});
