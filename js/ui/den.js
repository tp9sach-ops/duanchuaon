// Dâng lễ (thắp nhang 1/3/9 nén) + Đèn nguyện (3 tab, thả đèn) — Phiên 14c. Logic ở js/engines/den.js (có test); file này chỉ lo DOM.
// Lưu cục bộ (localStorage); "Tất cả chùa" lấy tường chung qua GAS (js/api.js) khi đã cấu hình apiUrl.
import { makeLamp, addLamp, loadLamps, litCount, agoText, logEvent, loadLog, tabItems, nhangMerit, DEN_MERIT } from '../engines/den.js';
import { thapNhang, tongKetNhang } from '../engines/temple.js';
import { callApi, apiEnabled, getUserKey } from '../api.js';
import { bellSound } from './sound.js';
import { insideHall } from './hudLogic.js';

const K_DEN = 'lgt.den', K_LOG = 'lgt.act', K_NHANG = 'lgt.nhang';   // K_NHANG dùng chung với chương Chùa online
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (_) { /* bỏ qua */ } };
const readJson = (k, d) => { try { const v = JSON.parse(read(k) || 'null'); return v == null ? d : v; } catch (_) { return d; } };
const TABS = [['chua', 'Chùa này'], ['tat', 'Tất cả chùa'], ['hoat', 'Hoạt động']];
const ICON = { den: '🏮', nhang: '✦', loc: '❀' };

