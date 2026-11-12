// Côn Khí Trảm (Phiên 93): nút "Chém khí" trong cụm nút góc phải-dưới (js/ui/dock.js) hiện khi yêu quái đang ở làng.
// Luật + con số: js/world/conKhi.js (có test). Đặt LGT.conKhi = { status(), cast() }.
// Cách chạy: bấm → nhân vật tự quay về phía yêu quái, nâng côn lên rồi chém xuống (avatar.swing) → sau RELEASE_S giây luồng khí rời côn (đẩy vào LGT.yqView.waves, js/scene/yeuquai.js vẽ theo đồng hồ riêng,
// KHÔNG cần vòng lặp thời gian ở đây) → khí chạm yêu quái thì gây sát thương qua LGT.yq.ramHit. Không dùng setInterval: hồi chiêu tính bằng mốc thời gian, hiệu ứng dùng setTimeout một lần.
import { COOLDOWN_S, SWING_S, RELEASE_S, RANGE, SPEED, khiDamage, aim, planWave, gapTo } from '../world/conKhi.js';
import { YQ } from '../world/yeuquai.js';
import { tone } from './sound.js';
import { loadSettings } from './soundLogic.js';
import { sfxGain } from '../world/celebrate.js';
import { prefersReduced } from '../util.js';

export function initConKhi({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let cdUntil = 0;
  const now = () => performance.now();
  const W = () => LGT.world;
  const boss = () => (LGT.yq && LGT.yq.active ? LGT.yq.boss : null);
  const bodyOf = (b) => (b && YQ[b.type] ? YQ[b.type].body : 1.5);
  const usable = () => !!W() && !LGT.panelOpen && !LGT.inHouse && !LGT.heldBy && !(LGT.swim && LGT.swim.active) && W().mode === 'free' && !W().dashing && !W().held;
  const cdLeft = () => Math.max(0, (cdUntil - now()) / 1000);

  function status() { const b = boss(), p = W() && W().pos, g = b && p ? gapTo(p, b, bodyOf(b)) : null; return { cd: cdLeft(), wait: cdLeft() > 0, far: g !== null && g > RANGE, dmg: khiDamage(LGT.strength ? LGT.strength.value : 0) }; }
  function sfx(kind) {
    if (LGT.sfx) { LGT.sfx.play({ swing: 'chem-khi-vung', go: 'chem-khi' }[kind] || 'chem-khi-trung'); return; }   // Phiên 109: tiếng thật (js/ui/sfx.js); không có thì dùng tiếng tổng hợp bên dưới
    let gv = 1; try { gv = sfxGain(loadSettings(localStorage)); } catch (_) { /* mặc định */ } if (!gv) return;
    if (kind === 'swing') tone(700, 0.22, { type: 'sawtooth', gain: 0.06 * gv, decay: 0.2, slide: -450 });
    else if (kind === 'go') { tone(1200, 0.3, { type: 'triangle', gain: 0.07 * gv, decay: 0.28, slide: -700 }); tone(300, 0.25, { type: 'sawtooth', gain: 0.04 * gv, decay: 0.22, slide: -150 }); }
    else { tone(130, 0.3, { type: 'square', gain: 0.16 * gv, decay: 0.28, slide: -70 }); tone(1800, 0.14, { gain: 0.05 * gv, decay: 0.12 }); }
  }
  function release() {   // khí rời côn: tính lại hướng + quãng bay ở THỜI ĐIỂM NÀY (yêu quái/người đã nhích một chút)
    const w = W(), b = boss(); if (!w) return;
    const p = w.pos, body = bodyOf(b), a = aim(p, w.facing, b, body), plan = planWave(p.x, p.z, a.ry, b, body);
    const view = LGT.yqView; if (view) { view.waves = (view.waves || []).filter((x) => now() - x.t0 < 1500); view.waves.push({ ...plan, ry: a.ry, t0: now() }); }
    sfx('go');
    if (!plan.hit || !b) return;
    const dmg = khiDamage(LGT.strength ? LGT.strength.value : 0);
    setTimeout(() => {   // khí tới nơi
      if (LGT.yq && LGT.yq.ramHit(dmg)) { sfx('hit'); toast(`Côn Khí Trảm! Trúng ${YQ[b.type].ten}: −${dmg} máu.`, 1800); try { if (!prefersReduced() && navigator.vibrate) navigator.vibrate([30, 20, 60]); } catch (_) { /* bỏ qua */ } }
    }, plan.dur * 1000);
  }
  function cast() {
    if (!usable()) return false;
    const b = boss(); if (!b) return false;
    const w = W(), p = w.pos, body = bodyOf(b), g = gapTo(p, b, body);
    if (g > RANGE) { toast(`Yêu quái còn xa quá (khí bay được ${RANGE} m), lại gần hơn rồi chém.`, 2000); return false; }
    if (cdLeft() > 0) { toast(`Côn Khí Trảm đang hồi, đợi ${Math.ceil(cdLeft())} giây.`, 1400); return false; }
    cdUntil = now() + COOLDOWN_S * 1000;
    w.face(aim(p, w.facing, b, body).ry);                       // quay mặt về phía yêu quái ngay
    if (w.avatar && w.avatar.swing) w.avatar.swing(SWING_S);   // côn hiện ra, vung lên chém xuống
    sfx('swing'); setTimeout(release, RELEASE_S * 1000);
    return true;
  }
  LGT.conKhi = { status, cast, RANGE, SPEED };
  return LGT.conKhi;
}
