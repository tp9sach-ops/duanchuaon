// NỐI ĐỒNG BỘ CHIẾN ĐẤU vào game thật (Phiên 220, mục 1). Logic thuần ở js/world/combatShare.js (có test); file này là "keo": chặn hành động của MÌNH để phát đi, nhận hành động + quái của NGƯỜI KHÁC để chiếu lại.
// Mọi thứ phụ thuộc môi trường đưa vào qua `deps` nên kiểm thử được bằng Node (tests/combatshare.test.mjs). KHÔNG import three.js.
//
// PHÁT (mình → mọi người): bọc avatar.cast / avatar.swing của nhân vật mình (mọi đường tung chiêu / vung đòn đi qua đó) + bọc LGT.hitReact.onHit (mọi lần đánh trúng quái bãi rừng đi qua đó)
//   + mỗi 100 ms đọc các quái mình đang đánh (m.eng) trong LGT.farmView.mons. Gói đi qua transport.sendCombat (Firebase /combat/{uid}); đường truyền không có sendCombat (Apps Script, tab cục bộ) thì im lặng bỏ qua.
// NHẬN (người khác → mình): mỗi 100 ms đọc transport.combat(); cùng phòng/zone thì: chiêu → av.cast(id) + hiệu ứng 3D chiêu (deps.castFx); đòn → av.swing(kind) + vệt chém (deps.makeSlash) + tiếng;
//   quái họ đang đánh → "bóng quái" (deps.ghostView vẽ: mô hình, thanh máu, vòng đỏ báo đòn); họ đánh trúng quái → tư thế/tiếng/hiệu ứng bị trúng trên bóng quái (LGT.hitReact.onHit).
import { COMBAT, createOutbox, createInbox, createGhosts, unpackMons } from '../world/combatShare.js';

const NEAR_MON_M = 40;   // chỉ phát quái đang đánh cách mình ≤ 40 m

