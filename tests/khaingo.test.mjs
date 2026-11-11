// Test Lễ Khai Ngộ (G2.4, phần logic). Chạy: node --test tests/khaingo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { KHAI_NGO } from '../js/data/skillCfg.js';
import { HE_LIST } from '../js/data/elements.js';
import { canKhaiNgo, loadHe, costOf, createKhaiNgo } from '../js/world/khaiNgo.js';
import { skillFor } from '../js/world/skillCatalog.js';

test('số liệu TẠM đúng GDD: Tu Vi 10, dùng thử 60 giây, Tái Khai Ngộ 20 lá', () => {
  assert.equal(KHAI_NGO.tuViMin, 10); assert.equal(KHAI_NGO.trialSec, 60); assert.equal(KHAI_NGO.taiKhaiLa, 20);
  assert.ok(Object.isFrozen(KHAI_NGO));
});
test('canKhaiNgo: mốc 10, đầu vào lạ → false', () => {
  assert.equal(canKhaiNgo(9), false); assert.equal(canKhaiNgo(10), true); assert.equal(canKhaiNgo(150), true);
  for (const bad of [null, undefined, 'abc', NaN, -5]) assert.equal(canKhaiNgo(bad), false, String(bad));
});
test('loadHe: đọc Hệ lưu, bỏ ngoặc kép, lạ → null', () => {
  assert.equal(loadHe('moc'), 'moc'); assert.equal(loadHe('"kim"'), 'kim'); assert.equal(loadHe('THUY'), 'thuy');
  for (const bad of [null, undefined, '', 'rong', 5, {}]) assert.equal(loadHe(bad), null, String(bad));
});
test('costOf: miễn phí lần đầu, 20 lá khi đổi sang Hệ khác', () => {
  assert.equal(costOf(null, 'kim'), 0); assert.equal(costOf('kim', 'kim'), 0); assert.equal(costOf('kim', 'moc'), 20);
  assert.equal(costOf('kim', 'xyz'), 0);
});
test('chưa đủ Tu Vi 10 thì không ngồi được', () => {
  const k = createKhaiNgo({ tuvi: 9 });
  assert.deepEqual(k.sit('kim', 0), { ok: false, reason: 'chua-du-tu-vi', need: 10 });
  assert.equal(k.state, 'idle');
});
test('ngồi vào bồ đoàn đủ 5 Hệ, mỗi Hệ dùng thử được Skill 1 đúng của Hệ đó', () => {
  for (const he of HE_LIST) {
    const k = createKhaiNgo({ tuvi: 10 });
    const s = k.sit(he, 100); assert.equal(s.ok, true); assert.equal(s.trialLeft, 60);
    assert.equal(k.state, 'trial'); assert.equal(k.seatHe, he);
    assert.equal(k.trialSkill().id, skillFor(he, 1).id);
    const r = k.tryTrial(101); assert.equal(r.ok, true, he); assert.equal(r.skill.he, he); assert.equal(r.skill.slot, 1);
  }
});
test('Hệ lạ / đã xong: sit bị từ chối', () => {
  const k = createKhaiNgo({ tuvi: 10 });
  assert.equal(k.sit('lua', 0).reason, 'khong-co-he');
  k.sit('kim', 0); k.confirm({});
  assert.equal(k.sit('moc', 1).reason, 'da-xong');
});
test('đồng hồ dùng thử: 60 giây, hết giờ thì không dùng thử nữa nhưng vẫn xác nhận được', () => {
  const k = createKhaiNgo({ tuvi: 10 });
  k.sit('hoa', 10);
  assert.equal(k.trialLeft(10), 60); assert.equal(k.trialLeft(40), 30); assert.equal(k.trialActive(69.9), true);
  assert.equal(k.trialLeft(70), 0); assert.equal(k.trialActive(70), false);
  assert.deepEqual(k.tryTrial(70), { ok: false, reason: 'het-gio' });
  const c = k.confirm({}); assert.equal(c.ok, true); assert.equal(c.he, 'hoa');
});
test('dùng thử có hồi chiêu thật; ngồi bồ đoàn khác thì làm mới giờ và hồi chiêu', () => {
  const k = createKhaiNgo({ tuvi: 10 });
  k.sit('kim', 0);
  const a = k.tryTrial(1); assert.equal(a.ok, true);
  const b = k.tryTrial(2); assert.equal(b.ok, false); assert.equal(b.reason, 'hoi-chieu'); assert.ok(b.left > 0);
  const again = k.sit('kim', 30); assert.equal(again.again, true); assert.equal(again.trialLeft, 30);   // ngồi lại đúng chỗ: không reset
  const other = k.sit('thuy', 30); assert.equal(other.trialLeft, 60); assert.equal(k.seatHe, 'thuy');
  assert.equal(k.tryTrial(30).ok, true);                                                                // hồi chiêu của Hệ mới là của Hệ mới
});
test('đứng dậy: bỏ chọn, không xác nhận được', () => {
  const k = createKhaiNgo({ tuvi: 10 });
  k.sit('tho', 0); assert.equal(k.standUp(), 'idle'); assert.equal(k.seatHe, null);
  assert.equal(k.tryTrial(1).reason, 'chua-ngoi'); assert.equal(k.confirm({}).reason, 'chua-ngoi');
  assert.equal(k.trialSkill(), null);
});
test('xác nhận lần đầu: miễn phí, không reset', () => {
  const k = createKhaiNgo({ tuvi: 10, he: null });
  k.sit('moc', 0);
  assert.deepEqual(k.confirm({ laBoDe: 0 }), { ok: true, he: 'moc', cost: 0, reset: false });
  assert.equal(k.state, 'done'); assert.equal(k.chosen, 'moc');
});
test('Tái Khai Ngộ: đổi Hệ tốn 20 lá bồ đề, thiếu thì từ chối, đủ thì reset kỹ năng', () => {
  const k = createKhaiNgo({ tuvi: 40, he: 'kim' });
  k.sit('thuy', 0);
  assert.deepEqual(k.confirm({ laBoDe: 19 }), { ok: false, reason: 'thieu-la', need: 20, have: 19 });
  assert.equal(k.state, 'trial');                                                // thất bại không mất chỗ ngồi
  assert.deepEqual(k.confirm({ laBoDe: 20 }), { ok: true, he: 'thuy', cost: 20, reset: true });
});
test('chọn lại đúng Hệ đang có: từ chối, không tốn lá', () => {
  const k = createKhaiNgo({ tuvi: 40, he: 'hoa' });
  k.sit('hoa', 0); assert.deepEqual(k.confirm({ laBoDe: 99 }), { ok: false, reason: 'cung-he' });
});
test('laBoDe lạ (chữ, âm, thiếu) được coi là 0', () => {
  for (const bad of [undefined, null, 'x', -3, NaN]) {
    const k = createKhaiNgo({ tuvi: 40, he: 'kim' }); k.sit('moc', 0);
    assert.equal(k.confirm({ laBoDe: bad }).reason, 'thieu-la', String(bad));
  }
  const k = createKhaiNgo({ tuvi: 40, he: 'kim' }); k.sit('moc', 0); assert.equal(k.confirm().reason, 'thieu-la');
});
test('đầu vào hỏng không làm sập', () => {
  for (const bad of [null, undefined, 'x', 5, []]) assert.doesNotThrow(() => createKhaiNgo(bad));
  const k = createKhaiNgo(null); assert.equal(k.sit('kim', 0).ok, false);
});
