// Khu NGOÀI CHÙA (Phiên 17): đường phố làng, chợ làng, đường mòn rừng thông (Tây), đường mòn thác nước (Đông), dân làng đi lại.
// DỮ LIỆU THUẦN (không three.js, có test); cảnh 3D ở js/scene/outside.js dựng từ đây. Import là tự đăng ký vùng đi bộ và vật cản (một lần).
// Tọa độ: +z là hướng xa chùa (ra làng). Cổng Tam quan z=34, đường trước cổng tới z=62 (layout.js) — các vùng dưới đây nối tiếp từ đó.
import { addWalk, addCircle, addRect, addWater } from './layout.js';

/** Các vùng đi bộ (chữ nhật, nối liền nhau). Ngoài các vùng này (và khuôn viên chùa) là chặn: cây rừng, nhà dân, sườn núi chỉ để nhìn. */
export const OUT_WALKS = [
  { id: 'duong-lang', x0: -14, x1: 14, z0: 60, z1: 150 },       // đường phố làng, hai vỉa hè
  { id: 'cho', x0: -34, x1: 34, z0: 116, z1: 146 },             // chợ làng
  { id: 'duong-thac', x0: 12, x1: 96, z0: 99, z1: 109 },        // đường mòn tới thác (rẽ phải)
  { id: 'bai-thac', x0: 84, x1: 112, z0: 86, z1: 122 },         // bãi dưới thác
  { id: 'duong-rung', x0: -100, x1: -12, z0: 84, z1: 94 },      // đường mòn vào rừng thông (rẽ trái)
  { id: 'bai-rung', x0: -118, x1: -90, z0: 72, z1: 108 },       // bãi trong rừng thông
];

/** Hồ dưới chân thác (vật cản, không có cầu). */
export const THAC = { pool: { x: 106, z: 104, r: 7.5 }, cliffX: 114.5, h: 22, fallZ: 104 };
/** Gốc đa làng ở giữa chợ, giếng làng, đình nghỉ chân ở bãi thác, miếu nhỏ và gốc cổ thụ ở bãi rừng. */
export const DA_LANG = { x: 0, z: 131, r: 2.2 };
export const GIENG = { x: 10, z: 127, r: 1.2 };
export const DINH_NGHI = { x0: 90, x1: 94, z0: 88, z1: 92 };
export const MIEU = { x0: -102, x1: -99, z0: 74, z1: 77 };
export const CO_THU = { x: -106, z: 90, r: 2.2 };
/** Quầy chợ (rect vật cản): hai hàng trước/sau gốc đa. */
export const STALLS = [-27, -19, 19, 27].flatMap((x) => [121, 141].map((z) => ({ x0: x - 2.5, x1: x + 2.5, z0: z - 1.3, z1: z + 1.3, x, z })));
/** Cổng làng: hai trụ ở hai bên đường (vật cản tròn), xà ngang ở trên cao. */
export const VILLAGE_GATE = { z: 66, posts: [-8.5, 8.5], r: 0.6 };
/** Cột đèn đường (vật cản mảnh) dọc hai vỉa hè. */
export const STREET_LAMPS = [70, 86, 102, 118, 134, 148].flatMap((z) => [-12, 12].map((x) => ({ x, z, r: 0.25 })));
/** Đá lớn quanh hồ thác. */
export const OUT_ROCKS = [{ x: 100, z: 92, r: 1.2 }, { x: 101, z: 117, r: 1.5 }, { x: 109, z: 90, r: 1.3 }, { x: 108, z: 118, r: 1.4 }];

