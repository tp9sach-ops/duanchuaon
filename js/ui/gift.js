// Gửi quà giữa người chơi (Phiên 161): nút 🎁 cạnh ví (hạt sen / lá bồ đề) mở bảng "Quà tặng" có hai thẻ: GỬI QUÀ (chọn người trong bảng xếp hạng, chọn quà, số lượng, lời nhắn) và HỘP QUÀ (nhận quà người khác gửi).
// Quà: hạt sen, lá bồ đề, Bánh sầu riêng 3 vị, Bánh sầu riêng pho mai than tre (bánh = mua tặng: người gửi trả lá bồ đề theo giá tiệm). Logic thuần + test: js/world/gift.js, tests/gift.test.mjs. Máy chủ: gas/Gifts.gs.
// Ví nằm ở máy mỗi người nên: gửi = TRỪ trước ở máy mình rồi báo máy chủ; máy chủ không nhận (không phải lỗi mạng) → HOÀN lại. Lỗi mạng → gửi lại một lần với cùng mã cid (máy chủ nhận ra, không gửi đôi) rồi mới hoàn.
// Nhận = máy chủ đánh dấu "đã nhận" (mỗi quà một lần) rồi máy mình cộng vào ví / hạn dùng bánh. Mọi chữ hiển thị đi qua textContent. Đặt window.LGT.gift = { open, close, toggle, refresh, get isOpen, get unread }.
import { callApi, apiEnabled, getUserKey } from '../api.js';
import { ACCT } from '../engines/account.js';
import { cleanList, fmtNum } from '../world/rank.js';
import { KINDS, NOTE_MAX, kindById, cleanQty, costOf, canAfford, maxQty, cleanNote, qtyText, giftLine, errText, isNetError, cleanInbox, claimPlan, grantGem } from '../world/gift.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const POLL_MS = 60000;
const ITEMS_KEY = 'lgt.items';
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/[^0-9a-f-]/gi, '').toLowerCase().slice(0, 40);

