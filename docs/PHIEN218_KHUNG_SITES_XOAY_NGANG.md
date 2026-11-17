# Phiên 218 — Khung Google Sites, hình ảnh điện thoại, tự xoay ngang

ptg báo (mở trong khung Google Sites): (1) chưa thấy thanh Chrome đổi màu, chưa toàn màn hình; (2) hình ảnh còn rất xấu trên điện thoại; (3) mặc định vào game bằng điện thoại thì tự xoay ngang.

## 1. Khung Google Sites (iframe)
Giới hạn của trình duyệt, không sửa được bằng code trong game: `theme-color` trong trang NHÚNG không đổi thanh Chrome (chỉ trang cha/gốc có tác dụng); Fullscreen API trong khung cần thẻ iframe có `allow="fullscreen"` (Google Sites không thêm khi nhúng bằng địa chỉ).
`js/ui/fullscreen.js`: phát hiện `embedded` (window.self !== window.top) và `document.fullscreenEnabled === false` → nút đổi thành nhãn **"↗ Toàn màn hình"**, bấm sẽ mở game ở TAB MỚI (trang gốc) — ở đó theme-color, toàn màn hình, khoá xoay ngang đều chạy. Không tự mở tab khi bấm "Vào chùa" (tránh cửa sổ bật lên bất ngờ). Nếu bị chặn popup: hiện địa chỉ để mở trực tiếp.

## 2. Hình ảnh điện thoại
`js/scene/index.js`: (a) `antialias: !coarse` → `antialias: true`; (b) `EffectComposer` nay nhận render target đa mẫu `samples` 2 (điện thoại) / 4 (máy tính) — TRƯỚC ĐÓ khi bật bloom (mặc định) cảnh vẽ vào target KHÔNG khử răng cưa nên viền gấp khúc nhìn rất xấu. Chỉ bật khi có WebGL2 + `EXT_color_buffer_float`, không đủ thì giữ đúng như cũ (không gây màn hình đen). Kết hợp Phiên 217 (pixelRatio 1,5).
CHƯA BIẾT nếu ptg còn thấy xấu ở chỗ khác (texture, mô hình, bóng): cần ảnh chụp màn hình để biết chỗ nào.

## 3. Tự xoay ngang trên điện thoại
- `fullscreen.js`: `wantLandscape()` mặc định BẬT cho điện thoại (cảm ứng + cạnh ngắn ≤ 600); người chơi tắt bằng nút ↻ (nhớ `dgt.lockLand`). Bấm "Vào chùa" → toàn màn hình + khoá ngang. Mở bằng app PWA thì khoá ngang ngay.
- `manifest.webmanifest`: thêm `"orientation": "landscape"` (app đã cài luôn ngang; cài lại app cũ mới nhận).
- Không khoá được (iPhone Safari, trong khung, chưa toàn màn hình): hiện gợi ý "↻ Xoay ngang màn hình để chơi đẹp hơn" (`#dgt-rot-tip`) khi đang cầm dọc, mờ dần ~9 giây, không chặn chạm, tắt hẳn bằng ✕.
- `sw.js` `dgt-v205`.

## CHƯA KIỂM (cần thử điện thoại thật)
- Không chạy được `npm test` trong phiên này; không có test nào import `fullscreen.js`/`createScene`.
- MSAA trên điện thoại yếu có thể tăng tải; nếu giật, hạ `samples` xuống 0 ở dòng `WebGLRenderTarget` trong `scene/index.js` (governor vẫn hạ pixelRatio/bloom).
- Google Sites có thể chặn `window.open` nếu khung có sandbox không `allow-popups`.
- Việc kế: nút nhỏ, joystick, nút/bảng che màn hình (xem Phiên 217).
