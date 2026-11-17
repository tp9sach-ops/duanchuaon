// Toàn màn hình + màu thanh Chrome (Phiên 213): làm giống Poki.
// 1) Thẻ <meta name="theme-color"> đổi màu theo cảnh (ban đêm/ban ngày) và đen hẳn khi toàn màn hình.
// 2) Bấm "Vào chùa" (hoặc nút ⛶) → Fullscreen API ẩn thanh địa chỉ + thanh công cụ Chrome. Trình duyệt chỉ cho vào toàn màn hình khi người dùng CHẠM, nên không thể tự bật lúc vừa tải trang.
// 3) Nút ↻ khoá xoay ngang. Phiên 218: ĐIỆN THOẠI mặc định BẬT (tự xoay ngang khi vào toàn màn hình / khi mở bằng app PWA); người chơi tắt bằng nút ↻, lựa chọn được nhớ.
//    Trình duyệt chỉ cho khoá xoay khi đang toàn màn hình (hoặc app PWA). Chưa được thì hiện gợi ý "Xoay ngang màn hình" tự mờ dần (không chặn).
// 4) iPhone/iPad (Safari không có Fullscreen API cho trang web): nút ⛶ hướng dẫn "Thêm vào MH chính" (PWA, manifest display_override fullscreen + orientation landscape).
// 5) Phiên 218: game NHÚNG trong khung (Google Sites iframe) KHÔNG thể đổi màu thanh Chrome (theme-color chỉ ăn ở trang cha) và thường bị chặn Fullscreen API (khung thiếu allow="fullscreen").
//    Khi đó nút đổi thành "↗ Toàn màn hình" và mở game trong TAB MỚI (trang gốc) — ở đó theme-color, toàn màn hình, khoá xoay ngang hoạt động đầy đủ.
// Phiên 216: nút ⛶/↻ đặt bên trái hàng ví của HUD (place()) để không đè nút nào; ẩn khi mở bảng (panel-open) / chế độ sửa nhà.
// Không đụng tới logic game: lỗi ở đây chỉ làm mất nút, game vẫn chạy.
const THEME_NIGHT = '#06070d', THEME_DAY = '#27456b', THEME_FS = '#000000';
const doc = document, root = doc.documentElement;

function themeMeta() {
  let m = doc.querySelector('meta[name="theme-color"]');
  if (!m) { m = doc.createElement('meta'); m.name = 'theme-color'; doc.head.appendChild(m); }
  return m;
}
/** Đổi màu thanh Chrome (gọi được từ chỗ khác: window.dgtSetThemeColor('#a0f5e0')). */
export function setThemeColor(c) {
  try { const m = themeMeta(); if (m.getAttribute('content') !== c) m.setAttribute('content', c); } catch (_) { /* bỏ qua */ }
}

const fsEl = () => doc.fullscreenElement || doc.webkitFullscreenElement || null;
const reqFs = root.requestFullscreen || root.webkitRequestFullscreen || null;
const exitFs = doc.exitFullscreen || doc.webkitExitFullscreen || null;
const canFs = !!reqFs;
const mq = (q) => { try { return window.matchMedia(q).matches; } catch (_) { return false; } };
const embedded = (() => { try { return window.self !== window.top; } catch (_) { return true; } })();
/** Trang cha có cho phép Fullscreen trong khung không (allow="fullscreen"). Ngoài khung luôn true. */
const fsAllowed = () => (doc.fullscreenEnabled !== undefined ? !!doc.fullscreenEnabled : doc.webkitFullscreenEnabled !== undefined ? !!doc.webkitFullscreenEnabled : true);
/** Nhúng trong khung mà không được toàn màn hình → phải mở tab mới mới có toàn màn hình + đổi màu thanh Chrome. */
const outsideOnly = () => embedded && (!canFs || !fsAllowed());
const isInstalledFs = () => mq('(display-mode: fullscreen)');
const isStandalone = () => isInstalledFs() || mq('(display-mode: standalone)') || navigator.standalone === true;
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
/** Điện thoại: cảm ứng + cạnh ngắn màn hình ≤ 600 (máy tính bảng ≥ 600 không tính). */
const isPhone = () => { try { return mq('(pointer: coarse)') && Math.min(screen.width, screen.height) <= 600; } catch (_) { return false; } };
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* riêng tư */ } },
  sget(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* riêng tư */ } },
};
/** Phiên 218: chưa chọn gì thì điện thoại mặc định khoá xoay ngang; đã bấm ↻ thì theo lựa chọn ('1'/'0'). */
const wantLandscape = () => { const v = store.get('dgt.lockLand'); return v === null ? isPhone() : v === '1'; };

async function lockLandscape() {
  try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (_) { /* chỉ chạy được khi đang toàn màn hình/PWA, một số máy không cho */ }
}
function unlockOrientation() { try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch (_) { /* bỏ qua */ } }

