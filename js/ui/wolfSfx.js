// Tiếng SÓI KHÍ VÀNG + CHÓ chạy theo (Phiên 227): tổng hợp bằng WebAudio (không cần file) nên luôn có tiếng.
//  howl(level)  — gầm khi sói hiện ra: hai sóng răng cưa lệch nhẹ qua bộ lọc "miệng" mở dần + rung 15 Hz + hơi khàn + tiếng vút khi phóng.
//  bite(strong) — cú ngoạm: răng chạm + xương giòn + thịt nặng + thịch trầm + hàm sập; strong (trúng) thêm tiếng ngân khí "ting" và tiếng gầm ngắn.
//  bark()       — chó sủa hai tiếng (khi bầy chó hiện ra lúc cưỡi Gậy dạy chó).
// Độ lớn theo thanh "Hiệu ứng" trong cài đặt (giống js/ui/sfx.js). Âm thanh không bao giờ được làm sập game. CHƯA nghe trên máy thật — ptg nghe thử rồi chỉnh số.
import { audioCtx } from './sound.js';
import { loadSettings } from './soundLogic.js';
import { sfxGain } from '../world/celebrate.js';

let bus = null, noiseBuf = null;
const volume = () => { try { return sfxGain(loadSettings(localStorage)); } catch (_) { return 1; } };
const ctxOf = () => { try { return audioCtx(); } catch (_) { return null; } };
function busOf(c) {
  if (bus && bus.context === c) return bus;
  try { bus = c.createDynamicsCompressor(); bus.threshold.value = -16; bus.ratio.value = 4; bus.knee.value = 12; bus.connect(c.destination); } catch (_) { bus = null; }
  return bus || c.destination;
}
function noiseOf(c) {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const n = Math.floor(c.sampleRate * 2), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b; return b;
}
// đường bao: 0 → peak trong a giây rồi tắt dần trong d giây
function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function noiseHit(c, out, t, o) {
  const a = o.a === undefined ? 0.004 : o.a, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = noiseOf(c); src.loop = true;
  f.type = o.type || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f0, t);
  if (o.f1 && o.f1 !== o.f0) f.frequency.exponentialRampToValueAtTime(o.f1, t + a + o.d);
  env(g, t, a, o.peak, o.d);
  src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + a + o.d + 0.05);
  src.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
}
function toneHit(c, out, t, o) {
  const a = o.a === undefined ? 0.004 : o.a, osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f0, t);
  if (o.f1 && o.f1 !== o.f0) osc.frequency.exponentialRampToValueAtTime(o.f1, t + a + o.d);
  env(g, t, a, o.peak, o.d);
  let tail = osc;
  if (o.lp) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; osc.connect(lp); tail = lp; }
  tail.connect(g); g.connect(out); osc.start(t); osc.stop(t + a + o.d + 0.05);
  osc.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
}

function howl(level = 1) {
  try {
    const gv = volume() * level; if (!gv) return false;
    const c = ctxOf(); if (!c) return false;
    const t = c.currentTime, out = busOf(c);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 5;
    lp.frequency.setValueAtTime(320, t); lp.frequency.exponentialRampToValueAtTime(1100, t + 0.28); lp.frequency.exponentialRampToValueAtTime(380, t + 0.8);
    const g = c.createGain(); env(g, t, 0.06, 0.34 * gv, 0.72); lp.connect(g); g.connect(out);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 15; lg.gain.value = 9; lfo.connect(lg);
    let last = null;
    for (const det of [1, 1.012]) {
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(82 * det, t); o.frequency.exponentialRampToValueAtTime(128 * det, t + 0.3); o.frequency.exponentialRampToValueAtTime(66 * det, t + 0.8);
      lg.connect(o.frequency); o.connect(lp); o.start(t); o.stop(t + 0.88); last = o;
    }
    lfo.start(t); lfo.stop(t + 0.88);
    if (last) last.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
    noiseHit(c, out, t, { f0: 1300, f1: 900, q: 1.1, a: 0.08, d: 0.55, peak: 0.12 * gv });                 // khàn
    noiseHit(c, out, t + 0.15, { f0: 350, f1: 2400, q: 2.2, a: 0.18, d: 0.32, peak: 0.2 * gv });          // vút khi phóng
    return true;
  } catch (_) { return false; }
}

function bite(strong = true) {
  try {
    const gv = volume(); if (!gv) return false;
    const c = ctxOf(); if (!c) return false;
    const t = c.currentTime, out = busOf(c), k = strong ? 1 : 0.55;
    noiseHit(c, out, t, { type: 'highpass', f0: 1400, q: 0.7, a: 0.002, d: 0.07, peak: 0.45 * gv * k });                         // răng chạm nhau
    noiseHit(c, out, t + 0.012, { f0: 2800, f1: 1500, q: 1.6, a: 0.002, d: 0.1, peak: 0.4 * gv * k });                          // xương giòn
    noiseHit(c, out, t + 0.03, { type: 'lowpass', f0: 1100, f1: 300, q: 0.8, a: 0.004, d: 0.2, peak: 0.5 * gv * k });           // thịt nặng
    toneHit(c, out, t, { type: 'sine', f0: 130, f1: 38, a: 0.003, d: 0.32, peak: 0.85 * gv * k });                              // thịch trầm
    toneHit(c, out, t, { type: 'square', f0: 240, f1: 120, a: 0.002, d: 0.06, peak: 0.1 * gv * k, lp: 1800 });                 // hàm sập
    if (strong) {
      toneHit(c, out, t + 0.02, { type: 'triangle', f0: 520, f1: 515, a: 0.003, d: 0.34, peak: 0.16 * gv });                    // khí vang lên khi trúng
      toneHit(c, out, t + 0.02, { type: 'triangle', f0: 783, f1: 780, a: 0.003, d: 0.28, peak: 0.1 * gv });
      toneHit(c, out, t + 0.04, { type: 'sawtooth', f0: 110, f1: 70, a: 0.01, d: 0.3, peak: 0.2 * gv, lp: 700 });               // gầm ngắn
    }
    return true;
  } catch (_) { return false; }
}

function bark() {
  try {
    const gv = volume(); if (!gv) return false;
    const c = ctxOf(); if (!c) return false;
    const t = c.currentTime, out = busOf(c);
    for (const dt of [0, 0.17]) {
      toneHit(c, out, t + dt, { type: 'sawtooth', f0: 260, f1: 150, a: 0.01, d: 0.12, peak: 0.22 * gv, lp: 900 });
      noiseHit(c, out, t + dt, { f0: 900, f1: 600, q: 1.2, a: 0.005, d: 0.1, peak: 0.12 * gv });
    }
    return true;
  } catch (_) { return false; }
}

export const wolfSfx = { howl, bite, bark };
