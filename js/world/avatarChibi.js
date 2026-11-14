// Nhân vật chibi dùng thân GLB có xương (Phiên 99; bản khớp: khuỷu tay, cổ tay, gối, cổ chân). Cùng giao diện với createAvatar cũ: { group, setState, setFacing, say, setBeadCount, swing, update, dispose, state, swinging } + MỚI: setHold(bool) (giơ tay khiêng vật), act('throw'|'grab').
// Tư thế lấy từ poseFor (avatarLogic.js) rồi đổi thành góc xương bằng chibiPose (chibiRig.js, có test) → mọi trạng thái cũ (đứng, đi, ngồi, gõ mõ, lần hạt, lạy, vung côn) giữ nguyên nhịp, chỉ đổi hình dáng.
// Phiên 119 (theo clip mẫu): swing() nhận kiểu đòn — không đối số = tự nối chuỗi múa côn → ngang → ngược → xoay (đánh thường); số (skill Chém khí) = 'khi' (giơ cao bổ xuống); chuỗi tên = đúng kiểu đó; trả về tên kiểu đã chọn. setStance(bool) = thế sẵn sàng chiến đấu (khom, chân trước/sau, chạy nghiêng người). Logic: world/combo.js.
// Phiên 126: côn BỎ MŨI NHỌN, nắm ở giữa cán, múa/xoay quanh bàn tay (pose.spin); HỒ LÔ đeo eo trái (gourdPos(), pulseGourd() — hồn quái bay vào, xem js/world/soul.js); thanh Sinh Lực + Chân khí trên đầu: setBars(hp 0..1 | null, mp 0..1) (js/ui/combatPose.js).
// Phiên 131: CHỈ NGƯỜI CHƠI đeo hồ lô — createChibiAvatar({ gourd: false }) (NPC, dân làng) thì không có hồ lô; mặc định gourd = true.
// Mặt (mắt cười, miệng, má hồng), râu, tóc búi, hào quang gắn vào xương đầu; áo polo 9 Sạch = vùng màu trên thân + cổ áo + logo; cà sa = vỏ chuông gắn vào hông. Lỗi/chưa nạp GLB thì avatar.js dùng bản dựng khối.
import * as THREE from 'three';
import { DEFAULT_COLOR, colorById, hairById, beardById, cleanName, cleanSay, bubbleLife, poseFor, turnToward, BELL_PROFILE, POLO_LOGOS } from './avatarLogic.js';
import { swingPose, SWING_S } from './conKhi.js';
import { comboPose, comboEnd, nextKind, applyStance, weaponVisible, KINDS } from './combo.js';
import { chibiPose, CHIBI_H, LM } from './chibiRig.js';
import { showPose, SHOW_S } from './fishPose.js';   // Phiên 128: giơ cá bằng hai tay
import { buildChibi, applyChibiPose } from '../scene/chibiBody.js';
import { logoTexture, casaTexture, makeSprite, nameTexture, bubbleTexture } from './avatar.js';

const SKIN = 0xe8934c, HAIR = 0x1f1511, OUTLINE = 0x3a2314;
const ACT_S = { throw: 0.55, grab: 0.8, show: SHOW_S };   // giây của từng động tác một lần
const SMOOTH_ARM = ['armL', 'armR', 'foreL', 'foreR', 'handL', 'handR'];

