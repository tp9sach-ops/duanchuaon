// Câu cá bằng quả cầu gieo duyên (Phiên 45, việc 3b + 3d dạng chữ). Logic ở js/world/fishing.js (có test). Mọi chữ hiển thị đi qua textContent.
// Bảng có 3 tab: "Thả cầu" (quăng → chờ → bấm đúng lúc hoa sen nở → Thu cá / Phóng sinh), "Quả cầu" (mua / chọn / sửa bằng lá bồ đề), "Ao cá" (cá đã thu, phóng sinh từng con).
// Nút nổi "Câu cá" hiện khi người chơi đứng gần mặt nước câu được. Lưu localStorage['lgt.fish']. Cảnh 3D câu cá: js/scene/fishing.js (Phiên 48) đọc LGT.fishing.session.
import { ORBS, orbById, repairCost, loadFish, buyOrb, selectOrb, repairOrb, currentOrb, startCast, tick, tap, isTapKey, stillNearWater, keepFish, releaseCaught, releaseFish, nearWater, waterById, fishLabel, pondSummary, speciesById, phaseText, outcomeText, orbBrief, POND_MAX } from '../world/fishing.js';

const KEY = 'lgt.fish';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const WHY = { poor: 'Chưa đủ lá bồ đề.', owned: 'Bạn đã có quả cầu này.', unknown: 'Quả cầu này không có.', notowned: 'Bạn chưa có quả cầu này.', intact: 'Quả cầu còn nguyên, chưa cần sửa.', full: `Ao cá đã đầy (${POND_MAX} con). Hãy phóng sinh bớt.` };