/** hud: phần tử HUD; opts: { toast, addMerit }. Trả { openLe(), openDen(), close() }. */
export function initDen(hud, { toast = () => {}, addMerit = () => {} } = {}) {
  const LGT = window.LGT || {};
  let lamps = loadLamps(read(K_DEN)), log = loadLog(read(K_LOG)), nhang = readJson(K_NHANG, {}), tab = 'chua', shared = null, sharedState = 'idle', view = null;
  const profileName = () => read('lgt.name') || 'Khách';

  const root = document.createElement('section'); root.className = 'dn'; root.id = 'den'; root.hidden = true; root.setAttribute('role', 'dialog');
  root.innerHTML = `
    <header class="dn-head"><div><h3 id="dn-title"></h3><p id="dn-sub"></p></div><button type="button" class="dn-x" id="dn-x" aria-label="Đóng">✕</button></header>
    <div class="dn-body" id="dn-le" hidden>
      <p class="dn-note">Thắp nhang cúng dường Tam Bảo trước bàn thờ. Mỗi lần thắp được một ít công đức.</p>
      <div class="dn-row" role="group" aria-label="Số nén nhang"><button type="button" class="dn-b" data-n="1">Thắp 1 nén</button><button type="button" class="dn-b" data-n="3">Thắp 3 nén</button><button type="button" class="dn-b" data-n="9">Thắp 9 nén</button></div>
      <p class="dn-note" id="dn-nhang"></p>
      <button type="button" class="dn-gold" id="dn-to-den">Thả đèn nguyện</button>
    </div>
    <div class="dn-body" id="dn-den" hidden>
      <div class="dn-tabs" role="tablist">${TABS.map(([id, t]) => `<button type="button" role="tab" data-tab="${id}" aria-selected="false">${t}</button>`).join('')}</div>
      <ul class="dn-list" id="dn-list" aria-live="polite"></ul>
      <form class="dn-form" id="dn-form" autocomplete="off">
        <input id="dn-in" maxlength="120" placeholder="Điều bạn nguyện (tối đa 120 chữ)..." aria-label="Điều nguyện" enterkeyhint="send">
        ${apiEnabled() ? '<label class="dn-share"><input type="checkbox" id="dn-share"> Đăng lên tường chung (ẩn danh)</label>' : ''}
        <p class="dn-msg" id="dn-msg" role="status"></p>
        <button type="submit" class="dn-gold">🏮 Thả đèn nguyện</button>
      </form>
    </div>`;
  hud.appendChild(root);
  const $ = (id) => root.querySelector('#' + id);

  const pushLog = (kind, text) => { log = logEvent(log, kind, text); write(K_LOG, log); };

  // ---------------- Dâng lễ
  function drawLe() {
    const t = tongKetNhang(nhang);
    $('dn-nhang').textContent = t.tong ? `Hôm nay ${t.homNay} nén · tổng ${t.tong} nén · chuỗi ${t.chuoi} ngày.` : 'Sổ nhang còn trống. Thắp nén đầu tiên.';
  }
  root.querySelector('.dn-row').addEventListener('click', (e) => {
    const b = e.target.closest('[data-n]'); if (!b) return;
    const n = +b.dataset.n; nhang = thapNhang(nhang, n); write(K_NHANG, nhang); bellSound(); drawLe();
    const m = nhangMerit(n); if (m) addMerit(m); window.LGT && window.LGT.act && window.LGT.act('nhang', n);
    pushLog('nhang', `Thắp ${n} nén nhang`); toast(`Đã thắp ${n} nén nhang${m ? ` · +${m} hạt sen` : ''}.`, 3500);
  });
  $('dn-to-den').addEventListener('click', () => show('den'));

  // ---------------- Đèn nguyện
  function drawTabs() { root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab))); }
  function drawList() {
    const now = Date.now(), ul = $('dn-list');
    $('dn-sub').textContent = `${litCount(lamps, now)} ngọn đèn đang sáng`;
    if (tab === 'tat' && !apiEnabled()) { ul.innerHTML = '<li class="dn-empty">Chưa kết nối máy chủ nên chưa có tường chung. Khi bật đa người (bản sau) đèn của mọi chùa sẽ hiện ở đây.</li>'; return; }
    if (tab === 'tat' && sharedState === 'loading') { ul.innerHTML = '<li class="dn-empty">Đang tải…</li>'; return; }
    if (tab === 'tat' && sharedState === 'error') { ul.innerHTML = '<li class="dn-empty">Chưa tải được tường chung.</li>'; return; }
    const items = tabItems(tab, { lamps, shared, log });
    if (!items.length) { ul.innerHTML = `<li class="dn-empty">${tab === 'hoat' ? 'Chưa có hoạt động nào.' : tab === 'tat' ? 'Tường chung chưa có điều nguyện nào.' : 'Chưa có ngọn đèn nào. Hãy thả ngọn đèn đầu tiên.'}</li>`; return; }
    ul.innerHTML = items.map((it) => {
      const when = it.t ? agoText(it.t, now) : esc(it.date || '');
      if (it.kind === 'lamp') return `<li class="dn-card"><q>${esc(it.text)}</q><span class="dn-who"><b>${esc(it.name)}</b><small>${when}</small></span><span class="dn-flame" title="Số ngọn">🔥 ${it.n}</span></li>`;
      return `<li class="dn-card dn-act"><span class="dn-ic" aria-hidden="true">${ICON[it.kind] || '✦'}</span><span>${esc(it.text)}<small>${when}</small></span></li>`;
    }).join('');
  }
  async function loadShared() {
    if (!apiEnabled()) { drawList(); return; }
    sharedState = 'loading'; drawList();
    const r = await callApi('listPrayers');
    if (r && r.ok) { shared = r.items || []; sharedState = 'ok'; } else sharedState = 'error';
    drawList();
  }
  root.querySelector('.dn-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; drawTabs();
    if (tab === 'tat' && sharedState !== 'ok') loadShared(); else drawList();
  });
  $('dn-form').addEventListener('submit', (e) => {
    e.preventDefault(); const msg = $('dn-msg'), r = makeLamp($('dn-in').value, profileName());
    if (!r.ok) { msg.textContent = { empty: 'Hãy viết điều bạn nguyện.', no_links: 'Không đưa đường dẫn hoặc email vào điều nguyện.', no_numbers: 'Không đưa số điện thoại hoặc dãy số dài vào điều nguyện.' }[r.error] || ''; return; }
    msg.textContent = ''; lamps = addLamp(lamps, r.lamp); write(K_DEN, lamps); $('dn-in').value = '';
    tab = 'chua'; drawTabs(); drawList(); bellSound(); addMerit(DEN_MERIT.lamp); pushLog('den', 'Thả một ngọn đèn nguyện'); window.LGT && window.LGT.act && window.LGT.act('den');
    toast(`Đèn nguyện đã được thả · +${DEN_MERIT.lamp} hạt sen.`, 3500);
    const sh = $('dn-share');
    if (sh && sh.checked) callApi('addPrayer', { userKey: getUserKey(), noiDung: r.lamp.text, congKhai: true }).then((x) => {
      msg.textContent = x.ok ? 'Đã đăng lên tường chung.' : (x.error === 'rate_limited' ? 'Hôm nay bạn đã đăng đủ 5 điều nguyện lên tường chung.' : 'Chưa đăng được lên tường chung, nhưng đèn đã lưu trong trình duyệt của bạn.');
      if (x.ok) { sharedState = 'idle'; }
    });
  });

  // ---------------- mở / đóng
  function show(v) {
    view = v; root.hidden = false; document.body.classList.add('dn-open');
    $('dn-le').hidden = v !== 'le'; $('dn-den').hidden = v !== 'den';
    $('dn-title').textContent = v === 'le' ? 'Dâng lễ' : 'Đèn nguyện';
    if (v === 'le') { $('dn-sub').textContent = 'Trước bàn thờ Tam Bảo'; drawLe(); root.querySelector('[data-n="1"]').focus({ preventScroll: true }); }
    else { drawTabs(); drawList(); $('dn-in').focus({ preventScroll: true }); }
  }
  function close() { view = null; root.hidden = true; document.body.classList.remove('dn-open'); }
  $('dn-x').addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && view) close(); });
  setInterval(() => { if (view === 'den' && !root.hidden) $('dn-sub').textContent = `${litCount(lamps)} ngọn đèn đang sáng`; }, 30000);

  /** Dâng lễ cần đứng trong chánh điện; Đèn nguyện mở ở bất cứ đâu. */
  function openLe() {
    if (LGT.panelOpen) return;
    const W = LGT.world; if (W && !insideHall(W.pos)) return toast('Hãy vào chánh điện để dâng lễ (nút “Vào chánh điện”).', 4500);
    show('le');
  }
  function openDen() { if (LGT.panelOpen) return; show('den'); }
  /** Nhận lộc từ hoa sen vàng (gọi bởi js/scene/hoasen.js qua LGT.onLoc). */
  LGT.onLoc = () => { bellSound(); addMerit(DEN_MERIT.loc); pushLog('loc', 'Nhận lộc hoa sen vàng'); window.LGT.act && window.LGT.act('loc'); toast(`Bạn nhận được lộc từ hoa sen vàng · +${DEN_MERIT.loc} hạt sen.`, 4500); if (view === 'den') drawList(); };
  return { openLe, openDen, close };
}
