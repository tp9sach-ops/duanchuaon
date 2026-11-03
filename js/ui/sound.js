// Âm thanh tổng hợp bằng Web Audio (mõ, chuông, tiếng hạt). Chỉ tạo AudioContext sau lần bấm đầu tiên (luật autoplay).
let ac = null;
const audio = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; };
export function tone(freq, dur, { type = 'sine', gain = 0.3, decay = dur, slide = 0 } = {}) {
  const c = audio(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
export const moSound = () => { tone(520, 0.16, { type: 'triangle', gain: 0.35, decay: 0.14, slide: -180 }); tone(260, 0.2, { gain: 0.18, decay: 0.18 }); };
export const bellSound = () => [[196, 0.28, 3.2], [392, 0.12, 2.6], [587, 0.07, 2], [823, 0.04, 1.4]].forEach(([f, g, d]) => tone(f, d, { gain: g, decay: d }));
export const beadSound = () => tone(880, 0.06, { type: 'triangle', gain: 0.12, decay: 0.05, slide: -260 });
