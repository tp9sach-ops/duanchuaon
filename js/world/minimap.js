// Bản đồ mini + bản đồ lớn (Phiên 39). LOGIC THUẦN (không DOM, không three.js, có test: tests/minimap.test.mjs). Vẽ ở js/ui/minimap.js.
// Hướng bản đồ: phía trên = -z (chánh điện, Quan Âm đài), phía dưới = +z (làng, chợ, khu nhà ở); trái = -x, phải = +x (giống màn hình khi camera nhìn về chánh điện).
import { LAKE, riverCircles } from './river.js';
import { PLACES, OUT_WALKS, THAC, STORE_9SACH, STORE_TACHHOA } from './outside.js';
import { NPCS } from './npc.js';
import { PLACE_STAND } from './questGuide.js';
import { POND } from './layout.js';
import { HUB_ID } from './zones.js';
import { plotById, houseLevel } from './land.js';

/** Bản đồ này CHỈ vẽ zone hub (chùa + làng). Đứng ở zone khác thì ẩn bản đồ để không chỉ sai chỗ (Phiên 86). `zones` = LGT.zones (có thể chưa có). */
export function mapAvailable(zones) {
  const cur = zones && zones.current;
  return typeof cur !== 'string' || cur === HUB_ID;
}

/** Khung thế giới hiển thị trên bản đồ (m). Phủ cả Quan Âm đài (z≈-63), khu nhà ở (z≈210), rừng thông (x≈-118), thác (x≈114). */
export const WORLD_BOX = { x0: -125, x1: 122, z0: -70, z1: 216 };
/** Khuôn viên chùa (chỉ để tô nền). */
export const COMPOUND = { x0: -78, x1: 78, z0: -70, z1: 62 };

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fin = (n) => typeof n === 'number' && Number.isFinite(n);

/** Thế giới → điểm trên khung w×h (px). Ngoài khung thì kẹp vào mép. */
export function worldToMap(p, w, h, box = WORLD_BOX) {
  const u = ((p.x - box.x0) / (box.x1 - box.x0)) * w, v = ((p.z - box.z0) / (box.z1 - box.z0)) * h;
  return { u: clamp(fin(u) ? u : 0, 0, w), v: clamp(fin(v) ? v : 0, 0, h) };
}
/** Điểm trên khung → thế giới. */
export function mapToWorld(u, v, w, h, box = WORLD_BOX) {
  return { x: box.x0 + (clamp(u, 0, w) / w) * (box.x1 - box.x0), z: box.z0 + (clamp(v, 0, h) / h) * (box.z1 - box.z0) };
}
/** Chiều cao khung để giữ đúng tỉ lệ khi biết chiều rộng. */
export const mapHeight = (w, box = WORLD_BOX) => Math.round((w * (box.z1 - box.z0)) / (box.x1 - box.x0));

/** Điểm quan trọng không nằm trong PLACES (cửa hàng cạnh đường làng, khu nhà ở). stand = chỗ đứng đi tới được (đã kiểm bằng test). */
const storeMid = (s) => ({ x: (s.than.x0 + s.than.x1) / 2, z: (s.than.z0 + s.than.z1) / 2 });
export const EXTRA_POIS = [
  { id: 'cuahang9sach', ten: STORE_9SACH.ten, ...storeMid(STORE_9SACH), stand: { x: 15.5, z: STORE_9SACH.z }, kind: 'store' },
  { id: 'tachhoa', ten: STORE_TACHHOA.ten, ...storeMid(STORE_TACHHOA), stand: { x: 15.5, z: STORE_TACHHOA.z }, kind: 'store' },
  { id: 'xom', ten: 'Khu nhà ở (xóm)', x: 0, z: 185, stand: { x: 0, z: 184 }, kind: 'place' },
];
/** Nhãn ngắn cho bản đồ nhỏ (chỗ hẹp). */
const SHORT = { sanchua: 'Sân chùa', chanhdien: 'Chánh điện', nhato: 'Nhà Tổ', gacchuong: 'Gác chuông', trathat: 'Trà thất', vuonthien: 'Vườn thiền', hoca: 'Hồ cá', quanam: 'Quan Âm', lang: 'Đường làng', cho: 'Chợ', rung: 'Rừng thông', thacnuoc: 'Thác', daiphat: 'Đại Phật', thuyta: 'Thủy tạ', baothap: 'Bảo tháp', suoitrong: 'Suối Trong', dienmaylamsen: 'Điện máy', kimhoanngoclan: 'Kim hoàn', didongsenvang: 'Di động', cuahang9sach: '9 Sạch', tachhoa: 'Tách Hoa', xom: 'Xóm' };
const NPC_SHORT = { nvdidong: 'NV Di Động', nvdienmay: 'NV Điện máy', nvkimhoan: 'NV Kim hoàn' };
export const shortName = (m) => { const t = SHORT[m.id] || NPC_SHORT[m.id] || m.ten; return t.length > 16 ? t.slice(0, 15) + '…' : t; };

/** NPC có chỗ đứng ngoài chùa/ trong chùa; dùng chung dữ liệu với js/world/npc.js. Loại NPC không có tọa độ hợp lệ. */
const npcMarkers = () => NPCS.filter((n) => fin(n.x) && fin(n.z)).map((n) => ({ id: n.id, kind: 'npc', ten: n.ten, x: n.x, z: n.z, stand: n.stand, goto: 'npc-' + n.id }));
const placeMarkers = () => PLACES.map((p) => ({ id: p.id, kind: /^(dienmay|kimhoan|didong)/.test(p.id) ? 'store' : 'place', ten: p.ten, x: p.x, z: p.z, stand: PLACE_STAND[p.id] || { x: p.x, z: p.z } }));
/** Hộp tên của lô nhà của người chơi: `own` = { xom, plot, lv } từ LGT.land.state. Chỉ vẽ khi đang xem đúng xóm của mình (xóm khác không có trên bản đồ). */
export function houseMarker(land) {
  if (!land || !land.own) return null;
  const pl = plotById(land.own.plot); if (!pl) return null;
  if (land.view && land.view !== land.own.xom) return null;
  return { id: 'nhacuaban', kind: 'house', ten: `Nhà của bạn (${houseLevel(land.own.lv).ten})`, x: pl.x, z: pl.z, stand: pl.front };
}

