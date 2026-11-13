// Lễ Khai Ngộ trong game (G2.4b, GDD v2 mục 5.2): đủ Tu Vi 10 → ngồi vào 1 trong 5 bồ đoàn Ngũ Hành (hàng gần bàn thờ, có màu) → bảng nhỏ
// hiện Hệ đang ngồi + đếm 60 giây dùng thử Skill 1 → "Chọn Hệ này" (lần đầu miễn phí; đổi sang Hệ khác tốn 20 lá bồ đề, TẠM).
// Logic thuần: js/world/khaiNgo.js, js/world/heSeats.js (có test). File này chỉ lo giao diện + ghi localStorage['lgt.he'] + trừ lá bồ đề qua LGT.merit.spendLa.
// Đặt LGT.he (Hệ đã chọn hoặc null) và phát sự kiện window 'lgt:he' { he, reset }. Chưa có thanh skill để bấm đánh quái (G2.5), nên Hệ mới mới dùng thử được ở đây.
import { createKhaiNgo, canKhaiNgo, loadHe } from '../world/khaiNgo.js';
import { KHAI_NGO } from '../data/skillCfg.js';
import { heAt, heLabel } from '../world/heSeats.js';
import { effLevel } from '../world/heQuest.js';
import { levelOf } from '../world/quests.js';

const SIT = ['sit', 'meditate'];
const WHY = { 'chua-du-tu-vi': 'Chưa đủ Tu Vi.', 'het-gio': 'Đã hết 60 giây dùng thử.', 'hoi-chieu': 'Kỹ năng đang hồi chiêu.', 'chua-ngoi': 'Hãy ngồi vào bồ đoàn trước.' };

