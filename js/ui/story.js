// Cốt truyện chương 1 (Phiên 32, Bước 2): hộp thoại nhiều trang với chú tiểu / trụ trì + thẻ mục tiêu hiện tại.
// Logic ở js/world/story.js (có test). Lưu tiến độ ở localStorage 'lgt.story' (chỉ trên máy người chơi).
// Mọi chữ hiển thị đi qua textContent, không chèn HTML. Bước 3 (tưới cây) và Bước 4 (thiền) sẽ gọi LGT.story.apply(...).
import { loadStory, apply, dialogueFor, objective } from '../world/story.js';
import { npcById } from '../world/npc.js';

const KEY = 'lgt.story';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD; opts: { toast(text, ms), addMerit(n) }. Trả { talk, apply, get state, close }. */
export function initStory(hud, { toast = () => {}, addMerit = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let story = loadStory(null); try { story = loadStory(localStorage.getItem(KEY)); } catch (_) { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(story)); } catch (_) { /* chế độ riêng tư */ } };

  // ---- thẻ mục tiêu hiện tại
  const obj = el('button', 'st-obj'); obj.type = 'button'; obj.setAttribute('aria-live', 'polite');
  const objT = el('b'), objS = el('span'), objP = el('i'); obj.append(objT, objS, objP); hud.appendChild(obj);
  let expanded = false;
  function drawObj() {
    const o = objective(story); obj.hidden = !o; if (!o) return;
    objT.textContent = o.title;
    objS.textContent = expanded ? o.text : '';
    objP.textContent = o.need ? (o.unit === 'giây' ? `${fmt(o.cur)} / ${fmt(o.need)}` : `${o.cur}/${o.need} ${o.unit}`) : '';
    objP.hidden = !o.need; obj.classList.toggle('open', expanded);
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  obj.addEventListener('click', () => { expanded = !expanded; drawObj(); });

  // ---- hộp thoại
  const dlg = el('section', 'st-dlg'); dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-label', 'Hội thoại');
  const who = el('b', 'st-who'), txt = el('p', 'st-txt'), pg = el('span', 'st-pg'), next = el('button', 'st-next', 'Tiếp ▸'); next.type = 'button';
  const foot = el('div', 'st-foot'); foot.append(pg, next); dlg.append(who, txt, foot); hud.appendChild(dlg);
  let cur = null;   // { id, pages, ev, i }
  function showPage() {
    txt.textContent = cur.pages[cur.i]; pg.textContent = cur.pages.length > 1 ? `${cur.i + 1}/${cur.pages.length}` : '';
    next.textContent = cur.i + 1 < cur.pages.length ? 'Tiếp ▸' : 'Xong';
  }
  function close() { dlg.hidden = true; cur = null; }
  function commit(ev) {
    const r = apply(story, ev); if (!r.changed) return r;
    story = r.story; save();
    if (r.gain.sen) addMerit(r.gain.sen);
    if (r.gain.xp && LGT.addXp) LGT.addXp(r.gain.xp);
    r.notes.forEach((n, i) => setTimeout(() => toast(n, 5200), 700 + i * 1300));
    drawObj(); return r;
  }
  function advance() {
    if (!cur) return;
    if (cur.i + 1 < cur.pages.length) { cur.i++; showPage(); return; }
    const ev = cur.ev; close(); if (ev) commit(ev);
  }
  next.addEventListener('click', advance);
  dlg.addEventListener('click', (e) => { if (e.target !== next) advance(); });
  addEventListener('keydown', (e) => {
    if (!cur) return;
    if (e.key === 'Escape') { close(); e.stopPropagation(); } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
  }, true);

  /** NPC `id` được thưa chuyện: mở hộp thoại cốt truyện nếu đang có lời ở bước này. Trả true nếu đã xử lý (để lời thường không chồng lên). */
  function talk(id) {
    if (story.step === 'done') return false;   // xong chương: dùng lời thường của NPC
    const d = dialogueFor(story, id); if (!d) return false;
    const n = npcById(id); who.textContent = n ? n.ten : '';
    cur = { id, pages: d.pages, ev: d.ev, i: 0 }; showPage(); dlg.hidden = false; next.focus({ preventScroll: true });
    return true;
  }

  LGT.storyTalk = talk;
  LGT.story = { get state() { return story; }, apply: commit, talk, close };
  drawObj();
  return LGT.story;
}
