import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeather, sharedLevel, slotOf, SLOT_SECONDS, SHARED_WARMUP, RATE } from '../js/world/weather.js';
import { mulberry32 } from '../js/util.js';

const T0 = Date.UTC(2026, 10, 6, 7, 0, 0);          // một mốc thời gian bất kỳ (6/11/2026 07:00 UTC)
const SLOT_MS = SLOT_SECONDS * 1000;

test('sharedLevel: tất định (cùng thời điểm + mùa luôn ra cùng cấp) và luôn trong 0..3', () => {
  for (const season of ['xuan', 'ha', 'thu', 'dong']) for (let i = 0; i < 500; i++) {
    const t = T0 + i * 37_000, a = sharedLevel(t, season), b = sharedLevel(t, season);
    assert.equal(a, b); assert.ok(Number.isInteger(a) && a >= 0 && a <= 3);
  }
});

test('sharedLevel: trong cùng một ô thời gian cấp không đổi; sang ô kế đổi tối đa một cấp', () => {
  for (const season of ['ha', 'dong']) {
    let prev = null;
    for (let k = 0; k < 3000; k++) {
      const t0 = Math.floor(T0 / SLOT_MS) * SLOT_MS + k * SLOT_MS;
      const lv = sharedLevel(t0, season);
      assert.equal(sharedLevel(t0 + SLOT_MS - 1, season), lv, 'cuối ô vẫn cùng cấp');
      if (prev !== null) assert.ok(Math.abs(lv - prev) <= 1, `${prev}->${lv}`);
      prev = lv;
    }
  }
});

test('sharedLevel: mùa hạ mưa nhiều hơn mùa đông; cả hai đều có cả ngày quang lẫn mưa (không kẹt một cấp)', () => {
  const stat = (season) => {
    const c = [0, 0, 0, 0]; const N = 20000;
    for (let k = 0; k < N; k++) c[sharedLevel(T0 + k * SLOT_MS, season)]++;
    return c.map((x) => x / N);
  };
  const ha = stat('ha'), dong = stat('dong');
  assert.ok(ha[0] > 0.05 && ha[0] < 0.7, 'hạ: quang ' + ha[0]);
  assert.ok(1 - ha[0] > 1 - dong[0], `mưa hạ ${1 - ha[0]} > đông ${1 - dong[0]}`);
  assert.ok(ha[3] > dong[3], `mưa lớn: hạ ${ha[3]} > đông ${dong[3]}`);
  assert.ok(ha[1] > 0 && ha[2] > 0 && ha[3] > 0, 'đủ cả ba cấp mưa trong mùa hạ');
  assert.ok(dong[0] > 0.3, 'mùa đông phần lớn là trời quang/ít mưa: ' + dong[0]);
});

test('hai máy mở trang ở hai thời điểm khác nhau nhưng cùng đồng hồ → cùng cấp mục tiêu', () => {
  const a = createWeather({ season: 'ha', shared: true, nowMs: T0, rng: mulberry32(1) });
  const b = createWeather({ season: 'ha', shared: true, nowMs: T0, rng: mulberry32(999) });   // rng khác không ảnh hưởng cấp mưa
  assert.equal(a.target, b.target); assert.equal(a.cur, b.cur);
  let now = T0;
  for (let i = 0; i < 20000; i++) { now += 100; a.update(0.1, now); if (i % 3 === 0) b.update(0.1, now); else b.update(0.1, now); assert.equal(a.target, b.target); }
});

test('máy mở muộn (không có lịch sử) hội tụ về cùng cấp với máy đã chạy từ lâu', () => {
  const old = createWeather({ season: 'ha', shared: true, nowMs: T0, rng: mulberry32(1) });
  let now = T0;
  for (let i = 0; i < 6000; i++) { now += 100; old.update(0.1, now); }       // 10 phút
  const fresh = createWeather({ season: 'ha', shared: true, nowMs: now, rng: mulberry32(2) });
  fresh.update(0.1, now); old.update(0.1, now);
  assert.equal(fresh.target, old.target);
  for (let i = 0; i < 1000; i++) { now += 100; old.update(0.1, now); fresh.update(0.1, now); }   // thêm 100 giây
  assert.ok(Math.abs(fresh.cur - old.cur) < 0.05, `cur ${fresh.cur} vs ${old.cur}`);
});

