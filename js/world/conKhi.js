// CÔN KHÍ TRẢM (Phiên 93): nhân vật cầm côn, vung tay chém ra một LUỒNG KHÍ hình trăng khuyết bay thẳng về phía trước.
// Dùng khi yêu quái đang ở làng (nút "Chém khí" trong cụm nút góc phải-dưới). Tầm trung (16 m), mạnh hơn ném đá, hồi chiêu 3 giây.
// TỰ NGẮM: yêu quái trong tầm thì nhân vật tự quay mặt về phía nó (người chơi điện thoại không phải xoay hướng bằng tay). Không có yêu quái trong tầm thì chém thẳng theo hướng đang nhìn.
// LOGIC THUẦN (không DOM, không three.js, có test: tests/conkhi.test.mjs). Giao diện: js/ui/conKhi.js; hình 3D: js/scene/yeuquai.js (luồng khí) + js/world/avatar.js (côn + tư thế vung).
// Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt.

export const RANGE = 16;            // m, tầm bay tối đa của luồng khí
export const SPEED = 24;            // m/s
export const COOLDOWN_S = 3;
export const SWING_S = 0.5;         // tổng thời gian một lần vung côn (nâng → chém → thu)
export const RELEASE_S = 0.2;       // khí rời côn sau bấy nhiêu giây kể từ lúc bấm (lúc côn chém xuống)
export const HALF_W = 1.4;          // m, nửa bề rộng luồng khí (cộng với thân yêu quái khi tính trúng)
export const BASE_DMG = 45, STR_K = 0.8;
const num = (v) => (Number.isFinite(+v) ? +v : 0);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Sát thương: 45 + sức mạnh × 0,8 (cấp 1, sức mạnh 6 → 50; ném đá chỉ ~10, thương ~23). */
export const khiDamage = (str = 0) => Math.round(BASE_DMG + clamp(num(str), 0, 1e4) * STR_K);
/** Giây hồi chiêu còn lại sau dt. */
export const tickCd = (cd, dt) => Math.max(0, num(cd) - clamp(num(dt), 0, 5));
/** Hướng (vector đơn vị) của góc nhìn ry; ry = 0 là +z (cùng quy ước layout.js). */
export const dirOf = (ry) => ({ dx: Math.sin(num(ry)), dz: Math.cos(num(ry)) });

/** Khoảng cách từ người (from) tới tâm yêu quái trừ thân; < 0 nghĩa là đã chạm thân. null nếu không có yêu quái. */
export function gapTo(from, boss, body = 1.5) { return boss && from ? Math.hypot(num(boss.x) - num(from.x), num(boss.z) - num(from.z)) - num(body) : null; }
/** Yêu quái có trong tầm tự ngắm không (khoảng cách tới mép thân ≤ RANGE). */
export const inAimRange = (from, boss, body = 1.5) => { const g = gapTo(from, boss, body); return g !== null && g <= RANGE; };

/**
 * Hướng chém: có yêu quái trong tầm → quay về phía nó (tự ngắm); không thì giữ hướng nhìn hiện tại.
 * Trả { ry, aimed }.
 */
export function aim(from, ry, boss, body = 1.5) {
  if (boss && !boss.dead && inAimRange(from, boss, body)) { const a = Math.atan2(num(boss.x) - num(from.x), num(boss.z) - num(from.z)); return { ry: a, aimed: true }; }
  return { ry: num(ry), aimed: false };
}

/**
 * Kế hoạch một luồng khí: xuất phát từ (x, z) theo hướng ry. Có yêu quái nằm trên đường (lệch ngang ≤ thân + HALF_W, trong tầm) thì khí DỪNG tại mép nó và gây sát thương.
 * Trả { x0, z0, dx, dz, dist (quãng bay), dur (giây), hit }.
 */
export function planWave(x, z, ry, boss, body = 1.5) {
  const { dx, dz } = dirOf(ry), x0 = num(x), z0 = num(z);
  let dist = RANGE, hit = false;
  if (boss && !boss.dead) {
    const bx = num(boss.x) - x0, bz = num(boss.z) - z0, along = bx * dx + bz * dz, lat = Math.abs(bx * dz - bz * dx), R = num(body) + HALF_W;
    if (lat <= R && along > -R) {
      const t = Math.max(0, along - Math.sqrt(Math.max(0, R * R - lat * lat)));   // điểm đầu luồng khí chạm vòng thân
      if (t <= RANGE) { dist = t; hit = true; }
    }
  }
  return { x0, z0, dx, dz, dist, dur: Math.max(0.05, dist / SPEED), hit };
}

/** Vị trí đầu luồng khí sau u (0..1) quãng bay: dùng để vẽ. */
export const wavePoint = (w, u) => { const k = clamp(num(u), 0, 1) * num(w.dist); return { x: num(w.x0) + num(w.dx) * k, z: num(w.z0) + num(w.dz) * k }; };

/**
 * Tư thế cánh tay phải khi vung côn (góc xoay quanh trục x của khớp vai; -1,2 = tay duỗi ngang trước mặt như lúc chắp tay, -2,7 = giơ cao, -0,5 = chém xuống thấp).
 * t = giây kể từ lúc bấm. Trả { arm, lean (ngả người về trước), vis (côn có hiện không, 0..1) }.
 * Giai đoạn: nâng côn (0 → 0,6 × RELEASE) → chém xuống nhanh (tới RELEASE) → giữ thế → thu về.
 */
export function swingPose(t) {
  const s = num(t); if (s < 0 || s >= SWING_S + 0.35) return { arm: -1.2, lean: 0, vis: 0 };
  const ease = (k) => k * k * (3 - 2 * k), a = RELEASE_S * 0.6;
  let arm; let lean;
  if (s < a) { const k = ease(s / a); arm = -1.2 + (-2.7 + 1.2) * k; lean = -0.12 * k; }                                    // nâng côn lên cao, ngả nhẹ về sau
  else if (s < RELEASE_S) { const k = (s - a) / (RELEASE_S - a); arm = -2.7 + (-0.5 + 2.7) * k * k; lean = -0.12 + 0.47 * k; }   // chém xuống nhanh, ngả về trước
  else if (s < SWING_S) { arm = -0.5; lean = 0.35; }                                                                          // giữ thế sau đòn
  else { const k = ease((s - SWING_S) / 0.35); arm = -0.5 + (-1.2 + 0.5) * k; lean = 0.35 * (1 - k); }                        // thu về thế chắp tay
  const vis = s < SWING_S + 0.15 ? 1 : clamp(1 - (s - SWING_S - 0.15) / 0.2, 0, 1);
  return { arm, lean, vis };
}
