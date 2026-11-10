// Lớp chữ của cảnh mở đầu (Phiên 91): hai dải đen điện ảnh, tên chùa mờ dần, tên địa danh đang bay ngang, nút "Bỏ qua". Logic cảnh: js/world/intro.js (có test) + js/scene/intro.js.
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** Hiện lớp chữ. Trả { label(text), end() }. onSkip() được gọi khi bấm nút / Esc / Enter / Space. */
export function showIntroUi({ onSkip = () => {} } = {}) {
  const root = el('div', 'intro'); root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Cảnh mở đầu: bay quanh chùa');
  const top = el('i', 'intro-bar top'), bot = el('i', 'intro-bar bot'), ttl = el('div', 'intro-ttl'), cap = el('div', 'intro-cap'), skip = el('button', 'intro-skip', 'Bỏ qua ›');
  ttl.append(el('small', null, 'CHÀO MỪNG ĐẾN'), el('b', null, 'DIỆU GIANG TỰ'));
  skip.type = 'button'; skip.setAttribute('aria-label', 'Bỏ qua cảnh mở đầu, vào thẳng cổng chùa');
  cap.setAttribute('aria-live', 'polite');
  root.append(top, bot, ttl, cap, skip); document.body.appendChild(root); document.body.classList.add('intro-on');
  let gone = false;
  const go = () => { if (!gone) onSkip(); };
  const onKey = (e) => { if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); go(); } };
  addEventListener('keydown', onKey, true); skip.addEventListener('click', go);
  setTimeout(() => { try { skip.focus({ preventScroll: true }); } catch (_) { /* bỏ qua */ } }, 50);
  setTimeout(() => ttl.classList.add('out'), 4200);
  return {
    label(t) { cap.classList.remove('on'); if (!t) { cap.textContent = ''; return; } setTimeout(() => { if (gone) return; cap.textContent = t; cap.classList.add('on'); }, 60); },
    end() { gone = true; removeEventListener('keydown', onKey, true); root.classList.add('bye'); document.body.classList.remove('intro-on'); setTimeout(() => root.remove(), 700); },
  };
}
