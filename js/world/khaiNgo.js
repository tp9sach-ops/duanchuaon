// Lễ Khai Ngộ (G2.4, GDD v2 mục 5.2 và 5.6). LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ): `now` là giây do người gọi đưa vào.
// Luồng: đủ Tu Vi 10 → ngồi vào bồ đoàn của một Hệ → 60 giây dùng thử Skill 1 của Hệ đó → xác nhận (hoặc đứng dậy / ngồi bồ đoàn khác).
// Lần đầu miễn phí. Đã có Hệ rồi mà muốn đổi sang Hệ KHÁC = "Tái Khai Ngộ": tốn 20 lá bồ đề (TẠM), giữ Tu Vi, kỹ năng về cấp 1 (phần về cấp 1 do skillEngine.setHe làm).
// Module này KHÔNG trừ lá bồ đề và KHÔNG ghi localStorage: người gọi làm theo kết quả trả về (xem `confirm`, `loadHe`).
// Số liệu: js/data/skillCfg.js → KHAI_NGO (TẠM). Test: tests/khaingo.test.mjs.
import { KHAI_NGO as C } from '../data/skillCfg.js';
import { normHe } from './elements.js';
import { skillFor } from './skillCatalog.js';
import { createSkillRuntime } from './skillEngine.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const round4 = (x) => Math.round(x * 1e4) / 1e4;

/** Đủ Tu Vi để làm Lễ Khai Ngộ (≥ 10)? Tu Vi lạ → false. */
export const canKhaiNgo = (tuvi) => num(tuvi, 0) >= C.tuViMin;
/** Đọc Hệ đã lưu (chuỗi trong localStorage, có thể hỏng/lạ) → mã Hệ hoặc null. */
export const loadHe = (raw) => normHe(typeof raw === 'string' ? raw.replace(/^"|"$/g, '') : null);
/** Chi phí lá bồ đề để xác nhận Hệ `target` khi đang giữ Hệ `current`: 0 nếu chưa có Hệ hoặc chọn lại đúng Hệ đó (không xảy ra, xem `confirm`); 20 nếu đổi sang Hệ khác. */
export const costOf = (current, target) => {
  const c = normHe(current), t = normHe(target);
  return c && t && c !== t ? C.taiKhaiLa : 0;
};

/**
 * Một phiên làm lễ của một người chơi. opts: { tuvi, he (Hệ đang có hoặc null) }.
 * Trạng thái: 'idle' (chưa ngồi) → 'trial' (đang ngồi bồ đoàn một Hệ, có 60 giây dùng thử) → 'done' (đã xác nhận).
 */
export function createKhaiNgo(opts = {}) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const tuvi = Math.max(0, num(o.tuvi));
  const current = normHe(o.he);
  let seatHe = null, startAt = 0, state = 'idle', chosen = null;
  // Dùng lại bộ máy kỹ năng thật để dùng thử có hồi chiêu đúng như khi chơi (Skill 1 của Hệ đang ngồi); tạo mới mỗi lần ngồi.
  let rt = null;

  const trialLeft = (now) => (state === 'trial' ? Math.max(0, round4(C.trialSec - (num(now) - startAt))) : 0);

  return {
    get state() { return state; }, get seatHe() { return seatHe; }, get chosen() { return chosen; }, get current() { return current; },
    /** Ngồi vào bồ đoàn của Hệ `he` tại `now`. Ngồi bồ đoàn khác = đổi Hệ đang xem thử và tính lại 60 giây. Ngồi lại đúng bồ đoàn đang ngồi → không đổi. */
    sit(he, now) {
      if (state === 'done') return { ok: false, reason: 'da-xong' };
      if (!canKhaiNgo(tuvi)) return { ok: false, reason: 'chua-du-tu-vi', need: C.tuViMin };
      const h = normHe(he); if (!h) return { ok: false, reason: 'khong-co-he' };
      if (state === 'trial' && seatHe === h) return { ok: true, he: h, trialLeft: trialLeft(now), again: true };
      seatHe = h; startAt = num(now); state = 'trial';
      rt = createSkillRuntime({ he: h, tuvi });
      return { ok: true, he: h, trialLeft: C.trialSec };
    },
    /** Đứng dậy giữa chừng: bỏ chọn, không đổi gì. */
    standUp() { if (state === 'trial') { state = 'idle'; seatHe = null; rt = null; } return state; },
    /** Số giây dùng thử còn lại (0 khi hết hoặc chưa ngồi). */
    trialLeft,
    /** Còn trong thời gian dùng thử? */
    trialActive: (now) => trialLeft(now) > 0,
    /** Skill 1 của Hệ đang ngồi (đối tượng trong skillCatalog) hoặc null. */
    trialSkill: () => (state === 'trial' ? skillFor(seatHe, 1) : null),
    /**
     * Dùng thử Skill 1 tại `now`. Chỉ dùng được trong 60 giây; có hồi chiêu như thật.
     * Thất bại: { ok:false, reason: 'chua-ngoi' | 'het-gio' | 'hoi-chieu' (+left) | ... }. Thành công: { ok:true, skill, heSo } như skillEngine.tryCast.
     */
    tryTrial(now) {
      if (state !== 'trial') return { ok: false, reason: 'chua-ngoi' };
      if (trialLeft(now) <= 0) return { ok: false, reason: 'het-gio' };
      return rt.tryCast(1, now);
    },
    /**
     * Xác nhận chọn Hệ đang ngồi. in: { laBoDe (số lá bồ đề đang có) }. Có thể xác nhận cả khi hết 60 giây dùng thử (dùng thử chỉ là tùy chọn, TẠM).
     * Thất bại: { ok:false, reason: 'chua-ngoi' | 'cung-he' (đã có đúng Hệ này) | 'thieu-la' (+need, have) }.
     * Thành công: { ok:true, he, cost (lá bồ đề người gọi phải TRỪ: 0 lần đầu, 20 khi đổi Hệ), reset (true nếu đổi từ Hệ khác: gọi skillEngine.setHe để đưa kỹ năng về cấp 1) }.
     * Người gọi lưu Hệ vào localStorage[KHAI_NGO.heKey] và gọi setHe — module này không làm hộ.
     */
    confirm({ laBoDe = 0 } = {}) {
      if (state !== 'trial') return { ok: false, reason: 'chua-ngoi' };
      if (current && current === seatHe) return { ok: false, reason: 'cung-he' };
      const cost = costOf(current, seatHe), have = Math.max(0, Math.floor(num(laBoDe)));
      if (have < cost) return { ok: false, reason: 'thieu-la', need: cost, have };
      chosen = seatHe; state = 'done';
      return { ok: true, he: chosen, cost, reset: !!current };
    },
  };
}
