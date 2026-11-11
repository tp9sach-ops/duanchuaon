// Cốt truyện chương 1 "Chăm sóc cây bồ đề" (Phiên 32, master prompt mục IX–X). LOGIC THUẦN: không DOM, không three.js, có test (tests/story.test.mjs).
// Máy trạng thái: meet → abbot → water1 → meditate → water2 → done. Hoàn thành thì mở "Khinh thân bậc 1".
// Mọi điểm thưởng là QUY ƯỚC TẠM của dự án (chờ ptg duyệt). Dữ liệu lưu cục bộ (localStorage) — CHƯA có máy chủ nên không chống gian lận thật sự;
// đã chống lỗi thường gặp: bấm tưới liên tục (hồi chiêu), cộng thời gian thiền quá nhanh (mỗi lần cộng bị chặn trần), dữ liệu lưu bị sửa vô lý (loadStory dọn lại).
// Cách dùng: s = loadStory(raw); r = apply(s, { type:'talk', id:'chutieu' }, Date.now()); r.story (lưu lại), r.gain, r.notes, r.unlocked.

/** Cây bồ đề cổ dùng cho nhiệm vụ (cây lớn nhất, gần chánh điện). Phải KHỚP js/scene/index.js (buildBodhi(-34, -16, 1.2)) và layout.js (vật cản). */
export const BODHI = { x: -34, z: -16, s: 1.2 };
/** Điểm đứng để tưới cây (phía Đông cây, mặt hướng về cây) và bán kính cho phép tưới. */
export const WATER_SPOT = { x: -30.6, z: -16 };
export const WATER_RANGE = 4.5;
export const WATER_COOLDOWN_MS = 3500;
export const WATER2_N = 3;          // số lần tưới sau khi cây lớn lên
export const MEDITATE_SECONDS = 180; // thiền đủ 3 phút
const MAX_DT = 2;                    // mỗi lần cộng giờ thiền tối đa 2 giây (chống cộng dồn một lúc)

export const STEPS = ['meet', 'abbot', 'water1', 'meditate', 'water2', 'done'];
/** Hệ số kích thước cây theo giai đoạn (0 = ngừng phát triển, 1 = lớn một chút sau khi thiền, 2 = sau khi hoàn thành). */
export const TREE_SCALE = [0.86, 0.96, 1.06];

/** Thưởng khi hoàn thành từng bước. */
const REWARD = { talkMeet: { xp: 5, sen: 0 }, talkAbbot: { xp: 5, sen: 0 }, water1: { xp: 10, sen: 1 }, meditate: { xp: 30, sen: 3 }, done: { xp: 60, sen: 5 } };

export const emptyStory = () => ({ v: 1, step: 'meet', can: false, waters: 0, med: 0, tree: 0, lastWater: 0, skills: { khinhthan: 0 } });

const num = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, +x)) : lo);

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng). Dữ liệu hỏng/vô lý → chỉnh lại cho nhất quán, không bao giờ ném lỗi. */
export function loadStory(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyStory(); if (!o || typeof o !== 'object' || Array.isArray(o)) return s;
  const i = STEPS.indexOf(o.step); if (i < 0) return s;
  s.step = STEPS[i];
  s.lastWater = num(o.lastWater, 0, 8.64e15);
  // Số liệu của bước hiện tại; các bước đã qua mặc định "đã xong"
  if (s.step === 'water2') s.waters = Math.floor(num(o.waters, 0, WATER2_N - 1));
  if (s.step === 'meditate') s.med = Math.floor(num(o.med, 0, MEDITATE_SECONDS - 1));
  s.can = i >= STEPS.indexOf('water1') && i < STEPS.indexOf('done');
  s.tree = i >= STEPS.indexOf('done') ? 2 : i >= STEPS.indexOf('water2') ? 1 : 0;
  if (s.step === 'done') s.skills.khinhthan = 1;   // chỉ mở khi đã hoàn thành chuỗi nhiệm vụ
  return s;
}

