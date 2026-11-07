# PHIÊN 54 — SỬA LỖI "Chưa kết nối được máy chủ" Ở MÀN ĐĂNG NHẬP / ĐẶT MẬT KHẨU — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Ptg báo (2026-11-08):** màn "Đặt mật khẩu cho nhân vật" (nhân vật cũ "Thích Đạt Số", mật khẩu 999999) báo đỏ "Chưa kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại." Chụp trên baocaonoibo.io.vn (trang cổng nhúng game).

## Nguyên nhân (đã xác định từ mã)
`js/api.js` cũ gộp MỌI lỗi vào một mã `network`: mất mạng, Apps Script trả trang HTML (chưa Authorize/chưa deploy bản mới → `res.json()` ném lỗi), hay Google chặn đọc phản hồi (CORS khi deployment không phải "Anyone"). Giao diện luôn nói "kiểm tra mạng" nên sai hướng. Mã web `acctCreate` không có lỗi logic (test chạy thật `Accounts.gs` trong vm đều đạt) → **gần như chắc chắn máy chủ Apps Script chưa được cập nhật/Authorize theo `docs/PHIEN53.md` mục "VIỆC GP PHẢI LÀM"**. Sandbox AI không gọi được script.google.com nên KHÔNG kiểm được máy chủ thật.

## Đã sửa (phía web)
- `js/api.js`: phân loại lỗi — `network` (thật sự mất mạng, xác nhận bằng thăm dò no-cors), `blocked` (tới được Google nhưng bị chặn đọc), `bad_response` (không phải JSON), `timeout`, `http_NNN`. `blocked`/`bad_response` không thử lại. Lệnh `acctCreate/Login/Save/Load` chờ tối đa 30 giây (trước 15) vì Apps Script khởi động nguội + ghi Sheet chậm.
- `js/engines/account.js`: thêm thông báo riêng cho `blocked`, `bad_response`.
- `js/ui/accountGate.js`: lỗi hạng máy chủ hiện kèm "(mã: …)" để biết đúng nguyên nhân. Nút "Chơi tạm" vẫn hiện như cũ.
- `tests/api.test.mjs` (7 test mới); `package.json` thêm test; `sw.js` = `dgt-v59`.
- `npm test` **638/638** (631 + 7).

## Việc Gp phải làm để đăng nhập chạy thật (phía Apps Script)
1. Mở trình duyệt, dán `apiUrl` trong `js/config.js`. Phải thấy JSON `{"ok":true,"name":"Diệu Giang Tự API",...}`. Nếu hiện trang đăng nhập Google/lỗi → deployment sai: Deploy → Manage deployments → ✏️ → Who has access = **Anyone**, Execute as = **Me**, Version = **New version**.
2. Đã có `Accounts.gs` và `Code.gs` mới (5 case `acct*`) trong dự án Apps Script chưa? Chưa → làm theo `docs/PHIEN53.md`.
3. Trong trình soạn Apps Script chọn hàm `setup` → Run → bấm Authorize (cấp quyền lại sau khi thêm code mới). Rồi Deploy → New version.
4. Tải lại trang (Ctrl+F5 hoặc xóa dữ liệu trang), thử đặt mật khẩu lại. Thông báo mới sẽ cho biết mã: `blocked` = bước 1/3 chưa xong; `bad_response` = chưa deploy bản mới/đang lỗi; `unknown_action` ("Máy chủ gặp lỗi") = chưa dán Code.gs mới; `network` = mất mạng thật.

## Việc tiếp (mỗi việc một lượt, chờ "tiếp tục")
1. Gp báo mã lỗi hiện ra sau khi cập nhật Apps Script → sửa tiếp nếu còn.
2. Đổi mật khẩu / quên mật khẩu (xem `docs/PHIEN53.md` mục VIỆC TIẾP).
3. Nối tên trong phòng đa người với tài khoản.

## Cập nhật cuối Phiên 54 (sau khi Gp cập nhật Apps Script)
- Gp xác nhận: Apps Script có `Accounts.gs` + 5 case `acct*` trong `Code.gs`; chạy `setup()` xong; deployment "Who has access = Anyone", "Execute as = Me"; mở `apiUrl` trên trình duyệt ra JSON `{"ok":true,"name":"Diệu Giang Tự API",...}`; `apiUrl` khớp `js/config.js`.
- Màn đặt mật khẩu trên baocaonoibo.io.vn nay báo **`blocked`**: POST thất bại ở trình duyệt nhưng máy chủ Google có tới được (GET no-cors qua). Tức là lỗi đọc phản hồi POST (CORS/trang lỗi không có header cho phép), KHÔNG phải mất mạng và KHÔNG phải thiếu `Accounts.gs`.
- Thêm `chan-doan.html` (ở gốc repo): chạy 5 phép thử (GET, POST ping, POST acctLogin giả, POST no-cors, XHR) và in kết quả + origin + có nằm trong khung nhúng không. **Gp mở https://tp9sach-ops.github.io/loinhuan.github.io/chan-doan.html và gửi ảnh chụp.** Cũng nên mở thẳng game ở địa chỉ github.io (không qua baocaonoibo.io.vn) để so sánh.
- Cách đọc: (2) lỗi mà (1) đạt → chỉ POST bị chặn (xem Apps Script → Executions có dòng doPost không); (1) cũng lỗi → CORS với mọi lệnh (kiểm lại deployment/phiên bản); chỉ lỗi khi mở qua baocaonoibo.io.vn → vấn đề khung nhúng/Google Sites; (2) đạt mà game vẫn lỗi → lỗi nằm ở nội dung gói acctCreate (cỡ gói lưu).
- Phương án dự phòng nếu CORS POST không sửa được: vận chuyển bằng form ẩn + iframe + `postMessage` (cần thêm nhánh HtmlService trong `doPost`).

## Kết quả chan-doan.html (Gp chạy 2026-11-08, origin github.io, không nhúng khung)
Cả 5 phép thử ĐẠT: GET đọc được, POST ping đọc được, POST acctLogin giả → `bad_login` (máy chủ + Accounts.gs + CORS đều đúng), no-cors OK, XHR OK. ⇒ KHÔNG phải lỗi cấu hình Apps Script/CORS. `blocked` chỉ xảy ra với `acctCreate` thật. Giả thuyết hiện tại: (a) gói `save` rất lớn (toàn bộ `lgt.*`) làm POST thất bại ở trình duyệt; (b) khác biệt do chạy qua baocaonoibo.io.vn. Đã thêm vào chan-doan.html phép 6 (POST kèm 60/200/600 KB) và phép 7 (cỡ dữ liệu `lgt.*`). Việc tiếp: xem kết quả phép 6–7, và đo cỡ `JSON.stringify(localStorage)` trên máy của Gp (máy đang lỗi, trang baocaonoibo.io.vn).

## Kết quả chan-doan.html lần 2 (phép 6–7)
POST ping kèm 60/200/600 KB đều đạt; dữ liệu `lgt.*` trên máy chỉ 1 KB ⇒ KHÔNG phải do cỡ gói. Còn lại: lỗi chỉ khi chạy trong trang baocaonoibo.io.vn (khung nhúng/Google Sites?) hoặc do riêng lệnh `acctCreate` (chạy lâu, ghi Sheet). Phiên 54c: `callApi` trả thêm `detail` (action | cỡ gói | origin | top/khung | thông điệp lỗi); màn vào cửa hiện detail trong ngoặc sau "mã: blocked". `sw.js` = dgt-v60. Việc tiếp: xem detail Gp chụp (nhất là `top`/`khung` và origin) + kết quả thử game trực tiếp ở github.io.
