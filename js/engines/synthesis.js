// Bộ tổng hợp (Synthesis Engine): gom điểm từng môn thành một kết quả minh bạch.
// Mỗi môn: { mon, tong, tai_loc, su_nghiep, tinh_cam, suc_khoe, quy_nhan, nhan, doTinCay }.
// Thuần JS; nhận bảng W (js/data/weights.json) làm tham số.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const LV = ['tai_loc', 'su_nghiep', 'tinh_cam', 'suc_khoe', 'quy_nhan'];
export const LINH_VUC = LV;
const round = (v) => Math.round(v);

/** Chia điểm bói ngày thành 5 lĩnh vực theo từ khóa "nên/kỵ" của Trực và thần Hoàng/Hắc đạo (quy ước dự án). */
export function fromBoiNgay(day, per, W) {
  const C = W.chiaLinhVucBoiNgay, base = per && per.ok ? per.diem : day.diem;
  const nen = per && per.ok ? per.nen : day.nen, ky = per && per.ok ? per.ky : day.ky;
  const hit = (list, keys) => keys.length ? list.filter((x) => keys.some((k) => x.includes(k))).length : 0;
  const out = { mon: 'boiNgay', tong: base };
  LV.forEach((k) => {
    let off = C.buoc * (hit(nen, C[k].nen) - hit(ky, C[k].ky) * 1);
    if (k === 'quy_nhan') off += day.thanNgay.hoang ? C.thanHoangDao : -C.thanHoangDao;
    out[k] = round(clamp(base + clamp(off, -C.toiDa, C.toiDa), 0, 100));
  });
  out.nhan = per && per.ok ? `Điểm ngày theo tuổi bạn (Trực ${day.truc.ten}, ${day.thanNgay.ten})` : `Điểm chung của ngày (Trực ${day.truc.ten}, ${day.thanNgay.ten})`;
  out.doTinCay = per && per.ok ? per.doTinCay : 0.5;
  return out;
}

/** Trung bình nhiều ngày (cho khoảng tháng/năm): trả vector chung, doTinCay lấy trung bình. */
export function averageScores(list, mon, nhan) {
  if (!list.length) return null;
  const o = { mon, nhan, doTinCay: list.reduce((s, x) => s + x.doTinCay, 0) / list.length };
  ['tong', ...LV].forEach((k) => { o[k] = round(list.reduce((s, x) => s + x[k], 0) / list.length); });
  return o;
}

/** Lưu niên (Bát tự) → vector 6 lĩnh vực theo Thập thần của Can năm. */
export function fromLuuNien(ln, batu, W) {
  const off = W.chiaLinhVucNam[ln.thapThan] || {};
  const o = { mon: 'batu', tong: ln.diem, nhan: `Lưu niên ${ln.canChi.name} (${ln.thapThan}) với Nhật chủ`, doTinCay: batu.doTinCay };
  LV.forEach((k) => { o[k] = round(clamp(ln.diem + (off[k] || 0), 0, 100)); });
  return o;
}

/** Pha Trăng → điểm nhẹ (môn phụ). ph = kết quả moonPhase() có trường goc (độ). */
export function fromThienVan(ph) {
  const gan = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  const tron = gan(ph.goc, 180) < 25, non = gan(ph.goc, 0) < 25;
  const o = { mon: 'thienVan', tong: 50, tai_loc: 50, su_nghiep: 50, tinh_cam: 50, suc_khoe: 50, quy_nhan: 50, doTinCay: 0.3, nhan: `Trăng ${ph.ten}` };
  if (tron) { o.tinh_cam = 56; o.quy_nhan = 54; o.tong = 53; o.nhan = `Trăng ${ph.ten}: hợp gặp gỡ, lễ chùa`; }
  else if (non) { o.su_nghiep = 54; o.suc_khoe = 52; o.tong = 52; o.nhan = `Trăng ${ph.ten}: hợp khởi đầu nhẹ nhàng`; }
  return o;
}

const band = (s) => (s >= 70 ? 'rất thuận' : s >= 58 ? 'khá thuận' : s >= 45 ? 'trung bình, làm việc đều tay' : 'nên chậm lại, chọn việc nhẹ');

/**
 * Tổng hợp. horizon: 'ngay' | 'thang' | 'nam' | 'duongDoi'. inputs: mảng vector môn (null/undefined bị bỏ).
 * extras (tùy chọn): { gio:[{ten}], huong, mau, so, nen, ky } để đưa vào phần lời khuyên.
 */