/** Cửa hàng 9 Sạch (nhà phố mặt tiền bên phải đường làng, quay mặt về phía -x ra đường). Dữ liệu thuần; cảnh 3D ở js/scene/store9sach.js.
 *  Mặt tiền tại x = front; thân nhà kéo dài về +x (sâu `sau` m); `z` là tâm bề ngang `rong`. Sân trước (lát gạch) nối liền vỉa hè để đi tới tận cửa.
 *  Đồ trước cửa đặt theo tọa độ THẾ GIỚI {x,z,r} (r = bán kính vật cản): phông Grand Opening, giỏ hoa hồng đỏ, giỏ hoa hồng phấn, standee "MUA 1 ĐƯỢC 3". */
export const STORE_9SACH = {
  id: 'cuahang9sach', ten: 'Cửa hàng 9 Sạch', diaChi: '124 Mậu Thân', dienThoai: '0939 999 132',
  front: 19, z: 80.5, rong: 10, sau: 9,
  san: { x0: 13, x1: 19, z0: 75.5, z1: 85.5 },                 // sân trước đi được (chồng 1 m lên vỉa hè x ≤ 14 cho liền)
  than: { x0: 18.4, x1: 28, z0: 75.5, z1: 85.5 },              // thân nhà + biển (chặn)
  props: { phong: { x: 16.2, z: 76.7, r: 1.3 }, hoaDo: { x: 15.8, z: 78.7, r: 0.7 }, hoaHong: { x: 15.0, z: 76.3, r: 0.8 }, standee: { x: 17.4, z: 84.4, r: 0.6 } },
};

/** Cửa hàng trà Tách Hoa (nhà phố cạnh Cửa hàng 9 Sạch, cùng phía đường; dựng theo ảnh khai trương). Cùng cấu trúc STORE_9SACH; chưa có địa chỉ (ptg chưa cung cấp, KHÔNG tự bịa).
 *  props (tọa độ thế giới {x,z,r}): xe = chiếc xe tay ga màu hồng đỗ trước cửa. */
export const STORE_TACHHOA = {
  id: 'tachhoa', ten: 'Tách Hoa',
  front: 19, z: 91, rong: 8, sau: 9,
  san: { x0: 13, x1: 19, z0: 87, z1: 95 },
  than: { x0: 18.4, x1: 28, z0: 87, z1: 95 },
  props: { xe: { x: 15.9, z: 93.7, r: 0.9 } },
};

/** Tiệm điện thoại "Di Động Sen Vàng" (nhà phố mặt tiền bên TRÁI đường làng, quay mặt về phía +x ra đường; cách xa hai cửa hàng bên phải, không đứng cạnh nhau).
 *  Tên và hình hiệu là của riêng dự án (không dùng nhãn hiệu thật). Mặt tiền tại x = front; thân nhà kéo về -x (sâu `sau` m); `z` là tâm bề ngang `rong`. Chưa có địa chỉ (KHÔNG tự bịa).
 *  props (tọa độ thế giới {x,z,r}): du = hai chiếc dù trước cửa, bongbay1/2 = hai cột bóng bay, hoa = giỏ hoa chúc mừng, xe = hai xe máy đỗ. nv = nhân viên NPC đứng trước cửa (xem js/world/npc.js). */
export const STORE_DIDONG = {
  id: 'didongsenvang', ten: 'Di Động Sen Vàng',
  front: -19, z: 112, rong: 10, sau: 7,
  san: { x0: -19, x1: -13, z0: 107, z1: 117 },
  than: { x0: -26, x1: -18.4, z0: 107, z1: 117 },
  props: { du: { x: -16.2, z: 108.4, r: 1.4 }, bongbay1: { x: -17.6, z: 110, r: 0.35 }, bongbay2: { x: -17.6, z: 114, r: 0.35 }, hoa: { x: -17.8, z: 116, r: 0.5 }, xe: { x: -15, z: 115.8, r: 1.0 } },
  nv: { x: -14.6, z: 109.9 },
};

