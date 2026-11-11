import test from 'node:test';
import assert from 'node:assert/strict';
import {
  S2_STEPS, TRAIN_BAC, CLIFF_PLACE, ELDER_NPC, ABBOT_NPC, STORY2_QUESTS, emptyStory2, loadStory2, active2, objective2, story2Rows, dialogue2, apply2, isStory2Quest,
} from '../js/world/story2.js';
import { PLACES } from '../js/world/outside.js';
import { NPCS } from '../js/world/npc.js';
import { QUESTS } from '../js/world/quests.js';
import { STORY_QUESTS } from '../js/world/story.js';
import { nextGoal } from '../js/world/nextGoal.js';
import { planGuide } from '../js/world/questGuide.js';
import { loadStory } from '../js/world/story.js';
import { emptyProg } from '../js/world/quests.js';

const run = () => {
  let s = emptyStory2(); const log = [];
  const go = (ev) => { const r = apply2(s, ev); s = r.story; log.push(r); return r; };
  go({ type: 'talk', id: ABBOT_NPC }); go({ type: 'talk', id: ELDER_NPC }); go({ type: 'khinh', bac: TRAIN_BAC }); go({ type: 'at', place: CLIFF_PLACE }); go({ type: 'talk', id: ABBOT_NPC });
  return { s, log };
};

test('chuỗi chương 2: thầy → Ông Ba → luyện bậc 2 → tới vách Đại Phật → báo thầy → nhận mảnh chuông Đá', () => {
  const { s, log } = run();
  assert.equal(s.step, 'fin'); assert.equal(s.shards.da, true);
  assert.deepEqual(log.map((r) => r.stepTo), ['elder', 'train', 'cliff', 'report', 'fin']);
  assert.ok(log.every((r) => r.changed));
  assert.equal(log[4].unlocked, 'manhda');
  assert.ok(log.reduce((a, r) => a + r.gain.xp, 0) > 0 && log.reduce((a, r) => a + r.gain.sen, 0) > 0);
});

test('sai thứ tự / sai người / bậc thấp / sai nơi → không đổi gì', () => {
  const s = emptyStory2();
  for (const ev of [{ type: 'talk', id: ELDER_NPC }, { type: 'khinh', bac: 8 }, { type: 'at', place: CLIFF_PLACE }, { type: 'talk', id: 'chutieu' }, null, 7, { type: 'xyz' }]) {
    const r = apply2(s, ev); assert.equal(r.changed, false); assert.equal(r.story, s); assert.deepEqual(r.gain, { xp: 0, sen: 0 });
  }
  const t = { ...emptyStory2(), step: 'train' };
  assert.equal(apply2(t, { type: 'khinh', bac: 1 }).changed, false);
  assert.equal(apply2(t, { type: 'khinh', bac: 'abc' }).changed, false);
  assert.equal(apply2({ ...emptyStory2(), step: 'cliff' }, { type: 'at', place: 'lang' }).changed, false);
});

test('không tính thưởng hai lần: bước đã qua bấm lại không đổi', () => {
  const { s } = run();
  for (const ev of [{ type: 'talk', id: ABBOT_NPC }, { type: 'talk', id: ELDER_NPC }, { type: 'khinh', bac: 5 }, { type: 'at', place: CLIFF_PLACE }]) assert.equal(apply2(s, ev).changed, false);
});

test('loadStory2: hỏng/lạ → bắt đầu lại; mảnh Đá chỉ có khi đã xong; không ném lỗi', () => {
  for (const bad of [null, undefined, '', '{{', '[]', 5, { step: 'zzz' }, []]) assert.deepEqual(loadStory2(bad), emptyStory2());
  assert.equal(loadStory2({ step: 'report', shards: { da: true } }).shards.da, false);
  assert.equal(loadStory2(JSON.stringify({ step: 'fin' })).shards.da, true);
  assert.equal(loadStory2({ step: 'cliff' }).step, 'cliff');
});

test('active2: chỉ chạy sau chương 1 và trước khi kết thúc', () => {
  assert.equal(active2({ step: 'water1' }, emptyStory2()), false);
  assert.equal(active2({ step: 'done' }, emptyStory2()), true);
  assert.equal(active2({ step: 'done' }, { ...emptyStory2(), step: 'fin' }), false);
  assert.equal(active2(null, emptyStory2()), false);
});

