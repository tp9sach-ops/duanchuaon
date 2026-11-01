// Hành tinh: bầu trời hôm nay (cung, nghịch hành, góc chiếu) và vị trí lúc sinh nếu có hồ sơ.
import { viTriHanhTinh } from '../engines/planets.js';
import { jdFromUTC } from '../engines/astro.js';
import { birthUTC } from '../engines/zodiac.js';
import { birthInfo } from '../engines/personal.js';
import { sapXayRa } from '../engines/eclipse.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getProfile = () => { try { return JSON.parse(localStorage.getItem('lgt.profile') || 'null'); } catch (_) { return null; } };

const tbl = (r) => `<table class="ch-tbl pl-tbl"><tbody>${r.planets.map((p) => `<tr><th>${p.kyHieu} ${esc(p.ten)}</th><td>${esc(p.cung)} ${p.do.toFixed(0)}°</td><td>${p.nghich ? '<span class="pl-r">nghịch hành</span>' : ''}</td></tr>`).join('')}</tbody></table>`;
const aspects = (r, n = 6) => r.goc.length ? `<ul class="ch-list">${r.goc.slice(0, n).map((g) => `<li>${esc(g.a)} ${esc(g.ten.toLowerCase())} ${esc(g.b)} <i>(lệch ${g.lech}°; ${esc(g.y)})</i></li>`).join('')}</ul>` : '<p class="ch-note">Không có góc chiếu chặt trong lúc này.</p>';

const gioVN = (jd) => { const d = new Date((jd - 2440587.5) * 86400000 + 7 * 3600000), p = (n) => String(n).padStart(2, '0'); return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} lúc ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`; };
function eclipseCard() {
  const list = sapXayRa(jdFromUTC(Date.now()), 900).slice(0, 4);
  return `<article class="ch-card"><p class="ch-k">Nhật thực và Nguyệt thực sắp tới</p>${list.length ? `<ul class="ch-list">${list.map((e) => `<li><b>${e.loai === 'nhat' ? 'Nhật thực' : 'Nguyệt thực'} ${esc(e.kieu)}</b> · ${gioVN(e.jd)} (giờ Việt Nam, lúc cực đại gần đúng)${e.satNguong ? ' <i>sát ngưỡng phân loại</i>' : ''}</li>`).join('')}</ul>` : '<p class="ch-note">Không có lần nào trong khoảng hai năm tới.</p>'}
    <p class="ch-note">Chỉ phân loại thô từ vĩ độ Mặt Trăng; chưa tính vùng nhìn thấy (nhật thực chỉ thấy ở một số nơi trên Trái Đất). Hãy kiểm tra lại với cơ quan thiên văn trước khi lên kế hoạch quan sát.</p></article>`;
}

export function initPlanets(root = document.getElementById('planets-app')) {
  if (!root) return;
  const render = () => {
    const now = viTriHanhTinh(jdFromUTC(Date.now()));
    const nghich = now.planets.filter((p) => p.nghich).map((p) => p.ten);
    const p = getProfile(), b = p ? birthInfo(p) : null;
    let natal = '<article class="ch-card ch-empty"><p class="ch-k">Hành tinh lúc sinh</p><p>Lưu ngày sinh ở chương Hôm nay để xem vị trí các hành tinh khi bạn chào đời.</p></article>';
    if (b && b.ok) {
      const r = viTriHanhTinh(jdFromUTC(birthUTC(b.solar.dd, b.solar.mm, b.solar.yy, b.gio)));
      natal = `<article class="ch-card"><p class="ch-k">Hành tinh lúc sinh</p>${tbl(r)}${aspects(r)}${b.gio < 0 ? '<p class="ch-note">Chưa có giờ sinh nên tính theo 12h trưa; Mặt Trăng có thể lệch tới vài cung.</p>' : ''}</article>`;
    }
    root.innerHTML = `
    <div class="ch-head"><p class="ch-k">Hành tinh</p><h3 class="ch-h">Bầu trời các hành tinh</h3></div>
    <div class="ch-grid2">
      <article class="ch-card"><p class="ch-k">Hôm nay</p>${tbl(now)}${aspects(now)}
        <p class="ch-note">${nghich.length ? `Đang nghịch hành: ${esc(nghich.join(', '))}. Nghịch hành là chuyển động biểu kiến ngược của hành tinh khi nhìn từ Trái Đất; truyền thống chiêm tinh coi đó là lúc nên rà soát hơn là khởi sự.` : 'Hiện chưa hành tinh nào nghịch hành.'}</p></article>
      ${natal}
    </div>
    ${eclipseCard()}
    <p class="ch-note">Vị trí tính theo yếu tố quỹ đạo gần đúng (sai số nhỏ hơn 1 độ), hệ nhiệt đới. Chưa có các góc chiếu phụ. Nội dung mang tính tham khảo, giải trí.</p>`;
  };
  document.addEventListener('lgt:profile', render);
  render();
}
