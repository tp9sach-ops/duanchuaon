import test from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS, FARM_ZONES, RESPAWN_CFG, SPAWN_CFG } from '../js/data/monsters.js';
import { OUT_WALKS, MIEU, CO_THU } from '../js/world/outside.js';
import { LAKE, THUY_TA } from '../js/world/river.js';
import { rngSeed } from '../js/world/yeuquai.js';
import { expToNext } from '../js/world/stats.js';
import { award } from '../js/world/nguonTuVi.js';
import { zoneAt, oanKhiMaxOf, monsterStats, pickPoint, createSpawner, tickSpawner, hitMonster, rollDrops, nearestMonster, ZONE_IDS } from '../js/world/spawn.js';

// tickSpawner kẹp dt ≤ 5 s mỗi lần gọi (như khung hình thật): muốn chờ lâu thì gọi nhiều lần.
const run = (sp, secs, rng, player = null) => { const ev = []; for (let i = 0; i < secs; i++) ev.push(...tickSpawner(sp, 1, rng, player)); return ev; };
const inside = (r, w) => r.x0 >= w.x0 && r.x1 <= w.x1 && r.z0 >= w.z0 && r.z1 <= w.z1;
const ZS = Object.values(FARM_ZONES);
const corners = (r) => [[r.x0, r.z0], [r.x0, r.z1], [r.x1, r.z0], [r.x1, r.z1]];
const inAvoid = (z, x, zz) => z.avoid.some((c) => Math.hypot(x - c.x, zz - c.z) <= c.r);

test('dữ liệu: tên/cấp/Hệ đúng GDD mục 8; mỗi vùng chỉ dùng quái có trong MONSTERS; cấp quái nằm trong khoảng vùng', () => {
  assert.deepEqual([MONSTERS.dameo.lv, MONSTERS.reutinh.lv, MONSTERS.daotac.lv, MONSTERS.cuopduong.lv], [3, 10, 15, 22]);
  assert.equal(MONSTERS.dameo.ten, 'Dã Mèo Rừng');
  for (const z of ZS) {
    assert.ok(z.eliteMax <= z.cap && z.cap <= 12);
    for (const id of [...z.normal, ...z.elite]) { const m = MONSTERS[id]; assert.ok(m, id); assert.ok(m.lv >= z.lvMin && m.lv <= z.lvMax, `${id} cấp ${m.lv}`); assert.equal(m.he, z.he); }
    for (const id of z.normal) assert.equal(MONSTERS[id].elite, false);
    for (const id of z.elite) assert.equal(MONSTERS[id].elite, true);
  }
});

test('vùng nằm TRỌN trong vùng đi bộ OUT_WALKS; hai vùng không chồng nhau; avoid che miếu, cổ thụ, hồ và thủy tạ', () => {
  for (const z of ZS) {
    for (const r of z.rects) assert.ok(OUT_WALKS.some((w) => inside(r, w)), `${z.id} ${JSON.stringify(r)} ra ngoài lối đi`);
    for (const [x, zz] of [...corners(MIEU), [CO_THU.x, CO_THU.z], [LAKE.x, LAKE.z], ...THUY_TA.posts]) assert.ok(!z.rects.some((r) => x >= r.x0 - 3 && x <= r.x1 + 3 && zz >= r.z0 - 3 && zz <= r.z1 + 3), `${z.id} sát miếu/cổ thụ/hồ`);
  }
  const all = ZS.flatMap((z) => z.rects.map((r) => ({ z: z.id, r })));
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i].r, b = all[j].r; assert.ok(a.x1 <= b.x0 || b.x1 <= a.x0 || a.z1 <= b.z0 || b.z1 <= a.z0, `chồng ${all[i].z}/${all[j].z}`); }
});

test('zoneAt: nhận đúng vùng, ngoài vùng và toạ độ lạ → null', () => {
  assert.equal(zoneAt(-100, 90), null, 'bãi rừng thông cũ (miếu, cổ thụ, hồ) không còn quái');
  assert.equal(zoneAt(-62, 64), 'biaRungThong');
  assert.equal(zoneAt(-40, 89), null, 'đường mòn thông thoáng, không còn quái');
  assert.equal(zoneAt(50, 104), null, 'đường mòn thác không còn quái'); assert.equal(zoneAt(52, 130), 'duongMon'); assert.equal(zoneAt(-60, 115), 'hoThac');
  assert.equal(zoneAt(0, 0), null);
  assert.equal(zoneAt(NaN, 5), null);
  assert.equal(zoneAt('x', undefined), null);
});

