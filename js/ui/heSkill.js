// Thanh CHIÊU CỦA PHÁI (Phiên 141): sau Lễ Khai Ngộ (js/ui/khaiNgo.js) người chơi có Hệ → hiện 3 nút chiêu (ô 1, 2, 3) phía trên cụm nút góc phải-dưới.
// Chiêu gây sát thương (heSo > 0) đánh quái gần nhất qua LGT.farm.skillHit; chiêu hỗ trợ (heSo = 0: khiên, hồi máu, ẩn thân…) hiện mờ "sắp có" (hiệu ứng làm ở bước sau).
// Bộ máy hồi chiêu / cấp chiêu: js/world/skillEngine.js; dữ liệu: js/data/combatSkills.js (TẠM). Phím tắt máy tính: Q, W, E. Mọi chữ qua textContent.
import { createSkillRuntime } from '../world/skillEngine.js';
import { skillFor } from '../world/skillCatalog.js';
import { SKILL_CAP } from '../data/combatSkills.js';
import { effLevel } from '../world/heQuest.js';
import { levelOf } from '../world/quests.js';
import { loadHe } from '../world/khaiNgo.js';
import { KHAI_NGO } from '../data/skillCfg.js';
import { infoOf, infoRows, iconSpec } from '../world/chieuInfo.js';   // Phiên 162: biểu tượng + bảng giữ-để-xem

