// Nhân vật người chơi (three.js): đầu, thân áo, tay, chân; tên nổi trên đầu; bong bóng chat; hoạt ảnh đi/ngồi/gõ mõ/lạy.
// Gốc tọa độ = dưới bàn chân, nhìn về +z (khớp quy ước ry của layout.js). Cao ~1,7 đơn vị.
// Logic tư thế/tên/chat nằm ở avatarLogic.js (có test). Dùng: const a = createAvatar({ name, color }); scene.add(a.group); mỗi khung: a.update(dt).
import * as THREE from 'three';
import { colorById, cleanName, cleanSay, bubbleLife, wrapText, poseFor, turnToward } from './avatarLogic.js';

const SKIN = 0xe0b48a, HAIR = 0x1b1512;
const FONT = '600 38px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

function makeSprite(tex, w, h, y) {
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const s = new THREE.Sprite(m); s.scale.set(w, h, 1); s.position.y = y; s.renderOrder = 20; return s;
}

function nameTexture(name, mine) {
  const c = canvas(512, 80), g = c.getContext('2d');
  g.font = FONT; const tw = Math.min(480, g.measureText(name).width + 40);
  g.fillStyle = mine ? 'rgba(74,165,138,.85)' : 'rgba(6,7,13,.72)'; roundRect(g, (512 - tw) / 2, 8, tw, 64, 30); g.fill();
  g.fillStyle = '#f2dfa6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 256, 42, 460);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function bubbleTexture(text) {
  const lines = wrapText(text, 18, 4), lh = 46, h = lines.length * lh + 44, c = canvas(512, Math.max(96, h)), g = c.getContext('2d');
  g.font = FONT; const tw = Math.min(496, Math.max(...lines.map((l) => g.measureText(l).width)) + 44);
  g.fillStyle = 'rgba(250,244,226,.96)'; roundRect(g, (512 - tw) / 2, 4, tw, c.height - 20, 22); g.fill();
  g.beginPath(); g.moveTo(244, c.height - 17); g.lineTo(256, c.height - 2); g.lineTo(268, c.height - 17); g.fill();   // mũi nhọn chỉ xuống người nói
  g.fillStyle = '#2a1d10'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, 256, 4 + 22 + lh / 2 + i * lh, 480));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { tex: t, ratio: c.height / 512 };
}

