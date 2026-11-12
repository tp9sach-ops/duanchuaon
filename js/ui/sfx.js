// Phát tiếng kỹ năng / chiến đấu từ file thật (Phiên 109). Danh sách cue + luật: js/world/sfx.js (có test).
// - Tải file lười: lần chạm/bấm phím đầu tiên mới tải (luật autoplay), tổng ~290 KB. File chưa có hoặc mạng lỗi → phát tiếng tổng hợp dự phòng (như trước Phiên 109), game không im lặng.
// - Độ lớn theo thanh "Hiệu ứng" trong cài đặt (cùng cách thietDau/conKhi/celebrate vẫn dùng: sfxGain(loadSettings())). Tắt tiếng → không phát.
// - Dùng chung AudioContext của js/ui/sound.js; qua một bộ nén nhẹ để nhiều tiếng chồng nhau không vỡ.
// Gọi từ mã khác: window.LGT.sfx.play('thuong').
import { audioCtx, tone } from './sound.js';
import { loadSettings } from './soundLogic.js';
import { sfxGain } from '../world/celebrate.js';
import { SFX_IDS, sfxUrl, planCue, fallbackOf, gapOf } from '../world/sfx.js';

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
    const p = fetch(sfxUrl(id)).then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
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

  LGT.sfx = { play, preload, get loaded() { return bufs.size; } };
  return LGT.sfx;
}
