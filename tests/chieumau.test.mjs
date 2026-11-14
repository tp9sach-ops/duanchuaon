// Bảng màu + phác thảo 30 chiêu (prompt chiêu thức 3D mục 4, mục 2 bước 1, mục 14 điểm 2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { BANG_MAU, HE_LIST, PHAC_THAO, TI_LE_BU_SUNG_TOI_DA, SO_MAU_CHU_TOI_DA, doSang, tuongPhan, sacDo, lechSacDo, hexSo, hexXam, mauHe, mauChieu, phacThao } from '../js/data/chieuMau.js';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';
import { FX_COLOR } from '../js/data/chieuFx.js';
import { chieuOf } from '../js/world/chieuNguHanh.js';

const hexOk = /^#[0-9a-f]{6}$/i;
const toHex = (n) => `#${n.toString(16).padStart(6, '0')}`;

test('đủ 5 Hệ, mỗi Hệ đủ 4 màu + 1 màu bổ sung, đều là hex hợp lệ và khác nhau', () => {
  assert.deepEqual(Object.keys(BANG_MAU), HE_LIST);
  for (const he of HE_LIST) {
    const b = BANG_MAU[he], c = [b.nen, b.chu, b.sang, b.loi, b.buSung];
    for (const x of c) assert.match(x, hexOk, he);
    assert.equal(new Set(c).size, 5, `${he} có màu trùng`);
    assert.ok(b.tenBuSung && b.ten, he);
  }
  assert.throws(() => { BANG_MAU.kim.chu = '#000000'; }, TypeError);   // đóng băng
});

test('kiểm ảnh đen trắng: độ sáng tăng dần nền < chủ < sáng < lõi, đủ tách khối', () => {
  for (const he of HE_LIST) {
    const b = BANG_MAU[he], y = [b.nen, b.chu, b.sang, b.loi].map(doSang);
    for (let i = 1; i < 4; i++) assert.ok(y[i] - y[i - 1] >= 0.04, `${he}: bậc ${i} chỉ hơn ${(y[i] - y[i - 1]).toFixed(3)}`);
    assert.ok(tuongPhan(b.chu, b.nen) >= 2.5, `${he}: chủ/nền ${tuongPhan(b.chu, b.nen).toFixed(2)}`);
    assert.ok(tuongPhan(b.sang, b.chu) >= 1.4, `${he}: sáng/chủ ${tuongPhan(b.sang, b.chu).toFixed(2)}`);
    assert.ok(tuongPhan(b.loi, b.nen) >= 8, `${he}: lõi/nền ${tuongPhan(b.loi, b.nen).toFixed(2)}`);
    // bản xám của 4 màu vẫn tăng dần (người xem đen trắng/khó phân màu vẫn thấy khối)
    const g = [b.nen, b.chu, b.sang, b.loi].map((h) => parseInt(hexXam(h).slice(1, 3), 16));
    assert.ok(g[0] < g[1] && g[1] < g[2] && g[2] < g[3], `${he} xám ${g}`);
  }
});

test('màu bổ sung thật sự tương phản: lệch sắc độ ≥ 60° so với màu chủ (Hệ ít bão hòa như Kim: so với màu sáng chủ vẫn phải khác ≥ 60°)', () => {
  for (const he of HE_LIST) {
    const b = BANG_MAU[he], h = sacDo(b.buSung), hc = sacDo(b.chu);
    assert.ok(h.s >= 0.25, `${he} bổ sung quá nhạt`);
    assert.ok(lechSacDo(h.h, hc.h) >= 60, `${he}: ${lechSacDo(h.h, hc.h).toFixed(0)}°`);
  }
});

