// Kẻ địch trúng đòn: prompt chiêu thức 3D mục 7, mục 14 điểm 6.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MUC, THU_TU_MUC, HUONG, HOAT_ANH_TRUNG, mucTrung, huongTrung, phanUngTrung, coKeDich, chatLieuKeDich,
  TRANG_THAI, DS_TRANG_THAI, dongHoTrangThai, hienKhang, bieuTuongThanhMau, kieuSo, soNay, SO,
  hieuUngPhanUng, PHAN_UNG_FX, GIAY_PHAN_UNG, hieuUngChet, TAN_THEO_HE, vongGiapPha, giayKhongCheBoss, vaiTrung,
} from '../js/world/chieuTrung.js';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';
import { MONSTERS } from '../js/data/monsters.js';
import { CHAT_LIEU } from '../js/world/chieuAm.js';
import { PHAN_UNG, LUAT } from '../js/data/luatChien.js';

test('ba mức trúng đúng bảng prompt: giật/lùi/khựng tăng dần, nặng mới rung + sóng chấn + âm nặng', () => {
  assert.deepEqual(THU_TU_MUC, ['nhe', 'vua', 'nang']);
  assert.deepEqual(MUC.nhe.giatMs, [80, 120]); assert.deepEqual(MUC.vua.lui, [0.3, 0.8]); assert.deepEqual(MUC.vua.dungMs, [40, 60]);
  assert.deepEqual(MUC.nang.lui, [1, 3]); assert.deepEqual(MUC.nang.dungMs, [80, 120]);
  assert.deepEqual([MUC.nhe.so, MUC.vua.so, MUC.nang.so], ['trang', 'vang', 'do']);
  assert.ok(!MUC.nhe.songChan && !MUC.vua.songChan && MUC.nang.songChan && MUC.nang.amNang && MUC.nang.rung > MUC.vua.rung);
  assert.ok(Math.max(...THU_TU_MUC.map((m) => MUC[m].dungMs[1])) <= 120);
});

test('chọn mức: chiêu 4/tuyệt học/chí mạng/kết liễu = nặng; đòn nhỏ = nhẹ; chiêu thường = vừa', () => {
  for (const s of COMBAT_SKILLS) {
    const v = vaiTrung(s.id), m = mucTrung({ id: s.id });
    assert.equal(m, v === 'thuong' ? 'vua' : 'nang', s.id);
    assert.equal(mucTrung({ id: s.id, ketLieu: true }), 'nang'); assert.equal(mucTrung({ id: s.id, chiMang: true }), 'nang');
  }
  assert.equal(mucTrung({ nho: true }), 'nhe'); assert.equal(mucTrung({ id: 'kim_1', nho: true }), 'nhe');
  assert.equal(mucTrung({ id: 'kim_tuyet', nho: true }), 'nang');   // chiêu mạnh không bị coi là đòn nhỏ
  assert.equal(mucTrung(), 'vua'); assert.equal(mucTrung({ id: 'khong-co' }), 'vua');
});

test('hướng phản ứng: đánh từ trái thì giật sang phải; đủ trước/sau/trái/phải/trên không', () => {
  // Kẻ địch ở gốc, nhìn về +z (ry = 0). Bên phải của nó là −x... kiểm theo định nghĩa trong mã: trái/phải đối xứng nhau, trước/sau đối nhau.
  const A = (ax, az, o = {}) => huongTrung({ ax, az, x: 0, z: 0, ry: 0, ...o });
  assert.equal(A(0, 5).huong, 'truoc'); assert.equal(A(0, -5).huong, 'sau');
  const p = A(5, 0), t = A(-5, 0); assert.deepEqual(new Set([p.huong, t.huong]), new Set(['trai', 'phai']));
  // giật ngược hướng đòn
  assert.deepEqual(A(5, 0).giat, [-1, 0]); assert.deepEqual(A(-5, 0).giat, [1, 0]); assert.deepEqual(A(0, 5).giat, [0, -1]);
  // trên không ưu tiên
  assert.equal(A(0, 5, { trenKhong: true }).huong, 'trenkhong');
  // xoay kẻ địch 90° thì "trước" đổi theo
  assert.equal(huongTrung({ ax: 5, az: 0, x: 0, z: 0, ry: Math.PI / 2 }).huong, 'truoc');
  // trùng điểm / dữ liệu xấu không ném lỗi
  for (const o of [{}, { ax: NaN }, { x: 'a' }, { ry: null }]) { const r = huongTrung(o); assert.ok(HUONG.includes(r.huong)); assert.ok(r.giat.every(Number.isFinite)); }
  assert.deepEqual(HUONG, ['truoc', 'sau', 'trai', 'phai', 'trenkhong']);
  assert.equal(HOAT_ANH_TRUNG.length, 15); assert.equal(new Set(HOAT_ANH_TRUNG).size, 15);
});

