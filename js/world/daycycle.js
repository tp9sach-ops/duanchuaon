// Chu kỳ ngày đêm (Phiên 23): hàm THUẦN, không đụng three.js, có test (tests/daycycle.test.mjs).
// dayState(giờ) → mọi giá trị ánh sáng/bầu trời/sương cho giờ đó. Lúc 12h trùng đúng giá trị cảnh ban ngày cũ.
export const DAY_SECONDS = 1440;                    // một ngày trong game = 24 phút thật (1 giờ game = 60 giây)
export const HOURS_PER_SECOND = 24 / DAY_SECONDS;
export const START_HOUR = 9;                        // giờ mở đầu mặc định (sáng, giống ảnh mẫu); ?gio=thuc dùng giờ máy, ?gio=H cố định

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const wrapHour = (h) => ((h % 24) + 24) % 24;

/** Pha trộn hai màu 0xRRGGBB; t=0 trả đúng màu a (không làm tròn lệch). */
export function lerpHex(a, b, t) {
  t = clamp01(t); if (t === 0) return a; if (t === 1) return b;
  const ch = (s) => { const x = (a >> s) & 255, y = (b >> s) & 255; return Math.round(x + (y - x) * t); };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

// Mốc theo giờ: night = độ tối (0 sáng rõ … 1 tối hẳn), warm = ánh ấm bình minh/hoàng hôn (0..1).
const KEYS = [
  { h: 0, night: 1, warm: 0 }, { h: 4.5, night: 1, warm: 0 }, { h: 5.5, night: 0.7, warm: 0.6 }, { h: 6.3, night: 0.25, warm: 1 },
  { h: 7.5, night: 0, warm: 0.5 }, { h: 8.5, night: 0, warm: 0 }, { h: 15.5, night: 0, warm: 0 }, { h: 16.8, night: 0, warm: 0.5 },
  { h: 17.8, night: 0.1, warm: 1 }, { h: 18.5, night: 0.45, warm: 0.8 }, { h: 19.3, night: 0.9, warm: 0.2 }, { h: 20.3, night: 1, warm: 0 },
  { h: 24, night: 1, warm: 0 },
];
function keyAt(h) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (h >= a.h && h <= b.h) { const s = smooth(a.h, b.h, h); return { night: a.night + (b.night - a.night) * s, warm: a.warm + (b.warm - a.warm) * s }; }
  }
  return { night: 1, warm: 0 };
}

const SUN_Y = 80 / Math.hypot(45, 80, 85), AZ0 = Math.atan2(45, 85);   // hướng mặt trời lúc trưa = hướng cũ (45, 80, 85)
const norm = (v) => { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; };
const fromAz = (az, y) => { const r = Math.sqrt(Math.max(0, 1 - y * y)); return { x: Math.sin(az) * r, y, z: Math.cos(az) * r }; };

/** Hướng TỚI mặt trời (vector đơn vị). Mọc 6h phía đông, lặn 18h phía tây; ngoài giờ đó ở dưới chân trời (y<0). */
export function sunDir(h) {
  h = wrapHour(h); const a = ((h - 6) / 12) * Math.PI;
  return fromAz(AZ0 - Math.cos(a) * (Math.PI / 2), SUN_Y * Math.sin(a));
}
/** Hướng TỚI mặt trăng: mọc 18h, lặn 6h sáng, luôn ở phía đối diện mặt trời. */
export function moonDir(h) {
  h = wrapHour(h); const t = clamp01(((h - 18 + 24) % 24) / 12), b = t * Math.PI;
  return fromAz(AZ0 + Math.PI - Math.cos(b) * (Math.PI / 2), 0.12 + 0.62 * Math.sin(b));
}
/** Hướng đèn chính (mặt trời ban ngày, trăng ban đêm, pha dần khi chuyển); y không dưới 0,28 để bóng không quá dài. */
export function lightDir(h) {
  const n = keyAt(wrapHour(h)).night, s = sunDir(h), m = moonDir(h);
  const v = norm({ x: s.x * (1 - n) + m.x * n, y: s.y * (1 - n) + m.y * n, z: s.z * (1 - n) + m.z * n });
  return v.y >= 0.28 ? v : norm({ x: v.x, y: 0.28 * Math.hypot(v.x, v.z) / Math.sqrt(1 - 0.28 * 0.28), z: v.z });
}

