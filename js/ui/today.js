// Chương "Hôm nay": lịch Âm, Can Chi, bói ngày chung, vòng 12 giờ. Điểm ngày chỉnh MOOD của cảnh 3D.
import { analyzeDay } from '../engines/dayscore.js';
import { hourToChi } from '../engines/canchi.js';

const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function arc(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map((v) => v.toFixed(2)).join(' ');
  return `M${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z`;
}

function ringSvg(gio, nowChi) {
  const cx = 120, cy = 120, segs = gio.map((g) => {
    const mid = (g.chi * 30 - 90) * Math.PI / 180, a0 = mid - Math.PI / 12 + 0.012, a1 = mid + Math.PI / 12 - 0.012;
    const tx = cx + 86 * Math.cos(mid), ty = cy + 86 * Math.sin(mid) + 4;
    return `<g class="seg ${g.hoang ? 'hd' : 'hc'}${g.chi === nowChi ? ' now' : ''}" data-chi="${g.chi}" tabindex="0" role="button" aria-label="Giờ ${g.ten}, ${g.khoang}, ${g.hoang ? 'Hoàng đạo' : 'Hắc đạo'}">
      <path d="${arc(cx, cy, 62, 108, a0, a1)}"/><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle">${g.ten}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 240 240" class="hour-ring" role="group" aria-label="Vòng mười hai giờ">${segs}<text x="120" y="116" text-anchor="middle" class="rc1">12 giờ</text><text x="120" y="134" text-anchor="middle" class="rc2">vàng = Hoàng đạo</text></svg>`;
}

function scoreRing(score) {
  const C = 2 * Math.PI * 44;
  return `<svg viewBox="0 0 100 100" class="score-ring" aria-hidden="true"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" class="fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - score / 100)).toFixed(1)}" transform="rotate(-90 50 50)"/></svg>`;
}

const moodWord = (s) => (s >= 70 ? 'Ngày thuận, hợp khởi sự việc đã chuẩn bị kỹ.' : s >= 55 ? 'Ngày khá ổn, làm việc đều tay.' : s >= 42 ? 'Ngày trung bình, nên chọn việc vừa sức.' : 'Ngày nên chậm lại, ưu tiên việc nhẹ và tĩnh tâm.');

function render(root, r, today) {
  const { solar: s, lunar: l, canChi: c } = r;
  const nowChi = today && s.dd === today.getDate() && s.mm === today.getMonth() + 1 && s.yy === today.getFullYear() ? hourToChi(today.getHours()) : -1;
  const first = r.gio.find((g) => g.chi === nowChi) || r.gio.find((g) => g.hoang);
  root.querySelector('.t-out').innerHTML = `
  <div class="t-grid">
    <div class="t-date">
      <div class="t-big">${pad(s.dd)}</div>
      <div class="t-sub">Tháng ${s.mm} · ${s.yy}<br>${s.thu}</div>
    </div>
    <div class="t-lunar">
      <div class="k">Âm lịch</div>
      <div class="v">${l.day} tháng ${l.month}${l.leap ? ' nhuận' : ''} · năm ${esc(c.nam.name)}</div>
      <dl class="t-dl">
        <div><dt>Ngày</dt><dd>${esc(c.ngay.name)} <i>${esc(c.ngay.napAm)}</i></dd></div>
        <div><dt>Tháng</dt><dd>${esc(c.thang.name)} <i>${esc(c.thang.napAm)}</i></dd></div>
        <div><dt>Năm</dt><dd>${esc(c.nam.name)} <i>${esc(c.nam.napAm)}</i></dd></div>
        <div><dt>Tiết khí</dt><dd>${esc(r.tietKhi.ten)}${r.tietKhi.batDau ? ' <i>(bắt đầu hôm nay)</i>' : ''}</dd></div>
        <div><dt>Trực</dt><dd>${esc(r.truc.ten)}</dd></div>
        <div><dt>Sao (Tú)</dt><dd>${esc(r.tu.ten)} <i>${esc(r.tu.hanh)}</i></dd></div>
        <div><dt>Thần ngày</dt><dd>${esc(r.thanNgay.ten)} <i>${r.thanNgay.hoang ? 'Hoàng đạo' : 'Hắc đạo'}</i></dd></div>
      </dl>
      ${r.flags.length ? `<ul class="t-flags">${r.flags.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="t-score">
      <div class="score-wrap">${scoreRing(r.diem)}<span class="score-num" data-to="${r.diem}">${r.diem}</span></div>
      <p class="t-mood">${moodWord(r.diem)}</p>
    </div>
    <div class="t-hours">
      ${ringSvg(r.gio, nowChi)}
      <p class="t-hour-info" aria-live="polite"></p>
    </div>
    <div class="t-todo">
      <div><h4>Nên làm</h4><ul>${r.nen.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div><h4>Nên tránh</h4><ul>${r.ky.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>Không có điều kỵ nổi bật</li>'}</ul></div>
      <p class="t-banh">Bành Tổ: ${esc(c.ngay.canName)} — ${esc(r.banhTo.can)}; ${esc(c.ngay.chiName)} — ${esc(r.banhTo.chi)}.</p>
    </div>
    <details class="t-trace">
      <summary>Dấu vết suy luận</summary>
      <table><tbody>${r.trace.map((t) => `<tr><th>${esc(t.ten)}</th><td class="${t.diem >= 0 ? 'p' : 'n'}">${t.diem > 0 && t.ten !== 'Điểm nền' ? '+' : ''}${t.diem}</td><td>${esc(t.vi)}</td></tr>`).join('')}
      <tr class="sum"><th>Tổng (giới hạn 0–100)</th><td>${r.diem}</td><td></td></tr></tbody></table>
      <p class="t-note">Sao (Tú) hiện chỉ hiển thị, chưa tính điểm vì mỗi sách xếp cát/hung khác nhau. Sát chủ và Thọ tử chưa đưa vào vì chưa có bảng tra đáng tin; sẽ thêm khi có nguồn.</p>
    </details>
  </div>`;
  const info = root.querySelector('.t-hour-info');
  const show = (g) => { info.innerHTML = `<b>Giờ ${esc(g.ten)}</b> (${esc(g.khoang)}) · ${esc(g.canChi)} · ${esc(g.than)} · <span class="${g.hoang ? 'hd' : 'hc'}">${g.hoang ? 'Hoàng đạo' : 'Hắc đạo'}</span>`; };
  show(first);
  const pick = (el) => { const g = r.gio[+el.dataset.chi]; if (g) show(g); };
  root.querySelectorAll('.seg').forEach((el) => {
    el.addEventListener('click', () => pick(el)); el.addEventListener('mouseenter', () => pick(el)); el.addEventListener('focus', () => pick(el));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(el); } });
  });
  // Đếm điểm lên
  const num = root.querySelector('.score-num');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const t0 = performance.now(), to = r.diem;
    const step = (t) => { const k = Math.min(1, (t - t0) / 900); num.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  // Báo cho phần hồ sơ biết ngày đang chọn
  document.dispatchEvent(new CustomEvent('lgt:day', { detail: { r } }));
  // Cảnh 3D đổi tông theo điểm (chỉ khi cảnh đã dựng)
  try { if (window.LGT && typeof window.LGT.setMood === 'function') window.LGT.setMood(r.mood); } catch (_) { /* bỏ qua */ }
}

export async function initToday(root = document.getElementById('today-app')) {
  if (!root) return;
  root.innerHTML = `
    <div class="t-bar">
      <button type="button" class="t-btn" data-act="prev" aria-label="Ngày trước">‹</button>
      <label class="t-pick"><span class="sr">Chọn ngày dương</span><input type="date" class="t-date-in" min="1900-01-01" max="2100-12-31"></label>
      <button type="button" class="t-btn" data-act="next" aria-label="Ngày sau">›</button>
      <button type="button" class="t-btn wide" data-act="today">Hôm nay</button>
    </div>
    <div class="t-out" aria-live="polite"><p class="t-load">Đang mở lịch…</p></div>
    <p class="t-disc">Nội dung mang tính tham khảo, giải trí và chiêm nghiệm văn hóa, không thay thế tư vấn y tế, pháp lý, tài chính.</p>`;
  let K;
  try {
    const res = await fetch(new URL('../data/knowledge.json', import.meta.url));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    K = await res.json();
  } catch (e) {
    root.querySelector('.t-out').innerHTML = '<p class="t-load">Chưa tải được bảng tra lịch. Hãy thử tải lại trang.</p>';
    console.warn('[Diệu Giang Tự] knowledge.json:', e && e.message); return;
  }
  const input = root.querySelector('.t-date-in');
  const go = (iso) => {
    const { y, m, d } = parseIso(iso);
    if (!y || y < 1900 || y > 2100) return;
    input.value = iso;
    try { render(root, analyzeDay(d, m, y, K), new Date()); }
    catch (e) { root.querySelector('.t-out').innerHTML = '<p class="t-load">Không tính được ngày này.</p>'; console.warn(e); }
  };
  const shift = (n) => { const { y, m, d } = parseIso(input.value); go(isoOf(new Date(y, m - 1, d + n))); };
  root.querySelector('.t-bar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    ({ prev: () => shift(-1), next: () => shift(1), today: () => go(isoOf(new Date())) })[b.dataset.act]();
  });
  input.addEventListener('change', () => input.value && go(input.value));
  go(isoOf(new Date()));
}
