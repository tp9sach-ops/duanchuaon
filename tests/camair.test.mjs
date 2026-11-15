// Phiên 199 (mục 1 khinh công): camera bám độ cao khi nhân vật bay LÊN — không tụt sau, nhân vật không trồi khỏi giữa khung.
import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { FLY_CFG, camAirTarget } from '../js/world/glide.js';
import { createJump, jumpHeight, MAX_BAC } from '../js/world/skills.js';

test('camAirTarget: đang xuống/đứng yên không cộng phần dẫn; dữ liệu lạ → 0; đang lên cộng vy/k', () => {
  assert.equal(camAirTarget(5, -3), 5); assert.equal(camAirTarget(0, 0), 0); assert.equal(camAirTarget(NaN, NaN), 0);
  assert.ok(Math.abs(camAirTarget(5, 10) - (5 + 10 / FLY_CFG.camUpK)) < 1e-9);
});

test('camera bám độ cao: bậc 8, nhảy gồng đầy — có phần dẫn thì độ tụt < 0,35 m (không có thì > 0,8 m)', () => {
  const lag = (lead) => {   // mô phỏng đúng công thức world.camStep: airSm = lerp(airSm, target, 1 − e^(−k·dt)), k = 20 khi lên, 9 khi xuống
    const j = createJump(); j.start(jumpHeight(MAX_BAC)); let sm = 0, worst = 0; const dt = 1 / 60;
    for (let i = 0; i < 600 && j.air; i++) {
      const y = j.step(dt), tgt = lead ? camAirTarget(y, j.vy) : y, k = tgt > sm ? FLY_CFG.camUpK : 9;
      sm += (tgt - sm) * (1 - Math.exp(-k * dt)); if (j.vy > 0) worst = Math.max(worst, y - sm);
    }
    return worst;
  };
  const without = lag(false), withLead = lag(true);
  assert.ok(without > 0.8, 'không có phần dẫn: tụt ' + without.toFixed(2) + ' m');
  assert.ok(withLead < 0.35 && withLead < without / 2, 'có phần dẫn: tụt ' + withLead.toFixed(2) + ' m');
});

test('nối dây (đọc mã): skill.js gửi camAirTarget cho world.setAirY; world.js giữ k = 20 (= camUpK)', () => {
  const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  assert.match(rd('js/ui/skill.js'), /W\.setAirY\(camAirTarget\(y, jump\.air \? jump\.vy : 0\)\)/);
  assert.match(rd('js/world/world.js'), /damp\(airSm, airY, airY > airSm \? 20 : 9, dt\)/);
  assert.equal(FLY_CFG.camUpK, 20);
});
