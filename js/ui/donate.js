// Thùng công đức (Phiên 80): bảng cúng dường. Bấm thùng ở chánh điện → đi tới → LGT.onDonate() mở bảng này. Logic thuần ở js/engines/donate.js (có test).
// Hai cách chuyển: (1) QR — MoMo (ưu tiên, mặc định) hoặc VietinBank; (2) số tài khoản có nút sao chép. Chuyển xong bấm "Tôi đã chuyển" kèm số tiền →
// máy chủ ghi "chờ duyệt"; người duyệt xác nhận trong 24 giờ → lần sau mở game/mở thùng, hạt sen tự được cộng MỘT lần. Mọi chữ lấy từ máy chủ đều qua textContent.
import { DONATE_TARGET as T, DON, formatVnd, senFor, parseAmount, donateCode, buildClaim, donateError, creditApproved, loadDone } from '../engines/donate.js';
import { callApi, apiEnabled, getUserKey } from '../api.js';
import { bellSound } from './sound.js';

const K_DONE = 'lgt.donDone', K_MADE = 'lgt.donMade';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const rd = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const wr = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* chế độ riêng tư */ } };

/** Chép chữ vào bộ nhớ tạm; trả Promise<boolean>. Có đường dự phòng cho trình duyệt cũ / trang không an toàn. */
export async function copyText(text, { nav = globalThis.navigator, doc = globalThis.document } = {}) {
  try { if (nav && nav.clipboard && nav.clipboard.writeText) { await nav.clipboard.writeText(text); return true; } } catch (_) { /* thử đường dự phòng */ }
  try {
    const ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    doc.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length); const ok = !!doc.execCommand('copy'); ta.remove(); return ok;
  } catch (_) { return false; }
}

