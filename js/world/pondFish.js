// Cá 3D bơi trong "ao cá riêng" (Phiên 77). Ao riêng = Hồ Rừng (js/world/river.js, LAKE): MỖI NGƯỜI CHƠI tự thấy đàn cá mình đã "Thu cá" bơi ở đó (đọc LGT.fishing.state.pond; không gửi mạng).
// LOGIC THUẦN (không three.js, có test: tests/pondfish.test.mjs): kiểu dáng theo loài + đường bơi theo thời gian. Cảnh vẽ: js/scene/pondFish.js.
import { LAKE } from './river.js';
import { speciesById } from './fishing.js';

export const MAX_SHOWN = 30;
/** Mặt nước Hồ Rừng nằm ở y = 0,14 (js/scene/river.js); cá bơi dưới mặt nước. */
export const WATER_TOP = 0.14;
const COLORS = {
  chep: [0xb5651d, 0xe0c9a0], tre: [0x4a4a46, 0x77746c], loc: [0x3d4a2f, 0x8a8f5a], ro: [0x6d6a3a, 0xc9b25a], koi: [0xf08a24, 0xf4efe4], chepvang: [0xe8b020, 0xf6d56a], taituong: [0x5f6b73, 0xa9b4ba],
  bongsuoi: [0x6b5f48, 0xa89c80], chachsuoi: [0x75684c, 0xb7a77a], caleng: [0x4c5560, 0xc7ccd1],
  ruanuoc: [0x486a3a, 0x9bb06a], ruavang: [0xd9a62a, 0xf5dd8a], baba: [0x5a5a44, 0x9a9a78], babahoa: [0x6e5a3a, 0xc9a96a], mucong: [0xe9c4b8, 0xf4ddd4], mucnang: [0xd9a0b8, 0xf0c8dc],
};
const BY_LOAI = { ca: [0x8a7a5a, 0xcabf9a], rua: [0x486a3a, 0x9bb06a], baba: [0x5a5a44, 0x9a9a78], muc: [0xe9c4b8, 0xf4ddd4] };

/** Kiểu dáng: shape = loai (ca|rua|baba|muc), c1/c2 màu thân/bụng, len = chiều dài thân (m; cỡ lớn dài hơn). */
export function fishLook(sp, lon = false) {
  const s = speciesById(sp), loai = s ? s.loai : 'ca', c = COLORS[sp] || BY_LOAI[loai] || BY_LOAI.ca;
  const base = loai === 'rua' || loai === 'baba' ? 0.5 : loai === 'muc' ? 0.45 : 0.55;
  return { shape: loai, c1: c[0], c2: c[1], len: base * (lon ? 1.5 : 1) * (s && s.hiem ? 1.1 : 1) };
}
const hash = (n) => { let x = (n | 0) * 2654435761 >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967296; };
/** Danh sách cá hiển thị (tối đa MAX_SHOWN, bỏ dữ liệu hỏng). */
export const shownFish = (pond) => (Array.isArray(pond) ? pond.filter((f) => f && Number.isFinite(+f.uid) && speciesById(f.sp)).slice(0, MAX_SHOWN) : []);

/** Vị trí + hướng đầu cá lúc t (giây): bơi vòng elip quanh tâm hồ, mỗi con một bán kính/tốc độ/chiều riêng (suy từ uid → ổn định giữa các lần mở game). Luôn nằm trong hồ, dưới mặt nước. */
export function fishPose(f, t, lake = LAKE) {
  const h1 = hash(f.uid * 3 + 1), h2 = hash(f.uid * 3 + 2), h3 = hash(f.uid * 3 + 3), look = fishLook(f.sp, f.lon);
  const bottom = look.shape === 'rua' || look.shape === 'baba';
  const rMax = Math.max(1.2, lake.r - 0.9 - look.len * 0.4), rA = 1.3 + h1 * Math.max(0, rMax - 1.3), ecc = 0.75 + h2 * 0.25, dir = h3 < 0.5 ? 1 : -1;
  const v = (bottom ? 0.15 : 0.35) + h2 * (bottom ? 0.15 : 0.45), w = (v / rA) * dir, ph = h1 * 6.283 + h3 * 3;
  const at = (tt) => { const a = ph + w * tt; return { x: lake.x + Math.cos(a) * rA, z: lake.z + Math.sin(a) * rA * ecc }; };
  const p = at(t), q = at(t + 0.05);
  const y = bottom ? 0.05 : look.shape === 'muc' ? WATER_TOP - 0.12 - h2 * 0.04 : WATER_TOP - 0.06 - h2 * 0.05 + Math.sin(t * 1.3 + ph) * 0.015;
  return { x: p.x, z: p.z, y, ry: Math.atan2(q.x - p.x, q.z - p.z), tail: Math.sin(t * (bottom ? 2 : 6) + ph) };
}
