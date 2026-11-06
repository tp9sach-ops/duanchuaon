import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  emptyStory, loadStory, objective, canWater, nearTree, dialogueFor, apply, treeScale, STEPS, BODHI, WATER_SPOT, WATER_RANGE,
  WATER_COOLDOWN_MS, WATER2_N, MEDITATE_SECONDS, TREE_SCALE,
} from '../js/world/story.js';
import { blocked, canStep, CIRCLES, SPAWN } from '../js/world/layout.js';
import '../js/world/placements.js';
import '../js/world/landscape.js';
import { NPCS, npcById } from '../js/world/npc.js';

const T0 = new Date(2026, 10, 6, 9, 0).getTime();
/** Chạy trọn chuỗi: trả { s, log }. */
function runAll() {
  let s = emptyStory(); const log = []; let t = T0;
  const go = (ev) => { const r = apply(s, ev, t); s = r.story; log.push(r); return r; };
  go({ type: 'talk', id: 'chutieu' }); go({ type: 'talk', id: 'truru' }); t += 10000;
  go({ type: 'water', near: true, now: t });
  for (let i = 0; i < MEDITATE_SECONDS; i++) go({ type: 'meditate', dt: 1 });
  for (let i = 0; i < WATER2_N; i++) { t += WATER_COOLDOWN_MS + 1; go({ type: 'water', near: true, now: t }); }
  return { s, log };
}

test('chuỗi chương 1: gặp chú tiểu → trụ trì (nhận bình) → tưới → thiền 180 giây → tưới 3 lần → mở Khinh thân bậc 1', () => {
  const { s, log } = runAll();
  assert.equal(s.step, 'done'); assert.equal(s.skills.khinhthan, 1); assert.equal(s.can, false); assert.equal(s.tree, 2);
  assert.deepEqual(log.filter((r) => r.stepFrom !== r.stepTo).map((r) => r.stepTo), ['abbot', 'water1', 'meditate', 'water2', 'done']);
  assert.equal(log.filter((r) => r.unlocked === 'khinhthan1').length, 1, 'mở kỹ năng đúng một lần');
  assert.equal(log.filter((r) => r.grew).length, 2, 'cây lớn hai lần: sau thiền và khi hoàn thành');
  const total = log.reduce((a, r) => ({ xp: a.xp + r.gain.xp, sen: a.sen + r.gain.sen }), { xp: 0, sen: 0 });
  assert.deepEqual(total, { xp: 110, sen: 9 });
  assert.equal(objective(s), null);
});

test('bước sai thứ tự không làm gì: gặp trụ trì trước, tưới khi chưa có bình, thiền trước khi tưới', () => {
  let s = emptyStory();
  for (const ev of [{ type: 'talk', id: 'truru' }, { type: 'water', near: true, now: T0 }, { type: 'meditate', dt: 1 }, { type: 'talk', id: 'khongco' }, null, { type: 'la' }]) {
    const r = apply(s, ev, T0); assert.equal(r.changed, false); assert.equal(r.story, s, 'trả đúng bản cũ');
  }
  s = apply(s, { type: 'talk', id: 'chutieu' }, T0).story;
  assert.equal(apply(s, { type: 'talk', id: 'chutieu' }, T0).changed, false, 'không nhận thưởng lại');
  assert.equal(s.step, 'abbot'); assert.equal(s.can, false);
  assert.equal(apply(s, { type: 'water', near: true, now: T0 }).changed, false, 'chưa có bình thì không tưới được');
});

