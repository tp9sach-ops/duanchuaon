// Cụm nút thao tác góc PHẢI-DƯỚI (Phiên 62): nhảy, kỹ năng, thả cầu, bấm!, thu cá, phóng sinh, túi đồ — cho người chơi điện thoại chỉ cần dùng ngón cái.
// Logic ở js/world/dock.js (có test). Mọi chữ qua textContent. Nút Nhảy/Bấm! nhận pointerdown (nhanh, không trễ); bàn phím vẫn dùng được (click do Enter/Space).
import { dockButtons, pickHint, loadSeen } from '../world/dock.js';
import { SKILL_THEME, cdFrac } from '../world/yqFx.js';
import { STONE, SPEAR } from '../world/yeuquai.js';
import { COOLDOWN_S } from '../world/conKhi.js';

const KEY = 'lgt.dockhint';
const ICON = { tap: '🪷', cast: '🎣', thu: '🧺', phong: '🕊️', nhay: '⬆️', kynang: '✦', tui: '🎒', khieng: '💪', nem: '🎯', ha: '⬇️', da: '🪨', thuong: '🔱', nemyq: '🤼', khiengnguoi: '🤲', nemnguoi: '🙌', thanguoi: '⬇️', nemnpc: '🧑‍🌾', thietdau: '☄️', chemkhi: '🌙', lan: '🤿', vantruot: '🛹' };
// Phiên 100: biểu tượng vẽ tay (SVG tĩnh, màu theo từng chiêu qua biến --c1/--c2) cho các nút chiến đấu; nút khác vẫn dùng ICON ở trên.
const SVG = {
  da: '<svg viewBox="0 0 32 32"><path class="s1" d="M2 11h5M1 16h6M3 21h4" stroke-width="2"/><polygon class="f1" stroke="#000" stroke-opacity=".35" points="9,21 12,11 19,7 26,11 29,19 23,26 13,25"/><polyline class="s2" points="12,11 19,16 26,11" stroke-width="1.4"/><polyline class="s2" points="19,16 17,25" stroke-width="1.4"/></svg>',
  thuong: '<svg viewBox="0 0 32 32"><line class="s1" x1="5" y1="27" x2="22" y2="10" stroke-width="2.6"/><polygon class="f1" points="19,7 30,2 25,13"/><circle class="f2" cx="11" cy="21" r="2.6"/><path class="s1" d="M6 21l-3 4M10 26l-4 2" stroke-width="1.6"/></svg>',
  chemkhi: '<svg viewBox="0 0 32 32"><path class="f1" d="M3 26Q15 1 30 8Q16 10 3 26z"/><path class="f1" fill-opacity=".55" d="M8 29Q19 13 31 16Q19 18 8 29z"/><polygon fill="#fff" points="26,1 27.4,5 31,6 27.4,7 26,11 24.6,7 21,6 24.6,5"/></svg>',
  thietdau: '<svg viewBox="0 0 32 32"><path class="f1" d="M7 21a9 9 0 0 1 18 0v3H7z"/><rect class="f2" x="11" y="17" width="10" height="3" rx="1.5"/><path class="s1" d="M1 14h4M0 19h5M2 24h3" stroke-width="2"/><polygon fill="#fff" points="26,5 27,8 30,9 27,10 26,13 25,10 22,9 25,8"/></svg>',
  nemyq: '<svg viewBox="0 0 32 32"><path class="s1" d="M4 27Q13 -2 28 20" stroke-width="2.2" stroke-dasharray="1 4.4"/><circle class="f1" cx="26" cy="22" r="4.2"/><path class="s1" d="M20 10l5 2-1 5" stroke-width="2.2"/></svg>',
  nhay: '<svg viewBox="0 0 32 32"><polyline class="s1" points="7,17 16,8 25,17" stroke-width="3.2"/><polyline class="s1" points="7,26 16,17 25,26" stroke-width="3.2" opacity=".55"/></svg>',
};
SVG.nem = SVG.nemyq;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD. opts: { toast }. Đặt LGT.dock = { refresh, get ids }. */
export function initDock(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let seen = []; try { seen = loadSeen(localStorage.getItem(KEY)); } catch (_) { /* riêng tư */ }
  const saveSeen = () => { try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (_) { /* bỏ qua */ } };
  const root = el('div', 'dk'); root.id = 'dock'; root.setAttribute('role', 'group'); root.setAttribute('aria-label', 'Nút thao tác'); root.hidden = true; hud.appendChild(root);
  document.body.classList.add('has-dock');   // ẩn nút Nhảy / chip Khinh thân cũ (đã nằm trong cụm này)
  const items = new Map();   // id → { wrap, b, say, hint }
  let sig = '', skipClick = false;

  const ACT = {
    tap: () => LGT.fishing && LGT.fishing.tap(), cast: () => LGT.fishing && LGT.fishing.cast(), thu: () => LGT.fishing && LGT.fishing.keep(), phong: () => LGT.fishing && LGT.fishing.release(),
    khieng: () => LGT.carry && LGT.carry.pickup(), nem: () => LGT.carry && LGT.carry.throw(), ha: () => LGT.carry && LGT.carry.drop(),
    da: () => LGT.yq && LGT.yq.stone(), chemkhi: () => LGT.conKhi && LGT.conKhi.cast(), thuong: () => LGT.yq && LGT.yq.spear(), nemyq: () => LGT.yq && LGT.yq.throwBoss(), khiengnguoi: () => LGT.throwP && LGT.throwP.grab(), nemnguoi: () => LGT.throwP && LGT.throwP.throw(), thanguoi: () => LGT.throwP && LGT.throwP.drop(), nemnpc: () => LGT.npcThrow && LGT.npcThrow.throw(), thietdau: () => LGT.thietDau && LGT.thietDau.dash(),
    nhay: () => (LGT.skill && LGT.skill.level > 0 ? LGT.skill.jump() : toast('Khinh thân chưa mở. Gặp Thầy trụ trì và làm nhiệm vụ tưới cây bồ đề để mở bậc 1, rồi bạn sẽ nhảy được.', 5200)), kynang: () => LGT.skill && LGT.skill.open(),
    lan: () => LGT.swim && LGT.swim.toggleDive(), vantruot: () => LGT.board && LGT.board.toggle(),
    tui: () => (LGT.inHouse && LGT.furni ? LGT.furni.openBag() : LGT.bag ? LGT.bag.open() : toast('Túi đồ chưa sẵn sàng.', 2500)),
  };
  const CD_IDS = new Set(['da', 'thuong', 'chemkhi']);   // nút có vòng hồi chiêu
  const FAST = new Set(['tap', 'nhay', 'da', 'chemkhi', 'thuong', 'thietdau', 'khiengnguoi', 'nemnguoi']);   // Phiên 91: khiêng/ném người chỉ có cửa sổ 2 giây → bấm xuống là chạy   // phản xạ nhanh: bấm xuống là chạy
  function press(id) {
    if (!seen.includes(id)) { seen.push(id); saveSeen(); }   // bấm rồi thì không nhắc chỗ này nữa
    try { const f = ACT[id]; if (f) f(); } catch (_) { /* nút không làm sập game */ }
    refresh();
  }
  function make(b) {
    const wrap = el('div', 'dk-item'), btn = el('button', 'dk-b'); btn.type = 'button'; btn.dataset.id = b.id;
    const ic = el('span', 'dk-ic', SVG[b.id] ? null : (ICON[b.id] || '•')); if (SVG[b.id]) { try { const d = new DOMParser().parseFromString(SVG[b.id].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), 'image/svg+xml').documentElement; ic.appendChild(document.importNode(d, true)); } catch (_) { ic.textContent = ICON[b.id] || '•'; } }   // SVG tĩnh trong mã (không có chữ người dùng), nạp bằng DOMParser
    const th = SKILL_THEME[b.id]; if (th) btn.classList.add(th.cls);
    btn.append(ic, el('span', 'dk-tx', b.label)); if (CD_IDS.has(b.id)) btn.append(el('span', 'dk-cd'), el('span', 'dk-sec'));
    const say = el('p', 'dk-say'), hint = el('p', 'dk-hint'); say.hidden = hint.hidden = true; hint.setAttribute('role', 'status');
    if (FAST.has(b.id)) btn.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); skipClick = true; press(b.id); });
    btn.addEventListener('click', () => { if (skipClick) { skipClick = false; return; } press(b.id); });
    wrap.append(say, btn, hint); return { wrap, btn, say, hint };
  }
  function refresh() {
    const W = LGT.world, fs = LGT.fishing ? LGT.fishing.status() : { phase: 'idle' };
    const cs = LGT.carry ? LGT.carry.status() : null;
    const ys = LGT.yq ? LGT.yq.status() : null;
    const ps = LGT.throwP ? LGT.throwP.status() : null;
    const nps = LGT.npcThrow ? LGT.npcThrow.status() : null;
    const hds = LGT.thietDau ? LGT.thietDau.status() : null;
    const khs = LGT.conKhi ? LGT.conKhi.status() : null;
    const sws = LGT.swim ? LGT.swim.status() : null;
    const bds = LGT.board ? LGT.board.status() : null;
    const c = { swim: sws, board: bds, inHouse: !!LGT.inHouse, ply: ps ? { near: ps.near, holding: ps.holding, heldName: ps.heldName, left: ps.left } : null, npc: nps ? { near: nps.near } : null, head: hds, khi: khs ? { cd: khs.cd } : null, yq: ys ? { active: ys.active, ten: ys.ten, canThrow: ys.canThrow, stoneCd: ys.stoneCd, spearCd: ys.spearCd } : null, carry: cs ? { holding: cs.holding, heldName: cs.heldName, near: cs.near } : null, free: !!W && W.mode === 'free' && !LGT.panelOpen && !LGT.heldBy && !document.querySelector('.st-dlg:not([hidden])'), khinh: LGT.skill ? LGT.skill.level : 0, canTrain: !!(LGT.skill && LGT.skill.canTrain), water: !!fs.water && !LGT.inHouse, fish: fs };
    const list = dockButtons(c), next = list.map((b) => b.id).join(',');
    root.hidden = !list.length;
    if (next !== sig) {   // bộ nút đổi → dựng lại các nút còn thiếu / bỏ nút thừa
      sig = next; for (const [id, it] of items) if (!list.some((b) => b.id === id)) { it.wrap.remove(); items.delete(id); }
      for (const b of list) if (!items.has(b.id)) items.set(b.id, make(b));
      for (const b of list) root.appendChild(items.get(b.id).wrap);   // đúng thứ tự (column-reverse: nút đầu ở dưới cùng)
    }
    const cdMap = { da: ys ? [ys.stoneCd, STONE.cd] : null, thuong: ys ? [ys.spearCd, SPEAR.cd] : null, chemkhi: khs ? [khs.cd, COOLDOWN_S] : null };
    const hint = pickHint(list, seen);
    for (const b of list) {
      const it = items.get(b.id); it.btn.classList.toggle('big', !!b.big); it.btn.classList.toggle('hot', !!b.hot); it.btn.classList.toggle('lock', !!b.locked); it.btn.classList.toggle('wait', !!b.wait);
      const cdv = cdMap[b.id]; if (cdv) {   // vòng hồi chiêu quét + số giây; hết hồi thì lóe một vòng sáng
        const left = Math.max(0, +cdv[0] || 0), f = cdFrac(left, cdv[1]), cdEl = it.btn.querySelector('.dk-cd'), sec = it.btn.querySelector('.dk-sec');
        if (cdEl) cdEl.style.setProperty('--cd', f.toFixed(3)); if (sec) { const t = left > 0.05 ? String(Math.ceil(left)) : ''; if (sec.textContent !== t) sec.textContent = t; }
        if (it.prev > 0 && f === 0) { it.btn.classList.add('rdy'); setTimeout(() => it.btn.classList.remove('rdy'), 750); } it.prev = f;
      }
      const tx = it.btn.querySelector('.dk-tx'); if (tx.textContent !== b.label) tx.textContent = b.label;
      it.say.hidden = !b.say; if (b.say && it.say.textContent !== b.say) it.say.textContent = b.say;
      const h = hint && hint.id === b.id; it.hint.hidden = !h; it.btn.classList.toggle('ping', !!h); if (h && it.hint.textContent !== hint.text) it.hint.textContent = hint.text;
    }
  }
  // Tự co lại để KHÔNG đè lên cột menu dọc bên phải (điện thoại): thử 1 cột → 2 cột → 2 cột nút nhỏ, lấy cách đầu tiên vừa chỗ
  function fit() {
    root.classList.remove('wrap', 'small'); if (root.hidden) return;
    const bar = hud.querySelector('.hm-bar'); if (!bar) return; const br = bar.getBoundingClientRect();
    if (!br.width || br.width > 90 || br.right < innerWidth * 0.6) return;   // chỉ khi menu là cột dọc sát mép phải
    const rr = root.getBoundingClientRect(), room = rr.bottom - br.bottom - 8;
    for (const cls of [[], ['wrap'], ['wrap', 'small']]) { root.classList.remove('wrap', 'small'); for (const c of cls) root.classList.add(c); if (root.getBoundingClientRect().height <= room) return; }
  }
  let fitSig = ''; const fitNow = () => { const s = sig + '|' + innerWidth + 'x' + innerHeight + '|' + (items.get('da') ? 1 : 0); if (s !== fitSig) { fitSig = s; fit(); } };
  setInterval(() => { refresh(); fitNow(); }, 120); refresh();
  addEventListener('resize', () => { fitSig = ''; fitNow(); });
  LGT.dock = { refresh, get ids() { return sig; } };
  return LGT.dock;
}
