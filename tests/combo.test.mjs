// Tư thế chiến đấu theo clip mẫu (Phiên 119, mở rộng Phiên 126): js/world/combo.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { KINDS, CHAIN, CHAIN_GAP, SLASH, nextKind, comboEnd, hitAt, comboPose, applyStance } from '../js/world/combo.js';
import { RELEASE_S } from '../js/world/conKhi.js';
import { armAngle, elbowAngle, wristAngle, kneeAngle, legPoints, LM, CHIBI_H } from '../js/world/chibiRig.js';

const TAU = Math.PI * 2, Z = () => ({ x: 0, y: 0, z: 0 });
const base = () => ({ spine: Z(), head: { x: 0 }, armL: armAngle(1, 0.12, 0.14), armR: armAngle(-1, 0.12, 0.14), foreL: elbowAngle(1, 0.2), foreR: elbowAngle(-1, 0.2), handL: wristAngle(1, 0.2), handR: wristAngle(-1, 0.2), legL: Z(), legR: Z(), shinL: kneeAngle(0.06), shinR: kneeAngle(0.06), footL: Z(), footR: Z(), hipsDrop: 0 });

test('chuỗi đòn: múa → ngang → ngược → xoay, quá hạn hoặc xong đòn cuối thì về đầu', () => {
  assert.deepEqual(CHAIN, ['mua', 'ngang', 'nguoc', 'xoay']);
  assert.equal(nextKind('', 0), 'mua');
  assert.equal(nextKind('mua', 0.2), 'ngang');
  assert.equal(nextKind('ngang', 0.2), 'nguoc');
  assert.equal(nextKind('nguoc', -0.1), 'xoay');
  assert.equal(nextKind('xoay', 0.1), 'mua');
  assert.equal(nextKind('ngang', CHAIN_GAP + 0.01), 'mua');
  assert.equal(nextKind('khi', 0), 'mua');
});

test('mọi kiểu đòn: liên tục, hữu hạn, đầu và cuối về tư thế nghỉ', () => {
  for (const k of Object.keys(KINDS)) {
    const end = comboEnd(k); assert.ok(end > 0.5 && end < 1.5, k);
    assert.ok(hitAt(k) > 0 && hitAt(k) < end, k);
    let prev = comboPose(k, 0);
    for (let t = 0; t <= end + 0.2; t += 0.01) {
      const p = comboPose(k, t);
      for (const f of ['arm', 'lean', 'yaw', 'lunge', 'spin', 'vis']) assert.ok(Number.isFinite(p[f]), `${k} ${f} @${t}`);
      assert.ok(p.arm >= -3.2 && p.arm <= -0.3, `${k} arm @${t}`);
      assert.ok(Math.abs(p.yaw - prev.yaw) < 0.25, `${k} yaw nhảy @${t}`);
      assert.ok(Math.abs(p.arm - prev.arm) < 0.35, `${k} arm nhảy @${t}`);
      assert.ok(Math.abs(p.spin - prev.spin) < 0.7, `${k} côn xoay quá nhanh @${t}`);
      prev = p;
    }
    const a = comboPose(k, 0), z = comboPose(k, end);
    assert.ok(Math.abs(a.arm + 1.2) < 1e-9 && Math.abs(a.yaw) < 1e-9 && a.lunge === 0);
    assert.equal(z.vis, 0); assert.ok(Math.abs(z.lunge) < 1e-9);
    const turns = z.yaw / TAU; assert.ok(Math.abs(turns - Math.round(turns)) < 1e-9, `${k} yaw cuối không về 0 (mod 2π)`);
    const sp = z.spin / TAU; assert.ok(Math.abs(sp - Math.round(sp)) < 1e-9 && a.spin === 0, `${k} côn xoay không về đúng vị trí`);
  }
  assert.equal(comboPose('la', 0.1), null); assert.equal(comboEnd('la'), 0); assert.equal(hitAt('la'), 0);
});

