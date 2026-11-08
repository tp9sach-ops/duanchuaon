// Lộ trình (Phiên 57): logic thuần + nối dây giao diện.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildJourney, pageKhinh, pageKham, pageGieoDuyen, pageNhaCua, PLACE_HINT } from '../js/world/journey.js';
import { PLACES } from '../js/world/outside.js';
import { SPECIES } from '../js/world/fishing.js';
import { QUESTS } from '../js/world/quests.js';

test('4 trang, id ô không trùng, ctx rỗng/hỏng vẫn dựng được và chưa ô nào xong', () => {
  for (const c of [undefined, null, 5, 'x', {}, { prog: 7, fish: [], land: 'a', furni: 3 }]) {
    const p = buildJourney(c); assert.deepEqual(p.map((x) => x.id), ['khinh', 'kham', 'gieoduyen', 'nhacua']);
    const ids = p.flatMap((x) => x.tiles.map((t) => t.id)); assert.equal(ids.length, new Set(ids).size); assert.equal(p.reduce((a, x) => a + x.done, 0), 0);
  }
});
test('khinh công: 8 bậc, bậc đã đạt xong, chỉ bậc kế có nút', () => {
  const p = pageKhinh({ khinh: 3, capNguoi: 4, sen: 10 }); assert.equal(p.tiles.length, 8); assert.equal(p.done, 3);
  assert.deepEqual(p.tiles.map((t) => t.done), [true, true, true, false, false, false, false, false]);
  assert.deepEqual(p.tiles.map((t) => !!t.act), [false, false, false, true, false, false, false, false]);
  assert.match(p.tiles[3].how.join(' '), /cấp độ người chơi từ 4/); assert.equal(pageKhinh({ khinh: 0 }).tiles[0].act.kind, 'story'); assert.equal(pageKhinh({ khinh: 99 }).done, 8);
});
test('khám phá: mỗi nơi có gợi ý; nơi chưa ghé ẩn tên thành “?”, ghé rồi hiện tên', () => {
  for (const pl of PLACES) assert.ok(PLACE_HINT[pl.id], 'thiếu gợi ý ' + pl.id);
  const a = pageKham({}); assert.equal(a.tiles.length, PLACES.length); assert.ok(a.tiles.every((t) => t.secret && t.ten === 'Nơi chưa biết'));
  const b = pageKham({ prog: { seen: { visit: ['thacnuoc', 'hoca'] } } }); assert.equal(b.done, 2);
  assert.equal(b.tiles.find((t) => t.id === 'kp-thacnuoc').ten, 'Thác nước'); assert.equal(b.tiles.find((t) => t.id === 'kp-thacnuoc').quest, 'm-thac');
  for (const t of a.tiles) if (t.quest) assert.ok(QUESTS.some((q) => q.id === t.quest), t.quest);
});
test('gieo duyên: mua cầu / câu / phóng sinh / sổ loài', () => {
  const a = pageGieoDuyen({}); assert.equal(a.done, 0); assert.equal(a.tiles.filter((t) => t.id.startsWith('gd-sp-')).length, SPECIES.length);
  assert.match(a.tiles[0].mo, /50 hạt sen/);
  const b = pageGieoDuyen({ fish: { orbs: { go: 5 }, stat: { got: 2, rel: 1 }, pond: [{ uid: 1, sp: 'koi' }], dex: { koi: 2, chep: 1, khongco: 4 } } });
  const d = Object.fromEntries(b.tiles.map((t) => [t.id, t.done])); assert.ok(d['gd-mua'] && d['gd-cau'] && d['gd-phong'] && d['gd-ao'] && d['gd-sp-koi'] && d['gd-sp-chep']); assert.ok(!d['gd-sp-baba'] && !d['gd-orb-da']);
  assert.equal(b.tiles.find((t) => t.id === 'gd-sp-koi').ten, 'Cá koi'); assert.equal(a.tiles.find((t) => t.id === 'gd-sp-koi').ten, 'Loài chưa gặp');
});
test('đất · nhà · nội thất · tiệc (tiệc chưa có → “sắp có”, không tính vào tổng)', () => {
  const a = pageNhaCua({}); assert.equal(a.done, 0); const tiec = a.tiles.find((t) => t.id === 'nc-tiec'); assert.ok(tiec.soon && !tiec.done); assert.equal(a.total, a.tiles.length - 1);
  const b = pageNhaCua({ land: { own: { xom: 1, plot: 1, lv: 2 } }, furni: { owned: { a: 1 }, placed: [{}] }, prog: { done: { 'm-doila': true } } });
  const d = Object.fromEntries(b.tiles.map((t) => [t.id, t.done])); assert.ok(d['nc-la'] && d['nc-dat'] && d['nc-nha1'] && d['nc-nha2'] && d['nc-mua'] && d['nc-dat-do']); assert.ok(!d['nc-nha3'] && !d['nc-tiec']);
});
test('nối dây: tab Lộ trình trong quest.js, LGT.spendSen, cầu gỗ bán bằng hạt sen', () => {
  const q = readFileSync(new URL('../js/ui/quest.js', import.meta.url), 'utf8'), h = readFileSync(new URL('../js/ui/hudMenu.js', import.meta.url), 'utf8'), f = readFileSync(new URL('../js/ui/fishing.js', import.meta.url), 'utf8'), j = readFileSync(new URL('../js/ui/journey.js', import.meta.url), 'utf8');
  assert.match(q, /initJourney/); assert.match(q, /data-t="j"/); assert.match(h, /LGT\.spendSen = spendMerit/); assert.match(f, /LGT\.spendSen/); assert.match(f, /priceText/);
  assert.ok(!/innerHTML/.test(j), 'giao diện lộ trình không dùng innerHTML');
});
