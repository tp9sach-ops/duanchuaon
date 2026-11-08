import test from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, COACH_DELAY_MS, loadCoach, saveCoach, advance, isVeteran, shouldStart, angleTo, edgeDistance, arrowPlan } from '../js/world/coach.js';

test('đúng 3 bước, mỗi bước có chữ ngắn và có chỗ chỉ', () => {
  assert.equal(STEPS.length, 3);
  assert.equal(new Set(STEPS.map((s) => s.id)).size, 3);
  for (const s of STEPS) { assert.ok(s.title && s.text.length > 20 && s.text.length < 220, s.id); assert.ok(s.targets.length > 0, s.id); }
  assert.ok(STEPS.find((s) => s.id === 'help').targets[0].includes('trogiup'));
});

test('lưu/đọc trạng thái, dữ liệu hỏng thì bắt đầu lại', () => {
  assert.deepEqual(loadCoach(null), { done: false, step: 0 });
  assert.deepEqual(loadCoach('rác {'), { done: false, step: 0 });
  assert.deepEqual(loadCoach('{"done":false,"step":9}'), { done: false, step: 0 });
  assert.deepEqual(loadCoach(saveCoach({ done: false, step: 2 })), { done: false, step: 2 });
  assert.equal(loadCoach(saveCoach({ done: true, step: 3 })).done, true);
});

test('chuyển bước: next đi tới hết thì xong; skip xong ngay; đã xong thì giữ nguyên', () => {
  let st = { done: false, step: 0 };
  st = advance(st, 'next'); assert.equal(st.step, 1);
  st = advance(st, 'next'); assert.equal(st.step, 2);
  st = advance(st, 'next'); assert.equal(st.done, true);
  assert.equal(advance(st, 'next'), st);
  assert.equal(advance({ done: false, step: 0 }, 'skip').done, true);
});

test('chỉ người mới mới thấy; chờ đủ thời gian sau khi HUD hiện; không đè lên bảng đang mở', () => {
  assert.equal(isVeteran({}), false);
  assert.equal(isVeteran({ tut: '1' }), true);
  assert.equal(isVeteran({ story: '{"a":1}' }), true);
  assert.equal(isVeteran({ gdUsed: '1' }), true);
  const ok = { hudVisible: true, sinceVisibleMs: COACH_DELAY_MS };
  assert.equal(shouldStart(ok), true);
  assert.equal(shouldStart({ ...ok, sinceVisibleMs: COACH_DELAY_MS - 1 }), false);
  assert.equal(shouldStart({ ...ok, hudVisible: false }), false);
  assert.equal(shouldStart({ ...ok, panelOpen: true }), false);
  assert.equal(shouldStart({ ...ok, veteran: true }), false);
  assert.equal(shouldStart({ ...ok, done: true }), false);
});

test('hình học mũi tên: góc, khoảng tới mép thẻ, ẩn khi quá gần', () => {
  assert.equal(angleTo({ x: 0, y: 0 }, { x: 10, y: 0 }), 0);
  assert.equal(angleTo({ x: 0, y: 0 }, { x: 0, y: 10 }), 90);
  assert.ok(Math.abs(angleTo({ x: 0, y: 0 }, { x: -10, y: 0 })) === 180);
  assert.equal(edgeDistance(200, 100, 0), 100);
  assert.equal(edgeDistance(200, 100, 90), 50);
  const card = { x: 200, y: 200, w: 200, h: 100 };
  const far = arrowPlan(card, { x: 600, y: 200, w: 40, h: 40 });
  assert.ok(far && far.deg === 0 && far.start > 100 && far.len >= 28 && far.len <= 140);
  assert.equal(arrowPlan(card, { x: 330, y: 200, w: 40, h: 40 }), null);
  assert.equal(arrowPlan(null, card), null);
});
