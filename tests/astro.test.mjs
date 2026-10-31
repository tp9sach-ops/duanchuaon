// Test thiên văn + cung hoàng đạo. Mốc đối chiếu: thời điểm trăng non/tròn công bố (UTC); sai số cho phép 5 phút.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { jdFromUTC, dateFromJD, sunLongitude, moonLongitude, moonPhase, nextPhaseAt, ascendant } from '../js/engines/astro.js';
import { natalSigns, signIndex } from '../js/engines/zodiac.js';

const Z = JSON.parse(readFileSync(new URL('../js/data/zodiac.json', import.meta.url), 'utf8'));
const t = (s) => jdFromUTC(Date.parse(s));
const near = (jd, iso, minutes = 5) => assert.ok(Math.abs(dateFromJD(jd) - Date.parse(iso)) <= minutes * 60000, `${dateFromJD(jd).toISOString()} ≠ ${iso}`);

test('kinh độ Mặt Trời 2000-01-01 12:00 TT ≈ 280,37° (Meeus)', () => assert.ok(Math.abs(sunLongitude(2451545.0) - 280.37) < 0.05));
test('kinh độ Mặt Trăng ví dụ 47.a Meeus (JDE 2448724.5) ≈ 133,167°', () => assert.ok(Math.abs(moonLongitude(2448724.5) - 133.167) < 0.05));
test('trăng non 2000-01-06 18:14 UTC', () => near(nextPhaseAt(t('2000-01-05T00:00:00Z'), 0), '2000-01-06T18:14:00Z'));
test('trăng tròn 2024-01-25 17:54 UTC', () => near(nextPhaseAt(t('2024-01-24T00:00:00Z'), 180), '2024-01-25T17:54:00Z'));
test('trăng non 2024-04-08 18:21 UTC (nhật thực toàn phần)', () => near(nextPhaseAt(t('2024-04-08T00:00:00Z'), 0), '2024-04-08T18:21:00Z'));
test('trăng tròn 2026-10-26 ≈ 04:12 UTC', () => near(nextPhaseAt(t('2026-10-24T00:00:00Z'), 180), '2026-10-26T04:12:00Z'));
test('pha Trăng ngay lúc trăng tròn: ~100% sáng, tên "Trăng tròn"', () => {
  const p = moonPhase(t('2024-01-25T17:54:00Z'), Z);
  assert.ok(p.phanTramSang > 99.9); assert.equal(p.ten, 'Trăng tròn');
});
test('pha Trăng ngay lúc trăng non: ~0% sáng, tên "Trăng non"', () => {
  const p = moonPhase(t('2024-04-08T18:21:00Z'), Z);
  assert.ok(p.phanTramSang < 0.1); assert.equal(p.ten, 'Trăng non');
});
test('Cung Mọc: RAMC = 0 tại vĩ độ 0° → 90° (Cự Giải); tại vĩ độ 45° → ≈ 111,7°', () => {
  const jd = 2451545.0; // GMST ≈ 280,46°; chọn kinh độ để RAMC = 0
  const lon = -280.46061837;
  assert.ok(Math.abs(ascendant(jd, 0, lon) - 90) < 0.2);
  assert.ok(Math.abs(ascendant(jd, 45, lon) - 111.7) < 0.5);
});
test('signIndex: 0° Bạch Dương, 29,9° Bạch Dương, 30° Kim Ngưu, 359° Song Ngư', () => {
  assert.deepEqual([0, 29.9, 30, 359].map(signIndex), [0, 0, 1, 11]);
});
test('cung Mặt Trời theo ngày sinh (cung đổi quanh ngày 20–23, nên chỉ thử ngày giữa cung)', () => {
  const cases = [[10, 4, 1990, 'Bạch Dương'], [10, 5, 1990, 'Kim Ngưu'], [10, 7, 1990, 'Cự Giải'], [10, 8, 1990, 'Sư Tử'],
    [10, 10, 1990, 'Thiên Bình'], [10, 11, 1990, 'Bọ Cạp'], [10, 1, 1990, 'Ma Kết'], [10, 2, 1990, 'Bảo Bình'], [10, 3, 1990, 'Song Ngư']];
  for (const [d, m, y, ten] of cases) assert.equal(natalSigns(d, m, y, null, null, Z).matTroi.cung.ten, ten, `${d}/${m}/${y}`);
});
test('có giờ sinh + nơi sinh → có cung Mọc; thiếu một trong hai → không', () => {
  const hn = Z.noiSinh.find((x) => x.ten === 'Hà Nội');
  assert.ok(natalSigns(14, 2, 1985, 6, hn, Z).cungMoc);
  assert.equal(natalSigns(14, 2, 1985, 6, null, Z).cungMoc, null);
  assert.equal(natalSigns(14, 2, 1985, null, hn, Z).cungMoc, null);
});
test('cung Mọc đổi theo giờ sinh: cùng ngày, các giờ cách nhau 12 tiếng cho cung khác nhau', () => {
  const hn = Z.noiSinh.find((x) => x.ten === 'Hà Nội');
  const a = natalSigns(14, 2, 1985, 3, hn, Z).cungMoc.cung.ten, b = natalSigns(14, 2, 1985, 9, hn, Z).cungMoc.cung.ten;
  assert.notEqual(a, b);
});