test('tưới cây: phải đứng trong tầm, hồi chiêu chống bấm liên tục, đồng hồ lùi không lách được', () => {
  let s = emptyStory(); s = apply(s, { type: 'talk', id: 'chutieu' }).story; s = apply(s, { type: 'talk', id: 'truru' }).story;
  assert.deepEqual(canWater(s, false, T0), { ok: false, reason: 'far' });
  assert.equal(apply(s, { type: 'water', near: false, now: T0 }).changed, false);
  s = apply(s, { type: 'water', near: true, now: T0 }).story; assert.equal(s.step, 'meditate');
  s = { ...s, step: 'water2', can: true, waters: 0, tree: 1 };
  const A = T0 + 10 * WATER_COOLDOWN_MS;
  assert.equal(apply(s, { type: 'water', near: true, now: T0 + 1000 }).changed, false, 'hồi chiêu kéo dài qua các bước');
  const a = apply(s, { type: 'water', near: true, now: A }); assert.equal(a.changed, true); assert.equal(a.story.waters, 1);
  assert.deepEqual(canWater(a.story, true, A + 500), { ok: false, reason: 'cooldown' });
  assert.equal(apply(a.story, { type: 'water', near: true, now: A + 500 }).changed, false);
  assert.equal(apply(a.story, { type: 'water', near: true, now: A - 500 }).changed, false, 'chỉnh đồng hồ lùi chút ít không lách được');
  assert.equal(canWater(a.story, true, A + WATER_COOLDOWN_MS).ok, true);
  assert.equal(apply(a.story, { type: 'water', near: true, now: A + WATER_COOLDOWN_MS }).story.waters, 2);
});

test('thiền: cộng theo giây thật, mỗi lần tối đa 2 giây (không cộng dồn), số âm/NaN bị bỏ, đủ 180 giây thì cây lớn', () => {
  let s = { ...emptyStory(), step: 'meditate', can: true };
  assert.equal(apply(s, { type: 'meditate', dt: -5 }).changed, false);
  assert.equal(apply(s, { type: 'meditate', dt: NaN }).changed, false);
  assert.equal(apply(s, { type: 'meditate', dt: 'x' }).changed, false);
  assert.equal(apply(s, { type: 'meditate', dt: 9999 }).story.med, 2, 'bị chặn trần 2 giây một lần');
  for (let i = 0; i < MEDITATE_SECONDS - 1; i++) s = apply(s, { type: 'meditate', dt: 1 }).story;
  assert.equal(s.step, 'meditate'); assert.equal(Math.floor(s.med), MEDITATE_SECONDS - 1);
  assert.equal(objective(s).cur, MEDITATE_SECONDS - 1);
  const r = apply(s, { type: 'meditate', dt: 1 });
  assert.equal(r.story.step, 'water2'); assert.equal(r.story.tree, 1); assert.equal(r.grew, true); assert.deepEqual(r.gain, { xp: 30, sen: 3 });
  assert.equal(apply(r.story, { type: 'meditate', dt: 1 }).changed, false, 'hết bước thiền thì không cộng nữa');
});

test('loadStory: dữ liệu hỏng/độc không vỡ; chỉnh lại cho nhất quán; không tự mở kỹ năng khi chưa xong', () => {
  assert.deepEqual(loadStory('{{{'), emptyStory()); assert.deepEqual(loadStory(null), emptyStory()); assert.deepEqual(loadStory([1]), emptyStory());
  assert.deepEqual(loadStory({ step: 'bay-len-troi' }), emptyStory());
  const cheat = loadStory({ step: 'meditate', med: 99999, skills: { khinhthan: 8 }, tree: 2, can: false, waters: 50 });
  assert.equal(cheat.step, 'meditate'); assert.equal(cheat.med, MEDITATE_SECONDS - 1, 'kẹp trần'); assert.equal(cheat.skills.khinhthan, 0, 'chưa xong thì không có kỹ năng'); assert.equal(cheat.can, true); assert.equal(cheat.tree, 0); assert.equal(cheat.waters, 0);
  const w2 = loadStory({ step: 'water2', waters: 99, lastWater: -5 }); assert.equal(w2.waters, WATER2_N - 1); assert.equal(w2.lastWater, 0); assert.equal(w2.tree, 1);
  const done = loadStory(JSON.stringify(runAll().s)); assert.equal(done.step, 'done'); assert.equal(done.skills.khinhthan, 1); assert.equal(done.tree, 2); assert.equal(done.can, false);
  for (const st of STEPS) assert.equal(loadStory(JSON.stringify({ step: st })).step, st);
});

