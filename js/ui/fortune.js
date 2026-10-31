// Chương "Vận trình": tab Tháng (lịch tô màu điểm + 3 ngày đẹp), tab Năm (biểu đồ 12 tháng + lưu niên), tab Đường đời (Đại vận, đỉnh cao).
import { analyzeDay } from '../engines/dayscore.js';
import { analyzePersonal, birthInfo } from '../engines/personal.js';
import { jdFromDate, dayOfWeek } from '../engines/lunar.js';
import { analyzeBatu, daiVan, luuNien } from '../engines/batu.js';
import { pinnacles } from '../engines/numerology.js';

const KEY = 'lgt.profile';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getProfile = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } };
const dim = (m, y) => new Date(y, m, 0).getDate();
const tone = (s) => (s >= 62 ? 'good' : s < 42 ? 'low' : 'mid');

export async function initFortune(root = document.getElementById('fortune-app')) {
  if (!root) return;
  let K, P;
  try {
    const rd = async (f) => { const r = await fetch(new URL('../data/' + f, import.meta.url)); if (!r.ok) throw new Error(f + ' HTTP ' + r.status); return r.json(); };
    [K, P] = await Promise.all([rd('knowledge.json'), rd('personal.json')]);
  } catch (e) { root.innerHTML = '<p class="t-load">Chưa tải được bảng tra. Hãy thử tải lại trang.</p>'; console.warn('[Diệu Giang Tự]', e && e.message); return; }

  const now = new Date();
  const st = { tab: 'thang', y: now.getFullYear(), m: now.getMonth() + 1, goal: 'chung', pick: now.getDate(), cache: {} };
  const goals = Object.entries(P.mucTieu).filter(([k]) => k !== 'diemNen' && k !== 'diemKy');

  // Điểm một ngày: có hồ sơ hợp lệ → điểm cá nhân theo mục tiêu; không → điểm chung
  const dayInfo = (d, m, y, prof, ok) => {
    const k = `${y}-${m}-${d}|${ok ? st.goal : '-'}|${ok ? [prof.ngay, prof.thang, prof.nam, prof.loaiLich].join('/') : ''}`;
    if (st.cache[k]) return st.cache[k];
    const day = analyzeDay(d, m, y, K), per = ok ? analyzePersonal(day, prof, P, st.goal) : null;
    return (st.cache[k] = { day, per, diem: per && per.ok ? per.diem : day.diem });
  };

  function tabThang(prof, ok) {
    const { y, m } = st, n = dim(m, y), off = (dayOfWeek(jdFromDate(1, m, y)) + 6) % 7;
    const rows = []; for (let d = 1; d <= n; d++) rows.push({ d, ...dayInfo(d, m, y, prof, ok) });
    const best = [...rows].sort((a, b) => b.diem - a.diem || a.d - b.d).slice(0, 3);
    const cells = Array(off).fill('<i class="fo-pad"></i>').join('') + rows.map((r) =>
      `<button type="button" class="fo-cell ${tone(r.diem)}${r.d === st.pick ? ' sel' : ''}" data-d="${r.d}" aria-label="Ngày ${r.d}, điểm ${r.diem}">
        <b>${r.d}</b><small>${r.day.lunar.day}${r.day.lunar.day === 1 ? '/' + r.day.lunar.month : ''}</small><em>${r.diem}</em></button>`).join('');
    const sel = rows[Math.min(Math.max(st.pick, 1), n) - 1], dt = sel.per && sel.per.ok ? sel.per : sel.day;
    const trace = dt.trace.map((t) => `<li><span>${esc(t.ten)}</span><b class="${t.diem > 0 ? 'p' : t.diem < 0 ? 'n' : ''}">${t.diem > 0 ? '+' : ''}${t.diem}</b></li>`).join('');
    return `
    <div class="fo-bar">
      <button type="button" class="t-btn" data-act="pm" aria-label="Tháng trước">‹</button><strong class="fo-ttl">Tháng ${m}/${y}</strong><button type="button" class="t-btn" data-act="nm" aria-label="Tháng sau">›</button>
      <label class="fo-goal">Mục đích<select data-act="goal">${goals.map(([k, g]) => `<option value="${k}"${k === st.goal ? ' selected' : ''}>${esc(g.ten)}</option>`).join('')}</select></label>
    </div>
    ${ok ? '' : '<p class="ch-note">Chưa có hồ sơ: đang hiện điểm chung của từng ngày. Lưu ngày sinh ở chương Hôm nay để có điểm theo tuổi và theo mục đích.</p>'}
    <div class="fo-dow" aria-hidden="true">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x) => `<span>${x}</span>`).join('')}</div>
    <div class="fo-grid">${cells}</div>
    <div class="fo-two">
      <article class="ch-card"><p class="ch-k">Ba ngày đẹp nhất · ${esc(P.mucTieu[st.goal].ten)}</p>
        <ol class="fo-best">${best.map((r) => `<li><button type="button" data-d="${r.d}"><b>Ngày ${r.d}/${m}</b><span>Âm ${r.day.lunar.day}/${r.day.lunar.month} · ${esc(r.day.canChi.ngay.name)}</span><em>${r.diem}</em></button></li>`).join('')}</ol>
        <p class="ch-note">Điểm đã tính theo Trực, thần ngày, Sao${ok ? ', tuổi của bạn và mục đích đã chọn' : ''}. Hãy chọn ngày hợp với lịch thực tế của bạn.</p></article>
      <article class="ch-card"><p class="ch-k">Dấu vết suy luận · ngày ${sel.d}/${m}</p>
        <h4>${esc(sel.day.canChi.ngay.name)} · Trực ${esc(sel.day.truc.ten)} · ${sel.diem}/100</h4><ul class="fo-trace">${trace}</ul></article>
    </div>`;
  }

  function tabNam(prof, ok) {
    const y = st.y, rows = [];
    for (let m = 1; m <= 12; m++) { let s = 0; const n = dim(m, y); for (let d = 1; d <= n; d++) s += dayInfo(d, m, y, prof, ok).diem; rows.push(Math.round(s / n)); }
    const W = 560, H = 190, px = (i) => 36 + i * ((W - 60) / 11), py = (v) => H - 28 - (v - 30) / 50 * (H - 56);
    const line = rows.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join('');
    const svg = `<svg viewBox="0 0 ${W} ${H}" class="fo-chart" role="img" aria-label="Điểm trung bình mười hai tháng năm ${y}">
      <line x1="30" x2="${W - 14}" y1="${py(50)}" y2="${py(50)}" class="mid"/>${rows.map((v, i) => `<text x="${px(i)}" y="${H - 8}" text-anchor="middle">${i + 1}</text>`).join('')}
      <path d="${line}" class="ln"/>${rows.map((v, i) => `<g><circle cx="${px(i)}" cy="${py(v)}" r="4.5" class="dot ${tone(v)}"/><text x="${px(i)}" y="${py(v) - 10}" text-anchor="middle" class="val">${v}</text></g>`).join('')}</svg>`;
    let ln = '<article class="ch-card ch-empty"><p class="ch-k">Lưu niên</p><p>Lưu ngày sinh (và giới tính, giờ sinh nếu có) ở chương Hôm nay để xem Can Chi năm, Tam tai, Thái tuế, Kim lâu và nhận xét theo Bát tự.</p></article>';
    if (ok) {
      const b = birthInfo(prof), bt = analyzeBatu(b.solar.dd, b.solar.mm, b.solar.yy, b.gio), l = luuNien(y, b.lunar.year, bt);
      ln = `<article class="ch-card"><p class="ch-k">Lưu niên ${y} · tuổi mụ ${l.tuoiMu}</p><h4>${esc(l.canChi.name)} · ${l.diem}/100</h4>
        <p>${l.flags.length ? l.flags.map((f) => `<span class="fo-flag">${esc(f)}</span>`).join(' ') : 'Năm không rơi vào các mốc cần lưu ý.'}</p>
        <ul class="fo-trace">${l.trace.map((t) => `<li><span>${esc(t.ten)}</span><b class="${t.diem > 0 ? 'p' : t.diem < 0 ? 'n' : ''}">${t.diem > 0 ? '+' : ''}${t.diem}</b></li>`).join('')}</ul>
        <p class="ch-note">Cửu diệu và Hoang ốc chưa đưa vào vì cần bảng tra đã đối chiếu. Dụng thần ở đây là ước lượng sơ bộ.</p></article>`;
    }
    return `<div class="fo-bar"><button type="button" class="t-btn" data-act="py" aria-label="Năm trước">‹</button><strong class="fo-ttl">Năm ${y}</strong><button type="button" class="t-btn" data-act="ny" aria-label="Năm sau">›</button>
      <label class="fo-goal">Mục đích<select data-act="goal">${goals.map(([k, g]) => `<option value="${k}"${k === st.goal ? ' selected' : ''}>${esc(g.ten)}</option>`).join('')}</select></label></div>
      <article class="ch-card">${svg}<p class="ch-note">Mỗi điểm là trung bình điểm các ngày trong tháng dương lịch. Chênh nhau vài điểm là bình thường, đừng đọc quá sâu.</p></article>${ln}`;
  }

  function tabDoi(prof, ok) {
    if (!ok) return '<article class="ch-card ch-empty"><p class="ch-k">Đường đời</p><p>Cần ngày sinh để vẽ dòng thời gian. Mở mục “Xem theo tuổi của bạn” ở chương Hôm nay, nhập ngày sinh và bấm lưu.</p></article>';
    const b = birthInfo(prof), W = 600, x = (age) => 20 + Math.min(Math.max(age, 0), 90) / 90 * (W - 40);
    const dv = daiVan(b.solar.dd, b.solar.mm, b.solar.yy, prof.gioiTinh, 8), pk = pinnacles(b.solar.dd, b.solar.mm, b.solar.yy);
    const age = new Date().getFullYear() - b.solar.yy;
    const band = (a, c, y0, h, cls, label) => `<g><rect x="${x(a)}" y="${y0}" width="${Math.max(2, x(c) - x(a) - 2)}" height="${h}" class="${cls}"/><text x="${(x(a) + x(c)) / 2}" y="${y0 + h / 2 + 4}" text-anchor="middle">${esc(label)}</text></g>`;
    const bands = dv.ok ? dv.van.map((v, i) => band(v.tuTuoi, v.denTuoi, 40, 36, i % 2 ? 'b1' : 'b2', v.name)).join('') : '';
    const peaks = pk.dinh.map((d, i) => band(d.tu, d.den == null ? 90 : d.den, 100, 30, i % 2 ? 'b3' : 'b4', 'Số ' + d.so)).join('');
    const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((a) => `<text x="${x(a)}" y="156" text-anchor="middle" class="tk">${a}</text>`).join('');
    const svg = `<svg viewBox="0 0 ${W} 170" class="fo-line" role="img" aria-label="Dòng thời gian 0 đến 90 tuổi">
      <text x="20" y="30" class="lb">Đại vận (Bát tự, 10 năm một vận)</text>${bands}<text x="20" y="92" class="lb">Bốn đỉnh cao (Thần số học)</text>${peaks}${ticks}
      <line x1="${x(age)}" x2="${x(age)}" y1="30" y2="140" class="now"/></svg>`;
    const vanList = dv.ok ? `<table class="ch-tbl"><tbody>${dv.van.map((v) => `<tr><th>${v.tuTuoi}–${v.denTuoi} tuổi</th><td>${esc(v.name)}</td><td>${esc(v.thapThan)}</td><td>${esc(v.napAm)}</td></tr>`).join('')}</tbody></table>
      <p class="ch-note">Đại vận đi ${dv.thuan ? 'thuận' : 'nghịch'}; khởi vận lúc ${dv.tuoiKhoiVan} tuổi (cứ 3 ngày tính một năm). Tuổi ở đây là tuổi tròn theo dương lịch.</p>`
      : `<p class="ch-note">${esc(dv.loi)} Chọn giới tính trong hồ sơ để thấy các Đại vận.</p>`;
    return `<article class="ch-card">${svg}<p class="ch-note">Vạch dọc là tuổi hiện tại (${age}). Hai dải cho hai cách nhìn khác nhau, không cần khớp với nhau.</p></article>
      <article class="ch-card"><p class="ch-k">Đại vận</p>${vanList}</article>`;
  }

  const render = () => {
    const prof = getProfile(), b = prof ? birthInfo(prof) : null, ok = !!(b && b.ok);
    const tabs = [['thang', 'Tháng'], ['nam', 'Năm'], ['doi', 'Đường đời']];
    const body = st.tab === 'thang' ? tabThang(prof, ok) : st.tab === 'nam' ? tabNam(prof, ok) : tabDoi(prof, ok);
    root.innerHTML = `<div class="fo-tabs" role="tablist">${tabs.map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === st.tab}" class="${k === st.tab ? 'on' : ''}" data-tab="${k}">${t}</button>`).join('')}</div>${body}
      <p class="t-disc">Nội dung mang tính tham khảo, giải trí và chiêm nghiệm văn hóa, không thay thế tư vấn y tế, pháp lý, tài chính.</p>`;
  };
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]'); if (t) { st.tab = t.dataset.tab; return render(); }
    const d = e.target.closest('[data-d]'); if (d) { st.pick = +d.dataset.d; return render(); }
    const a = e.target.closest('[data-act]'); if (!a) return;
    ({ pm: () => { st.m--; if (st.m < 1) { st.m = 12; st.y--; } }, nm: () => { st.m++; if (st.m > 12) { st.m = 1; st.y++; } }, py: () => st.y--, ny: () => st.y++ })[a.dataset.act]?.();
    if (a.dataset.act !== 'goal') { st.pick = 1; render(); }
  });
  root.addEventListener('change', (e) => { if (e.target.dataset.act === 'goal') { st.goal = e.target.value; render(); } });
  document.addEventListener('lgt:profile', render);
  render();
}
