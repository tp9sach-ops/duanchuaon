// Kỹ năng Khinh thân (nhảy): phím Space + nút "Nhảy" trên điện thoại, chỉ hiện khi đã mở bậc 1 từ cốt truyện tưới cây.
// Logic ở js/world/skills.js (có test). File này KHÔNG sửa world.js: nó bọc avatar.update để cộng độ cao nhảy vào vị trí nhân vật sau khi world.js đặt xong mỗi khung hình
// (world.js đặt lại vị trí từ đầu mỗi khung nên không cộng dồn). Đổi tên/áo/kiểu đầu dựng lại nhân vật → bộ đếm 500 ms tự bọc lại.
import { khinhLevel, jumpHeight, canJump, createJump } from '../world/skills.js';

const isEditable = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/** hud: phần tử HUD; opts: { toast(text, ms) }. Trả { get level, jump() }. */
export function initSkill(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const jump = createJump();
  const level = () => khinhLevel(LGT.story && LGT.story.state);
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

  function doJump() {
    const W = LGT.world; if (!W) return false;
    const lv = level();
    if (!canJump({ level: lv, mode: W.mode, panelOpen: !!LGT.panelOpen, dialogOpen: dialogOpen() })) return false;
    const ok = jump.start(jumpHeight(lv));
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
    av.update = (dt) => { orig(dt); const y = jump.step(dt); if (y > 0 && av.group) av.group.position.y += y; };
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

  LGT.skill = { get level() { return level(); }, jump: doJump };
  return LGT.skill;
}
