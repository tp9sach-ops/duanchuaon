// Test LỬA THẬT (Phiên 177, mục 1 kế hoạch hiệu ứng 3D): số lưỡi/khói/tàn theo bậc máy, chuyển động lưỡi lửa (sinh → bốc lên → nguội màu → tắt), vị trí theo kiểu bay, không ra NaN.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LUA_BAC, SO_KIEU, bam, lapLua, ngonLua, khoiLua, tanLua, viTriLua, dungLua } from '../js/world/lua.js';
import { CHIEU_FX } from '../js/data/chieuFx.js';

const fin = (o) => Object.values(o).every((v) => (Array.isArray(v) ? v.every(Number.isFinite) : typeof v === 'boolean' || Number.isFinite(v)));
const TIERS = ['yeu', 'vua', 'cao'], MODES = ['tia', 'no', 'xoay', 'mua'];

test('số lưỡi/khói/tàn: yếu < vừa < cao; yếu không khói, không tàn', () => {
  const n = TIERS.map((t) => lapLua(t, 'no'));
  assert.ok(n[0].nLuoi < n[1].nLuoi && n[1].nLuoi < n[2].nLuoi);
  assert.equal(n[0].nKhoi, 0); assert.equal(n[0].nTan, 0); assert.ok(n[1].nKhoi > 0 && n[1].nTan > 0);
  for (const t of TIERS) { const p = lapLua(t, 'no'); assert.equal(p.luoi.length, LUA_BAC[t].luoi); assert.equal(p.khoi.length, LUA_BAC[t].khoi); assert.equal(p.tan.length, LUA_BAC[t].tan); }
  assert.ok(LUA_BAC.cao.luoi <= 30 && LUA_BAC.cao.tan <= 60, 'trần nhẹ cho điện thoại');
  assert.equal(lapLua('la', 'no').tier, 'vua');
});
test('ổn định: cùng đầu vào ra cùng kết quả; hạt giống nằm trong khoảng; có nhiều kiểu lưỡi', () => {
  assert.deepEqual(lapLua('cao', 'tia', { co: 0.35 }), lapLua('cao', 'tia', { co: 0.35 }));
  for (let i = 0; i < 200; i++) { const b = bam(i, 3); assert.ok(b >= 0 && b < 1); }
  const p = lapLua('cao', 'no'); assert.equal(new Set(p.luoi.map((s) => s.kieu)).size, SO_KIEU);
  assert.ok(p.luoi.some((s) => s.dau) && p.luoi.some((s) => !s.dau) && p.luoi.filter((s) => s.gong).length === 3);
  assert.ok(lapLua('vua', 'no', { co: 0.5 }).kichCo > lapLua('vua', 'no', { co: 0.25 }).kichCo, 'tuyệt học lửa to hơn chiêu thường');
});
test('lưỡi lửa: sinh mờ ở gốc, rõ giữa vòng, tắt cuối vòng; bốc lên; thon dần', () => {
  const s = { phi: 0, toc: 1 / 1.15, co: 1 };   // p = t
  const a = ngonLua(s, 0), b = ngonLua(s, 0.3), c = ngonLua(s, 0.95);
  assert.ok(a.op < 0.05 && b.op > 0.6 && c.op < 0.2, `${a.op} ${b.op} ${c.op}`);
  assert.ok(a.cao < b.cao && b.cao < c.cao, 'bốc lên theo tuổi');
  assert.ok(b.sx < a.sx + 0.2 && c.sx < b.sx * 1.2, 'thon dần');
});
test('màu nguội dần: trắng nóng (1,1,1) → cam → đỏ sẫm; kênh đỏ luôn đầy, xanh giảm nhanh hơn', () => {
  const s = { phi: 0, toc: 1 / 1.15, co: 1 }, lo = ngonLua(s, 0.001).tint, hi = ngonLua(s, 0.95).tint;
  assert.deepEqual(lo.map((v) => Math.round(v)), [1, 1, 1]);
  assert.equal(hi[0], 1); assert.ok(hi[1] < lo[1] && hi[2] < hi[1], `${hi}`);
  for (let t = 0; t < 4; t += 0.05) { const m = ngonLua(s, t).tint; assert.ok(m.every((v) => v >= 0 && v <= 1)); }
});
test('mọi giá trị hữu hạn, độ mờ 0..1, qua nhiều khung hình và nhiều lưỡi', () => {
  for (const t of TIERS) {
    const p = lapLua(t, 'no');
    for (let f = 0; f < 600; f++) {
      const ti = f / 60;
      for (const s of p.luoi) { const r = ngonLua(s, ti); assert.ok(fin(r) && r.op >= 0 && r.op <= 1 && r.sx > 0 && r.sy > 0 && r.p >= 0 && r.p < 1); }
      for (const s of p.khoi) { const r = khoiLua(s, ti); assert.ok(fin(r) && r.op >= 0 && r.op <= 0.31 && r.kichCo > 0); }
      for (const s of p.tan) { const r = tanLua(s, ti); assert.ok(fin(r) && r.op >= 0 && r.op <= 1 && r.y >= 0.25); }
    }
  }
});
test('khói nằm trên ngọn lửa và to dần; rất mờ (không che chiêu)', () => {
  const s = { phi: 0, toc: 1 / 0.38, co: 1, a: 0 }, a = khoiLua(s, 0.3 * 0.38), b = khoiLua(s, 0.8 * 0.38);
  assert.ok(b.kichCo > a.kichCo && b.cao > a.cao && a.cao > 1);
});
test('viTriLua: đủ 4 kiểu bay, mọi lưỡi cho vị trí hữu hạn ở mọi thời điểm', () => {
  const ctx = (after, pz) => ({ reach: 5, R2: 2.4, zD: 1, pz, after, u: Math.max(0, Math.min(1, after / 0.9)) });
  for (const mode of MODES) for (const tier of TIERS) {
    const p = lapLua(tier, mode);
    for (let a = -0.3; a <= 1.2; a += 0.05) for (const s of p.luoi) { const v = viTriLua(mode, s, ctx(a, Math.min(5, Math.max(0, a) * 14))); assert.ok(fin(v), `${mode} ${a}`); assert.ok(v.mul >= 0); }
  }
});
test('tia: quả cầu lửa ở đầu chiêu, đuôi lửa rải phía sau và nhỏ hơn đầu', () => {
  const p = lapLua('cao', 'tia'), pz = 4;
  for (const s of p.luoi) { const v = viTriLua('tia', s, { reach: 5, pz }); if (s.dau) { assert.equal(v.z, pz); assert.equal(v.mul, 1); } else { assert.ok(v.z >= 0 && v.z <= pz && v.mul < 1); } }
  assert.equal(viTriLua('tia', p.luoi[0], { reach: 3, pz: 9 }).z, 3, 'không vượt tầm');
});
test('xoay: xoáy quanh người, bán kính không vượt vùng; thời gian trôi thì góc đổi', () => {
  const s = lapLua('vua', 'xoay').luoi[2], a = viTriLua('xoay', s, { R2: 2, after: 0 }), b = viTriLua('xoay', s, { R2: 2, after: 0.5 });
  const r = (v) => Math.hypot(v.x, v.z); assert.ok(r(a) <= 2.01 && Math.abs(r(a) - r(b)) < 1e-9); assert.ok(Math.abs(a.x - b.x) > 1e-6);
});
test('mua: chưa tới lượt thì ẩn; rơi từ cao xuống; chạm đất rồi cháy tại chỗ ở cỡ lớn hơn', () => {
  const s = lapLua('vua', 'mua').luoi[1], d = 0.05 + 0.55 * s.tre;
  assert.equal(viTriLua('mua', s, { reach: 5, after: d - 0.01 }).hien, false);
  const r1 = viTriLua('mua', s, { reach: 5, after: d + 0.05 }), r2 = viTriLua('mua', s, { reach: 5, after: d + 0.2 }), g = viTriLua('mua', s, { reach: 5, after: d + 0.5 });
  assert.ok(r1.roi && r2.roi && r1.y0 > r2.y0 && r1.y0 <= 6); assert.ok(!g.roi && g.y0 === 0 && g.mul > r1.mul);
});
test('no: lan dần ra từ tâm, không vượt vùng; lưỡi gần tâm cao hơn lưỡi ngoài rìa', () => {
  const p = lapLua('cao', 'no'), tam = p.luoi.reduce((a, b) => (a.r < b.r ? a : b)), bien = p.luoi.reduce((a, b) => (a.r > b.r ? a : b));
  const t0 = viTriLua('no', bien, { R2: 3, zD: 0, u: 0 }), t1 = viTriLua('no', bien, { R2: 3, zD: 0, u: 1 });
  assert.ok(Math.hypot(t1.x, t1.z) >= Math.hypot(t0.x, t0.z) && Math.hypot(t1.x, t1.z) <= 3.01);
  assert.ok(viTriLua('no', tam, { R2: 3, u: 1 }).mul > viTriLua('no', bien, { R2: 3, u: 1 }).mul);
});
test('chỉ Hệ hỏa dùng lửa thật; 6 chiêu hỏa đều có kiểu bay mà lửa hỗ trợ', () => {
  assert.ok(dungLua('hoa') && !['kim', 'moc', 'thuy', 'tho'].some(dungLua));
  const hoa = Object.keys(CHIEU_FX).filter((id) => id.startsWith('hoa_')); assert.equal(hoa.length, 6);
  for (const id of hoa) assert.ok(MODES.includes(CHIEU_FX[id].mode), id);
});
