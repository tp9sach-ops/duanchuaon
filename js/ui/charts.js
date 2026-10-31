// Chương "Lá số": Thần số học + Cung hoàng đạo + Bầu trời hôm nay (Giai đoạn 4).
// Đọc hồ sơ đã lưu (localStorage 'lgt.profile'); phần "Bầu trời hôm nay" không cần hồ sơ.
import { analyzeNumerology, scoreNumerology } from '../engines/numerology.js';
import { natalSigns } from '../engines/zodiac.js';
import { jdFromUTC, dateFromJD, moonPhase, nextPhaseAt, sunLongitude } from '../engines/astro.js';
import { signIndex } from '../engines/zodiac.js';
import { birthInfo } from '../engines/personal.js';

const PROFILE_KEY = 'lgt.profile', CITY_KEY = 'lgt.noiSinhToaDo';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getJSON = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
const setStr = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* bỏ qua */ } };
const pad = (n) => String(n).padStart(2, '0');
/** Hiển thị theo giờ Việt Nam (UTC+7) bất kể múi giờ trình duyệt. */
const vn = (jd) => { const d = new Date(dateFromJD(jd).getTime() + 7 * 3600000); return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} lúc ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };

/** Hình Mặt Trăng: phần sáng theo góc pha (nhìn từ bán cầu Bắc: trăng non lớn dần sáng bên phải). */
function moonSvg(goc) {
  const R = 46, c = 54, e = goc <= 180 ? goc : 360 - goc, mirror = goc > 180;
  const rx = Math.abs(Math.cos(e * Math.PI / 180)) * R, sweep = e > 90 ? 1 : 0;
  const lit = e < 0.5 ? '' : `<path d="M${c} ${c - R} A${R} ${R} 0 0 1 ${c} ${c + R} A${rx.toFixed(2)} ${R} 0 0 ${sweep} ${c} ${c - R}Z" fill="#f1dba0"/>`;
  const full = e > 179.5 ? `<circle cx="${c}" cy="${c}" r="${R}" fill="#f1dba0"/>` : '';
  return `<svg class="ch-moon" viewBox="0 0 108 108" role="img" aria-label="Hình Mặt Trăng hôm nay"><circle cx="${c}" cy="${c}" r="${R}" fill="#10142a" stroke="rgba(232,234,242,.25)"/><g${mirror ? ` transform="translate(${2 * c} 0) scale(-1 1)"` : ''}>${full || lit}</g></svg>`;
}