export function initKhaiNgo({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const nowSec = () => performance.now() / 1000;
  const readHe = () => { try { return loadHe(localStorage.getItem(KHAI_NGO.heKey)); } catch (_) { return null; } };
  LGT.he = readHe();

  const st = document.createElement('style');
  st.textContent = '#kn-box{position:fixed;left:50%;transform:translateX(-50%);top:max(64px,calc(env(safe-area-inset-top) + 56px));z-index:12;max-width:min(92vw,360px);padding:10px 12px;border-radius:12px;background:rgba(30,22,12,.92);color:#f6e7c1;font:14px/1.4 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.4);text-align:center}#kn-box[hidden]{display:none}#kn-box b{display:block;font-size:15px;margin-bottom:2px}#kn-box .kn-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px}#kn-box button{min-height:40px;padding:6px 12px;border-radius:10px;border:1px solid #d9b25f;background:#4a3418;color:#f6e7c1;font:inherit}#kn-box button.kn-ok{background:#d9b25f;color:#2a1c08}';
  document.head.appendChild(st);
  const box = document.createElement('section'); box.id = 'kn-box'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Lễ Khai Ngộ');
  const title = document.createElement('b'), info = document.createElement('div'), row = document.createElement('div'); row.className = 'kn-row';
  const mk = (txt, cls) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; if (cls) b.className = cls; return b; };
  const bTry = mk('Dùng thử'), bOk = mk('Chọn Hệ này', 'kn-ok'), bUp = mk('Đứng dậy');
  row.append(bTry, bOk, bUp); box.append(title, info, row); document.body.appendChild(box);

  let ng = null, seatHe = null, warned = null;
  const capNow = () => { try { if (LGT.capHieuDung) return LGT.capHieuDung(); } catch (_) { /* dùng cách dự phòng */ } return effLevel(LGT.farm ? LGT.farm.tuvi : 0, levelOf(LGT.quests && LGT.quests.prog ? LGT.quests.prog.xp : 0).lv); };
  const hide = () => { box.hidden = true; };
  const leaves = () => { const l = LGT.merit && LGT.merit.leaf; return l && Number.isFinite(+l.la) ? +l.la : 0; };

  function refresh() {
    if (!ng || ng.state !== 'trial') { hide(); return; }
    const left = Math.ceil(ng.trialLeft(nowSec())), sk = ng.trialSkill(), cur = readHe();
    title.textContent = `Bồ đoàn ${heLabel(ng.seatHe)}`;
    const cost = cur && cur !== ng.seatHe ? KHAI_NGO.taiKhaiLa : 0;
    info.textContent = (left > 0 ? `Dùng thử còn ${left} giây. ` : 'Hết giờ dùng thử. ') + (cur === ng.seatHe ? 'Bạn đã thuộc Hệ này.' : cost ? `Đổi Hệ tốn ${cost} lá bồ đề (bạn có ${leaves()}).` : 'Chọn Hệ lần đầu: miễn phí.');
    bTry.textContent = sk ? `Dùng thử: ${sk.ten}` : 'Dùng thử'; bTry.disabled = left <= 0;
    bOk.disabled = cur === ng.seatHe;
    box.hidden = false;
  }

  bTry.addEventListener('click', () => {
    if (!ng) return;
    const r = ng.tryTrial(nowSec());
    if (r.ok) toast(`${r.skill && r.skill.ten ? r.skill.ten : 'Kỹ năng'}! (dùng thử, hệ số ${r.heSo})`, 2200);
    else toast(r.reason === 'hoi-chieu' ? `Đang hồi chiêu, còn ${Math.ceil(r.left || 0)} giây.` : (WHY[r.reason] || 'Chưa dùng được.'), 2200);
  });
  bOk.addEventListener('click', () => {
    if (!ng) return;
    const r = ng.confirm({ laBoDe: leaves() });
    if (!r.ok) { toast(r.reason === 'thieu-la' ? `Cần ${r.need} lá bồ đề để đổi Hệ (bạn có ${r.have}).` : r.reason === 'cung-he' ? 'Bạn đã thuộc Hệ này rồi.' : (WHY[r.reason] || 'Chưa chọn được.'), 3200); return; }
    if (r.cost > 0 && !(LGT.merit && LGT.merit.spendLa(r.cost))) { toast('Không trừ được lá bồ đề, chưa đổi Hệ.', 3200); return; }
    try { localStorage.setItem(KHAI_NGO.heKey, r.he); } catch (_) { /* chế độ riêng tư: vẫn đặt trong phiên */ }
    LGT.he = r.he;
    try { window.dispatchEvent(new CustomEvent('lgt:he', { detail: { he: r.he, reset: r.reset } })); } catch (_) { /* bỏ qua */ }
    try { if (LGT.act) LGT.act('khaingo'); } catch (_) { /* nhiệm vụ gia nhập phái */ }
    toast(`Lễ Khai Ngộ xong: bạn thuộc ${heLabel(r.he)}.${r.reset ? ' Kỹ năng về cấp 1.' : ''}`, 4500);
    hide();
  });
  bUp.addEventListener('click', () => { if (LGT.world && LGT.world.stand) LGT.world.stand(); });

  function tick() {
    const w = LGT.world, h = w && SIT.includes(w.mode) ? heAt(w.pos) : null;
    if (!h) { if (ng) { ng.standUp(); ng = null; } seatHe = null; warned = null; hide(); return; }
    const tuvi = capNow();   // Phiên 143: cấp hiệu dụng = max(Tu Vi, cấp công hạnh) — thấy "Cấp 10" là gia nhập phái được
    if (!canKhaiNgo(tuvi)) { if (warned !== h) { warned = h; toast(`Cần cấp ${KHAI_NGO.tuViMin} để gia nhập phái (bạn cấp ${tuvi}). Đánh quái ở bãi rừng hoặc làm nhiệm vụ để lên cấp.`, 5500); } return; }
    if (!ng) { ng = createKhaiNgo({ tuvi, he: readHe() }); seatHe = null; }
    if (ng.state === 'done') { hide(); return; }
    if (seatHe !== h) { const r = ng.sit(h, nowSec()); if (r.ok) seatHe = h; }
    refresh();
  }
  setInterval(tick, 400);
  LGT.khaiNgo = { get he() { return LGT.he; }, get open() { return !box.hidden; } };
}