/**
 * Người chơi đang online (Phiên 95): `players` = LGT.room.players() = [{ id, n, x, z }] (người KHÁC, vị trí thế giới hiện tại).
 * Bỏ điểm hỏng, người ở ngoài khung bản đồ (đang trong nhà: tọa độ phòng nằm xa), trùng id; tối đa MAX_PLAYER_MARKERS. Tên cắt 20 ký tự, rỗng → "Khách".
 */
export const MAX_PLAYER_MARKERS = 60;
export function playerMarkers(players, box = WORLD_BOX) {
  const out = [], seen = new Set();
  if (!Array.isArray(players)) return out;
  for (const p of players) {
    if (out.length >= MAX_PLAYER_MARKERS) break;
    if (!p || typeof p !== 'object' || !fin(p.x) || !fin(p.z) || p.id == null) continue;
    const id = 'pl-' + String(p.id).slice(0, 40); if (seen.has(id)) continue;
    if (p.x < box.x0 || p.x > box.x1 || p.z < box.z0 || p.z > box.z1) continue;
    seen.add(id);
    const ten = (typeof p.n === 'string' ? p.n.trim() : '').slice(0, 20) || 'Khách';
    out.push({ id, kind: 'player', ten, x: p.x, z: p.z, stand: { x: p.x, z: p.z } });
  }
  return out;
}

/**
 * Tất cả điểm cần vẽ. ctx: { land (LGT.land.state), loc ({active,spot}) , target ({x,z,label}), players (LGT.room.players()) }.
 * Mỗi điểm: { id, kind: 'place'|'store'|'npc'|'player'|'house'|'loc'|'target', ten, x, z, stand }.
 */
export function buildMarkers(ctx = {}) {
  const out = [...placeMarkers(), ...EXTRA_POIS.map((p) => ({ ...p })), ...npcMarkers(), ...playerMarkers(ctx.players)];
  const h = houseMarker(ctx.land); if (h) out.push(h);
  const lc = ctx.loc;
  if (lc && fin(lc.spot && lc.spot.x) && fin(lc.spot && lc.spot.z) && (typeof lc.active !== 'function' || lc.active())) out.push({ id: 'hoasenvang', kind: 'loc', ten: 'Hoa sen vàng (nhận lộc)', x: lc.spot.x, z: lc.spot.z, stand: { x: lc.spot.x, z: lc.spot.z } });
  const t = ctx.target; if (t && fin(t.x) && fin(t.z)) out.push({ id: 'dich', kind: 'target', ten: t.label || 'Điểm đang dẫn tới', x: t.x, z: t.z, stand: { x: t.x, z: t.z } });
  return out;
}

/** Hình nền cần vẽ: đường đi (OUT_WALKS gồm cả đường xuống xóm), khuôn viên, nước. */
export function terrain() {
  return {
    compound: { ...COMPOUND },
    walks: OUT_WALKS.map((r) => ({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 })),
    waters: [{ x: POND.x, z: POND.z, r: POND.r }, { x: 60, z: 10, r: 8 }, { x: THAC.pool.x, z: THAC.pool.z, r: THAC.pool.r }, { x: LAKE.x, z: LAKE.z, r: LAKE.r }, ...riverCircles()],   // Phiên 74: sông + Hồ Rừng
  };
}

/** Điểm gần nhất với chạm tại (u, v) trong bán kính rpx; điểm nhiều tầng thì ưu tiên mục tiêu > nhà > hoa sen > NPC > nơi. */
const RANK = { target: 0, house: 1, loc: 2, player: 2.5, npc: 3, store: 4, place: 5 };
export function hitTest(markers, u, v, w, h, rpx = 16, box = WORLD_BOX) {
  let best = null;
  for (const m of markers) {
    const q = worldToMap(m, w, h, box), d = Math.hypot(q.u - u, q.v - v); if (d > rpx) continue;
    if (!best || d < best.d - 4 || (Math.abs(d - best.d) <= 4 && RANK[m.kind] < RANK[best.m.kind])) best = { m, d };
  }
  return best ? best.m : null;
}

/** Hướng + khoảng cách từ người chơi tới điểm: "42 m · về phía chánh điện" (phía dựa theo trục chính). */
export function describeFrom(pos, m) {
  const dx = m.x - pos.x, dz = m.z - pos.z, d = Math.round(Math.hypot(dx, dz));
  const dir = Math.abs(dz) >= Math.abs(dx) ? (dz < 0 ? 'phía chánh điện (lên)' : 'phía làng (xuống)') : (dx < 0 ? 'bên trái' : 'bên phải');
  return d < 3 ? 'ngay tại đây' : `${d} m · ${dir}`;
}

/** Chú giải: nhãn + loại. */
export const LEGEND = [
  { kind: 'me', text: 'Bạn' }, { kind: 'place', text: 'Địa điểm' }, { kind: 'store', text: 'Cửa hàng' }, { kind: 'npc', text: 'Người (bấm để dẫn tới)' }, { kind: 'player', text: 'Người chơi đang online' },
  { kind: 'house', text: 'Nhà của bạn' }, { kind: 'loc', text: 'Hoa sen vàng' }, { kind: 'target', text: 'Đang dẫn tới' },
];