/** Mở game ở tab mới (trang gốc, không còn trong khung). Trả false nếu bị chặn cửa sổ bật lên. PHẢI gọi trong sự kiện bấm. */
function openOutside() {
  try {
    const w = window.open(location.href.split('#')[0], '_blank');
    if (!w) return false;
    try { w.opener = null; } catch (_) { /* bỏ qua */ }
    return true;
  } catch (_) { return false; }
}

/** Vào toàn màn hình. PHẢI gọi trực tiếp trong sự kiện chạm/bấm của người dùng. */
export async function enterFullscreen() {
  if (fsEl()) return true;
  if (!canFs || !fsAllowed()) return false;
  store.sset('dgt.fsDeclined', '0');
  try { await reqFs.call(root, { navigationUI: 'hide' }); } catch (_) { return false; }
  if (wantLandscape()) lockLandscape();
  return true;
}
export async function leaveFullscreen() {
  store.sset('dgt.fsDeclined', '1');
  unlockOrientation();
  if (fsEl() && exitFs) { try { await exitFs.call(doc); } catch (_) { /* bỏ qua */ } }
}

function injectCss() {
  try {
    if (doc.querySelector('link[data-fscss]')) return;
    const l = doc.createElement('link'); l.rel = 'stylesheet'; l.dataset.fscss = '1';
    l.href = new URL('../../css/fullscreen.css', import.meta.url).href; doc.head.appendChild(l);
  } catch (_) { /* không để lỗi nạp CSS làm hỏng game */ }
}

function tip(text) {
  try {
    const L = window.LGT; if (L && typeof L.toast === 'function') { L.toast(text, 6000); return; }
    let t = doc.getElementById('dgt-fs-tip');
    if (!t) { t = doc.createElement('div'); t.id = 'dgt-fs-tip'; t.setAttribute('role', 'status'); doc.body.appendChild(t); }
    t.textContent = text; t.classList.add('on');
    clearTimeout(tip._t); tip._t = setTimeout(() => t.classList.remove('on'), 6000);
  } catch (_) { /* bỏ qua */ }
}

/** Gợi ý "Xoay ngang màn hình" cho điện thoại đang cầm dọc: tự mờ dần sau vài giây, không chặn thao tác, tự ẩn khi đã xoay ngang (CSS). */
function initRotateHint() {
  try {
    if (!isPhone() || store.get('dgt.rotTipOff') === '1' || doc.getElementById('dgt-rot-tip')) return;
    const t = doc.createElement('div'); t.id = 'dgt-rot-tip'; t.setAttribute('role', 'status');
    t.innerHTML = '<span>↻ Xoay ngang màn hình để chơi đẹp hơn</span><button type="button" aria-label="Đóng gợi ý xoay ngang">✕</button>';
    t.querySelector('button').addEventListener('click', () => { store.set('dgt.rotTipOff', '1'); t.remove(); });
    doc.body.appendChild(t);
  } catch (_) { /* bỏ qua */ }
}

