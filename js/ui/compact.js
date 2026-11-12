// Giao diện gọn: sửa HUD bị che/tràn khi mở trong khung hoặc màn hình thấp, cho ẩn/hiện nút không cần thiết, thêm nút camera tiện cho ngón cái.
// Logic thuần ở compactLogic.js (có test); file này chỉ nối với DOM. CSS ở css/compact.css (tự chèn vào cuối <head> để nạp SAU CÙNG).
// Gọi sau initHud(): HUD, menu, bản đồ nhỏ, cụm nút thao tác đều đã có trong DOM.
import { GROUPS, IDS, AUTO_ORDER, STORE_KEY, PRESETS, parseState, serializeState, setShown, matchPreset, toggleFocus, presetFor, makeState, CAM_KINDS, camMove, dockScale } from './compactLogic.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const svg = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  focus: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  cfg: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
};

/** Trả { state, preset, toggle, cam, refresh } và đặt LGT.compact; trả null nếu chưa có HUD. */
export function initCompact() {
  const hud = document.getElementById('hud'); if (!hud) return null;
  const LGT = window.LGT || (window.LGT = {});
  const body = document.body, root = document.documentElement;

  // CSS nạp sau cùng để thắng mọi luật cũ (responsive.css cũng là "nạp sau cùng" nên file này phải đứng sau nó)
  if (!document.querySelector('link[data-compact]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.compact = '1';
    l.href = new URL('../../css/compact.css', import.meta.url).href; document.head.appendChild(l);
  }

  const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  let framed = false; try { framed = window.self !== window.top; } catch (_) { framed = true; }   // bị nhúng trong khung (iframe, ô xem trước): coi như khung nhỏ
  root.dataset.framed = String(framed);
  const env = () => ({ coarse, framed, w: window.innerWidth, h: window.innerHeight });
  const defaultHide = () => { const p = presetFor(env()); return PRESETS[p === 'min' ? 'gon' : p].hide; };

  let raw = null; try { raw = localStorage.getItem(STORE_KEY); } catch (_) { /* riêng tư */ }
  let st = parseState(raw, presetFor(env()));
  const save = () => { try { localStorage.setItem(STORE_KEY, serializeState(st)); } catch (_) { /* bỏ qua */ } };

  // ---------------------------------------------------------------- thanh công cụ nhỏ (góc trái-trên) + bảng tùy chỉnh
  const tools = el('div', 'ui-tools'); tools.setAttribute('role', 'toolbar'); tools.setAttribute('aria-label', 'Giao diện');
  const mk = (id, label, icon) => { const b = el('button', 'hm-ic ui-b'); b.type = 'button'; b.id = id; b.title = label; b.setAttribute('aria-label', label); b.innerHTML = svg(icon); return b; };
  const bMenu = mk('ui-menu', 'Mở hoặc đóng menu chính', ICON.menu), bFocus = mk('ui-focus', 'Ẩn hết nút phụ / hiện lại', ICON.focus), bCfg = mk('ui-cfg', 'Tùy chỉnh giao diện và camera', ICON.cfg);
  bCfg.setAttribute('aria-haspopup', 'dialog'); bCfg.setAttribute('aria-expanded', 'false');
  tools.append(bMenu, bFocus, bCfg);
  const tl = hud.querySelector('.hud-tl') || hud; tl.insertBefore(tools, tl.firstChild);

  const pop = el('section', 'ui-pop'); pop.id = 'ui-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Tùy chỉnh giao diện');
  const head = el('header'), h3 = el('h3', null, 'Giao diện'), x = el('button', 'ui-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(h3, x);
  const h4 = (t) => el('h4', null, t);
  const presetRow = el('div', 'ui-row'), opts = el('div', 'ui-opts'), camRow = el('div', 'ui-row'), foot = el('div', 'ui-row ui-foot');
  const presetBtns = {};
  for (const k of Object.keys(PRESETS)) { const b = el('button', 'ui-chip', PRESETS[k].ten); b.type = 'button'; b.dataset.preset = k; presetBtns[k] = b; presetRow.appendChild(b); }
  const mkOpt = (key, ten) => { const b = el('button', 'ui-opt'); b.type = 'button'; b.setAttribute('role', 'switch'); b.dataset.key = key; b.append(el('i'), el('span', null, ten)); return b; };
  const optBtns = {};
  for (const g of GROUPS) { optBtns[g.id] = mkOpt(g.id, g.ten); opts.appendChild(optBtns[g.id]); }
  const acBtn = mkOpt('_ac', 'Tự đóng menu sau khi chọn'); opts.appendChild(acBtn);
  for (const k of Object.keys(CAM_KINDS)) { const b = el('button', 'ui-chip', (k === 'reset' ? '⟲ ' : '') + CAM_KINDS[k].ten); b.type = 'button'; b.dataset.cam = k; camRow.appendChild(b); }
  const bDef = el('button', 'ui-chip', 'Về mặc định cho thiết bị này'); bDef.type = 'button';
  foot.appendChild(bDef);
  pop.append(head, h4('Kiểu hiển thị'), presetRow, h4('Ẩn hoặc hiện từng nhóm nút'), opts, h4('Camera'), camRow, foot);
  hud.appendChild(pop);

  // ---------------------------------------------------------------- áp trạng thái
  function paint() {
    for (const id of IDS) optBtns[id].setAttribute('aria-checked', String(!st.hide.includes(id)));   // bật = đang HIỆN
    acBtn.setAttribute('aria-checked', String(!!st.ac));
    const cur = matchPreset(st); for (const k in presetBtns) presetBtns[k].classList.toggle('on', k === cur);
    bMenu.setAttribute('aria-pressed', String(!st.hide.includes('bar')));
    bFocus.setAttribute('aria-pressed', String(cur === 'min'));
  }
  function apply() { for (const id of IDS) body.classList.toggle('ui-h-' + id, st.hide.includes(id)); paint(); fit(); }
  function commit(next) { st = { ...next, saved: true }; save(); apply(); }

  // ---------------------------------------------------------------- tự co khi hết chỗ
  /** Cột trái-trên chạm joystick/nút camera → tự ẩn TẠM (không lưu) lần lượt bản đồ nhỏ, giờ/online, hồ sơ, nút chánh điện. */
  function autoHide() {
    for (const id of AUTO_ORDER) body.classList.remove('ui-a-' + id);
    const joy = document.getElementById('joy'), jr = joy ? joy.getBoundingClientRect() : null; if (!jr || !jr.height) return;   // máy tính không có joystick
    const col = hud.querySelector('.hud-tl'); if (!col) return;
    let lim = jr.top; const z = hud.querySelector('.hud-zoom'), zr = z ? z.getBoundingClientRect() : null;
    if (coarse && zr && zr.height) lim = Math.min(lim, zr.top);
    for (const id of AUTO_ORDER) { if (col.getBoundingClientRect().bottom <= lim - 6) break; body.classList.add('ui-a-' + id); }
  }
  /** Cụm nút thao tác góc phải-dưới co lại (đáy giữ nguyên) để không đè lên menu dọc / cụm phải-trên. */
  function fitDock() {
    const dk = hud.querySelector('.dk'); if (!dk || dk.hidden) return;
    const r = dk.getBoundingClientRect(); if (!r.width) return;
    const left = r.right - dk.offsetWidth; let limit = 0;
    for (const sel of ['.hm-bar', '.hm-tr', '.yq-hud']) {
      const n = hud.querySelector(sel); if (!n) continue; const b = n.getBoundingClientRect();
      if (b.width && b.height && b.right > left && b.left < r.right && b.bottom < r.bottom) limit = Math.max(limit, b.bottom + 6);
    }
    dk.style.setProperty('--dk-fit', String(dockScale({ bottom: r.bottom, limitTop: limit, height: dk.offsetHeight })));
  }
  function fit() { if (hud.hidden) return; try { autoHide(); fitDock(); } catch (_) { /* không để lỗi đo đạc làm hỏng game */ } }

  // ---------------------------------------------------------------- camera
  /** world.js đọc camera từ sự kiện kéo trên canvas; gửi một lần kéo "ảo" (không đụng world.js). Dưới ngưỡng 8px world.js coi là bấm-để-đi nên bỏ qua. */
  function dragBy(dx, dy) {
    const cv = document.getElementById('gl'); if (!cv || typeof PointerEvent !== 'function' || Math.abs(dx) + Math.abs(dy) <= 9) return false;
    const id = 90117, cx = Math.round(window.innerWidth / 2), cy = Math.round(window.innerHeight / 2);
    const ev = (type, px, py) => new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: true, button: 0, clientX: px, clientY: py, bubbles: true, cancelable: true });
    cv.dispatchEvent(ev('pointerdown', cx, cy)); cv.dispatchEvent(ev('pointermove', cx + dx, cy + dy)); cv.dispatchEvent(ev('pointerup', cx + dx, cy + dy));
    return true;
  }
  function cam(kind) {
    const W = LGT.world; if (!W || !W.camera || LGT.panelOpen) return false;
    const m = camMove(kind, W.camera, W.facing); if (!m) return false;
    dragBy(m.dx, m.dy); if (Math.abs(m.dz) > 0.5) W.zoom(m.dz);
    return true;
  }
  const zoomBox = hud.querySelector('.hud-zoom');
  if (zoomBox && !zoomBox.querySelector('#zreset')) {
    const b = el('button', null, '⟲'); b.type = 'button'; b.id = 'zreset'; b.title = 'Đưa camera ra sau lưng nhân vật'; b.setAttribute('aria-label', 'Đưa camera ra sau lưng nhân vật');
    b.addEventListener('click', () => cam('reset')); zoomBox.appendChild(b);
  }

  // ---------------------------------------------------------------- sự kiện
  const closePop = () => { pop.hidden = true; bCfg.setAttribute('aria-expanded', 'false'); };
  function openPop() {
    const r = tools.getBoundingClientRect(), top = Math.round(r.bottom + 8);
    pop.style.top = top + 'px'; pop.style.maxHeight = `calc(var(--vvh, 100vh) - ${top + 10}px)`;
    pop.hidden = false; bCfg.setAttribute('aria-expanded', 'true'); paint();
  }
  bCfg.addEventListener('click', () => (pop.hidden ? openPop() : closePop()));
  x.addEventListener('click', closePop);
  bMenu.addEventListener('click', () => commit(setShown(st, 'bar', st.hide.includes('bar'))));
  bFocus.addEventListener('click', () => commit(toggleFocus(st, defaultHide())));
  presetRow.addEventListener('click', (e) => { const b = e.target.closest('[data-preset]'); if (b) commit(makeState(b.dataset.preset)); });
  opts.addEventListener('click', (e) => {
    const b = e.target.closest('[data-key]'); if (!b) return;
    if (b.dataset.key === '_ac') commit({ ...st, ac: !st.ac }); else commit(setShown(st, b.dataset.key, st.hide.includes(b.dataset.key)));
  });
  camRow.addEventListener('click', (e) => { const b = e.target.closest('[data-cam]'); if (b) cam(b.dataset.cam); });
  bDef.addEventListener('click', () => { try { localStorage.removeItem(STORE_KEY); } catch (_) { /* bỏ qua */ } st = makeState(presetFor(env())); apply(); });
  // Menu chính mở từ nút ☰ thì tự đóng sau khi chọn một mục (chỉ ẩn tạm, không lưu) để trả lại chỗ chơi
  hud.addEventListener('click', (e) => { if (st.ac && !st.hide.includes('bar') && e.target.closest('.hm-bar .hm-mi')) { st = setShown(st, 'bar', false); apply(); } });
  document.addEventListener('pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target) && !tools.contains(e.target)) closePop(); }, true);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) closePop(); });
  for (const ev of ['resize', 'orientationchange', 'lgt:viewport']) addEventListener(ev, fit);
  setInterval(() => { if (!pop.hidden && body.classList.contains('panel-open')) closePop(); fit(); }, 500);

  apply();
  LGT.compact = { get state() { return st; }, preset: (name) => commit(makeState(name)), toggle: (id) => commit(setShown(st, id, st.hide.includes(id))), cam, refresh: fit };
  return LGT.compact;
}
