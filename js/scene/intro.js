// Cảnh mở đầu (Phiên 91): nhân vật cưỡi hạc bay một vòng bản đồ rồi đáp xuống SPAWN trước cổng chùa; xong mới hiện màn đăng nhập. Đường bay/camera: js/world/intro.js (có test).
// Đặt LGT.intro = { active, play({ onLabel, onDone }), skip(), t }. scene/index.js gọi intro.update(dt) thay world.update khi active.
import * as THREE from 'three';
import { buildCrane } from './crane.js';
import { DURATION, introState, introCamera } from '../world/intro.js';
import { SPAWN } from '../world/layout.js';

export function buildIntro({ scene, camera, world, LGT, reduce = false }) {
  const crane = buildCrane(); crane.group.visible = false; scene.add(crane.group);
  const S = 1.5, seatW = new THREE.Vector3();   // hạc to hơn một chút so với người
  crane.group.scale.setScalar(S);
  let active = false, t = 0, cb = null, lastLabel = null;
  const api = { get active() { return active; }, get t() { return t; }, get duration() { return DURATION } };

  function place(st) {
    crane.group.position.set(st.x, st.y + 0.9, st.z);   // gốc = tâm thân hạc; lúc đáp thân cách đất ~0,9 m (chân sát đất)
    crane.group.rotation.set(-st.pitch * 0.8, st.heading, st.bank);
    crane.update(t, st.flap * (st.y < 1 ? 0.3 : 1), st.bank);
    crane.group.updateMatrixWorld(true); crane.seat.getWorldPosition(seatW);
    const av = world.avatar; av.group.position.copy(seatW); av.group.position.y -= 0.18; av.group.rotation.y = st.heading; av.setState('sit', 0);
  }
  function setLabel(l) { if (l !== lastLabel) { lastLabel = l; cb && cb.onLabel && cb.onLabel(l); } }

  api.play = (opts = {}) => {
    if (active) return false; cb = opts; t = 0; active = true; lastLabel = null; LGT.intro = api; crane.group.visible = true;
    const st = introState(0); place(st); const c = introCamera(st, 0); camera.position.set(...c.pos); camera.lookAt(...c.look); world.avatar.update(0.016);
    return true;
  };
  function finish(skipped) {
    if (!active) return; active = false; crane.group.visible = false;
    try { world.teleport(SPAWN.x, SPAWN.z, SPAWN.ry); } catch (_) { /* bỏ qua */ }   // người ở lại đúng chỗ xuất phát, camera đi bộ nhảy vào
    try { world.avatar.setState('idle', 0); world.avatar.group.rotation.x = 0; } catch (_) { /* bỏ qua */ }
    setLabel(''); const f = cb && cb.onDone; cb = null; f && f(!!skipped);
  }
  api.skip = () => finish(true);
  api.update = (dt) => {
    if (!active) return;
    t += Math.max(0, Math.min(0.1, dt)) * (reduce ? 1.6 : 1);
    if (t >= DURATION) { finish(false); return; }
    const st = introState(t); place(st); setLabel(st.label);
    const c = introCamera(st, t); camera.position.set(...c.pos); camera.lookAt(...c.look); world.avatar.update(dt);
  };
  return api;
}
