import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTS, LEVELS, levelOf, levelReward, record, loadProg, emptyProg, questStatus, dayKey, EVENT_TYPES } from '../js/world/quests.js';

const T0 = new Date(2026, 10, 5, 9, 0).getTime(), T1 = T0 + 86400000;
const run = (p, evs, now = T0) => evs.reduce((s, e) => { const r = record(s.prog, e, now); return { prog: r.prog, done: [...s.done, ...r.done], up: r.levelUp || s.up, sen: s.sen + r.gain.sen, xp: s.xp + r.gain.xp }; }, { prog: p, done: [], up: null, sen: 0, xp: 0 });

test('nhiệm vụ: id không trùng, khoá sự kiện hợp lệ, thưởng dương', () => {
  assert.equal(new Set(QUESTS.map((q) => q.id)).size, QUESTS.length);
  for (const q of QUESTS) { assert.ok(EVENT_TYPES.includes(q.dk.key.split(':')[0]), q.id); assert.ok(q.dk.n >= 1 && q.xp > 0 && q.sen >= 0, q.id); assert.ok(['ngay', 'mot'].includes(q.loai)); assert.ok(q.ten.length && q.mo.length); }
});

test('cấp độ: tăng dần, danh hiệu, thanh tiến độ', () => {
  for (let i = 1; i < LEVELS.length; i++) assert.ok(LEVELS[i].xp > LEVELS[i - 1].xp);
  assert.deepEqual([levelOf(0).lv, levelOf(29).lv, levelOf(30).lv, levelOf(1e9).lv], [1, 1, 2, LEVELS.length]);
  assert.equal(levelOf(1e9).xp1, null); assert.equal(levelOf(1e9).pct, 100);
  assert.equal(levelOf(55).pct, 50); assert.equal(levelOf(-5).lv, 1); assert.equal(levelOf('x').lv, 1);
  assert.equal(levelReward(1), 0); assert.equal(levelReward(3), 6);
});

test('nhiệm vụ hằng ngày: đếm, hoàn thành một lần, làm lại sang ngày mới', () => {
  let s = run(emptyProg(), [{ type: 'bow' }, { type: 'bow' }]);
  assert.equal(s.done.length, 0);
  s = run(s.prog, [{ type: 'bow' }]);
  assert.deepEqual(s.done.map((q) => q.id), ['n-lay']); assert.equal(s.xp, 15);
  s = run(s.prog, [{ type: 'bow' }, { type: 'bow' }]);
  assert.equal(s.done.length, 0, 'không thưởng lại trong ngày');
  s = run(s.prog, [{ type: 'bow' }, { type: 'bow' }, { type: 'bow' }], T1);
  assert.deepEqual(s.done.map((q) => q.id), ['n-lay'], 'ngày sau làm lại được');
});

test('nhiệm vụ một lần: nhang cộng theo số nén, không trùng, điểm lên cấp + hạt sen', () => {
  let s = run(emptyProg(), [{ type: 'nhang', n: 9 }, { type: 'nhang', n: 9 }]);
  assert.ok(s.done.some((q) => q.id === 'n-nhang'));
  assert.ok(!s.done.some((q) => q.id === 'm-nhang'));
  s = run(s.prog, [{ type: 'nhang', n: 3 }]);
  assert.ok(s.done.some((q) => q.id === 'm-nhang'), '21 nén tổng');
  const again = run(s.prog, [{ type: 'nhang', n: 9 }], T1);
  assert.ok(!again.done.some((q) => q.id === 'm-nhang'), 'một lần suốt đời');
  assert.ok(levelOf(s.prog.xp).lv >= 2);
});

test('lên cấp: trả levelUp và thưởng thêm hạt sen', () => {
  const r = record(emptyProg(), { type: 'kinh' }, T0);   // n-kinh: 20 xp, chưa đủ 30
  assert.equal(r.levelUp, null);
  const r2 = record(r.prog, { type: 'thien' }, T0);       // +10 → 40 xp → cấp 2
  assert.deepEqual([r2.levelUp.from, r2.levelUp.to, r2.levelUp.sen], [1, 2, 4]);
  assert.equal(r2.gain.sen, 1 + 4);
});

test('khác biệt NPC / điểm đến, đếm khác nhau', () => {
  let s = run(emptyProg(), ['truru', 'truru', 'trikhach', 'cusi', 'bacnong'].map((arg) => ({ type: 'npc', arg })));
  assert.ok(!s.done.some((q) => q.id === 'm-npc'), 'mới 4 người khác nhau');
  s = run(s.prog, [{ type: 'npc', arg: 'be' }]);
  assert.ok(s.done.some((q) => q.id === 'm-npc'));
  s = run(emptyProg(), [{ type: 'visit', arg: 'thacnuoc' }]);
  assert.deepEqual(s.done.map((q) => q.id), ['m-thac']);
  s = run(emptyProg(), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((arg) => ({ type: 'visit', arg })));
  assert.ok(s.done.some((q) => q.id === 'm-dao'));
});