const CSS = '.gf-pill{position:relative;cursor:pointer;font:inherit}.gf-pill b{margin-left:2px}.gf-pill.has{border-color:#f1db9f;box-shadow:0 0 0 2px rgba(241,219,160,.35)}'
  + '.gf-dot{position:absolute;right:-4px;top:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#e8552b;color:#fff;font:700 11px/17px var(--sans,system-ui,sans-serif);text-align:center}.gf-dot[hidden]{display:none}'
  + '.gf-box{position:absolute;left:50%;top:max(70px,calc(env(safe-area-inset-top) + 64px));transform:translateX(-50%);z-index:7;width:min(430px,calc(100vw - 20px));max-height:calc(var(--vvh,100vh) - 90px);overflow:auto;padding:12px 14px 14px;border-radius:16px;border:1px solid rgba(241,219,160,.6);background:rgba(14,10,7,.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 18px 60px rgba(0,0,0,.55);color:#f3ead4;pointer-events:auto;font:400 13px/1.45 var(--sans,system-ui,sans-serif)}'
  + '.gf-box[hidden]{display:none!important}.panel-open .gf-box{display:none}'
  + '.gf-box header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.gf-box h3{margin:0;font:600 18px/1.2 var(--serif,Georgia,serif);color:#fff}'
  + '.gf-x{width:32px;height:32px;border-radius:50%;border:1px solid rgba(241,219,160,.5);background:transparent;color:#f1dba0;font-size:20px;line-height:1;cursor:pointer}'
  + '.gf-tabs{display:flex;gap:6px;margin:4px 0 10px}.gf-tab{flex:1;min-height:36px;padding:7px 10px;border-radius:100px;border:1px solid rgba(217,178,95,.5);background:transparent;color:#f1dba0;font:600 13px/1 var(--sans,inherit);cursor:pointer}.gf-tab.on{background:#d9b25f;color:#2a1a08;border-color:#d9b25f}'
  + '.gf-l{display:block;margin:10px 0 4px;font:600 11px/1.2 var(--sans,inherit);letter-spacing:.06em;text-transform:uppercase;color:#d9b25f}'
  + '.gf-in{width:100%;box-sizing:border-box;min-height:38px;padding:8px 10px;border-radius:10px;border:1px solid rgba(217,178,95,.5);background:rgba(255,255,255,.07);color:#fff;font:400 16px/1.2 var(--sans,inherit)}.gf-in:focus{outline:2px solid #d9b25f;outline-offset:1px}'
  + '.gf-people{list-style:none;margin:6px 0 0;padding:0;max-height:150px;overflow:auto;display:flex;flex-direction:column;gap:4px}'
  + '.gf-p{display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:6px 10px;border-radius:10px;border:1px solid rgba(217,178,95,.3);background:rgba(255,255,255,.05);color:#f3ead4;font:400 13px/1.2 var(--sans,inherit);text-align:left;cursor:pointer}.gf-p:hover{background:rgba(217,178,95,.18)}.gf-p.on{border-color:#f1db9f;background:rgba(217,178,95,.3)}'
  + '.gf-p i{flex:none;width:8px;height:8px;border-radius:50%;background:#6b6f7a}.gf-p i.on{background:#5bd37a;box-shadow:0 0 6px #5bd37a}.gf-p b{font-weight:600;color:#fff}.gf-p small{margin-left:auto;color:#bdb39a}'
  + '.gf-to{margin:6px 0 0;color:#bcd8c4}'
  + '.gf-kinds{display:flex;flex-wrap:wrap;gap:6px}.gf-k{min-height:36px;padding:7px 12px;border-radius:100px;border:1px solid rgba(217,178,95,.5);background:transparent;color:#f1dba0;font:500 12.5px/1.1 var(--sans,inherit);cursor:pointer}.gf-k.on{background:#d9b25f;color:#2a1a08;border-color:#d9b25f;font-weight:600}'
  + '.gf-qty{display:flex;align-items:center;gap:6px}.gf-qty .gf-in{width:84px;text-align:center}.gf-b{min-width:40px;min-height:38px;padding:6px 12px;border-radius:100px;border:1px solid #f1db9f;background:rgba(217,178,95,.2);color:#fff;font:600 14px/1 var(--sans,inherit);cursor:pointer}.gf-b:disabled{opacity:.4;cursor:default}'
  + '.gf-go{display:block;width:100%;margin-top:12px;min-height:44px;border-radius:100px;border:1px solid #f1dba0;background:linear-gradient(180deg,#f1d27f,#d9b25f);color:#2a1a08;font:600 15px/1 var(--sans,inherit);cursor:pointer}.gf-go:disabled{opacity:.5;cursor:default}'
  + '.gf-info,.gf-st{margin:6px 0 0;color:#bdb39a}.gf-st{color:#f1dba0;min-height:18px}'
  + '.gf-inbox{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.gf-g{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.06)}.gf-g span{flex:1;min-width:0;word-break:break-word}'
  + '.gf-empty{margin:8px 0;color:#bdb39a}';
let styled = false;