/** Siêu thị điện máy "Điện Máy Lam Sen" (nhà phố lớn BÊN TRÁI đường làng, ngay sau cổng làng z≈70, quay mặt về +x). Dựng theo ảnh siêu thị điện máy mặt tiền xanh-vàng của ptg
 *  nhưng dùng tên/hình hiệu RIÊNG của dự án (không dùng nhãn hiệu thật), không ghi hãng thật, không ghi giá/khuyến mãi thật. Cùng cấu trúc STORE_DIDONG (front/z/rong/sau, san, than, props, nv). Chưa có địa chỉ (KHÔNG bịa).
 *  props: xeA = ba xe máy đỗ, xeB = hai xe máy đỗ, thung = chồng thùng hàng. */
export const STORE_DIENMAY = {
  id: 'dienmaylamsen', ten: 'Điện Máy Lam Sen',
  front: -19, z: 70, rong: 12, sau: 8,
  san: { x0: -19, x1: -13, z0: 64, z1: 76 },
  than: { x0: -27, x1: -18.4, z0: 64, z1: 76 },
  props: { xeA: { x: -15.6, z: 66, r: 1.5 }, xeB: { x: -15.4, z: 74.2, r: 1.1 }, thung: { x: -14.4, z: 75.2, r: 0.8 } },
  nv: { x: -14.6, z: 71.2 },
};

/** Trung tâm kim hoàn "Kim Hoàn Ngọc Lan" (nhà phố BÊN PHẢI đường làng, cạnh chợ, z≈131; xa Cửa hàng 9 Sạch và Tách Hoa). Dựng theo ảnh trung tâm kim hoàn mặt tiền đá xám + biển xanh navy của ptg
 *  nhưng dùng tên/hình hiệu RIÊNG (không dùng nhãn hiệu thật), KHÔNG chép địa chỉ/số điện thoại thật; chưa có địa chỉ (chờ ptg). Cùng cấu trúc STORE_TACHHOA (nhóm quay π).
 *  props: du = dù xanh + bàn bảo vệ, bang = bảng quảng cáo đứng, xe = bốn xe tay ga đỗ, chau = chậu cây. */
export const STORE_KIMHOAN = {
  id: 'kimhoanngoclan', ten: 'Kim Hoàn Ngọc Lan',
  front: 19, z: 131.5, rong: 9, sau: 8,
  san: { x0: 13, x1: 19, z0: 127, z1: 136 },
  than: { x0: 18.4, x1: 27, z0: 127, z1: 136 },
  props: { du: { x: 15.7, z: 128.3, r: 1.2 }, bang: { x: 16.9, z: 129.3, r: 0.45 }, xe: { x: 15.4, z: 134.4, r: 1.1 }, chau: { x: 16.7, z: 135.4, r: 0.5 } },
  nv: { x: 16.4, z: 129.6 },
};