/** Mục tiêu hiện tại để hiển thị: { title, text, npc (id NPC cần gặp) | at:'tree', cur, need, unit } hoặc null nếu xong. */
export function objective(s) {
  switch (s.step) {
    case 'meet': return { title: 'Gặp chú tiểu', text: 'Đến gặp chú tiểu đang tập võ ở trước cổng chùa.', npc: 'chutieu' };
    case 'abbot': return { title: 'Gặp thầy Trụ trì', text: 'Chú tiểu bảo bạn vào chánh điện gặp thầy Trụ trì.', npc: 'truru' };
    case 'water1': return { title: 'Tưới cây bồ đề', text: 'Mang bình nước tới cây bồ đề cổ (phía Tây chánh điện) và tưới cây.', at: 'tree', cur: 0, need: 1, unit: 'lần' };
    case 'meditate': return { title: 'Ngồi thiền ba phút', text: 'Ngồi thiền trong chánh điện cho đủ 3 phút, giữ tâm yên.', cur: Math.floor(s.med), need: MEDITATE_SECONDS, unit: 'giây' };
    case 'water2': return { title: 'Tưới cây tiếp', text: 'Cây đã lớn lên một chút. Tiếp tục tưới cây.', at: 'tree', cur: s.waters, need: WATER2_N, unit: 'lần' };
    default: return null;
  }
}

/**
 * Các bước cốt truyện dưới dạng "nhiệm vụ" để hiện trong bảng Nhiệm vụ (nhóm Cốt truyện) và để dẫn đường (js/world/questGuide.js).
 * id 's-...' không trùng với QUESTS. reward = phần thưởng của bước đó (khớp REWARD bên dưới, giá trị tạm).
 */
export const STORY_QUESTS = [
  { id: 's-meet', step: 'meet', ten: 'Gặp chú tiểu Minh', mo: 'Chú tiểu đang tập võ ở ngoài cổng chùa. Bấm vào chú để trò chuyện.', need: 1, unit: '', reward: REWARD.talkMeet },
  { id: 's-abbot', step: 'abbot', ten: 'Gặp thầy Trụ trì', mo: 'Vào chánh điện thưa chuyện với thầy Trụ trì để nhận bình nước.', need: 1, unit: '', reward: REWARD.talkAbbot },
  { id: 's-water1', step: 'water1', ten: 'Tưới cây bồ đề cổ', mo: 'Mang bình nước tới cây bồ đề cổ phía Tây chánh điện, bấm “Tưới cây”.', need: 1, unit: 'lần', reward: REWARD.water1 },
  { id: 's-meditate', step: 'meditate', ten: 'Ngồi thiền ba phút', mo: 'Vào chánh điện, bấm “Thiền” và ngồi yên đủ 3 phút.', need: MEDITATE_SECONDS, unit: 'giây', reward: REWARD.meditate },
  { id: 's-water2', step: 'water2', ten: 'Tưới cây cho vững gốc', mo: 'Tưới cây bồ đề thêm 3 lần để cây xanh trở lại, mở Khinh thân bậc 1.', need: WATER2_N, unit: 'lần', reward: REWARD.done },
];
export const isStoryQuest = (id) => STORY_QUESTS.some((q) => q.id === id);
/** Hàng hiển thị cho bảng nhiệm vụ: { q:{id,ten,mo,xp,sen,step,unit}, cur, need, done, locked }. done = bước đã qua; locked = chưa tới bước đó. */
export function storyRows(s) {
  const at = STEPS.indexOf(s.step);
  return STORY_QUESTS.map((q, i) => {
    const done = at > i, locked = at < i, cur = done ? q.need : locked ? 0 : q.step === 'meditate' ? Math.floor(s.med) : q.step === 'water2' ? s.waters : 0;
    return { q: { id: q.id, ten: q.ten, mo: q.mo, xp: q.reward.xp, sen: q.reward.sen, step: q.step, unit: q.unit }, cur, need: q.need, done, locked };
  });
}

