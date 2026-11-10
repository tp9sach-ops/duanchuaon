// Cổng sang zone khác (Phiên 87): nút "Qua cổng" hiện khi đứng trong vòng cổng; màn che ~0,6 giây khi chuyển; tải trước zone khi tới gần.
// Logic: js/world/zones.js (có test). Dựng cảnh: js/scene/zones.js. CHƯA nhìn bằng mắt.
import { THU_ID, HUB_GATE } from '../world/zoneThu.js';

export async function initZoneGate({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {}), Z = LGT.zones; if (!Z || !LGT.scene) return null;
  try {
    const { buildHubGate, thuHooks } = await import('../scene/zones.js');
    const def = Z.get(THU_ID);
    if (def) { const h = thuHooks(LGT.scene, def); def.load = h.load; def.dispose = h.dispose; }
    buildHubGate(LGT.scene, HUB_GATE);
  } catch (e) { console.warn('[Diệu Giang Tự] Dựng cổng lỗi:', e && e.message); return null; }
  const st = document.createElement('style');
  st.textContent = '#zg-btn{position:fixed;left:50%;bottom:max(120px,calc(env(safe-area-inset-bottom) + 110px));transform:translateX(-50%);z-index:20;min-height:48px;padding:10px 24px;border-radius:100px;border:1px solid #f1db9f;background:rgba(6,7,13,.7);color:#fff;font:600 16px/1 system-ui,sans-serif;cursor:pointer}#zg-btn[hidden]{display:none}#zg-fade{position:fixed;inset:0;z-index:80;background:#06070d;opacity:0;pointer-events:none;transition:opacity .3s}';
  document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'zg-btn'; btn.type = 'button'; btn.hidden = true;
  const fade = document.createElement('div'); fade.id = 'zg-fade'; fade.setAttribute('aria-hidden', 'true');
  document.body.append(btn, fade);
  let gate = null, busy = false;
  const ready = () => { const W = LGT.world; return !!W && W.mode === 'free' && !LGT.inHouse && !LGT.panelOpen && !(LGT.yq && LGT.yq.status && LGT.yq.status().active) && !(LGT.swim && LGT.swim.active); };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  setInterval(() => {
    if (busy) return; const W = LGT.world; if (!W) return;
    const p = W.pos; try { Z.tick(p.x, p.z); } catch (_) { /* tải trước lỗi: thử lại sau */ }
    gate = ready() ? Z.gateNear(p.x, p.z, 0) : null;
    btn.hidden = !gate; if (gate) { const t = 'Qua cổng: ' + (gate.ten || gate.to); if (btn.textContent !== t) btn.textContent = t; }
  }, 150);
  btn.addEventListener('click', async () => {
    if (!gate || busy) return; busy = true; btn.hidden = true; const g = gate;
    try {
      fade.style.opacity = '1'; await wait(350);
      const r = await Z.useGate(g.id);
      if (r && r.ok) { LGT.world.teleport(r.spawn.x, r.spawn.z, r.spawn.ry); toast('Bạn đã tới: ' + ((Z.get(r.zone) || {}).ten || r.zone), 3000); }
      else toast((r && r.reason) || 'Chưa qua được cổng.', 3000);
    } catch (e) { toast('Chưa qua được cổng.', 3000); } finally { await wait(250); fade.style.opacity = '0'; busy = false; }
  });
  return { get gate() { return gate; } };
}
