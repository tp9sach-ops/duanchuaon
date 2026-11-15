// Test KIM LOẠI + SÉT THẬT (Phiên 181, mục 3 kế hoạch hiệu ứng 3D): số vật thể theo bậc máy, vệt chém lưỡi liềm (bay/vòng/tỏa), mảnh kim loại, tia sét zích zắc (đầu cuối đứng yên, đổi hình theo nhấp nháy), không ra NaN.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KIM_BAC, DIEM_SET, T_KIM, bam, dungKim, lapKim, lietLiem, manhKim, zicZac, setSet } from '../js/world/kim.js';
import { CHIEU_FX } from '../js/data/chieuFx.js';

const fin = (o) => Object.values(o).every((v) => typeof v === 'boolean' || typeof v === 'string' || (Array.isArray(v) ? v.every((x) => Number.isFinite(x)) : Number.isFinite(v)));
const TIERS = ['yeu', 'vua', 'cao'], MODES = ['tia', 'xoay', 'no'];
const ctx = { reach: 6, R2: 2.5, zD: 0, W: 1.2, pz: 3 };

test('số vật thể: yếu < vừa < cao; yếu chỉ 1 vệt chém, không mảnh/sét/lóe; trần nhẹ cho điện thoại', () => {
  const n = TIERS.map((t) => lapKim(t, 'no'));
  assert.ok(n[0].nLiem < n[1].nLiem && n[1].nLiem < n[2].nLiem);
  assert.equal(n[0].nLiem, 1); assert.equal(n[0].nManh + n[0].nSet + n[0].nLoe, 0);
  assert.ok(n[1].nManh > 0 && n[1].nSet > 0 && n[1].nLoe > 0);
  for (const t of TIERS) { const p = lapKim(t, 'no'); assert.equal(p.liem.length, KIM_BAC[t].liem); assert.equal(p.manh.length, KIM_BAC[t].manh); assert.equal(p.set.length, KIM_BAC[t].set); assert.ok(p.nLoe <= p.nManh); }
  assert.ok(KIM_BAC.cao.liem <= 6 && KIM_BAC.cao.manh <= 30 && KIM_BAC.cao.set <= 6);
  assert.equal(lapKim('la', 'no').tier, 'vua');
});
test('ổn định + đa dạng: cùng đầu vào ra cùng kết quả; vệt chém nghiêng khác nhau; tuyệt học to hơn chiêu thường', () => {
  assert.deepEqual(lapKim('cao', 'tia', { co: 0.35 }), lapKim('cao', 'tia', { co: 0.35 }));
  for (let i = 0; i < 200; i++) { const b = bam(i, 3); assert.ok(b >= 0 && b < 1); }
  assert.ok(new Set(lapKim('cao', 'tia').liem.map((s) => s.ngh.toFixed(3))).size >= 4);
  assert.ok(lapKim('vua', 'no', { co: 0.5 }).kc > lapKim('vua', 'no', { co: 0.25 }).kc);
});
test('chiêu nào dùng kim loại/sét: đúng 6 chiêu Hệ kim, không chiêu hệ khác', () => {
  const kim = Object.keys(CHIEU_FX).filter((id) => id.startsWith('kim_'));
  assert.equal(kim.length, 6);
  for (const id of kim) assert.ok(dungKim('kim', CHIEU_FX[id].loai), id);
  assert.equal(dungKim('hoa', 'kim'), false); assert.equal(dungKim('kim', 'lua'), false);
  assert.deepEqual(Object.keys(CHIEU_FX).filter((id) => dungKim(id.split('_')[0], CHIEU_FX[id].loai)).sort(), kim.sort());
});
test('vệt chém: chưa tới lượt / đã tan thì ẩn; liềm bay đi tới trước và rộng dần; liềm vòng đúng bán kính; không NaN', () => {
  for (const mode of MODES) {
    const p = lapKim('cao', mode), s = p.liem[0];
    assert.equal(lietLiem(s, mode, s.tre - 0.01, ctx).hien, false);
    assert.equal(lietLiem(s, mode, s.tre + T_KIM.liem + 0.01, ctx).hien, false);
    for (const sx of p.liem) for (let a = -0.2; a < 1; a += 0.05) { const v = lietLiem(sx, mode, a, ctx); assert.ok(fin(v), JSON.stringify(v)); assert.ok(v.op >= 0 && v.op <= 1.0001); }
  }
  const s = lapKim('vua', 'tia').liem[0], a = lietLiem(s, 'tia', s.tre + 0.1, ctx), b = lietLiem(s, 'tia', s.tre + 0.4, ctx);
  assert.equal(a.kieu, 'song'); assert.ok(b.z > a.z && b.co > a.co && b.z <= ctx.reach * 1.01);
  const x = lapKim('vua', 'xoay').liem[0]; assert.equal(lietLiem(x, 'xoay', x.tre + 0.2, ctx).kieu, 'vong');
  const n1 = lapKim('vua', 'no').liem[0], n2 = lapKim('vua', 'no').liem[1];
  assert.ok(lietLiem(n1, 'no', n1.tre + 0.45, ctx).co > lietLiem(n1, 'no', n1.tre + 0.1, ctx).co);   // sóng chém tỏa rộng dần
  assert.ok(n2.tre > n1.tre);   // vệt sau trễ hơn
});
test('mảnh kim loại: không hiện khi đang gồng; vành quay quanh người (xoay); rơi xuống đất (no); không NaN', () => {
  for (const mode of MODES) {
    const m = lapKim('cao', mode).manh;
    for (const s of m) { assert.equal(manhKim(s, mode, 0, -0.1, ctx).hien, false); for (let a = 0; a < 1.2; a += 0.05) { const v = manhKim(s, mode, a + 0.3, a, ctx); assert.ok(fin(v), JSON.stringify(v)); assert.ok(v.loe >= 0 && v.loe <= 1.0001 && v.op >= 0 && v.op <= 1.0001); } }
  }
  for (const s of lapKim('cao', 'xoay').manh) { const v = manhKim(s, 'xoay', 1, 0.3, ctx), r = Math.hypot(v.x, v.z); assert.ok(r >= 0.9 * 0.45 - 1e-6 && r <= ctx.R2 * 0.85 + 1e-6); }
  for (const s of lapKim('cao', 'no').manh) { const v = manhKim(s, 'no', 1, 0.8, ctx); assert.ok(v.y >= 0.05 - 1e-9); }
});
test('tia sét zích zắc: đủ điểm, đầu cuối đứng yên, đổi tick đổi hình, cùng tick giống hệt, lệch giữa lớn hơn hai đầu, không NaN', () => {
  const a = [0, 9, 0], b = [2, 0.1, -1], P = zicZac(7, 3, DIEM_SET, a, b, 0.9);
  assert.equal(P.length, DIEM_SET); assert.deepEqual(P[0], a); assert.deepEqual(P[DIEM_SET - 1], b);
  assert.deepEqual(P, zicZac(7, 3, DIEM_SET, a, b, 0.9));
  assert.notDeepEqual(P, zicZac(7, 4, DIEM_SET, a, b, 0.9));
  const dist = (p, f) => { const q = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  let giua = 0, dau = 0; for (let t = 0; t < 40; t++) { const Q = zicZac(5, t, DIEM_SET, a, b, 0.9); giua += dist(Q[4], 4 / 8); dau += dist(Q[1], 1 / 8); assert.ok(Q.every((p) => p.every(Number.isFinite))); }
  assert.ok(giua > dau);
  for (const q of zicZac(1, 1, DIEM_SET, [0, 1, 0], [0, 1, 0], 0.5)) assert.ok(q.every(Number.isFinite));   // hai đầu trùng nhau vẫn không NaN
  for (const q of zicZac(1, 1, DIEM_SET, [0, 0, 0], [0, 5, 0], 0.5)) assert.ok(q.every(Number.isFinite));   // tia thẳng đứng
});
test('sét: giáng từ trên cao xuống đất (no), chạy dọc đường chiêu (tia), nhảy ra vành quanh người (xoay); hết giờ thì ẩn; nhấp nháy', () => {
  const sn = lapKim('cao', 'no').set[0], v = setSet(sn, 'no', sn.tre + 0.05, ctx);
  assert.ok(v.hien && v.a[1] >= 8 && v.b[1] < 0.2 && v.lop > 0.5);
  assert.equal(setSet(sn, 'no', sn.tre - 0.01, ctx).hien, false); assert.equal(setSet(sn, 'no', sn.tre + T_KIM.set + 0.01, ctx).hien, false);
  const st = lapKim('cao', 'tia').set[0], t1 = setSet(st, 'tia', 0.2, ctx); assert.ok(t1.hien && t1.b[2] <= ctx.reach && t1.a[2] <= t1.b[2]);
  const sx = lapKim('cao', 'xoay').set[0], x1 = setSet(sx, 'xoay', sx.tre + 0.2, ctx); assert.ok(x1.hien && x1.a[0] === 0 && Math.hypot(x1.b[0], x1.b[2]) > 0.3);
  for (const mode of MODES) for (const s of lapKim('cao', mode).set) { let tat = 0, sang = 0; for (let a = -0.1; a < 1.1; a += 0.01) { const q = setSet(s, mode, a, ctx); assert.ok(fin(q), JSON.stringify(q)); assert.ok(q.op >= 0 && q.op <= 1.0001); if (q.hien) (q.op < 0.5 ? tat++ : sang++); } assert.ok(sang > 0); }
});
