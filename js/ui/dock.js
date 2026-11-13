// Cụm nút thao tác góc PHẢI-DƯỚI (Phiên 62, bố cục lại ở Phiên 109): nhảy, kỹ năng chiến đấu, thả cầu, bấm!, thu cá, phóng sinh, khiêng/ném, túi đồ — cho người chơi điện thoại chỉ cần dùng ngón cái.
// Logic ở js/world/dock.js (có test): dockButtons (nút nào hiện) + dockLayout (mỗi nút MỘT Ô CỐ ĐỊNH trong lưới 3×3) + cooldownFrac (vòng hồi chiêu).
// Phiên 109: nút KHÔNG dời chỗ khi hoàn cảnh đổi; hồi chiêu hiện thành vòng quay trên nút; lời chỉ chỗ + dòng trạng thái gộp thành MỘT bong bóng phía trên cụm; máy tính có phím 1–5 (xem SLOT_KEY).
// Mục 1: nhãn nút cưỡi (id 'vantruot', ô T1) lấy từ LGT.board.status().label theo đồ đang cầm: Cưỡi thương / Cưỡi gậy / Lướt ván (và Xuống ...).
// Mọi chữ qua textContent. Nút Nhảy/Ném đá/kỹ năng chiến đấu nhận pointerdown (nhanh, không trễ); bàn phím vẫn dùng được (click do Enter/Space).
import { dockButtons, dockLayout, cooldownFrac, pickHint, loadSeen, SLOT_CODES } from '../world/dock.js';

