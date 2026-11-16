// Test Kim 3D (Phiên 212): toán thuần js/world/kimFxMath.js + chuyện đã nối vào cảnh chiêu (đọc chữ trong js/scene/chieuFx.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KIM3_KIEU, kieuKim3, demKim3, liemBac, manhKim, sao, khienLuc, khienNho, kyBinh, buiVang, KIM3_T } from '../js/world/kimFxMath.js';

const IDS = Object.keys(KIM3_KIEU);
const fin = (o) => Object.values(o).every((v) => typeof v !== 'number' || Number.isFinite(v));
const TS = [-1, -0.35, -0.02, 0, 0.05, 0.12, 0.3, 0.6, 0.9, 1.4, 2.5];

test('kimfx: đợt 1 có 3 chiêu, 3 kiểu khác nhau; id lạ và chiêu chưa làm → null', () => {
  assert.equal(IDS.length, 3); assert.equal(new Set(Object.values(KIM3_KIEU)).size, 3);
  for (const id of IDS) assert.ok(kieuKim3(id), id);
  for (const x of ['kim_kimcang_4', 'kim_thietky_4', 'kim_tuyet', 'tho_1', 'xxx', '', null, undefined, 5, 'toString', '__proto__']) assert.equal(kieuKim3(x), null, String(x));
});
test('kimfx: demKim3 — máy yếu ít hơn máy mạnh, kiểu lạ = 0, bậc lạ dùng vừa', () => {
  for (const k of Object.values(KIM3_KIEU)) { const y = demKim3(k, 'yeu'), v = demKim3(k, 'vua'), c = demKim3(k, 'cao'); assert.ok(y.khoi <= v.khoi && v.khoi <= c.khoi, k); assert.equal(demKim3(k, 'la').khoi, v.khoi, k); assert.ok(v.khoi > 0, k); }
  assert.equal(demKim3('xxx').khoi, 0); assert.equal(demKim3('khien_luc').nho > 0, true); assert.equal(demKim3('ky_binh', 'yeu').ky, 3); assert.equal(demKim3('ky_binh', 'cao').ky, 7);
});
test('kimfx: mọi hàm chuyển động trả số hữu hạn ở mọi mốc thời gian', () => {
  for (const t of TS) {
    assert.ok(fin(liemBac(t, 2, 4)), 'liem'); assert.ok(fin(khienLuc(t, 1)), 'khien'); assert.ok(fin(liemBac(t, 99, 4)), 'liem pz lớn');
    for (let i = 0; i < 12; i++) { assert.ok(fin(manhKim(i, 12, t, 4)), 'manh'); assert.ok(fin(sao(i, t, 'liem_bac')), 'sao'); assert.ok(fin(sao(i, t, 'khien_luc')), 'sao2'); assert.ok(fin(khienNho(i, 6, t, 2)), 'nho'); assert.ok(fin(kyBinh(i, 7, t, 3, 4)), 'ky'); assert.ok(fin(buiVang(i, 7, t, 3, 4)), 'bui'); }
  }
});
test('kimfx: lưỡi chém bay tới đích, tắt khi hết giờ; mảnh văng chỉ sau lúc tới đích', () => {
  assert.equal(liemBac(-0.5, 0, 4).hien, false); assert.equal(liemBac(KIM3_T.liem + 0.1, 4, 4).hien, false);
  assert.equal(liemBac(0.1, 2, 4).hien, true); assert.equal(liemBac(0.1, 2, 4).z, 2); assert.equal(liemBac(0.1, 99, 4).z, 4);
  assert.equal(manhKim(0, 9, KIM3_T.hit - 0.01, 4).hien, false); assert.equal(manhKim(0, 9, KIM3_T.hit + 0.1, 4).hien, true); assert.equal(manhKim(0, 9, 2, 4).hien, false); assert.equal(manhKim(0, 0, KIM3_T.hit + 0.1, 4).hien, false);
});
test('kimfx: khiên hiện từ lúc gồng, xoay, gợn sáng khi hấp thụ, rồi tắt', () => {
  assert.equal(khienLuc(-0.6, 0).hien, false); assert.equal(khienLuc(-0.2, 0).hien, true); assert.equal(khienLuc(KIM3_T.khien + 0.1, 0).hien, false);
  assert.ok(khienLuc(0.4, 0).gon > 0); assert.equal(khienLuc(0.1, 0).gon, 0); assert.ok(khienLuc(0.5, 2).quay > khienLuc(0.5, 1).quay);
  assert.equal(khienNho(0, 6, -1, 0).hien, false); assert.equal(khienNho(0, 6, 0.5, 0).hien, true); assert.equal(khienNho(0, 0, 0.5, 0).hien, false);
});
test('kimfx: kỵ binh xếp chữ V — kỵ sĩ giữa dẫn đầu, hai bên lùi dần; bụi chỉ khi có kỵ sĩ', () => {
  const k = (i) => kyBinh(i, 5, 0.2, 3, 4); assert.ok(k(2).z > k(1).z && k(1).z > k(0).z, 'chữ V'); assert.equal(k(1).x, -k(3).x);
  assert.equal(kyBinh(0, 5, -0.5, 3, 4).hien, false); assert.equal(kyBinh(0, 5, KIM3_T.kyBinh + 0.2, 3, 4).hien, false); assert.equal(kyBinh(0, 0, 0.2, 3, 4).hien, false);
  assert.equal(buiVang(0, 5, 0.2, 3, 4).hien, true); assert.equal(buiVang(0, 5, 5, 3, 4).hien, false);
});
test('kimfx: đã nối vào cảnh chiêu (chieuFx.js), có nhánh dự phòng, bộ cũ taoKim vẫn còn', () => {
  const s = readFileSync(new URL('../js/scene/chieuFx.js', import.meta.url), 'utf8');
  assert.match(s, /import \{ taoKimThan \} from '\.\/fxKimThan\.js'/); assert.match(s, /kim3 = taoKimThan\(\{ \.\.\.o2, id \}\)/); assert.match(s, /kim3\.update\(/); assert.match(s, /lua = taoKim\(o2\)/); assert.match(s, /catch \(_\) \{ kim3 = null; \}/);
});
