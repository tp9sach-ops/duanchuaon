// Khung HUD Phiên 13b: thanh menu dưới 9 nút, lưới 6 nút hành động, cụm nút phải-trên, toast giữa-trên, bảng "Bản đồ chùa".
// Logic và dữ liệu ở menuLogic.js (có test). Biểu tượng SVG tự vẽ (không dùng ảnh của trang mẫu). Mọi nút chưa có tính năng: mờ + báo "sắp có".
import { initPractice } from './practice.js';
import { initDen } from './den.js';
import { initNpc } from './npc.js';
import { initChat } from './chat.js';
import { initQuest } from './quest.js';
import { initGuide } from './guide.js';
import { initStory } from './story.js';
import { initMerit } from './merit.js';
import { initDonate } from './donate.js';
import { DEN_MERIT } from '../engines/den.js';
import { initLand } from './land.js';
import { initHouse } from './house.js';
import { initFurni } from './furni.js';
import { initFishing } from './fishing.js';
import { initDock } from './dock.js';
import { initCarry } from './carry.js';
import { initYeuQuai } from './yeuquai.js';
import { initThrowPlayer } from './throwPlayer.js';
import { initNpcThrow } from './npcThrow.js';
import { initThietDau } from './thietDau.js';
import { initSwim } from './swim.js';
import { initBag } from './bag.js';
import { initEdit } from './editmode.js';
import { initSkill } from './skill.js';
import { initMinimap } from './minimap.js';
import { initTutorial } from './tutorial.js';
import { initCoach } from './coach.js';
import { lifetimeSen } from '../world/merit.js';
import { loadWallet, addSen } from '../engines/kinh.js';
import { callApi, apiEnabled, getUserKey } from '../api.js';
import { loadProfile } from './hudLogic.js';
import { BOTTOM_MENU, ACTIONS, TOP_ICONS, WALLET_PLACEHOLDER, HELP_TEXT, WELCOME_TEXT, pressResult, ariaLabel, OUTSIDE_TEXT, captionOf, LONG_PRESS_MS, isReady, mapEntries, formatCount, createToastState } from './menuLogic.js';

