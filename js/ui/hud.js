// Màn vào cửa (nhập tên, chọn áo, chọn kiểu đầu) + HUD trái-trên (chip người chơi, tên chùa, Vào chánh điện/Ra sân, đang online) + nút +/−.
// Bố cục theo ảnh mẫu (PROMPT.md mục 9.4); chỉ bắt chước bố cục, mọi hình/chữ do mình tự làm. Logic ở hudLogic.js (có test).
import { cleanProfile, loadProfile, saveProfile, initialOf, robeCss, insideHall, COURTYARD_POINT, HALL_POINT, PLAYER_COLORS, clockLabel } from './hudLogic.js';
import { HAIR_STYLES } from '../world/avatarLogic.js';
import { initHudMenu } from './hudMenu.js';
import { initAccountGate, initAccountBanner } from './accountGate.js';
import { showIntroUi } from './introUi.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Gọi sau khi cảnh dựng xong. Trả { profile, open() } hoặc null nếu không có chế độ đi bộ (fallback .no-webgl giữ giao diện cũ). */
export function initHud() {
  const LGT = window.LGT, W = LGT && LGT.world;
  if (!W) return null;
  document.body.classList.add('world-mode');
  let profile = loadProfile(localStorage);

  // ---------------- HUD
  const hud = el('div', 'hud'); hud.id = 'hud'; hud.hidden = true;
  hud.innerHTML = `
    <div class="hud-tl">
      <div class="chip-me"><span class="me-av" id="me-av"></span>
        <span class="me-tx"><b id="me-name"></b><i>Hạt sen · bậc 1</i><span class="me-bar"><u style="width:0%"></u></span></span>
        <span class="me-lv" title="Cấp">1</span></div>
      <div class="temple-name">Diệu Giang Tự</div>
      <button type="button" class="hud-btn gold" id="btn-hall"><span class="ic" aria-hidden="true">⛩</span><span id="btn-hall-tx">Vào chánh điện</span></button>
      <button type="button" class="hud-btn soon" id="btn-work" disabled aria-disabled="true" title="Sắp có"><span class="ic" aria-hidden="true">✦</span>Công quả <em>sắp có</em></button>
      <div class="online"><i></i><span id="online-tx">1 đang online</span></div>
      <div class="game-clock" id="game-clock" role="timer" aria-live="off" title="Giờ trong game (24 phút thật = 1 ngày)"><span aria-hidden="true">☀</span><b id="clock-tx"></b></div>
    </div>
    <div class="hud-zoom"><button type="button" id="zin" aria-label="Phóng to">+</button><button type="button" id="zout" aria-label="Thu nhỏ">−</button></div>`;
  document.body.appendChild(hud);
  let menu = null;
  try { menu = initHudMenu(hud); } catch (e) { console.warn('[Diệu Giang Tự] Menu HUD lỗi:', e && e.message); }   // lỗi menu không được làm hỏng vào cửa
  const q = (id) => hud.querySelector('#' + id);

  function paintChip() {
    const av = q('me-av'); av.textContent = initialOf(profile.name); av.style.background = robeCss(profile.color); av.style.color = profile.color === '9sach' ? '#0e6b22' : '';   // chữ xanh đậm trên nền vàng của đồng phục
    q('me-name').textContent = profile.name;
  }
  const clockEl = q('clock-tx'), clockIc = q('game-clock').firstChild; let lastClock = '';
  const paintClock = () => { const t = clockLabel(LGT.clock, LGT.phase, LGT.weather && LGT.weather.name); if (t !== lastClock) { lastClock = t; clockEl.textContent = t; clockIc.textContent = LGT.night > 0.5 ? '☾' : '☀'; } };
  paintClock(); setInterval(paintClock, 1000);   // Phiên 30: đồng hồ giờ game (LGT.clock/phase do scene/index.js cập nhật mỗi khung)
  q('zin').addEventListener('click', () => W.zoom(-420)); q('zout').addEventListener('click', () => W.zoom(420));
  q('btn-hall').addEventListener('click', () => {
    if (LGT.panelOpen) return;
    if (insideHall(W.pos)) W.walkTo(COURTYARD_POINT.x, COURTYARD_POINT.z); else W.walkTo(HALL_POINT.x, HALL_POINT.z);   // đi vào/ra thật; bảng Chánh điện mở bằng cách bấm tượng Phật hoặc Bản đồ chùa
  });
  // Đổi nhãn nút theo vị trí: trong chánh điện → "Ra sân ngắm cảnh"
  let inside = null;
  setInterval(() => { const now = insideHall(W.pos); if (now !== inside) { inside = now; q('btn-hall-tx').textContent = now ? 'Ra sân ngắm cảnh' : 'Vào chánh điện'; q('btn-hall').firstElementChild.textContent = now ? '☀' : '⛩'; } }, 300);

  // ---------------- Màn vào cửa
  const enter = el('div', 'enter'); enter.id = 'enter'; enter.setAttribute('role', 'dialog'); enter.setAttribute('aria-modal', 'true'); enter.setAttribute('aria-labelledby', 'enter-ttl'); enter.hidden = true;
  enter.innerHTML = `
    <form class="enter-card" autocomplete="on" data-mode="offline">
      <div class="enter-han">DIỆU GIANG TỰ</div>
      <h2 id="enter-ttl">Bước vào cửa chùa</h2>
      <p class="en-sub" id="en-sub" hidden></p>
      <label class="en-l" for="en-name">Tên nhân vật</label>
      <input id="en-name" class="en-in" type="text" maxlength="20" placeholder="Ví dụ: Minh An" spellcheck="false" enterkeyhint="next" autocomplete="username">
      <div class="en-pw"><label class="en-l" for="en-pw">Mật khẩu</label>
        <input id="en-pw" class="en-in" type="password" maxlength="64" placeholder="Ít nhất 6 ký tự" enterkeyhint="go" autocomplete="new-password">
        <label class="en-show"><input type="checkbox" id="en-show"> Hiện mật khẩu</label></div>
      <div class="en-pw2"><label class="en-l" for="en-pw2">Nhập lại mật khẩu</label>
        <input id="en-pw2" class="en-in" type="password" maxlength="64" enterkeyhint="go" autocomplete="new-password"></div>
      <div class="en-look">
        <div class="en-l">Màu áo</div>
        <div class="en-colors" role="radiogroup" aria-label="Màu áo">${PLAYER_COLORS.map((c) => `<button type="button" role="radio" class="sw" data-color="${c.id}" aria-label="${esc(c.ten)}" title="${esc(c.ten)}" style="background:${robeCss(c.id)}"></button>`).join('')}</div>
        <div class="en-l">Kiểu đầu</div>
        <div class="en-hair" role="radiogroup" aria-label="Kiểu đầu">${HAIR_STYLES.map((h) => `<button type="button" role="radio" class="hr" data-hair="${h.id}">${esc(h.ten)}</button>`).join('')}</div>
      </div>
      <p class="en-err" id="en-err" role="alert" hidden></p>
      <button type="button" class="en-link" id="en-temp" hidden>Chơi tạm (chưa lưu tài khoản)</button>
      <button type="submit" class="hud-btn gold big" id="en-go">Vào chùa</button>
      <div class="en-links"><button type="button" class="en-link" id="en-alt" hidden></button><button type="button" class="en-link" id="en-out" hidden>Không phải bạn? Đăng xuất</button></div>
      <p class="en-note"></p>
    </form>`;
  document.body.appendChild(enter);
  const form = enter.querySelector('form'), nameIn = enter.querySelector('#en-name');
  let draft = { ...profile };
  function paintEnter() {
    enter.querySelectorAll('.sw').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.color === draft.color)));
    enter.querySelectorAll('.hr').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.hair === draft.hair)));
  }
  const preview = () => W.setProfile(cleanProfile({ name: nameIn.value || draft.name, color: draft.color, hair: draft.hair }));
  enter.addEventListener('click', (e) => {
    const c = e.target.closest('[data-color]'), h = e.target.closest('[data-hair]');
    if (c) { draft.color = c.dataset.color; paintEnter(); preview(); } else if (h) { draft.hair = h.dataset.hair; paintEnter(); preview(); }
  });
  /** Vào chùa thật sự: lưu hồ sơ (tên/màu/kiểu đầu) vào máy, ẩn màn vào cửa, hiện HUD, bật tự động lưu tài khoản. */
  function enterWorld(rawName) {
    profile = { ...saveProfile(localStorage, { name: rawName, color: draft.color, hair: draft.hair }), has: true };
    W.setProfile(profile); paintChip();
    enter.hidden = true; document.body.classList.remove('entering'); LGT.panelOpen = false; hud.hidden = false;
    menu && menu.welcome();
    document.getElementById('gl')?.focus?.();
    try { LGT.account && LGT.account.startSync && LGT.account.startSync(); } catch (_) { /* bỏ qua */ }
  }
  // Tài khoản (Phiên 53): tạo / đăng nhập / đặt mật khẩu cho nhân vật cũ. LGT.account = null khi chưa cấu hình máy chủ → như cũ (không mật khẩu).
  const gate = initAccountGate({ form, nameIn, client: LGT.account || null, hasLegacy: () => profile.has, getDraft: () => draft, onEnter: enterWorld });
  try { initAccountBanner(LGT.account || null); } catch (e) { console.warn('[Diệu Giang Tự] Băng thông báo tài khoản lỗi:', e && e.message); }

  function open() {
    draft = { ...profile }; nameIn.value = profile.has ? profile.name : ''; paintEnter();
    LGT.panelOpen = true;                         // chặn phím/chuột đi lại khi đang nhập tên
    document.body.classList.add('entering'); enter.hidden = false; hud.hidden = true;
    preview();
    if (gate.begin()) return;                     // vừa đăng nhập xong và tải lại: tự vào chùa
    setTimeout(() => nameIn.focus({ preventScroll: true }), 80);
  }
  paintChip();
  // Phiên 91: vừa vào game → nhân vật cưỡi hạc bay một vòng bản đồ rồi đáp trước cổng chùa; xong mới hiện màn đăng nhập. Bỏ qua được (nút/Esc/Enter/Space).
  // Không chiếu khi: vừa đăng nhập xong rồi tải lại (tự vào chùa), hoặc thêm ?intro=0 vào địa chỉ trang.
  function startWithIntro() {
    let skip = false;
    try { skip = sessionStorage.getItem('lgt.autoEnter') === '1' || new URLSearchParams(location.search).get('intro') === '0'; } catch (_) { /* riêng tư */ }
    if (skip || !LGT.intro || !LGT.intro.play) { open(); return; }
    try {
      W.setProfile(cleanProfile(profile));   // người cưỡi hạc mặc đúng áo/kiểu đầu đã lưu trên máy này (chưa có thì mặc định)
      LGT.panelOpen = true;                    // chặn đi lại / bấm điểm sáng trong lúc bay
      const ui = showIntroUi({ onSkip: () => LGT.intro.skip() });
      const ok = LGT.intro.play({ onLabel: (t) => ui.label(t), onDone: () => { ui.end(); LGT.panelOpen = false; open(); } });
      if (!ok) { ui.end(); LGT.panelOpen = false; open(); }
    } catch (e) { console.warn('[Diệu Giang Tự] Cảnh mở đầu lỗi:', e && e.message); LGT.panelOpen = false; open(); }
  }
  startWithIntro();
  return { get profile() { return profile; }, open };
}
