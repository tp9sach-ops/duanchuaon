import test from 'node:test';
import assert from 'node:assert/strict';
import { FARM_CFG } from '../js/data/monsters.js';
import { emptyAuto, loadAuto, autoLeft, addAutoTime, nextAction } from '../js/world/autoHunt.js';

const T0 = Date.UTC(2026, 10, 11, 5, 0, 0), DAY = 86400e3;

test('trần 60 phút/ngày: cộng dồn tới trần rồi báo hết giờ; sang ngày (giờ VN) có lại', () => {
  let a = emptyAuto(T0), out = false; assert.equal(autoLeft(a, T0), 3600); assert.equal(FARM_CFG.autoSecNgay, 3600);
  for (let i = 0; i < 3600; i++) { const r = addAutoTime(a, 1, T0); a = r.state; out = r.out; }
  assert.equal(out, true); assert.equal(autoLeft(a, T0), 0);
  assert.equal(addAutoTime(a, 5, T0).state.secs, 3600, 'không vượt trần');
  assert.equal(autoLeft(a, T0 + DAY), 3600, 'ngày mới đếm lại');
});
test('mỗi nhịp kẹp 0..5 giây, đầu vào lạ không thành NaN, dữ liệu hỏng về rỗng', () => {
  assert.equal(addAutoTime(emptyAuto(T0), 999, T0).state.secs, 5); assert.equal(addAutoTime(emptyAuto(T0), -3, T0).state.secs, 0); assert.equal(addAutoTime(emptyAuto(T0), 'x', T0).state.secs, 0);
  for (const bad of [null, 7, 'x{', [], { day: 'sai', secs: 50 }, { day: '2026-11-11', secs: 'abc' }]) assert.ok(Number.isFinite(loadAuto(bad, T0).secs));
  assert.deepEqual(loadAuto(JSON.stringify({ day: '2026-11-11', secs: 120 }), T0), { day: '2026-11-11', secs: 120 });
});
test('chọn đòn: gần → Thương, xa → Ném đá, ngoài 15 m hoặc đang hồi chiêu → không làm gì', () => {
  const b = { body: 0.55, stoneReady: true, spearReady: true };
  assert.equal(nextAction({ ...b, gap: 2 }), 'spear'); assert.equal(nextAction({ ...b, gap: 10 }), 'stone'); assert.equal(nextAction({ ...b, gap: 15 }), 'stone');
  assert.equal(nextAction({ ...b, gap: 15.1 }), null); assert.equal(nextAction({ ...b, gap: 2, spearReady: false }), 'stone');
  assert.equal(nextAction({ ...b, gap: 2, spearReady: false, stoneReady: false }), null); assert.equal(nextAction({ ...b, gap: NaN }), null); assert.equal(nextAction({}), null);
});
