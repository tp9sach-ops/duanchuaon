// Bát tự (Tứ trụ) trong chương Lá số: 4 cột, tàng can, Thập thần, ngũ hành, thân vượng/nhược, Dụng thần sơ bộ.
import { analyzeBatu } from '../engines/batu.js';
import { birthInfo } from '../engines/personal.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getProfile = () => { try { return JSON.parse(localStorage.getItem('lgt.profile') || 'null'); } catch (_) { return null; } };
const COT = { gio: 'Trụ giờ', ngay: 'Trụ ngày', thang: 'Trụ tháng', nam: 'Trụ năm' };
const HC = { Mộc: '#6fc4a8', Hỏa: '#e08a6a', Thổ: '#d9b25f', Kim: '#cfd5e6', Thủy: '#6b8cc9' };

export function initBatu(root = document.getElementById('batu-app')) {
  if (!root) return;
  const render = () => {
    const p = getProfile(), b = p ? birthInfo(p) : null;
    if (!b || !b.ok) { root.innerHTML = '<article class="ch-card ch-empty"><p class="ch-k">Bát tự</p><p>Lưu ngày sinh (nên có giờ sinh) ở chương Hôm nay để lập bốn trụ.</p></article>'; return; }
    const r = analyzeBatu(b.solar.dd, b.solar.mm, b.solar.yy, b.gio);
    const cols = [...r.hang].map((h) => `<div class="bt-col${h.cot === 'ngay' ? ' me' : ''}"><p class="ch-k">${COT[h.cot]}</p>
      <div class="bt-can">${esc(h.tru.canName)}</div><small>${esc(h.canThapThan)}</small>
      <div class="bt-chi">${esc(h.tru.chiName)}</div><small>${esc(h.tru.napAm)}</small>
      <ul class="bt-tang">${h.tang.map((t) => `<li><span>${esc(t.ten)}</span><i>${esc(t.thapThan)}</i></li>`).join('')}</ul></div>`).join('');
    const bars = r.nguHanh.map((h) => `<div class="bt-bar"><span>${h.hanh}</span><i style="width:${Math.max(3, h.phanTram)}%;background:${HC[h.hanh]}"></i><b>${h.phanTram}%</b></div>`).join('');
    root.innerHTML = `
    <div class="ch-head"><p class="ch-k">Bát tự (Tứ trụ)</p><h3 class="ch-h">Nhật chủ ${esc(r.hang.find((h) => h.cot === 'ngay').tru.canName)} · ${r.vuong ? 'thân vượng' : 'thân nhược'}</h3></div>
    <div class="bt-cols">${cols}</div>
    <div class="ch-grid2">
      <article class="ch-card"><p class="ch-k">Ngũ hành thịnh suy</p>${bars}<p class="ch-note">Tính từ Can lộ và Tàng can; tháng sinh được nhân hệ số ${1.5} vì là lệnh tháng.</p></article>
      <article class="ch-card"><p class="ch-k">Dụng thần sơ bộ</p><h4>${esc(r.dungThan)}</h4><p>Hành nên bồi: <b>${esc(r.dungThan)}</b>. Hành đang dư: ${esc(r.hanhKy.join(', '))}.</p>
        <p class="ch-note">Đây là ước lượng theo thân vượng/nhược, mang tính tham khảo. Bát tự đầy đủ còn xét cách cục, hợp xung hình hại và vận, vì thế chưa thể thay cho thầy.</p></article>
    </div>
    <article class="ch-card"><p class="ch-k">Dấu vết suy luận</p><ul class="ch-list">${r.trace.map((t) => `<li>${esc(t)}</li>`).join('')}<li>Quy ước: năm đổi ở Lập xuân, tháng theo tiết khí, giờ Tý sớm (23h–1h tính cùng ngày).</li></ul></article>`;
  };
  document.addEventListener('lgt:profile', render);
  render();
}
