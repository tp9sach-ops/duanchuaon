// Phiên 128: thu cá không cần câu — giơ cá, camera, thẻ cá + kỷ lục (node --test tests/fishpose.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { chibiPose } from '../js/world/chibiRig.js';
import { poseFor } from '../js/world/avatarLogic.js';
import { showPose, showLift, handTip, SHOW_S, THROW_RELEASE } from '../js/world/fishPose.js';
import { shotPose, blendShot, lerpAngle, facingOnScreen } from '../js/world/fishShot.js';
import { rollSizeCm, loadRec, noteRecord, cardData, SIZE_CM } from '../js/world/fishCard.js';
import { SPECIES } from '../js/world/fishing.js';

const base = () => chibiPose(poseFor('idle', 0), 'idle', 0, 0, {});
const finite = (o) => Object.values(o).every((v) => typeof v === 'object' ? finite(v) : Number.isFinite(v));

test('showPose: không phải "show" → trả nguyên q; "show" → hữu hạn, không sửa q', () => {
  const q = base(), snap = JSON.stringify(q);
  assert.equal(showPose(q, null), q); assert.equal(showPose(q, { name: 'throw', k: 0.5 }), q);
  for (let k = 0; k <= 1.0001; k += 0.05) { const o = showPose(q, { name: 'show', k }); assert.ok(finite(o)); assert.notEqual(o, q); }
  assert.equal(JSON.stringify(q), snap);
});
test('showLift: 0 ở đầu/cuối, 1 ở giữa, đơn điệu lên rồi xuống', () => {
  assert.equal(showLift(0), 0); assert.equal(showLift(1), 0); assert.equal(showLift(0.5), 1);
  assert.ok(showLift(0.1) < showLift(0.2)); assert.ok(showLift(0.9) > showLift(0.95));
  assert.equal(showLift(NaN), 0);
});
test('hằng số hợp lý; handTip nằm trước mặt, ngang ngực', () => {
  assert.ok(SHOW_S > 0 && THROW_RELEASE > 0 && THROW_RELEASE < 0.55);
  const t = handTip({ x: 1, y: 0, z: 2 }, 0); assert.ok(Math.abs(t.x - 1) < 1e-9 && t.z > 2 && t.y > 1 && t.y < 1.6);
  assert.ok(finite(handTip(null, NaN)));
});
test('shotPose: cast → nhân vật quay mặt sang PHẢI màn hình; show → camera nhìn thẳng mặt; tên lạ → null', () => {
  for (const f of [0, 1, 2, 3, -2, 6.1]) {
    const c = shotPose('cast', f), s = shotPose('show', f);
    assert.ok(facingOnScreen(f, c.yaw) > 0.5); assert.ok(Math.cos(f - s.yaw) > 0.9); assert.ok(c.pitch > s.pitch && c.dist > s.dist);
  }
  assert.equal(shotPose('x', 0), null); assert.equal(shotPose('cast', NaN), null);
});
test('blendShot / lerpAngle: k=0 giữ nguyên, k=1 đúng góc quay, đi đường ngắn qua ±π', () => {
  const cur = { yaw: 3.0, pitch: 0.3, dist: 5 }, sh = { yaw: -3.0, pitch: 1, dist: 7 };
  assert.equal(blendShot(cur, sh, 0), cur); assert.equal(blendShot(cur, null, 1), cur);
  const e = blendShot(cur, sh, 1); assert.ok(Math.abs(Math.sin(e.yaw) - Math.sin(-3)) < 1e-9); assert.equal(e.dist, 7);
  const m = lerpAngle(3.0, -3.0, 0.5); assert.ok(Math.abs(Math.abs(m) - Math.PI) < 0.01);
});
test('rollSizeCm: trong khoảng loài, cá lớn ≥ cá thường cùng rng', () => {
  for (const sp of SPECIES) {
    const [lo, hi] = SIZE_CM[sp.id] || [15, 50];
    for (const u of [0, 0.3, 0.999]) { const n = rollSizeCm({ sp: sp.id, lon: false }, () => u), L = rollSizeCm({ sp: sp.id, lon: true }, () => u); assert.ok(n >= lo - 1 && n <= hi + 1); assert.ok(L >= n); assert.ok(Number.isInteger(L)); }
  }
  assert.ok(rollSizeCm({ sp: 'khongco' }, () => NaN) >= 1);
});
test('loadRec/noteRecord: chống dữ liệu hỏng, chỉ ghi khi cao hơn, không sửa bản cũ', () => {
  assert.deepEqual(loadRec('{hỏng'), {}); assert.deepEqual(loadRec([1]), {}); assert.deepEqual(loadRec({ khongco: 5, [SPECIES[0].id]: -3 }), {});
  const id = SPECIES[0].id, old = { [id]: 40 }, snap = JSON.stringify(old);
  const a = noteRecord(old, { sp: id }, 55); assert.equal(a.isNew, true); assert.equal(a.first, false); assert.equal(a.rec[id], 55);
  const b = noteRecord(a.rec, { sp: id }, 30); assert.equal(b.isNew, false); assert.equal(b.best, 55);
  const c = noteRecord({}, { sp: id }, 10); assert.equal(c.first, true); assert.equal(c.isNew, true);
  assert.equal(noteRecord({}, { sp: 'khongco' }, 10).best, 0); assert.equal(JSON.stringify(old), snap);
});
test('cardData: tên, cỡ, kỷ lục, biến thể; loài lạ → null', () => {
  const id = SPECIES[0].id, c = cardData({ sp: id, lon: true }, 77, { best: 90, isNew: false }, true);
  assert.ok(c.title.includes('khổng lồ') && c.isNew && c.cm === 77 && c.best === 90 && c.recordNew === false && c.variant.includes('Cỡ lớn'));
  assert.equal(cardData({ sp: 'khongco' }, 5), null);
  assert.equal(cardData({ sp: id }, 12, { best: 0, isNew: true }).best, 12);
});

import { fishShadow } from '../js/world/fishingView.js';
import { startCast, buyOrb, loadFish, tick } from '../js/world/fishing.js';
test('Phiên 128: bóng cá bơi vào, lao chạm cầu mỗi lần rỉa rồi lùi ra, liên tục, không lượn vòng', () => {
  for (const seed of [1, 2, 3, 5, 8, 13]) {
    let x = seed; const rng = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
    let s = startCast(buyOrb(loadFish(null), { la: 999, sen: 999 }, 'go').state, 'hoca', rng).sess, prev = null, minAtNib = [];
    while (s.t < s.tBite + 0.1) {
      s = tick(s, 0.02); const f = fishShadow(s);
      if (s.t < s.tShadow || s.t >= s.tBite) { assert.equal(f, null); continue; }
      assert.ok(f.rad >= 0.27 && f.rad <= 2.7 && Math.abs(f.face) === 1 && Number.isFinite(f.yaw) && f.alpha >= 0 && f.alpha <= 1);
      if (prev) assert.ok(Math.abs(f.rad - prev.rad) < 0.2, `nhảy bán kính ${prev.rad}→${f.rad} seed ${seed}`);
      prev = f;
    }
    // đúng lúc rỉa (nibble) bóng cá phải ở rất sát cầu
    for (const n of s.nibbles) { const probe = { ...s, t: n }; const f = fishShadow(probe); if (n > s.tShadow && n < s.tBite) assert.ok(f.rad < 0.4, `rỉa phải sát cầu: ${f.rad}`); }
    const early = fishShadow({ ...s, t: s.tShadow + 0.01 }); assert.ok(early.rad > 2 && early.face === -1);   // vừa hiện: còn xa, đầu quay về phía cầu
  }
});
