// Túi đồ khi ĐANG Ở NGOÀI NHÀ (Phiên 62; Phiên 92: dạng LƯỚI Ô có hình vật phẩm). Bấm một ô để xem chi tiết. Mục 1: có mục “Đang cầm” — chọn Thương / Gậy như ý / Ván trượt (LGT.loadout, js/ui/board.js): đồ đang cầm là thứ đánh và cưỡi; ván không phải vũ khí.
// Trong nhà, nút Túi đồ vẫn mở bảng sửa nhà (js/ui/furni.js). Nội dung từ js/world/dock.js (bagSections), hình vẽ từ js/ui/bagIcons.js.
import { bagSections } from '../world/dock.js';
import { icon } from './bagIcons.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const COLS = 4;   // số ô mỗi hàng (lưới tự lấp ô trống cho đủ hàng)
const HOLD_ICON = { thuong: { k: 'power' }, nhuy: { k: 'lantern', c: '#d8272f' }, van: { k: 'board', c: '#f2a31b' } };
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
  function holdSection() {   // ĐANG CẦM: chọn Thương / Gậy như ý / Ván trượt
    const lo = LGT.loadout; if (!lo) return null;
    const sec = el('div', 'bg-sec'); sec.appendChild(el('h4', null, 'Đang cầm')); const grid = el('div', 'bg-grid');
    for (const h of lo.list()) {
      const cell = el('button', 'bg-cell' + (h.current ? ' sel' : '')); cell.type = 'button'; cell.setAttribute('aria-label', `${h.ten}${h.current ? ' (đang cầm)' : h.own ? '' : ' (chưa có)'}`);
      cell.append(icon(HOLD_ICON[h.id])); cell.appendChild(el('span', 'bg-nm', h.ten)); cell.appendChild(el('span', 'bg-n', h.current ? '✓' : h.own ? '' : '×'));
      if (!h.own) cell.style.opacity = '0.5';
      cell.addEventListener('click', () => { if (lo.choose(h.id)) draw(); else show(cell, { ten: h.ten, mo: `Chưa có. ${h.id === 'nhuy' ? 'Mua ở Điện Máy Lam Sen, 400 lá bồ đề.' : 'Mua ở Điện Máy Lam Sen, 100 lá bồ đề.'}` }); });
      grid.appendChild(cell);
    }
    const total = Math.max(COLS, Math.ceil(grid.children.length / COLS) * COLS);
    for (let i = grid.children.length; i < total; i++) { const e = el('div', 'bg-cell empty'); e.setAttribute('aria-hidden', 'true'); grid.appendChild(e); }
    sec.appendChild(grid); sec.appendChild(el('p', 'bg-hint', 'Thương được tặng sẵn. Đồ đang cầm là thứ bạn đánh và cưỡi (nút “Cưỡi” góc phải-dưới). Ván trượt không phải vũ khí.'));
    return sec;
  }
  function draw() {
    list.textContent = ''; picked = null; detail.textContent = 'Bấm vào một ô để xem chi tiết.';
    const hs = holdSection(); if (hs) list.appendChild(hs);
    const la = LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0, ns = LGT.skill ? LGT.skill.level : 0, bs = LGT.board && LGT.board.status();
    for (const s of bagSections({ sen: LGT.getSen ? LGT.getSen() : 0, la, fish: LGT.fishing && LGT.fishing.state, furni: LGT.furni && LGT.furni.state, khinh: ns, board: bs ? { own: !!bs.van, on: !!(bs.on && bs.hold === 'van') } : null, land: LGT.land && LGT.land.state, bell: LGT.story && LGT.story.state2 ? { da: !!LGT.story.state2.shards.da } : null, strength: LGT.strength ? { value: LGT.strength.value, tier: LGT.strength.tier, limit: LGT.strength.limit } : null })) {
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
