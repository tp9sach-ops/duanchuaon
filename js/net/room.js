// Nối đa người vào cảnh thật: dùng LGT.world (vị trí/trạng thái của mình), avatar.js (dựng người khác), api.js (Apps Script).
// Không sửa world.js/hud.js: lấy `scene` từ nhân vật của mình, tự chạy vòng requestAnimationFrame riêng, ghi số người vào #online-tx.
// Khi chưa có apiUrl: các tab cùng trình duyệt thấy nhau (BroadcastChannel) để thử cục bộ.
import { callApi, apiEnabled } from '../api.js';
import { createAvatar } from '../world/avatar.js';
import { loadProfile } from '../ui/hudLogic.js';
import { createRoomClient, createLocalTransport } from './roomClient.js';
import { CONFIG } from '../config.js';
import { createTransportManager } from './transportManager.js';
import { createFirebaseTransport, loadFirebaseSdk } from './firebaseTransport.js';
import { withGasBridge } from './bridge.js';

const newId = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

/** Gọi sau initHud(). Trả client hoặc null nếu không có chế độ đi bộ (fallback không WebGL). */
export function initRoom() {
  const LGT = window.LGT, W = LGT && LGT.world;
  if (!W || !W.avatar || !W.avatar.group.parent) return null;
  const scene = W.avatar.group.parent;
  // Chuỗi đường truyền theo CONFIG.rooms: Firebase (nhanh) → Firebase khác → Apps Script (chậm nhưng luôn có). Thêm/bớt nơi chỉ cần sửa js/config.js.
  const rooms = Array.isArray(CONFIG.rooms) && CONFIG.rooms.length ? CONFIG.rooms : [{ type: 'gas', name: 'Apps Script' }];
  const makeTransport = (entry) => {
    if (!entry) return null;
    if (entry.type === 'firebase') {
      const fb = createFirebaseTransport({ config: entry.firebaseConfig, name: entry.name || 'Firebase', loadSdk: () => loadFirebaseSdk(CONFIG.firebaseSdkVersion) });
      // Cầu nối (Phiên 26): người ở Firebase và người ở Apps Script dự phòng vẫn thấy nhau. Tắt bằng gasBridgeMs: 0 trong config.js.
      return apiEnabled() && CONFIG.gasBridgeMs !== 0 ? withGasBridge(fb, { gasCall: (req) => { const { action, ...rest } = req; return callApi(action, rest); }, everyMs: CONFIG.gasBridgeMs || 4000 }) : fb;
    }
    if (apiEnabled()) return { kind: 'gas', name: entry.name || 'Apps Script', call: (req) => { const { action, ...rest } = req; return callApi(action, rest); } };
    const local = createLocalTransport();                         // chưa có apiUrl: các tab cùng trình duyệt thấy nhau
    return local ? { kind: 'local', name: 'Cục bộ', call: local, close: local.close } : null;
  };
  let client = null, roomName = '';
  const manager = createTransportManager({ rooms, makeTransport, onError: (e) => console.warn('[Diệu Giang Tự] Không vào được "' + e.name + '" (' + (e.error && e.error.message) + '), thử nơi khác'), onSwitch: (s) => { roomName = s.kind === 'firebase' ? s.name : ''; if (client) client.reset(); } });

  const setOnline = (n) => {
    const el = document.getElementById('online-tx'); if (!el) return;
    el.textContent = n == null ? 'Chùa đang đông, chưa vào được' : (roomName ? roomName + ' · ' : '') + n + ' đang online';
  };
  client = createRoomClient({
    call: manager.call, scene, pageId: newId(), onOnline: setOnline,
    onChat: (c) => document.dispatchEvent(new CustomEvent('lgt:chat', { detail: { name: c.name, text: c.text, mine: false } })),
    makeAvatar: (p) => createAvatar({ name: p.name, color: p.color, hair: p.hair, mine: false }),
    getSelf() {
      const b = document.body.classList;
      if (!b.contains('world-mode') || b.contains('entering')) return null;      // còn ở màn nhập tên
      const prof = loadProfile(localStorage), p = W.pos, av = W.avatar;
      return { n: prof.name, c: prof.color, h: prof.hair, x: p.x, y: p.y, z: p.z, r: av.group.rotation.y, s: av.state };
    },
  });

  let last = performance.now();
  (function loop(t) { const dt = Math.min(0.1, (t - last) / 1000); last = t; try { client.frame(dt); } catch (e) { console.warn('[Diệu Giang Tự] Đa người lỗi:', e && e.message); } requestAnimationFrame(loop); })(last);
  document.addEventListener('visibilitychange', () => client.setActive(!document.hidden));
  if (typeof window.addEventListener === 'function') window.addEventListener('pagehide', () => manager.close());     // rời trang: xóa nhân vật mình khỏi Firebase ngay
  client.start();

  // LGT.room.say('...'): gửi lời nhắn (giao diện chat là Phiên 15b); bong bóng của mình hiện ngay.
  LGT.room = { say(text) { const t = client.say(text); if (t && W.avatar.say) W.avatar.say(t); if (t) document.dispatchEvent(new CustomEvent('lgt:chat', { detail: { name: 'Bạn', text: t, mine: true } })); return t; }, get count() { return client.count; }, get remoteCount() { return client.remoteCount; } };
  return client;
}
