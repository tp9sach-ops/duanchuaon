// Đa người (Phiên 15a): logic thuần, KHÔNG phụ thuộc three.js/DOM nên kiểm thử được bằng Node.
// Máy chủ (gas/Room.gs) kiểm lại mọi thứ bằng quy tắc GIỐNG file này; client chỉ lọc trước cho tiện.
import { cleanName, STATES } from '../world/avatarLogic.js';

export const ROOM_CFG = {
  room: 'main',
  maxPlayers: 30,       // số người tối đa trong một phòng (máy chủ từ chối người thứ 31)
  ttlMs: 12000,         // quá hạn này không gửi gì thì coi như đã rời chùa
  minPollMs: 1500, maxPollMs: 8000, perPlayerMs: 350,
  chatMax: 80, chatGapMs: 2000,
  limit: 200,           // |x|, |z| tối đa
};

const clamp = (v, lo, hi, d = 0) => { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
const r2 = (v) => Math.round(v * 100) / 100;

/** Chu kỳ thăm dò (ms) theo số người: nhiều người thì thưa ra vì Apps Script xử lý lần lượt từng yêu cầu. */
export function pollInterval(count) { return clamp((Number(count) || 1) * ROOM_CFG.perPlayerMs, ROOM_CFG.minPollMs, ROOM_CFG.maxPollMs, ROOM_CFG.minPollMs); }

/** Lời nhắn: ≤ 80 ký tự, không link/email/số điện thoại. Trả chuỗi đã làm sạch hoặc '' nếu không hợp lệ. (Giống roomChat_ trong Room.gs.) */
export function chatOk(s) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  s = Array.from(s).slice(0, ROOM_CFG.chatMax).join('');
  if (/(https?:\/\/|www\.|\.com\b|\.vn\b|@)/i.test(s)) return '';
  if (/\d[\d\s.\-]{7,}\d/.test(s)) return '';
  return s;
}

const tok = (s, d) => (/^[a-z0-9]{1,12}$/.test(String(s == null ? '' : s)) ? String(s) : d);
export const validId = (s) => /^[A-Za-z0-9._-]{8,64}$/.test(String(s == null ? '' : s));

/** Làm sạch trạng thái một người chơi (nhận từ mạng): trả null nếu id không hợp lệ. */
export function cleanPlayer(p) {
  if (!p || typeof p !== 'object' || !validId(p.id)) return null;
  return {
    id: String(p.id),
    n: cleanName(p.n),
    c: tok(p.c, 'nau'), h: tok(p.h, 'troc'),
    x: r2(clamp(p.x, -ROOM_CFG.limit, ROOM_CFG.limit)), z: r2(clamp(p.z, -ROOM_CFG.limit, ROOM_CFG.limit)), y: r2(clamp(p.y, -5, 20)),
    r: r2(clamp(p.r, -7, 7)),
    s: STATES.includes(p.s) ? p.s : 'idle',
  };
}

/** Góc quay ngắn nhất từ a tới b (rad). */
export function angleDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

/**
 * Giữ danh sách người khác và làm mượt chuyển động giữa hai lần nhận tin (mỗi 1,5–8 giây).
 * ingest(list, now): nhận danh sách từ máy chủ (bỏ người lạ id, bỏ người đã rời).
 * step(dt): trả mảng { id, x, y, z, ry, speed, state, n, c, h } đã nội suy.
 */
export function createRemotes() {
  const m = new Map();
  const API = {
    get size() { return m.size; },
    has: (id) => m.has(id),
    ingest(list, selfId = '') {
      const fresh = [], ids = new Set();
      for (const raw of Array.isArray(list) ? list : []) { const p = cleanPlayer(raw); if (p && p.id !== selfId && !ids.has(p.id)) { ids.add(p.id); fresh.push(p); } }
      for (const id of [...m.keys()]) if (!ids.has(id)) m.delete(id);          // người đã rời
      for (const p of fresh) {
        const cur = m.get(p.id);
        if (!cur) { if (m.size < ROOM_CFG.maxPlayers) m.set(p.id, { ...p, tx: p.x, tz: p.z, ty: p.y, tr: p.r, speed: 0 }); }
        else { cur.tx = p.x; cur.tz = p.z; cur.ty = p.y; cur.tr = p.r; cur.s = p.s; cur.n = p.n; cur.c = p.c; cur.h = p.h; }
      }
    },
    step(dt) {
      const k = 1 - Math.exp(-Math.max(0, dt) * 3.2), out = [];
      for (const p of m.values()) {
        const ox = p.x, oz = p.z, dx = p.tx - p.x, dz = p.tz - p.z;
        if (Math.hypot(dx, dz) > 12) { p.x = p.tx; p.z = p.tz; }          // dịch chuyển xa: nhảy tới luôn, không trượt xuyên chùa
        else { p.x += dx * k; p.z += dz * k; }
        p.y += (p.ty - p.y) * (1 - Math.exp(-Math.max(0, dt) * 8));
        p.r += angleDiff(p.r, p.tr) * (1 - Math.exp(-Math.max(0, dt) * 8));
        p.speed = dt > 0 ? Math.hypot(p.x - ox, p.z - oz) / dt : 0;
        out.push({ id: p.id, x: p.x, y: p.y, z: p.z, ry: p.r, speed: p.speed, state: p.s, n: p.n, c: p.c, h: p.h });
      }
      return out;
    },
  };
  return API;
}
