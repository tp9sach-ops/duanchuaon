// Test hai vùng quái "rừng sâu" (Phiên 114 tạo vùng Thủy ở bãi thác; Phiên 118 DỜI vào khoảng đất trống). Chạy: node --test tests/hothac.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS, FARM_ZONES, FARM_CFG, MON_CFG } from '../js/data/monsters.js';
import { OUT_WALKS, THAC, DINH_NGHI, OUT_ROCKS, DAI_PHAT, BAO_THAP, MIEU, CO_THU } from '../js/world/outside.js';
import { LAKE, THUY_TA, RIVER } from '../js/world/river.js';
import { rngSeed } from '../js/world/yeuquai.js';
import { zoneAt, oanKhiMaxOf, monsterStats, createSpawner, ZONE_IDS } from '../js/world/spawn.js';

const inR = (r, x, z, m = 0) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;

test('vùng Thủy: cấp/Hệ đúng GDD mục 8; Lý Ngư Tinh là tinh anh; bốn vùng', () => {
  const z = FARM_ZONES.hoThac;
  assert.equal(ZONE_IDS.length, 4);
  assert.deepEqual([MONSTERS.thuyquy.ten, MONSTERS.thuyquy.lv, MONSTERS.lyngu.ten, MONSTERS.lyngu.lv], ['Thủy Quỷ Hồ Thác', 28, 'Lý Ngư Tinh', 38]);
  assert.deepEqual([z.lvMin, z.lvMax, z.he, z.cap, z.eliteMax], [25, 45, 'thuy', 16, 2]);
  assert.deepEqual([...z.normal], ['thuyquy']); assert.deepEqual([...z.elite], ['lyngu']);
  assert.equal(monsterStats('lyngu').elite, true); assert.equal(monsterStats('thuyquy').he, 'thuy');
  const base = (lv) => MON_CFG.oanBase + MON_CFG.oanPerLv * lv;   // công thức đọc từ cấu hình (Phiên 127 đổi số)
  assert.equal(oanKhiMaxOf('thuyquy'), base(28)); assert.equal(oanKhiMaxOf('lyngu'), base(38) * MON_CFG.eliteMul);
});
test('Phiên 118: bãi quái nằm trong khoảng đất trống đi tới được, nối đường mòn bằng lối hẹp; KHÔNG chạm cảnh đẹp (thác, Đại Phật, hồ, Bảo tháp, miếu, cổ thụ, đường mòn)', () => {
  for (const [zid, glade, lane] of [['duongMon', 'rung-sau-dong', 'loi-rung-dong'], ['hoThac', 'rung-sau-tay', 'loi-rung-tay'], ['biaRungThong', 'rung-sau-bac', 'loi-rung-bac'], ['doiBaoThap', 'rung-sau-thap', 'loi-rung-thap']]) {
    const z = FARM_ZONES[zid], g = OUT_WALKS.find((w) => w.id === glade), l = OUT_WALKS.find((w) => w.id === lane);
    assert.ok(g && l, zid); assert.ok(z.rects.every((r) => r.x0 >= g.x0 && r.x1 <= g.x1 && r.z0 >= g.z0 && r.z1 <= g.z1), 'trọn trong khoảng đất trống');
    assert.ok(l.x1 - l.x0 >= 6, 'lối rộng ≥ 6 m');
    const path = OUT_WALKS.find((w) => w.id === ({ duongMon: 'duong-thac', hoThac: 'duong-rung', biaRungThong: 'duong-rung', doiBaoThap: 'san-thap' })[zid]);
    assert.ok(l.z0 <= path.z1 && l.z1 >= path.z0 || l.z0 <= path.z1 + 1 && l.z1 >= path.z0 - 1, 'lối chạm đường mòn');
    assert.ok(l.x0 < g.x1 && g.x0 < l.x1 && l.z0 <= g.z1 + 1 && g.z0 <= l.z1 + 1, 'lối chạm khoảng đất trống');
    for (const r of z.rects) for (const w of OUT_WALKS) if (!/^rung-sau-/.test(w.id)) assert.ok(!(r.x0 < w.x1 && w.x0 < r.x1 && r.z0 < w.z1 && w.z0 < r.z1), `${zid} chồng ${w.id}`);
    for (const r of z.rects) {
      for (const [x, zz] of [[THAC.pool.x, THAC.pool.z], [DAI_PHAT.stand.x, DAI_PHAT.stand.z], [LAKE.x, LAKE.z], [THUY_TA.stand.x, THUY_TA.stand.z], [BAO_THAP.cx, BAO_THAP.cz], [CO_THU.x, CO_THU.z], [(MIEU.x0 + MIEU.x1) / 2, (MIEU.z0 + MIEU.z1) / 2], [(DINH_NGHI.x0 + DINH_NGHI.x1) / 2, (DINH_NGHI.z0 + DINH_NGHI.z1) / 2]]) assert.ok(!inR(r, x, zz, 6), `${zid} sát cảnh đẹp ${x},${zz}`);
      for (const k of OUT_ROCKS) assert.ok(!inR(r, k.x, k.z, 3));
      for (const [x, zz] of RIVER.pts) assert.ok(!inR(r, x, zz, 3), `${zid} sát sông`);
    }
  }
  assert.ok(!FARM_ZONES.biaRungThong.rects.some((r) => inR(r, THAC.pool.x, THAC.pool.z)));
});
test('zoneAt: đường mòn thác, bãi dưới thác và Đại Phật không còn quái; rừng sâu thì có', () => {
  for (const [x, z] of [[90, 96], [95, 118], [80, 104], [108, 118], [106, 104], [20, 104]]) assert.equal(zoneAt(x, z), null, `${x},${z}`);
  assert.equal(zoneAt(52, 130), 'duongMon'); assert.equal(zoneAt(-60, 115), 'hoThac');
});
test('thả quái nhiều lần: quái chỉ ở trong khoảng đất trống; hai vùng cùng hiện không vượt bể vẽ', () => {
  for (const id of ['duongMon', 'hoThac', 'biaRungThong', 'doiBaoThap']) for (const seed of [4, 8, 15, 16, 23, 42]) {
    const z = FARM_ZONES[id], sp = createSpawner(id, rngSeed(seed), { player: { x: z.rects[0].x0 + 1, z: z.rects[0].z0 - 3 } });
    for (const m of sp.mons) assert.ok(z.rects.some((r) => inR(r, m.x, m.z)), `${id} ngoài bãi`);
  }
  assert.ok(3 * FARM_ZONES.hoThac.cap <= FARM_CFG.maxVisible + FARM_ZONES.hoThac.cap, 'bể vẽ');
});

