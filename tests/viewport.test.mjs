import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, classify, bottomBar, keyboardOpen, hudScale, viewportState } from '../js/ui/viewportLogic.js';

test('phân loại kích thước: Z Fold bìa ngoài, iPhone, điện thoại lớn, Fold mở, máy tính', () => {
  assert.equal(classify(280, 653).size, 'xs'); assert.equal(classify(320, 568).size, 'xs');
  assert.equal(classify(390, 844).size, 'sm'); assert.equal(classify(430, 932).size, 'md');
  assert.equal(classify(768, 900).size, 'fold'); assert.equal(classify(1280, 720).size, 'lg');
  assert.equal(classify(360, 800).size, 'sm');
});

test('cờ: ngang, thấp, dài, vuông', () => {
  const land = classify(844, 390); assert.ok(land.landscape && land.short);
  assert.ok(classify(344, 880).tall); assert.ok(!classify(390, 844).tall);
  assert.ok(classify(880, 800).square); assert.ok(!classify(390, 844).square);
  assert.equal(classify(0, NaN).size, 'sm'); assert.equal(classify(undefined, undefined).landscape, false);
});

test('thanh công cụ trình duyệt ở dưới: tính khoảng đè; bàn phím ảo không tính', () => {
  assert.equal(bottomBar(800, { height: 750, offsetTop: 0 }), 50);
  assert.equal(bottomBar(800, { height: 800, offsetTop: 0 }), 0);
  assert.equal(bottomBar(800, { height: 450, offsetTop: 0 }), 0);   // bàn phím (>150px)
  assert.equal(bottomBar(800, undefined), 0); assert.equal(bottomBar(0, { height: 10 }), 0);
  assert.equal(bottomBar(800, { height: 760, offsetTop: 20 }), 20);
  assert.ok(keyboardOpen(800, { height: 450, offsetTop: 0 })); assert.ok(!keyboardOpen(800, { height: 750, offsetTop: 0 })); assert.ok(!keyboardOpen(800, undefined));
});

test('hệ số co giãn HUD nằm trong 0,78–1,12 và bằng 1 ở 390×700', () => {
  assert.equal(hudScale(390, 700), 1); assert.equal(hudScale(200, 300), 0.78); assert.equal(hudScale(2000, 2000), 1.12);
  assert.equal(clamp(5, 0, 3), 3); assert.equal(clamp(-1, 0, 3), 0);
});

test('viewportState ghi đủ biến và data-*; bàn phím mở thì không coi là màn thấp', () => {
  const s = viewportState({ innerW: 390, innerH: 800, vv: { width: 390, height: 750, offsetTop: 0 } });
  assert.equal(s.vars['--vv-bar'], '50px'); assert.equal(s.vars['--vvw'], '390px'); assert.equal(s.data.vp, 'sm'); assert.equal(s.data.orient, 'portrait'); assert.equal(s.data.kbd, 'false');
  const k = viewportState({ innerW: 844, innerH: 390, vv: { width: 844, height: 200, offsetTop: 0 } });
  assert.equal(k.data.kbd, 'true'); assert.equal(k.data.short, 'false');
  const d = viewportState(); assert.equal(d.data.vp, 'sm'); assert.ok(Number(d.vars['--hud-s']) >= 0.78);
});
