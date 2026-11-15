# PHIÊN 173 — Bàn giao (prompt "chiêu thức 3D chuyên nghiệp": mục 5 — kho âm thanh + giấy phép)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc thêm `docs/PHIEN172.md`, `docs/PHIEN171.md`, `docs/PHIEN168.md` (danh sách 11 mục).

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Hiện trạng 11 mục "Nộp theo thứ tự" (prompt chiêu thức 3D, mục 14)
1. Thẻ chiêu + dòng thời gian — XONG (167). 2. Bảng màu + phác thảo — XONG (168). 3. Hoạt ảnh 4 khung — XONG mã + nối nhân vật (171; thiếu clip, xương áo/đai/tóc). 4. VFX sáu lớp — XONG (172; chưa nhìn bằng mắt).
5. **Kho âm thanh + giấy phép — XONG phần tiếng hiệu ứng phiên này; CHƯA có giọng hô nhân vật (cần người thu).**
6. Hoạt ảnh trúng đòn + trạng thái kẻ địch — chưa. **MỤC KẾ TIẾP** (mọi chiêu cần: giật theo hướng đòn 3 mức, khựng hình, thiêu đốt/choáng/hất tung/trói/làm chậm/đóng băng/mờ mắt, quái boss, số sát thương nảy, phản ứng giữa hệ).
7. Clip 5 giây ở ba cảnh — cần mắt người. 8. File JSON số liệu — chưa. 9. Điều khiển + camera (mục 10, 10A, 11) — chưa. 10. 12 combo + 5 tình huống khắc chế — chưa. 11. Báo cáo cân bằng — chưa.

## Mục 5 — đã làm gì
- `tools/make-chieu-am.py` (numpy + ffmpeg, seed cố định): 18 tiếng tổng hợp thuần mã → `assets/sfx/chieu/*.m4a` (AAC mono 44,1 kHz 64 kbps, 3,5–12,4 KB mỗi file, tổng ~145 KB, đỉnh cao nhất −1,7 dB). Mỗi Hệ (kim/moc/thuy/tho/hoa): `<he>-gong` (tăng dần cao độ/độ ồn), `<he>-phat` (đỉnh nhọn trong 0–80 ms, đã đo), `<he>-duam` (ngân 0,9–1,4 s); cộng `trung-dathit`, `trung-kimloai`, `trung-da`. Tool tự ghi `js/data/chieuAmKho.js` (`KHO_AM`: tên file, độ dài đo ffprobe, nguồn, giấy phép — TẠO TỰ ĐỘNG, đừng sửa tay).
- `js/world/chieuAm.js` (logic thuần): `lapAm(id, {chatLieu, coTrung, khoangCach})` → gồng/phát/trúng/dư âm (file, gain, trễ); Tuyệt học 1,0 vs chiêu thường 0,5 = +6 dB, Chiêu 4 = 0,7; `xa(d)` nhỏ dần (đủ ≤ 4 m, tắt ≥ 40 m); `lapCanhBao` (gồng vẫn nghe ≥ 0,35 trong 40 m cho người bị nhắm).
- `js/ui/sfx.js`: thêm `LGT.sfx.playFile(id,{gain,delay})` + `preloadFiles(ids)` (chưa tải thì tải rồi phát, qua bộ nén chung, tôn trọng thanh "Hiệu ứng"); loader biết đường dẫn kho. 15 file mp3 cũ + 22 cue cũ KHÔNG đổi.
- `js/scene/chieuFx.js`: gồng → phát → trúng (+0,12 s) → dư âm dùng kho mới; tham số mới `chatLieu` (mặc định da thịt) và `khoangCach`; thiếu `playFile` hoặc có hàm `play` tự truyền thì quay về cue cũ.
- `tests/chieuam.test.mjs` (7 test, đã vào `npm test`; 1 test dùng ffprobe, tự bỏ qua nếu máy không có). `docs/CHIEU_AM_THANH.md` (bảng tên/độ dài/nguồn/giấy phép + danh sách giọng hô cần thu), `THIRD_PARTY.md` thêm mục kho tự tạo. `sw.js` = `dgt-v165`.

## Chưa làm / cố ý để lại
- **Giọng nhân vật** (mục 5 prompt: hô 0,3–0,8 s, 3 biến thể, nam/nữ): AI không tạo được tiếng người đạt chất lượng. Làm gọn: 3 nhóm (chiêu thường / chiêu 4 / tuyệt học) × 3 biến thể × nam/nữ = 18 file; đủ theo prompt = 180 file. Gp thu hoặc cung cấp file có giấy phép rõ, rồi phiên sau nối (thêm vào kho + `lapAm`).
- Tiếng là TẠM, chưa ai nghe bằng tai: Gp nghe thử trong Luyện chiêu rồi báo tiếng nào chưa ưng (chỉnh số ở tool, chạy lại 1 lệnh).
- Chưa truyền `chatLieu` theo mục tiêu thật (mộc nhân/quái đá/giáp): mọi nơi gọi `cast` đang để mặc định da thịt; mục 6 (kẻ địch trúng đòn) nên khai báo chất liệu từng loại kẻ địch rồi truyền vào.
- Ngưỡng báo trước 0,4/0,8 s (treo từ Phiên 167) chưa quyết. Phiên 170: Gp phải dán lại `gas/Accounts.gs` vào Apps Script, Deploy → New version.

## Kiểm
Ghi ở báo cáo cuối phiên (trước khi sửa: 1193 đạt).

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN173.md (và 172, 171), clone repo, chạy `npm test`. Khi Gp nói "tiếp tục": làm mục 6 của prompt chiêu thức 3D (kẻ địch trúng đòn: 3 mức giật/lùi/khựng hình theo hướng đòn, trạng thái nhìn thấy được thiêu đốt/choáng/hất tung/trói/làm chậm/đóng băng/mờ mắt, số sát thương nảy, phản ứng giữa hệ; khai báo chất liệu từng loại kẻ địch để truyền `chatLieu` cho âm trúng); hỏi Gp chuyện ngưỡng 0,4/0,8 s và việc thu giọng hô. Xong thì chạy test, viết docs/PHIEN174.md, đẩy main, báo Gp và chờ "tiếp tục".