/** Có tưới được lúc này không: { ok, reason }. near = người chơi đang đứng trong tầm tưới. */
export function canWater(s, near, now = Date.now()) {
  if (s.step !== 'water1' && s.step !== 'water2') return { ok: false, reason: 'idle' };
  if (!s.can) return { ok: false, reason: 'nocan' };
  if (!near) return { ok: false, reason: 'far' };
  if (Math.abs(now - s.lastWater) < WATER_COOLDOWN_MS) return { ok: false, reason: 'cooldown' };   // |…|: chỉnh đồng hồ lùi một chút cũng không lách được hồi chiêu
  return { ok: true, reason: '' };
}
/** (x, z) có trong tầm tưới cây bồ đề không. */
export const nearTree = (p) => !!p && Math.hypot(p.x - BODHI.x, p.z - BODHI.z) <= WATER_RANGE;

/**
 * Hội thoại với NPC theo tiến độ: { pages: [chuỗi...], ev: sự kiện áp dụng khi đọc hết | null }.
 * Chỉ chú tiểu (chutieu) và Trụ trì (truru) có hội thoại cốt truyện; NPC khác trả null (dùng lời thường).
 */
export function dialogueFor(s, id) {
  const st = s.step;
  if (id === 'chutieu') {
    if (st === 'meet') return { ev: { type: 'talk', id }, pages: [
      'A Di Đà Phật! Chào hành giả mới. Con là tiểu Minh, sáng nào cũng tập võ ở đây cho khỏe người.',
      'Chùa Diệu Giang có tám cảnh giới khinh công, nhưng đã thất truyền từ lâu. Từ ngày đại hồng chung vỡ, cây bồ đề cổ cũng ngừng lớn.',
      'Muốn tu tập thì phải bắt đầu từ việc nhỏ. Hành giả vào chánh điện gặp thầy Trụ trì nhé, thầy sẽ giao việc.',
      'Đi thẳng qua Tam quan, theo lối giữa tới bậc thềm. Cần di chuyển thì dùng phím W A S D, hoặc bấm vào chỗ muốn tới.',
    ] };
    if (st === 'abbot') return { ev: null, pages: ['Hành giả vào chánh điện gặp thầy Trụ trì nhé. Thầy đang chờ đấy.'] };
    if (st === 'water1' || st === 'water2') return { ev: null, pages: ['Cây bồ đề ở phía Tây chánh điện. Tưới cây nhẹ tay, đừng vội.'] };
    if (st === 'meditate') return { ev: null, pages: ['Thiền ba phút nghe ngắn mà không dễ đâu. Cứ thở đều, đừng đuổi theo suy nghĩ.'] };
    return { ev: null, pages: ['Hành giả đã mở được Khinh thân bậc 1 rồi! Mong những bậc sau cũng vậy. Con tập võ tiếp đây.'] };
  }
  if (id === 'truru') {
    if (st === 'meet') return { ev: null, pages: ['A Di Đà Phật. Bạn mới đến chùa à? Chú tiểu đang tập võ trước cổng sẽ chỉ bạn việc đầu tiên.'] };
    if (st === 'abbot') return { ev: { type: 'talk', id }, pages: [
      'A Di Đà Phật. Thầy mừng vì có hành giả mới. Từ đêm đại hồng chung vỡ, tám cảnh giới khinh công thất truyền, cây bồ đề cổ cũng thôi đâm chồi.',
      'Khôi phục cây là bước đầu. Thầy trao bạn bình nước này. Hãy mang tới cây bồ đề cổ phía Tây chánh điện và tưới cho cây.',
      'Tưới xong, hãy vào ngồi thiền ba phút. Tâm có yên thì cây mới nhận được nước. Xong việc này, thầy sẽ kể con nghe chuyện về chiếc chuông.',
    ] };
    if (st === 'water1') return { ev: null, pages: ['Bình nước bạn đã cầm. Đem tới cây bồ đề cổ phía Tây chánh điện, tưới nhẹ vào gốc.'] };
    if (st === 'meditate') return { ev: null, pages: ['Cây đã được tưới. Giờ bạn vào bồ đoàn trong chánh điện, bấm Thiền rồi ngồi yên đủ ba phút.'] };
    if (st === 'water2') return { ev: null, pages: ['Cây đã nhú chồi nhờ lòng thành của bạn. Tưới thêm vài lần nữa cho cây vững gốc.'] };
    return { ev: null, pages: ['Cây bồ đề đã xanh trở lại. Khinh thân bậc 1 là món quà nhỏ. Còn bảy bậc nữa, từ từ rồi sẽ tới.'] };
  }
  return null;
}

