// Gọi Google Apps Script (Web App trả JSON).
// Dùng Content-Type text/plain để trình duyệt KHÔNG gửi preflight (GAS không xử lý được OPTIONS).
import { CONFIG } from './config.js';

export const apiEnabled = () => !!CONFIG.apiUrl;

/** opts.keepalive: cho phép yêu cầu hoàn tất cả khi trang đang đóng (dùng khi lưu tài khoản lúc rời trang; gói ≤ 64KB). */
export async function callApi(action, payload = {}, opts = {}) {
  if (!apiEnabled()) return { ok: false, error: 'api_disabled' };
  let lastErr = 'unknown';
  for (let attempt = 0; attempt <= CONFIG.apiRetries; attempt++) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), CONFIG.apiTimeoutMs);
    try {
      const res = await fetch(CONFIG.apiUrl, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }), signal: ctl.signal, redirect: 'follow', keepalive: !!opts.keepalive,
      });
      clearTimeout(timer);
      if (!res.ok) { lastErr = 'http_' + res.status; continue; }
      return await res.json();
    } catch (e) {
      clearTimeout(timer); lastErr = e.name === 'AbortError' ? 'timeout' : 'network';
    }
  }
  return { ok: false, error: lastErr }; // giao diện vẫn chạy, chỉ tắt phần cần API
}

// userKey = UUID tạo ở client, lưu localStorage (không bắt đăng nhập)
export function getUserKey() {
  try {
    let k = localStorage.getItem('lgt.userKey');
    if (!k) { k = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); localStorage.setItem('lgt.userKey', k); }
    return k;
  } catch (_) { return 'anon-' + Date.now(); }
}
