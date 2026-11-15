// Trang xem thử hiệu ứng chiêu 3D (Phiên 201, mục 1). Mở fx-preview.html: thấy cụm lửa shader + khói + tàn lửa + vũng sáng. Mục 2+ sẽ thêm danh sách chọn chiêu từng Hệ.
// Lỗi biên dịch shader (nếu có) hiện chữ đỏ ở khung trên-trái: chụp màn hình gửi lại để sửa.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { taoLuaMesh, taoKhoiMesh, taoHatPoints, taoVungMesh, capNhatThoiGian } from './scene/fxShader.js';

const $ = (id) => document.getElementById(id), st = $('st');
const baoLoi = (s) => { st.className = 'loi'; st.textContent = s; };
try {
  const canvas = $('gl'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  let loiShader = '';
  renderer.debug.onShaderError = (gl, prog, vs, fs) => {   // three.js gọi khi shader biên dịch/liên kết hỏng
    loiShader = ['VERTEX: ' + gl.getShaderInfoLog(vs), 'FRAGMENT: ' + gl.getShaderInfoLog(fs), 'PROGRAM: ' + gl.getProgramInfoLog(prog)].join('\n').slice(0, 1500);
    baoLoi('LỖI SHADER (hãy chụp màn hình gửi lại)\n' + loiShader);
  };
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080d);
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100); cam.position.set(3.2, 2.4, 4.2);
  const ctl = new OrbitControls(cam, canvas); ctl.target.set(0, 1, 0); ctl.enableDamping = true; ctl.update();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x151823 })).rotateX(-Math.PI / 2));   // nền tối để thấy ánh lửa
  scene.add(new THREE.GridHelper(30, 30, 0x2a2f3f, 0x1b1f2b));

  // cụm lửa: 7 lưỡi (cỡ + hạt giống khác nhau)
  const lua = new THREE.Group(), luoi = [];
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, c = i === 0 ? 0 : 0.38, m = taoLuaMesh({ seed: (i * 0.173) % 1, bk: 0.34 + (i % 3) * 0.07, cao: 1.5 + ((i * 37) % 10) / 10 });
    m.position.set(Math.cos(a) * c, 0, Math.sin(a) * c); lua.add(m); luoi.push({ m, cao: m.scale.y, s: i * 1.7 });
  }
  scene.add(lua);
  const vung = taoVungMesh({ r: 2.8, power: 0.9 }); scene.add(vung);
  // khói: 6 tấm bốc lên, to dần, tan
  const khoiG = new THREE.Group(), khoi = [];
  for (let i = 0; i < 6; i++) { const m = taoKhoiMesh({ seed: i * 0.37, alpha: 0.5 }); khoiG.add(m); khoi.push({ m, off: i / 6 }); }
  scene.add(khoiG);
  // tàn lửa
  const NH = 400, px = () => innerHeight * (renderer.getPixelRatio()) / (2 * Math.tan(cam.fov * Math.PI / 360));
  const ham = taoHatPoints(NH, { colA: 0xffd25a, colB: 0xff3a08, spark: 0.5, px: px() }); scene.add(ham);
  const hs = Array.from({ length: NH }, () => ({ age: Math.random(), rate: 0.25 + Math.random() * 0.45, x: 0, z: 0, h: 2 + Math.random() * 3, w: Math.random() * 6, sz: 0.05 + Math.random() * 0.07 }));
  const reset = (p) => { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 0.5; p.x = Math.cos(a) * r; p.z = Math.sin(a) * r; p.age = 0; p.rate = 0.25 + Math.random() * 0.45; p.h = 2 + Math.random() * 3; p.sz = 0.05 + Math.random() * 0.07; };
  hs.forEach(reset); hs.forEach((p) => { p.age = Math.random(); });

  const heat = $('heat'), pw = $('pow'), hm = $('ham'); let khoiOn = true, vungOn = true;
  $('b-khoi').onclick = () => { khoiOn = !khoiOn; khoiG.visible = khoiOn; }; $('b-vung').onclick = () => { vungOn = !vungOn; vung.visible = vungOn; };
  const resize = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); ham.material.uniforms.uPx.value = px(); };
  addEventListener('resize', resize); resize();

  let last = performance.now(), frames = 0, acc = 0, ok = false;
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; const t = now / 1000;
    luoi.forEach((l) => { l.m.scale.y = l.cao * (1 + 0.12 * Math.sin(t * 9 + l.s) + 0.06 * Math.sin(t * 21 + l.s * 2)); l.m.material.uniforms.uHeat.value = +heat.value; l.m.material.uniforms.uPower.value = +pw.value; });
    capNhatThoiGian(scene, t);
    khoi.forEach((k) => { const u = (t * 0.22 + k.off) % 1; k.m.position.set(Math.sin(k.off * 20 + t * 0.4) * 0.3 * u, 1.8 + u * 2.6, Math.cos(k.off * 17) * 0.3 * u); k.m.scale.setScalar(0.9 + u * 2.4); k.m.material.uniforms.uAlpha.value = 0.5 * Math.sin(u * Math.PI) * Math.min(1, u * 3.5); });
    const pos = ham.geometry.attributes.position.array, age = ham.geometry.attributes.aAge.array, sz = ham.geometry.attributes.aSize.array, nShow = +hm.value;
    for (let i = 0; i < NH; i++) {
      const p = hs[i]; p.age += dt * p.rate; if (p.age >= 1) reset(p);
      if (i >= nShow) { age[i] = 1; continue; }
      const u = p.age; pos[i * 3] = p.x + Math.sin(t * 1.7 + p.w) * 0.35 * u; pos[i * 3 + 1] = 0.8 + u * p.h; pos[i * 3 + 2] = p.z + Math.cos(t * 1.3 + p.w) * 0.35 * u; age[i] = u; sz[i] = p.sz;
    }
    ham.geometry.attributes.position.needsUpdate = true; ham.geometry.attributes.aAge.needsUpdate = true; ham.geometry.attributes.aSize.needsUpdate = true;
    ctl.update(); renderer.render(scene, cam);
    if (!ok && !loiShader) { ok = true; st.className = 'ok'; st.textContent = 'Shader biên dịch ổn. Nếu thấy lửa cam, khói xám, tia lửa tròn → Mục 1 chạy đúng.'; }
    frames++; acc += dt; if (acc >= 0.5) { $('fps').textContent = Math.round(frames / acc) + ' khung/giây'; frames = 0; acc = 0; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
} catch (e) { baoLoi('Không dựng được WebGL: ' + (e && e.message ? e.message : e)); }
