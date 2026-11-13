// Giao diện GIAO LƯU VÕ THUẬT (Phiên 137, mục 1 lộ trình): nút "Giao lưu" → danh sách người gần → Mời → họ Chấp nhận → cả hai vào Võ đài → đếm 3 giây → đánh → bảng kết quả.
// Luật + gói tin: js/world/duel.js (có test). Zone: js/world/zoneVoDai.js. Cảnh 3D + hiệu ứng: js/scene/voDai.js. Kênh gói tin: LGT.room.signal / LGT.room.onSignal / LGT.room.selfId (js/net/room.js).
// CHƯA nhìn bằng mắt (môi trường AI không có WebGL) — cần thử bằng hai máy thật. Thắng/thua không ảnh hưởng gì.
import { MOVES, DUEL, createDuel, tagOf, decode, packObj, pack } from '../world/duel.js';
import { VODAI_ID, VODAI_HUB_GATE } from '../world/zoneVoDai.js';
import { landing } from '../world/strength.js';

const WHY = { hp: 'có người hết sinh lực', time: 'hết giờ, so sinh lực', left: 'đối thủ đã rời trận', noshow: 'không ai vào trận' };
const REASON = { 'chua-danh': 'Chưa vào trận.', 'dang-ra-don': 'Đang ra đòn…', 'khong-co': 'Chiêu này không có.' };
const KEYS = { j: 'a', k: 'b', l: 'c', u: 'g' };

