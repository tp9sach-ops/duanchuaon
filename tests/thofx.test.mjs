// Test Thổ 3D (Phiên 211): toán thuần js/world/thoFxMath.js + nền nứt js/world/thoNut.js + chuyện đã nối vào cảnh chiêu (đọc chữ trong js/scene/chieuFx.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THO_KIEU, kieuTho, tamDich, demTho, gaiDa, manhDa, gongDa, nuiRoi, bui, nutHinh, nutDiem, nutTienDo, songDia, runeQuay, NUI } from '../js/world/thoFxMath.js';
import { nutNen, nenCo, nhanhNut, coNen, T_NEN } from '../js/world/thoNut.js';

const IDS = Object.keys(THO_KIEU), ctx = { reach: 4, R2: 2, W: 1 };
const fin = (o) => Object.values(o).every((v) => typeof v !== 'number' || Number.isFinite(v));

test('thofx: 6 chiêu Thổ, 6 kiểu khác nhau; id lạ → null', () => {
  assert.equal(IDS.length, 6); assert.equal(new Set(Object.values(THO_KIEU)).size, 6);
  for (const id of IDS) assert.ok(kieuTho(id), id);
  for (const x of ['kim_1', 'xxx', '', null, undefined, 5, 'toString', '__proto__']) assert.equal(kieuTho(x), null, String(x));
  assert.deepEqual(['ho_trong_luc', 'mach_dat', 'nui_roi'].map(tamDich), [true, true, true]); assert.equal(tamDich('gai_da'), false);
});
test('thofx: demTho — máy yếu ít hơn máy mạnh, kiểu lạ = 0, chỉ nui_roi có núi', () => {
  for (const k of Object.values(THO_KIEU)) { const y = demTho(k, 'yeu'), v = demTho(k, 'vua'), c = demTho(k, 'cao'); assert.ok(y.khoi <= v.khoi && v.khoi <= c.khoi, k); assert.equal(demTho(k, 'la').khoi, v.khoi, k); }
  assert.equal(demTho('xxx').khoi, 0); assert.equal(demTho('nui_roi').nui, 1); assert.equal(demTho('gai_da').nui, 0);
});
test('thofx: mọi hàm chuyển động trả số hữu hạn, không NaN, ở mọi mốc thời gian', () => {
  for (const k of Object.values(THO_KIEU)) for (let i = 0; i < 12; i++) for (const t of [-1, -0.3, 0, 0.05, 0.12, 0.4, 0.9, 1.4, 2.5]) {
    assert.ok(fin(gaiDa(k, i, 10, t, ctx)), `gai ${k}`); assert.ok(fin(manhDa(k, i, 12, t, ctx)), `manh ${k}`); assert.ok(fin(bui(k, i, 8, t, ctx)), `bui ${k}`);
  }
  for (const t of [-1, 0, 0.5, 3]) { assert.ok(fin(nuiRoi(t, 1.3)), 'nui'); assert.ok(fin(songDia('nui_roi', t)), 'song'); assert.ok(fin(gongDa(1, t, 0.7)), 'gong'); assert.ok(Number.isFinite(runeQuay(1, t))); }
});
test('thofx: núi rơi từ cao, chạm đất đúng NUI.land rồi chìm hẳn', () => {
  const a = nuiRoi(NUI.start, 1), b = nuiRoi(NUI.land, 1), c = nuiRoi(NUI.chim1 + 0.01, 1);
  assert.ok(a.hien && a.y > 10); assert.ok(b.hien && Math.abs(b.y) < 1e-6); assert.equal(c.hien, false); assert.equal(nuiRoi(-5, 1).hien, false);
  assert.ok(nuiRoi(NUI.land + 0.06, 1).sy < 1);   // bẹp lúc chạm
});
test('thofx: gai đá trồi rồi hạ; chưa tới giờ thì ẩn', () => {
  assert.equal(gaiDa('gai_da', 0, 9, -0.1, ctx).hien, false); assert.equal(gaiDa('khien_nham', 0, 9, 0.3, ctx).hien, false);
  const m = gaiDa('gai_da', 0, 9, 0.2, ctx); assert.ok(m.hien && m.cao > 0 && m.rong > 0); assert.equal(gaiDa('gai_da', 0, 9, 3, ctx).hien, false);
});
test('thofx: vệt nứt gấp khúc đủ điểm, tiến độ 0→1', () => {
  const h = nutHinh('nui_roi', 0, 7, ctx); assert.ok(h && h.dai > 0); const p = nutDiem(h.a, h.z0, h.dai, 9, 0); assert.equal(p.length, 9);
  assert.equal(nutHinh('khien_nham', 0, 3, ctx), null); assert.equal(nutTienDo(0.5, 0.4).k, 0); assert.ok(nutTienDo(0, 0.5).k > 0.9);
});

