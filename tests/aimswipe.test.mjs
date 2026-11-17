// Phiên 198 (mục 2): CHIÊU THỨC LƯỚT TAY ĐỊNH HƯỚNG (js/world/aimSwipe.js) và việc nối vào js/ui/heSkill.js + js/ui/farm.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { swipeDir, isDirectional, hinhOf, pickInDir, SWIPE_PX } from '../js/world/aimSwipe.js';

test('swipeDir: lướt ngắn / dữ liệu lạ → null; lướt lên = phía trước camera; theo góc camera', () => {
  assert.equal(swipeDir(3, 3), null); assert.equal(swipeDir(NaN, 0), null); assert.equal(swipeDir(0, 0), null);
  const up = swipeDir(0, -60, 0); assert.ok(up && Math.abs(up.x) < 1e-9 && Math.abs(up.z + 1) < 1e-9, 'lên = −z khi yaw 0');
  assert.ok(Math.abs(Math.cos(up.ry) + 1) < 1e-9, 'ry khớp hướng (như facingOf)');
  const right = swipeDir(60, 0, 0); assert.ok(Math.abs(right.x - 1) < 1e-9 && Math.abs(right.z) < 1e-9);
  const turned = swipeDir(0, -60, Math.PI / 2); assert.ok(Math.abs(turned.x + 1) < 1e-9 && Math.abs(turned.z) < 1e-9, 'camera xoay 90° thì hướng "lên" xoay theo');
  assert.equal(swipeDir(30, 40, 0).len, 50); assert.ok(SWIPE_PX > 0);
});

test('isDirectional: vùng báo dạng đường/nón là định hướng; vòng tròn và id lạ thì không', () => {
  assert.equal(isDirectional('hoa_1'), true); assert.equal(hinhOf('hoa_1').kieu, 'duong');
  assert.equal(isDirectional('hoa_3'), true);
  assert.equal(isDirectional('hoa_2'), false); assert.equal(isDirectional('hoa_liethoa_4'), false);
  assert.equal(isDirectional('khong_co_chieu_nay'), false); assert.equal(hinhOf('khong_co_chieu_nay'), null);
});

test('pickInDir (đường): chỉ quái nằm trong hành lang theo hướng lướt, lấy con gần nhất', () => {
  const p = { x: 0, z: 0 }, hinh = { kieu: 'duong', dai: 8, rong: 1.2 };
  const mons = [{ uid: 'a', x: 0, z: 5 }, { uid: 'b', x: 0, z: 3 }, { uid: 'c', x: 5, z: 0 }, { uid: 'd', x: 0, z: -4 }, { uid: 'e', x: 3, z: 5 }];
  assert.equal(pickInDir(p, 0, mons, hinh).uid, 'b', 'hướng +z: b gần nhất trong hành lang');
  assert.equal(pickInDir(p, Math.PI / 2, mons, hinh).uid, 'c', 'hướng +x: chỉ c');
  assert.equal(pickInDir(p, Math.PI, mons, hinh).uid, 'd', 'hướng −z: chỉ d');
  assert.equal(pickInDir(p, -Math.PI / 2, mons, hinh), null, 'hướng −x: không có quái → không sát thương');
  assert.equal(pickInDir(p, 0, [{ uid: 'f', x: 0, z: 9 }], hinh), null, 'quá tầm');
  assert.equal(pickInDir(p, 0, [{ uid: 'f', x: 0, z: 9 }], hinh, () => 1.5).uid, 'f', 'thân to thì chạm tới');
});

test('pickInDir (nón / mặc định / dữ liệu lạ)', () => {
  const p = { x: 0, z: 0 }, non = { kieu: 'non', dai: 8, goc: 70 };
  const mons = [{ uid: 'a', x: 3, z: 5 }, { uid: 'b', x: 0, z: -4 }, { uid: 'c', x: 5, z: 0 }];
  assert.equal(pickInDir(p, 0, mons, non).uid, 'a', 'trong nón phía trước');
  assert.equal(pickInDir(p, 0, [{ uid: 'b', x: 0, z: -4 }, { uid: 'c', x: 5, z: 0 }], non), null, 'sau lưng / vuông góc: ngoài nón');
  assert.equal(pickInDir(p, 0, [{ uid: 'a', x: 0, z: 5 }], null).uid, 'a', 'thiếu số đo vùng → nón mặc định');
  assert.equal(pickInDir(p, NaN, mons, non), null); assert.equal(pickInDir(p, 0, null, non), null); assert.equal(pickInDir(null, 0, mons, non), null);
});

test('nối dây js/ui/heSkill.js + js/ui/farm.js: lướt nút chiêu → hướng thế giới theo camera → skillHitDir; không quái vẫn tung; giữ nguyên khu luyện tập', () => {
  const hs = readFileSync(new URL('../js/ui/heSkill.js', import.meta.url), 'utf8'), farm = readFileSync(new URL('../js/ui/farm.js', import.meta.url), 'utf8');
  assert.match(hs, /from '\.\.\/world\/aimSwipe\.js'/); assert.match(hs, /addEventListener\('pointermove'/); assert.match(hs, /cast\(s, swp\)/);
  assert.match(hs, /swipeDir\(swipe\.dx, swipe\.dy, LGT\.world && LGT\.world\.camera \? LGT\.world\.camera\.yaw : 0\)/); assert.match(hs, /isDirectional\(sk\.id\)\) return castDir\(slot, sk, sd\)/);
  assert.match(hs, /skillHitDir\(r\.heSo, sd\.ry, hinh(?:, sk\.id)?\)/); assert.match(hs, /Không có quái trong hướng lướt/);
  assert.match(hs, /sync\(\); if \(inLuyen\(\)\) return luyenCast\(slot(?:, swipe)?\);\s*\n(?:\s*if \(inArena\(\)\)[^\n]*\n)?\s*if \(!rt\) return false;/);
  assert.match(farm, /pick(?:All)?InDir\(p, ry, view\.mons, hinh, bodyOf\)/); assert.match(farm, /skillReady, skillHit, skillHitDir/);
});
