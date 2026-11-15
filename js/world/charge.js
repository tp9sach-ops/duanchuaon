// GỒNG LỰC NHẢY (Phiên 197, mục 1 danh sách ptg 15/11): ấn GIỮ nút Nhảy → nhân vật đứng gồng nhún, vòng tròn nhỏ trong nút nở dần; THẢ ra mới bay lên.
// Ấn càng lâu bay càng cao; vòng tròn nở đúng bằng khung tròn của nút = hết tầm (cao tối đa của bậc Khinh thân).
// LOGIC THUẦN (không DOM, không three.js), có test: tests/charge.test.mjs. Mọi con số là QUY ƯỚC TẠM, chờ ptg thử rồi chỉnh (tam: true).
// Nối: js/ui/skill.js (press/release + dáng gồng + biến CSS --jump-ring), css/dock.css (vòng tròn trong nút Nhảy).

export const CHARGE_CFG = Object.freeze({
  tam: true,
  full: 1.2,        // giây ấn giữ để gồng đầy (vòng tròn chạm khung nút)
  minFrac: 0.35,    // bấm nhẹ (không gồng) chỉ nhảy 35% độ cao tối đa của bậc; gồng đầy = 100%
  ringMin: 0.14,    // vòng tròn nhỏ lúc mới bấm = 14% đường kính nút; nở tới 100% khi gồng đầy
  maxHold: 8,       // giây: giữ quá lâu (kẹt chuột/ngón) thì hủy, không nhảy
  squash: 0.17,     // thân thấp xuống tối đa 17% khi gồng đầy
  bulge: 0.06,      // thân phình ngang tối đa 6%
  sink: 0.1,        // m: hạ thấp người khi gồng đầy
  bobHz: 3.2, bobAmp: 0.012,   // nhún nhẹ liên tục khi gồng (chu kỳ/giây, biên độ tỉ lệ thân)
});

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Mức gồng 0..1 sau `t` giây ấn giữ (tăng đều, hơi nhanh lúc đầu rồi chậm dần để dễ canh mức giữa). */
export function chargeLevel(t) {
  const k = clamp(num(t) / CHARGE_CFG.full, 0, 1);
  return k * (1.35 - 0.35 * k);   // đường cong mềm: nhanh lúc đầu, chậm dần; đơn điệu, 0 → 0, 1 → 1
}

/** Tỉ lệ độ cao so với độ cao tối đa của bậc: minFrac (không gồng) → 1 (gồng đầy). */
export const chargeFrac = (c) => CHARGE_CFG.minFrac + (1 - CHARGE_CFG.minFrac) * clamp(num(c), 0, 1);

/** Độ cao nhảy thật (m) = độ cao tối đa của bậc × tỉ lệ gồng. */
export const chargeHeight = (maxH, c) => Math.max(0, num(maxH)) * chargeFrac(c);

/** Đường kính vòng tròn nhỏ trong nút (0..1 so với nút): ringMin lúc mới bấm → 1 khi gồng đầy. */
export const ringScale = (c) => CHARGE_CFG.ringMin + (1 - CHARGE_CFG.ringMin) * clamp(num(c), 0, 1);

/** Gồng đầy chưa? */
export const isFull = (c) => num(c) >= 0.999;

/**
 * Dáng đứng gồng nhún: { sy, sxz, dy } = tỉ lệ cao, tỉ lệ ngang, độ hạ thân (m, ≤ 0). `t` = giây đã gồng (để nhún nhẹ). c = 0 → thân thẳng (1, 1, 0).
 */
export function crouchPose(c, t = 0) {
  const k = clamp(num(c), 0, 1); if (k <= 0) return { sy: 1, sxz: 1, dy: 0 };
  const bob = Math.sin(num(t) * Math.PI * 2 * CHARGE_CFG.bobHz) * CHARGE_CFG.bobAmp * k;
  return { sy: 1 - CHARGE_CFG.squash * k + bob, sxz: 1 + CHARGE_CFG.bulge * k - bob * 0.5, dy: -CHARGE_CFG.sink * k };
}
