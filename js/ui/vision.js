// Chương "Chỉ tay & Nhân tướng": chọn/chụp ảnh của chính mình, thu nhỏ ở máy, gửi qua GAS cho AI nhìn ảnh.
// Ảnh không được lưu: chỉ giữ trong bộ nhớ trang và bị xóa ngay khi có kết quả hoặc khi bấm xóa.
import { callApi, apiEnabled } from '../api.js';
import { chuanHoaKetQua, kichThuocThuNho, thongBaoLoi } from '../engines/vision.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KIND = { hand: { act: 'analyzeHand', ten: 'Chỉ tay', goiY: 'Chụp lòng bàn tay, mở rộng các ngón, đủ sáng, không bóng đổ.', capture: 'environment' },
               face: { act: 'analyzeFace', ten: 'Nhân tướng', goiY: 'Chụp chính diện, đủ sáng, không đeo kính râm, tóc vén khỏi trán.', capture: 'user' } };

function thuNho(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const { w, h } = kichThuocThuNho(img.naturalWidth, img.naturalHeight, 1024);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const data = c.toDataURL('image/jpeg', 0.82);
      c.width = c.height = 0;
      resolve(data.slice(data.indexOf(',') + 1));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad_image')); };
    img.src = url;
  });
}

export function initVision(root = document.getElementById('vision-app')) {
  if (!root) return;
  let kind = 'hand', busy = false;

  const draw = (ketQua, loi) => {
    const k = KIND[kind];
    root.innerHTML = `
    <div class="vs-box">
      <div class="sm-tabs" role="tablist">${Object.entries(KIND).map(([id, v]) => `<button type="button" role="tab" aria-selected="${id === kind}" class="t-btn${id === kind ? ' on' : ''}" data-k="${id}">${v.ten}</button>`).join('')}</div>
      <p class="tp-note">${esc(k.goiY)}</p>
      <label class="vs-consent"><input type="checkbox" id="vs-ok"> Đây là ảnh của chính tôi. Tôi đồng ý gửi ảnh cho AI phân tích một lần; ảnh không được lưu lại.</label>
      <div class="tp-row"><label class="t-btn vs-file" id="vs-lbl" aria-disabled="true">Chọn hoặc chụp ảnh<input id="vs-in" type="file" accept="image/*" capture="${k.capture}" hidden disabled></label></div>
      <p class="tp-note" id="vs-status" aria-live="polite">${loi ? esc(loi) : (apiEnabled() ? '' : 'Máy chủ AI chưa được cấu hình nên tính năng này đang tắt.')}</p>
      <div id="vs-out">${ketQua ? view(ketQua) : ''}</div>
    </div>`;
    const ok = root.querySelector('#vs-ok'), inp = root.querySelector('#vs-in'), lbl = root.querySelector('#vs-lbl'), st = root.querySelector('#vs-status');
    const sync = () => { const on = ok.checked && apiEnabled() && !busy; inp.disabled = !on; lbl.setAttribute('aria-disabled', String(!on)); lbl.classList.toggle('off', !on); };
    sync(); ok.addEventListener('change', sync);
    root.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { kind = b.dataset.k; draw(); }));
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; inp.value = '';
      if (!f || !ok.checked) return;
      busy = true; sync(); st.textContent = 'Đang thu nhỏ ảnh…';
      try {
        const image = await thuNho(f);
        st.textContent = 'AI đang xem ảnh, có thể mất vài giây…';
        const r = await callApi(k.act, { image, consent: true });
        const kq = r && r.ok ? chuanHoaKetQua(r.result) : null;
        busy = false;
        draw(kq, r && r.ok ? (kq ? '' : 'AI trả về kết quả không dùng được, hãy thử ảnh khác.') : thongBaoLoi(r && r.error));
      } catch (_) { busy = false; draw(null, 'Không đọc được ảnh này, hãy thử ảnh khác.'); }
    });
  };

  const view = (r) => `
    <article class="ch-card vs-res">
      ${r.chatLuongAnh === 'kem' ? '<p class="ch-note">Ảnh chưa rõ nên nhận xét dưới đây có thể thiếu chính xác.</p>' : ''}
      <p class="ch-k">${KIND[kind].ten}</p><h4>${esc(r.tongQuan)}</h4>
      <ul class="ch-list">${r.muc.map((m) => `<li><b>${esc(m.ten)}</b>: ${esc(m.quanSat)} <i>${esc(m.y)}</i></li>`).join('')}</ul>
      ${r.loiKhuyen.length ? `<p class="ch-k">Lời khuyên</p><ol class="sm-adv">${r.loiKhuyen.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
      <p class="ch-note">${esc(r.luuY)}</p>
    </article>`;
  draw();
}
