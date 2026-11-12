// Tư thế chiến đấu theo clip mẫu (Phiên 119): nối các đòn có sẵn (Thương, Ném đá, tự động hàng yêu) với hoạt ảnh nhân vật + vệt chém, KHÔNG sửa logic đánh.
// Cách làm: mỗi 40 ms đọc LGT.yq.status() và LGT.farm.status(); hồi chiêu Thương/Ném đá vừa nhảy lên = vừa ra đòn (kể cả khi tự động đánh) →
//   Thương: quay mặt về phía mục tiêu, avatar.swing() (tự nối chuỗi ngang → ngược → xoay) + vệt chém; Ném đá: avatar.act('throw').
//   Đang giao chiến (vừa ra đòn ≤ 4,5 giây, hoặc có yêu quái / quái gần) → avatar.setStance(true): đứng thế sẵn sàng, chạy nghiêng người.
// Skill Chém khí (js/ui/conKhi.js) tự gọi avatar.swing(SWING_S) → avatarChibi đổi thành kiểu 'khi' (giơ cao bổ xuống), không cần nối thêm ở đây.
import { createSlashFx } from '../scene/slashFx.js';

const STANCE_HOLD_MS = 4500, POLL_MS = 40;

export function initCombatPose() {
  const LGT = window.LGT || (window.LGT = {});
  let fx = null, fightUntil = 0, wantStance = false;
  const prev = { ys: 0, yt: 0, fs: 0, ft: 0 };
  const rose = (key, cd) => { const up = cd > prev[key] + 0.05; prev[key] = cd; return up; };

  function targetPos() {
    const b = LGT.yq && LGT.yq.active ? LGT.yq.boss : null; if (b) return { x: b.x, z: b.z };
    const v = LGT.farmView; if (v && v.target) { const m = (v.mons || []).find((x) => x.uid === v.target); if (m) return { x: m.x, z: m.z }; }
    return null;
  }
  function faceTarget(w) {
    const t = targetPos(), p = w.pos; if (!t || !p) return w.facing || 0;
    const ry = Math.atan2(t.x - p.x, t.z - p.z); if (w.face) w.face(ry); return ry;
  }
  function tick() {
    const w = LGT.world, av = w && w.avatar; if (!av || !av.swing) return;
    const now = performance.now();
    let ys = null, fs = null; try { ys = LGT.yq && LGT.yq.status ? LGT.yq.status() : null; fs = LGT.farm && LGT.farm.status ? LGT.farm.status() : null; } catch (_) { /* bỏ qua */ }
    const spear = rose('ys', ys ? ys.spearCd : 0) | rose('fs', fs ? fs.spearCd : 0), stone = rose('yt', ys ? ys.stoneCd : 0) | rose('ft', fs ? fs.stoneCd : 0);
    if (spear || stone) {
      fightUntil = now + STANCE_HOLD_MS;
      const ry = faceTarget(w);
      if (spear) { const kind = av.swing(); if (kind) { if (!fx && LGT.scene) { try { fx = createSlashFx(LGT.scene); } catch (_) { fx = null; } } if (fx) fx.slash(kind, ry, now); } }
      else if (av.act) av.act('throw');
    }
    const engaged = now < fightUntil || !!(ys && ys.active) || !!(fs && fs.active);
    if (engaged !== wantStance) { wantStance = engaged; if (av.setStance) av.setStance(engaged); }
    if (fx && w.pos) fx.update(w.pos, now);
  }
  setInterval(tick, POLL_MS);
  // Vệt chém cần cập nhật theo từng khung hình (mượt hơn 40 ms).
  (function loop() { const w = LGT.world; if (fx && w && w.pos) fx.update(w.pos, performance.now()); requestAnimationFrame(loop); })();
  LGT.combatPose = { get stance() { return wantStance; } };
  return LGT.combatPose;
}
