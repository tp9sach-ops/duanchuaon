// Bát tự (Tứ trụ) + Đại vận + Lưu niên. Thuần JS, dùng lunar.js, canchi.js, dayscore.js (thangTiet).
// Quy ước đã chọn (đổi được trong BATU_CFG): năm đổi ở Lập xuân; tháng theo tiết khí; giờ Tý sớm (23h–1h tính cùng ngày);
// ngày giao tiết tính vào tháng mới; Dụng thần chỉ là ước lượng sơ bộ theo thân vượng/nhược, không thay cho thầy bát tự.
import { jdFromDate, sunLongitudeDeg, solarToLunar } from './lunar.js';
import { CAN, CHI, CAN_HANH, CHI_HANH, dayCanChi, hourCanChi, sexagenary, napAm } from './canchi.js';
import { thangTiet } from './dayscore.js';

export const BATU_CFG = { namDoiO: 'lapXuan', gioTy: 'som', trongSoTangCan: [1, 0.5, 0.25], heSoThangLenh: 1.5, nguongVuong: 0.5 };

const mod = (a, n) => ((a % n) + n) % n;
const HANH = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'];                 // chiều tương sinh: i → i+1; tương khắc: i → i+2
const hi = (h) => HANH.indexOf(h);
// Tàng can của 12 địa chi (chính khí đứng đầu)
export const TANG_CAN = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];
const LUC_XUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
const LUC_HOP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const has = (pairs, a, b) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** Năm Bát tự: trước Lập xuân (Mặt Trời < 315° và > 300° trong tháng 1–2 dương) vẫn tính năm trước. */
export function yearBatu(dd, mm, yy) {
  const jd = jdFromDate(dd, mm, yy), tm = thangTiet(jd);
  // Tháng tiết 12 (Sửu) hoặc 11 (Tý) rơi vào tháng 1–2 dương thì chưa qua Lập xuân
  return (mm <= 2 && tm.so >= 11) ? yy - 1 : yy;
}
const canChiOf = (can, chi) => ({ can, chi, name: `${CAN[can]} ${CHI[chi]}`, canName: CAN[can], chiName: CHI[chi], napAm: napAm(can, chi) });

/** Mười thần của can x so với Nhật chủ n (chỉ số can). */
export function thapThan(n, x) {
  const a = hi(CAN_HANH[n]), b = hi(CAN_HANH[x]), same = (n % 2) === (x % 2), d = mod(b - a, 5);
  return ({
    0: same ? 'Tỷ kiên' : 'Kiếp tài',
    1: same ? 'Thực thần' : 'Thương quan',
    2: same ? 'Thiên tài' : 'Chính tài',
    3: same ? 'Thất sát' : 'Chính quan',
    4: same ? 'Thiên ấn' : 'Chính ấn',
  })[d];
}

/** 4 trụ. gioChi = 0..11 hoặc -1 nếu không rõ giờ. */
export function fourPillars(dd, mm, yy, gioChi = -1) {
  const jd = jdFromDate(dd, mm, yy), yB = yearBatu(dd, mm, yy), tm = thangTiet(jd), dc = dayCanChi(jd);
  const yCan = mod(yB + 6, 10), yChi = mod(yB + 8, 12);
  const mCan = mod((yCan % 5) * 2 + 2 + (tm.so - 1), 10), mChi = tm.chi;
  const tru = { nam: canChiOf(yCan, yChi), thang: canChiOf(mCan, mChi), ngay: canChiOf(dc.can, dc.chi), gio: null };
  if (gioChi >= 0) { const h = hourCanChi(dc.can, gioChi); tru.gio = canChiOf(h.can, h.chi); }
  return { jd, namBatu: yB, tru, nhatChu: dc.can };
}

