// Phát tiếng kỹ năng / chiến đấu từ file thật (Phiên 109). Danh sách cue + luật: js/world/sfx.js (có test).
// - Tải file lười: lần chạm/bấm phím đầu tiên mới tải (luật autoplay), tổng ~290 KB. File chưa có hoặc mạng lỗi → phát tiếng tổng hợp dự phòng (như trước Phiên 109), game không im lặng.
// - Độ lớn theo thanh "Hiệu ứng" trong cài đặt (cùng cách thietDau/conKhi/celebrate vẫn dùng: sfxGain(loadSettings())). Tắt tiếng → không phát.
// - Dùng chung AudioContext của js/ui/sound.js; qua một bộ nén nhẹ để nhiều tiếng chồng nhau không vỡ.
// Gọi từ mã khác: window.LGT.sfx.play('thuong').
import { audioCtx, tone } from './sound.js';
import { loadSettings } from './soundLogic.js';
import { sfxGain } from '../world/celebrate.js';
import { SFX_IDS, sfxUrl, planCue, fallbackOf, gapOf } from '../world/sfx.js';
import { WIND_SND, windFilterHz, windGainOf } from '../world/windFxMath.js';   // Phiên 204: tiếng gió / vút / đạp gió tổng hợp (không cần file)
import { KHO_AM } from '../data/chieuAmKho.js';   // Phiên 173: kho âm thanh chiêu thức (assets/sfx/chieu/*.m4a)

const MAX_VOICES = 8, RETRY_MS = 30000;

