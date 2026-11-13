// Vật phẩm mua bằng lá bồ đề (mục 1): giao diện. Luật/số: js/world/items.js (có test). Nạp từ js/ui/board.js (initBoard). Đặt LGT.items = { openShop(kind), closeShop(), regenMul(), tryRevive(), dmgMul(), state }.
// - Cửa hàng 'kimhoan' (NPC Kim Hoàn Ngọc Lan): Ngọc hồi máu 100 lá (hồi Sinh Lực ×5, 10 phút), Ngọc dịch chuyển 200 lá (hết Sinh Lực hồi sinh tại chỗ, 20 phút). Cửa hàng 'dienmay' (NPC Điện Máy Lam Sen): Ván trượt 100 lá (js/ui/board.js), Gậy như ý 400 lá.
// - Hồi máu ×5 / hồi sinh tại chỗ: js/ui/farmCombat.js gọi LGT.items.regenMul() và LGT.items.tryRevive(). Hạn dùng tính theo giờ thật nên đổi tab vẫn chạy.
// - Gậy như ý: thay hình cây côn cầm tay (nhân vật chibi GLB) bằng cây gậy đỏ đầu đồng chạm rồng như ảnh mẫu, có ánh sáng nhấp nháy; mỗi đòn đánh lan ra vòng sáng trước mặt; +1% sát thương lên quái bãi rừng (cộng thêm 1% vào phần Oán Khí quái vừa mất, không sửa farm.js).
// Nhân vật dựng bằng khối (không phải chibi) thì không đổi hình gậy nhưng vẫn có +1% và vòng sáng. CHƯA nhìn bằng mắt trên máy thật.
import * as THREE from 'three';
import { GEMS, STAFF, loadItems, buyGem, buyStaff, remainSec, regenMul as rMul, canRevive, dmgMul as dMul, fmtTime } from '../world/items.js';
import { BOARD } from '../world/board.js';
import { askConfirm } from './dialog.js';

const KEY = 'lgt.items';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const CSS = '.it-box{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9500;width:min(92vw,430px);max-height:84vh;overflow:auto;background:rgba(26,17,10,.97);color:#f4e4c1;border:1px solid #c9a24a;border-radius:14px;padding:14px;font:14px/1.45 "Be Vietnam Pro","Noto Sans",system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.55)}'
  + '.it-box header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.it-box h3{margin:0;font-size:17px;color:#f2c14e}'
  + '.it-x{background:none;border:0;color:#f4e4c1;font-size:24px;line-height:1;cursor:pointer;padding:2px 8px}.it-la{margin:0 0 10px;color:#cdb98a}'
  + '.it-row{border:1px solid rgba(201,162,74,.35);border-radius:10px;padding:10px;margin-bottom:8px;background:rgba(255,255,255,.03)}.it-row b{color:#ffe08a}.it-row p{margin:4px 0}'
  + '.it-meta{color:#cdb98a;font-size:13px}.it-buy{margin-top:6px;background:#c9a24a;color:#2a1a08;border:0;border-radius:8px;padding:8px 16px;font:600 14px inherit;cursor:pointer;min-height:40px}.it-buy:disabled{opacity:.45;cursor:default}'
  + '.it-chips{position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 56px);z-index:40;display:flex;flex-direction:column;gap:4px;pointer-events:none}'
  + '.it-chip{background:rgba(26,17,10,.82);color:#ffe08a;border:1px solid #c9a24a;border-radius:999px;padding:3px 10px;font:600 12px "Be Vietnam Pro",system-ui,sans-serif}';

let RING_GEO = null, GLOW_TEX = null;
function glowTexture() {
  if (GLOW_TEX) return GLOW_TEX;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,245,200,1)'); gr.addColorStop(0.35, 'rgba(255,205,90,.55)'); gr.addColorStop(1, 'rgba(255,170,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  GLOW_TEX = new THREE.CanvasTexture(c); GLOW_TEX.colorSpace = THREE.SRGBColorSpace; return GLOW_TEX;
}

/** Cây Gậy như ý (theo ảnh mẫu): cán đỏ sẫm bóng, hai đầu đồng chạm rồng cuốn (hàng cầu xoắn ruột gà + vành + chóp tròn), có 3 điểm sáng. Dài 1,5 m, gốc ở giữa (khớp cây côn chibi: trục y dóng theo cánh tay, nắm chính giữa). */
function buildStaff() {
  const g = new THREE.Group(); g.name = 'gaynhuy';
  const red = new THREE.MeshStandardMaterial({ color: 0xb3202e, roughness: 0.32, metalness: 0.55, emissive: 0x4a0008, emissiveIntensity: 0.6 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x8c5a3c, roughness: 0.42, metalness: 0.7, emissive: 0x3a2006, emissiveIntensity: 0.5 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf0b73c, roughness: 0.28, metalness: 0.8, emissive: 0x7a5200, emissiveIntensity: 0.9 });
  const put = (geo, mat, y, flip) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; if (flip) m.rotation.x = Math.PI; g.add(m); return m; };
  put(new THREE.CylinderGeometry(0.03, 0.03, 0.98, 14), red, 0, false);   // cán đỏ
  for (const s of [-1, 1]) {
    const fl = s < 0;
    const r1 = put(new THREE.TorusGeometry(0.036, 0.012, 8, 18), gold, s * 0.495, false); r1.rotation.x = Math.PI / 2;   // vành vàng nối cán với đầu
    put(new THREE.CylinderGeometry(0.058, 0.04, 0.07, 14), bronze, s * 0.54, fl);                                    // đế doa rộng
    const r2 = put(new THREE.TorusGeometry(0.05, 0.01, 8, 18), gold, s * 0.585, false); r2.rotation.x = Math.PI / 2;
    put(new THREE.CylinderGeometry(0.04, 0.045, 0.16, 14), bronze, s * 0.67, fl);                                    // thân đồng
    for (let i = 0; i < 18; i++) {                                                                                  // rồng cuốn: các cục nổi xếp xoắn ốc
      const a = i * 0.95, y = 0.595 + (i / 17) * 0.15, b = put(new THREE.SphereGeometry(0.017, 8, 6), i % 3 === 0 ? gold : bronze, s * y, false);
      b.position.x = Math.cos(a) * 0.047; b.position.z = Math.sin(a) * 0.047;
    }
    const cap = put(new THREE.SphereGeometry(0.052, 14, 10), bronze, s * 0.77, false); cap.scale.set(1, 1.15, 1);     // chóp tròn (không mũi nhọn)
    const r3 = put(new THREE.TorusGeometry(0.046, 0.009, 8, 18), gold, s * 0.73, false); r3.rotation.x = Math.PI / 2;
  }
  const glows = [];
  for (const y of [-0.77, 0, 0.77]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.y = y; sp.scale.set(y === 0 ? 0.55 : 0.42, y === 0 ? 0.55 : 0.42, 1); g.add(sp); glows.push(sp);
  }
  g.userData.glows = glows;
  g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return g;
}

