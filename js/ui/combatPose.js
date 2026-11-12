// Tư thế chiến đấu theo clip mẫu (Phiên 119, mở rộng Phiên 126): nối các đòn có sẵn (Thương, Ném đá, tự động hàng yêu) với hoạt ảnh nhân vật + vệt chém, KHÔNG sửa logic đánh.
// Cách làm: mỗi 40 ms đọc LGT.yq.status() và LGT.farm.status(); hồi chiêu Thương/Ném đá vừa nhảy lên = vừa ra đòn (kể cả khi tự động đánh) →
//   quay mặt về phía mục tiêu, avatar.swing() (tự nối chuỗi múa côn → chém ngang → chém ngược → xoay 360°) + vệt chém. Ném đá cũng hiện thành đòn đánh thường (Phiên 126: bỏ ném đá).
//   Đang giao chiến (vừa ra đòn ≤ 4,5 giây, hoặc có yêu quái / quái gần) → avatar.setStance(true): đứng thế sẵn sàng, chạy nghiêng người.
// Phiên 126: (1) thanh Sinh Lực + Chân khí trên đầu khi giao chiến; (2) quái vừa bị hạ → hồn bay vào hồ lô ở eo (js/world/soul.js, js/scene/soulFx.js).
// Chân khí (mana) hiện CHỈ HIỂN THỊ (TẠM): Chém khí tốn 30, tự hồi 5/giây, chưa chặn skill khi hết. Sinh Lực lấy từ LGT.farmCombat (js/ui/farmCombat.js).
// Skill Chém khí (js/ui/conKhi.js) tự gọi avatar.swing(SWING_S) → avatarChibi đổi thành kiểu 'khi' (giơ cao bổ xuống), không cần nối thêm ở đây.
import { createSlashFx } from '../scene/slashFx.js';
import { createSoulFx } from '../scene/soulFx.js';
import { diffMons, killed, soulColor } from '../world/soul.js';

const STANCE_HOLD_MS = 4500, POLL_MS = 40, MANA_MAX = 100, MANA_SKILL = 30, MANA_REGEN = 5, BARS_HOLD_MS = 3000;

export function initCombatPose() {
  const LGT = window.LGT || (window.LGT = {});
  let fx = null, soul = null, fightUntil = 0, wantStance = false, lastAttack = -1e9, lastTick = performance.now(), mana = MANA_MAX, monMap = null;
  const prev = { ys: 0, yt: 0, fs: 0, ft: 0 }, wrapped = new WeakSet();
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
  function ensureFx() {
    if (!fx && LGT.scene) { try { fx = createSlashFx(LGT.scene); } catch (_) { fx = null; } }
    if (!soul && LGT.scene) { try { soul = createSoulFx(LGT.scene); } catch (_) { soul = null; } }
  }
  const gourd = (av) => () => (av && av.gourdPos ? av.gourdPos() : null);
  function trackMana(av) {   // skill Chém khí = swing(số): trừ Chân khí một lần mỗi lần dùng
    if (wrapped.has(av) || !av.swing) return; wrapped.add(av);
    const orig = av.swing; av.swing = (a) => { if (typeof a === 'number') mana = Math.max(0, mana - MANA_SKILL); return orig(a); };
  }
  function tick() {
    const w = LGT.world, av = w && w.avatar; if (!av || !av.swing) return;
    const now = performance.now(), dt = Math.min(0.25, (now - lastTick) / 1000); lastTick = now;
    trackMana(av); mana = Math.min(MANA_MAX, mana + MANA_REGEN * dt);
    let ys = null, fs = null; try { ys = LGT.yq && LGT.yq.status ? LGT.yq.status() : null; fs = LGT.farm && LGT.farm.status ? LGT.farm.status() : null; } catch (_) { /* bỏ qua */ }
    const spear = rose('ys', ys ? ys.spearCd : 0) | rose('fs', fs ? fs.spearCd : 0), stone = rose('yt', ys ? ys.stoneCd : 0) | rose('ft', fs ? fs.stoneCd : 0);
    if (spear || stone) {
      fightUntil = now + STANCE_HOLD_MS; lastAttack = now;
      const ry = faceTarget(w); ensureFx();
      const kind = av.swing(); if (kind && fx) fx.slash(kind, ry, now);   // Thương và Ném đá đều hiện thành đòn đánh thường (chuỗi múa côn → chém → xoay)
    }
    // Quái vừa bị hạ ngay sau khi ra đòn → hồn bay vào hồ lô
    const mons = LGT.farmView && LGT.farmView.mons ? LGT.farmView.mons : [], d = diffMons(monMap, mons, now); monMap = d.next;
    if (d.gone.length && w.pos) {
      const dead = killed(d.gone, { now, lastAttack, player: w.pos });
      if (dead.length) { ensureFx(); if (soul) for (const e of dead) soul.launch({ x: e.x, y: 0.9, z: e.z }, soulColor(e.he), now, () => { if (av.pulseGourd) av.pulseGourd(); }); }
    }
    const fc = LGT.farmCombat, fighting = now < fightUntil || !!(ys && ys.active) || !!(fs && fs.active) || !!(fc && fc.engaged > 0), hurt = !!(fc && fc.max && fc.hp < fc.max);
    if (fighting !== wantStance) { wantStance = fighting; if (av.setStance) av.setStance(fighting); }
    if (av.setBars) av.setBars(fc && fc.max && (fighting || hurt || now < lastAttack + BARS_HOLD_MS) ? fc.hp / fc.max : null, mana / MANA_MAX);
    if (fx && w.pos) fx.update(w.pos, now);
    if (soul) soul.update(gourd(av), now);
  }
  setInterval(tick, POLL_MS);
  // Vệt chém và hồn bay cần cập nhật theo từng khung hình (mượt hơn 40 ms).
  (function loop() { const w = LGT.world, now = performance.now(); if (fx && w && w.pos) fx.update(w.pos, now); if (soul && w && w.avatar) soul.update(gourd(w.avatar), now); requestAnimationFrame(loop); })();
  LGT.combatPose = { get stance() { return wantStance; }, get mana() { return mana; } };
  return LGT.combatPose;
}
