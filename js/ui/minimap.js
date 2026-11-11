// Bản đồ mini (góc trái-trên, dưới nút/đang online) + bản đồ lớn (bấm vào bản đồ nhỏ, nút "Bản đồ chùa" hoặc phím M). Phiên 39.
// Logic ở js/world/minimap.js (có test). Vẽ bằng canvas 2D; mọi chữ qua textContent. Bấm một nơi hoặc một người trên bản đồ lớn → "Dẫn tôi tới" (LGT.world.goTo / walkTo).
import { WORLD_BOX, worldToMap, mapHeight, buildMarkers, terrain, hitTest, describeFrom, shortName, LEGEND, mapAvailable } from '../world/minimap.js';

const KEY = 'lgt.mm';
const COLOR = { place: '#d9b25f', store: '#4aa58a', npc: '#f4efe2', player: '#c792ff', house: '#ff9a52', loc: '#ffe27a', target: '#ff5a4d', me: '#6ee7ff' };
const KIND_TEXT = { place: 'Địa điểm', store: 'Cửa hàng', npc: 'Người trong làng/chùa', player: 'Người chơi đang online', house: 'Nhà của bạn', loc: 'Hoa sen vàng', target: 'Điểm đang dẫn tới' };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD; opts: { toast(text, ms), onList() (mở danh sách điểm đến cũ), onHelp() (mở sổ tay) }. Đặt LGT.minimap = { openBig, closeBig, toggleBig, setGoal }. */
export function initMinimap(hud, { toast = () => {}, onList = null, onHelp = null } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const T = terrain();
  let markers = buildMarkers({}), mkAt = 0, goal = null, sel = null, collapsed = false;
  try { collapsed = localStorage.getItem(KEY) === '0'; } catch (_) { /* bỏ qua */ }

  // ---- bản đồ nhỏ
  const mm = el('div', 'mm'); mm.setAttribute('role', 'group'); mm.setAttribute('aria-label', 'Bản đồ nhỏ');
  const SW = 118, SH = mapHeight(SW);
  const small = el('canvas', 'mm-c'); small.setAttribute('role', 'img'); small.setAttribute('aria-label', 'Bản đồ nhỏ, bấm để mở bản đồ lớn'); small.tabIndex = 0;
  const bar = el('div', 'mm-bar'), bigBtn = el('button', 'mm-b', 'Bản đồ'), tipBtn = el('button', 'mm-b', 'Gợi ý'), fold = el('button', 'mm-b mm-f', collapsed ? '▸' : '▾');
  for (const b of [bigBtn, tipBtn, fold]) b.type = 'button';
  bigBtn.title = 'Mở bản đồ lớn (phím M)'; tipBtn.title = 'Việc nên làm kế tiếp'; fold.setAttribute('aria-label', 'Thu gọn hoặc mở bản đồ nhỏ');
  bar.append(bigBtn, tipBtn, fold); mm.append(small, bar);
  (hud.querySelector('.hud-tl') || hud).appendChild(mm);
  mm.classList.toggle('mm-off', collapsed);

  // ---- bản đồ lớn
  const big = el('section', 'mm-big'); big.hidden = true; big.setAttribute('role', 'dialog'); big.setAttribute('aria-label', 'Bản đồ Diệu Giang Tự');
  const head = el('header'), h3 = el('h3', null, 'Bản đồ Diệu Giang Tự'), x = el('button', 'mm-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng bản đồ'); head.append(h3, x);
  const bigC = el('canvas', 'mm-bc'); bigC.setAttribute('role', 'img'); bigC.setAttribute('aria-label', 'Bản đồ lớn: bấm vào một nơi hoặc một người để chọn');
  const info = el('div', 'mm-info'), iName = el('b'), iKind = el('small'), iDist = el('small'), iGo = el('button', 'mm-go', 'Dẫn tôi tới'); iGo.type = 'button';
  const iTxt = el('div', 'mm-it'); iTxt.append(iName, iKind, iDist); info.append(iTxt, iGo);
  const legend = el('ul', 'mm-lg'); for (const l of LEGEND) { const li = el('li'), d = el('i'); d.style.background = COLOR[l.kind]; li.append(d, document.createTextNode(l.text)); legend.appendChild(li); }
  const foot = el('div', 'mm-ft'), listBtn = el('button', 'mm-b', 'Danh sách điểm đến'), helpBtn = el('button', 'mm-b', 'Hướng dẫn chơi'); listBtn.type = helpBtn.type = 'button';
  if (onList) foot.appendChild(listBtn); if (onHelp) foot.appendChild(helpBtn);
  const NOTE_BASE = 'Phía trên là chánh điện, phía dưới là làng và khu nhà ở. Bấm vào chấm để xem tên và được dẫn tới.';
  const note = el('p', 'mm-note', NOTE_BASE); let online = -1;
  big.append(head, bigC, info, legend, foot, note); hud.appendChild(big);
  info.hidden = true;

  // ---- vẽ
  const dprOf = () => Math.min(2, window.devicePixelRatio || 1);
  function fit(c, w, h) { const d = dprOf(); if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); } c.style.width = w + 'px'; c.style.height = h + 'px'; return d; }
  const pt = (m, w, h) => worldToMap(m, w, h);
  function playerPos() {
    const W = LGT.world;
    if (LGT.inHouse) { const hm = markers.find((m) => m.kind === 'house'); return hm ? { x: hm.stand.x, z: hm.stand.z } : null; }   // trong nhà tọa độ phòng nằm ngoài bản đồ: chấm đặt ở cửa nhà
    return W && W.pos ? W.pos : null;
  }
  function draw(c, w, h, isBig, now) {
    const d = fit(c, w, h), g = c.getContext('2d'); if (!g) return;
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    g.fillStyle = '#0c1018'; g.fillRect(0, 0, w, h);
    const rect = (r, fill) => { const a = pt({ x: r.x0, z: r.z0 }, w, h), b = pt({ x: r.x1, z: r.z1 }, w, h); g.fillStyle = fill; g.fillRect(a.u, a.v, Math.max(1, b.u - a.u), Math.max(1, b.v - a.v)); };
    rect(T.compound, '#1b2230');
    for (const r of T.walks) rect(r, '#4a4330');
    const sx = w / (WORLD_BOX.x1 - WORLD_BOX.x0);
    for (const k of T.waters) { const p = pt(k, w, h); g.beginPath(); g.arc(p.u, p.v, Math.max(2, k.r * sx), 0, 6.283); g.fillStyle = '#1d5a7a'; g.fill(); }
    const me = playerPos();
    const rad = isBig ? 4.2 : 2.6;
    const labels = [];
    for (const m of markers) {   // dưới cùng: nơi/cửa hàng, rồi người, rồi nhà/lộc/đích
      if (m.kind === 'target') continue;
      const p = pt(m, w, h); g.beginPath(); g.arc(p.u, p.v, m.kind === 'npc' ? rad * 0.8 : m.kind === 'player' ? rad * 0.95 : rad, 0, 6.283); g.fillStyle = COLOR[m.kind]; g.fill();
      if (m.kind === 'player') { g.lineWidth = 1.2; g.strokeStyle = '#2a1648'; g.stroke(); }   // viền tối để thấy rõ trên nền sáng
      if (isBig && (m.kind === 'place' || m.kind === 'store' || m.kind === 'house' || m.kind === 'player')) labels.push({ m, p });
    }
    if (isBig) {   // nhãn chữ: nhà của bạn trước, rồi nơi, rồi cửa hàng; nhãn nào đè lên nhãn đã vẽ thì bỏ (xem tên bằng cách bấm vào chấm)
      g.font = '600 9px system-ui,sans-serif'; const order = { house: 0, player: 1, place: 2, store: 3 }, drawn = [];
      labels.sort((a, b) => order[a.m.kind] - order[b.m.kind]);
      for (const { m, p } of labels) {
        const text = m.id === 'xom' ? 'Khu nhà ở' : shortName(m), tw = g.measureText(text).width, right = p.u > w - tw - 14, cx = m.id === 'xom';
        const x0 = cx ? p.u - tw / 2 : right ? p.u - rad - 3 - tw : p.u + rad + 3, y0 = cx ? p.v - rad - 12 : p.v - 5, box = { x0: x0 - 1, x1: x0 + tw + 1, y0, y1: y0 + 10 };
        if (drawn.some((q) => box.x0 < q.x1 && box.x1 > q.x0 && box.y0 < q.y1 && box.y1 > q.y0)) continue;
        drawn.push(box); g.fillStyle = 'rgba(255,255,255,.9)'; g.textAlign = 'left'; g.fillText(text, x0, y0 + 8);
      }
    }
    if (sel && isBig) { const p = pt(sel, w, h); g.beginPath(); g.arc(p.u, p.v, rad + 4, 0, 6.283); g.lineWidth = 1.6; g.strokeStyle = '#fff'; g.stroke(); }
    const tgt = markers.find((m) => m.kind === 'target');
    if (tgt) { const p = pt(tgt, w, h), pu = 1 + 0.25 * Math.sin(now / 260); g.beginPath(); g.arc(p.u, p.v, (rad + 2.5) * pu, 0, 6.283); g.lineWidth = 1.8; g.strokeStyle = COLOR.target; g.stroke(); g.beginPath(); g.arc(p.u, p.v, rad * 0.7, 0, 6.283); g.fillStyle = COLOR.target; g.fill(); }
    if (me) {
      const p = pt(me, w, h), pu = 1 + 0.3 * Math.sin(now / 320);
      g.beginPath(); g.arc(p.u, p.v, (rad + 3) * pu, 0, 6.283); g.fillStyle = 'rgba(110,231,255,.28)'; g.fill();
      g.beginPath(); g.arc(p.u, p.v, rad + 0.6, 0, 6.283); g.fillStyle = COLOR.me; g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#05212b'; g.stroke();
    }
    g.lineWidth = 1; g.strokeStyle = 'rgba(217,178,95,.55)'; g.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  const bigSize = () => { const w = Math.round(Math.max(220, Math.min(340, (window.innerWidth || 360) - 40, ((window.innerHeight || 640) - 250) * (WORLD_BOX.x1 - WORLD_BOX.x0) / (WORLD_BOX.z1 - WORLD_BOX.z0)))); return { w, h: mapHeight(w) }; };
  function refreshMarkers(force) {
    const now = Date.now(); if (!force && now - mkAt < 900) return; mkAt = now;
    const guideT = LGT.guide && LGT.guide.target;
    const target = guideT ? { x: guideT.x, z: guideT.z, label: guideT.label } : goal;
    let players = []; try { players = LGT.room && LGT.room.players ? LGT.room.players() : []; } catch (_) { players = []; }   // người đang online (Phiên 95)
    markers = buildMarkers({ land: LGT.land && LGT.land.state, loc: LGT.loc, target, players });
    const nOn = markers.filter((m) => m.kind === 'player').length; if (nOn !== online) { online = nOn; note.textContent = `${NOTE_BASE} Đang online: ${online + 1} người (kể cả bạn), ${online} người khác hiện trên bản đồ.`; }
    if (sel) sel = markers.find((m) => m.id === sel.id) || null;
  }
  function tick() {
    if (document.hidden || hud.hidden) return;
    const onHub = mapAvailable(LGT.zones);                      // zone khác chưa có bản đồ: ẩn, đóng bản đồ lớn
    mm.style.display = onHub ? '' : 'none';
    if (!onHub) { if (!big.hidden) closeBig(); return; }
    refreshMarkers(false);
    const me = playerPos();
    if (goal && me && Math.hypot(me.x - goal.x, me.z - goal.z) < 3) { goal = null; refreshMarkers(true); }   // tới nơi thì bỏ dấu đích
    if (!collapsed) draw(small, SW, SH, false, Date.now());
    if (!big.hidden) { const s = bigSize(); draw(bigC, s.w, s.h, true, Date.now()); if (sel && me) iDist.textContent = describeFrom(me, sel); }
    nudgeZoom();
  }
  /** Nút +/− nằm ở 46% chiều cao; nếu bản đồ nhỏ che tới thì đẩy xuống dưới bản đồ. */
  function nudgeZoom() {
    const z = hud.querySelector('.hud-zoom'); if (!z) return;
    const r = mm.getBoundingClientRect(), want = Math.round(r.bottom + 12), base = Math.round((window.innerHeight || 700) * 0.46);
    z.style.top = (r.height > 0 && want > base ? want : base) + 'px';
  }

  // ---- chọn + dẫn tới
  function select(m) {
    sel = m; info.hidden = !m; if (!m) return;
    iName.textContent = m.ten; iKind.textContent = KIND_TEXT[m.kind] || ''; const me = playerPos(); iDist.textContent = me ? describeFrom(me, m) : '';
    iGo.hidden = m.kind === 'target';
  }
  function goTo(m) {
    const W = LGT.world; if (!W) return toast('Chưa vào chùa nên chưa dẫn đường được.', 3000);
    if (LGT.inHouse) return toast('Bạn đang ở trong nhà. Hãy đi tới cánh cửa, bấm “Ra ngoài” rồi chọn nơi cần tới.', 3800);
    closeBig();
    if (m.goto && W.goTo && W.goTo(m.goto)) { setGoal(m); return toast(`Đang đi tới ${m.ten}…`, 2800); }
    W.walkTo(m.stand.x, m.stand.z); setGoal(m); toast(`Đang đi tới ${m.ten}…`, 2800);
  }
  function setGoal(m) { goal = m ? { x: m.stand ? m.stand.x : m.x, z: m.stand ? m.stand.z : m.z, label: m.ten } : null; refreshMarkers(true); }
  bigC.addEventListener('click', (e) => {
    const r = bigC.getBoundingClientRect(), u = e.clientX - r.left, v = e.clientY - r.top, s = bigSize();
    select(hitTest(markers, u * (s.w / r.width), v * (s.h / r.height), s.w, s.h, 14));
    draw(bigC, s.w, s.h, true, Date.now());
  });
  iGo.addEventListener('click', () => { if (sel) goTo(sel); });

  // ---- mở/đóng
  function openBig() { refreshMarkers(true); select(null); big.hidden = false; const s = bigSize(); draw(bigC, s.w, s.h, true, Date.now()); x.focus({ preventScroll: true }); }
  function closeBig() { big.hidden = true; }
  const toggleBig = () => (big.hidden ? openBig() : closeBig());
  x.addEventListener('click', closeBig);
  small.addEventListener('click', openBig);
  small.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBig(); } });
  bigBtn.addEventListener('click', openBig);
  tipBtn.addEventListener('click', () => { if (LGT.tutorial) LGT.tutorial.showAdvice(); else toast('Mở nút “?” để xem hướng dẫn chơi.', 3000); });
  fold.addEventListener('click', () => { collapsed = !collapsed; mm.classList.toggle('mm-off', collapsed); fold.textContent = collapsed ? '▸' : '▾'; try { localStorage.setItem(KEY, collapsed ? '0' : '1'); } catch (_) { /* bỏ qua */ } if (!collapsed) tick(); nudgeZoom(); });
  listBtn.addEventListener('click', () => { closeBig(); onList && onList(); });
  helpBtn.addEventListener('click', () => { closeBig(); onHelp && onHelp(); });
  big.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeBig(); } });
  addEventListener('keydown', (e) => {
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !LGT.panelOpen && mapAvailable(LGT.zones)) toggleBig();
  });

  setInterval(tick, 250); tick();
  LGT.minimap = { openBig, closeBig, toggleBig, setGoal, get isBigOpen() { return !big.hidden; } };
  return LGT.minimap;
}
