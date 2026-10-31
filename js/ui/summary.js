// Chương "Tổng kết": thẻ "Lá bùa của bạn" gộp các môn bằng bộ tổng hợp, xuất ảnh PNG và chia sẻ.
import { analyzeDay } from '../engines/dayscore.js';
import { analyzePersonal, birthInfo } from '../engines/personal.js';
import { analyzeNumerology, scoreNumerology } from '../engines/numerology.js';
import { analyzeBatu, luuNien } from '../engines/batu.js';
import { jdFromUTC, moonPhase } from '../engines/astro.js';
import { lapLaSo, scoreTuVi } from '../engines/tuvi.js';
import { viTriHanhTinh, scoreHoangDao } from '../engines/planets.js';
import { birthUTC } from '../engines/zodiac.js';
import { synthesize, fromBoiNgay, fromLuuNien, fromThienVan, averageScores, LINH_VUC } from '../engines/synthesis.js';

const KEY = 'lgt.profile';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getProfile = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } };
const TABS = [['ngay', 'Hôm nay'], ['thang', 'Tháng này'], ['nam', 'Năm nay']];

/** Tính kết quả tổng hợp cho một khoảng thời gian. D = { K, P, N, W, Z }. */
export function compute(horizon, D, prof, now = new Date()) {
  const { K, P, N, W, Z } = D;
  const dd = now.getDate(), mm = now.getMonth() + 1, yy = now.getFullYear();
  const b = prof ? birthInfo(prof) : null, ok = !!(b && b.ok);
  const goal = (prof && prof.mucTieu) || 'chung';
  const dayVec = (d) => { const day = analyzeDay(d, mm, yy, K), per = ok ? analyzePersonal(day, prof, P, goal) : null; return { day, per, vec: fromBoiNgay(day, per, W) }; };
  const num = ok ? analyzeNumerology({ dd: b.solar.dd, mm: b.solar.mm, yy: b.solar.yy }, prof.hoTen || '', { dd, mm, yy }, N) : null;
  const numVec = (key) => { const a = { ...num, chuKy: { ...num.chuKy, ngay: num.chuKy[key] } }; return { mon: 'thanSo', ...scoreNumerology(a, N) }; };
  const inputs = []; let extras = {};
  if (horizon === 'ngay') {
    const t = dayVec(dd); inputs.push(t.vec);
    if (ok) inputs.push(numVec('ngay'));
    inputs.push(fromThienVan(moonPhase(jdFromUTC(now.getTime()), Z)));
    const src = t.per && t.per.ok ? t.per : t.day;
    extras = { nen: src.nen, ky: src.ky, gio: t.per && t.per.ok ? t.per.gioTot : t.day.gio.filter((g) => g.hoang), huong: t.per && t.per.ok ? t.per.huong : null, mau: t.per && t.per.ok ? t.per.mau : [], so: t.per && t.per.ok ? t.per.so : [] };
  } else if (horizon === 'thang') {
    const n = new Date(yy, mm, 0).getDate(), list = []; for (let d = 1; d <= n; d++) list.push(dayVec(d).vec);
    inputs.push(averageScores(list, 'boiNgay', `Trung bình ${n} ngày của tháng ${mm}`));
    if (ok) inputs.push(numVec('thang'));
  } else if (horizon === 'nam' && ok) {
    const batu = analyzeBatu(b.solar.dd, b.solar.mm, b.solar.yy, b.gio);
    inputs.push(fromLuuNien(luuNien(yy, b.lunar.year, batu), batu, W)); inputs.push(numVec('nam'));
    const tv = scoreTuVi(lapLaSo({ lunar: b.lunar, gio: b.gio, gioiTinh: prof.gioiTinh }));   // lá số gốc (chưa có Tiểu hạn theo năm)
    if (tv) inputs.push(tv);
  }
  // Hoàng đạo: hành tinh ở thời điểm xem (hôm nay / giữa tháng / giữa năm) chiếu vào Mặt Trời, Mặt Trăng lúc sinh
  if (ok) {
    const at = horizon === 'ngay' ? now.getTime() : horizon === 'thang' ? Date.UTC(yy, mm - 1, 15, 5) : Date.UTC(yy, 6, 1, 5);
    inputs.push(scoreHoangDao(viTriHanhTinh(jdFromUTC(birthUTC(b.solar.dd, b.solar.mm, b.solar.yy, b.gio))), viTriHanhTinh(jdFromUTC(at))));
  }
  const r = synthesize(horizon, inputs, W, extras);
  r.coHoSo = ok; r.ngay = { dd, mm, yy };
  return r;
}

const bar = (label, v) => `<div class="sm-bar"><span>${esc(label)}</span><i><u style="width:${Math.max(2, v)}%"></u></i><b>${v}</b></div>`;

