// 5 bồ đoàn Ngũ Hành trong chánh điện (G2.4b, GDD v2 mục 5.2). LOGIC THUẦN, có test: tests/hesseats.test.mjs.
// Dùng LẠI 5 bồ đoàn có sẵn ở hàng gần bàn thờ nhất (hàng 0), không thêm bồ đoàn mới nên không đổi lưới, đường đi, va chạm.
// Cột 1–3 bên trái lối giữa (Kim, Mộc, Thủy), bên phải là Thổ (cột 5) và Hỏa ở GÓC PHẢI (cột 7, x = 12,6).
// Phiên 153: Hỏa dời từ bd04 (x = 3,6) sang bd07 vì bd04 nằm sát thầy Trụ trì (2,6; −40,6): tìm đường (path.js) coi chỗ đó là bị chặn nên nhân vật không ngồi vào được. Màu chỉ để nhận biết, TẠM.
import { HE_LIST, HE_NAME } from '../data/elements.js';
import { normHe } from './elements.js';
import { SEATS, seatById } from './seats.js';

export const HE_SEAT_ID = Object.freeze({ kim: 'bd01', moc: 'bd02', thuy: 'bd03', hoa: 'bd07', tho: 'bd05' });
export const HE_COLOR = Object.freeze({ kim: 0xdfe3e8, moc: 0x3f9b4a, thuy: 0x2f6fd0, hoa: 0xd9432b, tho: 0xc9a227 });
/** Đứng cách tâm bồ đoàn không quá khoảng này (mét) thì coi là đang ngồi ở đó. */
export const HE_SEAT_NEAR = 0.9;

/** Bồ đoàn của một Hệ (đối tượng trong SEATS) hoặc null. */
export const seatOfHe = (he) => { const h = normHe(he); return h ? seatById(HE_SEAT_ID[h]) : null; };
/** Bồ đoàn `id` thuộc Hệ nào? Không thuộc Hệ nào → null. */
export const heOfSeat = (id) => HE_LIST.find((h) => HE_SEAT_ID[h] === id) || null;
/** Vị trí p {x,z} đang ở bồ đoàn Hệ nào (gần nhất, trong HE_SEAT_NEAR)? Không có → null. */
export function heAt(p) {
  if (!p || !Number.isFinite(+p.x) || !Number.isFinite(+p.z)) return null;
  let best = null, bd = HE_SEAT_NEAR;
  for (const h of HE_LIST) { const s = seatOfHe(h); if (!s) continue; const d = Math.hypot(s.x - p.x, s.z - p.z); if (d <= bd) { bd = d; best = h; } }
  return best;
}
/** Tên hiển thị, ví dụ "Hệ Kim". */
export const heLabel = (he) => { const h = normHe(he); return h ? `Hệ ${HE_NAME[h]}` : ''; };
/** Kiểm dữ liệu: đủ 5 Hệ, mỗi Hệ một bồ đoàn có thật, không trùng. Trả mảng lỗi (rỗng = tốt). */
export function checkHeSeats() {
  const errs = [], ids = new Set();
  for (const h of HE_LIST) {
    const id = HE_SEAT_ID[h];
    if (!id || !SEATS.some((s) => s.id === id)) errs.push(h + ': bồ đoàn không có thật');
    if (ids.has(id)) errs.push(h + ': trùng bồ đoàn'); ids.add(id);
    if (!Number.isFinite(HE_COLOR[h])) errs.push(h + ': thiếu màu');
  }
  return errs;
}
