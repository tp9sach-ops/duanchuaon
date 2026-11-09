// Nối hệ thống NHIỀU KHÔNG GIAN (ZoneManager, Phiên 81) vào game thật — Phiên 85.
// Hiện chỉ có zone hub "chua" (cả chùa + làng), nên người chơi KHÔNG thấy gì đổi. Khi có zone thứ hai thì đăng ký ở đây (register).
// Lưu zone cuối vào localStorage khóa `lgt.zone`. Phòng mạng lấy qua `zones.roomKey(base)`.
import * as layoutApi from './layout.js';
import { createZoneManager, HUB_ID } from './zones.js';

export const ZONE_STORAGE_KEY = 'lgt.zone';
/** Zone hub: điểm xuất hiện chỉ để khai báo hợp lệ (người chơi vào hub theo đường cũ, không dùng điểm này). */
export const HUB_DEF = { id: HUB_ID, ten: 'Chùa Diệu Giang', loai: 'AN', spawns: { default: { x: 0, z: 12, ry: 0 } }, gates: [] };

export function loadZoneState(storage) {
  try { const raw = storage && storage.getItem(ZONE_STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}
export function saveZoneState(storage, manager, pos) {
  try { if (!storage) return false; storage.setItem(ZONE_STORAGE_KEY, JSON.stringify(manager.serialize(pos))); return true; } catch (_) { return false; }
}

/** Tạo bộ quản lý zone đã có hub, khôi phục trạng thái lưu. `start` = {zone,x,z} nơi nên đứng khi vào game (hiện luôn là hub). */
export function createZoneRuntime({ layout = layoutApi, storage = null, getPos = () => null } = {}) {
  const save = () => saveZoneState(storage, manager, getPos());
  const manager = createZoneManager({ layout, onChange: save });
  manager.register({ ...HUB_DEF, spawns: { default: { ...HUB_DEF.spawns.default } } });
  const start = manager.restore(loadZoneState(storage));
  return { manager, start, save };
}

/** Gọi một lần ở main.js: đặt `window.LGT.zones`. Lỗi không làm hỏng game. */
export function initZones(storage, getPos) {
  const rt = createZoneRuntime({ storage, getPos });
  const LGT = (window.LGT = window.LGT || {});
  LGT.zones = rt.manager; LGT.zoneStart = rt.start;
  if (typeof window.addEventListener === 'function') window.addEventListener('pagehide', () => rt.save());
  return rt;
}
