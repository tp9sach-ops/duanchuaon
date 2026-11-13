// Vật phẩm mua bằng lá bồ đề (mục 1): giao diện. Luật/số: js/world/items.js (có test). Nạp từ js/ui/board.js (initBoard). Đặt LGT.items = { openShop(kind), closeShop(), regenMul(), tryRevive(), dmgMul(), state }.
// - Cửa hàng 'kimhoan' (NPC Kim Hoàn Ngọc Lan): Ngọc hồi máu 100 lá (×5, 10 phút), Ngọc dịch chuyển 200 lá (hồi sinh tại chỗ, 20 phút). Cửa hàng 'dienmay' (NPC Điện Máy Lam Sen): Ván trượt 100 lá (js/ui/board.js), Gậy như ý 400 lá.
// - Hồi máu ×5 / hồi sinh tại chỗ: js/ui/farmCombat.js gọi LGT.items.regenMul() và tryRevive(). Hạn dùng tính theo giờ thật nên đổi tab vẫn chạy.
// - Gậy như ý: MUA là có, nhưng chỉ hiện trên tay / có +1% sát thương / vòng sáng lan khi người chơi ĐANG CẦM Gậy như ý (LGT.loadout.weapon === 'nhuy', chọn ở Túi đồ). Mặc định cầm Thương: trả lại cây côn mặc định. Mua gậy xong tự cầm gậy.
// Nhân vật dựng bằng khối (không phải chibi) thì không đổi hình gậy nhưng vẫn có +1% và vòng sáng. CHƯA nhìn bằng mắt trên máy thật.
import * as THREE from 'three';
import { GEMS, STAFF, loadItems, buyGem, buyStaff, remainSec, regenMul as rMul, canRevive, dmgMul as dMul, fmtTime } from '../world/items.js';
import { BOARD } from '../world/board.js';
import { askConfirm } from './dialog.js';
import { buildStaff, loadStaffGlb, pulseGlows } from './staffMesh.js';

const KEY = 'lgt.items';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const CSS = '.it-box{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9500;width:min(92vw,430px);max-height:84vh;overflow:auto;background:rgba(26,17,10,.97);color:#f4e4c1;border:1px solid #c9a24a;border-radius:14px;padding:14px;font:14px/1.45 "Be Vietnam Pro","Noto Sans",system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.55)}'
  + '.it-box header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.it-box h3{margin:0;font-size:17px;color:#f2c14e}'
  + '.it-x{background:none;border:0;color:#f4e4c1;font-size:24px;line-height:1;cursor:pointer;padding:2px 8px}.it-la{margin:0 0 10px;color:#cdb98a}'
  + '.it-row{border:1px solid rgba(201,162,74,.35);border-radius:10px;padding:10px;margin-bottom:8px;background:rgba(255,255,255,.03)}.it-row b{color:#ffe08a}.it-row p{margin:4px 0}'
  + '.it-meta{color:#cdb98a;font-size:13px}.it-buy{margin-top:6px;background:#c9a24a;color:#2a1a08;border:0;border-radius:8px;padding:8px 16px;font:600 14px inherit;cursor:pointer;min-height:40px}.it-buy:disabled{opacity:.45;cursor:default}'
  + '.it-chips{position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 56px);z-index:40;display:flex;flex-direction:column;gap:4px;pointer-events:none}'
  + '.it-chip{background:rgba(26,17,10,.82);color:#ffe08a;border:1px solid #c9a24a;border-radius:999px;padding:3px 10px;font:600 12px "Be Vietnam Pro",system-ui,sans-serif}';

let RING_GEO = null;

