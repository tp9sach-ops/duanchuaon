// Cửa hàng nội thất + Túi đồ + sửa nhà (Phiên 41, bước 4). Logic ở js/world/furniture.js (có test). Mọi chữ hiển thị đi qua textContent.
// Chỉ mở khi người chơi đang Ở TRONG NHÀ của mình (LGT.inHouse). Mua bằng lá bồ đề (LGT.merit.spendLa). Lưu localStorage['lgt.furni'].
// Đổi bố trí thì gọi LGT.houseRemount() (js/ui/house.js) để dựng lại phòng 3D và vật cản.
import { icon as bagIcon } from './bagIcons.js';
import { FURNITURE, furnitureById, loadFurni, freeCount, buyItem, autoPlace, moveItem, rotateItem, pickUp, toFurniture, MAX_PLACED } from '../world/furniture.js';
import { houseLevel } from '../world/land.js';
import { createPreview } from './preview.js';

const KEY = 'lgt.furni';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const WHY = { poor: 'Chưa đủ lá bồ đề.', unknown: 'Món này không có.', max: 'Bạn đã có quá nhiều món này.', none: 'Bạn không còn món này trong túi.', full: 'Nhà đã đủ số món tối đa, hãy cất bớt hoặc nâng nhà.', nospace: 'Không còn chỗ trống cho món này.', out: 'Không dời thêm được (chạm tường).', door: 'Không được chặn lối vào cửa.', overlap: 'Chỗ này đã có đồ.', blocked: 'Không xoay được vì vướng đồ khác.', missing: 'Không thấy món này.', person: 'Có người đứng ở chỗ đó, hãy bước sang chỗ khác.' };

