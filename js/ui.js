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

// Âm thanh nền (nút "Âm thanh"): nhạc + thác nước + chuông chùa.
// - Mở trang là nghe liền ở lần chạm/nhấn phím đầu tiên (luật autoplay của trình duyệt), âm lượng mặc định nhỏ hơn trước một chút.
// - Nút + / − cạnh biểu tượng âm thanh để chỉnh to nhỏ (nhớ lại cho lần sau).
// - Tiếng thác chỉ nghe khi đi lại gần thác (Đông, ngoài chùa), càng gần càng to, càng xa càng nhỏ. Chuông to khi ở gần gác chuông, nhỏ dần khi ra xa.
//   Vị trí người chơi lấy từ window.LGT.getPos() (main.js gắn); không có thì dùng mức vừa phải cố định.
export function initSound() {
  const btn = document.getElementById('sound');
  const MUSIC = 'assets/audio/nhac-nen.m4a';
  const VOL = { music: 0.55, water: 0.5, bell: 0.5 };                // mức gốc của từng lớp (trước khi nhân âm lượng người dùng)
  const WATER_AT = { x: 112, z: 104 }, BELL_AT = { x: 28, z: -4 };    // chân thác (THAC.cliffX − 2.5, fallZ) và gác chuông (scene/index.js)
  const V_MAX = 1.5, V_DEF = 0.75, V_STEP = 0.15;                     // âm lượng người dùng: 0 … 1,5 (mặc định 0,75 — nhỏ hơn bản cũ)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let ctx = null, master = null, musicG = null, waterG = null, bellG = null, el = null, on = false, bellTimer = 0, distTimer = 0, userChose = false;
  let userVol = V_DEF;
  try { on = localStorage.getItem('lgt.sound') === '1'; } catch (_) { /* bỏ qua */ }
  try { const s = parseFloat(localStorage.getItem('lgt.vol')); if (isFinite(s)) userVol = clamp(s, 0, V_MAX); } catch (_) { /* bỏ qua */ }

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

  // Khoảng cách → độ lớn. Thác: 1 ở chân thác, về 0 ở cách ~90 m (đường cong bình phương cho tự nhiên). Chuông: to gần gác chuông, nhỏ dần nhưng không tắt hẳn.
  const updateDistance = () => {
    if (!ctx || !on) return;
    const p = window.LGT && typeof window.LGT.getPos === 'function' ? window.LGT.getPos() : null;
    let gw = 0.3, gb = 0.7;                                          // không biết vị trí (không có cảnh 3D): mức vừa phải
    if (p && isFinite(p.x) && isFinite(p.z)) {
      const dw = Math.hypot(p.x - WATER_AT.x, p.z - WATER_AT.z), db = Math.hypot(p.x - BELL_AT.x, p.z - BELL_AT.z);
      gw = Math.pow(clamp(1 - (dw - 6) / 84, 0, 1), 2);
      gb = Math.max(0.08, Math.pow(clamp(1 - (db - 10) / 140, 0, 1), 1.5));
    }
    const t = ctx.currentTime;
    waterG.gain.setTargetAtTime(VOL.water * gw, t, 0.3);
    bellG.gain.setTargetAtTime(VOL.bell * gb, t, 0.3);
  };

  const build = () => {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    musicG = ctx.createGain(); musicG.gain.value = VOL.music; musicG.connect(master);
    waterG = ctx.createGain(); waterG.gain.value = 0; waterG.connect(master);      // thác: bắt đầu im, updateDistance() nâng theo vị trí
    bellG = ctx.createGain(); bellG.gain.value = VOL.bell * 0.7; bellG.connect(master);
    waterfall(ctx, waterG);
    el = new Audio(MUSIC); el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous';
    ctx.createMediaElementSource(el).connect(musicG);
    distTimer = setInterval(updateDistance, 120);
  };
  const apply = () => {
    btn.setAttribute('aria-pressed', String(on));
    if (!ctx) return;
    master.gain.setTargetAtTime(on ? userVol : 0, ctx.currentTime, on ? 0.35 : 0.5);   // vào nhanh (0,35 s) để nghe liền
    if (on) { updateDistance(); el.play().catch(() => { /* chưa tải được nhạc: vẫn còn tiếng thác */ }); scheduleBell(true); }
    else { clearTimeout(bellTimer); setTimeout(() => { if (!on && el) el.pause(); }, 1800); }
  };

  // --- nút âm lượng − / + (tự tạo, đặt cạnh nút Âm thanh)
  const box = document.createElement('div');
  box.className = 'sound-vol';
  box.style.cssText = 'position:fixed;display:none;align-items:center;gap:4px;z-index:60;font:500 11px/1 system-ui,sans-serif;color:#e8eaf2;';
  const mk = (txt, label) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.title = label;
    b.style.cssText = 'width:28px;height:28px;padding:0;border-radius:50%;border:1px solid rgba(217,178,95,.55);background:rgba(8,10,20,.6);color:#e8eaf2;font:600 17px/1 system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);';
    return b;
  };
  const minus = mk('−', 'Giảm âm lượng'), plus = mk('+', 'Tăng âm lượng');
  const lab = document.createElement('span'); lab.style.cssText = 'min-width:34px;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,.6);';
  box.append(minus, lab, plus);
  document.body.appendChild(box);
  const showVol = () => {
    lab.textContent = Math.round(userVol / V_MAX * 100) + '%';
    minus.disabled = userVol <= 0.001; plus.disabled = userVol >= V_MAX - 0.001;
    minus.style.opacity = minus.disabled ? '.4' : '1'; plus.style.opacity = plus.disabled ? '.4' : '1';
  };
  const setVol = (v) => {
    userVol = clamp(Math.round(v * 100) / 100, 0, V_MAX); showVol();
    try { localStorage.setItem('lgt.vol', String(userVol)); } catch (_) { /* bỏ qua */ }
    if (ctx && on) master.gain.setTargetAtTime(userVol, ctx.currentTime, 0.1);
  };
  const stop = (e) => e.stopPropagation();
  [minus, plus].forEach((b) => ['pointerdown', 'touchend'].forEach((n) => b.addEventListener(n, stop)));
  minus.addEventListener('click', (e) => { e.stopPropagation(); setVol(userVol - V_STEP); });
  plus.addEventListener('click', (e) => { e.stopPropagation(); setVol(userVol + V_STEP); });
  const place = () => {                                              // bám theo nút Âm thanh (nằm bên phải nút; hết chỗ thì sang trái)
    const r = btn.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(btn).visibility === 'hidden') { box.style.display = 'none'; return; }
    box.style.display = 'flex';
    const w = box.offsetWidth || 100;
    const left = r.right + 8 + w > innerWidth - 4 ? r.left - 8 - w : r.right + 8;
    box.style.left = Math.max(4, left) + 'px'; box.style.top = (r.top + (r.height - 28) / 2) + 'px';
  };
  showVol(); place(); setInterval(place, 800); addEventListener('resize', place);

  btn.addEventListener('click', async () => {
    userChose = true; detach();
    if (!ctx) build();
    if (ctx.state === 'suspended') await ctx.resume();
    on = !on; try { localStorage.setItem('lgt.sound', on ? '1' : '0'); } catch (_) { /* bỏ qua */ }
    apply();
  });

  // Mặc định BẬT: trình duyệt chỉ cho phát tiếng sau một lần chạm, nên bắt đầu ở lần chạm/nhấn phím đầu tiên (vd. "Vào chùa").
  // Nghe cả pointerdown, touchend, click, keydown (iOS Safari chỉ mở âm thanh ở touchend/click). Chỉ gỡ khi âm thanh đã thực sự chạy.
  // Ai đã tự tắt (lgt.sound = 0) thì giữ tắt.
  let optedOut = false; try { optedOut = localStorage.getItem('lgt.sound') === '0'; } catch (_) { /* bỏ qua */ }
  const EVS = ['pointerdown', 'touchend', 'click', 'keydown'];
  function detach() { EVS.forEach((n) => removeEventListener(n, autoStart, true)); }
  function autoStart(e) {
    if (optedOut || userChose) { detach(); return; }
    if (e && e.target && e.target.closest && e.target.closest('#sound, .sound-vol')) return;   // bấm đúng nút âm thanh thì để nút tự xử lý
    try { if (!ctx) build(); } catch (_) { return; }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!on) { on = true; apply(); }
    if (el && el.paused) el.play().catch(() => {});                // gọi ngay trong cử chỉ của người dùng
    if (ctx.state === 'running') detach();
  }
  if (!optedOut) EVS.forEach((n) => addEventListener(n, autoStart, true));
  document.addEventListener('visibilitychange', () => {             // đổi tab / khóa màn hình: tạm dừng nhạc cho đỡ tốn pin
    if (!el || !on) return;
    if (document.hidden) el.pause(); else el.play().catch(() => {});
  });
  btn.setAttribute('aria-pressed', 'false'); // nút hiện bật khi autoStart chạy ở lần chạm đầu tiên
}
