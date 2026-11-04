// Hoa sen vàng phát sáng trong sân: đi tới gần để nhận lộc (+hạt sen). THUẦN: vị trí, hồi chiêu, nhận lộc. Cảnh 3D ở js/scene/hoasen.js.
// Hồi chiêu lưu theo thời điểm nhận gần nhất để tải lại trang không "cày" lộc.
export const LOC_COOLDOWN_MS = 90 * 1000;
export const LOC_RADIUS = 1.5;
/** Tám điểm trong sân (đã kiểm: trống, cách vật cản ≥ 1,8 m, đi tới được). Hoa lần lượt xuất hiện ở từng điểm. */
export const LOC_SPOTS = [
  { x: -14, z: 28 }, { x: 14, z: 28 }, { x: -20, z: 10 }, { x: 20, z: 12 },
  { x: -15, z: -4 }, { x: 15, z: -3 }, { x: -27, z: -16 }, { x: 27, z: -16 },
];
const num = (v) => (Number.isFinite(+v) && +v >= 0 ? Math.floor(+v) : 0);
export function loadLoc(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  return { t: num(o && o.t), count: num(o && o.count) };
}
/** state = { t: lúc nhận gần nhất (ms, 0 = chưa), count: số lần đã nhận }. */
export function createLoc(state = {}, cooldown = LOC_COOLDOWN_MS) {
  let s = loadLoc(state);
  const spot = () => LOC_SPOTS[s.count % LOC_SPOTS.length];
  return {
    state: () => ({ ...s }),
    /** Hoa đang nở không? (hết hồi chiêu) */
    active: (now = Date.now()) => !s.t || now - s.t >= cooldown,
    spot,
    msLeft: (now = Date.now()) => (!s.t ? 0 : Math.max(0, cooldown - (now - s.t))),
    /** Người ở p có nhận được lộc không. Nhận được thì ghi lại và trả { got:true, spot, state }; không thì null. */
    tryCollect(p, now = Date.now()) {
      if (!this.active(now)) return null;
      const q = spot(); if (Math.hypot(p.x - q.x, p.z - q.z) > LOC_RADIUS) return null;
      s = { t: now, count: s.count + 1 }; return { got: true, spot: q, state: { ...s } };
    },
  };
}
