// CẢM GIÁC CAMERA khi đánh (Phiên 175, prompt chiêu thức 3D mục 11). LOGIC THUẦN (không three.js, không DOM), có test: tests/camfeel.test.mjs.
// Rung màn: biên độ nhỏ, tần số cao, tắt dần theo hàm mũ. Khựng hình 40–120 ms (chỉ làm chậm nhân vật/mục tiêu, KHÔNG đóng băng thế giới). Đẩy gần FOV theo chiêu. Nhảy: camera đi theo có độ trễ mượt, FOV mở 3–5% khi lên.
// Công tắc người chơi: rung / khựng / giảm chuyển động (giảm chuyển động = tắt cả rung, khựng, đẩy gần; chỉ còn bám nhảy mượt).

export const CAM = {
  rungMax: 0.12,          // m, trần biên độ rung cộng dồn
  rungTanS: 0.18,         // hằng số thời gian tắt dần (s): biên độ ×e^(-t/τ)
  rungHz: 34,             // tần số rung
  dungMin: 0.04, dungMax: 0.12,   // khựng hình (s)
  dungTocDo: 0.06,        // tốc độ thời gian trong lúc khựng (1 = bình thường)
  chieu4: { fov: 0.065, giay: 0.2 },                      // chiêu 4: đẩy gần 5–8% FOV trong 0,2 s
  tuyetHoc: { fov: 0.09, cham: 0.35, tocDo: 0.35, tra: 0.5 },   // tuyệt học: đẩy gần + chậm 0,2–0,4 s rồi trả về trong 0,5 s
  nhay: { tre: 0.2, fovLen: 0.04 },                       // camera trễ 0,15–0,25 s; FOV +3–5% khi lên cao
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

/** Tùy chọn người chơi (đọc từ localStorage, dữ liệu lạ → mặc định). */
export function docTuyChon(raw) {
  let o = {}; try { o = typeof raw === 'string' ? JSON.parse(raw) : raw || {}; } catch (_) { o = {}; }
  return { rung: o.rung !== false, dung: o.dung !== false, giamChuyenDong: o.giamChuyenDong === true };
}

/** Hệ số mũ đuổi theo: hằng số thời gian `tre` (s) → k dùng cho damp(). */
export const kTuTre = (tre) => 1 / Math.max(0.05, num(tre, CAM.nhay.tre));

export function createCamFeel({ tuyChon = {}, giamHeThong = false } = {}) {
  let opt = docTuyChon(tuyChon), sys = !!giamHeThong;
  let amp = 0, pha = 0, dung = 0, fovT = 0, fovDur = 0, fovMax = 0, cham = 0, chamDur = 0, chamTocDo = 1, tra = 0;
  const giam = () => opt.giamChuyenDong || sys;

  return {
    set(o) { opt = { ...opt, ...docTuyChon({ ...opt, ...o }) }; if (giam()) { amp = 0; dung = 0; fovT = 0; cham = 0; tra = 0; } },
    get tuyChon() { return { ...opt }; }, get giam() { return giam(); },
    /** Rung màn: `cuong` 0..~3 (số rung của chiêu). Cộng dồn nhưng có trần. */
    rung(cuong) { if (giam() || !opt.rung) return 0; amp = Math.min(CAM.rungMax, amp + clamp(num(cuong), 0, 3) * 0.03); return amp; },
    /** Khựng hình `giay` (kẹp 40–120 ms). */
    khung(giay) { if (giam() || !opt.dung) return 0; const g = clamp(num(giay), CAM.dungMin, CAM.dungMax); dung = Math.max(dung, g); return dung; },
    /** Đẩy gần theo loại chiêu: 'chieu4' | 'tuyetHoc'. Chiêu thường không đổi camera. */
    chieu(loai) {
      if (giam()) return false;
      if (loai === 'chieu4') { fovMax = CAM.chieu4.fov; fovDur = fovT = CAM.chieu4.giay; return true; }
      if (loai === 'tuyetHoc') { const t = CAM.tuyetHoc; fovMax = t.fov; fovDur = fovT = t.cham + t.tra; cham = chamDur = t.cham; chamTocDo = t.tocDo; tra = t.tra; return true; }
      return false;
    },
    /** Tiến `dt` giây → { dx, dy, fov (0..: cộng vào góc mở, vd 0.06 = +6%), tocDo (nhân dt cho nhân vật/mục tiêu), dung }. */
    step(dt) {
      const d = clamp(num(dt), 0, 0.25);
      let dx = 0, dy = 0;
      if (amp > 1e-4) { pha += d * CAM.rungHz * Math.PI * 2; dx = Math.sin(pha) * amp; dy = Math.cos(pha * 1.31) * amp * 0.7; amp *= Math.exp(-d / CAM.rungTanS); if (amp < 1e-4) amp = 0; }
      let tocDo = 1;
      if (dung > 0) { tocDo = CAM.dungTocDo; dung = Math.max(0, dung - d); }
      if (cham > 0) { tocDo = Math.min(tocDo, chamTocDo); cham = Math.max(0, cham - d); }
      let fov = 0;
      if (fovT > 0 && fovDur > 0) { const u = 1 - fovT / fovDur; fov = fovMax * Math.sin(Math.min(1, u * 1.6 > 1 ? 1 - (u - 0.625) / 0.375 : u * 1.6) * Math.PI / 2); fov = Math.max(0, fov); fovT = Math.max(0, fovT - d); }
      return { dx, dy, fov, tocDo, dung: dung > 0 };
    },
  };
}

/** Nhảy: FOV mở thêm khi đang LÊN (vy > 0), trả dần khi xuống. `vy` m/s, `vyMax` m/s của cú nhảy bậc hiện tại. */
export function fovNhay(vy, vyMax) {
  const v = num(vy), m = Math.max(1, num(vyMax, 1));
  return v > 0 ? CAM.nhay.fovLen * clamp(v / m, 0, 1) : 0;
}
/** Tốc độ bám theo trục dọc: trên không bám trễ hơn (≈ 0,2 s), dưới đất như cũ. */
export const kBamDoc = (tren, kDat = 9) => (tren ? kTuTre(CAM.nhay.tre) : kDat);
