# Phiên 213 — Toàn màn hình kiểu Poki

Mục tiêu: bấm vào game thì thanh địa chỉ/công cụ Chrome biến mất, thanh Chrome đổi màu theo cảnh.

## Đã làm
- `js/ui/fullscreen.js` (mới): Fullscreen API (`navigationUI:'hide'`), `theme-color` động (đêm `#06070d`, ngày `#27456b`, toàn màn hình `#000`), nút ⛶ (vào/thoát) và ↻ (khoá xoay ngang, tuỳ chọn, mặc định tắt), gợi ý "Thêm vào MH chính" cho iPhone.
- Tự vào toàn màn hình khi bấm **Vào chùa** (`#en-go`) vì đó là một lần chạm của người dùng. Thoát thủ công thì phiên đó không ép lại.
- `css/fullscreen.css` (mới): kiểu nút + `overscroll-behavior:none` (chặn kéo-để-tải-lại).
- `js/main.js`: nạp và gọi `initFullscreen()` ngay sau `initViewport()`.
- `manifest.webmanifest`: thêm `display_override: ["fullscreen","standalone"]` → cài lên màn hình chính sẽ mở không còn thanh nào.

## Lưu ý
- Fullscreen API bắt buộc có cử chỉ chạm của người dùng, không tự bật lúc tải trang.
- iPhone Safari không hỗ trợ Fullscreen API cho trang web: chỉ có cách PWA (Chia sẻ → Thêm vào MH chính).
- Cài PWA từ trước thì phải gỡ rồi cài lại để nhận manifest mới.
- Nhúng game trong `<iframe>` thì thẻ iframe của trang cha phải có `allow="fullscreen"`.
- Muốn đổi màu thanh Chrome ở chỗ khác: `window.dgtSetThemeColor('#a0f5e0')`.
