// Tư thế bốn khung (gồng/phát/trúng/hồi) + theo đà: prompt chiêu thức 3D mục 6, mục 14 điểm 3.
import test from 'node:test';
import assert from 'node:assert/strict';
import { castTimeline4, castSample4, trungFrame, hoiFrame, trungPose, hoiPose, theoDa, theTuThe, vaiChieu, HOLD_MS, THEO_DA, VUOT } from '../js/world/chieuPose4.js';
import { castTimeline, castSample, POSE } from '../js/world/chieuPose.js';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';

const IDS = COMBAT_SKILLS.map((s) => s.id);
const nums = (o) => JSON.stringify(o).match(/-?\d+\.?\d*(e-?\d+)?/gi).map(Number);
const dist = (a, b) => Math.max(...nums(a).map((v, i) => Math.abs(v - nums(b)[i])));
const key = (s) => ({ P: s.P, T: s.T, sp: s.sp, lT: s.lT, lP: s.lP, h: s.h, lift: s.lift });

test('lịch bốn khung: tổng giữ nguyên castTimeline; trúng = giữ đỉnh theo vai chiêu; thứ tự pha đúng; chiêu lạ → null', () => {
  for (const id of IDS) {
    const L = castTimeline4(id), O = castTimeline(id);
    assert.ok(Math.abs(L.tong - O.tong) < 1e-9 && L.gong === O.gong && L.phat === O.phat, id);
    assert.ok(Math.abs(L.gong + L.phat + L.trung + L.hoi - L.tong) < 1e-9, id);
    const vai = vaiChieu(id); assert.ok(L.trung > 0 && L.trung <= HOLD_MS[vai] / 1000 + 1e-9 && L.hoi > 0, id);
    const seq = []; for (let t = 0; t < L.tong; t += 0.005) { const p = castSample4(id, t).phase; if (seq[seq.length - 1] !== p) seq.push(p); }
    assert.deepEqual(seq, ['gong', 'phat', 'trung', 'hoi'], id);
    assert.equal(castSample4(id, L.tong), null); assert.equal(castSample4(id, -0.01), null);
  }
  assert.equal(HOLD_MS.thuong, 50); assert.ok(Math.max(...Object.values(HOLD_MS)) <= 120);
  for (const x of ['khong-co', null, undefined, 7, '__proto__']) { assert.equal(castTimeline4(x), null); assert.equal(castSample4(x, 0.1), null); assert.equal(theoDa(x, 0.5), null); assert.equal(theTuThe(x), null); assert.equal(trungFrame(x), null); assert.equal(hoiFrame(x), null); }
  assert.equal(vaiChieu('kim_tuyet'), 'tuyet'); assert.equal(vaiChieu('kim_kimcang_4'), 'chieu4'); assert.equal(vaiChieu('kim_1'), 'thuong');
});

test('mượt: không nhảy tư thế ở ranh giới các pha (kể cả gồng→phát, phát→trúng, trúng→hồi); khung gồng/phát khớp castSample gốc', () => {
  for (const id of IDS) {
    const L = castTimeline4(id), edges = [L.gong, L.gong + L.phat, L.gong + L.phat + L.trung];
    for (const e of edges) { const a = castSample4(id, e - 1e-4), b = castSample4(id, e + 1e-4); assert.ok(dist(key(a), key(b)) < 0.05, `${id} @${e.toFixed(3)} nhảy ${dist(key(a), key(b)).toFixed(3)}`); assert.ok(Math.abs(a.w - b.w) < 0.05); }
    for (const t of [0.02, L.gong * 0.5, L.gong + L.phat * 0.5]) assert.deepEqual(key(castSample4(id, t)), key(castSample(id, t)), `${id} t=${t} phải giống bản gốc`);
  }
});

