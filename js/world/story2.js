// Cốt truyện CHƯƠNG 2 "Mảnh chuông Đá" (Phiên 95, theo docs/THIET_KE_CHIEU_SAU.md mục 1: Chuông Diệu Giang vỡ 3 mảnh, ba yêu quái Đá/Nước/Lửa là "tam độc").
// LOGIC THUẦN: không DOM, không three.js, có test (tests/story2.test.mjs). Chỉ chạy SAU khi xong chương 1 (story.step === 'done').
// Máy trạng thái: hear → elder → train → cliff → report → fin. Mọi bước dùng hệ thống SẴN CÓ: NPC, Khinh thân (luyện bậc 2), Đại Phật vách đá.
// Mọi điểm thưởng là QUY ƯỚC TẠM của dự án (chờ Gp duyệt). Lưu cục bộ ('lgt.story2'); chưa có máy chủ nên chưa chống gian lận thật sự.
// Cách dùng: s = loadStory2(raw); r = apply2(s, { type:'talk', id:'truru' }); r.story (lưu lại), r.gain, r.notes.
// Sự kiện: { type:'talk', id } | { type:'khinh', bac } (bậc khinh thân hiện có) | { type:'at', place } (đã tới nơi, id trong PLACES).

export const S2_STEPS = ['hear', 'elder', 'train', 'cliff', 'report', 'fin'];
/** Bậc Khinh thân cần có để leo vách Đại Phật. */
export const TRAIN_BAC = 2;
/** Nơi cần tới (id trong js/world/outside.js PLACES) và NPC cần gặp. */
export const CLIFF_PLACE = 'daiphat';
export const ELDER_NPC = 'ongcu';
export const ABBOT_NPC = 'truru';

const REWARD = {
  hear: { xp: 10, sen: 1 }, elder: { xp: 15, sen: 1 }, train: { xp: 30, sen: 3 }, cliff: { xp: 40, sen: 3 }, report: { xp: 80, sen: 8 },
};

export const emptyStory2 = () => ({ v: 1, step: 'hear', shards: { da: false } });

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng). Hỏng/vô lý → chỉnh lại cho nhất quán, không ném lỗi. */
export function loadStory2(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyStory2(); if (!o || typeof o !== 'object' || Array.isArray(o)) return s;
  const i = S2_STEPS.indexOf(o.step); if (i < 0) return s;
  s.step = S2_STEPS[i]; s.shards.da = i >= S2_STEPS.indexOf('fin');   // mảnh Đá chỉ có khi đã xong chương
  return s;
}

/** Chương 2 có đang hoạt động không: phải xong chương 1 (story.step === 'done') và chưa kết thúc chương 2. */
export const active2 = (story, s2) => !!story && story.step === 'done' && !!s2 && s2.step !== 'fin';

/** Mục tiêu hiện tại: { title, text, npc | place, cur, need, unit } hoặc null khi đã xong chương. */
export function objective2(s) {
  switch (s.step) {
    case 'hear': return { title: 'Nghe thầy kể chuyện chuông', text: 'Thầy Trụ trì có chuyện quan trọng muốn nói với bạn. Vào chánh điện thưa chuyện với thầy.', npc: ABBOT_NPC, cur: 0, need: 1, unit: '' };
    case 'elder': return { title: 'Hỏi Ông Ba gốc đa', text: 'Thầy bảo hỏi Ông Ba ở gốc đa trong làng, người từng nghe cha ông kể về chuông cổ.', npc: ELDER_NPC, cur: 0, need: 1, unit: '' };
    case 'train': return { title: 'Luyện Khinh thân bậc 2', text: 'Vách đá rất cao. Mở bảng “Luyện Khinh thân” (nút nhảy, hoặc biểu tượng bậc ở góc phải) và luyện lên bậc 2.', cur: 0, need: TRAIN_BAC, unit: 'bậc' };
    case 'cliff': return { title: 'Tới vách Đại Phật', text: 'Đi theo đường mòn ra thác nước, tới chân vách đá có tượng Đại Phật khắc, tìm dấu vết mảnh chuông.', place: CLIFF_PLACE, cur: 0, need: 1, unit: '' };
    case 'report': return { title: 'Báo lại thầy Trụ trì', text: 'Bạn đã thấy mảnh chuông Đá. Quay về chánh điện kể cho thầy nghe.', npc: ABBOT_NPC, cur: 0, need: 1, unit: '' };
    default: return null;
  }
}

