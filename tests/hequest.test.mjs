// Gia nhập phái + học chiêu (Phiên 141): nhiệm vụ m-khaingo / m-chieu1, cấp hiệu dụng, việc kế tiếp ở cấp 10, sự kiện nhiệm vụ.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SECT_LV, SECT_QUESTS, effLevel, canJoinSect, openSlots, skillDamage } from '../js/world/heQuest.js';
import { QUESTS, emptyProg, record, questById } from '../js/world/quests.js';
import { CHAPTERS, chapterOf } from '../js/world/chapters.js';
import { nextGoal } from '../js/world/nextGoal.js';
import { loadStory } from '../js/world/story.js';
import { skillFor } from '../js/world/skillCatalog.js';

const NOW = Date.UTC(2026, 10, 13, 5), done = loadStory({ step: 'done' });
const base = { story: done, prog: emptyProg(), sen: 0, la: 0, own: null, orbs: 0, now: NOW };

test('cấp hiệu dụng = số lớn hơn của Tu Vi và Cấp công hạnh; đủ 10 mới gia nhập phái', () => {
  assert.equal(effLevel(3, 10), 10); assert.equal(effLevel(12, 2), 12); assert.equal(effLevel('x', undefined), 0);
  assert.equal(canJoinSect(9), false); assert.equal(canJoinSect(10), true); assert.equal(SECT_LV, 10);
  assert.deepEqual(openSlots(9), []); assert.deepEqual(openSlots(10), [1]); assert.deepEqual(openSlots(14), [1, 2]); assert.deepEqual(openSlots(30), [1, 2, 3, 4]);
});

test('hai nhiệm vụ gia nhập phái có trong QUESTS, thuộc chương 8, ghi nhận qua sự kiện khaingo và dungchieu', () => {
  for (const id of SECT_QUESTS) { assert.ok(questById(id), id); assert.equal(chapterOf(id).n, 8); }
  assert.equal(CHAPTERS.length, 8);
  let r = record(emptyProg(), { type: 'khaingo' }); assert.deepEqual(r.done.map((q) => q.id), ['m-khaingo']);
  r = record(r.prog, { type: 'dungchieu' }); r = record(r.prog, { type: 'dungchieu' }); assert.equal(r.done.length, 0, 'mới 2 lần');
  r = record(r.prog, { type: 'dungchieu' }); assert.deepEqual(r.done.map((q) => q.id), ['m-chieu1']);
});

test('việc kế tiếp: chưa đủ cấp 10 thì chưa tới lượt phái; đủ cấp 10 thì gia nhập phái được đưa lên ĐẦU', () => {
  const all = {}; for (const q of QUESTS) if (q.loai === 'mot' && !SECT_QUESTS.includes(q.id)) all[q.id] = true;
  const prog = { ...emptyProg(), done: all, day: { k: '', n: {}, seen: {}, done: {} } };
  const low = nextGoal({ ...base, prog, own: { xom: 1, plot: 1, lv: 0 }, orbs: 1, sen: 999, la: 999, cap: 4, he: null });
  assert.ok(!SECT_QUESTS.includes(low.guide), 'cấp thấp không dẫn tới nhiệm vụ phái');
  const fresh = nextGoal({ ...base, cap: 4, he: null }); assert.ok(!SECT_QUESTS.includes(fresh.guide));
  const hi = nextGoal({ ...base, cap: 10, he: null }); assert.equal(hi.guide, 'm-khaingo'); assert.equal(hi.kind, 'journey');
  const hi2 = nextGoal({ ...base, prog: { ...emptyProg(), done: { 'm-khaingo': true } }, cap: 11, he: 'kim' }); assert.equal(hi2.guide, 'm-chieu1');
  const noCap = nextGoal({ ...base }); assert.ok(noCap.id, 'thiếu cap thì giữ hành vi cũ, không lỗi');
});

test('chỉ còn việc chờ cấp 10 → thẻ việc kế tiếp nói rõ cần lên cấp 10', () => {
  const all = {}; for (const q of QUESTS) if (q.loai === 'mot' && !SECT_QUESTS.includes(q.id)) all[q.id] = true;
  const day = {}; for (const q of QUESTS) if (q.loai === 'ngay') day[q.id] = true;
  const k = (() => { const d = new Date(NOW), p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  const prog = { ...emptyProg(), done: all, day: { k, n: {}, seen: {}, done: day } };
  const g = nextGoal({ ...base, prog, own: { xom: 1, plot: 1, lv: 0 }, orbs: 1, cap: 6, he: null });
  assert.equal(g.id, 'sect:len-cap'); assert.equal(g.need, 10); assert.equal(g.cur, 6); assert.match(g.title, /cấp 10/);
});

test('chiêu: sát thương = đòn gốc × hệ số; chiêu hỗ trợ (heSo 0) không gây sát thương; mọi Hệ có chiêu 1 gây sát thương', () => {
  assert.equal(skillDamage(10, 1.5), 15); assert.equal(skillDamage(10, 0), 0); assert.equal(skillDamage(10, 'x'), 0); assert.ok(skillDamage(1, 0.1) >= 1);
  for (const h of ['kim', 'moc', 'thuy', 'hoa', 'tho']) assert.ok(skillFor(h, 1).heSo > 0, h);
});
