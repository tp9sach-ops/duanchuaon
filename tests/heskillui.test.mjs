// Phiên 187: kiểm nối dây cụm nút chiêu (js/ui/heSkill.js + js/ui/luyenChieu.js). Không có DOM trong Node nên đọc mã nguồn để chống quên nối lại.
// Phiên 192: sửa phép kiểm lỗi thời của Phiên 189 (thanh chiêu nay hiện cả ở khu luyện tập) + thêm test bố cục cung tròn (js/ui/actionArc.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arcPoints, fitFactor, ARC_POS, ARC_CSS } from '../js/ui/actionArc.js';
const hs = readFileSync(new URL('../js/ui/heSkill.js', import.meta.url), 'utf8');
const ic = readFileSync(new URL('../js/ui/skillIcon.js', import.meta.url), 'utf8');
const lc = readFileSync(new URL('../js/ui/luyenChieu.js', import.meta.url), 'utf8');
test('nút chiêu vẽ HÌNH (glyphOf) chứ không chỉ chữ cái', () => {
  assert.match(hs, /glyphOf/); assert.match(ic, /GLYPH_D/); assert.match(hs, /drawGlyphIcon/); assert.match(lc, /drawGlyphIcon/);
  for (const g of ['hoi', 'an', 'khien', 'toc', 'khoa', 'lao', 'tia', 'vung', 'chem', 'chon']) assert.match(ic, new RegExp(`\\b${g}: '`), g);
});
test('nút to theo cỡ chung --btn-k, bấm nhận cú chạm, có số giây hồi chiêu + ổ khóa', () => {
  assert.match(hs, /--hs-s:calc\(var\(--btn-k,1\)/); assert.match(hs, /#hs-bar\{[^}]*pointer-events:auto/); assert.match(hs, /\.hs-cdn/); assert.match(hs, /\.hs-lock/);
});
test('ở khu luyện tập nút chiêu tung được qua LGT.luyenChieu.castById, không khóa cấp', () => {
  assert.match(hs, /inLuyen\(\)\) return luyenCast/); assert.match(hs, /!zone && eff\(\) < SKILL_CAP\[s\]/);
  assert.match(lc, /castById/); assert.match(lc, /cdOf/); assert.match(lc, /LGT\.luyenChieu = \{ enter, leave, castById, cdOf/);
});
test('Phiên 189/191: khu luyện = không còn khung bảng; thanh chiêu phái HIỆN CẢ ở khu luyện (dùng chung cụm nút); bỏ nhãn Q/W/E', () => {
  assert.doesNotMatch(lc, /lc-panel|lc-grid/); assert.match(lc, /var\(--btn-k,1\)/);
  assert.doesNotMatch(hs, /!inLuyen\(\) && !LGT\.inHouse/); assert.match(hs, /!LGT\.inHouse && !LGT\.panelOpen/); assert.match(hs, /\.hs-b \.hs-k\{display:none\}/);
});
test('Phiên 189: nút Kỹ năng ở cụm phải-trên dưới Túi hồ lô, không còn ở cụm phải-dưới', () => {
  const hm = readFileSync(new URL('../js/ui/hudMenu.js', import.meta.url), 'utf8'), dk = readFileSync(new URL('../js/ui/dock.js', import.meta.url), 'utf8');
  assert.match(hm, /hm-skillrow/); assert.match(hm, /kind === 'kynang'/); assert.match(dk, /b\.id !== 'kynang'/);
});
test('Phiên 192: cung tròn chiêu — không hai nút nào chồng nhau, không chồng hàng đáy, thu nhỏ khi màn thấp', () => {
  for (const base of [48, 56, 64, 80, 92]) for (const f of [1, 0.8, 0.55]) {
    const { pts } = arcPoints(38, base, f, 58), keys = Object.keys(pts);   // Phiên 195: truyền m = 58 (đường kính nút hàng đáy) — Phiên 193 thêm tham số này; trước đây test gọi không có m nên không tránh hàng đáy
    assert.deepEqual(keys.sort(), Object.keys(ARC_POS).sort());
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const a = pts[keys[i]], b = pts[keys[j]]; assert.ok(Math.hypot(a.dx - b.dx, a.dy - b.dy) >= (a.s + b.s) / 2, `${keys[i]}-${keys[j]} base=${base} f=${f}`); }
    for (const k of keys) { const p = pts[k]; assert.ok(Math.hypot(p.dx, p.dy) >= 38 + p.s / 2, 'chồng nút Đánh thường ' + k); assert.ok(p.dy > 0 && p.dx <= 0 + 1e-6, 'phải ở phía trên-trái ' + k); }
    // hàng đáy: Thương (cột 6) và Nhảy (cột 5), mỗi nút ~58px, cách nhau 8px, tâm ở độ cao 0
    for (const k of ['1', '2', '3']) for (const cxr of [-(38 + 8 + 29), -(38 + 8 + 29 + 66)]) { const p = pts[k]; assert.ok(Math.hypot(p.dx - cxr, p.dy) >= p.s / 2 + 29 - 1, `chồng hàng đáy ${k} ${cxr}`); }
  }
  assert.ok(arcPoints(38, 64, 0.55).up < arcPoints(38, 64, 1).up);
  assert.equal(fitFactor(10000, 38, 64), 1); assert.equal(fitFactor(10, 38, 64), 0.55);
  const f = fitFactor(100, 38, 64); assert.ok(f >= 0.55 && f < 1 && (arcPoints(38, 64, f).up <= 100 || f === 0.55));
  assert.match(ARC_CSS, /data-slot="A"\]\{grid-column:7!important/); assert.match(ARC_CSS, /#hs-bar \.hs-b\{position:fixed!important/);
});
test('Phiên 192: btnScale.js nạp bố cục cung tròn', () => {
  const bs = readFileSync(new URL('../js/ui/btnScale.js', import.meta.url), 'utf8'); assert.match(bs, /initActionArc/);
});
test('Phiên 195 (mục 2): khu luyện tập — nút chiêu theo HỆ ĐANG TẬP, không cần Hệ người chơi', () => {
  const hs = readFileSync(new URL('../js/ui/heSkill.js', import.meta.url), 'utf8');
  assert.match(hs, /const zoneHe = \(\) => \(inLuyen\(\) \? \(LGT\.luyenChieu\.he \|\| null\) : null\)/);
  assert.match(hs, /sync\(\); if \(inLuyen\(\)\) return luyenCast\(slot(?:, swipe)?\);\s*\n(?:\s*if \(inArena\(\)\)[^\n]*\n)?\s*if \(!rt\) return false;/);   // luyện tập không đòi runtime chiêu của người chơi
  assert.match(hs, /showBar = \(!!rt \|\| inLuyen\(\)\)/);
});
