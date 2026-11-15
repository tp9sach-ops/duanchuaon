// Nút ⚙ "Cỡ nút" (Phiên 188, mục 2): thanh trượt 70%–160% chỉnh lớn/nhỏ các nút bấm. Lưu lgt.btnScale (tự đồng bộ theo tài khoản), đặt biến --btn-k lên :root.
// --btn-k được dùng bởi cụm chiêu (js/ui/heSkill.js --hs-s) và cụm nút phải-dưới (css/dock.css .dk, transform scale). Mọi chữ qua textContent.
import { SCALE_KEY, SCALE_MIN, SCALE_MAX, SCALE_STEP, SCALE_DEF, clampScale, scaleLabel } from '../world/btnScale.js';

export function initBtnScale(hud) {
  let k = SCALE_DEF; try { k = clampScale(localStorage.getItem(SCALE_KEY)); } catch (_) { /* riêng tư */ }
  const apply = (v) => { k = clampScale(v); document.documentElement.style.setProperty('--btn-k', String(k)); try { localStorage.setItem(SCALE_KEY, String(k)); } catch (_) { /* bỏ qua */ } };
  document.documentElement.style.setProperty('--btn-k', String(k));
  const st = document.createElement('style');
  st.textContent = '#bs-gear{position:fixed;z-index:10;left:184px;bottom:calc(var(--joy-b,86px) + var(--joy-s,120px) + 10px);width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(217,178,95,.85);background:rgba(8,10,20,.78);color:#f3e4b8;font-size:22px;line-height:1;cursor:pointer;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 3px 10px rgba(0,0,0,.5)}'
    + '#bs-box{position:fixed;z-index:14;left:50%;top:50%;transform:translate(-50%,-50%);width:min(340px,90vw);padding:14px;border-radius:14px;border:1px solid rgba(241,219,159,.8);background:rgba(28,19,9,.97);color:#f6e7c1;font:14px/1.4 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.6);pointer-events:auto}#bs-box[hidden]{display:none}'
    + '#bs-box h4{margin:0 0 8px;font-size:16px}#bs-box .bs-row{display:flex;align-items:center;gap:10px}#bs-box input[type=range]{flex:1;height:34px}#bs-box .bs-v{min-width:48px;text-align:right;font-weight:700}'
    + '#bs-box .bs-btns{display:flex;gap:8px;margin-top:12px}#bs-box button{flex:1;min-height:44px;border-radius:10px;border:1px solid rgba(241,219,159,.7);background:rgba(60,42,20,.9);color:#fff;font:inherit;cursor:pointer}#bs-box .bs-ok{background:#d9b25f;color:#2a1c08}';
  document.head.appendChild(st);
  const gear = document.createElement('button'); gear.id = 'bs-gear'; gear.type = 'button'; gear.textContent = '⚙'; gear.setAttribute('aria-label', 'Cài đặt cỡ nút bấm'); gear.title = 'Cỡ nút bấm';
  const box = document.createElement('div'); box.id = 'bs-box'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cỡ nút bấm');
  const h = document.createElement('h4'), row = document.createElement('div'), rng = document.createElement('input'), val = document.createElement('span'), btns = document.createElement('div'), rs = document.createElement('button'), ok = document.createElement('button');
  h.textContent = 'Cỡ nút bấm'; row.className = 'bs-row'; val.className = 'bs-v'; btns.className = 'bs-btns';
  rng.type = 'range'; rng.min = String(SCALE_MIN); rng.max = String(SCALE_MAX); rng.step = String(SCALE_STEP); rng.setAttribute('aria-label', 'Cỡ nút');
  rs.type = ok.type = 'button'; rs.textContent = 'Mặc định'; ok.textContent = 'Xong'; ok.className = 'bs-ok';
  const show = () => { rng.value = String(k); val.textContent = scaleLabel(k); };
  rng.addEventListener('input', () => { apply(rng.value); val.textContent = scaleLabel(k); });
  rs.addEventListener('click', () => { apply(SCALE_DEF); show(); });
  ok.addEventListener('click', () => { box.hidden = true; });
  gear.addEventListener('click', () => { show(); box.hidden = !box.hidden; });
  row.append(rng, val); btns.append(rs, ok); box.append(h, row, btns); hud.append(gear, box);
  const api = { get k() { return k; }, set: (v) => { apply(v); show(); } };
  (window.LGT || (window.LGT = {})).btnScale = api; return api;
}
