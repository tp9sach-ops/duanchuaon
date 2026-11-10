// CẢNH MỞ ĐẦU (Phiên 91): vừa vào game, nhân vật cưỡi hạc bay MỘT VÒNG quanh bản đồ (rừng thông, núi sau chùa, hồ cá, thác nước, Đại Phật, chợ làng…) rồi đáp xuống đúng chỗ xuất phát
// (SPAWN trước cổng chùa) — sau đó mới hiện màn đăng nhập. LOGIC THUẦN (không DOM, không three.js, có test: tests/intro.test.mjs); hình 3D + camera: js/scene/intro.js; chữ/nút Bỏ qua: js/ui/introUi.js.
// Mọi con số (đường bay, tốc độ, thời lượng) là QUY ƯỚC TẠM chờ ptg duyệt.
import { SPAWN } from './layout.js';

/** Đường bay (x, y, z) đi NGƯỢC chiều kim đồng hồ nhìn từ trên xuống... bắt đầu phía nam làng, vòng sang rừng thông (tây) → sau núi (bắc) → thác & Đại Phật (đông) → chợ → đáp. */
export const WAYPOINTS = [
  [0, 66, 210], [-72, 58, 172], [-128, 50, 112], [-120, 52, 38], [-92, 62, -32], [-45, 74, -102], [25, 82, -122], [90, 70, -72],
  [120, 56, -6], [130, 46, 70], [118, 40, 132], [70, 42, 164], [22, 36, 140], [3, 24, 108], [0, 10, 78], [SPAWN.x, 0.15, SPAWN.z],
];
/** Địa danh hiện chữ khi bay ngang (gần nhất trong LABEL_R mét theo mặt phẳng). */
export const LANDMARKS = [
  { ten: 'Rừng thông', x: -98, z: 89 }, { ten: 'Vườn thiền · Trà thất', x: -62, z: 8 }, { ten: 'Nhà Tổ', x: -38, z: -20 }, { ten: 'Chánh điện & núi non phía sau', x: 0, z: -40 },
  { ten: 'Gác chuông', x: 28, z: -4 }, { ten: 'Hồ cá', x: 52, z: 10 }, { ten: 'Thác nước', x: 95, z: 104 }, { ten: 'Đại Phật vách đá', x: 109, z: 120 }, { ten: 'Chợ làng', x: 0, z: 128 }, { ten: 'Đường làng', x: 0, z: 88 },
];
export const LABEL_R = 62;
export const DURATION = 34;          // giây (bấm Bỏ qua được bất cứ lúc nào)
export const FINAL_CAM = { pos: [0, 4.6, 63], look: [0, 1.6, 52] };   // gần góc nhìn sau lưng nhân vật khi vào chế độ đi bộ → chuyển cảnh êm
const num = (v) => (Number.isFinite(+v) ? +v : 0);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

function cr(p0, p1, p2, p3, t) { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); }
/** Dựng đường bay: lấy mẫu Catmull-Rom thành chuỗi điểm có độ dài tích lũy. Trả { pts: [{x,y,z,d}], length }. */
export function buildTrack(wps = WAYPOINTS, seg = 24) {
  const P = wps.map((w) => w.map(num)), pts = []; let d = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], e = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) { const t = k / seg, q = [0, 1, 2].map((j) => cr(a[j], b[j], c[j], e[j], t)); if (pts.length) d += Math.hypot(q[0] - pts[pts.length - 1].x, q[1] - pts[pts.length - 1].y, q[2] - pts[pts.length - 1].z); pts.push({ x: q[0], y: q[1], z: q[2], d }); }
  }
  const l = P[P.length - 1]; d += Math.hypot(l[0] - pts[pts.length - 1].x, l[1] - pts[pts.length - 1].y, l[2] - pts[pts.length - 1].z); pts.push({ x: l[0], y: l[1], z: l[2], d });
  return { pts, length: d };
}
export const TRACK = buildTrack();
/** Điểm trên đường bay ở quãng đường s (m). */
export function atDistance(track, s) {
  const pts = track.pts, x = clamp(num(s), 0, track.length); let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].d <= x) lo = m; else hi = m; }
  const a = pts[lo], b = pts[hi], k = b.d > a.d ? (x - a.d) / (b.d - a.d) : 0;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
}
// Bảng tốc độ: tăng tốc 3 s đầu, giữ tốc độ bay, giảm dần 6 s cuối để đáp nhẹ (tích phân rồi chuẩn hóa để t = DURATION đúng tại điểm đáp).
const STEP = 1 / 30, N = Math.round(DURATION / STEP);
const speedK = (t) => (0.3 + 0.7 * smooth(t / 3)) * (0.06 + 0.94 * smooth((DURATION - t) / 6));
const TABLE = (() => { const a = new Float64Array(N + 1); for (let i = 1; i <= N; i++) a[i] = a[i - 1] + speedK((i - 0.5) * STEP) * STEP; return a; })();
/** Quãng đường (m) đã bay sau t giây (0..DURATION) trên đường `track`. */
export function distanceAt(t, track = TRACK) {
  const x = clamp(num(t), 0, DURATION) / STEP, i = Math.min(N - 1, Math.floor(x)), f = x - i; return track.length * (TABLE[i] + (TABLE[i + 1] - TABLE[i]) * f) / TABLE[N];
}
const headingAt = (track, s) => { const a = atDistance(track, s - 1.5), b = atDistance(track, s + 1.5); return Math.atan2(b.x - a.x, b.z - a.z); };
export const labelAt = (x, z) => { let best = null, bd = LABEL_R; for (const L of LANDMARKS) { const d = Math.hypot(L.x - x, L.z - z); if (d < bd) { bd = d; best = L.ten; } } return best || ''; };

