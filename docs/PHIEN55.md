# PHIÊN 55 — ĐƯỜNG DỰ PHÒNG GỬI BẰNG FORM + KHUNG ẨN (khi fetch bị `blocked`) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

## Bối cảnh
Phiên 54: đặt mật khẩu/đăng nhập báo `blocked` (POST không đọc được phản hồi) dù `chan-doan.html` chạy ở github.io đạt cả phép 1–7. Chưa biết nguyên nhân chắc chắn (nghi: chạy trong khung nhúng của baocaonoibo.io.vn, hoặc riêng lệnh `acctCreate`). Sandbox AI không gọi được script.google.com (proxy trả 403) → KHÔNG kiểm máy chủ thật.

## Đã làm (Phiên 55) — phương án dự phòng đã nêu ở Phiên 54
- `js/api.js`: thêm `callViaFrame(body, env)` — tạo `<form method=POST target=iframe ẩn>` gửi trường `d` (JSON lệnh), `rid` (mã yêu cầu), `o` (origin trang game); nhận `postMessage` `{lgt: rid, res}` CHỈ từ `*.googleusercontent.com` / `script.google.com`; hết giờ → null; dọn form/iframe/bộ nghe. `callApi`: khi fetch báo `blocked` thì gửi lại bằng khung với CÙNG gói (cùng aid/sid → máy chủ nhận ra nếu yêu cầu đầu thực ra đã chạy xong); khung thành công thì các lần sau trong phiên đi thẳng đường khung (`useFrame`); khung hỏng thì vẫn trả `blocked` (detail thêm "khung: không phản hồi"). Không dùng khung khi `keepalive` (lúc đóng trang).
- `gas/Code.gs`: `doPost` tách thành `doPost` + `route_(req)` + `frame_(res, rid, origin)`. Nhánh text/plain giữ NGUYÊN hành vi (trả JSON). Nhánh form (có `parameter.d` và `parameter.rid`) trả trang HtmlService (`setXFrameOptionsMode(ALLOWALL)`) gọi `window.parent.parent.postMessage` (và `top` nếu khác) tới origin do trang game gửi (đúng định dạng, nếu không thì '*'); thoát `<` và U+2028/2029 chống chèn mã.
- `chan-doan.html`: thêm phép thử 8 (đường khung, gọi chính `callViaFrame`).
- `tests/frame.test.mjs` (9 test mới, trong `npm test`): DOM giả + chạy `Code.gs` thật trong vm. `sw.js` = `dgt-v61`.
- `npm test`: **647/647** (638 + 9), Node 22.

## Chưa kiểm được (cần Gp)
- Đường khung với Apps Script THẬT (HtmlService lồng khung; việc `window.parent.parent` đúng là trang game là theo hiểu biết về cấu trúc khung của Apps Script, chưa chạy thật). Phép thử 8 của `chan-doan.html` kiểm đúng điều này.
- Node 20 chưa chạy (CI chạy Node 20).

## VIỆC GP PHẢI LÀM
1. Mở dự án Apps Script → thay toàn bộ `Code.gs` bằng bản mới trong repo (`gas/Code.gs`) (hoặc dán đoạn TÌM/THAY BẰNG ở tin nhắn của Phiên 55). Deploy → Manage deployments → ✏️ → Version = **New version** (URL `/exec` giữ nguyên).
2. Mở https://tp9sach-ops.github.io/loinhuan.github.io/chan-doan.html → xem phép 8: ra `{"ok":true,"pong":true}` = đường khung chạy được. Chụp gửi lại.
3. Thử lại màn đặt mật khẩu (kể cả trên baocaonoibo.io.vn). Nếu vẫn lỗi, ảnh chụp có dòng "mã: blocked · …" kèm detail → gửi lại.
4. Lưu ý: workflow `.github/workflows/*.yml` chỉ chép `index.html, sw.js, css, js, assets…` vào `_site` — KHÔNG chép `chan-doan.html`. Nếu Pages đang dùng "GitHub Actions" thì trang chẩn đoán sẽ không có (Gp đã mở được ở Phiên 54 nên có thể Pages đang chạy từ nhánh). Nếu 404 → thêm `cp chan-doan.html _site/` vào bước "Gom file tĩnh".

## Việc tiếp (mỗi việc một lượt, chờ "tiếp tục")
1. Kết quả phép 8 + thử game → sửa tiếp nếu còn lỗi.
2. Đổi mật khẩu / quên mật khẩu (xem docs/PHIEN53.md mục VIỆC TIẾP).
3. Nối tên trong phòng đa người với tài khoản.
4. Các mục còn mở ở docs/KE_HOACH_TONG.md (3.x cần Gp thử/duyệt; 4.2 Khinh thân bậc 1; 5.3 bơi/lặn; 5.4 xếp hạng; 6.x).
