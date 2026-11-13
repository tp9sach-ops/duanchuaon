// Test lõi phó bản (mục 4a, Phiên 139). Chạy: node --test tests/dungeon.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { DUNGEON_CFG, DUNGEONS, DUNGEON_IDS } from '../js/data/dungeons.js';
import { MONSTERS } from '../js/data/monsters.js';
import { loadDungeon, clearsOf, clearFactor, waveFactor, waveCount, hasElite, mobStats, waveMobs, enter, onKill, leave, rewardFor, BOSS_WAVE } from '../js/world/dungeon.js';

test('cấu hình: 9 lượt, bốn phó bản, quái và boss đều có trong MONSTERS, bảng rơi cộng 1', () => {
  assert.equal(DUNGEON_CFG.waves, 9); assert.equal(BOSS_WAVE, 10); assert.equal(DUNGEON_CFG.tam, true);
  assert.equal(DUNGEON_IDS.length, 4);
  for (const d of Object.values(DUNGEONS)) {
    for (const m of d.mobs) assert.ok(MONSTERS[m] && !MONSTERS[m].boss, d.id + ' ' + m);
    assert.ok(MONSTERS[d.boss] && MONSTERS[d.boss].boss, d.id + ' boss');
    assert.ok(Math.abs(d.vatPham.reduce((a, [, p]) => a + p, 0) - 1) < 1e-9, d.id + ' bảng rơi');
  }
});

test('loadDungeon: đầu vào hỏng về trạng thái sạch; run lạ bị bỏ', () => {
  for (const bad of [null, undefined, 5, 'x', {}, { clears: 'a' }, { run: { id: 'khong' } }]) {
    const s = loadDungeon(bad); assert.equal(s.run, null); for (const id of DUNGEON_IDS) assert.equal(s.clears[id], 0);
  }
  const s = loadDungeon({ clears: { rungmoc: 3.7, hangkim: -2 }, run: { id: 'hothuy', wave: 99, alive: 2 } });
  assert.equal(s.clears.rungmoc, 3); assert.equal(s.clears.hangkim, 0);
  assert.deepEqual(s.run, { id: 'hothuy', wave: 10, alive: 2, kills: 0, boss: true });
});

test('hệ số lượt: lượt 1 = 1, tăng đều tới lượt 9; quái hồi sinh trâu hơn, mạnh hơn, TO hơn', () => {
  assert.deepEqual(waveFactor(1), { hp: 1, atk: 1, size: 1 });
  for (let w = 2; w <= 9; w++) { const a = waveFactor(w), b = waveFactor(w - 1); assert.ok(a.hp > b.hp && a.atk > b.atk && a.size > b.size, 'lượt ' + w); }
  assert.deepEqual(waveFactor(50), waveFactor(9));
});

test('hệ số chinh phục: không trần chơi, tăng theo mỗi lần; lần 0 = 1', () => {
  assert.deepEqual(clearFactor(0), { hp: 1, atk: 1, size: 1 });
  assert.ok(clearFactor(5).hp > clearFactor(4).hp && clearFactor(20).atk > clearFactor(5).atk);
  assert.deepEqual(clearFactor(-3), clearFactor(0));
});

test('số quái và tinh anh theo lượt', () => {
  assert.equal(waveCount(1), 3);
  for (let w = 2; w <= 9; w++) assert.ok(waveCount(w) >= waveCount(w - 1) && waveCount(w) <= DUNGEON_CFG.perWave.max);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(hasElite), [3, 6, 9]);
});

test('mobStats: quái lượt sau mạnh hơn; chinh phục rồi quay lại mạnh hơn; boss to và trâu hơn quái; loại lạ → null', () => {
  const a = mobStats('rungmoc', 'dameo', 1, 0), b = mobStats('rungmoc', 'dameo', 9, 0), c = mobStats('rungmoc', 'dameo', 1, 3);
  assert.ok(b.oanKhiMax > a.oanKhiMax && b.cong > a.cong && b.size > a.size);
  assert.ok(c.oanKhiMax > a.oanKhiMax && c.cong > a.cong && c.size > a.size);
  const boss = mobStats('rungmoc', 'laomoc', 9, 0);
  assert.equal(boss.boss, true); assert.ok(boss.oanKhiMax > MONSTERS.laomoc.lv && boss.size >= DUNGEON_CFG.boss.size);
  assert.ok(boss.oanKhiMax > b.oanKhiMax && boss.size > b.size);
  assert.equal(mobStats('rungmoc', 'soncuoc', 1, 0), null);   // boss của phó bản khác
  assert.equal(mobStats('khong', 'dameo', 1, 0), null);
  assert.equal(mobStats('rungmoc', 'xyz', 1, 0), null);
});

test('waveMobs: lượt 1 = 3 quái thường; lượt 3 thêm tinh anh; lượt 10 = đúng một boss; phó bản lạ → []', () => {
  assert.equal(waveMobs('rungmoc', 1, 0).length, 3);
  const w3 = waveMobs('rungmoc', 3, 0); assert.equal(w3.length, waveCount(3) + 1); assert.equal(w3[w3.length - 1].elite, true);
  const b = waveMobs('rungmoc', 10, 0); assert.equal(b.length, 1); assert.equal(b[0].boss, true);
  assert.deepEqual(waveMobs('khong', 1, 0), []);
});

