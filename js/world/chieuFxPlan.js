// KẾ HOẠCH hiệu ứng 30 chiêu (Phiên 165, Bản 2 mục 6). LOGIC THUẦN (không three.js), có test: tests/chieufx.test.mjs. Dữ liệu: js/data/chieuFx.js; cảnh: js/scene/chieuFx.js.
// Bậc máy (tierOf, theo perfLevel 0..5 của js/scene/perfLogic.js): cao (0-1) · vừa (2-3) · yếu (4-5). Bản giảm: yếu = nửa số hạt (trần 150), bỏ vệt, bỏ quầng sáng, bỏ rung, bỏ khựng, hoa văn thưa; hoa văn + viền vùng cảnh báo VẪN còn ở mọi bậc (đọc được chiêu).
// Tọa độ vùng: x = ngang (+ sang trái), z = về phía trước (hướng chiêu). Viền đỏ ngà gây hại / xanh nhạt có lợi; hoa văn theo Hệ (người mù màu vẫn đọc được).
import { CHIEU_FX, HAT_TOI_DA } from '../data/chieuFx.js';
import { chieuOf } from './chieuNguHanh.js';

export const TIER = ['yeu', 'vua', 'cao'];
export const tierOf = (lv) => { const n = Math.round(+lv); if (!Number.isFinite(n)) return 'vua'; return n <= 1 ? 'cao' : n <= 3 ? 'vua' : 'yeu'; };
const HE_OF = (id) => String(id).split('_')[0];
const MAU_VIEN = { hai: 0xd98a6a, loi: 0x9fd8ff };   // đỏ ngà / xanh nhạt
const KHOANG = { yeu: { vien: 24, van: 24 }, vua: { vien: 40, van: 48 }, cao: { vien: 56, van: 96 } };

