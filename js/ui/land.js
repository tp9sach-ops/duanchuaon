// Đất ở và xóm (Phiên 36, bước 2; Phiên 37 bước 3c thêm nâng cấp nhà): bảng của Bác Tư khu phố — xem các lô, mua đất bằng 100 lá bồ đề, nhận nhà trống thô sơ, nâng cấp nhà, đổi xóm xem.
// Logic ở js/world/land.js (có test). Lưu `localStorage['lgt.land']`. Chưa có máy chủ nên sổ xóm chỉ có nhà của chính người chơi (xem docs/PHIEN36.md).
// Mọi chữ hiển thị đi qua textContent, không chèn HTML.
import { loadLand, localRegistry, buyLand, upgradeHouse, upgradeCost, houseLevel, HOUSE_LEVELS, MAX_LV, viewableXoms, setView, plotById, houseRect, poolRect, PLOTS, XOM_SIZE, countXom } from '../world/land.js';
import { LAND_LA } from '../world/merit.js';
import { RECTS, addRect } from '../world/layout.js';

const KEY = 'lgt.land';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** opts: { toast(text, ms) }. Đặt LGT.land = { open, close, get state }. */
export function initLand(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let land = loadLand(null); try { land = loadLand(localStorage.getItem(KEY)); } catch (_) { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(land)); } catch (_) { /* chế độ riêng tư */ } };
  let pick = 0, colliders = [];

  const box = el('section', 'ld-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Đất ở và xóm');
  const head = el('header'), h = el('h3', null, 'Bác Tư khu phố'), x = el('button', 'ld-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(h, x);
  const status = el('p', 'ld-status'), view = el('div', 'ld-view'), grid = el('div', 'ld-grid'), act = el('div', 'ld-act'), note = el('p', 'ld-note');
  const prev = el('button', 'ld-b', '◀'), next = el('button', 'ld-b', '▶'), viewT = el('span', 'ld-vt'); prev.type = next.type = 'button';
  prev.setAttribute('aria-label', 'Xóm trước'); next.setAttribute('aria-label', 'Xóm sau'); view.append(prev, viewT, next);
  box.append(head, status, view, grid, act, note); hud.appendChild(box);
  note.textContent = `Mỗi xóm tối đa ${XOM_SIZE} nhà; nhà thứ ${XOM_SIZE + 1} sẽ sang xóm mới. ${LAND_LA} lá bồ đề mua một lô và được tặng nhà trống thô sơ; sau đó nâng lên nhà lầu, nhà hoa viên, villa hồ bơi (trả chênh lệch giá). Hiện bạn chỉ thấy nhà của mình; hàng xóm thật cần máy chủ (đang làm). Giá trị tạm của bản thử.`;

  const reg = () => localRegistry(land);
  const leaves = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);

  function placeHouse() {   // vật cản + hình dựng theo xóm đang xem
    for (const c of colliders) { const i = RECTS.indexOf(c); if (i >= 0) RECTS.splice(i, 1); }
    colliders = [];
    if (land.own && land.view === land.own.xom) {   // thân nhà + hồ bơi (villa) đều chặn đi bộ
      const pl = plotById(land.own.plot);
      for (const r of [houseRect(pl, land.own.lv), poolRect(pl, land.own.lv)]) if (r) { const c = { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }; colliders.push(c); addRect(c); }
    }
    if (LGT.landScene) LGT.landScene.refresh(reg(), land.view || 1, land.own);
  }
  function draw() {
    const r = reg(), v = land.view || 1, xs = viewableXoms(land, r);
    status.textContent = land.own
      ? `Nhà của bạn: Xóm ${land.own.xom}, Lô ${land.own.plot} (${houseLevel(land.own.lv).ten}). Bạn có ${leaves()} lá bồ đề.`
      : `Bạn chưa có đất. Một lô giá ${LAND_LA} lá bồ đề, bạn có ${leaves()} lá.`;
    viewT.textContent = `Đang xem: Xóm ${v} (${countXom(r, v)}/${XOM_SIZE} nhà)`;
    prev.disabled = !xs.includes(v - 1); next.disabled = !xs.includes(v + 1);
    grid.textContent = '';
    for (const p of PLOTS) {
      const rec = r[v] && r[v][p.id], mine = !!(land.own && land.own.xom === v && land.own.plot === p.id);
      const b = el('button', 'ld-lot' + (mine ? ' mine' : rec ? ' taken' : '') + (pick === p.id ? ' pick' : ''), String(p.id)); b.type = 'button';
      b.setAttribute('aria-label', `Lô ${p.id}: ${mine ? 'nhà của bạn' : rec ? 'đã có chủ' : 'đất trống'}`);
      b.disabled = !!rec || mine || !!land.own;
      b.addEventListener('click', () => { pick = p.id; draw(); });
      grid.appendChild(b);
    }
    act.textContent = '';
    if (land.own) {
      const go = el('button', 'ld-b', 'Dẫn tôi tới nhà'); go.type = 'button';
      go.addEventListener('click', () => { const pl = plotById(land.own.plot); if (LGT.world && pl) { LGT.world.walkTo(pl.front.x, pl.front.z); close(); } });
      act.appendChild(go);
      const cur = houseLevel(land.own.lv).lv;
      for (const L of HOUSE_LEVELS.filter((q) => q.lv > cur)) {   // mỗi cấp cao hơn một nút; được nhảy cấp, trả chênh lệch giá niêm yết
        const cost = upgradeCost(cur, L.lv), ok = leaves() >= cost;
        const ub = el('button', 'ld-b buy', ok ? `Nâng lên ${L.ten} (${cost} lá)` : `${L.ten}: cần ${cost} lá`); ub.type = 'button'; ub.disabled = !ok;
        ub.addEventListener('click', () => upgrade(L.lv)); act.appendChild(ub);
      }
      if (cur >= MAX_LV) act.appendChild(el('span', 'ld-hint', 'Nhà của bạn đã ở cấp cao nhất.'));
    } else if (pick && !(r[v] && r[v][pick]) && v === Math.max(1, v)) {
      const ok = leaves() >= LAND_LA, b = el('button', 'ld-b buy', ok ? `Mua lô ${pick} (${LAND_LA} lá)` : `Chưa đủ lá (cần ${LAND_LA})`); b.type = 'button'; b.disabled = !ok;
      b.addEventListener('click', buy); act.appendChild(b);
    } else if (!land.own) act.appendChild(el('span', 'ld-hint', 'Chọn một lô trống ở xóm đang xem.'));
  }
  function buy() {
    const r = buyLand(land, leaves(), reg(), pick);
    if (!r.ok) { toast(r.reason === 'poor' ? `Chưa đủ lá bồ đề (cần ${LAND_LA}).` : r.reason === 'owned' ? 'Bạn đã có đất rồi.' : 'Lô này không mua được.', 3000); return; }
    if (!(LGT.merit && LGT.merit.spendLa(r.cost))) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    land = r.land; save(); placeHouse(); draw();
    toast(`Chúc mừng! Bạn đã có đất ở Xóm ${r.xom}, Lô ${pick}. Nhà trống thô sơ được tặng.`, 6000);
    if (LGT.act) LGT.act('muadat');   // nhiệm vụ “Có mảnh đất đầu tiên” (Phiên 39)
  }
  function upgrade(to) {   // Phiên 37 3c: trừ lá RỒI mới đổi cấp (thiếu lá thì không đổi gì)
    const r = upgradeHouse(land, leaves(), reg(), to);
    if (!r.ok) { toast(r.reason === 'poor' ? `Chưa đủ lá bồ đề (cần ${r.cost}).` : r.reason === 'maxed' ? 'Nhà đã ở cấp cao nhất.' : 'Không nâng cấp được.', 3000); return; }
    if (!(LGT.merit && LGT.merit.spendLa(r.cost))) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    land = r.land; save(); placeHouse(); draw();
    toast(`Nhà của bạn đã lên ${houseLevel(to).ten}! (−${r.cost} lá bồ đề)`, 6000);
    if (LGT.act) LGT.act('nangnha');   // nhiệm vụ “Nâng cấp nhà lần đầu” (Phiên 39)
  }
  prev.addEventListener('click', () => { const s = setView(land, (land.view || 1) - 1, reg()); if (s.ok) { land = s.land; save(); placeHouse(); draw(); } });
  next.addEventListener('click', () => { const s = setView(land, (land.view || 1) + 1, reg()); if (s.ok) { land = s.land; save(); placeHouse(); draw(); } });
  const open = () => { draw(); box.hidden = false; x.focus({ preventScroll: true }); };
  const close = () => { box.hidden = true; };
  x.addEventListener('click', close);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });

  // cảnh 3D dựng sau giao diện: chờ có LGT.landScene rồi vẽ nhà/bảng và vật cản một lần
  let synced = false;
  const t = setInterval(() => { if (LGT.landScene) { clearInterval(t); synced = true; placeHouse(); } }, 600);
  placeHouse();
  LGT.land = { open, close, get state() { return land; }, get synced() { return synced; } };
  return LGT.land;
}
