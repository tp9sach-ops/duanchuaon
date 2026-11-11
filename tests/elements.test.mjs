// Test Ngũ Hành (G2.1). Chạy: node --test tests/elements.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { HE_LIST, HE_KHAC, HE_SINH, ELEMENT_CFG } from '../js/data/elements.js';
import { normHe, heName, heKhac, heBiKhac, heSinh, heSinhRa, relation, kHeOf, sinhBonus, isHoiTu, hoiTuBonus } from '../js/world/elements.js';
import { damageOf } from '../js/world/combat.js';

test('elements: cấu hình TẠM đúng GDD (5%/người, tối đa 10%, 10 m, Hội Tụ 10%)', () => {
  assert.equal(ELEMENT_CFG.tam, true);
  assert.equal(ELEMENT_CFG.sinhPerAlly, 0.05); assert.equal(ELEMENT_CFG.sinhMax, 0.10);
  assert.equal(ELEMENT_CFG.sinhRange, 10); assert.equal(ELEMENT_CFG.hoiTu, 0.10);
  assert.ok(Object.isFrozen(ELEMENT_CFG) && Object.isFrozen(HE_LIST) && Object.isFrozen(HE_KHAC) && Object.isFrozen(HE_SINH));
  assert.deepEqual([...HE_LIST], ['kim', 'moc', 'thuy', 'hoa', 'tho']);
});

test('elements: vòng khắc Kim→Mộc→Thổ→Thủy→Hỏa→Kim và vòng sinh Kim→Thủy→Mộc→Hỏa→Thổ→Kim', () => {
  let h = 'kim'; const khac = [];
  for (let i = 0; i < 5; i++) { khac.push(h); h = heKhac(h); }
  assert.deepEqual(khac, ['kim', 'moc', 'tho', 'thuy', 'hoa']); assert.equal(h, 'kim');
  h = 'kim'; const sinh = [];
  for (let i = 0; i < 5; i++) { sinh.push(h); h = heSinh(h); }
  assert.deepEqual(sinh, ['kim', 'thuy', 'moc', 'hoa', 'tho']); assert.equal(h, 'kim');
});

test('elements: chiều ngược (bị khắc bởi, được sinh bởi) khớp bảng GDD 5.3', () => {
  // GDD: Kim bị Hỏa khắc, Mộc bị Kim, Thủy bị Thổ, Hỏa bị Thủy, Thổ bị Mộc.
  assert.deepEqual(HE_LIST.map(heBiKhac), ['hoa', 'kim', 'tho', 'thuy', 'moc']);
  // Hệ sinh ra mình (GDD 10.3): Kim←Thổ, Mộc←Thủy, Hỏa←Mộc, Thổ←Hỏa, Thủy←Kim.
  assert.equal(heSinhRa('kim'), 'tho'); assert.equal(heSinhRa('moc'), 'thuy'); assert.equal(heSinhRa('hoa'), 'moc');
  assert.equal(heSinhRa('tho'), 'hoa'); assert.equal(heSinhRa('thuy'), 'kim');
});

test('elements: bảng quan hệ đủ 5×5 (đúng 5 loi, 5 bat, 15 thuong)', () => {
  const want = {
    kim:  { kim: 'thuong', moc: 'loi', thuy: 'thuong', hoa: 'bat', tho: 'thuong' },
    moc:  { kim: 'bat', moc: 'thuong', thuy: 'thuong', hoa: 'thuong', tho: 'loi' },
    thuy: { kim: 'thuong', moc: 'thuong', thuy: 'thuong', hoa: 'loi', tho: 'bat' },
    hoa:  { kim: 'loi', moc: 'thuong', thuy: 'bat', hoa: 'thuong', tho: 'thuong' },
    tho:  { kim: 'thuong', moc: 'bat', thuy: 'loi', hoa: 'thuong', tho: 'thuong' },
  };
  const count = { loi: 0, bat: 0, thuong: 0 };
  for (const a of HE_LIST) for (const d of HE_LIST) { assert.equal(relation(a, d), want[a][d], `${a}→${d}`); count[relation(a, d)]++; }
  assert.deepEqual(count, { loi: 5, bat: 5, thuong: 15 });
  // đối xứng: a khắc d ⇔ d bị a khắc
  for (const a of HE_LIST) for (const d of HE_LIST) assert.equal(relation(a, d) === 'loi', relation(d, a) === 'bat');
});

