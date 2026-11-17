// Tư thế bay lướt + cú đạp gió + vệt gió + tiếng gió (Phiên 204, mục 1 danh sách ptg 16/11).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FLY_CFG, pivotShift, boostDist, boostVb, boostSpeed, windLevel } from '../js/world/glide.js';
import { flyPlan } from '../js/world/skills.js';
import { kickPose, kickPhase, KICK_S } from '../js/world/flyPose.js';
import { WIND_FX, WIND_SND, windFilterHz, windGainOf, streakSpawn, streakLen, fadeOf, ringRadius } from '../js/world/windFxMath.js';
const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('pivotShift: chúi quanh hông — không chúi thì không dời; chúi tới trước thì chân kéo ra SAU theo hướng mặt, lên cao một chút', () => {
  const z = pivotShift(0, 1.2); assert.ok(Math.abs(z.x) < 1e-12 && Math.abs(z.y) < 1e-12 && Math.abs(z.z) < 1e-12);
  for (const ry of [0, 1, 2.5, Math.PI, -2]) {
    const s = pivotShift(0.62, ry), fwd = { x: Math.sin(ry), z: Math.cos(ry) };
    assert.ok(s.x * fwd.x + s.z * fwd.z < 0, 'gốc (bàn chân) dời ngược hướng mặt, mọi hướng');
    assert.ok(s.y > 0 && s.y < FLY_CFG.pivotH);
  }
  assert.ok(FLY_CFG.tilt > 0.5 && FLY_CFG.tilt < 1.0);
});

test('kỷ luật Euler: cả hai avatar quay hướng (y) trước rồi mới chúi (x) → luôn ngã VỀ PHÍA TRƯỚC', () => {
  assert.match(rd('js/world/avatarChibi.js'), /group\.rotation\.order = 'YXZ'/); assert.match(rd('js/world/avatar.js'), /group\.rotation\.order = 'YXZ'/);
  assert.match(rd('js/world/world.js'), /pivotShift\(tl, avatar\.group\.rotation\.y\)/);
});

test('mỗi cú đạp gió lướt thêm xa hơn theo bậc; plan có vb; xung yếu dần về mức lướt', () => {
  let prev = 0; for (let b = 1; b <= 8; b++) { const d = boostDist(b); assert.ok(d > prev, 'bậc ' + b); prev = d; }
  assert.equal(boostDist(0), 0);
  for (const b of [1, 4, 8]) {
    const p = flyPlan(b), extra = (boostSpeed(p, 0) - p.cruise) * FLY_CFG.boostTau;   // tích phân xung ≈ quãng
    assert.ok(Math.abs(extra - boostDist(b)) < 0.1, `bậc ${b}: quãng ${extra.toFixed(2)} ≈ ${boostDist(b)}`);
    assert.ok(Math.abs(boostSpeed(p, 99) - p.cruise) < 1e-6);
  }
  assert.ok(boostVb(5, 3) > 3);
});

test('kickPose: chỉ tác động act "dapgio"; co gối lấy đà rồi đạp ra sau; không sửa q gốc', () => {
  const q = { legL: { x: -0.98, y: 0, z: 0 }, legR: { x: 0.86, y: 0, z: 0 }, shinL: { x: 1.7, y: 0, z: 0 }, shinR: { x: 0.12, y: 0, z: 0 }, spine: { x: 0.2, y: 0, z: 0 }, armL: { x: -1.5, y: 0, z: 0 } };
  assert.equal(kickPose(q, null), q); assert.equal(kickPose(q, { name: 'throw', k: 0.5 }), q);
  const wind = kickPose(q, { name: 'dapgio', k: 0.2 }), push = kickPose(q, { name: 'dapgio', k: 0.5 }), end = kickPose(q, { name: 'dapgio', k: 1 });
  assert.ok(wind.legR.x < q.legR.x && wind.shinR.x > 1, 'lấy đà: đùi phải đưa lên trước, gối gập');
  assert.ok(push.legR.x > q.legR.x && push.shinR.x < q.shinR.x, 'đạp: đùi ra sau, gối duỗi');
  assert.ok(Math.abs(end.legR.x - q.legR.x) < 1e-6 && Math.abs(end.spine.x - q.spine.x) < 1e-6, 'hết cú đạp trả lại tư thế bay');
  assert.equal(q.legR.x, 0.86);
  assert.ok(KICK_S > 0.2 && KICK_S < 1); for (const k of [-1, 0, 0.3, 1, 5, NaN]) { const f = kickPhase(k); assert.ok(f.wind >= 0 && f.wind <= 1 && f.push >= 0 && f.push <= 1); }
  assert.match(rd('js/world/avatarChibi.js'), /dapgio: KICK_S/); assert.match(rd('js/world/avatarChibi.js'), /kickPose\(applyCast/);
});

test('vệt gió: sinh đủ theo thời gian & mức gió, mờ dần, vòng sóng nở', () => {
  let acc = 0, n = 0; for (let i = 0; i < 60; i++) { const r = streakSpawn(acc, 1 / 60, 1); acc = r.acc; n += r.n; }
  assert.ok(Math.abs(n - WIND_FX.rate) <= 1, 'một giây ở mức 1 ≈ rate vệt: ' + n); assert.equal(streakSpawn(0, 1, 0).n, 0);
  assert.ok(streakLen(15) > streakLen(2));
  assert.equal(fadeOf(0, 1).alpha, 0); assert.equal(fadeOf(1, 1).alpha, 0); assert.ok(fadeOf(0.2, 1).alpha > 0.3);
  assert.ok(ringRadius(1) > ringRadius(0.3) && ringRadius(0.3) > ringRadius(0));
});

test('tiếng gió: nhanh → to và the thé hơn; mức gió theo tốc độ, sát đất dịu đi; có hook trong sfx và skill', () => {
  assert.ok(windGainOf(1) > windGainOf(0.3) && windGainOf(0) === 0 && windFilterHz(1) > windFilterHz(0));
  assert.ok(windLevel(10, -4) > windLevel(3, 0) && windLevel(10, -4, true) < windLevel(10, -4) && windLevel(99, -99) <= 1);
  assert.ok(WIND_SND.bay.f1 > WIND_SND.bay.f0 && WIND_SND.dap.f1 < WIND_SND.dap.f0);
  const sf = rd('js/ui/sfx.js'), sk = rd('js/ui/skill.js');
  assert.match(sf, /gust, (?:wood, )?windStart, windSet, windStop/);   // Phiên 224: thêm wood (tiếng gỗ)
  assert.match(sk, /gust\('bay'\)/); assert.match(sk, /gust\('dap'\)/); assert.match(sk, /av\.act\('dapgio'\)/); assert.match(sk, /createWindFx/); assert.match(sk, /endWind\(\)/);
});
