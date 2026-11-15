// KẾT CẤU (texture) vẽ bằng canvas cho hiệu ứng chiêu (Phiên 176): hạt tròn mềm, quầng sáng, khói, vệt, vòng sóng, tia sao. Trước đây hạt dùng PointsMaterial không có ảnh nên hiện ra Ô VUÔNG.
// Không file ảnh (không vướng bản quyền, không tải thêm). Mỗi kết cấu dựng 1 lần, dùng chung (không dispose theo từng chiêu). Không có document (môi trường test) → trả null, hiệu ứng vẫn chạy.
import * as THREE from 'three';

const cache = {};
function mk(key, w, h, draw) {
  if (key in cache) return cache[key];
  let t = null;
  try {
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      if (g) { draw(g, w, h); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; }
    }
  } catch (_) { t = null; }
  return (cache[key] = t);
}
const radial = (g, w, h, stops) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [o, a] of stops) r.addColorStop(o, `rgba(255,255,255,${a})`); g.fillStyle = r; g.fillRect(0, 0, w, h); };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** Chấm tròn mềm, lõi đặc (tia lửa, lấp lánh, mảnh). */
export const softDot = () => mk('dot', 64, 64, (g, w, h) => radial(g, w, h, [[0, 1], [0.3, 0.85], [0.65, 0.22], [1, 0]]));
/** Quầng sáng rộng, rơi dần (bloom giả cho lõi và nền). */
export const glow = () => mk('glow', 128, 128, (g, w, h) => radial(g, w, h, [[0, 1], [0.15, 0.6], [0.4, 0.2], [0.7, 0.05], [1, 0]]));
/** Đám khói/bụi: nhiều đốm mờ chồng nhau, không đều. */
export const smoke = () => mk('smoke', 128, 128, (g, w, h) => {
  seed = 11; for (let i = 0; i < 16; i++) { const x = w / 2 + (rnd() - 0.5) * w * 0.45, y = h / 2 + (rnd() - 0.5) * h * 0.45, r = w * (0.14 + rnd() * 0.16); const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,0.32)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, w, h); }
  const m = g.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w / 2); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = m; g.fillRect(0, 0, w, h);
});
/** Vệt thon: sáng giữa, mờ hai mép (dùng cho dải vệt chiêu). */
export const streak = () => mk('streak', 32, 128, (g, w, h) => { const l = g.createLinearGradient(0, 0, w, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, w, h); });
/** Vòng sóng chấn: vành sáng mềm, trong và ngoài mờ. */
export const ring = () => mk('ring', 128, 128, (g, w, h) => radial(g, w, h, [[0, 0], [0.62, 0], [0.82, 0.9], [0.92, 0.35], [1, 0]]));
/** Tia sao 4 cánh + quầng (nháy lúc bùng nổ). */
export const flare = () => mk('flare', 128, 128, (g, w, h) => {
  radial(g, w, h, [[0, 1], [0.2, 0.55], [0.5, 0.12], [1, 0]]);
  for (const [a, len] of [[0, 1], [Math.PI / 2, 1], [Math.PI / 4, 0.55], [-Math.PI / 4, 0.55]]) { g.save(); g.translate(w / 2, h / 2); g.rotate(a); const l = g.createLinearGradient(-w / 2 * len, 0, w / 2 * len, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,0.95)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(-w / 2 * len, -2, w * len, 4); g.restore(); }
});