export function createChibiAvatar({ name = 'Khách', color = DEFAULT_COLOR, hair: hairId = 'troc', beard: beardId = '', mine = false, gourd: wantGourd = true } = {}) {
  const col = colorById(color), group = new THREE.Group(), rig = new THREE.Group(); group.add(rig);
  const geos = [], mats = [], polo = !!col.polo, casa = !!col.casa;
  const geo = (g) => (geos.push(g), g);
  const std = (c, r = 0.62) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: r }); mats.push(m); return m; };
  const basic = (c, o = {}) => { const m = new THREE.MeshBasicMaterial({ color: c, ...o }); mats.push(m); return m; };
  const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo(g), m); o.position.set(x, y, z); parent.add(o); return o; };

  // Thân GLB + xương. Vùng màu: da / áo / tay áo / quần / giày.
  const pal = { skin: SKIN, shirt: col.ao, sleeve: polo ? col.tay : col.ao, pants: polo ? 0x2b2f3a : col.dai, shoe: 0x4a2f1c };
  const ch = buildChibi(pal), B = ch.bones; rig.add(ch.mesh);
  const H = CHIBI_H, neckY = LM.neck * H, crotchY = LM.crotch * H, hd = ch.head;

  // Bóng mờ dưới chân
  const shadow = mesh(new THREE.CircleGeometry(0.46, 20), basic(0x000000, { transparent: true, opacity: 0.26, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), group, 0, 0.03, 0);
  shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = 1;

  // Mặt + râu + tóc búi: dựng theo "đầu cầu bán kính 0,42" của bản cũ rồi co giãn khớp đầu của mô hình; gắn vào xương đầu (xương đầu đặt ở cổ).
  const face = new THREE.Group(); face.position.set(hd.cx, hd.cy - neckY, hd.cz); face.scale.set(hd.rx / 0.42, hd.ry / 0.399, hd.rz / 0.4116); B.head.add(face);
  const eyeM = basic(0x3a2012), eyeG = geo(new THREE.TorusGeometry(0.055, 0.014, 6, 14, Math.PI));
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(eyeG, eyeM); e.position.set(sx * 0.16, 0.035, 0.392); e.rotation.y = sx * 0.4; face.add(e); }
  const mouth = new THREE.Mesh(geo(new THREE.TorusGeometry(0.034, 0.011, 6, 12, Math.PI)), eyeM); mouth.position.set(0, -0.1, 0.414); mouth.rotation.z = Math.PI; face.add(mouth);
  const cheekM = basic(0xf06a6a, { transparent: true, opacity: 0.55, depthWrite: false }), cheekG = geo(new THREE.CircleGeometry(0.062, 14));
  for (const sx of [-1, 1]) { const c = new THREE.Mesh(cheekG, cheekM); c.position.set(sx * 0.255, -0.06, 0.338); c.rotation.y = sx * 0.85; face.add(c); }
  const bd = beardById(beardId);
  if (bd.id) {
    const bm = std(bd.mau, 0.85);
    for (const sx of [-1, 1]) {
      const mu = mesh(new THREE.SphereGeometry(0.075, 10, 8), bm, face, sx * 0.065, -0.062, 0.405); mu.scale.set(1.25, 0.5, 0.6); mu.rotation.z = sx * -0.35;
      const br = mesh(new THREE.SphereGeometry(0.06, 8, 6), bm, face, sx * 0.16, 0.115, 0.38); br.scale.set(1.5, 0.35, 0.5); br.rotation.z = sx * -0.25;
    }
    const chin = mesh(new THREE.SphereGeometry(0.2, 16, 12), bm, face, 0, -0.27, 0.27); chin.scale.set(1.05, 1.15, 0.55);
    const tail = mesh(new THREE.ConeGeometry(0.17, 0.5, 14), bm, face, 0, -0.55, 0.3); tail.rotation.x = Math.PI + 0.12; tail.scale.set(1, 1, 0.55);
  }
  let bun = null;   // búi tóc: ẩn khi đội nón (Phiên 154)
  if (hairById(hairId).id === 'bui') {
    const hairM = std(HAIR, 0.8), cap = mesh(new THREE.SphereGeometry(0.435, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.43), hairM, face, 0, 0.01, -0.025); cap.scale.set(1, 0.97, 1); cap.rotation.x = -0.32;
    bun = mesh(new THREE.SphereGeometry(0.125, 14, 10), hairM, face, 0, 0.5, -0.1);
  }
  // Hào quang (khi ngồi thiền/tụng)
  const haloC = document.createElement('canvas'); haloC.width = haloC.height = 128; { const g = haloC.getContext('2d'), gr = g.createRadialGradient(64, 64, 18, 64, 64, 62); gr.addColorStop(0, 'rgba(255,248,214,.0)'); gr.addColorStop(0.55, 'rgba(255,240,190,.95)'); gr.addColorStop(0.7, 'rgba(255,224,150,.45)'); gr.addColorStop(1, 'rgba(255,224,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const haloTex = new THREE.CanvasTexture(haloC); haloTex.colorSpace = THREE.SRGBColorSpace;
  const haloMat = new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const halo = new THREE.Sprite(haloMat); halo.scale.set(1.9, 1.9, 1); halo.position.set(hd.cx, hd.cy - neckY + 0.02, hd.cz - hd.rz * 0.85); B.head.add(halo);

  // Cổ áo polo + logo ngực trái / lưng; chuỗi hạt quanh cổ; tràng hạt 108
  const spY = crotchY, zf = ch.torso.zf, zb = ch.torso.zb, midZ = (zf + zb) / 2;   // gốc xương thân ở y = crotchY
  if (polo) {
    const collar = mesh(new THREE.TorusGeometry(0.13, 0.026, 8, 24), basic(col.co ?? col.dai), B.spine, 0, neckY - spY - 0.02, midZ + 0.02); collar.rotation.x = Math.PI / 2; collar.scale.set(1, 0.78, 1);
    const logoM = new THREE.MeshStandardMaterial({ map: logoTexture(), transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); mats.push(logoM);
    const ly = 0.36 * H - spY;
    const chest = mesh(new THREE.PlaneGeometry(0.1, 0.1), logoM, B.spine, 0.065, ly + 0.02, zf + 0.006); chest.renderOrder = 2;
    const back = mesh(new THREE.PlaneGeometry(0.2, 0.2), logoM, B.spine, 0, ly, zb - 0.006); back.rotation.y = Math.PI; back.renderOrder = 2;
  }
  { const beadM = std(0xc9792f, 0.4), beads = new THREE.InstancedMesh(geo(new THREE.SphereGeometry(0.03, 8, 6)), beadM, 15), m4 = new THREE.Matrix4();
    for (let i = 0; i < 15; i++) { const a = (i / 15) * Math.PI * 2; m4.makeTranslation(Math.sin(a) * 0.14, neckY - spY - 0.06 - (Math.cos(a) > 0 ? 0.07 * Math.cos(a) : 0), midZ + 0.02 + Math.cos(a) * 0.1); beads.setMatrixAt(i, m4); }
    B.spine.add(beads); mats.push(beadM); }
  const mala = new THREE.Group(); mala.position.set(0, 0.4 * H - spY, zf + 0.12); mala.visible = false; B.spine.add(mala);
  const malaG = geo(new THREE.SphereGeometry(0.022, 6, 5)), malaBeads = new THREE.InstancedMesh(malaG, std(0xd9a24a, 0.4), 108), m4 = new THREE.Matrix4();
  for (let i = 0; i < 108; i++) { const a = (i / 108) * Math.PI * 2; m4.makeTranslation(Math.sin(a) * 0.16, Math.cos(a) * 0.16, 0); malaBeads.setMatrixAt(i, m4); }
  mala.add(malaBeads); let malaTarget = 0, malaCur = 0;

  // Cà sa (NPC trụ trì): vỏ chuông phủ thân + dải vắt vai, gắn vào hông; áo trong kem. Thu chiều cao cho ngang vai chibi.
  if (casa) {
    const robe = new THREE.Group(); robe.scale.set(0.78, 0.8, 0.78); robe.position.set(0, -crotchY, midZ); B.hips.add(robe);
    const bell = geo(new THREE.LatheGeometry(BELL_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 30)); robe.add(new THREE.Mesh(bell, std(col.ao, 0.7)));
    const prof = BELL_PROFILE.map(([r, y]) => new THREE.Vector2(r * 1.035 + 0.004, y));
    const drape = new THREE.Mesh(geo(new THREE.LatheGeometry(prof, 36, -0.55, Math.PI * 2 - 1.05)), new THREE.MeshStandardMaterial({ map: casaTexture(), roughness: 0.75, side: THREE.DoubleSide })); mats.push(drape.material); robe.add(drape);
    const vienM = std(col.vien, 0.6), gau = mesh(new THREE.TorusGeometry(0.405, 0.022, 8, 36), vienM, robe, 0, 0.04, 0); gau.rotation.x = Math.PI / 2;
  }

  // Côn (cầm tay phải): gắn vào xương BÀN TAY (cổ tay) nên theo cả khuỷu lẫn cổ tay. Thân dọc theo cánh tay (trục −x của tay phải) → xoay −90° quanh z.
  // Phiên 126: BỎ MŨI NHỌN (trước đây có mũi thương + tua); cán đối xứng dài 1,5 m, NẮM ĐÚNG GIỮA cán (trâu da quấn chỗ nắm, hai đầu có chụp vàng + dải đỏ). MÚA: xoay quanh bàn tay theo pose.spin — đặt thứ tự Euler YXZ để xoay y (sau khi đã dóng cán dọc cánh tay bằng z) = côn quay trong mặt phẳng dọc trước người khi tay đưa ngang trước. Hiện sẵn khi vào thế chiến đấu (Phiên 120).
  const staff = new THREE.Group(); staff.visible = false; staff.rotation.order = 'YXZ'; staff.rotation.set(0, 0, -Math.PI / 2); staff.position.set(-0.03, 0, 0); B.handR.add(staff);
  { const woodM = std(0x7a4a24, 0.55), capM = std(0xe0a93a, 0.35), bandM = std(0xb3261e, 0.5), gripM = std(0x2f1d10, 0.8);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), woodM, staff, 0, 0, 0);                    // cán: y −0,75 … +0,75, tâm đúng chỗ nắm tay
    for (const s of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), capM, staff, 0, s * 0.74, 0); mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.12, 8), bandM, staff, 0, s * 0.5, 0); }   // chụp hai đầu + dải đỏ hai bên
    mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.16, 8), gripM, staff, 0, 0, 0); }                // quấn da chỗ nắm
  let swingT = -1, swingKind = '', lastKind = '', lastEnd = -9;   // Phiên 119: kiểu đòn đang vung, đòn trước + lúc nó kết thúc (để nối chuỗi)

  // Hồ lô (Phiên 126): đeo ở eo bên trái (không có ở NPC mặc cà sa vì bị vỏ chuông che). Quái bị hạ thì hồn bay vào đây: gourdPos() cho đích bay, pulseGourd() nháy to ra khi hồn chui vào.
  // Phiên 131: chỉ người chơi đeo (gourd: false cho NPC / dân làng).
  const gourd = new THREE.Group(), gourdV = new THREE.Vector3(); let gourdPulse = 0;
  const hasGourd = !casa && wantGourd;
  if (hasGourd) {
    gourd.position.set(0.21, 0.05, midZ - 0.01); B.hips.add(gourd);
    const gM = std(0xc47a22, 0.5), gM2 = std(0x8a4f14, 0.6), cordM = std(0xb3261e, 0.5);
    mesh(new THREE.SphereGeometry(0.075, 14, 10), gM, gourd, 0, -0.05, 0);                  // bầu dưới
    mesh(new THREE.SphereGeometry(0.05, 12, 9), gM, gourd, 0, 0.065, 0);                    // bầu trên
    mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.05, 8), gM2, gourd, 0, 0.12, 0);        // cổ
    mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.035, 8), cordM, gourd, 0, 0.16, 0);     // nút
    const cord = mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 14), cordM, gourd, 0, 0.1, 0); cord.rotation.x = Math.PI / 2;   // dây buộc ở cổ
  }

  // Phiên 152: THU CÔN KHI KHÔNG CHIẾN ĐẤU. Hết thế chiến đấu thì cây côn không biến mất mà thu gọn (ngắn 1,1 m), nằm chéo SAU LƯNG, có DÂY ĐEO chéo qua ngực + lưng, hai đầu vẫn PHÁT SÁNG nhấp nháy.
  // Chỉ người chơi (cùng điều kiện với hồ lô). backHost (group) để js/ui/items.js thay bằng Gậy như ý thu gọn. CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI): vị trí/góc là số TẠM.
  const backG = new THREE.Group(), backGlow = [], hasBack = !casa && wantGourd; let backTex = null;
  if (hasBack) {
    backG.visible = false; backG.position.set(0, 0.3 * H - spY, zb - 0.075); backG.rotation.set(0.12, 0, 0.8); B.spine.add(backG);
    const woodM = std(0x7a4a24, 0.55), capM = std(0xe0a93a, 0.35), bandM = std(0xb3261e, 0.5), strapM = std(0x5a2d12, 0.8), buckleM = std(0xe0a93a, 0.35);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), woodM, backG, 0, 0, 0);
    for (const sg of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 8), capM, backG, 0, sg * 0.54, 0); mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.1, 8), bandM, backG, 0, sg * 0.36, 0); }
    const gc = document.createElement('canvas'); gc.width = gc.height = 64; { const g = gc.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,246,214,1)'); gr.addColorStop(0.4, 'rgba(255,205,110,.6)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    backTex = new THREE.CanvasTexture(gc); backTex.colorSpace = THREE.SRGBColorSpace;
    for (const y of [-0.56, 0.56, 0]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: backTex, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.position.y = y; sp.scale.set(y === 0 ? 0.4 : 0.34, y === 0 ? 0.4 : 0.34, 1); backG.add(sp); backGlow.push(sp); mats.push(sp.material); }
    // dây đeo: một dải chéo từ vai phải xuống hông trái, ở mặt ngực và mặt lưng; khoen vàng ở giữa ngực
    const sy = 0.3 * H - spY;
    for (const zz of [zf + 0.006, zb - 0.006]) { const st2 = mesh(new THREE.BoxGeometry(0.04, 0.5, 0.012), strapM, B.spine, 0, sy, zz); st2.rotation.z = -0.62; }
    const ring = mesh(new THREE.TorusGeometry(0.025, 0.008, 6, 12), buckleM, B.spine, 0, sy, zf + 0.014);
  }
  const backHostGroup = backG;

  // Mũi tên ▼ (nhân vật của mình), tên, bong bóng chat
  let arrow = null; if (mine) { arrow = mesh(new THREE.ConeGeometry(0.11, 0.2, 4), basic(0xf2c14e), group, 0, 1.86, 0); arrow.rotation.x = Math.PI; }
  const nameTex = nameTexture(cleanName(name), mine), label = makeSprite(nameTex, 1.28, 0.2, 2.12); group.add(label);
  // Thanh Sinh Lực (trên) + Chân khí (dưới) trên đầu, dưới tên (Phiên 126): setBars(hp 0..1, mp 0..1); hp = null → ẩn. Vẽ lại chỉ khi số đổi quá 1/50.
  const barC = document.createElement('canvas'); barC.width = 192; barC.height = 48;
  const barTex = new THREE.CanvasTexture(barC); barTex.colorSpace = THREE.SRGBColorSpace;
  const barMat = new THREE.SpriteMaterial({ map: barTex, transparent: true, depthTest: false, depthWrite: false, fog: false });
  const bars = new THREE.Sprite(barMat); bars.scale.set(1.1, 0.275, 1); bars.position.set(0, 1.9, 0); bars.visible = false; bars.renderOrder = 10; group.add(bars); let barKey = '';
  let bubble = null, bubbleTex = null, bubbleUntil = 0, clock = 0;
  group.traverse((o) => { if (o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow = true; });

  const st = { state: 'idle', speed: 0, ry: 0, targetRy: 0, pose: poseFor('idle', 0), halo: 0, t0: 0, hold: false, act: null, actT: 0, walk: 0, stance: 0, wantStance: false, arms: {} };   // walk: mức "đang đi" 0..1, làm mượt để gối/chạm đất không giật khi bắt đầu hoặc dừng bước; stance: thế sẵn sàng chiến đấu 0..1
  function setState(s, speed = 0) { if (s !== st.state) st.t0 = clock; st.state = s; st.speed = speed; }
  function setFacing(ry, instant = false) { st.targetRy = ry; if (instant) { st.ry = ry; group.rotation.y = ry; } }
  function say(text) {
    const t = cleanSay(text);
    if (bubble) { group.remove(bubble); bubble.material.dispose(); bubbleTex?.dispose(); bubble = null; bubbleTex = null; }
    if (!t) return '';
    const { tex, ratio } = bubbleTexture(t); bubbleTex = tex;
    bubble = makeSprite(tex, 1.9, 1.9 * ratio, 2.4 + 1.9 * ratio / 2 - 0.1); group.add(bubble);
    bubbleUntil = clock + bubbleLife(t) / 1000; return t;
  }
  function update(dt) {
    clock += dt;
    if (arrow) arrow.position.y = 1.86 + Math.sin(clock * 3) * 0.05;
    const target = poseFor(st.state, clock - st.t0, st.speed), p = st.pose, k = Math.min(1, 14 * dt);
    for (const key of Object.keys(target)) p[key] += (target[key] - p[key]) * (key === 'sit' ? Math.min(1, 6 * dt) : k);
    let swing = null, act = null;
    if (swingT >= 0) { swingT += dt; swing = comboPose(swingKind, swingT) || swingPose(swingT); if (swingT >= (comboEnd(swingKind) || SWING_S + 0.35)) { lastEnd = clock; swingT = -1; swingKind = ''; swing = null; } }
    if (st.act) { st.actT += dt; const len = ACT_S[st.act]; if (st.actT >= len) st.act = null; else act = { name: st.act, k: st.actT / len }; }
    st.walk += ((st.state === 'walk' ? 1 : 0) - st.walk) * Math.min(1, 10 * dt);
    st.stance += ((st.wantStance && (st.state === 'idle' || st.state === 'walk') ? 1 : 0) - st.stance) * Math.min(1, 7 * dt);
    staff.visible = weaponVisible(st.stance, swing ? swing.vis : 0);   // Phiên 120: cầm sẵn khi vào thế chiến đấu
    staff.rotation.y = swing && swing.spin ? swing.spin : 0;           // Phiên 126: múa côn quanh bàn tay
    if (hasBack) { backG.visible = !staff.visible; if (backG.visible) { const a = 0.5 + 0.5 * Math.sin(clock * 5), b = 0.5 + 0.5 * Math.sin(clock * 5 + Math.PI); backGlow[0].material.opacity = 0.25 + 0.6 * a; backGlow[1].material.opacity = 0.25 + 0.6 * b; backGlow[2].material.opacity = 0.35; } }   // Phiên 152: côn thu gọn sau lưng, hai đầu chớp lệch pha
    if (gourdPulse > 0) { gourdPulse = Math.max(0, gourdPulse - dt * 3); gourd.scale.setScalar(1 + 0.45 * Math.sin(gourdPulse * Math.PI)); }
    const q = showPose(applyStance(chibiPose(p, st.state, clock - st.t0, st.speed, { hold: st.hold, swing, act, walk: st.walk }), st.stance, { walk: st.walk, sit: p.sit, hold: st.hold, busy: !!(swing || act) }), act), ka = Math.min(1, 24 * dt);
    for (const k of SMOOTH_ARM) { const c = st.arms[k] || (st.arms[k] = { ...q[k] }); for (const ax of ['x', 'y', 'z']) c[ax] += (q[k][ax] - c[ax]) * ka; q[k] = c; }   // vai/khuỷu/cổ tay: làm mượt khi đổi tư thế (đứng ↔ chắp tay) để khuỷu không "bật" cái rụp; vẫn đủ nhanh cho gõ mõ, vung côn, ném
    applyChibiPose(B, q);
    rig.position.y = p.dy;
    rig.rotation.y = swing && swing.yaw ? swing.yaw : 0; rig.position.z = swing && swing.lunge ? swing.lunge : 0;   // Phiên 119: xoay thân khi chém ngang/xoay + lao người tới trước
    shadow.scale.setScalar(1 - Math.min(0.3, p.dy * 4));
    const wantHalo = st.state === 'sit' || st.state === 'mo' || st.state === 'beads' ? 0.9 : 0; st.halo += (wantHalo - st.halo) * Math.min(1, 5 * dt); haloMat.opacity = st.halo;
    mala.visible = st.state === 'beads'; malaCur += (malaTarget - malaCur) * Math.min(1, 12 * dt); mala.rotation.z = malaCur;
    st.ry = turnToward(st.ry, st.targetRy, 9 * dt); group.rotation.y = st.ry;
    if (bubble && clock > bubbleUntil) say('');
  }
  function dispose() { say(''); label.material.dispose(); nameTex.dispose(); barMat.dispose(); barTex.dispose(); haloMat.dispose(); haloTex.dispose(); if (backTex) backTex.dispose(); ch.dispose(); geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose()); }
  function setBeadCount(n) { malaTarget = -(Math.max(0, +n || 0) / 108) * Math.PI * 2; }
  /** Vung côn. Không đối số: đánh thường, tự nối chuỗi múa côn → ngang → ngược → xoay. Số (skill Chém khí): kiểu 'khi'. Chuỗi: đúng kiểu đó. Trả về tên kiểu đã chọn. */
  function swing(arg) {
    const kind = typeof arg === 'string' && KINDS[arg] ? arg : typeof arg === 'number' ? 'khi' : nextKind(lastKind, swingT >= 0 ? -1 : clock - lastEnd);
    swingKind = kind; lastKind = kind; swingT = 0; return kind;
  }
  /** Bật/tắt thế sẵn sàng chiến đấu (khom, chân trước/sau, chạy nghiêng người). */
  function setStance(on) { st.wantStance = !!on; }
  /** Giơ hai tay đỡ vật trên đầu (khiêng). */
  function setHold(on) { st.hold = !!on; }
  /** Động tác một lần: 'throw' (ném), 'grab' (cúi nhặt). Tên lạ: bỏ qua. */
  function act(nm) { if (ACT_S[nm]) { st.act = nm; st.actT = 0; } }
  /** Vị trên thế giới của hồ lô {x,y,z} (đích cho hồn bay vào); NPC không có hồ lô → null. */
  function gourdPos() { if (!hasGourd) return null; gourd.getWorldPosition(gourdV); return { x: gourdV.x, y: gourdV.y + 0.05, z: gourdV.z }; }
  /** Hồ lô nháy to ra một nhịp (khi hồn quái chui vào). */
  function pulseGourd() { if (hasGourd) gourdPulse = 1; }
  /** Thanh trên đầu: hp, mp trong 0..1; hp = null/NaN → ẩn. */
  function setBars(hp, mp) {
    if (hp == null || !Number.isFinite(+hp)) { bars.visible = false; return; }
    const h = Math.max(0, Math.min(1, +hp)), m = Math.max(0, Math.min(1, Number.isFinite(+mp) ? +mp : 0)), key = `${Math.round(h * 50)}|${Math.round(m * 50)}`;
    bars.visible = true; if (key === barKey) return; barKey = key;
    const g = barC.getContext('2d'); g.clearRect(0, 0, 192, 48);
    g.fillStyle = 'rgba(15,10,6,.62)'; g.beginPath(); if (g.roundRect) g.roundRect(2, 2, 188, 44, 8); else g.rect(2, 2, 188, 44); g.fill();
    const bar = (y, f, c1, c2) => { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(10, y, 172, 12); if (f > 0) { const gr = g.createLinearGradient(10, y, 10, y + 12); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(10, y, 172 * f, 12); } g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.strokeRect(10, y, 172, 12); };
    bar(8, h, h < 0.3 ? '#ff6a5a' : '#6fe37a', h < 0.3 ? '#c8261c' : '#2fa84a'); bar(27, m, '#7fc4ff', '#2a6fd6');
    barTex.needsUpdate = true;
  }
  return { group, setState, setFacing, say, setBeadCount, swing, setStance, setHold, act, gourdPos, pulseGourd, setBars, update, dispose, get state() { return st.state; }, get swinging() { return swingT >= 0; }, get holding() { return st.hold; }, get backHost() { return hasBack ? backHostGroup : null; }, get headHost() { return face; }, setHat(on) { if (bun) bun.visible = !on; } };
}
