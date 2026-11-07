// Dẫn đường nhiệm vụ (Phiên 18): bấm "Dẫn đường" ở một nhiệm vụ → nhân vật tự đi tới chỗ cần làm, thẻ nhỏ hiện từng bước + nút cần bấm nhấp nháy.
// Logic ở js/world/questGuide.js (có test). Dùng LGT.world (walkTo / goTo) và LGT.quests.prog (tiến độ nhiệm vụ). Mọi chữ qua textContent.
import { planGuide } from '../world/questGuide.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const MARK = { done: '✓', now: '▶', todo: '○' };

/** hud: phần tử HUD; opts: { toast(text, ms) }. Trả { start(questId), stop(), get active }. Đặt LGT.guide. */
export function initGuide(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let qid = null, idx = 0, lastKey = '', hlEl = null, plan = null;

  const card = el('section', 'gd-card'); card.hidden = true; card.setAttribute('role', 'status'); card.setAttribute('aria-live', 'polite');
  const head = el('header'), title = el('b', 'gd-t'), x = el('button', 'gd-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Dừng dẫn đường');
  head.append(title, x);
  const prog = el('p', 'gd-prog'), steps = el('ol', 'gd-steps');
  const foot = el('div', 'gd-foot'), dist = el('span', 'gd-dist'), go = el('button', 'gd-go', 'Dẫn tiếp'); go.type = 'button';
  foot.append(dist, go); card.append(head, prog, steps, foot); hud.appendChild(card);

  const setHl = (id) => {
    if (hlEl) { hlEl.classList.remove('gd-hl'); hlEl = null; }
    if (!id) return;
    const b = hud.querySelector(`.hm-act[data-id="${id}"], .hm-ic[data-id="${id}"], .st-water[data-id="${id}"]`); if (b) { b.classList.add('gd-hl'); hlEl = b; }
  };
  function walk(t) {
    const W = LGT.world; if (!W || !t || LGT.panelOpen) return;
    if (t.kind === 'npc') W.goTo(t.spot); else W.walkTo(t.x, t.z);
  }
  function stop() { qid = null; plan = null; lastKey = ''; idx = 0; card.hidden = true; setHl(null); }
  function render(p) {
    title.textContent = p.ten;
    prog.textContent = p.need > 1 ? `Tiến độ: ${p.cur}/${p.need}` : '';
    prog.hidden = !(p.need > 1);
    steps.textContent = '';
    p.steps.forEach((s) => { const li = el('li', 'gd-' + s.state), m = el('i', null, MARK[s.state]), t = el('span', null, s.text); li.append(m, t); steps.appendChild(li); });
    const moving = !!(LGT.world && LGT.world.nav && LGT.world.nav.active);
    dist.textContent = p.target ? (moving ? 'Đang đi… ' : '') + `Còn khoảng ${Math.max(1, Math.round(p.dist))} m` : (p.tap ? 'Làm theo bước đang sáng.' : '');
    go.hidden = !p.target || moving;
    setHl(p.tap);
  }
  function tick() {
    if (!qid) return;
    const W = LGT.world, pr = LGT.quests && LGT.quests.prog; if (!W || !W.pos || !pr) return;
    plan = planGuide(qid, pr, W.pos, { idx, loc: LGT.loc, now: Date.now(), story: LGT.story && LGT.story.state });
    if (!plan) return stop();
    if (plan.done) { stop(); return; }
    idx = plan.idx; render(plan);
    if (plan.key !== lastKey) { lastKey = plan.key; walk(plan.target); }   // đổi bước hoặc đổi đích thì tự đi tiếp; người chơi tự đi chỗ khác thì chỉ hiện nút "Dẫn tiếp"
  }
  function start(id) {
    if (!LGT.world || !LGT.quests) return toast('Chưa vào chùa nên chưa dẫn đường được.', 3000);
    qid = id; idx = 0; lastKey = ''; tick();
    if (!qid) return toast('Nhiệm vụ này đã xong rồi.', 3000);
    card.hidden = false; toast('Mình dẫn bạn đi nhé. Bấm × nếu muốn dừng.', 3500);
  }
  x.addEventListener('click', stop);
  go.addEventListener('click', () => { if (plan && plan.target) walk(plan.target); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && qid && !card.hidden && !LGT.panelOpen && document.activeElement === x) stop(); });
  setInterval(tick, 700);
  LGT.guide = { start, stop, get active() { return qid; }, get target() { return qid && plan && plan.target ? plan.target : null; } };   // Phiên 39: bản đồ nhỏ vẽ dấu đích đang dẫn tới
  return LGT.guide;
}
