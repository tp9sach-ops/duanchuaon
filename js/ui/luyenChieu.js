// Khu LUYỆN CHIÊU (Phiên 150, mục 1 danh sách 14/11): từ bảng bồ đoàn (js/ui/khaiNgo.js) bấm "Luyện tập chiêu" → sang zone riêng "Võ đường luyện chiêu"
// có 3 mộc nhân; hàng NÚT TRÒN TO (Phiên 189, không còn khung bảng) cho TẤT CẢ chiêu của Hệ đó (ô 1, 2, 3, 4 hai Pháp Môn, tuyệt học), bấm là thử: không khóa cấp, hồi chiêu ngắn, không ảnh hưởng chỉ số thật.
// Logic thuần: js/world/zoneLuyen.js, js/world/luyenChieu.js (có test). Cảnh + hiệu ứng: js/scene/luyen.js, js/scene/voDai.js (createFx). CHƯA nhìn bằng mắt. Mọi chữ qua textContent.
// Phiên 163 (Bản 2 mục 5, 4/4): bấm chiêu → nhân vật quay về mộc nhân gần nhất và làm tư thế gồng → phát → thu (avatar.cast, js/world/chieuPose.js); luồng khí và nháy mộc nhân chờ đúng lúc khung "phát".
// Phiên 191 (Mục 1): ĐỒNG BỘ NÚT — ở khu luyện tập dùng CHUNG cụm nút với ngoài bãi rừng / trong chùa (thanh chiêu js/ui/heSkill.js + cụm Đánh thường/Thương/Nhảy js/ui/dock.js). Hàng nút riêng #lc-pad nay luôn ẩn (chỉ còn thanh "Về bồ đoàn"). Thêm basic(kind) = Đánh thường / Thương vào mộc nhân (không sát thương thật) và status() cho vòng hồi chiêu.
// Phiên 206 (mục 2): Đánh thường ở khu luyện tập cũng LAO TỚI mộc nhân (xa tầm đâm nhưng trong tầm lao) rồi nối chuỗi 3 đòn (đòn 3 xoay 360° nháy thêm mọi mộc nhân quanh người) — luật ở js/world/luyenBasic.js (có test), dùng chung chuỗi với LGT.farm.chainStep. Mộc nhân vẫn KHÔNG có sát thương thật.
import { LUYEN_ID, LUYEN_DUMMIES, returnSpawnName } from '../world/zoneLuyen.js';
import { listForHe, describeSkill, createDemoRuntime } from '../world/luyenChieu.js';
import { castTimeline } from '../world/chieuPose.js';
import { HE_COLOR, HE_SEAT_ID, heLabel } from '../world/heSeats.js';
import { normHe } from '../world/elements.js';
import { tierOf } from '../world/chieuFxPlan.js';
import { trangThaiTuChieu } from '../world/chieuTrung.js';
import { glyphOf } from '../world/chieuInfo.js';
import { STONE, SPEAR } from '../world/yeuquai.js';   // Phiên 191: thời gian hồi của Đánh thường / Thương (cùng số với ngoài bãi rừng)
import { planBasic, hitsFor } from '../world/luyenBasic.js';   // Phiên 206: lao tới + chuỗi 3 đòn ở khu luyện tập
import { BASIC } from '../world/basicCombo.js';
import { drawGlyphIcon } from './skillIcon.js';   // Phiên 189: hình chiêu dùng chung với nút chiêu ngoài bãi rừng   // Phiên 174: trạng thái hiển thị từ hiệu ứng của chiêu

