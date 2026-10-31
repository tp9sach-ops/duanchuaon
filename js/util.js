// Hàm tiện ích dùng chung (toán, canvas, số ngẫu nhiên có seed).
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const sat = (v) => clamp(v, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (e0, e1, x) => { const t = sat((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
// Làm mượt không phụ thuộc tốc độ khung hình
export const damp = (cur, to, rate, dt) => lerp(cur, to, 1 - Math.exp(-rate * dt));

// Bộ sinh số ngẫu nhiên có seed: cùng seed luôn ra cùng cảnh
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cvs(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export const isCoarse = () => matchMedia('(hover: none)').matches;
export const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