/** hud/opts: { toast(text, ms) }. */
export function initItems({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  if (LGT.items) return LGT.items;
  let st = loadItems(null); try { st = loadItems(localStorage.getItem(KEY)); } catch (_) { /* riêng tư */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* bỏ qua */ } };
  document.head.appendChild(el('style', null, CSS));
  const laNow = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);
  const spend = (n) => !!(LGT.merit && LGT.merit.spendLa && LGT.merit.spendLa(n));

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
    st = r.state; save(); draw(); toast(`Đã mua ${STAFF.ten} (−${r.cost} lá bồ đề). Cây gậy sáng lên trên tay bạn!`, 3600);
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
      const bd = LGT.board ? LGT.board.status() : { own: false };
      list.appendChild(row(BOARD.ten, `Ván trượt 3D: đứng lên ván đi nhanh gấp ${String(BOARD.mul).replace('.', ',')} lần bình thường (đánh nhau thì tự xuống).`, `Giá ${BOARD.gia} lá${bd.own ? ' · Bạn đã có' : ''}`, bd.own ? 'Đã có' : 'Mua', !bd.own && la >= BOARD.gia, async () => { if (LGT.board) await LGT.board.buy(); draw(); }));
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

  // ---------- Vòng sáng lan (khi đánh bằng Gậy như ý, khi hồi sinh tại chỗ) ----------
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

  // ---------- Gậy như ý trên nhân vật (bọc update + swing của avatar, giống js/ui/board.js) ----------
  function wrapAvatar() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__items || !av.group || typeof av.update !== 'function') return;
    av.__items = true;
    let host = null; av.group.traverse((o) => { if (!host && o.isGroup && o.rotation.order === 'YXZ' && o.children.length >= 4) host = o; });   // nhóm cây côn của nhân vật chibi (js/world/avatarChibi.js)
    if (host) skin = { host, orig: host.children.slice(), mesh: null };
    const upd = av.update.bind(av);
    av.update = (dt) => {
      upd(dt); clock += dt; stepRipples(dt);
      if (skin && st.staff && !skin.mesh) { for (const c of skin.orig) c.visible = false; skin.mesh = buildStaff(); skin.host.add(skin.mesh); }
      if (skin && skin.mesh) { const k = 0.5 + 0.25 * Math.sin(clock * 4) + (av.swinging ? 0.35 : 0); for (const s of skin.mesh.userData.glows) s.material.opacity = Math.min(1, k); }
    };
    const sw = av.swing;
    if (typeof sw === 'function') av.swing = (...a) => { const r = sw.apply(av, a); if (st.staff) spawnRipple(0xffd45a, 1.5, 2); return r; };
  }

  // ---------- +1% sát thương lên quái bãi rừng: quái vừa mất Oán Khí bao nhiêu thì mất thêm 1% phần đó (không bao giờ tự giết quái) ----------
  function dmgTick() {
    const mons = LGT.farmView && LGT.farmView.mons; if (!mons || !mons.length) return; const k = dMul(st) - 1;
    for (const m of mons) {
      const prev = m.__oi;
      if (k > 0 && prev !== undefined && m.oan < prev) { const extra = (prev - m.oan) * k; if (m.oan - extra > 0.5) m.oan -= extra; }
      m.__oi = m.oan;
    }
  }
  setInterval(() => { try { wrapAvatar(); dmgTick(); } catch (e) { /* không để hỏng game */ } }, 100);

  /** Ngọc dịch chuyển: farmCombat gọi khi hết Sinh Lực. true = hồi sinh tại chỗ (không về cổng chùa). */
  function tryRevive() {
    if (!canRevive(st)) return false;
    spawnRipple(0x7fd0ff, 0, 3);
    toast(`Ngọc dịch chuyển phát sáng — bạn hồi sinh ngay tại chỗ! (còn ${fmtTime(remainSec(st, 'dichchuyen'))})`, 4200);
    return true;
  }

  LGT.items = { openShop, closeShop, regenMul: () => rMul(st), tryRevive, dmgMul: () => dMul(st), get state() { return st; } };
  return LGT.items;
}