test('Oán Khí và chỉ số quái: Dã Mèo Rừng cấp 3 = 66; tinh anh ×3; loại lạ → 0/null', () => {
  assert.equal(oanKhiMaxOf('dameo'), 66);
  assert.equal(oanKhiMaxOf('reutinh'), 450);
  assert.equal(oanKhiMaxOf('xyz'), 0);
  const s = monsterStats('dameo');
  assert.deepEqual([s.lv, s.he, s.elite, s.cong, s.thu, s.oanKhiMax], [3, 'moc', false, 16, 9, 66]);
  assert.equal(monsterStats('xyz'), null);
});

test('đặt sẵn: mỗi vùng đủ cap (1 tinh anh + còn lại quái thường), đúng chỗ, cách nhau và cách người chơi', () => {
  for (const id of ZONE_IDS) for (const seed of [1, 2, 3, 99]) {
    const z = FARM_ZONES[id], player = { x: (z.rects[0].x0 + z.rects[0].x1) / 2, z: (z.rects[0].z0 + z.rects[0].z1) / 2 };
    const sp = createSpawner(id, rngSeed(seed), { player });
    assert.equal(sp.mons.filter((m) => !m.boss).length, z.cap, `${id}/${seed}`);
    assert.equal(sp.mons.filter((m) => m.elite).length, z.eliteMax);
    assert.equal(sp.timers.length, 0);
    for (const m of sp.mons) {
      assert.ok(z.rects.some((r) => m.x >= r.x0 && m.x <= r.x1 && m.z >= r.z0 && m.z <= r.z1));
      assert.ok(!inAvoid(z, m.x, m.z));
      assert.ok(Math.hypot(m.x - player.x, m.z - player.z) >= SPAWN_CFG.minFromPlayer);
      assert.equal(zoneAt(m.x, m.z), id);
      assert.equal(m.oan, m.max);
    }
    for (let i = 0; i < sp.mons.length; i++) for (let j = i + 1; j < sp.mons.length; j++) assert.ok(Math.hypot(sp.mons[i].x - sp.mons[j].x, sp.mons[i].z - sp.mons[j].z) >= SPAWN_CFG.minGap);
    assert.equal(new Set(sp.mons.map((m) => m.id)).size, sp.mons.length);
  }
});

test('cùng seed → cùng bố trí; vùng lạ / rng không phải hàm → null', () => {
  const a = createSpawner('duongMon', rngSeed(7)), b = createSpawner('duongMon', rngSeed(7));
  assert.deepEqual(a.mons, b.mons);
  assert.equal(createSpawner('xyz', rngSeed(1)), null);
  assert.equal(createSpawner('duongMon', 5), null);
});

test('hồi sinh quái thường 30–60 s, không vượt cap', () => {
  const rng = rngSeed(11), sp = createSpawner('biaRungThong', rng), z = FARM_ZONES.biaRungThong;
  const target = sp.mons.find((m) => !m.elite && !m.boss), r = hitMonster(sp, target.id, 1e6, 'ban', rng);
  assert.equal(r.dead, true);
  assert.equal(sp.mons.filter((m) => !m.boss).length, z.cap - 1);
  const t = sp.timers[0].t; assert.ok(t >= RESPAWN_CFG.normal[0] && t <= RESPAWN_CFG.normal[1], `t=${t}`);
  assert.equal(run(sp, RESPAWN_CFG.normal[0] - 1, rng).length, 0);   // chưa tới 30 s
  let got = []; for (let s = 0; s < 40 && !got.length; s++) got = tickSpawner(sp, 1, rng);
  assert.equal(got.length, 1); assert.equal(got[0].k, 'spawn'); assert.equal(got[0].mon.elite, false);
  assert.equal(sp.mons.filter((m) => !m.boss).length, z.cap); assert.equal(sp.timers.length, 0);
});

test('tinh anh hồi sinh sau 5 phút', () => {
  const rng = rngSeed(21), sp = createSpawner('duongMon', rng), el = sp.mons.find((m) => m.elite);
  hitMonster(sp, el.id, 1e6, 'ban', rng);
  assert.equal(sp.timers[0].t, 300);
  assert.equal(run(sp, 299, rng).length, 0);
  const ev = run(sp, 2, rng); assert.equal(ev.length, 1); assert.equal(ev[0].mon.elite, true); assert.equal(ev[0].mon.type, 'cuopduong');
});

