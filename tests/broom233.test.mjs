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

// Mục 2: đôi dép lào khi dùng chổi (Phiên 233).
test('dép lào: module gắn vào xương footL/footR, người chơi + người khác (cầm hoặc cưỡi chổi) đều mang, dọn khi rời', () => {
  const m = rd('js/ui/slipperMesh.js'), it = rd('js/ui/items.js'), rg = rd('js/ui/remoteGear.js');
  assert.match(m, /export function applySlippers\(/); assert.match(m, /'footL'/); assert.match(m, /'footR'/); assert.match(m, /export function buildSlipper\(/);
  assert.match(it, /applySlippers\(av, av\.__slip \|\| \(av\.__slip = \{\}\), broomOn\(\)\)/);   // chỗ nhớ gắn theo TỪNG nhân vật (dựng lại nhân vật thì dép gắn lại)
  assert.match(rg, /applySlippers\(av, s\.slip, !!g\.broom \|\| g\.ride === 'choi'\)/); assert.match(rg, /applySlippers\(av, s\.slip, false\)/);
});
