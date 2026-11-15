// KHO ÂM THANH chiêu thức — TẠO TỰ ĐỘNG bởi tools/make-chieu-am.py (đừng sửa tay; sửa số trong tool rồi chạy lại). Luật dùng: js/world/chieuAm.js, test: tests/chieuam.test.mjs.
// giay = độ dài đo bằng ffprobe; nguon/giayPhep = yêu cầu nộp kèm mỗi tiếng (prompt chiêu thức 3D mục 5).
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };
export const KHO_AM = deepFreeze({
 "kim-gong": {
  "file": "assets/sfx/chieu/kim-gong.m4a",
  "giay": 1.0,
  "kb": 9.1,
  "loai": "gong",
  "he": "kim",
  "mota": "Kim: gồng, tăng dần cao độ/độ ồn để báo hiệu",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "kim-phat": {
  "file": "assets/sfx/chieu/kim-phat.m4a",
  "giay": 0.7,
  "kb": 6.7,
  "loai": "phat",
  "he": "kim",
  "mota": "Kim: phát, bùng nổ có đỉnh nhọn 0–80 ms",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "kim-duam": {
  "file": "assets/sfx/chieu/kim-duam.m4a",
  "giay": 1.4,
  "kb": 12.4,
  "loai": "duam",
  "he": "kim",
  "mota": "Kim: dư âm ngân, vang, tan dần",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "moc-gong": {
  "file": "assets/sfx/chieu/moc-gong.m4a",
  "giay": 0.9,
  "kb": 8.3,
  "loai": "gong",
  "he": "moc",
  "mota": "Mộc: gồng, tăng dần cao độ/độ ồn để báo hiệu",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "moc-phat": {
  "file": "assets/sfx/chieu/moc-phat.m4a",
  "giay": 0.6,
  "kb": 6.0,
  "loai": "phat",
  "he": "moc",
  "mota": "Mộc: phát, bùng nổ có đỉnh nhọn 0–80 ms",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "moc-duam": {
  "file": "assets/sfx/chieu/moc-duam.m4a",
  "giay": 0.9,
  "kb": 8.3,
  "loai": "duam",
  "he": "moc",
  "mota": "Mộc: dư âm ngân, vang, tan dần",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "thuy-gong": {
  "file": "assets/sfx/chieu/thuy-gong.m4a",
  "giay": 1.0,
  "kb": 10.1,
  "loai": "gong",
  "he": "thuy",
  "mota": "Thủy: gồng, tăng dần cao độ/độ ồn để báo hiệu",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "thuy-phat": {
  "file": "assets/sfx/chieu/thuy-phat.m4a",
  "giay": 0.7,
  "kb": 6.8,
  "loai": "phat",
  "he": "thuy",
  "mota": "Thủy: phát, bùng nổ có đỉnh nhọn 0–80 ms",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "thuy-duam": {
  "file": "assets/sfx/chieu/thuy-duam.m4a",
  "giay": 1.1,
  "kb": 10.1,
  "loai": "duam",
  "he": "thuy",
  "mota": "Thủy: dư âm ngân, vang, tan dần",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "tho-gong": {
  "file": "assets/sfx/chieu/tho-gong.m4a",
  "giay": 1.0,
  "kb": 9.1,
  "loai": "gong",
  "he": "tho",
  "mota": "Thổ: gồng, tăng dần cao độ/độ ồn để báo hiệu",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "tho-phat": {
  "file": "assets/sfx/chieu/tho-phat.m4a",
  "giay": 0.8,
  "kb": 7.6,
  "loai": "phat",
  "he": "tho",
  "mota": "Thổ: phát, bùng nổ có đỉnh nhọn 0–80 ms",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "tho-duam": {
  "file": "assets/sfx/chieu/tho-duam.m4a",
  "giay": 1.3,
  "kb": 11.5,
  "loai": "duam",
  "he": "tho",
  "mota": "Thổ: dư âm ngân, vang, tan dần",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "hoa-gong": {
  "file": "assets/sfx/chieu/hoa-gong.m4a",
  "giay": 1.0,
  "kb": 9.2,
  "loai": "gong",
  "he": "hoa",
  "mota": "Hỏa: gồng, tăng dần cao độ/độ ồn để báo hiệu",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "hoa-phat": {
  "file": "assets/sfx/chieu/hoa-phat.m4a",
  "giay": 0.8,
  "kb": 7.5,
  "loai": "phat",
  "he": "hoa",
  "mota": "Hỏa: phát, bùng nổ có đỉnh nhọn 0–80 ms",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "hoa-duam": {
  "file": "assets/sfx/chieu/hoa-duam.m4a",
  "giay": 1.0,
  "kb": 9.2,
  "loai": "duam",
  "he": "hoa",
  "mota": "Hỏa: dư âm ngân, vang, tan dần",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "trung-dathit": {
  "file": "assets/sfx/chieu/trung-dathit.m4a",
  "giay": 0.3,
  "kb": 3.6,
  "loai": "trung",
  "he": null,
  "mota": "Trúng da thịt (người, quái mềm)",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "trung-kimloai": {
  "file": "assets/sfx/chieu/trung-kimloai.m4a",
  "giay": 0.5,
  "kb": 5.2,
  "loai": "trung",
  "he": null,
  "mota": "Trúng kim loại (giáp, mộc nhân bọc sắt)",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 },
 "trung-da": {
  "file": "assets/sfx/chieu/trung-da.m4a",
  "giay": 0.4,
  "kb": 4.4,
  "loai": "trung",
  "he": null,
  "mota": "Trúng đá (quái đá, tượng, mộc nhân đá)",
  "nguon": "Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn",
  "giayPhep": "Tự tạo trong dự án, không có bản quyền bên thứ ba"
 }
});