/** Bánh xe 12 cung: 0° Bạch Dương ở bên trái, các cung đi ngược chiều kim đồng hồ. */
function wheelSvg(Z, marks) {
  const cx = 160, cy = 160, R1 = 146, R2 = 100;
  const pt = (lon, r) => { const a = (180 + lon) * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  const col = { 'Lửa': '#e08a6a', 'Đất': '#d9b25f', 'Khí': '#8fb0e6', 'Nước': '#6fc4a8' };
  let g = `<circle cx="${cx}" cy="${cy}" r="${R1}" fill="rgba(13,16,32,.55)" stroke="rgba(232,234,242,.28)"/><circle cx="${cx}" cy="${cy}" r="${R2}" fill="none" stroke="rgba(232,234,242,.18)"/>`;
  Z.cung.forEach((s, i) => {
    const [x1, y1] = pt(i * 30, R2), [x2, y2] = pt(i * 30, R1), [gx, gy] = pt(i * 30 + 15, (R1 + R2) / 2);
    g += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(232,234,242,.18)"/>`;
    g += `<text x="${gx.toFixed(1)}" y="${(gy + 7).toFixed(1)}" text-anchor="middle" font-size="22" fill="${col[s.hanh]}"><title>${esc(s.ten)}</title>${s.kyHieu}</text>`;
  });
  marks.forEach((m) => {
    const [x, y] = pt(m.lon, m.r);
    g += `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="#06070d" stroke="${m.color}" stroke-width="1.5"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" font-size="${m.small ? 10 : 15}" fill="${m.color}">${m.glyph}<title>${esc(m.title)}</title></text></g>`;
  });
  return `<svg class="ch-wheel" viewBox="0 0 320 320" role="img" aria-label="Bánh xe 12 cung hoàng đạo">${g}</svg>`;
}

function skyBlock(Z) {
  const now = Date.now(), jd = jdFromUTC(now), ph = moonPhase(jd, Z);
  const nFull = nextPhaseAt(jd, 180), nNew = nextPhaseAt(jd, 0);
  const sun = Z.cung[signIndex(sunLongitude(jd))];
  const nextTxt = [[nNew, 'Trăng non kế tiếp'], [nFull, 'Trăng tròn kế tiếp']].filter((x) => x[0]).sort((a, b) => a[0] - b[0])
    .map(([j, t]) => `<div><dt>${t}</dt><dd>${vn(j)}</dd></div>`).join('');
  return `
  <article class="ch-card ch-sky">
    <div class="ch-moonbox">${moonSvg(ph.goc)}</div>
    <div>
      <p class="ch-k">Bầu trời hôm nay</p>
      <h3 class="ch-h">${esc(ph.ten)}</h3>
      <p class="ch-sub">${ph.phanTramSang.toFixed(0)}% sáng · tuổi trăng ${ph.tuoi.toFixed(1)} ngày · Mặt Trời đang ở cung ${esc(sun.ten)} ${sun.kyHieu}</p>
      <dl class="ch-dl">${nextTxt}</dl>
      <p class="ch-note">Thời điểm tính theo giờ Việt Nam; sai số vài phút. Ngày Rằm và mùng Một âm lịch thường rơi gần trăng tròn và trăng non.</p>
    </div>
  </article>`;
}

function numBlock(r, N, name) {
  const so = (n) => N.so[String(n)] || { ten: '', y: '', luuY: '', tuKhoa: '' };
  const card = (k, n, key) => n == null ? '' : `
    <article class="ch-num"><div class="ch-big">${n}</div><div><p class="ch-k">${esc(k)}</p><h4>${esc(so(n).ten)}</h4>
    <p>${esc(so(n).y)}</p><p class="ch-note">${esc(so(n).luuY)}</p><p class="ch-def">${esc(N.chiSo[key])}</p></div></article>`;
  const cells = [[3, 6, 9], [2, 5, 8], [1, 4, 7]].map((row) => row.map((d) => {
    const c = r.mui.dem[d];
    return `<td class="${c ? 'on' : ''}" title="Số ${d}: ${c} lần">${c ? String(d).repeat(c) : '·'}</td>`;
  }).join('')).map((x) => `<tr>${x}</tr>`).join('');
  const mui = r.mui.co.map((a) => `<li><b>${esc(a.ten)}</b> (${a.so.join('-')}): ${esc(a.co)}</li>`).join('');
  const trong = r.mui.trong.map((a) => `<li><b>${esc(a.ten)}</b> (${a.so.join('-')}): ${esc(a.trong)}</li>`).join('');
  const tuoi = (x) => x.den == null ? `từ ${x.tu} tuổi` : `${x.tu}–${x.den} tuổi`;
  const peaks = r.dinCao.dinh.map((d, i) => `<tr><th>Đỉnh cao ${i + 1}</th><td>${tuoi(d)}</td><td>${d.so}</td><th>Thử thách ${i + 1}</th><td>${r.dinCao.thuThach[i].so}</td></tr>`).join('');
  const cy = r.chuKy;
  return `
  <div class="ch-head"><p class="ch-k">Thần số học</p><h3 class="ch-h">${name ? esc(name) : 'Các con số của bạn'}</h3></div>
  <div class="ch-nums">
    ${card('Số đường đời', r.duongDoi, 'duongDoi')}${card('Số sứ mệnh', r.suMenh, 'suMenh')}${card('Số linh hồn', r.linhHon, 'linhHon')}
    ${card('Số nhân cách', r.nhanCach, 'nhanCach')}${card('Số ngày sinh', r.ngaySinh, 'ngaySinh')}${card('Số thái độ', r.thaiDo, 'thaiDo')}
  </div>
  ${r.suMenh == null ? '<p class="ch-note">Nhập họ tên trong hồ sơ để xem thêm số sứ mệnh, linh hồn, nhân cách và các số còn thiếu.</p>' : ''}
  <div class="ch-grid2">
    <article class="ch-card"><p class="ch-k">Chu kỳ cá nhân hôm nay</p>
      <div class="ch-cyc"><div><span>${cy.nam}</span>năm</div><div><span>${cy.thang}</span>tháng</div><div><span>${cy.ngay}</span>ngày</div></div>
      <p>${esc(N.chuKy.nam[String(cy.nam)])}</p><p class="ch-note">${esc(N.chuKy.ngay)}</p>
      ${r.thieu ? `<p class="ch-note">Số chưa xuất hiện trong tên: ${r.thieu.length ? r.thieu.join(', ') : 'không có'}.</p>` : ''}
    </article>
    <article class="ch-card"><p class="ch-k">Biểu đồ mũi tên Pythagoras</p>
      <table class="ch-arrow" aria-label="Lưới 3×3 các chữ số trong ngày sinh"><tbody>${cells}</tbody></table>
      <ul class="ch-list">${mui || '<li>Chưa có mũi tên đầy đủ.</li>'}</ul>
      ${trong ? `<p class="ch-note">Mũi tên trống (điểm cần rèn):</p><ul class="ch-list">${trong}</ul>` : ''}
    </article>
  </div>
  <article class="ch-card"><p class="ch-k">Bốn đỉnh cao và thử thách</p>
    <table class="ch-tbl"><tbody>${peaks}</tbody></table>
    <p class="ch-note">Đỉnh cao đầu kết thúc ở tuổi 36 trừ số đường đời; mỗi đỉnh sau kéo dài 9 năm. Đây là cách tính Pythagoras thông dụng, các trường phái có thể khác.</p>
  </article>`;
}

function zodBlock(z, Z) {
  const info = (k, p) => !p ? `<article class="ch-sign off"><p class="ch-k">${k}</p><h4>Chưa tính được</h4></article>` : `
    <article class="ch-sign"><p class="ch-k">${k}</p><h4>${p.cung.kyHieu} ${esc(p.cung.ten)}</h4>
    <p class="ch-sub">Hành ${esc(p.cung.hanh)} · ${esc(p.cung.kieu)} · ${p.do.toFixed(0)}°</p><p>${esc(p.cung.y)}</p></article>`;
  const marks = [{ lon: z.matTroi.lon, r: 80, glyph: '☉', color: '#f1dba0', title: 'Mặt Trời' }, { lon: z.matTrang.lon, r: 58, glyph: '☽', color: '#cfd6ea', title: 'Mặt Trăng' }];
  if (z.cungMoc) marks.push({ lon: z.cungMoc.lon, r: 122, glyph: 'AC', color: '#6fc4a8', title: 'Cung Mọc', small: true });
  return `
  <div class="ch-head"><p class="ch-k">Cung hoàng đạo</p><h3 class="ch-h">Mặt Trời, Mặt Trăng và cung Mọc</h3></div>
  <div class="ch-zod">
    <div class="ch-wheelbox">${wheelSvg(Z, marks)}</div>
    <div class="ch-signs">${info('Cung Mặt Trời', z.matTroi)}${info('Cung Mặt Trăng', z.matTrang)}${info('Cung Mọc', z.cungMoc)}</div>
  </div>
  <ul class="ch-list">
    ${z.matTrang.chacChan ? '' : '<li>Chưa có giờ sinh nên cung Mặt Trăng chỉ là ước lượng theo giữa trưa (Mặt Trăng đổi cung sau khoảng 2,5 ngày).</li>'}
    ${z.matTroi.satRanhGioi ? '<li>Ngày sinh sát ranh giới giữa hai cung; cần giờ sinh để chắc chắn cung Mặt Trời.</li>' : ''}
    ${z.cungMoc ? '' : '<li>Muốn tính cung Mọc, hãy chọn giờ sinh trong hồ sơ và nơi sinh bên dưới.</li>'}
  </ul>`;
}

export async function initCharts(root = document.getElementById('charts-app')) {
  if (!root) return;
  let N, Z;
  try {
    const rd = async (f) => { const r = await fetch(new URL('../data/' + f, import.meta.url)); if (!r.ok) throw new Error(f + ' HTTP ' + r.status); return r.json(); };
    [N, Z] = await Promise.all([rd('numerology.json'), rd('zodiac.json')]);
  } catch (e) { root.innerHTML = '<p class="t-load">Chưa tải được bảng tra lá số. Hãy thử tải lại trang.</p>'; console.warn('[Linh Giang Tự]', e && e.message); return; }

  const render = () => {
    const p = getJSON(PROFILE_KEY);
    const b = p ? birthInfo(p) : null;
    let body = skyBlock(Z);
    if (!b || !b.ok) {
      body += `<article class="ch-card ch-empty"><h3 class="ch-h">Mở lá số của bạn</h3>
        <p>Mở mục <b>“Xem theo tuổi của bạn”</b> ở chương Hôm nay, nhập ngày sinh (và họ tên, giờ sinh nếu có) rồi bấm lưu. Các con số và cung hoàng đạo của bạn sẽ hiện ở đây.</p>
        ${p && b && b.loi ? `<p class="ch-note">${esc(b.loi)}</p>` : ''}</article>`;
    } else {
      const t = new Date(), today = { dd: t.getDate(), mm: t.getMonth() + 1, yy: t.getFullYear() };
      const city = getJSON(CITY_KEY);
      const noi = city != null ? Z.noiSinh[city] : null;
      const r = analyzeNumerology(b.solar, p.hoTen, today, N);
      r.dinCao = r.dinhCao; // giữ tên thống nhất khi dựng HTML
      const z = natalSigns(b.solar.dd, b.solar.mm, b.solar.yy, b.gio, noi, Z);
      const sc = scoreNumerology(r, N);
      body += `
      <div class="ch-who"><span>Dương lịch ${b.solar.dd}/${b.solar.mm}/${b.solar.yy}${b.gio >= 0 ? '' : ' · chưa có giờ sinh'}</span>
        <label>Nơi sinh (để tính cung Mọc)<select data-role="city"><option value="">Không rõ</option>${Z.noiSinh.map((c, i) => `<option value="${i}"${city === i ? ' selected' : ''}>${esc(c.ten)}</option>`).join('')}</select></label></div>
      ${numBlock(r, N, p.hoTen)}
      ${zodBlock(z, Z)}
      <details class="t-trace"><summary>Dấu vết suy luận (Thần số học + Hoàng đạo)</summary>
        <table><tbody>${r.trace.concat(z.trace).map((x) => `<tr><th>${esc(x.ten)}</th><td colspan="2">${esc(x.vi)}</td></tr>`).join('')}</tbody></table>
        <p class="t-note">Độ tin cậy Hoàng đạo ${Math.round(z.doTinCay * 100)}%; Thần số học ${Math.round(sc.doTinCay * 100)}% khi quy ra điểm (bảng điểm theo số ngày cá nhân là quy ước của dự án, đang chờ đối chiếu). Cung hoàng đạo tính theo hệ nhiệt đới (Tây phương). Nội dung mang tính tham khảo, giải trí và chiêm nghiệm văn hóa.</p>
      </details>`;
    }
    root.innerHTML = body;
    const sel = root.querySelector('[data-role="city"]');
    if (sel) sel.addEventListener('change', () => { setStr(CITY_KEY, sel.value === '' ? 'null' : sel.value); render(); });
  };
  render();
  document.addEventListener('lgt:profile', render);
}