/** Bảng thập thần, tàng can, ngũ hành thịnh/suy, thân vượng/nhược, Dụng thần sơ bộ. */
export function analyzeBatu(dd, mm, yy, gioChi = -1, cfg = BATU_CFG) {
  const fp = fourPillars(dd, mm, yy, gioChi), n = fp.nhatChu, T = cfg.trongSoTangCan;
  const cols = ['gio', 'ngay', 'thang', 'nam'].filter((k) => fp.tru[k]);
  const luc = [0, 0, 0, 0, 0], notes = [];
  const rows = cols.map((k) => {
    const p = fp.tru[k], tang = TANG_CAN[p.chi].map((c, i) => ({ can: c, ten: CAN[c], hanh: CAN_HANH[c], thapThan: thapThan(n, c), w: T[i] || 0.2 }));
    const canTT = k === 'ngay' ? 'Nhật chủ' : thapThan(n, p.can);
    luc[hi(CAN_HANH[p.can])] += 1;
    const he = k === 'thang' ? cfg.heSoThangLenh : 1;
    tang.forEach((t) => { luc[hi(t.hanh)] += t.w * he; });
    return { cot: k, tru: p, canThapThan: canTT, tang };
  });
  const tot = luc.reduce((a, b) => a + b, 0), pct = luc.map((v) => Math.round(v / tot * 100));
  const me = hi(CAN_HANH[n]), sinhMe = mod(me - 1, 5);
  const phe = (luc[me] + luc[sinhMe]) / tot;           // phe giúp Nhật chủ: cùng hành + sinh ra mình
  const vuong = phe >= cfg.nguongVuong;
  // Dụng thần sơ bộ: vượng → tiết/khắc bớt (hành mình sinh, mình khắc, khắc mình); nhược → trợ (sinh mình, cùng hành)
  const cand = vuong ? [mod(me + 1, 5), mod(me + 2, 5), mod(me + 3, 5)] : [sinhMe, me];
  const dung = cand.reduce((b, e) => (luc[e] < luc[b] ? e : b), cand[0]);
  const ky = vuong ? [me, sinhMe] : [mod(me + 1, 5), mod(me + 2, 5), mod(me + 3, 5)];
  notes.push(`Nhật chủ ${CAN[n]} (${CAN_HANH[n]}); phe giúp Nhật chủ chiếm ${Math.round(phe * 100)}% → ${vuong ? 'thân vượng' : 'thân nhược'} (ngưỡng ${Math.round(cfg.nguongVuong * 100)}%).`);
  notes.push(`${vuong ? 'Thân vượng cần tiết/khắc bớt' : 'Thân nhược cần được sinh trợ'}: chọn hành đang ít nhất trong nhóm cần thiết là ${HANH[dung]}.`);
  if (!fp.tru.gio) notes.push('Chưa có giờ sinh nên thiếu trụ giờ; kết quả kém chắc hơn.');
  return {
    ...fp, hang: rows, nguHanh: HANH.map((h, i) => ({ hanh: h, diem: Math.round(luc[i] * 10) / 10, phanTram: pct[i] })),
    phePhanTram: Math.round(phe * 100), vuong, dungThan: HANH[dung], hanhKy: ky.map((e) => HANH[e]), trace: notes,
    nhan: 'Bát tự', doTinCay: fp.tru.gio ? 0.6 : 0.4,
  };
}

/** Ngày đầu của tháng tiết chứa jd, và ngày đầu của tháng tiết kế tiếp. */
function monthEdges(jd) {
  const so = thangTiet(jd).so; let a = jd, b = jd;
  while (thangTiet(a - 1).so === so) a--;
  while (thangTiet(b).so === so) b++;
  return { dau: a, tiepTheo: b };
}

