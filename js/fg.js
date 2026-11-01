// Điều khiển lớp tiền cảnh: chỉ bộ ảnh của bảng đang mở được hiện, bộ trước đó mờ dần. set(null) = ẩn hết.
export function initForeground() {
  const sets = {};
  document.querySelectorAll('#fg-sky .fg').forEach((el) => { sets[el.dataset.fg] = el; });
  let cur = null;
  function set(key) {
    if (key === cur) return;
    const prev = cur && sets[cur]; cur = key;
    if (prev) { prev.classList.remove('fg-active'); prev.classList.add('fg-retiring'); setTimeout(() => { if (sets[cur] !== prev) prev.classList.remove('fg-retiring'); }, 800); }
    const next = key && sets[key];
    if (next) { next.classList.remove('fg-retiring'); next.classList.add('fg-active'); }
  }
  return { set };
}
