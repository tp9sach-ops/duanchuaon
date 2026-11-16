// Nút ⚙ "Cỡ nút" (Phiên 188, mục 2): thanh trượt chỉnh lớn/nhỏ các nút bấm. Lưu lgt.btnScale (tự đồng bộ theo tài khoản), đặt biến --btn-k lên :root.
// --btn-k = "Tất cả": nhân cho cụm chiêu (js/ui/heSkill.js --hs-s), cụm nút phải-dưới (css/dock.css) và cần đi (js/ui/actionArc.js). Mọi chữ qua textContent.
// Phiên 192: nạp bố cục cung tròn kiểu MOBA (js/ui/actionArc.js) — file này được main.js nạp nên gắn ở đây.
// Phiên 204: trên điện thoại nút ⚙ chuyển vào cột trái-trên, ngay DƯỚI bản đồ nhỏ (trước đây nằm trên cần đi nên đè lên nút di chuyển); máy tính giữ chỗ cũ.
// Phiên 193: bảng có thêm 4 thanh trượt RIÊNG: Di chuyển (cần đi), Đánh thường, Chiêu thức, Nút phụ (Thương/Nhảy/...). Lưu lgt.btnGroups (0.6–1.8).
import { SCALE_KEY, SCALE_MIN, SCALE_MAX, SCALE_STEP, SCALE_DEF, clampScale, scaleLabel, isPhoneLayout } from '../world/btnScale.js';
import { initActionArc, loadGroups, saveGroups, applyGroups, GROUPS, G_MIN, G_MAX } from './actionArc.js';

const G_LABEL = { joy: 'Di chuyển (cần đi)', atk: 'Đánh thường', skill: 'Chiêu thức', aux: 'Nút phụ (Thương, Nhảy…)' };

