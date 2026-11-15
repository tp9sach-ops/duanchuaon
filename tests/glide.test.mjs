import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { FLY_CFG, fallSpeed, cushionH, flyVy, flySpeed, flyBrake, steerDir, yawBehind, followYaw } from '../js/world/glide.js';
import { createJump, jumpHeight, flyPlan, MAX_BAC, GRAVITY } from '../js/world/skills.js';
import { camPose } from '../js/world/worldLogic.js';
import { poseFor, STATES } from '../js/world/avatarLogic.js';
import { armTarget } from '../js/world/chibiRig.js';

// Mô phỏng: nhảy bậc `lv`, bấm Nhảy lần 2 sau `tPress` giây → bay lướt đến khi chạm đất.
function sim(lv, tPress = 0.25, dt = 1 / 60) {
  const j = createJump(), plan = flyPlan(lv); j.start(jumpHeight(lv));
  const hc = cushionH(plan.fall); let t = 0, tg = 0, dist = 0, glid = false, apex = 0, cush = 0, vmin = 0, vLand = 0, prev = 0;
  while (j.air && t < 20) {
    if (!glid && t >= tPress) glid = j.glide(plan.fall);
    const y = j.step(dt); apex = Math.max(apex, y); t += dt; vmin = Math.min(vmin, j.vy);
    if (glid) { tg += dt; dist += flySpeed(plan, tg) * flyBrake(y, plan.fall) * dt; if (y < hc && j.air) cush += dt; }
    if (!j.air) vLand = prev; prev = j.vy;
  }
  return { plan, glid, t, tg, dist, apex, cush, vmin, vLand, j };
}

test('flyPlan: bậc 0 hoặc trong nhà → null; bậc cao bay nhanh/xa hơn, rơi nhanh hơn một chút nhưng vẫn chậm', () => {
  assert.equal(flyPlan(0), null); assert.equal(flyPlan(3, true), null); assert.equal(flyPlan(), null);
  for (let b = 2; b <= MAX_BAC; b++) { const a = flyPlan(b - 1), c = flyPlan(b); assert.ok(c.v0 > a.v0 && c.cruise > a.cruise && c.fall >= a.fall, 'bậc ' + b); }
  for (let b = 1; b <= MAX_BAC; b++) { const p = flyPlan(b); assert.ok(p.v0 > p.cruise && p.cruise > 0 && p.fall >= FLY_CFG.fallMin && p.fall <= FLY_CFG.fallMax && p.guard > 0, 'bậc ' + b); }
});

test('xung đẩy YẾU DẦN: tốc độ ngang giảm đơn điệu từ v0 về mức lướt duy trì, không bao giờ dưới mức đó', () => {
  const p = flyPlan(3); let prev = Infinity;
  assert.ok(Math.abs(flySpeed(p, 0) - p.v0) < 1e-9);
  for (let t = 0; t <= 4; t += 0.05) { const v = flySpeed(p, t); assert.ok(v <= prev + 1e-12 && v >= p.cruise - 1e-9, 't=' + t); prev = v; }
  assert.ok(flySpeed(p, 4) - p.cruise < 0.01, 'sau 4 s gần như chỉ còn mức lướt');
  assert.ok(flySpeed(p, 0.5) < p.v0 && flySpeed(p, 0.5) > p.cruise);
  assert.ok(Number.isFinite(flySpeed(null, NaN)));
});

test('BAY TỪ TỪ: đang trên không bấm Nhảy → rơi chậm (không nhanh hơn fall), lâu hơn rơi tự do, bậc cao bay lâu hơn', () => {
  for (let b = 1; b <= MAX_BAC; b++) {
    const r = sim(b); assert.equal(r.glid, true, 'bậc ' + b); assert.equal(r.j.air, false); assert.equal(r.j.y, 0); assert.equal(r.j.gliding, false);
    assert.ok(r.vmin >= -r.plan.fall - 1e-6, 'bậc ' + b + ' không rơi nhanh hơn fall: ' + r.vmin);
    const normal = 2 * Math.sqrt(2 * r.apex / GRAVITY); assert.ok(r.tg > normal * 1.25, `bậc ${b}: bay ${r.tg.toFixed(2)} s phải lâu hơn rơi tự do ${normal.toFixed(2)} s`);
    assert.ok(r.tg < 5, 'bậc ' + b + ' không bay quá lâu: ' + r.tg);
  }
  assert.ok(sim(8).tg > sim(1).tg + 1, 'bậc 8 bay lâu hơn bậc 1');
  assert.ok(sim(8).dist > sim(1).dist + 4 && sim(1).dist > 3, 'quãng bay: bậc 1 ' + sim(1).dist.toFixed(1) + ' m, bậc 8 ' + sim(8).dist.toFixed(1) + ' m');
});

