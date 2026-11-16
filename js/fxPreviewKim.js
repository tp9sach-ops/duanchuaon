// Trang xem thử Kim 3D (Phiên 212, mục 4). Mở fx-kim.html: chọn chiêu + bậc máy; chiêu tự lặp gồng → phát → tan. Lỗi biên dịch shader hiện chữ đỏ (chụp màn hình gửi lại).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { taoKimThan } from './scene/fxKimThan.js';
import { KIM3_KIEU } from './world/kimFxMath.js';
import { CHIEU_FX } from './data/chieuFx.js';

const TEN = { kim_1: 'Nhát chém trăng khuyết bạc', kim_2: 'Khiên lục giác xoay', kim_3: 'Kỵ binh vàng xung phong' };
const $ = (id) => document.getElementById(id), st = $('st');
const baoLoi = (s) => { st.className = 'loi'; st.textContent = s; };
try {
  const canvas = $('gl'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  let loiShader = '';
  renderer.debug.onShaderError = (gl, prog, vs, fs) => { loiShader = ['VERTEX: ' + gl.getShaderInfoLog(vs), 'FRAGMENT: ' + gl.getShaderInfoLog(fs), 'PROGRAM: ' + gl.getProgramInfoLog(prog)].join('\n').slice(0, 1500); baoLoi('LỖI SHADER (hãy chụp màn hình gửi lại)\n' + loiShader); };
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080d);
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100); cam.position.set(5.5, 3.2, -5.5);
  const ctl = new OrbitControls(cam, canvas); ctl.target.set(0, 1.2, 3); ctl.enableDamping = true; ctl.update();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x151823 })).rotateX(-Math.PI / 2));
  scene.add(new THREE.GridHelper(40, 40, 0x2a2f3f, 0x1b1f2b));
  scene.add(new THREE.HemisphereLight(0xfff2d8, 0x2a2018, 1.1)); const nang = new THREE.DirectionalLight(0xffe6c0, 1.6); nang.position.set(4, 8, -3); scene.add(nang);   // vật liệu đá cần ánh sáng (trong game đã có đèn cảnh)
  const nguoi = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.9, 4, 10), new THREE.MeshBasicMaterial({ color: 0x59627a })); nguoi.position.set(0, 0.67, 0); scene.add(nguoi);
  const resize = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();

  let id = 'kim_1', tier = 'cao', cur = null, clk = 0;
  const ids = Object.keys(KIM3_KIEU), nutDS = $('ds'), nutBac = $('bac'), nut = [];
  const build = () => {
    if (cur) { scene.remove(cur.group); cur.group.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); cur = null; }
    const mode = CHIEU_FX[id].mode;
    cur = taoKimThan({ id, tier, mode, co: 0.12, reach: 8, R2: 4, zD: 0 }); if (!cur) { baoLoi('Không dựng được ' + id); return; }
    cur.group.position.set(0, 0.12, 0); scene.add(cur.group); clk = 0;
    nut.forEach(([b, v, kind]) => b.classList.toggle('on', kind === 'id' ? v === id : v === tier));
  };
  const them = (par, nhan, v, kind) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = nhan; b.onclick = () => { if (kind === 'id') id = v; else tier = v; build(); }; par.appendChild(b); nut.push([b, v, kind]); };
  ids.forEach((k) => them(nutDS, TEN[k], k, 'id')); [['yeu', 'Máy yếu'], ['vua', 'Máy vừa'], ['cao', 'Máy mạnh']].forEach(([v, n]) => them(nutBac, n, v, 'tier'));
  build();

  let last = performance.now(), frames = 0, acc = 0, ok = false;
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; clk += dt * +$('spd').value;
    const after = (clk % 2.8) - 0.7, g = after < 0 ? Math.min(1, (after + 0.7) / 0.7) : 0;
    const k = after < 0 ? 0 : Math.min(1, after / 0.12) * Math.min(1, Math.max(0, (1.6 - after) / 0.4));
    const mode = CHIEU_FX[id].mode, pz = mode === 'tia' ? 8 * (1 - (1 - Math.min(1, Math.max(0, after) / 0.35)) ** 2) : 0;
    if (cur) cur.update(clk, after, k, g, pz);
    ctl.update(); renderer.render(scene, cam);
    if (!ok && !loiShader) { ok = true; st.className = 'ok'; st.textContent = 'Shader biên dịch ổn. Chọn từng chiêu ở trên, chụp màn hình gửi lại để chỉnh.'; }
    frames++; acc += dt; if (acc >= 0.5) { $('fps').textContent = Math.round(frames / acc) + ' khung/giây'; frames = 0; acc = 0; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
} catch (e) { baoLoi('Không dựng được WebGL: ' + (e && e.message ? e.message : e)); }
