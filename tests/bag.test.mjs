// Túi đồ dạng ô có hình (Phiên 92): mỗi vật phẩm có loại hình hợp lệ + số lượng; ô trống có lời gợi ý; mọi loại nội thất/cá đều có hình.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bagSections, BAG_ICON_KINDS } from '../js/world/dock.js';
import { FURNITURE } from '../js/world/furniture.js';
import { SPECIES, ORBS } from '../js/world/fishing.js';

test('mọi loại nội thất đều có hình trong ô Túi đồ', () => {
  for (const f of FURNITURE) assert.ok(BAG_ICON_KINDS.includes(f.kind), 'thiếu hình cho loại ' + f.kind);
});

test('đầy đủ túi: hàng nào cũng hoặc có hình hợp lệ hoặc là ô trống; số lượng đúng', () => {
  const owned = Object.fromEntries(FURNITURE.map((f) => [f.id, 3]));
  const orbs = Object.fromEntries(ORBS.map((o) => [o.id, 5]));
  const S = bagSections({ sen: 1234, la: 7, fish: { orbs, sel: 'go', pond: SPECIES.map((s) => ({ sp: s.id })) }, furni: { owned, placed: [] }, khinh: 3, strength: { value: 10, tier: 'x', limit: 50 }, board: { own: true, on: false }, land: { own: { lv: 1 } } });
  for (const sec of S) for (const r of sec.rows) { assert.ok(r.ic && BAG_ICON_KINDS.includes(r.ic.k), `${sec.title}/${r.ten}: hình lạ`); assert.ok(!r.trong); }
  assert.equal(S[0].rows[0].n, 1234); assert.equal(S[0].rows[1].n, 7);
  assert.equal(S[2].rows.length, SPECIES.length); assert.ok(S[2].rows.every((r) => r.n === 1));
  assert.equal(S[3].rows.length, FURNITURE.length); assert.ok(S[3].rows.every((r) => r.n === 3 && /^#[0-9a-f]{6}$/.test(r.ic.c)));
  assert.ok(S[1].rows.every((r) => /^#[0-9a-f]{6}$/.test(r.ic.c)));
});

test('túi trống: các mục cầu / cá / nội thất là ô trống kèm gợi ý, không có hình', () => {
  const S = bagSections({});
  for (const i of [1, 2, 3]) { assert.equal(S[i].rows.length, 1); assert.equal(S[i].rows[0].trong, true); assert.ok(!S[i].rows[0].ic); assert.ok(S[i].rows[0].mo.length > 5); }
  assert.ok(S[0].rows.every((r) => r.ic) && S[4].rows.every((r) => r.ic));
});

test('cá khác loài có hình khác nhau theo loại: rùa/ba ba → turtle, mực → squid, hiếm → vàng', () => {
  const S = bagSections({ fish: { pond: [{ sp: 'chep' }, { sp: 'ruanuoc' }, { sp: 'baba' }, { sp: 'mucong' }, { sp: 'koi' }] } });
  const by = Object.fromEntries(S[2].rows.map((r) => [r.ten, r.ic]));
  assert.equal(by['Cá chép'].k, 'fish'); assert.equal(by['Rùa nước'].k, 'turtle'); assert.equal(by['Ba ba'].k, 'turtle'); assert.equal(by['Mực ống'].k, 'squid'); assert.equal(by['Cá koi'].c, '#f0c23a');
});

test('Mảnh chuông Diệu Giang: 3 ô, mảnh chưa có xám + n=0, mảnh Đá có màu khi đã nhận; thiếu ctx vẫn dựng được', () => {
  const sec = (ctx) => bagSections(ctx).find((x) => x.title === 'Mảnh chuông Diệu Giang');
  const a = sec({}); assert.equal(a.rows.length, 3); assert.ok(a.rows.every((r) => r.ic.k === 'bell' && r.n === 0 && r.ic.c === '#4b4f57' && !r.trong));
  const b = sec({ bell: { da: true } }); assert.equal(b.rows[0].n, 1); assert.notEqual(b.rows[0].ic.c, '#4b4f57'); assert.ok(b.rows[0].mo.includes('đã có')); assert.equal(b.rows[1].n, 0);
  assert.ok(BAG_ICON_KINDS.includes('bell')); assert.ok(sec({ bell: 5 }).rows.every((r) => r.n === 0));
});
