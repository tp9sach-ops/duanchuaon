# Phiên 162 — Bản 2 mục 1: biểu tượng chiêu + nút bấm + giữ để xem thông tin — XONG mã + test

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng (ptg) nói tiếng Việt. Kiểm mã thật, chạy `npm test` (mong đợi 1145 test, **3 lỗi sẵn trên main**: dân làng / Cửa hàng 9 Sạch / chỗ trú — không do phiên này; chạy ~3 phút → timeout lớn).

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm TỪNG MỤC, xong chạy test, đẩy `main`, báo, chờ ptg nói "tiếp tục". Chỉ đọc chỗ cần sửa; việc nào đã làm rồi thì bỏ qua; cập nhật không lỗi. Không báo test đạt nếu chưa chạy.

## Đã xong trước đó (bỏ qua)
Luật lõi (luatChien), 30 thẻ chiêu 5 Hệ (chieuHoa.js, chieuNguHanh.js), 30 tư thế (chieuPose.js) + `avatar.cast(skillId)` (Phiên 159).

## Phiên này làm gì
- **`js/world/chieuInfo.js` (mới, logic thuần):** `infoOf(id,{tuvi,level})` = tên, Hệ, ô, cấp mở, cấp chiêu (kẹp theo Tu Vi), hồi chiêu, gồng/hậu động, hệ số theo cấp, **sát thương mẫu = Công(Tu Vi) × hệ số cấp** (chưa tính Thủ mục tiêu/khắc Hệ), nội tại (từ `fx` + thẻ: Thiêu đốt, hất tung, nổ lan, phản, lao, nổ cuối, bất khả xâm phạm…), cái giá, nối tiếp (móc), cách khắc, vùng báo (hình + hoa văn). `infoRows(info)` → mảng [nhãn, nội dung]. `iconSpec(id)` → màu Hệ, hoa văn (vạch chéo/lá/gợn sóng/ô vuông/sọc nhọn), chữ cái.
- **`js/ui/heSkill.js`:** mỗi nút có biểu tượng SVG (createElementNS, không innerHTML) + tên nhỏ + phím Q/W/E. **Giữ nút ≥ 380 ms** (`HOLD_MS`) → hiện bảng thông tin phía trên thanh nút, thả ra thì ẩn, **không tung chiêu**; **chạm nhanh** → tung chiêu (nay tung lúc THẢ tay, trước đây lúc chạm xuống; phím Q/W/E vẫn tức thì). Tung chiêu thành công gọi `LGT.world.avatar.cast(sk.id)` (tư thế gồng→phát→thu).
- `tests/chieuinfo.test.mjs` (4 test, đã vào `npm test`); `sw.js` VERSION → `dgt-v162`.

## Chưa làm / lưu ý
- **CHƯA nhìn bằng mắt** (không có WebGL/trình duyệt thật): ptg thử giữ một nút chiêu xem bảng có hiện đúng chỗ, không bị che, và biểu tượng có rõ không. Nếu bảng lệch trên điện thoại: chỉnh `showTip()` trong heSkill.js.
- Chiêu hỗ trợ (heSo = 0) vẫn báo "sắp có" khi bấm, nên chưa chạy tư thế; bảng giữ-để-xem vẫn xem được thông tin. Ô chiêu 4 và Tuyệt học chưa có nút trên thanh (thanh chỉ 3 ô) — việc nối 30 chiêu vào chiến đấu để mục sau.
- Sát thương hiển thị là mẫu (Công × hệ số), sát thương thật còn phụ thuộc Thủ mục tiêu, khắc Hệ, thưởng đánh trúng người đang gồng.

## Việc kế tiếp (chờ ptg nói "tiếp tục")
Mục 6: bảng hiệu ứng + âm thanh cho 30 chiêu; mục 7: trang bị `gear.js`; mục 8: 12 combo và 5 phản ứng khắc; mục 9: cân bằng bằng kịch bản.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN162.md, chạy npm test (3 lỗi sẵn trên main). Mục 1 đã xong; việc kế tiếp = mục 6, làm khi ptg nói "tiếp tục".
