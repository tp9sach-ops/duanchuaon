// Logic thuần của bảng xếp hạng (js/world/rank.js): gói điểm, chữ "lần cuối", làm sạch phản hồi, thẻ chi tiết.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScore, scoreSig, agoText, dateText, statusText, fmtNum, cleanList, cleanPlayer, detailRows, PING_MS, REFRESH_MS } from '../js/world/rank.js';

const NOW = Date.UTC(2026, 10, 11, 12, 0, 0);
const row = (o = {}) => ({ rank: 1, id: 'abcdef012345', n: 'An', lv: 3, ten: 'Sơ tâm', sen: 120, on: true, seen: NOW, ...o });

test('buildScore: sen là tổng từng kiếm đã tính sẵn, cấp/lá/chi tiết được kẹp đúng', () => {
  const p = buildScore({ sen: 100, leaf: { la: 2, spent: 60 }, level: { lv: 4, ten: 'Tinh tấn' }, xp: 250, done: 7, total: 30, board: true, chapter1: true });
  assert.equal(p.sen, 100); assert.equal(p.lv, 4); assert.equal(p.xp, 250); assert.equal(p.la, 2);
  assert.deepEqual(p.info, { ten: 'Tinh tấn', nv: 7, tnv: 30, ls: 60, van: 1, c1: 1 });
  for (const k of Object.keys(p.info)) assert.match(k, /^[a-z0-9]{1,12}$/, 'khóa info phải hợp lệ với gas/Rank.gs');
});
test('buildScore: thiếu dữ liệu vẫn ra gói hợp lệ (cấp tối thiểu 1, không âm)', () => {
  const p = buildScore();
  assert.equal(p.sen, 0); assert.equal(p.lv, 1); assert.equal(p.xp, 0); assert.equal(p.la, 0); assert.equal(p.info.van, 0); assert.equal(p.info.c1, 0);
  const q = buildScore({ sen: -5, xp: 'abc', level: { lv: 99999, ten: '<b>x</b>' } });
  assert.equal(q.sen, 0); assert.equal(q.xp, 0); assert.equal(q.lv, 999); assert.equal(q.info.ten, 'bx/b');
});
test('scoreSig: giống nhau khi không có gì mới, khác khi sen hoặc cấp đổi', () => {
  const a = buildScore({ sen: 10 }), b = buildScore({ sen: 10 }), c = buildScore({ sen: 11 }), d = buildScore({ sen: 10, level: { lv: 2, ten: 'x' } });
  assert.equal(scoreSig(a), scoreSig(b)); assert.notEqual(scoreSig(a), scoreSig(c)); assert.notEqual(scoreSig(a), scoreSig(d));
});
test('agoText: vừa xong / phút / giờ / ngày / tháng / năm; thiếu mốc → chưa rõ', () => {
  assert.equal(agoText(NOW - 30000, NOW), 'vừa xong');
  assert.equal(agoText(NOW - 5 * 60000, NOW), '5 phút trước');
  assert.equal(agoText(NOW - 3 * 3600000, NOW), '3 giờ trước');
  assert.equal(agoText(NOW - 2 * 86400000, NOW), '2 ngày trước');
  assert.equal(agoText(NOW - 65 * 86400000, NOW), '2 tháng trước');
  assert.equal(agoText(NOW - 361 * 86400000, NOW), '1 năm trước');
  assert.equal(agoText(0, NOW), 'chưa rõ'); assert.equal(agoText('x', NOW), 'chưa rõ');
  assert.equal(agoText(NOW + 99999, NOW), 'vừa xong', 'đồng hồ lệch không ra số âm');
});
test('statusText: online hoặc offline kèm lần cuối', () => {
  assert.equal(statusText(row({ on: true }), NOW), 'Đang online');
  assert.equal(statusText(row({ on: false, seen: NOW - 10 * 60000 }), NOW), 'Offline · 10 phút trước');
  assert.equal(statusText(row({ on: false, seen: 0 }), NOW), 'Offline · chưa rõ');
});
test('fmtNum / dateText', () => {
  assert.equal(fmtNum(0), '0'); assert.equal(fmtNum(999), '999'); assert.equal(fmtNum(1234567), '1.234.567'); assert.equal(fmtNum(-3), '0'); assert.equal(fmtNum('x'), '0');
  assert.equal(dateText(Date.UTC(2026, 5, 15, 12)), '15/06/2026'); assert.equal(dateText(0), 'chưa rõ');
});
test('cleanList: bỏ hàng có id sai, kẹp số, rút gọn tên; phản hồi hỏng → null', () => {
  assert.equal(cleanList(null), null); assert.equal(cleanList({ ok: false }), null); assert.equal(cleanList({ ok: true, top: 'x' }), null);
  const r = cleanList({ ok: true, total: 3, top: [row(), { ...row(), id: 'SAI' }, { ...row({ rank: 2, n: 'x'.repeat(50), sen: -4 }), id: '0123456789ab' }], me: row({ rank: 9 }) });
  assert.equal(r.total, 3); assert.equal(r.top.length, 2); assert.equal(r.top[1].n.length, 20); assert.equal(r.top[1].sen, 0); assert.equal(r.me.rank, 9);
  assert.equal(cleanList({ ok: true, top: [], me: null }).me, null);
});
test('cleanPlayer + detailRows: đủ thông tin chi tiết, dòng thiếu dữ liệu thì bỏ', () => {
  const p = cleanPlayer({ ok: true, player: { ...row({ rank: 2, on: false, seen: NOW - 2 * 3600000 }), xp: 250, la: 3, created: Date.UTC(2026, 5, 15, 12), info: { ten: 'Sơ tâm', nv: 7, tnv: 30, ls: 20, van: 1, c1: 0, 'BAD KEY': 1 } } });
  assert.ok(p); assert.equal(p.info['BAD KEY'], undefined);
  const d = Object.fromEntries(detailRows(p, NOW).map((x) => [x.k, x.v]));
  assert.equal(d['Hạng'], '#2'); assert.equal(d['Cấp'], '3 · Sơ tâm'); assert.equal(d['Trạng thái'], 'Offline · 2 giờ trước');
  assert.equal(d['Điểm công hạnh'], '250'); assert.equal(d['Hạt sen đã kiếm (tổng)'], '120'); assert.equal(d['Lá bồ đề đang có'], '3'); assert.equal(d['Lá bồ đề đã dùng'], '20');
  assert.equal(d['Nhiệm vụ đã xong'], '7/30'); assert.equal(d['Cốt truyện chương 1'], 'Đang làm'); assert.equal(d['Ván trượt'], 'Đã có');
  assert.equal(d['Tham gia từ'], '15/06/2026'); assert.equal(d['Lần cuối thấy'], '2 giờ trước');
  const thin = Object.fromEntries(detailRows(cleanPlayer({ ok: true, player: { ...row({ on: true }), xp: 0, la: 0, created: 0, info: {} } }), NOW).map((x) => [x.k, x.v]));
  assert.equal(thin['Nhiệm vụ đã xong'], undefined); assert.equal(thin['Ván trượt'], undefined); assert.equal(thin['Lần cuối thấy'], undefined); assert.equal(thin['Trạng thái'], 'Đang online');
  assert.equal(cleanPlayer({ ok: false }), null); assert.equal(cleanPlayer({ ok: true, player: { id: 'sai' } }), null); assert.deepEqual(detailRows(null), []);
});
test('hằng số nhịp: ping nhanh hơn thời hạn online của máy chủ (150 giây)', () => {
  assert.ok(PING_MS < 150000); assert.ok(REFRESH_MS >= 5000);
});
