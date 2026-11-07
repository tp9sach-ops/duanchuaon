// "Việc kế tiếp" liên tục (Phiên 43, việc 2). LOGIC THUẦN (không DOM, không three.js, có test: tests/nextgoal.test.mjs).
// Ghép 3 nguồn việc thành MỘT chuỗi không bao giờ đứt: cốt truyện chương 1 (story.js) → hành trình + hằng ngày (quests.js) theo thứ tự CHAIN → gợi ý tự do (tutorial.js advise).
// Trả về luôn đúng MỘT mục tiêu để thẻ mục tiêu (js/ui/story.js) hiển thị và để nút "Dẫn đường" dùng (guide = id nhiệm vụ cho js/ui/guide.js).
import { loadStory, objective, STORY_QUESTS } from './story.js';
import { QUESTS, questById, questStatus } from './quests.js';
import { advise } from './tutorial.js';
import { SEN_PER_LA } from './merit.js';

/** Thứ tự làm sau cốt truyện: việc hằng ngày nhẹ trước (mỗi sáng bắt đầu từ đây), rồi hành trình từ gần tới xa, việc cần lá bồ đề để sau. Nhiệm vụ nào không có trong đây vẫn được làm cuối cùng. */
export const CHAIN = ['n-nhang', 'n-lay', 'm-den', 'm-loc', 'm-lang', 'm-npc', 'n-kinh', 'm-niem', 'm-doila', 'm-muadat', 'm-thac', 'm-rung', 'm-dao', 'm-nangnha', 'm-nhang', 'm-kinh', 'n-thien', 'n-npc'];
/** Việc hằng ngày dùng để kiếm hạt sen khi chưa đủ để đổi lá / mua đất. */
const EARN = ['n-thien', 'n-nhang', 'n-lay', 'n-kinh'];
const NEEDS_RES = new Set(['m-doila', 'm-muadat', 'm-nangnha']);

const LABEL = { story: 'Cốt truyện', daily: 'Hằng ngày', journey: 'Hành trình', free: 'Tự do tu tập' };

/**
 * state: { story (loadStory), prog (loadProg), sen, la, own: {xom,plot,lv}|null, now }.
 * Trả { id (đổi khi sang việc khác), kind: 'story'|'daily'|'journey'|'free', label, title, text, cur, need, unit, guide (id nhiệm vụ để dẫn đường | null), go (kiểu tutorial.js | null), left (số nhiệm vụ còn lại ngoài việc này) }.
 */
export function nextGoal(state = {}) {
  const story = state.story || loadStory(null), prog = state.prog, now = state.now || Date.now();
  const sen = Math.max(0, Math.floor(+state.sen) || 0), la = Math.max(0, Math.floor(+state.la) || 0), own = state.own || null;
  const base = { cur: 0, need: 0, unit: '', guide: null, go: null };

  const o = objective(story);   // cốt truyện chương 1 còn dở: luôn là việc chính
  if (o) {
    const sq = STORY_QUESTS.find((q) => q.step === story.step);
    return { ...base, id: sq.id, kind: 'story', label: LABEL.story, title: o.title, text: o.text, cur: o.cur || 0, need: o.need || 0, unit: o.unit || '', guide: sq.id, left: QUESTS.length };
  }

  const status = prog ? questStatus(prog, now) : QUESTS.map((q) => ({ q, cur: 0, need: q.dk.n, done: false }));
  const pending = status.filter((r) => !r.done);
  const rank = (id) => { const i = CHAIN.indexOf(id); return i < 0 ? CHAIN.length : i; };
  const queue = pending.slice().sort((a, b) => rank(a.q.id) - rank(b.q.id));
  const dailyLeft = (pending.filter((r) => r.q.loai === 'ngay').length);
  const earnId = EARN.find((id) => pending.some((r) => r.q.id === id)) || null;

  for (const r of queue) {
    const q = r.q, kind = q.loai === 'ngay' ? 'daily' : 'journey', left = pending.length - 1;
    if (q.id === 'm-nangnha' && !own) continue;     // chưa có nhà thì chưa nâng được; sẽ tới lượt sau khi mua đất
    if (q.id === 'm-muadat' && own) continue;       // đã có đất (nhiệm vụ sẽ được ghi nhận khi mua)
    const g = { ...base, id: q.id, kind, label: LABEL[kind], title: q.ten, text: q.mo, cur: r.cur, need: r.need, unit: '', guide: q.id, left };
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

  const a = advise({ sen, la, own });   // mọi nhiệm vụ đã xong: gợi ý tự do, không bao giờ để người chơi không biết làm gì
  const text = own ? 'Bạn đã làm xong mọi nhiệm vụ. Vào nhà bấm “Chỉnh sửa” để sắp đặt đồ, hoặc ra hồ cá ngắm cá; mai quay lại làm việc hằng ngày.' : a.text;
  return { ...base, id: 'free:' + a.id, kind: 'free', label: LABEL.free, title: 'Tu tập tự do', text, go: a.go || null, left: 0, dailyLeft };
}
