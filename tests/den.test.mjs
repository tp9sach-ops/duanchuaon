import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/placements.js';
import { makeLamp, addLamp, loadLamps, agoText, litCount, logEvent, loadLog, tabItems, nhangMerit, DEN_MERIT, MAX_LAMPS, MAX_LOG, LIT_MS } from '../js/engines/den.js';
import { createLoc, loadLoc, LOC_SPOTS, LOC_RADIUS, LOC_COOLDOWN_MS } from '../js/world/loc.js';
import { blocked, region, SPAWN } from '../js/world/layout.js';
import { findPath } from '../js/world/path.js';

const T0 = 1_800_000_000_000;
test('đèn: điều nguyện hợp lệ → có id, tên sạch, n = 1; sai thì trả lỗi như tường nguyện', () => {
  const r = makeLamp('  Cầu bình an   cho gia đình ', 'Minh   An', T0, () => 0.5);
  assert.equal(r.ok, true); assert.equal(r.lamp.text, 'Cầu bình an cho gia đình'); assert.equal(r.lamp.name, 'Minh An'); assert.equal(r.lamp.n, 1); assert.equal(r.lamp.t, T0); assert.ok(r.lamp.id.length > 3);
  assert.equal(makeLamp('', 'A').error, 'empty'); assert.equal(makeLamp('xem www.abc.vn', 'A').error, 'no_links'); assert.equal(makeLamp('gọi 0912 345 678', 'A').error, 'no_numbers');
  assert.equal(makeLamp('x'.repeat(300), 'A').lamp.text.length, 120);
  assert.equal(makeLamp('ok', '   ').lamp.name, 'Khách'); assert.equal(Array.from(makeLamp('ok', 'N'.repeat(50)).lamp.name).length, 20);
});
test('danh sách đèn: mới nhất ở đầu, tối đa 50', () => {
  let l = []; for (let i = 0; i < 60; i++) l = addLamp(l, makeLamp('n' + i, 'A', T0 + i).lamp);
  assert.equal(l.length, MAX_LAMPS); assert.equal(l[0].text, 'n59');
});
test('đọc dữ liệu lưu: bỏ mục hỏng/độc hại, lọc lại nội dung, chịu JSON hỏng', () => {
  assert.deepEqual(loadLamps('không phải json'), []); assert.deepEqual(loadLamps(null), []); assert.deepEqual(loadLamps({}), []);
  const out = loadLamps(JSON.stringify([{ text: 'tốt', name: 'A', t: T0, n: 3 }, { text: 'xấu http://a.com', t: T0 }, { text: 'thiếu thời gian' }, null, { text: 'ok', t: T0, n: -5, name: '<img>' }]));
  assert.equal(out.length, 2); assert.equal(out[0].n, 3); assert.equal(out[1].n, 1); assert.ok(!/[<>]/.test(out[1].name));
});
test('thời gian trước: vừa xong / phút / giờ / ngày', () => {
  assert.equal(agoText(T0, T0 + 10_000), 'vừa xong'); assert.equal(agoText(T0, T0 + 4 * 60_000), '4 phút trước'); assert.equal(agoText(T0, T0 + 3 * 3600_000), '3 giờ trước'); assert.equal(agoText(T0, T0 + 2 * 86400_000), '2 ngày trước'); assert.equal(agoText(T0, T0 - 5000), 'vừa xong'); assert.equal(agoText(NaN, T0), 'vừa xong');
});
test('số ngọn đang sáng: chỉ đèn trong 24 giờ, cộng theo n', () => {
  const ls = [{ t: T0, n: 2 }, { t: T0 - LIT_MS - 1, n: 5 }, { t: T0 + 5000, n: 1 }];
  assert.equal(litCount(ls, T0 + 1000), 2); assert.equal(litCount(ls, T0 + 10_000), 3); assert.equal(litCount([], T0), 0);
});
test('nhật ký hoạt động: tối đa 40, loại lạ về den, đọc lại sạch', () => {
  let g = []; for (let i = 0; i < 50; i++) g = logEvent(g, i % 2 ? 'nhang' : 'loc', 'sk' + i, T0 + i);
  assert.equal(g.length, MAX_LOG); assert.equal(g[0].text, 'sk49'); assert.equal(logEvent([], 'la', 'x', T0)[0].k, 'den');
  assert.deepEqual(loadLog('xx'), []); assert.equal(loadLog(JSON.stringify([{ k: 'den', text: 'a', t: T0 }, { text: 5 }, { text: 'b', t: 'x' }])).length, 1);
});
test('ba tab: Chùa này (đèn mình), Tất cả chùa (tường chung ẩn danh), Hoạt động (nhật ký)', () => {
  const lamps = [{ text: 'a', name: 'A', t: T0, n: 2 }], log = [{ k: 'nhang', text: 'Thắp 3 nén nhang', t: T0 }];
  assert.deepEqual(tabItems('chua', { lamps }).map((x) => [x.text, x.name, x.n]), [['a', 'A', 2]]);
  const tat = tabItems('tat', { shared: [{ noiDung: 'b', ngay: '2026-11-03T00:00' }] }); assert.equal(tat[0].name, 'Ẩn danh'); assert.equal(tat[0].date, '2026-11-03');
  assert.deepEqual(tabItems('tat', {}), []); assert.equal(tabItems('hoat', { log })[0].kind, 'nhang'); assert.deepEqual(tabItems('lạ', {}), []);
});
test('công đức tạm: nhang 1/3/9 = 1/2/3; số khác = 0', () => { assert.deepEqual([1, 3, 9, 5].map(nhangMerit), [1, 2, 3, 0]); assert.ok(DEN_MERIT.lamp > 0 && DEN_MERIT.loc > 0); });

