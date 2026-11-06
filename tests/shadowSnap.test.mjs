import test from 'node:test';
import assert from 'node:assert/strict';
import { snapToTexel, shadowBias, SHADOW_R, SUN_MIN_Y } from '../js/world/shadowSnap.js';
import { lightDir } from '../js/world/daycycle.js';

const TEXEL = (2 * SHADOW_R) / 2048;
const basis = (dir) => { const L = Math.hypot(dir.x, dir.y, dir.z), f = { x: -dir.x / L, y: -dir.y / L, z: -dir.z / L }; const rl = Math.hypot(f.z, f.x), r = { x: -f.z / rl, z: f.x / rl }; return { r, u: { x: -r.z * f.y, y: r.z * f.x - r.x * f.z, z: r.x * f.y } }; };
const coords = (p, dir) => { const { r, u } = basis(dir); return { a: p.x * r.x + p.z * r.z, b: p.x * u.x + p.y * u.y + p.z * u.z }; };

test('snapToTexel: toạ độ trong mặt phẳng đèn nằm đúng lưới texel và lệch < 1 texel so với vị trí thật', () => {
  const dir = { x: 45, y: 80, z: 85 };
  for (const [x, z] of [[0, 54], [3.37, 61.9], [-12.2, 88.01], [91.7, 104.4]]) {
    const p = snapToTexel(x, z, dir, TEXEL), c = coords(p, dir);
    assert.ok(Math.abs(c.a / TEXEL - Math.round(c.a / TEXEL)) < 1e-6, 'a trên lưới'); assert.ok(Math.abs(c.b / TEXEL - Math.round(c.b / TEXEL)) < 1e-6, 'b trên lưới');
    assert.ok(Math.hypot(p.x - x, p.z - z) <= TEXEL * 1.5, 'lệch nhỏ');
  }
});
test('snapToTexel: cùng điểm vào luôn ra cùng điểm; đi liên tục thì bóng nhảy từng bậc', () => {
  const dir = { x: 60, y: 90, z: -120 }; assert.deepEqual(snapToTexel(10.3, 70.1, dir, TEXEL), snapToTexel(10.3, 70.1, dir, TEXEL));
  const seen = new Set(); let steps = 0;
  for (let z = 60; z < 61; z += 0.002) { const s = snapToTexel(0, z, dir, TEXEL); seen.add(coords(s, dir).b.toFixed(6)); steps++; }
  assert.ok(seen.size < steps / 5, 'bóng chỉ nhích ' + seen.size + ' bậc trong ' + steps + ' bước');
});
test('snapToTexel: mặt trời ngay trên đầu (suy biến) không sinh NaN', () => {
  const p = snapToTexel(3.3, 4.4, { x: 0, y: 1, z: 0 }, TEXEL); assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
});
test('snapToTexel: dùng được với mọi giờ trong ngày (hướng thật từ lightDir)', () => {
  for (let h = 0; h < 24; h += 0.5) { const d = lightDir(h), p = snapToTexel(7.7, 99.9, d, TEXEL); assert.ok(Number.isFinite(p.x + p.y + p.z), 'giờ ' + h); }
});
test('shadowBias: nắng càng thấp độ lệch càng lớn, có chặn trên, không đổi khi nắng cao', () => {
  const lo = shadowBias(SUN_MIN_Y), mid = shadowBias(0.5), hi = shadowBias(0.9);
  assert.ok(lo.normalBias > mid.normalBias && mid.normalBias > hi.normalBias); assert.ok(lo.bias < mid.bias && mid.bias < hi.bias);
  assert.ok(lo.normalBias <= 0.2 + 1e-9 && hi.normalBias >= 0.05 - 1e-9);
  assert.deepEqual(shadowBias(0.8), shadowBias(1)); assert.deepEqual(shadowBias(0), shadowBias(SUN_MIN_Y));
  for (let h = 0; h < 24; h += 0.25) { const b = shadowBias(lightDir(h).y); assert.ok(b.normalBias >= 0.05 && b.normalBias <= 0.2 + 1e-9, 'giờ ' + h); }
});