function view(r, W, horizon) {
  if (!r.ok) return `<article class="ch-card ch-empty"><p>${esc(r.loi)} ${horizon === 'nam' ? 'Lưu ngày sinh ở chương Hôm nay để xem năm của bạn.' : ''}</p></article>`;
  const kh = W.tenKhoang[horizon], C = 2 * Math.PI * 44;
  const sig = r.tinHieu ? `<span class="sm-chip ${r.tinHieu.loai}">${esc(r.tinHieu.ten)}</span>` : '';
  const monNoi = r.monNoi.map((m) => `<tr><th>${esc(W.tenMon[m.mon])}</th><td>${m.trongSo}%</td><td>${m.tong}</td><td class="${m.huong === 'thuận' ? 'p' : m.huong === 'nhẹ tay' ? 'n' : ''}">${m.huong}</td><td>${esc(m.nhan)}</td></tr>`).join('');
  const miss = r.monThieu.length ? `<p class="ch-note">Chưa tính: ${r.monThieu.map((m) => esc(W.tenMon[m])).join(', ')} (chưa có dữ liệu hoặc chưa làm xong). Kết quả được chuẩn hóa lại theo các môn còn lại.</p>` : '';
  const li = (a) => a && a.length ? a.map((x) => `<li>${esc(x)}</li>`).join('') : '';
  const extra = horizon === 'ngay' ? `
    <div class="sm-two">
      <article class="ch-card"><p class="ch-k">Nên làm</p><ul class="ch-list">${li(r.nen) || '<li>Việc thường ngày</li>'}</ul></article>
      <article class="ch-card"><p class="ch-k">Nên tránh</p><ul class="ch-list">${li(r.ky) || '<li>Không có điều kỵ nổi bật</li>'}</ul></article>
    </div>
    <p class="sm-meta">${r.gio.length ? `<span>Giờ tốt: <b>${r.gio.map((g) => esc(g.ten)).join(', ')}</b></span>` : ''}${r.huong ? `<span>Hướng: Hỷ thần <b>${esc(r.huong.hyThan)}</b> · Tài thần <b>${esc(r.huong.taiThan)}</b></span>` : ''}${r.mau.length ? `<span>Màu: <b>${esc(r.mau.join(', '))}</b></span>` : ''}${r.so.length ? `<span>Số: <b>${esc(r.so.join(', '))}</b></span>` : ''}</p>` : '';
  return `
  <div class="sm-top">
    <div class="score-wrap"><svg viewBox="0 0 100 100" class="score-ring" aria-hidden="true"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" class="arc" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - r.diem.tong / 100)).toFixed(1)}" transform="rotate(-90 50 50)"/></svg><span class="score-num">${r.diem.tong}</span></div>
    <div><p class="ch-k">Lá bùa · ${esc(kh)} ${sig}</p><h3 class="sm-sum">${esc(r.tomTat)}</h3>
      <p class="ch-note">Độ tin cậy ước tính: ${Math.round(r.doTinCay * 100)}%${r.coHoSo ? '' : ' (chưa có hồ sơ nên chỉ dùng điểm chung)'}</p></div>
  </div>
  <div class="sm-bars">${LINH_VUC.map((k) => bar(W.tenLinhVuc[k], r.diem[k])).join('')}</div>
  <article class="ch-card"><p class="ch-k">Ba lời khuyên ưu tiên</p><ol class="sm-adv">${r.loiKhuyen.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></article>
  ${extra}
  <details class="t-trace"><summary>Các môn nói gì · dấu vết suy luận</summary>
    <table><thead><tr><th>Môn</th><td>Trọng số</td><td>Điểm</td><td>Hướng</td><td>Lý do</td></tr></thead><tbody>${monNoi}</tbody></table>
    ${miss}<p class="ch-note">Điểm tổng = trung bình có trọng số của các môn (bảng trọng số ở js/data/weights.json). "Tín hiệu mạnh" khi từ ${W.nguong.dongThuan} môn trở lên cùng thuận hoặc cùng nhẹ tay; "Cần cân nhắc" khi có môn thuận lẫn môn nhẹ tay.</p></details>
  <div class="sm-actions"><button type="button" class="t-btn wide" data-act="png">Tải thẻ ảnh</button><button type="button" class="t-btn wide" data-act="share">Chia sẻ</button></div>`;
}

