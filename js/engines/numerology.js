// Thần số học (Pythagoras). Thuần JS, nhận bảng tra N (js/data/numerology.json) làm tham số.
// Chuẩn hóa tên tiếng Việt: NFD, bỏ dấu, đ → d. Số chủ đạo 11/22/33 được giữ khi cộng rút gọn.

const MASTER = [11, 22, 33];
const VOWELS = 'AEIOU';
const digitsOf = (n) => String(Math.abs(n)).split('').map(Number);
const sumDigits = (n) => digitsOf(n).reduce((a, b) => a + b, 0);

/** Rút gọn về 1–9; nếu keepMaster thì dừng ở 11, 22, 33. */
export function reduce(n, keepMaster = true) {
  let v = Math.abs(Math.trunc(n));
  while (v > 9 && !(keepMaster && MASTER.includes(v))) v = sumDigits(v);
  return v;
}

/** "Nguyễn Văn Đức" → "NGUYEN VAN DUC" (chỉ giữ A–Z và khoảng trắng). */
export function stripName(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Phân loại từng chữ cái: nguyên âm hay phụ âm. Y là nguyên âm khi hai chữ cạnh nó đều không phải nguyên âm. */
function classify(name) {
  const out = [];
  const words = name.split(' ');
  for (const w of words) {
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      let vowel = VOWELS.includes(ch);
      if (ch === 'Y') {
        const prev = i > 0 && VOWELS.includes(w[i - 1]);
        const next = i < w.length - 1 && VOWELS.includes(w[i + 1]);
        vowel = !prev && !next;
      }
      out.push({ ch, vowel });
    }
  }
  return out;
}

/** Các chỉ số từ tên. Trả null nếu tên rỗng. */
export function nameNumbers(fullName, N) {
  const name = stripName(fullName);
  if (!name) return null;
  const val = (ch) => N.chuCai[ch];
  const letters = classify(name);
  const total = letters.reduce((s, l) => s + val(l.ch), 0);
  const vow = letters.filter((l) => l.vowel).reduce((s, l) => s + val(l.ch), 0);
  const con = total - vow;
  const present = new Set(letters.map((l) => val(l.ch)));
  return {
    ten: name,
    tongChuCai: total, tongNguyenAm: vow, tongPhuAm: con,
    suMenh: reduce(total), linhHon: reduce(vow), nhanCach: reduce(con),
    thieu: [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !present.has(d)),
  };
}

/** Số đường đời: rút gọn riêng ngày, tháng, năm (giữ số chủ đạo) rồi cộng và rút gọn. */
export function lifePath(d, m, y) {
  return reduce(reduce(d) + reduce(m) + reduce(y));
}

/** Biểu đồ mũi tên: đếm chữ số (khác 0) của ngày sinh dương trên lưới 3×3 (1-4-7 / 2-5-8 / 3-6-9). */
export function arrows(d, m, y, N) {
  const count = {};
  for (let i = 1; i <= 9; i++) count[i] = 0;
  `${d}${m}${y}`.split('').map(Number).filter((x) => x > 0).forEach((x) => { count[x]++; });
  const found = [], empty = [];
  for (const a of N.mui) {
    const have = a.so.filter((s) => count[s] > 0).length;
    if (have === 3) found.push(a);
    else if (have === 0) empty.push(a);
  }
  return { dem: count, co: found, trong: empty };
}

/** Bốn đỉnh cao và bốn thử thách. Tuổi đỉnh cao đầu = 36 − số đường đời (rút gọn 1–9). */
export function pinnacles(d, m, y) {
  const dd = reduce(d, false), mm = reduce(m, false), yy = reduce(y, false);
  const lp = reduce(lifePath(d, m, y), false);
  const p1 = reduce(mm + dd), p2 = reduce(dd + yy), p3 = reduce(p1 + p2), p4 = reduce(mm + yy);
  const c1 = Math.abs(mm - dd), c2 = Math.abs(dd - yy), c3 = Math.abs(c1 - c2), c4 = Math.abs(mm - yy);
  const t1 = 36 - lp;
  return {
    dinh: [
      { so: p1, tu: 0, den: t1 }, { so: p2, tu: t1 + 1, den: t1 + 9 },
      { so: p3, tu: t1 + 10, den: t1 + 18 }, { so: p4, tu: t1 + 19, den: null },
    ],
    thuThach: [
      { so: c1, tu: 0, den: t1 }, { so: c2, tu: t1 + 1, den: t1 + 9 },
      { so: c3, tu: t1 + 10, den: t1 + 18 }, { so: c4, tu: t1 + 19, den: null },
    ],
  };
}