test('Đồi Bảo Tháp (Phiên 126): Hệ Thổ cấp 45–65, ngoài hàng rào chùa, cách tháp, có boss Thạch Linh Hộ Tháp', async () => {
  const z = FARM_ZONES.doiBaoThap, { BOUNDS, GATE } = await import('../js/world/layout.js');
  assert.deepEqual([z.lvMin, z.lvMax, z.he, z.boss, MONSTERS.thachtinh.lv, MONSTERS.hothap.lv, MONSTERS.thachlinh.lv], [40, 65, 'tho', 'thachlinh', 45, 58, 65]);
  assert.equal(MONSTERS.hothap.elite, true); assert.equal(MONSTERS.thachlinh.boss, true); assert.equal(oanKhiMaxOf('thachlinh'), (MON_CFG.oanBase + MON_CFG.oanPerLv * 65) * MON_CFG.bossMul);
  for (const r of z.rects) { assert.ok(r.z0 > GATE.z + 3, 'cách hàng rào chùa'); assert.ok(r.x1 < BOUNDS.xMax); assert.ok(!inR(r, BAO_THAP.cx, BAO_THAP.cz, 6), 'không đè tháp'); }
  assert.equal(zoneAt(60, 47), 'doiBaoThap'); assert.equal(zoneAt(62, 79), null, 'sân tháp để chụp hình');
});
