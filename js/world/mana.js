// CHÂN KHÍ (MANA) THẬT (Phiên 215, mục 2): dùng chiêu / Chém khí TỐN Chân khí, thiếu thì KHÔNG tung được; tự hồi theo thời gian. LOGIC THUẦN, có test: tests/mana.test.mjs.
// Trước đây Chân khí chỉ hiển thị (js/ui/combatPose.js tự trừ 30 mỗi lần Chém khí, không chặn). Nay MỘT kho dùng chung: LGT.mana (manaPool). Mọi con số là TẠM, chờ ptg duyệt.
// Nối: js/ui/heSkill.js (chiêu ô 1–4 + Tuyệt Học: kiểm trước khi tung, trừ khi tung được), js/ui/conKhi.js (Chém khí), js/ui/combatPose.js (thanh Chân khí trên đầu đọc kho này).
// Khu luyện tập và Võ đài KHÔNG tốn Chân khí (đi đường riêng trong heSkill.js).
export const MANA = Object.freeze({
  base: 100,                 // Chân khí tối đa ở cấp 1
  perLevel: 1,               // + mỗi cấp hiệu dụng
  regen: 5,                  // /giây
  khi: 30,                   // Chém khí (Côn Khí Trảm)
  cost: Object.freeze({ 1: 15, 2: 20, 3: 25, 4: 40, tuyet: 60 }),   // theo ô chiêu
});
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

/** Chân khí tối đa theo cấp hiệu dụng (cấp lạ → coi là 1). */
export const maxMana = (level) => MANA.base + MANA.perLevel * (Math.max(1, Math.floor(num(level, 1))) - 1);
/** Chân khí một lần tung chiêu ở ô `slot` (1,2,3,4,'tuyet'); ô lạ → 0 (không tốn, không chặn). */
export const costOf = (slot) => (Object.hasOwn(MANA.cost, String(slot)) ? MANA.cost[String(slot)] : 0);

/** Kho Chân khí tự hồi theo đồng hồ (không cần vòng lặp). now() trả giây. */
export function createMana({ max = MANA.base, regen = MANA.regen, now = () => performance.now() / 1000 } = {}) {
  let m = Math.max(1, num(max, MANA.base)), v = m, t = num(now());
  const sync = () => { const n = num(now(), t), dt = Math.max(0, n - t); t = n; if (dt > 0) v = Math.min(m, v + regen * dt); };
  return {
    get value() { sync(); return v; },
    get max() { return m; },
    get ratio() { sync(); return m > 0 ? v / m : 0; },
    /** Đổi mức tối đa (lên cấp): tăng thì cộng thêm phần chênh vào Chân khí hiện có; giảm thì cắt xuống. */
    setMax(x) { sync(); const nm = Math.max(1, num(x, m)); if (nm > m) v += nm - m; m = nm; v = Math.min(v, m); },
    can(n) { sync(); return v + 1e-9 >= Math.max(0, num(n)); },
    /** Trừ n nếu đủ; không đủ thì giữ nguyên và trả false. */
    spend(n) { sync(); const c = Math.max(0, num(n)); if (v + 1e-9 < c) return false; v = Math.max(0, v - c); return true; },
    refill() { sync(); v = m; },
  };
}
/** Kho dùng chung của game: LGT.mana (tạo một lần). */
export function manaPool(LGT) { return LGT.mana || (LGT.mana = createMana()); }
