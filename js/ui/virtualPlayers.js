// Người chơi ảo — Phiên 235, BƯỚC 1 (phần dựng trong cảnh + lệnh). Logic thuần ở js/world/virtualPlayers.js (có test).
// Lệnh "/nguoichoiao": mỗi lần gõ thêm đúng 1 người ảo (tên ngẫu nhiên tự nhiên, dáng + áo ngẫu nhiên) đi dạo trong sân, thỉnh thoảng nói một câu.
// Tin bắt đầu bằng "/" KHÔNG BAO GIỜ gửi lên mạng: khung chat (js/ui/chat.js) gọi LGT.virtual.command() và chỉ hiện kết quả cho người gõ.
// Bước 1: người ảo CHỈ hiện ở máy người gõ lệnh; đồng bộ cho mọi người online thấy là bước 2 (xem docs/PHIEN235_NGUOICHOIAO.md).
import { createAvatar } from '../world/avatar.js';
import { createVirtual, parseSlash, VP_CFG } from '../world/virtualPlayers.js';
import { solidAt, groundY, POND, HUB } from '../world/layout.js';

const blocked = (x, z) => solidAt(x, z, 0.5) || Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.5;

export function initVirtual() {
  const LGT = window.LGT, W = LGT && LGT.world;
  if (!W || !W.avatar || !W.avatar.group.parent) return null;       // không có chế độ đi bộ (fallback không WebGL): bỏ qua
  const scene = W.avatar.group.parent, vp = createVirtual({ blocked }), views = new Map();   // id → avatar
  const used = () => { const s = new Set(); try { const n = LGT.room && LGT.room.name && LGT.room.name(); if (n) s.add(n); for (const p of (LGT.room && LGT.room.players()) || []) s.add(p.n); } catch (_) { /* bỏ qua */ } return s; };   // tên người thật đang thấy: người ảo không đặt trùng

  function spawn() {
    const p = vp.add(used()); if (!p) return null;
    const av = createAvatar({ name: p.name, color: p.color, hair: p.hair, mine: false });
    av.group.position.set(p.brain.state.x, groundY(p.brain.state.x, p.brain.state.z), p.brain.state.z); av.setFacing(p.brain.state.ry, true); scene.add(av.group); views.set(p.id, av);
    return p;
  }
  function clear() { for (const av of views.values()) { scene.remove(av.group); av.dispose(); } views.clear(); vp.clear(); }

  let last = performance.now();
  (function loop(t) {
    const dt = Math.min(0.1, (t - last) / 1000); last = t;
    try {
      const hub = !LGT.zones || !LGT.zones.current || LGT.zones.current === HUB;   // sang võ đài / phó bản / luyện chiêu thì ẩn (bước 2 cho họ đi theo vùng đang chơi)
      for (const p of vp.list) {
        const av = views.get(p.id); if (!av) continue;
        av.group.visible = hub; if (!hub) continue;
        const r = p.brain.step(dt);
        av.group.position.set(r.x, groundY(r.x, r.z), r.z); av.setFacing(r.ry); av.setState(r.state, r.speed); av.update(dt);
        if (r.say) av.say(r.say);
      }
    } catch (e) { console.warn('[Diệu Giang Tự] Người chơi ảo lỗi:', e && e.message); }
    requestAnimationFrame(loop);
  })(last);

  /** Chạy một lệnh gạch chéo. Trả chuỗi báo lại cho NGƯỜI GÕ (không gửi đi đâu), hoặc null nếu tin không bắt đầu bằng "/". */
  function command(text) {
    const c = parseSlash(text); if (!c) return null;
    if (c.cmd === 'nguoichoiao') {
      if (c.args[0] === 'xoa') { const n = vp.count; clear(); return n ? `Đã cho ${n} người chơi ảo rời đi.` : 'Hiện chưa có người chơi ảo nào.'; }
      const p = spawn(); if (!p) return `Đã đủ ${VP_CFG.max} người chơi ảo, không thêm nữa được.`;
      return `Đã thêm người chơi ảo "${p.name}" (${vp.count}/${VP_CFG.max}). Gõ /nguoichoiao thêm lần nữa để thêm người; /nguoichoiao xoa để cho tất cả rời đi.`;
    }
    return 'Chưa có lệnh "/' + c.cmd + '". Lệnh hiện có: /nguoichoiao';
  }
  LGT.virtual = { command, spawn, clear, get count() { return vp.count; }, players: () => vp.list.map((p) => ({ id: p.id, name: p.name })) };
  return LGT.virtual;
}
