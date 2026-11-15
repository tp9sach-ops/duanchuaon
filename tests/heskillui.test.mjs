// Phiên 187: kiểm nối dây cụm nút chiêu (js/ui/heSkill.js + js/ui/luyenChieu.js). Không có DOM trong Node nên đọc mã nguồn để chống quên nối lại.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const hs = readFileSync(new URL('../js/ui/heSkill.js', import.meta.url), 'utf8');
const lc = readFileSync(new URL('../js/ui/luyenChieu.js', import.meta.url), 'utf8');
test('nút chiêu vẽ HÌNH (glyphOf) chứ không chỉ chữ cái', () => {
  assert.match(hs, /glyphOf/); assert.match(hs, /GLYPH_D/); assert.match(hs, /drawGlyphIcon/);
  for (const g of ['hoi', 'an', 'khien', 'toc', 'khoa', 'lao', 'tia', 'vung', 'chem', 'chon']) assert.match(hs, new RegExp(`\\b${g}: '`), g);
});
test('nút to theo cỡ chung --btn-k, bấm nhận cú chạm, có số giây hồi chiêu + ổ khóa', () => {
  assert.match(hs, /--hs-s:calc\(var\(--btn-k,1\)/); assert.match(hs, /#hs-bar\{[^}]*pointer-events:auto/); assert.match(hs, /\.hs-cdn/); assert.match(hs, /\.hs-lock/);
});
test('ở khu luyện tập nút chiêu tung được qua LGT.luyenChieu.castById, không khóa cấp', () => {
  assert.match(hs, /inLuyen\(\)\) return luyenCast/); assert.match(hs, /!zone && eff\(\) < SKILL_CAP\[s\]/);
  assert.match(lc, /castById/); assert.match(lc, /cdOf/); assert.match(lc, /LGT\.luyenChieu = \{ enter, leave, castById, cdOf/);
});
