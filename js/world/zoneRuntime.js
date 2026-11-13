// Nối hệ thống NHIỀU KHÔNG GIAN (ZoneManager, Phiên 81) vào game thật — Phiên 85.
// Hiện chỉ có zone hub "chua" (cả chùa + làng), nên người chơi KHÔNG thấy gì đổi. Khi có zone thứ hai thì đăng ký ở đây (register).
// Lưu zone cuối vào localStorage khóa `lgt.zone`. Phòng mạng lấy qua `zones.roomKey(base)`.
import * as layoutApi from './layout.js';
import { createZoneManager, HUB_ID } from './zones.js';
import { THU_DEF, HUB_GATE, HUB_RETURN_SPAWN } from './zoneThu.js';
import { registerVoDai } from './zoneVoDai.js';

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
  try {   // Phiên 87: cổng thử ở rìa làng → Vườn thử (đăng ký ở đây, KHÔNG trong createZoneRuntime để test hub-only giữ nguyên)
    const hub = rt.manager.get(HUB_ID); hub.gates.push({ ...HUB_GATE }); hub.spawns['tu-vuon-thu'] = { ...HUB_RETURN_SPAWN };
    rt.manager.register({ ...THU_DEF, spawns: { default: { ...THU_DEF.spawns.default } }, gates: THU_DEF.gates.map((g) => ({ ...g })) });
    registerVoDai(rt.manager);   // Phiên 137: Võ đài giao lưu võ thuật (cổng ở sân chùa)
    const errs = rt.manager.validate(); if (errs.length) console.warn('[Diệu Giang Tự] Zone cấu hình sai:', errs.join('; '));
  } catch (e) { console.warn('[Diệu Giang Tự] Đăng ký Vườn thử lỗi:', e && e.message); }
  LGT.zones = rt.manager; LGT.zoneStart = rt.start;
  if (typeof window.addEventListener === 'function') window.addEventListener('pagehide', () => rt.save());
  return rt;
}
