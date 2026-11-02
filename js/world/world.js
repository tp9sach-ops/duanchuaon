// Chế độ đi bộ: nhân vật người chơi + camera góc nhìn thứ ba + điều khiển (WASD/mũi tên, bấm-để-đi, kéo xoay, cuộn/chụm để zoom, joystick cảm ứng).
// Logic tính toán ở worldLogic.js (có test); file này chỉ nối với three.js, DOM và vòng lặp cảnh.
import * as THREE from 'three';
import './placements.js';                                  // đăng ký vật cản của hoa viên, nhà... vào layout.js
import { createAvatar } from './avatar.js';
import { SPAWN } from './layout.js';
import { spotById, pickSpot, createArrival, faceAngle } from './spots.js';
import { findPath } from './path.js';
import { damp } from '../util.js';
import {
  WALK_SPEED, RUN_SPEED, CLICK_SPEED, CAM_DIST, CAM_PITCH, moveVector, joyVector, walkStep, createNavigator, camPose, dragCamera, zoomCamera, facingOf,
} from './worldLogic.js';

const isEditable = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };

function savedName() { try { return localStorage.getItem('lgt.name') || 'Khách'; } catch (_) { return 'Khách'; } }
function savedColor() { try { return localStorage.getItem('lgt.color') || 'nau'; } catch (_) { return 'nau'; } }

