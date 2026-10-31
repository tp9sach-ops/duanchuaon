// Tử vi đẩu số (sơ bộ) trong chương Lá số: lá số 12 cung, Tứ hóa, Đại hạn.
import { lapLaSo } from '../engines/tuvi.js';
import { birthInfo } from '../engines/personal.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getProfile = () => { try { return JSON.parse(localStorage.getItem('lgt.profile') || 'null'); } catch (_) { return null; } };
// Vị trí lưới 4×4 cho từng chi (0=Tý): Tỵ Ngọ Mùi Thân / Thìn . . Dậu / Mão . . Tuất / Dần Sửu Tý Hợi
const POS = { 5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4], 4: [2, 1], 9: [2, 4], 3: [3, 1], 10: [3, 4], 2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4] };

export function initTuvi(root = document.getElementById('tuvi-app')) {
  if (!root) return;
  const render = () => {
    const p = getProfile(), b = p ? birthInfo(p) : null;
    if (!b || !b.ok) { root.innerHTML = '<article class="ch-card ch-empty"><p class="ch-k">Tử vi đẩu số</p><p>Lưu ngày sinh và giờ sinh ở chương Hôm nay để lập lá số.</p></article>'; return; }
    const ls = lapLaSo({ lunar: b.lunar, gio: b.gio, gioiTinh: p.gioiTinh });
    if (!ls) { root.innerHTML = '<article class="ch-card ch-empty"><p class="ch-k">Tử vi đẩu số</p><p>Cần giờ sinh để an cung Mệnh và Thân. Hãy chọn giờ sinh trong hồ sơ.</p></article>'; return; }
    const cells = ls.cung.map((c) => {
      const [r, k] = POS[c.chi];
      const sao = c.sao.map((s) => `<li>${esc(s.ten)}${s.hoa ? `<em>${esc(s.hoa.replace('Hóa ', ''))}</em>` : ''}</li>`).join('') || '<li class="tv-none">Vô chính diệu</li>';
      return `<div class="tv-cell${c.chucVu === 'Mệnh' ? ' menh' : ''}${c.laThan ? ' than' : ''}" style="grid-row:${r};grid-column:${k}">
        <p class="tv-h"><b>${esc(c.chucVu)}${c.laThan ? ' · Thân' : ''}</b><span>${esc(c.can)} ${esc(c.chiName)}</span></p><ul>${sao}</ul>${c.daiHan ? `<p class="tv-dh">${c.daiHan[0]}–${c.daiHan[1]}</p>` : ''}</div>`;
    }).join('');
    root.innerHTML = `
    <div class="ch-head"><p class="ch-k">Tử vi đẩu số (sơ bộ)</p><h3 class="ch-h">Mệnh tại ${esc(ls.cung[ls.menh].chiName)} · ${esc(ls.tenCuc)}</h3></div>
    <div class="tv-board" role="group" aria-label="Lá số tử vi 12 cung">${cells}
      <div class="tv-mid"><p class="ch-k">Thông tin</p><p>${esc(b.namSinh.name)}${p.gioiTinh ? ' · ' + (p.gioiTinh === 'nam' ? 'Nam' : 'Nữ') : ''}</p><p>Cục: ${esc(ls.tenCuc)}</p>${ls.thuan == null ? '' : `<p>Đại hạn đi ${ls.thuan ? 'thuận' : 'nghịch'}</p>`}<p class="tv-hoa">${ls.tuHoa.map(esc).join('<br>')}</p></div>
    </div>
    <p class="ch-note">Mới an Mệnh, Thân, Cục, 14 chính tinh và Tứ hóa. Chưa có phụ tinh, độ miếu hãm và Tiểu hạn, nên chưa thể luận đoán đầy đủ.${ls.nhuanSangThang ? ' Sinh tháng nhuận sau ngày 15 được tính sang tháng kế (quy ước thông dụng).' : ''}${ls.thuan == null ? ' Chọn giới tính trong hồ sơ để tính Đại hạn.' : ''}</p>`;
  };
  document.addEventListener('lgt:profile', render);
  render();
}
