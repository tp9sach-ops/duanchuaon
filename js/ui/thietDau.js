// Thiết đầu công (Phiên 90): nút trong cụm nút góc phải-dưới (js/ui/dock.js) hiện sau khi NHẢY ở Khinh thân bậc ≥ 4. Luật + con số: js/world/thietDau.js (có test).
// Đặt LGT.thietDau = { status(), dash() }. Lao thẳng trước mặt; đâm trúng yêu quái (LGT.yq) thì gây sát thương qua LGT.yq.ramHit.
import { MIN_BAC, DASH_S, COOLDOWN_S, buttonOpen, dashPath, dashDamage, dashDistance, rams, tickCd } from '../world/thietDau.js';
import { YQ } from '../world/yeuquai.js';
import { tone } from './sound.js';
import { loadSettings } from './soundLogic.js';
import { sfxGain } from '../world/celebrate.js';
import { prefersReduced } from '../util.js';

export function initThietDau({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let cd = 0, last = performance.now();
  const W = () => LGT.world, S = () => LGT.skill;
  const ctx = () => ({ bac: S() ? S().level : 0, air: S() ? S().air : false, sinceAir: S() ? S().sinceAir : Infinity, mode: W() ? W().mode : '' });
  const usable = () => !!W() && !!S() && !LGT.panelOpen && !LGT.inHouse && !(LGT.swim && LGT.swim.active) && !W().dashing;
  function status() { const open = usable() && buttonOpen(ctx()); const bac = S() ? S().level : 0; return { open, wait: cd > 0, cd, bac, dist: dashDistance(bac), dmg: dashDamage(bac, LGT.strength ? LGT.strength.value : 0) }; }
  function sfx(kind) {
    let gv = 1; try { gv = sfxGain(loadSettings(localStorage)); } catch (_) { /* mặc định */ } if (!gv) return;
    if (kind === 'go') tone(900, 0.3, { type: 'sawtooth', gain: 0.07 * gv, decay: 0.28, slide: -700 }); else { tone(110, 0.35, { type: 'square', gain: 0.18 * gv, decay: 0.3, slide: -60 }); tone(1500, 0.18, { gain: 0.06 * gv, decay: 0.15 }); }
  }
  function dash() {
    if (!usable()) return false; const st = status();
    if (!st.open) { toast(st.bac < MIN_BAC ? `Thiết đầu công cần Khinh thân bậc ${MIN_BAC} trở lên.` : 'Hãy bấm Nhảy rồi bấm Thiết đầu công ngay khi đang bay.', 2600); return false; }
    if (cd > 0) { toast(`Thiết đầu công đang hồi, đợi ${Math.ceil(cd)} giây.`, 1600); return false; }
    const p = W().pos, ry = Number.isFinite(W().facing) ? W().facing : 0, path = dashPath(p.x, p.z, ry, st.bac);
    if (path.dist < 0.5) { toast('Trước mặt có vật cản, không lao được.', 1800); return false; }
    if (!W().dash(path.to, DASH_S)) return false;
    cd = COOLDOWN_S; sfx('go');
    const boss = LGT.yq && LGT.yq.active ? LGT.yq.boss : null, from = { x: p.x, z: p.z }, body = boss ? YQ[boss.type].body : 1.5;
    const hitIt = boss && !boss.dead && rams(from, path.to, boss, body);
    if (hitIt) setTimeout(() => { if (LGT.yq && LGT.yq.ramHit(st.dmg)) { sfx('hit'); toast(`Thiết đầu công! Đâm trúng ${YQ[boss.type].ten}: −${st.dmg} máu.`, 2600); try { if (!prefersReduced() && navigator.vibrate) navigator.vibrate([40, 30, 80]); } catch (_) { /* bỏ qua */ } } }, DASH_S * 650);
    else if (boss) setTimeout(() => toast('Thiết đầu công trượt — lao đầu vào đúng hướng yêu quái nhé.', 2000), DASH_S * 700);
    return true;
  }
  setInterval(() => { const now = performance.now(); cd = tickCd(cd, (now - last) / 1000); last = now; }, 200);
  LGT.thietDau = { status, dash };
  return LGT.thietDau;
}
