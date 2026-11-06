// Lồng đèn trẻ em cầm (Phiên 31): logic thuần (không three) để kiểm thử.
import { TAU } from '../util.js';
export const GLOW_BASE = 0.35, GLOW_NIGHT = 1.25;
/** Độ sáng lồng đèn theo độ tối 0..1: 0,35 (ban ngày) → 1,6 (đêm sâu). */
export const lanternGlow = (night) => GLOW_BASE + GLOW_NIGHT * Math.max(0, Math.min(1, night));
/** Góc đung đưa (rad) theo thời gian và tốc độ bước (m/s): đứng yên đung đưa rất nhẹ, đi nhanh thì lắc hơn, tối đa 0,35 rad. */
export const lanternSway = (t, speed, ph = 0) => Math.min(0.35, 0.04 + 0.12 * speed) * Math.sin(t * (2.2 + speed * 2.5) + ph);
/** Nến nhấp nháy nhẹ: hệ số nhân 0,9..1,1. */
export const candleFlicker = (t, ph = 0) => 1 + 0.06 * Math.sin(t * 9 + ph) + 0.04 * Math.sin(t * 15.7 + ph * 2.3);
/** Trẻ chỉ cầm lồng đèn khi là trẻ em (scale < 1). */
export const carriesLantern = (w) => !!(w && w.scale && w.scale < 1);
export const PHASE = (i) => (i * 1.7) % TAU;