export function createCombatLink(deps) {
  const { LGT, W, getTransport, avatarOf, roomOf = () => 'main', now = () => Date.now(), perf = () => (globalThis.performance ? performance.now() : Date.now()), makeSlash = null, castFx = null, ghostView = null, getCamera = () => null, skipOut = () => false } = deps;
  const outbox = createOutbox(), inbox = createInbox(), ghosts = createGhosts(), lastT = new Map(), stance = new Map(), slashes = new Map();
  let timer = null, raf = 0, hooked = false, hitHooked = false, lastSfx = 0, lastFrame = 0, running = false;
  const API = { outbox, inbox, ghosts };

  const pos = () => { try { return W && W.pos; } catch (_) { return null; } };
  const facing = () => { const a = W && W.avatar; return Number.isFinite(+(W && W.facing)) ? +W.facing : a && a.group && a.group.rotation ? a.group.rotation.y : 0; };
  const dist = (x, z) => { const p = pos(); return p ? Math.hypot(x - p.x, z - p.z) : Infinity; };

  // ------------------------------------------------------------ PHÁT
  function emit(a) { try { return outbox.push(a, now()); } catch (_) { return 0; } }
  function targetXZ() {
    try { const v = LGT.farmView, p = pos(), m = v && v.target && (v.mons || []).find((x) => x.uid === v.target); return m && p && Math.hypot(m.x - p.x, m.z - p.z) <= NEAR_MON_M ? { x: +m.x, z: +m.z } : null; } catch (_) { return null; }
  }
  /** Bọc avatar.cast / avatar.swing của MÌNH: chạy hàm gốc rồi phát hành động. Gọi lại nhiều lần vẫn chỉ bọc một lần. */
  API.hookAvatar = () => {
    const av = W && W.avatar; if (!av || hooked || typeof av.cast !== 'function' || typeof av.swing !== 'function') return false;
    hooked = true; const oCast = av.cast.bind(av), oSwing = av.swing.bind(av);
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
        if (m && !m.ghost && typeof m.uid === 'string' && p && !skipOut()) emit({ k: 'h', key: m.uid, dmg: opt.dmg, id: opt.id, i: opt.i, dead: !!opt.dead, nho: !!opt.nho, ax: opt.ax != null ? opt.ax : p.x, az: opt.az != null ? opt.az : p.z });
      } catch (_) { /* bỏ qua */ }
      return o.call(hr, m, opt);
    };
    return true;
  };
  function mine() {
    try { const v = LGT.farmView, p = pos(); if (!v || !p || !Array.isArray(v.mons)) return []; return v.mons.filter((m) => m && m.eng && m.oan > 0 && Math.hypot(m.x - p.x, m.z - p.z) <= NEAR_MON_M).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)); } catch (_) { return []; }
  }

  // ------------------------------------------------------------ NHẬN
  const sfx = (cue, gap = 140) => { try { const t = perf(); if (t - lastSfx < gap) return; lastSfx = t; if (LGT.sfx && LGT.sfx.play) LGT.sfx.play(cue); } catch (_) { /* bỏ qua */ } };
  function markStance(id, av) { try { if (av && av.setStance) { av.setStance(true); stance.set(id, now() + COMBAT.stanceMs); } } catch (_) { /* bỏ qua */ } }
  /** Chỗ vẽ hiệu ứng: ưu tiên chỗ nhân vật người đó ĐANG ĐỨNG trên màn hình mình (đã nội suy) nếu sát chỗ họ báo; không thì chỗ họ báo. */
  function spot(av, a) { const g = av && av.group && av.group.position; return g && Math.hypot(g.x - a.x, g.z - a.z) < 8 ? { x: g.x, z: g.z } : { x: a.x, z: a.z }; }
  function slashOf(id) { let s = slashes.get(id); if (!s && makeSlash) { try { s = makeSlash(); } catch (_) { s = null; } if (s) slashes.set(id, s); } return s || null; }
  function dropSlash(id) { const s = slashes.get(id); if (s) { try { if (s.dispose) s.dispose(); } catch (_) { /* bỏ qua */ } slashes.delete(id); } }

  function playCast(id, a) {
    if (dist(a.x, a.z) > COMBAT.seeM) return;
    const av = avatarOf ? avatarOf(id) : null, o = spot(av, a);
    if (av) { try { av.setFacing(a.ry); if (av.cast) av.cast(a.id); } catch (_) { /* bỏ qua */ } markStance(id, av); }
    try { if (castFx) castFx(a.id, { x: o.x, z: o.z, ry: a.ry, tx: a.tx, tz: a.tz }); } catch (_) { /* bỏ qua */ }
  }
  function playSwing(id, a) {
    if (dist(a.x, a.z) > COMBAT.seeM) return;
    const av = avatarOf ? avatarOf(id) : null, o = spot(av, a);
    if (av) { try { av.setFacing(a.ry); if (av.swing) av.swing(a.kind); } catch (_) { /* bỏ qua */ } markStance(id, av); }
    const s = slashOf(id); try { if (s) { s.slash(a.kind, a.ry, perf()); s.update(o, perf()); } } catch (_) { /* bỏ qua */ }
    if (dist(o.x, o.z) <= 35) sfx(a.kind === 'khi' ? 'thuong' : 'nem-da');
  }
  /** Trả true nếu đã xử lý (có bóng quái để phát hiệu ứng). */
  function playHit(owner, a) {
    const g = ghosts.hit(owner, a.key); if (!g) return false;
    if (dist(g.x, g.z) <= COMBAT.seeM) { g.flash = 0.35; try { if (LGT.hitReact && LGT.hitReact.onHit) LGT.hitReact.onHit(g, { dmg: a.dmg, id: a.id || undefined, i: a.i, nho: a.nho, dead: a.dead, ax: a.ax, az: a.az }); } catch (_) { /* bỏ qua */ } }
    if (a.dead) ghosts.kill(owner, a.key, now());
    return true;
  }

  /** Một lượt: gửi gói của mình + đọc gói của người khác. Gọi mỗi 100 ms. */
  API.tick = () => {
    const tr = getTransport ? getTransport() : null, t = now();
    try { outbox.setRoom(roomOf()); outbox.setMons(mine()); const pkt = outbox.packet(t); if (pkt && tr && typeof tr.sendCombat === 'function') tr.sendCombat(pkt); } catch (_) { /* gửi lỗi: bỏ qua */ }
    if (!hitHooked) API.hookHit();
    if (!hooked) API.hookAvatar();
    const list = tr && typeof tr.combat === 'function' ? tr.combat() : [], seenIds = new Set(), room = roomOf();
    for (const p of list) {
      seenIds.add(p.id);
      if (lastT.get(p.id) === p.t) continue; lastT.set(p.id, p.t);          // gói chưa đổi: không có gì mới
      const acts = inbox.take(p.id, p.a);                                    // luôn cập nhật mốc (lần đầu thấy: chỉ ghi mốc, không phát lại đồ cũ)
      if ((p.r || '') !== room) { ghosts.drop(p.id); continue; }             // người ở zone khác: không thấy gì của họ
      const late = [];
      for (const a of acts) if (a.k === 'h') { if (!playHit(p.id, a)) late.push(a); }   // đòn trúng quái đã có bóng (kể cả đòn kết liễu: phát TRƯỚC khi bóng bị bỏ)
      ghosts.ingest(p.id, unpackMons(p.m), t);
      for (const a of late) playHit(p.id, a);                                // quái mới xuất hiện cùng gói với đòn đầu tiên
      for (const a of acts) { if (a.k === 'c') playCast(p.id, a); else if (a.k === 's') playSwing(p.id, a); }
    }
    for (const id of [...lastT.keys()]) if (!seenIds.has(id)) { lastT.delete(id); ghosts.drop(id); inbox.forget(id); stance.delete(id); dropSlash(id); }   // người đã rời
  };

  /** Mỗi khung hình: bóng quái bước tiếp + vẽ + vệt chém bám theo người + hết thế chiến đấu của người khác. */
  API.frame = (dt) => {
    try {
      const t = now(), hide = !!(LGT.inHouse || (LGT.swim && LGT.swim.active));
      ghosts.step(dt, t);
      const gl = hide ? [] : ghosts.list();
      if (LGT.farmView) LGT.farmView.ghosts = gl;
      if (ghostView) ghostView.update(perf() / 1000, { mons: gl, target: '', stones: [] }, getCamera());
      for (const [id, s] of slashes) { const av = avatarOf ? avatarOf(id) : null, g = av && av.group && av.group.position; if (g) s.update({ x: g.x, z: g.z }, perf()); }
      for (const [id, until] of [...stance]) if (t >= until) { stance.delete(id); const av = avatarOf ? avatarOf(id) : null; if (av && av.setStance) av.setStance(false); }
    } catch (_) { /* bỏ qua */ }
  };

  API.start = () => {
    if (running) return; running = true; API.hookAvatar();
    timer = setInterval(API.tick, 100);
    if (typeof requestAnimationFrame === 'function') { lastFrame = perf(); const loop = (t) => { if (!running) return; const dt = Math.min(0.1, (t - lastFrame) / 1000); lastFrame = t; API.frame(dt); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
  };
  API.stop = () => { running = false; if (timer) clearInterval(timer); timer = null; if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf); raf = 0; for (const id of [...slashes.keys()]) dropSlash(id); if (LGT.farmView) LGT.farmView.ghosts = []; };
  return API;
}
