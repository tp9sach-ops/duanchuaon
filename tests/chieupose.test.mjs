// Tư thế 30 chiêu Ngũ Hành (Phiên 159, Bản 2 mục 5): đủ 30 chiêu × 3 khung, lịch khớp thẻ chiêu, liên tục, khớp trong giới hạn, tay không xuyên thân, chân chạm đất, gồng khác phát.
import test from 'node:test';
import assert from 'node:assert/strict';
import { POSE, PHAT, hasCast, castTimeline, castSample, framePose, applyCast } from '../js/world/chieuPose.js';
import { chieuOf } from '../js/world/chieuNguHanh.js';
import { chibiPose, limbPoints, legPoints, eulerMat, CHIBI_H, LM, ELBOW_MAX, KNEE_MAX } from '../js/world/chibiRig.js';

const IDS = Object.keys(POSE), HE = ['kim', 'moc', 'thuy', 'tho', 'hoa'];
const REST = { armL: 0, armR: 0, legL: 0, legR: 0, lean: 0, head: 0, sit: 0 };
const q0 = () => chibiPose(REST, 'idle', 0, 0, {});
const CROTCH = LM.crotch * CHIBI_H;
const T = (m) => m[0].map((_, j) => [m[0][j], m[1][j], m[2][j]]);   // chuyển vị = nghịch đảo ma trận xoay
const mulv = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
const frames = (id) => [POSE[id].gong, POSE[id].phat, POSE[id].thu];
const dist = (a, b) => ['P', 'T', 'sp', 'lT', 'lP'].reduce((s, k) => s + a[k].reduce((t, v, i) => t + Math.abs(v - b[k][i]), 0), 0);

test('đủ 30 chiêu, mỗi Hệ 6, mỗi chiêu có thẻ chiêu và 3 khung (gồng/phát/thu)', () => {
  assert.equal(IDS.length, 30);
  for (const he of HE) assert.equal(IDS.filter((i) => i.startsWith(he + '_')).length, 6, he);
  for (const id of IDS) { assert.ok(hasCast(id), id); assert.ok(POSE[id].gong && POSE[id].phat && POSE[id].thu, id); }
  assert.equal(hasCast('khong-co'), false); assert.equal(hasCast(null), false); assert.equal(castTimeline('x'), null); assert.equal(castSample('x', 0.1), null);
  for (const id of Object.keys(PHAT)) assert.ok(POSE[id], 'PHAT trỏ chiêu có thật: ' + id);
});

test('lịch: gồng = gồng của thẻ, thu = hậu động kẹp 0,25–0,8 s, phát 0,1–0,4 s; tuyệt học gồng ≥ 1,5 s', () => {
  for (const id of IDS) {
    const c = chieuOf(id), L = castTimeline(id);
    assert.equal(L.gong, c.gong, id); assert.ok(L.thu >= 0.25 && L.thu <= 0.8, id); assert.ok(L.phat >= 0.1 && L.phat <= 0.4, id);
    assert.ok(Math.abs(L.tong - (L.gong + L.phat + L.thu)) < 1e-3, id);
    if (id.endsWith('_tuyet')) assert.ok(L.gong >= 1.5, id);
  }
});

test('lấy mẫu: đúng thứ tự gồng → phát → thu, hết giờ trả null, trọng số w về 0 ở hai đầu, thuần (cùng skillId + t → cùng tư thế)', () => {
  for (const id of IDS) {
    const L = castTimeline(id);
    assert.equal(castSample(id, -0.01), null); assert.equal(castSample(id, L.tong), null); assert.equal(castSample(id, L.tong + 5), null);
    assert.equal(castSample(id, L.gong * 0.5).phase, 'gong'); assert.equal(castSample(id, L.gong + L.phat * 0.5).phase, 'phat'); assert.equal(castSample(id, L.gong + L.phat + L.thu * 0.5).phase, 'thu');
    assert.ok(castSample(id, 0).w < 1e-9 && castSample(id, L.tong - 1e-4).w < 0.05, id);
    assert.ok(castSample(id, L.gong + L.phat * 0.9).w === 1, 'giữa chiêu hòa hoàn toàn');
    assert.deepEqual(castSample(id, L.gong * 0.7), castSample(id, L.gong * 0.7));
  }
  assert.equal(castSample('kim_1', 'x').phase, 'gong'); // t lạ → coi như 0
});

