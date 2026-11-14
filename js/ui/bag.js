// Túi hồ lô (trước là "Túi đồ") khi ĐANG Ở NGOÀI NHÀ (Phiên 62; Phiên 92: lưới ô có hình; Phiên 146: giao diện thẻ như game mẫu).
// Bố cục: tab danh mục ở trên; bên trái là NHÂN VẬT 3D của bạn đang mang đúng đồ đang cầm (Thương / Gậy như ý / Ván trượt); bên phải là lưới thẻ vật phẩm.
// Đồ đang dùng có TICK XANH (đồ đang cầm; quả cầu câu cá đang dùng). Bấm Thương / Gậy như ý / Ván để đổi đồ cầm (LGT.loadout, js/ui/board.js) — nhân vật bên cạnh đổi theo ngay.
// Ảnh Thương / Gậy như ý / Ván trượt là ảnh chụp từ mô hình 3D thật (cùng mô hình ngoài game). Không có WebGL thì dùng hình vẽ SVG như cũ và ẩn khung nhân vật.
// Trong nhà, nút Túi hồ lô vẫn mở bảng sửa nhà (js/ui/furni.js). Nội dung từ js/world/dock.js (bagSections), hình vẽ SVG từ js/ui/bagIcons.js.
import * as THREE from 'three';
import { bagSections } from '../world/dock.js';
import { icon } from './bagIcons.js';
import { createAvatar } from '../world/avatar.js';
import { DEFAULT_COLOR } from '../world/avatarLogic.js';
import { buildStaff, loadStaffGlb, pulseGlows } from './staffMesh.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const COLS = 3;   // số ô mỗi hàng (lưới tự lấp ô trống cho đủ hàng)
const HOLD_ICON = { thuong: { k: 'power' }, nhuy: { k: 'lantern', c: '#d8272f' }, van: { k: 'board', c: '#f2a31b' } };
const TABS = [
  { id: 'all', ten: 'Tất cả', ts: null },
  { id: 'cam', ten: 'Đang cầm', ts: ['Đang cầm'] },
  { id: 'tien', ten: 'Tiền', ts: ['Tiền'] },
  { id: 'cau', ten: 'Câu cá', ts: ['Quả cầu câu cá', 'Ao cá riêng'] },
  { id: 'nt', ten: 'Nội thất', ts: ['Nội thất'] },
  { id: 'khac', ten: 'Khác', ts: ['Thân pháp & nhà', 'Mảnh chuông Diệu Giang'] },
];
/** Số hiển thị ở góc ô: 1.234 → "1234", từ 10.000 trở lên rút gọn "12k". */
export const fmtN = (n) => (n >= 10000 ? (n >= 1e6 ? Math.floor(n / 1e5) / 10 + 'M' : Math.floor(n / 1000) + 'k') : String(n));

