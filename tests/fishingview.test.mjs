// Hình học cảnh câu cá 3D (Phiên 48, mục 1.2): chỉ kiểm phần thuần của js/world/fishingView.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { castTarget, flightPoint, rippleAt, rippleTimes, fishShadow, bobY, lotusBloom, orbColor, sessionKey, waterY, FLIGHT } from '../js/world/fishingView.js';
import { FISH_WATERS, ORBS, startCast, loadFish, buyOrb, tick, nearWater } from '../js/world/fishing.js';

const mkSess = (seed = 1) => {
  let st = buyOrb(loadFish(null), { la: 999, sen: 999 }, 'go').state, x = seed;
  const rng = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
  return startCast(st, 'hoca', rng).sess;
};

test('điểm cầu rơi nằm trong mặt nước, về phía người chơi, và người đứng ở bờ nào cũng thả được', () => {
  for (const w of FISH_WATERS) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]) {
    const p = { x: w.x + dx * (w.r + 1), z: w.z + dz * (w.r + 1) }, t = castTarget(p, w);
    const d = Math.hypot(t.x - w.x, t.z - w.z); assert.ok(d < w.r && d > 0, `${w.id} ${dx},${dz} d=${d}`);
    if (dx || dz) assert.ok(Math.hypot(p.x - t.x, p.z - t.z) < Math.hypot(p.x - w.x, p.z - w.z), 'rơi về phía người chơi');
  }
  const c = castTarget({ x: 60, z: 10 }, 'hoca'); assert.ok(Math.hypot(c.x - 60, c.z - 10) > 1);   // đứng giữa hồ (lương đình)
  assert.deepEqual(castTarget(null, 'hoca'), { x: 0, z: 0 });
});

test('điểm cầu rơi vẫn là nước "câu được" (nearWater) và có độ cao mặt nước', () => {
  for (const w of FISH_WATERS) { const t = castTarget({ x: w.x + w.r + 2, z: w.z }, w); assert.equal(nearWater(t.x, t.z).id, w.id); assert.ok(waterY(w.id) > 0 && waterY(w.id) < 1); }
});

test('quả cầu bay vòng cung: bắt đầu ở tay, kết thúc ở mặt nước, cao nhất ở giữa', () => {
  const from = { x: 0, y: 1.2, z: 0 }, to = { x: 6, z: 0 };
  const a = flightPoint(0, from, to, 0.1), b = flightPoint(1, from, to, 0.1), m = flightPoint(0.5, from, to, 0.1);
  assert.deepEqual([a.x, a.y], [0, 1.2]); assert.ok(Math.abs(b.x - 6) < 1e-9 && Math.abs(b.y - 0.1) < 1e-9);
  assert.ok(m.y > a.y && m.y > b.y); assert.equal(flightPoint(9, from, to, 0.1).x, 6); assert.equal(flightPoint(-3, from, to, 0.1).x, 0);
});

test('vòng sóng: -1 trước và sau, 0..1 trong khoảng; mốc sóng gồm cầu chạm nước và mọi lần rỉa', () => {
  assert.equal(rippleAt(0.5, 1), -1); assert.equal(rippleAt(3, 1), -1); assert.ok(Math.abs(rippleAt(1.55, 1) - 0.5) < 1e-9);
  const s = mkSess(); const r = rippleTimes(s); assert.equal(r[0], FLIGHT); assert.equal(r.length, 1 + s.nibbles.length);
});

test('bóng cá chỉ hiện từ giây thứ 4 tới lúc cắn, bơi vòng rồi lao vào sát cầu; phao chìm đúng lúc rỉa; hoa sen nở đúng cửa sổ', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    let s = mkSess(seed), seenShadow = false, seenLotus = false, sawDip = false;
    for (let i = 0; i < 4000 && !s.over; i++) {
      s = tick(s, 0.05);
      const sh = fishShadow(s), lo = lotusBloom(s);
      if (s.t < s.tShadow || s.t >= s.tBite) assert.equal(sh, null, `không có bóng ngoài khung ${s.t}`); else { assert.ok(sh && sh.rad > 0.2 && sh.alpha >= 0 && sh.alpha <= 1); seenShadow = true; }
      if (s.phase === 'lotus') { assert.ok(lo > 0); seenLotus = true; } else assert.equal(lo, 0);
      if (bobY(s) < -0.03) sawDip = true;
    }
    assert.ok(seenShadow && seenLotus && sawDip, 'seed ' + seed);
  }
  assert.equal(fishShadow(null), null); assert.equal(lotusBloom(null), 0); assert.equal(bobY(null), 0);
});

test('mỗi loại cầu có màu; sessionKey đổi theo phiên mới và ổn định trong một phiên', () => {
  for (const o of ORBS) assert.ok(Number.isInteger(orbColor(o.id)), o.id); assert.ok(Number.isInteger(orbColor('khong-co')));
  const a = mkSess(1), b = mkSess(7); assert.equal(sessionKey(a), sessionKey(tick(a, 0.1))); assert.notEqual(sessionKey(a), sessionKey(b)); assert.equal(sessionKey(null), '');
});