test('phản ứng trúng: số liệu trong khoảng của mức; boss ít bị đẩy và không ngã; lơ lửng không lùi dài', () => {
  for (const m of THU_TU_MUC) for (const h of [{ ax: 0, az: 5 }, { ax: 5, az: 0 }, { ax: 0, az: 1, trenKhong: true }]) for (const luc of [0, 0.5, 1]) {
    const r = phanUngTrung({ muc: m, luc, ...h });
    assert.ok(r.giatMs >= MUC[m].giatMs[0] && r.giatMs <= MUC[m].giatMs[1], `${m} giật`);
    assert.ok(r.dungMs >= MUC[m].dungMs[0] * 1 && r.dungMs <= MUC[m].dungMs[1], `${m} khựng`);
    if (r.huong !== 'trenkhong') assert.ok(r.lui >= MUC[m].lui[0] - 1e-9 && r.lui <= MUC[m].lui[1] + 1e-9, `${m} lùi`);
    else assert.ok(r.lui <= 0.35 + 1e-9);
    assert.equal(r.hoatAnh, `trung-${m}-${r.huong}`); assert.ok(HOAT_ANH_TRUNG.includes(r.hoatAnh));
  }
  const thuong = phanUngTrung({ muc: 'nang', co: 'thuong', ax: 0, az: 5, luc: 1 }), boss = phanUngTrung({ muc: 'nang', co: 'boss', ax: 0, az: 5, luc: 1 });
  assert.equal(thuong.lui, 3); assert.ok(boss.lui < thuong.lui * 0.5); assert.ok(thuong.nga && !boss.nga); assert.ok(boss.dungMs <= thuong.dungMs);
  assert.ok(phanUngTrung({ muc: 'nang', ax: 0, az: 1, trenKhong: true }).xoay > 0);
  assert.equal(phanUngTrung({ muc: 'khong-co' }).muc, 'vua');   // mức lạ → vừa, không lỗi
  assert.equal(phanUngTrung({ muc: 'nhe' }).lui, 0);
});

test('cỡ kẻ địch + chất liệu cho âm trúng: mọi quái cho ra chất liệu hợp lệ của kho âm', () => {
  for (const id of Object.keys(MONSTERS)) { assert.ok(CHAT_LIEU.includes(chatLieuKeDich(id)), id); assert.ok(['thuong', 'elite', 'boss'].includes(coKeDich(id)), id); }
  assert.equal(chatLieuKeDich('thachtinh'), 'da'); assert.equal(chatLieuKeDich('kimgiap'), 'kimloai'); assert.equal(chatLieuKeDich('dameo'), 'dathit');
  assert.equal(chatLieuKeDich('mocnhan'), 'dathit'); assert.equal(chatLieuKeDich(null), 'dathit'); assert.equal(chatLieuKeDich('__proto__'), 'dathit');
  assert.equal(coKeDich('laomoc'), 'boss'); assert.equal(coKeDich('cuopduong'), 'elite'); assert.equal(coKeDich('dameo'), 'thuong'); assert.equal(coKeDich('khong-co'), 'thuong');
});

