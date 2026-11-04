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
  g.addColorStop(0, '#0b1226'); g.addColorStop(0.4, '#1a2a4c');
  g.addColorStop(0.7, '#2c4272'); g.addColorStop(0.9, '#45608c'); g.addColorStop(1, '#34496e');
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

// Sân gạch Bát Tràng: gạch nung đỏ nâu xếp so le, vữa tối, vài đốm rêu. Đủ tối để không "bệt" dưới ánh trăng.
export function brickTexture() {
  const W = 512, H = 512, c = cvs(W, H), x = c.getContext('2d');
  const rnd = mulberry32(23);
  x.fillStyle = '#1b1411'; x.fillRect(0, 0, W, H);
  const rows = 16, bh = H / rows, bw = W / 4;
  for (let j = 0; j < rows; j++) for (let i = -1; i < 5; i++) {
    const off = (j % 2) * bw / 2, t = 0.72 + rnd() * 0.5;
    x.fillStyle = `rgb(${(92 * t) | 0},${(56 * t) | 0},${(44 * t) | 0})`;
    x.fillRect(i * bw + off + 1.5, j * bh + 1.5, bw - 3, bh - 3);
    const g = x.createLinearGradient(0, j * bh, 0, (j + 1) * bh);   // mép trên sáng nhẹ
    g.addColorStop(0, 'rgba(255,220,180,.10)'); g.addColorStop(1, 'rgba(0,0,0,.14)');
    x.fillStyle = g; x.fillRect(i * bw + off + 1.5, j * bh + 1.5, bw - 3, bh - 3);
  }
  for (let i = 0; i < 90; i++) {
    x.fillStyle = `rgba(40,70,48,${0.06 + rnd() * 0.12})`;
    x.beginPath(); x.arc(rnd() * W, rnd() * H, 3 + rnd() * 12, 0, TAU); x.fill();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

// Phiến đá xanh lát lối đi giữa sân
export function slabTexture() {
  const W = 256, H = 512, c = cvs(W, H), x = c.getContext('2d');
  const rnd = mulberry32(61);
  x.fillStyle = '#10161a'; x.fillRect(0, 0, W, H);
  for (let j = 0; j < 4; j++) {
    const t = 0.85 + rnd() * 0.3;
    x.fillStyle = `rgb(${(70 * t) | 0},${(82 * t) | 0},${(88 * t) | 0})`;
    x.fillRect(5, j * 128 + 4, W - 10, 120);
    for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.1})`; x.fillRect(5 + rnd() * (W - 12), j * 128 + 4 + rnd() * 118, 1 + rnd() * 3, 1 + rnd() * 3); }
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

// Ngói âm dương: các rãnh ngói ống chạy dọc mái, xen ngói lá. Dùng làm map cho mặt mái.
export function tileTexture() {
  const W = 256, H = 256, c = cvs(W, H), x = c.getContext('2d');
  const rnd = mulberry32(8);
  x.fillStyle = '#2b211d'; x.fillRect(0, 0, W, H);
  const n = 8, s = W / n;
  for (let i = 0; i < n; i++) {                       // ngói ống: gờ tròn nổi
    const g = x.createLinearGradient(i * s, 0, (i + 1) * s, 0);
    g.addColorStop(0, '#2a1f1b'); g.addColorStop(0.25, '#7c6757'); g.addColorStop(0.5, '#a08b78'); g.addColorStop(0.75, '#6b5848'); g.addColorStop(1, '#2a1f1b');
    x.fillStyle = g; x.fillRect(i * s + s * 0.1, 0, s * 0.8, H);
  }
  for (let j = 0; j < 8; j++) {                       // đường nối từng viên ngói
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, j * 32, W, 2);
  }
  for (let i = 0; i < 260; i++) {                     // rêu và bụi thời gian
    x.fillStyle = rnd() > 0.5 ? `rgba(40,70,48,${0.05 + rnd() * 0.1})` : `rgba(0,0,0,${0.05 + rnd() * 0.1})`;
    x.beginPath(); x.arc(rnd() * W, rnd() * H, 1 + rnd() * 5, 0, TAU); x.fill();
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

// Tường vàng chùa: vữa vàng đất, loang nhẹ, chân tường rêu tối, vài vệt mưa
export function plasterTexture() {
  const W = 256, H = 256, c = cvs(W, H), x = c.getContext('2d');
  const rnd = mulberry32(19);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#d6aa52'); g.addColorStop(1, '#cb9d48');   // gần phẳng: texture được lặp, gradient mạnh sẽ thành sọc
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    x.fillStyle = `rgba(${rnd() > 0.5 ? '255,235,170' : '90,60,20'},${0.04 + rnd() * 0.08})`;
    x.beginPath(); x.ellipse(rnd() * W, rnd() * H, 6 + rnd() * 30, 4 + rnd() * 18, rnd() * 3, 0, TAU); x.fill();
  }
  for (let i = 0; i < 26; i++) {                       // vệt mưa chảy dọc
    const sx = rnd() * W, top = rnd() * H * 0.5, ln = 40 + rnd() * 140;
    const gr = x.createLinearGradient(0, top, 0, top + ln);
    gr.addColorStop(0, 'rgba(60,40,15,0)'); gr.addColorStop(0.4, 'rgba(60,40,15,.16)'); gr.addColorStop(1, 'rgba(60,40,15,0)');
    x.fillStyle = gr; x.fillRect(sx, top, 1 + rnd() * 3, ln);
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

// Câu đối dọc: nền son, chữ vàng xếp từng từ một hàng
export function coupletTexture(words) {
  const W = 256, H = 1024, c = cvs(W, H), x = c.getContext('2d');
  x.fillStyle = '#7e1812'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#e7c470'; x.lineWidth = 6; x.strokeRect(8, 8, W - 16, H - 16);
  x.fillStyle = '#f0d58a'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const step = (H - 80) / words.length;
  words.forEach((w, i) => { x.font = '600 74px "Cormorant Garamond", "Noto Serif", Georgia, serif'; x.fillText(w, W / 2, 56 + step * (i + 0.5)); });
  return tex(c);
}

// Bảng chữ (hoành phi, wordmark): vẽ chữ vàng lên nền gỗ sơn
export function signTexture(text, { font = '600 118px "Cormorant Garamond", "Noto Serif", Georgia, serif', bg = '#3a0f0c', fg = '#e7c470', w = 1024, h = 256 } = {}) {
  const c = cvs(w, h), x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
  x.strokeStyle = 'rgba(231,196,112,.4)'; x.lineWidth = 2; x.strokeRect(22, 22, w - 44, h - 44);
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  // Co cỡ chữ cho vừa bảng (chữ Việt có dấu, dài hơn chữ Hán)
  const size = parseInt(font.match(/(\d+)px/)[1], 10), fit = (w - 110) / Math.max(1, x.measureText(text).width);
  if (fit < 1) x.font = font.replace(/\d+px/, Math.floor(size * fit) + 'px');
  x.fillText(text, w / 2, h / 2 + 6);
  return tex(c);
}

// Bầu trời ban ngày: xanh đậm ở đỉnh, nhạt dần về chân trời, vài đám mây mềm
export function daySkyTexture() {
  const W = 1024, H = 512, c = cvs(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#3a86d8'); g.addColorStop(0.28, '#6db4ee'); g.addColorStop(0.46, '#bfe3f7'); g.addColorStop(0.55, '#e4f4fb'); g.addColorStop(1, '#cfe6d2');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const rnd = mulberry32(512);
  for (let i = 0; i < 22; i++) {
    const cx = rnd() * W, cy = H * (0.2 + rnd() * 0.24), w = 70 + rnd() * 120;
    for (let k = 0; k < 7; k++) {
      const px = cx + (k - 3) * w * 0.22 + (rnd() - 0.5) * 20, py = cy + (rnd() - 0.5) * 12, r = w * (0.22 + rnd() * 0.18);
      const gr = x.createRadialGradient(px, py, 0, px, py, r);
      gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr; x.beginPath(); x.ellipse(px, py, r * 1.5, r * 0.62, 0, 0, TAU); x.fill();
    }
  }
  return tex(c);
}

// Sân lát gạch đá xám lớn (xếp so le), như sân chùa trong ảnh mẫu
export function pavingTexture() {
  const W = 512, H = 512, c = cvs(W, H), x = c.getContext('2d'), rnd = mulberry32(61);
  x.fillStyle = '#8f897e'; x.fillRect(0, 0, W, H);
  const rows = 8, bh = H / rows, bw = W / 3;
  for (let j = 0; j < rows; j++) for (let i = -1; i < 4; i++) {
    const off = (j % 2) * bw / 2, t = 0.9 + rnd() * 0.22, w = bw * (0.96 + rnd() * 0.06);
    x.fillStyle = `rgb(${(190 * t) | 0},${(184 * t) | 0},${(172 * t) | 0})`;
    x.fillRect(i * bw + off + 2, j * bh + 2, w - 4, bh - 4);
    const g = x.createLinearGradient(0, j * bh, 0, (j + 1) * bh);
    g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(70,60,50,.14)');
    x.fillStyle = g; x.fillRect(i * bw + off + 2, j * bh + 2, w - 4, bh - 4);
  }
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(90,84,74,${0.04 + rnd() * 0.07})`; x.beginPath(); x.arc(rnd() * W, rnd() * H, 1 + rnd() * 4, 0, TAU); x.fill(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

// Lối đi giữa sân ban ngày: phiến đá dài sáng màu, khe mảnh
export function dayPathTexture() {
  const W = 256, H = 512, c = cvs(W, H), x = c.getContext('2d'), rnd = mulberry32(88);
  x.fillStyle = '#a9a396'; x.fillRect(0, 0, W, H);
  const rows = 4, bh = H / rows;
  for (let j = 0; j < rows; j++) {
    const t = 0.94 + rnd() * 0.12; x.fillStyle = `rgb(${(214 * t) | 0},${(208 * t) | 0},${(194 * t) | 0})`; x.fillRect(3, j * bh + 3, W - 6, bh - 6);
    const g = x.createLinearGradient(0, j * bh, 0, (j + 1) * bh); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(80,70,55,.12)'); x.fillStyle = g; x.fillRect(3, j * bh + 3, W - 6, bh - 6);
  }
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(110,100,85,${0.04 + rnd() * 0.06})`; x.beginPath(); x.arc(rnd() * W, rnd() * H, 1 + rnd() * 3, 0, TAU); x.fill(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

// Sàn gỗ chánh điện (Phiên 14e): ván dài 0,2 m, mỗi cột ván so le mối nối, vân dọc, mắt gỗ, khe tối giữa các ván.
// Một ô lặp = 4,8 × 4,8 m (1024 px): ván rộng 0,2 m = 42,7 px. Dùng cả làm bumpMap để khe lõm ăn sáng.
export function woodFloorTexture() {
  const S = 1024, c = cvs(S, S), x = c.getContext('2d'), rnd = mulberry32(2026);
  const n = 24, pw = S / n;
  x.fillStyle = '#2a170b'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    let y = -rnd() * 300;
    while (y < S) {
      const len = 260 + rnd() * 330, hue = 24 + rnd() * 8, sat = 42 + rnd() * 14, lit = 30 + rnd() * 12;
      const x0 = i * pw + 1.2, w = pw - 2.4, y0 = y + 1.2, h = len - 2.4;
      const g = x.createLinearGradient(x0, 0, x0 + w, 0);
      g.addColorStop(0, `hsl(${hue},${sat}%,${lit - 4}%)`); g.addColorStop(0.5, `hsl(${hue + 2},${sat}%,${lit + 3}%)`); g.addColorStop(1, `hsl(${hue},${sat}%,${lit - 5}%)`);
      x.fillStyle = g; x.fillRect(x0, y0, w, h);
      x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
      for (let k = 0; k < 16; k++) {                                   // vân gỗ chạy dọc, hơi lượn
        const gx = x0 + rnd() * w, a = 0.05 + rnd() * 0.1, dark = rnd() > 0.45;
        x.strokeStyle = dark ? `rgba(30,14,4,${a})` : `rgba(255,214,150,${a * 0.7})`; x.lineWidth = 0.6 + rnd() * 1.2;
        x.beginPath(); x.moveTo(gx, y0);
        for (let q = 1; q <= 6; q++) x.lineTo(gx + Math.sin(q * 1.3 + k) * 1.6 + (rnd() - 0.5) * 0.8, y0 + (h * q) / 6);
        x.stroke();
      }
      if (rnd() < 0.22) {                                              // mắt gỗ
        const kx = x0 + w * (0.3 + rnd() * 0.4), ky = y0 + h * (0.2 + rnd() * 0.6);
        for (let r = 3; r >= 1; r--) { x.strokeStyle = `rgba(35,16,5,${0.22 + (3 - r) * 0.1})`; x.lineWidth = 1; x.beginPath(); x.ellipse(kx, ky, r * 2.2, r * 5.4, 0, 0, TAU); x.stroke(); }
      }
      x.restore();
      const hl = x.createLinearGradient(0, y0, 0, y0 + h); hl.addColorStop(0, 'rgba(255,255,255,.07)'); hl.addColorStop(1, 'rgba(0,0,0,.08)');
      x.fillStyle = hl; x.fillRect(x0, y0, w, h);
      y += len;
    }
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

// Bóng mờ tròn mềm (hào quang sau tượng): chấm sáng vàng, mờ dần ra rìa
export function haloGlowTexture() {
  const c = cvs(256, 256), x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 10, 128, 128, 126);
  g.addColorStop(0, 'rgba(255,236,170,.95)'); g.addColorStop(0.45, 'rgba(255,214,120,.5)'); g.addColorStop(1, 'rgba(255,200,90,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); return tex(c);
}

// Thảm đỏ chánh điện: len dệt đỏ thẫm, viền vàng kép, hoa văn thoi chìm nhẹ. 1 ô = 2,4 m.
export function rugTexture() {
  const S = 512, c = cvs(S, S), x = c.getContext('2d'), rnd = mulberry32(77);
  x.fillStyle = '#7d1612'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 4200; i++) { const a = rnd(); x.fillStyle = a > 0.5 ? `rgba(180,50,40,${0.05 + rnd() * 0.08})` : `rgba(40,0,0,${0.06 + rnd() * 0.1})`; x.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 6); }
  x.strokeStyle = 'rgba(217,178,95,.30)'; x.lineWidth = 2;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const cx = 128 + i * 256, cy = 128 + j * 256;
    x.beginPath(); x.moveTo(cx, cy - 70); x.lineTo(cx + 70, cy); x.lineTo(cx, cy + 70); x.lineTo(cx - 70, cy); x.closePath(); x.stroke();
    x.beginPath(); x.arc(cx, cy, 24, 0, TAU); x.stroke();
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8; x.beginPath(); x.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); x.lineTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44); x.stroke(); }
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
