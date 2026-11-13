// Nối zone phó bản vào game thật (mục 4b, Phiên 139): gắn hook dựng/dỡ cảnh 3D và đặt LGT.dungeonZones.enter(id) — bước 4c (NPC) sẽ gọi hàm này.
// CHƯA nhìn bằng mắt. Mỗi lần vào là một chuyến travel riêng; rời bằng cổng ở rìa sàn (hoặc leave()).
import { DUNGEON_IDS } from '../data/dungeons.js';
import { dungeonZoneId, dungeonIdOfZone, playerSpawn } from '../world/zoneDungeon.js';

export async function initDungeonZones({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {}), Z = LGT.zones; if (!Z || !LGT.scene) return null;
  try {
    const sc = await import('../scene/dungeon.js');
    for (const id of DUNGEON_IDS) { const def = Z.get(dungeonZoneId(id)); if (def) { const h = sc.dungeonHooks(LGT.scene, id); def.load = h.load; def.dispose = h.dispose; } }
  } catch (e) { console.warn('[Diệu Giang Tự] Cảnh phó bản lỗi:', e && e.message); return null; }
  const ready = () => { const W = LGT.world; return !!W && W.mode === 'free' && !LGT.inHouse && !LGT.panelOpen && !(LGT.yq && LGT.yq.status && LGT.yq.status().active) && !(LGT.swim && LGT.swim.active) && Z.current === 'chua'; };
  /** Vào phó bản `id` (chỉ từ chùa, đang rảnh). Trả Promise<{ok, reason?}>. */
  async function enter(id) {
    if (!DUNGEON_IDS.includes(id)) return { ok: false, reason: 'Không có phó bản này' };
    if (!ready()) return { ok: false, reason: 'Lúc này chưa vào phó bản được' };
    const r = await Z.travel(dungeonZoneId(id), { spawn: 'default' });
    if (r && r.ok) { LGT.world.teleport(r.spawn.x, r.spawn.z, r.spawn.ry); return { ok: true, zone: r.zone }; }
    return { ok: false, reason: (r && r.reason) || 'Chưa vào được' };
  }
  /** Rời phó bản về chùa (từ bất kỳ chỗ nào trong phó bản). */
  async function leave() {
    if (!dungeonIdOfZone(Z.current)) return { ok: false, reason: 'Không ở trong phó bản' };
    const r = await Z.travel('chua', { spawn: 'tu-pho-ban' });
    if (r && r.ok) { LGT.world.teleport(r.spawn.x, r.spawn.z, r.spawn.ry); return { ok: true }; }
    return { ok: false, reason: (r && r.reason) || 'Chưa rời được' };
  }
  LGT.dungeonZones = { enter, leave, get inside() { return dungeonIdOfZone(Z.current); } };
  return LGT.dungeonZones;
}
