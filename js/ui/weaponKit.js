// Bảng ĐỒ NGHỀ vũ khí phát sáng (Phiên 224, mục 1): gom hàm dựng / nạp GLB / chớp sáng / cỡ / màu của từng cây gậy để mã dùng chung (js/ui/items.js, js/ui/remoteGear.js, js/ui/bag.js...) khỏi if-else rải rác.
// id nội bộ: 'nhuy' = Gậy như ý (js/ui/staffMesh.js, ánh hồng, hai đầu chớp LỆCH pha); 'tre' = Gậy dạy chó (js/ui/bambooMesh.js, ánh vàng, hai đầu chớp ĐỀU cùng nhịp).
// Món khác (Thương mặc định, Ván) không có trong bảng → kitOf() trả null.
import { buildStaff, loadStaffGlb, pulseGlows, STAFF_SCALE, STAFF_PINK } from './staffMesh.js';
import { buildBamboo, loadBambooGlb, pulseBamboo, BAMBOO_SCALE, BAMBOO_GOLD } from './bambooMesh.js';

export const KIT = Object.freeze({
  nhuy: Object.freeze({ id: 'nhuy', build: buildStaff, load: loadStaffGlb, pulse: pulseGlows, scale: STAFF_SCALE, color: STAFF_PINK, trailKey: 'nhuy' }),
  tre: Object.freeze({ id: 'tre', build: buildBamboo, load: loadBambooGlb, pulse: pulseBamboo, scale: BAMBOO_SCALE, color: BAMBOO_GOLD, trailKey: 'tre' }),
});

/** Bộ đồ nghề của vũ khí `id`; không phải gậy phát sáng → null. */
export const kitOf = (id) => (typeof id === 'string' && Object.prototype.hasOwnProperty.call(KIT, id) ? KIT[id] : null);
