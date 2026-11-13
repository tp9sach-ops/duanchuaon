import test from 'node:test';
import assert from 'node:assert/strict';
import { khinhLevel, jumpHeight, airTime, canJump, createJump, KHINH_THAN_CAO, MAX_BAC, GRAVITY, KHINH_YEU_CAU, KHINH_TEN, INDOOR_MAX, jumpHeightAt, loadKhinh, khinhBac, trainPlan } from '../js/world/skills.js';
import { emptyStory, loadStory, apply } from '../js/world/story.js';

test('khinhLevel: chưa xong cốt truyện = 0, dữ liệu lạ = 0', () => {
  assert.equal(khinhLevel(emptyStory()), 0);
  for (const bad of [null, undefined, {}, { skills: {} }, { skills: { khinhthan: 'x' } }, { skills: { khinhthan: NaN } }]) assert.equal(khinhLevel(bad), 0);
  assert.equal(khinhLevel({ skills: { khinhthan: 99 } }), MAX_BAC);
  assert.equal(khinhLevel({ skills: { khinhthan: -3 } }), 0);
});
test('hoàn thành chuỗi tưới cây → khinhLevel = 1 (nối đúng với story.js)', () => {
  let s = loadStory({ step: 'water2', waters: 2, lastWater: 0 });
  assert.equal(khinhLevel(s), 0);
  const r = apply(s, { type: 'water', near: true, now: 100000 });
  assert.equal(r.unlocked, 'khinhthan1');
  assert.equal(khinhLevel(r.story), 1);
  assert.equal(khinhLevel(loadStory(JSON.stringify(r.story))), 1);   // lưu rồi đọc lại vẫn còn
});
test('bảng chiều cao tăng dần, bậc 0 không nhảy', () => {
  assert.equal(jumpHeight(0), 0);
  for (let i = 1; i < KHINH_THAN_CAO.length; i++) assert.ok(KHINH_THAN_CAO[i] > KHINH_THAN_CAO[i - 1]);
  assert.equal(jumpHeight(1), 1.1); assert.equal(jumpHeight(999), KHINH_THAN_CAO[MAX_BAC]); assert.equal(airTime(0), 0);
});
test('canJump chỉ khi đã mở, đang đứng tự do, không mở bảng/hộp thoại', () => {
  assert.equal(canJump({ level: 0 }), false);
  assert.equal(canJump({ level: 1 }), true);
  for (const mode of ['toSeat', 'sit', 'meditate', 'chant', 'beads', 'bow']) assert.equal(canJump({ level: 1, mode }), false);
  assert.equal(canJump({ level: 1, panelOpen: true }), false); assert.equal(canJump({ level: 1, dialogOpen: true }), false);
});
test('cú nhảy: lên đúng độ cao, rơi về 0, không nhảy chồng', () => {
  const j = createJump(); assert.equal(j.start(0), false); assert.equal(j.start(1.1), true); assert.equal(j.start(1.1), false);
  let peak = 0, t = 0; while (j.air && t < 5) { peak = Math.max(peak, j.step(1 / 60)); t += 1 / 60; }
  assert.ok(Math.abs(peak - 1.1) < 0.05, 'đỉnh ~1,1 m: ' + peak);
  assert.ok(Math.abs(t - airTime(1.1)) < 0.05, 'thời gian ~ airTime: ' + t);
  assert.equal(j.y, 0); assert.equal(j.air, false); assert.equal(j.start(1.1), true);
});
test('khung hình chậm / dt lạ không làm kẹt hay bay mất', () => {
  const j = createJump(); j.start(1.6);
  for (const dt of [0.2, 0.2, 0.2, NaN, -1, 5, 5]) j.step(dt);
  assert.ok(Number.isFinite(j.y) && j.y >= 0); for (let i = 0; i < 20; i++) j.step(0.25); assert.equal(j.air, false); assert.equal(j.y, 0);
  assert.equal(GRAVITY > 0, true);
});

