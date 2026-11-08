// Cụm nút góc phải-dưới + túi đồ ngoài nhà (Phiên 62).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dockButtons, pickHint, loadSeen, bagSections, HINTS } from '../js/world/dock.js';

const ids = (c) => dockButtons(c).map((b) => b.id);
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('nút theo hoàn cảnh: người mới chỉ có Túi đồ; mở khinh thân có Nhảy + Kỹ năng', () => {
  assert.deepEqual(ids({ free: true }), ['tui']);
  assert.deepEqual(ids({ free: true, khinh: 1 }), ['nhay', 'kynang', 'tui']);
  assert.equal(dockButtons({ free: true, khinh: 1 })[0].big, true, 'không có nước → Nhảy là nút to');
  assert.equal(dockButtons({ free: true, khinh: 2, canTrain: true }).find((b) => b.id === 'kynang').hot, true);
  for (const bad of [undefined, null, 5, 'x', {}]) assert.deepEqual(dockButtons(bad), []);
});
test('đang ngồi/thiền/lạy (free=false) → không nút nào', () => assert.deepEqual(ids({ free: false, khinh: 3, water: true }), []));
test('câu cá: sát nước → Thả cầu / Mua cầu / Sửa cầu; đang câu → chỉ Bấm!; câu được → Thu cá + Phóng sinh', () => {
  const w = (fish) => dockButtons({ free: true, khinh: 1, water: true, fish });
  assert.equal(w({ phase: 'idle', hasOrb: true })[0].label, 'Thả cầu'); assert.equal(w({ phase: 'idle', hasOrb: false })[0].label, 'Mua cầu'); assert.equal(w({ phase: 'idle', hasOrb: true, cracked: true })[0].label, 'Sửa cầu');
  assert.deepEqual(w({ phase: 'idle', hasOrb: true }).map((b) => b.id), ['cast', 'nhay', 'kynang', 'tui']);
  const t = w({ phase: 'wait', text: 'Chờ' }); assert.deepEqual(t.map((b) => b.id), ['tap']); assert.equal(t[0].hot, false); assert.equal(t[0].say, 'Chờ');
  assert.equal(w({ phase: 'lotus' })[0].hot, true);
  assert.deepEqual(w({ phase: 'caught', text: 'Được cá' }).map((b) => b.id), ['thu', 'phong']);
  assert.deepEqual(ids({ free: true, water: false, fish: { phase: 'idle' } }), ['tui'], 'xa nước → không có nút thả cầu');
});
test('lời chỉ chỗ bấm: mỗi nút một lần, đúng thứ tự ưu tiên, Kỹ năng chỉ khi đủ điều kiện', () => {
  const b = dockButtons({ free: true, khinh: 1, water: true, fish: { phase: 'idle', hasOrb: true } });
  assert.equal(pickHint(b, []).id, 'cast'); assert.equal(pickHint(b, ['cast']).id, 'nhay'); assert.equal(pickHint(b, ['cast', 'nhay']).id, 'tui');
  assert.equal(pickHint(b, ['cast', 'nhay', 'tui']), null);
  assert.equal(pickHint(dockButtons({ free: true, khinh: 1, canTrain: true }), ['nhay']).id, 'kynang');
  assert.equal(pickHint(dockButtons({ free: true, khinh: 1 }), ['nhay', 'tui']), null);
  assert.equal(pickHint(dockButtons({ free: true, khinh: 1, water: true, fish: { phase: 'lotus' } }), []).id, 'tap');
  assert.equal(pickHint(null, null), null); for (const id of Object.keys(HINTS)) assert.ok(HINTS[id].length > 8);
});
test('đọc danh sách đã chỉ: rác → [], bỏ id lạ/trùng', () => {
  for (const bad of [null, undefined, 'rác{', '{}', 5]) assert.deepEqual(loadSeen(bad), []);
  assert.deepEqual(loadSeen('["cast","cast","xx",5,"tui"]'), ['cast', 'tui']);
});
test('Túi đồ ngoài nhà: tiền, cầu, ao cá, nội thất, thân pháp & nhà; rỗng thì có lời gợi ý', () => {
  const e = bagSections({}); assert.deepEqual(e.map((s) => s.title), ['Tiền', 'Quả cầu câu cá', 'Ao cá riêng', 'Nội thất', 'Thân pháp & nhà']); assert.ok(e.every((s) => s.rows.length >= 1));
  assert.match(e[1].rows[0].mo, /50 hạt sen/);
  const f = bagSections({ sen: 12, la: 3, fish: { orbs: { go: 0, da: 5 }, sel: 'da', pond: [{ sp: 'koi' }, { sp: 'koi' }, { sp: 'zzz' }] }, furni: { owned: { zzz: 2 }, placed: [] }, khinh: 2, land: { own: { lv: 1 } } });
  assert.deepEqual(f[0].rows.map((r) => r.mo), ['12', '3']); assert.match(f[1].rows[0].mo, /đã nứt/); assert.match(f[1].rows[1].mo, /đang dùng/); assert.deepEqual(f[2].rows, [{ ten: 'Cá koi', mo: '× 2' }]);
  assert.equal(f[3].rows[0].ten, 'Chưa có món nào', 'món lạ bị bỏ'); assert.match(f[4].rows[0].mo, /bậc 2\/8/); assert.equal(f[4].rows[1].mo, 'Nhà lầu');
});
test('nối dây: dock + bag trong hudMenu, câu cá chạy khi bảng đóng, nút cũ ẩn, CSS và sw', () => {
  const h = read('js/ui/hudMenu.js'), f = read('js/ui/fishing.js'), s = read('js/ui/skill.js'), d = read('js/ui/dock.js'), css = read('css/dock.css'), html = read('index.html');
  assert.match(h, /initDock\(hud/); assert.match(h, /initBag\(hud\)/); assert.match(h, /!LGT\.inHouse && LGT\.bag\) \? LGT\.bag\.open\(\)/);
  assert.match(f, /cast: castQuick, tap: pressTap, keep, release, status/); assert.ok(!/raf = 0; if \(!sess \|\| box\.hidden\)/.test(f), 'vòng câu không dừng khi đóng bảng'); assert.ok(!/fs-fab/.test(f));
  assert.match(s, /get canTrain\(\)/); assert.match(css, /body\.has-dock #jump-btn/); assert.match(css, /\.dk\{position:absolute;right:/); assert.match(html, /css\/dock\.css/);
  assert.ok(!/innerHTML/.test(d), 'dock không dùng innerHTML'); assert.match(d, /pointerdown/);
});