test('xoay quay đủ một vòng và luôn tăng; ngang/ngược quét ngược chiều nhau', () => {
  let last = -Infinity; const ys = [];
  for (let t = 0.12; t <= 0.58; t += 0.01) { const y = comboPose('xoay', t).yaw; assert.ok(y >= last - 1e-9); last = y; ys.push(y); }
  assert.ok(ys[ys.length - 1] - ys[0] > TAU * 0.95);
  assert.ok(comboPose('ngang', 0.09).yaw > 0.8 && comboPose('ngang', 0.3).yaw < -0.8);
  assert.ok(comboPose('nguoc', 0.09).yaw < -0.8 && comboPose('nguoc', 0.3).yaw > 0.8);
  assert.ok(comboPose('khi', RELEASE_S * 0.65).arm < -2.6 && comboPose('khi', RELEASE_S).arm > -0.8);   // skill: giơ cao rồi bổ xuống đúng lúc khí rời côn
});

test('vệt chém: có cho ngang/ngược/xoay, khoảng quét hợp lệ; múa côn không có vệt ngang', () => {
  assert.deepEqual(Object.keys(SLASH).sort(), ['nguoc', 'ngang', 'xoay'].sort());
  assert.equal(SLASH.mua, undefined);
  for (const k of Object.keys(SLASH)) { const s = SLASH[k]; assert.ok(s.a < s.b && s.b < comboEnd(k) && s.arc > 1 && s.reach > 2 && Math.abs(s.side) === 1, k); }
  assert.equal(SLASH.khi, undefined);
});

test('múa côn: xoay hai vòng liên tục trước người; xoay 360° cũng xoay côn 2 vòng', () => {
  let last = -1; for (let t = 0.08; t <= 0.4; t += 0.01) { const sp = comboPose('mua', t).spin; assert.ok(sp >= last - 1e-9); last = sp; }
  assert.ok(comboPose('mua', 0.4).spin > 2 * TAU - 1e-6 && comboPose('mua', 0.08).spin === 0);
  assert.ok(comboPose('xoay', 0.58).spin > 2 * TAU - 1e-6);
  assert.equal(comboPose('ngang', 0.2).spin, 0); assert.equal(comboPose('khi', 0.2).spin, 0);
});

test('thế sẵn sàng: s = 0 giữ nguyên; s = 1 đứng yên → khom, chân trước/sau, gối gập, tay côn đưa trước', () => {
  const q = base();
  assert.equal(applyStance(q, 0), q);
  assert.equal(applyStance(q, 1, { sit: 1 }), q);
  const r = applyStance(q, 1, { walk: 0 });
  assert.ok(r.spine.x > q.spine.x + 0.15);
  assert.ok(r.legL.x < -0.3 && r.legR.x > 0.3);              // trái trước, phải sau
  assert.ok(r.shinL.x > 0.7 && r.shinR.x > 0.6);              // gối gập
  assert.ok(r.armR.x < q.armR.x - 0.5 && r.foreR.y > q.foreR.y + 0.5);   // tay phải (cầm côn) đưa trước, khuỷu gập
  assert.ok(r.hipsDrop > 0);
  for (const f of ['spine', 'legL', 'shinL', 'footL', 'armR']) for (const ax of ['x', 'y', 'z']) assert.ok(Number.isFinite(r[f][ax]));
});

test('thế sẵn sàng: chân vẫn chạm đất (không lún, không lơ lửng)', () => {
  const r = applyStance(base(), 1, { walk: 0 }), H = LM.crotch * CHIBI_H - r.hipsDrop;
  const low = Math.min(legPoints(r, 1).sole[1], legPoints(r, -1).sole[1]) + H;
  assert.ok(low > -0.01 && low < 0.03, `đáy bàn chân cách đất ${low}`);
});

test('thế sẵn sàng khi đi: chỉ nghiêng người + tay côn; chân giữ nhịp bước; busy/hold giữ nguyên tay', () => {
  const q = base(), r = applyStance(q, 1, { walk: 1 });
  assert.equal(r.legL.x, q.legL.x); assert.equal(r.shinL.x, q.shinL.x);
  assert.ok(r.spine.x > 0.19); assert.ok(r.armR.x < q.armR.x - 0.5);
  const b = applyStance(q, 1, { busy: true }); assert.deepEqual(b.armR, q.armR); assert.deepEqual(applyStance(q, 1, { hold: true }).foreR, q.foreR);
  const half = applyStance(q, 0.5, { walk: 0 }); assert.ok(half.legL.x < 0 && half.legL.x > r.legL.x - 1 && half.spine.x > 0.05 && half.spine.x < 0.15);
});
