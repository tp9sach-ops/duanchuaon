// Quái cố định ở bãi rừng (Phiên 107, G1.6a): sinh/hồi sinh CỤC BỘ, đánh bằng Ném đá + Thương (hai nút có sẵn ở cụm nút góc phải-dưới), thu phục → Tu Vi + hạt sen (công đức).
// Logic: js/world/spawn.js, js/world/farm.js (có test). Hình 3D: js/scene/farm.js đọc LGT.farmView. Đặt LGT.farm = { status(), stone(), spear(), get tuvi, get state }.
// Nút Ném đá / Thương dùng lại ACT.da / ACT.thuong của js/ui/dock.js: js/ui/yeuquai.js chuyển sang LGT.farm khi KHÔNG có yêu quái hằng tháng.
// Quái không đánh trả (bãi rừng an toàn để luyện); đòn dùng stoneDamage/spearDamage theo sức mạnh như khi đánh yêu quái. Chưa có Hệ người chơi nên chưa tính khắc/sinh (G2).
import { MONSTERS, FARM_ZONES, FARM_CFG } from '../data/monsters.js';
import { createSpawner, tickSpawner, hitMonster, nearestMonster, setNight, isNight, rectsOf, ZONE_IDS } from '../world/spawn.js';
import { pickMonster, LOCK_RANGE } from '../world/mouseTarget.js';   // Phiên 159: chuột phải 2 lần vào quái = khóa mục tiêu
import { loadFarm, settleKill, settleBoss, senLeft, tuViOf, killXp } from '../world/farm.js';
import { STONE, SPEAR, stoneDamage, spearDamage, rngSeed } from '../world/yeuquai.js';
import { mapAvailable } from '../world/minimap.js';
import { loadAuto, autoLeft, addAutoTime, nextAction, rushTarget } from '../world/autoHunt.js';
import { blocked } from '../world/layout.js';
import { bgTick } from '../bgTick.js';
import { skillDamage } from '../world/heQuest.js';
import { kHeOf } from '../world/elements.js';

