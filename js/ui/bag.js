// Túi đồ khi ĐANG Ở NGOÀI NHÀ (Phiên 62): chỉ để xem mình đang có gì. Trong nhà, nút Túi đồ vẫn mở bảng sửa nhà (js/ui/furni.js). Nội dung từ js/world/dock.js (bagSections).
import { bagSections } from '../world/dock.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD. Đặt LGT.bag = { open, close, get isOpen }. */
export function initBag(hud) {
  const LGT = window.LGT || (window.LGT = {});
  const box = el('section', 'bg-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Túi đồ');
  const head = el('header'), x = el('button', 'bg-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(el('h3', null, 'Túi đồ của bạn'), x);
  const list = el('div', 'bg-list'), note = el('p', 'bg-note', 'Muốn đặt đồ vào nhà: vào nhà của bạn rồi bấm “Túi đồ” lần nữa.'); box.append(head, list, note); hud.appendChild(box);
  function draw() {
    list.textContent = '';
    const la = LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0, ns = LGT.skill ? LGT.skill.level : 0;
    for (const s of bagSections({ sen: LGT.getSen ? LGT.getSen() : 0, la, fish: LGT.fishing && LGT.fishing.state, furni: LGT.furni && LGT.furni.state, khinh: ns, land: LGT.land && LGT.land.state, strength: LGT.strength ? { value: LGT.strength.value, tier: LGT.strength.tier, limit: LGT.strength.limit } : null })) {
      const sec = el('div', 'bg-sec'); sec.appendChild(el('h4', null, s.title));
      for (const r of s.rows) { const row = el('div', 'bg-row'); row.append(el('b', null, r.ten), el('span', null, r.mo)); sec.appendChild(row); }
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
