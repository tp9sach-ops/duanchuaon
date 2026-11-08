// Ăn mừng hoàn thành nhiệm vụ (Phiên 64): băng chữ + hào quang + cánh sen/ánh vàng bay + nhạc chuông ngắn + rung nhẹ trên điện thoại.
// Logic quyết định ở js/world/celebrate.js (có test). Tôn trọng: tắt tiếng, âm lượng hiệu ứng, "giảm chuyển động".
import { planCelebration, sfxGain } from '../world/celebrate.js';
import { tone } from './sound.js';
import { loadSettings } from './soundLogic.js';
import { prefersReduced } from '../util.js';

const COLORS = ['#ffd76a', '#ffb347', '#ff8fb1', '#fff3c4', '#f7a8c8', '#9be3a8'];
let host = null, timer = 0, raf = 0;

function ensure() {
  if (host) return host;
  host = document.createElement('div'); host.className = 'cel'; host.hidden = true; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite');
  host.innerHTML = '<div class="cel-glow"></div><canvas class="cel-cv"></canvas><div class="cel-card"><small class="cel-k"></small><b class="cel-t"></b><span class="cel-s"></span><em class="cel-r"></em></div>';
  document.body.appendChild(host); return host;
}

function fanfare(plan) {
  let gv = 1; try { gv = sfxGain(loadSettings(localStorage)); } catch (_) { /* mặc định */ }
  if (!gv) return;
  plan.notes.forEach((f, i) => setTimeout(() => {
    tone(f, 0.5, { type: 'triangle', gain: 0.16 * gv, decay: 0.45 });
    tone(f * 2, 0.35, { gain: 0.05 * gv, decay: 0.3 });
  }, i * plan.gap));
  const end = plan.notes.length * plan.gap;
  setTimeout(() => { const top = plan.notes[plan.notes.length - 1]; [top, top * 1.26, top * 1.5].forEach((f) => tone(f, 1.6, { gain: 0.09 * gv, decay: 1.5 })); tone(plan.notes[0] / 2, 1.8, { gain: 0.12 * gv, decay: 1.7 }); }, end + 40);
  if (plan.tier !== 'small') setTimeout(() => [0, 1, 2, 3, 4, 5].forEach((k) => setTimeout(() => tone(2400 + Math.random() * 1600, 0.25, { gain: 0.03 * gv, decay: 0.22 }), k * 70)), end + 200);   // lấp lánh
}

function confetti(cv, plan) {
  const w = cv.width = innerWidth, h = cv.height = innerHeight, g = cv.getContext('2d'); if (!g) return;
  const ps = Array.from({ length: plan.particles }, (_, i) => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 5 + Math.random() * (plan.tier === 'epic' ? 13 : 9);
    return { x: w / 2, y: h * 0.42, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 3 + Math.random() * 5, c: COLORS[i % COLORS.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, petal: Math.random() < 0.5 };
  });
  const t0 = performance.now();
  const step = (now) => {
    const age = now - t0; g.clearRect(0, 0, w, h);
    const fade = age > plan.ms - 900 ? Math.max(0, (plan.ms - age) / 900) : 1;
    for (const p of ps) {
      p.vy += 0.22; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      g.globalAlpha = fade; g.fillStyle = p.c; g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      if (p.petal) { g.beginPath(); g.ellipse(0, 0, p.r * 1.7, p.r * 0.8, 0, 0, 6.3); g.fill(); } else { g.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); }
      g.restore();
    }
    if (age < plan.ms) raf = requestAnimationFrame(step); else g.clearRect(0, 0, w, h);
  };
  cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
}

/** Phát ăn mừng. input như planCelebration. Trả plan (hoặc null). */
export function celebrate(input) {
  const plan = planCelebration(input); if (!plan || typeof document === 'undefined') return plan;
  const el = ensure(), $ = (s) => el.querySelector(s), reduced = prefersReduced();
  $('.cel-k').textContent = plan.kicker; $('.cel-t').textContent = plan.title; $('.cel-s').textContent = plan.sub; $('.cel-r').textContent = plan.reward;
  el.className = `cel ${plan.tier}`; el.hidden = false; el.style.setProperty('--ms', plan.ms + 'ms'); el.style.setProperty('--flash', plan.flash);
  void el.offsetWidth; el.classList.add('go');
  fanfare(plan);
  if (!reduced) { confetti($('.cel-cv'), plan); try { navigator.vibrate && navigator.vibrate(plan.vibrate); } catch (_) { /* bỏ qua */ } }
  clearTimeout(timer); timer = setTimeout(() => { el.hidden = true; el.classList.remove('go'); }, plan.ms);
  return plan;
}
