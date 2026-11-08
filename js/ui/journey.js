// Lộ trình (Phiên 57): trang ô hình trong bảng Nhiệm vụ. Logic ở js/world/journey.js (có test). Mọi chữ đi qua textContent, không chèn HTML.
import { buildJourney } from '../world/journey.js';
import { levelOf } from '../world/quests.js';
import { khinhBac } from '../world/skills.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** host: phần tử chứa; opts: { close() (đóng bảng nhiệm vụ trước khi mở bảng khác) }. Trả { draw }. */
export function initJourney(host, { close = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let page = 0, pick = null;
  const ctx = () => {
    const prog = LGT.quests && LGT.quests.prog || null, st = LGT.story && LGT.story.state;
    return { str: LGT.strength ? LGT.strength.value : 0, yq: LGT.yq && LGT.yq.stat ? { kills: LGT.yq.stat.kills, bonus: LGT.yq.stat.bonus } : null, prog, khinh: LGT.skill ? LGT.skill.level : khinhBac(st, 0), capNguoi: levelOf(prog ? prog.xp : 0).lv, sen: LGT.getSen ? LGT.getSen() : 0, fish: LGT.fishing && LGT.fishing.state, land: LGT.land && LGT.land.state, furni: LGT.furni && LGT.furni.state };
  };
  const run = (act, quest) => {
    if (quest && LGT.guide) { close(); LGT.guide.start(quest); return; }
    if (!act) return;
    close();
    try {
      if (act.kind === 'fishing' && LGT.fishing) LGT.fishing.open(act.tab);
      else if (act.kind === 'skill' && LGT.skill) LGT.skill.open();
      else if (act.kind === 'merit' && LGT.merit) LGT.merit.open();
      else if (act.kind === 'furni' && LGT.furni) (act.tab === 'bag' ? LGT.furni.openBag() : LGT.furni.openShop());
    } catch (_) { /* nút bấm không làm sập bảng */ }
  };
  function draw() {
    host.textContent = '';
    const pages = buildJourney(ctx()); page = Math.max(0, Math.min(pages.length - 1, page));
    const tabs = el('div', 'jn-tabs'); pages.forEach((p, i) => { const b = el('button', 'jn-tab' + (i === page ? ' on' : ''), `${p.ten} ${p.done}/${p.total}`); b.type = 'button'; b.addEventListener('click', () => { page = i; pick = null; draw(); }); tabs.appendChild(b); });
    const pg = pages[page], grid = el('div', 'jn-grid');
    host.append(tabs, el('p', 'jn-sub', pg.mo), grid);
    for (const t of pg.tiles) {
      const b = el('button', 'jn-tile' + (t.done ? ' done' : '') + (t.soon ? ' soon' : '') + (pick === t.id ? ' sel' : '')); b.type = 'button'; b.setAttribute('aria-label', `${t.ten}: ${t.done ? 'đã trải nghiệm' : 'chưa trải nghiệm'}`);
      b.append(el('span', 'jn-ic', t.done ? t.icon : '?'), el('b', null, t.ten), el('small', null, t.mo));
      b.addEventListener('click', () => { pick = pick === t.id ? null : t.id; draw(); }); grid.appendChild(b);
    }
    const t = pg.tiles.find((x) => x.id === pick); if (!t) { host.appendChild(el('p', 'jn-hint', 'Chạm vào một ô để xem cách trải nghiệm. Ô có dấu “?” là chưa trải nghiệm.')); return; }
    const d = el('div', 'jn-det'); d.append(el('h5', null, t.secret && !t.done ? 'Nơi / loài chưa biết' : t.ten), el('p', 'jn-st', t.done ? '✓ Đã trải nghiệm' : t.soon ? 'Sắp có' : 'Chưa trải nghiệm'));
    const ol = el('ol'); for (const s of t.how) ol.appendChild(el('li', null, s)); d.appendChild(ol);
    if (!t.done && !t.soon && (t.quest || t.act)) { const g = el('button', 'jn-go', t.quest ? 'Dẫn đường' : 'Mở ngay'); g.type = 'button'; g.addEventListener('click', () => run(t.act, t.quest)); d.appendChild(g); }
    host.appendChild(d);
  }
  return { draw };
}
