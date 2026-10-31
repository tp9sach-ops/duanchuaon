// Mọi texture được sinh bằng canvas lúc chạy: không cần file ảnh.
import * as THREE from 'three';
import { cvs, mulberry32, TAU } from '../util.js';

const tex = (canvas, srgb = true) => {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

// Chấm sáng mềm cho hạt (đom đóm, khói, cánh hoa)
export function softDot() {
  const c = cvs(64, 64), x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return tex(c);
}

// Bầu trời đêm: gradient + sao. Dùng cho mặt cầu BackSide.
export function skyTexture() {
  const W = 1024, H = 512, c = cvs(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#03050b'); g.addColorStop(0.4, '#0a1224');
  g.addColorStop(0.7, '#14203a'); g.addColorStop(0.9, '#223049'); g.addColorStop(1, '#1a2538');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // Dải Ngân Hà mờ: vài elip xiên cộng ánh sáng
  const rnd = mulberry32(881);
  x.globalCompositeOperation = 'screen';
  for (let i = 0; i < 26; i++) {
    const px = 180 + i * 28 + rnd() * 30, py = 80 + i * 8 + rnd() * 40;
    const gr = x.createRadialGradient(px, py, 0, px, py, 70 + rnd() * 70);
    gr.addColorStop(0, 'rgba(120,140,190,.07)'); gr.addColorStop(1, 'rgba(120,140,190,0)');
    x.fillStyle = gr; x.fillRect(px - 150, py - 150, 300, 300);
  }
  x.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 900; i++) {
    const sx = rnd() * W, sy = rnd() * H * 0.82, r = 0.4 + rnd() * rnd() * 1.6;
    x.fillStyle = `rgba(225,235,255,${(0.15 + rnd() * 0.6) * (1 - sy / H)})`;
    x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.fill();
  }
  return tex(c);
}

// Trăng vàng bạc có vài mảng tối, kèm quầng sáng
export function moonTexture() {
  const S = 512, c = cvs(S, S), x = c.getContext('2d');
  const halo = x.createRadialGradient(S / 2, S / 2, S * 0.1, S / 2, S / 2, S / 2);
  halo.addColorStop(0, 'rgba(255,236,176,.55)'); halo.addColorStop(0.35, 'rgba(240,200,120,.16)');
  halo.addColorStop(1, 'rgba(240,200,120,0)');
  x.fillStyle = halo; x.fillRect(0, 0, S, S);
  const r = S * 0.17;
  const d = x.createRadialGradient(S / 2 - r * 0.3, S / 2 - r * 0.3, r * 0.1, S / 2, S / 2, r);
  d.addColorStop(0, '#fff6dc'); d.addColorStop(1, '#e7c987');
  x.fillStyle = d; x.beginPath(); x.arc(S / 2, S / 2, r, 0, TAU); x.fill();
  const rnd = mulberry32(5);
  x.save(); x.beginPath(); x.arc(S / 2, S / 2, r, 0, TAU); x.clip();
  for (let i = 0; i < 9; i++) {
    x.fillStyle = `rgba(150,120,70,${0.08 + rnd() * 0.12})`;
    x.beginPath(); x.arc(S / 2 + (rnd() - 0.5) * r * 1.4, S / 2 + (rnd() - 0.5) * r * 1.4, r * (0.1 + rnd() * 0.22), 0, TAU); x.fill();
  }
  x.restore();
  return tex(c);
}

// Sân gạch: lưới gạch tối màu, có đốm rêu mờ
export function brickTexture() {
  const W = 512, c = cvs(W, W), x = c.getContext('2d');
  const rnd = mulberry32(23);
  x.fillStyle = '#0d1114'; x.fillRect(0, 0, W, W);
  const n = 8, s = W / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const t = 0.8 + rnd() * 0.5;
    x.fillStyle = `rgb(${(22 * t) | 0},${(26 * t) | 0},${(29 * t) | 0})`;
    x.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
  }
  for (let i = 0; i < 160; i++) {
    x.fillStyle = `rgba(30,50,36,${0.05 + rnd() * 0.1})`;
    x.beginPath(); x.arc(rnd() * W, rnd() * W, 2 + rnd() * 9, 0, TAU); x.fill();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Bảng chữ (hoành phi, wordmark): vẽ chữ vàng lên nền gỗ sơn
export function signTexture(text, { font = '600 120px "Noto Serif TC", serif', bg = '#3a0f0c', fg = '#e7c470', w = 1024, h = 256 } = {}) {
  const c = cvs(w, h), x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
  x.strokeStyle = 'rgba(231,196,112,.4)'; x.lineWidth = 2; x.strokeRect(22, 22, w - 44, h - 44);
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + 6);
  return tex(c);
}
