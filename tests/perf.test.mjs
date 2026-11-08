import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_LEVEL, KEY, clampLevel, levelPlan, createGovernor, loadSaved, save, startLevel } from '../js/scene/perfLogic.js';

const NOW = new Date(2026, 10, 5, 12, 0).getTime();
const mem = (init) => { const m = new Map(init); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
/* Cấp `frames` khung cùng dt; trả danh sách các lần đổi bậc. */
const feedN = (g, frames, dt) => { const ev = []; for (let i = 0; i < frames; i++) { const r = g.feed(dt); if (r) ev.push(r); } return ev; };

test('clampLevel: kẹp 0..5, rác về 0', () => {
  assert.equal(clampLevel(-3), 0); assert.equal(clampLevel(9), MAX_LEVEL); assert.equal(clampLevel('2'), 2);
  assert.equal(clampLevel(2.6), 3); assert.equal(clampLevel(NaN), 0); assert.equal(clampLevel(undefined), 0); assert.equal(clampLevel(null), 0);
});

test('levelPlan: bậc 0 đầy đủ, bậc 5 nhẹ nhất, chỉ ngày càng nhẹ khi bậc tăng', () => {
  const p0 = levelPlan(0, { dpr: 3, shadowBase: 2048 });
  assert.deepEqual(p0, { level: 0, pixelRatio: 2, bloom: true, shadows: true, shadowSize: 2048, forestShadow: true, forest: true, forestDensity: 1, particles: 'full' });
  const p5 = levelPlan(5, { dpr: 3, shadowBase: 2048 });
  assert.deepEqual(p5, { level: 5, pixelRatio: 0.75, bloom: false, shadows: false, shadowSize: 1024, forestShadow: false, forest: true, forestDensity: 0.35, particles: 'low' });
  let prev = levelPlan(0, { dpr: 2 });
  for (let l = 1; l <= MAX_LEVEL; l++) {
    const p = levelPlan(l, { dpr: 2 });
    assert.ok(p.pixelRatio <= prev.pixelRatio, 'pixelRatio không tăng ' + l);
    for (const k of ['bloom', 'shadows', 'forestShadow', 'forest']) assert.ok(!p[k] || prev[k], k + ' không bật lại ở bậc ' + l);
    assert.ok(p.shadowSize <= prev.shadowSize);
    prev = p;
  }
});

test('levelPlan: mốc từng bậc đúng như ghi ở đầu file', () => {
  assert.equal(levelPlan(1, { dpr: 2 }).pixelRatio, 1);
  assert.equal(levelPlan(2).bloom, false); assert.equal(levelPlan(1).bloom, true);
  assert.equal(levelPlan(3, { shadowBase: 2048 }).shadowSize, 1024); assert.equal(levelPlan(3).forestShadow, false); assert.equal(levelPlan(3).shadows, true);
  assert.equal(levelPlan(4).shadows, false); assert.equal(levelPlan(4).forest, true);
  assert.equal(levelPlan(5).forest, true, 'không ẩn hẳn rừng'); assert.equal(levelPlan(5).forestDensity, 0.35); assert.equal(levelPlan(3).forestDensity, 0.7);
  for (let l = 1; l <= 5; l++) assert.ok(levelPlan(l).forestDensity <= levelPlan(l - 1).forestDensity, 'rừng chỉ thưa dần ở bậc ' + l);
});

test('levelPlan: bản đồ bóng không nhỏ hơn 512; dpr thiếu/lạ không làm hỏng', () => {
  assert.equal(levelPlan(3, { shadowBase: 1024 }).shadowSize, 512);
  assert.equal(levelPlan(3, { shadowBase: 512 }).shadowSize, 512);
  assert.equal(levelPlan(0, { dpr: 0 }).pixelRatio, 1);
  assert.equal(levelPlan(0, { dpr: 1.5 }).pixelRatio, 1.5);
});

test('governor: máy mạnh (60 fps) không bao giờ hạ bậc', () => {
  const g = createGovernor();
  assert.deepEqual(feedN(g, 60 * 60, 1 / 60), []); assert.equal(g.level, 0);
});

test('governor: bỏ qua 60 khung đầu dù chậm', () => {
  const g = createGovernor({ warmup: 60 });
  assert.deepEqual(feedN(g, 60, 0.2), []);   // 60 khung đầu 5 fps nhưng không tính
  assert.equal(g.level, 0);
});

test('governor: chậm liên tục thì hạ từng bậc, mỗi bậc cách nhau ≥ 3 cửa sổ, dừng ở bậc tối đa', () => {
  const g = createGovernor();
  const ev = feedN(g, 60 + 20000, 1 / 20);   // 20 fps
  assert.deepEqual(ev.map((e) => e.level), [1, 2, 3, 4, 5]);
  assert.deepEqual(ev.map((e) => e.from), [0, 1, 2, 3, 4]);
  assert.ok(ev.every((e) => Math.abs(e.fps - 20) < 0.5));
  assert.equal(g.level, MAX_LEVEL);
  assert.deepEqual(feedN(g, 2000, 1 / 20), []);   // đã tới đáy, không đổi nữa
});

test('governor: một cửa sổ chậm lẻ loi (giật tạm) không hạ bậc; cần 2 cửa sổ liên tiếp', () => {
  const g = createGovernor({ warmup: 0 });
  assert.deepEqual(feedN(g, 40, 0.05), []);   // đúng 2 giây ở 20 fps → 1 cửa sổ chậm
  assert.deepEqual(feedN(g, 120, 1 / 60), []);   // rồi khỏe lại → xóa dấu
  assert.deepEqual(feedN(g, 40, 0.05), []);
  assert.equal(g.level, 0);
  const ev = feedN(g, 80, 0.05);   // hai cửa sổ chậm liền nhau
  assert.equal(ev.length, 1); assert.equal(ev[0].level, 1);
});

test('governor: sau khi hạ bậc bỏ qua đúng một cửa sổ (biên dịch shader)', () => {
  const g = createGovernor({ warmup: 0 });
  const ev1 = feedN(g, 80, 0.05);   // 4 giây chậm → hạ lên 1 ở cuối giây thứ 4
  assert.equal(ev1.length, 1);
  assert.deepEqual(feedN(g, 40, 0.05), []);   // cửa sổ bỏ qua
  assert.deepEqual(feedN(g, 40, 0.05), []);   // mới 1 dấu
  assert.equal(feedN(g, 40, 0.05).length, 1);   // dấu thứ 2 → hạ tiếp
});

test('governor: khung dt quá lớn (đổi tab) và dt rác không được tính', () => {
  const g = createGovernor({ warmup: 0 });
  assert.equal(g.feed(5), null); assert.equal(g.feed(-1), null); assert.equal(g.feed(0), null); assert.equal(g.feed(NaN), null); assert.equal(g.feed(undefined), null);
  assert.deepEqual(feedN(g, 600, 1 / 60), []);
  assert.equal(g.level, 0);
});

test('governor: ?perf cố định (fixed) không bao giờ tự đổi', () => {
  const g = createGovernor({ start: 3, fixed: true });
  assert.deepEqual(feedN(g, 5000, 1 / 5), []); assert.equal(g.level, 3);
});

test('governor: max thấp hơn thì dừng ở max; start được kẹp', () => {
  const g = createGovernor({ max: 2, warmup: 0 });
  assert.deepEqual(feedN(g, 4000, 0.05).map((e) => e.level), [1, 2]);
  assert.equal(createGovernor({ start: 99 }).level, MAX_LEVEL);
});

test('lưu bậc: ghi rồi đọc lại; hết 7 ngày thì bỏ', () => {
  const s = mem();
  assert.equal(save(s, 3, NOW), true);
  assert.equal(loadSaved(s, NOW + 1000), 3);
  assert.equal(loadSaved(s, NOW + 6 * 86400000), 3);
  assert.equal(loadSaved(s, NOW + 8 * 86400000), 0);
});

test('lưu bậc: dữ liệu hỏng, thiếu, giờ tương lai, lỗi lưu trữ → an toàn', () => {
  assert.equal(loadSaved(mem(), NOW), 0);
  for (const bad of ['', 'abc', '{', 'null', '[]', '{"lv":2}', '{"lv":"x","t":' + NOW + '}', JSON.stringify({ lv: 3, t: NOW + 10 * 86400000 })]) {
    assert.equal(loadSaved(mem([[KEY, bad]]), NOW), 0, bad);
  }
  assert.equal(loadSaved(mem([[KEY, JSON.stringify({ lv: 99, t: NOW })]]), NOW), MAX_LEVEL);
  const boom = { getItem() { throw new Error('chặn'); }, setItem() { throw new Error('đầy'); } };
  assert.equal(loadSaved(boom, NOW), 0); assert.equal(save(boom, 2, NOW), false);
  assert.equal(loadSaved(null, NOW), 0); assert.equal(save(null, 2, NOW), false);
});

test('startLevel: điện thoại bắt đầu ≥ 1; bậc đã nhớ thắng nếu cao hơn; ?perf ép cố định', () => {
  assert.deepEqual(startLevel({ coarse: false, saved: 0, query: '' }), { level: 0, fixed: false });
  assert.deepEqual(startLevel({ coarse: true, saved: 0, query: '' }), { level: 1, fixed: false });
  assert.deepEqual(startLevel({ coarse: true, saved: 3, query: '' }), { level: 3, fixed: false });
  assert.deepEqual(startLevel({ coarse: false, saved: 2, query: '?x=1' }), { level: 2, fixed: false });
  assert.deepEqual(startLevel({ coarse: true, saved: 4, query: '?perf=0' }), { level: 0, fixed: true });
  assert.deepEqual(startLevel({ query: '?rail=1&perf=4' }), { level: 4, fixed: true });
  assert.deepEqual(startLevel({ query: '?perf=9' }), { level: MAX_LEVEL, fixed: true });
  assert.deepEqual(startLevel({ coarse: true, query: '?perf=' }), { level: 1, fixed: false });
  assert.deepEqual(startLevel({ coarse: true, query: '?perf=abc' }), { level: 1, fixed: false });
  assert.deepEqual(startLevel(), { level: 0, fixed: false });
});
