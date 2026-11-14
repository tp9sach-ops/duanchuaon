// Khu LUYỆN CHIÊU (Phiên 150, mục 1 danh sách 14/11): từ bảng bồ đoàn (js/ui/khaiNgo.js) bấm "Luyện tập chiêu" → sang zone riêng "Võ đường luyện chiêu"
// có 3 mộc nhân; bảng liệt kê TẤT CẢ chiêu của Hệ đó (ô 1, 2, 3, 4 hai Pháp Môn, tuyệt học), bấm là thử: không khóa cấp, hồi chiêu ngắn, không ảnh hưởng chỉ số thật.
// Logic thuần: js/world/zoneLuyen.js, js/world/luyenChieu.js (có test). Cảnh + hiệu ứng: js/scene/luyen.js, js/scene/voDai.js (createFx). CHƯA nhìn bằng mắt. Mọi chữ qua textContent.
// Phiên 163 (Bản 2 mục 5, 4/4): bấm chiêu → nhân vật quay về mộc nhân gần nhất và làm tư thế gồng → phát → thu (avatar.cast, js/world/chieuPose.js); luồng khí và nháy mộc nhân chờ đúng lúc khung "phát".
import { LUYEN_ID, LUYEN_DUMMIES, returnSpawnName } from '../world/zoneLuyen.js';
import { listForHe, describeSkill, createDemoRuntime } from '../world/luyenChieu.js';
import { castTimeline } from '../world/chieuPose.js';
import { HE_COLOR, HE_SEAT_ID, heLabel } from '../world/heSeats.js';
import { normHe } from '../world/elements.js';

export async function initLuyenChieu({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {}), Z = LGT.zones; if (!Z || !LGT.scene || !Z.get(LUYEN_ID)) return null;
  let hooks = null, fx = null;
  try {
    const sc = await import('../scene/luyen.js'), vd = await import('../scene/voDai.js');
    hooks = sc.luyenHooks(LGT.scene); fx = vd.createFx(LGT.scene);
    const def = Z.get(LUYEN_ID); def.load = hooks.load; def.dispose = () => { try { fx.clear(); } catch (_) { /* bỏ qua */ } hooks.dispose(); };
  } catch (e) { console.warn('[Diệu Giang Tự] Cảnh luyện chiêu lỗi:', e && e.message); return null; }

  const rt = createDemoRuntime(); let he = null, items = [], busy = false;
  const nowSec = () => performance.now() / 1000;
  const st = document.createElement('style');
  st.textContent = '#lc-panel{position:fixed;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));z-index:13;width:min(96vw,520px);max-height:46vh;overflow:auto;padding:10px;border-radius:14px;background:rgba(30,22,12,.93);color:#f6e7c1;font:14px/1.35 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.45)}#lc-panel[hidden]{display:none}'
    + '#lc-panel h3{margin:0 0 2px;font-size:15px;text-align:center}#lc-panel .lc-sub{font-size:12px;opacity:.8;text-align:center;margin-bottom:8px}#lc-panel .lc-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}'
    + '#lc-panel .lc-b{position:relative;text-align:left;min-height:52px;padding:6px 8px;border-radius:10px;border:1px solid #d9b25f;background:#4a3418;color:#f6e7c1;font:inherit;overflow:hidden}#lc-panel .lc-b b{display:block;font-size:13px}#lc-panel .lc-b small{display:block;font-size:11px;opacity:.8}'
    + '#lc-panel .lc-b.lc-cd::after{content:"";position:absolute;left:0;right:0;bottom:0;height:calc(var(--cd,0)*100%);background:rgba(0,0,0,.5)}#lc-panel .lc-row{display:flex;gap:8px;justify-content:center;margin-top:8px}#lc-panel .lc-back{min-height:42px;padding:6px 14px;border-radius:10px;border:1px solid #d9b25f;background:#d9b25f;color:#2a1c08;font:inherit}';
  document.head.appendChild(st);
  const panel = document.createElement('section'); panel.id = 'lc-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Luyện chiêu');
  const h3 = document.createElement('h3'), sub = document.createElement('div'), grid = document.createElement('div'), row = document.createElement('div'), back = document.createElement('button');
  sub.className = 'lc-sub'; grid.className = 'lc-grid'; row.className = 'lc-row'; back.type = 'button'; back.className = 'lc-back'; back.textContent = 'Về bồ đoàn'; row.appendChild(back);
  panel.append(h3, sub, grid, row); document.body.appendChild(panel);
  const btns = [];

  function build() {
    grid.textContent = ''; btns.length = 0; rt.reset();
    items = listForHe(he);
    h3.textContent = `Luyện chiêu · ${heLabel(he)}`;
    sub.textContent = 'Thử mọi chiêu, không mất gì. Chọn Hệ ở bồ đoàn sau khi thử xong.';
    items.forEach((it, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lc-b'; b.style.borderColor = '#' + (HE_COLOR[he] || 0xd9b25f).toString(16).padStart(6, '0');
      const n = document.createElement('b'), l = document.createElement('small'), d = document.createElement('small');
      n.textContent = it.skill.ten; l.textContent = `${it.label} (mở ở cấp ${it.cap})`; d.textContent = describeSkill(it.skill);
      b.append(n, l, d); b.addEventListener('click', () => cast(i)); grid.appendChild(b); btns.push(b);
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
    if (it.support) {   // chiêu hỗ trợ: vòng sáng quanh người
      fx.ring(p.x, p.z, f.r || 2.6, 1.0, color);
      toast(`${it.skill.ten}: ${describeSkill(it.skill)}`, 2400);
    } else {
      const n = tg, ry = Math.atan2(n.d.x - p.x, n.d.z - p.z), speed = 18, delay = n.dist / speed;
      fx.wave(p.x, p.z, ry, n.dist, speed, lead, color);
      setTimeout(() => {
        if (!hooks) return; const area = f.dienRong || f.noLan || f.mua || f.song || f.docLan || f.suongDoc;
        if (area) { fx.ring(n.d.x, n.d.z, (area && area.r) || 4, 1.0, color); LUYEN_DUMMIES.forEach((_, k) => hooks.hit(k)); } else hooks.hit(n.i);
        fx.ring(n.d.x, n.d.z, 1.6, 0.6, color);
      }, Math.round((lead + delay) * 1000));
      toast(`${it.skill.ten}! −${r.dmg} (số mẫu) · ${describeSkill(it.skill)}`, 2400);
    }
  }

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
      toast('Võ đường luyện chiêu: thử các chiêu ở bảng phía dưới.', 3200); return r;
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
    const inside = Z.current === LUYEN_ID; panel.hidden = !inside; if (!inside) return;
    const t = nowSec(); items.forEach((it, i) => { const b = btns[i]; if (!b) return; const left = rt.left(it, t); b.classList.toggle('lc-cd', left > 0); b.style.setProperty('--cd', it.demoCd > 0 ? Math.min(1, left / it.demoCd).toFixed(3) : '0'); });
  }, 150);
  LGT.luyenChieu = { enter, leave, get inside() { return Z.current === LUYEN_ID; }, get he() { return he; } };
  return LGT.luyenChieu;
}
