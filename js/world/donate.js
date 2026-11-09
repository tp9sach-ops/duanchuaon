// Thùng công đức (Phiên 80): vị trí trong chánh điện + điểm bấm. THUẦN (không three.js), có test (tests/donate.test.mjs, tests/spots.test.mjs).
// Đặt bên trái lối giữa, ngay sau hàng cột mặt tiền (vào điện là thấy), ngoài tấm thảm bồ đoàn. Mặt có chữ quay +z (hướng người vào).
import { HALL, addRect } from './layout.js';

export const DONATE_BOX = Object.freeze({ x: -9.8, z: -23.3, w: 1.0, d: 0.8, h: 1.25 });   // h = cao từ mặt sàn gỗ
/** Điểm bấm kiểu NPC: bấm vào thùng → đi tới điểm đứng (hiên chánh điện, trước thùng) → mở bảng công đức. */
export const DONATE_SPOT = Object.freeze({
  id: 'congduc', num: '', label: 'Thùng công đức', donate: true,
  look: [DONATE_BOX.x, HALL.h + DONATE_BOX.h + 0.5, DONATE_BOX.z],
  stand: Object.freeze({ x: DONATE_BOX.x, z: -20.2 }), r: 2.2,
  face: [DONATE_BOX.x, HALL.h + 0.7, DONATE_BOX.z],
  pick: Object.freeze({ c: [DONATE_BOX.x, HALL.h + DONATE_BOX.h / 2, DONATE_BOX.z], r: 1.15 }),
});
export const isDonateSpot = (id) => id === DONATE_SPOT.id;

let done = false;
/** Đăng ký vật cản (chỉ một lần). */
export function registerDonateBox() {
  if (done) return; done = true;
  const b = DONATE_BOX; addRect({ x0: b.x - b.w / 2 - 0.1, x1: b.x + b.w / 2 + 0.1, z0: b.z - b.d / 2 - 0.1, z1: b.z + b.d / 2 + 0.1 });
}
registerDonateBox();
