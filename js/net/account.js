// Nối tài khoản nhân vật vào trình duyệt thật (Phiên 53): dựng client với callApi/localStorage/crypto.subtle thật.
// main.js gọi initAccount() SỚM (trước khi dựng cảnh): nếu máy này đã đăng nhập thì kéo bản lưu mới nhất về trước khi các phần của game đọc localStorage.
// CHÚ Ý: KHÔNG được tạo window.LGT ở đây — scene/index.js chỉ gắn các hàm mặc định (setMood...) khi window.LGT CHƯA tồn tại.
// Vì vậy client chỉ được gắn vào LGT (attach) SAU khi cảnh đã dựng xong.
import { createAccountClient, createAutoSync } from './accountClient.js';
import { callApi, apiEnabled, getUserKey } from '../api.js';

/** → { client, sync, ready, attach(LGT) }. `ready` KHÔNG BAO GIỜ bị từ chối (mạng lỗi thì chơi tiếp bằng dữ liệu trên máy). client = null nếu chưa cấu hình máy chủ. */
export function initAccount() {
  let client = null, sync = null;
  try {
    if (apiEnabled() && localStorage) {
      client = createAccountClient({ call: callApi, storage: localStorage, subtle: globalThis.crypto && globalThis.crypto.subtle, getUserKey });
      sync = createAutoSync(client);
    }
  } catch (e) { console.warn('[Diệu Giang Tự] Tài khoản lỗi:', e && e.message); client = null; sync = null; }
  if (!client) return { client: null, sync: null, ready: Promise.resolve({ ok: true, off: true }), attach() {} };
  const ready = client.pull().catch(() => ({ ok: false, error: 'network' })).then((r) => { try { sync.start(); } catch (_) { /* bỏ qua */ } return r; });
  /** Gắn vào window.LGT (gọi sau khi cảnh dựng xong): LGT.account = client, kèm startSync/stopSync. */
  const attach = (LGT) => { if (LGT) LGT.account = Object.assign(client, { startSync: sync.start, stopSync: sync.stop }); };
  return { client, sync, ready, attach };
}