test('liên tục: không khung nào nhảy (tay/thân/chân đổi dưới ngưỡng giữa hai mẫu cách 10 ms), mọi số hữu hạn', () => {
  for (const id of IDS) {
    const L = castTimeline(id); let prev = null;
    for (let t = 0; t < L.tong; t += 0.01) {
      const s = castSample(id, t), f = framePose(s);
      for (const k of ['spine', 'armL', 'armR', 'legL', 'legR', 'shinL', 'shinR']) for (const ax of ['x', 'y', 'z']) assert.ok(Number.isFinite(f[k][ax]), `${id} ${k}.${ax}`);
      assert.ok(Number.isFinite(f.hipsDrop) && Number.isFinite(s.lift) && Number.isFinite(s.w), id);
      if (prev) for (const k of ['spine', 'armL', 'armR', 'legL', 'legR', 'shinL', 'shinR']) for (const ax of ['x', 'y', 'z']) assert.ok(Math.abs(f[k][ax] - prev[k][ax]) < (id === 'hoa_hoalong_4' ? 0.8 : 0.6), `${id} ${k}.${ax} nhảy @${t.toFixed(2)}: ${Math.abs(f[k][ax] - prev[k][ax])}`);
      prev = f;
    }
  }
});

test('khớp trong giới hạn: khuỷu ≤ 2,6, gối ≤ 2,4 rad; thân chúi/ngả ≤ 1,0 rad; hạ hông ≤ 0,3 m', () => {
  for (const id of IDS) for (const f of frames(id)) {
    assert.ok(f.P[2] >= 0 && f.P[2] <= ELBOW_MAX && f.T[2] >= 0 && f.T[2] <= ELBOW_MAX, `${id} khuỷu`);
    assert.ok(f.lT[1] >= 0 && f.lT[1] <= KNEE_MAX && f.lP[1] >= 0 && f.lP[1] <= KNEE_MAX, `${id} gối`);
    assert.ok(Math.abs(f.sp[0]) <= 1.0 && Math.abs(f.sp[1]) <= 1.0, `${id} thân`);
    assert.ok(framePose(f).hipsDrop <= 0.3, `${id} hạ hông ${framePose(f).hipsDrop}`);
  }
});

test('chân chạm đất: bàn chân thấp nhất sát mặt đất (|y| ≤ 1 cm), không lún; tay không chui xuống đất', () => {
  for (const id of IDS) {
    const L = castTimeline(id);
    for (let t = 0; t < L.tong; t += 0.02) {
      const s = castSample(id, t), f = framePose(s), h = CROTCH - f.hipsDrop;
      const sl = Math.min(legPoints(f, 1).sole[1], legPoints(f, -1).sole[1]) + h;
      assert.ok(sl >= -0.01 && sl <= 0.01, `${id} @${t.toFixed(2)} bàn chân cao ${sl.toFixed(3)} m`);
      for (const side of [1, -1]) { const a = limbPoints(f, side); for (const n of ['elbow', 'wrist', 'tip']) assert.ok(a[n][1] + h >= -0.02, `${id} @${t.toFixed(2)} ${n} chui xuống đất (${(a[n][1] + h).toFixed(3)})`); }
    }
  }
});

