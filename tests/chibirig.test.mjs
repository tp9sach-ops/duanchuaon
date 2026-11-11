import test from 'node:test';
import assert from 'node:assert/strict';
import { skinOf, zoneOf, armAngle, armTarget, chibiPose, B, BONES, LM, CHIBI_H } from '../js/world/chibiRig.js';
import { poseFor } from '../js/world/avatarLogic.js';
import { swingPose } from '../js/world/conKhi.js';

test('trọng số da: tổng = 1, chỉ số hợp lệ, mọi điểm trên thân đều có xương', () => {
  for (let nx = -0.4; nx <= 0.4; nx += 0.02) for (let ny = 0; ny <= 1; ny += 0.02) {
    const { idx, w } = skinOf(nx, ny), sum = w.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-6, `tổng ${sum} tại ${nx},${ny}`);
    assert.ok(idx.every((i) => i >= 0 && i < BONES.length)); assert.ok(w.every((x) => x >= 0));
  }
});
test('trọng số da: đầu theo xương đầu, thân theo xương thân, tay theo đúng bên, chân theo đúng bên', () => {
  assert.equal(skinOf(0, 0.85).idx[0], B.head); assert.equal(skinOf(0.2, 0.7).idx[0], B.head);   // tai cũng thuộc đầu
  assert.equal(skinOf(0, 0.4).idx[0], B.spine);
  assert.equal(skinOf(0.3, 0.45).idx[0], B.armL); assert.equal(skinOf(-0.3, 0.45).idx[0], B.armR);
  assert.equal(skinOf(0.06, 0.1).idx[0], B.legL); assert.equal(skinOf(-0.06, 0.1).idx[0], B.legR);
  const mid = skinOf(0, 0.1); assert.ok(Math.abs(mid.w[0] - 0.5) < 1e-6 && Math.abs(mid.w[1] - 0.5) < 1e-6, 'sát giữa: chia đều hai chân');
});
test('vùng màu: giày, quần, áo, tay áo, da', () => {
  assert.equal(zoneOf(0.05, 0.01), 'shoe'); assert.equal(zoneOf(0.05, 0.15), 'pants'); assert.equal(zoneOf(0.02, 0.4), 'shirt');
  assert.equal(zoneOf(0.16, 0.45), 'sleeve'); assert.equal(zoneOf(0.3, 0.45), 'skin'); assert.equal(zoneOf(0, 0.8), 'skin');
});
test('góc tay: buông thẳng xuống hai bên; chắp tay khép vào; giơ lên khi khiêng', () => {
  const l = armAngle(1, 0, 0), r = armAngle(-1, 0, 0);
  assert.ok(Math.abs(l.z + Math.PI / 2) < 1e-9 && Math.abs(r.z - Math.PI / 2) < 1e-9 && l.x === 0);
  assert.ok(armTarget('idle', 0).out > 0 && armTarget('sit', 0).out < 0 && armTarget('bow', 0).out < 0);
  assert.ok(armTarget('walk', 0, true).fwd > 2);
});
test('đi: chân đối nhau, tay đánh ngược chân cùng bên (tự nhiên), thân đung đưa', () => {
  const p = poseFor('walk', 0.3, 2), q = chibiPose(p, 'walk', 0.3, 2);
  assert.ok(Math.abs(q.legL.x + q.legR.x) < 1e-9);
  assert.ok((-q.legL.x) * (-q.armL.x - 0.12) <= 1e-9, 'chân trái ra trước thì tay trái ra sau (và ngược lại)');
  assert.ok(Math.abs(q.spine.z) <= 0.05 + 1e-9);
});
test('ngồi: hông hạ, hai chân duỗi ra trước, tay chắp', () => {
  const q = chibiPose({ ...poseFor('sit', 1, 0), sit: 1 }, 'sit', 1, 0);
  assert.ok(q.hipsDrop > 0.2 && q.legL.x < -1.4 && q.legR.x < -1.4 && q.legL.z > 0 && q.legR.z < 0);
  assert.ok(q.armL.z < -Math.PI / 2 && -q.armL.x > 1, 'tay chắp: khép vào (z < −90°: vượt qua thẳng xuống), đưa ra trước');
});
test('đứng/khiêng/vung côn/ném/nhặt: số hữu hạn, đúng hướng', () => {
  const p = poseFor('idle', 0, 0), hold = chibiPose(p, 'idle', 0, 0, { hold: true }), idle = chibiPose(p, 'idle', 0, 0);
  assert.ok(-hold.armL.x > 2 && -idle.armL.x < 0.5);   // giơ tay lên vs buông
  const up = chibiPose(p, 'idle', 0, 0, { swing: swingPose(0.1) }), down = chibiPose(p, 'idle', 0, 0, { swing: swingPose(0.3) });
  assert.ok(-up.armR.x > 1.5 && -down.armR.x < 1, 'nâng côn rồi chém xuống');
  for (const name of ['throw', 'grab']) for (let k = 0; k <= 1.0001; k += 0.05) {
    const q = chibiPose(p, 'idle', 0, 0, { act: { name, k } });
    for (const part of ['spine', 'head', 'armL', 'armR', 'legL', 'legR']) for (const v of Object.values(q[part])) assert.ok(Number.isFinite(v), `${name} ${part}`);
  }
  assert.ok(chibiPose(p, 'idle', 0, 0, { act: { name: 'throw', k: 0.2 } }).armR.x > 0, 'vung tay ra sau trước khi ném');
});
test('mượt: mọi trạng thái thay đổi từng khung 60 fps không giật (bước góc nhỏ)', () => {
  for (const state of ['idle', 'walk', 'sit', 'mo', 'beads', 'bow']) {
    let prev = null, worst = 0;
    for (let i = 0; i < 360; i++) {
      const t = i / 60, q = chibiPose(poseFor(state, t, 2), state, t, 2);
      const flat = [q.spine.x, q.spine.y, q.spine.z, q.head.x, q.armL.x, q.armL.z, q.armR.x, q.armR.z, q.legL.x, q.legR.x, q.hipsDrop];
      if (prev) worst = Math.max(worst, ...flat.map((v, k) => Math.abs(v - prev[k]))); prev = flat;
    }
    assert.ok(worst < 0.25, `${state}: bước lớn nhất ${worst}`);
  }
});
test('mốc: tỉ lệ hợp lý', () => { assert.ok(LM.crotch < LM.shoulderY && LM.shoulderY < LM.neck && LM.neck < 1); assert.equal(CHIBI_H, 1.5); });
