// Quái cố định ở bãi rừng (Phiên 107, G1.6a): sinh/hồi sinh CỤC BỘ, đánh bằng Ném đá + Thương (hai nút có sẵn ở cụm nút góc phải-dưới), thu phục → Tu Vi + hạt sen (công đức).
// Logic: js/world/spawn.js, js/world/farm.js (có test). Hình 3D: js/scene/farm.js đọc LGT.farmView. Đặt LGT.farm = { status(), stone(), spear(), get tuvi, get state }.
// Nút Ném đá / Thương dùng lại ACT.da / ACT.thuong của js/ui/dock.js: js/ui/yeuquai.js chuyển sang LGT.farm khi KHÔNG có yêu quái hằng tháng.
// Quái không đánh trả (bãi rừng an toàn để luyện); đòn dùng stoneDamage/spearDamage theo sức mạnh như khi đánh yêu quái. Chưa có Hệ người chơi nên chưa tính khắc/sinh (G2).
import { MONSTERS, FARM_ZONES, FARM_CFG } from '../data/monsters.js';
import { createSpawner, tickSpawner, hitMonster, nearestMonster, ZONE_IDS } from '../world/spawn.js';
import { loadFarm, settleKill, senLeft, tuViOf } from '../world/farm.js';
import { STONE, SPEAR, stoneDamage, spearDamage, rngSeed } from '../world/yeuquai.js';
import { mapAvailable } from '../world/minimap.js';
import { loadAuto, autoLeft, addAutoTime, nextAction } from '../world/autoHunt.js';

const KEY = 'lgt.farm', AKEY = 'lgt.farmauto';
const HE_TEN = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const rectDist = (r, x, z) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
const zoneDist = (id, p) => Math.min(...FARM_ZONES[id].rects.map((r) => rectDist(r, p.x, p.z)));
const bodyOf = (m) => (m.elite ? 1.1 : 0.55);   // bán kính thân (m) để tính tầm Thương

