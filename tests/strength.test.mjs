// Sức mạnh + khiêng/ném vật nặng (Phiên 63).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../js/world/outside.js';   // đăng ký vùng đi bộ/vật cản trước khi kiểm chỗ đặt
import { blocked, region } from '../js/world/layout.js';
import { strengthOf, tierOf, TIERS, carryLimit, strengthNeeded, throwRange, CARRY_ITEMS, itemById, canGrab, landing, createCarry, PICK_RADIUS, RESPAWN_S, PLAYER_KG } from '../js/world/strength.js';
import { PLACES } from '../js/world/outside.js';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('sức mạnh tăng theo cấp, bậc Khinh thân và công đức; đầu vào lạ không ném lỗi', () => {
  const a = strengthOf({ level: 1 }), b = strengthOf({ level: 5 }), c = strengthOf({ level: 5, khinh: 4 }), d = strengthOf({ level: 5, khinh: 4, sen: 400 });
  assert.ok(a < b && b < c && c < d, [a, b, c, d].join());
  for (const bad of [undefined, null, 5, 'x', {}, { level: NaN, khinh: -3, sen: 'a' }]) assert.ok(Number.isInteger(strengthOf(bad)) && strengthOf(bad) >= 6);
  assert.equal(strengthOf({ level: 1 }), 6); assert.equal(strengthOf({ level: 1, khinh: 99 }), strengthOf({ level: 1, khinh: 8 }), 'bậc kẹp ở 8');
});
test('danh hiệu: tăng dần, cấp 1 là Tay yếu', () => { assert.equal(tierOf(0), 'Tay yếu'); assert.equal(tierOf(45), 'Lực sĩ'); assert.equal(tierOf(9999), TIERS[TIERS.length - 1].ten); assert.equal(tierOf('x'), 'Tay yếu'); });
test('sức khiêng, sức cần để khiêng và quãng ném nhất quán với nhau', () => {
  assert.ok(carryLimit(10) < carryLimit(50)); assert.equal(carryLimit(0), 8);
  for (const it of CARRY_ITEMS) { const need = strengthNeeded(it.kg); assert.ok(carryLimit(need) >= it.kg, it.id); if (need > 0) assert.ok(carryLimit(need - 1) < it.kg, it.id + ' đúng ngưỡng'); }
  assert.equal(throwRange(5, 100), 0, 'không khiêng nổi thì không ném'); assert.ok(throwRange(60, 10) > throwRange(60, 80), 'nhẹ ném xa hơn'); assert.ok(throwRange(100, 10) > throwRange(20, 10), 'mạnh ném xa hơn');
  for (const s of [0, 20, 60, 1000]) for (const kg of [1, 20]) { const r = throwRange(s, kg); assert.ok(r === 0 || (r >= 2 && r <= 40)); }
  assert.ok(strengthNeeded(itemById('golim').kg) > strengthOf({ level: 10, khinh: 0, sen: 0 }), 'khúc gỗ lim cần luyện thân/công đức, không chỉ cấp');
});
test('vật khiêng: id không trùng, kg tăng dần, chỗ đặt đi được và không chồng nhau, nằm trong khu vực có tên', () => {
  assert.equal(new Set(CARRY_ITEMS.map((i) => i.id)).size, CARRY_ITEMS.length); assert.deepEqual(CARRY_ITEMS.map((i) => i.kg), [...CARRY_ITEMS.map((i) => i.kg)].sort((x, y) => x - y));
  for (const it of CARRY_ITEMS) { assert.equal(blocked(it.home.x, it.home.z), false, it.id + ' bị chặn'); assert.equal(region(it.home.x, it.home.z), 'ground', it.id); }
  for (let i = 0; i < CARRY_ITEMS.length; i++) for (let j = i + 1; j < CARRY_ITEMS.length; j++) assert.ok(Math.hypot(CARRY_ITEMS[i].home.x - CARRY_ITEMS[j].home.x, CARRY_ITEMS[i].home.z - CARRY_ITEMS[j].home.z) > 2 * PICK_RADIUS);
  assert.ok(PLACES.length > 0); assert.equal(PLAYER_KG, 55);
});
test('luật khiêng/ném NGƯỜI (ptg 08/11): cấp VÀ sức mạnh của người kia đều nhỏ hơn mới được; không cần họ đồng ý', () => {
  const big = { lv: 8, str: 90 };
  assert.deepEqual(canGrab(big, { lv: 3, str: 30 }), { ok: true, reason: '' });
  assert.equal(canGrab(big, { lv: 8, str: 30 }).reason, 'level'); assert.equal(canGrab(big, { lv: 9, str: 10 }).reason, 'level');
  assert.equal(canGrab(big, { lv: 3, str: 90 }).reason, 'strength'); assert.equal(canGrab(big, { lv: 3, str: 120 }).reason, 'strength');
  assert.equal(canGrab({ lv: 5, str: 20 }, { lv: 1, str: 6 }).reason, 'weight', 'phải khiêng nổi 55 kg (cần sức ≥ 30)');
  assert.equal(canGrab({ lv: 1, str: 6 }, { lv: 1, str: 6 }).ok, false); for (const bad of [null, undefined, 5, {}]) assert.equal(canGrab(bad, big).ok, false);
  assert.equal(canGrab({ lv: 5, str: 30 }, { lv: 4, str: 29 }).ok, true);
});
test('điểm rơi: đi thẳng theo hướng, dừng trước vật cản/nước, không bao giờ rơi vào chỗ bị chặn', () => {
  const a = landing(10, 2, 0, 6); assert.deepEqual([a.x, a.z, a.dist], [10, 8, 6]);
  const b = landing(10, 2, Math.PI / 2, 4); assert.ok(Math.abs(b.x - 14) < 1e-9 && Math.abs(b.z - 2) < 1e-9);
  assert.deepEqual(landing(10, 2, 0, 0), { x: 10, z: 2, dist: 0 }); assert.equal(landing(NaN, NaN, NaN, NaN).dist, 0);
  for (let k = 0; k < 40; k++) { const l = landing(-96 + (k % 5), 98 + (k % 7), k * 0.9, 40); assert.equal(blocked(l.x, l.z), false); }
  const wall = landing(0, 2, Math.PI, 60); assert.equal(wall.dist, 8, 'ném về phía chánh điện: dừng trước bậc thềm/tường chặn'); assert.equal(blocked(wall.x, wall.z), false);
});
test('thế giới vật: khiêng đúng bán kính, vật nặng bị từ chối kèm sức cần, ném bay vòng cung rồi hạ cánh, vật tự về chỗ cũ', () => {
  const w = createCarry(), home = itemById('thung').home, near = { x: home.x + 1, z: home.z };
  assert.equal(w.nearest({ x: 0, z: 0 }), null); assert.equal(w.nearest(near).id, 'thung');
  assert.equal(w.pickup('zzz', 99, near).reason, 'unknown'); assert.equal(w.pickup('thung', 99, { x: 0, z: 0 }).reason, 'far');
  assert.equal(w.pickup('golim', 10, { x: -112, z: 84 }).reason, 'heavy'); assert.equal(w.pickup('golim', 10, { x: -112, z: 84 }).need, strengthNeeded(200));
  const p = w.pickup('thung', 6, near); assert.ok(p.ok); assert.equal(w.held.id, 'thung'); assert.equal(w.pickup('cui', 99, { x: -8, z: 96 }).reason, 'busy'); assert.equal(w.nearest(near), null, 'vật đang khiêng không còn "ở gần"');
  const t = w.throwHeld(near, 0, 6); assert.ok(t.ok && t.range > 0); assert.equal(w.held, null); assert.equal(w.items[0].state, 'fly');
  let maxY = 0, landed = []; for (let i = 0; i < 100 && !landed.length; i++) { landed = w.step(0.1); maxY = Math.max(maxY, w.items[0].y); }
  assert.equal(landed.length, 1); assert.equal(w.items[0].state, 'rest'); assert.equal(w.items[0].y, 0); assert.ok(maxY > 1.2, 'bay lên cao'); assert.equal(blocked(w.items[0].x, w.items[0].z), false);
  for (let i = 0; i < (RESPAWN_S + 5) / 0.25; i++) w.step(0.25); assert.deepEqual([w.items[0].x, w.items[0].z], [home.x, home.z], 'tự về chỗ cũ sau một lúc');
  assert.equal(w.throwHeld(near, 0, 6).ok, false);
  w.pickup('thung', 6, { x: home.x, z: home.z }); const d = w.drop({ x: home.x, z: home.z }, 0); assert.equal(d.state, 'rest'); assert.equal(w.held, null); assert.equal(w.drop(near, 0), null);
});
test('nối dây: initCarry trong hudMenu, cảnh 3D trong scene/index, dock có nút khiêng/ném', () => {
  const h = read('js/ui/hudMenu.js'), s = read('js/scene/index.js'), c = read('js/ui/carry.js'), d = read('js/ui/dock.js');
  assert.match(h, /initCarry\(\{ toast \}\)/); assert.match(s, /buildCarry\(carryWorld\)/); assert.match(s, /carry\.update\(t, world && world\.pos, LGT\.carryNear\)/);
  assert.match(d, /khieng: \(\) => LGT\.carry && LGT\.carry\.pickup\(\)/); assert.match(d, /nem: \(\) => LGT\.carry/); assert.ok(!/innerHTML/.test(c)); assert.match(c, /LGT\.strength = /);
});