function wrap(x, text, maxW) {
  const out = []; let line = '';
  text.split(/\s+/).forEach((w) => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
  if (line) out.push(line); return out;
}

/** Vẽ thẻ 1080×1350 (ảnh PNG). */
export function drawCard(r, W, horizon) {
  const w = 1080, h = 1350, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0d1226'); g.addColorStop(1, '#06070d'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const m = x.createRadialGradient(850, 210, 10, 850, 210, 230); m.addColorStop(0, 'rgba(241,219,160,.95)'); m.addColorStop(.35, 'rgba(217,178,95,.28)'); m.addColorStop(1, 'rgba(217,178,95,0)');
  x.fillStyle = m; x.fillRect(600, 0, 480, 460);
  x.strokeStyle = 'rgba(217,178,95,.55)'; x.lineWidth = 2; x.strokeRect(36, 36, w - 72, h - 72);
  const serif = '"Cormorant Garamond","Noto Serif",Georgia,serif', sans = '"Be Vietnam Pro",system-ui,sans-serif';
  x.fillStyle = '#d9b25f'; x.font = `600 34px ${sans}`; x.textBaseline = 'alphabetic';
  x.fillText('DIỆU GIANG TỰ', 90, 130);
  x.fillStyle = '#8a90a6'; x.font = `400 24px ${sans}`;
  const n = r.ngay; x.fillText(`Lá bùa ${W.tenKhoang[horizon]} · ${n.dd}/${n.mm}/${n.yy}`, 90, 176);
  x.fillStyle = '#f1dba0'; x.font = `500 250px ${serif}`; x.fillText(String(r.diem.tong), 80, 470);
  x.fillStyle = '#8a90a6'; x.font = `400 28px ${sans}`; x.fillText('trên 100', 96, 520);
  x.fillStyle = '#e8eaf2'; x.font = `500 44px ${serif}`;
  let y = 610; wrap(x, r.tomTat, w - 180).forEach((l) => { x.fillText(l, 90, y); y += 56; });
  y += 20;
  LINH_VUC.forEach((k) => {
    x.fillStyle = '#c4cadb'; x.font = `400 26px ${sans}`; x.fillText(W.tenLinhVuc[k], 90, y);
    x.fillStyle = 'rgba(232,234,242,.12)'; x.fillRect(300, y - 20, 600, 14);
    x.fillStyle = '#d9b25f'; x.fillRect(300, y - 20, 6 * r.diem[k], 14);
    x.fillStyle = '#f1dba0'; x.font = `500 26px ${sans}`; x.fillText(String(r.diem[k]), 930, y); y += 54;
  });
  y += 24; x.fillStyle = '#4aa58a'; x.font = `500 24px ${sans}`; x.fillText('BA LỜI KHUYÊN', 90, y); y += 14;
  x.fillStyle = '#e8eaf2'; x.font = `300 28px ${sans}`;
  r.loiKhuyen.forEach((t, i) => { wrap(x, `${i + 1}. ${t}`, w - 180).forEach((l) => { y += 40; x.fillText(l, 90, y); }); y += 8; });
  x.fillStyle = '#8a90a6'; x.font = `300 20px ${sans}`;
  x.fillText('Nội dung mang tính tham khảo, giải trí và chiêm nghiệm văn hóa.', 90, h - 70);
  return c;
}

export async function initSummary(root = document.getElementById('summary-app')) {
  if (!root) return;
  let D;
  try {
    const rd = async (f) => { const r = await fetch(new URL('../data/' + f, import.meta.url)); if (!r.ok) throw new Error(f + ' HTTP ' + r.status); return r.json(); };
    const [K, P, N, W, Z] = await Promise.all(['knowledge.json', 'personal.json', 'numerology.json', 'weights.json', 'zodiac.json'].map(rd));
    D = { K, P, N, W, Z };
  } catch (e) { root.innerHTML = '<p class="t-load">Chưa tải được bảng tra. Hãy thử tải lại trang.</p>'; console.warn('[Diệu Giang Tự]', e && e.message); return; }
  let tab = 'ngay', last = null;
  root.innerHTML = `<div class="sm-tabs" role="tablist">${TABS.map(([k, t]) => `<button type="button" role="tab" data-sm="${k}" class="t-btn wide">${t}</button>`).join('')}</div><div class="sm-out" aria-live="polite"></div>`;
  const out = root.querySelector('.sm-out');
  const render = () => {
    root.querySelectorAll('[data-sm]').forEach((b) => { const on = b.dataset.sm === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    try { last = compute(tab, D, getProfile()); out.innerHTML = view(last, D.W, tab); }
    catch (e) { last = null; out.innerHTML = '<p class="t-load">Không tổng hợp được. Hãy kiểm tra lại hồ sơ.</p>'; console.warn(e); return; }
    if (last.ok && tab === 'ngay') { try { window.LGT && window.LGT.setMood && window.LGT.setMood(last.mood); } catch (_) { /* bỏ qua */ } }
  };
  const blobOf = () => new Promise((res) => drawCard(last, D.W, tab).toBlob(res, 'image/png'));
  root.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-sm]'); if (t) { tab = t.dataset.sm; render(); return; }
    const a = e.target.closest('[data-act]'); if (!a || !last || !last.ok) return;
    const blob = await blobOf(); if (!blob) return;
    const file = new File([blob], 'la-bua-dieu-giang-tu.png', { type: 'image/png' });
    if (a.dataset.act === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Lá bùa · Diệu Giang Tự' }); return; } catch (_) { /* người dùng hủy → rơi xuống tải */ }
    }
    const url = URL.createObjectURL(blob), l = document.createElement('a'); l.href = url; l.download = file.name; l.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
  document.addEventListener('lgt:profile', render);
  render();
}
