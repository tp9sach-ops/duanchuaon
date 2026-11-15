import test from 'node:test';
import assert from 'node:assert/strict';
import { createCamFeel, docTuyChon, fovNhay, kBamDoc, CAM } from '../js/world/camFeel.js';

const chay = (f, giay, dt = 1 / 60) => { const out = []; for (let t = 0; t < giay; t += dt) out.push(f.step(dt)); return out; };

test('docTuyChon: mặc định bật rung+khựng, dữ liệu lạ không vỡ', () => {
  assert.deepEqual(docTuyChon(null), { rung: true, dung: true, giamChuyenDong: false });
  assert.deepEqual(docTuyChon('{x'), { rung: true, dung: true, giamChuyenDong: false });
  assert.equal(docTuyChon('{"rung":false}').rung, false);
});
test('rung tắt dần theo hàm mũ, có trần, về 0', () => {
  const f = createCamFeel(); for (let i = 0; i < 20; i++) f.rung(3);
  const o = chay(f, 1.5), a = (x) => Math.hypot(x.dx, x.dy);
  assert.ok(Math.max(...o.map(a)) <= CAM.rungMax * 1.01);
  assert.equal(o[o.length - 1].dx, 0); assert.equal(o[o.length - 1].dy, 0);
  const first = o.slice(0, 10).reduce((s, x) => s + a(x), 0), last = o.slice(30, 40).reduce((s, x) => s + a(x), 0);
  assert.ok(last < first);
});
test('khựng hình kẹp 40–120 ms và chỉ làm chậm (không về 0)', () => {
  const f = createCamFeel(); f.khung(5);
  const o = chay(f, 0.3); const n = o.filter((x) => x.dung).length;
  assert.ok(n >= 6 && n <= 8, 'số khung khựng = ' + n);       // ≈ 120 ms ở 60 fps
  assert.ok(o[0].tocDo > 0 && o[0].tocDo < 0.2); assert.equal(o[o.length - 1].tocDo, 1);
  const g = createCamFeel(); g.khung(0.001); assert.ok(chay(g, 0.2).filter((x) => x.dung).length >= 2);   // tối thiểu 40 ms
});
test('chiêu 4: FOV +5–8% rồi trả về trong ~0,2 s; chiêu lạ không đổi gì', () => {
  const f = createCamFeel(); assert.equal(f.chieu('thuong'), false); assert.ok(chay(f, 0.2).every((x) => x.fov === 0));
  assert.equal(f.chieu('chieu4'), true); const o = chay(f, 0.3), m = Math.max(...o.map((x) => x.fov));
  assert.ok(m >= 0.05 && m <= 0.08, 'đỉnh ' + m); assert.equal(o[o.length - 1].fov, 0);
});
test('tuyệt học: chậm 0,2–0,4 s rồi trả về trong 0,5 s', () => {
  const f = createCamFeel(); assert.equal(f.chieu('tuyetHoc'), true); const o = chay(f, 1.2, 1 / 100);
  const cham = o.filter((x) => x.tocDo < 1).length / 100; assert.ok(cham >= 0.2 && cham <= 0.45, 'chậm ' + cham + ' s');
  assert.ok(Math.max(...o.map((x) => x.fov)) > 0.06); assert.equal(o[o.length - 1].fov, 0); assert.equal(o[o.length - 1].tocDo, 1);
});
test('giảm chuyển động (người chơi hoặc hệ thống) tắt rung/khựng/đẩy gần', () => {
  for (const f of [createCamFeel({ tuyChon: { giamChuyenDong: true } }), createCamFeel({ giamHeThong: true })]) {
    f.rung(3); f.khung(0.1); assert.equal(f.chieu('tuyetHoc'), false);
    assert.ok(chay(f, 0.3).every((x) => x.dx === 0 && x.fov === 0 && x.tocDo === 1 && !x.dung));
  }
  const f = createCamFeel(); f.rung(3); f.set({ giamChuyenDong: true }); assert.equal(chay(f, 0.1)[0].dx, 0);
});
test('công tắc riêng: tắt rung vẫn khựng, tắt khựng vẫn rung', () => {
  const a = createCamFeel({ tuyChon: { rung: false } }); a.rung(3); a.khung(0.1); const oa = chay(a, 0.1);
  assert.ok(oa.every((x) => x.dx === 0) && oa.some((x) => x.dung));
  const b = createCamFeel({ tuyChon: { dung: false } }); b.rung(3); b.khung(0.1); const ob = chay(b, 0.1);
  assert.ok(ob.some((x) => x.dx !== 0) && ob.every((x) => !x.dung));
});
test('step chịu dt lạ; nhảy: FOV +3–5% khi lên, trễ ~0,2 s khi trên không', () => {
  const f = createCamFeel(); for (const d of [NaN, -1, Infinity, undefined]) assert.doesNotThrow(() => f.step(d));
  assert.equal(fovNhay(-3, 10), 0); assert.ok(fovNhay(10, 10) >= 0.03 && fovNhay(10, 10) <= 0.05); assert.ok(fovNhay(99, 10) <= 0.05);
  assert.equal(kBamDoc(false, 9), 9); assert.ok(Math.abs(1 / kBamDoc(true) - 0.2) < 0.001);
});
