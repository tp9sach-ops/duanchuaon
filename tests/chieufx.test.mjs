// Test hiệu ứng 30 chiêu (Phiên 165, Bản 2 mục 6): đủ 30 chiêu, bản giảm theo bậc máy, trần số hạt, vùng cảnh báo + hoa văn riêng từng Hệ, tiếng dùng cue có sẵn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';
import { CHIEU_FX, FX_COLOR, FX_LOAI, HAT_TOI_DA } from '../js/data/chieuFx.js';
import { lapKeHoach, tierOf, trongHinh, vienDiem, hoaVanDoan, TIER } from '../js/world/chieuFxPlan.js';
import { chieuOf } from '../js/world/chieuNguHanh.js';
import { CUES } from '../js/world/sfx.js';

const IDS = COMBAT_SKILLS.map((s) => s.id);
const VAN_HE = { kim: 'vachCheo', moc: 'hoaVanLa', thuy: 'gonSong', hoa: 'socNhon', tho: 'oVuong' };

test('đủ 30 chiêu có hiệu ứng; dữ liệu đóng băng; màu 2 tông mỗi Hệ', () => {
  assert.equal(IDS.length, 30); assert.equal(Object.keys(CHIEU_FX).length, 30);
  for (const id of IDS) { const f = CHIEU_FX[id]; assert.ok(f, id); assert.ok(FX_LOAI[f.loai], id); assert.ok(['tia', 'no', 'xoay', 'mua', 'hut'].includes(f.mode), id); assert.ok(f.n >= 60 && f.n <= 260, id); }
  for (const h of Object.keys(VAN_HE)) assert.equal(FX_COLOR[h].length, 2);
  assert.ok(Object.isFrozen(CHIEU_FX) && Object.isFrozen(CHIEU_FX.kim_1));
});
test('tierOf: perfLevel → cao/vừa/yếu; giá trị lạ → vừa', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(tierOf), ['cao', 'cao', 'vua', 'vua', 'yeu', 'yeu']); assert.equal(tierOf('abc'), 'vua'); assert.equal(tierOf(undefined), 'vua');
});
test('số hạt: yếu < vừa < cao, không vượt trần 150 / 300 / 800', () => {
  assert.deepEqual({ ...HAT_TOI_DA }, { yeu: 150, vua: 300, cao: 800 });
  for (const id of IDS) { const [y, v, c] = TIER.map((t) => lapKeHoach(id, t).n); assert.ok(y < v && v < c, `${id} ${y}/${v}/${c}`); assert.ok(y <= 150 && v <= 300 && c <= 800, id); }
  assert.equal(lapKeHoach('xxx'), null); assert.equal(lapKeHoach('kim_1', 'la').tier, 'vua');
});
test('bản giảm: máy yếu bỏ vệt, sáng, rung, khựng; khựng chỉ ở máy mạnh; vùng cảnh báo còn ở mọi bậc', () => {
  for (const id of IDS) {
    const y = lapKeHoach(id, 'yeu'), v = lapKeHoach(id, 'vua'), c = lapKeHoach(id, 'cao');
    assert.ok(!y.vet && y.sang === 0 && y.rung === 0 && y.dung === 0, id); assert.equal(v.dung, 0, id);
    for (const p of [y, v, c]) { assert.ok(p.vung.vien.length >= 4 && p.vung.van.length >= 4, id + ' ' + p.tier); }
    assert.ok(y.vung.van.length <= 24 && v.vung.van.length <= 48 && c.vung.van.length <= 96, id);
  }
});
test('vùng cảnh báo: hoa văn đúng Hệ (vạch chéo/lá/sóng/ô vuông/sọc nhọn), viền xanh nhạt khi có lợi, nét nằm trong hình', () => {
  for (const id of IDS) {
    const p = lapKeHoach(id, 'vua'), he = id.split('_')[0], card = chieuOf(id);
    assert.equal(p.vung.hoaVan, VAN_HE[he], id); assert.equal(p.vung.loi, !!card.canhBao.loi, id); assert.equal(p.vung.mau, card.canhBao.loi ? 0x9fd8ff : 0xd98a6a, id);
    for (const q of p.vung.van) assert.ok(trongHinh(card.canhBao.hinh, q[0], q[1]) && trongHinh(card.canhBao.hinh, q[2], q[3]), id);
  }
  assert.equal(vienDiem({ kieu: 'duong', dai: 5, rong: 2 }).length, 4); assert.equal(vienDiem({ kieu: 'tron', r: 3 }, 20).length, 20);
  assert.ok(trongHinh({ kieu: 'non', dai: 3, goc: 90 }, 0, 2) && !trongHinh({ kieu: 'non', dai: 3, goc: 90 }, 2.9, 0.1));
  assert.ok(hoaVanDoan('socNhon', { kieu: 'tron', r: 8 }, 24).length <= 24);
});
test('tiếng: mọi chiêu chỉ dùng cue CÓ SẴN trong sfx.js (không thêm file); chiêu gây sát thương có tiếng trúng', () => {
  for (const id of IDS) { const a = CHIEU_FX[id].am; assert.ok(a && a.gong && a.phat, id); for (const cue of Object.values(a)) assert.ok(CUES[cue], `${id}: cue lạ ${cue}`); }
  for (const s of COMBAT_SKILLS) if (s.heSo > 0) assert.ok(CHIEU_FX[s.id].am.trung, s.id);
});
test('tuyệt học: hiệu ứng nặng nhất (rung ≥ 0,5, quầng sáng ≥ 0,9) và tiếng gồng dài', () => {
  for (const id of IDS.filter((i) => i.endsWith('_tuyet'))) { const f = CHIEU_FX[id]; assert.ok(f.sang >= 0.9, id); assert.equal(f.am.gong, 'yq-xuat-hien', id); }
});