const CSS = '.bg2{display:flex;flex-direction:column;overflow:hidden;width:min(560px,calc(100vw - 20px));max-height:min(80vh,660px);padding:12px;background:linear-gradient(180deg,#c8573b,#a8432d);border:2px solid #f0c27a;color:#fff4de}'
  + '.bg2 header{margin-bottom:8px}.bg2 h3{color:#fff4de;font:700 19px/1.2 var(--serif,Georgia,serif);text-shadow:0 1px 0 rgba(0,0,0,.25)}'
  + '.bg2 .bg-x{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.55);color:#fff}'
  + '.bg-tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;margin-bottom:6px;border-bottom:2px dashed rgba(255,244,222,.35);scrollbar-width:none}.bg-tabs::-webkit-scrollbar{display:none}'
  + '.bg-tabs button{flex:none;padding:6px 12px;border-radius:999px;border:0;background:rgba(255,255,255,.16);color:#ffe9c8;font:600 12.5px/1.1 var(--sans,inherit);cursor:pointer;min-height:32px}'
  + '.bg-tabs button.on{background:#fff4de;color:#9a3a22;box-shadow:0 2px 0 rgba(0,0,0,.2)}'
  + '.bg-body{display:grid;grid-template-columns:150px minmax(0,1fr);gap:10px;min-height:0;flex:1}'
  + '.bg-me{align-self:start;position:sticky;top:0;padding:6px 6px 8px;border-radius:14px;background:radial-gradient(circle at 50% 35%,#ffe9c8,#e9b98a);text-align:center;box-shadow:inset 0 0 0 2px rgba(255,255,255,.45),0 3px 0 rgba(0,0,0,.18)}'
  + '.bg-me[hidden]{display:none!important}.bg-me canvas{display:block;width:100%;aspect-ratio:5/7;border-radius:10px;touch-action:none}'
  + '.bg-me-cap{margin:4px 0 0;color:#6a2c18;font:700 12px/1.3 var(--sans,inherit)}'
  + '.bg-main{min-height:0;overflow:auto;padding-right:2px}'
  + '.bg2 .bg-sec h4{margin:4px 0 6px;color:#ffe2a8;font:700 12px/1.2 var(--sans,inherit);letter-spacing:.06em;text-transform:uppercase}'
  + '.bg2 .bg-grid{grid-template-columns:repeat(' + COLS + ',minmax(0,1fr));gap:8px}'
  + '.bg2 .bg-cell{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:0;min-height:108px;padding:24px 3px 6px;border-radius:14px;border:2px solid transparent;background:#f3efe8;color:#4a3426;box-shadow:0 3px 0 rgba(0,0,0,.2);transition:transform .08s}'
  + '.bg2 .bg-cell:not(.empty):hover{background:#fff8ec}.bg2 .bg-cell:not(.empty):active{transform:scale(.97)}'
  + '.bg2 .bg-cell.empty{background:rgba(255,255,255,.1);border:2px dashed rgba(255,244,222,.28);box-shadow:none}'
  + '.bg2 .bg-cell.sel{border-color:#f2a31b;background:#fff3d6}'
  + '.bg2 .bg-cell.use{border-color:#2fbf5b;box-shadow:0 0 0 2px rgba(47,191,91,.5),0 3px 0 rgba(0,0,0,.2)}'
  + '.bg2 .bg-cell.lock .bg-art,.bg2 .bg-cell.lock .bg-nm{opacity:.5}'
  + '.bg2 .bg-nm{position:absolute;left:4px;right:22px;top:5px;max-width:none;padding:0;color:#5a3a28;font:600 10.5px/1.15 var(--sans,inherit);text-align:left;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}'
  + '.bg-art{display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#fffaf0,#dccfb8)}'
  + '.bg-art .bg-ic{width:44px;height:44px}.bg-art .bg-img{width:60px;height:60px;object-fit:contain;display:block}'
  + '.bg2 .bg-n{position:absolute;right:4px;bottom:4px;top:auto;min-width:18px;padding:1px 6px;border-radius:9px;background:rgba(74,52,38,.85);border:0;color:#fff4de;font:700 10.5px/1.3 var(--sans,inherit)}'
  + '.bg-tick{position:absolute;right:4px;top:4px;width:20px;height:20px;border-radius:50%;background:#22b24c;border:2px solid #fff;color:#fff;font:800 12px/16px var(--sans,inherit);text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.35)}'
  + '.bg2 .bg-hint{color:#ffe9c8}.bg2 .bg-note{color:#ffd9b0}'
  + '.bg2 .bg-detail{position:sticky;bottom:0;margin:8px 0 0;padding:8px 10px;border-radius:10px;border-top:0;background:rgba(70,26,14,.92);color:#fff4de}.bg2 .bg-detail b{color:#ffe2a8}'
  + '@media (max-width:480px){.bg-body{grid-template-columns:104px minmax(0,1fr);gap:8px}.bg2 .bg-cell{min-height:100px}.bg-art{width:54px;height:54px}.bg-art .bg-img{width:52px;height:52px}}';
let styled = false;

