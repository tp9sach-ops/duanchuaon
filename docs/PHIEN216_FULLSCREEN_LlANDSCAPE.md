# Phiên 216 — Toàn màn hình: sửa nút đè HUD (điện thoại dọc + ngang)

Yêu cầu ptg: áp dụng cách Poki (thanh Chrome đổi màu, bấm là toàn màn hình, PWA); xem lại repo, việc đã làm thì bỏ qua; giao diện điện thoại xoay ngang không mất nút, không vướng thanh công cụ trình duyệt.

## Đã có từ Phiên 213 (BỎ QUA, không làm lại)
- `<meta name="theme-color">` trong `index.html` + đổi động ngày/đêm/toàn màn hình (`js/ui/fullscreen.js`, `window.dgtSetThemeColor`).
- Fullscreen API (`navigationUI:'hide'`), tự vào khi bấm "Vào chùa" (`#en-go`), nút ⛶/✕, nút ↻ khoá xoay ngang (tuỳ chọn).
- PWA: `manifest.webmanifest` (`display:standalone` + `display_override:["fullscreen","standalone"]`, icon 192/512 + maskable), `sw.js`, `apple-mobile-web-app-*`, `viewport-fit=cover`.
- Khung nhìn thích ứng điện thoại ngang: `js/ui/viewport.js` + `css/responsive.css` (`data-short=true` khi cao ≤ 500), `css/mobilefix.css`, `css/compact.css`, dùng `--sai-*` (safe-area) và `--vv-bar`.

## Lỗi tìm thấy
`#dgt-fs` (nút ⛶/↻) đặt cứng `top:8px; right:8px; z-index:70` — đúng chỗ `.hm-tr` (hàng ví hạt sen/ngọc, `top:12px; right:12px`) của HUD → nút ⛶ che ô Ngọc, ở mọi kích cỡ (cả dọc lẫn ngang). Ngoài ra z-index 70 làm nút nổi lên trên cả bảng đang mở.

## Đã sửa
- `js/ui/fullscreen.js`: thêm `place()` đo hàng ví thật (`.hm-wallet` → `.hm-icons` → `.hm-tr`) rồi đặt cụm nút NGAY BÊN TRÁI, cùng hàng (ghi `--fs-r`, `--fs-t`). Gọi lại khi resize / xoay / `lgt:viewport` / đổi toàn màn hình / mỗi giây (HUD dựng muộn, số sen đổi độ rộng). Chưa có HUD (màn vào cửa) thì giữ góc phải-trên mặc định. Trả thêm `place` từ `initFullscreen()`.
- `css/fullscreen.css`: dùng `--fs-r/--fs-t`; `z-index` 70 → 30; ẩn khi `.panel-open` / `.edit-mode`; nút 36px (40px cảm ứng, 34px khi cao ≤ 500).
- `sw.js`: VERSION `dgt-v203`.

## CHƯA KIỂM (cần ptg thử điện thoại thật)
- Chưa nhìn bằng mắt: nút ⛶ nằm trái hàng ví có chạm thẻ người chơi (`.chip-me`) ở màn hẹp dọc (≤ 360px, Z Fold bìa ngoài) không. Nếu chạm: dời nút xuống dưới hàng ví hoặc gộp vào `.hm-icons`.
- Android: bấm ⛶ → thanh Chrome biến mất, thanh trạng thái đen; bật ↻ rồi xoay ngang.
- iPhone: không có Fullscreen API → chỉ PWA (Chia sẻ → Thêm vào MH chính). Cài PWA cũ phải gỡ rồi cài lại để nhận manifest mới.
- Không chạy được `npm test` trong phiên này (chỉ có công cụ GitHub); không có test nào import `fullscreen.js`.
