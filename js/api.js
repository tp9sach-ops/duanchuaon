// Gọi Google Apps Script (Web App trả JSON).
// Dùng Content-Type text/plain để trình duyệt KHÔNG gửi preflight (GAS không xử lý được OPTIONS).
// Phiên 54: PHÂN LOẠI LỖI cho đúng (trước đây mọi lỗi đều thành 'network' nên báo sai "kiểm tra mạng"):
//   network      = thật sự không tới được máy chủ (mất mạng)
//   blocked      = tới được Google nhưng KHÔNG đọc được phản hồi (Apps Script chưa Authorize / chưa deploy "Anyone" / URL sai)
//   bad_response = máy chủ trả về thứ không phải JSON (thường là trang lỗi HTML của Apps Script)
//   timeout, http_NNN, hoặc mã lỗi JSON do máy chủ trả (ok:false, error:'…')
import { CONFIG } from './config.js';

export const apiEnabled = () => !!CONFIG.apiUrl;

// Các lệnh tài khoản ghi Google Sheet + khóa → chậm hơn lệnh thường, cho thời gian chờ dài hơn (lần đầu Apps Script "khởi động nguội" mất vài giây).
const SLOW_ACTIONS = /^acct(Create|Login|Save|Load)$/;
const timeoutFor = (action) => (SLOW_ACTIONS.test(action) ? Math.max(CONFIG.apiTimeoutMs, 30000) : CONFIG.apiTimeoutMs);

/** Fetch ném lỗi: phân biệt "mất mạng" với "Google có trả lời nhưng bị chặn đọc" bằng một lần thăm dò no-cors (không đọc được nội dung, chỉ biết có tới nơi hay không). */
async function classifyFetchFailure() {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'network';
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
    try { await fetch(CONFIG.apiUrl, { method: 'GET', mode: 'no-cors', signal: ctl.signal }); return 'blocked'; } finally { clearTimeout(t); }
  } catch (_) { return 'network'; }
}

/** opts.keepalive: cho phép yêu cầu hoàn tất cả khi trang đang đóng (dùng khi lưu tài khoản lúc rời trang; gói ≤ 64KB). */
export async function callApi(action, payload = {}, opts = {}) {
  if (!apiEnabled()) return { ok: false, error: 'api_disabled' };
  let lastErr = 'unknown', lastDetail = '';
  for (let attempt = 0; attempt <= CONFIG.apiRetries; attempt++) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeoutFor(action));
    let res, body = '';
    try {
      body = JSON.stringify({ action, ...payload });
      res = await fetch(CONFIG.apiUrl, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body, signal: ctl.signal, redirect: 'follow', keepalive: !!opts.keepalive,
      });
    } catch (e) {
      clearTimeout(timer);
      if (e && e.name === 'AbortError') { lastErr = 'timeout'; continue; }
      lastErr = await classifyFetchFailure();
      try { lastDetail = [action, Math.round(body.length / 1024) + 'KB', location.origin, window.top === window.self ? 'top' : 'khung', e && e.message].join(' | '); } catch (_) { lastDetail = String(e && e.message); }   // chi tiết để chẩn đoán
      if (lastErr === 'blocked') break;                 // lỗi do cấu hình Apps Script: thử lại vô ích
      continue;
    }
    clearTimeout(timer);
    if (!res.ok) { lastErr = 'http_' + res.status; continue; }
    try {
      const data = await res.json();
      if (data && typeof data === 'object') return data;
      lastErr = 'bad_response'; break;
    } catch (_) { lastErr = 'bad_response'; break; }     // trả về HTML (trang lỗi/đăng nhập của Google) chứ không phải JSON
  }
  return { ok: false, error: lastErr, detail: lastDetail }; // giao diện vẫn chạy, chỉ tắt phần cần API
}

// userKey = UUID tạo ở client, lưu localStorage (không bắt đăng nhập)
export function getUserKey() {
  try {
    let k = localStorage.getItem('lgt.userKey');
    if (!k) { k = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); localStorage.setItem('lgt.userKey', k); }
    return k;
  } catch (_) { return 'anon-' + Date.now(); }
}