/** opts: { toast(text, ms) }. Đặt LGT.fishing = { open(tab), close, get state, get session }. */
export function initFishing(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let st = loadFish(null); try { st = loadFish(localStorage.getItem(KEY)); } catch (_) { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* chế độ riêng tư */ } };
  const leaves = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);
  const pos = () => (LGT.world && LGT.world.pos) || null;
  const here = () => { const p = pos(); return p && !LGT.inHouse ? nearWater(p.x, p.z) : null; };
  let tab = 'cast', sess = null, caught = null, note = '', raf = 0, lastT = 0;   // sess = phiên câu đang chạy; caught = cá vừa câu chờ Thu/Phóng sinh

  const box = el('section', 'fs-box'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Câu cá');
  const head = el('header'), h = el('h3', null, 'Câu cá gieo duyên'), x = el('button', 'fs-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(h, x);
  const tabs = el('div', 'fs-tabs'), tabBtns = {};
  for (const [id, label] of [['cast', 'Thả cầu'], ['orbs', 'Quả cầu'], ['pond', 'Ao cá']]) { const b = el('button', 'fs-tab', label); b.type = 'button'; b.addEventListener('click', () => show(id)); tabs.appendChild(b); tabBtns[id] = b; }
  const info = el('p', 'fs-info'), list = el('div', 'fs-list'); box.append(head, tabs, info, list); hud.appendChild(box);

  const fab = el('button', 'fs-fab', 'Câu cá'); fab.type = 'button'; fab.hidden = true; fab.setAttribute('aria-label', 'Mở bảng câu cá'); hud.appendChild(fab);
  fab.addEventListener('click', () => open('cast'));

  const btn = (label, fn, cls = 'fs-b', aria) => { const b = el('button', cls, label); b.type = 'button'; if (aria) b.setAttribute('aria-label', aria); b.addEventListener('click', fn); return b; };
  const changed = () => { save(); draw(); };

  function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function loop(now) {
    raf = 0; if (!sess || box.hidden) return;
    const dt = lastT ? (now - lastT) / 1000 : 0; lastT = now;
    const p = pos(); if (LGT.inHouse || (p && !stillNearWater(p.x, p.z, sess.water))) { leave(); return; }   // đã đi khỏi mép nước: thu cầu về
    sess = tick(sess, dt);
    if (sess.over) { finish(); return; }
    paintCast(); raf = requestAnimationFrame(loop);
  }
  function begin() {
    const w = here(); if (!w) { toast('Hãy đứng gần mặt nước (hồ cá, ao sen, hồ thác) rồi thả cầu.', 3000); return; }
    const r = startCast(st, w.id); if (!r.ok) { toast(r.reason === 'cracked' ? 'Quả cầu đã nứt, hãy sửa hoặc đổi cầu khác.' : r.reason === 'noorb' ? 'Bạn chưa có quả cầu nào. Mở tab “Quả cầu” để mua.' : 'Không thả cầu được ở đây.', 3200); return; }
    st = r.state; save(); sess = r.sess; caught = null; note = ''; lastT = 0; draw(); stopLoop(); raf = requestAnimationFrame(loop);
  }
  function leave() { stopLoop(); sess = null; note = ''; draw(); toast('Bạn đã rời mặt nước nên cầu được thu về (lượt này coi như đã dùng).', 3000); }
  function pressTap() { if (!sess || sess.over) return; sess = tap(sess); finish(); }
  function finish() {
    stopLoop(); const s = sess; sess = null; note = outcomeText(s.outcome, s.fish);
    caught = s.outcome === 'got' ? s.fish : null; draw();
    if (caught && LGT.act) LGT.act('cau');   // nhiệm vụ “Câu được con cá đầu tiên”
  }
  function keep() {
    if (!caught) return; const r = keepFish(st, caught); if (!r.ok) { toast(WHY[r.reason] || 'Không thu được.', 3000); return; }
    toast(`Đã thu ${fishLabel(caught)} vào ao cá.`, 2600); st = r.state; caught = null; note = 'Đã thu cá vào ao riêng.'; changed();
  }
  function release() {
    if (!caught) return; const f = caught, r = releaseCaught(st, f); if (!r.ok) return;
    st = r.state; caught = null; note = `Bạn đã phóng sinh ${fishLabel(f)}. Nam mô A Di Đà Phật.`; changed(); rewardRelease(r.sen);
  }
  function rewardRelease(sen) { if (LGT.act) LGT.act('phongsinh'); if (LGT.merit && LGT.merit.reward) LGT.merit.reward('phongsinh', sen); }   // trần 10 lần/ngày; hết trần vẫn được thả, chỉ không cộng sen

  function buy(id) {
    const o = orbById(id); if (!o) return; const r = buyOrb(st, leaves(), id); if (!r.ok) { toast(WHY[r.reason] || 'Không mua được.', 2800); return; }
    if (!LGT.merit || !LGT.merit.spendLa(r.cost)) { toast(WHY.poor, 2800); return; }
    st = r.state; changed(); toast(`Đã mua ${o.ten} (trừ ${r.cost} lá).`, 3000);
  }
  function pick(id) { const r = selectOrb(st, id); if (r.ok) { st = r.state; changed(); } }
  function fix(id) {
    const o = orbById(id); if (!o) return; const r = repairOrb(st, leaves(), id); if (!r.ok) { toast(WHY[r.reason] || 'Không sửa được.', 2800); return; }
    if (!LGT.merit || !LGT.merit.spendLa(r.cost)) { toast(WHY.poor, 2800); return; }
    st = r.state; changed(); toast(`Đã sửa ${o.ten} (trừ ${r.cost} lá).`, 3000);
  }
  function freeFish(uid) {
    const r = releaseFish(st, uid); if (!r.ok) return;
    st = r.state; changed(); toast(`Đã phóng sinh ${fishLabel(r.fish)}.`, 2400); rewardRelease(r.sen);
  }

  function paintCast() {   // chỉ cập nhật chữ trạng thái mỗi khung hình (không dựng lại cả bảng)
    const t = list.querySelector('.fs-status'); if (!t || !sess) return;
    t.textContent = phaseText(sess.phase, (waterById(sess.water) || {}).ten);
    const b = list.querySelector('.fs-tap'); if (b) b.classList.toggle('hot', sess.phase === 'lotus');
  }
  function drawCast() {
    const w = here(), cur = currentOrb(st);
    info.textContent = cur ? `Cầu đang dùng: ${cur.orb.ten} — còn ${cur.dur}/${cur.orb.ben} lần${cur.cracked ? ' (đã nứt)' : ''}.` : 'Bạn chưa có quả cầu nào. Mở tab “Quả cầu” để mua.';
    if (sess) {
      list.appendChild(el('p', 'fs-status', phaseText(sess.phase, (waterById(sess.water) || {}).ten)));
      const b = btn('Bấm!', pressTap, 'fs-b fs-tap'); list.appendChild(b); list.appendChild(el('p', 'fs-hint', 'Đợi hoa sen nở (chỉ khoảng nửa giây) rồi bấm nút này hoặc nhấn phím Cách / Enter. Bấm sớm cá sẽ giật mình.')); return;
    }
    if (caught) {
      list.appendChild(el('p', 'fs-status ok', note));
      const row = el('div', 'fs-ctl'); row.append(btn('Thu cá', keep, 'fs-b buy'), btn('Phóng sinh', release)); list.appendChild(row);
      list.appendChild(el('p', 'fs-hint', `Thu cá: nuôi trong ao riêng (tối đa ${POND_MAX} con). Phóng sinh: thả về nước, được hạt sen (hôm nay tối đa 10 lần có thưởng).`)); return;
    }
    if (note) list.appendChild(el('p', 'fs-status', note));
    list.appendChild(el('p', 'fs-hint', w ? `Bạn đang đứng gần ${w.ten}. Bấm “Thả cầu” để bắt đầu.` : 'Hãy đi tới hồ cá, ao sen hoặc hồ thác (đứng sát mép nước) rồi mở lại bảng này.'));
    const go = btn(cur && cur.cracked ? 'Cầu đã nứt — sửa ở tab Quả cầu' : 'Thả cầu', begin, 'fs-b buy'); go.disabled = !(w && cur && !cur.cracked); list.appendChild(go);
  }
  function drawOrbs() {
    info.textContent = `Bạn có ${leaves()} lá bồ đề. Cầu càng tốt: càng bền, càng dễ gặp cá hiếm, hoa sen hiện càng lâu.`;
    for (const o of ORBS) {
      const own = st.orbs[o.id] !== undefined, dur = st.orbs[o.id], row = el('div', 'fs-row'), t = el('div', 'fs-t');
      t.append(el('b', null, o.ten), el('span', null, ` ${orbBrief(o)}${own ? ` · còn ${dur}/${o.ben}` : ''}`));
      const c = el('div', 'fs-ctl');
      if (!own) { const b = btn(`Mua ${o.gia} lá`, () => buy(o.id), 'fs-b buy'); b.disabled = leaves() < o.gia; c.appendChild(b); }
      else {
        if (dur <= 0) { const cost = repairCost(o), b = btn(`Sửa ${cost} lá`, () => fix(o.id), 'fs-b buy'); b.disabled = leaves() < cost; c.appendChild(b); }
        const sel = st.sel === o.id, b = btn(sel ? 'Đang dùng' : 'Chọn', () => pick(o.id), 'fs-b'); b.disabled = sel; c.appendChild(b);
      }
      row.append(t, c); list.appendChild(row);
    }
  }
  function drawPond() {
    const s = pondSummary(st);
    info.textContent = s.total ? `Ao cá riêng: ${s.total}/${POND_MAX} con (cá ${s.ca}, rùa ${s.rua}, ba ba ${s.baba}, mực ${s.muc}; hiếm ${s.hiem}, lớn ${s.lon}).` : 'Ao cá riêng đang trống. Câu được cá rồi bấm “Thu cá” để nuôi ở đây.';
    for (const f of st.pond) {
      const sp = speciesById(f.sp); if (!sp) continue;
      const row = el('div', 'fs-row'), t = el('div', 'fs-t'); t.append(el('b', null, fishLabel(f)));
      row.append(t, btn('Phóng sinh', () => freeFish(f.uid), 'fs-b sm', `Phóng sinh ${fishLabel(f)}`)); list.appendChild(row);
    }
    if (s.total) list.appendChild(el('p', 'fs-hint', `Đã câu ${st.stat.got} con · đã phóng sinh ${st.stat.rel} con.`));
  }
  function draw() {
    list.textContent = '';
    for (const k of Object.keys(tabBtns)) { tabBtns[k].classList.toggle('on', k === tab); tabBtns[k].setAttribute('aria-pressed', String(k === tab)); }
    if (tab === 'orbs') drawOrbs(); else if (tab === 'pond') drawPond(); else drawCast();
  }
  function show(id) { tab = id; draw(); }
  function open(id = 'cast') { tab = id; box.hidden = false; draw(); if (sess && !raf) { lastT = 0; raf = requestAnimationFrame(loop); } }
  function close() { box.hidden = true; stopLoop(); if (sess) { sess = null; toast('Bạn đã thu cầu về (lượt này coi như đã dùng).', 2600); } }
  x.addEventListener('click', close);
  // Phím Cách / Enter = bấm (cửa sổ hoa sen chỉ 0,5–0,9 giây nên cần phím). Bắt ở giai đoạn capture để phím Cách không làm nhân vật nhảy (skill.js) và không bấm đúp nút "Bấm!".
  addEventListener('keydown', (e) => {
    if (!sess || sess.over || box.hidden || !isTapKey(e)) return;
    e.preventDefault(); e.stopImmediatePropagation(); pressTap();
  }, true);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });

  // nút nổi "Câu cá" chỉ hiện khi đứng gần nước và bảng đang đóng
  setInterval(() => { fab.hidden = !box.hidden || !here(); }, 500);

  LGT.fishing = { open, close, get state() { return st; }, get session() { return sess; } };
  return LGT.fishing;
}