export async function initLuyenChieu({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {}), Z = LGT.zones; if (!Z || !LGT.scene || !Z.get(LUYEN_ID)) return null;
  let hooks = null, fx = null, cfx = null, ctfx = null;   // cfx = hiệu ứng 30 chiêu (Phiên 165, js/scene/chieuFx.js)
  try {
    const sc = await import('../scene/luyen.js'), vd = await import('../scene/voDai.js');
    hooks = sc.luyenHooks(LGT.scene); fx = vd.createFx(LGT.scene);
    try { cfx = (await import('../scene/chieuFx.js')).createChieuFx(LGT.scene, { getTier: () => tierOf(LGT.perfLevel), onShake: (c) => { try { LGT.camFeel && LGT.camFeel.rung(c); } catch (_) {} }, onHitStop: (g) => { try { LGT.camFeel && LGT.camFeel.khung(g); } catch (_) {} } }); } catch (_) { cfx = null; }   // lỗi thì dùng hiệu ứng cũ
    try { ctfx = (await import('../scene/chieuTrungFx.js')).createChieuTrungFx(LGT.scene, { getTier: () => tierOf(LGT.perfLevel), onShake: (c) => { try { LGT.camFeel && LGT.camFeel.rung(c); } catch (_) {} }, onHitStop: (g) => { try { LGT.camFeel && LGT.camFeel.khung(g); } catch (_) {} } }); } catch (_) { ctfx = null; }   // Phiên 174: mộc nhân giật/ngã, số sát thương, trạng thái; lỗi thì dùng nháy cũ
    const def = Z.get(LUYEN_ID); def.load = hooks.load; def.dispose = () => { try { fx.clear(); if (cfx) cfx.clear(); if (ctfx) ctfx.clear(); } catch (_) { /* bỏ qua */ } hooks.dispose(); };
  } catch (e) { console.warn('[Diệu Giang Tự] Cảnh luyện chiêu lỗi:', e && e.message); return null; }

  const rt = createDemoRuntime(); let he = null, items = [], busy = false;
  const nowSec = () => performance.now() / 1000;
  // Phiên 189 (mục 3): KHÔNG còn khung bảng — mỗi chiêu là một NÚT TRÒN TO có hình (glyphOf), tên dưới nút, số giây hồi chiêu giữa nút; cỡ theo --btn-k (nút ⚙ Cỡ nút). Thanh nhỏ ở giữa-trên: tên Hệ + "Về bồ đoàn".
  const st = document.createElement('style');
  st.textContent = '#lc-top{position:fixed;left:50%;transform:translateX(-50%);top:max(12px,env(safe-area-inset-top));z-index:13;display:flex;align-items:center;gap:10px;padding:6px 8px 6px 14px;border-radius:999px;background:rgba(30,22,12,.9);color:#f6e7c1;font:600 14px/1.2 system-ui,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.45);pointer-events:auto}#lc-top[hidden],#lc-pad[hidden]{display:none}'
    + '#lc-top .lc-back{min-height:44px;padding:6px 16px;border-radius:999px;border:1px solid #d9b25f;background:#d9b25f;color:#2a1c08;font:700 14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}'
    + '#lc-pad{--lc-s:calc(var(--btn-k,1) * clamp(72px,13vmin,108px));position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(200px,calc(env(safe-area-inset-bottom) + 190px));z-index:13;display:flex;flex-wrap:wrap-reverse;justify-content:flex-end;gap:10px 12px;max-width:calc(var(--lc-s) * 3 + 28px);pointer-events:auto;touch-action:manipulation}'
    + '#lc-pad .lc-b{position:relative;width:var(--lc-s);padding:0;border:0;background:none;color:#f6e7c1;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;-webkit-tap-highlight-color:transparent;touch-action:manipulation}#lc-pad .lc-b:active .lc-ic{transform:scale(.92)}'
    + '#lc-pad .lc-ic{position:relative;width:var(--lc-s);height:var(--lc-s);border-radius:50%;box-shadow:0 3px 10px rgba(0,0,0,.55);overflow:hidden;transition:transform .08s}#lc-pad .lc-ic svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}'
    + '#lc-pad .lc-ic::after{content:"";position:absolute;left:0;right:0;bottom:0;height:calc(var(--cd,0)*100%);background:rgba(0,0,0,.55)}#lc-pad .lc-n{position:absolute;z-index:2;inset:0 0 auto 0;height:var(--lc-s);display:none;align-items:center;justify-content:center;font:800 calc(var(--lc-s)*.36)/1 system-ui,sans-serif;color:#fff;text-shadow:0 0 4px #000,0 1px 3px #000;pointer-events:none}#lc-pad .lc-b.lc-cd .lc-n{display:flex}'
    + '#lc-pad .lc-t{max-width:calc(var(--lc-s) + 12px);padding:1px 6px;border-radius:8px;background:rgba(0,0,0,.7);font:600 calc(var(--lc-s)*.15)/1.25 system-ui,sans-serif;text-align:center;text-shadow:0 1px 2px #000}';
  document.head.appendChild(st);
  const top = document.createElement('section'), h3 = document.createElement('span'), back = document.createElement('button'), pad = document.createElement('div');
  top.id = 'lc-top'; top.hidden = true; top.setAttribute('role', 'group'); top.setAttribute('aria-label', 'Luyện chiêu'); pad.id = 'lc-pad'; pad.hidden = true; pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', 'Các chiêu để thử');
  back.type = 'button'; back.className = 'lc-back'; back.textContent = 'Về bồ đoàn'; top.append(h3, back); document.body.append(top, pad);
  const btns = [], cdn = [];

  function build() {
    pad.textContent = ''; btns.length = 0; cdn.length = 0; rt.reset();
    items = listForHe(he);
    h3.textContent = `Luyện chiêu · ${heLabel(he)}`;
    items.forEach((it, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lc-b'; b.setAttribute('aria-label', `${it.skill.ten} — ${it.label}`);
      const ic = document.createElement('span'), t = document.createElement('span'), n = document.createElement('span');
      ic.className = 'lc-ic'; t.className = 'lc-t'; n.className = 'lc-n'; t.textContent = it.skill.ten;
      ic.appendChild(drawGlyphIcon('#' + (HE_COLOR[he] || 0xd9b25f).toString(16).padStart(6, '0'), glyphOf(it.skill.id), it.skill.slot === 'tuyet', false)); ic.appendChild(n);
      b.append(ic, t);
      b.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); b._t = performance.now(); cast(i); });   // bấm xuống là ra chiêu ngay, không trễ
      b.addEventListener('click', () => { if (b._t && performance.now() - b._t < 700) { b._t = 0; return; } cast(i); });   // Enter/Space (bàn phím)
      pad.appendChild(b); btns.push(b); cdn.push(n);
    });
  }

  const player = () => { const W = LGT.world; return W ? { ...W.pos, ry: W.facing || 0 } : null; };
  function nearestDummy(p) { let bi = 0, bd = Infinity; LUYEN_DUMMIES.forEach((d, i) => { const k = Math.hypot(d.x - p.x, d.z - p.z); if (k < bd) { bd = k; bi = i; } }); return { i: bi, d: LUYEN_DUMMIES[bi], dist: bd }; }
  function cast(i) {
    const it = items[i], p = player(); if (!it || !p || !fx) return;
    const r = rt.cast(it, nowSec());
    if (!r.ok) { toast(`${it.skill.ten} đang hồi, còn ${Math.ceil(r.left || 0)} giây.`, 1400); return; }
    const color = HE_COLOR[he] || 0xd9b25f, f = it.skill.fx || {};
    // Phiên 163: tư thế nhân vật. Chiêu đánh quay về mộc nhân gần nhất; chiêu hỗ trợ giữ hướng hiện tại. `lead` = giây từ lúc bấm tới giữa khung "phát" (lúc đòn bay ra / trúng).
    const tg = nearestDummy(p), L = castTimeline(it.skill.id), lead = L ? L.gong + L.phat * 0.5 : 0;
    try { const W = LGT.world, av = W && W.avatar; if (!it.support && W && W.face) W.face(Math.atan2(tg.d.x - p.x, tg.d.z - p.z)); if (av && av.cast) av.cast(it.skill.id); } catch (_) { /* bỏ qua: không có tư thế thì vẫn ra hiệu ứng như cũ */ }
    const plan = cfx ? cfx.cast(it.skill.id, { x: p.x, z: p.z, ry: Math.atan2(tg.d.x - p.x, tg.d.z - p.z), tx: tg.d.x, tz: tg.d.z }) : null;   // Phiên 165: vùng cảnh báo + hạt + tiếng; có thì bỏ vòng/luồng khí cũ
    if (it.support) {   // chiêu hỗ trợ: vòng sáng quanh người
      if (!plan) fx.ring(p.x, p.z, f.r || 2.6, 1.0, color);
      toast(`${it.skill.ten}: ${describeSkill(it.skill)}`, 2400);
    } else {
      const n = tg, ry = Math.atan2(n.d.x - p.x, n.d.z - p.z), speed = 18, delay = n.dist / speed;
      if (!plan) fx.wave(p.x, p.z, ry, n.dist, speed, lead, color);
      setTimeout(() => {
        if (!hooks) return; const area = f.dienRong || f.noLan || f.mua || f.song || f.docLan || f.suongDoc;
        const trung = (k) => { const t = ctfx && hooks.target ? hooks.target(k) : null; if (!t) { hooks.hit(k); return; } ctfx.hit(t, { ax: p.x, az: p.z, id: it.skill.id, damage: r.dmg }); for (const x of trangThaiTuChieu(it.skill.fx)) ctfx.status(t, x.loai, x.giay); };   // Phiên 174: phản ứng trúng đòn mục 7; chưa có thì nháy cũ
        if (area) { if (!plan) fx.ring(n.d.x, n.d.z, (area && area.r) || 4, 1.0, color); LUYEN_DUMMIES.forEach((_, k) => trung(k)); } else trung(n.i);
        if (!plan) fx.ring(n.d.x, n.d.z, 1.6, 0.6, color);
      }, Math.round((lead + delay) * 1000));
      toast(`${it.skill.ten}! −${r.dmg} (số mẫu) · ${describeSkill(it.skill)}`, 2400);
    }
  }

  // Phiên 191 (Mục 1): ĐÁNH THƯỜNG / THƯƠNG ở khu luyện tập — cùng nút (js/ui/dock.js) với ngoài bãi rừng. Quay về mộc nhân gần nhất, múa côn (LGT.combatPose.strike), mộc nhân nháy nếu đứng đủ gần. KHÔNG sát thương thật, không đụng chỉ số.
  // Phiên 206 (mục 2): Đánh thường LAO TỚI mộc nhân khi còn xa tầm đâm nhưng trong tầm lao (bấm tiếp mới ra đòn), rồi nối chuỗi 3 đòn chung với quái bãi rừng (LGT.farm.chainStep); đòn 3 nháy thêm mọi mộc nhân quanh người. Quá xa / không có mộc nhân: vẫn vung không khí, không chạm gì.
  const bCd = { da: 0, thuong: 0 }; let dashLock = 0;   // dashLock: performance.now() (ms) — vừa lao xong thì chưa ra đòn ngay (chống bấm dồn)
  function basic(kind) {
    const k = kind === 'thuong' ? 'thuong' : 'da', p = player(); if (!p || busy || Z.current !== LUYEN_ID) return false;
    const W = LGT.world, nowMs = performance.now(); if (k === 'da' && ((W && W.dashing) || nowMs < dashLock)) return false;
    const t = nowSec(); if (bCd[k] > t) return false;
    const pl = planBasic({ p, dummies: LUYEN_DUMMIES, kind: k });
    if (pl.plan === 'dash') {   // xa tầm đâm nhưng trong tầm lao: lao tới sát mộc nhân, chưa ra đòn
      let ok = false; try { ok = !!(W && W.dash && W.dash(pl.dash, Math.max(0.25, Math.min(1.4, pl.dash.dist / 9)), { tilt: false })); } catch (_) { /* bỏ qua */ }
      if (ok) { dashLock = nowMs + BASIC.dashCd * 1000; if (LGT.sfx) LGT.sfx.play('thiet-dau'); return true; }
    }
    bCd[k] = t + (k === 'thuong' ? SPEAR.cd : STONE.cd);
    const near = pl.near, ry = near ? Math.atan2(near.d.x - p.x, near.d.z - p.z) : (p.ry || 0);
    const step = LGT.farm && LGT.farm.chainStep ? LGT.farm.chainStep() : 1;   // đòn thứ mấy trong chuỗi (cùng chuỗi với hoạt ảnh nhân vật)
    try {
      if (LGT.combatPose && LGT.combatPose.strike) LGT.combatPose.strike(ry);
      else { if (W && W.face) W.face(ry); if (W && W.avatar && W.avatar.swing) W.avatar.swing(); }
    } catch (_) { /* không có tư thế thì thôi */ }
    if (LGT.sfx) LGT.sfx.play(k === 'thuong' ? 'thuong' : 'nem-da');
    if (pl.plan === 'hit' && hooks) { const h = hitsFor({ p, dummies: LUYEN_DUMMIES, near, kind: k, step }); for (const i of h.idx) { try { hooks.hit(i); } catch (_) { /* bỏ qua */ } } }
    return true;
  }
  const status = () => { const t = nowSec(); return { stoneCd: Math.max(0, bCd.da - t), spearCd: Math.max(0, bCd.thuong - t) }; };

  async function travelTo(to, spawn) {
    const r = await Z.travel(to, { spawn }); if (r && r.ok) { LGT.world.teleport(r.spawn.x, r.spawn.z, r.spawn.ry); return { ok: true }; }
    return { ok: false, reason: (r && r.reason) || 'Chưa đi được' };
  }
  const ready = () => { const W = LGT.world; return !!W && !LGT.inHouse && !LGT.panelOpen && !(LGT.yq && LGT.yq.status && LGT.yq.status().active) && !(LGT.swim && LGT.swim.active) && Z.current === 'chua'; };
  /** Vào khu luyện chiêu của Hệ `h` (đang ngồi bồ đoàn cũng được: tự đứng dậy trước). Trả Promise<{ok, reason?}>. */
  async function enter(h) {
    const hh = normHe(h); if (!hh) return { ok: false, reason: 'Chưa rõ Hệ nào' };
    if (busy) return { ok: false, reason: 'Đang chuyển' };
    if (!ready()) return { ok: false, reason: 'Lúc này chưa vào khu luyện tập được' };
    busy = true;
    try {
      const W = LGT.world; if (W.mode !== 'free') W.stand();
      he = hh; build();
      const r = await travelTo(LUYEN_ID, 'default'); if (!r.ok) { toast(r.reason, 2600); return r; }
      toast('Võ đường luyện chiêu: dùng các nút chiêu và nút Đánh thường bên phải để thử trên mộc nhân.', 3200); return r;
    } finally { busy = false; }
  }
  /** Về chánh điện, đứng sau bồ đoàn của Hệ vừa tập và ngồi lại để chọn Hệ. */
  async function leave(sitAgain = true) {
    if (Z.current !== LUYEN_ID) return { ok: false, reason: 'Không ở khu luyện tập' };
    if (busy) return { ok: false, reason: 'Đang chuyển' }; busy = true;
    try {
      const r = await travelTo('chua', he ? returnSpawnName(he) : 'tu-luyen');
      if (r.ok && sitAgain && he && HE_SEAT_ID[he]) setTimeout(() => { try { LGT.world.sit(HE_SEAT_ID[he], 'sit'); } catch (_) { /* bỏ qua */ } }, 400);
      return r;
    } finally { busy = false; }
  }
  back.addEventListener('click', () => { leave(true); });

  setInterval(() => {
    const inside = Z.current === LUYEN_ID; top.hidden = !inside; pad.hidden = true; if (!inside) return;   // Phiên 191: hàng nút riêng luôn ẩn — dùng chung cụm nút của dock + thanh chiêu phái
    const t = nowSec(); items.forEach((it, i) => { const b = btns[i]; if (!b) return; const left = rt.left(it, t); b.classList.toggle('lc-cd', left > 0); b.style.setProperty('--cd', it.demoCd > 0 ? Math.min(1, left / it.demoCd).toFixed(3) : '0'); cdn[i].textContent = left > 0 ? String(Math.ceil(left)) : ''; });
  }, 150);
  // Phiên 187: nút chiêu của phái (js/ui/heSkill.js) dùng được ngay trong khu luyện tập: tung chiêu theo id, và hỏi hồi chiêu để vẽ số giây trên nút.
  const castById = (id) => { const i = items.findIndex((x) => x.skill.id === id); if (i < 0 || busy) return false; const it = items[i]; if (rt.left(it, nowSec()) > 0) { cast(i); return false; } cast(i); return true; };
  const cdOf = (id) => { const it = items.find((x) => x.skill.id === id); return it ? { left: rt.left(it, nowSec()), total: it.demoCd } : null; };
  LGT.luyenChieu = { enter, leave, castById, cdOf, basic, status, get inside() { return Z.current === LUYEN_ID; }, get he() { return he; } };
  return LGT.luyenChieu;
}
