// Chế độ đi bộ: nhân vật người chơi + camera góc nhìn thứ ba + điều khiển (WASD/mũi tên, bấm-để-đi, kéo xoay, cuộn/chụm để zoom, joystick cảm ứng).
// Phiên 159 — CHUỘT trên máy tính: CHUỘT PHẢI = đi tới đó; bấm (trái/chạm) vào quái = khóa mục tiêu + tự đánh thường (LGT.farm.pickAt); chuột trái = chạm chương/bồ đoàn, kéo (trái hoặc phải) = xoay camera. Cảm ứng/bút: bấm = đi (như cũ).
// Logic tính toán ở worldLogic.js (có test); file này chỉ nối với three.js, DOM và vòng lặp cảnh.
import * as THREE from 'three';
import './placements.js';                                  // đăng ký vật cản của hoa viên, nhà... vào layout.js
import { createAvatar } from './avatar.js';
import { DEFAULT_COLOR } from './avatarLogic.js';
import { SPAWN, solidAt } from './layout.js';
import { spotById, pickSpot, createArrival, faceAngle } from './spots.js';
import { findPath } from './path.js';
import { SEATS, SEAT_Y, pickSeat, seatById, nearestFreeSeat, standPoint, inHall, createActivity } from './seats.js';
import { damp } from '../util.js';
import {
  WALK_SPEED, RUN_SPEED, CLICK_SPEED, CAM_DIST, CAM_PITCH, moveVector, joyVector, joyRun, moveKeyOf, walkStep, createNavigator, camPose, clipCamDist, dragCamera, zoomCamera, facingOf,
} from './worldLogic.js';
import { shotPose, blendShot } from './fishShot.js';   // Phiên 120: góc camera câu cá / cầm cá

const isEditable = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

function savedName() { try { return localStorage.getItem('lgt.name') || 'Khách'; } catch (_) { return 'Khách'; } }
function savedHair() { try { return localStorage.getItem('lgt.hair') || 'troc'; } catch (_) { return 'troc'; } }
function savedColor() { try { return localStorage.getItem('lgt.color') || DEFAULT_COLOR; } catch (_) { return DEFAULT_COLOR; } }

