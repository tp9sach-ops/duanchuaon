// Sức mạnh + khiêng/ném vật nặng (Phiên 63). LOGIC THUẦN (không DOM, không three.js), có test: tests/strength.test.mjs. Giao diện: js/ui/carry.js; cảnh 3D: js/scene/carry.js.
// Sức mạnh tăng theo CẤP ĐỘ, BẬC LUYỆN THÂN (Khinh thân) và CÔNG ĐỨC (tổng hạt sen từng kiếm). Càng mạnh càng khiêng được vật nặng, ném càng xa.
// Luật ptg chốt 08/11: nhân vật có cấp VÀ sức mạnh đều lớn hơn thì khiêng/ném được người khác dù họ không đồng ý (phần ném NGƯỜI qua mạng: xem docs/PHIEN63.md).
// Mọi con số (kg, quãng ném, công thức) là QUY ƯỚC TẠM của dự án, chờ ptg duyệt.
import { canStep, blocked, BOUNDS, GATE } from './layout.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);

/** Sức mạnh từ cấp độ người chơi (1..10), bậc Khinh thân (0..8) và tổng hạt sen từng kiếm. Số nguyên ≥ 0; đầu vào lạ → coi như 0 (cấp tối thiểu 1). */
export function strengthOf(o) {
  const { level = 1, khinh = 0, sen = 0, bonus = 0 } = isObj(o) ? o : {};   // bonus = sức mạnh vĩnh viễn từ thu phục yêu quái (js/world/yeuquai.js)
  const lv = clamp(Math.floor(num(level, 1)), 1, 99), kb = clamp(Math.floor(num(khinh)), 0, 8), s = clamp(num(sen), 0, 1e9);
  return Math.floor(lv * 6 + kb * 10 + Math.sqrt(s) * 2) + clamp(Math.floor(num(bonus)), 0, 100);
}
/** Danh hiệu sức mạnh. */
export const TIERS = [{ min: 0, ten: 'Tay yếu' }, { min: 20, ten: 'Khỏe khoắn' }, { min: 45, ten: 'Lực sĩ' }, { min: 80, ten: 'Dũng sĩ' }, { min: 120, ten: 'Kim cương lực' }];
export const tierOf = (str) => { const s = num(str); let t = TIERS[0]; for (const x of TIERS) if (s >= x.min) t = x; return t.ten; };
/** Khối lượng tối đa (kg) khiêng được. */
export const carryLimit = (str) => Math.round((8 + clamp(num(str), 0, 1e4) * 1.6) * 10) / 10;
/** Sức mạnh tối thiểu để khiêng vật nặng `kg`. */
export const strengthNeeded = (kg) => Math.max(0, Math.ceil((num(kg) - 8) / 1.6));
/** Quãng ném (m) của vật nặng kg với sức mạnh str: vật càng nhẹ so với sức mình càng xa; kẹp 2..40 m. Không khiêng nổi → 0. */
export function throwRange(str, kg) {
  const lim = carryLimit(str), w = Math.max(0, num(kg)); if (w > lim) return 0;
  return Math.round(clamp(3 + 22 * (1 - w / lim) + clamp(num(str), 0, 1e4) * 0.1, 2, 40) * 10) / 10;
}

/** Các vật khiêng được trong thế giới (kg tăng dần). home = chỗ đặt ban đầu (đã kiểm: đi được, không đè vật cản). */
export const CARRY_ITEMS = [
  { id: 'thung', ten: 'Thùng gỗ', kg: 6, color: 0x9b6b3a, shape: 'box', size: [0.5, 0.5, 0.5], home: { x: 10, z: 2 } },
  { id: 'cui', ten: 'Bó củi', kg: 12, color: 0x7a5230, shape: 'cyl', size: [0.28, 0.9, 0.28], home: { x: -8, z: 96 } },
  { id: 'bagao', ten: 'Bao gạo', kg: 25, color: 0xd8c9a0, shape: 'box', size: [0.6, 0.4, 0.4], home: { x: 6, z: 136 } },
  { id: 'chum', ten: 'Chum sành', kg: 45, color: 0x8a5a3c, shape: 'cyl', size: [0.4, 0.8, 0.4], home: { x: -10, z: 125 } },
  { id: 'danho', ten: 'Tảng đá nhỏ', kg: 70, color: 0x8c9096, shape: 'rock', size: [0.55, 0.45, 0.5], home: { x: -96, z: 98 } },
  { id: 'dacanh', ten: 'Đá cảnh hồ cá', kg: 90, color: 0x6f7a80, shape: 'rock', size: [0.65, 0.55, 0.6], home: { x: 46, z: 4 } },
  { id: 'dalon', ten: 'Tảng đá lớn', kg: 120, color: 0x7d8288, shape: 'rock', size: [0.8, 0.65, 0.75], home: { x: 96, z: 114 } },
  { id: 'golim', ten: 'Khúc gỗ lim', kg: 200, color: 0x5a3a24, shape: 'cyl', size: [0.45, 1.3, 0.45], home: { x: -112, z: 84 } },
];
export const itemById = (id) => CARRY_ITEMS.find((i) => i.id === id) || null;
export const PLAYER_KG = 55;        // khối lượng một nhân vật người chơi
export const RESPAWN_S = 90;        // vật bị ném đi xa nằm yên bao lâu thì tự về chỗ cũ
export const PICK_RADIUS = 2.2;     // đứng cách vật tối đa bao nhiêu m thì khiêng được

