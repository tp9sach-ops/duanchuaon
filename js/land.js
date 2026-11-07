// Khu dân cư "xóm" và đất ở (Phiên 36, bước 2 hệ thống xây nhà; Phiên 37 thêm 4 cấp nhà + nâng cấp). DỮ LIỆU + LOGIC THUẦN (không DOM/three.js), có test: tests/land.test.mjs.
// Luật ptg chốt 07/11: 100 lá bồ đề mua một lô đất, mua xong được TẶNG nhà trống thô sơ; mỗi xóm tối đa 10 nhà, nhà thứ 11 sang xóm mới;
// muốn XEM xóm khác phải gặp bác khu phố để đổi xóm xem (không đổi xóm của mình).
// Chưa có máy chủ: "sổ xóm" (registry) hiện chỉ có nhà của chính người chơi (lưu cục bộ). Cùng hàm này nhận sổ do máy chủ gửi về ở bước 6, nên
// logic gán xóm/lô đã đúng cho nhiều người. Mọi con số là QUY ƯỚC TẠM chờ ptg duyệt.
import { LAND_LA } from './merit.js';

export const XOM_SIZE = 10;
export const LOT_W = 12, LOT_D = 12;
/** Vùng đi bộ của khu dân cư: đường từ chợ làng xuống phía Nam + khu 2 hàng × 5 lô, đường giữa z 178–190. */
export const LAND_WALKS = [
  { id: 'duong-xom', x0: -6, x1: 6, z0: 144, z1: 162 },
  { id: 'khu-dan-cu', x0: -44, x1: 44, z0: 160, z1: 210 },
];
export const LANE_Z = { z0: 178, z1: 190 };
/** 10 lô đất: hàng 1 (z=170, mặt hướng +z ra đường giữa) và hàng 2 (z=198, mặt hướng −z). id 1..10. */
export const PLOTS = [1, 2].flatMap((row) => [-32, -16, 0, 16, 32].map((x, i) => {
  const z = row === 1 ? 170 : 198, id = (row - 1) * 5 + i + 1;
  return { id, row, x, z, x0: x - LOT_W / 2, x1: x + LOT_W / 2, z0: z - LOT_D / 2, z1: z + LOT_D / 2, front: { x, z: row === 1 ? z + LOT_D / 2 + 1.2 : z - LOT_D / 2 - 1.2 }, face: row === 1 ? 1 : -1 };
}));
export const plotById = (id) => PLOTS.find((p) => p.id === (id | 0)) || null;
/** Bác khu phố đứng ở đầu đường xuống xóm. */
export const KHUPHO = { id: 'bacphuong', x: 3.6, z: 153, stand: { x: 0.8, z: 153 } };

/**
 * 4 cấp nhà (Phiên 37, bước 3). hw/hd = nửa rộng/nửa sâu thân nhà (chữ nhật chặn); gia = GIÁ NIÊM YẾT (lá bồ đề) tính từ nhà trống.
 * Cấp 0 được tặng khi mua đất. Nâng cấp trả CHÊNH LỆCH giá niêm yết (lên 1 từ 0 = 150; 1→2 = 250; 0→3 = 900), được nhảy cấp.
 * Giá theo bảng đề xuất TẠM trong docs/PHIEN34.md (người chăm chỉ ≈ 5 lá/ngày), chờ ptg duyệt.
 */
export const HOUSE_LEVELS = [
  { lv: 0, ten: 'Nhà trống thô sơ', hw: 3, hd: 2.6, gia: 0 },
  { lv: 1, ten: 'Nhà lầu', hw: 3.6, hd: 3, gia: 150 },
  { lv: 2, ten: 'Nhà hoa viên', hw: 3.6, hd: 3, gia: 400 },
  { lv: 3, ten: 'Villa hồ bơi', hw: 4.4, hd: 3.2, gia: 900 },
];
export const MAX_LV = HOUSE_LEVELS.length - 1;
/** Thông tin cấp nhà; cấp sai (NaN, âm, quá lớn) được kẹp vào 0..MAX_LV. */
export const houseLevel = (lv) => HOUSE_LEVELS[Math.max(0, Math.min(MAX_LV, Math.floor(+lv) || 0))];
/** Lá bồ đề phải trả để nâng từ cấp `from` lên cấp `to` (chênh lệch giá niêm yết, không âm). */
export const upgradeCost = (from, to) => Math.max(0, houseLevel(to).gia - houseLevel(from).gia);
export const houseRect = (plot, lv = 0) => { const h = houseLevel(lv), back = plot.z - plot.face * (LOT_D / 2 - h.hd - 0.8); return { x0: plot.x - h.hw, x1: plot.x + h.hw, z0: back - h.hd, z1: back + h.hd }; };

