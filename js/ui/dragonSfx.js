// Tiếng RỒNG HỒNG (Phiên 227): tổng hợp bằng WebAudio (không cần file) nên luôn có tiếng.
//  roar(level) — rồng hiện ra: tiếng gầm trầm rồi vút lên cao (răng cưa qua bộ lọc mở dần) + tiếng gió vút.
//  hit()       — rồng trúng quái: tiếng "vút" cắt gió + chuông ngân hai nốt + thịch trầm.
// Độ lớn theo thanh "Hiệu ứng" trong cài đặt. Âm thanh không bao giờ được làm sập game. CHƯA nghe trên máy thật — ptg nghe thử rồi chỉnh số.
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
const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
function noiseHit(c, out, t, o) {
  const a = o.a === undefined ? 0.004 : o.a, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = noiseOf(c); src.loop = true; f.type = o.type || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f0, t);
  if (o.f1 && o.f1 !== o.f0) f.frequency.exponentialRampToValueAtTime(o.f1, t + a + o.d);
  env(g, t, a, o.peak, o.d); src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + a + o.d + 0.05);
  src.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
}
function toneHit(c, out, t, o) {
  const a = o.a === undefined ? 0.004 : o.a, osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f0, t);
  if (o.f1 && o.f1 !== o.f0) osc.frequency.exponentialRampToValueAtTime(o.f1, t + a + o.d);
  env(g, t, a, o.peak, o.d); osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + a + o.d + 0.05);
  osc.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
}

function roar(level = 1) {
  try {
    const gv = volume() * level; if (!gv) return false;
    const c = ctxOf(); if (!c) return false;
    const t = c.currentTime, out = busOf(c);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
    lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(1900, t + 0.35); lp.frequency.exponentialRampToValueAtTime(600, t + 0.75);
    const g = c.createGain(); env(g, t, 0.08, 0.3 * gv, 0.7); lp.connect(g); g.connect(out);
    for (const det of [1, 1.015]) {
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(110 * det, t); o.frequency.exponentialRampToValueAtTime(300 * det, t + 0.35); o.frequency.exponentialRampToValueAtTime(130 * det, t + 0.8);
      o.connect(lp); o.start(t); o.stop(t + 0.85); o.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
    }
    noiseHit(c, out, t + 0.1, { f0: 500, f1: 3200, q: 2, a: 0.2, d: 0.45, peak: 0.16 * gv });   // gió vút
    return true;
  } catch (_) { return false; }
}

function hit() {
  try {
    const gv = volume(); if (!gv) return false;
    const c = ctxOf(); if (!c) return false;
    const t = c.currentTime, out = busOf(c);
    noiseHit(c, out, t, { f0: 3400, f1: 900, q: 1.4, a: 0.003, d: 0.16, peak: 0.4 * gv });                       // vút cắt gió
    toneHit(c, out, t + 0.01, { type: 'triangle', f0: 880, f1: 870, a: 0.004, d: 0.4, peak: 0.2 * gv });         // chuông ngân
    toneHit(c, out, t + 0.03, { type: 'triangle', f0: 1320, f1: 1310, a: 0.004, d: 0.34, peak: 0.13 * gv });
    toneHit(c, out, t, { type: 'sine', f0: 170, f1: 55, a: 0.003, d: 0.25, peak: 0.6 * gv });                    // thịch trầm
    return true;
  } catch (_) { return false; }
}

export const dragonSfx = { roar, hit };