// ---- hoa sen vàng
test('hoa sen vàng: 8 điểm trong sân, trống, cách vật cản, và đi tới được từ chỗ xuất hiện', () => {
  assert.equal(LOC_SPOTS.length, 8);
  for (const s of LOC_SPOTS) {
    assert.equal(region(s.x, s.z), 'ground'); assert.equal(blocked(s.x, s.z), false);
    for (let a = 0; a < 16; a++) for (const d of [0.9, 1.8]) assert.equal(blocked(s.x + Math.cos(a * Math.PI / 8) * d, s.z + Math.sin(a * Math.PI / 8) * d), false, `quanh (${s.x},${s.z})`);
    const p = findPath(SPAWN.x, SPAWN.z, s.x, s.z); assert.ok(p && p.length); const e = p[p.length - 1]; assert.ok(Math.hypot(e.x - s.x, e.z - s.z) < LOC_RADIUS - 0.5);
  }
});
test('hoa sen: lần đầu nở sẵn; nhận lộc khi tới gần; hồi chiêu; chuyển sang điểm kế', () => {
  const l = createLoc({}), a = LOC_SPOTS[0];
  assert.equal(l.active(T0), true); assert.equal(l.tryCollect({ x: a.x + 5, z: a.z }, T0), null);
  const r = l.tryCollect({ x: a.x + 1, z: a.z }, T0); assert.equal(r.got, true); assert.deepEqual(r.state, { t: T0, count: 1 });
  assert.equal(l.active(T0 + 1000), false); assert.equal(l.tryCollect({ x: a.x, z: a.z }, T0 + 1000), null); assert.equal(l.msLeft(T0 + 1000), LOC_COOLDOWN_MS - 1000);
  assert.equal(l.active(T0 + LOC_COOLDOWN_MS), true); assert.deepEqual(l.spot(), LOC_SPOTS[1]);
});
test('hoa sen: tải lại trang không cày lộc (hồi chiêu lưu); điểm quay vòng; dữ liệu hỏng về 0', () => {
  const l = createLoc({ t: T0, count: 7 }); assert.equal(l.active(T0 + 1000), false); assert.deepEqual(l.spot(), LOC_SPOTS[7]);
  const l2 = createLoc({ t: T0, count: 8 }); assert.deepEqual(l2.spot(), LOC_SPOTS[0]);
  assert.deepEqual(loadLoc('hỏng'), { t: 0, count: 0 }); assert.deepEqual(loadLoc({ t: -5, count: 'x' }), { t: 0, count: 0 }); assert.deepEqual(loadLoc(JSON.stringify({ t: 5, count: 2 })), { t: 5, count: 2 });
});