/** Tạo nhân vật. opts: { name, color (id màu áo), mine (true = nhân vật của mình, nhãn tên màu ngọc) } */
export function createAvatar({ name = 'Khách', color = 'nau', mine = false } = {}) {
  const col = colorById(color), group = new THREE.Group(), rig = new THREE.Group();   // rig hạ xuống khi ngồi/lạy
  group.add(rig);
  const std = (c, r = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const robe = std(col.ao, 0.85), belt = std(col.dai, 0.8), skin = std(SKIN, 0.7), hair = std(HAIR, 0.9);
  const geos = [], mats = [robe, belt, skin, hair];
  const geo = (g) => (geos.push(g), g);

  // Chân: trụ xoay quanh hông (pivot ở đỉnh), hông cao 0,82
  const legGeo = geo(new THREE.CylinderGeometry(0.075, 0.065, 0.8, 10)); legGeo.translate(0, -0.4, 0);
  const mkLeg = (x) => { const p = new THREE.Group(); p.position.set(x, 0.82, 0); const m = new THREE.Mesh(legGeo, robe); p.add(m); rig.add(p); return p; };
  const legL = mkLeg(-0.1), legR = mkLeg(0.1);

  // Thân: trụ thon + đai; tà áo dài tới gối
  const body = new THREE.Group(); body.position.y = 0.82; rig.add(body);
  const torso = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.21, 0.26, 0.72, 14)), robe); torso.position.y = 0.36; body.add(torso);
  const skirt = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.26, 0.31, 0.38, 14, 1, true)), robe); skirt.position.y = -0.08; skirt.material.side = THREE.DoubleSide; body.add(skirt);
  const sash = new THREE.Mesh(geo(new THREE.TorusGeometry(0.255, 0.028, 8, 20)), belt); sash.rotation.x = Math.PI / 2; sash.position.y = 0.1; body.add(sash);

  // Tay: pivot ở vai
  const armGeo = geo(new THREE.CylinderGeometry(0.055, 0.05, 0.62, 8)); armGeo.translate(0, -0.31, 0);
  const handGeo = geo(new THREE.SphereGeometry(0.058, 8, 8));
  const mkArm = (x) => { const p = new THREE.Group(); p.position.set(x, 0.66, 0); p.add(new THREE.Mesh(armGeo, robe)); const h = new THREE.Mesh(handGeo, skin); h.position.y = -0.64; p.add(h); body.add(p); return p; };
  const armL = mkArm(-0.3), armR = mkArm(0.3);

  // Đầu: cổ, đầu, tóc (nửa cầu phía sau và trên)
  const head = new THREE.Group(); head.position.y = 0.76; body.add(head);
  const neck = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8)), skin); neck.position.y = 0.02; head.add(neck);
  const skull = new THREE.Mesh(geo(new THREE.SphereGeometry(0.15, 16, 14)), skin); skull.scale.set(0.95, 1.08, 1); skull.position.y = 0.2; head.add(skull);
  const cap = new THREE.Mesh(geo(new THREE.SphereGeometry(0.158, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)), hair); cap.scale.set(0.97, 1.1, 1.02); cap.position.set(0, 0.215, -0.012); cap.rotation.x = -0.25; head.add(cap);

  // Tên và bong bóng chat
  const nameTex = nameTexture(cleanName(name), mine), label = makeSprite(nameTex, 1.28, 0.2, 2.12); group.add(label);
  let bubble = null, bubbleTex = null, bubbleUntil = 0, clock = 0;

  const st = { state: 'idle', speed: 0, ry: 0, targetRy: 0, sit: 0, pose: poseFor('idle', 0) };
  group.rotation.y = 0;

  function setState(s, speed = 0) { st.state = s; st.speed = speed; }
  function setFacing(ry, instant = false) { st.targetRy = ry; if (instant) { st.ry = ry; group.rotation.y = ry; } }
  /** Hiện bong bóng chat (đã làm sạch). Chuỗi rỗng → ẩn. */
  function say(text) {
    const t = cleanSay(text);
    if (bubble) { group.remove(bubble); bubble.material.dispose(); bubbleTex?.dispose(); bubble = null; bubbleTex = null; }
    if (!t) return '';
    const { tex, ratio } = bubbleTexture(t); bubbleTex = tex;
    bubble = makeSprite(tex, 1.9, 1.9 * ratio, 2.45 + 1.9 * ratio / 2 - 0.1); group.add(bubble);
    bubbleUntil = clock + bubbleLife(t) / 1000; return t;
  }

  /** Gọi mỗi khung hình với dt (giây). Làm mượt tư thế, quay mặt, hết giờ thì ẩn bong bóng. */
  function update(dt) {
    clock += dt;
    const target = poseFor(st.state, clock, st.speed), p = st.pose, k = Math.min(1, 14 * dt);
    for (const key of Object.keys(target)) p[key] += (target[key] - p[key]) * (key === 'sit' ? Math.min(1, 6 * dt) : k);
    legL.rotation.x = p.legL - p.sit * 1.5; legR.rotation.x = p.legR - p.sit * 1.5;
    legL.rotation.z = p.sit * 0.55; legR.rotation.z = -p.sit * 0.55;     // ngồi kiết già: hai gối dạng ra
    armL.rotation.x = p.armL; armR.rotation.x = p.armR;
    body.rotation.x = p.lean; head.rotation.x = p.head;
    rig.position.y = p.dy - p.sit * 0.5;
    st.ry = turnToward(st.ry, st.targetRy, 9 * dt); group.rotation.y = st.ry;
    if (bubble && clock > bubbleUntil) say('');
  }

  function dispose() {
    say(''); label.material.dispose(); nameTex.dispose(); geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose());
  }

  return { group, setState, setFacing, say, update, dispose, get state() { return st.state; } };
}
