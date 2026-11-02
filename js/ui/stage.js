// Sân khấu: nội dung các chương nằm trong bảng nổi, chỉ mở khi người dùng bấm điểm sáng trong cảnh hoặc menu.
// Mở bảng → camera bay tới trạm của chương; đóng (nút ×, phím Esc, bấm nền cảnh) → camera về toàn cảnh.
export function initStage(rail, fg) {
  const secs = [...document.querySelectorAll('section.sec[id]')];
  const byId = Object.fromEntries(secs.map((s) => [s.id, s]));
  const camOf = (id) => (id === 'hero' ? 0 : +(byId[id]?.dataset.cam || 0));
  const links = [...document.querySelectorAll('.nav-link')];
  let current = null, lastFocus = null;
  const lgt = () => window.LGT;

  secs.forEach((s) => {
    s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'false'); s.setAttribute('aria-hidden', 'true');
    const head = s.querySelector('.sec-head h2, h2');
    if (head) { head.id = head.id || s.id + '-ttl'; s.setAttribute('aria-labelledby', head.id); }
    const x = document.createElement('button');
    x.type = 'button'; x.className = 'pn-close'; x.setAttribute('aria-label', 'Đóng bảng'); x.innerHTML = '<span aria-hidden="true">×</span>';
    x.addEventListener('click', () => close());
    s.prepend(x);
  });

  function mark(id) { links.forEach((a) => a.classList.toggle('on', !!id && a.getAttribute('href') === '#' + id)); }

  function open(id, opts = {}) {
    const s = byId[id];
    if (!s) return close();
    if (current && current !== id) { byId[current].classList.remove('open'); byId[current].setAttribute('aria-hidden', 'true'); }
    if (!current) lastFocus = document.activeElement;
    current = id;
    s.classList.add('open'); s.removeAttribute('aria-hidden'); s.scrollTop = 0;
    document.body.classList.add('panel-open'); document.body.dataset.panel = id;
    if (lgt()) lgt().panelOpen = true;
    rail.goTo?.(camOf(id));
    fg?.set(s.dataset.fgKey || null);
    mark(id);
    if (opts.hash !== false) { try { history.replaceState(null, '', '#' + id); } catch (_) { /* bỏ qua */ } }
    setTimeout(() => s.querySelector('.pn-close')?.focus({ preventScroll: true }), 60);
  }

  function close() {
    if (current) { byId[current].classList.remove('open'); byId[current].setAttribute('aria-hidden', 'true'); }
    const had = current; current = null;
    document.body.classList.remove('panel-open'); delete document.body.dataset.panel;
    if (lgt()) lgt().panelOpen = false;
    rail.goTo?.(0); fg?.set(null); mark(null);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* bỏ qua */ }
    if (had && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /** Đi tới chương `id`: ở chế độ đi bộ thì nhân vật đi tới chỗ của chương rồi mới mở bảng; không có chế độ đi bộ thì mở luôn. */
  function go(id) {
    const walk = lgt() && lgt().world && lgt().world.goTo;
    if (!walk || !byId[id]) return open(id);
    if (current) close();
    if (!walk(id)) open(id);
  }

  // Mọi liên kết #chương (menu, nút, chân trang) mở bảng thay vì cuộn
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (byId[id]) { e.preventDefault(); go(id); }
    else if (id === 'hero') { e.preventDefault(); close(); }
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) close(); });
  // Bấm vào khoảng trống của cảnh (không phải bảng/nút) khi bảng đang mở → đóng
  document.getElementById('gl')?.addEventListener('pointerdown', () => { if (current) close(); });

  const h = location.hash.slice(1);
  if (byId[h]) open(h, { hash: false });
  return { open, go, close, get current() { return current; } };
}
