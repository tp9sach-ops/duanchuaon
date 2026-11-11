// Khiêng / ném vật nặng (Phiên 63): điều khiển bằng nút Khiêng / Ném / Đặt xuống trong cụm nút góc phải-dưới (js/ui/dock.js). Logic ở js/world/strength.js (có test).
// Đặt LGT.carry = { status(), pickup(), throw(), drop(), get strength }; LGT.strength = { value, tier, limit }; LGT.carryNear = vật gần nhất (cảnh 3D vẽ vòng sáng).
import { createCarry, strengthOf, tierOf, carryLimit, throwRange, strengthNeeded, PICK_RADIUS } from '../world/strength.js';
import { levelOf } from '../world/quests.js';
import { lifetimeSen } from '../world/merit.js';

/** opts: { toast(text, ms) }. */
export function initCarry({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  const world = LGT.carryWorld || (LGT.carryWorld = createCarry());
  const level = () => levelOf(LGT.quests && LGT.quests.prog ? LGT.quests.prog.xp : 0).lv;
  const total = () => { const sen = LGT.getSen ? LGT.getSen() : 0; return lifetimeSen(sen, LGT.merit && LGT.merit.leaf ? LGT.merit.leaf : null); };
  const str = () => strengthOf({ level: level(), khinh: LGT.skill ? LGT.skill.level : 0, sen: total(), bonus: LGT.yq ? LGT.yq.bonus : 0 });   // bonus: sức mạnh từ thu phục yêu quái
  const pos = () => (LGT.world && LGT.world.pos) || null;
  const av = () => (LGT.world && LGT.world.avatar) || null;
  const ry = () => { const a = LGT.world && LGT.world.avatar; return a && a.group ? a.group.rotation.y : 0; };
  const usable = () => !!LGT.world && LGT.world.mode === 'free' && !LGT.inHouse;

  function status() {
    const held = world.held, near = usable() && !held ? world.nearest(pos()) : null; LGT.carryNear = near;
    return { holding: !!held, heldName: held ? held.def.ten : '', near: near ? near.def.ten : '', nearId: near ? near.id : '', usable: usable() };
  }
  function pickup() {
    if (!usable()) return; const near = world.nearest(pos()); if (!near) { toast('Không có vật nào ở gần để khiêng.', 2200); return; }
    const r = world.pickup(near.id, str(), pos());
    if (r.ok) { try { av() && av().act('grab'); } catch (_) { /* bỏ qua */ } toast(`Bạn khiêng ${near.def.ten} (${near.def.kg} kg). Bấm “Ném” hoặc “Đặt xuống”.`, 3200); return; }
    if (r.reason === 'heavy') toast(`${near.def.ten} nặng ${near.def.kg} kg — cần sức mạnh ${r.need}, bạn mới có ${str()} (${tierOf(str())}). Tăng cấp, luyện Khinh thân và tích công đức để khỏe hơn.`, 5200);
    else if (r.reason === 'busy') toast('Tay bạn đang khiêng một vật rồi.', 2200);
  }
  function throwIt() {
    const p = pos(); if (!p || !world.held) return; const it = world.held, s = str();
    const r = world.throwHeld(p, ry(), s); if (!r.ok) return;
    try { av() && av().act('throw'); } catch (_) { /* bỏ qua */ }   // Phiên 99: tay phải vung ném
    toast(`Bạn ném ${it.def.ten} ra xa khoảng ${Math.round(r.to ? Math.hypot(r.to.x - p.x, r.to.z - p.z) : r.range)} m.`, 2400);
  }
  function drop() { const p = pos(); if (!p || !world.held) return; const it = world.drop(p, ry()); if (it) toast(`Đã đặt ${it.def.ten} xuống.`, 1800); }
  // vật bay/nằm yên được tiến theo thời gian thực (giao diện chạy 10 lần/giây; cảnh 3D chỉ đọc vị trí)
  let last = performance.now();
  setInterval(() => { const n = performance.now(), dt = (n - last) / 1000; last = n; world.step(dt); status(); }, 100);
  // vào nhà / ngồi khi đang khiêng → đặt xuống để vật không biến mất khỏi thế giới
  setInterval(() => { if (world.held && LGT.world && (LGT.inHouse || LGT.world.mode !== 'free')) drop(); }, 500);

  LGT.strength = { get value() { return str(); }, get tier() { return tierOf(str()); }, get limit() { return carryLimit(str()); }, rangeFor: (kg) => throwRange(str(), kg), need: strengthNeeded };
  LGT.carry = { status, pickup, throw: throwIt, drop, get strength() { return str(); }, world, radius: PICK_RADIUS };
  return LGT.carry;
}