export function initSfx() {
  const LGT = window.LGT || (window.LGT = {});
  if (LGT.sfx) return LGT.sfx;
  const bufs = new Map(), tries = new Map(), lastAt = new Map();
  let bus = null, voices = 0, started = false;

  const volume = () => { try { return sfxGain(loadSettings(localStorage)); } catch (_) { return 1; } };
  const ctxOf = () => { try { return audioCtx(); } catch (_) { return null; } };
  function busOf(c) {
    if (bus && bus.context === c) return bus;
    try { bus = c.createDynamicsCompressor(); bus.threshold.value = -14; bus.ratio.value = 4; bus.knee.value = 12; bus.connect(c.destination); } catch (_) { bus = null; }
    return bus;
  }
  function load(id) {   // tải + giải mã một file; lỗi thì nhớ thời điểm để 30 giây sau mới thử lại
    if (bufs.has(id)) return Promise.resolve(bufs.get(id));
    const c = ctxOf(); if (!c) return Promise.resolve(null);
    const t = tries.get(id); if (t && t.p) return t.p; if (t && Date.now() - t.at < RETRY_MS) return Promise.resolve(null);
    const p = fetch(KHO_AM[id] ? KHO_AM[id].file : sfxUrl(id)).then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
      .then((ab) => new Promise((ok, no) => { const pr = c.decodeAudioData(ab, ok, no); if (pr && pr.catch) pr.catch(no); }))   // dạng callback cho Safari cũ
      .then((b) => { bufs.set(id, b); tries.delete(id); return b; })
      .catch(() => { tries.set(id, { at: Date.now(), p: null }); return null; });
    tries.set(id, { at: Date.now(), p });
    return p;
  }
  function preload() { if (started) return; started = true; SFX_IDS.forEach((id) => { load(id); }); }

  function synth(name, gv) { for (const [f, d, o] of fallbackOf(name)) tone(f, d, { ...o, gain: (o && o.gain ? o.gain : 0.1) * gv }); }

  function play(name) {
    try {
      const gv = volume(); if (!gv) return false;
      const now = performance.now(), gap = gapOf(name); if (now - (lastAt.get(name) || -1e9) < gap) return false; lastAt.set(name, now);
      const plan = planCue(name, { volume: gv }); if (!plan.length) return false;
      const c = ctxOf(); if (!c) return false;
      if (!started) preload();
      const out = busOf(c) || c.destination; let usedSynth = false;
      for (const p of plan) {
        const b = bufs.get(p.file);
        if (!b) { if (!usedSynth) { usedSynth = true; synth(name, gv); } continue; }   // chưa tải xong / file thiếu: tiếng tổng hợp thay, đúng một lần cho cả cue
        if (voices >= MAX_VOICES) continue;
        const src = c.createBufferSource(), g = c.createGain(); src.buffer = b; src.playbackRate.value = p.rate; g.gain.value = p.gain;
        src.connect(g); g.connect(out); voices++; src.onended = () => { voices = Math.max(0, voices - 1); try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
        src.start(c.currentTime + Math.max(0, p.delay));
      }
      return true;
    } catch (_) { return false; }   // âm thanh không bao giờ được làm sập game
  }

  // Tải trước ngay lần chạm / bấm phím đầu tiên của người chơi (trình duyệt cho phép tạo AudioContext từ lúc này)
  const first = () => { removeEventListener('pointerdown', first, true); removeEventListener('keydown', first, true); try { ctxOf(); preload(); } catch (_) { /* bỏ qua */ } };
  addEventListener('pointerdown', first, true); addEventListener('keydown', first, true);

  /** Phiên 173: phát MỘT file trong kho chiêu thức (id ở js/data/chieuAmKho.js) với độ lớn gain 0..1 và trễ delay giây. Chưa tải thì tải rồi phát ngay khi xong; không bao giờ làm sập game. */
  function playFile(id, { gain = 1, delay = 0 } = {}) {
    try {
      const gv = volume(); if (!gv || !KHO_AM[id]) return false;
      const c = ctxOf(); if (!c) return false;
      const go = (b) => {
        if (!b || voices >= MAX_VOICES) return;
        const src = c.createBufferSource(), g = c.createGain(); src.buffer = b; g.gain.value = Math.min(1, Math.max(0, gain * gv));
        src.connect(g); g.connect(busOf(c) || c.destination); voices++; src.onended = () => { voices = Math.max(0, voices - 1); try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
        src.start(c.currentTime + Math.max(0, delay));
      };
      const b = bufs.get(id); if (b) go(b); else load(id).then(go);
      return true;
    } catch (_) { return false; }
  }
  /** Tải trước các file chiêu thức (gọi lúc bắt đầu gồng để tiếng phát/trúng/dư âm kịp có). */
  function preloadFiles(ids) { try { (ids || []).forEach((id) => { if (KHO_AM[id]) load(id); }); } catch (_) { /* bỏ qua */ } }

  // ── Phiên 204: tiếng gió bay lướt, tổng hợp bằng nhiễu lọc (WebAudio) — luôn có tiếng, không phụ thuộc file ──
  let noiseBuf = null, windN = null;
  const noiseOf = (c) => { if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf; const n = Math.floor(c.sampleRate * 2), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; noiseBuf = b; return b; };
  /** 'bay' = tiếng vút khi bắt đầu lướt; 'dap' = cú đạp gió (xì ngắn + thịch trầm). */
  function gust(kind) {
    try {
      const gv = volume(); if (!gv) return false; const sp = WIND_SND[kind]; if (!sp) return false;
      const c = ctxOf(); if (!c) return false; const t = c.currentTime, out = busOf(c) || c.destination;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = noiseOf(c); src.loop = true;
      f.type = kind === 'dap' ? 'bandpass' : 'bandpass'; f.Q.value = sp.q; f.frequency.setValueAtTime(sp.f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, sp.f1), t + sp.dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(sp.gain * gv, t + sp.dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + sp.dur);
      src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + sp.dur + 0.05); src.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
      if (sp.thump) { const o = c.createOscillator(), og = c.createGain(), th = sp.thump; o.type = 'sine'; o.frequency.setValueAtTime(th.f0, t); o.frequency.exponentialRampToValueAtTime(th.f1, t + th.dur); og.gain.setValueAtTime(th.gain * gv, t); og.gain.exponentialRampToValueAtTime(0.0001, t + th.dur); o.connect(og); og.connect(out); o.start(t); o.stop(t + th.dur + 0.05); }
      return true;
    } catch (_) { return false; }
  }
  /** Vòng lặp tiếng gió khi đang bay: windStart() → windSet(mức 0..1) mỗi khung → windStop(). */
  function windStart() {
    try {
      if (windN) return true; const gv = volume(); if (!gv) return false; const c = ctxOf(); if (!c) return false;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = noiseOf(c); src.loop = true; f.type = 'bandpass'; f.Q.value = WIND_SND.q; f.frequency.value = windFilterHz(0.3); g.gain.value = 0.0001;
      src.connect(f); f.connect(g); g.connect(busOf(c) || c.destination); src.start(); windN = { src, f, g, c }; return true;
    } catch (_) { return false; }
  }
  function windSet(lv) {
    try { if (!windN) return; const { f, g, c } = windN, t = c.currentTime, gv = volume(); f.frequency.setTargetAtTime(windFilterHz(lv), t, 0.08); g.gain.setTargetAtTime(Math.max(0.0001, windGainOf(lv) * gv), t, WIND_SND.attack * 0.5); } catch (_) { /* bỏ qua */ }
  }
  function windStop() {
    try { if (!windN) return; const { src, g, c } = windN; windN = null; const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0.0001, t, WIND_SND.release * 0.3); src.stop(t + WIND_SND.release + 0.2); src.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } }; } catch (_) { windN = null; }
  }

  // ── Phiên 224: tiếng GỖ khi đánh bằng Gậy dạy chó, tổng hợp (không cần file): "cộp" = nhiễu lọc ngắn (va chạm) + thân gỗ rỗng (sin tụt nhanh). step 1..3: đòn càng sau càng trầm, đòn 3 nặng + dư âm. ──
  function wood(step = 1) {
    try {
      const gv = volume(); if (!gv) return false; const c = ctxOf(); if (!c) return false; const t = c.currentTime, out = busOf(c) || c.destination;
      const k = Math.max(1, Math.min(3, Math.round(+step) || 1)), f0 = [460, 400, 300][k - 1], heavy = k === 3;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = noiseOf(c); f.type = 'bandpass'; f.Q.value = 2.4; f.frequency.setValueAtTime(f0 * 3.2, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55 * gv, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + 0.1); src.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
      for (const [mul, gn, dur] of heavy ? [[1, 0.5, 0.26], [1.52, 0.22, 0.16], [0.5, 0.3, 0.34]] : [[1, 0.42, 0.14], [1.52, 0.16, 0.09]]) {
        const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0 * mul * 1.18, t); o.frequency.exponentialRampToValueAtTime(f0 * mul, t + 0.03);
        og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(gn * gv, t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(og); og.connect(out); o.start(t); o.stop(t + dur + 0.05); o.onended = () => { try { og.disconnect(); } catch (_) { /* đã ngắt */ } };
      }
      return true;
    } catch (_) { return false; }
  }

  // ── Phiên 230: tiếng CHỔI, tổng hợp: "xào" quét lá = nhiễu lọc quét tần (sweep), "xột xoạt" = hai nhịp nhiễu ngắn dội nhau, đòn 3 (đập chổi) thêm cú "bịch" trầm + lá xào xạc.
  function noiseBurst(c, out, t, f1, f2, q, dur, peak) {
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = noiseOf(c); f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + dur + 0.05); src.onended = () => { try { g.disconnect(); } catch (_) { /* đã ngắt */ } };
  }
  function broom(step = 1) {
    try {
      const gv = volume(); if (!gv) return false; const c = ctxOf(); if (!c) return false; const t = c.currentTime, out = busOf(c) || c.destination, k = Math.max(1, Math.min(3, Math.round(+step) || 1));
      noiseBurst(c, out, t, 1800, 5200, 0.9, 0.22, 0.34 * gv);                   // quét lá: "xoạt" lướt lên cao
      noiseBurst(c, out, t + 0.1, 4200, 2200, 1.4, 0.12, 0.2 * gv);              // "xột" dội lại
      if (k === 3) {
        noiseBurst(c, out, t + 0.28, 900, 260, 1.1, 0.2, 0.5 * gv);              // đập xuống: nhiễu trầm
        const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(120, t + 0.28); o.frequency.exponentialRampToValueAtTime(48, t + 0.5);
        og.gain.setValueAtTime(0.0001, t + 0.28); og.gain.exponentialRampToValueAtTime(0.55 * gv, t + 0.3); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        o.connect(og); og.connect(out); o.start(t + 0.28); o.stop(t + 0.6); o.onended = () => { try { og.disconnect(); } catch (_) { /* đã ngắt */ } };
        noiseBurst(c, out, t + 0.34, 3000, 6500, 0.7, 0.5, 0.22 * gv);           // lá cát xào xạc rơi lại
      }
      return true;
    } catch (_) { return false; }
  }

  LGT.sfx = { play, playFile, preloadFiles, preload, gust, wood, windStart, windSet, windStop, broom, get loaded() { return bufs.size; } };
  return LGT.sfx;
}