/** Hàng rào phố (Phiên 33): tường đá thấp + song sắt xanh đậm + trụ đá, đứng ở mép ngoài vỉa hè (|x| = FENCE_X), chỉ ở những đoạn trống giữa sân cửa hàng, đường mòn và chợ. */
export const FENCE_X = 13.5;
const SIDE_GAPS = { 1: [[75.5, 85.5], [87, 95], [99, 109], [116, 146]], '-1': [[64, 76], [84, 94], [107, 117], [116, 146]] };   // sân cửa hàng + đường mòn + chợ (z0, z1) mỗi phía
/** Các đoạn z còn trống ở mép đường phía `side` (+1 phải, -1 trái): trừ sân cửa hàng, đường mòn, chợ (chừa 0,6 m), bỏ đoạn ngắn hơn 2,5 m. */
export function streetEdgeFree(side) {
  let segs = [[62, 150]];
  for (const [a, b] of SIDE_GAPS[side]) segs = segs.flatMap(([s0, s1]) => (b + 0.6 <= s0 || a - 0.6 >= s1) ? [[s0, s1]] : [[s0, Math.min(s1, a - 0.6)], [Math.max(s0, b + 0.6), s1]].filter(([p, q]) => q > p));
  return segs.filter(([a, b]) => b - a >= 2.5);
}
export const STREET_FENCES = [-1, 1].flatMap((side) => streetEdgeFree(side).map(([z0, z1]) => ({ x: side * FENCE_X, z0, z1 })));
/** Chậu hoa vàng đặt sát mép vỉa hè, giữa các cột đèn. {x,z,r} */
export const PLANTERS = [[-13, 79], [-13, 81.4], [-13, 98], [-13, 101], [-13, 104.4], [13, 68], [13, 72], [13, 96.4], [13, 111.4], [13, 114]].map(([x, z]) => ({ x, z, r: 0.45 }));
/** Đồ chợ làng: lồng gà tre, ghế gỗ, khối đá ngồi. {x,z,r,ry} (ry = góc xoay) */
export const MARKET_DECOR = {
  cages: [{ x: -25, z: 132, r: 0.65, ry: 0.3 }, { x: -23.2, z: 133.4, r: 0.65, ry: 1.1 }, { x: 30.6, z: 131.5, r: 0.65, ry: 0.7 }],
  chairs: [{ x: -20.5, z: 131, r: 0.35, ry: 2.6 }, { x: 31.5, z: 134.6, r: 0.35, ry: 0.5 }, { x: -17.5, z: 135.5, r: 0.35, ry: -0.8 }, { x: -29, z: 128, r: 0.35, ry: 1.9 }],
  blocks: [{ x: 9.3, z: 135.2, r: 0.5, ry: -0.3 }, { x: -10.5, z: 133.5, r: 0.5, ry: 0.4 }, { x: 29, z: 128.6, r: 0.5, ry: 0.9 }],
};

/** Điểm mà người chơi đặt chân tới thì tính "đã ghé" (nhiệm vụ). {id, ten, x, z, r} — dùng chung cho trong và ngoài chùa. */
export const PLACES = [
  { id: 'sanchua', ten: 'Sân chùa', x: 0, z: 6, r: 14 }, { id: 'chanhdien', ten: 'Chánh điện', x: 0, z: -30, r: 14 },
  { id: 'nhato', ten: 'Nhà Tổ', x: -38, z: -20, r: 8 }, { id: 'gacchuong', ten: 'Gác chuông', x: 28, z: -4, r: 7 },
  { id: 'trathat', ten: 'Trà thất', x: -64, z: 12, r: 7 }, { id: 'vuonthien', ten: 'Vườn thiền', x: -62, z: -20, r: 8 },
  { id: 'hoca', ten: 'Hồ cá', x: 52, z: 10, r: 8 }, { id: 'quanam', ten: 'Quan Âm đài', x: 0, z: -59, r: 7 },
  { id: 'lang', ten: 'Đường làng', x: 0, z: 88, r: 14 }, { id: 'cho', ten: 'Chợ làng', x: 0, z: 128, r: 14 },
  { id: 'rung', ten: 'Rừng thông', x: -98, z: 89, r: 9 }, { id: 'thacnuoc', ten: 'Thác nước', x: 95, z: 104, r: 7 },
  { id: 'dienmaylamsen', ten: 'Điện Máy Lam Sen', x: -15.5, z: 70, r: 7 }, { id: 'kimhoanngoclan', ten: 'Kim Hoàn Ngọc Lan', x: 15.5, z: 131.5, r: 6 },
  { id: 'didongsenvang', ten: 'Di Động Sen Vàng', x: -15.5, z: 112, r: 6 },
];
export const placeById = (id) => PLACES.find((p) => p.id === id) || null;
/** Nơi (id) mà vị trí p = {x,z} đang ở trong; mảng có thể rỗng hoặc nhiều nơi chồng nhau. */
export const placesAt = (p) => PLACES.filter((q) => Math.hypot(p.x - q.x, p.z - q.z) <= q.r).map((q) => q.id);

