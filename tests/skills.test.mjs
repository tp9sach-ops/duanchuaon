import test from 'node:test';
import assert from 'node:assert/strict';
import { khinhLevel, jumpHeight, airTime, canJump, createJump, KHINH_THAN_CAO, MAX_BAC, GRAVITY } from '../js/world/skills.js';
import { emptyStory, loadStory, apply } from '../js/world/story.js';

test('khinhLevel: chưa xong cốt truyện = 0, dữ liệu lạ = 0', () => {
  assert.equal(khinhLevel(emptyStory()), 0);
  for (const bad of [null, undefined, {}, { skills: {} }, { skills: { khinhthan: 'x' } }, { skills: { khinhthan: NaN } }]) assert.equal(khinhLevel(bad), 0);
  assert.equal(khinhLevel({ skills: { khinhthan: 99 } }), MAX_BAC);
  assert.equal(khinhLevel({ skills: { khinhthan: -3 } }), 0);
});
test('hoàn thành chuỗi tưới cây → khinhLevel = 1 (nối đúng với story.js)', () => {
  let s = loadStory({ step: 'water2', waters: 2, lastWater: 0 });
  assert.equal(khinhLevel(s), 0);
  const r = apply(s, { type: 'water', near: true, now: 100000 });
  assert.equal(r.unlocked, 'khinhthan1');
  assert.equal(khinhLevel(r.story), 1);
  assert.equal(khinhLevel(loadStory(JSON.stringify(r.story))), 1);   // lưu rồi đọc lại vẫn còn
});
test('bảng chiều cao tăng dần, bậc 0 không nhảy', () => {
  assert.equal(jumpHeight(0), 0);
  for (let i = 1; i < KHINH_THAN_CAO.length; i++) assert.ok(KHINH_THAN_CAO[i] > KHINH_THAN_CAO[i - 1]);
  assert.equal(jumpHeight(1), 1.1); assert.equal(jumpHeight(999), KHINH_THAN_CAO[MAX_BAC]); assert.equal(airTime(0), 0);
});
test('canJump chỉ khi đã mở, đang đứng tự do, không mở bảng/hộp thoại', () => {
  assert.equal(canJump({ level: 0 }), false);
  assert.equal(canJump({ level: 1 }), true);
  for (const mode of ['toSeat', 'sit', 'meditate', 'chant', 'beads', 'bow']) assert.equal(canJump({ level: 1, mode }), false);
  assert.equal(canJump({ level: 1, panelOpen: true }), false); assert.equal(canJump({ level: 1, dialogOpen: true }), false);
});
test('cú nhảy: lên đúng độ cao, rơi về 0, không nhảy chồng', () => {
  const j = createJump(); assert.equal(j.start(0), false); assert.equal(j.start(1.1), true); assert.equal(j.start(1.1), false);
  let peak = 0, t = 0; while (j.air && t < 5) { peak = Math.max(peak, j.step(1 / 60)); t += 1 / 60; }
  assert.ok(Math.abs(peak - 1.1) < 0.05, 'đỉnh ~1,1 m: ' + peak);
  assert.ok(Math.abs(t - airTime(1.1)) < 0.05, 'thời gian ~ airTime: ' + t);
  assert.equal(j.y, 0); assert.equal(j.air, false); assert.equal(j.start(1.1), true);
});
test('khung hình chậm / dt lạ không làm kẹt hay bay mất', () => {
  const j = createJump(); j.start(1.6);
  for (const dt of [0.2, 0.2, 0.2, NaN, -1, 5, 5]) j.step(dt);
  assert.ok(Number.isFinite(j.y) && j.y >= 0); for (let i = 0; i < 20; i++) j.step(0.25); assert.equal(j.air, false); assert.equal(j.y, 0);
  assert.equal(GRAVITY > 0, true);
});
