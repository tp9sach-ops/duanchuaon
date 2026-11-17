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
import { netPos } from '../world/interior.js';
import { ARENA, toNet, fromNet, inNetBox } from '../world/duel.js';
import { encodeGear } from '../world/gearSync.js';
import { hatWorn, isActive, canRevive } from '../world/items.js';       // Phiên 166: gửi vật phẩm đang dùng để người khác thấy
import { createGearView } from '../ui/remoteGear.js';     // Phiên 166: vẽ đồ của người khác (gậy, nón, ván, bánh)

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
  const gearView = createGearView();
  const avById = new Map(); let curRid = '';   // Phiên 220: nhân vật 3D của người khác theo id mạng (roomClient.frame gọi xform(p) rồi applyGear(av) cùng một người trong mỗi vòng) — để phát lại đòn/chiêu của họ (js/net/combatLink.js)
  /** Phiên 166: đồ MÌNH đang dùng → chuỗi gửi qua mạng ('' = không có gì). Tính từ LGT.items.state (js/ui/items.js) + LGT.loadout + LGT.board.status(); lỗi / chưa nạp thì coi như không có. */
  const selfGear = () => {
    try {
      const it = LGT.items, s = it && it.state, lo = LGT.loadout, bd = LGT.board, b = bd && bd.status ? bd.status() : null;
      if (!s) return '';
      return encodeGear({ staff: !!s.staff && (!lo || lo.weapon === 'nhuy'), hat: hatWorn(s), regen: isActive(s, 'hoimau'), revive: canRevive(s), ride: b && b.on ? b.hold : '' });
    } catch (_) { return ''; }
  };
  let client = null, roomName = ''; const sigListeners = new Set();   // Phiên 137: người nghe gói tin giao lưu võ thuật (js/ui/duel.js)
  const manager = createTransportManager({ rooms, makeTransport, onError: (e) => console.warn('[Diệu Giang Tự] Không vào được "' + e.name + '" (' + (e.error && e.error.message) + '), thử nơi khác'), onSwitch: (s) => { roomName = s.kind === 'firebase' ? s.name : ''; if (client) client.reset(); } });

  const setOnline = (n) => {
    const el = document.getElementById('online-tx'); if (!el) return;
    el.textContent = n == null ? 'Chùa đang đông, chưa vào được' : (roomName ? roomName + ' · ' : '') + n + ' đang online';
  };
  client = createRoomClient({
    call: manager.call, scene, pageId: newId(), roomOf: (base) => (LGT.zones ? LGT.zones.roomKey(base) : base), onOnline: setOnline,
    onChat: (c) => document.dispatchEvent(new CustomEvent('lgt:chat', { detail: { name: c.name, text: c.text, mine: false } })),
    makeAvatar: (p) => createAvatar({ name: p.name, color: p.color, hair: p.hair, mine: false }),
    applyGear: (av, tok, dt) => { if (curRid) avById.set(curRid, av); gearView.apply(av, tok, dt); }, dropGear: (av) => { for (const [k, v] of [...avById]) if (v === av) avById.delete(k); gearView.drop(av); },     // Phiên 166: đồ của người khác
    poseOf: (id) => (LGT.combatLink && LGT.combatLink.poseOf ? LGT.combatLink.poseOf(id) : null),   // Phiên 222: bay lướt / lao đầu của người khác
    xform: (p) => { curRid = p.id; if (!(LGT.zones && LGT.zones.current === ARENA.id) || !inNetBox(p.x, p.z)) return p; return fromNet(p.x, p.z); },   // võ đài: đổi vị trí đối thủ từ khung ±200 về tọa độ võ đài
    onSignal: (id, name, text) => { for (const f of [...sigListeners]) { try { f(id, name, text); } catch (e) { console.warn('[Diệu Giang Tự] Giao lưu lỗi:', e && e.message); } } },
    selfPose: () => { const p = W.pos; return { x: p.x, y: p.y, z: p.z, r: W.avatar.group.rotation.y }; },     // Phiên 91: vị trí vai của mình để đặt người đang khiêng
    getSelf() {
      const b = document.body.classList;
      if (!b.contains('world-mode') || b.contains('entering')) return null;      // còn ở màn nhập tên
      const prof = loadProfile(localStorage), p = W.pos, av = W.avatar;
      const inArena = !!(LGT.zones && LGT.zones.current === ARENA.id);   // Phiên 137: ở võ đài (x ≈ 580) báo vị trí "mượn" trong khung ±200 (Firebase từ chối ngoài khung)
      const np = inArena ? { ...toNet(p.x, p.z), r: null } : netPos(LGT.land && LGT.land.state, p);   // đang ở trong nhà: người khác thấy bạn đứng trước cửa nhà (phòng nằm ngoài giới hạn ±200 của máy chủ)
      return { n: prof.name, c: prof.color, h: prof.hair, x: np.x, y: np.r == null ? p.y : 0, z: np.z, r: np.r == null ? av.group.rotation.y : np.r, s: np.r == null ? (av.state === 'glide' ? 'idle' : av.state) : 'idle', i: selfGear() };   // Phiên 196: 'glide' (bay lướt) chỉ hiện ở máy mình; người khác thấy 'idle' vì luật Firebase chỉ nhận 6 trạng thái cũ
    },
  });

  let last = performance.now();
  (function loop(t) { const dt = Math.min(0.1, (t - last) / 1000); last = t; try { client.frame(dt); } catch (e) { console.warn('[Diệu Giang Tự] Đa người lỗi:', e && e.message); } requestAnimationFrame(loop); })(last);
  document.addEventListener('visibilitychange', () => client.setActive(!document.hidden));
  if (typeof window.addEventListener === 'function') window.addEventListener('pagehide', () => manager.close());     // rời trang: xóa nhân vật mình khỏi Firebase ngay
  client.start();

  // LGT.room.say('...'): gửi lời nhắn (giao diện chat là Phiên 15b); bong bóng của mình hiện ngay.
  LGT.room = { id: client.pageId, players: () => client.players(), hold: (id) => client.hold(id), toss: (id, to) => client.toss(id, to), get count() { return client.count; }, name: () => { try { return loadProfile(localStorage).name; } catch (_) { return 'Khách'; } }, say(text) { const t = client.say(text); if (t && W.avatar.say) W.avatar.say(t); if (t) document.dispatchEvent(new CustomEvent('lgt:chat', { detail: { name: 'Bạn', text: t, mine: true } })); return t; }, get count() { return client.count; }, get remoteCount() { return client.remoteCount; } };
  // Phiên 137: kênh gói tin giao lưu võ thuật. selfId = mã của mình trong mắt người khác (Firebase: uid; Apps Script: mã trang).
  LGT.room.signal = (text) => client.signal(text);
  LGT.room.onSignal = (f) => { sigListeners.add(f); return () => sigListeners.delete(f); };
  LGT.room.selfId = () => { const tr = manager.transport; return (tr && tr.uid) || client.pageId; };
  // Phiên 220 (mục 1): MỌI NGƯỜI THẤY CHIẾN ĐẤU CỦA NHAU — đòn đánh, chiêu, hiệu ứng, âm thanh, quái đang bị đánh + máu quái + động tác quái (js/net/combatLink.js, logic js/world/combatShare.js). Lỗi thì vẫn chơi như cũ.
  Promise.all([import('./combatLink.js'), import('../scene/slashFx.js'), import('../scene/chieuFx.js'), import('../scene/farm.js'), import('../world/chieuFxPlan.js'), import('../ui/dragonFx.js')]).then(([cl, sl, cf, fm, plan, dfx]) => {
    const castFxer = cf.createChieuFx(scene, { getTier: () => plan.tierOf(LGT.perfLevel) });   // bộ hiệu ứng chiêu RIÊNG cho chiêu của người khác (không rung màn hình / không đứng hình của mình)
    const dragonFx = dfx.createDragonFx(scene, 6);   // Phiên 223: rồng hồng của người khác (tối đa 6 con cùng lúc)
    const ghostView = fm.buildFarm(); scene.add(ghostView.group);                               // bộ vẽ quái RIÊNG cho bóng quái của người khác
    const link = cl.createCombatLink({
      LGT, W, getTransport: () => manager.transport, avatarOf: (id) => avById.get(id) || null, roomOf: () => (LGT.zones ? LGT.zones.roomKey('main') : 'main'),
      makeSlash: () => sl.createSlashFx(scene), dragonFx, castFx: (id, o) => castFxer.cast(id, o), ghostView, getCamera: () => (LGT.view && LGT.view.camera) || null,
      skipOut: () => !!(LGT.zones && LGT.zones.current === ARENA.id),   // Võ đài có kênh gói riêng (js/ui/duel.js): không phát đòn Võ đài ra kênh chiến đấu bãi rừng
    });
    LGT.combatLink = link; link.start();
  }).catch((e) => console.warn('[Diệu Giang Tự] Đồng bộ chiến đấu lỗi:', e && e.message));
  import('../ui/duel.js').then((m) => m.initDuel({ toast: (t, ms) => LGT.toast && LGT.toast(t, ms) })).catch((e) => console.warn('[Diệu Giang Tự] Giao lưu võ thuật lỗi:', e && e.message));
  return client;
}
