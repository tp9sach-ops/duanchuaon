// Cốt truyện chương 1 (Phiên 32, Bước 2): hộp thoại nhiều trang với chú tiểu / trụ trì + thẻ mục tiêu hiện tại.
// Logic ở js/world/story.js (có test). Lưu tiến độ ở localStorage 'lgt.story' (chỉ trên máy người chơi).
// Mọi chữ hiển thị đi qua textContent, không chèn HTML. Phiên 34: nút "Dẫn đường" + "Tưới cây" dưới thẻ mục tiêu, đếm giờ thiền 3 phút, bước cốt truyện hiện trong bảng Nhiệm vụ.
import { loadStory, apply, dialogueFor, objective, canWater, nearTree, WATER_SPOT, STORY_QUESTS } from '../world/story.js';
import { npcById } from '../world/npc.js';
import { nextGoal } from '../world/nextGoal.js';

const KEY = 'lgt.story';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** hud: phần tử HUD; opts: { toast(text, ms), addMerit(n) }. Trả { talk, apply, get state, close }. */
export function initStory(hud, { toast = () => {}, addMerit = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let story = loadStory(null); try { story = loadStory(localStorage.getItem(KEY)); } catch (_) { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(story)); } catch (_) { /* chế độ riêng tư */ } };

  // ---- thẻ mục tiêu hiện tại
  const obj = el('button', 'st-obj'); obj.type = 'button'; obj.setAttribute('aria-live', 'polite');
  const objK = el('small'), objT = el('b'), objS = el('span'), objP = el('i'); obj.append(objK, objT, objS, objP);
  const wrap = el('div', 'st-wrap'), act = el('div', 'st-act');
  const goBtn = el('button', 'st-btn st-go', 'Dẫn đường'), waterBtn = el('button', 'st-btn st-water', 'Tưới cây'); goBtn.type = 'button'; waterBtn.type = 'button';
  waterBtn.dataset.id = 'tuoicay'; waterBtn.hidden = true; act.append(goBtn, waterBtn); wrap.append(obj, act); hud.appendChild(wrap);
  let expanded = true, goal = null, goalKey = '', goalId = '', collapseTimer = 0;
  // Phiên 43: thẻ này luôn hiện MỘT việc kế tiếp (cốt truyện → hành trình/hằng ngày → tự do), xem js/world/nextGoal.js. Việc mới hiện thì thẻ mở sẵn ~15 giây và có thông báo.
  const stateNow = () => ({ story, prog: LGT.quests && LGT.quests.prog, sen: LGT.getSen ? LGT.getSen() : 0, la: LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0, own: LGT.land && LGT.land.state ? LGT.land.state.own : null, orbs: LGT.fishing && LGT.fishing.state ? Object.keys(LGT.fishing.state.orbs || {}).length : 0 });
  function drawObj() {
    goal = nextGoal(stateNow()); LGT.nextGoalId = goal.guide || goal.id; wrap.hidden = false; obj.hidden = false; drawAct();
    if (LGT.quests && LGT.quests.redraw) LGT.quests.redraw();
    objK.textContent = 'Việc kế tiếp · ' + goal.label; objT.textContent = goal.title;
    objS.textContent = expanded ? goal.text : '';
    const timed = goal.unit === 'giây';
    objP.textContent = goal.need > 1 ? (timed ? `${fmt(goal.cur)} / ${fmt(goal.need)}` : `${goal.cur}/${goal.need}${goal.unit ? ' ' + goal.unit : ''}`) : '';
    objP.hidden = !(goal.need > 1); obj.classList.toggle('open', expanded);
    goBtn.hidden = !(goal.guide || goal.go); goBtn.textContent = goal.guide || (goal.go && (goal.go.npc || goal.go.place)) ? 'Dẫn đường' : 'Chỉ nút';
  }
  /** Tính lại việc kế tiếp; chỉ vẽ lại khi có gì đổi. Việc đổi sang việc khác → mở thẻ, nhấp nháy, báo "Việc tiếp theo". */
  function refresh(first = false) {
    const g = nextGoal(stateNow()), key = [g.id, g.cur, g.need, g.text].join('|'); if (key === goalKey) return;
    const changed = g.id !== goalId; goalKey = key;
    if (changed) {
      const had = !!goalId; goalId = g.id; expanded = true; clearTimeout(collapseTimer); collapseTimer = setTimeout(() => { expanded = false; drawObj(); }, 15000);
      if (had && !first) { obj.classList.remove('new'); void obj.offsetWidth; obj.classList.add('new'); setTimeout(() => toast(`Việc tiếp theo: ${g.title}. ${g.kind === 'free' ? '' : 'Bấm “Dẫn đường” để được chỉ đường.'}`, 6000), 3800); }
    }
    drawObj();
  }
  // ---- nút Dẫn đường + Tưới cây (Phiên 34)
  const WATER_MS = 1600; let watering = false;
  const nearNow = () => { const w = LGT.world; return !!(w && w.pos && nearTree(w.pos)); };
  function drawAct() {
    const w = story.step === 'water1' || story.step === 'water2';
    waterBtn.hidden = !w; if (w) waterBtn.textContent = watering ? 'Đang tưới…' : nearNow() ? 'Tưới cây' : 'Đi tới cây';
  }
  goBtn.addEventListener('click', () => {
    const g = goal || nextGoal(stateNow());
    if (g.guide) { if (LGT.guide) LGT.guide.start(g.guide); else toast('Chưa dẫn đường được lúc này.', 2500); }
    else if (g.go && LGT.tutorial && LGT.tutorial.goTo) LGT.tutorial.goTo(g.go);
    else toast(g.text, 4000);
  });
  waterBtn.addEventListener('click', () => {
    if (watering || LGT.panelOpen) return;
    if (!nearNow()) { if (LGT.world) LGT.world.walkTo(WATER_SPOT.x, WATER_SPOT.z); toast('Đi tới cây bồ đề cổ, rồi bấm “Tưới cây”.', 3000); return; }
    const c = canWater(story, true, Date.now());
    if (!c.ok) { if (c.reason === 'cooldown') toast('Đợi một chút rồi tưới tiếp nhé.', 2000); return; }
    watering = true; drawAct(); toast('Bạn nhẹ tay tưới nước vào gốc cây…', 1500);
    setTimeout(() => { watering = false; if (nearNow()) commit({ type: 'water', near: true }); else toast('Bạn đã rời xa cây, nước chưa tới gốc.', 2500); drawAct(); }, WATER_MS);
  });
  // đếm giờ thiền: chỉ khi đang ngồi thiền ở bồ đoàn (tab ẩn vẫn đếm); mỗi nhịp cộng thời gian thật (logic tự chặn trần 2 giây/lần)
  let lastTick = Date.now(), tickN = 0;
  setInterval(() => {
    const now = Date.now(), dt = (now - lastTick) / 1000; lastTick = now; drawAct(); if (++tickN % 3 === 0) refresh();   // 1,5 giây tính lại việc kế tiếp (hạt sen / lá / nhiệm vụ đổi)
    const W = LGT.world;                                            // Phiên 38: treo web / đổi tab vẫn đếm giờ thiền (chia đoạn ≤2 giây, tổng tối đa 120 giây mỗi nhịp)
    if (W && W.mode === 'meditate' && dt > 0) for (let left = Math.min(dt, 120); left > 0 && story.step === 'meditate'; left -= 2) commit({ type: 'meditate', dt: Math.min(left, 2) });
  }, 500);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  obj.addEventListener('click', () => { expanded = !expanded; clearTimeout(collapseTimer); drawObj(); });

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
    refresh(); return r;
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
  LGT.story = { get state() { return story; }, apply: commit, talk, close, refresh, get goal() { return goal; } };
  setTimeout(() => refresh(true), 0); drawObj();
  return LGT.story;
}