/** hud: phần tử HUD; opts: { toast(text, ms), addMerit(n) }. Đặt LGT.onDonate (mở bảng) và LGT.donate = { open, close, refresh }. */
export function initDonate(hud, { toast = () => {}, addMerit = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let view = 'home', via = 'momo', busy = false, mine = [], pending = 0;
  const code = () => donateCode(getUserKey());

  const root = el('section', 'cd'); root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'false'); root.setAttribute('aria-labelledby', 'cd-title');
  const head = el('header', 'cd-head'), ht = el('div'), h3 = el('h3', null, 'Thùng công đức'); h3.id = 'cd-title';
  const sub = el('p', null, `Tùy hỷ cúng dường. Chuyển xong, hạt sen được gửi tặng trong ${DON.HOURS} giờ.`); ht.append(h3, sub);
  const x = el('button', 'cd-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(ht, x);

  // ---- màn chọn cách
  const home = el('div', 'cd-home');
  const bQr = el('button', 'cd-big'); bQr.type = 'button'; bQr.append(el('span', 'cd-ic', '📷'), el('b', null, 'Quét mã QR'), el('small', null, 'MoMo (ưu tiên) hoặc VietinBank'));
  const bTk = el('button', 'cd-big alt'); bTk.type = 'button'; bTk.append(el('span', 'cd-ic', '📋'), el('b', null, 'Số tài khoản'), el('small', null, 'Hiện số để sao chép, chuyển khoản'));
  home.append(bQr, bTk);

  // ---- cách 1: QR
  const qr = el('div', 'cd-qr');
  const tabs = el('div', 'cd-tabs'); tabs.setAttribute('role', 'tablist');
  const tMomo = el('button', null, 'MoMo · khuyên dùng'), tBank = el('button', null, 'VietinBank'); [tMomo, tBank].forEach((b) => { b.type = 'button'; b.setAttribute('role', 'tab'); }); tabs.append(tMomo, tBank);
  const img = el('img', 'cd-img'); img.width = 280; img.height = 280; img.decoding = 'async'; img.alt = '';
  const qrCap = el('p', 'cd-cap');
  const save = el('a', 'cd-link', 'Lưu ảnh QR về máy'); save.setAttribute('download', '');
  const qrHelp = el('p', 'cd-note', 'Đang dùng điện thoại này? Bấm “Lưu ảnh QR”, mở MoMo → Quét mã QR → chọn ảnh từ thư viện.');
  qr.append(tabs, img, qrCap, save, qrHelp);

  // ---- cách 2: số tài khoản
  const tk = el('div', 'cd-tk');
  const copyRow = (label, value, note) => {
    const r = el('div', 'cd-row'), l = el('div', 'cd-rl'), lb = el('small', null, label), v = el('b', null, value); l.append(lb, v);
    const c = el('button', 'cd-copy', 'Sao chép'); c.type = 'button'; c.setAttribute('aria-label', `Sao chép ${label}`);
    c.addEventListener('click', async () => { const ok = await copyText(value); toast(ok ? `Đã sao chép ${label.toLowerCase()}.` : 'Chưa sao chép được, hãy bấm giữ vào số để chép.', 2600); if (ok) { c.textContent = 'Đã chép ✓'; setTimeout(() => { c.textContent = 'Sao chép'; }, 1800); } });
    r.append(l, c); if (note) r.append(el('p', 'cd-note', note)); return { r, v };
  };
  const rBank = copyRow('Ngân hàng', `${T.nganHang} · ${T.chiNhanh}`), rNo = copyRow('Số tài khoản', T.soTk), rName = copyRow('Chủ tài khoản', T.chuTk);
  const rMemo = copyRow('Nội dung chuyển khoản', code(), 'Ghi nội dung này để thầy nhận ra bạn và gửi hạt sen đúng người.');
  tk.append(rBank.r, rNo.r, rName.r, rMemo.r, el('p', 'cd-note', 'Dùng MoMo: Chuyển tiền → Đến ngân hàng → chọn VietinBank → dán số tài khoản.'));

  const back = el('button', 'cd-back', '← Chọn cách khác'); back.type = 'button';

  // ---- xác nhận đã chuyển
  const form = el('form', 'cd-form'); form.autocomplete = 'off'; form.noValidate = true;
  form.append(el('h4', null, 'Chuyển xong rồi? Báo cho thầy'));
  const chips = el('div', 'cd-chips'); DON.PRESETS.forEach((v) => { const c = el('button', 'cd-chip', formatVnd(v)); c.type = 'button'; c.dataset.v = String(v); chips.appendChild(c); });
  const amt = el('input'); amt.id = 'cd-amt'; amt.type = 'text'; amt.inputMode = 'numeric'; amt.placeholder = 'Số tiền đã chuyển (ví dụ 50000 hoặc 50k)'; amt.maxLength = 16; amt.setAttribute('aria-label', 'Số tiền đã chuyển');
  const note = el('input'); note.type = 'text'; note.maxLength = 60; note.placeholder = 'Lời hồi hướng (tùy chọn)'; note.setAttribute('aria-label', 'Lời hồi hướng');
  const preview = el('p', 'cd-prev'); preview.setAttribute('aria-live', 'polite');
  const msg = el('p', 'cd-msg'); msg.setAttribute('role', 'status');
  const send = el('button', 'cd-gold', 'Tôi đã chuyển'); send.type = 'submit';
  form.append(chips, amt, note, preview, msg, send);

  const hist = el('div', 'cd-hist'), histH = el('h4', null, 'Công đức của bạn'), histL = el('ul'); hist.append(histH, histL); hist.hidden = true;
  const fine = el('p', 'cd-fine', 'Hạt sen là phần quà tạm của bản thử, không phải hàng hóa hay tiền. Mọi khoản được đối chiếu thủ công trước khi tặng.');
  root.append(head, home, qr, tk, back, form, hist, fine); hud.appendChild(root);

  function drawQr() {
    const m = via === 'momo';
    tMomo.setAttribute('aria-selected', String(m)); tBank.setAttribute('aria-selected', String(!m));
    img.src = m ? T.qrMomo : T.qrBank; img.alt = m ? 'Mã QR nhận công đức qua MoMo' : `Mã QR nhận công đức qua ${T.nganHang}`;
    save.href = img.src; save.setAttribute('download', m ? 'cong-duc-momo.jpg' : 'cong-duc-vietinbank.jpg');
    qrCap.textContent = m ? 'Mở MoMo → Quét mã QR → đưa vào khung này.' : `${T.chuTk} · ${T.nganHang} · ${T.soTk}`;
  }
  function draw() {
    home.hidden = view !== 'home'; qr.hidden = view !== 'qr'; tk.hidden = view !== 'tk'; back.hidden = view === 'home'; form.hidden = view === 'home';
    if (view === 'qr') drawQr();
    rMemo.v.textContent = code();
    histL.replaceChildren(...mine.map((m) => {
      const li = el('li', 'cd-h ' + m.trangThai), st = m.trangThai === 'ok' ? `Đã duyệt · +${senFor(m.soTien)} hạt sen` : m.trangThai === 'tuchoi' ? 'Chưa khớp sao kê' : 'Chờ duyệt';
      li.append(el('b', null, formatVnd(m.soTien)), el('span', null, st), el('small', null, m.ngay || '')); return li;
    }));
    hist.hidden = !mine.length;
  }
  function drawPreview() {
    const r = parseAmount(amt.value);
    preview.textContent = r.ok ? `${formatVnd(r.vnd)} ≈ ${senFor(r.vnd)} hạt sen` : (amt.value.trim() ? donateError(r.error) : '');
    preview.classList.toggle('bad', !r.ok && !!amt.value.trim());
  }

  // ---- sự kiện
  const go = (v) => { view = v; msg.textContent = ''; draw(); };
  bQr.addEventListener('click', () => { via = 'momo'; go('qr'); });
  bTk.addEventListener('click', () => { via = 'bank'; go('tk'); });
  back.addEventListener('click', () => go('home'));
  tMomo.addEventListener('click', () => { via = 'momo'; drawQr(); });
  tBank.addEventListener('click', () => { via = 'bank'; drawQr(); });
  chips.addEventListener('click', (e) => { const c = e.target.closest('[data-v]'); if (!c) return; amt.value = c.dataset.v; drawPreview(); });
  amt.addEventListener('input', drawPreview);
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); if (busy) return;
    const c = buildClaim({ amount: amt.value, note: note.value, userKey: getUserKey(), name: rd('lgt.name') || '', via: view === 'tk' ? 'bank' : via });
    if (!c.ok) { msg.textContent = donateError(c.error); msg.className = 'cd-msg bad'; return; }
    if (!apiEnabled()) { msg.textContent = donateError('api_disabled'); msg.className = 'cd-msg bad'; return; }
    busy = true; send.disabled = true; msg.className = 'cd-msg'; msg.textContent = 'Đang gửi…';
    const r = await callApi('donClaim', c.payload);
    busy = false; send.disabled = false;
    if (!r || !r.ok) { msg.textContent = donateError(r && r.error); msg.className = 'cd-msg bad'; return; }
    wr(K_MADE, '1'); bellSound(); amt.value = ''; note.value = ''; drawPreview();
    msg.className = 'cd-msg good'; msg.textContent = `Đã ghi nhận ${formatVnd(c.payload.soTien)}. Sau khi đối chiếu (trong ${DON.HOURS} giờ), ${r.sen || senFor(c.payload.soTien)} hạt sen sẽ tự cộng vào ví khi bạn vào game.`;
    toast('Cảm ơn công đức của bạn. A Di Đà Phật.', 4500);
    refresh();
  });

  // ---- đồng bộ với máy chủ: cộng hạt sen cho khoản đã duyệt (mỗi khoản một lần)
  let refreshing = false;
  async function refresh({ quiet = false } = {}) {
    if (!apiEnabled() || refreshing) return null;
    refreshing = true;
    try {
      const uk = getUserKey(), r = await callApi('donCheck', { userKey: uk });
      if (!r || !r.ok) return null;
      mine = Array.isArray(r.mine) ? r.mine.map((m) => ({ soTien: Math.max(0, Math.floor(+m.soTien) || 0), trangThai: ['ok', 'tuchoi'].includes(m.trangThai) ? m.trangThai : 'cho', ngay: String(m.ngay || '').slice(0, 10) })) : [];
      pending = Math.max(0, Math.floor(+r.pending) || 0);
      const cr = creditApproved(r.items, loadDone(rd(K_DONE)));
      if (cr.ids.length) {
        wr(K_DONE, JSON.stringify(cr.done));                     // ghi trước khi cộng: lỡ cộng xong mà tắt trang cũng không bị cộng lại
        if (cr.add > 0) { addMerit(cr.add); bellSound(); toast(`Công đức của bạn đã được ghi nhận · +${cr.add} hạt sen. A Di Đà Phật.`, 6000); }
        callApi('donAck', { userKey: uk, ids: cr.ids });
      }
      if (!root.hidden) draw();
      return { added: cr.add, pending };
    } finally { refreshing = false; }
  }

  function open() {
    if (LGT.panelOpen) return;
    view = 'home'; msg.textContent = ''; root.hidden = false; document.body.classList.add('cd-open'); draw(); drawPreview();
    bQr.focus({ preventScroll: true }); refresh();
  }
  function close() { root.hidden = true; document.body.classList.remove('cd-open'); }
  x.addEventListener('click', close);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  LGT.onDonate = open; LGT.donate = { open, close, refresh, get pending() { return pending; } };

  // Đã từng báo chuyển tiền → vài giây sau khi vào game, tự kiểm tra có khoản được duyệt chưa (không gọi máy chủ với người chưa từng báo)
  if (rd(K_MADE) === '1') setTimeout(() => { refresh(); }, 9000);
  return LGT.donate;
}
