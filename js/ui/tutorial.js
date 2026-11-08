// Sổ tay hướng dẫn (nút “?” ở góc phải-trên) + gợi ý việc kế tiếp (Phiên 39). Logic và nội dung ở js/world/tutorial.js (có test).
// Mỗi bước có nút “Đưa tôi tới” (đi tới người/nơi) hoặc “Chỉ nút” (làm nút đó nhấp nháy). Mọi chữ qua textContent.
import { TOPICS, advise } from '../world/tutorial.js';
import { buildMarkers } from '../world/minimap.js';

const KEY = 'lgt.tut';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD; opts: { toast(text, ms) }. Đặt LGT.tutorial = { goTo: go, open, close, toggle, showAdvice, advice }. */
export function initTutorial(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let topic = TOPICS[0].id, hlTimer = 0, hlEl = null;

  const box = el('section', 'tu-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Hướng dẫn chơi');
  const head = el('header'), h3 = el('h3', null, 'Hướng dẫn chơi'), x = el('button', 'tu-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(h3, x);
  const adv = el('div', 'tu-adv'), advH = el('small', null, 'Việc nên làm bây giờ'), advT = el('p'), advB = el('button', 'tu-go', 'Dẫn tôi tới'); advB.type = 'button';
  adv.append(advH, advT, advB);
  const tabs = el('div', 'tu-tabs'), body = el('div', 'tu-body'), note = el('p', 'tu-note', 'Con số (giá, thời gian) là giá trị tạm của bản thử. Tính năng ghi “sắp có” chưa dùng được.');
  box.append(head, adv, tabs, body, note); hud.appendChild(box);

  const state = () => ({ sen: LGT.getSen ? LGT.getSen() : 0, la: LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0, own: LGT.land && LGT.land.state ? LGT.land.state.own : null });
  const advice = () => advise(state());

  function flash(id) {   // làm nút cần bấm nhấp nháy vài giây
    if (hlEl) hlEl.classList.remove('gd-hl'); clearTimeout(hlTimer);
    const b = hud.querySelector(`.hm-act[data-id="${id}"], .hm-mi[data-id="${id}"], .hm-ic[data-id="${id}"]`);
    if (!b) return toast('Nút này chưa hiện trên màn hình.', 2500);
    b.classList.add('gd-hl'); hlEl = b; hlTimer = setTimeout(() => { b.classList.remove('gd-hl'); hlEl = null; }, 6000);
    toast(`Nút “${(b.getAttribute('title') || id).replace(/ — sắp có$/, '')}” đang nhấp nháy.`, 3500);
  }
  function go(g) {
    if (!g) return;
    if (g.tap) { close(); return flash(g.tap); }
    const W = LGT.world; if (!W) return toast('Chưa vào chùa nên chưa dẫn đường được.', 3000);
    if (LGT.inHouse) return toast('Bạn đang ở trong nhà. Hãy đi tới cánh cửa rồi bấm “Ra ngoài”.', 3500);
    if (g.npc) { close(); return W.goTo('npc-' + g.npc) ? toast('Mình dẫn bạn đi nhé.', 2500) : toast('Chưa tìm thấy người này.', 2500); }
    if (g.place) {
      const m = buildMarkers({}).find((q) => q.id === g.place); if (!m) return;
      close(); W.walkTo(m.stand.x, m.stand.z); if (LGT.minimap) LGT.minimap.setGoal(m); toast(`Đang đi tới ${m.ten}…`, 2800);
    }
  }

  function drawAdvice() {
    const a = advice(); advT.textContent = a.text; advB.hidden = !a.go; advB.onclick = () => go(a.go);
    advB.textContent = a.go && a.go.npc ? 'Dẫn tôi tới người đó' : a.go && a.go.place ? 'Dẫn tôi tới nơi đó' : 'Chỉ cho tôi';
  }
  function drawTabs() {
    tabs.textContent = '';
    for (const t of TOPICS) { const b = el('button', 'tu-tab' + (t.id === topic ? ' on' : ''), t.ten); b.type = 'button'; b.title = t.moTa; b.setAttribute('aria-pressed', String(t.id === topic)); b.addEventListener('click', () => { topic = t.id; drawTabs(); drawBody(); }); tabs.appendChild(b); }
  }
  function drawBody() {
    const t = TOPICS.find((q) => q.id === topic) || TOPICS[0]; body.textContent = '';
    body.appendChild(el('p', 'tu-sub', t.moTa));
    const ol = el('ol');
    t.steps.forEach((s) => {
      const li = el('li', s.soon ? 'soon' : ''); li.appendChild(el('span', null, s.text));
      if (s.soon) li.appendChild(el('em', null, 'sắp có'));
      else if (s.go) { const b = el('button', 'tu-step', s.go.tap ? 'Chỉ nút' : 'Đưa tôi tới'); b.type = 'button'; b.addEventListener('click', () => go(s.go)); li.appendChild(b); }
      ol.appendChild(li);
    });
    body.appendChild(ol);
  }
  function open(id) { if (id && TOPICS.some((t) => t.id === id)) topic = id; drawAdvice(); drawTabs(); drawBody(); box.hidden = false; x.focus({ preventScroll: true }); try { localStorage.setItem(KEY, '1'); } catch (_) { /* bỏ qua */ } }
  const close = () => { box.hidden = true; };
  x.addEventListener('click', close);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  setInterval(() => { if (!box.hidden) drawAdvice(); }, 1500);   // lá/sen đổi thì lời gợi ý đổi theo

  // lần đầu: nhắc nhẹ có sổ tay (sau lời chào), không chặn gì
  let seen = false; try { seen = localStorage.getItem(KEY) === '1'; } catch (_) { /* bỏ qua */ }
  if (!seen) setTimeout(() => { if (box.hidden && !(LGT.coach && LGT.coach.active)) toast('Mới chơi? Bấm nút “?” góc phải-trên để xem cách chơi, các nút góc phải-dưới, khiêng đồ, yêu quái hằng tháng, đổi lá bồ đề, xây nhà.', 8000); }, 16000);

  LGT.tutorial = { goTo: go, open, close, toggle: () => (box.hidden ? open() : close()), showAdvice: () => open(), advice, get isOpen() { return !box.hidden; } };
  return LGT.tutorial;
}