test('bảy trạng thái nhìn thấy được: mỗi cái dấu hiệu + biểu tượng thanh máu riêng; chỉ khống chế mới có vòng đếm ngược', () => {
  assert.deepEqual(DS_TRANG_THAI, ['thieuDot', 'choang', 'hatTung', 'troi', 'lamCham', 'dongBang', 'moMat']);
  const icons = new Set(), maus = new Set();
  for (const k of DS_TRANG_THAI) { const t = TRANG_THAI[k]; assert.ok(t.dauHieu.length >= 2 && t.chu && /^#[0-9a-f]{6}$/i.test(t.mau), k); icons.add(t.icon); maus.add(t.mau); }
  assert.equal(icons.size, 7); assert.equal(maus.size, 7);
  assert.deepEqual(DS_TRANG_THAI.filter((k) => TRANG_THAI[k].vong), ['choang', 'hatTung', 'troi', 'dongBang']);
  assert.ok(Object.keys(LUAT.gioiHanKhongChe).every((k) => TRANG_THAI[k] && TRANG_THAI[k].vong));   // mọi khống chế của luật lõi đều có vòng đếm ngược
  assert.equal(TRANG_THAI.dongBang.vaoMs, 200); assert.equal(TRANG_THAI.dongBang.tanAm, 'vobang');   // băng phủ trong 0,2 s, tan có tiếng vỡ
});

test('đồng hồ khống chế "đang bị gì, còn bao lâu" + chữ kháng mờ dần', () => {
  const d = dongHoTrangThai('choang', 1.26, 3); assert.equal(d.conLai, 1.3); assert.equal(d.tiLe, 0.42); assert.ok(d.dangBi && d.vong && d.chu === 'Choáng');
  assert.equal(dongHoTrangThai('choang', 0, 3).dangBi, false); assert.equal(dongHoTrangThai('troi', 5, 3).tiLe, 1);
  assert.equal(dongHoTrangThai('thieuDot', 2, 3).tiLe, undefined);   // không phải khống chế: không vòng
  assert.equal(dongHoTrangThai('khong-co', 1, 1), null);
  const k1 = hienKhang(8), k2 = hienKhang(4), k3 = hienKhang(0);
  assert.ok(k1.hien && k1.doDuc === 1 && k2.doDuc === 0.5 && !k3.hien && k3.doDuc === 0 && k1.chu === 'kháng');
  assert.equal(hienKhang(100).doDuc, 1);
  const bm = bieuTuongThanhMau({ thieuDot: { tang: 9 }, choang: true, lamCham: 1 });
  assert.deepEqual(bm.map((b) => b.loai), ['thieuDot', 'choang', 'lamCham']); assert.equal(bm[0].tang, LUAT.thieuDot.toiDaTang); assert.equal(bm[1].tang, 1);
  assert.deepEqual(bieuTuongThanhMau({}), []);
});

test('số sát thương: trắng/vàng/đỏ theo mức; cháy/độc nhỏ + nhạt; nảy parabol, phóng 120% rồi co, không che nhân vật', () => {
  assert.equal(kieuSo({ muc: 'nhe' }).mau, SO.mau.trang); assert.equal(kieuSo({ muc: 'vua' }).mau, SO.mau.vang); assert.equal(kieuSo({ muc: 'nang' }).mau, SO.mau.do);
  assert.equal(kieuSo({ loai: 'chiMang', muc: 'vua' }).mau, SO.mau.do); assert.ok(kieuSo({ loai: 'chiMang' }).co > kieuSo({ muc: 'vua' }).co);
  for (const l of ['thieuDot', 'doc']) assert.ok(kieuSo({ loai: l }).co < kieuSo({ muc: 'nhe' }).co);
  let maxScale = 0, maxY = 0; for (let t = 0; t <= SO.song; t += 0.01) { const s = soNay(t); maxScale = Math.max(maxScale, s.scale); maxY = Math.max(maxY, s.y); assert.ok(s.y >= 1.7 - 1e-9, 'số luôn trên đầu'); assert.ok(s.alpha >= 0 && s.alpha <= 1); }
  assert.ok(Math.abs(maxScale - 1.2) < 0.01); assert.ok(maxY > soNay(0).y);
  assert.equal(soNay(0).scale, 1); assert.equal(soNay(SO.song).scale, 1); assert.ok(soNay(SO.song).het && !soNay(0.1).het); assert.equal(soNay(SO.song).alpha, 0);
  assert.ok(soNay(0.5, { lech: 1 }).x > 0 && soNay(0.5, { lech: -1 }).x < 0 && soNay(0.5, { lech: 9 }).x === soNay(0.5, { lech: 1 }).x);
  assert.doesNotThrow(() => soNay(NaN));
});

test('phản ứng giữa Hệ: đủ 5 phản ứng của luật lõi, 0,5 s + chữ nổi; không phản ứng → null', () => {
  assert.equal(Object.keys(PHAN_UNG_FX).length, PHAN_UNG.length);
  for (const p of PHAN_UNG) { const [a, b] = p.he; for (const [x, y] of [[a, b], [b, a]]) { const r = hieuUngPhanUng(x, y); assert.ok(r && r.id === p.id && r.chu === p.chu && r.giay === GIAY_PHAN_UNG && r.mau && r.hat, p.id); } }
  assert.equal(GIAY_PHAN_UNG, 0.5);
  assert.equal(hieuUngPhanUng('hoa', 'hoa'), null); assert.equal(hieuUngPhanUng('kim', 'moc'), null); assert.equal(hieuUngPhanUng('hoa', null), null);
  assert.equal(new Set(Object.values(PHAN_UNG_FX).map((f) => f.mau)).size, 5);
});

test('chết tan theo Hệ chiêu kết liễu; boss tan chậm, không ngã trước; vòng giáp phá boss; khống chế boss ngắn lại', () => {
  for (const he of ['kim', 'moc', 'thuy', 'tho', 'hoa']) assert.equal(hieuUngChet({ he }).kieu, TAN_THEO_HE[he]);
  assert.equal(new Set(Object.values(TAN_THEO_HE)).size, 5); assert.equal(hieuUngChet({ he: 'la' }).kieu, 'khoi-trang');
  assert.ok(hieuUngChet({ boss: true }).giay > hieuUngChet({}).giay); assert.ok(hieuUngChet({}).ngaTruoc && !hieuUngChet({ boss: true }).ngaTruoc);
  assert.ok(hieuUngChet({ vai: 'tuyet' }).giay > hieuUngChet({ vai: 'thuong' }).giay);
  const a = vongGiapPha(100, 100), b = vongGiapPha(15, 100), c = vongGiapPha(0, 100);
  assert.ok(a.tiLe === 1 && b.mau !== a.mau && c.vo && !a.vo && b.doDuc > a.doDuc && c.doDuc > b.doDuc); assert.doesNotThrow(() => vongGiapPha(NaN, 0));
  assert.equal(giayKhongCheBoss('hatTung', 1, 'boss'), 0.3); assert.equal(giayKhongCheBoss('hatTung', 1, 'thuong'), 1); assert.equal(giayKhongCheBoss('choang', 3, 'boss'), 1.5);
  assert.ok(giayKhongCheBoss('choang', 99, 'boss') <= 99);
});

test('hiệu ứng chiêu → trạng thái hiển thị: mọi chiêu cho ra loại hợp lệ, thời gian trong trần luật lõi', async () => {
  const { trangThaiTuChieu, FX_SANG_TRANG_THAI } = await import('../js/world/chieuTrung.js');
  let co = 0;
  for (const s of COMBAT_SKILLS) {
    const ds = trangThaiTuChieu(s.fx); assert.equal(new Set(ds.map((x) => x.loai)).size, ds.length, s.id);
    for (const x of ds) { co++; assert.ok(TRANG_THAI[x.loai], `${s.id}:${x.loai}`); assert.ok(x.giay >= 0.2 && x.giay <= 99); if (LUAT.gioiHanKhongChe[x.loai]) assert.ok(x.giay <= LUAT.gioiHanKhongChe[x.loai][0], `${s.id} vượt trần`); }
  }
  assert.ok(co >= 8);
  assert.deepEqual(trangThaiTuChieu({ choang: { chance: 0.3, dur: 2 } }), [{ loai: 'choang', giay: 2 }]);
  assert.deepEqual(trangThaiTuChieu({ choang: { dur: 50 } }), [{ loai: 'choang', giay: 3 }]);   // cắt theo trần 3 s
  assert.deepEqual(trangThaiTuChieu({ suongDoc: { dur: 6 }, docLan: {} }).map((x) => x.loai), ['moMat']);
  assert.deepEqual(trangThaiTuChieu({}), []); assert.deepEqual(trangThaiTuChieu(null), []); assert.deepEqual(trangThaiTuChieu({ __proto__: { choang: 1 } }), []);
  assert.ok(Object.values(FX_SANG_TRANG_THAI).every((v) => TRANG_THAI[v]));
});
