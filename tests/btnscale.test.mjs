import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clampScale, scaleLabel, SCALE_DEF } from '../js/world/btnScale.js';
test('clampScale: kẹp 0.7–1.6, làm tròn 0.05, rác → 1', () => {
  assert.equal(clampScale(0.1), 0.7); assert.equal(clampScale(9), 1.6); assert.equal(clampScale('1.23'), 1.25);
  for (const v of ['', null, undefined, 'abc', NaN]) assert.equal(clampScale(v), SCALE_DEF);
  assert.equal(scaleLabel(1.3), '130%');
});
test('nối dây: --btn-k ở dock.css, main.js nạp btnScale, cụm chiêu dùng --btn-k', () => {
  const r = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  assert.match(r('../css/dock.css'), /scale\(var\(--btn-k,1\)\)/); assert.match(r('../js/main.js'), /initBtnScale/); assert.match(r('../js/ui/heSkill.js'), /var\(--btn-k,1\)/);
});