test('chu trình: vào → 9 lượt → boss → chinh phục; clears +1, quà đủ, trạng thái thoát', () => {
  let r = enter(null, 'rungmoc'); assert.ok(r.ok); let st = r.state, mobs = r.mobs, waves = 1, cleared = false, reward = null, guard = 0;
  assert.equal(st.run.wave, 1);
  const rng = () => 0.5;
  while (!cleared && guard++ < 500) {
    const k = onKill(st, rng); st = k.state;
    if (k.nextWave.length) { waves++; assert.equal(st.run.wave, waves); assert.equal(st.run.alive, k.nextWave.length); }
    if (k.cleared) { cleared = true; reward = k.reward; }
  }
  assert.ok(cleared); assert.equal(waves, 10);   // 9 lượt + lượt boss
  assert.equal(st.run, null); assert.equal(clearsOf(st, 'rungmoc'), 1);
  assert.ok(reward.hatSen > 0 && reward.manh === 'laomoc' && reward.items.length === DUNGEON_CFG.reward.itemRolls);
});

test('lần chinh phục sau: quái mạnh hơn và quà hạt sen nhiều hơn', () => {
  const r1 = rewardFor('rungmoc', 0, () => 0.5), r2 = rewardFor('rungmoc', 4, () => 0.5);
  assert.ok(r2.hatSen > r1.hatSen);
  const s = { clears: { rungmoc: 4 } }, e = enter(s, 'rungmoc');
  assert.ok(e.mobs[0].oanKhiMax > waveMobs('rungmoc', 1, 0)[0].oanKhiMax);
});

test('enter/onKill/leave: không vào hai phó bản cùng lúc; onKill ngoài phó bản không đổi; leave không tính chinh phục', () => {
  const e = enter(null, 'hangkim'); assert.ok(e.ok);
  assert.equal(enter(e.state, 'hothuy').ok, false);
  assert.equal(enter(null, 'khong').ok, false);
  const idle = onKill(null); assert.equal(idle.cleared, false); assert.equal(idle.state.run, null);
  const out = leave(e.state); assert.equal(out.run, null); assert.equal(clearsOf(out, 'hangkim'), 0);
});

test('hàm thuần: không sửa trạng thái đầu vào', () => {
  const e = enter(null, 'rungmoc'), snap = JSON.stringify(e.state); onKill(e.state); leave(e.state);
  assert.equal(JSON.stringify(e.state), snap);
});

// ---- Mục 4c (Phiên 139): người dẫn + bảng chọn
import { readFileSync } from 'node:fs';
import { describe as describeDungeon } from '../js/world/dungeon.js';
import { DUNGEON_NPCS, NPCS, npcById, npcSpot } from '../js/world/npc.js';

test('describe: thông tin bảng chọn; chinh phục rồi thì quái mạnh hơn, quà nhiều hơn; id lạ → null', () => {
  const a = describeDungeon(null, 'rungmoc'), b = describeDungeon({ clears: { rungmoc: 3 } }, 'rungmoc');
  assert.equal(a.ten, DUNGEONS.rungmoc.ten); assert.equal(a.waves, 9); assert.equal(a.clears, 0); assert.equal(a.hpMul, 1);
  assert.equal(a.lvMin, MONSTERS.dameo.lv); assert.equal(a.lvMax, MONSTERS.laomoc.lv); assert.equal(a.bossTen, MONSTERS.laomoc.ten);
  assert.equal(b.clears, 3); assert.ok(b.hpMul > a.hpMul && b.atkMul > a.atkMul && b.sizeMul > a.sizeMul && b.senBoss > a.senBoss);
  assert.equal(describeDungeon(null, 'khong'), null);
  for (const id of DUNGEON_IDS) { const d = describeDungeon(null, id); assert.ok(d.lvMin <= d.lvMax && d.senBoss > 0, id); }
});

test('người dẫn: mỗi phó bản đúng một NPC, id khớp npcId của số liệu, nằm trong NPCS và bấm được (spot)', () => {
  assert.equal(DUNGEON_NPCS.length, DUNGEON_IDS.length);
  for (const id of DUNGEON_IDS) {
    const n = DUNGEON_NPCS.find((x) => x.dungeon === id); assert.ok(n, id); assert.equal(n.id, DUNGEONS[id].npcId); assert.ok(NPCS.includes(n)); assert.equal(npcById(n.id), n);
    assert.equal(npcSpot(n).npc, n.id);
  }
});

test('nối dây: NPC mở bảng, bảng gọi enter của zone và lưu lgt.dungeon; main.js khởi tạo bảng', () => {
  const rd = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
  assert.match(rd('../js/ui/npc.js'), /dungeonPanel\.open\(r\.npc\.dungeon\)/);
  const ui = rd('../js/ui/dungeonPanel.js'); assert.match(ui, /dungeonZones\.enter/); assert.match(ui, /lgt\.dungeon/); assert.match(ui, /LGT\.dungeonState/);
  assert.match(rd('../js/main.js'), /dungeonPanel\.js/);
});