test('khung trúng: vươn quá thế phát (≈12%) nhưng trong biên an toàn, không nhấc người thêm, dựng được xương hợp lệ; khung hồi gần thế nghỉ', () => {
  assert.equal(VUOT, 0.12);
  for (const id of IDS) {
    const p = POSE[id].phat, g = POSE[id].gong, tr = trungFrame(id), ho = hoiFrame(id);
    assert.equal(tr.lift, p.lift, `${id} không bay thêm`);
    assert.ok(tr.h >= 0 && tr.h <= 0.3 && tr.sp[0] >= -0.6 && tr.sp[0] <= 1 && Math.abs(tr.sp[1]) <= 0.8, id);
    for (const a of [tr.P, tr.T]) { assert.ok(a[0] >= -1.2 && a[0] <= 3.1 && a[2] >= 0 && a[2] <= 2.4, `${id} tay ${a}`); }
    for (const l of [tr.lT, tr.lP]) assert.ok(l[0] >= -1.6 && l[0] <= 1 && l[1] >= 0 && l[1] <= 2.4, `${id} chân ${l}`);
    // vươn đúng hướng: nếu phát khác gồng ở tay phải-tiến thì trúng ≥ phát theo cùng hướng (trừ khi chạm biên)
    const dir = Math.sign(p.P[0] - g.P[0]); if (dir && Math.abs(p.P[0]) < 2.9) assert.ok((tr.P[0] - p.P[0]) * dir >= -1e-9, id);
    for (const q of [trungPose(id), hoiPose(id)]) { assert.ok(nums(q).every(Number.isFinite), id); assert.ok(q.hipsDrop >= 0); }
    assert.ok(ho.sp[0] > POSE[id].thu.sp[0] - 1e-9 || POSE[id].thu.sp[0] >= 0.12, `${id} hồi chúi nhẹ`);
  }
});

test('theo đà: 0 trước lúc phát; áo bay trước, đai trễ, tóc trễ hơn; tắt dần về 0; biên độ ≤ 1 và Tuyệt học > Chiêu 4 > thường', () => {
  for (const id of IDS) {
    const L = castTimeline(id);
    for (const t of [0, L.gong * 0.5, L.gong]) assert.deepEqual(theoDa(id, t), { ao: 0, dai: 0, toc: 0 }, id);
    const s1 = theoDa(id, L.gong + 0.05); assert.notEqual(s1.ao, 0, id); assert.equal(s1.toc, 0, `${id} tóc chưa kịp bay`);
    let peak = 0; for (let t = L.gong; t < L.gong + THEO_DA.het; t += 0.01) { const v = theoDa(id, t); for (const x of Object.values(v)) { assert.ok(Math.abs(x) <= 1, id); peak = Math.max(peak, Math.abs(x)); } }
    assert.ok(peak > 0.1, `${id} peak ${peak}`);
    assert.deepEqual(theoDa(id, L.gong + THEO_DA.het + 0.5), { ao: 0, dai: 0, toc: 0 });
    assert.deepEqual(theoDa(id, 1.234), theoDa(id, 1.234), 'cùng (id, t) cùng kết quả');
  }
  const peakOf = (id) => { const L = castTimeline(id); let m = 0; for (let t = L.gong; t < L.gong + 2; t += 0.005) m = Math.max(m, Math.abs(theoDa(id, t).ao)); return m; };
  assert.ok(peakOf('kim_tuyet') > peakOf('kim_kimcang_4') && peakOf('kim_kimcang_4') > peakOf('kim_1'));
  assert.deepEqual(theoDa('kim_1', Number.NaN), { ao: 0, dai: 0, toc: 0 });
});

test('thẻ tư thế: đủ 4 khung Gồng/Phát/Trúng/Hồi với góc nguyên độ; mắt nhìn mục tiêu', () => {
  for (const id of IDS) {
    const b = theTuThe(id); assert.deepEqual(b.map((x) => x.khung), ['Gồng', 'Phát', 'Trúng', 'Hồi'], id);
    for (const x of b) { assert.ok(Number.isInteger(x.thanChui) && Number.isInteger(x.thanXoay) && x.tayPhai.every(Number.isInteger) && x.tayTrai.every(Number.isInteger), id); assert.equal(x.nhin, 'mục tiêu'); assert.ok(Number.isFinite(x.haHong) && x.haHong >= 0); }
  }
});

test('nối vào nhân vật: avatarChibi dùng castSample4 (4 khung), không còn castSample ba khung', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../js/world/avatarChibi.js', import.meta.url), 'utf8');
  assert.match(src, /import \{ castSample4 \} from '\.\/chieuPose4\.js'/);
  assert.match(src, /castF = castSample4\(castId, castT\)/);
  assert.doesNotMatch(src, /castSample\(castId/);
});