test('thonut: nền nứt chỉ có ở gai_da / mach_dat / nui_roi, hiện đúng lúc, nứt lan rồi nguội', () => {
  for (const k of ['gai_da', 'mach_dat', 'nui_roi']) assert.ok(coNen(k), k);
  for (const k of ['khien_nham', 'ho_trong_luc', 'giap_da', 'xxx', undefined, '__proto__']) { assert.equal(coNen(k), false, String(k)); assert.equal(nutNen(k, 0.5).hien, false, String(k)); }
  for (const k of Object.keys(T_NEN)) {
    assert.equal(nutNen(k, T_NEN[k] - 0.01).hien, false, k);
    const a = nutNen(k, T_NEN[k] + 0.05), b = nutNen(k, T_NEN[k] + 0.5), c = nutNen(k, T_NEN[k] + 3);
    assert.ok(a.hien && b.hien && a.k < b.k, k); assert.ok(b.op > 0.95, k); assert.equal(c.hien, false, k);
  }
});
test('thonut: cỡ nền nứt dương, nui_roi rộng hơn mach_dat; nhánh nứt cố định theo seed, nằm trong vòng tròn đơn vị', () => {
  for (const k of ['gai_da', 'mach_dat', 'nui_roi']) { const c = nenCo(k, ctx); assert.ok(c.r > 0 && Number.isFinite(c.z), k); }
  assert.ok(nenCo('nui_roi', ctx).r > nenCo('mach_dat', ctx).r); assert.equal(nenCo('xxx', ctx).r, 0);
  const a = nhanhNut(3, 11), b = nhanhNut(3, 11), c = nhanhNut(4, 11);
  assert.deepEqual(a, b); assert.notDeepEqual(a, c); assert.ok(a.length >= 11);
  for (const br of a) { assert.ok(br.w > 0 && br.pts.length >= 3); for (const [x, y] of br.pts) assert.ok(Number.isFinite(x) && Number.isFinite(y) && Math.hypot(x, y) <= 1.0, `${x},${y}`); }
  assert.ok(nhanhNut(0, 1).length >= 3);   // nTia quá nhỏ vẫn có ≥ 3 tia
});
test('thofx: đã NỐI vào cảnh chiêu (chieuFx.js import + gọi taoTho cho Hệ thổ) và fxTho.js dùng nền nứt', () => {
  const sc = readFileSync(new URL('../js/scene/chieuFx.js', import.meta.url), 'utf8'), th = readFileSync(new URL('../js/scene/fxTho.js', import.meta.url), 'utf8');
  assert.ok(/import \{ taoTho \} from '\.\/fxTho\.js'/.test(sc), 'thiếu import taoTho'); assert.ok(sc.includes("p.he === 'tho'") && sc.includes('taoTho('), 'chưa gọi taoTho');
  assert.ok(/from '\.\.\/world\/thoNut\.js'/.test(th) && th.includes('nutNen('), 'fxTho.js chưa dùng nền nứt');
});