/** Người dân đi lại (chỉ để cho vui mắt, không trò chuyện): đi tới lui giữa các điểm của `path` với tốc độ `speed` (m/s). `scale` < 1: trẻ em. */
export const WALKERS = [
  { id: 'd1', color: 'nau', hair: 'troc', path: [[-6, 64], [-6, 110]], speed: 0.9 },
  { id: 'd2', color: 'lam', hair: 'bui', path: [[7, 140], [7, 72]], speed: 1.1 },
  { id: 'd3', color: 'do', hair: 'bui', path: [[-30, 124.5], [30, 124.5]], speed: 0.8 },
  { id: 'd4', color: 'xam', hair: 'troc', path: [[30, 138], [-30, 138]], speed: 0.7 },
  { id: 'd5', color: 'trang', hair: 'bui', path: [[16, 104], [90, 104]], speed: 1.0 },
  { id: 'd6', color: 'nau', hair: 'troc', path: [[-16, 89], [-92, 89]], speed: 0.95 },
  { id: 'd7', color: 'vang', hair: 'bui', scale: 0.7, path: [[-4, 90], [-4, 56]], speed: 1.3 },
  { id: 'd8', color: 'do', hair: 'bui', scale: 0.7, path: [[5, 64], [5, 88]], speed: 1.1 },
  { id: 'd9', color: 'lam', hair: 'troc', scale: 0.65, path: [[-8, 100], [-8, 70]], speed: 1.2 },
];

let done = false;
export function registerOutside() {
  if (done) return; done = true;
  OUT_WALKS.forEach(addWalk);
  addWater({ x: THAC.pool.x, z: THAC.pool.z, r: THAC.pool.r, bridges: [] });
  [DA_LANG, GIENG, CO_THU, ...OUT_ROCKS, ...STREET_LAMPS, ...VILLAGE_GATE.posts.map((x) => ({ x, z: VILLAGE_GATE.z, r: VILLAGE_GATE.r }))].forEach((c) => addCircle({ x: c.x, z: c.z, r: c.r }));
  STALLS.forEach((s) => addRect({ x0: s.x0, x1: s.x1, z0: s.z0, z1: s.z1 }));
  addRect(DINH_NGHI); addRect(MIEU);
  // Cửa hàng 9 Sạch: sân trước đi được; thân nhà và đồ trước cửa là vật cản
  addWalk(STORE_9SACH.san); addRect(STORE_9SACH.than); Object.values(STORE_9SACH.props).forEach((c) => addCircle({ x: c.x, z: c.z, r: c.r }));
  addWalk(STORE_DIDONG.san); addRect(STORE_DIDONG.than); Object.values(STORE_DIDONG.props).forEach((c) => addCircle({ x: c.x, z: c.z, r: c.r }));
  for (const st of [STORE_DIENMAY, STORE_KIMHOAN]) { addWalk(st.san); addRect(st.than); Object.values(st.props).forEach((c) => addCircle({ x: c.x, z: c.z, r: c.r })); }
  // Phiên 33: hàng rào phố (rect mảnh), chậu hoa và đồ chợ (vật cản tròn)
  STREET_FENCES.forEach((f) => addRect({ x0: f.x - 0.3, x1: f.x + 0.3, z0: f.z0, z1: f.z1, h: 0.8 }));   // h: chỉ phần tường đá thấp chắn camera
  [[PLANTERS, 0.9], [MARKET_DECOR.cages, 0.9], [MARKET_DECOR.chairs, 1.1], [MARKET_DECOR.blocks, 0.6]].forEach(([list, h]) => list.forEach((c) => addCircle({ x: c.x, z: c.z, r: c.r, h })));
  addWalk(STORE_TACHHOA.san); addRect(STORE_TACHHOA.than); Object.values(STORE_TACHHOA.props).forEach((c) => addCircle({ x: c.x, z: c.z, r: c.r }));
}
registerOutside();
