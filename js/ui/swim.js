// Bơi + lặn (Phiên 87): giao diện. Luật/số: js/world/swim.js (có test). Đặt LGT.swim = { active, mode, air, speedMul, toggleDive(), status() }.
// Hạ thân nhân vật xuống dưới mặt đất (mặt phẳng nền che thân) để trông như đang ngâm nước; có thanh hơi thở + màu xanh phủ khi lặn. CHƯA nhìn bằng mắt trên máy thật.
import { SWIM, swimWaterAt, createSwimmer, stepSwimmer, speedMul, yOffset, loadPearls, tryPearl, pearlSpots } from '../world/swim.js';
import { dayKey } from '../world/merit.js';

const KEY = 'lgt.swim';
export function initSwim({ toast = () => {}, addSen = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let st = createSwimmer(), want = false, yOff = 0, lastT = performance.now(), told = false;
  let pearls; try { pearls = loadPearls(localStorage.getItem(KEY), dayKey()); } catch (_) { pearls = loadPearls(null, dayKey()); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(pearls)); } catch (_) { /* riêng tư */ } };
  const spots = pearlSpots();
  const mk = (tag, css, id) => { const e = document.createElement(tag); e.style.cssText = css; if (id) e.id = id; return e; };
  const tint = mk('div', 'position:fixed;inset:0;z-index:5;pointer-events:none;background:rgba(40,120,170,.38);opacity:0;transition:opacity .4s', 'sw-tint');
  const bar = mk('div', 'position:fixed;left:50%;top:max(64px,calc(env(safe-area-inset-top) + 56px));transform:translateX(-50%);width:min(220px,60vw);height:12px;border-radius:8px;border:1px solid rgba(255,255,255,.7);background:rgba(6,7,13,.5);z-index:9;display:none', 'sw-air');
  const fill = mk('div', 'height:100%;width:100%;border-radius:7px;background:#6fd0f0;transition:width .12s'); bar.appendChild(fill); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', 'Hơi thở');
  document.body.append(tint, bar);

  const inHouse = () => !!LGT.inHouse;
  function wrap() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__swim) return;
    const orig = av.update.bind(av); av.__swim = true;
    av.update = (dt) => { orig(dt); if (av.group) { yOff += (yOffset(st.mode) - yOff) * Math.min(1, 6 * dt); av.group.position.y += yOff; } };
  }
  function tick() {
    const now = performance.now(), dt = (now - lastT) / 1000; lastT = now; wrap();
    const W = LGT.world; if (!W) return;
    const p = W.pos, can = W.mode === 'free' && !inHouse();
    const inWater = can && !!swimWaterAt(p.x, p.z) && !(LGT.yq && LGT.yq.status && LGT.yq.status().active);
    if (!inWater) want = false;
    const r = stepSwimmer(st, { inWater, wantDive: want }, dt); st = r.st;
    if (r.ev === 'enter' && !told) { told = true; toast('Bạn đang bơi. Bấm “Lặn” để lặn xuống nhặt ngọc trai (+1 hạt sen/viên).', 5200); }
    if (r.ev === 'breath') { want = false; toast('Hết hơi! Bạn nổi lên mặt nước để thở.', 3000); }
    if (st.mode === 'dive') {
      const today = dayKey(); if (pearls.day !== today) pearls = loadPearls(pearls, today);
      const t = tryPearl(pearls, st.mode, p.x, p.z, spots);
      if (t.got) { pearls = t.pearls; save(); addSen(1); toast(`Nhặt được viên ngọc trai! +1 hạt sen (${pearls.got.length}/${SWIM.dayCap} hôm nay)`, 2800); }
      else if (t.capped && !tick.capTold) { tick.capTold = true; toast('Hôm nay bạn đã nhặt đủ ngọc trai. Mai ngọc sẽ mọc lại.', 3600); }
    } else tick.capTold = false;
    tint.style.opacity = st.mode === 'dive' ? '1' : '0';
    bar.style.display = st.mode === 'dive' || st.air < SWIM.airMax - 0.5 ? 'block' : 'none';
    const pc = Math.round(100 * st.air / SWIM.airMax); fill.style.width = pc + '%'; bar.setAttribute('aria-valuenow', String(pc));
  }
  setInterval(tick, 100);
  const api = {
    get active() { return st.mode !== 'land'; }, get mode() { return st.mode; }, get air() { return st.air; }, get speedMul() { return speedMul(st.mode); },
    toggleDive() { if (st.mode === 'land') return; if (st.mode === 'swim' && st.air <= 0.5) { toast('Chưa đủ hơi — chờ một chút.', 1800); return; } want = st.mode === 'swim'; },
    status() { return { mode: st.mode, say: st.mode === 'dive' ? `Hơi thở: ${Math.ceil(st.air)} giây` : '' }; },
  };
  LGT.swim = api; return api;
}
