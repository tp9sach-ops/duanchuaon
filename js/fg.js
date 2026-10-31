// Điều khiển lớp tiền cảnh: chỉ bộ ảnh của chương đang giữ khung nhìn được hiện, bộ trước đó mờ dần.
export function initForeground() {
  const sets = {};
  document.querySelectorAll('#fg-sky .fg').forEach((el) => { sets[el.dataset.fg] = el; });
  const secs = [...document.querySelectorAll('[data-fg-key]')];
  let cur = null;
  const pick = () => {
    const mid = innerHeight * 0.5;
    let key = null;
    for (const s of secs) { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { key = s.dataset.fgKey; break; } }
    if (key === cur) return;
    const prev = cur && sets[cur]; cur = key;
    if (prev) { prev.classList.remove('fg-active'); prev.classList.add('fg-retiring'); setTimeout(() => { if (sets[cur] !== prev) prev.classList.remove('fg-retiring'); }, 800); }
    const next = key && sets[key];
    if (next) { next.classList.remove('fg-retiring'); next.classList.add('fg-active'); }
  };
  let raf = 0;
  const on = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; pick(); }); };
  addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
  pick();
}