/**
 * Trạng thái hạc + người cưỡi tại giây t: { x, y, z, heading (rad, nhìn +z khi 0), pitch (rad, + là ngóc lên), bank (rad), speed (m/s), k (0..1), label, done, flap (0..1: sải cánh mạnh khi bay nhanh/cất cánh, xòe cánh liệng khi đáp) }.
 */
export function introState(t, track = TRACK) {
  const tt = clamp(num(t), 0, DURATION), s = distanceAt(tt, track), p = atDistance(track, s), h = headingAt(track, s), h2 = headingAt(track, Math.min(track.length, s + 14)), h0 = headingAt(track, Math.max(0, s - 14));
  const a = atDistance(track, s - 2), b = atDistance(track, s + 2), hz = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6, pitch = Math.atan2(b.y - a.y, hz);
  const speed = (distanceAt(Math.min(DURATION, tt + 0.1), track) - distanceAt(Math.max(0, tt - 0.1), track)) / (tt <= 0.1 || tt >= DURATION - 0.1 ? 0.1 : 0.2);
  const landing = clamp((DURATION - tt) / 6, 0, 1);
  return { x: p.x, y: p.y, z: p.z, heading: h, pitch, bank: clamp(-wrap(h2 - h0) * 0.9, -0.55, 0.55) * (0.3 + 0.7 * landing), speed, k: tt / DURATION, label: labelAt(p.x, p.z), done: tt >= DURATION, flap: 0.45 + 0.55 * landing };
}
/**
 * Camera điện ảnh theo hạc: bay phía sau-cao, lắc nhẹ sang hai bên; 4 giây đầu kéo ra xa cho thấy toàn cảnh; 3,5 giây cuối nhẹ nhàng về góc nhìn khi đi bộ (FINAL_CAM).
 * Trả { pos: [x,y,z], look: [x,y,z] }.
 */
export function introCamera(st, t) {
  const tt = num(t), h = st.heading, fw = [Math.sin(h), Math.cos(h)], side = [-Math.cos(h), Math.sin(h)];
  const open = 1 - smooth(tt / 4.5), d = 15 + 28 * open + 2.5 * Math.sin(tt * 0.31), up = 6 + 20 * open + 2.2 * Math.sin(tt * 0.43), sw = 7.5 * Math.sin(tt * 0.21) * (1 - open);
  let pos = [st.x - fw[0] * d + side[0] * sw, Math.max(st.y + up, 3), st.z - fw[1] * d + side[1] * sw], look = [st.x + fw[0] * 9, st.y + 0.8, st.z + fw[1] * 9];
  const w = smooth((tt - (DURATION - 3.5)) / 3.5);
  if (w > 0) { pos = pos.map((v, i) => v + (FINAL_CAM.pos[i] - v) * w); look = look.map((v, i) => v + (FINAL_CAM.look[i] - v) * w); }
  return { pos, look };
}
