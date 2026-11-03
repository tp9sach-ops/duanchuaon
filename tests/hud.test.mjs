import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/placements.js';
import { cleanProfile, loadProfile, saveProfile, initialOf, robeCss, insideHall, COURTYARD_POINT, KEYS } from '../js/ui/hudLogic.js';
import { hairById, HAIR_STYLES } from '../js/world/avatarLogic.js';

import { blocked } from '../js/world/layout.js';

const fake = (init = {}) => { const m = { ...init }; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };

test('hồ sơ: tên sạch ≤ 20 ký tự, màu/kiểu đầu lạ về mặc định', () => {
  assert.deepEqual(cleanProfile({}), { name: 'Khách', color: 'nau', hair: 'troc' });
  assert.deepEqual(cleanProfile({ name: '  Minh   An ', color: 'lam', hair: 'bui' }), { name: 'Minh An', color: 'lam', hair: 'bui' });
  assert.equal(cleanProfile({ color: 'xx', hair: 'yy' }).color, 'nau'); assert.equal(cleanProfile({ hair: 'yy' }).hair, 'troc');
  assert.equal(Array.from(cleanProfile({ name: 'A'.repeat(60) }).name).length, 20);
  assert.equal(cleanProfile({ name: 'https://x.vn' }).name, 'Khách');
});
test('lưu/đọc hồ sơ qua storage; lần đầu has=false; sau khi lưu has=true; khóa đúng tên', () => {
  const st = fake(); assert.equal(loadProfile(st).has, false);
  const saved = saveProfile(st, { name: 'Giang', color: 'vang', hair: 'bui' });
  assert.deepEqual(saved, { name: 'Giang', color: 'vang', hair: 'bui' });
  assert.equal(st.m[KEYS.name], 'Giang'); assert.equal(st.m['lgt.color'], 'vang'); assert.equal(st.m['lgt.hair'], 'bui');
  assert.deepEqual(loadProfile(st), { name: 'Giang', color: 'vang', hair: 'bui', has: true });
});
test('storage hỏng (chế độ riêng tư) không làm vỡ trang', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(loadProfile(bad).name, 'Khách'); assert.doesNotThrow(() => saveProfile(bad, { name: 'A' }));
});
test('chữ cái đầu viết hoa kể cả tiếng Việt có dấu; màu áo là #rrggbb', () => {
  assert.equal(initialOf('minh'), 'M'); assert.equal(initialOf('Đức'), 'Đ'); assert.equal(initialOf('ánh'), 'Á'); assert.equal(initialOf(''), 'K');
  assert.match(robeCss('nau'), /^#[0-9a-f]{6}$/); assert.equal(robeCss('xxx'), robeCss('nau'));
});
test('kiểu đầu: có 2 kiểu, mặc định đầu trọc', () => { assert.equal(HAIR_STYLES.length, 2); assert.equal(hairById('lạ').id, 'troc'); assert.equal(hairById('bui').id, 'bui'); });
test('trong/ngoài chánh điện: sân và cổng là ngoài, trên nền điện là trong, bậc thềm tính ngoài', () => {
  assert.equal(insideHall({ x: 0, z: 54 }), false); assert.equal(insideHall({ x: 3, z: -4 }), false); assert.equal(insideHall({ x: 0, z: -15 }), false);
  assert.equal(insideHall({ x: 0, z: -26.5 }), true); assert.equal(insideHall({ x: 10, z: -22 }), true); assert.equal(insideHall({ x: 25, z: -22 }), false);
});
test('điểm "Ra sân ngắm cảnh" không bị chặn và là ngoài chánh điện', () => {
  assert.equal(blocked(COURTYARD_POINT.x, COURTYARD_POINT.z), false); assert.equal(insideHall(COURTYARD_POINT), false);
});