/** opts: { scene, camera, canvas, coarse, LGT } → { update(dt), avatar, teleport(x, z), get pos }. */
export function createWorld({ scene, camera, canvas, coarse = false, LGT = window.LGT || {}, onArrive = null }) {
  const avatar = createAvatar({ name: savedName(), color: savedColor(), mine: true });
  scene.add(avatar.group);
  const P = { x: SPAWN.x, z: SPAWN.z, y: 0 };
  avatar.group.position.set(P.x, 0, P.z); avatar.setFacing(SPAWN.ry, true);

  const keys = { f: false, b: false, l: false, r: false, run: false };
  let joy = null, yaw = 0, pitch = CAM_PITCH.def, dist = CAM_DIST.def, speedNow = 0;
  const nav = createNavigator(), cam = { x: 0, y: 0, z: 0, lx: 0, ly: 0, lz: 0, init: false };
  const blockedNow = () => !!LGT.panelOpen;
  const arrival = createArrival();

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
    const k = KEYMAP[e.code]; if (!k) return;
    if (!blockedNow()) { keys[k] = true; nav.clear(); arrival.cancel(); showHint(null); e.preventDefault(); }
  });
  addEventListener('keyup', (e) => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = false; const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => { keys.f = keys.b = keys.l = keys.r = keys.run = false; });

  // --- chuột / cảm ứng trên cảnh: bấm = đi tới đó, kéo = xoay camera, hai ngón = zoom, cuộn = zoom
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  const ptrs = new Map(); let down = null, pinch = 0;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    down = ptrs.size === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 } : null;
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
    if (was && was.moved <= 8 && performance.now() - was.t < 500 && e.type === 'pointerup' && !blockedNow()) pickGround(e.clientX, e.clientY);
    if (was) down = null;
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => { if (blockedNow()) return; e.preventDefault(); dist = zoomCamera(dist, e.deltaY); }, { passive: false });

  /** Tia từ điểm màn hình (cx, cy) có trúng vật 3D gắn với chương nào không → spot hoặc null. */
  function spotAt(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const h = pickSpot(ray.ray.origin, ray.ray.direction);
    return h ? h.spot : null;
  }
  function pickGround(cx, cy) {
    const sp = spotAt(cx, cy); if (sp) { goTo(sp.id); return; }
    arrival.cancel(); showHint(null);
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
    st.textContent = '#joy{position:fixed;left:max(18px,env(safe-area-inset-left));bottom:max(86px,calc(env(safe-area-inset-bottom) + 70px));width:120px;height:120px;border-radius:50%;z-index:9;touch-action:none;background:rgba(6,7,13,.35);border:1px solid rgba(217,178,95,.45)}#joy i{position:absolute;left:38px;top:38px;width:44px;height:44px;border-radius:50%;background:rgba(217,178,95,.55);border:1px solid rgba(217,178,95,.9);pointer-events:none}.panel-open #joy{display:none}';
    document.head.appendChild(st);
    const base = document.createElement('div'); base.id = 'joy'; base.setAttribute('aria-hidden', 'true'); const knob = document.createElement('i'); base.appendChild(knob); document.body.appendChild(base);
    let jid = null, c0 = null;
    base.addEventListener('pointerdown', (e) => { jid = e.pointerId; const r = base.getBoundingClientRect(); c0 = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; base.setPointerCapture(e.pointerId); nav.clear(); arrival.cancel(); showHint(null); onJoy(e); });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === jid) onJoy(e); });
    const off = (e) => { if (e.pointerId !== jid) return; jid = null; joy = null; knob.style.transform = ''; };
    base.addEventListener('pointerup', off); base.addEventListener('pointercancel', off);
    function onJoy(e) { const j = joyVector(e.clientX - c0.x, e.clientY - c0.y, 56); joy = j.x || j.y ? j : null; knob.style.transform = `translate(${Math.max(-40, Math.min(40, (e.clientX - c0.x) * 0.7))}px,${Math.max(-40, Math.min(40, (e.clientY - c0.y) * 0.7))}px)`; }
  }

  /**
   * Đi tới chỗ của chương `id` (xem spots.js) rồi gọi onArrive(id) để mở bảng. Trả false nếu không có chương đó.
   * Đang đứng sẵn trong bán kính thì xoay mặt vào vật và mở luôn.
   */
  function goTo(id) {
    const s = spotById(id); if (!s) return false;
    nav.clear(); arrival.start(s); showHint(s);
    const r = arrival.step(P, false);
    if (r && r.arrived) { arrive(r.arrived); return true; }
    arrival.start(s);
    const path = findPath(P.x, P.z, s.stand.x, s.stand.z);
    if (path && path.length) nav.setPath(path); else nav.setTarget(s.stand.x, s.stand.z);
    mark.position.set(s.stand.x, P.y + 0.06, s.stand.z); mark.visible = true;
    return true;
  }
  function arrive(s) {
    showHint(null); nav.clear(); mark.visible = false;
    avatar.setFacing(faceAngle(P, s));
    onArrive?.(s.id);
  }

  function teleport(x, z) { P.x = x; P.z = z; nav.clear(); mark.visible = false; cam.init = false; }

  /** Gọi mỗi khung hình (thay rail.update khi ở chế độ đi bộ). */
  function update(dt) {
    let v = null, spd = WALK_SPEED;
    if (!blockedNow()) {
      const m = moveVector(keys, joy, yaw);
      if (m.mag > 0) { v = m; spd = (keys.run ? RUN_SPEED : WALK_SPEED); }
      else { const d = nav.dir(P, dt); if (d) { v = d; spd = CLICK_SPEED; } }
    } else { nav.clear(); arrival.cancel(); showHint(null); }
    if (!nav.active) mark.visible = false;
    if (v) {
      const r = walkStep(P, v, dt, spd * (v.mag ?? 1));
      speedNow = damp(speedNow, r.moved / Math.max(dt, 1e-4), 12, dt); P.x = r.x; P.z = r.z; P.y = damp(P.y, r.y, 14, dt);
      if (r.moved > 1e-4) avatar.setFacing(facingOf(v.x, v.z));
    } else { speedNow = damp(speedNow, 0, 14, dt); P.y = damp(P.y, walkStep(P, { x: 0, z: 0 }, dt, 0).y, 14, dt); }
    if (arrival.spot) {                                       // đang đi tới một chương: tới nơi thì mở, bị kẹt thì thôi
      const ev = arrival.step(P, nav.active);
      if (ev && ev.arrived) arrive(ev.arrived); else if (ev && ev.failed) { showHint(null); mark.visible = false; }
    }
    avatar.setState(speedNow > 0.4 ? 'walk' : 'idle', speedNow);
    avatar.group.position.set(P.x, P.y, P.z); avatar.update(dt);
    if (mark.visible) { const s = 1 + 0.12 * Math.sin(performance.now() / 160); mark.scale.set(s, s, s); mark.position.y = P.y + 0.06; }

    // Camera: bám theo, làm mượt (giật cục khi va tường thì mượt hơn)
    const c = camPose(P, yaw, pitch, dist);
    if (!cam.init) { cam.x = c.pos.x; cam.y = c.pos.y; cam.z = c.pos.z; cam.lx = c.look.x; cam.ly = c.look.y; cam.lz = c.look.z; cam.init = true; }
    const k = 9; cam.x = damp(cam.x, c.pos.x, k, dt); cam.y = damp(cam.y, c.pos.y, k, dt); cam.z = damp(cam.z, c.pos.z, k, dt);
    cam.lx = damp(cam.lx, c.look.x, 12, dt); cam.ly = damp(cam.ly, c.look.y, 12, dt); cam.lz = damp(cam.lz, c.look.z, 12, dt);
    camera.position.set(cam.x, Math.max(0.5, cam.y), cam.z); camera.lookAt(cam.lx, cam.ly, cam.lz);
  }

  LGT.world = { get pos() { return { x: P.x, z: P.z, y: P.y }; }, teleport, goTo, get avatar() { return avatar; }, get camera() { return { yaw, pitch, dist }; }, nav };
  update(0.016);
  return { update, avatar, teleport, goTo, get pos() { return { x: P.x, z: P.z, y: P.y }; } };
}
