// Cửa hàng nội thất + Túi đồ + sửa nhà (Phiên 41, bước 4). Logic ở js/world/furniture.js (có test). Mọi chữ hiển thị đi qua textContent.
// Chỉ mở khi người chơi đang Ở TRONG NHÀ của mình (LGT.inHouse). Mua bằng lá bồ đề (LGT.merit.spendLa). Lưu localStorage['lgt.furni'].
// Đổi bố trí thì gọi LGT.houseRemount() (js/ui/house.js) để dựng lại phòng 3D và vật cản.
import { FURNITURE, furnitureById, loadFurni, freeCount, buyItem, autoPlace, moveItem, rotateItem, pickUp, toFurniture, MAX_PLACED } from '../world/furniture.js';
import { houseLevel } from '../world/land.js';

const KEY = 'lgt.furni';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const WHY = { poor: 'Chưa đủ lá bồ đề.', unknown: 'Món này không có.', max: 'Bạn đã có quá nhiều món này.', none: 'Bạn không còn món này trong túi.', full: 'Nhà đã đủ số món tối đa, hãy cất bớt hoặc nâng nhà.', nospace: 'Không còn chỗ trống cho món này.', out: 'Không dời thêm được (chạm tường).', door: 'Không được chặn lối vào cửa.', overlap: 'Chỗ này đã có đồ.', blocked: 'Không xoay được vì vướng đồ khác.', missing: 'Không thấy món này.' };

/** opts: { toast(text, ms) }. Đặt LGT.furni = { openShop, openBag, close, get placed (đã toFurniture), get state }. */
export function initFurni(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let st = loadFurni(null); try { st = loadFurni(localStorage.getItem(KEY)); } catch (_) { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* chế độ riêng tư */ } };
  let tab = 'shop';
  const lv = () => { const L = LGT.land && LGT.land.state; return L && L.own ? houseLevel(L.own.lv).lv : 0; };
  const leaves = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);

  const box = el('section', 'fn-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Nội thất');
  const head = el('header'), h = el('h3', null, 'Nội thất'), x = el('button', 'fn-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(h, x);
  const tabs = el('div', 'fn-tabs'), tShop = el('button', 'fn-tab', 'Cửa hàng'), tBag = el('button', 'fn-tab', 'Túi đồ'); tShop.type = tBag.type = 'button'; tabs.append(tShop, tBag);
  const info = el('p', 'fn-info'), list = el('div', 'fn-list'); box.append(head, tabs, info, list); hud.appendChild(box);

  function changed() { save(); draw(); if (LGT.houseRemount) LGT.houseRemount(); }
  const apply = (r) => { if (!r.ok) { toast(WHY[r.reason] || 'Không làm được.', 2800); return false; } st = r.st; changed(); return true; };
  function buy(id) {
    const f = furnitureById(id), l = LGT.merit && LGT.merit.leaf; if (!f || !l) return;
    const r = buyItem(l, st, id); if (!r.ok) { toast(WHY[r.reason] || 'Không mua được.', 2800); return; }
    if (!LGT.merit.spendLa(f.gia)) { toast(WHY.poor, 2800); return; }
    st = r.st; changed(); toast(`Đã mua ${f.ten} (trừ ${f.gia} lá). Mở Túi đồ để đặt.`, 3200);
  }
  const btn = (label, fn, cls = 'fn-b', aria) => { const b = el('button', cls, label); b.type = 'button'; if (aria) b.setAttribute('aria-label', aria); b.addEventListener('click', fn); return b; };

  function drawShop() {
    info.textContent = `Bạn có ${leaves()} lá bồ đề. Mua xong mở Túi đồ để đặt vào nhà.`;
    for (const f of FURNITURE) {
      const row = el('div', 'fn-row'), t = el('div', 'fn-t'); t.append(el('b', null, f.ten), el('span', null, ` ${f.w}×${f.d} m · còn trong túi ${freeCount(st, f.id)}`));
      const b = btn(`Mua ${f.gia} lá`, () => buy(f.id), 'fn-b buy'); b.disabled = leaves() < f.gia; row.append(t, b); list.appendChild(row);
    }
  }
  function drawBag() {
    const L = lv(), max = MAX_PLACED[L];
    info.textContent = `Đã đặt ${st.placed.length}/${max} món trong nhà.`;
    const free = FURNITURE.filter((f) => freeCount(st, f.id) > 0);
    list.appendChild(el('h4', null, 'Chưa đặt'));
    if (!free.length) list.appendChild(el('p', 'fn-hint', 'Túi trống. Mua đồ ở tab Cửa hàng.'));
    for (const f of free) { const row = el('div', 'fn-row'), t = el('div', 'fn-t'); t.append(el('b', null, f.ten), el('span', null, ` × ${freeCount(st, f.id)}`)); row.append(t, btn('Đặt', () => apply(autoPlace(st, L, f.id)), 'fn-b buy')); list.appendChild(row); }
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
    const keep = list.scrollTop; list.textContent = ''; if (tab === 'shop') drawShop(); else drawBag(); list.scrollTop = keep;
  }
  function open(which) {
    if (!LGT.inHouse) { toast('Hãy vào nhà của bạn rồi mở Cửa hàng / Túi đồ để sửa nhà.', 3500); return; }
    tab = which; draw(); box.hidden = false; (box.querySelector('.fn-b:not(:disabled)') || x).focus({ preventScroll: true });
  }
  const close = () => { box.hidden = true; };
  tShop.addEventListener('click', () => { tab = 'shop'; draw(); }); tBag.addEventListener('click', () => { tab = 'bag'; draw(); });
  x.addEventListener('click', close);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });

  LGT.furni = { openShop: () => open('shop'), openBag: () => open('bag'), close, get placed() { return st.placed.map(toFurniture).filter(Boolean); }, get state() { return st; } };
  return LGT.furni;
}
