# PHIÊN 49 — Lạy Phật cộng hạt sen (mục 1.5) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang, Phan Trường Giang):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, làm TỪNG PHIÊN/TỪNG MỤC, xong báo, CHỜ "tiếp tục". Muốn sửa mã thì nhận đủ đoạn TÌM (nguyên văn, không viết tắt) và THAY BẰNG đầy đủ; cần đoạn mã nào thì HỎI ptg gửi, không đoán.
**Yêu cầu Phiên 49:** "xem nguồn https://github.com/tp9sach-ops/loinhuan.github.io, hiện tại có rất nhiều thay đổi, đọc cho kỹ, phân tích và hiểu rõ việc thực hiện tiếp những thứ còn thiếu".

## THỨ TỰ ĐỌC (quan trọng)
`HANDOFF.md` ở gốc repo đã CŨ (dừng ở Phiên 14a). Đọc theo thứ tự: `PROMPT.md` (mục 7 cuối cùng là nhật ký mới nhất) → `docs/KE_HOACH_TONG.md` (danh sách việc, [x]/[ ]) → file này → `docs/PHIEN48.md`, `PHIEN47.md`, `PHIEN46.md`. Mã thật luôn đúng hơn tài liệu.

## Kiểm đầu phiên
- Repo `main` lúc kiểm = `862cbd8` (Phiên 48: cảnh 3D câu cá). `npm test` = **584/584** trước khi sửa (Node 22.23).
- Sau khi sửa: **585/585** đạt (Node 22). Node 20 chưa chạy.

## ĐÃ LÀM (mục 1.5)
Bấm nút **Lạy Phật** trong chánh điện → nhân vật lạy (như cũ) + gọi `LGT.merit.reward('lay', DEN_MERIT.lay)` → **+1 hạt sen**, tối đa **10 lần/ngày** (`ACT_CAP.lay` trong `js/world/merit.js`, có sẵn từ Phiên 41). Hết 10 lần: toast "hôm nay đã nhận đủ công đức", vẫn lạy được.
- Số **1 hạt sen/lần là GIÁ TRỊ TẠM** (ptg chưa chốt) — nằm ở `DEN_MERIT.lay` trong `js/engines/den.js`.
- Chỉ cộng khi `LGT.world.bow()` trả đúng (tức đang ở trong chánh điện); đứng ngoài sân thì chỉ hiện nhắc, không cộng.

## File thay đổi
- SỬA `js/engines/den.js`: thêm `lay: 1` vào `DEN_MERIT`.
- SỬA `js/ui/hudMenu.js`: import `DEN_MERIT`; sau khi lạy thành công gọi `LGT.merit.reward('lay', …)` (cạnh `LGT.act('bow')`).
- SỬA `tests/den.test.mjs`: +1 test (`DEN_MERIT.lay === 1`).
- SỬA `sw.js`: `VERSION` `dgt-v54` → `dgt-v55`.
- SỬA `docs/KE_HOACH_TONG.md`: mục 1.5 đánh [x]. SỬA `PROMPT.md`: thêm dòng nhật ký Phiên 49. MỚI `docs/PHIEN49.md` (file này).

## CHƯA KIỂM / RỦI RO
- Chưa mở trang thật: chưa thấy toast "+1 hạt sen" khi lạy, chưa thử hết 10 lần/ngày bằng tay (logic `claimAct` đã có test ở `tests/merit.test.mjs`; phần nối nút chưa có test tự động vì `hudMenu.js` là mã giao diện).
- Cảnh 3D câu cá (Phiên 48) vẫn chưa nhìn bằng mắt: độ cao mặt nước, cỡ cầu/hoa sen (xem `docs/PHIEN48.md`).

## ĐẨY GITHUB
`git push` từ môi trường AI bị từ chối (không có thông tin đăng nhập); công cụ `push_files` trước đây (Phiên 48) cũng 403 nên không dùng. Repo `main` VẪN là `862cbd8` (Phiên 48). ptg cần tải 7 file lên tay (Add file → Upload files, kéo file trong `cap-nhat-phien49.zip`, giữ đúng thư mục, trùng tên ghi đè): `js/engines/den.js`, `js/ui/hudMenu.js`, `tests/den.test.mjs`, `sw.js`, `docs/KE_HOACH_TONG.md`, `PROMPT.md`, `docs/PHIEN49.md`. Phiên sau: `git clone` rồi so với bản này; nếu repo vẫn `862cbd8` thì nhắc ptg tải lên.

## GHI CHÚ AN TOÀN
Quét bí mật thấy `js/config.js` có `apiKey: 'AIza…'` (dạng khóa cấu hình web Firebase, vốn là khóa công khai của ứng dụng web; an toàn phụ thuộc luật trong `firebase/database.rules.json`). Không đổi gì; chỉ báo để ptg biết. KHÔNG bao giờ đưa khóa Anthropic/GAS vào repo.

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
1. **2.2** chạy `npm test` nhiều lần để bắt test lỗi thoáng qua (Phiên 43 gặp 1 lần; Phiên 46, 49 chạy đều đạt).
2. **Giai đoạn 3** (nhà/nội thất): 3.1 thử Chromium vào/ra 4 cấp nhà (ptg thử trên máy thật); 3.2 nâng hình phần trong phòng — **HỎI ptg trước**; 3.4 nhiệm vụ Tâm trí Vipassana — **xin ptg duyệt thiết kế trước**.
3. **Giai đoạn 4**: 4.1 chương 2 cốt truyện — **hỏi ptg ý chính**; 4.2 nhiệm vụ thử Khinh thân bậc 1; 4.3 nhiệm vụ nội thất đầu tiên (QUESTS + CHAIN).
4. Còn lại theo `docs/KE_HOACH_TONG.md` (giai đoạn 5–8). Việc ptg: xem mục "Việc của ptg" cuối file đó.
Quy tắc phiên: logic có test; đổi giao diện thì tăng `VERSION` trong `sw.js`; quét bí mật (không để khóa API vào repo); `npm test`; đẩy GitHub; viết `docs/PHIEN50.md`.

## Câu hỏi còn treo cho ptg
- Mỗi lần Lạy Phật nên được mấy hạt sen (tạm 1)? Trần 10 lần/ngày có ổn không?
- Số tạm câu cá/phóng sinh (xem `docs/PHIEN44.md`); quả cầu có đúng là cầu quăng xuống nước? Có tặng 1 cầu gỗ cho người mới?
- Pages: Settings → Pages → Source = "GitHub Actions"?
