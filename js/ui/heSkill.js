// Thanh CHIÊU CỦA PHÁI (Phiên 141): sau Lễ Khai Ngộ (js/ui/khaiNgo.js) người chơi có Hệ → hiện 3 nút chiêu (ô 1, 2, 3) phía trên cụm nút góc phải-dưới.
// Chiêu gây sát thương (heSo > 0) đánh quái gần nhất qua LGT.farm.skillHit; chiêu hỗ trợ (heSo = 0: khiên, hồi máu, ẩn thân…) tung được từ Phiên 184 (hiệu lực có giờ trên nút, không cần quái).
// Bộ máy hồi chiêu / cấp chiêu: js/world/skillEngine.js; dữ liệu: js/data/combatSkills.js (TẠM). Phím tắt máy tính: Q, W, E. Mọi chữ qua textContent.
// Phiên 163: TU VỄ LÀ ĐỂ TĂNG CẤP CHIÊU — cấp mỗi chiêu tự theo Tu Vị (js/ui/farm.js): cấp = Tu Vị ÷ 10 (tối thiểu 1, tối đa 10, skillLevelCap ở skillEngine.js); mỗi cấp +6% hệ số sát thương. Trước đây không chỗ nào nâng cấp nên chiêu luôn ở cấp 1. Nút chiêu hiện "Lv N"; giữ nhấn xem bảng thông tin cũng theo cấp này.
// Phiên 184: CHIÊU HỖ TRỢ TUNG ĐƯỢC THẬT (trước chỉ báo "sắp có"): bấm là hồi chiêu + tư thế/hiệu ứng 3D theo id chiêu + "hiệu lực" có giờ hiện trên nút (js/world/skillBuff.js); không cần quái ở gần. Tăng sát thương thật cho Cuồng Long Phẫn Nộ (LGT.buffMul, nhân vào đòn ở js/ui/farm.js). Nút rung khi chưa dùng được; thanh chiêu báo chiều cao qua --hs-h để bong bóng chỉ chỗ của cụm nút không bị đè.
// Phiên 182 (mục 2): NÚT CHIÊU BẤM ĐƯỢC — .hud có pointer-events:none (css/hud.css) và thuộc tính này KẾ THẪA xuống con, trước đây #hs-bar không tự bật lại nên mọi cú chạm xuyên qua. Thêm pointer-events:auto cho #hs-bar, .hs-b, #hs-pm. Nút to hơn (biến --hs-s, mặc định 60px — mục 3 sẽ cho người chơi chỉnh), biểu tượng có nền đặc + màu Hệ + hoạ tiết trắng + chữ lớn, tên chiêu nằm ở đáy nút.
// Phiên 185 (kế hoạch hiệu ứng 3D, bước 1): HIỆU ỨNG 3D KHI ĐÁNH QUÁI THẬT. Trước đây createChieuFx (js/scene/chieuFx.js: vùng cảnh báo, lõi sáng, lửa/băng/kim, hạt, vệt, quầng, decal, tiếng) chỉ được nối trong Võ đường luyện chiêu (js/ui/luyenChieu.js); ngoài bãi rừng bấm chiêu chỉ có tư thế + chữ nên "không thấy hiệu ứng gì". Giờ pose() quay mặt về quái đang nhắm, làm tư thế, rồi gọi cfx.cast với vị trí người chơi + vị trí quái (đọc từ LGT.farmView). Bộ hiệu ứng nạp lười (một lần, sau khi LGT.scene sẵn sàng); nạp/dựng lỗi thì chiêu vẫn đánh được như cũ. CHƯA nhìn bằng mắt (môi trường AI không có WebGL).
// Phiên 195 (mục 2): KHU LUYỆN TẬP — nút chiêu theo HỆ ĐANG TẬP (LGT.luyenChieu.he) thay vì Hệ người chơi (lệch Hệ thì bấm không ra chiêu); không cần runtime chiêu của người chơi; xem thông tin giữ-nhấn cũng theo Hệ đang tập.
// Phiên 191 (Mục 1): (a) SỬA LỖI paint(): biến `locked` bị dùng trước khi khai báo (const → ReferenceError mỗi 150 ms, nút chiêu không vẽ được tên/hình/hồi chiêu); (b) thanh chiêu HIỆN CẢ Ở KHU LUYỆN TẬP — cùng một cụm nút với ngoài bãi rừng / trong chùa (trước đây bị ẩn và thay bằng hàng nút riêng).
import { createSkillRuntime, skillLevelCap } from '../world/skillEngine.js';
import { skillFor, phapMonOfHe } from '../world/skillCatalog.js';
import { SKILL_CAP } from '../data/combatSkills.js';
import { effLevel } from '../world/heQuest.js';
import { levelOf } from '../world/quests.js';
import { loadHe } from '../world/khaiNgo.js';
import { KHAI_NGO } from '../data/skillCfg.js';
import { createBuffs, buffNote } from '../world/skillBuff.js';   // Phiên 184: hiệu lực chiêu hỗ trợ
import { infoOf, infoRows, iconSpec, glyphOf, HE_COLOR } from '../world/chieuInfo.js';   // Phiên 162: biểu tượng + bảng giữ-để-xem
import { tierOf } from '../world/chieuFxPlan.js';
import { drawGlyphIcon } from './skillIcon.js';   // Phiên 189: hình chiêu dùng chung với khu luyện tập   // Phiên 185: bậc máy (cao / vừa / yếu) cho hiệu ứng 3D