const KEY = 'lgt.dockhint';
const ICON = { tap: '🪷', cast: '🎣', thu: '🧺', phong: '🕊️', nhay: '⬆️', kynang: '✦', tui: '🎒', khieng: '💪', nem: '🎯', ha: '⬇️', da: '🪨', thuong: '🔱', nemyq: '🤼', tudong: '🔁', khiengnguoi: '🤲', nemnguoi: '🙌', thanguoi: '⬇️', nemnpc: '🧑‍🌾', thietdau: '☄️', chemkhi: '🌙', lan: '🤿', vantruot: '🛹' };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const isEditable = (t) => !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** hud: phần tử HUD. opts: { toast }. Đặt LGT.dock = { refresh, get ids }. */
export function initDock(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let seen = []; try { seen = loadSeen(localStorage.getItem(KEY)); } catch (_) { /* riêng tư */ }
  const saveSeen = () => { try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (_) { /* bỏ qua */ } };
  const root = el('div', 'dk'); root.id = 'dock'; root.setAttribute('role', 'group'); root.setAttribute('aria-label', 'Nút thao tác'); root.hidden = true; hud.appendChild(root);
  const tips = el('div', 'dk-tips'), hintEl = el('p', 'dk-hint'), sayEl = el('p', 'dk-say'), grid = el('div', 'dk-grid');
  hintEl.hidden = sayEl.hidden = true; hintEl.setAttribute('role', 'status'); tips.append(hintEl, sayEl); root.append(tips, grid);
  if (matchMedia('(pointer: fine)').matches && !matchMedia('(pointer: coarse)').matches) root.classList.add('kb');   // chỉ máy có chuột mới hiện nhãn phím
  document.body.classList.add('has-dock');   // ẩn nút Nhảy / chip Khinh thân cũ (đã nằm trong cụm này)
  const items = new Map();   // id → { btn, key, slot }
  let sig = '', skipClick = false, layout = [], rowsSig = '', lastCtx = {};

  const ACT = {
    tap: () => LGT.fishing && LGT.fishing.tap(), cast: () => LGT.fishing && LGT.fishing.cast(), thu: () => LGT.fishing && LGT.fishing.keep(), phong: () => LGT.fishing && LGT.fishing.release(),
    khieng: () => LGT.carry && LGT.carry.pickup(), nem: () => LGT.carry && LGT.carry.throw(), ha: () => LGT.carry && LGT.carry.drop(),
    tudong: () => LGT.farm && LGT.farm.toggleAuto(),
    da: () => LGT.yq && LGT.yq.stone(), chemkhi: () => LGT.conKhi && LGT.conKhi.cast(), thuong: () => LGT.yq && LGT.yq.spear(), nemyq: () => LGT.yq && LGT.yq.throwBoss(), khiengnguoi: () => LGT.throwP && LGT.throwP.grab(), nemnguoi: () => LGT.throwP && LGT.throwP.throw(), thanguoi: () => LGT.throwP && LGT.throwP.drop(), nemnpc: () => LGT.npcThrow && LGT.npcThrow.throw(), thietdau: () => LGT.thietDau && LGT.thietDau.dash(),
    nhay: () => (LGT.skill && LGT.skill.level > 0 ? LGT.skill.jump() : toast('Khinh thân chưa mở. Gặp Thầy trụ trì và làm nhiệm vụ tưới cây bồ đề để mở bậc 1, rồi bạn sẽ nhảy được.', 5200)), kynang: () => LGT.skill && LGT.skill.open(),
    lan: () => LGT.swim && LGT.swim.toggleDive(), vantruot: () => LGT.board && LGT.board.toggle(),
    tui: () => (LGT.inHouse && LGT.furni ? LGT.furni.openBag() : LGT.bag ? LGT.bag.open() : toast('Túi đồ chưa sẵn sàng.', 2500)),
  };
  const FAST = new Set(['tap', 'nhay', 'da', 'thuong', 'chemkhi', 'thietdau', 'khiengnguoi', 'nemnguoi']);   // phản xạ nhanh: bấm xuống là chạy (khiêng/ném người chỉ có cửa sổ 2 giây; Thương/Chém khí cũng cần nhạy khi đánh liên tục)
  function press(id) {
    if (!seen.includes(id)) { seen.push(id); saveSeen(); }   // bấm rồi thì không nhắc chỗ này nữa
    try { const f = ACT[id]; if (f) f(); } catch (_) { /* nút không làm sập game */ }
    refresh();
  }
  function make(b) {
    const btn = el('button', 'dk-b'); btn.type = 'button'; btn.dataset.id = b.id;
    btn.append(el('span', 'dk-ic', ICON[b.id] || '•'), el('span', 'dk-tx', b.label), el('span', 'dk-key'));
    if (FAST.has(b.id)) btn.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); skipClick = true; press(b.id); });
    btn.addEventListener('click', () => { if (skipClick) { skipClick = false; return; } press(b.id); });
    return { btn };
  }
  const place = (it, L) => {   // đặt nút vào ô của nó: hàng 1 ở DƯỚI nên đảo thứ tự hàng của lưới
    it.slot = L.slot; it.btn.dataset.slot = L.slot; it.btn.style.gridColumn = String(L.c); it.btn.style.gridRow = String(layout.maxR - L.r + 1);
    it.btn.classList.remove('sz-big', 'sz-mid', 'sz-small'); it.btn.classList.add('sz-' + L.size);
    const k = it.btn.querySelector('.dk-key'); if (k.textContent !== L.key) k.textContent = L.key; k.hidden = !L.key;
  };

  function refresh() {
    const W = LGT.world, fs = LGT.fishing ? LGT.fishing.status() : { phase: 'idle' };
    const cs = LGT.carry ? LGT.carry.status() : null;
    const ys = LGT.yq ? LGT.yq.status() : null;
    const fms = LGT.farm ? LGT.farm.status() : null;   // Phiên 107: quái bãi rừng
    const ps = LGT.throwP ? LGT.throwP.status() : null;
    const nps = LGT.npcThrow ? LGT.npcThrow.status() : null;
    const hds = LGT.thietDau ? LGT.thietDau.status() : null;
    const khs = LGT.conKhi ? LGT.conKhi.status() : null;
    const sws = LGT.swim ? LGT.swim.status() : null;
    const bds = LGT.board ? LGT.board.status() : null;
    const c = { swim: sws, board: bds, inHouse: !!LGT.inHouse, ply: ps ? { near: ps.near, holding: ps.holding, heldName: ps.heldName, left: ps.left } : null, npc: nps ? { near: nps.near } : null, head: hds, khi: khs ? { cd: khs.cd } : null, yq: ys ? { active: ys.active, ten: ys.ten, canThrow: ys.canThrow, stoneCd: ys.stoneCd, spearCd: ys.spearCd } : null, carry: cs ? { holding: cs.holding, heldName: cs.heldName, near: cs.near } : null, free: !!W && W.mode === 'free' && !LGT.panelOpen && !LGT.heldBy && !document.querySelector('.st-dlg:not([hidden])'), farm: fms ? { active: fms.active, ten: fms.ten, stoneCd: fms.stoneCd, spearCd: fms.spearCd, canAuto: fms.canAuto, auto: fms.auto, autoLeft: fms.autoLeft } : null, khinh: LGT.skill ? LGT.skill.level : 0, canTrain: !!(LGT.skill && LGT.skill.canTrain), water: !!fs.water && !LGT.inHouse, fish: fs };
    lastCtx = c;
    const list = dockButtons(c); for (const b of list) if (b.id === 'vantruot' && bds && bds.label) b.label = bds.label;   // Mục 1: nhãn nút cưỡi theo đồ đang cầm (Cưỡi thương / Cưỡi gậy / Lướt ván)
    const next = list.map((b) => b.id).join(',');
    root.hidden = !list.length;
    if (next !== sig) {   // bộ nút đổi → tính lại ô, dựng nút còn thiếu, bỏ nút thừa (nút còn lại GIỮ NGUYÊN ô của nó)
      sig = next; layout = dockLayout(list); layout.maxR = Math.max(3, ...layout.map((l) => l.r));
      for (const [id, it] of items) if (!list.some((b) => b.id === id)) { it.btn.remove(); items.delete(id); }
      for (const b of list) if (!items.has(b.id)) items.set(b.id, make(b));
      const rs = String(layout.maxR);
      if (rs !== rowsSig) { rowsSig = rs; const rows = []; for (let r = layout.maxR; r >= 1; r--) rows.push(r === 1 ? 'var(--dk-a)' : r === 2 ? 'var(--dk-m)' : r === 3 ? 'var(--dk-s)' : 'var(--dk-m)'); grid.style.gridTemplateRows = rows.join(' '); }
      for (const L of layout) { const it = items.get(L.id); place(it, L); if (it.btn.parentNode !== grid) grid.appendChild(it.btn); }
    }
    const hint = pickHint(list, seen), byId = new Map(list.map((b) => [b.id, b]));
    for (const L of layout) {
      const b = byId.get(L.id), it = items.get(L.id); if (!b || !it) continue;
      it.btn.classList.toggle('hot', !!b.hot); it.btn.classList.toggle('lock', !!b.locked); it.btn.classList.toggle('wait', !!b.wait);
      const cd = cooldownFrac(L.id, c); it.btn.style.setProperty('--cd', cd.toFixed(3)); it.btn.classList.toggle('on-cd', cd > 0);
      const tx = it.btn.querySelector('.dk-tx'); if (tx.textContent !== b.label) tx.textContent = b.label;
      it.btn.classList.toggle('ping', !!hint && hint.id === b.id);
      it.btn.setAttribute('aria-label', b.label + (cd > 0 ? ' (đang hồi chiêu)' : ''));
    }
    // MỘT dòng trạng thái: ưu tiên nút hành động chính (ô A), rồi tới nút khác có lời nhắn
    const speaker = layout.map((L) => byId.get(L.id)).filter((b) => b && b.say).sort((x, y) => (layout.find((l) => l.id === x.id).slot === 'A' ? 0 : 1) - (layout.find((l) => l.id === y.id).slot === 'A' ? 0 : 1))[0];
    const say = speaker ? speaker.say : ''; sayEl.hidden = !say; if (say && sayEl.textContent !== say) sayEl.textContent = say;
    const ht = hint ? hint.text : ''; hintEl.hidden = !ht; if (ht && hintEl.textContent !== ht) hintEl.textContent = ht;
  }

  // Phím tắt trên máy tính: 1–5 và B theo SLOT_CODES; Space (Nhảy) do js/ui/skill.js lo.
  addEventListener('keydown', (e) => {
    if (e.repeat || isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey || root.hidden || LGT.panelOpen) return;
    if (document.querySelector('.st-dlg:not([hidden])') || document.body.classList.contains('edit-mode')) return;
    const slot = Object.keys(SLOT_CODES).find((s) => SLOT_CODES[s].includes(e.code)); if (!slot) return;
    const L = layout.find((l) => l.slot === slot); if (!L || !items.has(L.id)) return;
    e.preventDefault(); press(L.id);
  });

  // Tự co nhỏ để KHÔNG đè lên cột menu dọc bên phải (điện thoại): vừa chỗ thì giữ cỡ thường, không thì dùng cỡ nhỏ
  function fit() {
    root.classList.remove('small'); if (root.hidden) return;
    const bar = hud.querySelector('.hm-bar'); if (!bar) return; const br = bar.getBoundingClientRect();
    if (!br.width || br.width > 90 || br.right < innerWidth * 0.6) return;   // chỉ khi menu là cột dọc sát mép phải
    const room = grid.getBoundingClientRect().bottom - br.bottom - 8;
    if (grid.getBoundingClientRect().height > room) root.classList.add('small');
  }
  let fitSig = ''; const fitNow = () => { const s = sig + '|' + innerWidth + 'x' + innerHeight; if (s !== fitSig) { fitSig = s; fit(); } };
  setInterval(() => { refresh(); fitNow(); }, 120); refresh();
  addEventListener('resize', () => { fitSig = ''; fitNow(); });
  LGT.dock = { refresh, get ids() { return sig; }, get layout() { return layout.map((l) => ({ id: l.id, slot: l.slot })); } };
  return LGT.dock;
}