/** Có được khiêng/ném người chơi khác không? a, b = { lv, str }. Luật ptg: cấp VÀ sức mạnh của người kia đều nhỏ hơn mình (không cần họ đồng ý); thêm: mình phải khiêng nổi 55 kg.
 *  Trả { ok, reason: ''|'level'|'strength'|'weight'|'invalid' }. */
export function canGrab(a, b) {
  if (!isObj(a) || !isObj(b)) return { ok: false, reason: 'invalid' };
  if (!(num(b.lv) < num(a.lv))) return { ok: false, reason: 'level' };
  if (!(num(b.str) < num(a.str))) return { ok: false, reason: 'strength' };
  if (PLAYER_KG > carryLimit(a.str)) return { ok: false, reason: 'weight' };
  return { ok: true, reason: '' };
}

/** Điểm rơi khi ném từ (x,z) theo hướng quay ry (rad; 0 = +z như avatar.setFacing) quãng `range` m: đi từng 0,5 m, dừng trước vật cản/nước/đổi vùng. */
export function landing(x, z, ry, range) {
  const dx = Math.sin(num(ry)), dz = Math.cos(num(ry)), n = Math.floor(clamp(num(range), 0, 60) / 0.5);
  let cx = num(x), cz = num(z), d = 0;
  for (let i = 1; i <= n; i++) { const nx = x + dx * 0.5 * i, nz = z + dz * 0.5 * i; if (!canStep(cx, cz, nx, nz)) break; cx = nx; cz = nz; d = 0.5 * i; }
  return { x: cx, z: cz, dist: d };
}

/** Thế giới vật khiêng. Mỗi vật: { id, def, x, z, y, state: 'rest'|'held'|'fly', fly, away }. Đối tượng có trạng thái (mutable), mọi hàm kiểm tra đầu vào. */
export function createCarry(defs = CARRY_ITEMS) {
  const items = defs.map((d) => ({ id: d.id, def: d, x: d.home.x, z: d.home.z, y: 0, state: 'rest', fly: null, away: 0 }));
  let held = null;
  const api = {
    items, get held() { return held; },
    /** Vật nghỉ gần nhất trong PICK_RADIUS quanh pos, hoặc null. */
    nearest(pos, r = PICK_RADIUS) {
      let best = null, bd = r; if (!pos) return null;
      for (const it of items) if (it.state === 'rest') { const d = Math.hypot(it.x - pos.x, it.z - pos.z); if (d <= bd) { bd = d; best = it; } }
      return best;
    },
    /** Khiêng vật `id` với sức mạnh str. Trả { ok, reason: ''|'busy'|'far'|'heavy'|'unknown', item, need }. */
    pickup(id, str, pos) {
      const it = items.find((i) => i.id === id); if (!it) return { ok: false, reason: 'unknown', item: null, need: 0 };
      if (held) return { ok: false, reason: 'busy', item: it, need: 0 };
      if (it.state !== 'rest' || (pos && Math.hypot(it.x - pos.x, it.z - pos.z) > PICK_RADIUS + 0.5)) return { ok: false, reason: 'far', item: it, need: 0 };
      const need = strengthNeeded(it.def.kg); if (it.def.kg > carryLimit(str)) return { ok: false, reason: 'heavy', item: it, need };
      it.state = 'held'; it.away = 0; held = it; return { ok: true, reason: '', item: it, need };
    },
    /** Đặt vật đang khiêng xuống ngay trước mặt (cách 1 m, hoặc dưới chân nếu vướng). */
    drop(pos, ry) {
      if (!held) return null; const it = held, l = landing(pos.x, pos.z, ry, 1); it.x = l.x; it.z = l.z; it.y = 0; it.state = 'rest'; held = null; return it;
    },
    /** Ném vật đang khiêng. Trả { ok, item, range, to } hoặc { ok:false }. */
    throwHeld(pos, ry, str) {
      if (!held) return { ok: false, item: null, range: 0, to: null };
      const it = held, range = throwRange(str, it.def.kg), l = landing(pos.x, pos.z, ry, range);
      it.fly = { x0: pos.x, z0: pos.z, x1: l.x, z1: l.z, t: 0, dur: 0.5 + range * 0.035, peak: 1.2 + range * 0.1 }; it.state = 'fly'; held = null;
      return { ok: true, item: it, range, to: l };
    },
    /** Tiến thời gian dt giây: vật bay theo vòng cung, vật nằm xa chỗ cũ quá RESPAWN_S thì về chỗ cũ. Trả danh sách vật vừa hạ cánh. */
    step(dt) {
      const d = clamp(num(dt), 0, 0.25), landed = [];
      for (const it of items) {
        if (it.state === 'fly' && it.fly) {
          const f = it.fly; f.t += d; const u = clamp(f.t / f.dur, 0, 1);
          it.x = f.x0 + (f.x1 - f.x0) * u; it.z = f.z0 + (f.z1 - f.z0) * u; it.y = 2 * (1 - u) + 4 * f.peak * u * (1 - u);   // từ trên đầu, vòng cung, hạ xuống đất
          if (u >= 1) { it.state = 'rest'; it.fly = null; it.y = 0; it.away = 0; landed.push(it); }
        } else if (it.state === 'rest' && Math.hypot(it.x - it.def.home.x, it.z - it.def.home.z) > 0.6) {
          it.away += d; if (it.away >= RESPAWN_S) { it.x = it.def.home.x; it.z = it.def.home.z; it.away = 0; }
        }
      }
      return landed;
    },
  };
  return api;
}
export { blocked as _blocked };   // dùng trong test kiểm chỗ đặt

