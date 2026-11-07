// Màn vào cửa có tài khoản (Phiên 53): tạo nhân vật / đăng nhập / đặt mật khẩu cho nhân vật cũ / "chào mừng trở lại".
// Logic quyết định chế độ + chữ nằm ở js/engines/account.js (có test); file này chỉ nối DOM với client (js/net/accountClient.js).
import { MODE_UI, entryMode, signupMode, validateEntry, errMsg, isNetworkError } from '../engines/account.js';

const AUTO_KEY = 'lgt.autoEnter';   // sessionStorage: vừa đăng nhập xong và trang tải lại → tự vào chùa, khỏi bấm thêm

/**
 * deps: { form, nameIn, client (null = chưa có máy chủ), hasLegacy(): đã có nhân vật cũ trên máy này, getDraft(): {color,hair}, onEnter(name): vào chùa }
 * Trả { begin(), mode }. begin() trả true nếu đã tự vào chùa (không cần hiện màn).
 */
export function initAccountGate({ form, nameIn, client, hasLegacy, getDraft, onEnter }) {
  const $ = (sel) => form.querySelector(sel);
  const ttl = $('#enter-ttl'), sub = $('#en-sub'), go = $('#en-go'), err = $('#en-err'), note = $('.en-note'), look = $('.en-look');
  const pwBox = $('.en-pw'), pw2Box = $('.en-pw2'), pwIn = $('#en-pw'), pw2In = $('#en-pw2'), show = $('#en-show');
  const alt = $('#en-alt'), out = $('#en-out'), temp = $('#en-temp');
  let mode = 'offline', busy = false, altTarget = null;

  const clearErr = () => { err.hidden = true; err.textContent = ''; temp.hidden = true; };
  function showErr(code, ctx = {}) {
    err.textContent = errMsg(code, ctx); err.hidden = false;
    const f = ctx.field === 'pw2' ? pw2In : ctx.field === 'name' ? nameIn : pwIn;
    if (code === 'exists' || code === 'bad_login') { pwIn.value = ''; pw2In.value = ''; }
    try { (code === 'exists' ? alt : f).focus({ preventScroll: true }); } catch (_) { /* bỏ qua */ }
  }
  function setBusy(b) { busy = b; go.disabled = b; alt.disabled = b; out.disabled = b; go.textContent = b ? 'Đang xử lý…' : MODE_UI[mode].go; }

  function paint() {
    const ui = MODE_UI[mode], name = nameIn.value.trim();
    form.dataset.mode = mode;
    ttl.textContent = ui.title; go.textContent = ui.go;
    let s = ui.sub;
    if (mode === 'back') s = name ? 'Đăng nhập với tên “' + name + '”.' : '';
    else if (client && client.state.expired && mode !== 'login') s = errMsg('bad_token');
    sub.textContent = s; sub.hidden = !s;
    pwBox.hidden = !ui.pw; pw2Box.hidden = !ui.pw2; look.hidden = !ui.look;
    note.textContent = ui.note; note.hidden = !ui.note;
    nameIn.disabled = ui.lock;
    pwIn.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    altTarget = mode === 'new' || mode === 'claim' ? 'login' : mode === 'login' ? signupMode(hasLegacy()) : null;
    alt.hidden = !altTarget;
    alt.textContent = mode === 'login' ? 'Chưa có nhân vật? Tạo mới' : 'Đã có nhân vật? Đăng nhập';
    out.hidden = mode !== 'back';
  }
  function setMode(m) { mode = m; clearErr(); pwIn.value = ''; pw2In.value = ''; paint(); }

  alt.addEventListener('click', () => { if (altTarget && !busy) { setMode(altTarget); try { nameIn.focus({ preventScroll: true }); } catch (_) { /* bỏ qua */ } } });
  show.addEventListener('change', () => { pwIn.type = pw2In.type = show.checked ? 'text' : 'password'; });

  async function doLogin(f) {
    const r = await client.login(f);
    if (!r.ok) { showErr(r.error, { name: f.name, field: 'pw' }); if (isNetworkError(r.error)) temp.hidden = false; return; }
    if (client.hasProgress() && !confirm('Máy này đang có dữ liệu chơi chưa gắn với tài khoản. Đăng nhập “' + r.res.name + '” sẽ THAY dữ liệu trên máy này bằng dữ liệu đã lưu của nhân vật đó. Tiếp tục?')) return;
    client.adopt(r.res);
    try { sessionStorage.setItem(AUTO_KEY, '1'); } catch (_) { /* bỏ qua */ }
    location.reload();   // các phần của game đọc dữ liệu lúc khởi động → tải lại để nạp đúng nhân vật
  }
  async function doCreate(f, name) {
    const d = getDraft();
    const r = await client.create({ name, password: f.password, overrides: { 'lgt.name': name, 'lgt.color': d.color, 'lgt.hair': d.hair } });
    if (!r.ok) { showErr(r.error, { name, field: 'pw' }); if (isNetworkError(r.error)) temp.hidden = false; return; }
    onEnter(name);
  }
  async function submit() {
    if (busy) return;
    clearErr();
    if (mode === 'offline' || mode === 'back') return onEnter(nameIn.value);
    const f = { name: nameIn.value, password: pwIn.value, password2: pw2In.value };
    const v = validateEntry(mode, f);
    if (!v.ok) return showErr(v.error, { field: v.field });
    setBusy(true);
    try { if (mode === 'login') await doLogin(f); else await doCreate(f, v.name); }
    catch (e) { showErr('server_error'); }
    finally { setBusy(false); }
  }
  async function doLogout() {
    if (busy || !client) return;
    if (!confirm('Đăng xuất nhân vật này khỏi máy? Dữ liệu trên máy sẽ được xóa (dữ liệu đã lưu trên tài khoản vẫn còn).')) return;
    setBusy(true);
    try {
      let r = await client.logout();
      if (!r.ok && r.error === 'unsynced') {
        if (!confirm('Chưa lưu được tiến trình mới nhất lên máy chủ (có thể đang mất mạng). Đăng xuất bây giờ thì phần chưa lưu sẽ mất. Vẫn đăng xuất?')) return;
        r = await client.logout({ force: true });
      }
      location.reload();
    } finally { setBusy(false); }
  }
  out.addEventListener('click', doLogout);
  temp.addEventListener('click', () => { if (!busy) onEnter(nameIn.value); });   // mạng lỗi: chơi tạm như trước, lần sau hỏi lại mật khẩu
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });

  function begin() {
    mode = entryMode({ apiOn: !!client, hasAcct: !!(client && client.account()), hasLegacy: hasLegacy() });
    clearErr(); pwIn.value = ''; pw2In.value = ''; show.checked = false; pwIn.type = pw2In.type = 'password'; paint();
    if (mode === 'back') {
      let auto = false; try { auto = sessionStorage.getItem(AUTO_KEY) === '1'; sessionStorage.removeItem(AUTO_KEY); } catch (_) { /* bỏ qua */ }
      if (auto) { onEnter(nameIn.value); return true; }
    }
    return false;
  }
  return { begin, get mode() { return mode; } };
}

