// Phiên 233 (mục 1): sửa CHỔI BỊ MỜ — cú đập chổi không được đụng chất liệu dùng chung với chổi cầm tay.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
test('broomFx: chổi khổng lồ dùng chất liệu RIÊNG (clone), hủy khi xong, không hạ opacity trên root.traverse', () => {
  const s = rd('js/ui/broomFx.js');
  assert.match(s, /function ownMaterials\(/); assert.match(s, /m\.clone\(\)/); assert.match(s, /for \(const m of s\.mats\) m\.dispose\(\)/);
  assert.match(s, /ownMaterials\(s\); for \(const m of s\.mats\) m\.opacity = p\.fade/);
  assert.doesNotMatch(s, /s\.root\.traverse\(\(o\) => \{ if \(o\.material/);
});
