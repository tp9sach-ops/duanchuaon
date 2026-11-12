import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/placements.js';
import { BOTTOM_MENU, ACTIONS, TOP_ICONS, pressResult, soonText, ariaLabel, isReady, mapEntries, formatCount, createToastState, HELP_TEXT, OUTSIDE_TEXT, captionOf, CAPTION_MAX, LONG_PRESS_MS } from '../js/ui/menuLogic.js';
import { SPOTS } from '../js/world/spots.js';

test('menu dưới đúng 9 mục như ảnh mẫu, id không trùng', () => {
  assert.deepEqual(BOTTOM_MENU.map((m) => m.label), ['Nhiệm vụ', 'Túi đồ', 'Cửa hàng', 'Cộng đồng', 'Xếp hạng', 'Bản đồ chùa', 'Thiền phái', 'Góp ý', 'Cài đặt']);
  const all = [...BOTTOM_MENU, ...ACTIONS, ...TOP_ICONS].map((x) => x.id);
  assert.equal(new Set(all).size, all.length);
});
test('lưới hành động có 6 nút; Linh thú bị khóa; mọi mục có biểu tượng', () => {
  assert.equal(ACTIONS.length, 6);
  assert.equal(ACTIONS.find((a) => a.id === 'linhthu').locked, true);
  for (const x of [...BOTTOM_MENU, ...ACTIONS, ...TOP_ICONS]) assert.ok(x.icon && x.label && (x.status === 'ready' || x.status === 'soon'), x.id);
});
test('nút chưa có tính năng báo "sắp có", không im lặng; nhãn đọc có ghi (sắp có)', () => {
  const it = BOTTOM_MENU.find((m) => m.id === 'thienphai');
  assert.equal(isReady(it), false);
  assert.deepEqual(pressResult(it), { kind: 'soon', text: 'Thiền phái sắp có — đang được làm.' });
  assert.match(soonText(ACTIONS.find((a) => a.id === 'linhthu')), /khóa/);
  assert.equal(ariaLabel(it), 'Thiền phái (sắp có)');
  assert.deepEqual(pressResult(BOTTOM_MENU.find((m) => m.id === 'xephang')), { kind: 'rank' }, 'Xếp hạng đã có (Phiên 2 xếp hạng)');
  assert.equal(isReady(BOTTOM_MENU.find((m) => m.id === 'nhiemvu')), true, 'Nhiệm vụ đã có (Phiên 17)');
  assert.deepEqual(pressResult(BOTTOM_MENU.find((m) => m.id === 'nhiemvu')), { kind: 'quest' });
});
test('Lạy Phật, Thiền, Tràng hạt, Tụng kinh đã có chức năng (Phiên 14b)', () => {
  assert.deepEqual(pressResult(ACTIONS.find((a) => a.id === 'lay')), { kind: 'bow' });
  assert.deepEqual(pressResult(ACTIONS.find((a) => a.id === 'thien')), { kind: 'meditate' });
  assert.deepEqual(pressResult(ACTIONS.find((a) => a.id === 'trenghat')), { kind: 'beads' });
  assert.deepEqual(pressResult(ACTIONS.find((a) => a.id === 'tungkinh')), { kind: 'chant' });
  assert.match(OUTSIDE_TEXT, /chánh điện/);
});
test('nút đã có chức năng trả đúng hành động', () => {
  assert.deepEqual(pressResult(BOTTOM_MENU.find((m) => m.id === 'bando')), { kind: 'map' });
  assert.deepEqual(pressResult(ACTIONS.find((a) => a.id === 'danglee')), { kind: 'le' });
  assert.deepEqual(pressResult(TOP_ICONS.find((a) => a.id === 'den')), { kind: 'den' });
  assert.deepEqual(pressResult(TOP_ICONS.find((a) => a.id === 'chiase')), { kind: 'share' });
  assert.deepEqual(pressResult(TOP_ICONS.find((a) => a.id === 'trogiup')), { kind: 'help' });
  assert.deepEqual(pressResult(null), { kind: 'none' });
});
test('nút "goto" luôn trỏ tới điểm đến có thật trong spots.js', () => {
  const ids = new Set(SPOTS.map((s) => s.id));
  for (const x of [...BOTTOM_MENU, ...ACTIONS, ...TOP_ICONS]) if (x.action === 'goto') assert.ok(ids.has(x.target), x.id);
});
test('bản đồ chùa liệt kê đủ 6 điểm đến lấy từ spots.js', () => {
  const m = mapEntries(); assert.equal(m.length, SPOTS.length); assert.equal(m.length, 6);
  assert.deepEqual(m.map((e) => e.id), SPOTS.map((s) => s.id));
});
test('định dạng số gọn', () => {
  assert.equal(formatCount(0), '0'); assert.equal(formatCount(135), '135'); assert.equal(formatCount(1200), '1,2k'); assert.equal(formatCount(12000), '12k'); assert.equal(formatCount(-5), '0'); assert.equal(formatCount('x'), '0');
});
test('toast: dòng mới thay dòng cũ, hết hạn thì mất, rỗng bị bỏ, cắt ≤140 ký tự', () => {
  const t = createToastState();
  t.push('Một', 3000, 0); t.push('Hai', 3000, 100);
  assert.equal(t.get(200).text, 'Hai'); assert.equal(t.get(3200), null);
  t.push('   ', 3000, 0); assert.equal(t.get(0), null);
  assert.equal(t.push('x'.repeat(300), 3000, 0).text.length, 140);
  assert.ok(HELP_TEXT.length > 20);
});

test('chữ nhãn nút tròn phải-trên (Phiên 69): có chữ, ngắn, không trùng, không đè nhau', () => {
  const caps = TOP_ICONS.map(captionOf);
  for (const c of caps) { assert.ok(c.length > 0 && c.length <= CAPTION_MAX, c); }
  assert.equal(new Set(caps).size, caps.length);
  assert.equal(captionOf(TOP_ICONS.find((a) => a.id === 'den')), 'Đèn');
  assert.equal(captionOf(TOP_ICONS.find((a) => a.id === 'cauca')), 'Câu cá');
  assert.equal(captionOf({ label: 'Một nhãn rất là dài' }).length, CAPTION_MAX);
  assert.equal(captionOf(null), '');
  assert.ok(LONG_PRESS_MS >= 300 && LONG_PRESS_MS <= 700);
});