/** opts: { scene, camera, canvas, coarse, LGT } → { update(dt), avatar, teleport(x, z), get pos }. */
export function createWorld({ scene, camera, canvas, coarse = false, LGT = window.LGT || {}, onArrive = null }) {
  let avatar = createAvatar({ name: savedName(), color: savedColor(), hair: savedHair(), mine: true });
  scene.add(avatar.group);
  const P = { x: SPAWN.x, z: SPAWN.z, y: 0 };
  avatar.group.position.set(P.x, 0, P.z); avatar.setFacing(SPAWN.ry, true);

  const keys = { f: false, b: false, l: false, r: false, run: false };
  let camD = null, joy = null, yaw = 0, pitch = CAM_PITCH.def, dist = CAM_DIST.def, speedNow = 0;
  let joyRunning = false, resetJoy = null;   // Phiên 129: kéo cần quá vành = chạy (điện thoại không có Shift); resetJoy gán khi có joystick
  let shot = '', shotK = 0, shotCur = null;   // Phiên 120: góc quay câu cá ('cast' | 'show' | ''); shotK = mức trộn 0..1 (ra/vào mượt)
  const nav = createNavigator(), cam = { x: 0, y: 0, z: 0, lx: 0, ly: 0, lz: 0, init: false };
  const blockedNow = () => !!LGT.panelOpen;
  const arrival = createArrival();
  const act = createActivity();                              // ngồi / thiền / lạy (seats.js)

  // --- dòng nhắc nhỏ khi đang đi tới một chỗ (Esc hoặc tự đi để hủy)
  const hint = document.createElement('div'); hint.id = 'goto-hint'; hint.setAttribute('role', 'status'); hint.setAttribute('aria-live', 'polite'); hint.hidden = true;
  const hst = document.createElement('style');
  hst.textContent = '#goto-hint{position:fixed;left:50%;bottom:max(64px,calc(env(safe-area-inset-bottom) + 48px));transform:translateX(-50%);z-index:9;padding:8px 16px;border:1px solid rgba(241,219,160,.35);border-radius:100px;background:rgba(8,10,20,.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#e8eaf2;font-size:12px;letter-spacing:.08em;white-space:nowrap;pointer-events:none}#goto-hint[hidden]{display:none}.panel-open #goto-hint{display:none}';
  document.head.appendChild(hst); document.body.appendChild(hint);
  const showHint = (s) => { hint.textContent = s ? 'Đang đi tới ' + s.label + ' · bấm Esc để hủy' : ''; hint.hidden = !s; };
  function cancelGo() { if (arrival.spot) { arrival.cancel(); nav.clear(); showHint(null); } }

  // --- dấu chạm xuống đất khi bấm-để-đi
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.4, 28), new THREE.MeshBasicMaterial({ color: 0x4aa58a, transparent: true, opacity: 0.9, depthTest: false }));
  mark.rotation.x = -Math.PI / 2; mark.visible = false; mark.renderOrder = 15; scene.add(mark);

  // --- bàn phím
  addEventListener('keydown', (e) => {
    if (isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Escape') { cancelGo(); return; }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { keys.run = true; return; }
    const k = moveKeyOf(e); if (!k) return;   // W/A/S/D = mũi tên ↑←↓→ (cùng một bộ nút, xem worldLogic.moveKeyOf)
    if (!blockedNow()) { if (LGT.farm && LGT.farm.stopAttack) LGT.farm.stopAttack(); release(); keys[k] = true; nav.clear(); arrival.cancel(); showHint(null); e.preventDefault(); }
  });
  addEventListener('keyup', (e) => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = false; const k = moveKeyOf(e); if (k) keys[k] = false; });
  const stopAll = () => { keys.f = keys.b = keys.l = keys.r = keys.run = false; };
  addEventListener('blur', stopAll);
  addEventListener('visibilitychange', () => { if (document.hidden) { stopAll(); if (resetJoy) resetJoy(); } });   // chuyển ứng dụng / khóa màn hình giữa lúc đang giữ phím hoặc cần → không bị kẹt đi mãi

  // --- chuột / cảm ứng trên cảnh: bấm = đi tới đó, kéo = xoay camera, hai ngón = zoom, cuộn = zoom
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  const ptrs = new Map(); let down = null, pinch = 0;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    down = ptrs.size === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, btn: e.button, mouse: e.pointerType === 'mouse' } : null;   // Phiên 159: nhớ nút chuột (0 trái, 2 phải) + có phải chuột không
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* bỏ qua */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!ptrs.size && !coarse && !blockedNow()) canvas.style.cursor = spotAt(e.clientX, e.clientY) ? 'pointer' : '';
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); dist = zoomCamera(dist, -(d - pinch) * 2.2); pinch = d; return; }
    if (down && down.id === e.pointerId) {
      down.moved += Math.abs(dx) + Math.abs(dy);
      if (down.moved > 8 && !blockedNow()) { const r = dragCamera(yaw, pitch, dx, dy); yaw = r.yaw; pitch = r.pitch; }
    }
  });
  const end = (e) => {
    const was = down && down.id === e.pointerId ? down : null; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0;
    if (was && was.moved <= 8 && performance.now() - was.t < 500 && e.type === 'pointerup' && !blockedNow()) onClick(e.clientX, e.clientY, was);
    if (was) down = null;
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => { if (blockedNow()) return; e.preventDefault(); dist = zoomCamera(dist, e.deltaY); }, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());   // Phiên 159: chuột phải dùng để đi → không hiện menu của trình duyệt
  addEventListener('contextmenu', (e) => { if (!isEditable(e.target)) e.preventDefault(); }, true);   // Phiên 159b: chặn cả menu "Lưu hình ảnh" khi chuột phải rơi lên lớp phủ/ảnh/canvas khác (trừ ô nhập chữ); pha capture nên không lớp nào chặn được
  /** Một cú bấm (không kéo). Chuột phải: đi tới đó; bấm đúp trúng quái = khóa mục tiêu. Chuột trái: chỉ chạm chương/bồ đoàn. Cảm ứng/bút: bấm = đi. */
  function onClick(cx, cy, d) {
    if (d.btn !== 2 && pickMonsterAt(cx, cy, true)) return;            // Phiên 159c: bấm (trái / chạm) vào quái = khóa + tự đánh thường
    if (!d.mouse) { pickGround(cx, cy, true); return; }
    if (d.btn === 2) { pickGround(cx, cy, true); return; }            // chuột phải = đi
    if (d.btn === 0) pickGround(cx, cy, false);                        // chuột trái: bấm vào quái đã xử lý ở trên; còn lại chỉ chương/bồ đoàn
  }
  /** Tia từ con trỏ chạm quái nào → khóa làm mục tiêu (js/ui/farm.js). Trả true nếu đã khóa được. */
  function pickMonsterAt(cx, cy, attack = false) {
    const F = LGT.farm; if (!F || typeof F.pickAt !== 'function') return false;
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const r = F.pickAt(ray.ray.origin, ray.ray.direction, attack); return !!(r && r.ok);
  }

  /** Tia từ điểm màn hình (cx, cy) có trúng vật 3D gắn với chương nào không → spot hoặc null. */
  function spotAt(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const h = pickSpot(ray.ray.origin, ray.ray.direction);
    return h ? h.spot : null;
  }
  function pickGround(cx, cy, ground = true) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hs = pickSeat(ray.ray.origin, ray.ray.direction); if (hs) { sit(hs.seat.id); return; }   // bấm bồ đoàn → đi tới ngồi
    const sp = spotAt(cx, cy); if (sp) { goTo(sp.id); return; }
    if (!ground) return;                                      // Phiên 159: chuột trái không đi trên đất (chỉ chuột phải / cảm ứng)
    if (LGT.farm && LGT.farm.stopAttack) LGT.farm.stopAttack();   // tự đi = thôi tự đánh
    release(); arrival.cancel(); showHint(null);
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    plane.constant = -P.y;                                    // mặt phẳng ngang tại độ cao của người
    if (!ray.ray.intersectPlane(plane, hit) || Math.hypot(hit.x - camera.position.x, hit.z - camera.position.z) > 90) return;
    const path = findPath(P.x, P.z, hit.x, hit.z);            // tìm đường qua cổng/cầu; không có đường thì đi thẳng (trượt dọc tường)
    if (path && path.length) nav.setPath(path); else nav.setTarget(hit.x, hit.z);
    mark.position.set(hit.x, P.y + 0.06, hit.z); mark.visible = true;
  }

  // --- joystick cảm ứng (chỉ hiện trên màn hình cảm ứng)
  if (coarse) {
    const st = document.createElement('style');
    st.textContent = '#joy{position:fixed;left:max(18px,env(safe-area-inset-left));bottom:max(86px,calc(env(safe-area-inset-bottom) + 70px));width:120px;height:120px;border-radius:50%;z-index:9;touch-action:none;background:rgba(6,7,13,.35);border:1px solid rgba(217,178,95,.45)}#joy i{position:absolute;left:38px;top:38px;width:44px;height:44px;border-radius:50%;background:rgba(217,178,95,.55);border:1px solid rgba(217,178,95,.9);pointer-events:none}.panel-open #joy{display:none}'
      + '#joy{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}'                                   // Phiên 129: giữ lâu không bôi chọn / hiện menu
      + '#joy::before{content:"";position:absolute;inset:-8px -16px -16px -16px;border-radius:50%}'                    // vùng chạm rộng hơn hình tròn thấy được (ngón cái hay lệch ra ngoài), chừa 8px phía trên cho hàng nút camera
      + '#joy.run{border-color:rgba(143,214,191,.9)}#joy.run i{background:rgba(143,214,191,.75);border-color:#8fd6bf}'; // đang chạy: cần đổi sang màu ngọc
    document.head.appendChild(st);
    const base = document.createElement('div'); base.id = 'joy'; base.setAttribute('aria-hidden', 'true'); const knob = document.createElement('i'); base.appendChild(knob); document.body.appendChild(base);
    let jid = null, c0 = null;
    resetJoy = () => { jid = null; joy = null; joyRunning = false; knob.style.transform = ''; base.classList.remove('run'); };
    base.addEventListener('pointerdown', (e) => {
      if (jid !== null && jid !== e.pointerId) return;   // ngón thứ hai chạm vào cần: bỏ qua, không giật cần đang giữ
      e.preventDefault(); jid = e.pointerId; const r = base.getBoundingClientRect(); c0 = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      try { base.setPointerCapture(e.pointerId); } catch (_) { /* bỏ qua */ }
      if (LGT.farm && LGT.farm.stopAttack) LGT.farm.stopAttack(); release(); nav.clear(); arrival.cancel(); showHint(null); onJoy(e);
    });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === jid) onJoy(e); });
    const off = (e) => { if (e.pointerId !== jid) return; resetJoy(); };
    base.addEventListener('pointerup', off); base.addEventListener('pointercancel', off); base.addEventListener('lostpointercapture', off);
    function onJoy(e) {
      const dx = e.clientX - c0.x, dy = e.clientY - c0.y, j = joyVector(dx, dy, 56);
      joy = j.x || j.y ? j : null; joyRunning = !!joy && joyRun(dx, dy, 56); base.classList.toggle('run', joyRunning);
      knob.style.transform = `translate(${Math.max(-40, Math.min(40, dx * 0.7))}px,${Math.max(-40, Math.min(40, dy * 0.7))}px)`;
    }
  }

  /**
   * Đi tới chỗ của chương `id` (xem spots.js) rồi gọi onArrive(id) để mở bảng. Trả false nếu không có chương đó.
   * Đang đứng sẵn trong bán kính thì xoay mặt vào vật và mở luôn.
   */
  function goTo(id) {
    const s = spotById(id); if (!s) return false;
    release(); nav.clear(); arrival.start(s); showHint(s);
    const r = arrival.step(P, false);
    if (r && r.arrived) { arrive(r.arrived); return true; }
    arrival.start(s);
    const path = findPath(P.x, P.z, s.stand.x, s.stand.z);
    if (path && path.length) nav.setPath(path); else nav.setTarget(s.stand.x, s.stand.z);
    mark.position.set(s.stand.x, P.y + 0.06, s.stand.z); mark.visible = true;
    return true;
  }
  /** Đổi tên/màu áo/kiểu đầu: dựng lại nhân vật tại chỗ cũ (giữ vị trí, hướng nhìn). */
  function setProfile({ name, color, hair }) {
    const old = avatar, ry = old.group.rotation.y;
    scene.remove(old.group); old.dispose();
    avatar = createAvatar({ name, color, hair, mine: true }); scene.add(avatar.group);
    avatar.group.position.set(P.x, P.y, P.z); avatar.setFacing(ry, true);
  }
  /** Thu/phóng camera (delta dương = ra xa), dùng cho nút +/−. */
  function zoom(delta) { dist = zoomCamera(dist, delta); }
  /** Đi bộ tới điểm (x, z) bất kỳ (tìm đường vòng vật cản), không mở bảng nào. */
  function walkTo(x, z) {
    release(); arrival.cancel(); showHint(null);
    const path = findPath(P.x, P.z, x, z); if (path && path.length) nav.setPath(path); else nav.setTarget(x, z);
    mark.position.set(x, P.y + 0.06, z); mark.visible = true;
  }
  /** Rời tư thế ngồi/lạy/đang đi tới bồ đoàn (người chơi muốn đi chỗ khác). Đang ngồi thì bước ra lối đi sau lưng. */
  function release() {
    const r = act.stand();
    if (r.seat && ['sit', 'meditate', 'chant', 'beads'].includes(r.was)) { const q = standPoint(r.seat); P.x = q.x; P.z = q.z; P.y = SEAT_Y; }
  }
  /** Đi tới bồ đoàn `id` rồi ngồi (then: 'sit' | 'meditate'). Trả false nếu không có chỗ đó. */
  function sit(id, then = 'sit') {
    const s = seatById(id); if (!s) return false;
    release(); nav.clear(); arrival.cancel(); showHint(null); act.goSit(s, then);
    const path = findPath(P.x, P.z, s.x, s.z); if (path && path.length) nav.setPath(path); else nav.setTarget(s.x, s.z);
    mark.position.set(s.x, SEAT_Y - 0.1, s.z); mark.visible = true;
    return true;
  }
  /** Lạy Phật: đứng trong chánh điện, quay mặt về bàn thờ, chắp tay cúi lạy. Trả true | false (đang bận) | 'outside' (chưa vào chánh điện). */
  function bow() {
    if (act.sitting) release();
    if (!inHall(P)) return 'outside';
    nav.clear(); arrival.cancel(); showHint(null); mark.visible = false;
    if (!act.bow()) return false;
    avatar.setFacing(Math.PI); return true;
  }
  /** Thiền: ngồi vào bồ đoàn (gần nhất nếu chưa ngồi) và ngồi yên có hào quang. Trả true | 'outside'. */
  function meditate() {
    if (act.sitting) return act.meditate();
    if (!inHall(P)) return 'outside';
    const s = nearestFreeSeat(P); return s ? sit(s.id, 'meditate') : false;
  }
  /** Tụng kinh / Tràng hạt: ngồi vào bồ đoàn (gần nhất nếu chưa ngồi) rồi chuyển hoạt động. Trả true | false | 'outside'. */
  function practice(kind) {
    if (act.sitting) return act.practice(kind);
    if (!inHall(P)) return 'outside';
    const s = nearestFreeSeat(P); return s ? sit(s.id, kind) : false;
  }
  const chant = () => practice('chant'), beads = () => practice('beads');
  /** Về lại ngồi yên (đóng màn tụng/tràng hạt nhưng chưa đứng dậy). */
  const rest = () => act.practice('sit');
  function stand() { const was = act.mode; release(); return was; }

  function arrive(s) {
    showHint(null); nav.clear(); mark.visible = false;
    avatar.setFacing(faceAngle(P, s));
    onArrive?.(s.id);
  }

  /** Dịch chuyển tới (x, z). ry (tùy chọn) = hướng nhìn của nhân vật; khi có thì camera về phía sau lưng (yaw = 0). Phiên 38: dùng khi vào/ra nhà. */
  function teleport(x, z, ry) {
    release(); arrival.cancel(); showHint(null);
    P.x = x; P.z = z; P.y = 0; nav.clear(); mark.visible = false; cam.init = false;
    if (Number.isFinite(ry)) { avatar.setFacing(ry, true); yaw = 0; }
    avatar.group.position.set(P.x, P.y, P.z);
  }

  // Phiên 90: Thiết đầu công — lao đầu về phía trước rất nhanh (nhân vật chúi đầu), bỏ qua đi bộ trong lúc lao.
  let dashS = null;
  function dash(to, dur = 0.32, opts) {
    if (!to || !Number.isFinite(+to.x) || !Number.isFinite(+to.z) || dashS) return false;
    nav.clear(); mark.visible = false; const ry = facingOf(to.x - P.x, to.z - P.z);
    dashS = { x0: P.x, z0: P.z, x1: +to.x, z1: +to.z, t: 0, dur: Math.max(0.1, +dur || 0.32), tilt: !(opts && opts.tilt === false) };   // Phiên 127: tilt=false → lao tới quái (đạp đất chạy nhanh, KHÔNG chúi đầu)
     if (Math.hypot(to.x - P.x, to.z - P.z) > 0.2) avatar.setFacing(ry, true); return true;
  }
  // Phiên 91: bị người khác khiêng lên vai — đứng yên, nằm vắt trên vai người khiêng (x, z, y do js/ui/throwPlayer.js cập nhật theo vị trí người đó). hold(null) = thả xuống.
  let heldS = null;
  function hold(to) {
    if (to && Number.isFinite(+to.x) && Number.isFinite(+to.z)) {
      if (!heldS) { release(); arrival.cancel(); showHint(null); nav.clear(); mark.visible = false; }
      heldS = { x: +to.x, z: +to.z, y: Number.isFinite(+to.y) ? +to.y : 2.1 }; return true;
    }
    if (heldS) { heldS = null; avatar.group.rotation.x = 0; }
    return false;
  }
  /** Gọi mỗi khung hình (thay rail.update khi ở chế độ đi bộ). */
  function update(dt) {
    let v = null, spd = WALK_SPEED;
    try { avatar.setHold(!!(LGT.carry && LGT.carry.world && LGT.carry.world.held)); } catch (_) { /* thân khối không có tư thế giơ tay */ }   // Phiên 99: đang khiêng vật → giơ hai tay
    act.update(dt);
    if (act.sitting) {                                        // đang ngồi/thiền: khóa tại bồ đoàn, bỏ qua đi lại
      const s = act.seat; P.x = s.x; P.z = s.z; P.y = damp(P.y, SEAT_Y, 10, dt); speedNow = 0; nav.clear(); mark.visible = false;
      avatar.setFacing(s.ry); avatar.setState(act.avatarState() || 'sit', 0); avatar.group.position.set(P.x, P.y, P.z); avatar.update(dt);
      camStep(dt); return;
    }
    if (act.mode === 'bow') {                                 // đang lạy: đứng yên (phím/bấm sẽ hủy qua release)
      speedNow = 0; P.y = damp(P.y, walkStep(P, { x: 0, z: 0 }, dt, 0).y, 14, dt);
      avatar.setState('bow', 0); avatar.group.position.set(P.x, P.y, P.z); avatar.update(dt);
      camStep(dt); return;
    }
    if (heldS) {                                              // đang bị khiêng: theo người khiêng, khóa đi lại/nhảy
      P.x = damp(P.x, heldS.x, 12, dt); P.z = damp(P.z, heldS.z, 12, dt); P.y = damp(P.y, heldS.y, 12, dt); speedNow = 0; nav.clear(); mark.visible = false;
      avatar.setState('idle', 0); avatar.group.position.set(P.x, P.y, P.z); avatar.update(dt); avatar.group.rotation.x = 1.3;   // nằm vắt ngang vai
      camStep(dt); return;
    }
    if (dashS) {
      dashS.t += dt; const k = Math.min(1, dashS.t / dashS.dur), e = 1 - (1 - k) * (1 - k);   // nhanh lúc đầu, chậm dần
      P.x = dashS.x0 + (dashS.x1 - dashS.x0) * e; P.z = dashS.z0 + (dashS.z1 - dashS.z0) * e; P.y = damp(P.y, walkStep(P, { x: 0, z: 0 }, dt, 0).y, 14, dt); speedNow = 0;
      avatar.setState(dashS.tilt ? 'idle' : 'walk', dashS.tilt ? 0 : 6.5); avatar.group.position.set(P.x, P.y, P.z); avatar.update(dt); avatar.group.rotation.x = dashS.tilt ? 1.15 * Math.sin(Math.PI * Math.min(1, k * 1.15 + 0.08)) : 0;   // chúi đầu (Thiết đầu công)
      if (k >= 1) { dashS = null; avatar.group.rotation.x = 0; }
      camStep(dt); return;
    }
    if (!blockedNow()) {
      const m = moveVector(keys, joy, yaw);
      if (m.mag > 0) { v = m; spd = (keys.run || joyRunning ? RUN_SPEED : WALK_SPEED); }
      else { const d = nav.dir(P, dt); if (d) { v = d; spd = CLICK_SPEED; } }
    } else { nav.clear(); arrival.cancel(); showHint(null); }
    if (!nav.active) mark.visible = false;
    if (v) {
      const r = walkStep(P, v, dt, spd * (v.mag ?? 1) * (LGT.swim ? LGT.swim.speedMul : 1) * (LGT.board ? LGT.board.speedMul : 1));   // Phiên 92: đứng trên ván trượt → ×2
      speedNow = damp(speedNow, r.moved / Math.max(dt, 1e-4), 12, dt); P.x = r.x; P.z = r.z; P.y = damp(P.y, r.y, 14, dt);
      if (r.moved > 1e-4) avatar.setFacing(facingOf(v.x, v.z));
    } else { speedNow = damp(speedNow, 0, 14, dt); P.y = damp(P.y, walkStep(P, { x: 0, z: 0 }, dt, 0).y, 14, dt); }
    if (arrival.spot) {                                       // đang đi tới một chương: tới nơi thì mở, bị kẹt thì thôi
      const ev = arrival.step(P, nav.active);
      if (ev && ev.arrived) arrive(ev.arrived); else if (ev && ev.failed) { showHint(null); mark.visible = false; }
    }
    if (act.mode === 'toSeat') {                              // đang đi tới bồ đoàn: tới nơi thì ngồi, kẹt/hết đường thì thôi
      if (act.step(P) === 'seated') { nav.clear(); mark.visible = false; P.x = act.seat.x; P.z = act.seat.z; }
      else if (!nav.active && !v) act.cancelWalk();
    }
    avatar.setState(speedNow > 0.4 && !(LGT.board && LGT.board.on) ? 'walk' : 'idle', speedNow);   // trên ván trượt: đứng yên, không bước chân
    avatar.group.position.set(P.x, P.y, P.z); avatar.update(dt);
    if (mark.visible) { const s = 1 + 0.12 * Math.sin(performance.now() / 160); mark.scale.set(s, s, s); mark.position.y = P.y + 0.06; }
    camStep(dt);
  }

  /** Camera: bám theo, làm mượt (giật cục khi va tường thì mượt hơn). */
  function camStep(dt) {
    shotK = damp(shotK, shot ? 1 : 0, shot ? 3.2 : 2.4, dt); if (!shot && shotK < 0.002) { shotK = 0; shotCur = null; }
    if (shot) shotCur = shotPose(shot, avatar.group.rotation.y) || shotCur;   // góc quay bám hướng nhìn nhân vật (Phiên 120)
    const e = blendShot({ yaw, pitch, dist }, shotK > 0 ? shotCur : null, shotK);
    const want = clipCamDist(P, e.yaw, e.pitch, e.dist, solidAt);   // Phiên 31: camera không xuyên tường/vật cản
    camD = camD == null ? want : damp(camD, want, want < camD ? 16 : 3, dt);   // bị chắn thì lùi vào nhanh, thoáng thì ra từ từ
    const c = camPose(P, e.yaw, e.pitch, camD);
    if (!cam.init) { cam.x = c.pos.x; cam.y = c.pos.y; cam.z = c.pos.z; cam.lx = c.look.x; cam.ly = c.look.y; cam.lz = c.look.z; cam.init = true; }
    const k = 9; cam.x = damp(cam.x, c.pos.x, k, dt); cam.y = damp(cam.y, c.pos.y, k, dt); cam.z = damp(cam.z, c.pos.z, k, dt);
    cam.lx = damp(cam.lx, c.look.x, 12, dt); cam.ly = damp(cam.ly, c.look.y, 12, dt); cam.lz = damp(cam.lz, c.look.z, 12, dt);
    camera.position.set(cam.x, Math.max(0.5, cam.y), cam.z); camera.lookAt(cam.lx, cam.ly, cam.lz);
  }

  LGT.world = { setProfile, zoom, walkTo, sit, bow, meditate, chant, beads, rest, stand, get mode() { return act.mode; }, seats: SEATS, get pos() { return { x: P.x, z: P.z, y: P.y }; }, get facing() { return avatar.group.rotation.y; }, get dashing() { return !!dashS; }, get held() { return !!heldS; }, hold, dash, face(ry) { if (Number.isFinite(ry)) avatar.setFacing(ry, true); }, teleport, goTo, get avatar() { return avatar; }, get camera() { return { yaw, pitch, dist }; }, shot(name) { shot = name === 'cast' || name === 'show' ? name : ''; }, get shotName() { return shot; }, nav };
  update(0.016);
  return { update, get avatar() { return avatar; }, setProfile, zoom, walkTo, sit, bow, meditate, chant, beads, rest, stand, teleport, goTo, get pos() { return { x: P.x, z: P.z, y: P.y }; } };
}
