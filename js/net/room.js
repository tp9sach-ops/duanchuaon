// Nối đa người vào cảnh thật: dùng LGT.world (vị trí/trạng thái của mình), avatar.js (dựng người khác), api.js (Apps Script).
// Không sửa world.js/hud.js: lấy `scene` từ nhân vật của mình, tự chạy vòng requestAnimationFrame riêng, ghi số người vào #online-tx.
// Khi chưa có apiUrl: các tab cùng trình duyệt thấy nhau (BroadcastChannel) để thử cục bộ.
import { callApi, apiEnabled } from '../api.js';
import { createAvatar } from '../world/avatar.js';
import { loadProfile } from '../ui/hudLogic.js';
import { createRoomClient, createLocalTransport } from './roomClient.js';

const newId = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

/** Gọi sau initHud(). Trả client hoặc null nếu không có chế độ đi bộ (fallback không WebGL). */
export function initRoom() {
  const LGT = window.LGT, W = LGT && LGT.world;
  if (!W || !W.avatar || !W.avatar.group.parent) return null;
  const scene = W.avatar.group.parent;
  const call = apiEnabled() ? (req) => { const { action, ...rest } = req; return callApi(action, rest); } : createLocalTransport();
  if (!call) return null;

  const setOnline = (n) => {
    const el = document.getElementById('online-tx'); if (!el) return;
    el.textContent = n == null ? 'Chùa đang đông, chưa vào được' : n + ' đang online';
  };
  const client = createRoomClient({
    call, scene, pageId: newId(), onOnline: setOnline,
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
  client.start();

  // LGT.room.say('...'): gửi lời nhắn (giao diện chat là Phiên 15b); bong bóng của mình hiện ngay.
  LGT.room = { say(text) { const t = client.say(text); if (t && W.avatar.say) W.avatar.say(t); if (t) document.dispatchEvent(new CustomEvent('lgt:chat', { detail: { name: 'Bạn', text: t, mine: true } })); return t; }, get count() { return client.count; }, get remoteCount() { return client.remoteCount; } };
  return client;
}
