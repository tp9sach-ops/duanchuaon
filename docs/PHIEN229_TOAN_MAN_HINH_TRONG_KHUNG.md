# Phiên 229 (2026-11-18) — toàn màn hình + xoay ngang NGAY TRONG KHUNG Checkin/Google Sites

## Yêu cầu của Gp
Game mở từ mục "Góc tâm linh" của trang Checkin (repo tp9sach-ops/checkin, nhúng vào Google Sites): (1) vẫn đổi được màu thanh Chrome; (2) toàn màn hình NGAY TRONG KHUNG, không mở tab/trang GitHub mới; (3) điện thoại vào game là tự ngang, không bắt bật xoay rồi xoay lại.

## Nguyên nhân
Mục tâm linh trỏ tới trang Google Sites (baocaonoibo.io.vn/tâm-linh) → Checkin chuyển CẢ TRANG (openTop) sang đó, game nằm trong khung lồng nhau, không có allow=fullscreen; lượt bấm của người dùng nằm ở trang cha nên game không tự toàn màn hình được.

## Đã sửa
Checkin (`index.html`):
- Mục `tl` mở game `https://tp9sach-ops.github.io/duanchuaon/` ngay trong iframe của Checkin (`allow=fullscreen`). `effUrl`: mục có cờ `fs` mà link đã lưu để trống / trỏ baocaonoibo.io.vn / sites.google.com thì dùng GAME_URL (link cũ lưu trên máy chủ không còn chặn).
- Điện thoại: bấm mục → `hostFsEnter(iframe)` đặt CẢ KHUNG game vào toàn màn hình + `screen.orientation.lock('landscape')` (cha có lượt bấm). Về trang chủ thì thoát + mở khoá. Nhận tin `dgt-host-fs` (query/enter/exit/lock) từ game, gửi `dgt-host-fs-state` cho game.
Game (`js/ui/fullscreen.js`): biến `hostFs` theo trạng thái cha; `fsOn()` = toàn màn hình của game HOẶC của cha; nút ⛶/✕, nút ở màn "Vào chùa", chạm đầu tiên, khoá xoay đều theo `fsOn()`; thoát/khoá nhờ cha qua postMessage. `sw.js` = dgt-v215.

## Giới hạn (không vượt được bằng mã)
- Màu thanh Chrome là của trang ngoài cùng (Google Sites): khung con KHÔNG đổi được. Khi toàn màn hình thì thanh Chrome biến mất nên không cần đổi màu.
- Toàn màn hình trong khung chỉ chạy nếu khung Google Sites chứa Checkin có allow=fullscreen. Nếu không: game hiện nút ↗ (mở tab mới) làm đường lui duy nhất.

## Kiểm
`npm test` 1450/1450. Chromium thử: Sites giả (allow=fullscreen) → Checkin → game: khung game vào toàn màn hình, orientation landscape, nút game đổi thành "✕ Thoát toàn màn hình". Sites giả KHÔNG allow: không lỗi, game hiện ↗ như cũ. CHƯA thử trên Google Sites thật/điện thoại thật.

## VIỆC KẾ
Gp thử trên Google Sites thật: mở mục tâm linh bằng điện thoại, báo có vào toàn màn hình + ngang không. Nếu không: sửa trang Sites nhúng Checkin bằng "Nhúng mã" với `<iframe src="LINK_CHECKIN" allow="fullscreen" allowfullscreen style="border:0;width:100%;height:100%"></iframe>`.