test('đặt không được (điểm bị chiếm) thì thử lại sau retry giây, không mất lượt', () => {
  const sp = createSpawner('duongMon', rngSeed(5)), cap = FARM_ZONES.duongMon.cap, rng0 = () => 0;   // rng0: mọi lần chọn đều ra đúng điểm (37.5, 121.5)
  const normals = sp.mons.filter((m) => !m.elite && !m.boss);
  hitMonster(sp, normals[0].id, 1e6, 'ban', rng0); hitMonster(sp, normals[1].id, 1e6, 'ban', rng0);   // hẹn 30 s
  const blocker = { id: 999, type: 'daotac', ten: 'x', lv: 15, he: 'kim', elite: false, x: 37.5, z: 121.5, ry: 0, oan: 1, max: 1, dmgBy: {} };
  sp.mons.push(blocker);
  assert.equal(sp.mons.filter((m) => !m.boss).length, cap - 1);
  assert.equal(run(sp, 30, rng0).length, 0);                       // tới giờ nhưng chỗ bị chiếm
  assert.deepEqual(sp.timers.map((t) => t.t), [SPAWN_CFG.retry, SPAWN_CFG.retry]);
  sp.mons = sp.mons.filter((m) => m.id !== 999);
  const ev = run(sp, SPAWN_CFG.retry, rng0);
  assert.equal(ev.length, 1);                                       // con thứ hai lại bị con vừa đặt chiếm chỗ → còn chờ
  assert.equal(sp.timers.length, 1);
  assert.ok(sp.mons.filter((m) => !m.boss).length + sp.timers.length <= cap);
});

test('giữ cap sau rất nhiều lượt đánh / chờ ngẫu nhiên (boss nằm ngoài cap, tối đa 1 con)', () => {
  const rng = rngSeed(2026), sp = createSpawner('biaRungThong', rng), cap = FARM_ZONES.biaRungThong.cap, reg = () => sp.mons.filter((m) => !m.boss);
  for (let i = 0; i < 4000; i++) {
    if (i % 3 === 0 && reg().length) hitMonster(sp, reg()[Math.floor(rng() * reg().length)].id, 1 + Math.floor(rng() * 200), 'ban', rng);
    tickSpawner(sp, rng() * 2, rng);
    assert.ok(reg().length <= cap, `lượt ${i}: ${reg().length}`);
    assert.ok(sp.mons.filter((m) => m.elite).length <= FARM_ZONES.biaRungThong.eliteMax);
    assert.ok(reg().length + sp.timers.filter((t) => !t.boss).length <= cap);
    assert.ok(sp.mons.filter((m) => m.boss).length <= 1);
  }
});

test('boss vùng (Phiên 123): mỗi vùng 1 con, Oán Khí ×8, hồi sinh 45 phút, không tính vào cap, thu phục tính nguồn boss', () => {
  const rng = rngSeed(5);
  for (const [id, type, lv, he] of [['biaRungThong', 'laomoc', 20, 'moc'], ['duongMon', 'soncuoc', 25, 'kim'], ['hoThac', 'thuymau', 45, 'thuy']]) {
    const z = FARM_ZONES[id], sp = createSpawner(id, rng), b = sp.mons.filter((m) => m.boss);
    assert.equal(z.boss, type); assert.equal(b.length, 1); assert.deepEqual([b[0].type, b[0].lv, b[0].he, b[0].elite], [type, lv, he, false]);
    assert.equal(b[0].max, (30 + 12 * lv) * 8); assert.equal(oanKhiMaxOf(type), b[0].max); assert.equal(monsterStats(type).boss, true);
    const r = hitMonster(sp, b[0].id, 1e9, 'ban', rng); assert.equal(r.dead, true); assert.ok(r.drops.hatSen >= 12);
    const tm = sp.timers.find((t) => t.boss); assert.deepEqual([tm.t, sp.mons.some((m) => m.boss)], [2700, false]);
    assert.equal(run(sp, 2699, rng).length, 0); let got = []; for (let s = 0; s < 5 && !got.length; s++) got = tickSpawner(sp, 1, rng);
    assert.equal(got.length, 1); assert.equal(got[0].mon.boss, true); assert.equal(sp.mons.filter((m) => m.boss).length, 1);
  }
});

