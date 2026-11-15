import test from 'node:test';
import assert from 'node:assert/strict';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';
import { buffDuration, buffDamageMul, buffKind, buffNote, createBuffs, DEFAULT_DUR } from '../js/world/skillBuff.js';

const sup = COMBAT_SKILLS.filter((s) => !(s.heSo > 0));
const byId = (id) => COMBAT_SKILLS.find((s) => s.id === id);

test('mọi chiêu hỗ trợ có thời gian hiệu lực 1..30 giây và loại hiệu lực hợp lệ', () => {
  assert.ok(sup.length >= 10, 'có ít nhất 10 chiêu hỗ trợ');
  for (const s of sup) { const d = buffDuration(s); assert.ok(d >= 1 && d <= 30, s.id); assert.ok(['tang-dame', 'phong-thu', 'hoi-sinh', 'an-than', 'khong-che', 'khac'].includes(buffKind(s)), s.id); assert.match(buffNote(s, 3), /Lv3/); }
});
test('thời gian: lấy fx.dur, rồi dur trong khối con, rồi mặc định', () => {
  assert.equal(buffDuration(byId('kim_2')), 10);
  assert.equal(buffDuration(byId('moc_2')), 4, 'anThan.dur');
  assert.equal(buffDuration(byId('thuy_2')), 5, 'hoiSinhLuc.dur');
  assert.equal(buffDuration({ fx: {} }), DEFAULT_DUR);
  assert.equal(buffDuration(null), DEFAULT_DUR);
  assert.equal(buffDuration({ fx: { dur: 999 } }), 30, 'kẹp trần');
});
test('chỉ Cuồng Long Phẫn Nộ tăng sát thương thật (+40%); chiêu khác = 1', () => {
  assert.equal(buffDamageMul(byId('hoa_2')), 1.4);
  assert.equal(buffKind(byId('hoa_2')), 'tang-dame');
  for (const s of sup.filter((x) => x.id !== 'hoa_2')) assert.equal(buffDamageMul(s), 1, s.id);
  assert.match(buffNote(byId('hoa_2'), 1), /\+40%/);
  assert.match(buffNote(byId('kim_2'), 1), /biết đánh trả/, 'chiêu phòng thủ nói thật là chưa có tác dụng lên trận đánh');
});
test('hiệu lực chạy đúng giờ: bật, làm mới không cộng dồn, hết hạn', () => {
  const b = createBuffs(), s = byId('hoa_2');
  assert.equal(b.damageMul(0), 1);
  const r = b.start(s, 2, 100); assert.deepEqual(r, { until: 108, dur: 8, mul: 1.4 });
  assert.equal(b.damageMul(104), 1.4); assert.equal(b.left('hoa_2', 104), 4);
  b.start(s, 2, 105); assert.equal(b.count, 1, 'bấm lại chỉ làm mới'); assert.equal(b.damageMul(105), 1.4);
  assert.equal(b.damageMul(113.1), 1); assert.equal(b.left('hoa_2', 113.1), 0);
  assert.equal(b.start(null, 1, 0), null); assert.equal(b.start({}, 1, 0), null);
});
test('dữ liệu lạ không làm sập', () => {
  assert.equal(buffKind(undefined), 'khac'); assert.equal(buffDamageMul({ fx: { chiMang: 'x' } }), 1); assert.equal(buffDamageMul({ fx: { chiMang: -1 } }), 1);
  const b = createBuffs(); assert.equal(b.damageMul('abc'), 1); assert.equal(b.left('nope', NaN), 0);
});

import { readFileSync } from 'node:fs';
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('nối dây: thanh chiêu tung chiêu hỗ trợ thật, farm.js nhân hiệu lực, bong bóng dock tránh thanh chiêu', () => {
  const hs = src('js/ui/heSkill.js'), farm = src('js/ui/farm.js'), css = src('css/dock.css');
  assert.match(hs, /from '\.\.\/world\/skillBuff\.js'/); assert.match(hs, /castSupport\(slot, sk\)/); assert.match(hs, /LGT\.buffMul = /); assert.doesNotMatch(hs, /hiệu ứng sẽ mở ở bước sau/, 'không còn chặn chiêu hỗ trợ');
  assert.match(hs, /pointer-events:auto/, 'nút chiêu vẫn bấm được (Phiên 182)');
  assert.equal((farm.match(/\* buffMul\(\)/g) || []).length, 3, 'đánh thường + thương + chiêu đều nhân hiệu lực');
  assert.match(css, /var\(--hs-h,0px\)/);
});
