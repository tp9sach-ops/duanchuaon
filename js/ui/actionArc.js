// Phiên 192 + 193 (Mục 1): BỐ CỤC NÚT KIỂU MOBA (theo ảnh Liên Quân) — MỘT cụm ở góc phải-dưới dùng CHUNG cho bãi rừng / trong chùa / khu luyện tập / thu phục yêu quái.
//   • Đánh thường (ô A) TO, sát ngón cái. Cùng HÀNG ĐÁY, đi dần sang trái: Thương, Nhảy, Thiết đầu, Chém khí/Khiêng người, Tự động, Cưỡi (mỗi nút một cột cố định).
//   • Chiêu phái xếp CUNG TRÒN quanh nút Đánh thường: chiêu 1, 2, 3 vòng trong; Pháp Môn (4) + Tuyệt Học vòng ngoài, nhỏ hơn 20%. Màn thấp tự thu cung (tối thiểu 55%).
//   • Phiên 193: nút Lạy/Thiền/Tụng kinh/Dâng lễ (.hm-grid) CHỈ hiện khi ở chánh điện (body.in-hall), còn lại ẩn hẳn → cụm nút hạ xuống sát đáy, to hơn.
//   • Phiên 193: cỡ nút chỉnh RIÊNG từng nhóm (nút ⚙ ở js/ui/btnScale.js): Di chuyển (cần đi #joy), Đánh thường, Chiêu thức, Nút phụ — nhân với "Tất cả" (--btn-k).
// Chỉ chỉnh VỊ TRÍ/CỠ/MÀU bằng CSS + style nội tuyến; logic nút vẫn ở js/world/dock.js và js/ui/heSkill.js. Hàm thuần có test (tests/heskillui.test.mjs).
import { insideHall } from './hudLogic.js';

const rad = (d) => (d * Math.PI) / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Góc (độ, ngược chiều kim đồng hồ từ trục +x, tâm = tâm nút Đánh thường) và vòng của từng ô chiêu. */
export const ARC_POS = { 1: [150, 1], 2: [120, 1], 3: [90, 1], 4: [135, 2], tuyet: [105, 2] };
/** Cột (tính từ phải, A = 7) của từng ô trong hàng đáy. */
export const SLOT_COL = { A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, T1: 1 };
export const GROUP_KEY = 'lgt.btnGroups', GROUPS = ['joy', 'atk', 'skill', 'aux'], G_MIN = 0.6, G_MAX = 1.8;

/** Cỡ các nhóm nút người chơi chọn (mỗi nhóm 0.6–1.8, mặc định 1). */
export const cleanGroups = (o) => { const r = {}; for (const g of GROUPS) { const v = +(o && o[g]); r[g] = Number.isFinite(v) ? Math.round(clamp(v, G_MIN, G_MAX) * 100) / 100 : 1; } return r; };
export function loadGroups() { try { return cleanGroups(JSON.parse(localStorage.getItem(GROUP_KEY) || 'null')); } catch (_) { return cleanGroups(null); } }
export function saveGroups(g) { try { localStorage.setItem(GROUP_KEY, JSON.stringify(cleanGroups(g))); } catch (_) { /* bỏ qua */ } }
export function applyGroups(g) { const c = cleanGroups(g), s = document.documentElement.style; for (const k of GROUPS) s.setProperty('--k-' + k, String(c[k])); return c; }
/** Cỡ (px) các nút ở cụm phải-dưới theo cạnh ngắn màn hình `vmin` (px). Trùng công thức CSS trong ARC_CSS. k = "Tất cả", ka = Đánh thường, kx = Nút phụ. */
export const dockSize = (vmin, k = 1, ka = 1, kx = 1) => ({ a: k * ka * clamp(0.19 * vmin, 96, 140), m: k * kx * clamp(0.095 * vmin, 58, 76), s: k * kx * clamp(0.08 * vmin, 44, 56) });

/** Vị trí các nút chiêu so với tâm nút Đánh thường. rA = bán kính nút Đánh thường, base = đường kính nút chiêu, f = hệ số thu nhỏ, m = đường kính nút phụ ở hàng đáy (0 = bỏ qua kiểm tra chồng hàng đáy).
 *  Trả { pts: { khoá: { dx, dy (lên là dương), s } }, up = phần cung nhô lên trên tâm }. */
