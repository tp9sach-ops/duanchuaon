// Lá bồ đề (Phiên 35, bước 1 hệ thống xây nhà): thẻ số lá cạnh hạt sen, bảng đổi 10 hạt sen = 1 lá (mở khi thưa chuyện với Thầy Tri khách),
// và thưởng hạt sen khi ngồi thiền (3 phút = 1 hạt, tối đa 10/ngày). Logic ở js/world/merit.js (có test). Mọi chữ qua textContent.
import { loadLeaf, exchange, maxLa, addMeditation, SEN_PER_LA, LAND_LA, DAILY_CAP } from '../world/merit.js';

const KEY = 'lgt.la';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** opts: { toast(text, ms), addMerit(n), getSen(), spendSen(n)→bool, pillHost }. Đặt LGT.merit = { open, close, get leaf, get spent }. */
export function initMerit(hud, { toast = () => {}, addMerit = () => {}, getSen = () => 0, spendSen = () => false, pillHost = null } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let leaf = loadLeaf(null); try { leaf = loadLeaf(localStorage.getItem(KEY)); } catch (_) { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(leaf)); } catch (_) { /* chế độ riêng tư */ } };

  const pill = el('span', 'hm-pill mr-pill'); pill.title = `Lá bồ đề: ${SEN_PER_LA} hạt sen đổi 1 lá. ${LAND_LA} lá mua một lô đất (sắp có).`;
  const pillN = el('b', null, '0'), pillT = el('span', null, ' lá'); pill.append(pillN, pillT); if (pillHost) pillHost.appendChild(pill);

  const box = el('section', 'mr-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Đổi lá bồ đề');
  const head = el('header'), h = el('h3', null, 'Đổi lá bồ đề'), x = el('button', 'mr-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(h, x);
  const have = el('p', 'mr-have'), btns = el('div', 'mr-btns'), note = el('p', 'mr-note');
  const mk = (label, n) => { const b = el('button', 'mr-b', label); b.type = 'button'; b.addEventListener('click', () => doExchange(typeof n === 'function' ? n() : n)); return b; };
  const b1 = mk(`Đổi 1 lá (${SEN_PER_LA} sen)`, 1), b5 = mk(`Đổi 5 lá (${5 * SEN_PER_LA} sen)`, 5), bMax = mk('Đổi tối đa', () => maxLa(getSen()));
  btns.append(b1, b5, bMax);
  note.textContent = `Hạt sen kiếm từ nhiệm vụ, tụng kinh, ngồi thiền (3 phút được 1 hạt, tối đa ${DAILY_CAP.thien} hạt mỗi ngày). ${LAND_LA} lá bồ đề mua được một lô đất để dựng nhà (tính năng đang làm). Giá trị tạm của bản thử.`;
  box.append(head, have, btns, note); hud.appendChild(box);

  function draw() {
    const sen = getSen(), m = maxLa(sen);
    pillN.textContent = String(leaf.la);
    have.textContent = `Bạn có ${sen} hạt sen và ${leaf.la} lá bồ đề.`;
    b1.disabled = m < 1; b5.disabled = m < 5; bMax.disabled = m < 1; bMax.textContent = m >= 1 ? `Đổi tối đa (${m} lá)` : 'Đổi tối đa';
  }
  function doExchange(n) {
    const r = exchange(leaf, getSen(), n);
    if (!r.ok) { toast(r.reason === 'poor' ? `Chưa đủ hạt sen: cần ${r.cost} hạt.` : 'Số lá không hợp lệ.', 2800); return; }
    if (!spendSen(r.cost)) { toast('Chưa đủ hạt sen.', 2500); return; }
    leaf = r.leaf; save(); draw(); toast(`Đã đổi ${n} lá bồ đề (trừ ${r.cost} hạt sen).`, 3200);
  }
  const open = () => { draw(); box.hidden = false; (b1.disabled ? x : b1).focus({ preventScroll: true }); };
  const close = () => { box.hidden = true; };
  x.addEventListener('click', close);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });

  // ngồi thiền được hạt sen (nguồn có trần mỗi ngày)
  let last = Date.now();
  setInterval(() => {
    const now = Date.now(), dt = (now - last) / 1000; last = now;
    const W = LGT.world; if (!W || W.mode !== 'meditate' || document.hidden) return;
    const r = addMeditation(leaf, dt, now); leaf = r.leaf; save();
    if (r.sen) { addMerit(r.sen); toast(`Ngồi thiền yên tĩnh: +${r.sen} hạt sen.`, 2800); }
    if (!box.hidden) draw();
  }, 1000);

  LGT.merit = { open, close, get leaf() { return leaf; }, get spent() { return leaf.spent; } };
  draw();
  return LGT.merit;
}