const SLOTS = [1, 2, 3], KEYS = { 1: 'KeyQ', 2: 'KeyW', 3: 'KeyE' }, KEYTXT = { 1: 'Q', 2: 'W', 3: 'E' };   // Phiên 159c: chiêu phái = Q, W, E (R = Thương ở farm.js; 1–5 = ô nút trong dock)
const WHY = { 'khong-quai': 'Chưa có quái nào gần. Ra bãi rừng rồi dùng chiêu.', xa: 'Quái còn xa, lại gần hơn rồi dùng chiêu.' };
const HOLD_MS = 380, SVGNS = 'http://www.w3.org/2000/svg';   // giữ ≥ 380 ms = xem thông tin (không tung chiêu); chạm nhanh = tung chiêu
const isEditable = (t) => !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function initHeSkill(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const nowSec = () => performance.now() / 1000;
  const capCH = () => levelOf(LGT.quests && LGT.quests.prog ? LGT.quests.prog.xp : 0).lv;
  const eff = () => effLevel(LGT.farm ? LGT.farm.tuvi : 0, capCH());
  LGT.capHieuDung = eff;   // cấp hiệu dụng = max(Tu Vi, Cấp công hạnh) — dùng cho Lễ Khai Ngộ, nhiệm vụ gia nhập phái, ô chiêu

  let rt = null, he = null;
  const currentHe = () => { try { return loadHe(localStorage.getItem(KHAI_NGO.heKey)); } catch (_) { return LGT.he || null; } };
  function sync() {
    const h = LGT.he || currentHe();
    if (h !== he || !rt) { he = h; rt = he ? createSkillRuntime({ he, tuvi: eff() }) : null; }
    if (rt) rt.setTuVi(eff());
  }

  const st = document.createElement('style');
  st.textContent = '#hs-bar{position:fixed;z-index:9;display:flex;gap:8px;right:12px;bottom:200px;touch-action:none}#hs-bar[hidden]{display:none}'
    + '.hs-b{position:relative;width:54px;height:54px;border-radius:50%;border:1px solid rgba(241,219,159,.7);background:rgba(40,28,14,.88);color:#f6e7c1;font:600 10px/1.15 system-ui,sans-serif;padding:2px;cursor:pointer;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}'
    + '.hs-b .hs-k{position:absolute;top:1px;right:6px;font-size:9px;opacity:.7}.hs-b.lock,.hs-b.soon{opacity:.45}.hs-b.hs-cd::after{content:"";position:absolute;left:0;right:0;bottom:0;height:calc(var(--cd,0)*100%);background:rgba(0,0,0,.55)}'
    + '.hs-b svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.hs-b .hs-n{position:relative;z-index:1;font-size:8.5px;margin-top:26px;text-shadow:0 1px 2px #000}'
    + '#hs-tip{position:fixed;z-index:12;max-width:min(300px,86vw);padding:9px 11px;border-radius:10px;border:1px solid rgba(241,219,159,.8);background:rgba(28,19,9,.96);color:#f6e7c1;font:12px/1.4 system-ui,sans-serif;pointer-events:none;box-shadow:0 4px 18px rgba(0,0,0,.55)}#hs-tip[hidden]{display:none}#hs-tip h4{margin:0 0 4px;font-size:14px}#hs-tip .r{margin:2px 0}#hs-tip .r b{color:#f1db9f;font-weight:600}'
    + '.hs-b.he-kim{border-color:#dfe3e8}.hs-b.he-moc{border-color:#3f9b4a}.hs-b.he-thuy{border-color:#2f6fd0}.hs-b.he-hoa{border-color:#d9432b}.hs-b.he-tho{border-color:#c9a227}';
  document.head.appendChild(st);
  const bar = document.createElement('div'); bar.id = 'hs-bar'; bar.hidden = true; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Chiêu của phái'); hud.appendChild(bar);
  // Biểu tượng chiêu: nền màu Hệ + hoa văn theo vùng báo + chữ cái; toàn bộ vẽ bằng SVG (createElementNS), không innerHTML.
  const el = (n, a, p) => { const e = document.createElementNS(SVGNS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  function drawIcon(id) {
    const ic = iconSpec(id), svg = el('svg', { viewBox: '0 0 54 54', 'aria-hidden': 'true' }); if (!ic) return svg;
    el('circle', { cx: 27, cy: 27, r: 26, fill: ic.mau, opacity: ic.tuyet ? 0.4 : 0.22 }, svg);
    const g = el('g', { stroke: ic.mau, 'stroke-width': 2, fill: 'none', opacity: 0.85 }, svg);
    if (ic.van === 'vachCheo') { el('path', { d: 'M10 40L40 10M18 46L46 18M6 30L30 6' }, g); }
    else if (ic.van === 'hoaVanLa') { el('path', { d: 'M27 8C40 16 40 34 27 44C14 34 14 16 27 8ZM27 12V42' }, g); }
    else if (ic.van === 'gonSong') { el('path', { d: 'M6 20q5-6 10 0t10 0t10 0t10 0M6 30q5-6 10 0t10 0t10 0t10 0' }, g); }
    else if (ic.van === 'oVuong') { el('path', { d: 'M12 12h30v30H12ZM12 27h30M27 12v30' }, g); }
    else { el('path', { d: 'M27 6L33 24L50 27L33 30L27 48L21 30L4 27L21 24Z' }, g); }
    if (ic.tuyet) el('circle', { cx: 27, cy: 27, r: 24, stroke: '#f1db9f', 'stroke-width': 2, fill: 'none' }, svg);
    const t = el('text', { x: 27, y: 33, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: '#fff', stroke: '#000', 'stroke-width': 0.6 }, svg); t.textContent = ic.chu;
    return svg;
  }
  const tip = document.createElement('div'); tip.id = 'hs-tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip'); hud.appendChild(tip);
  function showTip(slot) {
    sync(); const sk = rt && skillFor(he, slot, null); if (!sk) return false;
    const info = infoOf(sk.id, { tuvi: eff(), level: rt.effectiveLevel(sk.id) }); if (!info) return false;
    tip.textContent = ''; const h = document.createElement('h4'); h.textContent = info.ten; tip.appendChild(h);
    for (const [k, v] of infoRows(info)) { const r = document.createElement('div'), b = document.createElement('b'); r.className = 'r'; b.textContent = k + ': '; r.append(b, document.createTextNode(v)); tip.appendChild(r); }
    tip.hidden = false; const bb = bar.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - tw - 8, bb.right - tw)) + 'px'; tip.style.top = Math.max(8, bb.top - th - 8) + 'px'; return true;
  }
  const hideTip = () => { tip.hidden = true; };
  const btns = {};
  for (const s of SLOTS) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.slot = String(s);
    const t = document.createElement('span'), k = document.createElement('span'); k.className = 'hs-k'; k.textContent = KEYTXT[s]; t.className = 'hs-n';
    b.append(t, k); let timer = 0, held = false, icoId = '';
    const stop = () => { clearTimeout(timer); timer = 0; if (held) hideTip(); };
    b.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); held = false; clearTimeout(timer); timer = setTimeout(() => { timer = 0; held = showTip(s); }, HOLD_MS); });
    b.addEventListener('pointerup', () => { const was = held, pend = !!timer; stop(); if (!was && pend) cast(s); held = false; });
    b.addEventListener('pointercancel', () => { stop(); held = false; }); b.addEventListener('pointerleave', () => { stop(); held = false; });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    bar.appendChild(b); btns[s] = { b, t, get ico() { return icoId; }, set ico(v) { icoId = v; } };
  }

  function cast(slot) {
    sync(); if (!rt || !LGT.farm) return false;
    const sk = skillFor(he, slot, null); if (!sk) return false;
    if (eff() < SKILL_CAP[slot]) { toast(`Chiêu này mở ở cấp ${SKILL_CAP[slot]} (bạn cấp ${eff()}).`, 2400); return false; }
    if (!(sk.heSo > 0)) { toast(`${sk.ten}: chiêu hỗ trợ, hiệu ứng sẽ mở ở bước sau.`, 2600); return false; }
    const pre = LGT.farm.skillReady(); if (!pre.ok) { toast(WHY[pre.reason] || 'Chưa dùng được.', 2200); return false; }
    const r = rt.tryCast(slot, nowSec());
    if (!r.ok) { toast(r.reason === 'hoi-chieu' ? `${sk.ten} đang hồi chiêu, còn ${Math.ceil(r.left || 0)} giây.` : 'Chưa dùng được chiêu này.', 2000); return false; }
    const h = LGT.farm.skillHit(r.heSo);
    try { const av = LGT.world && LGT.world.avatar; if (av && typeof av.cast === 'function') av.cast(sk.id); } catch (_) {}   // Phiên 162: tư thế gồng → phát → thu
    if (h.ok) { toast(`${sk.ten}! −${h.dmg} Oán Khí ${h.ten}`, 1800); if (LGT.sfx) LGT.sfx.play('thuong'); if (LGT.act) LGT.act('dungchieu'); }
    return h.ok;
  }

  function paint() {
    sync();
    const showBar = !!rt && !!LGT.world && !LGT.inHouse && !LGT.panelOpen && (LGT.world.mode === 'free'); bar.hidden = !showBar; if (!showBar) return;
    const dock = document.getElementById('dock');
    if (dock && !dock.hidden) { const r = dock.getBoundingClientRect(); if (r.width) { bar.style.right = Math.max(8, Math.round(innerWidth - r.right)) + 'px'; bar.style.bottom = Math.round(innerHeight - r.top + 8) + 'px'; } }
    for (const s of SLOTS) {
      const sk = skillFor(he, s, null), bs = btns[s], { b, t } = bs; if (!sk) { b.hidden = true; continue; } b.hidden = false;
      if (bs.ico !== sk.id) { const old = b.querySelector('svg'); if (old) old.remove(); b.insertBefore(drawIcon(sk.id), b.firstChild); bs.ico = sk.id; }
      const locked = eff() < SKILL_CAP[s], soon = !locked && !(sk.heSo > 0), left = rt.cooldownLeft(sk.id, nowSec());
      t.textContent = locked ? `Cấp ${SKILL_CAP[s]}` : sk.ten;
      b.className = `hs-b he-${he}${locked ? ' lock' : ''}${soon ? ' soon' : ''}${left > 0 ? ' hs-cd' : ''}`;
      b.style.setProperty('--cd', sk.cd > 0 ? Math.min(1, left / sk.cd).toFixed(3) : '0');
      b.setAttribute('aria-label', `${sk.ten}${locked ? ` (mở ở cấp ${SKILL_CAP[s]})` : soon ? ' (sắp có)' : left > 0 ? ' (đang hồi chiêu)' : ''}`);
    }
  }
  addEventListener('keydown', (e) => {
    if (e.repeat || isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey || bar.hidden || LGT.panelOpen) return;
    if (document.querySelector('.st-dlg:not([hidden])') || document.body.classList.contains('edit-mode')) return;
    const s = SLOTS.find((x) => KEYS[x] === e.code); if (s) { e.preventDefault(); cast(s); }
  });
  addEventListener('lgt:he', () => { rt = null; sync(); paint(); });
  setInterval(paint, 150); sync();
  LGT.heSkill = { cast, get he() { return he; }, get ready() { return !!rt; } };
  return LGT.heSkill;
}
