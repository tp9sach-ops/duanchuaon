// Cầu nối Firebase ↔ Apps Script (Phiên 26): người ở Firebase và người rơi xuống Apps Script dự phòng KHÔNG thấy nhau vì hai kho dữ liệu riêng.
// Người đang ở Firebase vừa báo vị trí lên Apps Script (cùng id = uid Firebase, mỗi everyMs) vừa gộp danh sách người của Apps Script vào danh sách Firebase.
// Nhờ vậy người ở Firebase thấy người ở Apps Script và ngược lại; trùng id thì chỉ giữ một. Lời nhắn chỉ đi theo đường chính (Firebase).
// Thuần logic, không import three.js/DOM: gasCall(req) → Promise<res> được đưa vào nên kiểm thử được bằng Node.
import { ROOM_CFG } from '../engines/room.js';

const GAS_STALE_MS = 15000;     // danh sách Apps Script cũ hơn mức này thì bỏ (tránh giữ bóng ma khi Apps Script chậm/lỗi)

export function withGasBridge(t, { gasCall, now = () => Date.now(), everyMs = 4000 } = {}) {
  if (!t || typeof t.call !== 'function' || typeof gasCall !== 'function') return t;
  const base = t.call.bind(t);
  let last = -Infinity, busy = false, gas = [], gasAt = -Infinity;
  t.call = async (req) => {
    const res = await base(req);
    if (!res || !res.ok || !t.uid || !req) return res;
    const tm = now();
    if (!busy && tm - last >= everyMs) {
      busy = true; last = tm;
      Promise.resolve()
        .then(() => gasCall({ action: 'sync', room: ROOM_CFG.room, id: t.uid, n: req.n, c: req.c, h: req.h, x: req.x, y: req.y, z: req.z, r: req.r, s: req.s, since: 0, say: '' }))
        .then((g) => { if (g && g.ok && Array.isArray(g.players)) { gas = g.players; gasAt = now(); } })
        .catch(() => { /* Apps Script lỗi: bỏ qua, Firebase vẫn chạy */ })
        .finally(() => { busy = false; });
    }
    if (!gas.length || now() - gasAt > GAS_STALE_MS) return res;
    const have = new Set((res.players || []).map((p) => p.id)), extra = gas.filter((p) => p && p.id && p.id !== t.uid && !have.has(p.id));
    if (!extra.length) return res;
    const players = [...(res.players || []), ...extra];
    return { ...res, players, count: players.length + 1 };
  };
  return t;
}
