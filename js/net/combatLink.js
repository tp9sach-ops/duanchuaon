// NỐI ĐỒNG BỘ CHIẾN ĐẤU vào game thật (Phiên 220, mục 1). Logic thuần ở js/world/combatShare.js (có test); file này là "keo": chặn hành động của MÌNH để phát đi, nhận hành động + quái của NGƯỜI KHÁC để chiếu lại.
// Mọi thứ phụ thuộc môi trường đưa vào qua `deps` nên kiểm thử được bằng Node (tests/combatshare.test.mjs). KHÔNG import three.js.
//
// PHÁT (mình → mọi người): bọc avatar.cast / avatar.swing của nhân vật mình (mọi đường tung chiêu / vung đòn đi qua đó) + bọc LGT.hitReact.onHit (mọi lần đánh trúng quái bãi rừng đi qua đó)
//   + mỗi 100 ms đọc các quái mình đang đánh (m.eng) trong LGT.farmView.mons. Gói đi qua transport.sendCombat (Firebase /combat/{uid}); đường truyền không có sendCombat (Apps Script, tab cục bộ) thì im lặng bỏ qua.
// NHậN (người khác → mình): mỗi 100 ms đọc transport.combat(); cùng phòng/zone thì: chiêu → av.cast(id) + hiệu ứng 3D chiêu (deps.castFx); đòn → av.swing(kind) + vệt chém (deps.makeSlash) + tiếng;
//   quái họ đang đánh → "bóng quái" (deps.ghostView vẽ: mô hình, thanh máu, vòng đỏ báo đòn); họ đánh trúng quái → tư thế/tiếng/hiệu ứng bị trúng trên bóng quái (LGT.hitReact.onHit).
import { COMBAT, createOutbox, createInbox, createGhosts, unpackMons, unpackActions } from '../world/combatShare.js';
import { tagOf } from '../world/duel.js';

const NEAR_MON_M = 40;   // chỉ phát quái đang đánh cách mình ≤ 40 m

