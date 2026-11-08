// Ăn mừng khi hoàn thành nhiệm vụ (Phiên 64): LOGIC THUẦN — quyết định mức ăn mừng, lời, nốt nhạc, số hạt. Có test (tests/celebrate.test.mjs).
// Ba mức: 'small' (xong 1 nhiệm vụ), 'big' (xong nhiều nhiệm vụ cùng lúc hoặc xong cả một CHƯƠNG), 'epic' (lên cấp).
// Giao diện + âm thanh: js/ui/celebrate.js. Các nốt là âm giai ngũ cung (dễ nghe, không chói), tần số Hz.
import { CHAPTERS } from './chapters.js';

export const NOTES = {
  small: [659, 784, 988, 1319],
  big: [523, 659, 784, 1047, 1319, 1568],
  epic: [392, 523, 659, 784, 1047, 1319, 1568, 2093],
};
const SPEC = {
  small: { particles: 46, ms: 3200, flash: 0.18, vibrate: [25, 40, 25], gap: 85 },
  big: { particles: 120, ms: 4300, flash: 0.3, vibrate: [30, 50, 30, 50, 60], gap: 80 },
  epic: { particles: 220, ms: 5600, flash: 0.45, vibrate: [40, 60, 40, 60, 40, 60, 120], gap: 75 },
};

/** Các chương vừa hoàn tất giữa hai lần: before/after = bảng questStatus(); chỉ tính chương có nhiệm vụ (không tính chương 1 cốt truyện). */
export function chaptersJustDone(before, after) {
  const all = (st, c) => c.ids.every((id) => { const r = st.find((x) => x.q.id === id); return !r || r.done; });
  return CHAPTERS.filter((c) => c.ids.length && all(after, c) && !all(before, c)).map((c) => ({ id: c.id, ten: c.ten, n: CHAPTERS.indexOf(c) + 1 }));
}

/** Kế hoạch ăn mừng. done: nhiệm vụ vừa xong [{ten,xp,sen}]; levelUp: {to, ten?, sen} | null; chapters: kết quả chaptersJustDone; xp/sen: tổng vừa nhận (nếu bỏ trống thì cộng từ done).
 *  Trả null nếu chẳng có gì để ăn mừng. */
export function planCelebration({ done = [], levelUp = null, chapters = [], xp = null, sen = null, nextTitle = '' } = {}) {
  const nQ = done.length; if (!nQ && !levelUp && !chapters.length) return null;
  const tier = levelUp ? 'epic' : (chapters.length || nQ >= 2) ? 'big' : 'small';
  const gXp = xp == null ? done.reduce((a, q) => a + (q.xp || 0), 0) : xp, gSen = (sen == null ? done.reduce((a, q) => a + (q.sen || 0), 0) : sen) + (levelUp && levelUp.sen ? 0 : 0);
  let kicker, title, sub;
  if (levelUp) { kicker = 'Chúc mừng!'; title = `Lên cấp ${levelUp.to}${levelUp.ten ? ' · ' + levelUp.ten : ''}`; sub = levelUp.sen ? `Thưởng thêm ${levelUp.sen} hạt sen` : 'Công hạnh tăng tiến'; }
  else if (chapters.length) { const c = chapters[chapters.length - 1]; kicker = `Hoàn thành Chương ${c.n}`; title = c.ten; sub = nextTitle ? `Tiếp theo: ${nextTitle}` : 'Bạn đã đi trọn chương này'; }
  else if (nQ >= 2) { kicker = `Hoàn thành ${nQ} nhiệm vụ`; title = done[0].ten; sub = `và ${nQ - 1} việc khác`; }
  else { kicker = 'Hoàn thành nhiệm vụ'; title = done[0].ten; sub = nextTitle ? `Tiếp theo: ${nextTitle}` : ''; }
  const bits = []; if (gXp) bits.push(`+${gXp} điểm`); if (gSen) bits.push(`+${gSen} hạt sen`); if (levelUp && levelUp.sen) bits.push(`+${levelUp.sen} hạt sen thưởng cấp`);
  return { tier, kicker, title, sub, reward: bits.join(' · '), notes: NOTES[tier].slice(), ...SPEC[tier], chapter: chapters.length ? chapters[chapters.length - 1].n : 0 };
}

/** Hệ số âm lượng hiệu ứng từ cài đặt (sfx 0..1,5; mặc định 0,75 → 1). Tắt tiếng → 0. */
export function sfxGain(settings) { if (!settings || settings.on === false) return 0; return Math.max(0, Math.min(1.5, (settings.sfx == null ? 0.75 : settings.sfx) / 0.75)); }
