// Test bộ tổng hợp. Đáp án tính tay từ bảng trọng số trong js/data/weights.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { synthesize, fromBoiNgay, fromLuuNien, fromThienVan, averageScores } from '../js/engines/synthesis.js';
import { analyzeDay } from '../js/engines/dayscore.js';
import { analyzePersonal } from '../js/engines/personal.js';
import { analyzeBatu, luuNien } from '../js/engines/batu.js';
import { analyzeNumerology, scoreNumerology } from '../js/engines/numerology.js';

const rd = (f) => JSON.parse(readFileSync(new URL('../js/data/' + f, import.meta.url), 'utf8'));
const W = rd('weights.json'), K = rd('knowledge.json'), P = rd('personal.json'), N = rd('numerology.json');
const v = (mon, t, c = 0.5) => ({ mon, tong: t, tai_loc: t, su_nghiep: t, tinh_cam: t, suc_khoe: t, quy_nhan: t, nhan: mon, doTinCay: c });

test('trọng số ngày: bói ngày .40 và thần số .15 → chuẩn hóa .40/.55 và .15/.55', () => {
  const r = synthesize('ngay', [v('boiNgay', 80), v('thanSo', 40)], W);
  assert.equal(r.diem.tong, Math.round((0.40 * 80 + 0.15 * 40) / 0.55)); // 69
  assert.deepEqual(r.monNoi.map((m) => m.trongSo), [73, 27]);
});
test('môn có trọng số 0 hoặc thiếu bị bỏ; liệt kê môn thiếu', () => {
  const r = synthesize('ngay', [v('boiNgay', 60), v('tayTuong', 90), null], W);
  assert.equal(r.monNoi.length, 1);
  assert.ok(r.monThieu.includes('batu') && r.monThieu.includes('thanSo') && !r.monThieu.includes('tayTuong'));
});
test('không có môn nào → ok=false', () => assert.equal(synthesize('nam', [v('tayTuong', 70)], W).ok, false));
test('độ tin cậy giảm khi thiếu môn', () => {
  const nhieu = synthesize('ngay', [v('boiNgay', 60, 0.6), v('batu', 60, 0.6), v('thanSo', 60, 0.6), v('hoangDao', 60, 0.6)], W);
  const it = synthesize('ngay', [v('boiNgay', 60, 0.6)], W);
  assert.ok(nhieu.doTinCay > it.doTinCay);
});
test('Tín hiệu mạnh khi ≥3 môn cùng thuận; Cần cân nhắc khi có cả thuận lẫn nhẹ tay', () => {
  const a = synthesize('ngay', [v('boiNgay', 70), v('batu', 65), v('thanSo', 60)], W);
  assert.equal(a.tinHieu.loai, 'manhThuan');
  const b = synthesize('ngay', [v('boiNgay', 75), v('batu', 30), v('thanSo', 50)], W);
  assert.equal(b.tinHieu.loai, 'canNhac');
  const c = synthesize('ngay', [v('boiNgay', 30), v('batu', 35), v('thanSo', 40)], W);
  assert.equal(c.tinHieu.loai, 'manhNhe');
  assert.equal(synthesize('ngay', [v('boiNgay', 50), v('batu', 52)], W).tinHieu, null);
});
test('luôn có đúng 3 lời khuyên, mood trong −1…1, điểm 0–100', () => {
  for (const t of [0, 25, 50, 75, 100]) {
    const r = synthesize('thang', [v('boiNgay', t), v('thanSo', t)], W);
    assert.equal(r.loiKhuyen.length, 3); assert.ok(Math.abs(r.mood) <= 1);
    assert.ok(r.diem.tong >= 0 && r.diem.tong <= 100);
  }
});
test('chia lĩnh vực bói ngày: ngày Trực Định (nên cưới hỏi, ký kết, xây dựng) nghiêng tình cảm và sự nghiệp', () => {
  // Tìm một ngày Trực Định trong 2026
  let day;
  for (let d = 1; d <= 60 && !day; d++) { const x = analyzeDay(d % 28 + 1, 1 + Math.floor(d / 28), 2026, K); if (x.truc.ten === 'Định') day = x; }
  const s = fromBoiNgay(day, null, W);
  assert.ok(s.tinh_cam > s.suc_khoe - 1 && s.su_nghiep > s.suc_khoe);
  ['tai_loc', 'su_nghiep', 'tinh_cam', 'suc_khoe', 'quy_nhan'].forEach((k) => assert.ok(Math.abs(s[k] - day.diem) <= 12));
});
test('lưu niên → lĩnh vực theo Thập thần: năm Chính tài tăng tài lộc', () => {
  const b = analyzeBatu(15, 6, 1990, -1), ln = luuNien(2026, 1990, b);
  const s = fromLuuNien({ ...ln, thapThan: 'Chính tài' }, b, W);
  assert.equal(s.tai_loc, Math.min(100, ln.diem + 6));
  assert.equal(s.su_nghiep, ln.diem);
});
test('thiên văn: trăng tròn nghiêng tình cảm, trăng khuyết trung tính', () => {
  assert.equal(fromThienVan({ goc: 180, ten: 'Trăng tròn' }).tinh_cam, 56);
  assert.equal(fromThienVan({ goc: 90, ten: 'Thượng huyền' }).tong, 50);
});
test('trung bình nhiều ngày', () => {
  const a = averageScores([v('boiNgay', 40, 0.4), v('boiNgay', 60, 0.6)], 'boiNgay', 'tb');
  assert.equal(a.tong, 50); assert.equal(a.doTinCay, 0.5);
});
test('tích hợp thật: hồ sơ mẫu 15/6/1990, ngày 31/10/2026', () => {
  const day = analyzeDay(31, 10, 2026, K), prof = { ngay: 15, thang: 6, nam: 1990, loaiLich: 'duong', gioSinh: '', hoTen: 'Nguyen Van A', gioiTinh: 'nam' };
  const per = analyzePersonal(day, prof, P, 'chung');
  const num = analyzeNumerology({ dd: 15, mm: 6, yy: 1990 }, prof.hoTen, { dd: 31, mm: 10, yy: 2026 }, N);
  const r = synthesize('ngay', [fromBoiNgay(day, per, W), { mon: 'thanSo', ...scoreNumerology(num, N) }], W, { gio: per.gioTot });
  assert.equal(r.ok, true); assert.equal(r.monNoi.length, 2);
  assert.ok(r.diem.tong >= 0 && r.diem.tong <= 100);
  assert.match(r.loiKhuyen.join(' '), /điểm|mảng|Hoàng đạo|ổn định|chuẩn bị/);
});