export function synthesize(horizon, inputs, W, extras = {}) {
  const T = W.trongSo[horizon];
  if (!T) return { ok: false, loi: 'Khoảng thời gian không hợp lệ.' };
  const used = inputs.filter((x) => x && T[x.mon] > 0);
  const tongW = used.reduce((s, x) => s + T[x.mon], 0);
  if (!used.length) return { ok: false, loi: 'Chưa đủ dữ liệu cho khoảng thời gian này.' };
  const allW = Object.values(T).reduce((a, b) => a + b, 0);
  const wavg = (k) => used.reduce((s, x) => s + T[x.mon] * x[k], 0) / tongW;
  const diem = {}; ['tong', ...LV].forEach((k) => { diem[k] = round(wavg(k)); });
  const conf = (used.reduce((s, x) => s + T[x.mon] * x.doTinCay, 0) / tongW) * Math.sqrt(tongW / allW);

  const N = W.nguong, ups = used.filter((x) => x.tong >= N.tot), downs = used.filter((x) => x.tong <= N.thap);
  let tinHieu = null;
  if (ups.length && downs.length) tinHieu = { loai: 'canNhac', ten: 'Cần cân nhắc' };
  else if (ups.length >= N.dongThuan) tinHieu = { loai: 'manhThuan', ten: 'Tín hiệu mạnh' };
  else if (downs.length >= N.dongThuan) tinHieu = { loai: 'manhNhe', ten: 'Tín hiệu mạnh (nên nhẹ tay)' };

  const ten = W.tenLinhVuc, kh = W.tenKhoang[horizon];
  const sorted = [...LV].sort((a, b) => diem[b] - diem[a]), best = sorted[0], worst = sorted[LV.length - 1];
  const tomTat = `${kh[0].toUpperCase() + kh.slice(1)} ${band(diem.tong)}; điểm cao nhất ở ${ten[best].toLowerCase()} (${diem[best]}).`;

  const loiKhuyen = [];
  loiKhuyen.push(`Đặt việc liên quan đến ${ten[best].toLowerCase()} lên trước: đây là mảng thuận nhất ${kh} (${diem[best]}/100).`);
  loiKhuyen.push(diem[worst] < N.yeuLinhVuc
    ? `Với ${ten[worst].toLowerCase()} (${diem[worst]}/100), hãy chuẩn bị kỹ và tránh quyết vội.`
    : `Giữ nhịp ổn định ở ${ten[worst].toLowerCase()}, mảng này không cần ép.`);
  if (tinHieu && tinHieu.loai === 'manhThuan') loiKhuyen.push('Nhiều môn cùng nghiêng về phía thuận: hợp để bắt đầu việc bạn đã chuẩn bị kỹ.');
  else if (tinHieu && tinHieu.loai === 'manhNhe') loiKhuyen.push('Nhiều môn cùng khuyên nhẹ tay: ưu tiên việc nhỏ, nghỉ ngơi và giữ lòng bình tĩnh.');
  else if (tinHieu) loiKhuyen.push('Các môn chưa thống nhất: hãy đọc phần "Các môn nói gì" rồi tự cân nhắc theo hoàn cảnh của bạn.');
  else if (extras.gio && extras.gio.length) loiKhuyen.push(`Việc quan trọng nên chọn giờ Hoàng đạo: ${extras.gio.slice(0, 3).map((g) => g.ten).join(', ')}.`);
  else loiKhuyen.push('Làm đều tay và ghi lại điều bạn nhận ra được.');

  const monNoi = used.map((x) => ({ mon: x.mon, trongSo: Math.round((T[x.mon] / tongW) * 100), tong: x.tong, nhan: x.nhan, doTinCay: Math.round(x.doTinCay * 100) / 100,
    huong: x.tong >= N.tot ? 'thuận' : x.tong <= N.thap ? 'nhẹ tay' : 'trung bình' }));
  const monThieu = Object.keys(T).filter((m) => T[m] > 0 && !used.some((x) => x.mon === m));

  return {
    ok: true, horizon, diem, mood: clamp((diem.tong - 50) / 40, -1, 1), doTinCay: Math.round(conf * 100) / 100,
    tomTat, tinHieu, loiKhuyen: loiKhuyen.slice(0, 3), monNoi, monThieu,
    nen: extras.nen || [], ky: extras.ky || [], gio: extras.gio || [], huong: extras.huong || null, mau: extras.mau || [], so: extras.so || [],
  };
}
