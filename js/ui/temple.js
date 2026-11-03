// Chương "Chùa online": thắp nhang, gõ mõ / rung chuông / niệm 108, xin xăm, tường nguyện (lưu trong trình duyệt).
import { rutXam, tongKetNhang, thapNhang, SO_QUE, kiemTraNguyen } from '../engines/temple.js';
import { callApi, apiEnabled, getUserKey } from '../api.js';
import { drawReading, TOPICS } from '../engines/iching.js';   // 64 quẻ Kinh Dịch (nguồn Ô Long Viện, MIT; xem THIRD_PARTY.md)
import { drawXam } from '../engines/xam36.js';                 // 36 thẻ xăm thơ (cùng nguồn)

const K_NHANG = 'lgt.nhang', K_NIEM = 'lgt.niem', K_NGUYEN = 'lgt.nguyen', K_XAM = 'lgt.xam', K_IC = 'lgt.iching', K_XT = 'lgt.xam36';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (_) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* bỏ qua */ } };

import { moSound, bellSound } from './sound.js';   // âm thanh dùng chung với màn Tụng kinh / Tràng hạt
const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initTemple() {
  const root = document.getElementById('temple-app'); if (!root) return;
  let nhang = load(K_NHANG, {}), niem = load(K_NIEM, { dem: 0, vong: 0 }), nguyen = load(K_NGUYEN, []), xam = load(K_XAM, null), ic = load(K_IC, null), xt = load(K_XT, null), chuDe = '';
  let nen = 0, timer = null;

  root.innerHTML = `
  <div class="tp-grid">
    <section class="tp-box" aria-labelledby="tp-h1">
      <h3 id="tp-h1">Thắp nhang</h3>
      <div class="tp-censer" id="tp-censer" aria-live="polite"></div>
      <div class="tp-row" role="group" aria-label="Số nén nhang">
        <button class="t-btn" data-n="1">1 nén</button><button class="t-btn" data-n="3">3 nén</button><button class="t-btn" data-n="9">9 nén</button>
      </div>
      <p class="tp-note" id="tp-sonhang"></p>
    </section>
    <section class="tp-box" aria-labelledby="tp-h2">
      <h3 id="tp-h2">Mõ, chuông, niệm 108</h3>
      <div class="tp-beads" id="tp-beads" aria-hidden="true"></div>
      <p class="tp-big"><b id="tp-dem">0</b><span> / 108</span></p>
      <div class="tp-row">
        <button class="t-btn" id="tp-mo">Gõ mõ</button><button class="t-btn" id="tp-chuong">Rung chuông</button><button class="t-btn" id="tp-reset">Làm lại</button>
      </div>
      <p class="tp-note" id="tp-vong"></p>
    </section>
    <section class="tp-box" aria-labelledby="tp-h3">
      <h3 id="tp-h3">Xin xăm</h3>
      <p class="tp-note">Khấn trong lòng điều bạn băn khoăn, rồi bấm rút xăm. Lời xăm do dự án soạn để chiêm nghiệm, không phải xăm cổ và không thay thế tư vấn chuyên môn.</p>
      <div class="tp-row"><button class="t-btn" id="tp-xam">Rút xăm</button></div>
      <div class="tp-xam" id="tp-xam-out" aria-live="polite"></div>
    </section>
    <section class="tp-box tp-iching" aria-labelledby="tp-h5">
      <h3 id="tp-h5">Gieo quẻ Kinh Dịch</h3>
      <p class="tp-note">Chọn điều bạn muốn hỏi, giữ lòng thành rồi gieo. Lời quẻ để chiêm nghiệm, không thay thế tư vấn chuyên môn.</p>
      <div class="ic-topics" role="radiogroup" aria-label="Chủ đề muốn hỏi">
        <button type="button" role="radio" aria-checked="true" data-k="">Chung</button>${Object.entries(TOPICS).map(([k, v]) => `<button type="button" role="radio" aria-checked="false" data-k="${k}">${esc(v)}</button>`).join('')}
      </div>
      <div class="tp-row"><button class="t-btn" id="tp-gieo">Gieo quẻ</button><button class="t-btn" id="tp-xamtho">Rút xăm thơ</button></div>
      <div id="tp-ic-out" aria-live="polite"></div>
      <div id="tp-xt-out" aria-live="polite"></div>
      <p class="tp-note">Nội dung quẻ và xăm tham khảo từ dự án mã nguồn mở Ô Long Viện (giấy phép MIT).</p>
    </section>
    <section class="tp-box" aria-labelledby="tp-h4">
      <h3 id="tp-h4">Tường nguyện</h3>
      <form id="tp-form" class="tp-row">
        <input id="tp-in" maxlength="120" placeholder="Một điều bạn nguyện (ẩn danh)" aria-label="Điều nguyện" autocomplete="off">
        <button class="t-btn" type="submit">Gửi nguyện</button>
      </form>
      ${apiEnabled() ? '<label class="vs-consent"><input type="checkbox" id="tp-share"> Cũng đăng lên tường chung (ẩn danh, ai cũng đọc được)</label>' : ''}
      <p class="tp-note" id="tp-msg" aria-live="polite"></p>
      <ul class="tp-wall" id="tp-wall"></ul>
      <p class="tp-note">Điều nguyện của bạn lưu trong trình duyệt, có thể xóa từng dòng. Chỉ khi bạn tick, điều nguyện mới được đăng ẩn danh lên tường chung.</p>
      ${apiEnabled() ? '<p class="ch-k">Tường chung</p><ul class="tp-wall" id="tp-shared"><li class="tp-empty">Đang tải…</li></ul>' : ''}
    </section>
  </div>`;
  const $ = (s) => root.querySelector(s);

  const drawCenser = () => {
    const c = $('#tp-censer');
    const sticks = Array.from({ length: nen }, (_, i) => { const x = 50 + (i - (nen - 1) / 2) * 11; return `<i class="tp-stick" style="left:${x}%"><u></u>${quiet() ? '' : '<s></s><s></s>'}</i>`; }).join('');
    c.innerHTML = `${sticks}<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M14 18h92l-8 30a12 12 0 0 1-12 9H34a12 12 0 0 1-12-9z" fill="#8a5a2b" stroke="#d9b25f"/><ellipse cx="60" cy="18" rx="46" ry="6" fill="#2a1a0c" stroke="#d9b25f"/></svg>`;
  };
  const drawNhang = () => {
    const t = tongKetNhang(nhang);
    $('#tp-sonhang').textContent = t.tong ? `Hôm nay ${t.homNay} nén · tổng ${t.tong} nén · chuỗi ${t.chuoi} ngày (dài nhất ${t.chuoiDai}).` : 'Sổ nhang còn trống. Thắp nén đầu tiên.';
  };
  root.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => {
    const n = +b.dataset.n; nhang = thapNhang(nhang, n); save(K_NHANG, nhang); nen = n; drawCenser(); drawNhang(); bellSound();
    clearTimeout(timer); timer = setTimeout(() => { nen = 0; drawCenser(); }, 60000);   // nhang tàn sau 1 phút
  }));

  const beads = $('#tp-beads'); beads.innerHTML = Array.from({ length: 108 }, () => '<i></i>').join('');
  const drawNiem = () => {
    $('#tp-dem').textContent = niem.dem;
    [...beads.children].forEach((b, i) => b.classList.toggle('on', i < niem.dem));
    $('#tp-vong').textContent = niem.vong ? `Đã niệm đủ ${niem.vong} vòng 108.` : 'Mỗi tiếng mõ là một hạt. Đủ 108 sẽ có tiếng chuông.';
  };
  $('#tp-mo').addEventListener('click', () => {
    moSound(); niem.dem++;
    if (niem.dem >= 108) { niem.dem = 0; niem.vong++; setTimeout(bellSound, 250); }
    save(K_NIEM, niem); drawNiem();
  });
  $('#tp-chuong').addEventListener('click', bellSound);
  $('#tp-reset').addEventListener('click', () => { niem = { dem: 0, vong: niem.vong }; save(K_NIEM, niem); drawNiem(); });

  const showXam = () => {
    const o = $('#tp-xam-out');
    o.innerHTML = xam ? `<div class="tp-que"><small>Quẻ số ${xam.so} / ${SO_QUE}</small><b>${esc(xam.muc)}</b><p>${esc(xam.loi)}</p><p class="tp-note">${esc(xam.ghi)}</p></div>` : '';
  };
  $('#tp-xam').addEventListener('click', () => { xam = rutXam(); save(K_XAM, xam); bellSound(); showXam(); });

  // --- Gieo quẻ Kinh Dịch + xăm thơ 36 thẻ
  const lvClass = (l) => ({ 'Đại Cát': 'dc', 'Cát': 'c', 'Trung Cát': 'tc', 'Bình': 'b', 'Hung': 'h' }[l] || 'b');
  const topicHtml = (t) => (t ? `<p class="ic-topic"><b>${esc(t.label)}:</b> ${esc(t.text)}</p>` : '');
  const showIc = (animate) => {
    const o = $('#tp-ic-out'); if (!ic) { o.innerHTML = ''; return; }
    const bars = [...ic.lines].map((v, i) => `<i class="${v ? 'y' : 'n'}" style="--d:${animate && !quiet() ? i * 0.28 : 0}s"><u></u><u></u></i>`).reverse().join('');   // hào 1 ở dưới cùng
    o.innerHTML = `<div class="ic-card"><div class="ic-head"><div class="ic-glyph" aria-hidden="true">${esc(ic.glyph)}</div><div><small>Quẻ số ${ic.number} / 64</small><b>${esc(ic.name)}</b><span class="ic-lv ${lvClass(ic.level)}">${esc(ic.level)}</span></div></div>
      <div class="ic-bars" role="img" aria-label="Sáu hào từ dưới lên: ${ic.lines.map((v) => (v ? 'dương' : 'âm')).join(', ')}">${bars}</div>
      <p class="tp-note">Thượng quái ${esc(ic.upper)} (${esc(ic.upperImage)}) · Hạ quái ${esc(ic.lower)} (${esc(ic.lowerImage)})</p>
      <p class="ic-judg">${esc(ic.judgment)}</p><p>${esc(ic.meaning)}</p>${topicHtml(ic.topic)}<p class="tp-note"><b>Lời khuyên:</b> ${esc(ic.advice)}</p></div>`;
  };
  const showXt = () => {
    const o = $('#tp-xt-out'); if (!xt) { o.innerHTML = ''; return; }
    o.innerHTML = `<div class="ic-card"><div class="ic-head"><div><small>Xăm thơ số ${xt.number} / ${xt.total}</small><b>${esc(xt.name)}</b><span class="ic-lv ${lvClass(xt.level)}">${esc(xt.level)}</span></div></div>
      <p class="ic-poem">${xt.poem.map(esc).join('<br>')}</p><p>${esc(xt.meaning)}</p>${topicHtml(xt.topic)}<p class="tp-note"><b>Lời khuyên:</b> ${esc(xt.advice)}</p></div>`;
  };
  root.querySelector('.ic-topics').addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]'); if (!b) return; chuDe = b.dataset.k;
    root.querySelectorAll('.ic-topics [data-k]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  });
  const chuDeText = () => (chuDe ? TOPICS[chuDe] : '');
  $('#tp-gieo').addEventListener('click', () => { ic = drawReading(chuDeText()); save(K_IC, ic); bellSound(); showIc(true); });
  $('#tp-xamtho').addEventListener('click', () => { xt = drawXam(chuDeText()); save(K_XT, xt); moSound(); showXt(); });

  const drawWall = () => {
    $('#tp-wall').innerHTML = nguyen.length
      ? nguyen.map((w, i) => `<li><span>${esc(w)}</span><button class="tp-x" data-i="${i}" aria-label="Xóa điều nguyện">×</button></li>`).join('')
      : '<li class="tp-empty">Chưa có điều nguyện nào.</li>';
  };
  $('#tp-form').addEventListener('submit', (e) => {
    e.preventDefault(); const c = kiemTraNguyen($('#tp-in').value), msg = $('#tp-msg');
    if (!c.ok) { msg.textContent = { empty: '', no_links: 'Không đưa đường dẫn hoặc email vào điều nguyện.', no_numbers: 'Không đưa số điện thoại hoặc dãy số dài vào điều nguyện.' }[c.error] || ''; return; }
    msg.textContent = '';
    nguyen = [c.text, ...nguyen].slice(0, 30); save(K_NGUYEN, nguyen); $('#tp-in').value = ''; drawWall();
    const share = $('#tp-share');
    if (share && share.checked) {
      callApi('addPrayer', { userKey: getUserKey(), noiDung: c.text, congKhai: true }).then((r) => {
        msg.textContent = r.ok ? 'Đã đăng lên tường chung.' : (r.error === 'rate_limited' ? 'Hôm nay bạn đã đăng đủ 5 điều nguyện lên tường chung.' : 'Chưa đăng được lên tường chung, nhưng điều nguyện đã lưu trong trình duyệt của bạn.');
        if (r.ok) loadShared();
      });
    }
  });
  $('#tp-wall').addEventListener('click', (e) => { const b = e.target.closest('.tp-x'); if (!b) return; nguyen.splice(+b.dataset.i, 1); save(K_NGUYEN, nguyen); drawWall(); });

  async function loadShared() {
    const ul = $('#tp-shared'); if (!ul) return;
    const r = await callApi('listPrayers');
    ul.innerHTML = r.ok && r.items && r.items.length ? r.items.slice(0, 30).map((w) => `<li><span>${esc(String(w.noiDung).slice(0, 120))}</span><small>${esc(String(w.ngay).slice(0, 10))}</small></li>`).join('') : `<li class="tp-empty">${r.ok ? 'Tường chung chưa có điều nguyện nào.' : 'Chưa tải được tường chung.'}</li>`;
  }
  drawCenser(); drawNhang(); drawNiem(); showXam(); showIc(false); showXt(); drawWall(); loadShared();
}
