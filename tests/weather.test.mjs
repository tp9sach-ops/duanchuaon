import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeather, effects, nextLevel, parseWeatherParam, changeMessage, LEVEL_NAME, RATE } from '../js/world/weather.js';
import { mulberry32 } from '../js/util.js';

const run = (w, sec, dt = 0.1) => { const ev = []; for (let t = 0; t < sec; t += dt) ev.push(...w.update(dt)); return ev; };

test('?troi= đọc đúng; sai hoặc không có → ngẫu nhiên', () => {
  assert.deepEqual(parseWeatherParam('?troi=2'), { level: 2, fixed: true });
  assert.deepEqual(parseWeatherParam('?troi=0'), { level: 0, fixed: true });
  for (const s of ['', '?troi=', '?troi=4', '?troi=-1', '?troi=abc', '?troi=1.5']) assert.deepEqual(parseWeatherParam(s), { level: null, fixed: false }, s);
});

test('effects: cấp 0 không ảnh hưởng gì; mưa càng lớn càng dày/gió mạnh/tối; giá trị luôn hữu hạn và trong khoảng', () => {
  const e0 = effects(0);
  assert.equal(e0.drops, 0); assert.equal(e0.rain, 0); assert.equal(e0.dim, 0); assert.equal(e0.grey, 0); assert.equal(e0.fog, 0); assert.equal(e0.cloud, 0);
  let prev = effects(0.05);
  for (const c of [0.5, 1, 1.5, 2, 2.5, 3]) {
    const e = effects(c);
    for (const k of ['rain', 'drops', 'wind', 'dim', 'grey', 'fog', 'cloud']) assert.ok(e[k] >= prev[k] - 1e-9, `${k} không giảm khi mưa tăng (cấp ${c})`);
    prev = e;
  }
  for (const c of [-5, 0, 0.3, 1, 2, 3, 99, NaN]) { const e = effects(c === c ? c : 0); for (const v of Object.values(e)) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1.5); }
  assert.ok(effects(1).drops < effects(2).drops && effects(2).drops < effects(3).drops && effects(3).drops <= 1);
  assert.ok(effects(3).wind > 0.9 && effects(1).wind < effects(3).wind);
});

test('nextLevel: mỗi lần chỉ đổi tối đa một cấp, luôn trong 0..3, cả hai chiều đều xảy ra', () => {
  const rng = mulberry32(7), seen = new Set();
  for (const season of ['xuan', 'ha', 'thu', 'dong']) for (let lv = 0; lv <= 3; lv++) for (let i = 0; i < 300; i++) {
    const n = nextLevel(lv, season, rng); assert.ok(n >= 0 && n <= 3 && Math.abs(n - lv) <= 1, `${season} ${lv}->${n}`); seen.add(`${lv}>${n}`);
  }
  for (const k of ['0>0', '0>1', '1>2', '2>3', '3>2', '3>3', '2>1', '1>0']) assert.ok(seen.has(k), 'có chuyển ' + k);
  assert.ok(!seen.has('0>2') && !seen.has('0>3'), 'không nhảy từ quang thẳng lên mưa vừa/lớn');
});

test('mùa hạ mưa nhiều hơn mùa đông; mùa đông ít khi lên mưa lớn', () => {
  const stat = (season) => { const rng = mulberry32(11); let rain = 0, up = 0, n = 4000; for (let i = 0; i < n; i++) { if (nextLevel(0, season, rng) > 0) rain++; if (nextLevel(2, season, rng) === 3) up++; } return { rain: rain / n, up: up / n }; };
  const ha = stat('ha'), dong = stat('dong');
  assert.ok(ha.rain > dong.rain * 2, `hạ ${ha.rain} vs đông ${dong.rain}`);
  assert.ok(ha.up > dong.up * 2, `lên mưa lớn: hạ ${ha.up} vs đông ${dong.up}`);
});

test('mở trang luôn quang đãng một lúc, rồi mưa xuất hiện và chuyển cấp từ từ (không nhảy)', () => {
  const w = createWeather({ rng: mulberry32(3), season: 'ha' });
  assert.equal(w.cur, 0); run(w, 60); assert.equal(w.cur, 0, 'chưa tới 90 giây thì vẫn quang');
  let maxJump = 0, last = w.cur, maxLv = 0, sawRain = false;
  for (let t = 0; t < 6 * 3600; t += 0.1) { w.update(0.1); maxJump = Math.max(maxJump, Math.abs(w.cur - last)); last = w.cur; maxLv = Math.max(maxLv, w.level); if (w.cur > 0.5) sawRain = true; }
  assert.ok(sawRain && maxLv >= 2, 'trong 6 giờ mô phỏng mùa hạ phải có mưa vừa trở lên');
  assert.ok(maxJump <= RATE * 0.1 + 1e-9, 'mỗi bước đổi không quá RATE*dt: ' + maxJump);
});