/** Các bước dưới dạng "nhiệm vụ" để hiện trong bảng Nhiệm vụ và để dẫn đường (id 's2-...', không trùng QUESTS và STORY_QUESTS). */
export const STORY2_QUESTS = [
  { id: 's2-hear', step: 'hear', ten: 'Nghe thầy kể chuyện chuông', mo: 'Thầy Trụ trì kể về Đại hồng chung vỡ làm ba mảnh và ba yêu quái hằng tháng.', need: 1, unit: '', reward: REWARD.hear },
  { id: 's2-elder', step: 'elder', ten: 'Hỏi Ông Ba gốc đa', mo: 'Ông Ba ngồi dưới gốc đa trong làng, biết chỗ mảnh chuông Đá rơi.', need: 1, unit: '', reward: REWARD.elder },
  { id: 's2-train', step: 'train', ten: 'Luyện Khinh thân bậc 2', mo: 'Mở bảng “Luyện Khinh thân” và luyện lên bậc 2 (cần cấp 2 và 10 hạt sen).', need: TRAIN_BAC, unit: 'bậc', reward: REWARD.train },
  { id: 's2-cliff', step: 'cliff', ten: 'Tới vách Đại Phật', mo: 'Theo đường mòn ra thác nước, tới chân vách đá có tượng Đại Phật.', need: 1, unit: '', reward: REWARD.cliff },
  { id: 's2-report', step: 'report', ten: 'Báo lại thầy Trụ trì', mo: 'Quay về chánh điện, thưa với thầy điều bạn đã thấy. Nhận mảnh chuông Đá.', need: 1, unit: '', reward: REWARD.report },
];
export const isStory2Quest = (id) => STORY2_QUESTS.some((q) => q.id === id);

/** Hàng hiển thị cho bảng nhiệm vụ: { q:{id,ten,mo,xp,sen,step,unit}, cur, need, done, locked }. Giống storyRows của chương 1. */
export function story2Rows(s, bac = 0) {
  const at = S2_STEPS.indexOf(s.step);
  return STORY2_QUESTS.map((q, i) => {
    const done = at > i, locked = at < i, cur = done ? q.need : locked ? 0 : q.step === 'train' ? Math.min(q.need, Math.max(0, Math.floor(+bac) || 0)) : 0;
    return { q: { id: q.id, ten: q.ten, mo: q.mo, xp: q.reward.xp, sen: q.reward.sen, step: q.step, unit: q.unit }, cur, need: q.need, done, locked };
  });
}

