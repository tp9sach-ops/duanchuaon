// Bảng xếp hạng (Phiên 2): nút "Xếp hạng" ở thanh dưới mở bảng; thấy cấp + người đang online/offline; bấm một người → thẻ thông tin chi tiết.
// Cũng lo việc GỬI điểm của mình lên máy chủ (saveScore) và báo "đang online" (rankPing, 90 giây/lần). Máy chủ: gas/Rank.gs. Logic thuần + test: js/world/rank.js.
// Mọi chữ hiển thị đi qua textContent (không chèn HTML). Đặt window.LGT.rank = { open, close, toggle, push, refresh, isOpen }.
import { callApi, apiEnabled, getUserKey } from '../api.js';
import { ACCT } from '../engines/account.js';
import { loadProfile } from './hudLogic.js';
import { levelOf, questStatus, QUESTS } from '../world/quests.js';
import { lifetimeSen } from '../world/merit.js';
import { buildScore, scoreSig, cleanList, cleanPlayer, detailRows, statusText, fmtNum, PING_MS, REFRESH_MS } from '../world/rank.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD; opts: { toast(text, ms) }. */
export function initRank(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  if (!document.querySelector('link[data-rank-css]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/rank.css'; l.setAttribute('data-rank-css', ''); document.head.appendChild(l); }   // tự nạp css (không cần sửa index.html)

  // ---- danh tính + gói điểm của chính mình
  const who = () => {
    const w = { userKey: getUserKey() };
    try { const a = JSON.parse(localStorage.getItem(ACCT.ACCT_KEY) || 'null'); if (a && a.aid && a.token) { w.aid = a.aid; w.token = a.token; } } catch (_) { /* không có tài khoản: dùng userKey của máy */ }
    return w;
  };
  function collect() {
    const prog = LGT.quests && LGT.quests.prog, xp = prog ? prog.xp : 0, st = LGT.story && LGT.story.state;
    let done = 0; try { done = prog ? questStatus(prog).filter((r) => r.done).length : 0; } catch (_) { /* tiến trình lạ: bỏ qua số nhiệm vụ, vẫn gửi điểm */ }
    return buildScore({
      sen: LGT.totalSen ? LGT.totalSen() : lifetimeSen(LGT.getSen ? LGT.getSen() : 0, LGT.merit ? LGT.merit.leaf : null), leaf: LGT.merit ? LGT.merit.leaf : null, level: levelOf(xp), xp,
      done, total: QUESTS.length,
      board: !!(LGT.board && LGT.board.own), chapter1: !!(st && st.step === 'done'),
    });
  }
  let lastSig = '', busy = false;
  /** Gửi điểm + cấp + chi tiết lên máy chủ. Trả true nếu máy chủ nhận. KHÔNG đọc số sen máy chủ trả về (tránh cộng/hoàn sen ngoài ý muốn). */
  async function push() {
    if (!apiEnabled() || busy) return false;
    busy = true;
    try {
      const sc = collect(), res = await callApi('saveScore', { ...who(), n: loadProfile(localStorage).name, ...sc });
      if (res && res.ok) { lastSig = scoreSig(sc); return true; }
      return false;
    } catch (_) { return false; } finally { busy = false; }
  }
  async function tick() {
    if (!apiEnabled()) return;
    try { if (scoreSig(collect()) !== lastSig) await push(); else await callApi('rankPing', who()); } catch (_) { /* mạng lỗi: lần sau thử lại */ }
  }
  setTimeout(tick, 6000); setInterval(tick, PING_MS);

  // ---- khung bảng
  const box = el('section', 'rk-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Bảng xếp hạng');
  const head = el('header'), h3 = el('h3', null, 'Bảng xếp hạng');
  const reload = el('button', 'rk-ic', '↻'); reload.type = 'button'; reload.setAttribute('aria-label', 'Làm mới bảng');
  const x = el('button', 'rk-ic', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng');
  const tools = el('div', 'rk-tools'); tools.append(reload, x); head.append(h3, tools);
  const note = el('p', 'rk-note'), list = el('ol', 'rk-list'), meBar = el('p', 'rk-me'), detail = el('div', 'rk-detail');
  detail.hidden = true; meBar.hidden = true;
  box.append(head, note, list, meBar, detail); hud.appendChild(box);

  let data = null, view = 'list', curId = '', timer = 0, seq = 0;
  const setNote = (t) => { note.textContent = t; };
  const lineOf = (r) => `Cấp ${r.lv}${r.ten ? ' · ' + r.ten : ''} · ${statusText(r)}`;

  function rowEl(r) {
    const li = el('li'), b = el('button', 'rk-row' + (data && data.me && data.me.id === r.id ? ' me' : '') + (r.rank <= 3 ? ' t' + r.rank : '')); b.type = 'button';
    b.setAttribute('aria-label', `Hạng ${r.rank}, ${r.n}, ${lineOf(r)}. Bấm để xem chi tiết.`);
    const who1 = el('span', 'rk-who'); who1.append(el('b', null, r.n), el('small', null, lineOf(r)));
    const dot = el('i', 'rk-dot ' + (r.on ? 'on' : 'off')); dot.setAttribute('aria-hidden', 'true');
    b.append(el('span', 'rk-n', '#' + r.rank), dot, who1, el('span', 'rk-sen', fmtNum(r.sen)));
    b.addEventListener('click', () => openDetail(r));
    li.appendChild(b); return li;
  }
  function drawList() {
    list.textContent = '';
    if (!data) return;
    if (!data.top.length) { setNote('Chưa có ai trong bảng. Chơi một lúc rồi quay lại nhé.'); meBar.hidden = true; return; }
    for (const r of data.top) list.appendChild(rowEl(r));
    const online = data.top.filter((r) => r.on).length;
    setNote(`${data.total} người chơi · ${online} đang online (chấm xanh) · xếp theo tổng hạt sen. Bấm một người để xem chi tiết.`);
    const m = data.me, shown = m && data.top.some((r) => r.id === m.id);
    meBar.hidden = !m || shown;
    if (m && !shown) meBar.textContent = `Bạn đứng hạng ${m.rank} · cấp ${m.lv} · ${fmtNum(m.sen)} hạt sen`;
  }
  async function loadList(silent) {
    if (!apiEnabled()) { setNote('Chưa kết nối máy chủ nên chưa có bảng xếp hạng.'); return; }
    if (!silent && !data) setNote('Đang tải bảng xếp hạng…');
    const my = ++seq, res = cleanList(await callApi('getRank', { ...who(), limit: 50 }));
    if (my !== seq || box.hidden || view !== 'list') return;        // người chơi đã đóng/đổi màn hình trong lúc chờ
    if (!res) { if (!data) setNote('Chưa tải được bảng xếp hạng. Thử lại sau nhé.'); else if (!silent) toast('Chưa làm mới được bảng xếp hạng.', 2500); return; }
    data = res; drawList();
  }

  // ---- thẻ chi tiết một người
  function drawDetail(r, p, state) {
    detail.textContent = '';
    const back = el('button', 'rk-back', '← Quay lại bảng'); back.type = 'button'; back.addEventListener('click', showList);
    const nm = el('div', 'rk-dn'), dot = el('i', 'rk-dot ' + (r.on ? 'on' : 'off')); dot.setAttribute('aria-hidden', 'true');
    nm.append(dot, el('b', null, r.n), el('small', null, statusText(r)));
    detail.append(back, nm);
    if (p) {
      const dl = el('dl', 'rk-dl');
      for (const d of detailRows(p)) { const row = el('div'); row.append(el('dt', null, d.k), el('dd', null, d.v)); dl.appendChild(row); }
      detail.appendChild(dl);
    } else {
      detail.append(el('p', 'rk-note', state === 'load' ? 'Đang tải thông tin…' : `Cấp ${r.lv}${r.ten ? ' · ' + r.ten : ''} · ${fmtNum(r.sen)} hạt sen. Chưa tải được chi tiết, thử lại sau nhé.`));
    }
    back.focus({ preventScroll: true });
  }
  async function openDetail(r) {
    view = 'detail'; curId = r.id; list.hidden = true; meBar.hidden = true; note.hidden = true; detail.hidden = false;
    drawDetail(r, null, 'load');
    await loadDetail(r);
  }
  async function loadDetail(r) {
    if (!apiEnabled()) return;
    const my = ++seq, p = cleanPlayer(await callApi('getPlayer', { id: r.id }));
    if (my !== seq || box.hidden || view !== 'detail' || curId !== r.id) return;
    if (p) drawDetail(p, p); else drawDetail(r, null, 'fail');
  }
  function showList() { view = 'list'; curId = ''; detail.hidden = true; list.hidden = false; note.hidden = false; drawList(); loadList(true); }

  // ---- mở/đóng
  const refresh = () => { if (box.hidden) return; if (view === 'list') loadList(true); else if (curId) { const r = (data && data.top.find((t) => t.id === curId)) || null; if (r) loadDetail(r); } };
  function open() {
    if (!box.hidden) return;
    box.hidden = false; view = 'list'; detail.hidden = true; list.hidden = false; note.hidden = false; drawList(); loadList(false);
    push().then((ok) => { if (ok && !box.hidden && view === 'list') loadList(true); });   // lần đầu mở: đưa mình vào bảng ngay
    clearInterval(timer); timer = setInterval(refresh, REFRESH_MS);
    x.focus({ preventScroll: true });
  }
  function close() { box.hidden = true; clearInterval(timer); timer = 0; seq++; }
  x.addEventListener('click', close);
  reload.addEventListener('click', () => { refresh(); toast('Đang làm mới bảng xếp hạng…', 1500); });
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); if (view === 'detail') showList(); else close(); } });

  LGT.rank = { open, close, toggle: () => (box.hidden ? open() : close()), push, refresh, get isOpen() { return !box.hidden; } };
  return LGT.rank;
}
