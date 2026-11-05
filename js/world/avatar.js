// Nhân vật người chơi (three.js): đầu, thân áo, tay, chân; tên nổi trên đầu; bong bóng chat; hoạt ảnh đi/ngồi/gõ mõ/lạy.
// Gốc tọa độ = dưới bàn chân, nhìn về +z (khớp quy ước ry của layout.js). Cao ~1,7 đơn vị.
// Logic tư thế/tên/chat nằm ở avatarLogic.js (có test). Dùng: const a = createAvatar({ name, color }); scene.add(a.group); mỗi khung: a.update(dt).
import * as THREE from 'three';
import { DEFAULT_COLOR, colorById, hairById, beardById, cleanName, cleanSay, bubbleLife, wrapText, poseFor, turnToward, BELL_PROFILE, bellRadius, logoPatch, POLO_LOGOS } from './avatarLogic.js';

const SKIN = 0xe8934c, HAIR = 0x1f1511, OUTLINE = 0x3a2314;
const FONT = '600 38px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// Logo 9 SẠCH dán lên áo đồng phục: một texture dùng chung cho mọi nhân vật. Vẽ tạm bằng code rồi thay bằng ảnh thật khi tải xong (lỗi tải thì giữ bản tạm).
const LOGO_URL = new URL('../../assets/logo-9sach.webp', import.meta.url).href;
let LOGO_TEX = null;
function logoTexture() {
  if (LOGO_TEX) return LOGO_TEX;
  const c = canvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#f6c21c'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#13802a'; g.lineWidth = 14; g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#e21f26'; g.font = '900 64px "Be Vietnam Pro", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('9 SẠCH', 128, 132, 190);
  LOGO_TEX = new THREE.CanvasTexture(c); LOGO_TEX.colorSpace = THREE.SRGBColorSpace;
  if (typeof Image !== 'undefined') {
    const im = new Image();
    im.onload = () => { g.clearRect(0, 0, 256, 256); g.drawImage(im, 0, 0, 256, 256); LOGO_TEX.needsUpdate = true; };
    im.onerror = () => {};
    im.src = LOGO_URL;
  }
  return LOGO_TEX;
}

// Texture cà sa: ô ruộng (hình chữ nhật vàng nghệ viền nâu đỏ, nhiều hàng) như áo cà sa truyền thống; dùng chung cho mọi cà sa.
let CASA_TEX = null;
function casaTexture() {
  if (CASA_TEX) return CASA_TEX;
  const c = canvas(128, 128), g = c.getContext('2d');
  g.fillStyle = '#7a2c12'; g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) {
    const x = q * 64 + 4, y = r * 32 + 4; g.fillStyle = r % 2 ? '#d6951f' : '#c98a1c'; g.fillRect(x, y, 56, 24);
    g.fillStyle = 'rgba(255,230,150,.25)'; g.fillRect(x, y, 56, 4);
  }
  CASA_TEX = new THREE.CanvasTexture(c); CASA_TEX.colorSpace = THREE.SRGBColorSpace; CASA_TEX.wrapS = CASA_TEX.wrapT = THREE.RepeatWrapping; CASA_TEX.repeat.set(2, 1.2);
  return CASA_TEX;
}

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

/** Tạo nhân vật chibi: đầu tròn to, thân áo hình chuông, mắt cười, má hồng, viền hoạt hình, hai tay chắp trước ngực.
 *  opts: { name, color (id màu áo), hair ('troc' | 'bui'), mine (true = nhân vật của mình: nhãn tên màu ngọc, mũi tên vàng ▼) }
 *  Gốc = dưới bàn chân, nhìn +z. Cao ~1,5 (đầu bán kính 0,42). Giao diện hàm giữ nguyên: group, setState, setFacing, say, update, dispose. */
