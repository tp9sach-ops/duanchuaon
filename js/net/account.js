// Nối tài khoản nhân vật vào trình duyệt thật (Phiên 53): dựng client với callApi/localStorage/crypto.subtle thật.
// main.js gọi initAccount() SỚM (trước khi dựng cảnh): nếu máy này đã đăng nhập thì kéo bản lưu mới nhất về trước khi các phần của game đọc localStorage.
// CHÚ Ý: KHÔNG được tạo window.LGT ở đây — scene/index.js chỉ gắn các hàm mặc định (setMood...) khi window.LGT CHƯA tồn tại.
// Vì vậy client chỉ được gắn vào LGT (attach) SAU khi cảnh đã dựng xong.
import { createAccountClient, createAutoSync } from './accountClient.js';
import { callApi, apiEnabled, getUserKey } from '../api.js';

const GRANT_KEY = 'lgt.grantDone';   // danh sách id quà quản trị đã nhận (khóa lgt.* nên đi cùng bản lưu: ví và "đã nhận" luôn khớp nhau)

/**
 * Phiên 170: cộng quà quản trị (hạt sen) chưa nhận. `list` = [{ id, sen }] do máy chủ gắn vào phản hồi.
 * Mỗi id chỉ cộng đúng 1 lần. Game đang chạy (LGT.addMerit có) thì cộng qua đó để ví trong bộ nhớ + localStorage + bảng xếp hạng cùng cập nhật;
 * chưa chạy (đang ở bước kéo bản lưu trước khi dựng cảnh) thì ghi thẳng vào lgt.wallet — hudMenu sẽ đọc lúc khởi động.
 */
export function applyGrants(list, { storage = localStorage, LGT = globalThis.window && window.LGT } = {}) {
  if (!Array.isArray(list)) return 0;
  let done = []; try { done = JSON.parse(storage.getItem(GRANT_KEY) || '[]'); if (!Array.isArray(done)) done = []; } catch (_) { done = []; }
  const fresh = []; let sum = 0;
  for (const g of list) {
    if (!g || typeof g.id !== 'string' || done.includes(g.id) || fresh.includes(g.id)) continue;
    const n = Math.floor(Number(g.sen));
    fresh.push(g.id);
    if (Number.isFinite(n) && n > 0 && n <= 10000000) sum += n;
  }
  if (!fresh.length) return 0;
  try { storage.setItem(GRANT_KEY, JSON.stringify(done.concat(fresh).slice(-50))); } catch (_) { /* bỏ qua */ }
  if (sum > 0) {
    if (LGT && typeof LGT.addMerit === 'function') LGT.addMerit(sum);
    else {
      let w = {}; try { w = JSON.parse(storage.getItem('lgt.wallet') || '{}') || {}; } catch (_) { w = {}; }
      try { storage.setItem('lgt.wallet', JSON.stringify({ ...w, sen: Math.min(1e9, Math.max(0, Math.floor(Number(w.sen)) || 0) + sum) })); } catch (_) { /* bỏ qua */ }
    }
  }
  return sum;
}

/** → { client, sync, ready, attach(LGT) }. `ready` KHÔNG BAO GIỜ bị từ chối (mạng lỗi thì chơi tiếp bằng dữ liệu trên máy). client = null nếu chưa cấu hình máy chủ. */
export function initAccount() {
  let client = null, sync = null;
  try {
    if (apiEnabled() && localStorage) {
      client = createAccountClient({ call: callApi, storage: localStorage, subtle: globalThis.crypto && globalThis.crypto.subtle, getUserKey, grant: (list) => applyGrants(list) });
      sync = createAutoSync(client);
    }
  } catch (e) { console.warn('[Diệu Giang Tự] Tài khoản lỗi:', e && e.message); client = null; sync = null; }
  if (!client) return { client: null, sync: null, ready: Promise.resolve({ ok: true, off: true }), attach() {} };
  const ready = client.pull().catch(() => ({ ok: false, error: 'network' })).then((r) => { try { sync.start(); } catch (_) { /* bỏ qua */ } return r; });
  /** Gắn vào window.LGT (gọi sau khi cảnh dựng xong): LGT.account = client, kèm startSync/stopSync. */
  const attach = (LGT) => { if (LGT) LGT.account = Object.assign(client, { startSync: sync.start, stopSync: sync.stop }); };
  return { client, sync, ready, attach };
}
