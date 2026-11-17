# Phiên 219 (2026-11-17) — nút toàn màn hình bị che, xoay ngang điện thoại, đồ họa điện thoại

## Yêu cầu của Gp
1. Mở trong khung Google Sites: chưa thấy thanh Chrome đổi màu, chưa thấy toàn màn hình.
2. Hình ảnh còn xấu trên điện thoại.
3. Vào game bằng điện thoại thì tự hiển thị xoay ngang.
4. Giao diện điện thoại nằm ngang: không mất nút, không vướng, không bị thanh công cụ trình duyệt ảnh hưởng.

## Đã có từ trước (bỏ qua, KHÔNG làm lại)
`js/ui/fullscreen.js` + `css/fullscreen.css` (Phiên 213/216/218): theme-color động, Fullscreen API, khoá xoay ngang, nút ↗ mở tab mới khi nhúng khung, manifest `display_override: fullscreen` + `orientation: landscape`, MSAA cho composer.

## Nguyên nhân thật (đo bằng Chromium thử, khung nhúng chéo-nguồn 844×390)
- Nút nổi `#dgt-fs` có `z-index:30` nhưng lớp phim mở đầu `.intro` là 55 và màn "Vào chùa" `.enter` là 60 → nút bị CHE khi mở game, nên trong Google Sites người chơi không thấy nút toàn màn hình.
- Điện thoại ngang: nút Giao lưu (`.dl-chip`) và nút âm thanh (`.sound`) đè lên cần đi `#joy`; nhãn "↗ Toàn màn hình" rộng 131px đè thẻ "Việc kế tiếp".
- Điện thoại bắt đầu ở bậc chất lượng 1 (pixelRatio ≤ 1,5) nên hình mờ.

## Đã sửa
- `css/fullscreen.css`: `#dgt-fs` z-index 70 (trên .intro/.enter); trong thế giới game nút ↗ chỉ còn biểu tượng (`.fs-tx` ẩn khi không còn `body.entering`); thẻ "Xoay ngang" lớn không tự mờ; kiểu `.en-fs`.
- `js/ui/fullscreen.js`: nút "Toàn màn hình / Mở game toàn màn hình (tab mới)" ngay trong màn "Vào chùa" (`#dgt-en-fs`, dựng bằng MutationObserver); điện thoại: lần CHẠM đầu tiên bất kỳ đâu tự vào toàn màn hình + khoá xoay ngang (không làm khi đã toàn màn hình/app, đã thoát thủ công, khung bị chặn); thẻ xoay ngang có nút "Chơi dọc".
- `js/ui/hudFit.js` (legacyFit): nút Giao lưu không đặt xuống dưới mép trên của cần đi, chuyển sang bên phải hàng +/−/⟲.
- `css/mobilefix.css` mục 7–8: nút âm thanh dời sang phải cần đi khi ngang-thấp; lời mời bật nhạc ở màn vào cửa thu nhỏ, xuống góc trái-dưới (không che tiêu đề thẻ).
- `js/scene/perfLogic.js`: điện thoại bắt đầu ở bậc 0 (pixelRatio ≤ 2), KEY → `lgt.perf3` (bỏ bậc thấp đã lưu); máy yếu vẫn tự hạ nhờ bộ đo FPS. `tests/perf.test.mjs` cập nhật. `sw.js` = `dgt-v206`.

## GIỚI HẠN KHÔNG VƯỢT ĐƯỢC (đã nói với Gp)
Trang nhúng trong Google Sites: **theme-color của trang cha không đổi được từ khung con** (trình duyệt chỉ đọc thẻ của trang cấp cao nhất). Toàn màn hình trong khung chỉ chạy nếu khung có `allow="fullscreen"`; Google Sites thường không cho → nút mở TAB MỚI (trang gốc) là cách duy nhất có đủ: đổi màu thanh Chrome, toàn màn hình, khoá xoay ngang. iPhone Safari không có Fullscreen API: chỉ "Thêm vào MH chính".

## Kiểm
`npm test` 1379/1379. Chromium thử (swiftshader, ?perf=5): khung nhúng 844×390 và 667×375 ngang — không còn chồng nút (đo bằng getBoundingClientRect), nút ↗ thấy được ở màn mở đầu/vào cửa; 390×844 dọc — thẻ xoay ngang hiện. CHƯA thử trên điện thoại thật (Gp cần bấm thử: lần chạm đầu có vào toàn màn hình + xoay ngang không; hình có nét hơn không và có giật không).

## VIỆC KẾ
- Gp thử trên điện thoại thật, báo: FPS sau khi vào chùa 30 giây (bộ đo có hạ bậc không), nút còn đè ở máy nào.
- Nếu muốn toàn màn hình ngay trong Google Sites: trang cha phải cho `allow="fullscreen"` (Google Sites "Nhúng mã" cho tự viết iframe; "Nhúng URL" thì không chỉnh được) — hoặc đặt liên kết/nút "Mở toàn màn hình" trên trang Sites trỏ tới `https://tp9sach-ops.github.io/duanchuaon/` (mở tab mới).
- Bước tiếp theo nếu cần: Gp nói "tiếp tục" → kiểm tra thêm máy 360×640 và tai thỏ (safe-area).
