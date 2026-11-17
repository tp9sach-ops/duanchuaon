// Phiên 198 (mục 2): CHIÊU THỨC LƯỚT TAY ĐỊNH HƯỚNG. LOGIC THUẦN (không DOM), có test: tests/aimswipe.test.mjs.
//  • Bấm nút chiêu rồi LƯỚT ngón tay ≥ SWIPE_PX → tung chiêu. Chiêu ĐỊNH HƯỚNG (vùng báo hình 'đường' hoặc 'nón': Kim Cương Trảm, U Minh Linh Tiễn, Huyền Băng Chưởng, Liệt Hỏa Chưởng, Địa Sách Chưởng, chiêu 3 Kim/Hỏa, Thiết Kỵ, Huyền Băng Môn…) bay theo HƯỚNG LƯỚT; chiêu vòng tròn/hỗ trợ không cần hướng (lướt vẫn tung bình thường).
//  • Hướng lướt trên màn hình (lên = phía trước camera) đổi sang hướng THẾ GIỚI theo góc camera, cùng công thức với cần đi (worldLogic.moveVector).
//  • Chiêu định hướng chỉ đánh quái NẰM TRONG vùng báo theo hướng đó; không có quái trong hướng đó thì vẫn tung (hiệu ứng bay theo hướng lướt) nhưng KHÔNG gây sát thương.
import { chieuOf } from './chieuNguHanh.js';
import { moveVector } from './worldLogic.js';

export const SWIPE_PX = 22;   // quãng lướt tối thiểu (px) để coi là lướt (nhỏ hơn = bấm thường)
const SLACK_ANGLE = 0.17;     // rad (~10°): nới góc nón cho ngón tay lướt không chuẩn
const SLACK_SIDE = 0.5;       // m: nới bề rộng đường
const FALLBACK = Object.freeze({ kieu: 'non', dai: 8, goc: 70 });   // chiêu định hướng thiếu số đo vùng

/** Hình vùng báo của chiêu: { kieu: 'duong'|'non'|'tron', ... } hoặc null. */
export function hinhOf(id) { const c = chieuOf(id), h = c && c.canhBao && c.canhBao.hinh; return h && typeof h === 'object' ? h : null; }
/** Chiêu có định hướng không (vùng báo dạng đường hoặc nón). id lạ → false. */
export function isDirectional(id) { const h = hinhOf(id); return !!h && (h.kieu === 'duong' || h.kieu === 'non'); }

/**
 * Từ vết lướt trên màn hình (dx sang phải, dy xuống dưới, px) và góc camera `yaw` → hướng thế giới { ry (rad, như facingOf), x, z, len } hoặc null nếu lướt chưa đủ dài.
 */
export function swipeDir(dx, dy, yaw = 0, minPx = SWIPE_PX) {
  const sx = Number(dx), sy = Number(dy); if (!Number.isFinite(sx) || !Number.isFinite(sy)) return null;
  const len = Math.hypot(sx, sy); if (!(len >= minPx)) return null;
  const v = moveVector({}, { x: sx / len, y: sy / len }, Number.isFinite(+yaw) ? +yaw : 0);
  return { ry: Math.atan2(v.x, v.z), x: v.x, z: v.z, len };
}

/**
 * Quái bị chiêu định hướng trúng khi tung từ `p` theo hướng `ry` với vùng `hinh` (rỗng → nón mặc định). mons: [{ uid, x, z }]; bodyOf(m) = bán kính thân.
 * Trả quái GẦN NHẤT nằm trong vùng, hoặc null.
 */
export function pickInDir(p, ry, mons, hinh, bodyOf = () => 0) {
  if (!p || !Array.isArray(mons) || !Number.isFinite(+ry)) return null;
  let best = null, bd = Infinity;
  for (const e of inDirList(p, ry, mons, hinh, bodyOf)) if (e.d < bd) { bd = e.d; best = e.m; }
  return best;
}

/** Quái nằm trong vùng đường/nón (kèm khoảng cách tới `p`); dùng chung cho pickInDir (gần nhất) và pickAllInDir (tất cả). */
function inDirList(p, ry, mons, hinh, bodyOf) {
  const out = [];
  const h = hinh && (hinh.kieu === 'duong' || hinh.kieu === 'non') ? hinh : FALLBACK, fx = Math.sin(ry), fz = Math.cos(ry);
  for (const m of mons) {
    if (!m) continue; const dx = +m.x - p.x, dz = +m.z - p.z; if (!Number.isFinite(dx) || !Number.isFinite(dz)) continue;
    const d = Math.hypot(dx, dz), body = +bodyOf(m) || 0, along = dx * fx + dz * fz;
    let ok;
    if (h.kieu === 'duong') ok = along > -body && along <= (+h.dai || 0) + body && Math.abs(dx * fz - dz * fx) <= (+h.rong || 0) / 2 + body + SLACK_SIDE;
    else { const half = ((+h.goc || 0) * Math.PI) / 360 + SLACK_ANGLE + Math.atan2(body, Math.max(d, 0.1)); ok = d <= (+h.dai || 0) + body && (d < 1e-6 || Math.acos(Math.max(-1, Math.min(1, along / d))) <= half); }
    if (ok) out.push({ m, d });
  }
  return out;
}

/** Phiên 213 (mục 1): TẤT CẢ quái nằm trong vùng đường/nón theo hướng `ry`, xếp gần → xa. Không có → []. */
export function pickAllInDir(p, ry, mons, hinh, bodyOf = () => 0) {
  if (!p || !Array.isArray(mons) || !Number.isFinite(+ry)) return [];
  return inDirList(p, ry, mons, hinh, bodyOf).sort((a, b) => a.d - b.d).map((e) => e.m);
}

/**
 * Phiên 213 (mục 1): chiêu KHÔNG lướt tay (đánh quái đang nhắm) trúng TẤT CẢ quái trong vùng của chiêu.
 * `main` = quái đang nhắm (luôn trúng, như trước đây). Vùng tròn { r }: quái cách người tung HOẶC cách `main` không quá r (+ thân quái).
 * Vùng đường/nón: theo hướng từ `p` tới `main`. Vùng lạ/thiếu: chỉ `main`. Trả mảng có `main` đứng đầu, rồi các quái khác gần → xa (tối đa `max`).
 */
export function pickAllAround(p, main, mons, hinh, bodyOf = () => 0, max = 8) {
  if (!main) return [];
  const out = [main];
  if (!p || !Array.isArray(mons) || !hinh || typeof hinh !== 'object') return out;
  let cand = [];
  if (hinh.kieu === 'tron' && Number.isFinite(+hinh.r)) {
    const r = +hinh.r;
    for (const m of mons) {
      if (!m || m === main) continue; const body = +bodyOf(m) || 0;
      const dp = Math.hypot(+m.x - p.x, +m.z - p.z), dm = Math.hypot(+m.x - main.x, +m.z - main.z);
      if (Number.isFinite(dp) && Number.isFinite(dm) && (dp <= r + body || dm <= r + body)) cand.push({ m, d: Math.min(dp, dm) });
    }
  } else if (hinh.kieu === 'duong' || hinh.kieu === 'non') {
    const ry = Math.atan2(+main.x - p.x, +main.z - p.z);
    if (Number.isFinite(ry)) cand = inDirList(p, ry, mons, hinh, bodyOf).filter((e) => e.m !== main);
  }
  cand.sort((a, b) => a.d - b.d);
  for (const e of cand) { if (out.length >= Math.max(1, max)) break; out.push(e.m); }
  return out;
}