test('hội thoại: chú tiểu và trụ trì có lời cho MỌI bước; chỉ đúng lượt mới sinh sự kiện; NPC khác không có', () => {
  const by = (step, can = false) => ({ ...emptyStory(), step, can });
  for (const st of STEPS) for (const id of ['chutieu', 'truru']) {
    const d = dialogueFor(by(st), id); assert.ok(d && d.pages.length >= 1, id + ' ' + st);
    for (const p of d.pages) { assert.ok(typeof p === 'string' && p.length > 10 && Array.from(p).length <= 220, p); }
  }
  assert.deepEqual(dialogueFor(by('meet'), 'chutieu').ev, { type: 'talk', id: 'chutieu' });
  assert.deepEqual(dialogueFor(by('abbot'), 'truru').ev, { type: 'talk', id: 'truru' });
  for (const [st, id] of [['meet', 'truru'], ['abbot', 'chutieu'], ['water1', 'truru'], ['meditate', 'chutieu'], ['done', 'truru'], ['done', 'chutieu']]) assert.equal(dialogueFor(by(st), id).ev, null, st + ' ' + id);
  assert.equal(dialogueFor(by('meet'), 'cusi'), null); assert.equal(dialogueFor(by('meet'), 'khongco'), null);
  // sự kiện của hội thoại, áp dụng thật, phải khớp bước
  const s = emptyStory(), r = apply(s, dialogueFor(s, 'chutieu').ev); assert.equal(r.story.step, 'abbot');
});

test('chú tiểu và trụ trì có trong danh sách NPC; chú tiểu đứng ở cổng chùa, gần chỗ xuất hiện', () => {
  const t = npcById('chutieu'); assert.ok(t && npcById('truru')); assert.ok(NPCS.includes(t));
  assert.ok(Math.hypot(t.x - SPAWN.x, t.z - SPAWN.z) < 15, 'người chơi thấy chú tiểu ngay khi vào');
  assert.ok(t.scale > 0 && t.scale < 1, 'chú tiểu nhỏ người hơn người lớn');
});

test('cây bồ đề của nhiệm vụ khớp cảnh 3D và vật cản; điểm tưới đi tới được, trong tầm và không đè lên thân cây', () => {
  const scene = readFileSync(new URL('../js/scene/index.js', import.meta.url), 'utf8');
  assert.ok(scene.includes(`buildBodhi(${BODHI.x}, ${BODHI.z}, ${BODHI.s})`), 'BODHI phải trùng một cây thật trong cảnh');
  assert.ok(CIRCLES.some((c) => c.x === BODHI.x && c.z === BODHI.z), 'cây có vật cản');
  assert.equal(blocked(WATER_SPOT.x, WATER_SPOT.z), false);
  assert.ok(nearTree(WATER_SPOT) && Math.hypot(WATER_SPOT.x - BODHI.x, WATER_SPOT.z - BODHI.z) > 2);
  assert.equal(nearTree({ x: BODHI.x + WATER_RANGE + 0.5, z: BODHI.z }), false); assert.equal(nearTree(null), false);
  const S = 0.5, key = (i, j) => i + ',' + j, seen = new Set(), q = [[Math.round(SPAWN.x / S), Math.round(SPAWN.z / S)]]; seen.add(key(...q[0]));
  while (q.length) { const [i, j] = q.pop(); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj, k = key(ni, nj); if (seen.has(k) || blocked(ni * S, nj * S) || !canStep(i * S, j * S, ni * S, nj * S)) continue; seen.add(k); q.push([ni, nj]); } }
  assert.ok(seen.has(key(Math.round(WATER_SPOT.x / S), Math.round(WATER_SPOT.z / S))), 'đi tới điểm tưới được từ chỗ xuất hiện');
});

test('kích thước cây tăng dần theo giai đoạn và luôn trong khoảng hợp lý', () => {
  assert.ok(TREE_SCALE[0] < TREE_SCALE[1] && TREE_SCALE[1] < TREE_SCALE[2]);
  assert.equal(treeScale(emptyStory()), TREE_SCALE[0]); assert.equal(treeScale({ tree: 99 }), TREE_SCALE[2]); assert.equal(treeScale({ tree: -3 }), TREE_SCALE[0]);
  for (const v of TREE_SCALE) assert.ok(v > 0.5 && v < 1.5);
});

test('objective: mỗi bước có mục tiêu rõ ràng và tiến độ đúng', () => {
  const e = emptyStory(); assert.equal(objective(e).npc, 'chutieu');
  assert.equal(objective({ ...e, step: 'abbot' }).npc, 'truru');
  assert.equal(objective({ ...e, step: 'water1' }).at, 'tree');
  assert.deepEqual([objective({ ...e, step: 'water2', waters: 2 }).cur, objective({ ...e, step: 'water2' }).need], [2, WATER2_N]);
});
