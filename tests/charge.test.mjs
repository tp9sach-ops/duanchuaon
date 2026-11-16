// Phiên 197 (mục 1): gồng lực nhảy (giữ càng lâu bay càng cao), vòng tròn nút, đạp gió khi bay, camera đi theo độ cao.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARGE_CFG, chargeLevel, chargeFrac, chargeHeight, ringScale, isFull, crouchPose } from '../js/world/charge.js';
import { createJump, jumpHeight, jumpHeightAt, flyPlan, leapPlan, KHINH_THAN_CAO, MAX_BAC, INDOOR_MAX } from '../js/world/skills.js';
import { FLY_CFG, boostSpeed, flySpeed } from '../js/world/glide.js';

const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('chargeLevel: 0 → 0, đủ thời gian → 1, tăng đơn điệu, quá lâu vẫn 1, số lạ không NaN', () => {
  assert.equal(chargeLevel(0), 0); assert.equal(chargeLevel(CHARGE_CFG.full), 1); assert.equal(chargeLevel(99), 1); assert.equal(chargeLevel(-3), 0);
  let prev = -1; for (let t = 0; t <= CHARGE_CFG.full; t += 0.02) { const c = chargeLevel(t); assert.ok(c >= prev - 1e-12 && c >= 0 && c <= 1); prev = c; }
  for (const bad of [NaN, undefined, null, 'x']) assert.ok(Number.isFinite(chargeLevel(bad)));
});

test('độ cao nhảy: bấm nhẹ ~35% tối đa, giữ đầy = 100% tối đa của bậc; giữ càng lâu càng cao', () => {
  assert.ok(Math.abs(chargeFrac(0) - CHARGE_CFG.minFrac) < 1e-12 && chargeFrac(1) === 1 && chargeFrac(5) === 1 && chargeFrac(-1) === CHARGE_CFG.minFrac);
  for (let b = 1; b <= MAX_BAC; b++) { const mx = jumpHeight(b); assert.ok(Math.abs(chargeHeight(mx, 0) - mx * CHARGE_CFG.minFrac) < 1e-9 && chargeHeight(mx, 1) === mx, 'bậc ' + b); }
  let prev = -1; for (let t = 0; t <= 1.3; t += 0.05) { const h = chargeHeight(jumpHeight(5), chargeLevel(t)); assert.ok(h >= prev); prev = h; }
});

test('bảng độ cao Khinh thân đã NÂNG (bậc 1 ≥ 2 m, bậc 8 ≥ 15 m), tăng nghiêm ngặt; trong nhà vẫn bị chặn 1,6 m', () => {
  assert.ok(KHINH_THAN_CAO[1] >= 2 && KHINH_THAN_CAO[MAX_BAC] >= 15);
  for (let i = 2; i <= MAX_BAC; i++) assert.ok(KHINH_THAN_CAO[i] > KHINH_THAN_CAO[i - 1]);
  for (let b = 1; b <= MAX_BAC; b++) assert.ok(jumpHeightAt(b, true) <= INDOOR_MAX + 1e-12);
});

test('createJump: nhảy ở độ cao đã gồng đạt đúng đỉnh đó, apex ghi lại; bay lướt rơi theo apex THẬT (nhảy thấp rơi chậm hơn nhảy cao)', () => {
  const lo = createJump(), hi = createJump(), mx = jumpHeight(8);
  lo.start(chargeHeight(mx, 0)); hi.start(chargeHeight(mx, 1));
  assert.ok(Math.abs(lo.apex - mx * CHARGE_CFG.minFrac) < 1e-9 && hi.apex === mx);
  let pLo = 0, pHi = 0; for (let i = 0; i < 600; i++) { pLo = Math.max(pLo, lo.step(1 / 60)); pHi = Math.max(pHi, hi.step(1 / 60)); }
  assert.ok(Math.abs(pLo - lo.apex) < 0.35 && Math.abs(pHi - hi.apex) < 0.35 && pHi > pLo * 2.5);
  assert.ok(flyPlan(8, false, lo.apex).fall < flyPlan(8, false, hi.apex).fall, 'nhảy thấp → hạ chậm hơn');
  assert.equal(flyPlan(8).fall, flyPlan(8, false, jumpHeight(8)).fall, 'bỏ trống apex → độ cao tối đa của bậc');
  assert.equal(flyPlan(8, false, NaN).fall, flyPlan(8).fall);
});