/** Đại vận: Dương nam/Âm nữ đi thuận, Dương nữ/Âm nam đi nghịch; 3 ngày = 1 tuổi. gioiTinh: 'nam' | 'nu'. */
export function daiVan(dd, mm, yy, gioiTinh, soVan = 9) {
  if (gioiTinh !== 'nam' && gioiTinh !== 'nu') return { ok: false, loi: 'Cần giới tính để tính Đại vận.' };
  const jd = jdFromDate(dd, mm, yy), fp = fourPillars(dd, mm, yy, -1);
  const duongNam = fp.tru.nam.can % 2 === 0, thuan = (gioiTinh === 'nam') === duongNam;
  const e = monthEdges(jd), ngay = thuan ? e.tiepTheo - jd : jd - e.dau + (jd === e.dau ? 0 : 0);
  const tuoiKhoiVan = Math.max(0, Math.round(ngay / 3 * 10) / 10);
  let idx = sexagenary(fp.tru.thang.can, fp.tru.thang.chi);
  const van = [];
  for (let i = 1; i <= soVan; i++) {
    idx = mod(idx + (thuan ? 1 : -1), 60);
    const can = idx % 10, chi = idx % 12;
    van.push({ ...canChiOf(can, chi), tuTuoi: Math.round((tuoiKhoiVan + (i - 1) * 10) * 10) / 10, denTuoi: Math.round((tuoiKhoiVan + i * 10) * 10) / 10, thapThan: thapThan(fp.nhatChu, can), hanhCan: CAN_HANH[can] });
  }
  return { ok: true, thuan, tuoiKhoiVan, ngayDenTiet: ngay, van };
}

/** Điểm và nhận xét một năm dương lịch (lưu niên) cho người sinh (nămSinh âm, chi năm sinh, bát tự b). */
export function luuNien(year, birthLunarYear, batu) {
  const can = mod(year + 6, 10), chi = mod(year + 8, 12), n = batu.nhatChu, birthChi = mod(birthLunarYear + 8, 12);
  const trace = [{ ten: 'Điểm nền', diem: 50, vi: 'Năm trung tính' }], flags = [];
  const add = (ten, diem, vi) => trace.push({ ten, diem, vi });
  const tt = thapThan(n, can), hanhCan = CAN_HANH[can], hanhChi = CHI_HANH[chi];
  if (hanhCan === batu.dungThan) add(`Can năm ${CAN[can]} (${hanhCan}) trùng Dụng thần`, 8, `Lưu niên đưa hành ${hanhCan} vào lá số`);
  else if (batu.hanhKy.includes(hanhCan)) add(`Can năm ${CAN[can]} (${hanhCan}) thuộc hành cần bớt`, -6, `Hành ${hanhCan} đang dư so với nhu cầu của lá số`);
  if (hanhChi === batu.dungThan) add(`Chi năm ${CHI[chi]} (${hanhChi}) trùng Dụng thần`, 5, 'Địa chi năm hỗ trợ');
  else if (batu.hanhKy.includes(hanhChi)) add(`Chi năm ${CHI[chi]} (${hanhChi}) thuộc hành cần bớt`, -4, 'Địa chi năm thêm hành dư');
  if (chi === birthChi) { flags.push('Trực Thái tuế'); add('Trực Thái tuế (năm trùng tuổi)', -4, 'Năm tuổi: nên giữ nhịp ổn định'); }
  if (has(LUC_XUNG, chi, birthChi)) { flags.push('Xung Thái tuế'); add('Xung Thái tuế', -6, 'Chi năm xung chi tuổi, dễ biến động'); }
  if (has(LUC_HOP, chi, birthChi)) { flags.push('Hợp Thái tuế'); add('Lục hợp với tuổi', 5, 'Chi năm hợp chi tuổi'); }
  // Tam tai: nhóm tam hợp của tuổi → ba năm liền sau nhóm xung
  const grp = [[8, 0, 4, [2, 3, 4]], [2, 6, 10, [8, 9, 10]], [11, 3, 7, [5, 6, 7]], [5, 9, 1, [11, 0, 1]]].find((g) => g.slice(0, 3).includes(birthChi));
  if (grp && grp[3].includes(chi)) { flags.push('Tam tai'); add('Năm Tam tai', -6, 'Ba năm liên tiếp nên làm chắc, tránh liều'); }
  const tuoiMu = year - birthLunarYear + 1;
  if ([1, 3, 6, 8].includes(mod(tuoiMu - 1, 9) + 1)) { flags.push('Kim lâu'); add(`Kim lâu (${tuoiMu} tuổi mụ)`, -5, 'Quy ước dân gian: tuổi mụ chia 9 dư 1, 3, 6 hoặc 8'); }
  const diem = Math.max(0, Math.min(100, Math.round(trace.reduce((s, t) => s + t.diem, 0))));
  return { year, canChi: canChiOf(can, chi), thapThan: tt, tuoiMu, flags, diem, trace };
}
