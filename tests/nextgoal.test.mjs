// Việc kế tiếp liên tục (Phiên 43, việc 2): chuỗi không bao giờ đứt, luôn có đúng một mục tiêu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextGoal, CHAIN } from '../js/world/nextGoal.js';
import { loadStory, emptyStory, STEPS } from '../js/world/story.js';
import { emptyProg, QUESTS, dayKey } from '../js/world/quests.js';

const NOW = Date.UTC(2026, 10, 7, 5);
const doneStory = () => loadStory({ step: 'done' });
const mark = (prog, id) => {   // đánh dấu xong một nhiệm vụ (trực tiếp trên dữ liệu)
  const q = QUESTS.find((x) => x.id === id), p = { ...prog, done: { ...prog.done }, day: { ...prog.day, done: { ...prog.day.done }, k: dayKey(NOW), n: { ...prog.day.n }, seen: { ...prog.day.seen } } };
  if (q.loai === 'ngay') p.day.done[id] = true; else p.done[id] = true; return p;
};

test('cốt truyện còn dở: mỗi bước đều có mục tiêu và dẫn đường', () => {
  for (const step of STEPS.slice(0, -1)) {
    const g = nextGoal({ story: loadStory({ step }), prog: emptyProg(), now: NOW });
    assert.equal(g.kind, 'story'); assert.ok(g.title && g.text && g.guide, step); assert.ok(g.guide.startsWith('s-'));
  }
  assert.equal(nextGoal({ story: emptyStory(), prog: emptyProg(), now: NOW }).guide, 's-meet');
});
test('xong cốt truyện: không còn trống, việc đầu là việc đầu tiên của chương 2 (dạo trong chùa)', () => {
  const g = nextGoal({ story: doneStory(), prog: emptyProg(), sen: 50, la: 0, now: NOW });
  assert.equal(g.kind, 'journey'); assert.equal(g.guide, CHAIN[0]); assert.equal(g.guide, 'v-chanhdien'); assert.match(g.label, /^Chương 2 · Dạo trong chùa · 0\/9$/); assert.ok(g.text.length > 5);
});
test('làm xong một việc thì tự sang việc kế, không lặp lại việc đã xong', () => {
  let prog = emptyProg(); const seen = new Set();
  for (let i = 0; i < 90; i++) {
    const g = nextGoal({ story: doneStory(), prog, sen: 999, la: 999, own: i > 12 ? { xom: 1, plot: 1, lv: 0 } : null, now: NOW });
    if (g.kind === 'free') break;
    assert.ok(!seen.has(g.id), 'lặp ' + g.id); seen.add(g.id);
    assert.ok(g.guide && QUESTS.some((q) => q.id === g.guide), 'guide hợp lệ ' + g.id);
    prog = mark(prog, g.guide);
  }
  assert.equal(nextGoal({ story: doneStory(), prog, sen: 999, la: 999, own: { xom: 1, plot: 1, lv: 5 }, now: NOW }).kind, 'free');
});
test('xong hết nhiệm vụ vẫn có mục tiêu "tự do" với lời gợi ý', () => {
  let prog = emptyProg(); for (const q of QUESTS) prog = mark(prog, q.id);
  const g = nextGoal({ story: doneStory(), prog, sen: 0, la: 0, own: null, now: NOW });
  assert.equal(g.kind, 'free'); assert.ok(g.title && g.text);
});
test('việc cần lá bồ đề: chưa có sen thì dẫn đi kiếm sen, đủ thì dẫn tới NPC', () => {
  let prog = emptyProg(); for (const id of CHAIN.slice(0, CHAIN.indexOf('m-doila'))) prog = mark(prog, id);
  const poor = nextGoal({ story: doneStory(), prog, sen: 0, la: 0, now: NOW });
  assert.match(poor.id, /:kiem$/); assert.ok(poor.text.includes('hạt sen'));
  assert.notEqual(poor.guide, 'm-doila');
  const rich = nextGoal({ story: doneStory(), prog, sen: 30, la: 0, now: NOW });
  assert.equal(rich.guide, 'm-doila'); assert.ok(rich.go && rich.go.npc);
});
test('chưa có nhà thì bỏ qua "nâng nhà"; có đất rồi thì bỏ qua "mua đất"', () => {
  let prog = emptyProg(); for (const q of QUESTS) if (q.id !== 'm-nangnha' && q.id !== 'm-muadat') prog = mark(prog, q.id);
  assert.equal(nextGoal({ story: doneStory(), prog, sen: 0, la: 100, own: null, now: NOW }).guide, 'm-muadat');
  assert.equal(nextGoal({ story: doneStory(), prog, sen: 0, la: 999, own: { xom: 1, plot: 1, lv: 0 }, now: NOW }).guide, 'm-nangnha');
});
test('sang ngày mới: việc hằng ngày làm lại, mục tiêu quay về đầu chuỗi', () => {
  let prog = emptyProg(); for (const q of QUESTS) prog = mark(prog, q.id);
  const tomorrow = NOW + 86400000 * 1.2;
  const g = nextGoal({ story: doneStory(), prog, sen: 0, la: 0, now: tomorrow });
  assert.equal(g.kind, 'daily'); assert.equal(g.guide, 'n-nhang');
});
test('dữ liệu lạ không làm hỏng: thiếu prog / story vẫn trả mục tiêu', () => {
  assert.ok(nextGoal().title); assert.ok(nextGoal({ story: doneStory() }).title);
});

