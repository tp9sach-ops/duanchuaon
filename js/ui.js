// Giao diện: reveal chữ, menu, nút âm thanh, menu mobile.
import { prefersReduced } from './util.js';
import { DAY } from './scene/theme.js';
import { V_MAX, V_STEP, clamp, loadSettings, saveSetting, wantsSound, tryAutoplay, ambientMix, nextDelay, thunderParams } from './ui/soundLogic.js';
import { NATURE_FILES, NATURE_VOL, emitterStates } from './ui/spatialLogic.js';

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

// Âm thanh nền: nhạc thiền + chuông + mõ + gió + ve (hạ) + thác nước + mưa/sấm (tổng hợp), và ếch nhái / chim / dế bằng FILE THẬT phát THEO VỊ TRÍ (Phiên 32: js/ui/spatialLogic.js). Logic tính toán nằm ở js/ui/soundLogic.js (có test).
// - Gọi sớm từ main.js ngay khi trang khởi động: THỬ phát nhạc thật (autoplay). Chỉ coi là "đang phát" khi AudioContext chạy và nhạc thực sự phát.
// - Nếu trình duyệt chặn: hiện lời mời rõ ràng ở giữa-dưới màn hình, phát nhạc ngay ở lần chạm/nhấn phím đầu tiên. Không bao giờ báo "đang phát" khi chưa phát.
// - Mặc định BẬT; ai đã tự tắt thì giữ tắt. Hai thanh âm lượng riêng: Nhạc nền và Hiệu ứng (gió, chim, thác, chuông, mõ...), nhớ lại cho lần sau.
// - Tiếng thay đổi theo vị trí người chơi (window.LGT.getPos) và ngày/đêm (LGT.night từ chu kỳ ngày đêm; ?dem=1 = đêm cố định).
let soundCtl = null;
export function initSound() {
  if (soundCtl) return soundCtl;                                     // gọi nhiều lần cũng chỉ dựng một lần
  const btn = document.getElementById('sound');
  if (!btn) return null;
  const MUSIC = 'assets/audio/nhac-nen.m4a';
  const VOL = { music: 0.55, water: 0.5, bell: 0.5, wind: 0.22, cicada: 0.1, mo: 0.4, rain: 0.5, thunder: 0.9 };   // mức gốc từng lớp (trước khi nhân âm lượng người chơi)
  const isNight = () => !DAY || !!(window.LGT && window.LGT.night > 0.55);   // đêm cố định (?dem=1) hoặc chu kỳ ngày đêm đã tối (LGT.night do scene/index.js cập nhật)
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
  const rainSound = (c, out) => {                                  // mưa rơi: nhiễu hồng lọc dải 600–7000 Hz + lớp "lộp độp" thưa; độ lớn theo mix.rain
    const src = noiseLoop(c, 7), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), body = c.createGain();
    hp.type = 'highpass'; hp.frequency.value = 600; lp.type = 'lowpass'; lp.frequency.value = 7000; body.gain.value = 0.9;
    src.connect(hp); hp.connect(lp); lp.connect(body); body.connect(out);
    const src2 = noiseLoop(c, 5), bp = c.createBiquadFilter(), g2 = c.createGain();   // lớp thứ hai: giọt lớn trên lá/mái (dải giữa), nhấp nhô chậm
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.6; g2.gain.value = 0.45;
    const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 0.23; lg.gain.value = 0.15; l.connect(lg); lg.connect(g2.gain);
    src2.connect(bp); bp.connect(g2); g2.connect(out); src.start(); src2.start(); l.start();
  };
  const thunder = (vol) => {                                         // sấm: (nổ rắc nếu gần) + ầm trầm kéo dài, đuôi lăn dần; tới sau tia chớp (độ trễ do weather.js tính)
    if (!ctx || !playing || ctx.state !== 'running') return;
    const P = thunderParams(vol), t = ctx.currentTime + 0.02, n = Math.floor(ctx.sampleRate * (P.dur + 0.5)), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = last * 8; }   // nhiễu nâu (trầm)
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(P.cutoff * 1.6, t); lp.frequency.exponentialRampToValueAtTime(Math.max(70, P.cutoff * 0.25), t + P.dur);
    const e = ctx.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(P.gain * VOL.thunder, t + (P.crack ? 0.03 : 0.35));
    e.gain.setValueAtTime(P.gain * VOL.thunder, t + (P.crack ? 0.03 : 0.35)); e.gain.exponentialRampToValueAtTime(P.gain * VOL.thunder * 0.55, t + P.dur * 0.45); e.gain.exponentialRampToValueAtTime(0.0001, t + P.dur);
    src.connect(lp); lp.connect(e); e.connect(g.thunder); src.start(t); src.stop(t + P.dur + 0.3);
    for (let i = 0; i < 3; i++) tone(48 + i * 9, P.dur * 0.8, { type: 'sine', gain: 0.12 * P.gain, at: 0.05 + i * 0.35, to: 30, lp: 120 });   // thân sấm rất trầm
  };
  addEventListener('lgt:thunder', (ev) => { try { thunder(ev && ev.detail ? ev.detail.vol : 0.5); } catch (_) { /* âm thanh lỗi không được làm hỏng cảnh */ } });
  const cicadas = (c, out) => {                                     // ve mùa hạ (Phiên 31): tiếng rè ~5 kHz, nhịp rung nhanh, độ lớn dập dềnh chậm như bầy ve hòa nhau
    [[5200, 31, 0.13], [4700, 27, 0.17]].forEach(([f, rate, swell]) => {
      const o = c.createOscillator(), bp = c.createBiquadFilter(), am = c.createGain(), lfo = c.createOscillator(), ld = c.createGain(), sw = c.createOscillator(), sd = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = f; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 6; am.gain.value = 0.5;
      lfo.type = 'sine'; lfo.frequency.value = rate; ld.gain.value = 0.45; lfo.connect(ld); ld.connect(am.gain);
      sw.type = 'sine'; sw.frequency.value = swell; sd.gain.value = 0.3; sw.connect(sd); sd.connect(am.gain);
      o.connect(bp); bp.connect(am); am.connect(out); o.start(); lfo.start(); sw.start();
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
    schedule('bell', ringBell, 'bell', true); schedule('mo', knock, 'mo', true);   // ếch, chim, dế KHÔNG còn ở đây: là file thật phát theo vị trí (natureUpdate)
  };
  const stopRandoms = () => Object.keys(timers).forEach((k) => clearTimeout(timers[k]));

  // --- ếch nhái / chim / dế: FILE THẬT, mỗi nơi (ao, tán cây, bãi cỏ...) là một nguồn riêng. Chỉ tải + giải mã loại nào đang cần (ban ngày chỉ tải chim, ban đêm ếch và dế).
  // Mỗi nguồn: file lặp (bắt đầu ở chỗ ngẫu nhiên, tốc độ lệch nhẹ để các nguồn không trùng nhau) -> lọc cắt cao (xa thì đục) -> trái/phải -> độ lớn theo khoảng cách. Nguồn ra khỏi tầm thì tắt hẳn.
  const NAT = { bufs: {}, loading: {}, failAt: {}, nodes: {} };
  const loadNature = (kind) => {
    if (NAT.bufs[kind] || NAT.loading[kind] || !ctx) return;
    if (NAT.failAt[kind] && Date.now() - NAT.failAt[kind] < 30000) return;       // tải lỗi: thử lại sau 30 giây, không dồn dập
    NAT.loading[kind] = fetch(NATURE_FILES[kind]).then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
      .then((ab) => new Promise((ok, no) => { const pr = ctx.decodeAudioData(ab, ok, no); if (pr && pr.catch) pr.catch(no); }))   // dạng callback cho Safari cũ
      .then((b) => { NAT.bufs[kind] = b; })
      .catch(() => { NAT.failAt[kind] = Date.now(); })
      .finally(() => { NAT.loading[kind] = null; });
  };
  const startNature = (st, buf) => {
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.playbackRate.value = 0.96 + Math.random() * 0.08;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = st.cutoff; lp.Q.value = 0.5;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pan) pan.pan.value = st.pan;
    const gain = ctx.createGain(); gain.gain.value = 0;                          // vào từ từ
    src.connect(lp); let last = lp; if (pan) { lp.connect(pan); last = pan; } last.connect(gain); gain.connect(g.nature);
    src.start(0, Math.random() * buf.duration);
    return { src, lp, pan, gain };
  };
  const stopNature = (id) => {
    const n = NAT.nodes[id]; if (!n) return; delete NAT.nodes[id];
    try { n.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.25); } catch (_) { /* bỏ qua */ }
    setTimeout(() => { try { n.src.stop(); } catch (_) { /* đã dừng */ } try { n.src.disconnect(); n.gain.disconnect(); } catch (_) { /* bỏ qua */ } }, 1800);
  };
  const natureUpdate = (states) => {
    if (!ctx || !playing) return;
    const t = ctx.currentTime, alive = new Set();
    for (const st of states) {
      alive.add(st.id);
      let n = NAT.nodes[st.id];
      if (!n) { const buf = NAT.bufs[st.kind]; if (!buf) { loadNature(st.kind); continue; } n = NAT.nodes[st.id] = startNature(st, buf); }
      n.gain.gain.setTargetAtTime(NATURE_VOL[st.kind] * st.gain, t, 0.4);
      if (n.pan) n.pan.pan.setTargetAtTime(st.pan, t, 0.15);
      n.lp.frequency.setTargetAtTime(st.cutoff, t, 0.3);
    }
    for (const id of Object.keys(NAT.nodes)) if (!alive.has(id)) stopNature(id);
  };
  const natureOff = () => Object.keys(NAT.nodes).forEach(stopNature);

  // Cập nhật độ lớn từng lớp theo vị trí/ngày đêm (4 lần/giây là đủ).
  const updateMix = () => {
    if (!ctx || !playing) return;
    const p = window.LGT && typeof window.LGT.getPos === 'function' ? window.LGT.getPos() : null;
    const wx = window.LGT && window.LGT.weather ? window.LGT.weather : null, fx = wx ? wx.fx : null;
    const sheltered = !!(p && p.z < -21.2 && p.z > -47 && Math.abs(p.x) < 19.5);   // trong chánh điện (HALL: x ±19,5; z -47…-21,2)
    const m = ambientMix({ p, night: isNight(), rain: fx ? fx.rain : 0, wind: fx ? fx.wind : 0, sheltered, season: window.LGT && window.LGT.season }); g.mix = m;
    const t = ctx.currentTime;
    ['water', 'bell', 'wind', 'cicada', 'rain'].forEach((k) => g[k].gain.setTargetAtTime(VOL[k] * m[k], t, k === 'rain' ? 1.2 : 0.3));   // mưa vào/ra từ từ theo cấp
    g.out.gain.setTargetAtTime(1, t, 0.3);                           // chuông, mõ đi thẳng vào g.out, độ lớn đã nằm trong tần suất kêu
    const cam = window.LGT && window.LGT.world ? window.LGT.world.camera : null;
    natureUpdate(emitterStates({ p, yaw: cam ? cam.yaw : 0, dark: DAY ? (window.LGT ? window.LGT.night : 0) : 1, season: window.LGT && window.LGT.season, rain: fx ? fx.rain : 0, sheltered }));
  };

  const build = () => {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    musicG = ctx.createGain(); musicG.gain.value = VOL.music * userVol.music; musicG.connect(master);
    sfxG = ctx.createGain(); sfxG.gain.value = userVol.sfx; sfxG.connect(master);
    ['water', 'bell', 'wind', 'cicada', 'rain'].forEach((k) => { g[k] = ctx.createGain(); g[k].gain.value = 0; g[k].connect(sfxG); });
    g.thunder = ctx.createGain(); g.thunder.gain.value = 1; g.thunder.connect(sfxG);
    g.out = ctx.createGain(); g.out.gain.value = 0.35; g.out.connect(sfxG);   // chuông/mõ
    g.nature = ctx.createGain(); g.nature.gain.value = 1; g.nature.connect(sfxG);   // ếch/chim/dế (file thật, theo vị trí); chung thanh "Hiệu ứng", nhỏ hơn nhạc nền
    waterfall(ctx, g.water); wind(ctx, g.wind); cicadas(ctx, g.cicada); rainSound(ctx, g.rain);
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
    want = false; playing = false; stopRandoms(); natureOff();
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
