// Giao diện: reveal chữ, menu, nút âm thanh, menu mobile.
import { prefersReduced } from './util.js';
import { DAY } from './scene/theme.js';
import { V_MAX, V_STEP, clamp, loadSettings, saveSetting, wantsSound, tryAutoplay, ambientMix, nextDelay } from './ui/soundLogic.js';

export function initReveal() {
  // Tách chữ từng từ cho tiêu đề có data-words
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w, i) =>
      `<span class="word-mask" aria-hidden="true"><span class="word" style="--wd:${i * 55}ms">${w}</span></span>`).join(' ');
    el.dataset.rvWords = '1';
  });
  const targets = document.querySelectorAll('[data-rv], [data-rv-words]');
  if (prefersReduced() || !('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('rv-in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  targets.forEach((t) => io.observe(t));
}

// Menu: nút bánh mì trên điện thoại. Việc mở chương do js/ui/stage.js xử lý (bấm liên kết #chương).
export function initNav() {
  const nav = document.getElementById('nav'), burger = document.getElementById('burger');
  const setMenu = (open) => {
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('nav-open', open);
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
  document.querySelectorAll('.nav-link').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}

// Âm thanh nền: nhạc thiền + chuông + mõ + gió + chim (ngày) + côn trùng và ếch (đêm) + thác nước. Logic tính toán nằm ở js/ui/soundLogic.js (có test).
// - Gọi sớm từ main.js ngay khi trang khởi động: THỬ phát nhạc thật (autoplay). Chỉ coi là "đang phát" khi AudioContext chạy và nhạc thực sự phát.
// - Nếu trình duyệt chặn: hiện lời mời rõ ràng ở giữa-dưới màn hình, phát nhạc ngay ở lần chạm/nhấn phím đầu tiên. Không bao giờ báo "đang phát" khi chưa phát.
// - Mặc định BẬT; ai đã tự tắt thì giữ tắt. Hai thanh âm lượng riêng: Nhạc nền và Hiệu ứng (gió, chim, thác, chuông, mõ...), nhớ lại cho lần sau.
// - Tiếng thay đổi theo vị trí người chơi (window.LGT.getPos) và ngày/đêm (?dem=1 = ban đêm).
let soundCtl = null;
export function initSound() {
  if (soundCtl) return soundCtl;                                     // gọi nhiều lần cũng chỉ dựng một lần
  const btn = document.getElementById('sound');
  if (!btn) return null;
  const MUSIC = 'assets/audio/nhac-nen.m4a';
  const VOL = { music: 0.55, water: 0.5, bell: 0.5, wind: 0.22, birds: 0.35, insects: 0.16, frogs: 0.3, mo: 0.4 };   // mức gốc từng lớp (trước khi nhân âm lượng người chơi)
  const night = !DAY;
  const S = loadSettings(localStorage);                              // { on, music, sfx }
  let want = wantsSound(S), playing = false, userVol = { music: S.music, sfx: S.sfx };
  let ctx = null, master = null, musicG = null, sfxG = null, el = null, g = {}, mixTimer = 0, busy = false;

  const pinkBuffer = (c, sec) => {                                  // nhiễu hồng (Paul Kellet), lặp được
    const n = Math.floor(c.sampleRate * sec), buf = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
      const f = Math.floor(c.sampleRate * 0.25);                    // hòa đầu-đuôi để vòng lặp không "tách"
      for (let i = 0; i < f; i++) { const k = i / f; d[i] = d[i] * k + d[n - f + i] * (1 - k); }
    }
    return buf;
  };
  const noiseLoop = (c, sec) => { const s = c.createBufferSource(); s.buffer = pinkBuffer(c, sec); s.loop = true; return s; };
  const waterfall = (c, out) => {
    const src = noiseLoop(c, 6);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 220;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
    const body = c.createGain(); body.gain.value = 1;
    src.connect(hp); hp.connect(lp); lp.connect(body); body.connect(out);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.17; lg.gain.value = 0.12;   // nước dâng nhẹ, không đều tăm tắp
    lfo.connect(lg); lg.connect(body.gain);
    const lfo2 = c.createOscillator(), lg2 = c.createGain(); lfo2.frequency.value = 0.05; lg2.gain.value = 900;
    lfo2.connect(lg2); lg2.connect(lp.frequency);
    src.start(); lfo.start(); lfo2.start();
  };
  const wind = (c, out) => {                                        // gió: nhiễu lọc thấp, độ lớn và tần số trôi chậm theo hai LFO
    const src = noiseLoop(c, 8);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.7;
    const body = c.createGain(); body.gain.value = 0.7;
    src.connect(lp); lp.connect(body); body.connect(out);
    const l1 = c.createOscillator(), a1 = c.createGain(); l1.frequency.value = 0.09; a1.gain.value = 0.3; l1.connect(a1); a1.connect(body.gain);
    const l2 = c.createOscillator(), a2 = c.createGain(); l2.frequency.value = 0.037; a2.gain.value = 350; l2.connect(a2); a2.connect(lp.frequency);
    src.start(); l1.start(); l2.start();
  };
  const crickets = (c, out) => {                                    // côn trùng đêm: tiếng cao ~4,3 kHz ngắt nhịp nhanh, hai "con" lệch nhịp
    [[4300, 5.3], [3900, 6.7]].forEach(([f, rate]) => {
      const o = c.createOscillator(), gate = c.createGain(), lfo = c.createOscillator(), depth = c.createGain();
      o.type = 'sine'; o.frequency.value = f; gate.gain.value = 0.5;
      lfo.type = 'square'; lfo.frequency.value = rate; depth.gain.value = 0.5; lfo.connect(depth); depth.connect(gate.gain);
      o.connect(gate); gate.connect(out); o.start(); lfo.start();
    });
  };
  const tone = (freq, dur, { type = 'sine', gain = 0.3, slide = 0, to = null, at = 0, lp = 0 } = {}) => {   // một nốt ngắn đi vào lớp hiệu ứng
    if (!ctx) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), e = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur); else if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(gain, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let last = o; if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); last = f; }
    last.connect(e); e.connect(g.out); o.start(t); o.stop(t + dur + 0.05);
  };
  const ringBell = () => {                                          // một hồi chuông: các hài âm lệch + ngân dài
    const base = [196, 220, 233][Math.floor(Math.random() * 3)], t = ctx.currentTime + 0.02;
    [[1, 0.5, 11], [2.01, 0.28, 8], [2.76, 0.16, 6], [4.07, 0.1, 4], [5.4, 0.06, 3], [6.8, 0.03, 2]].forEach(([m, gn, d], i) => {
      [0, 1.1].forEach((beat) => {                                  // hai dao động lệch nhẹ nhau -> tiếng ngân "ù ù" của chuông đồng
        const o = ctx.createOscillator(), e = ctx.createGain();
        o.type = 'sine'; o.frequency.value = base * m + beat * (0.6 + i * 0.2);
        e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(gn / 2, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(e); e.connect(g.bell); o.start(t); o.stop(t + d + 0.1);
      });
    });
  };
  const chirp = () => {                                             // chim: 2–4 nốt cao, trượt tần số
    const base = 2200 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) tone(base * (1 + 0.12 * i), 0.09, { gain: 0.5, to: base * (1.25 + 0.12 * i), at: i * 0.13 });
  };
  const frog = () => {                                              // ếch: "ộp ộp" thấp, 2–3 tiếng
    const n = 2 + Math.floor(Math.random() * 2), f = 140 + Math.random() * 60;
    for (let i = 0; i < n; i++) tone(f, 0.16, { type: 'sawtooth', gain: 0.4, to: f * 0.7, at: i * 0.24, lp: 520 });
  };
  const knock = () => { for (let i = 0; i < 3; i++) { tone(520, 0.14, { type: 'triangle', gain: 0.5, to: 330, at: i * 0.55 }); tone(260, 0.18, { gain: 0.25, at: i * 0.55 }); } };   // mõ: ba tiếng
  const timers = {};
  const schedule = (kind, fn, gainKey, first) => {                  // mỗi lớp ngẫu nhiên tự hẹn giờ; chỉ kêu khi đang phát và lớp đó đủ lớn
    clearTimeout(timers[kind]);
    if (!playing) return;
    const mixed = g.mix ? g.mix[gainKey] : 0;
    timers[kind] = setTimeout(() => {
      if (playing && ctx && ctx.state === 'running' && (g.mix ? g.mix[gainKey] : 0) > 0.08) fn();
      schedule(kind, fn, gainKey, false);
    }, (first ? 2 + Math.random() * 3 : nextDelay(kind, mixed)) * 1000);
  };
  const startRandoms = () => {
    schedule('bell', ringBell, 'bell', true); schedule('mo', knock, 'mo', true);
    if (night) schedule('frogs', frog, 'frogs', true); else schedule('birds', chirp, 'birds', true);
  };
  const stopRandoms = () => Object.keys(timers).forEach((k) => clearTimeout(timers[k]));

  // Cập nhật độ lớn từng lớp theo vị trí/ngày đêm (4 lần/giây là đủ).
  const updateMix = () => {
    if (!ctx || !playing) return;
    const p = window.LGT && typeof window.LGT.getPos === 'function' ? window.LGT.getPos() : null;
    const m = ambientMix({ p, night }); g.mix = m;
    const t = ctx.currentTime;
    ['water', 'bell', 'wind', 'insects'].forEach((k) => g[k].gain.setTargetAtTime(VOL[k] * m[k], t, 0.3));
    g.out.gain.setTargetAtTime(1, t, 0.3);                           // chim, ếch, mõ đi thẳng vào g.out, độ lớn đã nằm trong tần suất kêu
  };

  const build = () => {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    musicG = ctx.createGain(); musicG.gain.value = VOL.music * userVol.music; musicG.connect(master);
    sfxG = ctx.createGain(); sfxG.gain.value = userVol.sfx; sfxG.connect(master);
    ['water', 'bell', 'wind', 'insects'].forEach((k) => { g[k] = ctx.createGain(); g[k].gain.value = 0; g[k].connect(sfxG); });
    g.out = ctx.createGain(); g.out.gain.value = 0.35; g.out.connect(sfxG);   // chim/ếch/mõ
    waterfall(ctx, g.water); wind(ctx, g.wind); if (night) crickets(ctx, g.insects);
    el = new Audio(MUSIC); el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous';
    ctx.createMediaElementSource(el).connect(musicG);
    mixTimer = setInterval(updateMix, 250);
  };

  // --- giao diện: lời mời bật âm thanh (chỉ khi bị chặn) + bảng hai thanh âm lượng
  const invite = document.createElement('button');
  invite.type = 'button'; invite.id = 'sound-invite'; invite.hidden = true;
  invite.setAttribute('aria-live', 'polite');
  invite.style.cssText = 'position:fixed;left:50%;bottom:calc(86px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:130;max-width:min(92vw,420px);padding:12px 20px;border-radius:999px;border:1px solid rgba(217,178,95,.85);background:rgba(8,10,20,.88);color:#f3e4b8;font:500 14px/1.35 system-ui,sans-serif;text-align:center;cursor:pointer;box-shadow:0 6px 28px rgba(0,0,0,.5),0 0 0 4px rgba(217,178,95,.14);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:sndPulse 2.2s ease-in-out infinite;';
  invite.textContent = '🔔 Chạm vào màn hình để bật nhạc chùa';
  const st = document.createElement('style'); st.textContent = '@keyframes sndPulse{0%,100%{box-shadow:0 6px 28px rgba(0,0,0,.5),0 0 0 4px rgba(217,178,95,.14)}50%{box-shadow:0 6px 28px rgba(0,0,0,.5),0 0 0 9px rgba(217,178,95,.28)}}@media (prefers-reduced-motion:reduce){#sound-invite{animation:none!important}}';
  document.head.appendChild(st); document.body.appendChild(invite);

  const panel = document.createElement('div');
  panel.className = 'sound-vol'; panel.hidden = true;
  panel.style.cssText = 'position:fixed;z-index:60;display:none;flex-direction:column;gap:8px;padding:10px 12px;border-radius:12px;border:1px solid rgba(217,178,95,.45);background:rgba(8,10,20,.78);color:#e8eaf2;font:500 12px/1 system-ui,sans-serif;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);';
  const row = (label, key) => {
    const w = document.createElement('label'); w.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const t = document.createElement('span'); t.textContent = label; t.style.cssText = 'width:62px;';
    const r = document.createElement('input'); r.type = 'range'; r.min = '0'; r.max = String(V_MAX); r.step = String(V_STEP / 3); r.value = String(userVol[key]);
    r.style.cssText = 'width:96px;accent-color:#d9b25f;'; r.setAttribute('aria-label', label);
    const v = document.createElement('span'); v.style.cssText = 'width:34px;text-align:right;';
    const show = () => { v.textContent = Math.round(userVol[key] / V_MAX * 100) + '%'; };
    r.addEventListener('input', () => { userVol[key] = clamp(parseFloat(r.value), 0, V_MAX); show(); saveSetting(localStorage, key, userVol[key]); applyVolumes(); });
    show(); w.append(t, r, v); return w;
  };
  panel.append(row('Nhạc nền', 'music'), row('Hiệu ứng', 'sfx'));
  const tog = document.createElement('button'); tog.type = 'button'; tog.textContent = '♪'; tog.setAttribute('aria-label', 'Chỉnh âm lượng nhạc nền và hiệu ứng'); tog.setAttribute('aria-expanded', 'false');
  tog.style.cssText = 'position:fixed;z-index:60;display:none;width:28px;height:28px;padding:0;border-radius:50%;border:1px solid rgba(217,178,95,.55);background:rgba(8,10,20,.6);color:#e8eaf2;font:600 14px/1 system-ui,sans-serif;cursor:pointer;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);';
  document.body.append(panel, tog);
  let open = false;
  const stopEv = (e) => e.stopPropagation();
  [tog, panel].forEach((n) => ['pointerdown', 'touchend'].forEach((ev) => n.addEventListener(ev, stopEv)));
  tog.addEventListener('click', (e) => { e.stopPropagation(); open = !open; tog.setAttribute('aria-expanded', String(open)); place(); });
  const place = () => {                                              // bám theo nút Âm thanh (nút ♪ bên phải nút, bảng nằm phía trên)
    const r = btn.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(btn).visibility === 'hidden') { tog.style.display = 'none'; panel.style.display = 'none'; return; }
    tog.style.display = 'flex'; const left = r.right + 8 + 28 > innerWidth - 4 ? r.left - 8 - 28 : r.right + 8;
    tog.style.left = Math.max(4, left) + 'px'; tog.style.top = (r.top + (r.height - 28) / 2) + 'px';
    panel.style.display = open ? 'flex' : 'none';
    if (open) { const w = panel.offsetWidth || 220; panel.style.left = Math.max(4, Math.min(innerWidth - w - 4, r.left)) + 'px'; panel.style.top = Math.max(4, r.top - (panel.offsetHeight || 80) - 10) + 'px'; }
  };
  setInterval(place, 800); addEventListener('resize', place); place();

  const applyVolumes = () => {
    if (!ctx) return;
    const t = ctx.currentTime;
    musicG.gain.setTargetAtTime(VOL.music * userVol.music, t, 0.1); sfxG.gain.setTargetAtTime(userVol.sfx, t, 0.1);
  };
  const render = () => {                                             // nút và lời mời luôn phản ánh sự thật: đang phát, hay đang bị chặn
    btn.setAttribute('aria-pressed', String(playing));
    btn.dataset.state = playing ? 'playing' : want ? 'blocked' : 'off';
    btn.setAttribute('aria-label', playing ? 'Tắt âm thanh nền' : want ? 'Bật âm thanh nền (trình duyệt đang chặn, chạm để bật)' : 'Bật âm thanh nền');
    invite.hidden = !(want && !playing);
  };
  const goPlaying = () => {
    playing = true; master.gain.setTargetAtTime(1, ctx.currentTime, 0.35);
    updateMix(); startRandoms(); render();
  };
  // Thử bật nhạc (autoplay lúc khởi động, hoặc trong cử chỉ chạm của người chơi). Trả về true khi nhạc THỰC SỰ đang phát.
  const attempt = async () => {
    if (!want || playing || busy) return playing;
    busy = true;
    try {
      if (!ctx) build();
      const r = await tryAutoplay(ctx, el);
      if (r.playing && want) goPlaying(); else render();
      return r.playing;
    } catch (_) { render(); return false; } finally { busy = false; }
  };
  const turnOff = () => {
    want = false; playing = false; stopRandoms();
    if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => { if (!playing && el) el.pause(); }, 1500); }
    render();
  };

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (playing) { saveSetting(localStorage, 'on', false); turnOff(); return; }
    want = true; saveSetting(localStorage, 'on', true); render();
    if (!(await attempt())) render();                                // bấm nút là cử chỉ người chơi nên thường phát được; nếu vẫn bị chặn thì lời mời còn đó
  });
  invite.addEventListener('click', (e) => { e.stopPropagation(); attempt(); });

  // Bị chặn autoplay: chạm/nhấn phím lần đầu thì phát ngay (iOS Safari chỉ mở âm thanh ở touchend/click). Gỡ khi nhạc đã thực sự phát.
  const EVS = ['pointerdown', 'touchend', 'click', 'keydown'];
  const detach = () => EVS.forEach((n) => removeEventListener(n, onGesture, true));
  function onGesture(e) {
    if (!want) { detach(); return; }
    if (e && e.target && e.target.closest && e.target.closest('#sound, .sound-vol, #sound-invite')) return;   // các nút âm thanh tự xử lý
    attempt().then((ok) => { if (ok) detach(); });
  }
  if (want) EVS.forEach((n) => addEventListener(n, onGesture, true));

  document.addEventListener('visibilitychange', () => {              // đổi tab / khóa màn hình: tạm dừng nhạc cho đỡ tốn pin
    if (!el || !playing) return;
    if (document.hidden) el.pause(); else el.play().catch(() => { playing = false; render(); });
  });

  render();
  soundCtl = { attempt, get playing() { return playing; }, get state() { return btn.dataset.state; } };
  if (want) attempt();                                               // THỬ AUTOPLAY NGAY khi khởi động; bị chặn thì lời mời hiện sẵn (render ở trên) và chờ cử chỉ đầu tiên
  return soundCtl;
}