test('leapPlan có tỉ lệ gồng: nhảy thấp bật tới ngắn + ngắn thời gian hơn, nhảy cao xa hơn; mặc định không đổi', () => {
  const lo = leapPlan(5, false, 0.35), hi = leapPlan(5, false, 1), def = leapPlan(5);
  assert.ok(lo.dist < hi.dist && lo.dur < hi.dur); assert.deepEqual(def, hi); assert.equal(leapPlan(5, true, 0.5), null);
  assert.ok(Number.isFinite(leapPlan(5, false, NaN).dist));
});

test('đạp gió (bấm Nhảy thêm khi đang bay): xung mới = boostK × xung đầu rồi yếu dần về mức lướt; chưa đạp thì không ảnh hưởng', () => {
  const p = flyPlan(4);
  assert.ok(Number.isFinite(p.vb) && p.vb > p.v0, 'Phiên 204: xung đạp gió theo cấp (vb) mạnh hơn xung đầu');
  assert.ok(Math.abs(boostSpeed(p, 0) - p.vb) < 1e-9);
  assert.ok(Math.abs(boostSpeed(p, Infinity) - p.cruise) < 1e-9 && Math.abs(boostSpeed(p, NaN) - p.cruise) < 1e-9);
  let prev = Infinity; for (let t = 0; t < 4; t += 0.05) { const v = boostSpeed(p, t); assert.ok(v <= prev + 1e-12 && v >= p.cruise - 1e-9); prev = v; }
  assert.ok(boostSpeed(p, 0) > flySpeed(p, 1.5), 'đạp gió giữa chuyến bay đẩy nhanh hơn mức đang lướt');
  assert.ok(FLY_CFG.boostGap > 0 && FLY_CFG.boostK > 0 && FLY_CFG.boostK <= 1);
});

test('vòng tròn nút: nhỏ lúc mới bấm, nở đều, đầy = đúng khung nút (1.0); isFull', () => {
  assert.equal(ringScale(0), CHARGE_CFG.ringMin); assert.equal(ringScale(1), 1); assert.equal(ringScale(9), 1);
  let prev = 0; for (let c = 0; c <= 1; c += 0.05) { assert.ok(ringScale(c) >= prev); prev = ringScale(c); }
  assert.ok(!isFull(0.5) && isFull(1));
});

test('dáng gồng nhún: không gồng = thân thẳng; gồng đầy thấp xuống + phình ngang + hạ thân; số hữu hạn', () => {
  assert.deepEqual(crouchPose(0, 3), { sy: 1, sxz: 1, dy: 0 });
  const f = crouchPose(1, 0.4); assert.ok(f.sy < 0.92 && f.sxz > 1.02 && f.dy < 0 && f.dy >= -CHARGE_CFG.sink - 1e-9);
  for (const t of [0, 0.1, 5, 1e6]) for (const v of Object.values(crouchPose(1, t))) assert.ok(Number.isFinite(v));
  for (const bad of [NaN, null]) for (const v of Object.values(crouchPose(bad, bad))) assert.ok(Number.isFinite(v));
});

test('nối dây (đọc mã): nút Nhảy giữ-để-gồng/thả-để-bay; Space giữ/thả; camera cộng độ cao nhảy; đạp gió khi đang bay; vòng tròn CSS', () => {
  const sk = rd('js/ui/skill.js'), dk = rd('js/ui/dock.js'), wd = rd('js/world/world.js'), css = rd('css/dock.css');
  assert.match(sk, /function press\(\)/); assert.match(sk, /function release\(\)/); assert.match(sk, /addEventListener\('keyup'/); assert.match(sk, /chargeFrac\(c\)/);
  assert.match(sk, /if \(jump\.air && flight\) return flight\.boost\(\)/); assert.match(sk, /boostSpeed\(plan, tb\)/); assert.match(sk, /flyPlan\(lv, indoor, jump\.apex\)/);
  assert.match(sk, /W\.setAirY\(camAirTarget\(y, jump\.air \? jump\.vy : 0\)\)/); assert.match(sk, /--jump-ring/);
  assert.match(dk, /LGT\.skill\.press\(\)/); assert.match(dk, /\['pointerup', 'pointercancel', 'lostpointercapture'\]/);
  assert.match(wd, /setAirY/); assert.match(wd, /cam\.y \+ cf\.dy \+ airSm/); assert.match(wd, /e\.dist \*= 1 \+ Math\.min\(0\.5, airSm/);
  assert.match(css, /--jump-ring/); assert.match(css, /body\.jump-charging/); assert.match(css, /body\.jump-full/);
});
