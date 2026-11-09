import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DONATE_BOX, DONATE_SPOT, isDonateSpot } from '../js/world/donate.js';
import { spotById, pickSpot, distTo, SPOTS, isNpcSpot } from '../js/world/spots.js';
import { HALL, SPAWN, blocked, region } from '../js/world/layout.js';
import { findPath, free } from '../js/world/path.js';
import { SEATS, RUG } from '../js/world/seats.js';
import { COLUMNS } from '../js/world/layout.js';

test('thùng công đức là một điểm bấm được, không lẫn vào 6 chương hay NPC', () => {
  assert.equal(spotById('congduc'), DONATE_SPOT); assert.ok(isDonateSpot('congduc')); assert.equal(isDonateSpot('today'), false);
  assert.equal(SPOTS.some((s) => s.id === 'congduc'), false); assert.equal(isNpcSpot('congduc'), false);
});

test('đứng ở điểm đứng thì tới nơi; điểm đứng đi được, không sát vật cản', () => {
  const s = DONATE_SPOT;
  assert.equal(blocked(s.stand.x, s.stand.z), false); assert.equal(free(s.stand.x, s.stand.z), true);
  assert.ok(distTo(s.stand, s) <= s.r);
  assert.equal(region(s.stand.x, s.stand.z), 'plat', 'đứng trên nền chánh điện');
});

test('thùng chặn đúng chỗ nó đứng, không chặn lối giữa, cột, thảm bồ đoàn hay bồ đoàn', () => {
  const b = DONATE_BOX;
  assert.equal(blocked(b.x, b.z), true, 'thân thùng là vật cản');
  for (let x = -2; x <= 2; x += 0.5) assert.equal(blocked(x, -23.3), false, 'lối giữa phải thông');
  assert.ok(b.z - b.d / 2 > RUG.z1 - 1 && Math.abs(b.x) > 5, 'ở ngoài lối đi giữa');
  assert.ok(b.z + b.d / 2 < RUG.z1 + 0.0 || b.z - b.d / 2 > RUG.z1, 'không đè lên thảm');
  for (const c of COLUMNS) assert.ok(Math.hypot(c.x - b.x, c.z - b.z) > 1.3, 'không đè lên cột');
  for (const s of SEATS) assert.ok(Math.abs(s.x - b.x) > 1 || Math.abs(s.z - b.z) > 1.3, 'không đè bồ đoàn ' + s.id);
});

test('từ chỗ xuất hiện tìm được đường tới điểm đứng', () => {
  const p = findPath(SPAWN.x, SPAWN.z, DONATE_SPOT.stand.x, DONATE_SPOT.stand.z);
  assert.ok(p && p.length > 0, 'có đường đi');
  const end = p[p.length - 1]; assert.ok(Math.hypot(end.x - DONATE_SPOT.stand.x, end.z - DONATE_SPOT.stand.z) < 1.5);
});

test('tia nhìn từ cửa chánh điện vào thùng trúng thùng; nhìn lệch thì trượt', () => {
  const b = DONATE_BOX, o = { x: b.x, y: HALL.h + 1.6, z: -18 }, d = { x: 0, y: -(1.6 - 0.6) / 4.7, z: -1 };
  const n = Math.hypot(d.y, d.z), dd = { x: 0, y: d.y / n, z: d.z / n };
  const h = pickSpot(o, dd); assert.ok(h && h.spot.id === 'congduc', 'trúng thùng');
  assert.equal(pickSpot({ x: 20, y: HALL.h + 1.6, z: -18 }, { x: 0, y: 0, z: -1 }) === null || pickSpot({ x: 20, y: HALL.h + 1.6, z: -18 }, { x: 0, y: 0, z: -1 }).spot.id !== 'congduc', true);
});

test('index.html có css thùng, mã nguồn nối đúng (onDonate, ảnh QR, GAS)', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('css/donate.css'));
  const main = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8'); assert.ok(main.includes('onDonate') && main.includes('isDonateSpot'));
  for (const f of ['assets/qr-momo.jpg', 'assets/qr-vietinbank.jpg', 'gas/Donations.gs']) assert.ok(fs.existsSync(new URL('../' + f, import.meta.url)), f);
  const code = fs.readFileSync(new URL('../gas/Code.gs', import.meta.url), 'utf8');
  for (const a of ['donClaim', 'donCheck', 'donAck']) assert.ok(code.includes("case '" + a + "'"), a);
  assert.ok(code.includes('Donations:'));
  const gs = fs.readFileSync(new URL('../gas/Donations.gs', import.meta.url), 'utf8'); assert.ok(gs.includes('DON_SEN_PER_1000 = 1'));
  const eng = fs.readFileSync(new URL('../js/engines/donate.js', import.meta.url), 'utf8'); assert.ok(eng.includes('SEN_PER_1000: 1'));
});
