// In bảng dòng thời gian 30 chiêu (mili-giây từ lúc bấm) ra Markdown. Chạy: node tools/chieuThoiGian.mjs > docs/CHIEU_THOI_GIAN.md
import { bangDongThoiGian, kiemDocDuoc, CUA_SO_NE_MS } from '../js/world/chieuTimeline.js';

const he = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', tho: 'Thổ', hoa: 'Hỏa' };
const out = [
  '# Dòng thời gian 30 chiêu (mili-giây, mốc 0 = lúc bấm nút)', '',
  'Tạo tự động bằng `node tools/chieuThoiGian.mjs` từ thẻ chiêu (gồng, hậu động, tầm/tốc độ đạn), lịch tư thế (thời lượng khung phát) và `combatSkills.js` (hồi chiêu). Sửa số ở các file đó rồi chạy lại, không sửa tay file này.', '',
  `Cảnh báo (vùng viền + hoa văn) hiện ngay từ mốc 0. Hủy gồng bằng di chuyển được đến hết gồng (mất 30% hồi chiêu). Cửa sổ né khoan dung ${CUA_SO_NE_MS} ms sau mốc "Trúng". "Đọc được" = thời gian từ lúc cảnh báo hiện tới lúc sát thương tính, so với ngưỡng Bản 2 (0,25 / 0,5 / 1,5 s) và ngưỡng prompt 3D (0,4 / 0,8 / 1,5 s); chiêu buff/có lợi không áp ngưỡng.`, '',
  '| Chiêu | Hệ | Gồng → Phát | Trúng | Hết hậu động | Hết hồi chiêu | Đọc được (Bản 2 / prompt 3D) |', '| --- | --- | ---: | ---: | ---: | ---: | --- |',
];
for (const t of bangDongThoiGian()) {
  const k = kiemDocDuoc(t.id), m = t.moc, ok = (b) => (b ? 'đạt' : 'KHÔNG');
  out.push(`| ${t.slotTen} · ${t.ten} (\`${t.id}\`) | ${he[t.he]} | ${m.phat} | ${m.trungDon} | ${m.hetHauDong} | ${m.hetHoiChieu} | ${k.gayHai ? `${k.baoTruocMs} ms: ${ok(k.datBan2)} / ${ok(k.datMoi)}` : 'không áp (buff/có lợi)'} |`);
}
console.log(out.join('\n'));
