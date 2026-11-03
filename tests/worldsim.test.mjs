import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Chạy world.js thật trong tiến trình con với three.js giả (tests/sim/): không cần WebGL hay mạng.
test('world.js: lạy, ngồi, thiền, đứng dậy hoạt động đúng trong vòng lặp', () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sim');
  const out = execFileSync(process.execPath, ['--import', './reg.mjs', 'sim.mjs'], { cwd: dir, encoding: 'utf8', timeout: 60000 }).trim().split('\n').pop();
  const r = JSON.parse(out);
  assert.equal(r.bowOutside, 'outside', 'lạy ngoài sân bị từ chối');
  assert.equal(r.bowIn, true); assert.equal(r.modeBowing, 'bow'); assert.equal(r.afterBow, 'free', 'lạy tự kết thúc');
  assert.equal(r.sit, true); assert.equal(r.seated, 'sit'); assert.equal(r.seatPosOK, true); assert.equal(r.yOK, true);
  assert.equal(r.medMode, 'meditate'); assert.equal(r.afterStand, 'free'); assert.ok(Math.abs(r.standY - 1.14) < 0.02, 'đứng dậy về mặt sàn');
  assert.equal(r.med2mode, 'meditate', 'thiền khi đang đứng trong chánh điện tự chọn bồ đoàn');
  assert.equal(r.afterWalk, 'free', 'đi chỗ khác thì đứng dậy');
  assert.deepEqual(r.goToStands, ['meditate', 'free'], 'bấm chương khác thì đứng dậy');
});
