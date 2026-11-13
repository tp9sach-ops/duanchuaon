// Quái bãi rừng ĐÁNH TRẢ + thanh Sinh Lực người chơi (Phiên 115, G1.6 phần còn thiếu). Chạy SAU initFarm (js/ui/farm.js), không sửa farm.js:
// đọc LGT.farmView.mons (chính các đối tượng quái của spawn.js), thấy Oán Khí của quái giảm (bị đánh) thì quái nổi giận: đuổi theo, gồng chiêu báo trước (phồng lên) rồi đánh.
// Hết Sinh Lực → được đưa về cửa chùa (không mất đồ, không mất cấp, GDD mục 8), Tự Động Hàng Yêu dừng. Logic: js/world/monsterAttack.js (có test). Số liệu TẠM: js/data/monsterAI.js.
// Mục 1 (khôi phục sau khi Phiên 143 ghi đè): Ngọc hồi máu (LGT.items.regenMul() = 5) hồi Sinh Lực nhanh gấp 5; Ngọc dịch chuyển (LGT.items.tryRevive()) hết Sinh Lực thì hồi sinh NGAY TẠI CHỖ, không về cổng chùa. js/ui/items.js đặt LGT.items; chưa có thì mọi thứ chạy như cũ.
import { VITALS_CFG } from '../data/monsterAI.js';
import { provoke, calm, stepMonster, createVitals } from '../world/monsterAttack.js';
import { statsOf } from '../world/stats.js';
import { relation } from '../world/elements.js';
import { RESPAWN } from '../world/yeuquai.js';
import { bgTick } from '../bgTick.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD. opts: { toast }. */
export function initFarmCombat(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const vit = createVitals({ tuvi: LGT.farm ? LGT.farm.tuvi : 1 });
  const engaged = new Map();   // uid → quái đang nổi giận (để hết giận khi quái biến mất / người chơi rời vùng)
  let lastT = performance.now(), warned = false, hudUntil = 0;

  const box = el('div', 'fm-hp'); box.hidden = true;
  const bar = el('i', 'fm-hpbar'), fill = el('i'), txt = el('span', 'fm-hptxt');
  bar.appendChild(fill); box.append(txt, bar); hud.appendChild(box);

  /** Tiến Sinh Lực d giây; có Ngọc hồi máu thì tiến thêm (k − 1) lần nữa khi KHÔNG còn bất tử sau đòn (để hồi nhanh gấp k mà không rút ngắn thời gian bất tử). */
  function stepVit(d) {
    vit.step(d);
    const k = LGT.items && LGT.items.regenMul ? LGT.items.regenMul() : 1;
    if (k > 1 && !vit.down && vit.grace <= 0) for (let i = 1; i < k; i++) vit.step(d);
  }

  function defeat() {
    for (const m of engaged.values()) calm(m); engaged.clear();
    if (LGT.items && LGT.items.tryRevive && LGT.items.tryRevive()) { vit.revive(); return; }   // Ngọc dịch chuyển: hồi sinh ngay tại chỗ, không dừng tự động, không về cổng chùa
    try { if (LGT.farm && LGT.farm.status().auto) LGT.farm.toggleAuto(); } catch (_) { /* bỏ qua */ }
    if (LGT.world && LGT.world.teleport) LGT.world.teleport(RESPAWN.x, RESPAWN.z);
    vit.revive();
    toast('Bạn kiệt sức và được đưa về cửa chùa nghỉ ngơi. Không mất đồ, không mất cấp — nghỉ một chút rồi quay lại luyện tiếp nhé!', 5200);
  }

  function tick() {
    const now = performance.now(), dt = Math.min(typeof document !== 'undefined' && document.hidden ? 0.5 : 0.25, (now - lastT) / 1000); lastT = now;
    const view = LGT.farmView, p = LGT.world && LGT.world.pos, mons = view && view.mons ? view.mons : [];
    const live = new Set(mons.map((m) => m.uid));
    for (const [uid, m] of engaged) if (!live.has(uid)) { calm(m); engaged.delete(uid); }   // quái bị thu phục / người chơi rời xa
    if (LGT.farm) vit.setTuVi(LGT.farm.tuvi);
    if (!p || !mons.length) { stepVit(dt); show(); return; }
    // 1) quái bị đánh (Oán Khí giảm) thì nổi giận
    for (const m of mons) {
      if (m._o !== undefined && m.oan < m._o) { vit.touch(); if (!m.eng) { provoke(m); engaged.set(m.uid, m); if (!warned) { warned = true; toast('Quái bị đánh sẽ đánh trả! Chú ý thanh Sinh Lực: lùi ra khi quái phồng lên để né, hoặc nghỉ một lát để hồi.', 5200); } } else m.engT = 0; }
      m._o = m.oan;
    }
    // 2) quái nổi giận đuổi, gồng chiêu, đánh
    const tv = LGT.farm ? LGT.farm.tuvi : 1, thu = statsOf(tv).thu;
    for (const m of engaged.values()) {
      const ev = stepMonster(m, dt, p, { thu, max: vit.max, rel: relation(m.he, LGT.he) });
      if (m.wind > 0) m.flash = Math.max(m.flash || 0, 0.55);   // phồng lên báo trước (scene/farm.js vẽ theo m.flash)
      if (!ev) continue;
      if (ev.k === 'calm') engaged.delete(m.uid);
      else if (ev.k === 'windup' && ev.slam) toast(`${m.ten} gồng Giậm Đất! Chạy ra khỏi vòng đỏ.`, 1500);
      else if (ev.k === 'strike') { const r = vit.take(ev.dmg); if (r.taken > 0) { hudUntil = now + 3000; box.classList.add('hurt'); setTimeout(() => box.classList.remove('hurt'), 220); } if (r.down) { defeat(); break; } }
    }
    stepVit(dt);
    // 3) Tự Động Hàng Yêu tự dừng khi Sinh Lực thấp
    if (LGT.farm && vit.pct < VITALS_CFG.autoStopFrac) { try { if (LGT.farm.status().auto) { LGT.farm.toggleAuto(); toast('Tự động hàng yêu dừng vì Sinh Lực thấp. Lùi ra nghỉ một lát nhé!', 4200); } } catch (_) { /* bỏ qua */ } }
    show(now);
  }
  function show(now = performance.now()) {
    const fighting = engaged.size > 0, hurt = vit.hp < vit.max;
    box.hidden = !(fighting || hurt || now < hudUntil);
    if (box.hidden) return;
    txt.textContent = `Sinh Lực ${vit.hp}/${vit.max}`; fill.style.width = `${Math.round(vit.pct * 100)}%`; box.classList.toggle('low', vit.pct < VITALS_CFG.autoStopFrac);
  }
  bgTick.on(tick);   // Phiên 143: chạy tiếp cả khi chuyển tab

  LGT.farmCombat = { get hp() { return vit.hp; }, get max() { return vit.max; }, get engaged() { return engaged.size; }, vitals: vit };
  return LGT.farmCombat;
}