/** hud: phần tử HUD. opts: { toast }. */
export function initFarm(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let farm = loadFarm(null, Date.now()); try { farm = loadFarm(localStorage.getItem(KEY), Date.now()); } catch (_) { /* riêng tư */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(farm)); } catch (_) { /* bỏ qua */ } };
  const rng = rngSeed((Date.now() ^ 0x2545f491) >>> 0), view = LGT.farmView = LGT.farmView || { mons: [], target: '', stones: [] };
  const spawners = {}, away = {};   // id vùng → bộ sinh quái / số giây người chơi đã rời xa (để quái hồi sinh bù khi quay lại)
  let auto = loadAuto(null, Date.now()); try { auto = loadAuto(localStorage.getItem(AKEY), Date.now()); } catch (_) { /* riêng tư */ }
  const saveAuto = () => { try { localStorage.setItem(AKEY, JSON.stringify(auto)); } catch (_) { /* bỏ qua */ } };
  let running = false, autoSaved = 0;
  let cdStone = 0, cdSpear = 0, lastT = performance.now(), capToast = '', hudUntil = 0;

  const box = el('div', 'fm-hud'); box.hidden = true;
  const nm = el('b', 'fm-name'), bar = el('i', 'fm-bar'), fill = el('i'), sub = el('div', 'fm-sub'), tvEl = el('span'), senEl = el('span');
  bar.appendChild(fill); sub.append(tvEl, senEl); box.append(nm, bar, sub); hud.appendChild(box);

  const pos = () => (LGT.world && LGT.world.pos) || null;
  const here = () => !!LGT.world && !LGT.inHouse && mapAvailable(LGT.zones) && !(LGT.swim && LGT.swim.active);
  const bossOn = () => !!(LGT.yq && LGT.yq.active);
  const str = () => (LGT.strength ? LGT.strength.value : 6);
  const all = () => ZONE_IDS.filter((id) => spawners[id]).flatMap((id) => spawners[id].mons);
  const spOf = (m) => spawners[m.zone];
  const gap = (m, p) => Math.hypot(m.x - p.x, m.z - p.z);
  const target = () => { const p = pos(); if (!p || !here() || bossOn()) return null; let best = null, bd = STONE.range + 1; for (const m of view.mons) { const d = gap(m, p); if (d <= bd) { bd = d; best = m; } } return best; };

  function reward(r) {
    const mon = r.mon, now = Date.now(), s = settleKill(farm, MONSTERS[mon.type], r.drops, now); farm = s.farm; save();
    if (s.senGain > 0 && LGT.addMerit) LGT.addMerit(s.senGain);
    const bits = [`Thu phục ${mon.ten}!`]; if (s.senGain > 0) bits.push(`+${s.senGain} hạt sen`); if (s.expGain > 0) bits.push(`+${s.expGain} Tu Vi`);
    toast(bits.join(' '), 2600);
    if (s.leveledUp) setTimeout(() => toast(`Tu Vi lên cấp ${s.tuvi}! Công và Thủ của bạn tăng.`, 4200), 1200);
    if (s.senCapped && capToast !== farm.sen.day) { capToast = farm.sen.day; setTimeout(() => toast('Hôm nay bạn đã nhận đủ hạt sen từ hàng yêu. Vẫn được Tu Vi — mai quay lại nhận tiếp!', 5200), 2800); }
  }
  function hit(uid, dmg) {
    const m = view.mons.find((x) => x.uid === uid), sp = m && spOf(m); if (!m || !sp) return;
    const r = hitMonster(sp, m.id, dmg, 'ban', rng); m.flash = 0.35; hudUntil = performance.now() + 2500;
    if (r.dead) { view.mons = view.mons.filter((x) => x.uid !== uid); reward(r); }
  }
  function aim(needNear) {
    const t = target();
    if (!t) { toast('Chưa có quái nào gần. Đi vào bãi rừng (phía tây làng) hoặc đường mòn để luyện.', 2600); return null; }
    if (needNear && gap(t, pos()) - bodyOf(t) > SPEAR.range) { toast('Lại gần quái hơn mới đâm được thương.', 1800); return null; }
    return t;
  }
  function stone() {
    if (!here() || bossOn() || cdStone > 0) return; const t = aim(false); if (!t) return;
    const p = pos(), d = gap(t, p); cdStone = STONE.cd;
    view.stones.push({ x0: p.x, z0: p.z, x1: t.x, z1: t.z, t: 0, dur: Math.max(0.15, d / STONE.speed), uid: t.uid, dmg: stoneDamage(str()) });
  }
  function spear() {
    if (!here() || bossOn() || cdSpear > 0) return; const t = aim(true); if (!t) return;
    cdSpear = SPEAR.cd; hit(t.uid, spearDamage(str()));
  }

  // Tự Động Hàng Yêu (Phiên 108): tự Thương/Ném đá quái trong tầm autoRange, không tự đi. Dừng khi mở bảng, rời tab, vào nhà, có yêu quái hằng tháng, hoặc hết 60 phút hôm nay.
  function stopAuto(msg) { if (!running) return; running = false; saveAuto(); if (msg) toast(msg, 3200); }
  function toggleAuto() {
    if (running) { stopAuto('Đã tắt tự động hàng yêu.'); return; }
    if (autoLeft(auto, Date.now()) <= 0) { toast('Hôm nay bạn đã dùng hết thời gian tự động hàng yêu. Mai dùng tiếp, hoặc tự bấm đánh nhé!', 3600); return; }
    if (!here() || bossOn()) return;
    running = true; toast(`Tự động hàng yêu BẬT: đứng yên, nhân vật tự đánh quái trong ${FARM_CFG.autoRange} m. Mở bảng hoặc rời trang sẽ tự dừng.`, 4200);
  }
  function autoStep(dt) {
    if ((typeof document !== 'undefined' && document.hidden) || LGT.panelOpen || LGT.heldBy || (LGT.world && LGT.world.mode && LGT.world.mode !== 'free')) return stopAuto('Tự động hàng yêu đã dừng.');
    const r = addAutoTime(auto, dt, Date.now()); auto = r.state; if (performance.now() - autoSaved > 5000) { autoSaved = performance.now(); saveAuto(); }
    if (r.out) return stopAuto('Hết 60 phút tự động hàng yêu hôm nay. Mai dùng tiếp nhé!');
    const p = pos(); let best = null, bd = Infinity; for (const m of view.mons) { const d = gap(m, p); if (d < bd) { bd = d; best = m; } }
    if (!best) return;
    const act = nextAction({ gap: bd, body: bodyOf(best), stoneReady: cdStone <= 0, spearReady: cdSpear <= 0, spearRange: SPEAR.range });
    if (act === 'spear') spear(); else if (act === 'stone') stone();
  }

  function tick() {
    const now = performance.now(), dt = Math.min(0.25, (now - lastT) / 1000); lastT = now;
    cdStone = Math.max(0, cdStone - dt); cdSpear = Math.max(0, cdSpear - dt);
    const p = pos();
    if (!p || !here() || bossOn()) { stopAuto('Tự động hàng yêu đã dừng.'); if (view.mons.length) { view.mons = []; view.stones = []; view.target = ''; } box.hidden = true; return; }
    const mons = [];
    for (const id of ZONE_IDS) {
      if (zoneDist(id, p) > FARM_CFG.nearMargin) { if (spawners[id]) away[id] = (away[id] || 0) + dt; continue; }
      if (!spawners[id]) spawners[id] = createSpawner(id, rng, { player: p });
      const sp = spawners[id];
      if (away[id] > 0) { for (let s = Math.min(away[id], 90); s > 0; s -= 5) tickSpawner(sp, Math.min(5, s), rng, p); away[id] = 0; }   // đi xa rồi quay lại: quái đã hồi sinh bù (tối đa 90 giây)
      tickSpawner(sp, dt, rng, p);
      for (const m of sp.mons) { m.zone = id; m.uid = `${id}:${m.id}`; m.flash = Math.max(0, (m.flash || 0) - dt); mons.push(m); }
    }
    view.mons = mons;
    view.stones = view.stones.filter((s) => { s.t += dt; if (s.t < s.dur) return true; hit(s.uid, s.dmg); return false; });
    if (running) autoStep(dt);
    const t = target(); view.target = t ? t.uid : '';
    const show = !!t && !bossOn(); box.hidden = !show && now > hudUntil || bossOn();
    if (!box.hidden && t) {
      const pct = Math.max(0, Math.min(1, t.oan / Math.max(1, t.max)));
      nm.textContent = `${t.ten} · Cấp ${t.lv} · ${HE_TEN[t.he] || ''}${t.elite ? ' · Tinh anh' : ''}`;
      fill.style.width = `${Math.round(pct * 100)}%`; box.classList.toggle('kim', t.he === 'kim'); box.classList.toggle('calm', pct <= 0.25);
      const tv = tuViOf(farm); tvEl.textContent = `Tu Vi ${tv.tuvi} · ${tv.need ? `${tv.into}/${tv.need}` : 'tối đa'}`;
      senEl.textContent = `Hạt sen hôm nay còn ${senLeft(farm, Date.now())}`;
    }
  }
  setInterval(tick, 100);

  LGT.farm = {
    stone, spear, toggleAuto,
    get tuvi() { return tuViOf(farm).tuvi; }, get state() { return farm; },
    status() { const t = target(); return { active: !!t || running, ten: t ? t.ten : '', stoneCd: cdStone, spearCd: cdSpear, canAuto: true, auto: running, autoLeft: Math.floor(autoLeft(auto, Date.now()) / 60) }; },
  };
  return LGT.farm;
}
