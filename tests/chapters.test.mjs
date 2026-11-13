// Bảy chương hành trình (Phiên 60): mọi nhiệm vụ thuộc đúng một chương; nhiệm vụ ghé nơi có dẫn đường tới được; thẻ việc kế tiếp báo đúng chương.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, CHAIN, chapterOf, chapterProgress } from '../js/world/chapters.js';
import { QUESTS, emptyProg, questStatus, record } from '../js/world/quests.js';
import { PLACES, placesAt } from '../js/world/outside.js';
import { PLACE_STAND, planGuide } from '../js/world/questGuide.js';
import { PLACE_QUEST } from '../js/world/journey.js';
import { nextGoal } from '../js/world/nextGoal.js';
import { loadStory, emptyStory } from '../js/world/story.js';
import { blocked } from '../js/world/layout.js';
import '../js/world/placements.js';
import '../js/world/landscape.js';

test('chương: 8 chương, mọi nhiệm vụ thuộc đúng MỘT chương, không id lạ, không trùng', () => {
  assert.equal(CHAPTERS.length, 8); assert.equal(CHAPTERS[0].ids.length, 0, 'chương 1 là cốt truyện');
  const ids = QUESTS.map((q) => q.id);
  assert.equal(new Set(CHAIN).size, CHAIN.length, 'không trùng');
  for (const id of CHAIN) assert.ok(ids.includes(id), 'id lạ ' + id);
  for (const id of ids) assert.equal(CHAPTERS.filter((c) => c.ids.includes(id)).length, 1, 'phải thuộc đúng một chương: ' + id);
  assert.equal(chapterOf('v-hoca').n, 2); assert.equal(chapterOf('m-muadat').ten, 'An cư'); assert.equal(chapterOf('khong-co'), null);
});

test('khám phá hết: mọi nơi trong PLACES (trừ sân chùa là chỗ xuất hiện) có đúng một nhiệm vụ ghé, có chỗ đứng đi tới được và nút dẫn đường', () => {
  const visitQ = QUESTS.filter((q) => /^visit:/.test(q.dk.key));
  for (const p of PLACES) {
    if (p.id === 'sanchua') continue;
    const q = visitQ.find((x) => x.dk.key === 'visit:' + p.id); assert.ok(q, 'thiếu nhiệm vụ ghé ' + p.id);
    const st = PLACE_STAND[p.id]; assert.ok(st && !blocked(st.x, st.z), 'chỗ đứng ' + p.id);
    assert.ok(placesAt(st).includes(p.id), 'đứng ở chỗ đứng thì tính đã ghé ' + p.id);
    assert.equal(PLACE_QUEST[p.id], q.id, 'nút Dẫn đường trong Lộ trình ' + p.id);
    const plan = planGuide(q.id, emptyProg(), { x: 0, z: 6 }); assert.ok(plan && plan.steps.length >= 1 && plan.target, 'có dẫn đường ' + q.id);
  }
});

test('nhiệm vụ ghé nơi: ghé đúng nơi thì xong, nơi khác thì không', () => {
  let r = record(emptyProg(), { type: 'visit', arg: 'hoca' }); assert.deepEqual(r.done.map((q) => q.id), ['v-hoca']);
  r = record(r.prog, { type: 'visit', arg: 'cho' }); assert.deepEqual(r.done.map((q) => q.id), ['v-cho']);
  assert.equal(questStatus(r.prog).filter((x) => x.q.id.startsWith('v-') && x.done).length, 2);
});

test('thẻ việc kế tiếp: báo chương; đi hết chương này sang chương kế; đủ 8 chương đều có việc để làm', () => {
  const NOW = Date.UTC(2026, 10, 8, 5), done = loadStory({ step: 'done' });
  const g0 = nextGoal({ story: emptyStory(), prog: emptyProg(), now: NOW }); assert.match(g0.label, /^Chương 1 · Làm quen · 0\/\d+$/); assert.equal(g0.chapter.n, 1);
  let prog = emptyProg(); const chapters = new Set();
  for (let i = 0; i < 120; i++) {
    const g = nextGoal({ story: done, prog, sen: 999, la: 999, own: { xom: 1, plot: 1, lv: 0 }, orbs: 1, now: NOW });
    if (g.kind === 'free') break; chapters.add(g.chapter.n);
    const q = QUESTS.find((x) => x.id === g.guide); assert.ok(q, 'guide ' + g.id);
    const p = { ...prog, done: { ...prog.done }, day: { ...prog.day, done: { ...prog.day.done } } };
    if (q.loai === 'ngay') { p.day = { k: new Date(NOW).getFullYear() + '-' + String(new Date(NOW).getMonth() + 1).padStart(2, '0') + '-' + String(new Date(NOW).getDate()).padStart(2, '0'), n: {}, seen: {}, done: { ...p.day.done, [q.id]: true } }; } else p.done[q.id] = true;
    prog = p;
  }
  assert.deepEqual([...chapters].sort(), [2, 3, 4, 5, 6, 7, 8]);
  const st = questStatus(prog); const c = chapterProgress(CHAPTERS[1], st); assert.equal(c.done, c.of);
});