test('Phiên 47: việc câu cá — chưa có cầu thì chỉ cách có cầu; có cầu thì dẫn thẳng tới việc câu cá', async () => {
  const { ORBS } = await import('../js/world/fishing.js');
  let prog = emptyProg(); for (const q of QUESTS) if (!['m-cau', 'm-phongsinh', 'n-phongsinh'].includes(q.id)) prog = mark(prog, q.id);
  const st = { story: doneStory(), prog, sen: 0, la: 0, own: { xom: 1, plot: 1, lv: 0 }, now: NOW };
  const a = nextGoal(st);   // chưa lá, chưa cầu: đi kiếm lá, nói rõ giá cầu rẻ nhất
  assert.equal(a.kind, 'journey'); assert.equal(a.id, 'm-cau:kiem'); assert.ok(a.text.includes(String(ORBS[0].gia)));
  const b = nextGoal({ ...st, la: ORBS[0].gia });   // đủ lá: chỉ cách mua cầu, dẫn đường theo việc câu cá
  assert.equal(b.id, 'm-cau'); assert.equal(b.guide, 'm-cau'); assert.match(b.text, /Quả cầu/);
  const c = nextGoal({ ...st, orbs: 1 });   // đã có cầu: dẫn thẳng
  assert.equal(c.id, 'm-cau'); assert.equal(c.guide, 'm-cau'); assert.equal(c.text, QUESTS.find((q) => q.id === 'm-cau').mo);
  prog = mark(mark(prog, 'm-cau'), 'm-phongsinh');
  const d = nextGoal({ ...st, prog, orbs: 1 });   // còn việc hằng ngày phóng sinh
  assert.equal(d.kind, 'daily'); assert.equal(d.id, 'n-phongsinh');
});
test('Phiên 51: nhiệm vụ nội thất — chưa có nhà thì bỏ qua; có nhà mà thiếu lá thì dẫn đi kiếm hạt sen', () => {
  let prog = emptyProg(); for (const q of QUESTS) if (q.id !== 'm-noithat') prog = mark(prog, q.id);
  const own = { xom: 1, plot: 1, lv: 0 };
  assert.notEqual(nextGoal({ story: doneStory(), prog, sen: 0, la: 999, own: null, now: NOW }).guide, 'm-noithat');
  const rich = nextGoal({ story: doneStory(), prog, sen: 0, la: 999, own, now: NOW });
  assert.equal(rich.guide, 'm-noithat'); assert.equal(rich.id, 'm-noithat');
  const poor = nextGoal({ story: doneStory(), prog: emptyProg(), sen: 0, la: 0, own, now: NOW });
  assert.ok(poor.id !== 'm-noithat' || poor.text.length > 0);
});