test('sự kiện lạ hoặc thiếu arg: bỏ qua, không sửa trạng thái cũ', () => {
  const p = emptyProg(), json = JSON.stringify(p);
  for (const e of [null, {}, { type: 'xyz' }, { type: 'npc' }, { type: 'visit', arg: '<script>' }, { type: 'npc', arg: 'a'.repeat(50) }]) assert.equal(record(p, e, T0).prog, p);
  assert.equal(JSON.stringify(p), json);
});

test('loadProg: dữ liệu hỏng/không đáng tin → trạng thái sạch; lưu rồi đọc lại giống nhau', () => {
  for (const bad of [null, '', '{', '[]', '5', { xp: 'abc', tot: [], seen: 3, done: 'x', day: 9 }]) { const p = loadProg(bad); assert.equal(p.xp, 0); assert.deepEqual(p.done, {}); }
  const s = run(emptyProg(), [{ type: 'nhang', n: 3 }, { type: 'npc', arg: 'truru' }, { type: 'visit', arg: 'lang' }]);
  assert.deepEqual(loadProg(JSON.stringify(s.prog)), s.prog);
  const evil = loadProg({ xp: -5, done: { 'm-lang': true, 'khong-co': true, 'n-lay': true }, seen: { npc: ['ok', '<b>', 7] }, tot: { 'a b': 1, nhang: 2 }, day: { k: 'x', done: { 'n-lay': true } } });
  assert.equal(evil.xp, 0); assert.deepEqual(evil.done, { 'm-lang': true }); assert.deepEqual(evil.seen.npc, ['ok']); assert.deepEqual(evil.tot, { nhang: 2 });
});

test('questStatus: hằng ngày trước một lần; ngày mới thì hằng ngày về 0 còn một lần giữ nguyên', () => {
  const s = run(emptyProg(), [{ type: 'bow' }, { type: 'bow' }, { type: 'visit', arg: 'lang' }]);
  const a = questStatus(s.prog, T0), lay = a.find((x) => x.q.id === 'n-lay');
  assert.equal(lay.cur, 2); assert.ok(a.find((x) => x.q.id === 'm-lang').done);
  assert.equal(a[0].q.loai, 'ngay');
  const b = questStatus(s.prog, T1);
  assert.equal(b.find((x) => x.q.id === 'n-lay').cur, 0); assert.ok(b.find((x) => x.q.id === 'm-lang').done);
  assert.equal(dayKey(T0), '2026-11-05');
});

test('Phiên 47: câu được cá và phóng sinh ghi nhận đúng nhiệm vụ, phóng sinh làm cả việc hằng ngày', () => {
  const T = new Date(2026, 10, 7, 9, 0).getTime();
  assert.ok(EVENT_TYPES.includes('cau') && EVENT_TYPES.includes('phongsinh'));
  const a = record(emptyProg(), { type: 'cau' }, T); assert.deepEqual(a.done.map((q) => q.id), ['m-cau']);
  const b = record(a.prog, { type: 'phongsinh' }, T); assert.deepEqual(b.done.map((q) => q.id).sort(), ['m-phongsinh', 'n-phongsinh']);
  const c = record(b.prog, { type: 'phongsinh' }, T); assert.equal(c.done.length, 0);
  const next = record(c.prog, { type: 'phongsinh' }, T + 24 * 3600 * 1000); assert.deepEqual(next.done.map((q) => q.id), ['n-phongsinh']);   // sang ngày: làm lại việc hằng ngày, hành trình không lặp
});
test('Phiên 51: đặt món nội thất đầu tiên hoàn thành nhiệm vụ m-noithat', () => {
  assert.ok(EVENT_TYPES.includes('noithat'));
  const a = record(emptyProg(), { type: 'noithat' }, new Date(2026, 10, 7, 9, 0).getTime()); assert.deepEqual(a.done.map((q) => q.id), ['m-noithat']);
});
test('Phiên 52: nhảy đủ 3 lần hoàn thành nhiệm vụ m-khinhthan', () => {
  const T0 = new Date(2026, 10, 7, 9, 0).getTime();
  let r = record(emptyProg(), { type: 'khinhthan' }, T0); assert.equal(r.done.length, 0);
  r = record(r.prog, { type: 'khinhthan' }, T0); r = record(r.prog, { type: 'khinhthan' }, T0);
  assert.deepEqual(r.done.map((q) => q.id), ['m-khinhthan']);
});