// ---------- Ảnh 3D của Thương / Gậy như ý / Ván trượt ----------
function makeCon() {   // cây côn mặc định (đồ "Thương" cầm trên tay): cán gỗ, chụp vàng, dải đỏ, quấn da chỗ nắm
  const g = new THREE.Group(), std = (c, r = 0.55) => new THREE.MeshStandardMaterial({ color: c, roughness: r }), wood = std(0x7a4a24), cap = std(0xe0a93a, 0.35), band = std(0xb3261e, 0.5), grip = std(0x2f1d10, 0.8);
  const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; g.add(m); };
  add(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 12), wood, 0);
  for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), cap, s * 0.74); add(new THREE.CylinderGeometry(0.038, 0.038, 0.12, 12), band, s * 0.5); }
  add(new THREE.CylinderGeometry(0.036, 0.036, 0.16, 12), grip, 0);
  return g;
}
const BOARD_TOP = 0.15;   // mặt trên ván cách đất (m)
function makeBoard() {   // ván trượt: mặt ván cam hai đầu cong, trục + 4 bánh xe trắng
  const g = new THREE.Group(), std = (c, r = 0.5, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const deck = std(0xf2a31b), dark = std(0x2a2a30, 0.7), wheel = std(0xf4f1e6, 0.4), metal = std(0xaab2bd, 0.35, 0.7);
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(0.26, 0.03, 0.8), deck, 0, 0.13, 0);
  for (const s of [-1, 1]) { const k = add(new THREE.BoxGeometry(0.26, 0.03, 0.16), deck, 0, 0.145, s * 0.46); k.rotation.x = -s * 0.3; }
  add(new THREE.BoxGeometry(0.255, 0.004, 0.8), dark, 0, 0.147, 0);
  for (const z of [-0.3, 0.3]) { add(new THREE.BoxGeometry(0.2, 0.02, 0.035), metal, 0, 0.085, z); for (const x of [-0.1, 0.1]) { const w = add(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 14), wheel, x, 0.04, z); w.rotation.z = Math.PI / 2; } }
  return g;
}
const BUILD = { thuong: makeCon, nhuy: () => buildStaff(), van: makeBoard };
const thumbCache = new Map();
const disposeTree = (o) => o.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.material) { for (const m of Array.isArray(n.material) ? n.material : [n.material]) m.dispose(); } });
/** Chụp ảnh nhỏ từ mô hình 3D (một lần, nhớ lại). Trả { id: dataURL | '' }. '' = không chụp được (dùng hình SVG). */
function thumbsFor(ids) {
  const need = ids.filter((id) => !thumbCache.has(id));
  if (need.length) {
    let r = null;
    try {
      const cv = document.createElement('canvas'); r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(112, 112, false);
      for (const id of need) {
        try {
          const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
          scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a48, 1.15)); const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(2.5, 4, 3); scene.add(sun);
          const obj = BUILD[id](), wrap = new THREE.Group(); wrap.add(obj);
          if (id === 'van') wrap.rotation.set(0.35, -0.7, 0); else wrap.rotation.z = 0.9;   // ván nhìn chéo; gậy/côn nằm chéo cho đẹp
          scene.add(wrap); wrap.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(wrap), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
          const rad = Math.max(0.2, size.length() / 2), dist = (rad / Math.sin((15 * Math.PI) / 180)) * 1.05;
          cam.position.set(c.x, c.y + dist * 0.12, c.z + dist); cam.lookAt(c);
          r.render(scene, cam); thumbCache.set(id, r.domElement.toDataURL('image/png')); disposeTree(scene);
        } catch (_) { thumbCache.set(id, ''); }
      }
    } catch (_) { for (const id of need) thumbCache.set(id, ''); }
    finally { if (r) { try { r.dispose(); r.forceContextLoss(); } catch (_) { /* bỏ qua */ } } }
  }
  return Object.fromEntries(ids.map((id) => [id, thumbCache.get(id) || '']));
}

const ls = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };

