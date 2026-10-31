// Hồ sơ người dùng + bói ngày cá nhân (chương "Hôm nay"). Lưu localStorage; đồng bộ Google Sheet khi apiUrl có giá trị.
// Ảnh/dữ liệu nhạy cảm không đi qua đây. Người dùng có nút xuất, nhập và xóa toàn bộ.
import { analyzePersonal, birthInfo } from '../engines/personal.js';
import { callApi, apiEnabled, getUserKey } from '../api.js';

const KEY = 'lgt.profile';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } };
const saveLocal = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); return true; } catch (_) { return false; } };
const clearLocal = () => { try { localStorage.removeItem(KEY); } catch (_) { /* bỏ qua */ } };

export async function initProfile(root = document.getElementById('profile-app')) {
  if (!root) return;
  let P;
  try {
    const res = await fetch(new URL('../data/personal.json', import.meta.url));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    P = await res.json();
  } catch (e) { root.innerHTML = '<p class="t-load">Chưa tải được bảng tra cá nhân. Hãy thử tải lại trang.</p>'; return; }

  const goals = Object.entries(P.mucTieu).filter(([, v]) => v && v.ten);
  root.innerHTML = `
  <details class="pf" id="pf-box">
    <summary><span>Xem theo tuổi của bạn</span><i>nhập ngày sinh để tính ngày hợp hay xung với bạn</i></summary>
    <form class="pf-form" novalidate>
      <label>Họ tên<input name="hoTen" type="text" maxlength="60" autocomplete="name"></label>
      <label>Loại lịch ngày sinh
        <select name="loaiLich"><option value="duong">Dương lịch</option><option value="am">Âm lịch</option></select></label>
      <div class="pf-date">
        <label>Ngày<input name="ngay" type="number" inputmode="numeric" min="1" max="31" required></label>
        <label>Tháng<input name="thang" type="number" inputmode="numeric" min="1" max="12" required></label>
        <label>Năm<input name="nam" type="number" inputmode="numeric" min="1900" max="2100" required></label>
      </div>
      <label class="pf-leap" hidden><input name="nhuan" type="checkbox"> Tháng nhuận</label>
      <label>Giờ sinh<select name="gioSinh"><option value="">Không rõ</option>${P.gioSinh.map((g, i) => `<option value="${i}">${g}</option>`).join('')}</select></label>
      <label>Giới tính<select name="gioiTinh"><option value="">Không nêu</option><option value="nam">Nam</option><option value="nu">Nữ</option></select></label>
      <label>Nơi sinh (không bắt buộc)<input name="noiSinh" type="text" maxlength="80"></label>
      <label>Việc bạn định làm<select name="mucTieu">${goals.map(([k, v]) => `<option value="${k}">${esc(v.ten)}</option>`).join('')}</select></label>
      <div class="pf-act">
        <button type="submit" class="t-btn wide">Xem ngày này với tuổi tôi</button>
        <button type="button" class="t-btn wide" data-act="export">Xuất hồ sơ</button>
        <button type="button" class="t-btn wide" data-act="import">Nhập hồ sơ</button>
        <button type="button" class="t-btn wide pf-del" data-act="wipe">Xóa dữ liệu của tôi</button>
        <input type="file" accept="application/json" class="sr" data-role="file" tabindex="-1">
      </div>
      <p class="pf-msg" aria-live="polite"></p>
      <p class="pf-priv">Hồ sơ lưu trong trình duyệt của bạn${apiEnabled() ? ' và trên bảng tính của chủ trang (để dùng lại khi đổi máy)' : ''}. Bạn có thể xóa bất cứ lúc nào.</p>
    </form>
    <div class="pf-out" aria-live="polite"></div>
  </details>`;

  const $ = (s) => root.querySelector(s);
  const form = $('.pf-form'), out = $('.pf-out'), msg = $('.pf-msg');
  let day = null; // phân tích ngày hiện đang chọn ở phần "Hôm nay"
  const say = (t, bad) => { msg.textContent = t || ''; msg.className = 'pf-msg' + (bad ? ' bad' : ''); };
  const read = () => Object.fromEntries([...new FormData(form).entries()].map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
  const fill = (p) => { Object.entries(p || {}).forEach(([k, v]) => { const el = form.elements[k]; if (!el) return; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; }); toggleLeap(); };
  const toggleLeap = () => { $('.pf-leap').hidden = form.elements.loaiLich.value !== 'am'; };
  form.elements.loaiLich.addEventListener('change', toggleLeap);

  function show() {
    const p = read();
    if (!day) { out.innerHTML = ''; return; }
    const r = analyzePersonal(day.r, { ...p, nhuan: form.elements.nhuan.checked }, P, p.mucTieu || 'chung');
    if (!r.ok) { say(r.loi, true); out.innerHTML = ''; return; }
    say('');
    const b = r.birth, s = day.r.solar;
    out.innerHTML = `
      <div class="pf-head">
        <div><div class="k">Tuổi của bạn</div><div class="v">${esc(b.namSinh.name)} · mệnh ${esc(b.hanh)}</div>
          <div class="t-sub">${esc(b.namSinh.napAm)}${p.hoTen ? ' · ' + esc(p.hoTen) : ''} · ${r.tuoiAm} tuổi âm</div></div>
        <div class="pf-score"><span class="num">${r.diem}</span><span class="of">/ 100 cho ngày ${s.dd}/${s.mm}/${s.yy}</span></div>
      </div>
      <p class="pf-goal"><b>${esc(r.goal.ten)}.</b> ${esc(r.goal.ghiChu || 'Dùng điểm chung của ngày và tuổi.')}</p>
      <div class="t-todo">
        <div><h4>Nên làm</h4><ul>${r.nen.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h4>Nên tránh</h4><ul>${r.ky.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>Không có điều kỵ nổi bật</li>'}</ul></div>
      </div>
      <dl class="t-dl pf-dl">
        <div><dt>Giờ tốt cho bạn</dt><dd>${r.gioTot.length ? r.gioTot.map((g) => esc(g.ten) + ' <i>' + esc(g.khoang) + '</i>').join(', ') : 'Ngày này không có giờ Hoàng đạo hợp tuổi'}</dd></div>
        <div><dt>Hướng xuất hành</dt><dd>Hỷ thần: ${esc(r.huong.hyThan)} · Tài thần: ${esc(r.huong.taiThan)}</dd></div>
        <div><dt>Màu hợp mệnh ${esc(b.hanh)}</dt><dd>${esc(r.mau.join(', '))}</dd></div>
        <div><dt>Con số gợi ý</dt><dd>${esc(r.so.join(', '))}</dd></div>
      </dl>
      ${r.gioBoQua.length ? `<p class="t-note">Giờ ${esc(r.gioBoQua.join(', '))} là giờ Hoàng đạo nhưng xung tuổi nên bỏ qua.</p>` : ''}
      <details class="t-trace"><summary>Dấu vết suy luận (ngày + tuổi)</summary>
        <table><tbody>${r.trace.map((t) => `<tr><th>${esc(t.ten)}</th><td class="${t.diem >= 0 ? 'p' : 'n'}">${t.diem > 0 && t.ten !== 'Điểm nền' ? '+' : ''}${t.diem}</td><td>${esc(t.vi)}</td></tr>`).join('')}
        <tr class="sum"><th>Tổng (giới hạn 0–100)</th><td>${r.diem}</td><td></td></tr></tbody></table>
        <p class="t-note">Độ tin cậy ${Math.round(r.doTinCay * 100)}%${b.gio < 0 ? ' (chưa có giờ sinh nên chưa dùng được các môn cần giờ sinh ở giai đoạn sau)' : ''}. Bảng quan hệ Chi, Hỷ thần và Tài thần còn chờ đối chiếu với sách bạn tin dùng; các trường phái khác nhau có thể cho kết quả khác.</p>
      </details>`;
    try { if (window.LGT && typeof window.LGT.setMood === 'function') window.LGT.setMood(r.mood); } catch (_) { /* bỏ qua */ }
  }

  async function save(p) {
    const b = birthInfo({ ...p, nhuan: p.nhuan });
    if (!b.ok) { say(b.loi, true); return false; }
    const ok = saveLocal(p);
    document.dispatchEvent(new CustomEvent('lgt:profile', { detail: { profile: p } }));
    let note = ok ? 'Đã lưu hồ sơ trong trình duyệt.' : 'Không lưu được trong trình duyệt (có thể đang ở chế độ riêng tư).';
    if (apiEnabled()) {
      const res = await callApi('saveProfile', { userKey: getUserKey(), profile: {
        hoTen: p.hoTen, loaiLich: p.loaiLich, ngaySinhNhap: `${p.nam}-${String(p.thang).padStart(2, '0')}-${String(p.ngay).padStart(2, '0')}${p.nhuan ? ' nhuận' : ''}`,
        ngaySinhDL: `${b.solar.yy}-${String(b.solar.mm).padStart(2, '0')}-${String(b.solar.dd).padStart(2, '0')}`,
        gioSinh: p.gioSinh, noiSinh: p.noiSinh, gioiTinh: p.gioiTinh } });
      note += res.ok ? ' Đã đồng bộ lên bảng tính.' : ' Chưa đồng bộ được lên bảng tính (kiểm tra mạng), dữ liệu vẫn nằm trong máy bạn.';
    }
    say(note, !ok); return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p = { ...read(), nhuan: form.elements.nhuan.checked };
    if (await save(p)) show();
  });
  form.addEventListener('change', () => { if (out.innerHTML) show(); });

  form.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'export') {
      const blob = new Blob([JSON.stringify({ app: 'dieu-giang-tu', version: 1, profile: { ...read(), nhuan: form.elements.nhuan.checked } }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ho-so-dieu-giang-tu.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      say('Đã xuất hồ sơ thành tệp JSON.');
    } else if (act === 'import') { form.querySelector('[data-role="file"]').click(); }
    else if (act === 'wipe') {
      if (!confirm('Xóa toàn bộ hồ sơ của bạn khỏi trình duyệt' + (apiEnabled() ? ' và khỏi bảng tính' : '') + '?')) return;
      clearLocal(); form.reset(); toggleLeap(); out.innerHTML = '';
      document.dispatchEvent(new CustomEvent('lgt:profile', { detail: { profile: null } }));
      let note = 'Đã xóa hồ sơ trong trình duyệt.';
      if (apiEnabled()) { const res = await callApi('deleteProfile', { userKey: getUserKey() }); note += res.ok ? ' Đã xóa trên bảng tính.' : ' Chưa xóa được trên bảng tính (kiểm tra mạng), hãy thử lại.'; }
      say(note);
    }
  });
  form.querySelector('[data-role="file"]').addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!j || j.app !== 'dieu-giang-tu' || !j.profile) throw new Error('sai tệp');
      fill(j.profile); say('Đã nhập hồ sơ. Bấm "Xem ngày này với tuổi tôi" để tính.');
    } catch (_) { say('Tệp không đúng định dạng hồ sơ Diệu Giang Tự.', true); }
    e.target.value = '';
  });

  // Nhận ngày đang chọn từ phần "Hôm nay"
  document.addEventListener('lgt:day', (e) => { day = e.detail; if (out.innerHTML || loadLocal()) show(); });

  // Nạp hồ sơ đã lưu: ưu tiên localStorage; nếu trống và có API thì thử lấy từ bảng tính
  let saved = loadLocal();
  if (!saved && apiEnabled()) {
    const res = await callApi('getProfile', { userKey: getUserKey() });
    if (res.ok && res.profile) {
      const q = res.profile, [yy, mm, dd] = String(q.ngaySinhNhap || q.ngaySinhDL || '').split(' ')[0].split('-');
      saved = { hoTen: q.hoTen, loaiLich: q.loaiLich || 'duong', ngay: +dd || '', thang: +mm || '', nam: +yy || '', nhuan: /nhuận/.test(q.ngaySinhNhap || ''), gioSinh: q.gioSinh, noiSinh: q.noiSinh, gioiTinh: q.gioiTinh, mucTieu: 'chung' };
    }
  }
  if (saved) { fill(saved); $('#pf-box').open = true; if (day) show(); }
}