test('tay không xuyên thân: khuỷu, cổ tay, đầu bàn tay không nằm sâu trong hộp thân (|x| < 0,10; |z| < 0,06; y 0,03–0,40 m, tính trong hệ xoay theo thân)', () => {
  for (const id of IDS) for (const [name, f] of [['gong', POSE[id].gong], ['phat', POSE[id].phat], ['thu', POSE[id].thu]]) {
    const p = framePose(f), Ti = T(eulerMat(p.spine));
    for (const side of [1, -1]) { const a = limbPoints(p, side); for (const n of ['wrist', 'tip']) { const v = mulv(Ti, a[n]); assert.ok(!(Math.abs(v[0]) < 0.1 && Math.abs(v[2]) < 0.06 && v[1] > 0.03 && v[1] < 0.4), `${id}.${name} ${side > 0 ? 'T' : 'P'} ${n} xuyên thân [${v.map((x) => x.toFixed(3))}]`); } }
  }
});

test('hình bóng: gồng khác hẳn phát (đối thủ đọc được); hai chiêu bất kỳ có khung phát khác nhau', () => {
  for (const id of IDS) assert.ok(dist(POSE[id].gong, POSE[id].phat) >= 1.0, `${id} gồng ≈ phát (${dist(POSE[id].gong, POSE[id].phat).toFixed(2)})`);
  for (let i = 0; i < IDS.length; i++) for (let j = i + 1; j < IDS.length; j++) assert.ok(dist(POSE[IDS[i]].phat, POSE[IDS[j]].phat) > 0.05, `${IDS[i]} ≈ ${IDS[j]}`);
});

test('mã Phát khớp Bản 2 mục 5 (mẫu): Kim Cương Trảm, Thái Sơn Áp Đỉnh, Hỏa Long Xuất Hải, Long Tức Trảm (nhát cuối nhảy 0,8 m)', () => {
  assert.deepEqual([POSE.kim_1.phat.P.slice(0, 3), POSE.kim_1.phat.T.slice(0, 3), POSE.kim_1.phat.sp.slice(0, 2), POSE.kim_1.phat.lT, POSE.kim_1.phat.lP, POSE.kim_1.phat.h], [[2.0, 0.3, 0.1], [0.5, -0.3, 1.0], [0.3, -0.35], [-0.8, 0.2], [0.5, 0.1], 0.1]);
  assert.deepEqual([POSE.tho_tuyet.phat.sp[0], POSE.tho_tuyet.phat.lT, POSE.tho_tuyet.phat.lP, POSE.tho_tuyet.phat.h], [0.9, [-1.0, 1.4], [0.6, 0.9], 0.25]);
  assert.deepEqual([POSE.hoa_3.phat.P.slice(0, 3), POSE.hoa_3.phat.T.slice(0, 3), POSE.hoa_3.phat.sp[0]], [[2.6, 0.2, 0.1], [2.4, 0.3, 0.1], -0.35]);
  assert.deepEqual([POSE.hoa_hoalong_4.phat.sp[0], POSE.hoa_hoalong_4.phat.lT, POSE.hoa_hoalong_4.phat.lP, POSE.hoa_hoalong_4.phat.lift], [0.8, [-1.0, 1.6], [-0.6, 1.4], 0.8]);
  for (const id of IDS) if (id !== 'hoa_hoalong_4') assert.equal(POSE[id].phat.lift, 0, id);
});

test('hòa lên tư thế thường: w = 0 giữ nguyên, w = 1 thay hẳn, không sửa q; hipsDrop và tay khớp framePose', () => {
  const q = q0(), snap = JSON.stringify(q);
  assert.equal(applyCast(q, null), q); assert.equal(applyCast(q, { w: 0 }), q);
  const L = castTimeline('hoa_3'), s = castSample('hoa_3', L.gong + L.phat * 0.95), o = applyCast(q, s), c = framePose(s);
  assert.equal(JSON.stringify(q), snap, 'không sửa q'); assert.equal(s.w, 1);
  assert.deepEqual(o.armR, c.armR); assert.deepEqual(o.legL, c.legL); assert.ok(Math.abs(o.hipsDrop - c.hipsDrop) < 1e-12);
  const half = applyCast(q, { ...s, w: 0.5 }); assert.ok(Math.abs(half.spine.x - (q.spine.x + c.spine.x) / 2) < 1e-12);
  for (const k of ['head']) assert.deepEqual(o[k], q[k]);
});
