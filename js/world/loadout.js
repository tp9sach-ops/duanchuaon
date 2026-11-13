// Đồ đang cầm / cưỡi (Phiên 144, mục 1): Thương (mặc định) · Gậy như ý (đã mua) · Ván trượt (đã mua). LOGIC THUẦN (không DOM/three.js), có test: tests/loadout.test.mjs.
// - Thương và Gậy như ý là VŨ KHÍ (đánh quái) và cũng là thứ để CƯỠI bay. Ván trượt KHÔNG phải vũ khí: chỉ để lướt; vào trận thì người chơi đánh bằng vũ khí cầm gần nhất (weaponFor).
// - Tốc độ cưỡi: ván ×1,5 (hơn bình thường 0,5 lần, theo yêu cầu). Thương/Gậy ×1,25 — số TẠM tôi đặt, chờ ptg chốt (đổi ở MOUNT_MUL).
export const HOLDS = [
  { id: 'thuong', ten: 'Thương', weapon: true, mo: 'Vũ khí mặc định, ai cũng có. Cầm để đánh quái, hoặc cưỡi thương bay đi.' },
  { id: 'nhuy', ten: 'Gậy như ý', weapon: true, mo: 'Gậy đỏ hai đầu đồng phát sáng chớp chớp; đánh có sóng sáng lan ra, +1% sát thương. Cầm để đánh, hoặc cưỡi gậy bay.' },
  { id: 'van', ten: 'Ván trượt', weapon: false, mo: 'Không phải vũ khí, không đánh được; chỉ để lướt đi nhanh gấp 1,5 lần. Vào trận thì bạn đánh bằng vũ khí đã cầm trước đó.' },
];
export const DEFAULT_HOLD = 'thuong';
export const MOUNT_MUL = { thuong: 1.25, nhuy: 1.25, van: 1.5 };
export const holdById = (id) => HOLDS.find((h) => h.id === id) || null;
export const isWeapon = (id) => { const h = holdById(id); return !!h && h.weapon; };

const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
/** Đồ đã có. Thương luôn có. owned = { staff: bool, board: bool }. */
export const ownedMap = (o = {}) => ({ thuong: true, nhuy: !!(isObj(o) && (o.nhuy ?? o.staff)), van: !!(isObj(o) && (o.van ?? o.board)) });   // nhận cả { staff, board } lẫn bản đã chuyển { nhuy, van } (gọi lại không đổi nghĩa)

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng). Đồ chưa có / lạ → về Thương. Trả { hold, last } (last = vũ khí cầm gần nhất, luôn là vũ khí). */
export function loadLoadout(raw, owned = ownedMap()) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const own = ownedMap(owned);
  const last = isObj(o) && isWeapon(o.last) && own[o.last] ? o.last : DEFAULT_HOLD;
  const hold = isObj(o) && holdById(o.hold) && own[o.hold] ? o.hold : last;
  return { hold, last };
}

/** Chọn đồ cầm. Trả { ok, reason: ''|'unknown'|'notowned', state }. Chọn vũ khí thì nhớ làm "vũ khí gần nhất". */
export function chooseHold(state, id, owned = ownedMap()) {
  const st = loadLoadout(state, owned), own = ownedMap(owned);
  if (!holdById(id)) return { ok: false, reason: 'unknown', state: st };
  if (!own[id]) return { ok: false, reason: 'notowned', state: st };
  return { ok: true, reason: '', state: { hold: id, last: isWeapon(id) ? id : st.last } };
}

/** Vũ khí thật sự dùng khi đánh: đang cầm vũ khí → chính nó; đang cầm ván → vũ khí cầm gần nhất. */
export const weaponFor = (state, owned = ownedMap()) => { const st = loadLoadout(state, owned); return isWeapon(st.hold) ? st.hold : st.last; };
/** Thứ đang cưỡi khi bấm nút cưỡi = đồ đang cầm. */
export const mountOf = (state, owned = ownedMap()) => loadLoadout(state, owned).hold;
/** Hệ số tốc độ khi đang cưỡi. */
export const mountMul = (id) => MOUNT_MUL[id] || 1;
/** Nhãn nút cưỡi ở dock. */
export const rideLabel = (id, on) => (on ? (id === 'van' ? 'Xuống ván' : 'Xuống') : id === 'van' ? 'Lướt ván' : id === 'nhuy' ? 'Cưỡi gậy' : 'Cưỡi thương');
