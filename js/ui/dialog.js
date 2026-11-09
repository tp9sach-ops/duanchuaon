// Hộp xác nhận ngay trong trang, thay cho window.confirm().
// Lý do: khi game nằm trong khung nhúng có thuộc tính sandbox mà thiếu "allow-modals" (ví dụ Google Sites / trang nhúng),
// trình duyệt BỎ QUA confirm() và trả về false ngay → đăng nhập/đăng xuất im lặng không làm gì (console: "Ignored call to 'confirm()'").
// askConfirm(message, { ok, cancel }) trả Promise<boolean>, không phụ thuộc quyền của khung nhúng.
export function askConfirm(message, { ok = 'Đồng ý', cancel = 'Hủy' } = {}) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !document.body) { resolve(false); return; }
    const prevFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.setAttribute('role', 'alertdialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Xác nhận');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6);font-family:inherit';
    const box = document.createElement('div');
    box.style.cssText = 'max-width:420px;width:100%;box-sizing:border-box;padding:18px 18px 14px;border-radius:14px;background:#14161f;color:#e8eaf2;border:1px solid rgba(217,178,95,.45);box-shadow:0 12px 40px rgba(0,0,0,.6);font-size:15px;line-height:1.5';
    const msg = document.createElement('p'); msg.textContent = String(message); msg.style.cssText = 'margin:0 0 14px;white-space:pre-wrap';
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;justify-content:flex-end';
    const mk = (label, primary) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.style.cssText = 'min-height:40px;padding:8px 16px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer;border:1px solid rgba(217,178,95,.6);' + (primary ? 'background:#d9b25f;color:#1a1305' : 'background:transparent;color:#e8eaf2');
      return b;
    };
    const bNo = mk(cancel, false), bOk = mk(ok, true);
    row.append(bNo, bOk); box.append(msg, row); wrap.appendChild(box); document.body.appendChild(wrap);
    let done = false;
    const finish = (v) => {
      if (done) return; done = true;
      document.removeEventListener('keydown', onKey, true);
      wrap.remove();
      try { prevFocus && prevFocus.focus && prevFocus.focus({ preventScroll: true }); } catch (_) { /* bỏ qua */ }
      resolve(v);
    };
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
      else if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === bOk ? bNo : bOk).focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    bNo.addEventListener('click', () => finish(false));
    bOk.addEventListener('click', () => finish(true));
    try { bOk.focus({ preventScroll: true }); } catch (_) { /* bỏ qua */ }
  });
}
