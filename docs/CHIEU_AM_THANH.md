# Kho âm thanh chiêu thức (prompt chiêu thức 3D, mục 5 và mục 14 điểm 5)

Tạo tự động: `python3 tools/make-chieu-am.py` (numpy + ffmpeg, kết quả cố định). Bảng dưới sinh từ `js/data/chieuAmKho.js`. Định dạng m4a (AAC mono 44,1 kHz 64 kbps), mỗi tiếng ≤ 100 KB, tổng ~145 KB. Đỉnh cao nhất −1,7 dB (có chừa biên, không méo).

**Tiếng là TỔNG HỢP TẠM, chưa ai nghe bằng tai.** Gp nghe thử rồi nói tiếng nào chưa ưng; chỉnh số ở `tools/make-chieu-am.py` và chạy lại.

## Cách dùng trong game
- Mỗi chiêu: GỒNG (lúc bấm, tăng dần cao độ/độ ồn) → PHÁT (lúc phát, đỉnh nhọn trong 0–80 ms) → TRÚNG (0,12 s sau phát; chất liệu kẻ địch: da thịt / kim loại / đá) → DƯ ÂM (0,12 s sau phát, ngân 0,5–1,5 s). Chiêu hỗ trợ không có tiếng trúng.
- Tuyệt học to gấp đôi chiêu thường (+6 dB), Chiêu 4 ở giữa; bộ nén chung của `js/ui/sfx.js` giữ không chói.
- Người ở xa nghe nhỏ dần (đủ trong 4 m, tắt ở 40 m); âm gồng cho người bị nhắm vẫn nghe ở xa (`lapCanhBao`).
- Mã: `js/world/chieuAm.js` (kế hoạch), `js/ui/sfx.js` (`playFile`, `preloadFiles`), `js/scene/chieuFx.js` (gọi lúc gồng/phát/trúng/dư âm; truyền `chatLieu` khi biết mục tiêu bằng gì, mặc định da thịt).

## Danh sách (tên file, độ dài, nguồn, giấy phép)
| Tên | Mô tả | Dài | Nặng | Nguồn | Giấy phép |
| --- | --- | ---: | ---: | --- | --- |
| `kim-gong` | Kim: gồng, tăng dần cao độ/độ ồn để báo hiệu | 1.00 s | 9.1 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `kim-phat` | Kim: phát, bùng nổ có đỉnh nhọn 0–80 ms | 0.70 s | 6.7 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `kim-duam` | Kim: dư âm ngân, vang, tan dần | 1.40 s | 12.4 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `moc-gong` | Mộc: gồng, tăng dần cao độ/độ ồn để báo hiệu | 0.90 s | 8.3 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `moc-phat` | Mộc: phát, bùng nổ có đỉnh nhọn 0–80 ms | 0.60 s | 6 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `moc-duam` | Mộc: dư âm ngân, vang, tan dần | 0.90 s | 8.3 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `thuy-gong` | Thủy: gồng, tăng dần cao độ/độ ồn để báo hiệu | 1.00 s | 10.1 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `thuy-phat` | Thủy: phát, bùng nổ có đỉnh nhọn 0–80 ms | 0.70 s | 6.8 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `thuy-duam` | Thủy: dư âm ngân, vang, tan dần | 1.10 s | 10.1 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `tho-gong` | Thổ: gồng, tăng dần cao độ/độ ồn để báo hiệu | 1.00 s | 9.1 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `tho-phat` | Thổ: phát, bùng nổ có đỉnh nhọn 0–80 ms | 0.80 s | 7.6 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `tho-duam` | Thổ: dư âm ngân, vang, tan dần | 1.30 s | 11.5 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `hoa-gong` | Hỏa: gồng, tăng dần cao độ/độ ồn để báo hiệu | 1.00 s | 9.2 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `hoa-phat` | Hỏa: phát, bùng nổ có đỉnh nhọn 0–80 ms | 0.80 s | 7.5 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `hoa-duam` | Hỏa: dư âm ngân, vang, tan dần | 1.00 s | 9.2 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `trung-dathit` | Trúng da thịt (người, quái mềm) | 0.30 s | 3.6 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `trung-kimloai` | Trúng kim loại (giáp, mộc nhân bọc sắt) | 0.50 s | 5.2 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |
| `trung-da` | Trúng đá (quái đá, tượng, mộc nhân đá) | 0.40 s | 4.4 KB | Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn | Tự tạo trong dự án, không có bản quyền bên thứ ba |

## CHƯA có: giọng nhân vật (cần người thu âm)
Prompt đòi mỗi chiêu một tiếng hô 0,3–0,8 s, 3 biến thể mỗi tiếng, giọng nam và nữ. Tiếng người tổng hợp bằng mã nghe không đạt, nên phần này cần thu thật (hoặc dùng bản quyền rõ ràng):
- Chiêu thường (15 chiêu, chiêu 1–3): hơi thở / tiếng hự, 0,3 s.
- Chiêu 4 (10 chiêu): câu hô tên chiêu hoặc từ ngắn, ~0,5 s.
- Tuyệt học (5 chiêu): câu hô dài có nhịp, ~0,8 s.
- Mỗi tiếng 3 biến thể × nam/nữ = 15×3×2 + 10×3×2 + 5×3×2 = 180 file ≤ 100 KB, đặt `assets/sfx/chieu/`, ghi nguồn/giấy phép từng file vào `THIRD_PARTY.md`.
- Làm gọn: trước hết chỉ cần theo cấp (3 nhóm × 3 biến thể × nam/nữ = 18 file) dùng chung cho mọi chiêu cùng cấp.