/** hud/opts: { toast(text, ms) }. */
export function initItems({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  if (LGT.items) return LGT.items;
  let st = loadItems(null); try { st = loadItems(localStorage.getItem(KEY)); } catch (_) { /* riêng tư */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* bỏ qua */ } };
  document.head.appendChild(el('style', null, CSS));
  const laNow = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);
  const spend = (n) => !!(LGT.merit && LGT.merit.spendLa && LGT.merit.spendLa(n));
  const staffOn = () => st.staff && (!LGT.loadout || LGT.loadout.weapon === 'nhuy');   // đang cầm Gậy như ý (chưa có hệ chọn đồ thì coi như cầm nếu đã mua)

  // ---------- Cửa hàng ----------
  const box = el('section', 'it-box'); box.hidden = true; box.setAttribute('role', 'dialog');
  const head = el('header'), title = el('h3'), x = el('button', 'it-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(title, x);
  const laLine = el('p', 'it-la'), list = el('div', 'it-list'); box.append(head, laLine, list); document.body.appendChild(box);
  let shopKind = '';
  const confirm = (text) => askConfirm(text, { ok: 'Mua', cancel: 'Để sau' });

  async function buyGemUi(g) {
    const ok = await confirm(`${g.ten} — ${g.gia} lá bồ đề.\n${g.mo}\nBạn đang có ${laNow()} lá bồ đề. Mua không?`); if (!ok) return;
    const r = buyGem(st, g.id, laNow()); if (!r.ok) { toast(`Chưa đủ lá bồ đề (cần ${g.gia}, bạn có ${laNow()}). Đổi thêm lá ở Thầy Tri khách.`, 3600); return; }
    if (!spend(r.cost)) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    st = r.state; save(); chipsDraw(); draw();
    toast(`Đã mua ${g.ten} (−${r.cost} lá bồ đề) — còn ${fmtTime(remainSec(st, g.id))}.`, 3200);
  }
  async function buyStaffUi() {
    const ok = await confirm(`${STAFF.ten} — ${STAFF.gia} lá bồ đề.\n${STAFF.mo}\nBạn đang có ${laNow()} lá bồ đề. Mua không?`); if (!ok) return;
    const r = buyStaff(st, laNow()); if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có Gậy như ý rồi.' : `Chưa đủ lá bồ đề (cần ${r.cost}, bạn có ${laNow()}).`, 3600); return; }
    if (!spend(r.cost)) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    st = r.state; save();
    if (LGT.loadout) LGT.loadout.choose('nhuy', true);   // mua xong tự cầm gậy (đổi lại Thương ở Túi đồ)
    draw(); toast(`Đã mua ${STAFF.ten} (−${r.cost} lá bồ đề). Bạn đang cầm gậy — đổi vũ khí ở Túi đồ.`, 4200);
  }
  function row(ten, mo, meta, label, enabled, act) {
    const r = el('div', 'it-row'); r.append(el('b', null, ten), el('p', null, mo), el('p', 'it-meta', meta));
    const b = el('button', 'it-buy', label); b.type = 'button'; b.disabled = !enabled; b.addEventListener('click', act); r.appendChild(b); return r;
  }
  function draw() {
    const la = laNow(); list.textContent = '';
    title.textContent = shopKind === 'kimhoan' ? 'Kim Hoàn Ngọc Lan' : 'Điện Máy Lam Sen';
    laLine.textContent = `Bạn có ${la} lá bồ đề.`;
    if (shopKind === 'kimhoan') {
      for (const g of GEMS) {
        const left = remainSec(st, g.id), meta = `Giá ${g.gia} lá · dùng ${g.giay / 60} phút${left > 0 ? ` · đang có hiệu lực, còn ${fmtTime(left)} (mua thêm sẽ cộng dồn)` : ''}`;
        list.appendChild(row(g.ten, g.mo, meta, left > 0 ? 'Mua thêm' : 'Mua', la >= g.gia, () => buyGemUi(g)));
      }
    } else {
      const bd = LGT.board ? LGT.board.status() : { van: false };
      list.appendChild(row(BOARD.ten, `Ván trượt 3D: lướt đi nhanh gấp ${String(BOARD.mul).replace('.', ',')} lần. Ván KHÔNG phải vũ khí (không đánh được); đánh nhau thì tự xuống.`, `Giá ${BOARD.gia} lá${bd.van ? ' · Bạn đã có' : ''}`, bd.van ? 'Đã có' : 'Mua', !bd.van && la >= BOARD.gia, async () => { if (LGT.board) await LGT.board.buy(); draw(); }));
      list.appendChild(row(STAFF.ten, STAFF.mo, `Giá ${STAFF.gia} lá${st.staff ? ' · Bạn đã có' : ''}`, st.staff ? 'Đã có' : 'Mua', !st.staff && la >= STAFF.gia, buyStaffUi));
    }
  }
  const closeShop = () => { box.hidden = true; };
  const openShop = (kind) => { shopKind = kind === 'kimhoan' ? 'kimhoan' : 'dienmay'; draw(); box.hidden = false; x.focus({ preventScroll: true }); };
  x.addEventListener('click', closeShop);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeShop(); } });

  // ---------- Chỉ báo hạn dùng (góc trái) ----------
  const chips = el('div', 'it-chips'); document.body.appendChild(chips);
  const was = { hoimau: false, dichchuyen: false };
  function chipsDraw() {
    chips.textContent = '';
    for (const g of GEMS) {
      const left = remainSec(st, g.id), on = left > 0;
      if (on) chips.appendChild(el('span', 'it-chip', `${g.ten}${g.id === 'hoimau' ? ' ×5' : ''} · ${fmtTime(left)}`));
      else if (was[g.id]) toast(`${g.ten} đã hết hạn.`, 3200);
      was[g.id] = on;
    }
  }
  setInterval(chipsDraw, 500); chipsDraw();

  // ---------- Vòng sáng lan ----------
  const ripples = []; let clock = 0, skin = null;
  function spawnRipple(color, ahead, n) {
    const av = LGT.world && LGT.world.avatar, scene = av && av.group && av.group.parent; if (!scene) return;
    if (!RING_GEO) { RING_GEO = new THREE.RingGeometry(0.86, 1, 56); }
    const ry = av.group.rotation.y, p = av.group.position;
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(RING_GEO, mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; m.visible = false;
      m.position.set(p.x + Math.sin(ry) * ahead, p.y + 0.07, p.z + Math.cos(ry) * ahead); scene.add(m);
      ripples.push({ m, scene, t: -i * 0.12, life: 0.75, r: 3.2 });
    }
  }
  function stepRipples(dt) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]; r.t += dt; if (r.t < 0) continue;
      const k = r.t / r.life; if (k >= 1) { r.scene.remove(r.m); r.m.material.dispose(); ripples.splice(i, 1); continue; }
      r.m.visible = true; const e = 1 - (1 - k) * (1 - k); r.m.scale.setScalar(0.3 + (r.r - 0.3) * e); r.m.material.opacity = 0.85 * (1 - k);
    }
  }

  // ---------- Gậy như ý trên tay (bọc update + swing của avatar, giống js/ui/board.js) ----------
  function wrapAvatar() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__items || !av.group || typeof av.update !== 'function') return;
    av.__items = true;
    let host = null; av.group.traverse((o) => { if (!host && o.isGroup && o.rotation.order === 'YXZ' && o.children.length >= 4) host = o; });   // nhóm cây côn của nhân vật chibi
    if (host) skin = { host, orig: host.children.slice(), mesh: null };
    const upd = av.update.bind(av);
    av.update = (dt) => {
      upd(dt); clock += dt; stepRipples(dt);
      if (skin) {
        const want = staffOn();
        if (want && !skin.mesh) { for (const c of skin.orig) c.visible = false; skin.mesh = buildStaff(); skin.host.add(skin.mesh); loadStaffGlb(skin.mesh); }
        else if (!want && skin.mesh) { skin.host.remove(skin.mesh); skin.mesh = null; for (const c of skin.orig) c.visible = true; }   // đổi về Thương: trả cây côn mặc định
        if (skin.mesh) pulseGlows(skin.mesh, clock, !!av.swinging);
      }
    };
    const sw = av.swing;
    if (typeof sw === 'function') av.swing = (...a) => { const r = sw.apply(av, a); if (staffOn()) spawnRipple(0xffd45a, 1.5, 2); return r; };
  }

  // ---------- +1% sát thương khi đang cầm Gậy như ý ----------
  function dmgTick() {
    const mons = LGT.farmView && LGT.farmView.mons; if (!mons || !mons.length) return; const k = staffOn() ? dMul(st) - 1 : 0;
    for (const m of mons) {
      const prev = m.__oi;
      if (k > 0 && prev !== undefined && m.oan < prev) { const extra = (prev - m.oan) * k; if (m.oan - extra > 0.5) m.oan -= extra; }
      m.__oi = m.oan;
    }
  }
  setInterval(() => { try { wrapAvatar(); dmgTick(); } catch (e) { /* không để hỏng game */ } }, 100);

  function tryRevive() {
    if (!canRevive(st)) return false;
    spawnRipple(0x7fd0ff, 0, 3);
    toast(`Ngọc dịch chuyển phát sáng — bạn hồi sinh ngay tại chỗ! (còn ${fmtTime(remainSec(st, 'dichchuyen'))})`, 4200);
    return true;
  }

  LGT.items = { openShop, closeShop, regenMul: () => rMul(st), tryRevive, dmgMul: () => (staffOn() ? dMul(st) : 1), get state() { return st; }, get staff() { return st.staff; } };
  return LGT.items;
}