export function initDuel({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {}), Z = LGT.zones;
  if (!Z || !LGT.room || !LGT.room.signal) return null;
  const R = () => LGT.room, W = () => LGT.world;
  let mode = 'idle';   // idle | inviting | invited | going | arena | result
  let oppId = '', oppName = '', eng = null, raf = 0, last = 0, fx = null, inviteTimer = 0, msgTimer = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const myTag = () => tagOf(R().selfId()), oppTag = () => tagOf(oppId);
  const send = (text) => R().signal(text);

  // ---------------------------------------------------------------- giao diện
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const st = el('style');
  st.textContent = '.dl-chip,.dl-btn,.dl-box button{font:600 14px/1.2 system-ui,sans-serif;color:#fff;cursor:pointer;touch-action:manipulation}'
    + '.dl-chip{position:fixed;left:max(12px,env(safe-area-inset-left));top:46%;z-index:61;min-height:40px;padding:8px 16px;border-radius:999px;border:1px solid #d9b25f;background:rgba(8,10,20,.82)}.dl-chip[hidden],.dl-box[hidden],.dl-hud[hidden],.dl-bar[hidden]{display:none!important}'
    + '.dl-box{position:fixed;z-index:70;left:50%;top:50%;transform:translate(-50%,-50%);width:min(340px,calc(100vw - 24px));padding:14px;border-radius:16px;border:1px solid rgba(217,178,95,.8);background:rgba(10,10,18,.95);color:#f3ead4;font:400 14px/1.45 system-ui,sans-serif}'
    + '.dl-box h3{margin:0 0 8px;font:600 16px/1.2 system-ui,sans-serif;color:#f1dba0}.dl-box p{margin:6px 0}.dl-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0}'
    + '.dl-box button{min-height:40px;padding:6px 14px;border-radius:999px;border:1px solid #f1db9f;background:rgba(217,178,95,.25)}.dl-inv{top:96px;transform:translateX(-50%)}'
    + '.dl-hud{position:fixed;z-index:60;left:50%;transform:translateX(-50%);top:max(64px,calc(env(safe-area-inset-top) + 56px));width:min(440px,94vw);color:#fff;font:600 13px/1.3 system-ui,sans-serif;text-align:center;pointer-events:none;text-shadow:0 1px 3px #000}'
    + '.dl-bars{display:flex;gap:8px;align-items:center}.dl-hp{flex:1;height:12px;border-radius:6px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.4);overflow:hidden}.dl-hp i{display:block;height:100%;width:100%;background:#6ccf7a}.dl-hp.o{transform:scaleX(-1)}.dl-hp.o i{background:#e0605a}'
    + '.dl-mid{min-width:44px;font-size:15px}.dl-msg{margin-top:6px;min-height:18px;font-size:15px;color:#ffe9a8}'
    + '.dl-bar{position:fixed;z-index:62;left:50%;transform:translateX(-50%);bottom:max(14px,calc(env(safe-area-inset-bottom) + 8px));display:flex;gap:10px}'
    + '.dl-btn{width:62px;height:62px;border-radius:50%;border:1px solid rgba(217,178,95,.8);background:rgba(6,7,13,.6);font-size:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:0}.dl-btn.cd{opacity:.45}.dl-btn small{font-size:10px;color:#f1dba0}'
    + '#dl-fade{position:fixed;inset:0;z-index:80;background:#06070d;opacity:0;pointer-events:none;transition:opacity .3s}';
  document.head.appendChild(st);
  const chip = el('button', 'dl-chip', 'Giao lưu'); chip.type = 'button'; chip.hidden = true;
  const listBox = el('section', 'dl-box'); listBox.hidden = true;
  const inv = el('section', 'dl-box dl-inv'); inv.hidden = true;
  const res = el('section', 'dl-box'); res.hidden = true;
  const hud = el('div', 'dl-hud'); hud.hidden = true;
  const bars = el('div', 'dl-bars'), hpMe = el('div', 'dl-hp'), hpMeI = el('i'), hpOp = el('div', 'dl-hp o'), hpOpI = el('i'), mid = el('div', 'dl-mid');
  hpMe.append(hpMeI); hpOp.append(hpOpI); bars.append(hpMe, mid, hpOp);
  const msg = el('div', 'dl-msg'); hud.append(bars, msg);
  const bar = el('div', 'dl-bar'); bar.hidden = true;
  const btns = {};
  for (const k of ['a', 'b', 'c', 'g']) { const b = el('button', 'dl-btn'); b.type = 'button'; const n = el('span', '', MOVES[k].ten), cd = el('small', '', MOVES[k].key); b.append(n, cd); b._cd = cd; btns[k] = b; bar.appendChild(b); b.addEventListener('pointerdown', (e) => { e.preventDefault(); cast(k); }); }
  const fade = el('div'); fade.id = 'dl-fade';
  document.body.append(chip, listBox, inv, res, hud, bar, fade);
  [chip, listBox, inv, res, bar].forEach((n) => ['pointerdown', 'touchend', 'wheel', 'keydown'].forEach((ev) => n.addEventListener(ev, (e) => e.stopPropagation(), { passive: true })));

  const setMsg = (t, ms = 1400) => { msg.textContent = t; clearTimeout(msgTimer); msgTimer = setTimeout(() => { msg.textContent = ''; }, ms); };
  const free = () => { const w = W(); return !!w && w.mode === 'free' && !LGT.inHouse && !LGT.panelOpen && !(LGT.swim && LGT.swim.active) && !LGT.heldBy; };
  const oppPos = () => (R().players().find((q) => q.id === oppId) || null);

  // ---------------------------------------------------------------- mời / chấp nhận
  function nearby() { const w = W(); if (!w) return []; const p = w.pos; return R().players().filter((q) => Math.hypot(q.x - p.x, q.z - p.z) <= 30); }
  function drawList() {
    listBox.textContent = ''; listBox.appendChild(el('h3', '', 'Giao lưu võ thuật'));
    const list = nearby();
    if (!list.length) listBox.appendChild(el('p', '', 'Chưa có ai ở gần (trong 30 m). Lại gần một người rồi bấm lại.'));
    for (const q of list) { const row = el('div', 'dl-row'), b = el('button', '', 'Mời'); b.type = 'button'; b.addEventListener('click', () => invite(q)); row.append(el('span', '', q.n || 'Người chơi'), b); listBox.appendChild(row); }
    listBox.appendChild(el('p', '', 'Thắng hay thua đều không ảnh hưởng gì, chỉ để vui.'));
    const x = el('button', '', 'Đóng'); x.type = 'button'; x.addEventListener('click', () => { listBox.hidden = true; }); listBox.appendChild(x);
  }
  chip.addEventListener('click', () => { if (listBox.hidden) { drawList(); listBox.hidden = false; } else listBox.hidden = true; });
  function reset() { clearTimeout(inviteTimer); mode = 'idle'; oppId = ''; oppName = ''; eng = null; inv.hidden = true; hud.hidden = true; bar.hidden = true; res.hidden = true; }
  function invite(q) {
    if (mode !== 'idle' || !free()) return;
    listBox.hidden = true; oppId = q.id; oppName = q.n || 'Người chơi'; mode = 'inviting';
    send(pack.invite(oppTag())); toast('Đã gửi lời mời giao lưu tới ' + oppName + '…', 2500);
    inviteTimer = setTimeout(() => { if (mode === 'inviting') { reset(); toast(oppName + ' chưa trả lời lời mời.', 2500); } }, 20000);
  }
  function showInvite() {
    inv.textContent = ''; inv.appendChild(el('h3', '', 'Lời mời giao lưu')); inv.appendChild(el('p', '', oppName + ' mời bạn giao lưu võ thuật ở Võ đài. Thắng thua không ảnh hưởng gì.'));
    const row = el('div', 'dl-row'), ok = el('button', '', 'Chấp nhận'), no = el('button', '', 'Từ chối'); ok.type = no.type = 'button';
    ok.addEventListener('click', () => { if (mode !== 'invited') return; send(pack.accept(oppTag())); enter('b'); });
    no.addEventListener('click', () => { if (mode === 'invited') send(pack.decline(oppTag())); reset(); });
    row.append(ok, no); inv.appendChild(row); inv.hidden = false;
    clearTimeout(inviteTimer); inviteTimer = setTimeout(() => { if (mode === 'invited') reset(); }, 20000);
  }
  R().onSignal((id, name, text) => {
    const d = decode(text); if (!d || d.to !== myTag()) return;
    if (d.type === 'invite') {
      if (mode === 'idle' && Z.current === 'chua' && free()) { oppId = id; oppName = name || 'Người chơi'; mode = 'invited'; showInvite(); } else send(pack.decline(tagOf(id)));
      return;
    }
    if (id !== oppId) return;
    if (d.type === 'accept' && mode === 'inviting') enter('a');
    else if (d.type === 'decline' && mode === 'inviting') { reset(); toast(oppName + ' không nhận lời mời.', 2500); }
    else if (d.type === 'bye') { if (mode === 'arena' && eng) eng.oppLeft(); else if (mode === 'invited') { reset(); } }
    else if (mode === 'arena' && eng) eng.receive(d);
  });

  // ---------------------------------------------------------------- vào võ đài / trận
  async function enter(side) {
    clearTimeout(inviteTimer); inv.hidden = true; mode = 'going'; fade.style.opacity = '1'; await wait(350);
    let r = null; try { r = await Z.travel(VODAI_ID, { spawn: side }); } catch (_) { /* báo bên dưới */ }
    if (!r || !r.ok) { fade.style.opacity = '0'; send(pack.bye(oppTag())); reset(); toast((r && r.reason) || 'Chưa vào được Võ đài.', 3000); return; }
    W().teleport(r.spawn.x, r.spawn.z, r.spawn.ry);
    eng = createDuel({ send: (o) => { const t = packObj(oppTag(), o); if (t) send(t); } }); mode = 'arena'; hud.hidden = false; bar.hidden = false; setMsg('Đang chờ đối thủ vào Võ đài…', 5000);
    last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
    await wait(250); fade.style.opacity = '0';
  }
  function loop(t) {
    raf = 0; if (mode !== 'arena' || !eng) return;
    const dt = Math.min(0.1, (t - last) / 1000); last = t; const w = W(), p = w.pos;
    if (Z.current !== VODAI_ID && eng.phase !== 'over') eng.forfeit();   // rời Võ đài giữa trận = bỏ cuộc
    for (const e of eng.tick(dt, { x: p.x, z: p.z, ry: w.facing })) handle(e);
    paint();
    if (mode === 'arena') raf = requestAnimationFrame(loop);
  }
  function handle(e) {
    const fxo = fx;
    if (e.type === 'count') setMsg('Chuẩn bị…', 3000);
    else if (e.type === 'fight') setMsg('Bắt đầu! Né, đỡ đúng lúc, đừng spam một chiêu.', 2500);
    else if (e.type === 'incoming') {
      const f = e.from, sx = Math.sin(f.ry), sz = Math.cos(f.ry);
      if (fxo) { if (e.kind === 'a') fxo.ring(f.x + sx * 1.3, f.z + sz * 1.3, 1.5, MOVES.a.wind); else if (e.kind === 'b') fxo.wave(f.x, f.z, f.ry, MOVES.b.range, MOVES.b.speed, MOVES.b.wind, 0xd9534f); else fxo.line(f.x, f.z, f.ry, MOVES.c.dash, MOVES.c.wind + MOVES.c.dashS); }
      setMsg(e.kind === 'a' ? 'Đòn cận chiến! Lùi ra hoặc bấm Hộ thân' : e.kind === 'b' ? 'Khí bay tới! Né sang ngang' : 'Lao tới! Né sang bên', 1000);
    } else if (e.type === 'hit') { setMsg('Bạn trúng đòn −' + e.dmg, 1200); vib([40, 30, 60]); }
    else if (e.type === 'guard') setMsg('Đỡ được, chỉ mất −' + e.dmg, 1200);
    else if (e.type === 'perfect') { setMsg('Đỡ hoàn hảo! Đối thủ bị phản.', 1500); vib([20, 20, 20]); }
    else if (e.type === 'dodge') setMsg('Né được!', 900);
    else if (e.type === 'ack-hit') setMsg('Trúng đối thủ −' + e.dmg, 1000);
    else if (e.type === 'ack-guard') setMsg('Đối thủ đỡ được', 1000);
    else if (e.type === 'ack-miss') setMsg('Trượt rồi — canh hướng và khoảng cách', 1200);
    else if (e.type === 'countered') { setMsg('Bị phản đòn −' + e.dmg + ' (đánh vào lúc đối thủ đang đỡ)', 1800); vib([60, 30, 60]); }
    else if (e.type === 'over') finish(e);
  }
  function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) { /* bỏ qua */ } }
  function paint() {
    if (!eng) return; const m = eng.hpMax || DUEL.hp;
    hpMeI.style.width = Math.max(0, eng.hp / m * 100) + '%'; hpOpI.style.width = Math.max(0, eng.oppHp / m * 100) + '%';
    mid.textContent = eng.phase === 'count' ? String(Math.ceil(eng.countLeft)) : eng.phase === 'fight' ? String(Math.ceil(eng.timeLeft)) : '';
    for (const k of ['a', 'b', 'c', 'g']) { const cd = eng.cdLeft(k); btns[k].classList.toggle('cd', cd > 0 || eng.phase !== 'fight'); btns[k]._cd.textContent = cd > 0 ? cd.toFixed(1) : MOVES[k].key; }
  }
  function finish(r) {
    send(pack.bye(oppTag())); mode = 'result'; bar.hidden = true;
    const s = r.stats || {}, win = r.winner === 'me', draw = r.winner === 'draw';
    res.textContent = ''; res.appendChild(el('h3', '', draw ? 'Hòa' : win ? 'Bạn thắng!' : 'Bạn thua'));
    res.appendChild(el('p', '', 'Lý do: ' + (WHY[r.why] || r.why) + '. Sinh lực còn lại: bạn ' + Math.round(r.myHp) + ' · đối thủ ' + Math.round(r.oppHp) + '.'));
    res.appendChild(el('p', '', 'Đòn trúng ' + (s.hits || 0) + ' · trượt ' + (s.whiffs || 0) + ' · né ' + (s.dodges || 0) + ' · đỡ hoàn hảo ' + (s.perfects || 0) + '. Thắng thua không ảnh hưởng gì, chỉ để vui.'));
    const row = el('div', 'dl-row'), stay = el('button', '', 'Ở lại tập'), home = el('button', '', 'Về chùa'); stay.type = home.type = 'button';
    stay.addEventListener('click', () => { reset(); }); home.addEventListener('click', goHome);
    row.append(stay, home); res.appendChild(row); res.hidden = Z.current !== VODAI_ID;
    if (Z.current !== VODAI_ID) reset();
  }
  async function goHome() {
    res.hidden = true; fade.style.opacity = '1'; await wait(350);
    try { const r = await Z.travel('chua', { spawn: 'tu-vo-dai' }); if (r && r.ok) W().teleport(r.spawn.x, r.spawn.z, r.spawn.ry); } catch (_) { /* ở lại */ }
    reset(); await wait(250); fade.style.opacity = '0';
  }

  // ---------------------------------------------------------------- dùng chiêu
  function cast(kind) {
    if (mode !== 'arena' || !eng || eng.phase !== 'fight') return;
    const w = W(); if (!w || w.dashing || w.held) return;
    const p = w.pos, o = oppPos(); let ry = w.facing;
    if (o && kind !== 'g') ry = Math.atan2(o.x - p.x, o.z - p.z);   // tự ngắm về phía đối thủ (người chơi điện thoại không phải xoay tay)
    const r = eng.cast(kind, { x: p.x, z: p.z, ry });
    if (!r.ok) { if (r.reason !== 'hoi-chieu') setMsg(REASON[r.reason] || 'Chưa dùng được.', 800); return; }
    const m = MOVES[kind]; if (kind !== 'g') w.face(ry);
    if (kind === 'a') { if (w.avatar && w.avatar.swing) w.avatar.swing(0.4); if (fx) fx.ring(p.x + Math.sin(ry) * 1.3, p.z + Math.cos(ry) * 1.3, 1.4, m.wind, 0xf1db9f); }
    else if (kind === 'b') { if (w.avatar && w.avatar.swing) w.avatar.swing(0.5); if (fx) fx.wave(p.x, p.z, ry, m.range, m.speed, m.wind); }
    else if (kind === 'c') { const path = landing(p.x, p.z, ry, m.dash); if (fx) fx.line(p.x, p.z, ry, m.dash, m.wind + m.dashS); setTimeout(() => { if (mode === 'arena' && path.dist > 0.5) w.dash(path.to, m.dashS, { tilt: false }); }, m.wind * 1000); }
    else if (kind === 'g') { if (fx) fx.ring(p.x, p.z, 1.6, m.dur, 0x8fd6bf); setMsg('Hộ thân! Canh đúng lúc đòn tới để phản.', 1000); }
  }
  addEventListener('keydown', (e) => {
    const k = KEYS[String(e.key || '').toLowerCase()]; if (!k || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable)) return;
    cast(k);
  });

  // ---------------------------------------------------------------- chip + cảnh 3D
  setInterval(() => { const ok = mode === 'idle' && Z.current === 'chua' && free(); if (chip.hidden === ok) chip.hidden = !ok; if (!ok && mode !== 'idle') listBox.hidden = true; }, 400);
  setInterval(() => { if (!listBox.hidden && mode === 'idle') drawList(); }, 2000);
  import('../scene/voDai.js').then((sc) => {   // dựng/dỡ cảnh Võ đài theo zone + cổng ở sân chùa + hiệu ứng chiêu
    const def = Z.get(VODAI_ID), h = sc.arenaHooks(LGT.scene); if (def) { def.load = h.load; def.dispose = h.dispose; }
    sc.buildGate(LGT.scene, VODAI_HUB_GATE); fx = sc.createFx(LGT.scene);
  }).catch((e) => console.warn('[Diệu Giang Tự] Cảnh Võ đài lỗi:', e && e.message));
  LGT.duel = { get mode() { return mode; }, get engine() { return eng; }, invite };
  return LGT.duel;
}
