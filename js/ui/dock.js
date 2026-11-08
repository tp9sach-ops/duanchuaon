// Cụm nút thao tác góc PHẢI-DƯỚI (Phiên 62): nhảy, kỹ năng, thả cầu, bấm!, thu cá, phóng sinh, túi đồ — cho người chơi điện thoại chỉ cần dùng ngón cái.
// Logic ở js/world/dock.js (có test). Mọi chữ qua textContent. Nút Nhảy/Bấm! nhận pointerdown (nhanh, không trễ); bàn phím vẫn dùng được (click do Enter/Space).
import { dockButtons, pickHint, loadSeen } from '../world/dock.js';

const KEY = 'lgt.dockhint';
const ICON = { tap: '🪷', cast: '🎣', thu: '🧺', phong: '🕊️', nhay: '⬆️', kynang: '✦', tui: '🎒' };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD. opts: { toast }. Đặt LGT.dock = { refresh, get ids }. */
export function initDock(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let seen = []; try { seen = loadSeen(localStorage.getItem(KEY)); } catch (_) { /* riêng tư */ }
  const saveSeen = () => { try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (_) { /* bỏ qua */ } };
  const root = el('div', 'dk'); root.id = 'dock'; root.setAttribute('role', 'group'); root.setAttribute('aria-label', 'Nút thao tác'); root.hidden = true; hud.appendChild(root);
  document.body.classList.add('has-dock');   // ẩn nút Nhảy / chip Khinh thân cũ (đã nằm trong cụm này)
  const items = new Map();   // id → { wrap, b, say, hint }
  let sig = '', skipClick = false;

  const ACT = {
    tap: () => LGT.fishing && LGT.fishing.tap(), cast: () => LGT.fishing && LGT.fishing.cast(), thu: () => LGT.fishing && LGT.fishing.keep(), phong: () => LGT.fishing && LGT.fishing.release(),
    nhay: () => LGT.skill && LGT.skill.jump(), kynang: () => LGT.skill && LGT.skill.open(),
    tui: () => (LGT.inHouse && LGT.furni ? LGT.furni.openBag() : LGT.bag ? LGT.bag.open() : toast('Túi đồ chưa sẵn sàng.', 2500)),
  };
  const FAST = new Set(['tap', 'nhay']);   // phản xạ nhanh: bấm xuống là chạy
  function press(id) {
    if (!seen.includes(id)) { seen.push(id); saveSeen(); }   // bấm rồi thì không nhắc chỗ này nữa
    try { const f = ACT[id]; if (f) f(); } catch (_) { /* nút không làm sập game */ }
    refresh();
  }
  function make(b) {
    const wrap = el('div', 'dk-item'), btn = el('button', 'dk-b'); btn.type = 'button'; btn.dataset.id = b.id;
    btn.append(el('span', 'dk-ic', ICON[b.id] || '•'), el('span', 'dk-tx', b.label));
    const say = el('p', 'dk-say'), hint = el('p', 'dk-hint'); say.hidden = hint.hidden = true; hint.setAttribute('role', 'status');
    if (FAST.has(b.id)) btn.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); skipClick = true; press(b.id); });
    btn.addEventListener('click', () => { if (skipClick) { skipClick = false; return; } press(b.id); });
    wrap.append(say, btn, hint); return { wrap, btn, say, hint };
  }
  function refresh() {
    const W = LGT.world, fs = LGT.fishing ? LGT.fishing.status() : { phase: 'idle' };
    const c = { free: !!W && W.mode === 'free' && !LGT.panelOpen && !document.querySelector('.st-dlg:not([hidden])'), khinh: LGT.skill ? LGT.skill.level : 0, canTrain: !!(LGT.skill && LGT.skill.canTrain), water: !!fs.water && !LGT.inHouse, fish: fs };
    const list = dockButtons(c), next = list.map((b) => b.id).join(',');
    root.hidden = !list.length;
    if (next !== sig) {   // bộ nút đổi → dựng lại các nút còn thiếu / bỏ nút thừa
      sig = next; for (const [id, it] of items) if (!list.some((b) => b.id === id)) { it.wrap.remove(); items.delete(id); }
      for (const b of list) if (!items.has(b.id)) items.set(b.id, make(b));
      for (const b of list) root.appendChild(items.get(b.id).wrap);   // đúng thứ tự (column-reverse: nút đầu ở dưới cùng)
    }
    const hint = pickHint(list, seen);
    for (const b of list) {
      const it = items.get(b.id); it.btn.classList.toggle('big', !!b.big); it.btn.classList.toggle('hot', !!b.hot);
      const tx = it.btn.querySelector('.dk-tx'); if (tx.textContent !== b.label) tx.textContent = b.label;
      it.say.hidden = !b.say; if (b.say && it.say.textContent !== b.say) it.say.textContent = b.say;
      const h = hint && hint.id === b.id; it.hint.hidden = !h; it.btn.classList.toggle('ping', !!h); if (h && it.hint.textContent !== hint.text) it.hint.textContent = hint.text;
    }
  }
  setInterval(refresh, 120); refresh();
  LGT.dock = { refresh, get ids() { return sig; } };
  return LGT.dock;
}