const P = {
  scroll: '<path d="M8 4h10v13a3 3 0 0 0 3 3H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"/><path d="M10 9h6M10 13h6"/>',
  bag: '<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  shop: '<path d="M4 9l1-4h14l1 4M4 9v10h16V9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M10 19v-5h4v5"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 5.5a2.6 2.6 0 0 1 0 5M17.5 14a5 5 0 0 1 3.5 5"/>',
  rank: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  lamp: '<path d="M9 3h6M12 3v3M8 6h8l1 3v7a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V9l1-3zM10 21h4M8 11h8"/>',
  lotus: '<path d="M12 20c-4 0-7-2-8-6 3 0 5 1 8 4 3-3 5-4 8-4-1 4-4 6-8 6z"/><path d="M12 18c-2.2-2-3-5 0-11 3 6 2.2 9 0 11z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  bow: '<circle cx="12" cy="5" r="2"/><path d="M12 8v5M12 13l-4 3v4M12 13l4 3v4M9 10h6"/>',
  beads: '<circle cx="12" cy="5" r="1.4"/><circle cx="17" cy="8" r="1.4"/><circle cx="18" cy="14" r="1.4"/><circle cx="14" cy="19" r="1.4"/><circle cx="8" cy="19" r="1.4"/><circle cx="5.5" cy="14" r="1.4"/><circle cx="7" cy="8" r="1.4"/>',
  book: '<path d="M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5V4zM19 4h-6v14h6V4z"/>',
  sit: '<circle cx="12" cy="6" r="2"/><path d="M12 9v5M5 16c3 0 4-2 7-2s4 2 7 2M7 20h10"/>',
  incense: '<path d="M12 3c1.2 2-1.2 3 0 5"/><path d="M8 21h8l-1-7H9l-1 7zM7 12h10"/>',
  paw: '<circle cx="7" cy="10" r="1.5"/><circle cx="11" cy="6.5" r="1.5"/><circle cx="15" cy="6.5" r="1.5"/><circle cx="18" cy="10" r="1.5"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5c0 2-1.5 2.5-4 2.5S8 19 8 17z"/>',
  bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4l2-2zM10 21h4"/>',
  gift: '<path d="M4 10h16v4H4zM5 14h14v7H5zM12 10v11"/><path d="M12 10C9 10 8 6 10.5 6 12.5 6 12 10 12 10zM12 10c3 0 4-4 1.5-4C11.5 6 12 10 12 10z"/>',
  mail: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>',
  fish: '<path d="M3 12c3-5 8-6 12-3l4-3v12l-4-3c-4 3-9 2-12-3z"/><circle cx="8" cy="11" r=".9"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 12v8h14v-8"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1 1-1.1 1.8M12 17v.01"/>',
  sen: '<path d="M12 20c-4 0-7-2-8-6 3 0 5 1 8 4 3-3 5-4 8-4-1 4-4 6-8 6z"/><path d="M12 18c-2.2-2-3-5 0-11 3 6 2.2 9 0 11z"/>',
  ngoc: '<path d="M6 4h12l3 5-9 11L3 9l3-5zM3 9h18"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Gắn khung HUD vào phần tử `hud` (cùng ẩn/hiện với HUD). Trả { toast(text, ms), welcome() }. */
export function initHudMenu(hud) {
  const LGT = window.LGT || {};
  const toastState = createToastState();
  let toastTimer = 0;

  let wallet = { sen: 0 }; try { wallet = loadWallet(localStorage.getItem('lgt.wallet')); } catch (_) { /* bỏ qua */ }   // hạt sen: công đức từ tụng kinh/tràng hạt (giá trị TẠM, Phiên 16 làm tiến trình thật)
  const root = el('div', 'hm'); root.id = 'hudmenu';
  root.innerHTML = `
    <div class="hm-toast" id="hm-toast" role="status" aria-live="polite" hidden></div>
    <div class="hm-tr">
      <div class="hm-wallet">
        <span class="hm-pill" title="Hạt sen (công đức, giá trị tạm)">${svg('sen')}<b id="hm-sen">${formatCount(wallet.sen)}</b></span>
        <span class="hm-pill" title="Ngọc (giá trị tạm)">${svg('ngoc')}<b>${formatCount(WALLET_PLACEHOLDER.ngoc)}</b></span>
      </div>
      <div class="hm-icons" id="hm-icons"></div>
    </div>
    <button type="button" class="hm-stand" id="hm-stand" hidden>Đứng dậy</button>
    <div class="hm-grid" id="hm-grid" role="group" aria-label="Hành động"></div>
    <nav class="hm-bar" id="hm-bar" aria-label="Menu chùa"></nav>
    <section class="hm-map" id="hm-map" role="dialog" aria-label="Bản đồ chùa" hidden>
      <header><h3>Bản đồ chùa</h3><button type="button" class="hm-x" aria-label="Đóng bản đồ">${svg('close')}</button></header>
      <ul id="hm-map-list"></ul>
    </section>`;
  hud.appendChild(root);
  const $ = (id) => root.querySelector('#' + id);

  // ---- toast
  function toast(text, ms = 4200) {
    const t = toastState.push(text, ms, Date.now()); const box = $('hm-toast');
    if (!t) return;
    box.textContent = t.text; box.hidden = false; box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { if (!toastState.get(Date.now())) box.hidden = true; }, Math.max(1200, ms) + 60);
  }
  LGT.toast = toast;
  let scoreTimer = 0;
  const pushScore = async () => {   // gửi điểm lên Sheet, chờ 4 giây sau lần cộng cuối để đỡ gọi nhiều
    if (!apiEnabled()) return;
    try {
      const prof = loadProfile(localStorage);
      const spent = (LGT.merit && LGT.merit.leaf) || null, total = lifetimeSen(wallet.sen, spent);   // điểm xếp hạng = tổng sen từng kiếm (đổi lá không làm tụt)
      const res = await callApi('saveScore', { userKey: getUserKey(), n: prof.name, sen: total });
      if (res && res.ok && Number(res.sen) > total) { wallet = { ...wallet, sen: wallet.sen + (Number(res.sen) - total) }; localStorage.setItem('lgt.wallet', JSON.stringify(wallet)); const b = root.querySelector('#hm-sen'); if (b) b.textContent = formatCount(wallet.sen); }
    } catch (_) { /* mạng lỗi: lần cộng sau sẽ gửi lại */ }
  };
  const addMerit = (n) => { wallet = addSen(wallet, n); try { localStorage.setItem('lgt.wallet', JSON.stringify(wallet)); } catch (_) { /* bỏ qua */ } const b = root.querySelector('#hm-sen'); if (b) b.textContent = formatCount(wallet.sen); clearTimeout(scoreTimer); scoreTimer = setTimeout(pushScore, 4000); };
  LGT.addMerit = addMerit;
  LGT.getSen = () => wallet.sen;   // Phiên 39: sổ tay hướng dẫn đọc số hạt sen để gợi ý việc kế tiếp
  /** Trừ hạt sen khi tiêu (đổi lá bồ đề...). Trả false nếu không đủ. */
  const spendMerit = (n) => {
    n = Math.floor(+n); if (!(n > 0) || wallet.sen < n) return false;
    wallet = { ...wallet, sen: wallet.sen - n }; try { localStorage.setItem('lgt.wallet', JSON.stringify(wallet)); } catch (_) { /* bỏ qua */ }
    const b = root.querySelector('#hm-sen'); if (b) b.textContent = formatCount(wallet.sen); return true;
  };
  LGT.spendSen = spendMerit;   // Phiên 57: quầy cầu gỗ trừ hạt sen
  const practice = initPractice(hud, { toast, addMerit });
  const den = initDen(hud, { toast, addMerit });
  initNpc({ toast, addMerit });
  try { initDonate(hud, { toast, addMerit }); } catch (e) { console.warn('[Diệu Giang Tự] Thùng công đức lỗi:', e && e.message); }   // Phiên 80: thùng công đức ở chánh điện
  const chat = initChat(hud, { toast });
  const quest = initQuest(hud, { toast, addMerit, pillHost: root.querySelector('.hm-wallet') });   // nhiệm vụ + cấp độ (Phiên 17)
  try { initGuide(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Dẫn đường lỗi:', e && e.message); }   // dẫn đường nhiệm vụ (Phiên 18)
  try { initMerit(hud, { toast, addMerit, getSen: () => wallet.sen, spendSen: spendMerit, pillHost: root.querySelector('.hm-wallet') }); } catch (e) { console.warn('[Diệu Giang Tự] Lá bồ đề lỗi:', e && e.message); }   // đổi hạt sen lấy lá bồ đề (Phiên 35)
  try { initLand(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Đất ở lỗi:', e && e.message); }   // đất ở + xóm (Phiên 36)
  try { initFurni(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Nội thất lỗi:', e && e.message); }   // cửa hàng nội thất + túi đồ (Phiên 41, bước 4)
  try { initFishing(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Câu cá lỗi:', e && e.message); }   // câu cá bằng quả cầu gieo duyên + ao cá + phóng sinh (Phiên 45)
  try { initEdit(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Chỉnh sửa nhà lỗi:', e && e.message); }   // chế độ chỉnh sửa nhà: kéo/xoay đồ bằng chuột (Phiên 43)
  try { initHouse(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Vào nhà lỗi:', e && e.message); }   // nút Vào nhà / Ra ngoài (Phiên 38, 3d-2c)
  try { initStory(hud, { toast, addMerit }); } catch (e) { console.warn('[Diệu Giang Tự] Cốt truyện lỗi:', e && e.message); }   // hộp thoại + mục tiêu chương 1 (Phiên 32); lỗi thì NPC vẫn nói lời thường
  try { initTutorial(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Sổ tay hướng dẫn lỗi:', e && e.message); }   // hướng dẫn chơi + gợi ý việc kế tiếp (Phiên 39)
  try { initCoach(hud); } catch (e) { console.warn('[Diệu Giang Tự] Hướng dẫn lần đầu lỗi:', e && e.message); }   // Phiên 70: màn hướng dẫn lần đầu 3 bước có mũi tên
  try { initSkill(hud, { toast, getSen: () => wallet.sen, spendSen: spendMerit }); } catch (e) { console.warn('[Diệu Giang Tự] Kỹ năng lỗi:', e && e.message); }   // Khinh thân: phím Space / nút Nhảy khi đã mở bậc 1 (Phiên 4)
  try { initBag(hud); } catch (e) { console.warn('[Diệu Giang Tự] Túi đồ lỗi:', e && e.message); }   // Phiên 62
  try { initCarry({ toast }); } catch (e) { console.warn('[Diệu Giang Tự] Khiêng/ném lỗi:', e && e.message); }   // Phiên 63: sức mạnh, khiêng và ném vật nặng
  try { initThietDau({ toast }); } catch (e) { console.warn('[Diệu Giang Tự] Thiết đầu công lỗi:', e && e.message); }   // Phiên 90
  try { initNpcThrow({ toast }); } catch (e) { console.warn('[Diệu Giang Tự] Ném NPC lỗi:', e && e.message); }   // Phiên 89
  try { initThrowPlayer({ toast }); } catch (e) { console.warn('[Diệu Giang Tự] Ném người lỗi:', e && e.message); }   // Phiên 72: ném người chơi khác qua mạng
  try { initSwim({ toast, addSen: addMerit }); } catch (e) { console.warn('[Diệu Giang Tự] Bơi lặn lỗi:', e && e.message); }   // Phiên 87: bơi, lặn, ngọc trai
  try { initYeuQuai(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Yêu quái lỗi:', e && e.message); }   // Phiên 64: yêu quái mỗi tháng một lần
  try { initDock(hud, { toast }); } catch (e) { console.warn('[Diệu Giang Tự] Cụm nút lỗi:', e && e.message); }   // Phiên 62: cụm nút thao tác góc phải-dưới

  // ---- bản đồ chùa (lối đi tới chương: liên kết #id, stage.js tự bắt và cho nhân vật đi tới)
  const mapBox = $('hm-map');
  $('hm-map-list').innerHTML = mapEntries().map((e) => `<li><a href="#${esc(e.id)}"><span class="n">${esc(e.num)}</span>${esc(e.label)}</a></li>`).join('');
  const openMap = () => { mapBox.hidden = false; mapBox.querySelector('a')?.focus({ preventScroll: true }); };
  const closeMap = () => { mapBox.hidden = true; };
  mapBox.querySelector('.hm-x').addEventListener('click', closeMap);
  mapBox.addEventListener('click', (e) => { if (e.target.closest('a')) closeMap(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mapBox.hidden) closeMap(); });
  try { initMinimap(hud, { toast, onList: openMap, onHelp: () => LGT.tutorial && LGT.tutorial.open() }); } catch (e) { console.warn('[Diệu Giang Tự] Bản đồ nhỏ lỗi:', e && e.message); }   // bản đồ nhỏ + bản đồ lớn (Phiên 39)

  // ---- hành động theo kết quả logic
  async function share() {
    const data = { title: 'Diệu Giang Tự', text: 'Chùa Việt 3D — đi bộ, thắp nhang, xem ngày', url: location.href.split('#')[0] };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(data.url); toast('Đã chép liên kết chùa. Dán gửi bạn bè nhé.'); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    toast('Liên kết chùa: ' + data.url, 7000);
  }
  function press(item) {
    const r = pressResult(item);
    if (r.kind === 'soon') return toast(r.text, 3200);
    if (r.kind === 'map') { if (LGT.minimap) { closeMap(); return LGT.minimap.toggleBig(); } return mapBox.hidden ? openMap() : closeMap(); }   // Phiên 39: bản đồ lớn có chấm; danh sách điểm đến cũ mở từ nút trong bản đồ
    if (r.kind === 'help') return LGT.tutorial ? LGT.tutorial.toggle() : toast(HELP_TEXT, 8000);   // Phiên 39: sổ tay hướng dẫn
    if (r.kind === 'share') return share();
    if (r.kind === 'bow' || r.kind === 'meditate') {
      if (LGT.panelOpen || !LGT.world) return;
      const ok = r.kind === 'bow' ? LGT.world.bow() : LGT.world.meditate();
      if (ok === 'outside') toast(OUTSIDE_TEXT, 4500); else if (ok === false) toast('Bạn đang bận, thử lại sau một chút nhé.', 2500); else if (ok) {
        if (LGT.act) LGT.act(r.kind === 'bow' ? 'bow' : 'thien');
        if (r.kind === 'bow' && LGT.merit && LGT.merit.reward) LGT.merit.reward('lay', DEN_MERIT.lay);   // Phiên 49 (mục 1.5): lạy Phật được hạt sen, trần 10 lần/ngày
      }
      return;
    }
    if (r.kind === 'beads' || r.kind === 'chant') return practice.open(r.kind);
    if (r.kind === 'chat') return chat.toggle();
    if (r.kind === 'quest') return quest.toggle();
    if (r.kind === 'bag') return (!LGT.inHouse && LGT.bag) ? LGT.bag.open() : LGT.furni ? LGT.furni.openBag() : toast('Túi đồ chưa sẵn sàng.', 2500);   // Phiên 62: ngoài nhà → xem đồ đang có
    if (r.kind === 'shop') return LGT.furni ? LGT.furni.openShop() : toast('Cửa hàng chưa sẵn sàng.', 2500);
    if (r.kind === 'fish') return LGT.fishing ? LGT.fishing.open('cast') : toast('Câu cá chưa sẵn sàng.', 2500);
    if (r.kind === 'le') return den.openLe();
    if (r.kind === 'den') return den.openDen();
    if (r.kind === 'goto') {
      if (LGT.panelOpen) return;
      const a = el('a'); a.href = '#' + r.id; document.body.appendChild(a); a.click(); a.remove();   // cùng đường với menu cũ: stage.go
    }
  }

  const mkBtn = (item, cls, withLabel) => {
    const b = el('button', cls + (isReady(item) ? '' : ' soon') + (item.locked ? ' locked' : ''));
    b.type = 'button'; b.dataset.id = item.id; b.setAttribute('aria-label', ariaLabel(item)); b.title = isReady(item) ? item.label : item.label + ' — sắp có';
    if (!isReady(item)) b.setAttribute('aria-disabled', 'true');
    b.innerHTML = svg(item.icon) + (withLabel ? `<span>${esc(item.label)}</span>` : '');
    if (cls === 'hm-ic') {   // Phiên 69: chữ dưới nút tròn (máy tính) + nhấn giữ báo tên (điện thoại)
      b.insertAdjacentHTML('beforeend', `<span class="hm-ic-tx" aria-hidden="true">${esc(captionOf(item))}</span>`);
      let hold = 0, held = false;
      const stop = () => { clearTimeout(hold); hold = 0; };
      b.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; held = false; stop(); hold = setTimeout(() => { held = true; toast(isReady(item) ? item.label : item.label + ' — sắp có', 2200); }, LONG_PRESS_MS); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave', 'pointermove']) b.addEventListener(ev, stop);
      b.addEventListener('click', (e) => { if (held) { held = false; e.preventDefault(); return; } press(item); });
      return b;
    }
    b.addEventListener('click', () => press(item));
    return b;
  };
  TOP_ICONS.forEach((it) => $('hm-icons').appendChild(mkBtn(it, 'hm-ic', false)));
  ACTIONS.forEach((it) => $('hm-grid').appendChild(mkBtn(it, 'hm-act', true)));
  BOTTOM_MENU.forEach((it) => $('hm-bar').appendChild(mkBtn(it, 'hm-mi', true)));

  // ---- nút "Đứng dậy": chỉ hiện khi đang ngồi/thiền (thăm dò nhẹ, giống nút Vào chánh điện)
  const standBtn = $('hm-stand');
  standBtn.addEventListener('click', () => { LGT.world && LGT.world.stand(); standBtn.hidden = true; });
  setInterval(() => { const m = LGT.world && LGT.world.mode; const sit = m === 'sit' || m === 'meditate'; if (standBtn.hidden === sit) standBtn.hidden = !sit; }, 250);

  const welcome = () => {
    toast(WELCOME_TEXT, 9000);
    setTimeout(() => { if (LGT.loc && LGT.loc.active()) toast('Đi tới gần hoa sen vàng phát sáng trong sân để nhận lộc.', 7000); }, 9800);   // gợi ý như ảnh mẫu
  };
  return { toast, welcome, closeMap };
}