// Phiên 180: đủ 5 ô — 1, 2, 3 (Q, W, E) + ô 4 = Pháp Môn (T, mở cấp 30, chọn 1 trong 2 Pháp Môn của Hệ) + Tuyệt Học (Y, mở cấp 60, tiêu 5 Tâm Ấn).
const SLOTS = [1, 2, 3, 4, 'tuyet'], KEYS = { 1: 'KeyQ', 2: 'KeyW', 3: 'KeyE', 4: 'KeyT', tuyet: 'KeyY' }, KEYTXT = { 1: 'Q', 2: 'W', 3: 'E', 4: 'T', tuyet: 'Y' }, PM_KEY = 'lgt.phapmon';   // lgt.* tự đồng bộ theo tài khoản   // Phiên 159c: chiêu phái = Q, W, E (R = Thương ở farm.js; 1–5 = ô nút trong dock)
const WHY = { 'khong-quai': 'Chưa có quái nào gần. Ra bãi rừng rồi dùng chiêu.', xa: 'Quái còn xa, lại gần hơn rồi dùng chiêu.' };
const HOLD_MS = 380, SVGNS = 'http://www.w3.org/2000/svg';   // giữ ≥ 380 ms = xem thông tin (không tung chiêu); chạm nhanh = tung chiêu
const isEditable = (t) => !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function initHeSkill(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const nowSec = () => performance.now() / 1000;
  const capCH = () => levelOf(LGT.quests && LGT.quests.prog ? LGT.quests.prog.xp : 0).lv;
  const eff = () => effLevel(LGT.farm ? LGT.farm.tuvi : 0, capCH());
  LGT.capHieuDung = eff;   // cấp hiệu dụng = max(Tu Vị, Cấp công hạnh) — dùng cho Lễ Khai Ngộ, nhiệm vụ gia nhập phái, ô chiêu
  const tuViNow = () => (LGT.farm ? LGT.farm.tuvi : 0);   // Phiên 163: cấp chiêu chỉ theo Tu Vị (không tính cấp công hạnh)

  let rt = null, he = null, pm = null;
  const buffs = createBuffs(); LGT.buffMul = () => buffs.damageMul(nowSec());   // Phiên 184: farm.js nhân hệ số này vào mọi đòn đánh quái
  const nope = (slot) => { const e = btns[slot]; if (!e) return; e.b.classList.remove('hs-no'); void e.b.offsetWidth; e.b.classList.add('hs-no'); setTimeout(() => e.b.classList.remove('hs-no'), 460); };   // rung nút khi chưa dùng được
  const currentPm = (h) => { try { const id = localStorage.getItem(PM_KEY); return phapMonOfHe(h).some((p) => p.id === id) ? id : null; } catch (_) { return null; } };
  const currentHe = () => { try { return loadHe(localStorage.getItem(KHAI_NGO.heKey)); } catch (_) { return LGT.he || null; } };
  function sync() {
    const h = LGT.he || currentHe();
    const npm = h ? currentPm(h) : null;
    if (h !== he || !rt) { he = h; pm = npm; rt = he ? createSkillRuntime({ he, phapMon: pm, tuvi: eff() }) : null; }
    else if (npm !== pm) { pm = npm; rt.setHe(he, pm); }   // cùng Hệ: chỉ đổi Pháp Môn, giữ cấp chiêu
    if (rt) {
      rt.setTuVi(eff());
      const lv = Math.max(1, skillLevelCap(tuViNow()));   // Phiên 163: Tu Vị tăng → cấp chiêu tăng (setLevel không bao giờ hạ cấp)
      for (const s of SLOTS) { const sk = skillFor(he, s, pm); if (sk) rt.setLevel(sk.id, lv); }
    }
  }

  const st = document.createElement('style');
  st.textContent = '#hs-bar{--hs-s:calc(var(--btn-k,1) * clamp(64px,11vmin,92px));position:fixed;z-index:9;display:flex;flex-wrap:wrap-reverse;justify-content:flex-end;gap:8px;max-width:calc(var(--hs-s) * 3 + 24px);gap:12px;right:12px;bottom:200px;touch-action:none;pointer-events:auto}#hs-pm{pointer-events:auto;position:fixed;z-index:13;left:50%;top:50%;transform:translate(-50%,-50%);width:min(340px,90vw);padding:14px;border-radius:14px;border:1px solid rgba(241,219,159,.8);background:rgba(28,19,9,.97);color:#f6e7c1;font:13px/1.4 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.6)}#hs-pm[hidden]{display:none}#hs-pm h4{margin:0 0 8px;font-size:15px}#hs-pm button{display:block;width:100%;margin:6px 0 0;padding:10px;border-radius:10px;border:1px solid rgba(241,219,159,.6);background:rgba(60,42,20,.9);color:#fff;text-align:left;font:inherit;cursor:pointer}#hs-pm button small{display:block;opacity:.75}#hs-pm .x{text-align:center;background:transparent}#hs-bar[hidden]{display:none}'
    + '.hs-b{pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 3px 10px rgba(0,0,0,.55);position:relative;width:var(--hs-s);height:var(--hs-s);border-radius:50%;border:3px solid rgba(241,219,159,.85);background:rgba(22,15,8,.96);color:#f6e7c1;font:600 11px/1.15 system-ui,sans-serif;padding:2px;cursor:pointer;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}'
    + '.hs-b .hs-k{display:none}   /* Phiên 189: không hiện chữ Q/W/E/T/Y trên nút (phím tắt máy tính vẫn dùng được) */.hs-b.lock,.hs-b.soon{opacity:.6}.hs-b:active{transform:scale(.92)}.hs-b .hs-cdn{position:absolute;z-index:3;inset:0;display:none;align-items:center;justify-content:center;font:800 calc(var(--hs-s)*.36)/1 system-ui,sans-serif;color:#fff;text-shadow:0 0 4px #000,0 1px 3px #000;pointer-events:none}.hs-b.hs-cd .hs-cdn{display:flex}.hs-b .hs-lock{position:absolute;z-index:3;right:2px;bottom:calc(var(--hs-s)*.28);font-size:calc(var(--hs-s)*.22);line-height:1;filter:drop-shadow(0 1px 2px #000);pointer-events:none}.hs-b.hs-cd::after{content:"";position:absolute;left:0;right:0;bottom:0;height:calc(var(--cd,0)*100%);background:rgba(0,0,0,.55)}'
    + '.hs-b svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.hs-b .hs-n{position:absolute;z-index:1;left:50%;bottom:4px;transform:translateX(-50%);max-width:96%;padding:0 5px;border-radius:8px;background:rgba(0,0,0,.7);font-size:calc(var(--hs-s)*.15);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000}.hs-b.hs-empty .hs-n{position:static;transform:none;background:none;font-size:11px;white-space:normal;max-width:none}'
    + '.hs-b .hs-lv{position:absolute;z-index:2;left:8px;top:2px;font-size:calc(var(--hs-s)*.16);font-weight:700;color:#ffe08a;text-shadow:0 1px 2px #000;pointer-events:none}'
    + '#hs-tip{position:fixed;z-index:12;max-width:min(300px,86vw);padding:9px 11px;border-radius:10px;border:1px solid rgba(241,219,159,.8);background:rgba(28,19,9,.96);color:#f6e7c1;font:12px/1.4 system-ui,sans-serif;pointer-events:none;box-shadow:0 4px 18px rgba(0,0,0,.55)}#hs-tip[hidden]{display:none}#hs-tip h4{margin:0 0 4px;font-size:14px}#hs-tip .r{margin:2px 0}#hs-tip .r b{color:#f1db9f;font-weight:600}'
    + '.hs-b.hs-on{box-shadow:0 0 0 3px rgba(255,224,138,.95),0 0 16px rgba(255,224,138,.75)}.hs-b.hs-no{animation:hsno .42s}@keyframes hsno{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}@media (prefers-reduced-motion:reduce){.hs-b.hs-no{animation:none}}'
    + '.hs-b.he-kim{border-color:#dfe3e8}.hs-b.he-moc{border-color:#3f9b4a}.hs-b.he-thuy{border-color:#2f6fd0}.hs-b.he-hoa{border-color:#d9432b}.hs-b.he-tho{border-color:#c9a227}';
  document.head.appendChild(st);
  const bar = document.createElement('div'); bar.id = 'hs-bar'; bar.hidden = true; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Chiêu của phái'); hud.appendChild(bar);
  // Biểu tượng chiêu: nền màu Hệ + hoa văn theo vùng báo + chữ cái; toàn bộ vẽ bằng SVG (createElementNS), không innerHTML.
  const el = (n, a, p) => { const e = document.createElementNS(SVGNS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  // Phiên 187: HÌNH thật cho mỗi chiêu (khiên, hồi máu, ẩn thân, tia, lao, chém, vùng...) theo glyphOf(id) — không còn chỉ là hai chữ cái. Vẽ hai lớp (viền đen dày + nét trắng) để thấy rõ trên mọi nền.
  function drawIcon(id, dim) {
    const ic = iconSpec(id); if (!ic) return el('svg', { viewBox: '0 0 54 54', 'aria-hidden': 'true' });
    return drawGlyphIcon(ic.mau, glyphOf(id), ic.tuyet, dim);
  }
  const tip = document.createElement('div'); tip.id = 'hs-tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip'); hud.appendChild(tip);
  // Chọn Pháp Môn (ô 4): hiện khi chạm ô 4 đã mở mà chưa chọn. Lưu ở localStorage (lgt.phapmon).
  const pmBox = document.createElement('div'); pmBox.id = 'hs-pm'; pmBox.hidden = true; pmBox.setAttribute('role', 'dialog'); hud.appendChild(pmBox);
  function openPm() {
    sync(); if (!he) return; pmBox.textContent = '';
    const h = document.createElement('h4'); h.textContent = 'Chọn Pháp Môn (chiêu 4)'; pmBox.appendChild(h);
    for (const p of phapMonOfHe(he)) {
      const sk = skillFor(he, 4, p.id), b = document.createElement('button'), s = document.createElement('small'); b.type = 'button';
      b.textContent = p.ten; s.textContent = `${p.vaiTro}${sk ? ' · chiêu: ' + sk.ten : ''}`; b.appendChild(s);
      b.addEventListener('click', () => { try { localStorage.setItem(PM_KEY, p.id); } catch (_) { /* bỏ qua */ } pmBox.hidden = true; sync(); paint(); toast(`Đã chọn ${p.ten}.`, 2200); });
      pmBox.appendChild(b);
    }
    const x = document.createElement('button'); x.type = 'button'; x.className = 'x'; x.textContent = 'Để sau'; x.addEventListener('click', () => { pmBox.hidden = true; }); pmBox.appendChild(x);
    pmBox.hidden = false;
  }
  function showTip(slot) {
    sync(); const sk = skillShown(slot); if (!sk) return false;   // Phiên 195: ở khu luyện tập xem thông tin theo Hệ đang tập
    const info = infoOf(sk.id, { tuvi: eff(), level: rt && !inLuyen() ? rt.effectiveLevel(sk.id) : 1 }); if (!info) return false;
    tip.textContent = ''; const h = document.createElement('h4'); h.textContent = info.ten; tip.appendChild(h);
    for (const [k, v] of infoRows(info)) { const r = document.createElement('div'), b = document.createElement('b'); r.className = 'r'; b.textContent = k + ': '; r.append(b, document.createTextNode(v)); tip.appendChild(r); }
    tip.hidden = false; const bb = bar.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - tw - 8, bb.right - tw)) + 'px'; tip.style.top = Math.max(8, bb.top - th - 8) + 'px'; return true;
  }
  const hideTip = () => { tip.hidden = true; };
  const btns = {};
  for (const s of SLOTS) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.slot = String(s);
    const t = document.createElement('span'), k = document.createElement('span'), lvEl = document.createElement('span'), cdn = document.createElement('span'), lk = document.createElement('span'); cdn.className = 'hs-cdn'; lk.className = 'hs-lock'; lk.hidden = true; lk.textContent = '🔒'; k.className = 'hs-k'; k.textContent = KEYTXT[s]; t.className = 'hs-n'; lvEl.className = 'hs-lv';
    b.append(t, k, lvEl, cdn, lk); let timer = 0, held = false, icoId = '';
    const stop = () => { clearTimeout(timer); timer = 0; if (held) hideTip(); };
    b.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) { /* bỏ qua */ } held = false; clearTimeout(timer); timer = setTimeout(() => { timer = 0; held = showTip(s); }, HOLD_MS); });   // Phiên 178: giữ con trỏ trên nút → ngón hơi trượt (đang vừa chạy vừa bấm) cũng không bị hủy cú bấm
    b.addEventListener('pointerup', () => { const was = held, pend = !!timer; stop(); if (!was && pend) cast(s); held = false; });
    b.addEventListener('pointercancel', () => { stop(); held = false; });   // Phiên 178: bỏ pointerleave (đã giữ con trỏ bằng setPointerCapture nên nhả tay ở đâu cũng về nút này)
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    bar.appendChild(b); btns[s] = { b, t, lv: lvEl, cdn, lk, get ico() { return icoId; }, set ico(v) { icoId = v; } };
  }

  // Phiên 185: HIỆU ỨNG 3D (js/scene/chieuFx.js) cho chiêu đánh quái thật. Nạp lười MỘT lần khi LGT.scene sẵn sàng (paint() gọi mỗi 150 ms); lỗi nạp/dựng thì cfx = null và chiêu vẫn đánh được như cũ.
  let cfx = null, cfxTried = false;
  function fxReady() {
    if (cfx || cfxTried || !LGT.scene) return;
    cfxTried = true;
    import('../scene/chieuFx.js').then((m) => {
      cfx = m.createChieuFx(LGT.scene, { getTier: () => tierOf(LGT.perfLevel), onShake: (c) => { try { LGT.camFeel && LGT.camFeel.rung(c); } catch (_) { /* bỏ qua */ } }, onHitStop: (g) => { try { LGT.camFeel && LGT.camFeel.khung(g); } catch (_) { /* bỏ qua */ } } });
    }).catch((e) => { cfx = null; console.warn('[Diệu Giang Tự] Hiệu ứng chiêu 3D lỗi:', e && e.message); });
  }
  // Quái đang bị nhắm = quái js/ui/farm.js đặt vào LGT.farmView.target (uid). Đọc TRƯỚC khi gây sát thương vì đòn kết liễu sẽ gỡ quái khỏi danh sách.
  const targetNow = () => { try { const v = LGT.farmView, m = v && v.target && v.mons && v.mons.find((x) => x.uid === v.target); return m && Number.isFinite(+m.x) && Number.isFinite(+m.z) ? { x: +m.x, z: +m.z } : null; } catch (_) { return null; } };
  function fxCast(sk, tg) {
    try {
      const W = LGT.world, p = W && W.pos; if (!cfx || !p) return;
      const ry = tg ? Math.atan2(tg.x - p.x, tg.z - p.z) : (W.facing || 0);
      cfx.cast(sk.id, { x: p.x, z: p.z, ry, tx: tg ? tg.x : null, tz: tg ? tg.z : null });
    } catch (_) { /* hiệu ứng hỏng thì thôi, chiêu vẫn đánh */ }
  }

  const failText = (sk, r) => (r.reason === 'hoi-chieu' ? `${sk.ten} đang hồi chiêu, còn ${Math.ceil(r.left || 0)} giây.` : r.reason === 'tam-an' ? `${sk.ten} cần ${r.need} Tâm Ấn (bạn có ${r.have}). Ra đòn trúng quái để tích Tâm Ấn.` : 'Chưa dùng được chiêu này.');
  function pose(sk, tg) {   // Phiên 162: tư thế gồng → phát → thu (+ hiệu ứng 3D theo id chiêu); Phiên 185: quay mặt về quái rồi dựng hiệu ứng 3D tại chỗ
    try { const W = LGT.world, av = W && W.avatar, p = W && W.pos; if (tg && W && W.face && p) W.face(Math.atan2(tg.x - p.x, tg.z - p.z)); if (av && typeof av.cast === 'function') av.cast(sk.id); } catch (_) { /* bỏ qua */ }
    fxCast(sk, tg);
  }
  // Phiên 184: chiêu HỖ TRỢ (khiên, giáp, hồi sinh, ẩn thân, khống chế...) tung được THẬT, không cần quái ở gần.
  function castSupport(slot, sk) {
    const r = rt.tryCast(slot, nowSec()); if (!r.ok) { toast(failText(sk, r), 2200); nope(slot); return false; }
    buffs.start(sk, slot, nowSec()); pose(sk, null);
    toast(buffNote(sk, r.level), 3200); if (LGT.sfx) LGT.sfx.play('tu-dong-bat'); if (LGT.act) LGT.act('dungchieu');
    return true;
  }
  // Phiên 187: Ở KHU LUYỆN TẬP (js/ui/luyenChieu.js) nút chiêu dùng được luôn trên mộc nhân — không khóa cấp, không cần quái, không mất gì. Ô 4 chưa chọn Pháp Môn thì tập Pháp Môn đầu của Hệ.
  const inLuyen = () => !!(LGT.luyenChieu && LGT.luyenChieu.inside);
  // Phiên 195 (mục 2): ở khu luyện tập, nút chiêu theo HỆ ĐANG TẬP (LGT.luyenChieu.he, chọn ở bồ đoàn) chứ không theo Hệ của người chơi — trước đây hai Hệ lệch nhau thì id chiêu không có trong danh sách luyện nên bấm không ra chiêu.
  const zoneHe = () => (inLuyen() ? (LGT.luyenChieu.he || null) : null);
  const skillShown = (slot) => {
    const zh = zoneHe();
    if (zh) { const own = currentPm(zh); let sk = skillFor(zh, slot, own); if (!sk && slot === 4) { const f = phapMonOfHe(zh)[0]; sk = f ? skillFor(zh, 4, f.id) : null; } return sk; }
    return skillFor(he, slot, pm);
  };
  function luyenCast(slot) {
    const sk = skillShown(slot), L = LGT.luyenChieu; if (!sk || !L || !L.castById) return false;
    const r = L.castById(sk.id); if (!r) nope(slot); return !!r;
  }
  function cast(slot) {
    sync(); if (inLuyen()) return luyenCast(slot);
    if (!rt) return false;
    // Phiên 190: không có farm thì vẫn tung (không sát thương)
    const sk = skillFor(he, slot, pm);
    if (!sk && slot === 4) { if (eff() < SKILL_CAP[4]) { toast(`Chiêu này mở ở cấp ${SKILL_CAP[4]} (bạn cấp ${eff()}).`, 2400); nope(4); } else openPm(); return false; }
    if (!sk) return false;
    if (eff() < SKILL_CAP[slot]) { toast(`Chiêu này mở ở cấp ${SKILL_CAP[slot]} (bạn cấp ${eff()}).`, 2400); nope(slot); return false; }
    if (!(sk.heSo > 0)) return castSupport(slot, sk);
    const pre = LGT.farm ? LGT.farm.skillReady() : { ok: false, reason: 'khong-quai' };
    const r = rt.tryCast(slot, nowSec());
    if (!r.ok) { toast(failText(sk, r), 2200); nope(slot); return false; }
    if (!pre.ok) {   // Phiên 190: KHÔNG có quái (hoặc quái còn xa) vẫn tung được chiêu: hoạt ảnh + hiệu ứng 3D, hồi chiêu như thật, nhưng KHÔNG gây sát thương, không tích Tâm Ấn
      pose(sk, targetNow()); toast(`${sk.ten}! ${pre.reason === 'xa' ? 'Quái còn xa nên chưa trúng.' : 'Chưa có quái — không gây sát thương ai.'}`, 2200); if (LGT.sfx) LGT.sfx.play('tu-dong-bat'); return true;
    }
    const tg = targetNow();   // Phiên 185: vị trí quái bị nhắm, đọc trước skillHit
    const h = LGT.farm.skillHit(r.heSo);
    pose(sk, tg);
    if (h.ok) { try { rt.onHit(1); } catch (_) { /* bỏ qua */ } toast(`${sk.ten} Lv${r.level}! −${h.dmg} Oán Khí ${h.ten}`, 1800); if (LGT.sfx) LGT.sfx.play('thuong'); if (LGT.act) LGT.act('dungchieu'); }
    return h.ok;
  }

  function paint() {
    sync(); fxReady();
    const showBar = (!!rt || inLuyen()) && !!LGT.world && !LGT.inHouse && !LGT.panelOpen && (LGT.world.mode === 'free'); bar.hidden = !showBar; if (!showBar) { const dk = document.getElementById('dock'); if (dk && dk._hsh) { dk._hsh = 0; dk.style.setProperty('--hs-h', '0px'); } return; }   // Phiên 191: hiện cả ở khu luyện tập (trước đây có thêm điều kiện !inLuyen())
    const dock = document.getElementById('dock');
    if (dock) { const hh = bar.hidden ? 0 : Math.ceil(bar.getBoundingClientRect().height); if (dock._hsh !== hh) { dock._hsh = hh; dock.style.setProperty('--hs-h', hh + 'px'); } }   // Phiên 184
    if (dock && !dock.hidden) { const r = dock.getBoundingClientRect(); if (r.width) { bar.style.right = Math.max(8, Math.round(innerWidth - r.right)) + 'px'; bar.style.bottom = Math.round(innerHeight - r.top + 8) + 'px'; } }
    const hz = zoneHe() || he;   // Hệ hiển thị trên nút
    for (const s of SLOTS) {
      const sk = skillShown(s), bs = btns[s], { b, t, lv, cdn, lk: lkEl } = bs, zone = inLuyen();
      if (!sk) {   // ô 4 chưa chọn Pháp Môn: vẫn hiện nút (khóa tới cấp 30, rồi bấm để chọn)
        if (s !== 4) { b.hidden = true; continue; }
        b.hidden = false; if (bs.ico !== 'chon') { const old = b.querySelector('svg'); if (old) old.remove(); b.insertBefore(drawGlyphIcon(HE_COLOR[hz] || '#f1db9f', 'chon', false, eff() < SKILL_CAP[4]), b.firstChild); bs.ico = 'chon'; } cdn.textContent = ''; lkEl.hidden = true;
        const lk = eff() < SKILL_CAP[4]; t.textContent = lk ? `Cấp ${SKILL_CAP[4]}` : 'Chọn Pháp Môn'; lv.textContent = '';
        lkEl.hidden = !lk; b.className = `hs-b he-${hz}${lk ? ' lock' : ''}${b.classList.contains('hs-no') ? ' hs-no' : ''}`; b.style.setProperty('--cd', '0'); b.setAttribute('aria-label', lk ? `Pháp Môn (mở ở cấp ${SKILL_CAP[4]})` : 'Chọn Pháp Môn'); continue;
      }
      b.hidden = false;
      // Phiên 191: khai báo `locked` TRƯỚC khi dùng (trước đây dùng ở icoKey rồi mới khai báo → ReferenceError mỗi lần vẽ)
      const locked = !zone && eff() < SKILL_CAP[s], zc = zone && LGT.luyenChieu.cdOf ? LGT.luyenChieu.cdOf(sk.id) : null, left = zone ? (zc ? zc.left : 0) : (rt ? rt.cooldownLeft(sk.id, nowSec()) : 0), cdTot = zone ? (zc ? zc.total : 0) : sk.cd, lvNow = rt ? rt.effectiveLevel(sk.id) : 1, on = buffs.left(sk.id, nowSec());
      const icoKey = sk.id + (locked ? ':l' : ''); if (bs.ico !== icoKey) { const old = b.querySelector('svg'); if (old) old.remove(); b.insertBefore(drawIcon(sk.id, locked), b.firstChild); bs.ico = icoKey; }
      lkEl.hidden = !locked; cdn.textContent = left > 0 ? String(Math.ceil(left)) : ''; t.textContent = locked ? `Cấp ${SKILL_CAP[s]}` : sk.ten; lv.textContent = locked ? '' : zone ? 'Tập' : on > 0 ? `${Math.ceil(on)}s` : (s === 'tuyet' ? `${rt.tamAn}/5` : `Lv${lvNow}`);
      b.className = `hs-b he-${hz}${locked ? ' lock' : ''}${on > 0 ? ' hs-on' : ''}${left > 0 ? ' hs-cd' : ''}${b.classList.contains('hs-no') ? ' hs-no' : ''}`;   // giữ lớp rung (paint chạy mỗi 150 ms sẽ xóa mất nếu không)
      b.style.setProperty('--cd', cdTot > 0 ? Math.min(1, left / cdTot).toFixed(3) : '0');
      b.setAttribute('aria-label', `${sk.ten}${locked ? '' : ` cấp ${lvNow}`}${locked ? ` (mở ở cấp ${SKILL_CAP[s]})` : on > 0 ? ` (đang có hiệu lực ${Math.ceil(on)} giây)` : left > 0 ? ' (đang hồi chiêu)' : ''}`);
    }
  }
  addEventListener('keydown', (e) => {
    if (e.repeat || isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey || bar.hidden || LGT.panelOpen) return;
    if (document.querySelector('.st-dlg:not([hidden])') || document.body.classList.contains('edit-mode')) return;
    const s = SLOTS.find((x) => KEYS[x] === e.code); if (s) { e.preventDefault(); cast(s); }
  });
  addEventListener('lgt:he', () => { rt = null; sync(); paint(); });
  setInterval(paint, 150); sync();
  LGT.heSkill = { cast, get he() { return he; }, get ready() { return !!rt; } };
  return LGT.heSkill;
}