/** Điểm (x,z) có nằm trong hình vùng không. hinh: duong {dai,rong} | non {dai,goc} | tron {r}. */
export function trongHinh(h, x, z) {
  if (!h) return false;
  if (h.kieu === 'duong') return z >= 0 && z <= h.dai && Math.abs(x) <= h.rong / 2;
  if (h.kieu === 'non') { const d = Math.hypot(x, z); return d <= h.dai && z > 0 && Math.abs(Math.atan2(x, z)) <= (h.goc * Math.PI / 360) + 1e-9; }
  if (h.kieu === 'tron') return Math.hypot(x, z) <= h.r + 1e-9;
  return false;
}
/** Cỡ ô bao quanh hình: { x0,x1,z0,z1 }. */
export function hopBao(h) {
  if (h.kieu === 'duong') return { x0: -h.rong / 2, x1: h.rong / 2, z0: 0, z1: h.dai };
  if (h.kieu === 'non') { const w = h.dai * Math.sin(Math.min(Math.PI / 2, h.goc * Math.PI / 360)); return { x0: -w, x1: w, z0: 0, z1: h.dai }; }
  return { x0: -h.r, x1: h.r, z0: -h.r, z1: h.r };
}
/** Viền hình: mảng điểm [x,z] khép kín, `n` điểm. */
export function vienDiem(h, n = 32) {
  const out = [], N = Math.max(8, n | 0);
  if (h.kieu === 'duong') { const w = h.rong / 2; return [[-w, 0], [w, 0], [w, h.dai], [-w, h.dai]]; }
  if (h.kieu === 'non') { const a = h.goc * Math.PI / 360; out.push([0, 0]); for (let i = 0; i <= N; i++) { const t = -a + (2 * a * i) / N; out.push([Math.sin(t) * h.dai, Math.cos(t) * h.dai]); } return out; }
  for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2; out.push([Math.sin(t) * h.r, Math.cos(t) * h.r]); }
  return out;
}
/** Nét hoa văn: mảng đoạn [x1,z1,x2,z2] nằm TRONG hình. hoaVan: vachCheo | hoaVanLa | gonSong | oVuong | socNhon. Số đoạn ≤ cap, ≥ 4. */
export function hoaVanDoan(hoaVan, h, cap = 48) {
  const b = hopBao(h), span = Math.max(b.x1 - b.x0, b.z1 - b.z0);
  const gen = (s) => {
    const o = [], d = s * 0.7;
    if (hoaVan === 'socNhon') {
      const k = Math.max(6, Math.round(span / s) + 4), full = h.kieu === 'tron' ? Math.PI * 2 : Math.PI;
      for (let i = 0; i < k; i++) { const t = h.kieu === 'tron' ? (i / k) * full : -Math.PI / 2 + ((i + 0.5) / k) * full, R = Math.max(b.x1, b.z1);
        o.push([Math.sin(t) * R * 0.25, Math.cos(t) * R * 0.25, Math.sin(t) * R * 0.98, Math.cos(t) * R * 0.98]); }
    } else for (let x = b.x0 + s / 2; x <= b.x1; x += s) for (let z = b.z0 + s / 2; z <= b.z1; z += s) {
      if (hoaVan === 'vachCheo') o.push([x, z, x + d, z + d]);
      else if (hoaVan === 'hoaVanLa') { o.push([x, z, x - d / 2, z + d]); o.push([x, z, x + d / 2, z + d]); }
      else if (hoaVan === 'gonSong') { o.push([x, z, x + d / 2, z + d / 3]); o.push([x + d / 2, z + d / 3, x + d, z]); }
      else { o.push([x, z, x + d, z]); o.push([x + d, z, x + d, z + d]); }   // oVuong: hai cạnh mỗi ô, ghép thành lưới
    }
    return o.filter((q) => trongHinh(h, q[0], q[1]) && trongHinh(h, q[2], q[3]));
  };
  let s = span / 8, seg = gen(s);
  for (let i = 0; i < 24 && (seg.length > cap || seg.length < 4); i++) { s *= seg.length > cap ? 1.2 : 0.8; seg = gen(s); }
  if (seg.length > cap) { const st = seg.length / cap; seg = Array.from({ length: cap }, (_, i) => seg[Math.floor(i * st)]); }
  return seg;
}

/** Kế hoạch dựng hiệu ứng chiêu `id` ở bậc `tier`. Chiêu lạ → null. */
export function lapKeHoach(id, tier = 'vua') {
  const f = CHIEU_FX[id], c = chieuOf(id); if (!f || !c) return null;
  const t = TIER.includes(tier) ? tier : 'vua', cb = c.canhBao || {}, he = HE_OF(id), k = KHOANG[t];
  const n = t === 'yeu' ? Math.min(HAT_TOI_DA.yeu, Math.round(f.n * 0.5)) : t === 'vua' ? Math.min(HAT_TOI_DA.vua, f.n) : Math.min(HAT_TOI_DA.cao, Math.round(f.n * 2.2));
  const hinh = cb.hinh, hoaVan = cb.hoaVan;
  return {
    id, he, tier: t, n, mode: f.mode, loai: f.loai, am: f.am,
    vet: t !== 'yeu' && !!f.vet, sang: t === 'yeu' ? 0 : f.sang,
    rung: t === 'yeu' ? 0 : f.rung, dung: t === 'cao' ? f.dung : 0,   // khựng đòn chỉ ở máy mạnh
    gong: c.gong, hauDong: c.hauDong || 0,
    vung: { hinh, hoaVan, loi: !!cb.loi, tuDau: !!cb.tuDau, taiMucTieu: !!(hinh && hinh.taiMucTieu), coDan: !!(hinh && hinh.coDan), mau: cb.loi ? MAU_VIEN.loi : MAU_VIEN.hai, vien: vienDiem(hinh, k.vien), van: hoaVanDoan(hoaVan, hinh, k.van) },
    ho_tro: !!cb.loi,
  };
}
