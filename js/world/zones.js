// Quản lý NHIỀU KHÔNG GIAN (ZONE) — Phiên 81 (docs/THIET_KE_CHIEU_SAU.md mục 2). Logic thuần, có test, không đụng three.js.
// Nguyên tắc chống lag: mỗi lúc CHỈ MỘT zone chạy đầy đủ; zone kế được tải trước khi người chơi tiến gần cổng; zone cũ được giải phóng (dispose).
// Phần dựng cảnh 3D của từng zone nằm ở hook `load(ctx)` / `dispose(ctx)` do module zone cung cấp; file này không biết gì về hình.
// Va chạm theo zone nằm ở layout.js (defineZone / activateZone); ZoneManager gọi chúng qua tham số `layout` để test được bằng bản giả.

export const HUB_ID = 'chua';
export const ZONE_KINDS = ['AN', 'KQ', 'QUAI', 'HAM'];   // an toàn, kỳ quan, săn yêu quái, hầm nhiệm vụ
export const DEFAULT_BUDGET = { meshes: 1500, drawCalls: 400, textures: 40, trees: 400, maxPlayers: 30 };
const PRELOAD_EXTRA = 12;                                  // m: tiến gần cổng trong bán kính cổng + 12 m thì bắt đầu tải trước

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Định nghĩa zone: { id, ten, loai, bounds?, spawns:{default:{x,z,ry}, ...}, gates:[{id,x,z,r,to,spawn}], budget?, requires?(ctx)->true|string, load?(ctx), dispose?(ctx) }.
 * `requires` trả true (mở) hoặc chuỗi lý do (chưa mở, hiện cho người chơi). Zone hub luôn mở.
 */