/** Thêm một số mô tả ngắn cho các câu thông báo. */
const note = (arr, t) => arr.push(t);

/**
 * Áp dụng một sự kiện. ev = { type:'talk', id } | { type:'water', near?, now? } | { type:'meditate', dt }.
 * Trả { story (mới), changed, gain:{xp,sen}, notes:[...], grew, unlocked: 'khinhthan1'|null, stepFrom, stepTo }.
 * Sự kiện không hợp lệ ở bước hiện tại → không đổi gì (changed=false).
 */
export function apply(s0, ev, now = Date.now()) {
  const s = { ...s0, skills: { ...s0.skills } }, notes = []; let gain = { xp: 0, sen: 0 }, grew = false, unlocked = null;
  const out = (changed) => ({ story: changed ? s : s0, changed, gain, notes, grew, unlocked, stepFrom: s0.step, stepTo: s.step });
  const add = (r) => { gain = { xp: gain.xp + r.xp, sen: gain.sen + r.sen }; };
  if (!ev || typeof ev !== 'object') return out(false);

  if (ev.type === 'talk') {
    if (ev.id === 'chutieu' && s.step === 'meet') {
      s.step = 'abbot'; add(REWARD.talkMeet); note(notes, 'Nhiệm vụ mới: gặp thầy Trụ trì trong chánh điện.'); return out(true);
    }
    if (ev.id === 'truru' && s.step === 'abbot') {
      s.step = 'water1'; s.can = true; add(REWARD.talkAbbot); note(notes, 'Bạn nhận được bình tưới nước. Hãy mang tới cây bồ đề cổ.'); return out(true);
    }
    return out(false);
  }

  if (ev.type === 'water') {
    const t = Number.isFinite(+ev.now) ? +ev.now : now, c = canWater(s, ev.near !== false, t);
    if (!c.ok) return out(false);
    s.lastWater = t;
    if (s.step === 'water1') {
      s.step = 'meditate'; s.med = 0; add(REWARD.water1);
      note(notes, 'Bạn đã tưới cây lần thứ nhất. Hãy vào chánh điện ngồi thiền đủ 3 phút.'); return out(true);
    }
    s.waters += 1;   // water2
    if (s.waters >= WATER2_N) {
      s.step = 'done'; s.can = false; s.tree = 2; s.waters = 0; s.skills.khinhthan = 1; add(REWARD.done); unlocked = 'khinhthan1'; grew = true;
      note(notes, 'Cây bồ đề đã xanh tốt. Bạn mở được Khinh thân bậc 1!');
    } else note(notes, `Đã tưới ${s.waters}/${WATER2_N} lần.`);
    return out(true);
  }

  if (ev.type === 'meditate') {
    if (s.step !== 'meditate') return out(false);
    const dt = Number.isFinite(+ev.dt) ? Math.max(0, Math.min(MAX_DT, +ev.dt)) : 0; if (dt <= 0) return out(false);
    s.med = Math.min(MEDITATE_SECONDS, s.med + dt);
    if (s.med >= MEDITATE_SECONDS) {
      s.step = 'water2'; s.med = 0; s.tree = 1; s.waters = 0; add(REWARD.meditate); grew = true;
      note(notes, 'Đủ 3 phút. Cây bồ đề đã lớn lên một chút! Hãy tiếp tục tưới cây.');
    }
    return out(true);
  }
  return out(false);
}

/** Kích thước cây (hệ số) theo trạng thái. */
export const treeScale = (s) => TREE_SCALE[Math.max(0, Math.min(2, s.tree | 0))];
