# PHIÊN 70 — Màn hướng dẫn lần đầu 3 bước có mũi tên — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN65.md → PHIEN66.md → PHIEN67.md → PHIEN68.md → PHIEN69.md → file này.

## Bối cảnh
Gp nói "tiếp tục" sau Phiên 69. Phiên 69 (chữ nhãn nút phải-trên) được giao dưới dạng file để Gp tải tay; Phiên 70 làm TIẾP TRÊN bản đó nên gói tải lên có CẢ file Phiên 69 lẫn Phiên 70. Nếu repo chưa có `docs/PHIEN69.md` / `captionOf` trong `js/ui/menuLogic.js` thì Gp chưa tải bản Phiên 69: tải cả gói. Trước khi sửa: `npm test` 710/710. Sau: **715/715**.

## Chọn đúng MỘT mục nhỏ
PHIEN69 "Chưa làm" mục 1: màn hướng dẫn lần đầu 3 bước có mũi tên. Gp chưa trả lời câu hỏi về hai file lạc `js/PROMPT.md`, `js/sw.js` → KHÔNG xóa, hỏi lại.

## ĐÃ LÀM
- `js/world/coach.js` (mới, logic thuần): `STEPS` (3 bước: Đi lại → `#joy` hoặc chỉ xuống đất; Làm nhiệm vụ → nút `.hm-mi[data-id="nhiemvu"]`; Quên cách chơi → nút `.hm-ic[data-id="trogiup"]`), `loadCoach/saveCoach/advance`, `isVeteran`, `shouldStart`, hình học mũi tên `angleTo/edgeDistance/arrowPlan`. Khóa lưu `localStorage lgt.coach` (`{"done":true}` khi xong/bỏ qua).
- `js/ui/coach.js` (mới): thẻ nhỏ giữa màn hình (số bước 1/3, tiêu đề, chữ, nút "Bỏ qua" và "Tiếp"/"Xong") + mũi tên vàng chỉ nút; nút được chỉ nhấp nháy bằng lớp `gd-hl` có sẵn (riêng `#joy` chỉ có mũi tên vì cần giữ `position`). Không chặn thao tác, không cướp focus; tự ẩn khi có bảng mở (`panel-open`/`LGT.panelOpen`) và khi HUD ẩn; bố trí lại mỗi 0,5 giây và khi đổi cỡ cửa sổ.
- Luật hiện: chỉ **người mới** (chưa có `lgt.tut`, `lgt.story`, `lgt.gdUsed`), HUD đã hiện ≥ 4 giây (`COACH_DELAY_MS`). Người cũ → ghi `done` âm thầm, không thấy gì.
- `js/ui/tutorial.js`: lời nhắc "Mới chơi? Bấm nút ?" ở giây 16 bị bỏ khi màn hướng dẫn đang hiện (`LGT.coach.active`), để không nhắc đôi.
- `js/ui/hudMenu.js`: `initCoach(hud)` (bọc try/catch như các phần khác). `index.html`: thêm `css/coach.css`. `package.json`: thêm `tests/coach.test.mjs` (5 test). `sw.js` = `dgt-v75`.
- Kiểm bằng jsdom (ngoài repo, KHÔNG thêm vào repo; giả `getBoundingClientRect`): người mới — không hiện trước 4 giây, hiện bước 1/3 có mũi tên, bước 2 nhấp nháy nút Nhiệm vụ, bước 3 nhấp nháy nút "?" và tắt nút cũ, "Xong" → ẩn hết + lưu done; người cũ — không hiện.

## CHƯA KIỂM / RỦI RO
- Chưa nhìn bằng mắt trên trình duyệt thật/điện thoại. Cần Gp **xóa dữ liệu trang** (hoặc mở cửa sổ ẩn danh) để làm "người mới" rồi xem: thẻ có che nhân vật/nút quan trọng không (thẻ ở 34% chiều cao màn hình); mũi tên có chỉ đúng nút "Nhiệm vụ" và "?" không (đặc biệt điện thoại, nơi menu dọc nằm bên phải: thẻ đã dịch trái 26 px); cần tròn `#joy` có tồn tại ở bước 1 trên máy cảm ứng không (không có thì mũi tên chỉ xuống đất).
- Mũi tên dài tối đa 140 px (`arrowPlan max`), nên với nút ở xa nó chỉ đúng HƯỚNG chứ không chạm tới nút; nút vẫn nhấp nháy để dễ thấy. Nếu Gp muốn dài hơn: tăng `max`.
- Người chơi cũ chưa mở sổ tay/chưa có tiến độ vẫn sẽ thấy màn này một lần (bấm "Bỏ qua" là hết).

