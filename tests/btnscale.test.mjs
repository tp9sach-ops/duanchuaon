import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clampScale, scaleLabel, SCALE_DEF, isPhoneLayout } from '../js/world/btnScale.js';
test('clampScale: kẹp 0.7–1.6, làm tròn 0.05, rác → 1', () => {
  assert.equal(clampScale(0.1), 0.7); assert.equal(clampScale(9), 1.6); assert.equal(clampScale('1.23'), 1.25);
  for (const v of ['', null, undefined, 'abc', NaN]) assert.equal(clampScale(v), SCALE_DEF);
  assert.equal(scaleLabel(1.3), '130%');
});
test('nối dây: --btn-k ở dock.css, main.js nạp btnScale, cụm chiêu dùng --btn-k', () => {
  const r = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  assert.match(r('../css/dock.css'), /scale\(var\(--btn-k,1\)\)/); assert.match(r('../js/main.js'), /initBtnScale/); assert.match(r('../js/ui/heSkill.js'), /var\(--btn-k,1\)/);
});
test('Phiên 204: nút ⚙ nằm dưới bản đồ nhỏ trên điện thoại', () => {
  assert.equal(isPhoneLayout({ coarse: true, w: 1280 }), true);   // máy tính bảng cảm ứng cũng tính là điện thoại (có cần đi)
  assert.equal(isPhoneLayout({ coarse: false, w: 390 }), true);
  assert.equal(isPhoneLayout({ coarse: false, w: 899 }), true);
  assert.equal(isPhoneLayout({ coarse: false, w: 900 }), false);
  assert.equal(isPhoneLayout(), false); assert.equal(isPhoneLayout({ w: 'abc' }), false);
  const ui = readFileSync(new URL('../js/ui/btnScale.js', import.meta.url), 'utf8');
  assert.match(ui, /mm\.after\(gear\)/);                                  // chèn liền sau bản đồ nhỏ
  assert.match(ui, /\.hud-tl #bs-gear\{position:static/);                  // trong cột trái-trên: không còn position:fixed đè cần đi
});