/** opts: { toast(text, ms) }. Đặt LGT.furni = { apply: (fn) => apply(fn(st, lv())), get level() { return lv(); }, toastWhy: (r) => toast(WHY[r] || 'Không làm được.', 2800), openShop, openBag, close, get placed (đã toFurniture), get state }. */
export function initFurni(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let st = loadFurni(null); try { st = loadFurni(localStorage.getItem(KEY)); } catch (_) { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* chế độ riêng tư */ } };
  let tab = 'shop', sel = FURNITURE[0].id;   // sel = món đang xem trước trong cửa hàng (Phiên 42)
  const pv = createPreview(() => LGT.interiorScene);
  const lv = () => { const L = LGT.land && LGT.land.state; return L && L.own ? houseLevel(L.own.lv).lv : 0; };
  const leaves = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);

  const box = el('section', 'fn-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Nội thất');
  const head = el('header'), h = el('h3', null, 'Nội thất'), x = el('button', 'fn-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(h, x);
  const tabs = el('div', 'fn-tabs'), tShop = el('button', 'fn-tab', 'Cửa hàng'), tBag = el('button', 'fn-tab', 'Túi đồ'); tShop.type = tBag.type = 'button'; tabs.append(tShop, tBag);
  const info = el('p', 'fn-info'), list = el('div', 'fn-list'); box.append(head, tabs, info, pv.el, list); hud.appendChild(box);

  function changed() { save(); draw(); if (LGT.houseRemount) LGT.houseRemount(); }
  const apply = (r) => { if (!r.ok) { toast(WHY[r.reason] || 'Không làm được.', 2800); return false; } const before = st.placed.length; st = r.st; changed(); if (st.placed.length > before && LGT.act) LGT.act('noithat'); return true; };   // Phiên 51: đặt thêm một món → nhiệm vụ “Đặt món nội thất đầu tiên”
  function buy(id) {
    const f = furnitureById(id), l = LGT.merit && LGT.merit.leaf; if (!f || !l) return;
    const r = buyItem(l, st, id); if (!r.ok) { toast(WHY[r.reason] || 'Không mua được.', 2800); return; }
    if (!LGT.merit.spendLa(f.gia)) { toast(WHY.poor, 2800); return; }
    st = r.st; changed(); toast(`Đã mua ${f.ten} (trừ ${f.gia} lá). Mở Túi đồ để đặt.`, 3200);
  }
  const btn = (label, fn, cls = 'fn-b', aria) => { const b = el('button', cls, label); b.type = 'button'; if (aria) b.setAttribute('aria-label', aria); b.addEventListener('click', fn); return b; };

  function drawShop() {
    info.textContent = `Bạn có ${leaves()} lá bồ đề. Bấm vào món để xem hình, mua xong mở Túi đồ để đặt vào nhà.`;
    const imgs = [];
    for (const f of FURNITURE) {
      const row = el('div', 'fn-row' + (f.id === sel ? ' sel' : '')), t = el('div', 'fn-t'); t.append(el('b', null, f.ten), el('span', null, ` ${f.w}×${f.d} m · còn trong túi ${freeCount(st, f.id)}`));
      const th = el('img', 'fn-th'); th.alt = ''; th.width = th.height = 48; th.draggable = false; const u = pv.ok ? pv.cached(f) : ''; if (u) th.src = u; else if (pv.ok) imgs.push([th, f]); else th.hidden = true;
      const b = btn(`Mua ${f.gia} lá`, (e) => { e.stopPropagation(); buy(f.id); }, 'fn-b buy'); b.disabled = leaves() < f.gia;
      row.append(th, t, b); row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-label', `Xem ${f.ten}`);
      const pick = () => { sel = f.id; list.querySelectorAll('.fn-row.sel').forEach((r) => r.classList.remove('sel')); row.classList.add('sel'); pv.show(f); };
      row.addEventListener('click', pick); row.addEventListener('keydown', (e) => { if (e.target === row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(); } });
      list.appendChild(row);
    }
    pv.show(furnitureById(sel) || FURNITURE[0]);
    fillThumbs(imgs);
  }
  let thumbTimer = 0;
  function fillThumbs(todo) {   // vẽ ảnh nhỏ dần, mỗi nhịp vài món để không đứng máy; xong thì giải phóng bộ vẽ ảnh nhỏ
    clearTimeout(thumbTimer); let i = 0;
    const step = () => {
      if (box.hidden || tab !== 'shop') { pv.endThumbs(); return; }
      for (let k = 0; k < 4 && i < todo.length; k++, i++) { const [th, f] = todo[i], u = pv.thumb(f); if (u && th.isConnected) th.src = u; }
      if (i < todo.length) thumbTimer = setTimeout(step, 16); else pv.endThumbs();
    };
    if (todo.length) thumbTimer = setTimeout(step, 0);
  }
  function drawBag() {
    const L = lv(), max = MAX_PLACED[L];
    info.textContent = `Đã đặt ${st.placed.length}/${max} món trong nhà.`;
    const free = FURNITURE.filter((f) => freeCount(st, f.id) > 0);
    list.appendChild(el('h4', null, 'Chưa đặt'));
    if (!free.length) list.appendChild(el('p', 'fn-hint', 'Túi trống. Mua đồ ở tab Cửa hàng.'));
    for (const f of free) { const row = el('div', 'fn-row'), t = el('div', 'fn-t'); t.append(el('b', null, f.ten), el('span', null, ` × ${freeCount(st, f.id)}`)); row.append(bagIcon({ k: f.kind, c: '#' + (f.color & 0xffffff).toString(16).padStart(6, '0') }), t, btn('Đặt', () => apply(autoPlace(st, L, f.id)), 'fn-b buy')); list.appendChild(row); }   // Phiên 92: có hình món đồ
    list.appendChild(el('h4', null, 'Đã đặt trong nhà'));
    if (!st.placed.length) list.appendChild(el('p', 'fn-hint', 'Chưa đặt món nào. Nhà đang trống.'));
    for (const p of st.placed) {
      const f = furnitureById(p.id); if (!f) continue;
      const row = el('div', 'fn-row col'), t = el('div', 'fn-t'); t.append(el('b', null, f.ten)), row.appendChild(t);
      const ctl = el('div', 'fn-ctl');
      ctl.append(
        btn('◀', () => apply(moveItem(st, L, p.uid, -0.25, 0)), 'fn-b sm', 'Dời sang trái'), btn('▶', () => apply(moveItem(st, L, p.uid, 0.25, 0)), 'fn-b sm', 'Dời sang phải'),
        btn('▲', () => apply(moveItem(st, L, p.uid, 0, -0.25)), 'fn-b sm', 'Dời vào trong (về phía tường sau)'), btn('▼', () => apply(moveItem(st, L, p.uid, 0, 0.25)), 'fn-b sm', 'Dời ra phía cửa'),
        btn('Xoay', () => apply(rotateItem(st, L, p.uid)), 'fn-b sm'), btn('Cất', () => apply(pickUp(st, p.uid)), 'fn-b sm'));
      row.appendChild(ctl); list.appendChild(row);
    }
  }
  function draw() {
    tShop.classList.toggle('on', tab === 'shop'); tBag.classList.toggle('on', tab === 'bag'); h.textContent = tab === 'shop' ? 'Cửa hàng nội thất' : 'Túi đồ · sửa nhà';
    const keep = list.scrollTop; list.textContent = ''; pv.el.hidden = tab !== 'shop' || !pv.ok; if (tab === 'shop') drawShop(); else drawBag(); list.scrollTop = keep;
    if (!box.hidden && tab === 'shop') pv.start(); else pv.stop();
  }
  function open(which) {
    if (!LGT.inHouse) { toast('Hãy vào nhà của bạn rồi mở Cửa hàng / Túi đồ để sửa nhà.', 3500); return; }
    tab = which; box.hidden = false; draw(); (box.querySelector('.fn-b:not(:disabled)') || x).focus({ preventScroll: true });
  }
  const close = () => { box.hidden = true; pv.stop(); pv.endThumbs(); };
  tShop.addEventListener('click', () => { tab = 'shop'; draw(); }); tBag.addEventListener('click', () => { tab = 'bag'; draw(); });
  x.addEventListener('click', close);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });

  LGT.furni = { apply: (fn) => apply(fn(st, lv())), get level() { return lv(); }, toastWhy: (r) => toast(WHY[r] || 'Không làm được.', 2800), openShop: () => open('shop'), openBag: () => open('bag'), close, get placed() { return st.placed.map(toFurniture).filter(Boolean); }, get state() { return st; } };
  return LGT.furni;
}
