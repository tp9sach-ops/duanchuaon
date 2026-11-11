import test from 'node:test';
import assert from 'node:assert/strict';
import { skinOf, zoneOf, armAngle, armTarget, elbowAngle, wristAngle, kneeAngle, chibiPose, limbPoints, legPoints, B, BONES, LM, LIMB, CHIBI_H, ELBOW_MAX, KNEE_MAX } from '../js/world/chibiRig.js';
import { poseFor } from '../js/world/avatarLogic.js';
import { swingPose } from '../js/world/conKhi.js';

const GROUND_HIPS = LM.crotch * CHIBI_H;   // độ cao hông khi đứng thẳng (m)

test('bộ xương: 15 xương, 7 xương đầu giữ nguyên chỉ số, có khuỷu/cổ tay/gối/cổ chân', () => {
  assert.equal(BONES.length, 15);
  assert.deepEqual(BONES.slice(0, 7), ['hips', 'spine', 'head', 'armL', 'armR', 'legL', 'legR']);
  for (const n of ['foreL', 'foreR', 'handL', 'handR', 'shinL', 'shinR', 'footL', 'footR']) assert.ok(n in B, n);
  assert.equal(new Set(BONES).size, BONES.length);
});
test('độ dài đoạn chi khớp với mô hình (tay dài tới |x| 0,352; chân cao tới đũng 0,22)', () => {
  assert.ok(Math.abs(LIMB.upperArm + LIMB.forearm + LIMB.hand - (LM.handEndX - LM.shoulderX) * CHIBI_H) < 1e-9);
  assert.ok(Math.abs(LIMB.thigh + LIMB.shin + LIMB.ankleH - GROUND_HIPS) < 1e-9, 'đùi + cẳng chân + cổ chân = độ cao hông');
  assert.ok(LM.shoulderX < LM.elbowX && LM.elbowX < LM.wristX && LM.wristX < LM.handEndX);
  assert.ok(LM.ankle < LM.knee && LM.knee < LM.crotch);
});
test('trọng số da: tổng = 1, chỉ số hợp lệ, mọi điểm trên thân đều có xương', () => {
  for (let nx = -0.4; nx <= 0.4; nx += 0.02) for (let ny = 0; ny <= 1; ny += 0.02) {
    const { idx, w } = skinOf(nx, ny), sum = w.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-6, `tổng ${sum} tại ${nx},${ny}`);
    assert.ok(idx.every((i) => i >= 0 && i < BONES.length)); assert.ok(w.every((x) => x >= 0));
  }
});
test('trọng số da: đầu theo xương đầu, thân theo xương thân', () => {
  assert.equal(skinOf(0, 0.85).idx[0], B.head); assert.equal(skinOf(0.2, 0.7).idx[0], B.head);   // tai cũng thuộc đầu
  assert.equal(skinOf(0, 0.4).idx[0], B.spine);
  const mid = skinOf(0, 0.1); assert.ok(Math.abs(mid.w[0] - 0.5) < 1e-6 && Math.abs(mid.w[1] - 0.5) < 1e-6, 'sát giữa: chia đều hai chân, không rách');
});
test('trọng số da: tay chia vai → khuỷu → cổ tay đúng bên; chân chia hông → gối → cổ chân đúng bên', () => {
  assert.equal(skinOf(0.17, 0.45).idx[0], B.armL); assert.equal(skinOf(-0.17, 0.45).idx[0], B.armR);
  assert.equal(skinOf(0.26, 0.45).idx[0], B.foreL); assert.equal(skinOf(-0.26, 0.45).idx[0], B.foreR);
  assert.equal(skinOf(0.33, 0.45).idx[0], B.handL); assert.equal(skinOf(-0.33, 0.45).idx[0], B.handR);
  assert.equal(skinOf(0.06, 0.2).idx[0], B.legL); assert.equal(skinOf(-0.06, 0.2).idx[0], B.legR);
  assert.equal(skinOf(0.06, 0.08).idx[0], B.shinL); assert.equal(skinOf(-0.06, 0.08).idx[0], B.shinR);
  assert.equal(skinOf(0.06, 0.02).idx[0], B.footL); assert.equal(skinOf(-0.06, 0.02).idx[0], B.footR);
});
test('trọng số da: quanh khuỷu và gối chuyển MƯỢT (hai xương cùng có trọng số), không rách', () => {
  const e = skinOf(LM.elbowX, 0.45), k = skinOf(0.06, LM.knee);
  assert.deepEqual([...e.idx.slice(0, 2)].sort(), [B.armL, B.foreL].sort()); assert.ok(e.w[0] > 0.3 && e.w[1] > 0.3, 'khuỷu chia đều hai đoạn tay');
  assert.deepEqual([...k.idx.slice(0, 2)].sort(), [B.legL, B.shinL].sort()); assert.ok(k.w[0] > 0.3 && k.w[1] > 0.3, 'gối chia đều đùi và cẳng chân');
  let prev = null;   // dọc cánh tay, trọng số của xương ưu thế đổi từng bước nhỏ
  for (let ax = 0.11; ax <= 0.35; ax += 0.005) { const s = skinOf(ax, 0.45), v = [B.armL, B.foreL, B.handL].map((b) => s.idx.reduce((t, i, j) => t + (i === b ? s.w[j] : 0), 0)); if (prev) assert.ok(v.every((x, i) => Math.abs(x - prev[i]) < 0.35), `nhảy trọng số tại ${ax}`); prev = v; }
});
test('vùng màu: giày, quần, áo, tay áo, da', () => {
  assert.equal(zoneOf(0.05, 0.01), 'shoe'); assert.equal(zoneOf(0.05, 0.15), 'pants'); assert.equal(zoneOf(0.02, 0.4), 'shirt');
  assert.equal(zoneOf(0.16, 0.45), 'sleeve'); assert.equal(zoneOf(0.3, 0.45), 'skin'); assert.equal(zoneOf(0, 0.8), 'skin');
});
test('góc vai: buông thẳng xuống hai bên; chắp tay khép vào; giơ lên khi khiêng', () => {
  const l = armAngle(1, 0, 0), r = armAngle(-1, 0, 0);
  assert.ok(Math.abs(l.z + Math.PI / 2) < 1e-9 && Math.abs(r.z - Math.PI / 2) < 1e-9 && l.x === 0);
  assert.ok(armTarget('idle', 0).out > 0 && armTarget('sit', 0).out < 0 && armTarget('bow', 0).out < 0);
  assert.ok(armTarget('walk', 0, true).fwd > 2);
});
test('khuỷu tay: chỉ gập một chiều (không ưỡn ngược), có giới hạn, hai bên đối xứng gương', () => {
  assert.ok(elbowAngle(1, -1, 0).y === 0 && elbowAngle(-1, -1, 0).y === 0);                    // gập âm = ưỡn ngược → kẹp về 0
  assert.ok(Math.abs(elbowAngle(1, 99, 0).y) <= ELBOW_MAX + 1e-9);                                      // gập quá → kẹp ở giới hạn
  const l = elbowAngle(1, 1.2, 0.4), r = elbowAngle(-1, 1.2, 0.4);
  assert.ok(l.y < 0 && r.y > 0 && Math.abs(l.y + r.y) < 1e-9 && Math.abs(l.z + r.z) < 1e-9 && l.x === 0 && r.x === 0);
  const w = wristAngle(1, 1.5); assert.ok(Math.abs(w.y) < 0.4, 'cổ tay chỉ cụp nhẹ');
});
test('gối: chỉ gập ra sau, có giới hạn', () => {
  assert.equal(kneeAngle(-1).x, 0); assert.equal(kneeAngle(99).x, KNEE_MAX); assert.equal(kneeAngle(0.7).x, 0.7);
});
test('đi: chân đối nhau, tay đánh ngược chân cùng bên (tự nhiên), thân đung đưa', () => {
  const p = poseFor('walk', 0.3, 2), q = chibiPose(p, 'walk', 0.3, 2);
  assert.ok(Math.abs(q.legL.x + q.legR.x) < 1e-9);
  assert.ok((-q.legL.x) * (-q.armL.x - 0.12) <= 1e-9, 'chân trái ra trước thì tay trái ra sau (và ngược lại)');
  assert.ok(Math.abs(q.spine.z) <= 0.05 + 1e-9);
});
test('đi: chân nào vung tới thì gập gối, chân chống thì thẳng; gối luôn trong giới hạn', () => {
  const at = (t) => chibiPose(poseFor('walk', t, 2), 'walk', t, 2);
  const a = at(0);       // ph = 0: chân trái đang vung qua giữa (gập nhiều nhất), chân phải chống
  assert.ok(a.shinL.x > 0.6 && a.shinR.x < 0.1, `gối L ${a.shinL.x} R ${a.shinR.x}`);
  const ph = (5 + 4 * 0.909), tHalf = Math.PI / ph;   // nửa chu kỳ sau: ngược lại
  const b = at(tHalf); assert.ok(b.shinR.x > 0.6 && b.shinL.x < 0.1, `gối L ${b.shinL.x} R ${b.shinR.x}`);
  for (let i = 0; i < 240; i++) { const q = at(i / 60); for (const k of ['shinL', 'shinR']) assert.ok(q[k].x >= 0 && q[k].x <= KNEE_MAX); }
});
test('đi: chân chống LUÔN chạm đất (không lún, không lơ lửng), chân kia không xuyên sàn', () => {
  for (let i = 0; i < 240; i++) {
    const t = i / 60, q = chibiPose(poseFor('walk', t, 2), 'walk', t, 2), y0 = GROUND_HIPS - q.hipsDrop;
    const sl = y0 + legPoints(q, 1).sole[1], sr = y0 + legPoints(q, -1).sole[1];
    assert.ok(Math.min(sl, sr) > -0.012 && Math.min(sl, sr) < 0.012, `chân thấp nhất ở ${Math.min(sl, sr).toFixed(3)} (t=${t.toFixed(2)})`);
    assert.ok(Math.max(sl, sr) > -0.02, 'chân cao hơn không lún');
  }
});
test('đứng: bước chân chạm đất ngay cả khi walk = 0, hông không hạ', () => {
  const q = chibiPose(poseFor('idle', 0, 0), 'idle', 0, 0), L = legPoints(q, 1);
  assert.equal(q.hipsDrop, 0); assert.ok(Math.abs(GROUND_HIPS + L.sole[1]) < 0.01, `đế chân ở ${GROUND_HIPS + L.sole[1]}`);
});
test('ngồi xếp bằng: hông hạ, đùi đưa ra trước, gối dạng ra ngoài, gối gập sâu, bàn chân thu vào sát sàn', () => {
  const q = chibiPose({ ...poseFor('sit', 1, 0), sit: 1 }, 'sit', 1, 0);
  assert.ok(q.hipsDrop > 0.2 && q.legL.x < -1.4 && q.legR.x < -1.4 && q.legL.z > 0 && q.legR.z < 0);
  assert.ok(q.shinL.x > 1.8 && q.shinR.x > 1.8 && q.shinL.x <= KNEE_MAX, 'gối gập sâu nhưng trong giới hạn');
  const L = legPoints(q, 1), R = legPoints(q, -1), y0 = GROUND_HIPS - q.hipsDrop;
  assert.ok(L.knee[0] > LM.legX * CHIBI_H + 0.05 && R.knee[0] < -LM.legX * CHIBI_H - 0.05, 'gối dạng ra ngoài');
  assert.ok(L.knee[2] > 0.08 && L.ankle[2] > 0.08, 'gối và cổ chân ở phía trước hông');
  assert.ok(y0 + L.sole[1] > -0.04 && y0 + L.sole[1] < 0.06, `bàn chân gần sàn (${(y0 + L.sole[1]).toFixed(3)})`);
  assert.ok(Math.abs(L.ankle[0] - R.ankle[0]) > 0.08 && Math.abs(L.ankle[0] - R.ankle[0]) < 0.3, 'hai cổ chân không dính vào nhau, không xa quá');
});
test('chắp tay (ngồi): hai cổ tay chụm giữa ngực, ở trước thân, ngang ngực (không lên tới cằm)', () => {
  const q = chibiPose({ ...poseFor('sit', 1, 0), sit: 1 }, 'sit', 1, 0), L = limbPoints(q, 1), R = limbPoints(q, -1), sy = L.shoulder[1];
  assert.ok(Math.abs(L.wrist[0]) < 0.07 && Math.abs(R.wrist[0]) < 0.07, `cổ tay x ${L.wrist[0].toFixed(3)} ${R.wrist[0].toFixed(3)}`);
  assert.ok(L.wrist[2] > 0.15 && R.wrist[2] > 0.15, 'cổ tay ở phía trước');
  assert.ok(L.wrist[1] < sy && L.wrist[1] > sy - 0.15, 'cổ tay ngang ngực (dưới vai không quá 15 cm)');
  assert.ok(Math.abs(L.wrist[0] + R.wrist[0]) < 1e-9 && Math.abs(L.wrist[1] - R.wrist[1]) < 1e-9, 'hai bên đối xứng');
  assert.ok(L.elbow[0] > L.wrist[0] && L.elbow[2] < L.wrist[2], 'khuỷu nằm ngoài và phía sau cổ tay (cẳng tay gập lên và vào trong)');
});
test('tư thế tay theo trạng thái: lần hạt, gõ mõ, lạy đều hợp lý (số hữu hạn, trước thân, không xuyên người)', () => {
  for (const [state, t] of [['beads', 0.5], ['beads', 1.1], ['mo', 0.16], ['mo', 0.5], ['bow', 0], ['bow', 0.7], ['bow', 1.5]]) {
    const p = poseFor(state, t, 0), q = chibiPose(p, state, t, 0), L = limbPoints(q, 1), R = limbPoints(q, -1);
    for (const P of [L, R]) for (const pt of Object.values(P)) for (const v of pt) assert.ok(Number.isFinite(v), `${state} ${t}`);
    if (q.spine.x < 0.3) for (const P of [L, R]) assert.ok(P.wrist[2] > 0.1, `${state} ${t}: cổ tay ở trước thân (${P.wrist[2].toFixed(2)})`);
    assert.ok(Math.abs(L.wrist[0]) < 0.12 && Math.abs(R.wrist[0]) < 0.12, `${state} ${t}: hai tay gần giữa ngực`);
  }
});
test('đứng: tay buông hai bên, khuỷu gập nhẹ, cổ tay thấp hơn vai nhiều', () => {
  const q = chibiPose(poseFor('idle', 0, 0), 'idle', 0, 0), L = limbPoints(q, 1);
  assert.ok(q.foreL.y < 0 && q.foreL.y > -0.5, 'khuỷu gập nhẹ'); assert.ok(L.wrist[1] < L.shoulder[1] - 0.2 && L.wrist[0] > 0.12, 'tay buông bên hông');
});
test('đứng/khiêng/vung côn/ném/nhặt: số hữu hạn, đúng hướng', () => {
  const p = poseFor('idle', 0, 0), hold = chibiPose(p, 'idle', 0, 0, { hold: true }), idle = chibiPose(p, 'idle', 0, 0);
  assert.ok(-hold.armL.x > 2 && -idle.armL.x < 0.5);   // giơ tay lên vs buông
  assert.ok(limbPoints(hold, 1).wrist[1] > limbPoints(idle, 1).wrist[1] + 0.4, 'khiêng: cổ tay cao hơn hẳn');
  const up = chibiPose(p, 'idle', 0, 0, { swing: swingPose(0.1) }), down = chibiPose(p, 'idle', 0, 0, { swing: swingPose(0.3) });
  assert.ok(-up.armR.x > 1.5 && -down.armR.x < 1, 'nâng côn rồi chém xuống');
  assert.ok(up.foreR.y > 0 && up.foreR.y < 0.3, 'vung côn: khuỷu phải gần thẳng để côn thẳng hàng với tay');
  for (const name of ['throw', 'grab']) for (let k = 0; k <= 1.0001; k += 0.05) {
    const q = chibiPose(p, 'idle', 0, 0, { act: { name, k } });
    for (const part of BONES.filter((n) => n !== 'hips')) if (q[part]) for (const v of Object.values(q[part])) assert.ok(Number.isFinite(v), `${name} ${part}`);
  }
  assert.ok(chibiPose(p, 'idle', 0, 0, { act: { name: 'throw', k: 0.2 } }).armR.x > 0, 'vung tay ra sau trước khi ném');
  const wind = chibiPose(p, 'idle', 0, 0, { act: { name: 'throw', k: 0.35 } }), rel = chibiPose(p, 'idle', 0, 0, { act: { name: 'throw', k: 0.95 } });
  assert.ok(wind.foreR.y > rel.foreR.y + 0.8, 'ném: co khuỷu lấy đà rồi duỗi ra khi thả');
});
test('mượt: mọi trạng thái thay đổi từng khung 60 fps không giật (bước góc nhỏ), kể cả khuỷu, gối, cổ chân', () => {
  for (const state of ['idle', 'walk', 'sit', 'mo', 'beads', 'bow']) {
    let prev = null, worst = 0;
    for (let i = 0; i < 360; i++) {
      const t = i / 60, q = chibiPose(poseFor(state, t, 2), state, t, 2);
      const flat = [q.spine.x, q.spine.y, q.spine.z, q.head.x, q.armL.x, q.armL.z, q.armR.x, q.armR.z, q.legL.x, q.legR.x, q.hipsDrop,
        q.foreL.y, q.foreL.z, q.foreR.y, q.foreR.z, q.handL.y, q.handR.y, q.shinL.x, q.shinR.x, q.shinL.z, q.footL.x, q.footR.x];
      if (prev) worst = Math.max(worst, ...flat.map((v, k) => Math.abs(v - prev[k]))); prev = flat;
    }
    assert.ok(worst < 0.25, `${state}: bước lớn nhất ${worst}`);
  }
});
test('đi: bắt đầu/dừng bước mượt khi truyền mức walk 0..1 (hông và gối không nhảy)', () => {
  const p = poseFor('walk', 0.1, 2); let prev = null;
  for (let w = 0; w <= 1.0001; w += 0.05) { const q = chibiPose(p, 'walk', 0.1, 2, { walk: w }); const v = [q.hipsDrop, q.shinL.x, q.shinR.x]; if (prev) assert.ok(v.every((x, i) => Math.abs(x - prev[i]) < 0.1)); prev = v; }
});
test('mốc: tỉ lệ hợp lý', () => { assert.ok(LM.crotch < LM.shoulderY && LM.shoulderY < LM.neck && LM.neck < 1); assert.equal(CHIBI_H, 1.5); });
