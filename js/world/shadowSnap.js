// Bóng đổ ổn định (Phiên 28b): hàm THUẦN, có test (tests/shadowSnap.test.mjs). Cảnh 3D dùng ở js/scene/index.js.
// Lỗi gốc: vùng đổ bóng đi theo người chơi từng khung nên mép bóng "bò" từng texel (răng cưa nhấp nháy khi đi), và khi nắng thấp thì bóng lẹm sọc ngang trên nền (shadow acne).
// Cách sửa: (1) nhích tâm vùng bóng theo từng texel của bản đồ bóng (không nhích mịn nữa); (2) độ lệch bóng (bias) tăng khi nắng thấp.
export const SHADOW_R = 40;                 // nửa cạnh vùng đổ bóng quanh người chơi (m); nhỏ hơn bản cũ (46) nên mỗi texel mịn hơn ~13%
export const SUN_MIN_Y = 0.28;              // lightDir không bao giờ thấp hơn mức này (daycycle.js)

const norm = (v) => { const L = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / L, y: v.y / L, z: v.z / L }; };

/** Làm tròn điểm mặt đất (x, 0, z) tới lưới texel trong mặt phẳng ngang của camera bóng.
 *  `dir` = hướng từ mặt đất tới đèn (cùng chiều sunOffset); `texel` = cạnh một texel (m) = 2·SHADOW_R / kích thước bản đồ bóng.
 *  Trả { x, y, z }: điểm mục tiêu mới (lệch ít hơn 1 texel theo mỗi trục của đèn). Cùng điểm vào/ra ổn định, đi dọc nền thì nhảy từng bậc. */
export function snapToTexel(x, z, dir, texel) {
  const d = norm(dir), f = { x: -d.x, y: -d.y, z: -d.z };                       // đèn nhìn về phía mặt đất
  let rx = -f.z, rz = f.x; const rl = Math.hypot(rx, rz);
  if (rl < 1e-6) { rx = 1; rz = 0; } else { rx /= rl; rz /= rl; }                // phải = f × (0,1,0)
  const u = { x: -rz * f.y, y: rz * f.x - rx * f.z, z: rx * f.y };               // lên = phải × f
  const a = x * rx + z * rz, b = x * u.x + z * u.z, da = Math.round(a / texel) * texel - a, db = Math.round(b / texel) * texel - b;
  return { x: x + da * rx + db * u.x, y: db * u.y, z: z + da * rz + db * u.z };
}

/** Độ lệch bóng theo độ cao nắng (y của hướng đèn đã chuẩn hóa, ≥ SUN_MIN_Y). Nắng càng thấp càng cần lệch nhiều để hết sọc;
 *  không lệch quá tay (normalBias ≤ 0,2 m ≈ 5 texel) để bóng không rời chân vật. */
export function shadowBias(sunY) {
  const g = Math.min(1, Math.max(0, 1 - (sunY - SUN_MIN_Y) / 0.5));              // 1 khi nắng thấp nhất, 0 khi từ ~30° trở lên
  return { bias: -0.0006 - 0.0006 * g, normalBias: 0.05 + 0.15 * g };
}
