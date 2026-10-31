// Giao diện: reveal chữ, nav, rail chấm, nút âm thanh, menu mobile.
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

export function initNav(rail) {
  const nav = document.getElementById('nav'), burger = document.getElementById('burger');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('stuck', y > 40);
    nav.classList.toggle('hide', y > lastY && y > 300 && !nav.classList.contains('menu-open'));
    lastY = y;
  }, { passive: true });

  const setMenu = (open) => {
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('nav-open', open);
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
  document.querySelectorAll('.nav-link').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Rail chấm bên phải + làm sáng link nav theo section đang xem
  const railEl = document.getElementById('rail'), secs = rail.sections;
  secs.forEach((s, i) => {
    const b = document.createElement('button'); b.setAttribute('aria-label', 'Chương ' + i); b.innerHTML = '<i></i>';
    b.addEventListener('click', () => s.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' }));
    railEl.appendChild(b);
  });
  const dots = [...railEl.children], links = [...document.querySelectorAll('.nav-link')];
  const sync = () => {
    const f = Math.round(rail.index);
    dots.forEach((d, i) => d.classList.toggle('on', i === f));
    const id = secs[f]?.id;
    links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  };
  setInterval(sync, 200);
}

// Nhạc nền: pad hai dao động trầm bằng Web Audio. Chỉ bắt đầu sau lần bấm đầu tiên (luật autoplay).
export function initSound() {
  const btn = document.getElementById('sound');
  let ctx = null, master = null, on = false;
  try { on = localStorage.getItem('lgt.sound') === '1'; } catch (_) { /* bỏ qua */ }
  const build = () => {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    [[110, 0], [164.8, 4], [220.5, -3]].forEach(([f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; o.detune.value = d; g.gain.value = 0.35; o.connect(g); g.connect(master); o.start();
    });
  };
  const apply = () => {
    btn.setAttribute('aria-pressed', String(on));
    if (!ctx) return;
    master.gain.setTargetAtTime(on ? 0.05 : 0, ctx.currentTime, 0.6);
  };
  btn.addEventListener('click', async () => {
    if (!ctx) build();
    if (ctx.state === 'suspended') await ctx.resume();
    on = !on; try { localStorage.setItem('lgt.sound', on ? '1' : '0'); } catch (_) { /* bỏ qua */ }
    apply();
  });
  btn.setAttribute('aria-pressed', 'false'); // luôn tắt cho tới khi người dùng bấm
}