export function createZoneManager({ layout = null, onChange = null } = {}) {
  const defs = new Map();
  const loaded = new Set();                // zone đã dựng (đang giữ bộ nhớ)
  const loading = new Map();               // id -> Promise (chống tải trùng)
  const opened = new Set([HUB_ID]);        // zone người chơi đã từng mở (lưu lại)
  let current = HUB_ID, travelling = false;
  const listeners = onChange ? [onChange] : [];

  function register(def) {
    if (!def || typeof def.id !== 'string' || !def.id) throw new Error('Zone cần id chuỗi');
    if (defs.has(def.id)) throw new Error('Trùng zone: ' + def.id);
    const d = { loai: 'AN', gates: [], spawns: {}, ...def, budget: { ...DEFAULT_BUDGET, ...(def.budget || {}) } };
    defs.set(d.id, d);
    if (d.id !== HUB_ID && layout && layout.defineZone) layout.defineZone(d.id, { bounds: d.bounds, terrain: d.terrain, groundY: d.groundY });
    return d;
  }
  const get = (id) => defs.get(id) || null;
  const list = () => [...defs.values()];

  /** Kiểm tính hợp lệ của toàn bộ cấu hình. Trả mảng lỗi (rỗng = tốt). */
  function validate() {
    const errs = [];
    if (!defs.has(HUB_ID)) errs.push('Thiếu zone hub "' + HUB_ID + '"');
    for (const d of defs.values()) {
      if (!ZONE_KINDS.includes(d.loai)) errs.push(d.id + ': loại "' + d.loai + '" không hợp lệ');
      const sp = d.spawns.default;
      if (!sp || !isNum(sp.x) || !isNum(sp.z)) errs.push(d.id + ': thiếu điểm xuất hiện spawns.default {x,z}');
      for (const [k, v] of Object.entries(d.budget)) if (!isNum(v) || v <= 0) errs.push(d.id + ': ngân sách ' + k + ' không hợp lệ');
      const seen = new Set();
      for (const g of d.gates) {
        if (!g.id || seen.has(g.id)) errs.push(d.id + ': cổng thiếu id hoặc trùng (' + g.id + ')');
        seen.add(g.id);
        if (![g.x, g.z, g.r].every(isNum) || g.r <= 0) errs.push(d.id + '/' + g.id + ': tọa độ hoặc bán kính cổng sai');
        const to = defs.get(g.to);
        if (!to) errs.push(d.id + '/' + g.id + ': cổng dẫn tới zone không có (' + g.to + ')');
        else if (g.spawn && !to.spawns[g.spawn]) errs.push(d.id + '/' + g.id + ': zone đích không có điểm xuất hiện "' + g.spawn + '"');
        if (d.bounds && [g.x, g.z].every(isNum) && !(g.x >= d.bounds.x0 && g.x <= d.bounds.x1 && g.z >= d.bounds.z0 && g.z <= d.bounds.z1)) errs.push(d.id + '/' + g.id + ': cổng nằm ngoài bounds của zone');
      }
    }
    // mọi zone phải tới được từ hub (đi theo cổng, bỏ qua điều kiện mở)
    if (defs.has(HUB_ID)) {
      const seen = new Set([HUB_ID]), q = [HUB_ID];
      while (q.length) for (const g of (defs.get(q.shift()).gates)) if (defs.has(g.to) && !seen.has(g.to)) { seen.add(g.to); q.push(g.to); }
      for (const id of defs.keys()) if (!seen.has(id)) errs.push(id + ': không có đường đi từ hub tới zone này');
    }
    return errs;
  }

  /** Zone `id` mở được chưa? { ok, reason }. ctx là trạng thái người chơi (cấp, chương truyện...) do nơi gọi đưa vào. */
  function canEnter(id, ctx = {}) {
    const d = defs.get(id);
    if (!d) return { ok: false, reason: 'Không có nơi này' };
    if (id === HUB_ID || opened.has(id) || !d.requires) return { ok: true };
    const r = d.requires(ctx);
    return r === true ? { ok: true } : { ok: false, reason: typeof r === 'string' ? r : 'Chưa mở' };
  }

  /** Cổng của zone hiện tại mà (x, z) đang đứng trong vùng của nó (cộng `extra` m). Trả cổng gần nhất hoặc null. */
  function gateNear(x, z, extra = 0, zoneId = current) {
    const d = defs.get(zoneId); if (!d) return null;
    let best = null, bd = Infinity;
    for (const g of d.gates) { const dist = Math.hypot(x - g.x, z - g.z); if (dist <= g.r + extra && dist < bd) { best = g; bd = dist; } }
    return best;
  }
  /** Gọi mỗi khung/nhịp: nếu người chơi tiến gần một cổng đã mở được thì bắt đầu tải trước zone đích. Trả id zone đang tải trước hoặc null. */
  function tick(x, z, ctx = {}) {
    const g = gateNear(x, z, PRELOAD_EXTRA);
    if (!g || !canEnter(g.to, ctx).ok || loaded.has(g.to) || loading.has(g.to)) return null;
    preload(g.to).catch(() => {});
    return g.to;
  }

  function preload(id, ctx = {}) {
    const d = defs.get(id);
    if (!d) return Promise.reject(new Error('Không có zone ' + id));
    if (loaded.has(id) || id === HUB_ID) { loaded.add(id); return Promise.resolve(id); }
    if (loading.has(id)) return loading.get(id);
    const p = Promise.resolve().then(() => d.load && d.load(ctx)).then(() => { loaded.add(id); loading.delete(id); return id; }, (e) => { loading.delete(id); throw e; });
    loading.set(id, p);
    return p;
  }

  async function release(id, ctx = {}) {
    const d = defs.get(id);
    if (!d || id === HUB_ID || !loaded.has(id)) return false;
    loaded.delete(id);
    if (d.dispose) await d.dispose(ctx);
    return true;
  }

  /**
   * Đi sang zone `to` (từ một cổng hoặc trực tiếp). Tải zone đích nếu chưa, đổi va chạm, giải phóng zone cũ.
   * Trả { ok, zone, spawn } hoặc { ok:false, reason }. Lỗi tải thì GIỮ NGUYÊN zone hiện tại (không kẹt giữa chừng).
   */
  async function travel(to, { spawn = 'default', ctx = {} } = {}) {
    if (travelling) return { ok: false, reason: 'Đang chuyển' };
    const d = defs.get(to);
    if (!d) return { ok: false, reason: 'Không có nơi này' };
    if (to === current) return { ok: false, reason: 'Đang ở đây rồi' };
    const can = canEnter(to, ctx); if (!can.ok) return { ok: false, reason: can.reason };
    travelling = true;
    const from = current;
    try {
      try { await preload(to, ctx); } catch (e) { return { ok: false, reason: 'Không tải được ' + (d.ten || to) }; }
      if (layout && layout.activateZone) layout.activateZone(to);
      current = to; opened.add(to);
      const sp = d.spawns[spawn] || d.spawns.default;
      await release(from, ctx);
      const out = { ok: true, zone: to, from, spawn: { x: sp.x, z: sp.z, ry: sp.ry || 0 } };
      for (const f of listeners) { try { f(out); } catch (_) { /* người nghe lỗi không làm hỏng việc chuyển */ } }
      return out;
    } finally { travelling = false; }
  }
  /** Đi qua cổng có id `gateId` của zone hiện tại. */
  const useGate = (gateId, opts) => { const g = (defs.get(current) || { gates: [] }).gates.find((q) => q.id === gateId); return g ? travel(g.to, { spawn: g.spawn || 'default', ...opts }) : Promise.resolve({ ok: false, reason: 'Không có cổng ' + gateId }); };

  /** Khóa phòng mạng: hub giữ nguyên tên cũ (tương thích), zone khác thêm hậu tố để chỉ thấy người cùng zone. */
  const roomKey = (base, id = current) => (id === HUB_ID ? base : base + ':' + id);
  const maxPlayers = (id = current) => (defs.get(id) ? defs.get(id).budget.maxPlayers : DEFAULT_BUDGET.maxPlayers);
  /** So mức dùng thực tế với ngân sách của zone: trả danh sách mục vượt. */
  function overBudget(id, usage) { const d = defs.get(id); if (!d) return []; return Object.keys(usage || {}).filter((k) => k in d.budget && usage[k] > d.budget[k]).map((k) => k + ' ' + usage[k] + ' > ' + d.budget[k]); }

  /** Lưu/khôi phục (localStorage). Zone không còn tồn tại hoặc chưa hợp lệ thì về hub. */
  const serialize = (pos) => ({ zone: current, opened: [...opened], x: pos && isNum(pos.x) ? pos.x : null, z: pos && isNum(pos.z) ? pos.z : null });
  function restore(saved) {
    const s = saved && typeof saved === 'object' ? saved : {};
    for (const id of Array.isArray(s.opened) ? s.opened : []) if (defs.has(id)) opened.add(id);
    return { zone: defs.has(s.zone) && opened.has(s.zone) ? s.zone : HUB_ID, x: isNum(s.x) ? s.x : null, z: isNum(s.z) ? s.z : null };
  }
  const listen = (f) => { listeners.push(f); return () => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); }; };

  return { register, get, list, validate, canEnter, gateNear, tick, preload, release, travel, useGate, roomKey, maxPlayers, overBudget, serialize, restore, listen,
    get current() { return current; }, isLoaded: (id) => loaded.has(id), isOpened: (id) => opened.has(id), markOpened: (id) => { if (defs.has(id)) opened.add(id); } };
}