/** Năm / tháng / ngày cá nhân (rút gọn về 1–9). today = { dd, mm, yy }. */
export function personalCycle(d, m, today) {
  const year = reduce(reduce(d, false) + reduce(m, false) + reduce(today.yy, false), false);
  const month = reduce(year + today.mm, false);
  const day = reduce(month + today.dd, false);
  return { nam: year, thang: month, ngay: day };
}

/** Phân tích đầy đủ. birth = { dd, mm, yy } (dương lịch). fullName có thể rỗng. */
export function analyzeNumerology(birth, fullName, today, N) {
  const { dd, mm, yy } = birth;
  const nm = nameNumbers(fullName, N);
  const duongDoi = lifePath(dd, mm, yy);
  const cycle = personalCycle(dd, mm, today);
  const trace = [
    { ten: 'Số đường đời', vi: `rút gọn ngày ${dd} → ${reduce(dd)}, tháng ${mm} → ${reduce(mm)}, năm ${yy} → ${reduce(yy)}; cộng ${reduce(dd) + reduce(mm) + reduce(yy)} → ${duongDoi}` },
    { ten: 'Số ngày sinh', vi: `ngày ${dd} → ${reduce(dd)}` },
    { ten: 'Số thái độ', vi: `ngày + tháng = ${dd + mm} → ${reduce(dd + mm)}` },
  ];
  if (nm) {
    trace.push({ ten: 'Số sứ mệnh', vi: `tổng chữ cái của "${nm.ten}" = ${nm.tongChuCai} → ${nm.suMenh}` });
    trace.push({ ten: 'Số linh hồn', vi: `tổng nguyên âm = ${nm.tongNguyenAm} → ${nm.linhHon}` });
    trace.push({ ten: 'Số nhân cách', vi: `tổng phụ âm = ${nm.tongPhuAm} → ${nm.nhanCach}` });
  }
  trace.push({ ten: 'Năm cá nhân', vi: `ngày + tháng sinh + năm ${today.yy} → ${cycle.nam}` });
  trace.push({ ten: 'Tháng cá nhân', vi: `năm cá nhân ${cycle.nam} + tháng ${today.mm} → ${cycle.thang}` });
  trace.push({ ten: 'Ngày cá nhân', vi: `tháng cá nhân ${cycle.thang} + ngày ${today.dd} → ${cycle.ngay}` });
  return {
    duongDoi, ngaySinh: reduce(dd), thaiDo: reduce(dd + mm),
    suMenh: nm ? nm.suMenh : null, linhHon: nm ? nm.linhHon : null, nhanCach: nm ? nm.nhanCach : null,
    ten: nm, thieu: nm ? nm.thieu : null,
    chuKy: cycle, dinhCao: pinnacles(dd, mm, yy), mui: arrows(dd, mm, yy, N),
    trace,
  };
}

/** Vector điểm 6 lĩnh vực theo ngày cá nhân (quy ước dự án, xem numerology.json › mauNgay). */
export function scoreNumerology(analysis, N) {
  const M = N.mauNgay, off = M.lech[String(analysis.chuKy.ngay)];
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
  const v = {};
  ['tai_loc', 'su_nghiep', 'tinh_cam', 'suc_khoe', 'quy_nhan'].forEach((k) => { v[k] = clamp(M.nen + off[k]); });
  v.tong = clamp(M.nen + Object.values(off).reduce((a, b) => a + b, 0) / 5);
  return {
    ...v,
    nhan: `Ngày cá nhân ${analysis.chuKy.ngay}, năm cá nhân ${analysis.chuKy.nam}`,
    doTinCay: analysis.ten ? 0.45 : 0.35, // bảng điểm là quy ước dự án nên độ tin cậy thấp
  };
}