export function initBtnScale(hud) {
  let k = SCALE_DEF; try { k = clampScale(localStorage.getItem(SCALE_KEY)); } catch (_) { /* riêng tư */ }
  const apply = (v) => { k = clampScale(v); document.documentElement.style.setProperty('--btn-k', String(k)); try { localStorage.setItem(SCALE_KEY, String(k)); } catch (_) { /* bỏ qua */ } };
  document.documentElement.style.setProperty('--btn-k', String(k));
  try { initActionArc(); } catch (e) { console.warn('[Diệu Giang Tự] Bố cục cung tròn lỗi:', e && e.message); }   // lỗi thì giữ bố cục cũ
  let groups = loadGroups();
  const st = document.createElement('style');
  st.textContent = '#bs-gear{position:fixed;z-index:10;left:184px;bottom:calc(var(--joy-b,86px) + var(--joy-s,120px) + 10px);width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(217,178,95,.85);background:rgba(8,10,20,.78);color:#f3e4b8;font-size:22px;line-height:1;cursor:pointer;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 3px 10px rgba(0,0,0,.5)}'
    + '#bs-box{position:fixed;z-index:14;left:50%;top:50%;transform:translate(-50%,-50%);width:min(380px,92vw);max-height:92vh;overflow:auto;padding:14px;border-radius:14px;border:1px solid rgba(241,219,159,.8);background:rgba(28,19,9,.97);color:#f6e7c1;font:14px/1.4 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.6);pointer-events:auto}#bs-box[hidden]{display:none}'
    + '.hud-tl #bs-gear{position:static;left:auto;bottom:auto;flex:none;width:44px;height:44px;margin:0 0 0 2px;font-size:20px}'
    + '#bs-box h4{margin:0 0 8px;font-size:16px}#bs-box .bs-l{margin:8px 0 0;font-size:13px;color:#f1db9f}#bs-box .bs-row{display:flex;align-items:center;gap:10px}#bs-box input[type=range]{flex:1;height:34px}#bs-box .bs-v{min-width:48px;text-align:right;font-weight:700}'
    + '#bs-box .bs-btns{display:flex;gap:8px;margin-top:12px}#bs-box button{flex:1;min-height:44px;border-radius:10px;border:1px solid rgba(241,219,159,.7);background:rgba(60,42,20,.9);color:#fff;font:inherit;cursor:pointer}#bs-box .bs-ok{background:#d9b25f;color:#2a1c08}';
  document.head.appendChild(st);
  const gear = document.createElement('button'); gear.id = 'bs-gear'; gear.type = 'button'; gear.textContent = '⚙'; gear.setAttribute('aria-label', 'Cài đặt cỡ nút bấm'); gear.title = 'Cỡ nút bấm';
  const box = document.createElement('div'); box.id = 'bs-box'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cỡ nút bấm');
  const h = document.createElement('h4'); h.textContent = 'Cỡ nút bấm'; box.appendChild(h);
  const rows = [];   // { rng, val, get, set }
  const addRow = (label, min, max, step, get, set, fmt) => {
    const l = document.createElement('div'), row = document.createElement('div'), rng = document.createElement('input'), val = document.createElement('span');
    l.className = 'bs-l'; l.textContent = label; row.className = 'bs-row'; val.className = 'bs-v';
    rng.type = 'range'; rng.min = String(min); rng.max = String(max); rng.step = String(step); rng.setAttribute('aria-label', label);
    rng.addEventListener('input', () => { set(rng.value); val.textContent = fmt(get()); });
    row.append(rng, val); box.append(l, row); rows.push({ rng, val, get, fmt });
  };
  addRow('Tất cả (kể cả cần đi)', SCALE_MIN, SCALE_MAX, SCALE_STEP, () => k, apply, scaleLabel);
  for (const g of GROUPS) addRow(G_LABEL[g], G_MIN, G_MAX, 0.05, () => groups[g], (v) => { groups = applyGroups({ ...groups, [g]: v }); saveGroups(groups); }, (v) => Math.round(v * 100) + '%');
  const btns = document.createElement('div'), rs = document.createElement('button'), ok = document.createElement('button');
  btns.className = 'bs-btns'; rs.type = ok.type = 'button'; rs.textContent = 'Mặc định'; ok.textContent = 'Xong'; ok.className = 'bs-ok';
  const show = () => { for (const r of rows) { r.rng.value = String(r.get()); r.val.textContent = r.fmt(r.get()); } };
  rs.addEventListener('click', () => { apply(SCALE_DEF); groups = applyGroups({}); saveGroups(groups); show(); });
  ok.addEventListener('click', () => { box.hidden = true; });
  gear.addEventListener('click', () => { show(); box.hidden = !box.hidden; });
  btns.append(rs, ok); box.appendChild(btns); hud.append(gear, box);
  // Điện thoại: đưa nút ⚙ vào cột trái-trên, liền sau bản đồ nhỏ (.mm) để luôn nằm DƯỚI bản đồ, không đè cần đi. Máy tính: về chỗ cũ trong HUD.
  // Bản đồ có thể dựng sau file này nên kiểm lại định kỳ (rẻ: chỉ so vị trí), và khi xoay/đổi cỡ màn hình.
  const coarseQ = window.matchMedia ? matchMedia('(pointer: coarse)') : null;
  function placeGear() {
    try {
      const tl = hud.querySelector('.hud-tl'), phone = isPhoneLayout({ coarse: !!(coarseQ && coarseQ.matches), w: window.innerWidth });
      if (phone && tl) {
        const mm = tl.querySelector('.mm');
        if (mm) { if (gear.parentNode !== tl || mm.nextElementSibling !== gear) mm.after(gear); }
        else if (gear.parentNode !== tl) tl.appendChild(gear);
      } else if (gear.parentNode !== hud) hud.insertBefore(gear, box);
    } catch (_) { /* không để lỗi bố cục làm hỏng game */ }
  }
  placeGear(); setInterval(placeGear, 1000); for (const ev of ['resize', 'orientationchange']) addEventListener(ev, placeGear);
  const api = { get k() { return k; }, set: (v) => { apply(v); show(); } };
  (window.LGT || (window.LGT = {})).btnScale = api; return api;
}