test('HẠ CÁNH ĐỆM ~0,13 s: sát đất vận tốc rơi giảm còn ~30%, đoạn đệm kéo dài 100–150 ms, chạm đất rất nhẹ', () => {
  for (const b of [1, 3, 5, 8]) {
    const r = sim(b);
    assert.ok(r.cush >= 0.09 && r.cush <= 0.16, `bậc ${b}: đệm ${(r.cush * 1000).toFixed(0)} ms`);
    assert.ok(Math.abs(r.vLand) <= r.plan.fall * 0.45, `bậc ${b}: chạm đất ${r.vLand.toFixed(2)} m/s so với fall ${r.plan.fall}`);
  }
  assert.ok(flyBrake(0, 1.1) < 0.5 && flyBrake(0, 1.1) >= FLY_CFG.brakeKeep - 1e-9);
  assert.equal(flyBrake(5, 1.1), 1); assert.ok(flyBrake(cushionH(1.1) * 0.5, 1.1) > flyBrake(0, 1.1));
});

test('createJump.glide: chỉ khi đang trên không, chỉ một lần mỗi cú nhảy, fall phải > 0; nhảy thường không đổi', () => {
  const j = createJump(); assert.equal(j.glide(1.1), false, 'đứng dưới đất');
  j.start(1.6); assert.equal(j.glide(0), false); assert.equal(j.glide(NaN), false); assert.equal(j.glide(1.1), true); assert.equal(j.gliding, true); assert.equal(j.glide(1.1), false, 'không bay chồng');
  for (let i = 0; i < 600 && j.air; i++) j.step(1 / 60); assert.equal(j.air, false); assert.equal(j.gliding, false);
  assert.equal(j.start(1.1), true); assert.equal(j.gliding, false, 'nhảy mới không còn cờ bay');
  const n = createJump(); n.start(1.1); let peak = 0, t = 0; while (n.air && t < 5) { peak = Math.max(peak, n.step(1 / 60)); t += 1 / 60; }   // nhảy thường vẫn đúng như Phiên 4
  assert.ok(Math.abs(peak - 1.1) < 0.05 && Math.abs(t - 2 * Math.sqrt(2 * 1.1 / GRAVITY)) < 0.05);
});

test('khung hình chậm / dt lạ khi đang bay không làm kẹt, bay mất hay NaN', () => {
  const j = createJump(); j.start(2.2); j.glide(1.2);
  for (const dt of [0.2, 0.25, NaN, -1, 5, 0, 0.016]) { j.step(dt); assert.ok(Number.isFinite(j.y) && Number.isFinite(j.vy) && j.y >= 0); }
  for (let i = 0; i < 60; i++) j.step(0.25); assert.equal(j.air, false); assert.equal(j.y, 0);
  assert.ok(Number.isFinite(flyVy(NaN, NaN, 1, NaN, NaN)));
});

