// Nội thất (Phiên 41, bước 1): danh mục 50 món, mua bằng lá bồ đề, đặt/cất, luật va chạm và lối vào cửa.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE, furnitureById, MAX_PLACED, emptyFurni, loadFurni, freeCount, buyItem, footprint, toFurniture, canPlace, placeItem, pickUp } from '../js/world/furniture.js';
import { emptyLeaf } from '../js/world/merit.js';
import { roomFor } from '../js/world/interior.js';

const rich = (n = 500) => { let l = emptyLeaf(); l = { ...l, la: n, spent: n * 10 }; return l; };

test('danh mục đúng 50 món, id không trùng, kích thước/giá hợp lý, vừa mọi phòng', () => {
  assert.equal(FURNITURE.length, 50);
  assert.equal(new Set(FURNITURE.map((f) => f.id)).size, 50);
  for (const f of FURNITURE) { assert.ok(f.ten && f.kind && f.w > 0 && f.d > 0 && f.h > 0 && Number.isInteger(f.gia) && f.gia >= 1, f.id); assert.ok(f.w <= roomFor(0).w - 1 && f.d <= roomFor(0).d - 1, `${f.id} quá to cho phòng nhỏ nhất`); }
});

test('mua món: trừ đúng lá, thiếu lá thì không mua, không sửa đầu vào', () => {
  const l0 = rich(10), s0 = emptyFurni(), r = buyItem(l0, s0, 'giuong-go');
  assert.ok(r.ok); assert.equal(r.leaf.la, 4); assert.equal(r.st.owned['giuong-go'], 1); assert.equal(l0.la, 10); assert.deepEqual(s0.owned, {});
  assert.equal(buyItem(rich(5), s0, 'giuong-go').reason, 'poor');
  assert.equal(buyItem(l0, s0, 'khong-co').reason, 'unknown');
  const t = buyItem(rich(100), s0, 'ban-tra'); assert.equal(t.leaf.la, 97);
});

test('đặt và cất: phải có trong túi; cất không mất món', () => {
  let l = rich(), s = emptyFurni();
  assert.equal(placeItem(s, 0, 'giuong-don', -1, -1).reason, 'none');
  s = buyItem(l, s, 'giuong-don').st;
  assert.equal(freeCount(s, 'giuong-don'), 1);
  const p = placeItem(s, 0, 'giuong-don', -1.5, -1.2); assert.ok(p.ok); s = p.st;
  assert.equal(freeCount(s, 'giuong-don'), 0); assert.equal(s.placed.length, 1);
  assert.equal(placeItem(s, 0, 'giuong-don', 1, -1).reason, 'none');
  const u = pickUp(s, s.placed[0].uid); assert.ok(u.ok); assert.equal(freeCount(u.st, 'giuong-don'), 1); assert.equal(pickUp(u.st, 999).ok, false);
});

test('luật đặt: ngoài phòng, chặn cửa, đè nhau; món không đặc được đè', () => {
  const R = roomFor(0), st = { ...emptyFurni(), placed: [{ uid: 1, id: 'giuong-go', x: -1, z: -1, rot: 0 }] };
  assert.equal(canPlace(0, [], 'giuong-go', R.w / 2, 0).reason, 'out');
  assert.equal(canPlace(0, [], 'tu-quan-ao', 0, R.d / 2 - 0.5).reason, 'door');
  assert.ok(canPlace(0, [], 'tu-quan-ao', 1.8, R.d / 2 - 0.5).ok, 'lệch cửa thì được');
  assert.equal(canPlace(0, st.placed, 'ban-an', -1, -1).reason, 'overlap');
  assert.ok(canPlace(0, st.placed, 'tham-do', -1, -1).ok, 'thảm đè lên giường được');
  assert.ok(canPlace(0, st.placed, 'ghe-go', -1, -1).ok, 'ghế không đặc');
  assert.ok(canPlace(0, [], 'ban-tho', 0, R.d / 2 - 0.7, 1).reason === 'door', 'xoay vẫn tính lối vào');
  assert.equal(canPlace(0, st.placed, 'giuong-go', -1, -1, 0, 1).ok, true, 'dời chính nó thì không tự đè');
  assert.equal(canPlace(0, [], 'khong-co', 0, 0).reason, 'unknown'); assert.equal(canPlace(0, [], 'ghe-go', NaN, 0).ok, false);
});

test('xoay đổi chỗ rộng/sâu; toFurniture đủ trường', () => {
  const f = furnitureById('giuong-go'); assert.deepEqual(footprint(f, 1), { rw: f.d, rd: f.w }); assert.deepEqual(footprint(f, 2), { rw: f.w, rd: f.d });
  const o = toFurniture({ uid: 3, id: 'giuong-go', x: 1, z: 2, rot: 1 }); assert.equal(o.rw, f.d); assert.equal(o.ry, Math.PI / 2); assert.equal(o.kind, 'bed'); assert.equal(toFurniture({ id: 'x' }), null);
});

test('giới hạn số món theo cấp nhà', () => {
  const placed = Array.from({ length: MAX_PLACED[0] }, (_, i) => ({ uid: i + 1, id: 'ghe-dau', x: 0, z: 0, rot: 0 }));
  assert.equal(canPlace(0, placed, 'ghe-dau', 0, 0).reason, 'full');
  assert.ok(canPlace(1, placed, 'ghe-dau', 0, 0).ok);
  assert.ok(MAX_PLACED.every((n, i) => i === 0 || n > MAX_PLACED[i - 1]));
});

test('loadFurni: rác → rỗng; bỏ món lạ; không đặt quá số đã mua; uid không trùng', () => {
  for (const bad of [null, undefined, '{x', '[]', 5]) assert.deepEqual(loadFurni(bad), emptyFurni());
  const s = loadFurni({ owned: { 'ghe-go': 1, la: 3 }, placed: [{ uid: 1, id: 'ghe-go', x: 0, z: 0, rot: 9 }, { uid: 2, id: 'ghe-go', x: 1, z: 0 }, { uid: 3, id: 'la', x: 0, z: 0 }] });
  assert.deepEqual(s.owned, { 'ghe-go': 1 }); assert.equal(s.placed.length, 1); assert.equal(s.placed[0].rot, 3); assert.ok(s.seq >= 1);
  assert.deepEqual(loadFurni(JSON.stringify(s)), s);
});