export function initFullscreen() {
  injectCss();
  window.dgtSetThemeColor = setThemeColor;
  setThemeColor(THEME_NIGHT);

  // Màu thanh Chrome: đen khi toàn màn hình; còn lại theo ngày/đêm của cảnh (LGT.night do scene cập nhật).
  const paintTheme = () => {
    if (fsEl() || isInstalledFs()) { setThemeColor(THEME_FS); return; }
    const L = window.LGT; setThemeColor(L && typeof L.night === 'number' && L.night <= 0.5 ? THEME_DAY : THEME_NIGHT);
  };
  paintTheme();

  // Nút nổi (mặc định góc phải trên; place() dời sang trái hàng ví của HUD). Đã ở chế độ app toàn màn hình (PWA) thì không cần.
  const box = doc.createElement('div'); box.id = 'dgt-fs'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Toàn màn hình');
  box.innerHTML = '<button type="button" id="dgt-fs-btn" aria-label="Toàn màn hình" title="Toàn màn hình">⛶</button>' +
    '<button type="button" id="dgt-fs-rot" aria-label="Khoá xoay ngang" title="Khoá xoay ngang" aria-pressed="false" hidden>↻</button>';
  const btn = box.querySelector('#dgt-fs-btn'), rot = box.querySelector('#dgt-fs-rot');
  if (!isInstalledFs()) doc.body.appendChild(box);
  const canRotate = !!(screen.orientation && screen.orientation.lock);

  // Phiên 216: đặt cụm nút bên trái hàng ví (hạt sen/ngọc) của HUD để không đè nút nào, ở cả điện thoại dọc lẫn ngang.
  let lastPos = '';
  const place = () => {
    try {
      if (!box.isConnected) return;
      let r = null;
      for (const sel of ['.hm-wallet', '.hm-icons', '.hm-tr']) {
        const n = doc.querySelector(sel); if (!n) continue;
        const b = n.getBoundingClientRect(); if (b.width > 4 && b.height > 4) { r = b; break; }
      }
      let pos = '';
      if (r) {
        const cw = root.clientWidth || window.innerWidth, bw = box.offsetWidth || 40, bh = box.offsetHeight || 40;
        let right = Math.round(cw - r.left + 8);
        if (right + bw > cw - 4) right = Math.max(4, cw - bw - 4);
        const top = Math.max(4, Math.round(r.top + (r.height - bh) / 2));
        pos = right + 'px|' + top + 'px';
      }
      if (pos === lastPos) return;
      lastPos = pos;
      if (!pos) { box.style.removeProperty('--fs-r'); box.style.removeProperty('--fs-t'); return; }
      const p = pos.split('|'); box.style.setProperty('--fs-r', p[0]); box.style.setProperty('--fs-t', p[1]);
    } catch (_) { /* bỏ qua: nút vẫn ở góc mặc định */ }
  };
  const placeSoon = () => { try { requestAnimationFrame(place); } catch (_) { place(); } };
  setInterval(() => { paintTheme(); place(); }, 1000);   // HUD dựng muộn / số hạt sen đổi độ rộng → đo lại mỗi giây (rẻ)
  for (const ev of ['resize', 'orientationchange', 'lgt:viewport']) window.addEventListener(ev, placeSoon);

  const paintBtns = () => {
    const on = !!fsEl(), out = outsideOnly();
    box.classList.toggle('is-out', out);
    const label = out ? 'Mở game toàn màn hình trong tab mới' : on ? 'Thoát toàn màn hình' : 'Toàn màn hình';
    btn.textContent = out ? '↗ Toàn màn hình' : on ? '✕' : '⛶'; btn.setAttribute('aria-label', label); btn.title = label;
    box.classList.toggle('is-fs', on);
    rot.hidden = !(on && canRotate && !out);
    const lk = wantLandscape(); rot.setAttribute('aria-pressed', String(lk)); rot.classList.toggle('on', lk);
  };
  btn.addEventListener('click', async () => {
    if (fsEl()) { await leaveFullscreen(); return; }
    if (outsideOnly()) {   // Phiên 218: trong khung Google Sites → mở tab mới để có toàn màn hình + đổi màu thanh Chrome
      if (openOutside()) tip('Đã mở game ở tab mới. Ở đó bấm "Vào chùa" để toàn màn hình và xoay ngang.');
      else tip('Khung nhúng chặn mở tab mới. Hãy mở trực tiếp: ' + location.href.split('#')[0]);
      return;
    }
    if (canFs) { const ok = await enterFullscreen(); if (!ok) tip('Trình duyệt không cho bật toàn màn hình ở đây. Thử mở game ở tab riêng (không trong khung).'); return; }
    if (isIOS() && !isStandalone()) tip('iPhone/iPad: bấm nút Chia sẻ → "Thêm vào MH chính", rồi mở game từ biểu tượng để chơi toàn màn hình.');
    else tip('Trình duyệt này không hỗ trợ toàn màn hình. Thử Chrome/Edge trên Android hoặc "Cài đặt ứng dụng".');
  });
  rot.addEventListener('click', () => {
    const next = !wantLandscape(); store.set('dgt.lockLand', next ? '1' : '0');
    if (next) lockLandscape(); else unlockOrientation();
    paintBtns(); placeSoon();
  });
  const onFsChange = () => {
    const on = !!fsEl();
    if (!on) { unlockOrientation(); store.sset('dgt.fsDeclined', '1'); }   // thoát bằng cử chỉ hệ thống/nút Back: phiên này không tự bật lại
    else if (wantLandscape()) lockLandscape();
    paintBtns(); paintTheme(); placeSoon();
    try { window.dispatchEvent(new Event('resize')); } catch (_) { /* viewport.js tự đo lại */ }
    setTimeout(place, 350);   // thanh Chrome ẩn/hiện xong khung nhìn mới ổn định
  };
  doc.addEventListener('fullscreenchange', onFsChange); doc.addEventListener('webkitfullscreenchange', onFsChange);
  paintBtns(); placeSoon();

  // Phiên 218: mở bằng app PWA (đã ở chế độ app) thì khoá xoay ngang ngay (manifest cũng đã khai orientation landscape); điện thoại cầm dọc thì hiện gợi ý xoay.
  if (isStandalone() && wantLandscape()) lockLandscape();
  initRotateHint();

  // Tự vào toàn màn hình ngay khi bấm "Vào chùa" (đó là một lần chạm của người dùng nên trình duyệt cho phép; enterFullscreen cũng khoá xoay ngang cho điện thoại).
  // Phiên này đã thoát toàn màn hình thủ công thì không ép lại. Trong khung bị chặn toàn màn hình thì không tự mở tab mới (người chơi bấm nút ↗).
  doc.addEventListener('click', (e) => {
    const t = e.target; if (!t || !t.closest || !t.closest('#en-go')) return;
    if (store.sget('dgt.fsDeclined') === '1' || fsEl() || isStandalone() || outsideOnly()) return;
    enterFullscreen();
  }, true);

  return { enter: enterFullscreen, leave: leaveFullscreen, setThemeColor, place };
}