export function phaseName(h) {
  h = wrapHour(h);
  return h >= 5 && h < 7.5 ? 'Bình minh' : h >= 7.5 && h < 16.5 ? 'Ban ngày' : h >= 16.5 && h < 19.5 ? 'Hoàng hôn' : 'Ban đêm';
}
export function clockText(h) {
  h = wrapHour(h); let hh = Math.floor(h), mm = Math.floor((h - hh) * 60); if (mm >= 60) { mm = 0; hh = (hh + 1) % 24; }
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}
/** Giờ máy (0..24, có phần lẻ). */
export function realHour(d = new Date()) { return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
/** Đọc ?gio= : số 0..24 → giờ cố định (không chạy); "thuc" → giờ máy, chạy tiếp; không có → START_HOUR. Trả { hour, fixed }. */
export function parseHourParam(search) {
  const v = new URLSearchParams(search || '').get('gio');
  if (v === null || v === '') return { hour: START_HOUR, fixed: false };
  if (v === 'thuc') return { hour: realHour(), fixed: false };
  const x = Number(v.replace(',', '.'));
  return isFinite(x) && x >= 0 && x <= 24 ? { hour: wrapHour(x), fixed: true } : { hour: START_HOUR, fixed: false };
}

// Bảng màu: [ban ngày, ban đêm, ánh ấm]. Giá trị ban ngày = đúng giá trị cũ trong scene/index.js.
const C = {
  bg: [0xcfe8f5, 0x1a2b48, 0xf0b27a], skyTint: [0xffffff, 0x1c2e4a, 0xffb985], sun: [0xfff0d2, 0xdfe6ff, 0xff9a50],
  hemiSky: [0xe3f2ff, 0x9bb2e6, 0xffd2a8], hemiGround: [0xb9a487, 0x3a2e30, 0x8a6a50], amb: [0xffffff, 0xb4c2ea, 0xffc89a],
};
const mix3 = (c, n, w, warmK) => lerpHex(lerpHex(c[0], c[1], n), c[2], w * warmK);

/** Trạng thái ánh sáng của giờ h (warmBias: ánh ấm thêm theo mùa, mặc định 0 = như cũ). Mọi số đều hữu hạn; màu là số nguyên 0..0xFFFFFF. */
export function dayState(h, warmBias = 0) {
  h = wrapHour(h); const k = keyAt(h), n = k.night, w = clamp01(k.warm + warmBias * (1 - n));   // warmBias: ánh ấm thêm ban ngày (mùa thu), tắt dần về đêm
  const sy = Math.max(0, sunDir(h).y), elev = smooth(0, 0.35, sy);        // mặt trời thấp thì yếu
  return {
    hour: h, phase: phaseName(h), night: n, warm: w,
    bg: mix3(C.bg, n, w, 0.55), skyTint: mix3(C.skyTint, n, w, 0.6), fogDensity: 0.0021 + (0.0042 - 0.0021) * n,
    sun: { color: mix3(C.sun, n, w, 0.7), i: 2.9 * (1 - n) * elev + 1.3 * n },
    hemi: { sky: mix3(C.hemiSky, n, w, 0.4), ground: mix3(C.hemiGround, n, w, 0.3), i: 1.5 + (0.75 - 1.5) * n },
    amb: { color: mix3(C.amb, n, w, 0.4), i: 0.5 + (0.45 - 0.5) * n },
    exposure: 1.05 + (1.2 - 1.05) * n, bloom: 0.18 + (0.5 - 0.18) * n,
    stars: smooth(0.55, 0.95, n), moon: smooth(0.4, 0.9, n), lamps: smooth(0.15, 0.65, n),
    warm1: 60 + (220 - 60) * smooth(0.15, 0.65, n), warm2: 12 + (160 - 12) * smooth(0.15, 0.65, n),
  };
}
