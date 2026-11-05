// Giao diện: reveal chữ, menu, nút âm thanh, menu mobile.
import { prefersReduced } from './util.js';

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

// Âm thanh nền (nút "Âm thanh"): nhạc + thác nước + chuông chùa. Chỉ bắt đầu sau lần bấm đầu tiên (luật autoplay).
export function initSound() {
  // Âm thanh nền: nhạc (file assets/audio/nhac-nen.m4a, lặp liền) + tiếng thác nước (tổng hợp bằng nhiễu lọc) + chuông chùa thỉnh thoảng ngân.
  const btn = document.getElementById('sound');
  const MUSIC = 'assets/audio/nhac-nen.m4a';
  const VOL = { music: 0.55, water: 0.16, bell: 0.5 };
  let ctx = null, master = null, musicG = null, waterG = null, bellG = null, el = null, on = false, bellTimer = 0;
  try { on = localStorage.getItem('lgt.sound') === '1'; } catch (_) { /* bỏ qua */ }

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
      const f = Math.floor(c.sampleRate * 0.25);                    // hòa đầu-đuôi 0,25 giây để vòng lặp không "tách"
      for (let i = 0; i < f; i++) { const k = i / f; d[i] = d[i] * k + d[n - f + i] * (1 - k); }
    }
    return buf;
  };
  const waterfall = (c, out) => {
    const src = c.createBufferSource(); src.buffer = pinkBuffer(c, 6); src.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 220;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
    const body = c.createGain(); body.gain.value = 1;
    src.connect(hp); hp.connect(lp); lp.connect(body); body.connect(out);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.17; lg.gain.value = 0.12;   // nước chảy dâng nhẹ, không đều tăm tắp
    lfo.connect(lg); lg.connect(body.gain);
    const lfo2 = c.createOscillator(), lg2 = c.createGain(); lfo2.frequency.value = 0.05; lg2.gain.value = 900;
    lfo2.connect(lg2); lg2.connect(lp.frequency);
    src.start(); lfo.start(); lfo2.start();
  };
  const ring = () => {                                              // một hồi chuông: các hài âm lệch (không chẵn) + ngân dài
    if (!ctx || !on || ctx.state !== 'running') return;
    const base = [196, 220, 233][Math.floor(Math.random() * 3)], t = ctx.currentTime + 0.02;
    [[1, 0.5, 11], [2.01, 0.28, 8], [2.76, 0.16, 6], [4.07, 0.1, 4], [5.4, 0.06, 3], [6.8, 0.03, 2]].forEach(([m, g, d], i) => {
      [0, 1.1].forEach((beat) => {                                  // hai dao động lệch nhẹ nhau → tiếng ngân "ù ù" của chuông đồng
        const o = ctx.createOscillator(), e = ctx.createGain();
        o.type = 'sine'; o.frequency.value = base * m + beat * (0.6 + i * 0.2);
        e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(g / 2, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(e); e.connect(bellG); o.start(t); o.stop(t + d + 0.1);
      });
    });
  };
  const scheduleBell = (first) => {
    clearTimeout(bellTimer);
    if (!on) return;
    bellTimer = setTimeout(() => { ring(); scheduleBell(false); }, first ? 4000 : 40000 + Math.random() * 40000);
  };
  const build = () => {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    musicG = ctx.createGain(); musicG.gain.value = VOL.music; musicG.connect(master);
    waterG = ctx.createGain(); waterG.gain.value = VOL.water; waterG.connect(master);
    bellG = ctx.createGain(); bellG.gain.value = VOL.bell; bellG.connect(master);
    waterfall(ctx, waterG);
    el = new Audio(MUSIC); el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous';
    ctx.createMediaElementSource(el).connect(musicG);
  };
  const apply = () => {
    btn.setAttribute('aria-pressed', String(on));
    if (!ctx) return;
    master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, on ? 1.5 : 0.5);
    if (on) { el.play().catch(() => { /* chưa tải được nhạc: vẫn còn tiếng thác */ }); scheduleBell(true); }
    else { clearTimeout(bellTimer); setTimeout(() => { if (!on && el) el.pause(); }, 1800); }
  };
  btn.addEventListener('click', async () => {
    if (!ctx) build();
    if (ctx.state === 'suspended') await ctx.resume();
    on = !on; try { localStorage.setItem('lgt.sound', on ? '1' : '0'); } catch (_) { /* bỏ qua */ }
    apply();
  });
  // Mặc định BẬT: trình duyệt chỉ cho phát tiếng sau một lần chạm, nên bắt đầu ở lần chạm/nhấn phím đầu tiên (vd. "Vào chùa").
  // Ai đã tự tắt (lgt.sound = 0) thì giữ tắt.
  let optedOut = false; try { optedOut = localStorage.getItem('lgt.sound') === '0'; } catch (_) { /* bỏ qua */ }
  const autoStart = async () => {
    removeEventListener('pointerdown', autoStart, true); removeEventListener('keydown', autoStart, true);
    if (optedOut || on) return;
    try { if (!ctx) build(); if (ctx.state === 'suspended') await ctx.resume(); } catch (_) { return; }
    on = true; apply();
  };
  if (!optedOut) { addEventListener('pointerdown', autoStart, true); addEventListener('keydown', autoStart, true); }
  document.addEventListener('visibilitychange', () => {             // đổi tab / khóa màn hình: tạm dừng nhạc cho đỡ tốn pin
    if (!el || !on) return;
    if (document.hidden) el.pause(); else el.play().catch(() => {});
  });
  btn.setAttribute('aria-pressed', 'false'); // nút hiện bật khi autoStart chạy ở lần chạm đầu tiên
}
