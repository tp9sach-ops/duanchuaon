// Màn hoạt động Tụng kinh + Tràng hạt (Phiên 14b). Logic ở js/engines/kinh.js (có test); file này chỉ lo DOM.
// Luồng: bấm nút → LGT.world.chant()/beads() (đi tới bồ đoàn rồi ngồi) → khi ngồi xong thì mở bảng ở nửa dưới màn hình.
import { KINH, kinhById, kinhDesc, createChanter, createBeads, BEADS_PER_ROUND, meritForPull, meritForChant } from '../engines/kinh.js';
import { moSound, bellSound, beadSound } from './sound.js';

const K_NIEM = 'lgt.niem', K_KINH = 'lgt.kinh';   // K_NIEM dùng chung với khối "niệm 108" của chương Chùa online
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (_) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* bỏ qua */ } };

/** hud: phần tử HUD; opts: { toast(text, ms), addMerit(n) }. Trả { open(kind), close() }. */
export function initPractice(hud, { toast = () => {}, addMerit = () => {} } = {}) {
  const LGT = window.LGT || {};
  const root = document.createElement('section'); root.className = 'pr'; root.id = 'practice'; root.hidden = true; root.setAttribute('role', 'dialog');
  root.innerHTML = `
    <header class="pr-head"><button type="button" class="pr-btn" id="pr-back">← Quay lại</button><b id="pr-title"></b><button type="button" class="pr-btn" id="pr-stand">Đứng dậy</button></header>
    <div class="pr-body" id="pr-chant" hidden>
      <div class="pr-chips" id="pr-chips" role="radiogroup" aria-label="Chọn bài kinh"></div>
      <p class="pr-desc" id="pr-desc"></p>
      <div class="pr-lines" aria-live="polite"><p class="pr-l0" id="pr-l0"></p><p class="pr-l1" id="pr-l1"></p><p class="pr-l1" id="pr-l2"></p></div>
      <p class="pr-meta" id="pr-meta"></p>
      <div class="pr-row"><button type="button" class="pr-mo" id="pr-mo" aria-label="Gõ mõ (một tiếng)"><svg viewBox="0 0 48 48" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><ellipse cx="24" cy="26" rx="16" ry="13"/><path d="M12 28h24M24 13v-4"/></svg></button>
        <label class="pr-auto"><input type="checkbox" id="pr-auto"> Tự động gõ</label></div>
    </div>
    <div class="pr-body" id="pr-beads" hidden>
      <div class="pr-ring" id="pr-ring" aria-label="Chuỗi 108 hạt. Chạm hoặc gạt để lần một hạt."><svg viewBox="0 0 240 240" aria-hidden="true"><g id="pr-g"></g><path d="M120 6l-9 14h18z" fill="#f2c14e"/></svg><div class="pr-cnt"><b id="pr-n">0</b><span> / ${BEADS_PER_ROUND}</span></div></div>
      <p class="pr-meta" id="pr-vong"></p>
      <div class="pr-row"><button type="button" class="pr-btn gold" id="pr-pull">Lần một hạt</button></div>
    </div>`;
  hud.appendChild(root);
  const $ = (id) => root.querySelector('#' + id);
  let kind = null, pending = null, pendingAt = 0, chanter = null, beads = createBeads(load(K_NIEM, {})), autoTimer = 0;

  // ---- vòng 108 hạt (SVG): hạt đã lần sáng vàng, vòng xoay để hạt kế tiếp ở đỉnh
  const g = $('pr-g'), TH = 360 / BEADS_PER_ROUND;
  g.innerHTML = Array.from({ length: BEADS_PER_ROUND }, (_, i) => { const a = (i * TH - 90) * Math.PI / 180, big = i === 0; return `<circle cx="${(120 + 100 * Math.cos(a)).toFixed(1)}" cy="${(120 + 100 * Math.sin(a)).toFixed(1)}" r="${big ? 6.5 : 4.2}" class="${big ? 'big' : ''}"/>`; }).join('');
  const drawBeads = () => {
    const { dem, vong } = beads.state();
    g.style.transform = `rotate(${(-dem * TH).toFixed(2)}deg)`;
    [...g.children].forEach((c, i) => c.classList.toggle('on', i < dem));
    $('pr-n').textContent = dem;
    $('pr-vong').textContent = vong ? `Đã lần đủ ${vong} vòng 108 hạt.` : 'Mỗi lần chạm hoặc gạt là một hạt. Đủ 108 hạt sẽ có tiếng chuông.';
    LGT.world && LGT.world.avatar && LGT.world.avatar.setBeadCount && LGT.world.avatar.setBeadCount(dem);
  };
  function pull() {
    if (kind !== 'beads') return;
    const r = beads.pull(); beadSound(); save(K_NIEM, beads.state()); drawBeads();
    const m = meritForPull(r); if (m) addMerit(m);
    if (r.full) { setTimeout(bellSound, 150); toast('Đã lần đủ 108 hạt. Công đức tròn đầy.', 4500); }
  }
  const ring = $('pr-ring'); ring.style.touchAction = 'none';
  ring.addEventListener('pointerup', pull);
  $('pr-pull').addEventListener('click', pull);

  // ---- tụng kinh
  $('pr-chips').innerHTML = KINH.map((k) => `<button type="button" role="radio" aria-checked="false" data-id="${esc(k.id)}">${esc(k.ten)}</button>`).join('');
  const drawChant = () => {
    const v = chanter.view();
    $('pr-l0').textContent = v.cur; $('pr-l1').textContent = v.next[0]; $('pr-l2').textContent = v.next[1];
    $('pr-meta').textContent = `Câu ${v.i + 1}/${v.n} · tiếng ${v.beat}/${v.beats}` + (v.rounds ? ` · đã tụng ${v.rounds} lần` : '');
  };
  function pickKinh(id) {
    const k = kinhById(id); chanter = createChanter(k); save(K_KINH, k.id);
    $('pr-chips').querySelectorAll('button').forEach((b) => { const on = b.dataset.id === k.id; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    $('pr-desc').textContent = `${k.ten} — ${kinhDesc(k)}`; drawChant();
  }
  $('pr-chips').addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (b) pickKinh(b.dataset.id); });
  function tap() {
    if (kind !== 'chant' || !chanter) return;
    moSound(); const ev = chanter.tap(); drawChant();
    const m = meritForChant(ev); if (m) addMerit(m);
    if (ev.round) { setTimeout(bellSound, 200); toast('Đã tụng trọn một lần. Công đức tròn đầy.', 4000); }
  }
  $('pr-mo').addEventListener('click', tap);
  $('pr-auto').addEventListener('change', (e) => { clearInterval(autoTimer); if (e.target.checked) autoTimer = setInterval(tap, 625); });

  // ---- mở / đóng
  function show(k) {
    kind = k; root.hidden = false; document.body.classList.add('practicing');
    $('pr-chant').hidden = k !== 'chant'; $('pr-beads').hidden = k !== 'beads';
    $('pr-title').textContent = k === 'chant' ? 'Tụng kinh' : 'Tràng hạt';
    if (k === 'chant') pickKinh(load(K_KINH, KINH[0].id)); else drawBeads();
    root.querySelector(k === 'chant' ? '#pr-mo' : '#pr-pull').focus({ preventScroll: true });
  }
  function hide() {
    clearInterval(autoTimer); $('pr-auto').checked = false;
    kind = null; root.hidden = true; document.body.classList.remove('practicing');
    LGT.world && LGT.world.avatar && LGT.world.avatar.setBeadCount && LGT.world.avatar.setBeadCount(0);
  }
  /** Bấm nút Tụng kinh / Tràng hạt. */
  function open(k) {
    if (LGT.panelOpen || !LGT.world) return;
    const r = k === 'chant' ? LGT.world.chant() : LGT.world.beads();
    if (r === 'outside') return toast('Hãy vào chánh điện trước (nút “Vào chánh điện”), rồi bấm lại nhé.', 4500);
    if (r === false) return toast('Bạn đang bận, thử lại sau một chút nhé.', 2500);
    pending = k; pendingAt = Date.now(); check();
  }
  const back = () => { if (kind) { hide(); LGT.world && LGT.world.rest && LGT.world.rest(); } };
  $('pr-back').addEventListener('click', back);
  $('pr-stand').addEventListener('click', () => { hide(); LGT.world && LGT.world.stand(); });
  addEventListener('keydown', (e) => {
    if (!kind) return;
    if (e.key === 'Escape') { back(); return; }
    if ((e.key === ' ' || e.key === 'Enter') && e.target === document.body) { e.preventDefault(); kind === 'chant' ? tap() : pull(); }
  });

  // ---- thăm dò nhẹ: mở bảng khi đã ngồi xong; đóng khi người chơi đứng dậy/đi chỗ khác
  function check() {
    const m = LGT.world && LGT.world.mode;
    if (kind && m !== kind) hide();
    if (pending) {
      if (m === pending) { const k = pending; pending = null; show(k); }
      else if (m === 'free' || Date.now() - pendingAt > 15000) pending = null;
    }
  }
  setInterval(check, 200);
  return { open, close: back };
}
