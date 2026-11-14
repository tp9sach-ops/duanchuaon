// Thanh CHIÊU CỦA PHÁI (Phiên 141): sau Lễ Khai Ngộ (js/ui/khaiNgo.js) người chơi có Hệ → hiện 3 nút chiêu (ô 1, 2, 3) phía trên cụm nút góc phải-dưới.
// Chiêu gây sát thương (heSo > 0) đánh quái gần nhất qua LGT.farm.skillHit; chiêu hỗ trợ (heSo = 0: khiên, hồi máu, ẩn thân…) hiện mờ "sắp có" (hiệu ứng làm ở bước sau).
// Bộ máy hồi chiêu / cấp chiêu: js/world/skillEngine.js; dữ liệu: js/data/combatSkills.js (TẠM). Phím tắt máy tính: 6, 7, 8. Mọi chữ qua textContent.
import { createSkillRuntime } from '../world/skillEngine.js';
import { skillFor } from '../world/skillCatalog.js';
import { SKILL_CAP } from '../data/combatSkills.js';
import { effLevel } from '../world/heQuest.js';
import { levelOf } from '../world/quests.js';
import { loadHe } from '../world/khaiNgo.js';
import { KHAI_NGO } from '../data/skillCfg.js';

const SLOTS = [1, 2, 3], KEYS = { 1: 'Digit6', 2: 'Digit7', 3: 'Digit8' }, KEYTXT = { 1: '6', 2: '7', 3: '8' };
const WHY = { 'khong-quai': 'Chưa có quái nào gần. Ra bãi rừng rồi dùng chiêu.', xa: 'Quái còn xa, lại gần hơn rồi dùng chiêu.' };
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
    + '.hs-b.he-kim{border-color:#dfe3e8}.hs-b.he-moc{border-color:#3f9b4a}.hs-b.he-thuy{border-color:#2f6fd0}.hs-b.he-hoa{border-color:#d9432b}.hs-b.he-tho{border-color:#c9a227}';
  document.head.appendChild(st);
  const bar = document.createElement('div'); bar.id = 'hs-bar'; bar.hidden = true; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Chiêu của phái'); hud.appendChild(bar);
  const btns = {};
  for (const s of SLOTS) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.slot = String(s);
    const t = document.createElement('span'), k = document.createElement('span'); k.className = 'hs-k'; k.textContent = KEYTXT[s];
    b.append(t, k); b.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); cast(s); });
    bar.appendChild(b); btns[s] = { b, t };
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
    if (h.ok) { toast(`${sk.ten}! −${h.dmg} Oán Khí ${h.ten}`, 1800); if (LGT.sfx) LGT.sfx.play('thuong'); if (LGT.act) LGT.act('dungchieu'); }
    return h.ok;
  }

  function paint() {
    sync();
    const showBar = !!rt && !!LGT.world && !LGT.inHouse && !LGT.panelOpen && (LGT.world.mode === 'free'); bar.hidden = !showBar; if (!showBar) return;
    const dock = document.getElementById('dock');
    if (dock && !dock.hidden) { const r = dock.getBoundingClientRect(); if (r.width) { bar.style.right = Math.max(8, Math.round(innerWidth - r.right)) + 'px'; bar.style.bottom = Math.round(innerHeight - r.top + 8) + 'px'; } }
    for (const s of SLOTS) {
      const sk = skillFor(he, s, null), { b, t } = btns[s]; if (!sk) { b.hidden = true; continue; } b.hidden = false;
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
