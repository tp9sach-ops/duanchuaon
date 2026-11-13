import test from 'node:test';
import assert from 'node:assert/strict';
import { FARM_CFG, MONSTERS } from '../js/data/monsters.js';
import { emptyFarm, loadFarm, senLeft, tuViOf, settleKill, settleBoss, expLeft, killXp } from '../js/world/farm.js';
import { createSpawner, tickSpawner, hitMonster } from '../js/world/spawn.js';
import { rngSeed } from '../js/world/yeuquai.js';
import { NGUON_CFG } from '../js/data/nguon.js';
import { dayKeyVN } from '../js/world/nguonTuVi.js';
import { expToNext, totalExpFor } from '../js/world/stats.js';

const T0 = Date.UTC(2026, 10, 11, 5, 0, 0);          // 12:00 giờ VN, 11/11/2026
const DAY = 24 * 3600 * 1000;

test('trạng thái rỗng: Tu Vi 1, 0 EXP, đủ trần hạt sen; dữ liệu hỏng quay về rỗng', () => {
  const f = emptyFarm(T0); assert.equal(f.exp, 0); assert.equal(tuViOf(f).tuvi, 1); assert.equal(senLeft(f, T0), FARM_CFG.senCapNgay);
  for (const bad of [null, undefined, 5, 'x{', '[]', [], { exp: 'abc' }]) assert.deepEqual(loadFarm(bad, T0).exp, 0);
  assert.equal(loadFarm({ exp: -7, kills: -2, sen: { n: 9999, day: '1999-01-01' } }, T0).exp, 0);
});

test('thu phục Dã Mèo: được EXP đúng công thức hàng yêu, hạt sen theo quà rơi', () => {
  const r = settleKill(emptyFarm(T0), { lv: 3 }, { hatSen: 1 }, T0);
  assert.equal(r.expGain, Math.max(1, Math.round(expToNext(1) * NGUON_CFG.nguon.hangYeu.moiLan))); assert.equal(r.farm.exp, r.expGain); assert.equal(r.senGain, 1); assert.equal(r.senCapped, false);
  assert.equal(r.farm.kills, 1); assert.equal(r.farm.sen.n, 1); assert.equal(senLeft(r.farm, T0), FARM_CFG.senCapNgay - 1);
});

test('không sửa trạng thái đầu vào (trả bản mới)', () => {
  const f = emptyFarm(T0), snap = JSON.stringify(f); settleKill(f, { lv: 3 }, { hatSen: 1 }, T0); assert.equal(JSON.stringify(f), snap);
});

test('trần hạt sen mỗi ngày: vượt trần không thêm hạt sen; trần Tu Vi hàng yêu 30 lần/ngày; sang ngày mới (giờ VN) đếm lại', () => {
  const CAP = NGUON_CFG.tranNgay.hangYeu; let f = emptyFarm(T0), sen = 0, capped = 0, exps = 0;
  for (let i = 0; i < 500; i++) { const r = settleKill(f, { lv: 3 }, { hatSen: 1 }, T0); f = r.farm; sen += r.senGain; if (r.senCapped) capped++; if (r.expGain > 0) exps++; if (i >= CAP) { assert.equal(r.expGain, 0, 'hết trần Tu Vi'); assert.equal(r.expCapped, true); } }
  assert.equal(exps, CAP); assert.equal(expLeft(f, 'hangYeu', T0), 0);
  assert.equal(sen, FARM_CFG.senCapNgay); assert.equal(capped, 500 - FARM_CFG.senCapNgay); assert.equal(senLeft(f, T0), 0); assert.equal(f.kills, 500);
  const r2 = settleKill(f, { lv: 3 }, { hatSen: 2 }, T0 + DAY); assert.equal(r2.senGain, 2); assert.equal(senLeft(r2.farm, T0 + DAY), FARM_CFG.senCapNgay - 2);
  assert.equal(r2.farm.exp > f.exp, true, 'sang ngày mới lại có Tu Vi, EXP không bị reset'); assert.equal(expLeft(r2.farm, 'hangYeu', T0 + DAY), CAP - 1);
});

test('thu phục yêu quái hằng tháng cộng Tu Vi nguồn boss: 15% cấp kế, tối đa 3 lần/ngày, ngày mới đếm lại; không sửa đầu vào', () => {
  const f0 = emptyFarm(T0), snap = JSON.stringify(f0), need = expToNext(1);
  const r = settleBoss(f0, T0); assert.equal(JSON.stringify(f0), snap); assert.equal(r.expGain, Math.round(need * 0.15)); assert.equal(r.farm.cnt.boss, 1); assert.equal(r.expCapped, false);
  let f = r.farm; for (let i = 0; i < 5; i++) f = settleBoss(f, T0).farm;
  const over = settleBoss(f, T0); assert.equal(over.expGain, 0); assert.equal(over.expCapped, true); assert.equal(over.farm.cnt.boss, NGUON_CFG.tranNgay.boss); assert.equal(expLeft(f, 'boss', T0), 0);
  const next = settleBoss(f, T0 + DAY); assert.ok(next.expGain > 0 && next.farm.cnt.boss === 1, 'ngày mới');
  assert.equal(loadFarm({ exp: 5, cnt: { day: '1999-01-01', hangYeu: 9, boss: 9 } }, T0).cnt.hangYeu, 0, 'đếm cũ sang ngày mới bị bỏ');
  assert.equal(loadFarm({ exp: 5, cnt: { day: dayKeyVN(T0), hangYeu: 9999, boss: -4 } }, T0).cnt.hangYeu, NGUON_CFG.tranNgay.hangYeu, 'dữ liệu hỏng bị kẹp');
  assert.equal(loadFarm('{hỏng', T0).cnt.boss, 0);
});

