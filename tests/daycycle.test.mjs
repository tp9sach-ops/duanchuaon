import test from 'node:test';
import assert from 'node:assert/strict';
import { dayState, sunDir, moonDir, lightDir, phaseName, clockText, lerpHex, wrapHour, realHour, parseHourParam, DAY_SECONDS, HOURS_PER_SECOND, START_HOUR } from '../js/world/daycycle.js';

const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

test('trưa = đúng giá trị cảnh ban ngày cũ; nửa đêm tối hẳn', () => {
  const noon = dayState(12), mid = dayState(0);
  assert.equal(noon.night, 0); assert.equal(mid.night, 1);
  assert.equal(noon.bg, 0xcfe8f5); assert.equal(noon.sun.i, 2.9); assert.equal(noon.sun.color, 0xfff0d2);
  assert.equal(noon.hemi.i, 1.5); assert.equal(noon.hemi.sky, 0xe3f2ff); assert.equal(noon.hemi.ground, 0xb9a487);
  assert.equal(noon.amb.i, 0.5); assert.equal(noon.amb.color, 0xffffff); assert.equal(noon.exposure, 1.05);
  assert.equal(noon.fogDensity, 0.0021); assert.equal(noon.skyTint, 0xffffff); assert.equal(noon.bloom, 0.18);
  assert.equal(noon.stars, 0); assert.equal(noon.lamps, 0); assert.equal(noon.moon, 0);
  assert.equal(mid.stars, 1); assert.equal(mid.lamps, 1); assert.equal(mid.moon, 1); assert.equal(mid.bg, 0x1a2b48);
  assert.ok(mid.sun.i < noon.sun.i && mid.hemi.i < noon.hemi.i && mid.fogDensity > noon.fogDensity);
});

test('bốn buổi: bình minh, ban ngày, hoàng hôn, ban đêm', () => {
  assert.equal(phaseName(6), 'Bình minh'); assert.equal(phaseName(12), 'Ban ngày'); assert.equal(phaseName(18), 'Hoàng hôn');
  assert.equal(phaseName(23), 'Ban đêm'); assert.equal(phaseName(2), 'Ban đêm'); assert.equal(dayState(18).phase, 'Hoàng hôn');
});

test('hoàng hôn/bình minh ấm hơn trưa; tối dần đều sau hoàng hôn, sáng dần đều sau bình minh', () => {
  assert.ok(dayState(18).warm > 0.7 && dayState(6.3).warm > 0.7 && dayState(12).warm < 0.2);
  let prev = -1; for (let h = 16; h <= 21; h += 0.05) { const n = dayState(h).night; assert.ok(n >= prev - 1e-9, 'tối dần lúc ' + h); prev = n; }
  prev = 2; for (let h = 4; h <= 9; h += 0.05) { const n = dayState(h).night; assert.ok(n <= prev + 1e-9, 'sáng dần lúc ' + h); prev = n; }
});

test('đèn bật lúc chạng vạng, tắt khi sáng rõ; sao chỉ hiện khi tối', () => {
  assert.ok(dayState(19).lamps > 0.8); assert.equal(dayState(10).lamps, 0); assert.ok(dayState(5.4).lamps > 0.3); assert.ok(dayState(8).lamps < 0.05);
  assert.equal(dayState(10).stars, 0); assert.ok(dayState(21).stars > 0.99);
  assert.ok(dayState(19).warm1 > dayState(10).warm1 && dayState(23).warm2 > dayState(10).warm2);
});

test('mọi giờ đều hợp lệ và liên tục (màu nguyên 0..0xFFFFFF, không NaN, không nhảy vọt)', () => {
  let p = dayState(0);
  const cols = (s) => [s.bg, s.skyTint, s.sun.color, s.hemi.sky, s.hemi.ground, s.amb.color];
  const nums = (s) => [s.night, s.warm, s.fogDensity, s.sun.i, s.hemi.i, s.amb.i, s.exposure, s.bloom, s.stars, s.moon, s.lamps, s.warm1, s.warm2];
  for (let h = 0.02; h <= 24.0001; h += 0.02) {
    const s = dayState(h);
    for (const c of cols(s)) assert.ok(Number.isInteger(c) && c >= 0 && c <= 0xffffff, 'màu hợp lệ lúc ' + h);
    for (const x of nums(s)) assert.ok(Number.isFinite(x) && x >= 0, 'số hợp lệ lúc ' + h);
    nums(s).forEach((x, i) => assert.ok(Math.abs(x - nums(p)[i]) < 0.35 * Math.max(1, Math.abs(x)), 'không nhảy vọt lúc ' + h + ' (số ' + i + ')'));
    p = s;
  }
  assert.deepEqual(dayState(24), dayState(0)); assert.deepEqual(dayState(-1), dayState(23)); assert.deepEqual(dayState(36), dayState(12));
});

test('mặt trời mọc đông-lặn tây, trăng mọc lúc 18h; hướng đèn luôn đơn vị và không thấp hơn 0,28', () => {
  const n = (v) => Math.hypot(v.x, v.y, v.z);
  const noon = sunDir(12); assert.ok(near(noon.x * 125.1, 45, 0.2) && near(noon.z * 125.1, 85, 0.2) && near(noon.y * 125.1, 80, 0.2), 'trưa = hướng cũ (45,80,85)');
  assert.ok(sunDir(6).y < 0.01 && sunDir(18).y < 0.01 && sunDir(12).y > 0.6 && sunDir(0).y < 0);
  assert.ok(sunDir(7).x * sunDir(17).x < 0, 'sáng và chiều ở hai phía');
  assert.ok(moonDir(0).y > 0.7 && moonDir(18).y < 0.2 && moonDir(6).y < 0.2, 'trăng cao nhất nửa đêm, thấp lúc mọc/lặn');
  assert.ok(moonDir(0).x * sunDir(12).x + moonDir(0).z * sunDir(12).z < 0, 'trăng giữa đêm ở phía đối diện mặt trời trưa');
  for (let h = 0; h < 24; h += 0.25) { const l = lightDir(h); assert.ok(near(n(l), 1, 1e-6) && l.y >= 0.2799, 'đèn hợp lệ lúc ' + h); }
});

test('đồng hồ và tham số ?gio=', () => {
  assert.equal(clockText(0), '00:00'); assert.equal(clockText(9.5), '09:30'); assert.equal(clockText(23.999), '23:59'); assert.equal(clockText(25), '01:00');
  assert.equal(wrapHour(25), 1); assert.equal(wrapHour(-1), 23);
  assert.deepEqual(parseHourParam(''), { hour: START_HOUR, fixed: false });
  assert.deepEqual(parseHourParam('?gio=19.5'), { hour: 19.5, fixed: true }); assert.deepEqual(parseHourParam('?gio=19,5'), { hour: 19.5, fixed: true });
  assert.deepEqual(parseHourParam('?gio=abc'), { hour: START_HOUR, fixed: false }); assert.deepEqual(parseHourParam('?gio=30'), { hour: START_HOUR, fixed: false });
  const t = parseHourParam('?gio=thuc'); assert.equal(t.fixed, false); assert.ok(t.hour >= 0 && t.hour < 24);
  assert.equal(realHour(new Date(2026, 0, 1, 6, 30, 0)), 6.5);
  assert.equal(DAY_SECONDS * HOURS_PER_SECOND, 24); assert.equal(lerpHex(0x102030, 0x304050, 0), 0x102030); assert.equal(lerpHex(0x000000, 0xffffff, 0.5), 0x808080);
});