const KEY = 'lgt.farm', AKEY = 'lgt.farmauto';
const HE_TEN = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const rectDist = (r, x, z) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
const zoneDist = (id, p, night = false) => Math.min(...rectsOf(FARM_ZONES[id], night).map((r) => rectDist(r, p.x, p.z)));
const SIGHT = 18;   // m: tầm nhìn để chọn mục tiêu + hiện thanh Oán Khí (Phiên 127: đòn đánh thường giờ cận chiến nên không dùng STONE.range nữa)
const bodyOf = (m) => (m.boss ? 1.8 : m.elite ? 1.1 : 0.55);   // bán kính thân (m) để tính tầm Thương

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
  let cdStone = 0, cdSpear = 0, lastT = performance.now(), capToast = '', capExp = '', hudUntil = 0;

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
  let lockUid = '';   // Phiên 159: quái người chơi đã khóa bằng chuột phải 2 lần (rỗng = tự chọn quái gần nhất như cũ)
  const target = () => {
    const p = pos(); if (!p || !here() || bossOn()) return null;
    if (lockUid) { const L = view.mons.find((m) => m.uid === lockUid); if (L && gap(L, p) <= LOCK_RANGE) return L; lockUid = ''; }   // quái đã chết / biến mất / ở quá xa → bỏ khóa
    let best = null, bd = SIGHT + 1; for (const m of view.mons) { const d = gap(m, p); if (d <= bd) { bd = d; best = m; } } return best;
  };
  /** Chọn (khóa) quái dưới tia chuột {origin, dir}. Trả { ok, ten, uid } | { ok:false, reason }. Mọi đòn (đánh thường, Thương, chiêu) nhắm vào quái đã khóa. */
  let attackOn = false;   // Phiên 159c: bấm chuột vào quái → khóa + TỰ ĐÁNH THƯỜNG (lao tới nếu xa) cho tới khi quái chết / Esc / người chơi tự đi
  function pickAt(origin, dir, attack = false) {
    const p = pos(); if (!p || !here() || bossOn()) return { ok: false, reason: 'khong-quai' };
    const m = pickMonster(origin, dir, view.mons.filter((x) => gap(x, p) <= LOCK_RANGE)); if (!m) return { ok: false, reason: 'khong-trung' };
    lockUid = m.uid; attackOn = !!attack; toast(attack ? `Đánh ${m.ten}! (Esc hoặc tự đi để dừng)` : `Đã chọn mục tiêu: ${m.ten}`, 1400); return { ok: true, ten: m.ten, uid: m.uid };
  }
  const unlock = () => { const was = !!lockUid; lockUid = ''; attackOn = false; return was; };
  const stopAttack = () => { const was = attackOn; attackOn = false; return was; };
  function attackStep() {
    if (!attackOn) return; const p = pos(), t = lockUid && view.mons.find((m) => m.uid === lockUid);
    if (!t || !p || !here() || bossOn() || LGT.panelOpen || LGT.heldBy || (LGT.world && LGT.world.mode && LGT.world.mode !== 'free')) { attackOn = false; return; }
    if (gap(t, p) - bodyOf(t) <= SPEAR.range) stone(); else rush(t);
  }
  if (typeof addEventListener === 'function') addEventListener('keydown', (e) => { if (e.code === 'Escape' && lockUid && !LGT.panelOpen) unlock();
    else if (e.code === 'KeyR' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && !LGT.panelOpen && !document.body.classList.contains('edit-mode') && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') && !(e.target && e.target.isContentEditable)) { spear(); } });   // R = Thương   // Esc bỏ khóa mục tiêu (khi không có bảng nào đang mở)

  function reward(r) {
    const mon = r.mon, now = Date.now(), s = settleKill(farm, MONSTERS[mon.type], r.drops, now); farm = s.farm; save();
    if (s.senGain > 0 && LGT.addMerit) LGT.addMerit(s.senGain);
    const xp = killXp(mon);   // Phiên 138: MỖI lần thu phục quái đều cộng kinh nghiệm cấp độ (thanh "Cấp"), kể cả khi đã hết trần Tu Vi trong ngày (trần ngày chỉ áp cho Tu Vi và hạt sen)
    const bits = [`Thu phục ${mon.ten}!`]; if (xp > 0) bits.push(`+${xp} kinh nghiệm`); if (s.senGain > 0) bits.push(`+${s.senGain} hạt sen`); if (s.expGain > 0) bits.push(`+${s.expGain} Tu Vi`);
    if (xp > 0 && LGT.addXp) LGT.addXp(xp);
    toast(bits.join(' '), 2600); if (LGT.sfx) LGT.sfx.play('quai-ha');
    if (s.leveledUp) setTimeout(() => toast(`Tu Vi lên cấp ${s.tuvi}! Công và Thủ của bạn tăng.`, 4200), 1200);
    if (s.expCapped && capExp !== farm.cnt.day) { capExp = farm.cnt.day; setTimeout(() => toast('Hôm nay bạn đã nhận đủ Tu Vi từ hàng yêu. Vẫn nhận hạt sen theo trần riêng — mai quay lại nhận tiếp!', 5200), 2200); }
    if (s.senCapped && capToast !== farm.sen.day) { capToast = farm.sen.day; setTimeout(() => toast('Hôm nay bạn đã nhận đủ hạt sen từ hàng yêu. Vẫn được Tu Vi — mai quay lại nhận tiếp!', 5200), 2800); }
  }
  // Thu phục yêu quái hằng tháng (js/ui/yeuquai.js gọi khi đóng góp đủ): cộng Tu Vi nguồn 'boss', trần theo ngày.
  function grantBoss() {
    const s = settleBoss(farm, Date.now()); farm = s.farm; save();
    if (s.expGain > 0) { toast(`+${s.expGain} Tu Vi từ thu phục yêu quái.`, 3000); if (s.leveledUp) setTimeout(() => toast(`Tu Vi lên cấp ${s.tuvi}! Công và Thủ của bạn tăng.`, 4200), 1200); }
    else if (s.expCapped) toast('Hôm nay bạn đã nhận đủ Tu Vi từ thu phục yêu quái. Mai quay lại nhận tiếp!', 3600);
    return s;
  }
  function hit(uid, dmg) {
    const m = view.mons.find((x) => x.uid === uid), sp = m && spOf(m); if (!m || !sp) return;
    const r = hitMonster(sp, m.id, dmg, 'ban', rng); m.flash = 0.35; hudUntil = performance.now() + 2500;
    if (r.dead) { view.mons = view.mons.filter((x) => x.uid !== uid); reward(r); }
  }
  function aim(needNear) {
    const t = target();
    if (!t) { toast('Chưa có quái nào gần. Quái nằm ngủ trong bụi cây các khoảng rừng sâu (cạnh đường mòn rừng thông, đường mòn thác, phía bắc Bảo Tháp); ban đêm chúng tràn ra đường. Đi vào bụi rồi đánh một con.', 2600); return null; }
    if (needNear && gap(t, pos()) - bodyOf(t) > SPEAR.range) { toast('Lại gần quái hơn mới đánh được.', 1800); return null; }
    return t;
  }
  function stone() {
    if (!here() || bossOn() || cdStone > 0) return; const t = aim(true); if (!t) return;
    cdStone = STONE.cd; if (LGT.sfx) LGT.sfx.play('nem-da'); hit(t.uid, stoneDamage(str()));   // Phiên 127: Đánh thường = đòn cận chiến trúng ngay (không còn ném đá)
  }
  function spear() {
    if (!here() || bossOn() || cdSpear > 0) return; const t = aim(true); if (!t) return;
    cdSpear = SPEAR.cd; if (LGT.sfx) LGT.sfx.play('thuong'); hit(t.uid, spearDamage(str()));
  }

  // Tự Động Hàng Yêu (Phiên 108; Phiên 127: tự LAO tới quái rồi Thương/Đánh thường, trong tầm autoRange). Dừng khi mở bảng, vào nhà, có yêu quái hằng tháng, hoặc hết 60 phút hôm nay.
  function stopAuto(msg) { if (!running) return; running = false; saveAuto(); if (msg) toast(msg, 3200); }
  function toggleAuto() {
    if (running) { stopAuto('Đã tắt tự động hàng yêu.'); if (LGT.sfx) LGT.sfx.play('tu-dong-tat'); return; }
    if (autoLeft(auto, Date.now()) <= 0) { toast('Hôm nay bạn đã dùng hết thời gian tự động hàng yêu. Mai dùng tiếp, hoặc tự bấm đánh nhé!', 3600); return; }
    if (!here() || bossOn()) return;
    running = true; if (LGT.sfx) LGT.sfx.play('tu-dong-bat'); toast(`Tự động hàng yêu BẬT: nhân vật tự lao vào quái trong ${FARM_CFG.autoRange} m rồi múa côn đánh. Mở bảng sẽ tự dừng; chuyển sang tab khác thì nhân vật vẫn tiếp tục đánh.`, 4200);
  }
  function autoStep(dt) {
    if (LGT.panelOpen || LGT.heldBy || (LGT.world && LGT.world.mode && LGT.world.mode !== 'free')) return stopAuto('Tự động hàng yêu đã dừng.');
    const r = addAutoTime(auto, dt, Date.now()); auto = r.state; if (performance.now() - autoSaved > 5000) { autoSaved = performance.now(); saveAuto(); }
    if (r.out) return stopAuto('Hết 60 phút tự động hàng yêu hôm nay. Mai dùng tiếp nhé!');
    const p = pos(); let best = null, bd = Infinity; for (const m of view.mons) { const d = gap(m, p); if (d < bd) { bd = d; best = m; } }
    if (!best) return;
    const act = nextAction({ gap: bd, body: bodyOf(best), stoneReady: cdStone <= 0, spearReady: cdSpear <= 0, spearRange: SPEAR.range });
    if (act === 'spear') spear(); else if (act === 'stone') stone();
    else if (act === 'rush') rush(best);
  }
  // Phiên 127: Tự động LAO vào quái (trong autoRange) — đạp đất chạy nhanh tới sát tầm đâm, không xuyên cây/tường; tới nơi thì autoStep tự Thương/Đánh thường.
  function rush(m) {
    const W = LGT.world; if (!W || !W.dash || W.dashing) return;
    const to = rushTarget(pos(), m, { body: bodyOf(m), stand: 2.2, isBlocked: blocked }); if (!to) return;
    W.dash(to, Math.max(0.25, Math.min(1.4, to.dist / 9)), { tilt: false }); if (LGT.sfx) LGT.sfx.play('thiet-dau');
  }

  function tick() {
    const now = performance.now(), dt = Math.min(typeof document !== 'undefined' && document.hidden ? 1 : 0.25, (now - lastT) / 1000); lastT = now;   // Phiên 143: tab ẩn → nhịp có thể thưa, cho phép bước dài hơn để game không chậm lại
    cdStone = Math.max(0, cdStone - dt); cdSpear = Math.max(0, cdSpear - dt);
    const p = pos();
    if (!p || !here() || bossOn()) { stopAuto('Tự động hàng yêu đã dừng.'); if (view.mons.length) { view.mons = []; view.stones = []; view.target = ''; } box.hidden = true; return; }
    const mons = [];
    const night = isNight(LGT.night);   // Phiên 130: ban ngày quái NGỦ trong bụi khoảng rừng; ban đêm nhiều hơn và TRÀN RA đường (spawn.js setNight)
    for (const id of ZONE_IDS) {
      if (zoneDist(id, p, night) > FARM_CFG.nearMargin) { if (spawners[id]) away[id] = (away[id] || 0) + dt; continue; }
      if (!spawners[id]) spawners[id] = createSpawner(id, rng, { player: p, night });
      const sp = spawners[id];
      setNight(sp, night, rng, p);
      if (away[id] > 0) { for (let s = Math.min(away[id], 90); s > 0; s -= 5) tickSpawner(sp, Math.min(5, s), rng, p); away[id] = 0; }   // đi xa rồi quay lại: quái đã hồi sinh bù (tối đa 90 giây)
      tickSpawner(sp, dt, rng, p);
      for (const m of sp.mons) { m.zone = id; m.night = night; m.uid = `${id}:${m.id}`; m.flash = Math.max(0, (m.flash || 0) - dt); mons.push(m); }
    }
    if (mons.length > FARM_CFG.maxVisible) { mons.sort((a, b) => (b.boss ? 1e6 : 0) - (a.boss ? 1e6 : 0) || gap(a, p) - gap(b, p)); mons.length = FARM_CFG.maxVisible; }   // quá bể vẽ: giữ boss + quái gần nhất
    view.mons = mons;
    view.stones = view.stones.filter((s) => { s.t += dt; if (s.t < s.dur) return true; hit(s.uid, s.dmg); if (LGT.sfx) LGT.sfx.play('da-trung'); return false; });
    if (running) autoStep(dt); else attackStep();
    const t = target(); view.target = t ? t.uid : '';
    const show = !!t && !bossOn(); box.hidden = !show && now > hudUntil || bossOn();
    if (!box.hidden && t) {
      const pct = Math.max(0, Math.min(1, t.oan / Math.max(1, t.max)));
      nm.textContent = `${t.ten} · Cấp ${t.lv} · ${HE_TEN[t.he] || ''}${t.boss ? ' · Boss vùng' : t.elite ? ' · Tinh anh' : ''}`;
      fill.style.width = `${Math.round(pct * 100)}%`; box.classList.toggle('kim', t.he === 'kim'); box.classList.toggle('calm', pct <= 0.25);
      const tv = tuViOf(farm); tvEl.textContent = `Tu Vi ${tv.tuvi} · ${tv.need ? `${tv.into}/${tv.need}` : 'tối đa'}`;
      senEl.textContent = `Hạt sen hôm nay còn ${senLeft(farm, Date.now())}`;
    }
  }
  bgTick.on(tick);   // Phiên 143: nhịp từ Worker → chạy tiếp cả khi chuyển tab khác

  // Phiên 143: chiêu của phái (js/ui/heSkill.js) đánh quái gần nhất. skillReady() → { ok } | { ok:false, reason:'khong-quai'|'xa' }; skillHit(heSo) → { ok, dmg, ten }.
  function skillReady() { const t = target(); if (!t) return { ok: false, reason: 'khong-quai' }; if (gap(t, pos()) - bodyOf(t) > SPEAR.range + 3) return { ok: false, reason: 'xa' }; return { ok: true, ten: t.ten }; }
  function skillHit(heSo) {
    const t = target(); if (!t) return { ok: false, reason: 'khong-quai' };
    const dmg = Math.max(1, Math.round(skillDamage(spearDamage(str()), heSo) * kHeOf(LGT.he, t.he)));
    hit(t.uid, dmg); return { ok: true, dmg, ten: t.ten };
  }

  LGT.farm = {
    skillReady, skillHit, pickAt, unlock, stopAttack, get attacking() { return attackOn; }, get locked() { return lockUid; }, get tuviInfo() { return tuViOf(farm); },
    stone, spear, toggleAuto, grantBoss,
    get tuvi() { return tuViOf(farm).tuvi; }, get state() { return farm; },
    status() { const t = target(); return { active: !!t || running, ten: t ? t.ten : '', stoneCd: cdStone, spearCd: cdSpear, canAuto: true, auto: running, autoLeft: Math.floor(autoLeft(auto, Date.now()) / 60) }; },
  };
  return LGT.farm;
}
