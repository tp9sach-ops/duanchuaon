// Test BĂNG THẬT + NƯỚC THẬT (Phiên 180, mục 2 kế hoạch hiệu ứng 3D): số vật thể theo bậc máy, vòng đời tinh thể (mọc → đứng → vỡ), mảnh vỡ, sương, mặt đất đóng băng, sóng/cột/giọt/bọt nước, không ra NaN.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BANG_BAC, SO_KIEU_BANG, T_BANG, bam, dungBang, dungNuoc, lapBang, tinhTheBang, viTriBang, manhBang, suongBang, nenBang, songNuoc, cotNuoc, xoayNuoc, giotNuoc, botNuoc } from '../js/world/bang.js';
import { CHIEU_FX } from '../js/data/chieuFx.js';

const fin = (o) => Object.values(o).every((v) => typeof v === 'boolean' || Number.isFinite(v));
const TIERS = ['yeu', 'vua', 'cao'];

test('số vật thể: yếu < vừa < cao; yếu không sương/mảnh/giọt/bọt; trần nhẹ cho điện thoại', () => {
  const n = TIERS.map((t) => lapBang(t, 'no'));
  assert.ok(n[0].nTinhThe < n[1].nTinhThe && n[1].nTinhThe < n[2].nTinhThe);
  assert.equal(n[0].nSuong + n[0].nManh + n[0].nGiot + n[0].nBot, 0);
  assert.ok(n[1].nSuong > 0 && n[1].nManh > 0 && n[1].nGiot > 0 && n[1].nBot > 0);
  for (const t of TIERS) { const p = lapBang(t, 'no'); assert.equal(p.tinhThe.length, BANG_BAC[t].tinhThe); assert.equal(p.manh.length, BANG_BAC[t].manh); assert.equal(p.giot.length, BANG_BAC[t].giot); }
  assert.ok(BANG_BAC.cao.tinhThe <= 30 && BANG_BAC.cao.manh <= 50 && BANG_BAC.cao.giot <= 60);
  assert.equal(lapBang('la', 'no').tier, 'vua');
});
test('ổn định + đa dạng: cùng đầu vào ra cùng kết quả; có đủ các kiểu tinh thể; tuyệt học to hơn chiêu thường', () => {
  assert.deepEqual(lapBang('cao', 'tia', { co: 0.35 }), lapBang('cao', 'tia', { co: 0.35 }));
  for (let i = 0; i < 200; i++) { const b = bam(i, 3); assert.ok(b >= 0 && b < 1); }
  assert.equal(new Set(lapBang('cao', 'no').tinhThe.map((s) => s.kieu)).size, SO_KIEU_BANG);
  assert.ok(lapBang('vua', 'no', { co: 0.5 }).kc > lapBang('vua', 'no', { co: 0.25 }).kc);
});
test('chiêu nào dùng băng / nước: đúng với 6 chiêu Hệ thủy (thuy_1, thuy_3, huyền băng = băng; thuy_2, cam lồ, tuyết = nước)', () => {
  const thuy = Object.entries(CHIEU_FX).filter(([id]) => id.startsWith('thuy_'));
  assert.equal(thuy.length, 6);
  const bang = thuy.filter(([, f]) => dungBang('thuy', f.loai)).map(([id]) => id).sort(), nuoc = thuy.filter(([, f]) => dungNuoc('thuy', f.loai)).map(([id]) => id).sort();
  assert.deepEqual(bang, ['thuy_1', 'thuy_3', 'thuy_huyenbang_4']); assert.deepEqual(nuoc, ['thuy_2', 'thuy_camlo_4', 'thuy_tuyet']);
  assert.equal(dungBang('hoa', 'bang'), false); assert.equal(dungNuoc('moc', 'nuoc'), false);
});
test('tinh thể: chưa mọc → mọc nhanh (vọt nhẹ) → đứng → vỡ dần → biến mất; không NaN', () => {
  const s = { phi: 0.3, tre: 0.1 };
  const a = tinhTheBang(s, 0.05), b = tinhTheBang(s, 0.2), c = tinhTheBang(s, 0.4), d = tinhTheBang(s, T_BANG.vo0 + 0.15), e = tinhTheBang(s, T_BANG.vo1 + 0.3);
  assert.equal(a.hien, false); assert.ok(b.moc > 0 && b.moc < 1.13 && b.op > 0.5); assert.ok(c.moc > 0.9 && c.vo === 0 && c.op > 0.95);
  assert.ok(d.vo > 0 && d.vo < 1 && d.op < c.op); assert.equal(e.hien, false);
  for (let t = -0.2; t < 2; t += 0.05) assert.ok(fin(tinhTheBang(s, t)), String(t));
  let vot = 0; for (let t = 0.1; t < 0.4; t += 0.01) vot = Math.max(vot, tinhTheBang(s, t).moc); assert.ok(vot > 1, 'có vọt nhẹ quá chiều cao rồi hạ lại');
});
test('vị trí: tia mọc dọc đường đi, xa chân thì trễ hơn; nổ tỏa quanh tâm, gần tâm to hơn', () => {
  const p = lapBang('cao', 'tia'), v = p.tinhThe.map((s) => viTriBang('tia', s, { reach: 6, pz: 6 })).sort((x, y) => x.z - y.z);
  assert.ok(v[0].z < v[v.length - 1].z && v[0].tre <= v[v.length - 1].tre && v[v.length - 1].tre <= 0.18 + 1e-9 && v.every((q) => q.z >= 0 && q.z <= 6 && q.hien));
  const n = lapBang('cao', 'no').tinhThe.map((s) => viTriBang('no', s, { R2: 3, zD: 1 })); assert.ok(n.every((q) => fin(q) && Math.hypot(q.x, q.z - 1) <= 3.001));
  const gan = n.filter((q) => Math.hypot(q.x, q.z - 1) < 1), xa = n.filter((q) => Math.hypot(q.x, q.z - 1) > 2); if (gan.length && xa.length) assert.ok(Math.max(...gan.map((q) => q.mul)) > Math.max(...xa.map((q) => q.mul)));
});
test('mảnh vỡ: chưa vỡ thì ẩn; vỡ thì bay ra rồi rơi, tan dần; không NaN; không chìm dưới đất', () => {
  const p = lapBang('cao', 'no'), m = p.manh[0], g = p.tinhThe[m.goc];
  assert.equal(manhBang(m, 0.1, g).hien, false);
  const a = manhBang(m, T_BANG.vo0 + g.tre * 0.5 + 0.12, g), z = manhBang(m, T_BANG.vo0 + g.tre * 0.5 + 1.0, g);
  assert.ok(a.hien && a.dy > 0 && a.op > 0.9); assert.ok(z.op < a.op);
  for (let t = 0; t < 3; t += 0.05) { const q = manhBang(m, t, g); assert.ok(fin(q) && q.dy >= 0, String(t)); }
  assert.equal(manhBang(m, 5, g).hien, false);
});
test('sương lạnh + mặt đất đóng băng: sương trong khoảng, mờ; nền loang nhanh rồi giữ rồi tan', () => {
  const s = lapBang('cao', 'no').suong; for (let t = 0; t < 6; t += 0.2) for (const q of s) { const r = suongBang(q, t, 3); assert.ok(fin(r) && r.op >= 0 && r.op <= 0.4 && r.y >= 0.1); }
  const a = nenBang(-0.1, 3), b = nenBang(0.1, 3), c = nenBang(0.9, 3), d = nenBang(1.5, 3), e = nenBang(3.1, 3);
  assert.equal(a.op, 0); assert.ok(b.k < c.k && c.k > 0.9 && c.op > 0.95 && d.op > 0.9 && e.op === 0);
});
test('nước: sóng vành to dần rồi tan, vành sau trễ hơn; cột nước bùng lên rồi sập; tuyệt học cao hơn', () => {
  const w0 = songNuoc(0, 0.1, 3), w1 = songNuoc(0, 0.5, 3), w2 = songNuoc(0, 0.9, 3), v1 = songNuoc(1, 0.1, 3);
  assert.ok(w0.hien && w1.banKinh > w0.banKinh && w1.op > w2.op - 1e-9 && w2.hien === false && v1.hien === false);
  for (let i = 0; i < 4; i++) for (let t = -0.1; t < 1.5; t += 0.05) assert.ok(fin(songNuoc(i, t, 3, 0.5)));
  const c1 = cotNuoc(0.3, 0.25, 3), c2 = cotNuoc(1.0, 0.25, 3); assert.ok(c1.hien && c1.cao > c2.cao && cotNuoc(1.5, 0.25, 3).hien === false && cotNuoc(0.3, 0.5, 3).cao > c1.cao);
  for (let t = -0.2; t < 1.3; t += 0.05) assert.ok(fin(cotNuoc(t, 0.5, 3)));
});
test('nước: dải xoáy quanh người (xoay + bay lên), giọt bắn lên rồi rơi và tan, bọt trắng; không NaN', () => {
  const x0 = xoayNuoc(0, 3, 0.1, 2), x1 = xoayNuoc(0, 3, 0.5, 2); assert.ok(x1.y > x0.y && x1.goc !== x0.goc && x1.op > 0.9);
  const p = lapBang('cao', 'no'); let thay = 0; for (const g of p.giot) { let max = 0, hien = 0; for (let t = 0; t < 2.5; t += 0.03) { const q = giotNuoc(g, t, 3); assert.ok(fin(q), String(t)); if (q.hien) { hien++; max = Math.max(max, q.y); assert.ok(q.y >= 0.02); } } if (max > 0.3 && hien > 3 && giotNuoc(g, 2.4, 3).hien === false) thay++; }
  assert.ok(thay >= p.giot.length * 0.8, 'phần lớn giọt bắn lên cao rồi tan khi chạm đất');
  for (const b of p.bot) for (let t = 0; t < 4; t += 0.2) { const q = botNuoc(b, t, 3); assert.ok(fin(q) && q.op <= 0.45 + 1e-9); }
});