/** hud: phần tử HUD. Đặt LGT.bag = { open, close, get isOpen }. */
export function initBag(hud) {
  const LGT = window.LGT || (window.LGT = {});
  if (!styled) { styled = true; document.head.appendChild(el('style', null, CSS)); }
  const box = el('section', 'bg-box bg2'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Túi hồ lô');
  const head = el('header'), x = el('button', 'bg-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(el('h3', null, 'Túi hồ lô của bạn'), x);
  const tabs = el('nav', 'bg-tabs'); tabs.setAttribute('aria-label', 'Danh mục');
  const body = el('div', 'bg-body'), me = el('aside', 'bg-me'), cv = el('canvas'), cap = el('p', 'bg-me-cap');
  cv.width = 300; cv.height = 420; cv.setAttribute('aria-label', 'Nhân vật của bạn đang mang đồ đang cầm'); me.append(cv, cap);
  const main = el('div', 'bg-main'), list = el('div', 'bg-list'), detail = el('p', 'bg-detail'), note = el('p', 'bg-note', 'Muốn đặt đồ vào nhà: vào nhà của bạn rồi bấm “Túi hồ lô” lần nữa.');
  detail.setAttribute('role', 'status'); main.append(list, note, detail); body.append(me, main); box.append(head, tabs, body); hud.appendChild(box);
  let picked = null, tab = 'all';
  for (const t of TABS) { const b = el('button', null, t.ten); b.type = 'button'; b.dataset.id = t.id; b.addEventListener('click', () => { tab = t.id; draw(); }); tabs.appendChild(b); }

  // ---------- Nhân vật 3D bên cạnh ----------
  const look = (() => {
    let renderer = null, scene = null, cam = null, av = null, raf = 0, last = 0, hold = 'thuong', bad = false;
    const st = { host: null, orig: [], staff: null, board: null };
    function clearGear() {
      if (st.staff) { st.host.remove(st.staff); disposeTree(st.staff); st.staff = null; for (const c of st.orig) c.visible = true; }
      if (st.board) { av.group.remove(st.board); disposeTree(st.board); st.board = null; av.group.position.y = 0; }
    }
    function apply() {
      if (!av) return; clearGear();
      if (av.setStance) av.setStance(hold !== 'van');   // cầm thương/gậy: vào thế sẵn sàng (côn hiện trên tay); đứng ván: đứng thẳng
      if (hold === 'nhuy' && st.host) { for (const c of st.orig) c.visible = false; st.staff = buildStaff(); st.host.add(st.staff); loadStaffGlb(st.staff); }
      if (hold === 'van') { st.board = makeBoard(); st.board.position.y = -BOARD_TOP; av.group.add(st.board); av.group.position.y = BOARD_TOP; }
    }
    function frame(t) {
      raf = requestAnimationFrame(frame); if (!renderer || document.hidden) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      av.setFacing(0.45 + Math.sin(t / 1600) * 0.55); av.update(dt);
      if (st.staff) pulseGlows(st.staff, t / 1000, false);
      renderer.render(scene, cam);
    }
    return {
      get ok() { return !bad; },
      start() {
        if (renderer) return true; if (bad) return false;
        try {
          renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(300, 420, false);
          scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a48, 1.1)); const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(2.5, 4, 3); scene.add(sun);
          cam = new THREE.PerspectiveCamera(28, 300 / 420, 0.1, 30); cam.position.set(0, 0.9, 4.1); cam.lookAt(0, 0.8, 0);
          av = createAvatar({ name: 'Tôi', color: ls('lgt.color') || DEFAULT_COLOR, hair: ls('lgt.hair') || 'troc', mine: false });
          av.group.traverse((o) => { if (o.isSprite) o.visible = false; });   // ẩn tên / thanh máu / hào quang trên đầu
          scene.add(av.group); av.setFacing(0.45, true);
          let hand = null; av.group.traverse((o) => { if (o.isBone && o.name === 'handR') hand = o; });   // bàn tay phải của thân chibi (có cây côn)
          st.host = hand ? hand.children.find((c) => c.isGroup && c.rotation.order === 'YXZ') || null : null; st.orig = st.host ? st.host.children.slice() : [];
          apply(); last = 0; raf = requestAnimationFrame(frame); return true;
        } catch (err) { console.warn('[Diệu Giang Tự] Không dựng được nhân vật trong Túi hồ lô:', err && err.message); bad = true; this.stop(); return false; }
      },
      set(id) { hold = id; apply(); },
      stop() {
        if (raf) cancelAnimationFrame(raf); raf = 0;
        try { if (av) { clearGear(); scene.remove(av.group); av.dispose(); } } catch (_) { /* bỏ qua */ }
        av = null; st.host = null; st.orig = [];
        try { if (renderer) { renderer.dispose(); renderer.forceContextLoss(); } } catch (_) { /* bỏ qua */ }
        renderer = null; scene = null; cam = null;
      },
    };
  })();

  // ---------- Ô vật phẩm ----------
  function show(cell, r) {
    if (picked) picked.classList.remove('sel'); picked = cell; cell.classList.add('sel');
    detail.textContent = ''; detail.append(el('b', null, r.ten), document.createTextNode(' — ' + r.mo));
  }
  function makeCell({ ten, ic, img, n, use, lock }) {
    const cell = el('button', 'bg-cell' + (use ? ' use' : '') + (lock ? ' lock' : '')); cell.type = 'button';
    const art = el('span', 'bg-art');
    if (img) { const im = el('img', 'bg-img'); im.src = img; im.alt = ''; im.draggable = false; art.appendChild(im); } else art.appendChild(icon(ic));
    cell.append(el('span', 'bg-nm', ten), art);
    if (n != null) cell.appendChild(el('span', 'bg-n', typeof n === 'number' ? fmtN(n) : n));
    if (use) { const t = el('span', 'bg-tick', '✓'); t.setAttribute('aria-hidden', 'true'); cell.appendChild(t); }
    return cell;
  }
  function pad(grid, cells) {
    const total = Math.max(COLS, Math.ceil(cells / COLS) * COLS);
    for (let i = cells; i < total; i++) { const e = el('div', 'bg-cell empty'); e.setAttribute('aria-hidden', 'true'); grid.appendChild(e); }
  }
  function holdSection(lo) {   // ĐANG CẦM: chọn Thương / Gậy như ý / Ván trượt
    const sec = el('div', 'bg-sec'); sec.appendChild(el('h4', null, 'Đang cầm')); const grid = el('div', 'bg-grid');
    const holds = lo.list(), img = look.ok ? thumbsFor(holds.map((h) => h.id)) : {};
    for (const h of holds) {
      const cell = makeCell({ ten: h.ten, ic: HOLD_ICON[h.id], img: img[h.id], n: h.own ? null : 'Chưa có', use: h.current, lock: !h.own });
      cell.setAttribute('aria-label', `${h.ten}${h.current ? ' (đang cầm)' : h.own ? '' : ' (chưa có)'}`);
      cell.addEventListener('click', () => {
        if (!h.own) { show(cell, { ten: h.ten, mo: `Chưa có. ${h.id === 'nhuy' ? 'Mua ở Điện Máy Lam Sen, 400 lá bồ đề.' : 'Mua ở Điện Máy Lam Sen, 100 lá bồ đề.'}` }); lo.choose(h.id); return; }
        if (lo.choose(h.id)) draw();
      });
      grid.appendChild(cell);
    }
    pad(grid, holds.length);
    sec.appendChild(grid); sec.appendChild(el('p', 'bg-hint', 'Thương được tặng sẵn. Ô có tick xanh là đồ nhân vật đang cầm (hình nhân vật bên cạnh mang đúng đồ đó). Đồ đang cầm là thứ bạn đánh và cưỡi (nút “Cưỡi” góc phải-dưới). Ván trượt không phải vũ khí.'));
    return sec;
  }
  function updateLook() {
    const lo = LGT.loadout, cur = lo ? lo.hold : 'thuong', h = lo ? lo.list().find((a) => a.id === cur) : null;
    cap.textContent = `Đang dùng: ${h ? h.ten : 'Thương'}`;
    if (look.ok) look.set(cur);
  }
  function draw() {
    list.textContent = ''; picked = null; detail.textContent = 'Bấm vào một ô để xem chi tiết.';
    for (const b of tabs.children) b.classList.toggle('on', b.dataset.id === tab);
    const want = TABS.find((t) => t.id === tab) || TABS[0], okSec = (title) => !want.ts || want.ts.includes(title);
    const lo = LGT.loadout; if (lo && okSec('Đang cầm')) list.appendChild(holdSection(lo));
    const la = LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0, ns = LGT.skill ? LGT.skill.level : 0, bs = LGT.board && LGT.board.status();
    for (const s of bagSections({ sen: LGT.getSen ? LGT.getSen() : 0, la, fish: LGT.fishing && LGT.fishing.state, furni: LGT.furni && LGT.furni.state, khinh: ns, board: bs ? { own: !!bs.van, on: !!(bs.on && bs.hold === 'van') } : null, land: LGT.land && LGT.land.state, bell: LGT.story && LGT.story.state2 ? { da: !!LGT.story.state2.shards.da } : null, strength: LGT.strength ? { value: LGT.strength.value, tier: LGT.strength.tier, limit: LGT.strength.limit } : null })) {
      if (!okSec(s.title)) continue;
      const sec = el('div', 'bg-sec'); sec.appendChild(el('h4', null, s.title));
      const grid = el('div', 'bg-grid'); let cells = 0, hint = '';
      for (const r of s.rows) {
        if (r.trong) { hint = `${r.ten}. ${r.mo}`; continue; }   // hàng "trống": không phải vật phẩm, chỉ là lời gợi ý dưới lưới
        const showN = r.n != null && !(r.n === 1 && s.title !== 'Tiền');
        const cell = makeCell({ ten: r.ten, ic: r.ic, n: showN ? r.n : null, use: /đang dùng/.test(r.mo || '') });   // quả cầu câu cá đang dùng có tick xanh
        cell.setAttribute('aria-label', `${r.ten}: ${r.mo}`); cell.addEventListener('click', () => show(cell, r)); grid.appendChild(cell); cells++;
      }
      pad(grid, cells); sec.appendChild(grid); if (hint) sec.appendChild(el('p', 'bg-hint', hint));
      list.appendChild(sec);
    }
    if (!list.children.length) list.appendChild(el('p', 'bg-hint', 'Mục này chưa có gì.'));
    updateLook();
  }
  const open = () => { if (LGT.panelOpen) return; box.hidden = false; me.hidden = !look.start(); draw(); x.focus({ preventScroll: true }); };
  const close = () => { box.hidden = true; look.stop(); };
  x.addEventListener('click', close);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  LGT.bag = { open, close, get isOpen() { return !box.hidden; } };
  return LGT.bag;
}
