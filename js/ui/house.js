// Nút nổi "Vào nhà" / "Ra ngoài" (Phiên 38, bước 3d-2c). Logic chọn nút + điểm đến ở js/world/interior.js (có test); cảnh 3D phòng ở js/scene/interior.js.
// Vào nhà: đóng bảng, đăng ký phòng vào layout.js, hiện phòng 3D, dịch chuyển vào. Ra ngoài: dịch chuyển ra trước lô, ẩn phòng, gỡ đăng ký.
// Nhà được nâng cấp khi đang ở trong thì dựng lại phòng cấp mới và đặt người chơi về chỗ vào cửa. CSS nhúng bằng JS; chữ hiển thị đi qua textContent.
import { houseAction, enterPlan, exitPlan, registerRoom, entryPoint } from '../world/interior.js';
import { houseLevel } from '../world/land.js';

export function initHouse(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  LGT.inHouse = false;
  const st = document.createElement('style');
  st.textContent = '#house-btn{position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:62;padding:11px 26px;border-radius:999px;border:1px solid rgba(217,178,95,.9);background:rgba(8,10,20,.86);color:#f3e4b8;font:600 15px/1.2 system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);touch-action:manipulation}#house-btn:hover{background:rgba(40,30,10,.92)}#house-btn[hidden]{display:none}';
  document.head.appendChild(st);
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'house-btn'; btn.hidden = true; document.body.appendChild(btn);

  let unreg = null, shownLv = -1, mode = '';
  const land = () => (LGT.land && LGT.land.state) || null;
  const pos = () => (LGT.world && LGT.world.pos) || null;
  const closePanels = () => { try { LGT.furni && LGT.furni.close(); } catch (_) { /* bỏ qua */ } try { LGT.land && LGT.land.close(); } catch (_) { /* bỏ qua */ } try { LGT.merit && LGT.merit.close && LGT.merit.close(); } catch (_) { /* bỏ qua */ } };

  function mountRoom(lv) {   // đăng ký + hiện phòng cấp lv (gỡ phòng cũ trước)
    if (unreg) { unreg(); unreg = null; }
    const placed = LGT.furni ? LGT.furni.placed : [];   // đồ người chơi đã đặt (Phiên 41)
    unreg = registerRoom(lv, placed); shownLv = lv;
    if (LGT.interiorScene) LGT.interiorScene.show(lv, placed);
  }
  function unmountRoom() {
    if (unreg) { unreg(); unreg = null; }
    shownLv = -1; if (LGT.interiorScene) LGT.interiorScene.hide();
  }
  LGT.houseRemount = () => { if (LGT.inHouse && shownLv >= 0) mountRoom(shownLv); };   // dựng lại phòng khi đổi bố trí nội thất
  function enter() {
    const W = LGT.world, L = land(), p = pos(); if (!W || !L || !p) return;
    const plan = enterPlan(L, p);
    if (!plan.ok) { toast(plan.reason === 'far' ? 'Bạn đứng hơi xa cửa nhà.' : 'Bạn chưa có nhà.', 2500); return; }
    if (!LGT.interiorScene) { toast('Cảnh trong nhà chưa sẵn sàng, thử lại sau giây lát.', 2500); return; }
    closePanels(); mountRoom(plan.lv); LGT.inHouse = true;
    W.teleport(plan.spawn.x, plan.spawn.z, plan.spawn.ry);
    toast('Bạn bước vào nhà.', 2000); refresh();
  }
  function leave() {
    const W = LGT.world, L = land(); if (!W) return;
    const out = exitPlan(L);
    if (!out) { toast('Không tìm thấy lối ra.', 2500); return; }
    closePanels(); W.teleport(out.x, out.z, out.ry);
    unmountRoom(); LGT.inHouse = false;
    refresh();
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); if (mode === 'exit') leave(); else if (mode === 'enter') enter(); });
  ['pointerdown', 'touchend'].forEach((ev) => btn.addEventListener(ev, (e) => e.stopPropagation()));

  function refresh() {
    const L = land(), p = pos();
    if (LGT.inHouse && L && L.own) {   // nhà vừa nâng cấp khi đang ở trong: dựng lại phòng cấp mới, đặt người chơi về chỗ vào cửa
      const lv = houseLevel(L.own.lv).lv;
      if (lv !== shownLv && LGT.interiorScene) { mountRoom(lv); const e = entryPoint(lv); LGT.world.teleport(e.x, e.z, e.ry); }
    }
    mode = houseAction(L, p);
    btn.hidden = !mode; btn.textContent = mode === 'exit' ? 'Ra ngoài' : 'Vào nhà';
    btn.setAttribute('aria-label', mode === 'exit' ? 'Ra ngoài sân' : 'Vào nhà của bạn');
  }
  setInterval(refresh, 400); refresh();
  LGT.house = { enter, leave, get inside() { return !!LGT.inHouse; } };
  return LGT.house;
}