export function arcPoints(rA, base, f = 1, m = 0) {
  const s = base * f, s2 = s * 0.8;
  let R1 = Math.max(rA + 8 + s / 2 + 6, (s + 8) / (2 * Math.sin(rad(15))));
  if (m > 0) {   // chiêu 1 (150°) không được đè Thương / Nhảy ở hàng đáy
    const bx = -(rA + 8 + m / 2), cx = bx - m - 8, hit = (R) => [bx, cx].some((x) => Math.hypot(R * Math.cos(rad(150)) - x, R * Math.sin(rad(150))) < s / 2 + m / 2 + 4);
    for (let i = 0; i < 300 && hit(R1); i++) R1 += 2;
  }
  const R2 = R1 + ((s + s2) / 2) * 0.95, pts = {}; let up = 0;
  for (const k of Object.keys(ARC_POS)) {
    const [deg, ring] = ARC_POS[k], R = ring === 1 ? R1 : R2, sz = ring === 1 ? s : s2, dx = R * Math.cos(rad(deg)), dy = R * Math.sin(rad(deg));
    pts[k] = { dx, dy, s: sz }; up = Math.max(up, dy + sz / 2);
  }
  return { pts, up };
}
/** Hệ số thu nhỏ lớn nhất (≤ 1, ≥ 0.55) để cung nhô lên không quá `avail` px. */
export function fitFactor(avail, rA, base, m = 0) {
  for (let f = 1; f >= 0.55; f -= 0.05) if (arcPoints(rA, base, f, m).up <= avail) return Math.round(f * 100) / 100;
  return 0.55;
}

export const ARC_CSS = ':root{--jk:calc(var(--hud-s,1)*var(--btn-k,1)*var(--k-joy,1));--joy-s:calc(120px*var(--jk))!important}'
  + 'html #joy{width:calc(120px*var(--jk))!important;height:calc(120px*var(--jk))!important}html #joy i{left:calc(38px*var(--jk))!important;top:calc(38px*var(--jk))!important;width:calc(44px*var(--jk))!important;height:calc(44px*var(--jk))!important}'
  + '.dk{--dk-a:calc(var(--btn-k,1)*var(--k-atk,1)*clamp(96px,19vmin,140px))!important;--dk-m:calc(var(--btn-k,1)*var(--k-aux,1)*clamp(58px,9.5vmin,76px))!important;--dk-s:calc(var(--btn-k,1)*var(--k-aux,1)*clamp(44px,8vmin,56px))!important;transform:none!important}'
  + 'body:not(.in-hall) .hm-grid{display:none!important}body:not(.in-hall) .dk{bottom:max(20px,calc(env(safe-area-inset-bottom) + 14px))!important}'
  + '.dk-grid{display:grid!important;grid-template-columns:repeat(6,var(--dk-m)) var(--dk-a)!important;grid-template-rows:var(--dk-a)!important;align-items:center!important;justify-items:center!important}'
  + '.dk-b{grid-row:1!important}.dk-b[data-slot="A"]{grid-column:7!important}.dk-b[data-slot="B"]{grid-column:6!important}.dk-b[data-slot="C"]{grid-column:5!important}.dk-b[data-slot="D"]{grid-column:4!important}.dk-b[data-slot="E"]{grid-column:3!important}.dk-b[data-slot="F"]{grid-column:2!important}.dk-b[data-slot="T1"],.dk-b[data-slot^="X"]{grid-column:1!important}'
  + '.dk-b.sz-big .dk-ic{font-size:calc(var(--dk-a)*.4)!important}.dk-b.sz-big .dk-tx{font-size:calc(var(--dk-a)*.13)!important}.dk-b.sz-mid .dk-ic{font-size:calc(var(--dk-m)*.4)!important}.dk-b.sz-mid .dk-tx{font-size:calc(var(--dk-m)*.17)!important}'
  + '.dk-b[data-slot="A"]{background:radial-gradient(circle at 35% 30%,#4aa3e6,#12335e 72%)!important;border:3px solid #a9dcff!important;color:#fff!important;box-shadow:0 0 16px rgba(80,170,255,.6),inset 0 0 14px rgba(255,255,255,.28),0 4px 12px rgba(0,0,0,.5)!important}'
  + '.dk-b.sz-mid{background:radial-gradient(circle at 35% 30%,#4a5470,#141826 76%)!important;border:2.5px solid #c7d0dc!important}.dk-b.sz-mid.hot,.dk-b[data-slot="A"].hot{background:rgba(143,214,191,.85)!important;color:#06130e!important}'
  + '#hs-bar .hs-b{position:fixed!important;margin:0!important;transition:none;border:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;border-radius:50%;filter:drop-shadow(0 3px 6px rgba(0,0,0,.65))}#hs-bar .hs-b.hs-on{filter:drop-shadow(0 0 6px #ffe08a) drop-shadow(0 0 12px #ffe08a)}';

