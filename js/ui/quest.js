// Nhiệm vụ + cấp độ (Phiên 17): nút "Nhiệm vụ" ở thanh dưới mở bảng; thẻ "Cấp N" cạnh số hạt sen. Logic ở js/world/quests.js (có test).
// Các nơi khác báo sự kiện bằng window.LGT.act(type, n | arg): nhang(n nén), bow, thien, kinh, niem, den, loc, npc(id), visit(id), chat.
// Mọi chữ hiển thị đến từ dữ liệu cố định của dự án và qua textContent/esc, không chèn HTML lạ.
import { loadProg, record, questStatus, levelOf, levelReward, QUESTS } from '../world/quests.js';
import { placesAt } from '../world/outside.js';

const KEY = 'lgt.prog';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** hud: phần tử HUD; opts: { toast(text, ms), addMerit(n), pillHost: phần tử chứa thẻ cấp }. Trả { open, close, toggle }. */
export function initQuest(hud, { toast = () => {}, addMerit = () => {}, pillHost = null } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let prog = loadProg(null); try { prog = loadProg(localStorage.getItem(KEY)); } catch (_) { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (_) { /* chế độ riêng tư */ } };

  // ---- thẻ cấp độ cạnh số hạt sen
  const pill = document.createElement('button'); pill.type = 'button'; pill.className = 'hm-pill qs-pill'; pill.setAttribute('aria-label', 'Cấp độ và nhiệm vụ');
  pill.innerHTML = '<span class="qs-lv"></span><i class="qs-bar"><i></i></i>';
  if (pillHost) pillHost.appendChild(pill);
  const drawPill = () => {
    const L = levelOf(prog.xp); pill.querySelector('.qs-lv').textContent = 'Cấp ' + L.lv;
    pill.querySelector('.qs-bar > i').style.width = L.pct + '%';
    const meI = document.querySelector('.chip-me .me-tx i'), meB = document.querySelector('.chip-me .me-bar u'), meL = document.querySelector('.chip-me .me-lv');   // thẻ nhân vật góc trái-trên dùng chung cấp độ
    if (meI) meI.textContent = L.ten; if (meB) meB.style.width = L.pct + '%'; if (meL) meL.textContent = L.lv;
    pill.title = `${L.ten} · ${L.xp}${L.xp1 == null ? '' : ' / ' + L.xp1} điểm công hạnh (giá trị tạm)`;
  };

  // ---- bảng nhiệm vụ
  const box = document.createElement('section'); box.className = 'qs-box'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Nhiệm vụ');
  box.innerHTML = '<header><h3>Nhiệm vụ</h3><button type="button" class="qs-x" aria-label="Đóng">×</button></header><div class="qs-lvbox"></div><div class="qs-list"></div><p class="qs-note">Hoàn thành nhiệm vụ để nhận điểm công hạnh, hạt sen và lên cấp. Số điểm là giá trị tạm của bản thử.</p>';
  hud.appendChild(box);
  const lvBox = box.querySelector('.qs-lvbox'), list = box.querySelector('.qs-list');
  function drawBox() {
    const L = levelOf(prog.xp);
    lvBox.innerHTML = `<b>Cấp ${L.lv} · ${esc(L.ten)}</b><i class="qs-bar big"><i style="width:${L.pct}%"></i></i><span>${L.xp1 == null ? 'Cấp cao nhất' : `${L.xp} / ${L.xp1} điểm để lên cấp ${L.lv + 1}`}</span>`;
    const st = questStatus(prog), group = (loai, title) => {
      const rows = st.filter((r) => r.q.loai === loai).map((r) => `<li class="${r.done ? 'done' : ''}"><div><b>${esc(r.q.ten)}</b><small>${esc(r.q.mo)}</small></div><div class="qs-r"><i class="qs-bar"><i style="width:${Math.round(r.cur / r.need * 100)}%"></i></i><span>${r.done ? '✓ xong' : `${r.cur}/${r.need}`}</span><em>+${r.q.xp} điểm · +${r.q.sen} sen</em>${r.done ? '' : `<button type="button" class="qs-guide" data-q="${esc(r.q.id)}">Dẫn đường</button>`}</div></li>`).join('');
      return `<h4>${title}</h4><ul>${rows}</ul>`;
    };
    list.innerHTML = group('ngay', 'Hằng ngày (làm lại mỗi ngày)') + group('mot', 'Hành trình');
  }
  const open = () => { drawBox(); box.hidden = false; box.querySelector('.qs-x').focus({ preventScroll: true }); };
  const close = () => { box.hidden = true; };
  box.querySelector('.qs-x').addEventListener('click', close);
  list.addEventListener('click', (e) => { const b = e.target.closest('.qs-guide'); if (!b) return; close(); if (LGT.guide) LGT.guide.start(b.dataset.q); });   // Phiên 18: dẫn đường tới nhiệm vụ
  pill.addEventListener('click', () => (box.hidden ? open() : close()));
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });

  // ---- nhận sự kiện từ khắp nơi
  const visited = new Set();
  function act(type, x) {
    const ev = (type === 'npc' || type === 'visit') ? { type, arg: x } : { type, n: x };
    const r = record(prog, ev); if (r.prog === prog) return;
    prog = r.prog; save();
    r.done.forEach((q, i) => setTimeout(() => toast(`Hoàn thành nhiệm vụ: ${q.ten} · +${q.xp} điểm, +${q.sen} hạt sen`, 4500), i * 1200));
    if (r.gain.sen) addMerit(r.gain.sen);
    if (r.levelUp) setTimeout(() => toast(`Chúc mừng! Bạn lên cấp ${r.levelUp.to} · ${levelOf(prog.xp).ten}${r.levelUp.sen ? ` · thưởng ${r.levelUp.sen} hạt sen` : ''}`, 6000), 400 + r.done.length * 1200);
    drawPill(); if (!box.hidden) drawBox();
  }
  /** Cộng điểm công hạnh từ nguồn ngoài nhiệm vụ (cốt truyện, Phiên 32). Lên cấp thì thưởng hạt sen như nhiệm vụ. */
  LGT.addXp = (n) => {
    n = Math.max(0, Math.min(500, Math.floor(+n) || 0)); if (!n) return;
    const before = levelOf(prog.xp).lv; prog = { ...prog, xp: prog.xp + n }; save();
    const after = levelOf(prog.xp).lv;
    if (after > before) { let bonus = 0; for (let l = before + 1; l <= after; l++) bonus += levelReward(l); if (bonus) addMerit(bonus); setTimeout(() => toast(`Chúc mừng! Bạn lên cấp ${after} · ${levelOf(prog.xp).ten}${bonus ? ` · thưởng ${bonus} hạt sen` : ''}`, 6000), 400); }
    drawPill(); if (!box.hidden) drawBox();
  };
  LGT.act = act; LGT.quests = { get prog() { return prog; }, count: QUESTS.length };
  // đặt chân tới một nơi (sân chùa, chánh điện, làng, thác, rừng...) thì tính "đã ghé"
  setInterval(() => {
    drawPill();   // thẻ nhân vật có thể được dựng sau lần gọi đầu
    const w = LGT.world; if (!w || !w.pos) return;
    for (const id of placesAt(w.pos)) if (!visited.has(id)) { visited.add(id); act('visit', id); }
  }, 900);
  drawPill();
  return { open, close, toggle: () => (box.hidden ? open() : close()), get isOpen() { return !box.hidden; } };
}
