// Bảng chọn PHÓ BẢN (mục 4c, Phiên 139): người dẫn (NPC) ở lối vào bốn khu rừng sâu mở bảng này. Hiện thông tin phó bản, số lần đã chinh phục, độ mạnh hiện tại; nút "Vào phó bản".
// Lưu trạng thái ở localStorage `lgt.dungeon` (loadDungeon ở js/world/dungeon.js), đặt LGT.dungeonState = { get(), set(s) } cho bước 4d dùng. CHƯA nhìn bằng mắt. Mọi chữ qua textContent.
import { loadDungeon, describe, enter, leave } from '../world/dungeon.js';

const KEY = 'lgt.dungeon';
const isEditable = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export function initDungeonPanel({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let st = null; try { st = loadDungeon(JSON.parse(localStorage.getItem(KEY))); } catch (_) { st = loadDungeon(null); }
  const set = (s) => { st = loadDungeon(s); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* riêng tư */ } return st; };
  LGT.dungeonState = { get: () => st, set };
  // Tải lại trang giữa chừng: người chơi luôn về chùa (zone tạm) nên xóa lượt đang chạy dở, KHÔNG tính chinh phục.
  if (st.run) set(leave(st));

  const css = document.createElement('style');
  css.textContent = '.pb-box{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:70;width:min(400px,calc(100vw - 20px));max-height:calc(100vh - 40px);overflow:auto;padding:14px 16px;border-radius:16px;border:1px solid rgba(217,178,95,.7);background:rgba(10,12,22,.94);color:#e8dcc0;font:14px/1.5 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5)}'
    + '.pb-box h3{margin:0 0 4px;font:600 18px/1.2 system-ui,sans-serif;color:#f1dba0}.pb-box p{margin:4px 0}.pb-box .pb-sub{color:#b9ad8c;font-size:13px}'
    + '.pb-box ul{margin:8px 0;padding:0;list-style:none;display:grid;gap:3px}.pb-box li{display:flex;justify-content:space-between;gap:8px;padding:5px 10px;border-radius:10px;background:rgba(255,255,255,.06)}'
    + '.pb-row{display:flex;gap:8px;margin-top:10px}.pb-row button{flex:1;min-height:44px;border-radius:12px;border:1px solid #f1db9f;background:rgba(217,178,95,.18);color:#f1dba0;font:600 15px system-ui,sans-serif;cursor:pointer}.pb-row button:disabled{opacity:.5;cursor:default}';
  document.head.appendChild(css);
  const box = document.createElement('div'); box.className = 'pb-box'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Phó bản');
  document.body.appendChild(box);
  const put = (tag, text, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; return e; };
  let cur = null, busy = false;
  const close = () => { box.hidden = true; cur = null; };

  function paint() {
    const d = describe(st, cur); box.replaceChildren(); if (!d) { box.hidden = true; return; }
    box.append(put('h3', d.ten), put('p', `${d.npc} · ${d.dia}`, 'pb-sub'),
      put('p', `Quái cấp ${d.lvMin}–${d.lvMax}. Hạ hết quái ${d.waves} lượt (mỗi lượt quái hồi sinh mạnh và to hơn) thì boss chính ${d.bossTen} (cấp ${d.bossLv}) xuất hiện.`));
    const ul = document.createElement('ul');
    for (const [a, b] of [['Đã chinh phục', `${d.clears} lần`], ['Độ mạnh quái hiện tại', d.clears ? `Máu ×${d.hpMul} · Công ×${d.atkMul} · To ×${d.sizeMul}` : 'Lần đầu'], ['Hạt sen khi hạ boss', `khoảng ${d.senBoss}`], ['Mảnh yêu quái', `1 mảnh ${d.bossTen}`]]) { const li = document.createElement('li'); li.append(put('span', a), put('span', b)); ul.appendChild(li); }
    const row = document.createElement('div'); row.className = 'pb-row';
    const go = put('button', 'Vào phó bản'), x = put('button', 'Để sau'); go.type = x.type = 'button'; go.disabled = busy;
    go.addEventListener('click', onEnter); x.addEventListener('click', close); row.append(go, x);
    box.append(ul, row); box.hidden = false;
  }
  async function onEnter() {
    if (busy || !cur) return; busy = true; paint(); const id = cur;
    try {
      const E = enter(st, id); if (!E.ok) { toast('Bạn đang ở trong một phó bản.', 3000); return; }
      if (!LGT.dungeonZones) { toast('Phó bản chưa sẵn sàng, thử lại sau giây lát.', 3000); return; }
      const r = await LGT.dungeonZones.enter(id);
      if (r && r.ok) { set(E.state); close(); toast(`Bạn vào ${describe(st, id).ten}. Lượt 1 sắp bắt đầu.`, 3500); }
      else toast((r && r.reason) || 'Chưa vào được phó bản.', 3000);
    } catch (_) { toast('Chưa vào được phó bản.', 3000); } finally { busy = false; if (!box.hidden) paint(); }
  }
  addEventListener('keydown', (e) => { if (e.code === 'Escape' && !box.hidden && !isEditable(e.target)) { close(); e.stopPropagation(); } }, true);
  LGT.dungeonPanel = { open(id) { if (!describe(st, id)) return false; cur = id; paint(); return true; }, close, get isOpen() { return !box.hidden; } };
  return LGT.dungeonPanel;
}
