// VFX sáu lớp (prompt chiêu thức 3D mục 4 + mục 14 điểm 4): đủ 6 lớp, đường cong riêng, màu theo bảng, 3 cỡ hạt, decal 3–5 s, tàn dư 1–2 s, bản giảm, ≤ 2 lớp phủ rộng.
import test from 'node:test';
import assert from 'node:assert/strict';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';
import { lapLop, doSangLop, lopPhuRong, chiaHat, cuong, LOP, CO_HAT, THO, KIEU_DECAL, LOAI_TAN_DU, TIER } from '../js/world/chieuLop.js';
import { mauChieu, hexSo, doSang, BANG_MAU, HE_LIST } from '../js/data/chieuMau.js';
import { HAT_TOI_DA, FX_LOAI } from '../js/data/chieuFx.js';

const IDS = COMBAT_SKILLS.map((s) => s.id);

test('đủ sáu lớp cho 30 chiêu × 3 bậc máy; chiêu lạ → null', () => {
  assert.deepEqual([...LOP], ['loi', 'than', 'quang', 'hat', 'moiTruong', 'tanDu']);
  for (const id of IDS) for (const t of TIER) { const p = lapLop(id, t); assert.ok(p, id); assert.deepEqual(Object.keys(p.lop), [...LOP], id); assert.equal(p.tier, t); }
  assert.equal(lapLop('xxx'), null); assert.equal(lapLop('kim_1', 'la').tier, 'vua');
  for (const id of IDS) for (const t of ['vua', 'cao']) for (const k of LOP) assert.ok(lapLop(id, t).lop[k].bat, `${id} ${t} ${k}`);
});
test('mỗi lớp có đường cong riêng 0..1, lõi có đỉnh 1; lõi bắt đầu từ lúc gồng (thời gian âm), tàn dư bắt đầu sau khi hết hiệu lực', () => {
  assert.equal(cuong([[0, 0], [1, 1]], -5), 0); assert.equal(cuong([[0, 0], [1, 1]], 9), 1); assert.ok(Math.abs(cuong([[0, 0], [1, 1]], 0.5) - 0.5) < 1e-9); assert.equal(cuong([], 1), 0);
  for (const id of IDS) {
    const p = lapLop(id, 'cao'), seen = new Set();
    for (const k of LOP) { const L = p.lop[k]; seen.add(JSON.stringify(L.keys)); for (let s = L.t0 - 0.2; s <= L.t1 + 0.2; s += 0.02) { const v = doSangLop(p, k, s); assert.ok(v >= 0 && v <= 1, `${id} ${k} ${s}`); } assert.equal(doSangLop(p, k, L.t1 + 5), 0, `${id} ${k} tắt hẳn`); }
    assert.equal(seen.size, 6, id + ': 6 đường cong khác nhau');
    assert.ok(p.lop.loi.t0 < 0 && p.lop.tanDu.t0 >= p.lop.than.t1 - 1e-9, id);
    let mx = 0; for (let s = 0; s <= 0.3; s += 0.005) mx = Math.max(mx, doSangLop(p, 'loi', s)); assert.ok(mx > 0.9, id);
  }
});
test('lõi "thở" 3–8% độ sáng, mạnh dần theo vai chiêu', () => {
  assert.ok(THO.thuong >= 0.03 && THO.tuyet <= 0.08 && THO.thuong < THO.chieu4 && THO.chieu4 < THO.tuyet);
  const p = lapLop('hoa_tuyet', 'cao'); assert.equal(p.lop.loi.tho, THO.tuyet);
  const a = new Set(); for (let s = 0.07; s < 0.3; s += 0.01) a.add(doSangLop(p, 'loi', s).toFixed(4)); assert.ok(a.size > 10);
  assert.equal(lapLop('kim_1', 'cao').lop.loi.tho, THO.thuong); assert.equal(lapLop('kim_kimcang_4', 'cao').lop.loi.tho, THO.chieu4);
});
test('màu lấy từ bảng màu: lõi trắng ngà sáng nhất, thân = màu chủ, quầng = màu sáng, decal = nền; ≤ 4 màu chủ + 1 bổ sung ≤ 10%', () => {
  for (const id of IDS) {
    const p = lapLop(id, 'vua'), mc = mauChieu(id), b = BANG_MAU[mc.he];
    assert.equal(p.lop.loi.mau, hexSo(b.loi), id); assert.equal(p.lop.than.mau, hexSo(b.chu), id); assert.equal(p.lop.quang.mau, hexSo(b.sang), id);
    assert.equal(p.lop.moiTruong.mau, hexSo(b.nen), id); assert.deepEqual(p.lop.hat.mau, [hexSo(b.chu), hexSo(b.sang), hexSo(b.loi)], id);
    assert.ok(p.lop.hat.mau.length <= 4 && p.lop.hat.tiLeBuSung <= 0.1 + 1e-9, id); assert.equal(p.lop.hat.buSung, hexSo(b.buSung), id);
    assert.ok(doSang(b.loi) > doSang(b.sang) && doSang(b.sang) > doSang(b.chu) && doSang(b.chu) > doSang(b.nen), id);
  }
});
test('hạt chia 3 cỡ (lớn chậm / vừa / nhỏ nhanh), tổng đúng số hạt của kế hoạch và không vượt trần theo bậc máy', () => {
  assert.deepEqual(chiaHat(0), { lon: 0, vua: 0, nho: 0 }); assert.deepEqual(chiaHat(100), { lon: 20, vua: 40, nho: 40 });
  for (const n of [3, 7, 99, 260, 800]) { const h = chiaHat(n); assert.equal(h.lon + h.vua + h.nho, n); assert.ok(h.lon >= 1 && h.vua >= 1 && h.nho >= 1); }
  assert.ok(CO_HAT.lon.co > CO_HAT.vua.co && CO_HAT.vua.co > CO_HAT.nho.co && CO_HAT.lon.toc < CO_HAT.vua.toc && CO_HAT.vua.toc < CO_HAT.nho.toc);
  for (const id of IDS) for (const t of TIER) { const p = lapLop(id, t), h = p.hat; assert.equal(h.lon + h.vua + h.nho, p.ke.n, id); assert.ok(p.ke.n <= HAT_TOI_DA[t], id); }
});
test('decal nền tan trong 3–5 s theo độ mạnh; tàn dư 1–2 s; kiểu decal + loại tàn dư theo Hệ hợp lệ', () => {
  for (const id of IDS) {
    const p = lapLop(id, 'cao'), d = p.lop.moiTruong, t = p.lop.tanDu;
    assert.ok(d.t1 >= 3 && d.t1 <= 5, `${id} decal ${d.t1}`); assert.ok(t.t1 - t.t0 >= 1 - 1e-9 && t.t1 - t.t0 <= 2 + 1e-9, `${id} tàn dư`);
    assert.equal(d.kieu, KIEU_DECAL[p.he]); assert.equal(t.loai, LOAI_TAN_DU[p.he]); assert.ok(FX_LOAI[t.loai], id);
  }
  assert.equal(new Set(HE_LIST.map((h) => KIEU_DECAL[h])).size, 5);
  assert.ok(lapLop('kim_tuyet', 'cao').lop.moiTruong.t1 > lapLop('moc_1', 'cao').lop.moiTruong.t1);
});
test('bản giảm: máy yếu bỏ quầng sáng + decal + sóng chấn, nửa số tàn dư; lõi/thân/hạt/tàn dư vẫn còn; sóng chấn chỉ máy mạnh + chiêu mạnh', () => {
  for (const id of IDS) {
    const y = lapLop(id, 'yeu'), v = lapLop(id, 'vua'), c = lapLop(id, 'cao');
    assert.ok(!y.lop.quang.bat && !y.lop.moiTruong.bat && !y.lop.moiTruong.songChan, id);
    assert.ok(y.lop.loi.bat && y.lop.than.bat && y.lop.hat.bat && y.lop.tanDu.bat, id);
    assert.ok(y.lop.tanDu.n < v.lop.tanDu.n && v.lop.tanDu.n < c.lop.tanDu.n, id); assert.ok(!v.lop.moiTruong.songChan, id);
    assert.equal(doSangLop(y, 'quang', 0.04), 0);
  }
  assert.ok(lapLop('kim_tuyet', 'cao').lop.moiTruong.songChan); assert.ok(!lapLop('moc_2', 'cao').lop.moiTruong.songChan);
});
test('không quá 2 lớp trong suốt phủ rộng chồng nhau tại mọi thời điểm (fill-rate điện thoại)', () => {
  for (const id of IDS) for (const t of TIER) { const p = lapLop(id, t); for (let s = -1; s <= 8; s += 0.02) assert.ok(lopPhuRong(p, s) <= 2, `${id} ${t} @${s.toFixed(2)}`); }
});