test('shared: mở trang là vào đúng cơn mưa đang diễn ra (không quang rồi mới mưa); mưa thì mặt đất đã ướt sẵn', () => {
  let found = null;
  for (let k = 0; k < 400 && !found; k++) { const t = T0 + k * SLOT_MS; if (sharedLevel(t, 'ha') >= 2) found = t; }
  assert.ok(found, 'có thời điểm mưa vừa trở lên');
  const w = createWeather({ season: 'ha', shared: true, nowMs: found });
  assert.ok(w.cur >= 2 && w.wet > 0.3);
  let quang = null;
  for (let k = 0; k < 400 && !quang; k++) { const t = T0 + k * SLOT_MS; if (sharedLevel(t, 'ha') === 0) quang = t; }
  const q = createWeather({ season: 'ha', shared: true, nowMs: quang }); assert.equal(q.cur, 0); assert.equal(q.wet, 0);
});

test('shared: cur vẫn chuyển từ từ (không nhảy cấp) khi sang ô mới; tốc độ không vượt RATE', () => {
  const w = createWeather({ season: 'ha', shared: true, nowMs: T0 });
  let last = w.cur, maxJump = 0, now = T0;
  for (let i = 0; i < 60000; i++) { now += 100; w.update(0.1, now); maxJump = Math.max(maxJump, Math.abs(w.cur - last)); last = w.cur; }
  assert.ok(maxJump <= RATE * 0.1 + 1e-9, 'bước nhảy ' + maxJump);
});

test('shared: tắt khi có ?troi= cố định (level nguyên) và không ảnh hưởng chế độ ngẫu nhiên cũ', () => {
  const f = createWeather({ season: 'ha', shared: true, level: 2, nowMs: T0 });
  assert.equal(f.shared, false); f.update(0.1, T0 + 9e9); assert.equal(f.cur, 2);
  const old = createWeather({ rng: mulberry32(3), season: 'ha' });      // không shared → như Phiên 25: quang lúc đầu
  assert.equal(old.cur, 0); assert.equal(old.shared, false);
});

test('shared: nếu không truyền nowMs vào update thì giữ nguyên mục tiêu (không lỗi)', () => {
  const w = createWeather({ season: 'thu', shared: true, nowMs: T0 }); const tg = w.target;
  w.update(0.1); w.update(0.1, undefined); assert.equal(w.target, tg);
});

test('hằng số: ô 120 giây, warmup 24 ô; slotOf đổi đúng tại biên', () => {
  assert.equal(SLOT_SECONDS, 120); assert.equal(SHARED_WARMUP, 24);
  assert.equal(slotOf(0), 0); assert.equal(slotOf(119_999), 0); assert.equal(slotOf(120_000), 1);
});

import { stepShared } from '../js/world/weather.js';
test('stepShared: đơn điệu theo cấp (cùng r, cấp cao không rơi thấp hơn cấp thấp), đổi tối đa một cấp, không vượt 0..3', () => {
  for (const season of ['xuan', 'ha', 'thu', 'dong']) for (let i = 0; i <= 1000; i++) {
    const r = i / 1000 * 0.999999;
    let prev = -1;
    for (let lv = 0; lv <= 3; lv++) {
      const n = stepShared(lv, season, r);
      assert.ok(n >= 0 && n <= 3 && Math.abs(n - lv) <= 1, `${season} ${lv}->${n} r=${r}`);
      assert.ok(n >= prev, `đơn điệu ${season} r=${r} lv=${lv}`); prev = n;
    }
  }
});