// ---- Luật ném NGƯỜI CHƠI khác (ptg chốt 08/11, Phiên 64). Chưa nối mạng (xem docs/PHIEN64.md); logic và test đã sẵn.
export const THROW_COOLDOWN_S = 10;   // hồi chiêu cho MỖI CẶP (người ném → người bị ném)
export const THROW_COST_SEN = 1;      // người ném người khác bị trừ 1 công đức (hạt sen)
/** (x, z) có nằm trong khuôn viên chùa (sân chùa, chánh điện, vườn, hành lang… từ chánh điện tới hết cổng Tam quan) không. Trong chùa KHÔNG được ném người. */
export const inTemple = (x, z) => Number.isFinite(+x) && Number.isFinite(+z) && Math.abs(+x) <= BOUNDS.xMax && +z >= BOUNDS.zMin && +z <= GATE.z + 2.4;
/** Khóa hồi chiêu của một cặp. */
export const pairKey = (a, b) => `${String(a)}>${String(b)}`;
/**
 * Có được khiêng-ném người chơi khác lúc này không? in: { att: {lv,str,x,z}, tgt: {lv,str,x,z,meditating}, cd: { [pairKey]: giây còn lại }, attId, tgtId }.
 * Trả { ok, reason: ''|'invalid'|'level'|'strength'|'weight'|'temple'|'meditating'|'cooldown', cost (hạt sen phải trừ), wait (giây) }.
 * Người bị ném rơi an toàn, không mất gì (nơi gọi dịch chuyển người đó tới `landing`, không trừ máu/đồ).
 */
export function throwCheck({ att, tgt, cd = {}, attId = 'a', tgtId = 'b' } = {}) {
  const g = canGrab(att, tgt); if (!g.ok) return { ok: false, reason: g.reason, cost: 0, wait: 0 };
  if (inTemple(att.x, att.z) || inTemple(tgt.x, tgt.z)) return { ok: false, reason: 'temple', cost: 0, wait: 0 };
  if (tgt.meditating) return { ok: false, reason: 'meditating', cost: 0, wait: 0 };
  const w = num(cd && cd[pairKey(attId, tgtId)]); if (w > 0) return { ok: false, reason: 'cooldown', cost: 0, wait: Math.ceil(w) };
  return { ok: true, reason: '', cost: THROW_COST_SEN, wait: 0 };
}
/** Ghi hồi chiêu sau một cú ném (trả bản sao). */
export const markThrown = (cd, attId, tgtId) => ({ ...(isObj(cd) ? cd : {}), [pairKey(attId, tgtId)]: THROW_COOLDOWN_S });
/** Trừ hồi chiêu theo thời gian (trả bản sao, bỏ cặp đã hết). */
export function tickCooldown(cd, dt) { const o = {}, d = clamp(num(dt), 0, 60); for (const [k, v] of Object.entries(isObj(cd) ? cd : {})) { const r = num(v) - d; if (r > 0) o[k] = r; } return o; }
