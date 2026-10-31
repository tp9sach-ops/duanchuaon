// Bói ngày cá nhân: so tuổi (Can Chi năm sinh, mệnh Nạp âm) với ngày đã phân tích bởi analyzeDay().
// Thuần JS, nhận bảng tra P (js/data/personal.json) làm tham số để chạy được ở trình duyệt lẫn Node.
import { jdToDate, solarToLunar, lunarToSolar, jdFromDate } from './lunar.js';
import { CHI, yearCanChi, napAmHanh } from './canchi.js';

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inPair = (pairs, a, b) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const sameGroup = (groups, a, b) => groups.some((g) => g.includes(a) && g.includes(b));

/** Kiểm tra và chuẩn hóa hồ sơ. Trả { ok, loi } hoặc { ok:true, ho so đã chuẩn hóa, solar, lunar }. */
export function birthInfo(p) {
  const d = +p.ngay, m = +p.thang, y = +p.nam;
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
    return { ok: false, loi: 'Ngày sinh chưa hợp lệ (năm từ 1900 đến 2100).' };
  }
  let solar, lunar;
  if (p.loaiLich === 'am') {
    const s = lunarToSolar(d, m, y, p.nhuan ? 1 : 0);
    if (!s) return { ok: false, loi: 'Ngày âm này không tồn tại (kiểm tra tháng nhuận hoặc số ngày của tháng).' };
    solar = { dd: s[0], mm: s[1], yy: s[2] };
    lunar = solarToLunar(s[0], s[1], s[2]);
    // Tháng âm có 29 hoặc 30 ngày: ngày nhập phải khớp sau khi đổi qua lại
    if (lunar.day !== d || lunar.month !== m || lunar.year !== y) return { ok: false, loi: 'Ngày âm này không tồn tại (tháng chỉ có 29 ngày?).' };
  } else {
    const back = jdToDate(jdFromDate(d, m, y));
    if (back[0] !== d || back[1] !== m || back[2] !== y) return { ok: false, loi: 'Ngày dương này không tồn tại.' };
    solar = { dd: d, mm: m, yy: y };
    lunar = solarToLunar(d, m, y);
  }
  const nam = yearCanChi(lunar.year);
  const gio = p.gioSinh === '' || p.gioSinh == null ? -1 : +p.gioSinh;
  return { ok: true, solar, lunar, namSinh: nam, hanh: napAmHanh(nam.napAm), chi: nam.chi, gio: gio >= 0 && gio <= 11 ? gio : -1 };
}

/** Quan hệ giữa Chi năm sinh và Chi ngày. Trả danh sách { ten, diem, vi } đã chọn để cộng điểm (không cộng chồng các điều xấu). */
export function chiRelations(birthChi, dayChi, P) {
  const Q = P.quanHe, D = Q.diem, out = [];
  if (birthChi === dayChi) out.push({ ten: 'Trùng tuổi', diem: 0, vi: `Chi ngày ${CHI[dayChi]} trùng chi năm sinh` });
  if (inPair(Q.lucHop, birthChi, dayChi)) out.push({ ten: 'Lục hợp', diem: D.lucHop, vi: `${CHI[birthChi]} hợp ${CHI[dayChi]}` });
  else if (sameGroup(Q.tamHop, birthChi, dayChi) && birthChi !== dayChi) out.push({ ten: 'Tam hợp', diem: D.tamHop, vi: `${CHI[birthChi]} và ${CHI[dayChi]} cùng bộ tam hợp` });
  if (mod(birthChi - dayChi, 12) === 6) { out.push({ ten: 'Lục xung', diem: D.lucXung, vi: `${CHI[birthChi]} xung ${CHI[dayChi]}` }); return out; }
  // Các điều xấu còn lại: chỉ tính điều nặng nhất, phần còn lại ghi chú 0 điểm
  const bad = [];
  if (birthChi !== dayChi && sameGroup(Q.tuHanhXung, birthChi, dayChi)) bad.push({ ten: 'Tứ hành xung', diem: D.tuHanhXung, vi: `${CHI[birthChi]} và ${CHI[dayChi]} cùng nhóm tứ hành xung` });
  if (sameGroup(Q.hinh, birthChi, dayChi) && birthChi !== dayChi) bad.push({ ten: 'Hình', diem: D.hinh, vi: `${CHI[birthChi]} hình ${CHI[dayChi]}` });
  if (birthChi === dayChi && Q.tuHinh.includes(birthChi)) bad.push({ ten: 'Tự hình', diem: D.hinh, vi: `${CHI[birthChi]} tự hình` });
  if (inPair(Q.hai, birthChi, dayChi)) bad.push({ ten: 'Hại', diem: D.hai, vi: `${CHI[birthChi]} hại ${CHI[dayChi]}` });
  if (inPair(Q.pha, birthChi, dayChi)) bad.push({ ten: 'Phá', diem: D.pha, vi: `${CHI[birthChi]} phá ${CHI[dayChi]}` });
  bad.sort((a, b) => a.diem - b.diem);
  bad.forEach((b, i) => out.push(i === 0 ? b : { ...b, diem: 0, vi: b.vi + ' (đã tính quan hệ nặng hơn)' }));
  return out;
}