test('quà bị cắt một phần ở sát trần (còn 1, rơi 3 → nhận 1)', () => {
  const f = { ...emptyFarm(T0), sen: { day: '2026-11-11', n: FARM_CFG.senCapNgay - 1 } };
  const r = settleKill(f, { lv: 22 }, { hatSen: 3 }, T0); assert.equal(r.senGain, 1); assert.equal(r.senCapped, true);
});

test('lên cấp: đủ EXP thì leveledUp và Tu Vi tăng; chênh cấp lớn bị giảm EXP (chống cày quái yếu)', () => {
  const f = { ...emptyFarm(T0), exp: expToNext(1) - 1 };
  const r = settleKill(f, { lv: 3 }, { hatSen: 0 }, T0); assert.equal(r.leveledUp, true); assert.equal(r.tuviBefore, 1); assert.equal(r.tuvi, 2);
  const hi = { ...emptyFarm(T0), exp: totalExpFor(12) };   // Tu Vi 12: quái cấp 3 chênh 9 cấp (giảm), quái cấp 22 thì không
  const a = settleKill(hi, { lv: 3 }, { hatSen: 0 }, T0), b = settleKill(hi, { lv: 22 }, { hatSen: 0 }, T0);
  assert.ok(a.expGain < b.expGain, 'quái yếu cho ít EXP hơn quái ngang cấp');
});

test('lưu và đọc lại (JSON) giữ nguyên EXP, bộ đếm và hạt sen trong ngày', () => {
  const r = settleKill(emptyFarm(T0), { lv: 3 }, { hatSen: 1 }, T0), back = loadFarm(JSON.stringify(r.farm), T0);
  assert.deepEqual(back, r.farm);
});

test('farm thử nối spawn: đánh hết Dã Mèo của Bìa Rừng Thông nhiều vòng (có hồi sinh) → Tu Vi và hạt sen tăng, không vượt trần', () => {
  const rng = rngSeed(2026), sp = createSpawner('biaRungThong', rng); let f = emptyFarm(T0), sen = 0, kills = 0;
  for (let round = 0; round < 6; round++) {
    for (const m of sp.mons.filter((x) => !x.elite && !x.boss)) { const r = hitMonster(sp, m.id, 9999, 'ban', rng); if (r.dead) { const s = settleKill(f, MONSTERS[r.mon.type], r.drops, T0); f = s.farm; sen += s.senGain; kills++; } }
    for (let i = 0; i < 70; i++) tickSpawner(sp, 1, rng);   // 70 giây: quái thường (RESPAWN_CFG 10–20 s) hồi sinh đủ
  }
  assert.ok(kills >= 11 * 5, `chỉ ${kills} lần thu phục`); assert.ok(f.exp > 0); assert.ok(sen > 0 && sen <= FARM_CFG.senCapNgay); assert.equal(f.kills, kills); assert.ok(tuViOf(f).tuvi >= 1);
});

test('Phiên 123: thu phục BOSS vùng tính nguồn boss (15% cấp kế, trần 3/ngày), không ăn vào trần hàng yêu; hạt sen vẫn theo trần ngày', () => {
  const boss = { lv: 20, boss: true }; let f = emptyFarm(T0), got = 0;
  for (let i = 0; i < 6; i++) { const r = settleKill(f, boss, { hatSen: 20 }, T0); f = r.farm; if (r.expGain > 0) { got++; assert.equal(r.expGain, Math.round(expToNext(1) * 0.15)); } else assert.equal(r.expCapped, true); }
  assert.equal(got, NGUON_CFG.tranNgay.boss); assert.equal(expLeft(f, 'boss', T0), 0); assert.equal(expLeft(f, 'hangYeu', T0), NGUON_CFG.tranNgay.hangYeu, 'quái thường không bị ảnh hưởng');
  assert.equal(f.sen.n, FARM_CFG.senCapNgay, 'hạt sen vẫn có trần ngày');
});

test('killXp: kinh nghiệm cấp độ theo cấp quái, tinh anh ×2, boss ×5, luôn ≥ 1 và hữu hạn', () => {
  assert.equal(killXp({ lv: 3 }), 2);
  assert.equal(killXp({ lv: 10, elite: true }), killXp({ lv: 10 }) * 2);
  assert.equal(killXp({ lv: 20, boss: true }), killXp({ lv: 20 }) * 5);
  assert.ok(killXp({ lv: 140 }) <= 12);
  for (const bad of [null, undefined, {}, { lv: NaN }, { lv: -5 }, { lv: 'x' }]) assert.ok(killXp(bad) >= 1);
});