/** Hội thoại với NPC theo tiến độ: { pages, ev } hoặc null (NPC đó không có lời cốt truyện lúc này → dùng lời thường). */
export function dialogue2(s, id) {
  const st = s.step;
  if (id === ABBOT_NPC) {
    if (st === 'hear') return { ev: { type: 'talk', id }, pages: [
      'A Di Đà Phật. Cây bồ đề đã xanh trở lại, thầy mừng lắm. Nhưng còn một nỗi lo lớn hơn.',
      'Đại hồng chung của chùa ngày xưa ngân vang khắp Diệu Giang. Một đêm giông, chuông vỡ làm ba mảnh: Đá, Nước và Lửa.',
      'Mỗi tháng có một con yêu quái hiện ra trong làng. Chúng chính là tham, sân, si, tam độc trong lòng người, hóa hình giữ ba mảnh chuông.',
      'Muốn đúc lại chuông, ta phải tìm đủ ba mảnh. Mảnh Đá rơi gần vách Đại Phật. Con hãy xuống làng hỏi Ông Ba ở gốc đa trước nhé.',
    ] };
    if (st === 'elder') return { ev: null, pages: ['Con xuống làng hỏi Ông Ba ở gốc đa nhé. Ông nghe cha ông kể nhiều chuyện về chuông cổ.'] };
    if (st === 'train') return { ev: null, pages: ['Vách đá rất cao, thân pháp chưa vững thì khó lên. Con luyện Khinh thân lên bậc 2 rồi hãy đi.'] };
    if (st === 'cliff') return { ev: null, pages: ['Con theo đường mòn ra thác nước, tới chân vách Đại Phật. Đừng vội, nhìn thật kỹ nhé.'] };
    if (st === 'report') return { ev: { type: 'talk', id }, pages: [
      'A Di Đà Phật. Con đã thấy mảnh chuông Đá rồi sao? Kể thầy nghe.',
      'Mảnh Đá nằm yên trong vách, chờ người có lòng thành. Con đã đi một đoạn dài, thân và tâm đều vững hơn.',
      'Thầy giữ mảnh chuông Đá này cho con. Còn hai mảnh Nước và Lửa, mỗi tháng yêu quái hiện ra là một dấu hiệu. Hẹn con ở chương sau.',
    ] };
    return null;
  }
  if (id === ELDER_NPC) {
    if (st === 'elder') return { ev: { type: 'talk', id }, pages: [
      'Ha ha, thầy Trụ trì sai con đi hỏi ông à? Được, ngồi xuống đây nghe ông kể.',
      'Cha ông kể rằng đêm chuông vỡ, một mảnh to như tảng đá rơi xuống vách núi sau thác. Người ta khắc tượng Phật lên đó để trấn giữ.',
      'Vách ấy dốc đứng, người thường không lên nổi. Phải luyện thân pháp tới bậc hai, nhẹ như chiếc lá, mới dám ra đó.',
      'Luyện xong thì theo đường mòn ra thác nước, tới chân vách Đại Phật. Cứ đứng đó mà nhìn.',
    ] };
    if (st === 'hear') return { ev: null, pages: ['Ông thấy thầy Trụ trì có chuyện muốn dặn con đó. Vào chánh điện hỏi thầy trước đã.'] };
    if (st === 'train') return { ev: null, pages: ['Luyện Khinh thân lên bậc hai đi con. Nhẹ thân thì mới lên được vách đá.'] };
    if (st === 'cliff') return { ev: null, pages: ['Cứ theo đường mòn ra thác, tới chân vách Đại Phật rồi đứng nhìn. Chuông cổ không bỏ người có lòng đâu.'] };
    if (st === 'report') return { ev: null, pages: ['Con thấy rồi à? Về kể cho thầy Trụ trì nghe đi, thầy đang mong tin con đó.'] };
    return null;
  }
  return null;
}

/** Áp dụng một sự kiện. Trả { story (mới), changed, gain:{xp,sen}, notes:[...], unlocked: 'manhda'|null, stepFrom, stepTo }. Sự kiện không hợp lệ ở bước hiện tại → không đổi gì. */
export function apply2(s0, ev) {
  const s = { ...s0, shards: { ...s0.shards } }, notes = []; let gain = { xp: 0, sen: 0 }, unlocked = null;
  const out = (changed) => ({ story: changed ? s : s0, changed, gain, notes, unlocked, stepFrom: s0.step, stepTo: s.step });
  const to = (next, r, text) => { s.step = next; gain = { xp: gain.xp + r.xp, sen: gain.sen + r.sen }; if (text) notes.push(text); return out(true); };
  if (!ev || typeof ev !== 'object') return out(false);

  if (ev.type === 'talk') {
    if (ev.id === ABBOT_NPC && s.step === 'hear') return to('elder', REWARD.hear, 'Nhiệm vụ mới: xuống làng hỏi Ông Ba ở gốc đa.');
    if (ev.id === ELDER_NPC && s.step === 'elder') return to('train', REWARD.elder, 'Nhiệm vụ mới: luyện Khinh thân lên bậc 2.');
    if (ev.id === ABBOT_NPC && s.step === 'report') {
      s.shards.da = true; unlocked = 'manhda';
      return to('fin', REWARD.report, 'Bạn nhận được mảnh chuông Đá! Hai mảnh Nước và Lửa còn đang chờ ở chương sau.');
    }
    return out(false);
  }
  if (ev.type === 'khinh') {
    if (s.step !== 'train' || !(Math.floor(+ev.bac) >= TRAIN_BAC)) return out(false);
    return to('cliff', REWARD.train, 'Thân pháp đã đủ nhẹ. Hãy ra vách Đại Phật phía thác nước.');
  }
  if (ev.type === 'at') {
    if (s.step !== 'cliff' || ev.place !== CLIFF_PLACE) return out(false);
    return to('report', REWARD.cliff, 'Bạn thấy một mảnh chuông cổ lấp lánh trong vách đá. Quay về báo thầy Trụ trì.');
  }
  return out(false);
}
