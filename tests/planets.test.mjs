import test from 'node:test';
import assert from 'node:assert/strict';
import { planetLongitude, isRetrograde, viTriHanhTinh, gocChieu } from '../js/engines/planets.js';
import { jdFromUTC } from '../js/engines/astro.js';

const jd = (y, m, d, h = 12) => jdFromUTC(Date.UTC(y, m - 1, d, h));
const near = (a, b, tol) => { const x = Math.abs(a - b) % 360; return Math.min(x, 360 - x) <= tol; };

test('J2000 (1/1/2000 12h): Mộc ~25°, Thổ ~40°, Hỏa ~328° (trong 1,5°)', () => {
  const j = jd(2000, 1, 1);
  assert.ok(near(planetLongitude('Mộc Tinh', j), 25.3, 1.5), planetLongitude('Mộc Tinh', j));
  assert.ok(near(planetLongitude('Thổ Tinh', j), 40.4, 1.5), planetLongitude('Thổ Tinh', j));
  assert.ok(near(planetLongitude('Hỏa Tinh', j), 327.9, 1.5), planetLongitude('Hỏa Tinh', j));
});
test('Thủy tinh luôn cách Mặt Trời ≤ 28°, Kim tinh ≤ 48°', () => {
  for (let k = 0; k < 400; k += 7) {
    const j = jd(2024, 1, 1) + k, p = viTriHanhTinh(j).planets, sun = p[0].lon;
    const el = (n) => { const d = Math.abs(p.find((x) => x.ten === n).lon - sun) % 360; return Math.min(d, 360 - d); };
    assert.ok(el('Thủy Tinh') <= 28.5, 'Thủy ' + el('Thủy Tinh')); assert.ok(el('Kim Tinh') <= 48.5, 'Kim ' + el('Kim Tinh'));
  }
});
test('Thủy nghịch hành đợt 1/4–25/4/2024 (giữa đợt nghịch, ngoài đợt thuận)', () => {
  assert.equal(isRetrograde('Thủy Tinh', jd(2024, 4, 12)), true);
  assert.equal(isRetrograde('Thủy Tinh', jd(2024, 5, 20)), false);
  assert.equal(isRetrograde('Mặt Trời', jd(2024, 4, 12)), false);
});
test('Hỏa nghịch hành 6/12/2024 – 24/2/2025 (kiểm giữa đợt)', () => { assert.equal(isRetrograde('Hỏa Tinh', jd(2025, 1, 10)), true); assert.equal(isRetrograde('Hỏa Tinh', jd(2024, 10, 1)), false); });
test('bảng đủ 7 thiên thể, góc chiếu hợp lệ', () => {
  const r = viTriHanhTinh(jd(2026, 11, 1)); assert.equal(r.planets.length, 7);
  r.planets.forEach((p) => { assert.ok(p.lon >= 0 && p.lon < 360); assert.ok(p.cung); });
  r.goc.forEach((g) => assert.ok(g.lech >= 0 && g.lech <= 8));
});
test('góc chiếu: hai thiên thể cách đúng 120° là Tam hợp', () => {
  const g = gocChieu([{ ten: 'A', lon: 10 }, { ten: 'B', lon: 130 }, { ten: 'C', lon: 200 }]);
  assert.ok(g.some((x) => x.a === 'A' && x.b === 'B' && x.ten === 'Tam hợp' && x.lech === 0));
});