export function createCombatLink(deps) {
  const { LGT, W, getTransport, avatarOf, roomOf = () => 'main', now = () => Date.now(), perf = () => (globalThis.performance ? performance.now() : Date.now()), makeSlash = null, castFx = null, ghostView = null, getCamera = () => null, skipOut = () => false, dragonFx = null, wolfFx = null, broomFx = null } = deps;   // Phiên 224: wolfFx = bộ sói khí vàng RIÊNG cho người khác (js/ui/wolfFx.js)   // Phiên 223: dragonFx = bộ rồng hồng RIÊNG cho người khác (js/ui/dragonFx.js)
  const outbox = createOutbox(), inbox = createInbox(), ghosts = createGhosts(), lastT = new Map(), stance = new Map(), slashes = new Map();
  const hookedAv = new WeakSet(), poses = new Map(); let startedAt = 0, myTag = '', flushQ = false;   // Phiên 222: world.js DỰNG LẠI nhân vật khi vào chùa / đổi tên (setProfile) → hook phải gắn lại cho nhân vật mới; poses = tư thế bay lướt / lao của người khác
  let timer = null, raf = 0, hitHooked = false, lastSfx = 0, lastFrame = 0, running = false;
  const API = { outbox, inbox, ghosts };

  const pos = () => { try { return W && W.pos; } catch (_) { return null; } };
  const facing = () => { const a = W && W.avatar; return Number.isFinite(+(W && W.facing)) ? +W.facing : a && a.group && a.group.rotation ? a.group.rotation.y : 0; };
  const dist = (x, z) => { const p = pos(); return p ? Math.hypot(x - p.x, z - p.z) : Infinity; };

  // ------------------------------------------------------------ PHÁT
  const selfTag = () => { if (myTag) return myTag; try { const id = LGT.room && LGT.room.selfId ? LGT.room.selfId() : ''; if (id) myTag = tagOf(id); } catch (_) { /* bỏ qua */ } return myTag; };
  /** Tư thế bay lướt / lao của MÌNH → hộp gửi (người khác thấy mình bay, lao). g = bay lướt (avatar.state 'glide'), d = lao chúi đầu, r = lao chạy. */
  function pollPose() {
    const av = W && W.avatar; let mode = 'n', tilt = 0;
    if (av && !skipOut()) { tilt = av.group && av.group.rotation ? +av.group.rotation.x || 0 : 0; if (W.dashing) mode = tilt > 0.2 ? 'd' : 'r'; else if (av.state === 'glide') mode = 'g'; else if (LGT.combatPose && LGT.combatPose.stance) mode = 's'; }   // Phiên 223: 's' = đang đứng THẾ SẴN SÀNG CHIẾN ĐẤU (người khác thấy ngay, không đợi tới lúc vung đòn)
    outbox.setPose({ mode, tilt });
  }
  function flush() { try { const tr = getTransport ? getTransport() : null; pollPose(); outbox.setRoom(roomOf()); outbox.setMons(mine()); const pkt = outbox.packet(now()); if (pkt && tr && typeof tr.sendCombat === 'function') tr.sendCombat(pkt); } catch (_) { /* gửi lỗi: bỏ qua */ } }
  function emit(a) { try { const n = outbox.push(a, now()); if (n && !flushQ && typeof setTimeout === 'function') { flushQ = true; setTimeout(() => { flushQ = false; flush(); }, 0); } return n; } catch (_) { return 0; } }   // Phiên 222: gửi NGAY khi có hành động (gom các hành động cùng một khung hình, không chờ nhịp 40 ms)
  function targetXZ() {
    try { const v = LGT.farmView, p = pos(), m = v && v.target && (v.mons || []).find((x) => x.uid === v.target); return m && p && Math.hypot(m.x - p.x, m.z - p.z) <= NEAR_MON_M ? { x: +m.x, z: +m.z } : null; } catch (_) { return null; }
  }
  /** Bọc avatar.cast / avatar.swing của MÌNH: chạy hàm gốc rồi phát hành động. Gọi lại nhiều lần vẫn chỉ bọc một lần. */
  API.hookAvatar = () => {
    const av = W && W.avatar; if (!av || hookedAv.has(av) || typeof av.cast !== 'function' || typeof av.swing !== 'function') return false;
    hookedAv.add(av); const oCast = av.cast.bind(av), oSwing = av.swing.bind(av);
    av.cast = (id) => { const r = oCast(id); try { const p = pos(); if (r && p && !skipOut()) { const t = targetXZ(); emit({ k: 'c', id: String(id), x: p.x, z: p.z, ry: facing(), tx: t ? t.x : null, tz: t ? t.z : null }); } } catch (_) { /* phát lỗi không làm hỏng đòn của mình */ } return r; };
    av.swing = (arg) => { const k = oSwing(arg); try { const p = pos(); if (k && p && !skipOut()) emit({ k: 's', kind: String(k), x: p.x, z: p.z, ry: facing() }); } catch (_) { /* bỏ qua */ } return k; };
    return true;
  };
  /** Bọc LGT.hitReact.onHit (nạp lười, nên thử lại tới khi có): mọi đòn của MÌNH trúng quái bãi rừng được phát; trúng bóng quái (m.ghost) thì KHÔNG phát lại. */
  API.hookHit = () => {
    const hr = LGT.hitReact; if (!hr || hitHooked || typeof hr.onHit !== 'function') return false;
    hitHooked = true; const o = hr.onHit;
    hr.onHit = (m, opt = {}) => {
      try {
        const p = pos();
        if (m && !m.ghost && typeof m.uid === 'string' && p && !skipOut()) emit({ k: 'h', key: m.uid, dmg: opt.dmg, id: opt.id, i: opt.i, dead: !!opt.dead, nho: !!opt.nho, ax: opt.ax != null ? opt.ax : p.x, az: opt.az != null ? opt.az : p.z, by: opt.by || '' });
      } catch (_) { /* bỏ qua */ }
      return o.call(hr, m, opt);
    };
    return true;
  };
  function mine() {
    try { const v = LGT.farmView, p = pos(); if (!v || !p || !Array.isArray(v.mons)) return []; return v.mons.filter((m) => m && m.eng && m.oan > 0 && Math.hypot(m.x - p.x, m.z - p.z) <= NEAR_MON_M).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)); } catch (_) { return []; }
  }

  // ------------------------------------------------------------ NHậN
  const sfx = (cue, gap = 140) => { try { const t = perf(); if (t - lastSfx < gap) return; lastSfx = t; if (LGT.sfx && LGT.sfx.play) LGT.sfx.play(cue); } catch (_) { /* bỏ qua */ } };
  function markStance(id, av) { try { if (av && av.setStance) { av.setStance(true); stance.set(id, now() + COMBAT.stanceMs); } } catch (_) { /* bỏ qua */ } }
  /** Chỗ vẽ hiệu ứng: ưu tiên chỗ nhân vật người đó ĐANG ĐỨNG trên màn hình mình (đã nội suy) nếu sát chỗ họ báo; không thì chỗ họ báo. */
  function spot(av, a) { const g = av && av.group && av.group.position; return g && Math.hypot(g.x - a.x, g.z - a.z) < 8 ? { x: g.x, z: g.z } : { x: a.x, z: a.z }; }
  function slashOf(id) { let s = slashes.get(id); if (!s && makeSlash) { try { s = makeSlash(); } catch (_) { s = null; } if (s) slashes.set(id, s); } return s || null; }
  function dropSlash(id) { const s = slashes.get(id); if (s) { try { if (s.dispose) s.dispose(); } catch (_) { /* bỏ qua */ } slashes.delete(id); } }

  const hurts = new Map();   // Phiên 225: người khác vừa bị quái đánh trúng (id → { t0, lv }) → giật người ngắn
  const lastAct = new Map(); const a_recent = (id, t) => t - (lastAct.get(id) || -1e9) < 1200;   // Phiên 223: vừa vung đòn / tung chiêu ≤ 1,2 s thì chưa hạ thế
  /** Phiên 223: rồng hồng của người khác — bay quanh CHÍNH nhân vật họ trên màn hình mình (bám vị trí sống của avatar). */
  function playDragon(id, a) {
    if (!dragonFx) return; const av = avatarOf ? avatarOf(id) : null, g = av && av.group && av.group.position; if (!g || dist(g.x, g.z) > COMBAT.seeM) return;
    try { dragonFx.spawn(g, a.ry, g); } catch (_) { /* bỏ qua */ }
  }
  /** Phiên 224: sói khí vàng (Gậy dạy chó đòn 3) của người khác — vồ ra từ CHÍNH chỗ họ đứng trên màn hình mình, hướng ry, xa rg m. */
  function playWolf(id, a) {
    if (!wolfFx) return; const av = avatarOf ? avatarOf(id) : null, g = av && av.group && av.group.position; if (!g || dist(g.x, g.z) > COMBAT.seeM) return;
    try { wolfFx.spawn({ x: g.x, y: Number.isFinite(+g.y) ? +g.y : 0, z: g.z }, a.ry, a.rg, true); } catch (_) { /* bỏ qua */ }
  }
  /** Phiên 230: đập chổi (đòn 3 cầm Chổi) của người khác — đập xuống phía trước CHÍNH chỗ họ đứng trên màn hình mình. */
  function playBroom(id, a) {
    if (!broomFx) return; const av = avatarOf ? avatarOf(id) : null, g = av && av.group && av.group.position; if (!g || dist(g.x, g.z) > COMBAT.seeM) return;
    try { broomFx.spawn({ x: g.x, y: Number.isFinite(+g.y) ? +g.y : 0, z: g.z }, a.ry, a.rg, true); } catch (_) { /* bỏ qua */ }
  }
  /** Phiên 225: người khác bị đánh trúng — tiếng + giật người (poseOf trả độ ngả). */
  function playHurt(id, a) {
    const av = avatarOf ? avatarOf(id) : null, g = av && av.group && av.group.position; if (!g || dist(g.x, g.z) > COMBAT.seeM) return;
    hurts.set(id, { t0: now(), lv: a.lv }); if (dist(g.x, g.z) <= 35) sfx('da-trung', 90);
  }
  function playCast(id, a) {
    lastAct.set(id, now());
    if (dist(a.x, a.z) > COMBAT.seeM) return;
    const av = avatarOf ? avatarOf(id) : null, o = spot(av, a);
    if (av) { try { av.setFacing(a.ry); if (av.cast) av.cast(a.id); } catch (_) { /* bỏ qua */ } markStance(id, av); }
    try { if (castFx) castFx(a.id, { x: o.x, z: o.z, ry: a.ry, tx: a.tx, tz: a.tz }); } catch (_) { /* bỏ qua */ }
  }
  function playSwing(id, a) {
    lastAct.set(id, now());
    if (dist(a.x, a.z) > COMBAT.seeM) return;
    const av = avatarOf ? avatarOf(id) : null, o = spot(av, a);
    if (av) { try { av.setFacing(a.ry); if (av.swing) av.swing(a.kind); } catch (_) { /* bỏ qua */ } markStance(id, av); }
    const s = slashOf(id); try { if (s) { s.slash(a.kind, a.ry, perf()); s.update(o, perf()); } } catch (_) { /* bỏ qua */ }
    if (dist(o.x, o.z) <= 35) sfx(a.kind === 'khi' ? 'thuong' : 'nem-da');
  }
  /** Trả true nếu đã xử lý (có bóng quái để phát hiệu ứng). */
  function playHit(owner, a) {
    const g = ghosts.hit(owner, a.key); if (!g) return false;
    if (a.by && a.by === selfTag()) { if (a.dead) ghosts.kill(owner, a.key, now()); return true; }   // đòn của CHÍNH MÌNH trúng bóng quái: máy mình đã tự phát hiệu ứng rồi
    if (dist(g.x, g.z) <= COMBAT.seeM) { g.flash = 0.35; try { if (LGT.hitReact && LGT.hitReact.onHit) LGT.hitReact.onHit(g, { dmg: a.dmg, id: a.id || undefined, i: a.i, nho: a.nho, dead: a.dead, ax: a.ax, az: a.az }); } catch (_) { /* bỏ qua */ } }
    if (a.dead) ghosts.kill(owner, a.key, now());
    return true;
  }

  /** Guest: MÌNH đánh trúng bóng quái `g` (dmg thật) → báo cho chủ quái trừ máu THẬT (máu dùng chung). Có đoán trước (g.oan giảm ngay) để thấy tức thì; máu thật từ chủ sẽ chỉnh lại. */
  API.sendDamage = (g, dmg) => {
    try {
      if (!g || !g.ghost || skipOut()) return false; const p = pos(), d = Math.max(1, Math.floor(+dmg || 0));
      g.oan = Math.max(1, g.oan - d / Math.max(1, g.real || 100) * 100); g.predUntil = now() + 500;
      return !!emit({ k: 'd', key: g.key, owner: tagOf(g.owner), dmg: d, ax: p ? p.x : null, az: p ? p.z : null });
    } catch (_) { return false; }
  };
  /** Chủ quái: người khác (by) đánh trúng quái của MÌNH → trừ máu thật qua LGT.farm.remoteHit; nếu họ đánh đòn cuối thì báo 'k' (họ nhận thưởng, mình không). */
  function applyRemote(a, by) {
    const F = LGT.farm; if (!F || !F.remoteHit) return;
    const r = F.remoteHit(a.key, a.dmg, by, a.ax, a.az);
    if (r && r.dead) emit({ k: 'k', key: a.key, type: r.type, killer: by });
  }
  /** Phiên 223: MÌNH vừa tung RỒNG HỒNG (Gậy như ý đủ 3 đòn) → báo cho mọi người cùng thấy. ry = hướng mặt. */
  API.sendBroom = (ry, rg) => { try { return skipOut() ? 0 : emit({ k: 'q', ry: +ry || 0, rg: +rg || 0 }); } catch (_) { return 0; } };   // Phiên 230: đập chổi của MÌNH → mọi người thấy
  API.sendWolf = (ry, rg) => { try { return skipOut() ? 0 : emit({ k: 'w', ry: +ry || 0, rg: +rg || 0 }); } catch (_) { return 0; } };   // Phiên 224: sói khí vàng của MÌNH → mọi người thấy
  API.sendDragon = (ry) => { try { return skipOut() ? 0 : emit({ k: 'r', ry: +ry || 0 }); } catch (_) { return 0; } };
  /** Phiên 225: MÌNH bị quái đánh trúng (lv 0-9) → báo mọi người cùng thấy. */
  API.sendHurt = (lv) => { try { return skipOut() ? 0 : emit({ k: 'p', lv: lv == null ? 3 : lv }); } catch (_) { return 0; } };
  /** Tư thế bay lướt / lao của người `id` (cho roomClient vẽ), hoặc null. 's' (thế chiến đấu) KHÔNG đổi trạng thái đi/đứng nên trả null (stance do tick lo). */
  API.poseOf = (id) => {
    const h = hurts.get(id);
    if (h) { const u = (now() - h.t0) / 450; if (u >= 1) hurts.delete(id); else if (!poses.has(id)) return { state: 'idle', speed: 0, tilt: -(0.25 + 0.03 * h.lv) * Math.sin(Math.PI * Math.min(1, u * 1.4)) }; }
    const o = poses.get(id); if (!o) return null; if (now() > o.until) { poses.delete(id); return null; }
    if (o.mode === 's') return null;
    return { state: o.mode === 'g' ? 'glide' : o.mode === 'r' ? 'walk' : 'idle', speed: o.mode === 'r' ? 6.5 : 0, tilt: o.tilt };
  };

  /** Một lượt: gửi gói của mình + đọc gói của người khác. Gọi mỗi 40 ms. */
  API.tick = () => {
    const tr = getTransport ? getTransport() : null, t = now(), me = selfTag();
    if (!startedAt) startedAt = t;
    flush();
    if (!hitHooked) API.hookHit();
    API.hookAvatar();
    const list = tr && typeof tr.combat === 'function' ? tr.combat() : [], seenIds = new Set(), room = roomOf(), fresh = t - startedAt > 4000;
    for (const p of list) {
      seenIds.add(p.id);
      if (lastT.get(p.id) === p.t) continue; lastT.set(p.id, p.t);          // gói chưa đổi: không có gì mới
      const acts = inbox.take(p.id, p.a, fresh);                             // luôn cập nhật mốc (người có từ trước: chỉ ghi mốc, không phát lại đồ cũ)
      if ((p.r || '') !== room) { ghosts.drop(p.id); poses.delete(p.id); continue; }   // người ở zone khác: không thấy gì của họ
      const fp = unpackActions(p.a).find((x) => x.k === 'f');
      if (fp) {
        if (fp.mode === 'n') { poses.delete(p.id); const av0 = avatarOf ? avatarOf(p.id) : null; if (av0 && av0.setStance && stance.has(p.id) && !a_recent(p.id, t)) { stance.delete(p.id); av0.setStance(false); } }   // Phiên 223: người đó báo HẾT thế chiến đấu → hạ thế ngay (trừ khi vừa vung đòn)
        else { poses.set(p.id, { mode: fp.mode, tilt: fp.tilt, until: t + (fp.mode === 'd' ? 1200 : 4000) }); if (fp.mode === 's') markStance(p.id, avatarOf ? avatarOf(p.id) : null); }   // Phiên 223: thấy thế sẵn sàng của họ NGAY khi họ vào giao chiến
      }
      const by = tagOf(p.id), late = [];
      for (const a of acts) {
        if (a.k === 'd') { if (me && a.owner === me) applyRemote(a, by); }   // họ đánh quái CỦA MÌNH → trừ máu thật
        else if (a.k === 'k') { if (me && a.killer === me && LGT.farm && LGT.farm.claimKill) LGT.farm.claimKill(a.type); ghosts.kill(p.id, a.key, t); }   // mình là người đánh đòn cuối → nhận thưởng
        else if (a.k === 'h') { if (!playHit(p.id, a)) late.push(a); }      // đòn trúng quái đã có bóng (kể cả đòn kết liễu: phát TRƯỚC khi bóng bị bỏ)
      }
      ghosts.ingest(p.id, unpackMons(p.m), t);
      for (const a of late) playHit(p.id, a);                                // quái mới xuất hiện cùng gói với đòn đầu tiên
      for (const a of acts) { if (a.k === 'c') playCast(p.id, a); else if (a.k === 's') playSwing(p.id, a); else if (a.k === 'r') playDragon(p.id, a); else if (a.k === 'w') playWolf(p.id, a); else if (a.k === 'q') playBroom(p.id, a); else if (a.k === 'p') playHurt(p.id, a); }
    }
    for (const id of [...lastT.keys()]) if (!seenIds.has(id)) { lastT.delete(id); ghosts.drop(id); inbox.forget(id); stance.delete(id); dropSlash(id); poses.delete(id); lastAct.delete(id); hurts.delete(id); }   // người đã rời
  };

  /** Mỗi khung hình: bóng quái bước tiếp + vẽ + vệt chém bám theo người + hết thế chiến đấu của người khác. */
  API.frame = (dt) => {
    try {
      API.hookAvatar();
      const t = now(), hide = !!(LGT.inHouse || (LGT.swim && LGT.swim.active));
      ghosts.step(dt, t); if (dragonFx) dragonFx.update(dt, null); if (wolfFx) wolfFx.update(dt); if (broomFx) broomFx.update(dt);   // Phiên 223: rồng hồng của người khác bay theo họ
      const gl = hide ? [] : ghosts.list();
      if (LGT.farmView) LGT.farmView.ghosts = gl;
      if (ghostView) ghostView.update(perf() / 1000, { mons: gl, target: (LGT.farmView && LGT.farmView.target) || '', stones: [] }, getCamera());
      for (const [id, s] of slashes) { const av = avatarOf ? avatarOf(id) : null, g = av && av.group && av.group.position; if (g) s.update({ x: g.x, z: g.z }, perf()); }
      for (const [id, until] of [...stance]) if (t >= until) { stance.delete(id); const av = avatarOf ? avatarOf(id) : null; if (av && av.setStance) av.setStance(false); }
    } catch (_) { /* bỏ qua */ }
  };

  API.start = () => {
    if (running) return; running = true; startedAt = now(); API.hookAvatar();
    timer = setInterval(API.tick, 40);
    if (typeof requestAnimationFrame === 'function') { lastFrame = perf(); const loop = (t) => { if (!running) return; const dt = Math.min(0.1, (t - lastFrame) / 1000); lastFrame = t; API.frame(dt); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
  };
  API.stop = () => { running = false; if (timer) clearInterval(timer); timer = null; if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf); raf = 0; for (const id of [...slashes.keys()]) dropSlash(id); if (LGT.farmView) LGT.farmView.ghosts = []; };
  return API;
}