test('Phiên 52: bảng yêu cầu bậc 2–8 tăng dần, đủ tên cảnh giới', () => {
  assert.equal(KHINH_YEU_CAU.length, MAX_BAC + 1); assert.equal(KHINH_TEN.length, MAX_BAC + 1);
  for (let b = 2; b <= MAX_BAC; b++) { assert.ok(KHINH_YEU_CAU[b].sen > 0); assert.ok(KHINH_TEN[b]); if (b > 2) { assert.ok(KHINH_YEU_CAU[b].sen > KHINH_YEU_CAU[b - 1].sen); assert.ok(KHINH_YEU_CAU[b].cap >= KHINH_YEU_CAU[b - 1].cap); } }
  assert.ok(KHINH_YEU_CAU[MAX_BAC].cap <= 10, 'cấp tối đa của game là 10');
});
test('trainPlan: chưa mở / thiếu cấp / thiếu sen / đủ / tối đa', () => {
  assert.equal(trainPlan({ bac: 0, capNguoi: 10, sen: 999 }).reason, 'chua-mo');
  assert.equal(trainPlan({ bac: 1, capNguoi: 1, sen: 999 }).reason, 'cap');
  assert.equal(trainPlan({ bac: 1, capNguoi: 2, sen: 9 }).reason, 'sen');
  const ok = trainPlan({ bac: 1, capNguoi: 2, sen: 10 }); assert.equal(ok.ok, true); assert.equal(ok.next, 2); assert.equal(ok.sen, 10);
  assert.equal(trainPlan({ bac: MAX_BAC, capNguoi: 10, sen: 9999 }).reason, 'toi-da');
  assert.equal(trainPlan({}).ok, false);
});
test('luyện đủ 7 lần từ bậc 1 lên bậc 8, mỗi lần đúng điều kiện', () => {
  let bac = 1, sen = 10000, cap = 10;
  for (let i = 2; i <= MAX_BAC; i++) { const p = trainPlan({ bac, capNguoi: cap, sen }); assert.equal(p.ok, true); assert.equal(p.next, i); sen -= p.sen; bac = p.next; }
  assert.equal(bac, MAX_BAC); assert.equal(trainPlan({ bac, capNguoi: cap, sen }).reason, 'toi-da');
});
test('loadKhinh / khinhBac: dữ liệu lạ → 0; chưa xong cốt truyện thì bỏ qua phần đã luyện', () => {
  for (const bad of [null, 'xx', '{', {}, { bac: 'a' }, { bac: -4 }, []]) assert.equal(loadKhinh(bad), 0);
  assert.equal(loadKhinh('{"bac":5}'), 5); assert.equal(loadKhinh({ bac: 99 }), MAX_BAC);
  assert.equal(khinhBac(emptyStory(), 6), 0);
  const done = { skills: { khinhthan: 1 } };
  assert.equal(khinhBac(done, 0), 1); assert.equal(khinhBac(done, 6), 6); assert.equal(khinhBac(done, 0.5), 1);
});
test('trong nhà bị chặn độ cao; ngoài trời giữ nguyên', () => {
  assert.equal(jumpHeightAt(8, false), jumpHeight(8)); assert.equal(jumpHeightAt(8, true), INDOOR_MAX);
  assert.equal(jumpHeightAt(1, true), jumpHeight(1)); assert.equal(jumpHeightAt(0, true), 0);
});

// ---- Phiên 139: nhảy tới trước + lướt né
import { leapPlan, glidePlan, nextAction, LEAP_CFG, GLIDE_CFG, airTime as airT } from '../js/world/skills.js';
test('leapPlan/glidePlan: bậc 0 và trong nhà → null; bậc cao bật/lướt xa hơn; bật tới trước kéo dài đúng thời gian trên không', () => {
  assert.equal(leapPlan(0), null); assert.equal(leapPlan(3, true), null); assert.equal(glidePlan(0), null); assert.equal(glidePlan(2, true), null);
  assert.ok(leapPlan(5).dist > leapPlan(1).dist && glidePlan(5).dist > glidePlan(1).dist);
  assert.equal(leapPlan(1).dur, airT(jumpHeight(1)));
  assert.equal(glidePlan(1).guard, GLIDE_CFG.guard); assert.ok(glidePlan(1).guard > 0);
});
test('nextAction: chưa mở → none; đứng nhảy tại chỗ; đang đi → bật tới trước; trên không/vừa chạm đất → lướt; hồi chiêu hoặc trong nhà thì không lướt', () => {
  const base = { lv: 1, air: false, sinceAir: Infinity, moving: false, glideCd: 0, indoor: false };
  assert.equal(nextAction({ ...base, lv: 0 }), 'none');
  assert.equal(nextAction(base), 'jump');
  assert.equal(nextAction({ ...base, moving: true }), 'leap');
  assert.equal(nextAction({ ...base, moving: true, indoor: true }), 'jump');
  assert.equal(nextAction({ ...base, air: true }), 'glide');
  assert.equal(nextAction({ ...base, sinceAir: GLIDE_CFG.windowAfterLand }), 'glide');
  assert.equal(nextAction({ ...base, sinceAir: GLIDE_CFG.windowAfterLand + 0.01 }), 'jump');
  assert.equal(nextAction({ ...base, air: true, glideCd: 0.5 }), 'none');
  assert.equal(nextAction({ ...base, air: true, indoor: true }), 'none');
  assert.equal(nextAction(), 'none'); assert.ok(LEAP_CFG.minSpeed > 0);
});
