// Test vùng thứ ba Hồ Thác Đại Phật (Phiên 114). Chạy: node --test tests/hothac.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS, FARM_ZONES, FARM_CFG } from '../js/data/monsters.js';
import { THAC, DINH_NGHI, OUT_ROCKS, DAI_PHAT } from '../js/world/outside.js';
import { rngSeed } from '../js/world/yeuquai.js';
import { zoneAt, oanKhiMaxOf, monsterStats, createSpawner, ZONE_IDS } from '../js/world/spawn.js';

const corners = (r) => [[r.x0, r.z0], [r.x0, r.z1], [r.x1, r.z0], [r.x1, r.z1]];
const inAvoid = (z, x, zz) => z.avoid.some((c) => Math.hypot(x - c.x, zz - c.z) <= c.r);

test('Hồ Thác Đại Phật: tên/cấp/Hệ đúng GDD mục 8; Lý Ngư Tinh là tinh anh; ba vùng', () => {
  const z = FARM_ZONES.hoThac;
  assert.equal(ZONE_IDS.length, 3);
  assert.deepEqual([MONSTERS.thuyquy.ten, MONSTERS.thuyquy.lv, MONSTERS.lyngu.ten, MONSTERS.lyngu.lv], ['Thủy Quỷ Hồ Thác', 28, 'Lý Ngư Tinh', 38]);
  assert.deepEqual([z.ten, z.lvMin, z.lvMax, z.he, z.cap, z.eliteMax], ['Hồ Thác Đại Phật', 25, 45, 'thuy', 12, 1]);
  assert.deepEqual([...z.normal], ['thuyquy']); assert.deepEqual([...z.elite], ['lyngu']);
  assert.equal(monsterStats('lyngu').elite, true); assert.equal(monsterStats('thuyquy').he, 'thuy');
  assert.equal(oanKhiMaxOf('thuyquy'), 30 + 12 * 28); assert.equal(oanKhiMaxOf('lyngu'), (30 + 12 * 38) * 3);
});
test('Hồ Thác: avoid che hồ thác (kể cả lề), đình nghỉ chân, bốn đá lớn, bậc đá và đèn trước Đại Phật; chỗ đứng ngắm không bị quái chiếm', () => {
  const z = FARM_ZONES.hoThac, covers = (c, x, zz, r = 0) => Math.hypot(x - c.x, zz - c.z) + r <= c.r;
  assert.ok(z.avoid.some((c) => covers(c, THAC.pool.x, THAC.pool.z, THAC.pool.r + 1.5)), 'hồ + lề 1,5 m');
  for (const [x, zz] of corners(DINH_NGHI)) assert.ok(inAvoid(z, x, zz), 'đình');
  for (const k of OUT_ROCKS) assert.ok(z.avoid.some((c) => covers(c, k.x, k.z, k.r)), `đá ${k.x},${k.z}`);
  for (const [x, zz] of corners(DAI_PHAT.bac)) assert.ok(z.avoid.some((c) => covers(c, x, zz)) || !z.rects.some((r) => x >= r.x0 && x <= r.x1 && zz >= r.z0 && zz <= r.z1), 'bậc đá');
  for (const d of DAI_PHAT.den) assert.ok(inAvoid(z, d.x, d.z), 'đèn đá');
  assert.ok(z.avoid.some((c) => covers(c, DAI_PHAT.stand.x, DAI_PHAT.stand.z)), 'chỗ đứng ngắm Đại Phật');
});
test('zoneAt nhận Hồ Thác; đường mòn phía tây vẫn là Đường Mòn; giữa hồ vẫn thuộc vùng (quái chỉ không đặt ở đó)', () => {
  assert.equal(zoneAt(90, 96), 'hoThac'); assert.equal(zoneAt(95, 118), 'hoThac');
  assert.equal(zoneAt(80, 104), 'duongMon'); assert.equal(zoneAt(82, 104), null);
});
test('thả quái nhiều lần: không con nào đứng trong hồ / bậc đá; hai vùng sát nhau cùng hiện không vượt bể vẽ', () => {
  const z = FARM_ZONES.hoThac;
  for (const seed of [4, 8, 15, 16, 23, 42]) {
    const sp = createSpawner('hoThac', rngSeed(seed), { player: { x: 88, z: 100 } });
    for (const m of sp.mons) { assert.ok(Math.hypot(m.x - THAC.pool.x, m.z - THAC.pool.z) > THAC.pool.r + 1.5, 'trong hồ'); assert.ok(m.x < DAI_PHAT.bac.x0 || m.z < DAI_PHAT.bac.z0 || m.z > DAI_PHAT.bac.z1, 'trên bậc đá'); assert.ok(!inAvoid(z, m.x, m.z)); }
  }
  assert.ok(2 * z.cap <= FARM_CFG.maxVisible, 'hai vùng sát nhau cùng hiện ≤ bể vẽ');
});
