// Yêu quái hằng tháng (Phiên 64): mô phỏng, thanh máu, đòn ném đá / thương / ném yêu quái, hồi sinh ở cửa chùa, nhặt lá bồ đề. Logic ở js/world/yeuquai.js (có test).
// Đặt LGT.yq = { active, boss, hp, stat, bonus, stone(), spear(), throwBoss(), status() } và LGT.yqView (cảnh 3D js/scene/yeuquai.js đọc). Thử ngay không cần chờ lịch: thêm ?yq=da (hoặc nuoc / lua) vào địa chỉ trang.
// Đánh CHUNG (Phiên 71): khi có apiUrl và đang ở khung giờ thật, máu yêu quái + túi lá bồ đề dùng chung qua Apps Script (gas/Yq.gs, action 'yq'; logic js/world/yqCoop.js). Chuyển động/vùng đỏ vẫn mỗi máy tự mô phỏng. Không có apiUrl hoặc chế độ thử ?yq= → đánh một mình như cũ.
import { YQ, DIFF, windupOf, eventAt, eventPhase, nextEvent, createBoss, stepBoss, hitBoss, shareOf, rewardFor, hitDamage, newPlayer, hurt, tickPlayer, RESPAWN, STONE, SPEAR, stoneDamage, spearDamage, throwBossDamage, lootDrops, pickLoot, tickLoot, loadYq, rngSeed, MIN_SHARE } from '../world/yeuquai.js';
import { canGrab } from '../world/strength.js';
import { callApi, apiEnabled } from '../api.js';
import { COOP_POLL_MS, coopKeyOk, buildReq, applyServer, lootFromServer, leavesGranted } from '../world/yqCoop.js';
import { move } from '../world/layout.js';
import { levelOf } from '../world/quests.js';