test('hitMonster: trừ Oán Khí, ghi công, tối thiểu 1, dmg lạ không làm gì, id lạ → không chết', () => {
  const rng = rngSeed(3), sp = createSpawner('biaRungThong', rng), m = sp.mons.find((x) => x.type === 'dameo');
  let r = hitMonster(sp, m.id, 16, 'a', rng);
  assert.deepEqual([r.dead, r.dealt, m.oan], [false, 16, 50]);
  assert.equal(hitMonster(sp, m.id, 0.4, 'a', rng).dealt, 1);
  for (const bad of [0, -5, NaN, 'x', undefined, null]) assert.equal(hitMonster(sp, m.id, bad, 'a', rng).dealt, 0);
  assert.equal(m.oan, 49);
  assert.deepEqual(hitMonster(sp, 12345, 10, 'a', rng), { dead: false, dealt: 0, mon: null, drops: null });
  assert.deepEqual(hitMonster(null, 1, 10), { dead: false, dealt: 0, mon: null, drops: null });
  hitMonster(sp, m.id, 20, 'b', rng);
  r = hitMonster(sp, m.id, 1000, 'b', rng);
  assert.equal(r.dead, true); assert.equal(r.dealt, 29);
  assert.equal(m.dmgBy.a, 17); assert.equal(m.dmgBy.b, 49);
  assert.equal(sp.mons.some((x) => x.id === m.id), false);
});

test('rollDrops: tinh anh luôn rơi 3–5 hạt sen; thường rơi 1 với xác suất 50%; loại lạ → 0', () => {
  assert.deepEqual(rollDrops('dameo', () => 0.49), { hatSen: 1 });
  assert.deepEqual(rollDrops('dameo', () => 0.5), { hatSen: 0 });
  assert.equal(rollDrops('reutinh', () => 0).hatSen, 3);
  assert.equal(rollDrops('reutinh', () => 0.999999).hatSen, 5);
  assert.deepEqual(rollDrops('xyz', () => 0), { hatSen: 0 });
  const rng = rngSeed(9); let sum = 0; for (let i = 0; i < 2000; i++) sum += rollDrops('dameo', rng).hatSen;
  assert.ok(sum > 800 && sum < 1200, `sum=${sum}`);
});

test('nearestMonster: chọn con gần nhất trong tầm', () => {
  const sp = { zone: 'duongMon', nextId: 1, timers: [], mons: [{ id: 1, x: 10, z: 0 }, { id: 2, x: 3, z: 0 }, { id: 3, x: -2, z: 1 }] };
  assert.equal(nearestMonster(sp, 0, 0).id, 3);
  assert.equal(nearestMonster(sp, 0, 0, 1), null);
  assert.equal(nearestMonster(null, 0, 0), null);
});

test('farm thử: người cấp 1 hạ Dã Mèo Rừng liên tục → có hạt sen và lên cấp (nối nguonTuVi)', () => {
  const rng = rngSeed(77), sp = createSpawner('biaRungThong', rng), T0 = Date.UTC(2026, 10, 11, 5, 0, 0);
  let exp = 0, hat = 0, kills = 0, st = null;
  for (let i = 0; i < 400 && kills < 60; i++) {
    const m = nearestMonster(sp, -100, 90); if (!m) { tickSpawner(sp, 10, rng); continue; }
    const r = hitMonster(sp, m.id, 40, 'ban', rng);
    if (r.dead) { kills++; hat += r.drops.hatSen; const a = award({ exp, nguon: 'hangYeu', monsterLevel: r.mon.lv, state: st, now: T0 }); exp = a.exp; st = a.state; assert.ok(a.gain > 0); }
    tickSpawner(sp, 3, rng);
  }
  assert.ok(kills >= 40, `kills=${kills}`);
  assert.ok(hat > 0);
  assert.ok(exp > expToNext(1), `exp=${exp}`);   // đủ để lên cấp 2 trở lên
});

test('zoneOpen (Phiên 116): vùng nightOnly chỉ mở khi đêm vượt ngưỡng; vùng lạ đóng', async () => {
  const { zoneOpen, ZONE_IDS } = await import('../js/world/spawn.js'); const { FARM_CFG } = await import('../js/data/monsters.js');
  for (const id of ZONE_IDS) {
    assert.equal(zoneOpen(id, 0), false, id); assert.equal(zoneOpen(id, FARM_CFG.nightAt), false, 'đúng ngưỡng chưa mở');
    assert.equal(zoneOpen(id, FARM_CFG.nightAt + 0.01), true); assert.equal(zoneOpen(id, true), true);
    for (const bad of [undefined, null, NaN, 'x']) assert.equal(zoneOpen(id, bad), false, String(bad));
  }
  assert.equal(zoneOpen('khongcoo', 1), false);
});