test('mưa có thể giảm ngược lại và tạnh hẳn', () => {
  const w = createWeather({ rng: mulberry32(5), season: 'ha', startLevel: 3 });
  let drops = 0, ended = false; let prevLv = w.level;
  for (let t = 0; t < 4 * 3600 && !ended; t += 0.1) { w.update(0.1); if (w.level < prevLv) drops++; prevLv = w.level; if (w.cur === 0) ended = true; }
  assert.ok(drops >= 3 && ended, `giảm cấp ${drops} lần và tạnh hẳn: ${ended}`);
});

test('?troi= cố định: giữ nguyên cấp mãi, không đổi', () => {
  for (const lv of [0, 1, 2, 3]) { const w = createWeather({ rng: mulberry32(1), season: 'ha', level: lv }); run(w, 1200); assert.equal(w.cur, lv); assert.equal(w.name, LEVEL_NAME[lv]); }
});

test('mặt đất: ướt dần khi mưa, khô chậm hơn nhiều khi tạnh', () => {
  const w = createWeather({ rng: mulberry32(2), season: 'ha', level: 2 });
  run(w, 10); const a = w.wet; assert.ok(a > 0 && a < 1); run(w, 40); assert.equal(w.wet, 1);
  const dry = createWeather({ rng: mulberry32(2), season: 'ha', level: 0 }); dry.wet = 1; run(dry, 30); assert.ok(dry.wet > 0.7, 'sau 30 giây tạnh vẫn còn ướt nhiều');
  run(dry, 200); assert.equal(dry.wet, 0);
});

test('sấm chớp: chỉ khi mưa lớn; chớp lóe rồi tắt; tiếng sấm tới SAU tia chớp một khoảng trễ và chỉ một lần', () => {
  for (const lv of [0, 1, 2]) { const w = createWeather({ rng: mulberry32(9), level: lv }); const ev = run(w, 600); assert.equal(ev.length, 0, 'cấp ' + lv + ' không có sấm'); assert.equal(w.flash, 0); }
  const w = createWeather({ rng: mulberry32(9), season: 'ha', level: 3 });
  const flashAt = [], thunderAt = [], dt = 0.02; let peak = 0, above = false;
  for (let t = 0; t < 400; t += dt) {
    const ev = w.update(dt); peak = Math.max(peak, w.flash); assert.ok(w.flash >= 0 && w.flash <= 1);
    if (w.flash > 0.5 && !above) { flashAt.push(w.t); above = true; } else if (w.flash < 0.2) above = false;
    for (const e of ev) { thunderAt.push(w.t); assert.ok(e.vol >= 0.25 && e.vol <= 1 && e.dist >= 250 && e.dist <= 2000); }
  }
  assert.ok(flashAt.length >= 8 && peak > 0.7, `có nhiều lần chớp: ${flashAt.length}`);
  assert.ok(thunderAt.length >= 6, 'có tiếng sấm: ' + thunderAt.length);
  // mỗi tiếng sấm có một tia chớp đứng TRƯỚC nó trong vòng 0,7 … 6 giây
  for (const ts of thunderAt) assert.ok(flashAt.some((f) => ts - f >= 0.5 && ts - f <= 6.5), 'sấm ở ' + ts.toFixed(1) + ' có chớp trước đó');
  // khoảng cách giữa các lần chớp hợp lý (không dồn dập như đèn nhấp nháy: ≥ 4 giây giữa hai lần giông, trừ chớp đôi sát nhau)
  const gaps = flashAt.slice(1).map((f, i) => f - flashAt[i]).filter((g) => g > 0.6);
  assert.ok(Math.min(...gaps) >= 3.5, 'khoảng cách chớp nhỏ nhất ' + Math.min(...gaps));
});

test('hết giông thì không còn chớp mới', () => {
  const w = createWeather({ rng: mulberry32(4), season: 'ha', level: 3 }); run(w, 30);
  w.fixed = false; w.target = 0; w.hold = 1e9; run(w, 150);
  assert.equal(w.cur, 0); assert.equal(w.flash, 0); assert.equal(w.update(0.1).length, 0);
});

test('dt bất thường (đổi tab) không làm nhảy cấp', () => {
  const w = createWeather({ rng: mulberry32(6), season: 'ha', startLevel: 1 }); w.target = 3; const c0 = w.cur;
  w.update(500); assert.ok(w.cur - c0 <= RATE * 0.25 + 1e-9);
});

test('thông báo khi đổi cấp: có câu cho mọi cặp khác nhau, rỗng khi không đổi, tiếng Việt, ngắn', () => {
  for (let a = 0; a <= 3; a++) for (let b = 0; b <= 3; b++) {
    const m = changeMessage(a, b);
    if (a === b) assert.equal(m, ''); else assert.ok(m.length > 5 && m.length <= 70 && /[à-ỹ]/i.test(m), `${a}->${b}: ${m}`);
  }
  assert.ok(/tạnh/.test(changeMessage(2, 0)) && /sấm/.test(changeMessage(0, 3)) && /sấm/.test(changeMessage(2, 3)));
});
