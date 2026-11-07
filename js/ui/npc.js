// Giao diện thưa chuyện với NPC (Phiên 14g): bong bóng trên đầu NPC + thông báo; mỗi NPC tặng 1 hạt sen mỗi ngày.
import { talk, loadNpcState } from '../world/npc.js';

const KEY = 'lgt.npc';
const load = () => { try { return loadNpcState(localStorage.getItem(KEY)); } catch (_) { return loadNpcState(null); } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) { /* bỏ qua */ } };

export function initNpc({ toast, addMerit }) {
  const LGT = window.LGT;
  LGT.onNpc = (spotId) => {
    const id = String(spotId).replace(/^npc-/, ''), r = talk(load(), id);
    if (!r) return;
    save(r.state);
    const story = !!(LGT.storyTalk && LGT.storyTalk(id));   // Phiên 32: đang có lời cốt truyện thì mở hộp thoại thay cho lời thường
    if (!story) {
      const a = LGT.npcs && LGT.npcs[id]; if (a && a.say) a.say(r.line);
      toast(r.npc.act ? `${r.npc.ten}: ${r.line}` : `${r.npc.ten}: “${r.line}”`, 6500);
    }
    if (id === 'trikhach' && LGT.merit && !story) setTimeout(() => LGT.merit.open(), 700);   // Thầy Tri khách giữ việc đổi lá bồ đề (Phiên 35)
    if (id === 'bacphuong' && LGT.land && !story) setTimeout(() => LGT.land.open(), 700);   // Bác Tư khu phố: đất ở + đổi xóm xem (Phiên 36)
    if (LGT.act) LGT.act(r.npc.act ? 'visit' : 'npc', id);   // nhiệm vụ: trò chuyện / ghé điểm cảnh
    if (r.reward) { addMerit(r.reward); setTimeout(() => toast(`${r.npc.ten} tặng bạn ${r.reward} hạt sen hôm nay.`, 3500), 2500); }
  };
}