// ---------- sổ xóm: { [xom]: { [plotId]: { owner, name?, lv } } } ----------
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
export const emptyRegistry = () => ({});
/** Số nhà hiện có ở xóm. */
export const countXom = (reg, xom) => (isObj(reg && reg[xom]) ? Object.keys(reg[xom]).length : 0);
/** Xóm lớn nhất đã có người ở (0 nếu chưa có). */
export const maxXom = (reg) => Object.keys(reg || {}).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && countXom(reg, n) > 0).reduce((a, b) => Math.max(a, b), 0);
/** Xóm đầu tiên còn chỗ (nhà thứ 11 → xóm 2…). */
export function firstOpenXom(reg) { let x = 1; while (countXom(reg, x) >= XOM_SIZE) x++; return x; }
/** Các lô còn trống của xóm (id). */
export const freePlots = (reg, xom) => PLOTS.filter((p) => !(reg && reg[xom] && reg[xom][p.id])).map((p) => p.id);

/** Trạng thái người chơi: own = { xom, plot, lv } | null (đã mua đất chưa); view = xóm đang xem. */
export const emptyLand = () => ({ v: 1, own: null, view: 0 });
export function loadLand(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyLand(); if (!isObj(o)) return s;
  const ow = o.own;
  if (isObj(ow) && Number.isInteger(ow.xom) && ow.xom >= 1 && ow.xom <= 1e4 && plotById(ow.plot)) s.own = { xom: ow.xom, plot: ow.plot | 0, lv: houseLevel(ow.lv).lv };
  s.view = Number.isInteger(o.view) && o.view >= 1 && o.view <= 1e4 ? o.view : 0;
  if (s.own && !s.view) s.view = s.own.xom;
  return s;
}
/** Sổ xóm chỉ có nhà của người chơi (chế độ chưa có máy chủ). */
export function localRegistry(land, owner = 'ban') { const r = {}; if (land && land.own) r[land.own.xom] = { [land.own.plot]: { owner, lv: land.own.lv } }; return r; }

/**
 * Mua đất: cần ≥ LAND_LA lá, chưa có đất, lô còn trống. xom = xóm còn chỗ đầu tiên (người chơi chọn LÔ, hệ thống gán XÓM).
 * Trả { ok, reason: ''|'owned'|'poor'|'invalid'|'taken', cost, xom, land (mới), reg (mới) }. Không sửa đầu vào. Trừ lá do nơi gọi làm khi ok.
 */
export function buyLand(land, la, reg, plotId, owner = 'ban') {
  const fail = (reason) => ({ ok: false, reason, cost: LAND_LA, xom: 0, land, reg });
  if (!plotById(plotId)) return fail('invalid');
  if (land.own) return fail('owned');
  if (!(Number.isFinite(+la) && +la >= LAND_LA)) return fail('poor');
  const xom = firstOpenXom(reg), pid = plotId | 0;
  if (reg && reg[xom] && reg[xom][pid]) return fail('taken');
  const nreg = { ...(reg || {}), [xom]: { ...((reg && reg[xom]) || {}), [pid]: { owner, lv: 0 } } };
  return { ok: true, reason: '', cost: LAND_LA, xom, land: { ...land, own: { xom, plot: pid, lv: 0 }, view: xom }, reg: nreg };
}

/**
 * Nâng cấp nhà của mình (Phiên 37). `to` bỏ trống = cấp kế tiếp; có thể nhảy cấp. Trả chênh lệch giá niêm yết.
 * Trả { ok, reason: ''|'noland'|'maxed'|'invalid'|'poor', cost, land (mới), reg (mới) }. Không sửa đầu vào. Trừ lá do nơi gọi làm khi ok.
 * `cost` luôn là số lá cần cho lượt nâng đó (kể cả khi thiếu lá) để giao diện hiện giá; 0 nếu không có đất / đã tối đa / cấp không hợp lệ.
 */
export function upgradeHouse(land, la, reg, to) {
  const fail = (reason, cost = 0) => ({ ok: false, reason, cost, land, reg });
  const own = land && land.own;
  if (!own) return fail('noland');
  const cur = houseLevel(own.lv).lv;
  if (cur >= MAX_LV) return fail('maxed');
  const target = to === undefined ? cur + 1 : Number(to);
  if (!Number.isInteger(target) || target <= cur || target > MAX_LV) return fail('invalid');
  const cost = upgradeCost(cur, target);
  if (!(Number.isFinite(+la) && +la >= cost)) return fail('poor', cost);
  const rec = reg && reg[own.xom] && reg[own.xom][own.plot];
  const nreg = { ...(reg || {}), [own.xom]: { ...((reg && reg[own.xom]) || {}), [own.plot]: { ...(rec || { owner: 'ban' }), lv: target } } };
  return { ok: true, reason: '', cost, land: { ...land, own: { ...own, lv: target } }, reg: nreg };
}

/** Các xóm được phép xem: từ 1 tới xóm lớn nhất có người (ít nhất xóm của mình, hoặc xóm 1). */
export function viewableXoms(land, reg) {
  const top = Math.max(maxXom(reg), land && land.own ? land.own.xom : 0, 1); return Array.from({ length: top }, (_, i) => i + 1);
}
/** Đổi xóm xem (chỉ do bác khu phố). Trả { ok, land }. */
export function setView(land, xom, reg) {
  if (!viewableXoms(land, reg).includes(xom | 0)) return { ok: false, land };
  return { ok: true, land: { ...land, view: xom | 0 } };
}
