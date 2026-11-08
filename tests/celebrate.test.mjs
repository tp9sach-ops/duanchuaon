import test from 'node:test';
import assert from 'node:assert/strict';
import { planCelebration, chaptersJustDone, sfxGain, NOTES } from '../js/world/celebrate.js';
import { QUESTS, questStatus, loadProg } from '../js/world/quests.js';

test('không có gì thì không ăn mừng', () => assert.equal(planCelebration({}), null));
test('một nhiệm vụ → mức small, cộng điểm + hạt sen', () => {
  const p = planCelebration({ done: [{ ten: 'A', xp: 12, sen: 1 }] });
  assert.equal(p.tier, 'small'); assert.match(p.reward, /\+12 điểm/); assert.match(p.reward, /\+1 hạt sen/); assert.equal(p.title, 'A');
});
test('nhiều nhiệm vụ → big; lên cấp → epic', () => {
  assert.equal(planCelebration({ done: [{ ten: 'A', xp: 1, sen: 0 }, { ten: 'B', xp: 2, sen: 0 }] }).tier, 'big');
  const e = planCelebration({ levelUp: { to: 3, ten: 'Cư sĩ', sen: 5 } });
  assert.equal(e.tier, 'epic'); assert.match(e.title, /cấp 3/); assert.match(e.reward, /5 hạt sen/);
});
test('xong chương → big, nêu số chương', () => {
  const p = planCelebration({ done: [{ ten: 'A', xp: 1, sen: 0 }], chapters: [{ id: 'c2', ten: 'Khám phá chùa', n: 2 }] });
  assert.equal(p.tier, 'big'); assert.match(p.kicker, /Chương 2/); assert.equal(p.chapter, 2);
});
test('mức càng cao càng nhiều nốt và hạt', () => {
  const a = planCelebration({ done: [{ ten: 'A' }] }), b = planCelebration({ done: [{ ten: 'A' }, { ten: 'B' }] }), c = planCelebration({ levelUp: { to: 2 } });
  assert.ok(a.notes.length < b.notes.length && b.notes.length < c.notes.length); assert.ok(a.particles < b.particles && b.particles < c.particles);
  assert.deepEqual(NOTES.small, a.notes);
});
test('chaptersJustDone bắt đúng chương vừa hoàn tất', () => {
  const none = questStatus(loadProg({ getItem: () => null }));
  assert.deepEqual(chaptersJustDone(none, none), []);
  const all = none.map((r) => ({ ...r, done: true }));
  const got = chaptersJustDone(none, all);
  assert.ok(got.length >= 1 && got.every((c) => c.n >= 2));
});
test('sfxGain theo cài đặt', () => {
  assert.equal(sfxGain({ on: false, sfx: 1 }), 0);
  assert.equal(sfxGain({ on: null, sfx: null }), 1);
  assert.ok(sfxGain({ on: true, sfx: 0.3 }) < 1);
  assert.ok(sfxGain({ on: true, sfx: 99 }) <= 1.5);
});
