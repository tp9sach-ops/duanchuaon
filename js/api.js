// Gọi Google Apps Script (Web App trả JSON).
// Dùng Content-Type text/plain để trình duyệt KHÔNG gửi preflight (GAS không xử lý được OPTIONS).
// Phiên 54: PHÂN LOẠI LỖI cho đúng (trước đây mọi lỗi đều thành 'network' nên báo sai "kiểm tra mạng"):
//   network      = thật sự không tới được máy chủ (mất mạng)
//   blocked      = tới được Google nhưng KHÔNG đọc được phản hồi (Apps Script chưa Authorize / chưa deploy "Anyone" / URL sai)
//   bad_response = máy chủ trả về thứ không phải JSON (thường là trang lỗi HTML của Apps Script)
//   timeout, http_NNN, hoặc mã lỗi JSON do máy chủ trả (ok:false, error:'…')
// Phiên 55: đường DỰ PHÒNG khi fetch bị chặn đọc ('blocked'): gửi bằng <form> ẩn + <iframe> ẩn, máy chủ (Code.gs → frame_) trả trang
//   nhỏ gọi postMessage về trang game. Cách này KHÔNG chịu CORS nên đi được cả khi game nằm trong khung nhúng của trang khác.
import { CONFIG } from './config.js';

export const apiEnabled = () => !!CONFIG.apiUrl;

// Các lệnh tài khoản ghi Google Sheet + khóa → chậm hơn lệnh thường, cho thời gian chờ dài hơn (lần đầu Apps Script "khởi động nguội" mất vài giây).
const SLOW_ACTIONS = /^acct(Create|Login|Save|Load)$/;
const timeoutFor = (action) => (SLOW_ACTIONS.test(action) ? Math.max(CONFIG.apiTimeoutMs, 30000) : CONFIG.apiTimeoutMs);

/** Chỉ nhận thư từ máy chủ Google (trang HtmlService chạy ở *.googleusercontent.com hoặc script.google.com). */
const googleOrigin = (o) => { try { const h = new URL(o).hostname; return h === 'script.google.com' || h === 'googleusercontent.com' || h.endsWith('.googleusercontent.com'); } catch (_) { return false; } };
let useFrame = false;   // đã có một lần gửi bằng khung thành công trong phiên này → các lần sau đi thẳng đường khung

/**
 * Gửi `body` (chuỗi JSON của lệnh) bằng form + iframe ẩn, chờ postMessage từ máy chủ. Trả đối tượng kết quả hoặc null (hết giờ / không có DOM).
 * env: { doc, win, url } — truyền vào để test bằng DOM giả.
 */
export function callViaFrame(body, { timeoutMs = 30000, doc = globalThis.document, win = globalThis, url = CONFIG.apiUrl } = {}) {
  if (!doc || !doc.body || !win || typeof win.addEventListener !== 'function' || !url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const rid = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/[^A-Za-z0-9-]/g, '');
    const name = 'lgt-frame-' + rid;
    let done = false, timer = null, iframe = null, form = null;
    const finish = (res) => {
      if (done) return; done = true;
      clearTimeout(timer);
      try { win.removeEventListener('message', onMsg); } catch (_) { /* bỏ qua */ }
      try { form && form.remove && form.remove(); } catch (_) { /* bỏ qua */ }
      try { iframe && iframe.remove && iframe.remove(); } catch (_) { /* bỏ qua */ }
      resolve(res);
    };
    function onMsg(ev) {
      const d = ev && ev.data;
      if (!d || typeof d !== 'object' || d.lgt !== rid || !googleOrigin(ev.origin)) return;
      finish(d.res && typeof d.res === 'object' ? d.res : null);
    }
    try {
      win.addEventListener('message', onMsg);
      iframe = doc.createElement('iframe'); iframe.name = name; iframe.setAttribute('aria-hidden', 'true'); iframe.tabIndex = -1;
      iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
      form = doc.createElement('form'); form.method = 'POST'; form.action = url; form.target = name; form.acceptCharset = 'utf-8'; form.style.display = 'none';
      const add = (k, v) => { const i = doc.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i); };
      add('d', body); add('rid', rid); add('o', (win.location && win.location.origin) || '');
      doc.body.appendChild(iframe); doc.body.appendChild(form);
      timer = setTimeout(() => finish(null), timeoutMs);
      form.submit();
    } catch (_) { finish(null); }
  });
}

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
  const frameEnv = opts.frameEnv || {};
  const viaFrame = async (b) => (opts.keepalive ? null : callViaFrame(b, { timeoutMs: timeoutFor(action), ...frameEnv }));   // lúc đóng trang (keepalive) khung không kịp chạy
  if (useFrame && !opts.keepalive) {                                          // phiên này fetch từng bị chặn nhưng đường khung chạy được → đi thẳng đường khung
    const fr = await viaFrame(JSON.stringify({ action, ...payload }));
    if (fr) return fr;
    useFrame = false;                                      // khung hỏng → thử lại đường thường
  }
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
      if (lastErr === 'blocked') {                      // thử lại bằng fetch là vô ích; thử đường khung (không cần CORS)
        const fr = await viaFrame(body);                // cùng `body` (cùng aid/sid) nên máy chủ nhận ra nếu yêu cầu đầu thực ra đã chạy xong
        if (fr) { useFrame = true; return fr; }
        lastDetail += ' | khung: không phản hồi';
        break;
      }
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