/** Băng thông báo ở đầu màn hình khi máy khác đã lưu bản mới hơn (xung đột) hoặc phiên đăng nhập hết hạn. */
export function initAccountBanner(client) {
  if (!client || typeof document === 'undefined') return;
  let box = null;
  const hide = () => { if (box) { box.remove(); box = null; } };
  function show(kind) {
    if (box) return;
    box = document.createElement('div'); box.className = 'acct-banner'; box.setAttribute('role', 'alert');
    const msg = document.createElement('p'), row = document.createElement('div'), btn = (label, act) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset.a = act; row.appendChild(b); return b; };
    if (kind === 'expired') { msg.textContent = 'Phiên đăng nhập đã hết hạn nên chưa lưu được tiến trình. Hãy tải lại trang và đăng nhập lại.'; btn('Tải lại trang', 'reload'); }
    else { msg.textContent = 'Nhân vật này vừa được lưu từ một máy khác, còn máy này cũng có thay đổi chưa lưu. Bạn muốn giữ bản nào?'; btn('Dùng bản từ máy kia', 'server'); btn('Giữ bản máy này', 'local'); }
    box.append(msg, row); document.body.appendChild(box);
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      if (b.dataset.a === 'reload') return location.reload();
      row.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      const r = b.dataset.a === 'server' ? await client.useServer() : await client.keepLocal();
      if (r.ok) { if (b.dataset.a === 'server') return location.reload(); hide(); try { window.LGT.account.startSync(); } catch (_) { /* bỏ qua */ } return; }
      msg.textContent = errMsg(r.error); row.querySelectorAll('button').forEach((x) => { x.disabled = false; });
    });
  }
  client.on((ev) => { if (ev === 'conflict') show('conflict'); else if (ev === 'expired') show('expired'); });
  if (client.state.conflict) show('conflict');
}