test('hai tông hạt FX_COLOR cùng họ màu với bảng (sắc độ lệch ≤ 30° so với màu chủ hoặc sáng; bỏ qua Kim vì gần xám)', () => {
  for (const he of HE_LIST) {
    const tong = FX_COLOR[he]; assert.ok(tong && tong.length === 2, he); if (he === 'kim') continue;
    const b = BANG_MAU[he], ref = [sacDo(b.chu).h, sacDo(b.sang).h];
    for (const n of tong) { const h = sacDo(toHex(n)).h; assert.ok(Math.min(...ref.map((r) => lechSacDo(h, r))) <= 30, `${he} ${toHex(n)} lệch`); }
  }
});

test('tiện ích màu: độ sáng, tương phản, sắc độ, số 0xRRGGBB; đầu vào hỏng không ném lỗi', () => {
  assert.equal(doSang('#000000'), 0); assert.ok(Math.abs(doSang('#ffffff') - 1) < 1e-9); assert.ok(Math.abs(tuongPhan('#000000', '#ffffff') - 21) < 1e-9);
  assert.equal(hexSo('#ff7a3d'), 0xff7a3d); assert.equal(hexSo('xyz'), 0); assert.equal(hexSo(null), 0);
  assert.equal(doSang('hỏng'), 0); assert.equal(sacDo(5), null); assert.equal(hexXam('?'), '#000000');
  assert.equal(Math.round(sacDo('#ff0000').h), 0); assert.equal(Math.round(sacDo('#00ff00').h), 120); assert.equal(lechSacDo(350, 10), 20);
  assert.equal(mauHe('hoa').ten, 'Hỏa'); for (const x of ['', 'toString', '__proto__', null, 7, undefined]) assert.equal(mauHe(x), null);
});

test('mauChieu: đủ 30 chiêu đúng Hệ; ≤ 4 màu chủ + 1 bổ sung ≤ 10% diện tích; chiêu lạ → null', () => {
  assert.equal(SO_MAU_CHU_TOI_DA, 4);
  for (const s of COMBAT_SKILLS) {
    const m = mauChieu(s.id); assert.ok(m, s.id); assert.equal(m.he, s.he);
    assert.equal(new Set([m.nen, m.chu, m.sang, m.loi]).size, 4);
    assert.ok(m.tiLeBuSung > 0 && m.tiLeBuSung <= TI_LE_BU_SUNG_TOI_DA, s.id);
    if (s.slot === 'tuyet') assert.equal(m.tiLeBuSung, TI_LE_BU_SUNG_TOI_DA);
  }
  for (const x of ['khong-co', null, undefined, 3, '__proto__']) assert.equal(mauChieu(x), null);
});

test('phác thảo: mỗi chiêu có ý tưởng 1 câu, 3 từ khóa, 3 hình dáng khác nhau, đã chọn đúng 1 hình; không thừa, không thiếu', () => {
  assert.deepEqual(Object.keys(PHAC_THAO).sort(), COMBAT_SKILLS.map((s) => s.id).sort());
  for (const s of COMBAT_SKILLS) {
    const p = phacThao(s.id); assert.ok(p, s.id);
    assert.ok(p.y.length >= 15 && p.y.endsWith('.'), `${s.id} ý tưởng`);
    assert.equal(p.tk.length, 3); assert.ok(p.tk.every((k) => k.length >= 2));
    assert.equal(p.phac.length, 3); assert.equal(new Set(p.phac).size, 3, `${s.id} hình trùng`);
    assert.ok(Number.isInteger(p.chon) && p.chon >= 0 && p.chon <= 2); assert.equal(p.hinhChon, p.phac[p.chon]);
  }
  for (const x of ['khong-co', null, '__proto__', 'toString']) assert.equal(phacThao(x), null);
});

test('hình chọn khớp vùng cảnh báo trong thẻ chiêu (mọi chiêu đều có thẻ với kiểu duong | non | tron)', () => {
  for (const s of COMBAT_SKILLS) { const k = chieuOf(s.id)?.canhBao?.hinh?.kieu; assert.ok(['duong', 'non', 'tron'].includes(k), `${s.id} ${k}`); }
});
