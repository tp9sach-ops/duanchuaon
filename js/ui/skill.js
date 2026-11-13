// Kỹ năng Khinh thân (nhảy): phím Space + nút "Nhảy" trên điện thoại, chỉ hiện khi đã mở bậc 1 từ cốt truyện tưới cây.
// Logic ở js/world/skills.js (có test). File này KHÔNG sửa world.js: nó bọc avatar.update để cộng độ cao nhảy vào vị trí nhân vật sau khi world.js đặt xong mỗi khung hình
// (world.js đặt lại vị trí từ đầu mỗi khung nên không cộng dồn). Đổi tên/áo/kiểu đầu dựng lại nhân vật → bộ đếm 500 ms tự bọc lại.
import { khinhBac, loadKhinh, jumpHeightAt, canJump, createJump, trainPlan, leapPlan, glidePlan, nextAction, LEAP_CFG, GLIDE_CFG, KHINH_YEU_CAU, KHINH_TEN, MAX_BAC } from '../world/skills.js';
import { landing } from '../world/strength.js';
import { levelOf } from '../world/quests.js';

const isEditable = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/** hud: phần tử HUD; opts: { toast(text, ms) }. Trả { get level, jump() }. */
export function initSkill(hud, { toast = () => {}, getSen = () => 0, spendSen = () => false } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const jump = createJump();
  const KEY = 'lgt.khinh';   // Phiên 52: bậc đã luyện (2–8); bậc 1 vẫn do cốt truyện mở
  let luyen = 0; try { luyen = loadKhinh(localStorage.getItem(KEY)); } catch (_) { /* riêng tư */ }
  const saveLuyen = () => { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, bac: luyen })); } catch (_) { /* bỏ qua */ } };
  const level = () => khinhBac(LGT.story && LGT.story.state, luyen);
  const capNguoi = () => levelOf(LGT.quests && LGT.quests.prog ? LGT.quests.prog.xp : 0).lv;
  const dialogOpen = () => !!document.querySelector('.st-dlg:not([hidden])');

  // ---- nút cảm ứng (chỉ màn hình cảm ứng, chỉ khi đã mở kỹ năng)
  const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  let btn = null;
  if (coarse) {
    const st = document.createElement('style');
    st.textContent = '#jump-btn{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(96px,calc(env(safe-area-inset-bottom) + 80px));width:64px;height:64px;border-radius:50%;z-index:9;touch-action:none;border:1px solid rgba(217,178,95,.7);background:rgba(6,7,13,.45);color:#f1dba0;font-size:12px;letter-spacing:.06em;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}#jump-btn[hidden]{display:none}.panel-open #jump-btn{display:none}';
    document.head.appendChild(st);
    btn = document.createElement('button'); btn.id = 'jump-btn'; btn.type = 'button'; btn.textContent = 'Nhảy'; btn.hidden = true; btn.setAttribute('aria-label', 'Nhảy (Khinh thân)');
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); doJump(); });
    document.body.appendChild(btn);
  }

  let lastAirAt = -1e9;   // Phiên 90: lần cuối còn trên không (cho nút Thiết đầu công)
  let speed = 0, glideCd = 0, glideQ = false, lastP = null;   // Phiên 139: tốc độ đi (m/s), hồi chiêu lướt, lướt đang chờ, vị trí khung trước
  function doJump() {
    const W = LGT.world; if (!W) return false;
    if (LGT.swim && LGT.swim.active) return false;   // đang bơi/lặn: không nhảy
    if (LGT.heldBy) return false;   // Phiên 91: đang bị người khác khiêng trên vai
    const lv = level();
    if (!canJump({ level: lv, mode: W.mode, panelOpen: !!LGT.panelOpen, dialogOpen: dialogOpen() })) return false;
    const indoor = !!LGT.inHouse, sinceAir = jump.air ? 0 : (performance.now() - lastAirAt) / 1000;
    const act = nextAction({ lv, air: jump.air, sinceAir, moving: speed > LEAP_CFG.minSpeed, glideCd, indoor });   // Phiên 139: đi + Nhảy = bật tới trước; Nhảy tiếp = lướt né
    if (act === 'glide') { if (W.dashing && glideQ) return false; glideQ = true; return true; }   // lướt ngay khi hết cú bật (xem wrap)
    if (act === 'none') return false;
    const ok = jump.start(jumpHeightAt(lv, indoor));
    if (ok && act === 'leap') { const p = leapPlan(lv, indoor), pos = W.pos, ry = Number.isFinite(W.facing) ? W.facing : 0; if (p && !W.dashing) { const l = landing(pos.x, pos.z, ry, p.dist); if (l.dist > 0.3) W.dash({ x: l.x, z: l.z }, p.dur, { tilt: false }); } }
    if (ok) { if (LGT.sfx) LGT.sfx.play('nhay'); }
    if (ok && LGT.act) LGT.act('khinhthan');   // Phiên 52: nhiệm vụ “Thử Khinh thân” (3 lần nhảy)
    return ok;
  }
  addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat || isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (dialogOpen() || LGT.panelOpen) return;   // Space đang dùng để lật trang hội thoại
    if (e.target && e.target.tagName === 'BUTTON') return;   // Space đang bấm một nút
    if (level() > 0) { e.preventDefault(); doJump(); }
  });

  // ---- bọc avatar.update (mỗi nhân vật chỉ bọc một lần)
  function wrap() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__khinh) return;
    const orig = av.update.bind(av); av.__khinh = true;
    av.update = (dt) => {
      orig(dt); const y = jump.step(dt); if (y > 0 && av.group) av.group.position.y += y; if (jump.air) lastAirAt = performance.now();
      const W = LGT.world, p = W && W.pos; glideCd = Math.max(0, glideCd - Math.max(0, Math.min(0.25, dt)));
      if (p && lastP && dt > 1e-4 && !W.dashing) speed = Math.hypot(p.x - lastP.x, p.z - lastP.z) / dt; else if (W && W.dashing) speed = 0;   // đang lao/lướt không tính là "đang đi"
      lastP = p ? { x: p.x, z: p.z } : null;
      if (glideQ && W && !W.dashing) {   // Phiên 139: lướt né một đoạn + bất tử ngắn (hết cú bật tới trước mới lướt)
        glideQ = false; const gp = glidePlan(level(), !!LGT.inHouse), pos = W.pos, ry = Number.isFinite(W.facing) ? W.facing : 0;
        if (gp && glideCd <= 0) { const l = landing(pos.x, pos.z, ry, gp.dist); if (l.dist >= GLIDE_CFG.minDist && W.dash({ x: l.x, z: l.z }, gp.dur, { tilt: false })) { glideCd = GLIDE_CFG.cd; try { const v = LGT.farmCombat && LGT.farmCombat.vitals; if (v && v.guard) v.guard(gp.guard); } catch (_) { /* bỏ qua */ } if (LGT.sfx) LGT.sfx.play('nhay'); } }
      }
    };
  }

  // ---- theo dõi bậc: hiện/ẩn nút, nhắc người chơi cách dùng đúng một lần khi vừa mở khóa
  let lastLv = level(), hinted = false; try { hinted = localStorage.getItem('lgt.khinhHint') === '1'; } catch (_) { /* riêng tư */ }
  const hint = () => { if (hinted) return; hinted = true; try { localStorage.setItem('lgt.khinhHint', '1'); } catch (_) { /* bỏ qua */ } toast(coarse ? 'Khinh thân: bấm nút “Nhảy” bên phải để bay lên.' : 'Khinh thân: bấm phím Space để nhảy.', 5200); };
  setInterval(() => {
    wrap();
    const lv = level(); if (btn) btn.hidden = lv <= 0;
    if (lv > lastLv) setTimeout(hint, 6500);   // chờ lời thông báo mở khóa của cốt truyện hiện xong
    lastLv = lv;
  }, 500);
  wrap(); if (btn) btn.hidden = level() <= 0;

  // ---- Phiên 52: bảng luyện Khinh thân (bậc 2–8). Chip nhỏ mở bảng; mọi chữ qua textContent.
  const st2 = document.createElement('style');
  st2.textContent = '#kt-chip{position:fixed;right:max(12px,env(safe-area-inset-right));top:max(138px,calc(env(safe-area-inset-top) + 126px));z-index:61;min-height:36px;padding:6px 14px;border-radius:999px;border:1px solid rgba(217,178,95,.8);background:rgba(8,10,20,.82);color:#f3e4b8;font:600 13px/1.2 system-ui,sans-serif;cursor:pointer;touch-action:manipulation}#kt-chip[hidden],.kt-box[hidden]{display:none!important}#kt-chip.ready{border-color:#8fd6bf;color:#d8f5ea}.panel-open #kt-chip,.edit-mode #kt-chip{display:none}'
    + '@media (max-width:899px){#kt-chip{top:max(150px,calc(env(safe-area-inset-top) + 138px));right:max(62px,calc(env(safe-area-inset-right) + 56px));min-height:32px;padding:5px 11px;font-size:12px}}'
    + '.kt-box{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:70;width:min(420px,calc(100vw - 20px));max-height:calc(100vh - 40px);overflow:auto;padding:14px 16px 14px;border-radius:16px;border:1px solid rgba(217,178,95,.8);background:rgba(10,10,18,.95);color:#f3ead4;font:400 14px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.6)}'
    + '.kt-box header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.kt-box h3{margin:0;font:600 17px/1.2 system-ui,sans-serif;color:#f1dba0}.kt-x{min-width:36px;min-height:36px;border:0;background:none;color:#f3ead4;font-size:22px;cursor:pointer}'
    + '.kt-have{margin:0 0 8px;color:#e8dcc0}.kt-list{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:4px}.kt-list li{display:flex;justify-content:space-between;gap:8px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.05);font-size:13px}'
    + '.kt-list li.on{background:rgba(143,214,191,.2);border:1px solid rgba(143,214,191,.6)}.kt-list li.next{border:1px solid rgba(217,178,95,.7)}.kt-list li span:last-child{color:#b9b2a0;text-align:right}'
    + '.kt-go{display:block;width:100%;min-height:44px;border-radius:100px;border:1px solid #f1db9f;background:rgba(217,178,95,.25);color:#fff;font:600 15px/1 system-ui,sans-serif;cursor:pointer}.kt-go:disabled{opacity:.45;cursor:default}.kt-note{margin:8px 0 0;font-size:12px;color:#9aa0b0}';
  document.head.appendChild(st2);
  const chip = document.createElement('button'); chip.id = 'kt-chip'; chip.type = 'button'; chip.hidden = true; document.body.appendChild(chip);
  const box = document.createElement('section'); box.className = 'kt-box'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Luyện Khinh thân');
  const head = document.createElement('header'), h3 = document.createElement('h3'), xb = document.createElement('button');
  h3.textContent = 'Luyện Khinh thân'; xb.className = 'kt-x'; xb.type = 'button'; xb.textContent = '×'; xb.setAttribute('aria-label', 'Đóng'); head.append(h3, xb);
  const have = document.createElement('p'); have.className = 'kt-have';
  const list = document.createElement('ul'); list.className = 'kt-list';
  const go = document.createElement('button'); go.className = 'kt-go'; go.type = 'button';
  const note = document.createElement('p'); note.className = 'kt-note'; note.textContent = 'Trong nhà chỉ nhảy được tối đa khoảng 1,6 m. Số hạt sen và cấp độ yêu cầu là tạm, có thể đổi sau.';
  box.append(head, have, list, go, note); document.body.appendChild(box);
  ['pointerdown', 'touchend', 'wheel', 'keydown'].forEach((ev) => [chip, box].forEach((n) => n.addEventListener(ev, (e) => e.stopPropagation(), { passive: true })));

  const plan = () => trainPlan({ bac: level(), capNguoi: capNguoi(), sen: getSen() });
  function why(p) { return p.reason === 'cap' ? `Cần đạt cấp ${p.cap} (bạn cấp ${capNguoi()}).` : p.reason === 'sen' ? `Cần ${p.sen} hạt sen (bạn có ${getSen()}).` : p.reason === 'toi-da' ? 'Bạn đã đạt cảnh giới cao nhất.' : ''; }
  function draw() {
    const lv = level(), p = plan();
    have.textContent = lv > 0 ? `Bạn đang ở bậc ${lv}/${MAX_BAC} — ${KHINH_TEN[lv]}. Hạt sen: ${getSen()}.` : 'Bạn chưa mở Khinh thân. Hoàn thành chuỗi nhiệm vụ tưới cây bồ đề với Thầy trụ trì trước.';
    list.textContent = '';
    for (let b = 1; b <= MAX_BAC; b++) {
      const li = document.createElement('li'), a = document.createElement('span'), r = document.createElement('span'), y = KHINH_YEU_CAU[b];
      li.className = b <= lv ? 'on' : (b === lv + 1 ? 'next' : '');
      a.textContent = `Bậc ${b} · ${KHINH_TEN[b]} · ${jumpHeightAt(b, false)} m`;
      r.textContent = b <= lv ? 'Đã luyện' : (y ? `cấp ${y.cap} · ${y.sen} sen` : 'cốt truyện');
      li.append(a, r); list.appendChild(li);
    }
    go.disabled = !p.ok;
    go.textContent = p.ok ? `Luyện lên bậc ${p.next} (−${p.sen} hạt sen)` : (why(p) || 'Chưa thể luyện');
  }
  function train() {
    const p = plan(); if (!p.ok) { toast(why(p) || 'Chưa thể luyện.', 2800); return; }
    if (!spendSen(p.sen)) { toast('Chưa đủ hạt sen.', 2500); return; }
    luyen = p.next; saveLuyen(); draw(); paintChip(); if (LGT.sfx) LGT.sfx.play('len-bac');
    toast(`Khinh thân lên bậc ${p.next} — ${KHINH_TEN[p.next]}. Nhảy cao ${jumpHeightAt(p.next, false)} m.`, 4200);
  }
  const openBox = () => { if (LGT.panelOpen) return; draw(); box.hidden = false; (go.disabled ? xb : go).focus({ preventScroll: true }); };
  const closeBox = () => { box.hidden = true; };
  function paintChip() {
    const lv = level(), p = plan(); chip.hidden = lv <= 0;
    chip.textContent = p.ok ? `Khinh thân ${lv}/${MAX_BAC} ✦` : `Khinh thân ${lv}/${MAX_BAC}`; chip.classList.toggle('ready', !!p.ok);
    chip.setAttribute('aria-label', `Luyện Khinh thân, đang bậc ${lv}${p.ok ? ', có thể luyện lên bậc kế' : ''}`);
    if (!box.hidden) draw();
  }
  chip.addEventListener('click', () => (box.hidden ? openBox() : closeBox()));
  xb.addEventListener('click', closeBox); go.addEventListener('click', train);
  addEventListener('keydown', (e) => { if (e.code === 'Escape' && !box.hidden) { closeBox(); e.stopPropagation(); } }, true);
  setInterval(paintChip, 700); paintChip();

  LGT.skill = { get air() { return jump.air; }, get sinceAir() { return jump.air ? 0 : (performance.now() - lastAirAt) / 1000; }, get level() { return level(); }, get canTrain() { return !!plan().ok; }, jump: doJump, open: openBox, close: closeBox, train };
  return LGT.skill;
}