test('dữ liệu khớp thế giới: NPC có thật, nơi có thật, id không trùng, bước nào cũng có mục tiêu + nhiệm vụ', () => {
  assert.ok(NPCS.some((n) => n.id === ABBOT_NPC) && NPCS.some((n) => n.id === ELDER_NPC));
  assert.ok(PLACES.some((p) => p.id === CLIFF_PLACE));
  const ids = new Set([...QUESTS.map((q) => q.id), ...STORY_QUESTS.map((q) => q.id), ...STORY2_QUESTS.map((q) => q.id)]);
  assert.equal(ids.size, QUESTS.length + STORY_QUESTS.length + STORY2_QUESTS.length);
  for (const st of S2_STEPS.slice(0, -1)) {
    const o = objective2({ ...emptyStory2(), step: st }); assert.ok(o && o.title && o.text, st);
    assert.ok(STORY2_QUESTS.some((q) => q.step === st), st); assert.ok(o.npc || o.place || st === 'train', st);
  }
  assert.equal(objective2({ ...emptyStory2(), step: 'fin' }), null);
});

test('hội thoại: đúng NPC đúng bước có lời + sự kiện; bước khác có lời nhắc không đổi trạng thái', () => {
  const d = dialogue2(emptyStory2(), ABBOT_NPC); assert.ok(d.pages.length >= 3 && d.ev && d.ev.type === 'talk');
  assert.ok(d.pages.join(' ').includes('chuông') && d.pages.join(' ').includes('Đá'));
  assert.equal(dialogue2(emptyStory2(), 'chutieu'), null);
  for (const st of ['hear', 'elder', 'train', 'cliff', 'report']) for (const id of [ABBOT_NPC, ELDER_NPC]) {
    const x = dialogue2({ ...emptyStory2(), step: st }, id); assert.ok(x && x.pages.length > 0, st + id);
    if (x.ev) assert.equal(apply2({ ...emptyStory2(), step: st }, x.ev).changed, true, st + id);   // lời có sự kiện thì sự kiện phải làm bước tiến lên
  }
  assert.equal(dialogue2({ ...emptyStory2(), step: 'fin' }, ABBOT_NPC), null);
});

test('story2Rows: bước đã xong / đang làm / chưa tới; luyện bậc hiện thanh tiến độ', () => {
  const rows = story2Rows({ ...emptyStory2(), step: 'train' }, 1);
  assert.deepEqual(rows.map((r) => [r.done, r.locked]), [[true, false], [true, false], [false, false], [false, true], [false, true]]);
  assert.equal(rows[2].cur, 1); assert.equal(rows[2].need, TRAIN_BAC);
  assert.ok(story2Rows({ ...emptyStory2(), step: 'fin' }).every((r) => r.done));
  assert.ok(isStory2Quest('s2-hear') && !isStory2Quest('s-meet'));
});

test('nextGoal: xong chương 1 → việc chính là chương 2; không có story2 thì giữ hành vi cũ; xong chương 2 → trở về hành trình', () => {
  const done1 = loadStory({ step: 'done' }), prog = emptyProg(), now = Date.UTC(2026, 10, 10);
  const old = nextGoal({ story: done1, prog, now }); assert.notEqual(old.kind, 'story');
  const g = nextGoal({ story: done1, story2: emptyStory2(), prog, now });
  assert.equal(g.kind, 'story'); assert.equal(g.guide, 's2-hear'); assert.ok(g.label.includes('Chương 2') && g.title && g.text);
  for (const st of S2_STEPS.slice(0, -1)) { const x = nextGoal({ story: done1, story2: { ...emptyStory2(), step: st }, prog, now }); assert.equal(x.guide, 's2-' + st, st); }
  assert.notEqual(nextGoal({ story: done1, story2: { ...emptyStory2(), step: 'fin' }, prog, now }).kind, 'story');
  assert.equal(nextGoal({ story: loadStory({ step: 'water1' }), story2: emptyStory2(), prog, now }).guide, 's-water1');   // chương 1 chưa xong: chưa vào chương 2
});

test('dẫn đường chương 2: mọi bước có kế hoạch; bước cliff dẫn tới Đại Phật; bước chưa tới bị khóa; đã xong thì done', () => {
  const pos = { x: 0, z: 6 }, done1 = loadStory({ step: 'done' }), prog = emptyProg();
  for (const q of STORY2_QUESTS) {
    const p = planGuide(q.id, prog, pos, { story: done1, story2: { ...emptyStory2(), step: q.step } });
    assert.ok(p && !p.done && p.steps.length > 0 && p.steps.some((s) => s.state === 'now'), q.id);
    if (q.step !== 'train') assert.ok(p.target, q.id);
  }
  const cliff = planGuide('s2-cliff', prog, pos, { story: done1, story2: { ...emptyStory2(), step: 'cliff' } });
  assert.ok(cliff.steps.length >= 2);
  assert.equal(planGuide('s2-cliff', prog, pos, { story: done1, story2: emptyStory2() }).steps[0].state, 'now');   // chưa tới bước → khóa, có lời chỉ việc cần làm trước
  assert.equal(planGuide('s2-hear', prog, pos, { story: done1, story2: { ...emptyStory2(), step: 'fin' } }).done, true);
  assert.equal(planGuide('s2-hear', prog, pos, { story: done1 }).done, false);   // thiếu story2 → coi như mới bắt đầu
});
