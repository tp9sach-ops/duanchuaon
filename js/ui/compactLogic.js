// Logic thuần của giao diện gọn: nhóm nút có thể ẩn, kiểu hiển thị có sẵn, lưu/đọc trạng thái, chọn kiểu theo thiết bị,
// tính chuyển động camera và độ co của cụm nút thao tác. Không đụng DOM nên test được bằng Node (tests/compact.test.mjs). DOM ở compact.js.
import { dragCamera, zoomCamera, CAM_DIST, CAM_PITCH } from '../world/worldLogic.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Các nhóm nút người chơi có thể ẩn/hiện. id = hậu tố class trên <body> (ui-h-<id>); CSS ở css/compact.css. */
export const GROUPS = [
  { id: 'chip', ten: 'Hồ sơ và cấp độ' },
  { id: 'meta', ten: 'Tên chùa, online, giờ game' },
  { id: 'hall', ten: 'Nút Vào chánh điện' },
  { id: 'map', ten: 'Bản đồ nhỏ' },
  { id: 'bar', ten: 'Menu chính (Nhiệm vụ, Túi đồ…)' },
  { id: 'grid', ten: 'Nút Lạy, Tụng kinh, Thiền…' },
  { id: 'dock', ten: 'Cụm nút thao tác (nhảy, câu cá…)' },
  { id: 'wallet', ten: 'Hạt sen, ngọc, cấp' },
  { id: 'icons', ten: 'Biểu tượng góc phải' },
  { id: 'zoom', ten: 'Nút camera + − ⟲' },
  { id: 'sound', ten: 'Nút âm thanh' },
  { id: 'note', ten: 'Ghi chú cuối trang' },
  { id: 'soon', ten: 'Nút “sắp có”' },
];
export const IDS = GROUPS.map((g) => g.id);
/** Thứ tự tự ẩn TẠM (không lưu) khi cột trái-trên chạm tới joystick/nút camera: bản đồ nhỏ trước, nút chánh điện sau cùng. */
export const AUTO_ORDER = ['map', 'meta', 'chip', 'hall'];
export const STORE_KEY = 'lgt.ui2';

/** Ba kiểu hiển thị. hide = nhóm bị ẩn; autoClose = menu chính tự đóng sau khi chọn một mục. */
export const PRESETS = {
  day: { ten: 'Đầy đủ', hide: [], autoClose: false },
  gon: { ten: 'Gọn', hide: ['meta', 'map', 'bar', 'note', 'soon'], autoClose: true },
  min: { ten: 'Tối giản', hide: ['chip', 'meta', 'hall', 'map', 'bar', 'wallet', 'icons', 'note', 'soon'], autoClose: true },
};

/** Giữ lại các id hợp lệ, không trùng, theo thứ tự GROUPS. */
export const cleanHide = (list) => { const s = new Set(Array.isArray(list) ? list : []); return IDS.filter((id) => s.has(id)); };
export const makeState = (name) => { const p = PRESETS[name] || PRESETS.day; return { hide: cleanHide(p.hide), ac: p.autoClose, prev: null, saved: false }; };

/** Đọc trạng thái đã lưu (chuỗi JSON). Thiếu/hỏng → dùng kiểu `fallback` và saved=false (chưa người chơi nào chọn). */
export function parseState(raw, fallback = 'day') {
  try {
    const o = JSON.parse(raw);
    if (o && o.v === 1 && Array.isArray(o.h)) return { hide: cleanHide(o.h), ac: !!o.ac, prev: Array.isArray(o.p) ? cleanHide(o.p) : null, saved: true };
  } catch (_) { /* hỏng hoặc chưa có: dùng kiểu mặc định */ }
  return makeState(fallback);
}
export const serializeState = (st) => JSON.stringify({ v: 1, h: cleanHide(st && st.hide), ac: !!(st && st.ac), p: st && st.prev ? cleanHide(st.prev) : null });

