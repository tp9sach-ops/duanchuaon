import test from 'node:test';
import assert from 'node:assert/strict';
import { XOM_SIZE, PLOTS, LAND_WALKS, LANE_Z, LOT_W, LOT_D, KHUPHO, plotById, houseRect, emptyLand, loadLand, localRegistry, buyLand, firstOpenXom, freePlots, countXom, maxXom, viewableXoms, setView } from '../js/world/land.js';
import { LAND_LA } from '../js/world/merit.js';
import { addWalk } from '../js/world/layout.js';
import '../js/world/outside.js';
import '../js/world/npc.js';
import { free, findPath } from '../js/world/path.js';
import { blocked, SPAWN } from '../js/world/layout.js';

test('xóm có đúng 10 lô, đánh số 1..10, không chồng nhau và nằm trong khu dân cư, chừa đường giữa', () => {
  assert.equal(XOM_SIZE, 10); assert.equal(PLOTS.length, 10); assert.deepEqual(PLOTS.map((p) => p.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const area = LAND_WALKS.find((w) => w.id === 'khu-dan-cu');
  for (const p of PLOTS) { assert.ok(p.x0 >= area.x0 && p.x1 <= area.x1 && p.z0 >= area.z0 && p.z1 <= area.z1, 'lô ' + p.id + ' ngoài khu'); assert.ok(p.z1 <= LANE_Z.z0 || p.z0 >= LANE_Z.z1, 'lô ' + p.id + ' đè đường giữa'); }
  for (const a of PLOTS) for (const b of PLOTS) if (a.id < b.id) assert.ok(a.x1 <= b.x0 || b.x1 <= a.x0 || a.z1 <= b.z0 || b.z1 <= a.z0, `lô ${a.id} chồng lô ${b.id}`);
  assert.equal(plotById(3).id, 3); assert.equal(plotById(11), null); assert.equal(plotById('x'), null);
});

test('khu dân cư đi tới được từ chỗ xuất hiện: đường xuống xóm, đường giữa, cửa trước mỗi lô; thân nhà nằm trong lô', () => {
  const reach = (t) => { const p = findPath(SPAWN.x, SPAWN.z, t.x, t.z); const e = p && p[p.length - 1]; return !!e && Math.hypot(e.x - t.x, e.z - t.z) < 0.6; };
  assert.ok(free(KHUPHO.stand.x, KHUPHO.stand.z) && reach(KHUPHO.stand), 'chỗ bác khu phố');
  for (const p of PLOTS) {
    assert.ok(free(p.front.x, p.front.z), `cửa trước lô ${p.id} bị chặn`); assert.ok(reach(p.front), `lô ${p.id} không có đường tới`);
    const h = houseRect(p); assert.ok(h.x0 >= p.x0 && h.x1 <= p.x1 && h.z0 >= p.z0 && h.z1 <= p.z1, `nhà lô ${p.id} tràn ra ngoài lô`);
    const hy = (h.z0 + h.z1) / 2; assert.ok(Math.abs(hy - p.front.z) > 1.5, 'nhà không đè cửa trước');
  }
});

test('mua đất: cần đủ 100 lá; được gán xóm 1, lô đã chọn; được tặng nhà cấp 0; không mua hai lần', () => {
  const l0 = emptyLand(), reg = {};
  assert.equal(LAND_LA, 100);
  assert.equal(buyLand(l0, 99, reg, 3).reason, 'poor');
  assert.equal(buyLand(l0, 100, reg, 99).reason, 'invalid'); assert.equal(buyLand(l0, 1e9, reg, 0).reason, 'invalid'); assert.equal(buyLand(l0, NaN, reg, 3).reason, 'poor');
  const r = buyLand(l0, 100, reg, 3); assert.equal(r.ok, true); assert.equal(r.cost, 100); assert.equal(r.xom, 1);
  assert.deepEqual(r.land.own, { xom: 1, plot: 3, lv: 0 }); assert.equal(r.land.view, 1); assert.equal(r.reg[1][3].lv, 0);
  assert.equal(l0.own, null, 'không sửa bản cũ'); assert.deepEqual(reg, {});
  assert.equal(buyLand(r.land, 500, r.reg, 4).reason, 'owned');
});

test('xóm tối đa 10 nhà: nhà thứ 11 sang xóm 2; lô đã có chủ trong xóm thì không mua được', () => {
  let reg = {}; for (let i = 1; i <= 10; i++) { const r = buyLand(emptyLand(), 100, reg, i, 'u' + i); assert.equal(r.xom, 1, 'nhà ' + i); reg = r.reg; }
  assert.equal(countXom(reg, 1), 10); assert.equal(firstOpenXom(reg), 2); assert.deepEqual(freePlots(reg, 1), []);
  const r11 = buyLand(emptyLand(), 100, reg, 5, 'u11'); assert.equal(r11.ok, true); assert.equal(r11.xom, 2); assert.equal(countXom(r11.reg, 2), 1);
  assert.equal(countXom(r11.reg, 1), 10, 'xóm 1 không đổi');
  // xóm 1 còn trống một lô (có người bán/rời) thì nhà mới vào lại xóm 1
  const reg9 = { 1: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [i, { owner: 'u' + i, lv: 0 }])) };
  assert.equal(buyLand(emptyLand(), 100, reg9, 10, 'x').xom, 1); assert.equal(buyLand(emptyLand(), 100, reg9, 4, 'x').reason, 'taken');
  assert.deepEqual(freePlots(reg9, 1), [10]); assert.equal(maxXom(r11.reg), 2);
});

