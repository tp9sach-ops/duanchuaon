// Phiên 230 (mục 2): CHỔI — luật mua, mã mạng, thu về tay, đập chổi, đồng bộ hành động 'q', nối giao diện.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BROOM as SHOP, buyBroom, loadItems } from '../js/world/items.js';
import { HOLDS, ownedMap, mountMul } from '../js/world/loadout.js';
import { encodeGear, decodeGear, cleanGear } from '../js/world/gearSync.js';
import { returnPose, CHOI_RETURN_S, CHOI_LIFT } from '../js/world/board.js';
import { BROOM, IMPACT_T, slamPose, debrisPlan, debrisAt, windAt, broomRange } from '../js/world/broomMath.js';
import { packAction, unpackAction } from '../js/world/combatShare.js';
const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('mua Chổi: 50 lá, không đủ → poor, đã có → owned, mua xong lưu choi', () => {
  assert.equal(SHOP.gia, 50); assert.equal(SHOP.id, 'choi');
  assert.equal(buyBroom(null, 49).reason, 'poor');
  const r = buyBroom(null, 50); assert.ok(r.ok); assert.equal(r.cost, 50); assert.equal(r.state.choi, true);
  assert.equal(buyBroom(r.state, 999).reason, 'owned');
  assert.equal(loadItems({ choi: true }).choi, true); assert.equal(loadItems({ choi: 'x' }).choi, false); assert.equal(loadItems(null).choi, false);
});
test('Chổi trong túi đồ: là vũ khí, cưỡi được, chưa mua thì chưa chọn được', () => {
  const h = HOLDS.find((x) => x.id === 'choi'); assert.ok(h && h.weapon === true); assert.ok(mountMul('choi') > 1);
  assert.equal(ownedMap({ choi: true }).choi, true); assert.equal(ownedMap({}).choi, false);
});
test('mã mạng: cầm chổi = c, cưỡi chổi = u, khứ hồi, chữ hợp lệ', () => {
  assert.equal(decodeGear(encodeGear({ broom: true })).broom, true); assert.equal(decodeGear(encodeGear({ ride: 'choi' })).ride, 'choi');
  assert.ok(/^[a-z]{1,8}$/.test(encodeGear({ broom: true, hat: true, regen: true, revive: true, ride: 'choi' })));
  assert.equal(cleanGear('cu'), 'cu'); assert.equal(decodeGear('').broom, false);
});
test('thu chổi về tay: phi lên cao → lơ lửng → hạ nhẹ xuống tay, liên tục, kết thúc đúng', () => {
  assert.equal(returnPose(0, 'choi').lift, 0); assert.ok(Math.abs(returnPose(0.6, 'choi').lift - CHOI_LIFT) < 0.01);
  let prev = 0, max = 0; for (let t = 0; t <= CHOI_RETURN_S; t += 0.02) { const p = returnPose(t, 'choi'); max = Math.max(max, p.lift); assert.ok(Math.abs(p.lift - prev) < 0.5, 'không giật'); prev = p.lift; }
  assert.ok(max >= CHOI_LIFT - 0.01); const end = returnPose(CHOI_RETURN_S + 1, 'choi'); assert.equal(end.done, true); assert.equal(end.blend, 1); assert.equal(end.lift, 0);
  assert.equal(returnPose(NaN, 'choi').done, false);
});
test('đập chổi: giơ lên → đập xuống → chạm đất đúng mốc → tan', () => {
  assert.equal(slamPose(0).lift, 0); const top = slamPose(BROOM.windup); assert.ok(Math.abs(top.lift - BROOM.height) < 1e-6); assert.equal(top.impact, false);
  assert.ok(slamPose(BROOM.windup + BROOM.slam / 2).lift < top.lift); assert.equal(slamPose(IMPACT_T).impact, true); assert.equal(slamPose(IMPACT_T).lift, 0);
  assert.ok(slamPose(BROOM.windup * 0.5).grow > 1); assert.equal(slamPose(BROOM.life).done, true); assert.equal(slamPose(-3).done, false); assert.equal(slamPose('x').lift, 0);
});
test('mảnh bay: đủ lá/cát/đá, xác định theo seed, bay lên rồi rơi nằm lại', () => {
  const a = debrisPlan(7), b = debrisPlan(7), c = debrisPlan(8);
  assert.equal(a.length, BROOM.leaves + BROOM.sand + BROOM.stones); assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  for (const k of ['la', 'cat', 'da']) assert.ok(a.some((d) => d.kind === k));
  for (const d of a) { assert.ok(debrisAt(d, 0.1).y > 0); const l = debrisAt(d, 20); assert.equal(l.landed, true); assert.equal(l.y, 0); assert.ok(l.r >= 0 && Number.isFinite(l.r)); }
  const la = a.find((d) => d.kind === 'la'), da = a.find((d) => d.kind === 'da'); assert.ok((2 * la.up) / (BROOM.g * 0.25) > (2 * la.up) / BROOM.g, 'lá rơi chậm hơn đá');
  assert.ok(da);
});
test('tầm đập + gió từ phía sau', () => {
  assert.equal(broomRange(0), BROOM.rangeAir); assert.equal(broomRange(1), BROOM.rangeMin); assert.equal(broomRange(99), BROOM.rangeMax);
  for (let i = 0; i < BROOM.windCount; i++) { const w = windAt(i, 0.3); assert.ok(w.back > 0, 'thổi từ phía sau'); assert.ok(w.a >= 0 && w.a <= 0.5); assert.equal(windAt(i, BROOM.windS + 1).done, true); }
});
test('đồng bộ mạng: hành động q khứ hồi, kẹp tầm, hỏng thì bỏ', () => {
  const s = packAction({ k: 'q', seq: 3, ry: 1.2, rg: 3.2 }); assert.ok(s.startsWith('3,q,'));
  const u = unpackAction(s); assert.equal(u.k, 'q'); assert.ok(Math.abs(u.ry - 1.2) < 0.02); assert.ok(Math.abs(u.rg - 3.2) < 0.06);
  assert.equal(unpackAction(packAction({ k: 'q', seq: 1, ry: 0, rg: 999 })).rg, 8); assert.equal(unpackAction('1,q,5'), null);
});
test('nối giao diện: kit, sfx, items, ván, túi đồ, người khác, room, combatLink', () => {
  assert.match(rd('js/ui/weaponKit.js'), /choi: Object\.freeze/); assert.match(rd('js/ui/sfx.js'), /windStop, broom/);
  const it = rd('js/ui/items.js'); assert.match(it, /buyBroomUi/); assert.match(it, /onBroomHit/); assert.match(it, /heldKind[^\n]*'choi'/);
  assert.match(rd('js/ui/board.js'), /buildBroomMount/); assert.match(rd('js/ui/remoteGear.js'), /g\.broom \? 'choi'/); assert.match(rd('js/ui/bag.js'), /buildBroom/);
  assert.match(rd('js/net/room.js'), /broom: !!s\.choi/); assert.match(rd('js/net/room.js'), /broomFx/); assert.match(rd('js/net/combatLink.js'), /sendBroom/);
  assert.match(rd('js/ui/farm.js'), /weaponSfx/);
});
