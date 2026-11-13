// "Việc kế tiếp" liên tục (Phiên 43, việc 2). LOGIC THUẦN (không DOM, không three.js, có test: tests/nextgoal.test.mjs).
// Ghép 3 nguồn việc thành MỘT chuỗi không bao giờ đứt: cốt truyện chương 1 (story.js) → hành trình + hằng ngày (quests.js) theo thứ tự CHAIN → gợi ý tự do (tutorial.js advise).
// Trả về luôn đúng MỘT mục tiêu để thẻ mục tiêu (js/ui/story.js) hiển thị và để nút "Dẫn đường" dùng (guide = id nhiệm vụ cho js/ui/guide.js).
import { loadStory, objective, STORY_QUESTS, storyRows } from './story.js';
import { active2, objective2, story2Rows, STORY2_QUESTS } from './story2.js';
import { CHAPTERS, CHAIN, chapterOf, chapterProgress } from './chapters.js';
import { QUESTS, questById, questStatus } from './quests.js';
import { advise } from './tutorial.js';
import { SEN_PER_LA } from './merit.js';
import { ORBS } from './fishing.js';
import { FURNITURE } from './furniture.js';
import { SECT_QUESTS, SECT_LV } from './heQuest.js';

/** Thứ tự làm sau cốt truyện = thứ tự các chương (js/world/chapters.js). Nhiệm vụ nào không có trong đây vẫn được làm cuối cùng. */
export { CHAIN };
/** Việc hằng ngày dùng để kiếm hạt sen khi chưa đủ để đổi lá / mua đất. */
const EARN = ['n-thien', 'n-nhang', 'n-lay', 'n-kinh'];
const NEEDS_RES = new Set(['m-doila', 'm-muadat', 'm-nangnha']);
/** Việc câu cá: cần một quả cầu (rẻ nhất ORBS[0].gia lá bồ đề). state.orbs = số quả cầu đang có. */
const FISH_QUESTS = new Set(['m-cau', 'm-phongsinh', 'n-phongsinh']);

const LABEL = { story: 'Cốt truyện', daily: 'Hằng ngày', journey: 'Hành trình', free: 'Tự do tu tập' };
const chLabel = (c) => `Chương ${c.n} · ${c.ten} · ${c.done}/${c.of}`;

/**
 * state: { story (loadStory), prog (loadProg), sen, la, own: {xom,plot,lv}|null, now }.
 * Trả { id (đổi khi sang việc khác), kind: 'story'|'daily'|'journey'|'free', label, title, text, cur, need, unit, guide (id nhiệm vụ để dẫn đường | null), go (kiểu tutorial.js | null), left (số nhiệm vụ còn lại ngoài việc này) }.
 */