test('xem xóm khác: chỉ các xóm đã có người; đổi xóm xem không đổi nhà của mình', () => {
  const own = buyLand(emptyLand(), 100, {}, 2).land, reg = localRegistry(own);
  assert.deepEqual(viewableXoms(own, reg), [1]); assert.equal(setView(own, 2, reg).ok, false);
  let big = {}; for (let i = 1; i <= 11; i++) big = buyLand(emptyLand(), 100, big, ((i - 1) % 10) + 1, 'u' + i).reg;
  assert.deepEqual(viewableXoms(own, big), [1, 2]);
  const v = setView(own, 2, big); assert.equal(v.ok, true); assert.equal(v.land.view, 2); assert.deepEqual(v.land.own, own.own, 'nhà của mình giữ nguyên');
  assert.equal(setView(own, 0, big).ok, false); assert.equal(setView(own, 3, big).ok, false); assert.equal(setView(own, 'x', big).ok, false);
});

test('đọc dữ liệu hỏng/sửa tay: rác → chưa có đất; lô/xóm vô lý bị bỏ', () => {
  for (const bad of [null, undefined, '{{{', '[]', 7]) assert.deepEqual(loadLand(bad), emptyLand());
  assert.equal(loadLand({ own: { xom: 1, plot: 99 } }).own, null); assert.equal(loadLand({ own: { xom: 0, plot: 2 } }).own, null); assert.equal(loadLand({ own: { xom: 1.5, plot: 2 } }).own, null);
  const ok = loadLand(JSON.stringify({ own: { xom: 2, plot: 4, lv: 9 }, view: 0 })); assert.deepEqual(ok.own, { xom: 2, plot: 4, lv: 0 }); assert.equal(ok.view, 2);
  assert.deepEqual(localRegistry(emptyLand()), {});
});

test('bác khu phố đứng ngoài đường đi: chiếm một vòng nhỏ nhưng đường xuống xóm vẫn rộng', () => {
  assert.equal(blocked(KHUPHO.x, KHUPHO.z), true, 'NPC có va chạm');
  const road = LAND_WALKS.find((w) => w.id === 'duong-xom'); assert.ok(KHUPHO.x > road.x0 && KHUPHO.x < road.x1);
  assert.ok(free(-3, KHUPHO.z) && free(0, KHUPHO.z), 'vẫn đi qua được bên cạnh');
  addWalk;   // import có tác dụng đăng ký; tránh cảnh báo biến không dùng
});