test('elements: K_hệ 1,3 / 0,8 / 1 và nối vào damageOf', () => {
  assert.equal(kHeOf('kim', 'moc'), 1.3); assert.equal(kHeOf('moc', 'kim'), 0.8); assert.equal(kHeOf('kim', 'kim'), 1); assert.equal(kHeOf('kim', 'thuy'), 1);
  assert.equal(damageOf({ cong: 100, rel: relation('hoa', 'kim') }), 130);
  assert.equal(damageOf({ cong: 100, rel: relation('kim', 'hoa') }), 80);
  assert.equal(damageOf({ cong: 100, rel: relation('tho', 'tho') }), 100);
});

test('elements: dữ liệu lạ / chưa chọn Hệ → thường, không ném lỗi', () => {
  for (const v of [undefined, null, '', 'x', 5, {}, [], NaN]) {
    assert.equal(normHe(v), null, String(v)); assert.equal(heName(v), ''); assert.equal(heKhac(v), null); assert.equal(heBiKhac(v), null);
    assert.equal(heSinh(v), null); assert.equal(heSinhRa(v), null);
    assert.equal(relation(v, 'kim'), 'thuong'); assert.equal(relation('kim', v), 'thuong'); assert.equal(kHeOf(v, v), 1);
  }
  assert.equal(normHe(' KIM '), 'kim'); assert.equal(heName('thuy'), 'Thủy'); assert.equal(relation('Kim', 'MOC'), 'loi');
});

test('elements: tương sinh +5%/người, tối đa +10%, trong 10 m', () => {
  // Mộc được Thủy sinh.
  const me = 'moc';
  assert.equal(sinhBonus({ he: me, allies: [] }), 0);
  assert.equal(sinhBonus({ he: me, allies: [{ he: 'thuy', dist: 3 }] }), 0.05);
  assert.equal(sinhBonus({ he: me, allies: [{ he: 'thuy', dist: 3 }, { he: 'thuy', dist: 9 }] }), 0.10);
  assert.equal(sinhBonus({ he: me, allies: [{ he: 'thuy', dist: 1 }, { he: 'thuy', dist: 2 }, { he: 'thuy', dist: 3 }, { he: 'thuy', dist: 4 }] }), 0.10); // trần
  assert.equal(sinhBonus({ he: me, allies: [{ he: 'thuy', dist: 10 }] }), 0.05);      // đúng 10 m vẫn tính
  assert.equal(sinhBonus({ he: me, allies: [{ he: 'thuy', dist: 10.01 }] }), 0);      // xa hơn 10 m
  assert.equal(sinhBonus({ he: me, allies: [{ he: 'kim', dist: 2 }, { he: 'moc', dist: 2 }, { he: 'hoa', dist: 2 }, { he: 'tho', dist: 2 }] }), 0); // sai Hệ
  // Cả 5 Hệ: mỗi Hệ chỉ nhận từ Hệ sinh ra nó.
  for (const h of HE_LIST) assert.equal(sinhBonus({ he: h, allies: [{ he: heSinhRa(h), dist: 1 }] }), 0.05, h);
});

test('elements: tương sinh chịu được đầu vào lạ', () => {
  assert.equal(sinhBonus(), 0); assert.equal(sinhBonus(null), 0); assert.equal(sinhBonus({ he: 'x', allies: [{ he: 'thuy', dist: 1 }] }), 0);
  assert.equal(sinhBonus({ he: 'moc', allies: 'abc' }), 0);
  assert.equal(sinhBonus({ he: 'moc', allies: [null, 5, {}, { he: 'thuy' }, { he: 'thuy', dist: -1 }, { he: 'thuy', dist: 'xa' }, { he: 'thuy', dist: NaN }] }), 0);
});

test('elements: Ngũ Hành Hội Tụ khi đủ 5 Hệ (+10%)', () => {
  assert.equal(isHoiTu(['kim', 'moc', 'thuy', 'hoa', 'tho']), true);
  assert.equal(isHoiTu(['tho', 'tho', 'KIM', 'moc', 'thuy', 'hoa']), true);        // dư người, thứ tự khác, hoa thường
  assert.equal(isHoiTu(['kim', 'moc', 'thuy', 'hoa']), false);                       // thiếu Thổ
  assert.equal(isHoiTu(['kim', 'kim', 'kim', 'kim', 'kim']), false);                 // đủ người, thiếu Hệ
  for (const v of [undefined, null, 'kim', 5, {}, []]) assert.equal(isHoiTu(v), false, String(v));
  assert.equal(hoiTuBonus(['kim', 'moc', 'thuy', 'hoa', 'tho']), 0.10); assert.equal(hoiTuBonus(['kim']), 0); assert.equal(hoiTuBonus(), 0);
});