export function nextGoal(state = {}) {
  const story = state.story || loadStory(null), prog = state.prog, now = state.now || Date.now();
  const sen = Math.max(0, Math.floor(+state.sen) || 0), la = Math.max(0, Math.floor(+state.la) || 0), own = state.own || null, orbs = Math.max(0, Math.floor(+state.orbs) || 0);
  const base = { cur: 0, need: 0, unit: '', guide: null, go: null };

  const o = objective(story);   // cốt truyện chương 1 còn dở: luôn là việc chính
  if (o) {
    const sq = STORY_QUESTS.find((q) => q.step === story.step);
    const rows = storyRows(story), ch = chapterProgress(CHAPTERS[0], [], { done: rows.filter((r) => r.done).length, of: rows.length });
    return { ...base, chapter: ch, id: sq.id, kind: 'story', label: chLabel(ch), title: o.title, text: o.text, cur: o.cur || 0, need: o.need || 0, unit: o.unit || '', guide: sq.id, left: QUESTS.length };
  }

  // Phiên 95: xong chương 1 thì việc chính là chương 2 "Mảnh chuông Đá" (js/world/story2.js); thiếu state.story2 thì bỏ qua (giữ hành vi cũ)
  if (state.story2 && active2(story, state.story2)) {
    const o2 = objective2(state.story2), sq2 = STORY2_QUESTS.find((q) => q.step === state.story2.step);
    if (o2 && sq2) {
      const rows = story2Rows(state.story2, state.bac);
      return { ...base, chapter: null, id: sq2.id, kind: 'story', label: `Cốt truyện · Chương 2 · Mảnh chuông Đá · ${rows.filter((r) => r.done).length}/${rows.length}`, title: o2.title, text: o2.text, cur: o2.cur || 0, need: o2.need || 0, unit: o2.unit || '', guide: sq2.id, left: QUESTS.length };
    }
  }

  const status = prog ? questStatus(prog, now) : QUESTS.map((q) => ({ q, cur: 0, need: q.dk.n, done: false }));
  const pending = status.filter((r) => !r.done);
  // Phiên 141: gia nhập phái + học chiêu — chỉ khi biết cấp hiệu dụng `state.cap` (thiếu = giữ hành vi cũ); đủ cấp 10 thì làm NGAY (trước mọi việc khác sau cốt truyện).
  const capKnown = Number.isFinite(+state.cap), cap = capKnown ? +state.cap : Infinity, sectOn = SECT_QUESTS.filter(() => cap >= SECT_LV);
  const rank = (id) => { if (capKnown && sectOn.includes(id) && cap >= SECT_LV) return -1; const i = CHAIN.indexOf(id); return i < 0 ? CHAIN.length : i; };
  const queue = pending.slice().sort((a, b) => rank(a.q.id) - rank(b.q.id));
  const dailyLeft = (pending.filter((r) => r.q.loai === 'ngay').length);
  const earnId = EARN.find((id) => pending.some((r) => r.q.id === id)) || null;

  for (const r of queue) {
    const q = r.q, kind = q.loai === 'ngay' ? 'daily' : 'journey', left = pending.length - 1;
    if (capKnown && SECT_QUESTS.includes(q.id) && cap < SECT_LV) continue;   // chưa đủ cấp 10: chưa tới lượt
    if (q.id === 'm-chieu1' && state.he === null) continue;                 // đã biết là chưa có phái: phải Khai Ngộ trước (m-khaingo luôn đứng trước)
    if (q.id === 'm-nangnha' && !own) continue;     // chưa có nhà thì chưa nâng được; sẽ tới lượt sau khi mua đất
    if (q.id === 'm-noithat' && !own) continue;     // chưa có nhà thì chưa có chỗ đặt đồ
    if (q.id === 'm-muadat' && own) continue;       // đã có đất (nhiệm vụ sẽ được ghi nhận khi mua)
    const co = chapterOf(q.id), ch = co ? chapterProgress(co, status) : null;
    const g = { ...base, chapter: ch, id: q.id, kind, label: ch ? chLabel(ch) : LABEL[kind], title: q.ten, text: q.mo, cur: r.cur, need: r.need, unit: '', guide: q.id, left };
    if (FISH_QUESTS.has(q.id) && !orbs) {   // chưa có quả cầu nào: nói rõ cách có cầu (câu cá cần cầu; ao cá riêng cũng cần từng câu được cá)
      const cheap = ORBS[0];
      if (la >= cheap.gia) { g.text = `Mở nút “Câu cá” → tab “Quả cầu”, mua ${cheap.ten} (${cheap.gia} lá bồ đề), rồi ra mép nước thả cầu.`; g.guide = q.id; }
      else { g.id = q.id + ':kiem'; g.title = `Kiếm lá bồ đề mua quả cầu đầu tiên`; g.text = `Quả cầu rẻ nhất (${cheap.ten}) giá ${cheap.gia} lá bồ đề, bạn có ${la}. Kiếm hạt sen rồi đổi lá ở Thầy Tri khách (${SEN_PER_LA} hạt = 1 lá).`; g.guide = earnId; g.go = { npc: 'trikhach' }; if (!earnId) g.guide = null; }
    }
    if (q.id === 'm-noithat') {   // Phiên 51: món rẻ nhất cần ít lá bồ đề; chưa đủ thì dẫn đi kiếm hạt sen trước
      const cheap = Math.min(...FURNITURE.map((f) => f.gia));
      if (la < cheap && earnId) { g.id = q.id + ':kiem'; g.title = 'Kiếm lá bồ đề mua món nội thất đầu tiên'; g.text = `Món rẻ nhất giá ${cheap} lá bồ đề, bạn có ${la}. Kiếm hạt sen rồi đổi lá nhé.`; g.guide = earnId; }
    }
    if (NEEDS_RES.has(q.id)) {   // việc cần lá bồ đề: nói rõ còn thiếu gì, chưa đủ thì dẫn đi kiếm hạt sen trước
      const a = advise({ sen, la, own });
      g.text = a.text; g.go = a.go || null;
      if (/^kiemsen/.test(a.id) || (q.id === 'm-doila' && sen < SEN_PER_LA && la < 1)) {
        g.id = q.id + ':kiem'; g.title = 'Kiếm hạt sen cho ' + q.ten.toLowerCase(); g.guide = earnId;
        if (!earnId) { g.guide = null; g.text = a.text + ' Hôm nay bạn đã làm hết việc kiếm hạt sen; mai quay lại nhé.'; }
      }
    }
    return g;
  }

  if (capKnown && cap < SECT_LV && pending.some((r) => SECT_QUESTS.includes(r.q.id))) {   // chỉ còn việc chờ cấp 10: nói rõ việc kế tiếp
    return { ...base, chapter: null, id: 'sect:len-cap', kind: 'journey', label: 'Chương 8 · Gia nhập phái', title: `Luyện lên cấp ${SECT_LV} để gia nhập phái`, text: `Đánh quái ở bãi rừng để lên cấp (bạn đang cấp ${cap}). Đủ cấp ${SECT_LV} sẽ có nhiệm vụ gia nhập phái và học chiêu mới.`, cur: cap, need: SECT_LV, left: pending.length };
  }
  const a = advise({ sen, la, own });   // mọi nhiệm vụ đã xong: gợi ý tự do, không bao giờ để người chơi không biết làm gì
  const text = own ? 'Bạn đã làm xong mọi nhiệm vụ. Vào nhà bấm “Chỉnh sửa” để sắp đặt đồ, hoặc ra hồ cá ngắm cá; mai quay lại làm việc hằng ngày.' : a.text;
  return { ...base, id: 'free:' + a.id, kind: 'free', label: LABEL.free, title: 'Tu tập tự do', text, go: a.go || null, left: 0, dailyLeft };
}
