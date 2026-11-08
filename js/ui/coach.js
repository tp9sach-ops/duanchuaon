// Màn hướng dẫn lần đầu 3 bước có mũi tên (Phiên 70). Logic ở js/world/coach.js (có test). Chỉ người mới thấy; không chặn thao tác; bỏ qua được.
// Mọi chữ qua textContent. Nút được chỉ sẽ nhấp nháy bằng lớp `gd-hl` (css/guide.css) trừ phần tử #joy (cố định theo màn hình, không đổi position).
import { STEPS, COACH_KEY, loadCoach, saveCoach, advance, isVeteran, shouldStart, arrowPlan } from '../world/coach.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };

/** hud: phần tử HUD. Đặt LGT.coach = { skip, get active }. */
export function initCoach(hud) {
  const LGT = window.LGT || (window.LGT = {});
  let st = loadCoach(read(COACH_KEY));
  let visibleSince = 0, shown = false, hlEl = null, timer = 0;
  const save = () => { try { localStorage.setItem(COACH_KEY, saveCoach(st)); } catch (_) { /* chế độ riêng tư */ } };

  const card = el('section', 'co-card'); card.hidden = true; card.setAttribute('role', 'region'); card.setAttribute('aria-label', 'Hướng dẫn lần đầu');
  const head = el('header'), count = el('span', 'co-n'), title = el('b', 'co-t'); head.append(count, title);
  const body = el('p', 'co-tx');
  const foot = el('div', 'co-ft'), skip = el('button', 'co-skip', 'Bỏ qua'), next = el('button', 'co-next', 'Tiếp');
  skip.type = 'button'; next.type = 'button'; foot.append(skip, next);
  card.append(head, body, foot);
  const arrow = el('div', 'co-arrow'); arrow.setAttribute('aria-hidden', 'true'); arrow.hidden = true;
  hud.append(arrow, card);

  const targetOf = (step) => {
    for (const sel of step.targets) {
      const e = document.querySelector(sel); if (!e) continue;
      const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0) return { e, r, sel };
    }
    return null;
  };
  const setHl = (e, sel) => {
    if (hlEl && hlEl !== e) { hlEl.classList.remove('gd-hl'); hlEl = null; }
    if (e && !sel.startsWith('#') && hlEl !== e) { e.classList.add('gd-hl'); hlEl = e; }
  };

  function layout() {
    const step = STEPS[st.step]; if (!step) return;
    const t = targetOf(step);
    setHl(t && t.e, t ? t.sel : '');
    let target = null;
    if (t) target = { x: t.r.left + t.r.width / 2, y: t.r.top + t.r.height / 2, w: t.r.width, h: t.r.height };
    else if (step.fallback === 'ground') target = { x: innerWidth / 2, y: innerHeight * 0.74, w: 0, h: 0 };
    const c = card.getBoundingClientRect();
    const plan = target ? arrowPlan({ x: c.left + c.width / 2, y: c.top + c.height / 2, w: c.width, h: c.height }, target) : null;
    if (!plan) { arrow.hidden = true; return; }
    arrow.hidden = false; arrow.style.width = Math.round(plan.len) + 'px';
    arrow.style.transform = `translate(${Math.round(c.left + c.width / 2)}px,${Math.round(c.top + c.height / 2)}px) rotate(${plan.deg.toFixed(1)}deg) translateX(${Math.round(plan.start)}px)`;
  }
  function draw() {
    const step = STEPS[st.step];
    count.textContent = `${st.step + 1}/${STEPS.length}`; title.textContent = step.title; body.textContent = step.text;
    next.textContent = st.step === STEPS.length - 1 ? 'Xong' : 'Tiếp';
    card.hidden = false; layout();
  }
  function finish() { card.hidden = true; arrow.hidden = true; setHl(null, ''); shown = false; clearInterval(timer); timer = 0; save(); }
  function go(action) { st = advance(st, action); save(); if (st.done) finish(); else draw(); }
  skip.addEventListener('click', () => go('skip'));
  next.addEventListener('click', () => go('next'));

  function tick() {
    if (st.done) { finish(); return; }
    const now = Date.now(), vis = !hud.hidden;
    if (!vis) { visibleSince = 0; if (shown) { card.hidden = true; arrow.hidden = true; } return; }
    if (!visibleSince) visibleSince = now;
    const panelOpen = !!LGT.panelOpen || document.body.classList.contains('panel-open');
    if (!shown) {
      const veteran = isVeteran({ tut: read('lgt.tut'), story: read('lgt.story'), gdUsed: read('lgt.gdUsed') });
      if (veteran) { st = { done: true, step: STEPS.length }; finish(); return; }
      if (!shouldStart({ done: st.done, veteran, hudVisible: vis, panelOpen, sinceVisibleMs: now - visibleSince })) return;
      shown = true; draw(); return;
    }
    card.hidden = panelOpen; if (panelOpen) arrow.hidden = true; else layout();
  }
  timer = setInterval(tick, 500);
  addEventListener('resize', () => { if (shown && !card.hidden) layout(); });

  LGT.coach = { skip: () => go('skip'), get active() { return shown && !st.done; } };
  return LGT.coach;
}
