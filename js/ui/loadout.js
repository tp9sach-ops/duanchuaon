// Đồ đang cầm / cưỡi (Phiên 144, mục 1): giao diện + lưu. Luật: js/world/loadout.js (có test). Đặt LGT.loadout = { hold, weapon, mount, owned(), choose(id), refresh(prefer), items }.
// Chọn trong Túi đồ (js/ui/bag.js). Vũ khí đánh quái = LGT.loadout.weapon (ván không phải vũ khí nên đang cầm ván thì vẫn đánh bằng vũ khí cầm trước đó). Đồ cưỡi = LGT.loadout.mount (js/ui/board.js).
import { HOLDS, ownedMap, loadLoadout, chooseHold, weaponFor, mountOf, holdById } from '../world/loadout.js';

const KEY = 'lgt.loadout';

export function initLoadout({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  if (LGT.loadout) return LGT.loadout;
  const owned = () => ownedMap({ staff: !!(LGT.items && LGT.items.staff), board: !!(LGT.board && LGT.board.own) });
  let st; try { st = loadLoadout(localStorage.getItem(KEY), owned()); } catch (_) { st = loadLoadout(null, owned()); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* riêng tư */ } };
  // items.js / board.js nạp sau nên lúc đầu chưa biết đã có gậy/ván chưa → đọc lại bản lưu khi chúng sẵn sàng (không ép về thương nếu lúc này chưa nạp xong).
  let raw = null; try { raw = localStorage.getItem(KEY); } catch (_) { /* bỏ qua */ }
  let synced = false;
  const sync = () => { if (synced || !(LGT.items && LGT.board)) return; synced = true; st = loadLoadout(raw, owned()); };
  setInterval(sync, 200);

  const api = {
    get hold() { sync(); return st.hold; },
    get weapon() { sync(); return weaponFor(st, owned()); },
    get mount() { sync(); return mountOf(st, owned()); },
    owned, holds: HOLDS,
    /** Chọn đồ cầm. Trả true nếu đổi được. Có toast giải thích. */
    choose(id) {
      sync(); const r = chooseHold(st, id, owned());
      if (!r.ok) { if (r.reason === 'notowned') toast(id === 'van' ? 'Bạn chưa có Ván trượt. Mua ở Điện Máy Lam Sen (100 lá bồ đề).' : 'Bạn chưa có Gậy như ý. Mua ở Điện Máy Lam Sen (400 lá bồ đề).', 3600); return false; }
      const was = st.hold; st = r.state; save();
      if (was !== id) toast(id === 'van' ? 'Bạn cầm Ván trượt. Ván không phải vũ khí — vào trận bạn vẫn đánh bằng ' + holdById(st.last).ten + '.' : `Bạn cầm ${holdById(id).ten}.`, 3400);
      return true;
    },
    /** Sau khi mua đồ mới: tự cầm đồ đó (prefer) — không toast (nơi mua đã báo). */
    refresh(prefer) { sync(); const r = prefer ? chooseHold(st, prefer, owned()) : null; st = r && r.ok ? r.state : loadLoadout(st, owned()); save(); },
  };
  LGT.loadout = api;
  return api;
}