## CHƯA LÀM (theo thứ tự đề xuất, mỗi việc xong báo, chờ "tiếp tục")
1. Hỏi Gp về hai file lạc `js/PROMPT.md`, `js/sw.js` (xóa được chưa).
2. **Chơi chung qua mạng** (máu yêu quái chung, nhặt lá tranh nhau, ném người chơi khác bằng `throwCheck`): bước lớn, cần sửa `gas/Code.gs` + `engines/room.js` + `js/net/roomClient.js`; không thử được GAS ở môi trường AI → phiên riêng, Gp đồng ý trước (Gp tự sửa thư mục `gas`).
3. Chờ Gp thử máy thật rồi mới chỉnh: chữ nhãn nút phải-trên (PHIEN69), màn hướng dẫn 3 bước (file này), `?yq=lua&yd=cao` độ khó yêu quái, các việc mở ở PHIEN65/66 (sông + hồ, kiến trúc, Suối Trong, Tu tập/NPC trong Lộ trình, phép 8 `chan-doan.html`, Xếp hạng, bơi–lặn).
4. KE_HOACH_TONG còn mở: 3.1 thử Chromium nhà/nội thất, 3.2 nâng hình trong phòng (HỎI), 3.4 Vipassana (xin duyệt thiết kế), 4.1 Chương 2 (HỎI), 4.2 thử Khinh thân bậc 1, 5.3 bơi/lặn, 5.6 xe, 6.1–6.3 xã hội/máy chủ/MoMo, 7.x tồn đọng, 8.x hoàn thiện.

## ĐẨY GITHUB
Môi trường AI không đẩy thẳng được (file `HANDOFF.md` 166 KB và `PROMPT.md` 64 KB quá lớn để gõ lại qua công cụ, gõ lại mã dễ hỏng) → giao gói `phien70-tai-len-github.zip`, Gp tải lên đúng đường dẫn, trùng tên ghi đè. Có 17 file: `js/ui/menuLogic.js`, `js/ui/hudMenu.js`, `js/ui/tutorial.js`, `js/ui/coach.js`, `js/world/coach.js`, `css/hudmenu.css`, `css/coach.css`, `index.html`, `tests/menu.test.mjs`, `tests/coach.test.mjs`, `package.json`, `sw.js`, `HANDOFF.md`, `PROMPT.md`, `docs/KE_HOACH_TONG.md`, `docs/PHIEN69.md`, `docs/PHIEN70.md`.

## PROMPT KHỞI ĐỘNG PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/loinhuan.github.io
Đọc PROMPT.md → docs/KE_HOACH_TONG.md → docs/PHIEN65.md → PHIEN66.md → PHIEN67.md → PHIEN68.md → PHIEN69.md → PHIEN70.md. Clone repo, chạy npm test (kỳ vọng 715/715 nếu đã tải bản Phiên 70 lên), so với tài liệu; mã thật luôn đúng hơn tài liệu.
Làm TỪNG MỤC NHỎ MỘT, xong thì đẩy GitHub (trùng tên ghi đè), báo, rồi CHỜ tôi nói "tiếp tục". Việc đầu: hỏi tôi (1) đã xóa js/PROMPT.md và js/sw.js (file lạc) chưa, (2) thử chữ nhãn nút phải-trên và màn hướng dẫn 3 bước trên máy thật thấy gì cần chỉnh; rồi làm theo câu trả lời. Nếu tôi không có ý kiến thì hỏi tôi có đồng ý làm "Chơi chung qua mạng" ở phiên riêng không (PHIEN70 "Chưa làm" 2).
Cuối phiên: cập nhật PROMPT.md mục 7 + docs/PHIENxx.md (chép nguyên văn quy tắc bàn giao), npm test, và gửi prompt bàn giao chi tiết (file .md).
```
