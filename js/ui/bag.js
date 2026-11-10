// Túi đồ khi ĐANG Ở NGOÀI NHÀ (Phiên 62; Phiên 92: dạng LƯỚI Ô có hình vật phẩm như các game khác). Chỉ để xem mình đang có gì; bấm một ô để xem chi tiết.
// Trong nhà, nút Túi đồ vẫn mở bảng sửa nhà (js/ui/furni.js). Nội dung từ js/world/dock.js (bagSections), hình vẽ từ js/ui/bagIcons.js.
import { bagSections } from '../world/dock.js';
import { icon } from './bagIcons.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const COLS = 4;   // số ô mỗi hàng (lưới tự lấp ô trống cho đủ hàng)
/** Số hiển thị ở góc ô: 1.234 → "1234", từ 10.000 trở lên rút gọn "12k". */
export const fmtN = (n) => (n >= 10000 ? (n >= 1e6 ? Math.floor(n / 1e5) / 10 + 'M' : Math.floor(n / 1000) + 'k') : String(n));

/** hud: phần tử HUD. Đặt LGT.bag = { open, close, get isOpen }. */
export function initBag(hud) {
  const LGT = window.LGT || (window.LGT = {});
  const box = el('section', 'bg-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Túi đồ');
  const head = el('header'), x = el('button', 'bg-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(el('h3', null, 'Túi đồ của bạn'), x);
  const list = el('div', 'bg-list'), detail = el('p', 'bg-detail'), note = el('p', 'bg-note', 'Muốn đặt đồ vào nhà: vào nhà của bạn rồi bấm “Túi đồ” lần nữa.');
  detail.setAttribute('role', 'status'); box.append(head, list, detail, note); hud.appendChild(box);
  let picked = null;
  function show(cell, r) {
    if (picked) picked.classList.remove('sel'); picked = cell; cell.classList.add('sel');
    detail.textContent = ''; detail.append(el('b', null, r.ten), document.createTextNode(' — ' + r.mo));
  }
  function draw() {
    list.textContent = ''; picked = null; detail.textContent = 'Bấm vào một ô để xem chi tiết.';
    const la = LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0, ns = LGT.skill ? LGT.skill.level : 0;
    for (const s of bagSections({ sen: LGT.getSen ? LGT.getSen() : 0, la, fish: LGT.fishing && LGT.fishing.state, furni: LGT.furni && LGT.furni.state, khinh: ns, board: LGT.board && LGT.board.status(), land: LGT.land && LGT.land.state, strength: LGT.strength ? { value: LGT.strength.value, tier: LGT.strength.tier, limit: LGT.strength.limit } : null })) {
      const sec = el('div', 'bg-sec'); sec.appendChild(el('h4', null, s.title));
      const grid = el('div', 'bg-grid'); let cells = 0, hint = '';
      for (const r of s.rows) {
        if (r.trong) { hint = `${r.ten}. ${r.mo}`; continue; }   // hàng "trống": không phải vật phẩm, chỉ là lời gợi ý dưới lưới
        const cell = el('button', 'bg-cell'); cell.type = 'button'; cell.setAttribute('aria-label', `${r.ten}: ${r.mo}`);
        cell.append(icon(r.ic)); if (r.n != null && !(r.n === 1 && s.title !== 'Tiền')) cell.appendChild(el('span', 'bg-n', fmtN(r.n)));
        cell.appendChild(el('span', 'bg-nm', r.ten));
        cell.addEventListener('click', () => show(cell, r)); grid.appendChild(cell); cells++;
      }
      const total = Math.max(COLS, Math.ceil(cells / COLS) * COLS);
      for (let i = cells; i < total; i++) { const e = el('div', 'bg-cell empty'); e.setAttribute('aria-hidden', 'true'); grid.appendChild(e); }
      sec.appendChild(grid); if (hint) sec.appendChild(el('p', 'bg-hint', hint));
      list.appendChild(sec);
    }
  }
  const open = () => { if (LGT.panelOpen) return; draw(); box.hidden = false; x.focus({ preventScroll: true }); };
  const close = () => { box.hidden = true; };
  x.addEventListener('click', close);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  LGT.bag = { open, close, get isOpen() { return !box.hidden; } };
  return LGT.bag;
}
