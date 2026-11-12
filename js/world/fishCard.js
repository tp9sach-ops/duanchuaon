// THẺ CÁ khi vừa câu được (Phiên 120, theo clip mẫu: "Cá thu đột biến — Kích thước 208 cm — Kỷ lục cao nhất — Bảo quản / Khoe"). LOGIC THUẦN, có test: tests/fishpose.test.mjs.
// Cỡ cá (cm) chỉ để hiển thị + kỷ lục: KHÔNG lưu trong ao (js/world/fishing.js không đổi); kỷ lục từng loài lưu riêng ở localStorage['lgt.fishrec'] bởi js/ui/fishing.js.
import { speciesById, releaseSen } from './fishing.js';

/** Khoảng cỡ (cm) từng loài. Loài lạ dùng DEFAULT. Cá cỡ lớn (lon) rơi vào nửa trên khoảng, ×1,0–1,35. */
export const SIZE_CM = {
  chep: [30, 70], tre: [25, 60], loc: [30, 80], ro: [8, 22], ruanuoc: [15, 40], baba: [25, 55], mucong: [15, 45],
  koi: [40, 90], chepvang: [30, 60], taituong: [40, 90], ruavang: [20, 50], babahoa: [30, 60], mucnang: [25, 60],
  bongsuoi: [5, 15], chachsuoi: [8, 20], caleng: [30, 80],
};
export const DEFAULT_CM = [15, 50];
export const MAX_REC = 100000;

/** Bốc cỡ (cm, số nguyên) cho một con cá { sp, lon }. rng() trả [0,1). */
export function rollSizeCm(fish, rng = Math.random) {
  const sp = fish && speciesById(fish.sp), r = SIZE_CM[sp ? sp.id : ''] || DEFAULT_CM, lo = r[0], hi = r[1];
  let u = Math.min(0.999999, Math.max(0, +rng() || 0));
  if (fish && fish.lon === true) u = 0.5 + u * 0.5;   // cỡ lớn: nửa trên của khoảng
  const base = lo + (hi - lo) * u, boost = fish && fish.lon === true ? 1 + 0.35 * u : 1;
  return Math.max(1, Math.round(base * boost));
}

/** Đọc sổ kỷ lục { idLoài: cm } (chuỗi JSON hoặc đối tượng); hỏng → {}. */
export function loadRec(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const out = {}; if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
  for (const k of Object.keys(o)) { if (!speciesById(k)) continue; const v = Math.floor(+o[k]); if (Number.isFinite(v) && v > 0) out[k] = Math.min(MAX_REC, v); }
  return out;
}

/** Ghi kỷ lục nếu cao hơn. Trả { rec (bản mới), best (kỷ lục sau khi ghi), isNew (phá kỷ lục), first (loài chưa từng có kỷ lục) }. Không sửa rec cũ. */
export function noteRecord(rec, fish, cm) {
  const r = loadRec(rec), id = fish && fish.sp, v = Math.floor(+cm);
  if (!speciesById(id) || !(v > 0)) return { rec: r, best: 0, isNew: false, first: false };
  const old = r[id] || 0, first = old === 0;
  if (v > old) { r[id] = Math.min(MAX_REC, v); return { rec: r, best: r[id], isNew: true, first }; }
  return { rec: r, best: old, isNew: false, first: false };
}

/** Dữ liệu vẽ thẻ. isNewSpecies = loài chưa có trong sổ sưu tầm (LGT.fishing.state.dex) trước con này. */
export function cardData(fish, cm, rec = {}, isNewSpecies = false) {
  const sp = fish && speciesById(fish.sp); if (!sp) return null;
  const best = Math.max(+rec.best || 0, Math.floor(+cm) || 0);
  const tags = []; if (sp.hiem) tags.push('Loài hiếm'); if (fish.lon === true) tags.push('Cỡ lớn');
  return {
    title: `${sp.ten}${fish.lon === true ? ' khổng lồ' : ''}`, isNew: !!isNewSpecies, cm: Math.floor(+cm) || 0, best,
    recordNew: !!rec.isNew, variant: tags.length ? tags.join(', ') : 'Không có', sen: releaseSen(fish),
  };
}
