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
  const h = hinh && (hinh.kieu === 'duong' || hinh.kieu === 'non') ? hinh : FALLBACK, fx = Math.sin(ry), fz = Math.cos(ry);
  let best = null, bd = Infinity;
  for (const m of mons) {
    if (!m) continue; const dx = +m.x - p.x, dz = +m.z - p.z; if (!Number.isFinite(dx) || !Number.isFinite(dz)) continue;
    const d = Math.hypot(dx, dz), body = +bodyOf(m) || 0, along = dx * fx + dz * fz;
    let ok;
    if (h.kieu === 'duong') ok = along > -body && along <= (+h.dai || 0) + body && Math.abs(dx * fz - dz * fx) <= (+h.rong || 0) / 2 + body + SLACK_SIDE;
    else { const half = ((+h.goc || 0) * Math.PI) / 360 + SLACK_ANGLE + Math.atan2(body, Math.max(d, 0.1)); ok = d <= (+h.dai || 0) + body && (d < 1e-6 || Math.acos(Math.max(-1, Math.min(1, along / d))) <= half); }
    if (ok && d < bd) { bd = d; best = m; }
  }
  return best;
}