export function createAvatar({ name = 'Khách', color = DEFAULT_COLOR, hair: hairId = 'troc', beard: beardId = '', mine = false } = {}) {
  const col = colorById(color), group = new THREE.Group(), rig = new THREE.Group();
  group.add(rig);
  const geos = [], mats = [];
  const geo = (g) => (geos.push(g), g);
  const std = (c, r = 0.62) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: r }); mats.push(m); return m; };
  const basic = (c, o = {}) => { const m = new THREE.MeshBasicMaterial({ color: c, ...o }); mats.push(m); return m; };
  const polo = !!col.polo, casa = !!col.casa;
  const robeM = std(col.ao, 0.7), beltM = std(col.dai, 0.6), sleeveM = polo ? std(col.tay, 0.7) : robeM, stripeM = polo ? std(col.soc, 0.6) : null, skinM = std(SKIN, 0.55), hairM = std(HAIR, 0.8), goldM = std(0xe0a93a, 0.45), beadM = std(0xc9792f, 0.4), shoeM = std(0x4a2f1c, 0.8);
  const outM = basic(OUTLINE, { side: THREE.BackSide });
  const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo(g), m); o.position.set(x, y, z); parent.add(o); return o; };

  // Bóng mờ dưới chân
  const shadow = mesh(new THREE.CircleGeometry(0.46, 20), basic(0x000000, { transparent: true, opacity: 0.26, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), group, 0, 0.03, 0);
  shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = 1;

  // Bàn chân (hai chiếc giày tròn nhô ra dưới tà áo, đổi bước khi đi)
  const shoeG = new THREE.SphereGeometry(0.1, 10, 8); geos.push(shoeG);
  const mkShoe = (x) => { const o = new THREE.Mesh(shoeG, shoeM); o.scale.set(1, 0.62, 1.45); o.position.set(x, 0.06, 0.22); rig.add(o); return o; };
  const footL = mkShoe(-0.14), footR = mkShoe(0.14);

  // Thân: áo hình chuông (xoay quanh gót khi cúi lạy)
  const body = new THREE.Group(); rig.add(body);
  const robe = new THREE.Group(); body.add(robe);          // co lại theo chiều cao khi ngồi
  const bell = geo(new THREE.LatheGeometry(BELL_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 30));
  const bellMesh = new THREE.Mesh(bell, robeM); robe.add(bellMesh);
  const bellOut = new THREE.Mesh(bell, outM); bellOut.scale.set(1.07, 1.03, 1.07); robe.add(bellOut);
  const hem = mesh(new THREE.TorusGeometry(0.385, 0.026, 8, 30), beltM, robe, 0, 0.035, 0); hem.rotation.x = Math.PI / 2;

  if (casa) {   // cà sa đắp lệch vai: một vỏ chuông hở phía trước-phải, có ô ruộng vàng/nâu đỏ, viền nâu đỏ ở mép và gấu
    const prof = BELL_PROFILE.map(([r, y]) => new THREE.Vector2(r * 1.035 + 0.004, y));
    const drape = new THREE.Mesh(geo(new THREE.LatheGeometry(prof, 36, -0.55, Math.PI * 2 - 1.05)), new THREE.MeshStandardMaterial({ map: casaTexture(), roughness: 0.75, side: THREE.DoubleSide })); mats.push(drape.material);
    robe.add(drape);
    const vienM = std(col.vien, 0.6);
    const gau = mesh(new THREE.TorusGeometry(0.405, 0.022, 8, 36), vienM, robe, 0, 0.04, 0); gau.rotation.x = Math.PI / 2;
    const strap = mesh(new THREE.TorusGeometry(0.29, 0.05, 8, 24), vienM, body, 0, 0.5, 0); strap.rotation.set(Math.PI / 2 - 0.85, 0.15, 0.4);   // dải vắt vai chéo ngực
  }
  const upper = new THREE.Group(); body.add(upper);        // đầu, tay, dải vai: hạ xuống khi ngồi
  // Dải vàng chéo vai
  if (!polo && !casa) { const sash = mesh(new THREE.TorusGeometry(0.285, 0.05, 8, 30), goldM, upper, 0, 0.46, 0); sash.rotation.set(Math.PI / 2 - 0.85, 0.15, 0.4); }   // áo polo không đeo dải chéo vai
  // Áo polo 9 Sạch: cổ xanh viền vàng (gắn vào phần trên, theo đầu), nẹp cúc + logo ngực trái + logo lưng (gắn vào thân, giữ nguyên tỉ lệ khi ngồi)
  const trim = [];   // các chi tiết dán trên thân: bù lại phép co chiều cao của `robe` khi ngồi để không bị méo
  if (polo) {
    const collar = mesh(new THREE.TorusGeometry(0.235, 0.05, 8, 28), beltM, upper, 0, 0.7, 0); collar.rotation.x = Math.PI / 2; collar.scale.set(1, 1, 0.6);
    const edge = mesh(new THREE.TorusGeometry(0.262, 0.012, 6, 28), stripeM, upper, 0, 0.72, 0); edge.rotation.x = Math.PI / 2;
    const tilt = -Math.atan((bellRadius(0.4) - bellRadius(0.7)) / 0.3);   // độ nghiêng mặt thân áo (đỉnh thu nhỏ lại)
    const placket = mesh(new THREE.BoxGeometry(0.055, 0.2, 0.014), beltM, robe, 0, 0.56, bellRadius(0.56) + 0.006); placket.rotation.x = tilt; trim.push(placket);
    const btnM = std(0xf4f1e6, 0.4);
    for (const by of [0.61, 0.53]) { const b = mesh(new THREE.SphereGeometry(0.014, 8, 6), btnM, robe, 0, by, bellRadius(by) + 0.016); trim.push(b); }
    const logoM = new THREE.MeshStandardMaterial({ map: logoTexture(), transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); mats.push(logoM);
    for (const spec of [POLO_LOGOS.chest, POLO_LOGOS.back]) {
      const q = logoPatch(spec), m = new THREE.Mesh(geo(new THREE.CylinderGeometry(q.rTop, q.rBot, q.h, 18, 1, true, q.thetaStart, q.thetaLength)), logoM);
      m.position.y = q.y; m.renderOrder = 2; robe.add(m); trim.push(m);
    }
  }
  // Chuỗi hạt quanh cổ
  const beadG = geo(new THREE.SphereGeometry(0.045, 8, 6)), beads = new THREE.InstancedMesh(beadG, beadM, 15), mtx = new THREE.Matrix4();
  for (let i = 0; i < 15; i++) { const a = (i / 15) * Math.PI * 2; mtx.makeTranslation(Math.sin(a) * 0.255, 0.74 - Math.cos(a) * 0.02 - (Math.cos(a) > 0 ? 0.05 * Math.cos(a) : 0), Math.cos(a) * 0.255); beads.setMatrixAt(i, mtx); }
  upper.add(beads);
  // Tay: ngắn mập, hai bàn tay chụm trước ngực
  const armG = geo(new THREE.CylinderGeometry(0.062, 0.056, 0.3, 8)); armG.translate(0, -0.15, 0);
  const handG = geo(new THREE.SphereGeometry(0.07, 10, 8));
  const casaM = casa ? std(col.casa, 0.7) : null;
  const mkArm = (x) => {
    const sm = casa && x > 0 ? casaM : sleeveM;   // cà sa: tay trái (x > 0) phủ cà sa, tay phải lộ áo trong
    const p = new THREE.Group(); p.position.set(x, 0.64, 0.04); const a = new THREE.Mesh(armG, sm); p.add(a); const h = new THREE.Mesh(handG, skinM); h.position.y = -0.31; p.add(h); upper.add(p);
    if (polo) {   // áo polo: vai tròn xanh + viền vàng ở cổ tay áo
      mesh(new THREE.SphereGeometry(0.07, 10, 8), sleeveM, p, 0, 0.005, 0);
      const cuff = mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 14), stripeM, p, 0, -0.255, 0); cuff.rotation.x = Math.PI / 2;
    }
    return p;
  };
  const armL = mkArm(-0.25), armR = mkArm(0.25);

  // Đầu: cầu tròn to không cổ, tai, mắt cười, miệng, má hồng, tóc
  const head = new THREE.Group(); head.position.y = 1.08; upper.add(head);
  const skullG = geo(new THREE.SphereGeometry(0.42, 28, 20));
  const skull = new THREE.Mesh(skullG, skinM); skull.scale.set(1, 0.95, 0.98); head.add(skull);
  const skullOut = new THREE.Mesh(skullG, outM); skullOut.scale.set(1.045, 1.0, 1.025); head.add(skullOut);
  for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.07, 10, 8), skinM, head, sx * 0.415, -0.01, 0.02);
  const eyeM = basic(0x3a2012), eyeG = geo(new THREE.TorusGeometry(0.055, 0.014, 6, 14, Math.PI));
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(eyeG, eyeM); e.position.set(sx * 0.16, 0.035, 0.386); e.rotation.y = sx * 0.4; head.add(e); }
  const mouth = new THREE.Mesh(geo(new THREE.TorusGeometry(0.034, 0.011, 6, 12, Math.PI)), eyeM); mouth.position.set(0, -0.1, 0.408); mouth.rotation.z = Math.PI; head.add(mouth);
  const cheekM = basic(0xf06a6a, { transparent: true, opacity: 0.55, depthWrite: false }), cheekG = geo(new THREE.CircleGeometry(0.062, 14));
  for (const sx of [-1, 1]) { const c = new THREE.Mesh(cheekG, cheekM); c.position.set(sx * 0.255, -0.06, 0.332); c.rotation.y = sx * 0.85; head.add(c); }
  const bd = beardById(beardId);
  if (bd.id) {   // râu: ria mép + chòm râu dài dưới cằm + lông mày cùng màu
    const bm = std(bd.mau, 0.85);
    for (const sx of [-1, 1]) {
      const mu = mesh(new THREE.SphereGeometry(0.075, 10, 8), bm, head, sx * 0.065, -0.062, 0.4); mu.scale.set(1.25, 0.5, 0.6); mu.rotation.z = sx * -0.35;
      const br = mesh(new THREE.SphereGeometry(0.06, 8, 6), bm, head, sx * 0.16, 0.115, 0.375); br.scale.set(1.5, 0.35, 0.5); br.rotation.z = sx * -0.25;
    }
    const chin = mesh(new THREE.SphereGeometry(0.2, 16, 12), bm, head, 0, -0.27, 0.27); chin.scale.set(1.05, 1.15, 0.55);   // râu quanh cằm
    const tail = mesh(new THREE.ConeGeometry(0.17, 0.5, 14), bm, head, 0, -0.55, 0.3); tail.rotation.x = Math.PI + 0.12; tail.scale.set(1, 1, 0.55);   // chòm râu dài buông xuống ngực
  }
  if (hairById(hairId).id === 'bui') {   // tóc đen phủ đỉnh đầu + búi tròn
    const cap = mesh(new THREE.SphereGeometry(0.435, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.43), hairM, head, 0, 0.01, -0.025); cap.scale.set(1, 0.97, 1); cap.rotation.x = -0.32;
    mesh(new THREE.SphereGeometry(0.125, 14, 10), hairM, head, 0, 0.5, -0.1);
  }
  // Chuỗi hạt 108 trước ngực (chỉ hiện khi lần tràng hạt); xoay theo số hạt đã lần
  const mala = new THREE.Group(); mala.position.set(0, 0.5, 0.5); mala.visible = false; upper.add(mala);
  const malaG = geo(new THREE.SphereGeometry(0.026, 6, 5)), malaBeads = new THREE.InstancedMesh(malaG, std(0xd9a24a, 0.4), 108);
  for (let i = 0; i < 108; i++) { const a = (i / 108) * Math.PI * 2; mtx.makeTranslation(Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0); malaBeads.setMatrixAt(i, mtx); }
  mala.add(malaBeads);
  let malaTarget = 0, malaCur = 0;
  // Hào quang (khi ngồi thiền/tụng): vòng sáng sau đầu
  const haloC = document.createElement('canvas'); haloC.width = haloC.height = 128; { const g = haloC.getContext('2d'), gr = g.createRadialGradient(64, 64, 18, 64, 64, 62); gr.addColorStop(0, 'rgba(255,248,214,.0)'); gr.addColorStop(0.55, 'rgba(255,240,190,.95)'); gr.addColorStop(0.7, 'rgba(255,224,150,.45)'); gr.addColorStop(1, 'rgba(255,224,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const haloTex = new THREE.CanvasTexture(haloC); haloTex.colorSpace = THREE.SRGBColorSpace;
  const haloMat = new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const halo = new THREE.Sprite(haloMat); halo.scale.set(1.5, 1.5, 1); halo.position.set(0, 0.02, -0.34); head.add(halo);

  // Mũi tên vàng ▼ (nhân vật của mình), tên, bong bóng chat
  let arrow = null;
  if (mine) { arrow = mesh(new THREE.ConeGeometry(0.11, 0.2, 4), basic(0xf2c14e), group, 0, 1.86, 0); arrow.rotation.x = Math.PI; }
  const nameTex = nameTexture(cleanName(name), mine), label = makeSprite(nameTex, 1.28, 0.2, 2.12); group.add(label);
  let bubble = null, bubbleTex = null, bubbleUntil = 0, clock = 0;

  group.traverse((o) => { if (o.isMesh && o.material !== outM && !o.material.isMeshBasicMaterial) o.castShadow = true; });   // đổ bóng xuống sàn (trừ viền hoạt hình và bóng tròn)
  const st = { state: 'idle', speed: 0, ry: 0, targetRy: 0, pose: poseFor('idle', 0), halo: 0, t0: 0 };
  function setState(s, speed = 0) { if (s !== st.state) st.t0 = clock; st.state = s; st.speed = speed; }   // t0: tư thế (lạy, gõ mõ...) tính từ lúc đổi trạng thái
  function setFacing(ry, instant = false) { st.targetRy = ry; if (instant) { st.ry = ry; group.rotation.y = ry; } }
  /** Hiện bong bóng chat (đã làm sạch). Chuỗi rỗng → ẩn. */
  function say(text) {
    const t = cleanSay(text);
    if (bubble) { group.remove(bubble); bubble.material.dispose(); bubbleTex?.dispose(); bubble = null; bubbleTex = null; }
    if (!t) return '';
    const { tex, ratio } = bubbleTexture(t); bubbleTex = tex;
    bubble = makeSprite(tex, 1.9, 1.9 * ratio, 2.4 + 1.9 * ratio / 2 - 0.1); group.add(bubble);
    bubbleUntil = clock + bubbleLife(t) / 1000; return t;
  }

  /** Gọi mỗi khung hình với dt (giây). Làm mượt tư thế, quay mặt, hết giờ thì ẩn bong bóng. */
  function update(dt) {
    clock += dt;
    if (arrow) arrow.position.y = 1.86 + Math.sin(clock * 3) * 0.05;
    const target = poseFor(st.state, clock - st.t0, st.speed), p = st.pose, k = Math.min(1, 14 * dt);
    for (const key of Object.keys(target)) p[key] += (target[key] - p[key]) * (key === 'sit' ? Math.min(1, 6 * dt) : k);
    // Chân: đổi bước (tiến/lùi) và nhấc lên khi đi
    footL.position.z = 0.22 + p.legL * 0.3; footR.position.z = 0.22 + p.legR * 0.3;
    footL.position.y = 0.06 + Math.max(0, p.legL) * 0.12; footR.position.y = 0.06 + Math.max(0, p.legR) * 0.12;
    // Tay chắp trước ngực, đung đưa nhẹ; gõ mõ/lạy dùng armL/armR của poseFor
    armL.rotation.set(-1.2 + p.armL * 0.7, 0, 0.8); armR.rotation.set(-1.2 + p.armR * 0.7, 0, -0.8);
    body.rotation.x = p.lean; head.rotation.x = p.head;
    robe.scale.y = 1 - 0.4 * p.sit; upper.position.y = -0.34 * p.sit;
    for (const m of trim) m.scale.y = 1 / robe.scale.y;   // chi tiết trên thân (nẹp, cúc, logo) giữ nguyên hình dạng khi ngồi
    rig.position.y = p.dy; body.rotation.z = st.state === 'walk' ? Math.sin(clock * (5 + 4 * Math.min(1, st.speed / 2.2))) * 0.05 : 0;
    shadow.scale.setScalar(1 - Math.min(0.3, p.dy * 4));
    // Hào quang khi ngồi thiền / gõ mõ
    const wantHalo = st.state === 'sit' || st.state === 'mo' || st.state === 'beads' ? 0.9 : 0; st.halo += (wantHalo - st.halo) * Math.min(1, 5 * dt); haloMat.opacity = st.halo;
    mala.visible = st.state === 'beads'; malaCur += (malaTarget - malaCur) * Math.min(1, 12 * dt); mala.rotation.z = malaCur;
    st.ry = turnToward(st.ry, st.targetRy, 9 * dt); group.rotation.y = st.ry;
    if (bubble && clock > bubbleUntil) say('');
  }

  function dispose() {
    say(''); label.material.dispose(); nameTex.dispose(); haloMat.dispose(); haloTex.dispose(); geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose());
  }

  /** Số hạt đã lần (0..108): xoay chuỗi hạt 3D. */
  function setBeadCount(n) { malaTarget = -(Math.max(0, +n || 0) / 108) * Math.PI * 2; }
  return { group, setState, setFacing, say, setBeadCount, update, dispose, get state() { return st.state; } };
}
