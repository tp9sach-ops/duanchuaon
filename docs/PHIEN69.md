# PHIÊN 69 — Chữ nhãn cho các nút tròn góc phải-trên — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN65.md → PHIEN66.md → PHIEN67.md → PHIEN68.md → file này.

## Bối cảnh
Gp bảo xem lại repo, đọc kỹ, hiểu rõ phần còn thiếu, làm tiếp. Kiểm repo thật: `main` @ `3ed3ba0` — Gp đã tải ĐỦ 10 file của Phiên 68 (goPulse.js, gopulse.test.mjs, PHIEN68.md, story.js, package.json, sw.js, PROMPT.md, HANDOFF.md, README.md, KE_HOACH_TONG.md). Clone + `npm test` = **709/709** (Node 22) trước khi sửa.

## Chọn đúng MỘT mục nhỏ
PHIEN68 "Chưa làm" mục 1: nhãn chữ cho nút tròn góc phải-trên (trước đây chỉ biểu tượng + tooltip, điện thoại không có tooltip).

## ĐÃ LÀM
- `js/ui/menuLogic.js`: `captionOf(item)` (rút gọn: Đèn nguyện → "Đèn", Thông báo → "Báo tin"; tối đa `CAPTION_MAX = 9` ký tự), `LONG_PRESS_MS = 450`.
- `js/ui/hudMenu.js` (`mkBtn`, nhánh `cls === 'hm-ic'`): thêm `<span class="hm-ic-tx">` dưới mỗi nút tròn; trên cảm ứng, **nhấn giữ ≥ 450 ms** → toast tên nút (nút "sắp có" ghi "— sắp có") và nuốt cú bấm kế đó; bấm nhanh vẫn hoạt động như cũ. Chuột (`pointerType==='mouse'`) không dùng nhấn giữ.
- `css/hudmenu.css`: chữ chỉ hiện từ **màn ≥ 900 px** (máy tính/tablet rộng): khoảng cách cột 14 px, hàng 18 px, `max-width:300px`. **Điện thoại (< 900 px) KHÔNG hiện chữ** vì cụm nút nằm sát menu dọc (`top:118px`), thêm chữ sẽ đè.
- `tests/menu.test.mjs` +1 test (có chữ, ≤ 9 ký tự, không trùng, rút gọn đúng); `sw.js` = `dgt-v74`.
- Kiểm bằng jsdom (cài ngoài repo, KHÔNG thêm vào repo): 7 nút đều có chữ "Đèn · Báo tin · Quà · Thư · Câu cá · Chia sẻ · Trợ giúp"; nhấn giữ Thư → "Thư — sắp có"; bấm ngay sau khi giữ bị nuốt, bấm lần sau → báo "sắp có" như cũ; bấm nhanh Trợ giúp → mở sổ tay.

## CHƯA KIỂM / RỦI RO
- Chưa nhìn bằng mắt trên trình duyệt thật (không tải được three.js bản đầy đủ để dựng cảnh). Cần Gp mở trang trên máy tính: chữ có đè nút/khung nào bên phải-trên không; có bị cắt ở đáy cụm không (`padding-bottom:12px`).
- Điện thoại: chưa có chữ cố định, chỉ nhấn giữ. Nếu Gp muốn có chữ luôn hiện trên điện thoại thì phải dời menu dọc xuống (đụng `.hm-bar` top:118px) — HỎI Gp trước.

## PHÁT HIỆN (chưa động tới, cần Gp đồng ý)
- `js/PROMPT.md` (316 dòng) và `js/sw.js` (17 dòng) là file lạc do tải nhầm lên thư mục `js/` (commit `fe3255d`); bản đúng ở thư mục gốc. Phiên 59 từng xóa file lạc với sự đồng ý của Gp → xin phép xóa nốt.

## CHƯA LÀM (theo thứ tự đề xuất, mỗi việc xong báo, chờ "tiếp tục")
1. (c) Màn hướng dẫn lần đầu 3 bước có mũi tên (dễ phình giao diện; làm sau khi Gp thử điện thoại).
2. **Chơi chung qua mạng** (máu yêu quái chung, nhặt lá tranh nhau, ném người chơi khác bằng `throwCheck`): bước lớn, cần sửa `gas/Code.gs` + `engines/room.js` + `js/net/roomClient.js`; không thử được GAS ở môi trường AI → phiên riêng, Gp đồng ý trước (Gp tự sửa thư mục `gas`).
3. Gp thử `?yq=lua&yd=cao` trên điện thoại và cho ý kiến độ khó; các việc mở ở PHIEN65/66 (sông + hồ, kiến trúc, Suối Trong, Tu tập/NPC trong Lộ trình, kết quả phép 8 `chan-doan.html`, Xếp hạng, bơi–lặn).
4. KE_HOACH_TONG còn mở: 3.1 thử Chromium nhà/nội thất, 3.2 nâng hình trong phòng (HỎI), 3.4 Vipassana (xin duyệt thiết kế), 4.1 Chương 2 (HỎI), 4.2 thử Khinh thân bậc 1, 5.3 bơi/lặn, 5.6 xe, 6.1–6.3 xã hội/máy chủ/MoMo, 7.x tồn đọng, 8.x hoàn thiện.

## ĐẨY GITHUB
Xem phần báo cáo cuối phiên (đẩy thẳng bằng tích hợp GitHub nếu có quyền ghi; nếu không thì giao file để Gp tải lên tay): `js/ui/menuLogic.js`, `js/ui/hudMenu.js`, `css/hudmenu.css`, `tests/menu.test.mjs`, `sw.js`, `HANDOFF.md`, `PROMPT.md`, `docs/KE_HOACH_TONG.md`, `docs/PHIEN69.md`.

## PROMPT KHỞI ĐỘNG PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/loinhuan.github.io
Đọc PROMPT.md → docs/KE_HOACH_TONG.md → docs/PHIEN65.md → PHIEN66.md → PHIEN67.md → PHIEN68.md → PHIEN69.md. Clone repo, chạy npm test (kỳ vọng 710/710 nếu đã có bản Phiên 69), so với tài liệu; mã thật luôn đúng hơn tài liệu.
Làm TỪNG MỤC NHỎ MỘT, xong thì đẩy GitHub (trùng tên ghi đè), báo, rồi CHỜ tôi nói "tiếp tục". Việc đầu: hỏi tôi đã xóa js/PROMPT.md và js/sw.js (file lạc) chưa, rồi làm màn hướng dẫn lần đầu 3 bước (PHIEN69 "Chưa làm" 1) trừ khi tôi nói việc khác.
Cuối phiên: cập nhật PROMPT.md mục 7 + docs/PHIENxx.md (chép nguyên văn quy tắc bàn giao), npm test, và gửi prompt bàn giao chi tiết (file .md).
```