/** Hiện (shown=true) hoặc ẩn một nhóm; id lạ thì giữ nguyên. */
export function setShown(st, id, shown) {
  if (!IDS.includes(id)) return st;
  const set = new Set(st.hide); if (shown) set.delete(id); else set.add(id);
  return { ...st, hide: cleanHide([...set]) };
}
/** Trạng thái đang khớp kiểu nào ('day' | 'gon' | 'min') hay là tùy chỉnh (null). */
export function matchPreset(st) {
  const h = cleanHide(st && st.hide).join(',');
  return Object.keys(PRESETS).find((k) => cleanHide(PRESETS[k].hide).join(',') === h) || null;
}
/** Nút ⛶: đang ở "Tối giản" thì trả về trạng thái trước đó (hoặc fallbackHide); chưa thì nhớ trạng thái hiện tại rồi chuyển "Tối giản". */
export function toggleFocus(st, fallbackHide = []) {
  if (matchPreset(st) === 'min') return { ...st, hide: cleanHide(st.prev || fallbackHide), prev: null };
  return { ...st, prev: cleanHide(st.hide), hide: cleanHide(PRESETS.min.hide), ac: true };
}
/** Kiểu mặc định theo thiết bị: cảm ứng hoặc khung thấp → gọn; khung rất thấp (≤ 400) → tối giản; màn hình lớn → đầy đủ. */
export function presetFor({ coarse = false, framed = false, w = 1280, h = 720 } = {}) {
  if ((coarse || framed) && h <= 400) return 'min';
  if (coarse || h <= 620 || w <= 520) return 'gon';
  return 'day';
}

// ---------------------------------------------------------------- camera
// Hệ số suy ra từ chính worldLogic.js (dragCamera/zoomCamera) nên luôn khớp nếu ai đó đổi độ nhạy.
const KX = -dragCamera(0, 0.5, 1, 0).yaw;                       // yaw giảm KX rad cho mỗi px kéo ngang
const KY = dragCamera(0, 0.5, 0, 1).pitch - 0.5;                // pitch tăng KY rad cho mỗi px kéo dọc
const KZ = Math.log(zoomCamera(5, 100) / 5) / 100;              // ln(dist) tăng KZ cho mỗi đơn vị delta zoom

/** Các thao tác camera nhanh. behind: quay ra sau lưng nhân vật; pitch/dist: góc nghiêng / khoảng cách mong muốn. */
export const CAM_KINDS = {
  reset: { ten: 'Ra sau lưng', behind: true, pitch: CAM_PITCH.def, dist: CAM_DIST.def },
  near: { ten: 'Gần', dist: 3.2 },
  mid: { ten: 'Vừa', dist: CAM_DIST.def },
  far: { ten: 'Xa', dist: 8.5 },
  high: { ten: 'Nhìn cao', pitch: 0.85 },
  low: { ten: 'Nhìn thấp', pitch: 0.2 },
};
/** Góc ngắn nhất (rad, trong (−π, π]) để quay từ `from` tới `to`. */
export function shortestAngle(from, to) {
  let d = (to - from) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI; else if (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}
/** Từ camera hiện tại {yaw, pitch, dist} và hướng nhìn của nhân vật → { dx, dy, dz }: dx, dy là độ kéo (px) cần đưa cho dragCamera, dz là delta cho zoomCamera. */
export function camMove(kind, cam, facing) {
  const k = CAM_KINDS[kind];
  if (!k || !cam || !(cam.dist > 0) || !Number.isFinite(cam.yaw) || !Number.isFinite(cam.pitch)) return null;
  let dx = 0, dy = 0, dz = 0;
  if (k.behind && Number.isFinite(facing)) dx = -shortestAngle(cam.yaw, facing + Math.PI) / KX;   // camera đứng phía sau lưng = hướng nhìn + π
  if (k.pitch != null) dy = (clamp(k.pitch, CAM_PITCH.min, CAM_PITCH.max) - cam.pitch) / KY;
  if (k.dist != null) dz = Math.log(clamp(k.dist, CAM_DIST.min, CAM_DIST.max) / cam.dist) / KZ;
  return { dx, dy, dz };
}

// ---------------------------------------------------------------- cụm nút thao tác
/** Hệ số thu nhỏ (0,5–1) để cụm cao `height` px, đáy ở `bottom`, nằm lọt dưới `limitTop` (mép dưới của vật cản phía trên). */
export function dockScale({ bottom, limitTop, height, min = 0.5 } = {}) {
  if (!(height > 0) || !Number.isFinite(bottom) || !Number.isFinite(limitTop)) return 1;
  return Math.round(clamp((bottom - limitTop) / height, min, 1) * 100) / 100;
}