const KEY = 'lgt.yq';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fmt = (ms) => { const d = new Date(ms + 7 * 3600e3); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')} lúc ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };

/** hud: phần tử HUD. opts: { toast, addMerit }. */
export function initYeuQuai(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let stat = loadYq(null); try { stat = loadYq(localStorage.getItem(KEY)); } catch (_) { /* riêng tư */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(stat)); } catch (_) { /* bỏ qua */ } };
  let force = '', forceDiff = 'cao'; try { const q = new URLSearchParams(location.search).get('yq'); if (q && YQ[q]) force = q; const yd = new URLSearchParams(location.search).get('yd'); if (yd && DIFF[yd]) forceDiff = yd; } catch (_) { /* bỏ qua */ }
  const rng = rngSeed((Date.now() ^ 0x5bd1e995) >>> 0), view = LGT.yqView = { boss: null, shapes: [], wt: 0, flash: 0, loot: [], stones: [], type: '' };
  const pageId = (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  let coopOn = false, dealt = 0, coopBusy = false, coopLast = 0, allDrops = [], lootBuilt = false, claimQ = [], inflight = [], rewarded = false;
  let boss = null, me = newPlayer(1), drops = [], cdStone = 0, cdSpear = 0, cdThrow = 0, spawnedKey = '', announced = false, lastT = performance.now();

  const hudBox = el('div', 'yq-hud'); hudBox.hidden = true;
  const bn = el('b', 'yq-name'), bb = el('i', 'yq-bar boss'), bf = el('i'), pl = el('div', 'yq-me'), pb = el('i', 'yq-bar me'), pf = el('i'), pt = el('span'), tm = el('small', 'yq-time');
  bb.appendChild(bf); pb.appendChild(pf); pl.append(el('span', null, 'Máu của bạn'), pb, pt); hudBox.append(bn, bb, tm, pl); hud.appendChild(hudBox);
  const flash = el('div', 'yq-flash'); flash.hidden = true; hud.appendChild(flash);

  const level = () => levelOf(LGT.quests && LGT.quests.prog ? LGT.quests.prog.xp : 0).lv;
  const str = () => (LGT.strength ? LGT.strength.value : 6);
  const pos = () => (LGT.world && LGT.world.pos) || null;
  const here = () => !!LGT.world && !LGT.inHouse;
  const distBoss = () => { const p = pos(); return boss && p ? Math.hypot(boss.x - p.x, boss.z - p.z) : Infinity; };

  function flashNow() { flash.hidden = false; setTimeout(() => { flash.hidden = true; }, 220); }
  function damageMe(dmg) {
    const r = hurt(me, dmg, level()); me = r.p; if (r.lost) flashNow();
    if (r.died) { stat.deaths++; save(); if (LGT.world && LGT.world.teleport) LGT.world.teleport(RESPAWN.x, RESPAWN.z); toast('Bạn hết sức và được đưa về cửa chùa hồi sinh. Quay lại tiếp tục bảo vệ dân làng!', 4600); }
  }
  function spawn(ev, type, diff) {
    boss = createBoss(type, { x: 0, z: 100, n: 1, diff }); me = newPlayer(level()); coopOn = !force && apiEnabled() && coopKeyOk(spawnedKey); dealt = 0; coopBusy = false; coopLast = 0; allDrops = []; lootBuilt = false; claimQ = []; inflight = []; rewarded = false; drops = []; view.loot = drops; view.type = type; view.boss = boss;
    toast(`${YQ[type].ten} (độ khó ${DIFF[diff].ten}) xuất hiện ở đường làng! Hãy ném đá từ xa, né vùng đỏ và dùng thương khi tới gần.`, 7000);
  }
  function defeat(key) {
    if (rewarded) return; rewarded = true;
    const t = YQ[boss.type], share = shareOf(boss, 'ban'), rw = rewardFor(share, boss.diff);
    if (!coopOn) drops = lootDrops(boss.x, boss.z, 1, rng, boss.diff);   // đánh chung: túi lá do máy chủ chia (cùng hạt giống cho mọi người)
    view.loot = drops; stat.done[key] = true; stat.kills++;
    if (rw.xp) { if (LGT.addXp) LGT.addXp(rw.xp); stat.bonus = Math.min(100, stat.bonus + rw.strength); }
    save(); toast(rw.xp ? `Bạn đã thu phục ${t.ten}! +${rw.xp} điểm, +${rw.strength} sức mạnh. Nhặt nhanh những túi lá bồ đề rơi quanh đó!` : `${t.ten} đã bị thu phục. Bạn đánh chưa đủ ${Math.round(MIN_SHARE * 100)}% nên chưa có thưởng — nhưng vẫn nhặt được lá rơi!`, 7000);
  }

  function stone() {
    if (!boss || boss.dead || !here() || cdStone > 0) return; const d = distBoss(); if (d > STONE.range + YQ[boss.type].body) { toast('Yêu quái còn xa quá, lại gần hơn để ném đá.', 1800); return; }
    cdStone = STONE.cd; const p = pos(), dmg = stoneDamage(str()); view.stones.push({ x0: p.x, z0: p.z, x1: boss.x, z1: boss.z, t: 0, dur: Math.max(0.15, d / STONE.speed), dmg });
  }
  function spear() {
    if (!boss || boss.dead || !here() || cdSpear > 0) return; if (distBoss() - YQ[boss.type].body > SPEAR.range) { toast('Lại gần yêu quái hơn mới đâm được thương.', 1800); return; }
    cdSpear = SPEAR.cd; hit(spearDamage(str()));
  }
  function throwBoss() {
    if (!boss || boss.dead || !here() || cdThrow > 0 || distBoss() - YQ[boss.type].body > SPEAR.range) return;
    const t = YQ[boss.type]; if (!canGrab({ lv: level(), str: str() }, { lv: t.lv, str: t.str }).ok) { toast(`Chưa đủ sức nhấc ${t.ten}: cần cấp lớn hơn ${t.lv} và sức mạnh lớn hơn ${t.str}.`, 3200); return; }
    cdThrow = 6; toast(`Bạn nhấc ${t.ten} lên và ném xuống đất!`, 2600); hit(throwBossDamage(str()));
  }
  function hit(dmg) {
    if (coopOn) {   // đánh chung: không tự kết liễu — gửi sát thương lên máy chủ, máy chủ báo hết máu chung thì mới thu phục
      if (!boss || boss.dead || !(dmg > 0)) return; const real = Math.min(Math.max(0, boss.hp - 1), Math.floor(dmg)); dealt += Math.floor(dmg); boss.hp -= real; boss.dmgBy.ban = (boss.dmgBy.ban || 0) + Math.floor(dmg);
      if (boss.hp <= 1) coopLast = 0; return;   // máu cục bộ chạm đáy: đồng bộ ngay để biết đã hết máu chung chưa
    }
    const r = hitBoss(boss, dmg, 'ban'); if (r.dead) defeat(spawnedKey);
  }
  function coopSync() {
    if (!coopOn || coopBusy || !boss) return; if (boss.dead && !drops.length && !claimQ.length) return;
    const nowMs = Date.now(); if (nowMs - coopLast < COOP_POLL_MS && !claimQ.length) return; coopLast = nowMs; coopBusy = true;
    const mine = claimQ.splice(0, 20); inflight = mine; const bossRef = boss;
    callApi('yq', buildReq({ pageId, key: spawnedKey, boss: bossRef, dealt, claim: mine })).then((res) => {
      coopBusy = false; if (boss !== bossRef) return;
      if (!res || !res.ok) { claimQ.unshift(...inflight); inflight = []; return; }   // lỗi mạng: giữ túi chờ gửi lại
      const r = applyServer(boss, res, dealt);
      if (res.dead && !lootBuilt) { lootBuilt = true; allDrops = lootFromServer({ ...res, claimed: {} }, boss); drops = lootFromServer(res, boss); view.loot = drops; }
      if (r.killedByOthers || (res.dead && !rewarded)) defeat(spawnedKey);
      if (res.dead) {
        const la = leavesGranted(res, allDrops);
        if (la > 0) { const n = LGT.merit && LGT.merit.addLa ? LGT.merit.addLa(la) : 0; toast(`Nhặt được ${n} lá bồ đề!`, 2200); }
        const lost = inflight.filter((id) => !(res.granted || []).includes(id)); if (lost.length) toast('Có người nhanh tay hơn bạn nhặt mất túi lá!', 2400);
        drops = drops.filter((d) => !res.claimed || !res.claimed[d.id]); view.loot = drops;
      }
      inflight = [];
    }).catch(() => { coopBusy = false; claimQ.unshift(...inflight); inflight = []; });
  }
  const canThrowBoss = () => { if (!boss || boss.dead) return false; const t = YQ[boss.type]; return canGrab({ lv: level(), str: str() }, { lv: t.lv, str: t.str }).ok; };

  function tick() {
    const now = performance.now(), dt = Math.min(0.25, (now - lastT) / 1000); lastT = now; const t0 = Date.now();
    cdStone = Math.max(0, cdStone - dt); cdSpear = Math.max(0, cdSpear - dt); cdThrow = Math.max(0, cdThrow - dt); me = tickPlayer(me, dt);
    const ev = eventAt(t0), ph = force ? { phase: 'live', secs: 0 } : eventPhase(ev, t0), key = force ? 'thu-' + force : ev.key, type = force || ev.type, diff = force ? forceDiff : ev.diff;
    if (!announced && !force) { announced = true; const nx = nextEvent(t0); if (nx.start - t0 < 14 * 86400e3 && !stat.done[nx.key] && ph.phase !== 'live') toast(`Sắp có ${YQ[nx.type].ten} (độ khó ${DIFF[nx.diff].ten}) xuất hiện ở làng vào ${fmt(nx.start)}. Hãy luyện sức mạnh và chuẩn bị!`, 7000); }
    if (ph.phase === 'live' && !stat.done[key] && !boss && spawnedKey !== key && LGT.world) { spawnedKey = key; spawn(ev, type, diff); }
    if (boss && !force && ph.phase !== 'live' && !boss.dead) { toast(`${YQ[boss.type].ten} đã bỏ đi. Hẹn lần sau!`, 4000); boss = null; view.boss = null; view.shapes = []; }
    if (boss && !boss.dead && here()) {
      const p = pos(), events = stepBoss(boss, dt, p ? [{ id: 'ban', x: p.x, z: p.z }] : [], rng, (x, z, dx, dz) => move(x, z, dx, dz));
      for (const e of events) {
        if (e.k === 'windup') { view.shapes = e.shapes; view.wt = 0; view.dur = e.dur; }
        else if (e.k === 'strike') { view.shapes = e.shapes; view.wt = -1; view.flash = 0.35; if (e.hits.includes('ban')) damageMe(hitDamage(boss.type, level(), boss.diff)); }
      }
      if (boss.state === 'windup') view.wt = Math.min(1, boss.t / windupOf(boss)); else if (boss.state === 'move') { view.shapes = []; view.wt = 0; }
    }
    view.flash = Math.max(0, (view.flash || 0) - dt);
    // đá đang bay
    view.stones = view.stones.filter((s) => { s.t += dt; if (s.t < s.dur) return true; if (boss && !boss.dead) hit(s.dmg); return false; });
    // nhặt lá bồ đề: ai chạm trước lấy trước (hiện mỗi máy tự nhặt; tranh nhặt giữa nhiều người cần máy chủ)
    if (drops.length) { drops = tickLoot(drops, dt); const p = pos(); if (p && here()) { const r = pickLoot(drops, p.x, p.z); if (r.got) { drops = r.drops; if (coopOn) { claimQ.push(r.got.id); coopLast = 0; } else { const n = LGT.merit && LGT.merit.addLa ? LGT.merit.addLa(r.got.la) : 0; toast(`Nhặt được ${n} lá bồ đề!`, 2200); } } } view.loot = drops; }
    coopSync();
    if (boss && boss.dead && !drops.length && !claimQ.length && !coopBusy) { boss = null; view.boss = null; view.shapes = []; }
    // thanh máu
    const on = !!boss && !boss.dead && here(); hudBox.hidden = !on;
    if (on) { const t = YQ[boss.type]; bn.textContent = `${t.ten} · ${DIFF[boss.diff].ten} · ${boss.hp}/${boss.max}`; bf.style.width = `${Math.round(boss.hp / boss.max * 100)}%`; pf.style.width = `${Math.round(me.hp / me.max * 100)}%`; pt.textContent = `${me.hp}/${me.max}${me.inv > 0 ? ' · bất tử' : ''}`; tm.textContent = force ? 'Chế độ thử' : `Còn ${Math.floor(ph.secs / 60)} phút`; }
  }
  setInterval(tick, 50);

  LGT.yq = {
    get boss() { return boss; }, get active() { return !!boss && !boss.dead; }, get bonus() { return stat.bonus; }, get stat() { return stat; }, get hp() { return me; },
    stone, spear, throwBoss, canThrowBoss,
    status() { const a = !!boss && !boss.dead && here(), d = distBoss(); return { active: a, stoneCd: cdStone, spearCd: cdSpear, ten: a ? YQ[boss.type].ten : '', far: a ? d > STONE.range + YQ[boss.type].body : false, near: a ? d - YQ[boss.type].body <= SPEAR.range : false, canThrow: a && canThrowBoss() }; },
  };
  return LGT.yq;
}