test('steerDir: không bấm gì giữ nguyên hướng; bẻ hướng bị giới hạn tốc độ quay, không vượt quá hướng muốn, qua mốc ±π vẫn đi đường ngắn', () => {
  const d0 = { x: 0, z: 1 };
  assert.deepEqual(steerDir(d0, { x: 0, z: 0, mag: 0 }, 2.4, 0.1), d0); assert.deepEqual(steerDir(d0, null, 2.4, 0.1), d0);
  const right = { x: 1, z: 0, mag: 1 }; const a = steerDir(d0, right, 2.4, 0.1), ang = Math.atan2(a.x, a.z);
  assert.ok(Math.abs(ang - 0.24) < 1e-9, 'quay đúng 2,4 rad/s × 0,1 s: ' + ang);
  let d = d0; for (let i = 0; i < 100; i++) d = steerDir(d, right, 2.4, 0.1); assert.ok(Math.abs(d.x - 1) < 1e-9 && Math.abs(d.z) < 1e-9, 'về đúng hướng muốn, không vượt');
  const west = steerDir({ x: Math.sin(3.0), z: Math.cos(3.0) }, { x: Math.sin(-3.0), z: Math.cos(-3.0), mag: 1 }, 2.4, 0.1), dA = Math.atan2(west.x, west.z) - 3.0;
  assert.ok(Math.abs(((dA + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI - 0.24) < 1e-9, 'quay thêm +0,24 rad qua ±π (đường ngắn 0,28 rad), không quay vòng dài');
  for (const bad of [null, {}, { x: 0, z: 0 }]) { const r = steerDir(bad, right, 2.4, 0.1); assert.ok(Number.isFinite(r.x) && Number.isFinite(r.z) && Math.abs(Math.hypot(r.x, r.z) - 1) < 1e-9); }
});

test('CAMERA ĐI THEO: yawBehind đặt camera ĐÚNG SAU lưng hướng bay (kiểm với camPose thật), followYaw đuổi mượt theo đường ngắn nhất, không vượt', () => {
  for (const ry of [0, 0.7, -2.2, 3.0, Math.PI]) {
    const p = { x: 3, y: 0, z: -4 }, c = camPose(p, yawBehind(ry), 0.36, 5.2), fx = Math.sin(ry), fz = Math.cos(ry);
    const bx = c.pos.x - p.x, bz = c.pos.z - p.z, len = Math.hypot(bx, bz);
    assert.ok((bx * fx + bz * fz) / len < -0.999, 'camera nằm phía sau lưng, ry=' + ry);
  }
  let yaw = 0; const ry = 1.0, target = yawBehind(ry); let prevErr = Infinity;
  for (let i = 0; i < 300; i++) { yaw = followYaw(yaw, ry, 1 / 60); const err = Math.abs(((target - yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI); assert.ok(err <= prevErr + 1e-12); prevErr = err; }
  assert.ok(prevErr < 0.02, 'hội tụ sau ~5 s');
  const y2 = followYaw(3.0, -3.0 - Math.PI, 0.1, 4);   // mục tiêu −6,14 ≡ +0,14: phải quay qua ±π (đường ngắn) chứ không quay ngược gần 6 rad
  assert.ok(y2 > 3.0, 'đi tiếp theo chiều dương qua ±π: ' + y2);
  assert.equal(followYaw(1, 1 - Math.PI, 0, 5), 1, 'dt = 0 không đổi'); assert.ok(Number.isFinite(followYaw(NaN, NaN, NaN, NaN)));
  assert.ok(FLY_CFG.camHold > 0 && FLY_CFG.camK > 0);
});

test('tư thế "glide": số hữu hạn, hai tay giang ra hai bên (khác đi/đứng); KHÔNG nằm trong STATES mạng (luật Firebase chỉ nhận 6 trạng thái) và máy mình gửi \'idle\' thay cho nó', () => {
  assert.ok(!STATES.includes('glide'), 'STATES là danh sách đồng bộ mạng + luật Firebase');
  assert.match(readFileSync(new URL('../js/net/room.js', import.meta.url), 'utf8'), /av\.state === 'glide' \? 'idle' : av\.state/);
  for (const t of [0, 0.5, 3.3, 100]) for (const v of Object.values(poseFor('glide', t, 5))) assert.ok(Number.isFinite(v));
  const g = armTarget('glide', poseFor('glide', 0).armL), w = armTarget('walk', 0);
  assert.ok(g.out > 0.9 && g.out > w.out * 4 && g.flex < 0.3, 'tay giang ngang, khuỷu gần thẳng');
});

test('nối dây (đọc mã): Nhảy lần 2 trên không → startFlight; world.fly + camera followYaw + mở góc nhìn; hết bay khi chạm đất; không tự lướt né thêm', () => {
  const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8'), sk = rd('js/ui/skill.js'), wd = rd('js/world/world.js');
  assert.match(sk, /if \(jump\.air\) return startFlight\(lv, indoor\)/); assert.match(sk, /W\.fly\(\(dt, inp\) =>/); assert.match(sk, /if \(!jump\.air\) return null/);
  assert.match(sk, /glideQ = false; glideCd = GLIDE_CFG\.cd/); assert.match(sk, /!W\.dashing && !W\.flying/);
  assert.match(wd, /function fly\(fn\)/); assert.match(wd, /yaw = followYaw\(yaw, flyRy, dt\)/); assert.match(wd, /camDragAt/); assert.match(wd, /get flying\(\)/); assert.match(wd, /\+ flyFov\)/);
  assert.match(wd, /walkStep\(P, \{ x: \+f\.dx, z: \+f\.dz, mag: 1 \}/, 'bay qua walkStep → trượt dọc tường, không xuyên vật cản');
});
