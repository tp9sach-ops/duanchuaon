// Quái bãi rừng ĐÁNH TRẢ + thanh Sinh Lực người chơi (Phiên 115, G1.6 phần còn thiếu). Chạy SAU initFarm (js/ui/farm.js), không sửa farm.js:
// đọc LGT.farmView.mons (chính các đối tượng quái của spawn.js), thấy Oán Khí của quái giảm (bị đánh) thì quái nổi giận: đuổi theo, gồng chiêu báo trước (phồng lên) rồi đánh.
// Hết Sinh Lực → được đưa về cửa chùa (không mất đồ, không mất cấp, GDD mục 8), Tự Động Hàng Yêu dừng. Logic: js/world/monsterAttack.js (có test). Số liệu TẠM: js/data/monsterAI.js.
// Mục 1 (khôi phục sau khi Phiên 143 ghi đè): Ngọc hồi máu (LGT.items.regenMul() = 5) hồi Sinh Lực nhanh gấp 5; Ngọc dịch chuyển (LGT.items.tryRevive()) hết Sinh Lực thì hồi sinh NGAY TẠI CHỖ, không về cổng chùa. js/ui/items.js đặt LGT.items; chưa có thì mọi thứ chạy như cũ.
// Phiên 145: khi Tự Động Hàng Yêu đang BẬT, hết Sinh Lực thì hồi sức NGAY TẠI CHỖ và đánh tiếp (không dừng tự động, không về cổng chùa); cũng không còn tự dừng khi Sinh Lực thấp. Tự động chỉ dừng khi người chơi tắt / mở bảng / hết 60 phút. Đánh tay (không bật tự động) giữ nguyên: hết máu về cửa chùa.
// Phiên 147 (SỬA theo ý ptg): Tự Động Hàng Yêu hết Sinh Lực → VỀ CỔNG CHÙA hồi sức (đầy máu + bất tử vài giây), tự động KHÔNG tắt; sau AUTO_BACK_MS (3 giây) nhân vật tự quay lại đúng chỗ đang đánh (nếu tự động vẫn bật) và đánh tiếp. Ngọc dịch chuyển vẫn hồi sinh tại chỗ. Đánh tay: về cửa chùa như cũ.
import { VITALS_CFG } from '../data/monsterAI.js';
import { provoke, calm, stepMonster, createVitals } from '../world/monsterAttack.js';
import { statsOf } from '../world/stats.js';
import { relation } from '../world/elements.js';
import { RESPAWN } from '../world/yeuquai.js';
import { bgTick } from '../bgTick.js';

const AUTO_BACK_MS = 3000;   // Phiên 147: nghỉ ở cổng chùa bao lâu (ms) rồi tự quay lại chỗ đang đánh

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD. opts: { toast }. */
export function initFarmCombat(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const vit = createVitals({ tuvi: LGT.farm ? LGT.farm.tuvi : 1 });
  const engaged = new Map();   // uid → quái đang nổi giận (để hết giận khi quái biến mất / người chơi rời vùng)
  let lastT = performance.now(), warned = false, hudUntil = 0, autoNote = 0;
  let back = null;   // Phiên 147: { x, z, at } — chỗ đang đánh trước khi gục + thời điểm (performance.now) được quay lại

  const box = el('div', 'fm-hp'); box.hidden = true;
  const bar = el('i', 'fm-hpbar'), fill = el('i'), txt = el('span', 'fm-hptxt');
  bar.appendChild(fill); box.append(txt, bar); hud.appendChild(box);

  /** Tiến Sinh Lực d giây; có Ngọc hồi máu thì tiến thêm (k − 1) lần nữa khi KHÔNG còn bất tử sau đòn (để hồi nhanh gấp k mà không rút ngắn thời gian bất tử). */
  function stepVit(d) {
    vit.step(d);
    const k = LGT.items && LGT.items.regenMul ? LGT.items.regenMul() : 1;
    if (k > 1 && !vit.down && vit.grace <= 0) for (let i = 1; i < k; i++) vit.step(d);
  }

  const autoOn = () => { try { return !!(LGT.farm && LGT.farm.status().auto); } catch (_) { return false; } };

  function defeat() {
    for (const m of engaged.values()) calm(m); engaged.clear();
    if (LGT.items && LGT.items.tryRevive && LGT.items.tryRevive()) { vit.revive(); return; }   // Ngọc dịch chuyển: hồi sinh ngay tại chỗ, không dừng tự động, không về cổng chùa
    if (autoOn()) {   // Phiên 147: đang Tự Động Hàng Yêu → về cổng chùa hồi sức, KHÔNG tắt tự động; tick() sẽ đưa nhân vật quay lại chỗ đánh sau AUTO_BACK_MS
      const p = LGT.world && LGT.world.pos, now = performance.now();
      if (p && !back) back = { x: p.x, z: p.z, at: now + AUTO_BACK_MS };   // đã đang chờ quay lại thì giữ chỗ cũ (không ghi đè bằng vị trí ở cổng chùa)
      else if (back) back.at = now + AUTO_BACK_MS;
      if (LGT.world && LGT.world.teleport) LGT.world.teleport(RESPAWN.x, RESPAWN.z);
      vit.revive();
      if (now - autoNote > 15000) { autoNote = now; toast('Hết Sinh Lực: bạn về cổng chùa hồi sức, vài giây nữa tự quay lại đánh tiếp (tự động hàng yêu vẫn bật).', 3600); }
      return;
    }
    back = null;
    if (LGT.world && LGT.world.teleport) LGT.world.teleport(RESPAWN.x, RESPAWN.z);
    vit.revive();
    toast('Bạn kiệt sức và được đưa về cửa chùa nghỉ ngơi. Không mất đồ, không mất cấp — nghỉ một chút rồi quay lại luyện tiếp nhé!', 5200);
  }

  function tick() {
    const now = performance.now(), dt = Math.min(typeof document !== 'undefined' && document.hidden ? 0.5 : 0.25, (now - lastT) / 1000); lastT = now;
    if (back && now >= back.at) {   // Phiên 147: hết thời gian nghỉ ở cổng chùa → quay lại chỗ đánh nếu tự động vẫn bật (người chơi tắt tự động thì ở lại cổng chùa)
      const b = back; back = null;
      if (autoOn() && LGT.world && LGT.world.teleport && !LGT.inHouse) LGT.world.teleport(b.x, b.z);
    }
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
    // 3) (Phiên 145) Tự Động Hàng Yêu KHÔNG còn tự dừng khi Sinh Lực thấp — hết Sinh Lực thì defeat() đưa về cổng chùa hồi sức rồi tự quay lại đánh tiếp (Phiên 147).
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
