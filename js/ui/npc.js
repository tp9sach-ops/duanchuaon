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
    if (r.npc.dungeon && LGT.dungeonPanel && !story) setTimeout(() => LGT.dungeonPanel.open(r.npc.dungeon), 700);   // Phiên 139: người dẫn vào phó bản (Phiên 142: NPC gác phó bản mở bảng chọn) — chỉ MỘT dòng, trước đây bị lặp
    if (id === 'trikhach' && LGT.merit && !story) setTimeout(() => LGT.merit.open(), 700);   // Thầy Tri khách giữ việc đổi lá bồ đề (Phiên 35)
    if (id === 'bacphuong' && LGT.land && !story) setTimeout(() => LGT.land.open(), 700);   // Bác Tư khu phố: đất ở + đổi xóm xem (Phiên 36)
    if (id === 'nvdienmay' && !story) setTimeout(() => { if (LGT.items) LGT.items.openShop('dienmay'); else if (LGT.board) LGT.board.shop(); }, 900);   // Nhân viên Điện Máy Lam Sen: Ván trượt 100 lá + Gậy như ý 400 lá (Mục 1)
    if (id === 'nv9sach' && LGT.items && !story) setTimeout(() => LGT.items.openShop('banhsr'), 900);   // Mục 3 (14/11): Nhân viên Bánh Sầu Riêng 9 Sạch: Bánh sầu riêng 3 vị 100 lá + Bánh sầu riêng pho mai than tre 200 lá (trước đây Kim Hoàn Ngọc Lan bán Ngọc hồi máu / dịch chuyển; Kim Hoàn nay chỉ trò chuyện)
    if (id === 'nvtachhoa' && LGT.items && !story) setTimeout(() => LGT.items.openShop('tachhoa'), 900);   // Phiên 163: Nhân viên Tách Hoa: Trà sữa xoài hoàng kim 50 lá = +30 phút tự động hàng yêu hôm nay
    if (LGT.act) LGT.act(r.npc.act ? 'visit' : 'npc', id);   // nhiệm vụ: trò chuyện / ghé điểm cảnh
    if (r.reward) { addMerit(r.reward); setTimeout(() => toast(`${r.npc.ten} tặng bạn ${r.reward} hạt sen hôm nay.`, 3500), 2500); }
  };
}
