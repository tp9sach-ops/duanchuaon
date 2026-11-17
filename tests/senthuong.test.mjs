import test from 'node:test';
import assert from 'node:assert/strict';
import { SEN_THU_PHUC, SEN_PHONG_SINH, quaThuPhuc } from '../js/world/senThuong.js';
import { MONSTERS, FARM_CFG } from '../js/data/monsters.js';
import { emptyFarm, settleKill } from '../js/world/farm.js';
import { SPECIES, releaseSen, releaseFish, releaseCaught, emptyFish, keepFish } from '../js/world/fishing.js';
import { cardData, loadRec } from '../js/world/fishCard.js';
import { loadLeaf, claimAct, ACT_CAP } from '../js/world/merit.js';

const T0 = Date.UTC(2026, 10, 17, 5, 0, 0);

test('hằng số: thu phục 1 yêu quái = 1 hạt sen, phóng sinh = 2 hạt sen', () => {
  assert.equal(SEN_THU_PHUC, 1); assert.equal(SEN_PHONG_SINH, 2); assert.deepEqual(quaThuPhuc(), { hatSen: 1 });
});

test('thu phục MỌI loại quái bãi rừng (thường, tinh anh, boss vùng) đều được đúng 1 hạt sen, không ngẫu nhiên', () => {
  for (const id of Object.keys(MONSTERS)) {
    const r = settleKill(emptyFarm(T0), MONSTERS[id], quaThuPhuc(), T0);
    assert.equal(r.senGain, 1, `${id}: được ${r.senGain} hạt sen`); assert.equal(r.senCapped, false);
  }
});

test('mỗi lần thu phục cộng đúng 1 vào bộ đếm ngày; trần ngày FARM_CFG.senCapNgay vẫn áp dụng', () => {
  let f = emptyFarm(T0), sen = 0;
  for (let i = 0; i < FARM_CFG.senCapNgay + 5; i++) { const r = settleKill(f, MONSTERS[Object.keys(MONSTERS)[0]], quaThuPhuc(), T0); f = r.farm; sen += r.senGain; if (i < FARM_CFG.senCapNgay) assert.equal(r.senGain, 1, `lần ${i + 1}`); }
  assert.equal(sen, FARM_CFG.senCapNgay); assert.equal(f.kills, FARM_CFG.senCapNgay + 5);
});

test('phóng sinh: MỌI loài, MỌI cỡ (nhỏ/lớn, thường/hiếm) đều 2 hạt sen; loài lạ / rỗng = 0', () => {
  for (const sp of SPECIES) for (const lon of [false, true]) assert.equal(releaseSen({ sp: sp.id, lon }), 2, `${sp.id} lon=${lon}`);
  assert.equal(releaseSen({ sp: 'khong-co' }), 0); assert.equal(releaseSen(null), 0); assert.equal(releaseSen(undefined), 0);
});

test('phóng sinh con vừa câu và con trong ao đều trả 2 hạt sen; thẻ cá hiện 2 hạt sen', () => {
  const sp = SPECIES.find((s) => s.hiem).id;
  assert.equal(releaseCaught(emptyFish(), { sp, lon: true }).sen, 2);
  const k = keepFish(emptyFish(), { sp, lon: false }); assert.equal(releaseFish(k.state, k.uid).sen, 2);
  const c = cardData({ sp, lon: true }, 50, { best: 60, isNew: false }, false); assert.equal(c.sen, 2);
});

test('phóng sinh: trần 10 lần/ngày của merit.js giữ nguyên (lần thứ 11 trong ngày không được thưởng)', () => {
  let leaf = loadLeaf(null), ok = 0; for (let i = 0; i < ACT_CAP.phongsinh + 3; i++) { const r = claimAct(leaf, 'phongsinh', T0); leaf = r.leaf; if (r.ok) ok++; }
  assert.equal(ok, 10); assert.equal(ACT_CAP.phongsinh, 10);
});
