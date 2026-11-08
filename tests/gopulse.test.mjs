// Nút "Dẫn đường" nhấp nháy (Phiên 68): việc mới nhấp nháy có thời hạn; người mới nhấp nháy tới khi bấm lần đầu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldPulse, pulseUntil, readUsed, PULSE_MS, USED_KEY } from '../js/world/goPulse.js';

const NOW = 1_000_000;

test('không có nút hoặc việc tự do: không bao giờ nhấp nháy', () => {
  assert.equal(shouldPulse({ hasButton: false, kind: 'story', until: NOW + 5, used: false, now: NOW }), false);
  assert.equal(shouldPulse({ hasButton: true, kind: 'free', until: NOW + 5, used: false, now: NOW }), false);
  assert.equal(shouldPulse({}), false);
});
test('việc mới: nhấp nháy trong PULSE_MS rồi tắt (người đã quen dùng Dẫn đường)', () => {
  const until = pulseUntil(NOW);
  assert.equal(until - NOW, PULSE_MS);
  assert.equal(shouldPulse({ hasButton: true, kind: 'journey', until, used: true, now: NOW + 1 }), true);
  assert.equal(shouldPulse({ hasButton: true, kind: 'journey', until, used: true, now: until - 1 }), true);
  assert.equal(shouldPulse({ hasButton: true, kind: 'journey', until, used: true, now: until }), false);
  assert.equal(shouldPulse({ hasButton: true, kind: 'daily', until: 0, used: true, now: NOW }), false);
});
test('người mới chưa từng bấm: nhấp nháy mãi tới khi bấm lần đầu', () => {
  assert.equal(shouldPulse({ hasButton: true, kind: 'story', until: 0, used: false, now: NOW }), true);
  assert.equal(shouldPulse({ hasButton: true, kind: 'story', until: 0, used: false, now: NOW + 3_600_000 }), true);
  assert.equal(shouldPulse({ hasButton: true, kind: 'story', until: 0, used: true, now: NOW }), false);
});
test('cờ đã bấm: chỉ chuỗi "1" mới tính; giá trị hỏng thì vẫn nhắc', () => {
  assert.equal(USED_KEY, 'lgt.gdUsed');
  assert.equal(readUsed('1'), true);
  for (const v of [null, undefined, '', '0', 'true', '{"a":1}']) assert.equal(readUsed(v), false, String(v));
});
