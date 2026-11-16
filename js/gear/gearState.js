// Phiên 210 (S2): TRẠNG THÁI trang bị mới — LOGIC THUẦN (không DOM/three.js), có test: tests/gear.test.mjs.
// Lưu ở khóa MỚI lgt.gear.v1 (có trường v). Dữ liệu hỏng / thiếu → trống, KHÔNG ném lỗi. Danh sách món (registry) truyền vào từng hàm; mặc định rỗng
// cho tới khi các phiên sau thêm món. Món lạ, món sai ô, bậc nâng vô lý đều bị làm sạch về giá trị hợp lệ.
import { SLOTS, RARITY, MAX_UPGRADE, UPGRADE_COST, GEAR_VER } from './gearConfig.js';

export const GEAR_ITEMS = [];   // { id, ten, slot, rarity(1..4) } — các phiên sau điền
const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
const int = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, Math.floor(+x))) : lo);
const ID_RE = /^[a-z][a-z0-9_]{0,31}$/;
export const slotIds = () => SLOTS.map((s) => s.id);
export const isSlot = (s) => slotIds().includes(s);
export const itemById = (id, reg = GEAR_ITEMS) => reg.find((m) => m.id === id) || null;
export const rarityOf = (item) => RARITY.find((r) => r.id === (item && item.rarity)) || RARITY[0];

/** Cờ tính năng: chỉ bật khi CONFIG.features.gear === true (thiếu → tắt). */
export const gearEnabled = (cfg) => !!(isObj(cfg) && isObj(cfg.features) && cfg.features.gear === true);

export const emptyGear = () => ({ v: GEAR_VER, owned: {}, worn: {} });

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng). Mỗi món có { lv }. Món mặc phải đang sở hữu và đúng ô. */
export function loadGear(raw, reg = GEAR_ITEMS) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyGear(); if (!isObj(o)) return s;
  if (isObj(o.owned)) for (const id of Object.keys(o.owned)) {
    if (!ID_RE.test(id) || !itemById(id, reg)) continue;
    s.owned[id] = { lv: int(isObj(o.owned[id]) ? o.owned[id].lv : 0, 0, MAX_UPGRADE) };
  }
  if (isObj(o.worn)) for (const sl of slotIds()) {
    const id = o.worn[sl], it = itemById(id, reg);
    if (it && it.slot === sl && s.owned[id]) s.worn[sl] = id;
  }
  return s;
}
export const saveGear = (st, reg = GEAR_ITEMS) => JSON.stringify(loadGear(st, reg));

/** Thêm món vào kho (đã có thì giữ nguyên bậc). Trả { ok, reason: ''|'unknown'|'owned', state }. */
export function addItem(state, id, reg = GEAR_ITEMS) {
  const st = loadGear(state, reg);
  if (!itemById(id, reg)) return { ok: false, reason: 'unknown', state: st };
  if (st.owned[id]) return { ok: false, reason: 'owned', state: st };
  return { ok: true, reason: '', state: { ...st, owned: { ...st.owned, [id]: { lv: 0 } } } };
}
/** Mặc món vào ô của nó (món cũ ở ô đó tự cởi). Trả { ok, reason: ''|'unknown'|'notowned', state }. */
export function equip(state, id, reg = GEAR_ITEMS) {
  const st = loadGear(state, reg), it = itemById(id, reg);
  if (!it) return { ok: false, reason: 'unknown', state: st };
  if (!st.owned[id]) return { ok: false, reason: 'notowned', state: st };
  return { ok: true, reason: '', state: { ...st, worn: { ...st.worn, [it.slot]: id } } };
}
/** Cởi ô. Ô lạ hoặc đang trống thì không đổi gì. */
export function unequip(state, slot, reg = GEAR_ITEMS) {
  const st = loadGear(state, reg); if (!isSlot(slot) || !st.worn[slot]) return st;
  const worn = { ...st.worn }; delete worn[slot]; return { ...st, worn };
}

/** Chi phí nâng món lên bậc kế (null nếu đã tối đa / món chưa có). Nguyên liệu nhân theo bậc hiếm: Thường/Hiếm ×1, Quý ×2, Thánh ×2 (TẠM). */
export function upgradeCost(state, id, reg = GEAR_ITEMS) {
  const st = loadGear(state, reg), it = itemById(id, reg), have = st.owned[id];
  if (!it || !have || have.lv >= MAX_UPGRADE) return null;
  const c = UPGRADE_COST[have.lv], mul = it.rarity >= 3 ? 2 : 1;
  return { la: c.la, nl: c.nl * mul };
}
/** Nâng 1 bậc. wallet = { la, nl }. Trả { ok, reason: ''|'unknown'|'notowned'|'max'|'poor', cost, state }; nơi gọi tự trừ la/nl khi ok. Luôn thành công khi đủ đồ. */
export function upgrade(state, id, wallet = {}, reg = GEAR_ITEMS) {
  const st = loadGear(state, reg), it = itemById(id, reg);
  if (!it) return { ok: false, reason: 'unknown', cost: null, state: st };
  if (!st.owned[id]) return { ok: false, reason: 'notowned', cost: null, state: st };
  const cost = upgradeCost(st, id, reg);
  if (!cost) return { ok: false, reason: 'max', cost: null, state: st };
  if (!(Number(wallet.la) >= cost.la) || !(Number(wallet.nl) >= cost.nl)) return { ok: false, reason: 'poor', cost, state: st };
  return { ok: true, reason: '', cost, state: { ...st, owned: { ...st.owned, [id]: { lv: st.owned[id].lv + 1 } } } };
}
/** Cộng các hệ số, kẹp ở trần chung (không ai bỏ xa người khác quá nhiều). Giá trị lạ/âm bị bỏ. */
export function capBonus(list, cap = 0.25) {
  let t = 0; for (const v of Array.isArray(list) ? list : []) { const n = Number(v); if (Number.isFinite(n) && n > 0) t += n; }
  return Math.min(Math.max(0, +cap || 0), t);
}