/** hud: phần tử HUD (id "hud"). Đặt LGT.gift. Trả LGT.gift. */
export function initGift(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  if (LGT.gift) return LGT.gift;
  if (!styled) { styled = true; document.head.appendChild(el('style', null, CSS)); }

  const who = () => {   // giống js/ui/rank.js: danh tính của chính mình
    const w = { userKey: getUserKey() };
    try { const a = JSON.parse(localStorage.getItem(ACCT.ACCT_KEY) || 'null'); if (a && a.aid && a.token) { w.aid = a.aid; w.token = a.token; } } catch (_) { /* không có tài khoản: dùng userKey của máy */ }
    return w;
  };
  const have = () => ({ sen: LGT.getSen ? LGT.getSen() : 0, la: LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0 });
  /** Trừ trước ở máy mình. Trả false nếu không trừ được. */
  function take(c) {
    if (c.sen > 0 && !(LGT.spendSen && LGT.spendSen(c.sen))) return false;
    if (c.la > 0 && !(LGT.merit && LGT.merit.spendLa && LGT.merit.spendLa(c.la))) { if (c.sen > 0 && LGT.addMerit) LGT.addMerit(c.sen); return false; }
    return true;
  }
  /** Hoàn lại khi máy chủ không nhận quà. */
  function giveBack(c) { if (c.sen > 0 && LGT.addMerit) LGT.addMerit(c.sen); if (c.la > 0 && LGT.merit && LGT.merit.addLa) LGT.merit.addLa(c.la); }

  // ---------- nút 🎁 cạnh ví ----------
  const pill = el('button', 'hm-pill gf-pill'); pill.type = 'button'; pill.title = 'Quà tặng: gửi hạt sen, lá bồ đề, bánh cho bạn bè và nhận quà'; pill.setAttribute('aria-label', 'Quà tặng');
  const pillIc = el('span', null, '🎁'), dot = el('span', 'gf-dot'); dot.hidden = true; dot.setAttribute('aria-hidden', 'true');
  pill.append(pillIc, dot); (hud.querySelector('.hm-wallet') || hud).appendChild(pill);

  // ---------- khung bảng ----------
  const box = el('section', 'gf-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Quà tặng');
  const head = el('header'), x = el('button', 'gf-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(el('h3', null, 'Quà tặng'), x);
  const tabs = el('div', 'gf-tabs'), tSend = el('button', 'gf-tab', 'Gửi quà'), tIn = el('button', 'gf-tab', 'Hộp quà'); tSend.type = tIn.type = 'button'; tabs.append(tSend, tIn);
  const vSend = el('div'), vIn = el('div');
  box.append(head, tabs, vSend, vIn); hud.appendChild(box);
  ['keydown', 'keyup', 'keypress'].forEach((ev) => box.addEventListener(ev, (e) => { if (e.key === 'Escape' && ev === 'keydown') { e.stopPropagation(); close(); return; } e.stopPropagation(); }));   // gõ chữ trong ô nhập không kích hoạt phím chiêu / đi lại của game

  // ----- thẻ Gửi quà
  const search = el('input', 'gf-in'); search.type = 'search'; search.placeholder = 'Tìm tên người nhận'; search.maxLength = 20; search.autocomplete = 'off'; search.spellcheck = false; search.setAttribute('aria-label', 'Tìm tên người nhận');
  const peopleBox = el('ul', 'gf-people'), toLine = el('p', 'gf-to');
  const kinds = el('div', 'gf-kinds'), info = el('p', 'gf-info');
  const qtyIn = el('input', 'gf-in'); qtyIn.type = 'number'; qtyIn.min = '1'; qtyIn.step = '1'; qtyIn.value = '1'; qtyIn.inputMode = 'numeric'; qtyIn.setAttribute('aria-label', 'Số lượng');
  const bMinus = el('button', 'gf-b', '−'), bPlus = el('button', 'gf-b', '+'), bMax = el('button', 'gf-b', 'Tối đa'); bMinus.type = bPlus.type = bMax.type = 'button';
  const qtyRow = el('div', 'gf-qty'); qtyRow.append(bMinus, qtyIn, bPlus, bMax);
  const noteIn = el('input', 'gf-in'); noteIn.type = 'text'; noteIn.maxLength = NOTE_MAX; noteIn.placeholder = 'Lời nhắn (không bắt buộc)'; noteIn.autocomplete = 'off'; noteIn.setAttribute('aria-label', 'Lời nhắn');
  const status = el('p', 'gf-st'); status.setAttribute('role', 'status');
  const go = el('button', 'gf-go', 'Gửi quà'); go.type = 'button';
  const lbl = (t) => el('label', 'gf-l', t);
  vSend.append(lbl('Người nhận'), search, peopleBox, toLine, lbl('Quà tặng'), kinds, info, lbl('Số lượng'), qtyRow, lbl('Lời nhắn'), noteIn, status, go);
  const kindBtns = {};
  for (const k of KINDS) { const b = el('button', 'gf-k', k.ten); b.type = 'button'; b.dataset.id = k.id; b.addEventListener('click', () => { kind = k.id; qtyIn.value = '1'; drawSend(); }); kinds.appendChild(b); kindBtns[k.id] = b; }

  // ----- thẻ Hộp quà
  const inList = el('ul', 'gf-inbox'), inEmpty = el('p', 'gf-empty'), inAll = el('button', 'gf-go', 'Nhận tất cả'); inAll.type = 'button';
  vIn.append(inEmpty, inList, inAll);

  // ---------- trạng thái ----------
  let tab = 'send', kind = 'sen', people = [], meId = '', pick = null, sending = false, claiming = false, gifts = [], peopleSeq = 0;
  const setStatus = (t) => { status.textContent = t; };
  const curKind = () => kindById(kind);
  const curQty = () => cleanQty(curKind(), Math.floor(Number(qtyIn.value)));

  function drawPeople() {
    peopleBox.textContent = '';
    const q = search.value.trim().toLocaleLowerCase('vi'), list = people.filter((p) => p.id !== meId && (!q || p.n.toLocaleLowerCase('vi').includes(q))).slice(0, 50);
    if (!list.length) { const li = el('li', 'gf-empty', apiEnabled() ? (people.length ? 'Không thấy ai tên như vậy.' : 'Đang tải danh sách người chơi…') : errText('api_disabled')); peopleBox.appendChild(li); return; }
    for (const p of list) {
      const li = el('li'), b = el('button', 'gf-p' + (pick && pick.id === p.id ? ' on' : '')); b.type = 'button';
      const d = el('i', p.on ? 'on' : ''); d.setAttribute('aria-hidden', 'true');
      b.append(d, el('b', null, p.n), el('small', null, `Cấp ${p.lv}`)); b.setAttribute('aria-label', `${p.n}, cấp ${p.lv}${p.on ? ', đang online' : ''}. Chọn làm người nhận.`);
      b.addEventListener('click', () => { pick = { id: p.id, n: p.n }; drawPeople(); drawSend(); });
      li.appendChild(b); peopleBox.appendChild(li);
    }
  }
  function drawSend() {
    const k = curKind(), h = have(), n = curQty(), c = costOf(k, n);
    for (const id in kindBtns) kindBtns[id].classList.toggle('on', id === kind);
    toLine.textContent = pick ? `Gửi cho: ${pick.n}` : 'Chưa chọn người nhận.';
    const mx = maxQty(k, h);
    info.textContent = k.gem
      ? `Mua tặng: ${k.gia} lá bồ đề mỗi cái, người nhận được thêm ${k.giay / 60} phút tác dụng. Bạn có ${fmtNum(h.la)} lá bồ đề.`
      : `Bạn có ${fmtNum(k.id === 'sen' ? h.sen : h.la)} ${k.don}. Tối đa ${k.cap} mỗi lần.`;
    bMax.disabled = mx < 1; bMinus.disabled = n <= 1; bPlus.disabled = n >= k.cap;
    go.disabled = sending || !pick || n < 1 || !canAfford(c, h);
    go.textContent = sending ? 'Đang gửi…' : (n >= 1 && pick ? `Gửi ${qtyText(k.id, n)}${k.gem ? ` (−${c.la} lá)` : ''}` : 'Gửi quà');
    if (!sending && pick && n >= 1 && !canAfford(c, h)) setStatus(`Chưa đủ ${k.gem || k.id === 'la' ? 'lá bồ đề' : 'hạt sen'} để gửi.`);
  }
  qtyIn.addEventListener('input', () => { status.dataset.err = ''; setStatus(''); drawSend(); });
  qtyIn.addEventListener('change', () => { qtyIn.value = String(Math.max(1, curQty())); drawSend(); });
  bMinus.addEventListener('click', () => { qtyIn.value = String(Math.max(1, curQty() - 1)); setStatus(''); drawSend(); });
  bPlus.addEventListener('click', () => { qtyIn.value = String(Math.min(curKind().cap, Math.max(1, curQty() + 1))); setStatus(''); drawSend(); });
  bMax.addEventListener('click', () => { qtyIn.value = String(Math.max(1, maxQty(curKind(), have()))); setStatus(''); drawSend(); });
  search.addEventListener('input', drawPeople);

  async function loadPeople() {
    if (!apiEnabled()) { drawPeople(); return; }
    const my = ++peopleSeq;
    try { if (LGT.rank && LGT.rank.push) await LGT.rank.push(); } catch (_) { /* gửi điểm lỗi: vẫn xem được danh sách */ }   // đưa mình vào bảng xếp hạng (máy chủ chỉ cho người đã có trong bảng gửi quà)
    const res = cleanList(await callApi('getRank', { ...who(), limit: 50 }));
    if (my !== peopleSeq || box.hidden) return;
    if (res) { people = res.top; meId = res.me ? res.me.id : ''; }
    drawPeople();
  }

  async function send() {
    if (sending) return;
    const k = curKind(), n = curQty(), c = costOf(k, n), note = cleanNote(noteIn.value);
    if (!pick) { setStatus('Hãy chọn người nhận.'); return; }
    if (n < 1) { setStatus('Số lượng chưa đúng.'); return; }
    if (!canAfford(c, have())) { drawSend(); return; }
    if (!apiEnabled()) { setStatus(errText('api_disabled')); return; }
    sending = true; status.dataset.err = ''; setStatus('Đang gửi…'); drawSend();
    if (!take(c)) { sending = false; setStatus('Chưa trừ được quà trong ví, thử lại nhé.'); drawSend(); return; }
    const cid = uuid(), body = { ...who(), to: pick.id, kind: k.id, qty: n, note, cid };
    let r = await callApi('giftSend', body);
    if (isNetError(r)) r = await callApi('giftSend', body);   // cùng cid: nếu lần đầu thực ra đã tới máy chủ thì máy chủ trả lại kết quả cũ, không gửi đôi
    sending = false;
    if (r && r.ok) {
      setStatus(''); noteIn.value = ''; qtyIn.value = '1';
      toast(`Đã gửi ${qtyText(k.id, n)} cho ${pick.n}.`, 3500);
      if (LGT.act) { try { LGT.act('guiqua'); } catch (_) { /* nhiệm vụ chưa có loại này: bỏ qua */ } }
    } else {
      giveBack(c);   // quà chưa tới người nhận: trả lại ví
      status.dataset.err = '1'; setStatus(errText(r && r.error));
    }
    drawSend();
  }
  go.addEventListener('click', send);

  // ---------- Hộp quà ----------
  const updateBadge = () => { const n = gifts.length; dot.hidden = n < 1; dot.textContent = n > 9 ? '9+' : String(n); pill.classList.toggle('has', n > 0); tIn.textContent = n ? `Hộp quà (${n})` : 'Hộp quà'; };
  function drawInbox() {
    inList.textContent = '';
    inEmpty.textContent = gifts.length ? '' : (apiEnabled() ? 'Hộp quà đang trống. Quà bạn bè gửi sẽ hiện ở đây.' : errText('api_disabled'));
    inAll.hidden = gifts.length < 2;
    for (const g of gifts) {
      const li = el('li', 'gf-g'), b = el('button', 'gf-b', 'Nhận'); b.type = 'button'; b.addEventListener('click', () => claim([g.id]));
      li.append(el('span', null, giftLine(g)), b); inList.appendChild(li);
    }
  }
  const canGet = (g) => !(kindById(g.kind) || {}).gem || !!(LGT.items && LGT.items.state);   // bánh cần hệ vật phẩm đã sẵn sàng mới cộng được
  async function pollInbox(silent) {
    if (!apiEnabled() || hud.hidden) return;
    const r = cleanInbox(await callApi('giftInbox', who()));
    if (!r) return;
    const before = new Set(gifts.map((g) => g.id)), fresh = r.filter((g) => !before.has(g.id));
    gifts = r; updateBadge(); if (!box.hidden && tab === 'in') drawInbox();
    if (fresh.length && !silent && (box.hidden || tab !== 'in')) toast(`Bạn có ${fresh.length} quà mới! Bấm 🎁 để nhận.`, 4500);
  }
  function applyGems(gems) {
    const it = LGT.items; if (!it || !it.state) return;
    for (const id of Object.keys(gems)) { const next = grantGem(it.state, id, gems[id]); it.state.exp = { ...it.state.exp, ...next }; }   // cộng thẳng vào bảng hạn dùng đang chạy (chip hạn dùng vẽ lại sau ≤0,5 giây)
    try { localStorage.setItem(ITEMS_KEY, JSON.stringify(it.state)); } catch (_) { /* chế độ riêng tư */ }
  }
  async function claim(ids) {
    if (claiming) return;
    const want = gifts.filter((g) => ids.includes(g.id) && canGet(g)).map((g) => g.id);
    if (!want.length) { toast('Chưa nhận được món này lúc này, thử lại sau nhé.', 2800); return; }
    claiming = true; inAll.disabled = true;
    const r = await callApi('giftClaim', { ...who(), ids: want });
    claiming = false; inAll.disabled = false;
    if (!r || !r.ok) { toast(errText(r && r.error), 3200); return; }
    const plan = claimPlan(r.got);
    if (plan.sen > 0 && LGT.addMerit) LGT.addMerit(plan.sen);
    if (plan.la > 0 && LGT.merit && LGT.merit.addLa) LGT.merit.addLa(plan.la);
    if (Object.keys(plan.gems).length) applyGems(plan.gems);
    const names = [];
    if (plan.sen) names.push(qtyText('sen', plan.sen)); if (plan.la) names.push(qtyText('la', plan.la));
    for (const id of Object.keys(plan.gems)) names.push(qtyText(id, plan.gems[id]));
    if (plan.n) toast(`Đã nhận quà: ${names.join(', ')}.`, 4200); else toast('Quà này đã được nhận rồi.', 2800);
    const got = new Set((r.got || []).map((g) => g && g.id)); gifts = gifts.filter((g) => !got.has(g.id) && !want.includes(g.id));
    updateBadge(); drawInbox();
    pollInbox(true);
  }
  inAll.addEventListener('click', () => claim(gifts.filter(canGet).slice(0, 20).map((g) => g.id)));

  // ---------- mở/đóng ----------
  function show(t) { tab = t; tSend.classList.toggle('on', t === 'send'); tIn.classList.toggle('on', t === 'in'); vSend.hidden = t !== 'send'; vIn.hidden = t !== 'in'; if (t === 'send') drawSend(); else drawInbox(); }
  tSend.addEventListener('click', () => { show('send'); loadPeople(); });
  tIn.addEventListener('click', () => { show('in'); pollInbox(true); });
  function open(opts = {}) {
    if (LGT.panelOpen) return;
    if (opts && opts.to && /^[0-9a-f]{12}$/.test(String(opts.to.id))) pick = { id: String(opts.to.id), n: String(opts.to.n || 'Bạn') };
    box.hidden = false; show(opts && opts.tab === 'in' ? 'in' : 'send'); drawPeople(); loadPeople(); pollInbox(true);
    x.focus({ preventScroll: true });
  }
  function close() { box.hidden = true; peopleSeq++; }
  x.addEventListener('click', close);
  pill.addEventListener('click', () => (box.hidden ? open({ tab: gifts.length ? 'in' : 'send' }) : close()));

  // nhịp hỏi hộp quà nền (kể cả khi bảng đóng) để hiện chấm đỏ
  setTimeout(() => pollInbox(false), 9000); setInterval(() => pollInbox(false), POLL_MS);

  LGT.gift = { open, close, toggle: () => (box.hidden ? open() : close()), refresh: () => pollInbox(true), get isOpen() { return !box.hidden; }, get unread() { return gifts.length; } };
  return LGT.gift;
}
