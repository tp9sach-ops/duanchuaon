// Phiên 138: đường cong cấp CÔNG HẠNH KHÔNG GIỚI HẠN (thanh "Cấp" ở thẻ nhân vật). LOGIC THUẦN, có test: tests/xpthuong.test.mjs.
// Bảng ngưỡng điểm của 10 cấp đầu nằm ở LEVELS (js/world/quests.js, truyền vào đây dưới dạng mảng điểm). Từ cấp kế tiếp trở đi mỗi cấp cần thêm EXTRA_BASE + EXTRA_STEP × (số cấp ngoài bảng) điểm so với cấp trước:
// cấp 11 cần +600 so với cấp 10, cấp 12 cần +700 so với cấp 11, ... Số liệu TẠM, chờ ptg duyệt.
export const EXTRA_BASE = 500, EXTRA_STEP = 100;

/** Ngưỡng điểm để ĐẠT cấp `lv` (cấp 1 = 0). `table` = mảng ngưỡng tăng dần của các cấp đầu (phần tử 0 là cấp 1). */
export function xpForLevel(table, lv) {
  const n = Math.max(1, Math.floor(Number(lv) || 1)), L = table.length;
  if (n <= L) return table[n - 1];
  const m = n - L;
  return table[L - 1] + EXTRA_BASE * m + (EXTRA_STEP * m * (m + 1)) / 2;
}

/** Cấp ứng với tổng điểm `xp` (không có cấp tối đa). Điểm lạ/âm → cấp 1. */
export function levelAtXp(table, xp) {
  const x = Math.max(0, Math.floor(Number(xp) || 0)), L = table.length;
  if (x < table[L - 1]) { let i = 0; while (i + 1 < L && x >= table[i + 1]) i++; return i + 1; }
  const d = x - table[L - 1], b = EXTRA_BASE + EXTRA_STEP / 2;
  let m = Math.max(0, Math.floor((-b + Math.sqrt(b * b + 2 * EXTRA_STEP * d)) / EXTRA_STEP));
  while (xpForLevel(table, L + m + 1) <= x) m++;      // sửa sai số làm tròn của căn bậc hai
  while (m > 0 && xpForLevel(table, L + m) > x) m--;
  return L + m;
}