/** Ngũ hành: Nạp âm ngày so với mệnh Nạp âm năm sinh. */
export function hanhRelation(menh, ngay, P) {
  const H = P.nguHanh, D = H.diem;
  if (menh === ngay) return { ten: 'Ngũ hành tỷ hòa', diem: D.tyHoa, vi: `Mệnh ${menh} gặp ngày ${ngay}` };
  if (H.sinh[ngay] === menh) return { ten: 'Ngày sinh mệnh', diem: D.ngaySinhMenh, vi: `Ngày ${ngay} sinh mệnh ${menh}` };
  if (H.sinh[menh] === ngay) return { ten: 'Mệnh sinh ngày', diem: D.menhSinhNgay, vi: `Mệnh ${menh} sinh ngày ${ngay}, hơi hao sức` };
  if (H.khac[ngay] === menh) return { ten: 'Ngày khắc mệnh', diem: D.ngayKhacMenh, vi: `Ngày ${ngay} khắc mệnh ${menh}` };
  if (H.khac[menh] === ngay) return { ten: 'Mệnh khắc ngày', diem: D.menhKhacNgay, vi: `Mệnh ${menh} khắc ngày ${ngay}` };
  return { ten: 'Ngũ hành bình hòa', diem: 0, vi: `Mệnh ${menh} và ngày ${ngay} không sinh khắc trực tiếp` };
}

/** Tính điểm cá nhân cho một ngày. day = kết quả analyzeDay(); profile = hồ sơ người dùng; goal = khóa mục tiêu. */
export function analyzePersonal(day, profile, P, goal = 'chung') {
  const b = birthInfo(profile);
  if (!b.ok) return b;
  const dc = day.canChi.ngay, dayHanh = napAmHanh(dc.napAm);
  const trace = day.trace.map((t) => ({ ...t }));
  const add = (ten, diem, vi) => trace.push({ ten, diem, vi });

  chiRelations(b.chi, dc.chi, P).forEach((r) => add(`${r.ten}`, r.diem, r.vi));
  const hr = hanhRelation(b.hanh, dayHanh, P); add(hr.ten, hr.diem, hr.vi);

  // Mục tiêu: so từ khóa với "nên/kỵ" của Trực ngày
  const G = P.mucTieu[goal] || P.mucTieu.chung, hit = (list) => G.tu.some((k) => list.some((x) => x.includes(k)));
  let goalNote = G.ghiChu || '';
  if (G.tu.length) {
    if (hit(day.truc.ky)) { add(`Mục tiêu: ${G.ten}`, P.mucTieu.diemKy, `Trực ${day.truc.ten} kỵ việc này`); goalNote = `Trực ${day.truc.ten} không hợp việc này.`; }
    else if (hit(day.truc.nen)) { add(`Mục tiêu: ${G.ten}`, P.mucTieu.diemNen, `Trực ${day.truc.ten} hợp việc này`); goalNote = `Trực ${day.truc.ten} hợp việc này.`; }
    else goalNote = `Trực ${day.truc.ten} không nói rõ về việc này, dùng điểm chung.`;
  }

  const diem = clamp(Math.round(trace.reduce((s, t) => s + t.diem, 0)), 0, 100);
  // Giờ tốt: Hoàng đạo và không xung tuổi
  const xungGio = mod(b.chi + 6, 12);
  const gioTot = day.gio.filter((g) => g.hoang && g.chi !== xungGio);
  const gioBoQua = day.gio.filter((g) => g.hoang && g.chi === xungGio).map((g) => g.ten);
  const hanhInfo = P.hanh[b.hanh] || { mau: [], so: [] };
  const lines = {
    nen: [...day.nen], ky: [...day.ky],
  };
  if (diem >= 62) lines.nen.unshift('việc bạn đã chuẩn bị kỹ (ngày hợp tuổi)');
  if (diem < 42) lines.ky.unshift('quyết định lớn trong ngày (ngày chưa hợp tuổi)');

  return {
    ok: true, birth: b, diem, mood: clamp((diem - 50) / 40, -1, 1), trace, goal: { key: goal, ten: G.ten, ghiChu: goalNote },
    gioTot, gioBoQua,
    huong: { hyThan: P.huong.hyThan[dc.can], taiThan: P.huong.taiThan[dc.can], canDoiChieu: !!P.huong.canDoiChieu },
    mau: hanhInfo.mau, so: hanhInfo.so,
    nen: [...new Set(lines.nen)], ky: [...new Set(lines.ky)],
    // Quy ước chung của các engine: 5 lĩnh vực. Giai đoạn 3 chỉ có điểm tổng; Giai đoạn 6 sẽ chia lĩnh vực.
    tong: diem, tai_loc: diem, su_nghiep: diem, tinh_cam: diem, suc_khoe: diem, quy_nhan: diem,
    nhan: 'Bói ngày cá nhân', doTinCay: b.gio >= 0 ? 0.6 : 0.5,
    tuoiAm: day.lunar.year - b.lunar.year + 1,
  };
}