const IN_HALL_MODES = ['sit', 'meditate', 'chant', 'beads', 'bow'];
export function initActionArc() {
  if (document.getElementById('arc-css')) return;
  const st = document.createElement('style'); st.id = 'arc-css'; st.textContent = ARC_CSS; document.head.appendChild(st);
  applyGroups(loadGroups());
  const last = new WeakMap();
  function hallState() {   // chỉ ở chánh điện mới hiện lưới Lạy/Thiền/Tụng kinh/Dâng lễ
    const LGT = window.LGT || {}, W = LGT.world, Z = LGT.zones; if (!W || !W.pos) return;
    const here = !Z || !Z.current || Z.current === 'chua', inHall = here && (insideHall(W.pos) || IN_HALL_MODES.includes(W.mode));
    if (document.body.classList.contains('in-hall') !== inHall) document.body.classList.toggle('in-hall', inHall);
  }
  function arrange() {
    const bar = document.getElementById('hs-bar'), dock = document.getElementById('dock');
    const atk = dock && dock.querySelector('.dk-b[data-id="da"] .dk-ic'); if (atk && atk.textContent !== '⚔️') atk.textContent = '⚔️';   // Đánh thường: biểu tượng kiếm thay cho hòn đá cũ
    if (!bar || bar.hidden) return;
    const A = dock && !dock.hidden ? dock.querySelector('.dk-b[data-slot="A"]') : null, cs = getComputedStyle(document.documentElement);
    const vw = innerWidth, vh = innerHeight, k = parseFloat(cs.getPropertyValue('--btn-k')) || 1, ks = parseFloat(cs.getPropertyValue('--k-skill')) || 1;
    let cx, cy, rA, m = 0;
    if (A) { const r = A.getBoundingClientRect(); if (!r.width) return; cx = r.left + r.width / 2; cy = r.top + r.height / 2; rA = r.width / 2; const mid = dock.querySelector('.dk-b.sz-mid'); m = mid ? mid.getBoundingClientRect().width : rA * 1.2; }
    else { rA = 48 * k; cx = vw - 12 - rA; cy = vh - 214 - rA; m = rA * 1.2; }   // không có nút Đánh thường (đang câu cá/bơi...): giữ cung ở vị trí cũ
    const base = k * ks * Math.max(64, Math.min(92, 0.11 * Math.min(vw, vh))), f = fitFactor(cy - 56, rA, base, m), { pts, up } = arcPoints(rA, base, f, m);
    for (const b of bar.querySelectorAll('.hs-b')) {
      if (b.hidden) continue; const p = pts[b.dataset.slot]; if (!p) continue;
      const x = Math.max(4, Math.round(cx + p.dx - p.s / 2)), y = Math.round(cy - p.dy - p.s / 2), key = x + ',' + y + ',' + Math.round(p.s);
      if (last.get(b) === key) continue; last.set(b, key);
      b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.setProperty('--hs-s', p.s.toFixed(1) + 'px');
    }
    if (dock) dock.style.setProperty('--hs-h', Math.max(0, Math.ceil(up - rA + 4)) + 'px');   // bong bóng chỉ chỗ nằm trên cung
  }
  setInterval(() => { try { hallState(); arrange(); } catch (_) { /* bố cục lỗi thì giữ nguyên */ } }, 120); addEventListener('resize', arrange); hallState(); arrange();
}
