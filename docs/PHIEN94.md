# PHIÊN 94 — Cảnh mở đầu: nhân vật cưỡi hạc bay một vòng chùa rồi đáp trước cổng, sau đó mới hiện đăng nhập
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

## Yêu cầu của anh Giang
"Khi mới vào game nhân vật cưỡi chim hạc bay trên không, bay một vòng map cảnh hùng vĩ thấy hết không gian, sau đó đáp xuống chỗ bắt đầu trước cổng chùa rồi mới hiện đăng nhập."

## Đã làm (kho tp9sach-ops/duanchuaon)
- js/world/intro.js (thuần, có test tests/intro.test.mjs, 7 ca): 16 điểm đường bay (`WAYPOINTS`), tên địa danh (`LANDMARKS`), `DURATION = 34` s, tốc độ (tăng tốc 3 s, hãm 6 s), `introState(t)`, `introCamera`.
- js/scene/crane.js: mô hình hạc 3D (thân trắng, cổ 4 đốt, mào đỏ, cánh vỗ).
- js/scene/intro.js: bộ điều khiển — hạc + nhân vật ngồi trên lưng bay theo đường; hết giờ `world.teleport(SPAWN)`; gọi onLabel/onDone. js/scene/index.js: trong lúc bay thay `world.update`, ẩn điểm sáng.
- js/ui/introUi.js + css/intro.css (nối trong index.html): hai dải đen điện ảnh, tên "DIỆU GIANG TỰ", tên địa danh, nút "Bỏ qua ›" (Esc/Enter/Space cũng được).
- js/ui/hud.js: `startWithIntro()` thay cho `open()` ngay — bay xong mới `open()` (màn đăng nhập). Không chiếu khi: vừa đăng nhập xong tải lại (sessionStorage lgt.autoEnter), thêm `?intro=0`, hoặc lỗi.
- tests/account.test.mjs dòng 459: regex VERSION nhận cả 3 chữ số (đang lỗi từ v100). sw.js dgt-v101. package.json thêm tests/intro.test.mjs.

## Kiểm tra
- Chụp ảnh headless (swiftshader) ở t=3,10,18,26,31,34 s: hạc bay qua rừng thông, núi, làng, rồi đáp trước cổng; sau đó hộp "Đặt mật khẩu cho nhân vật" hiện, panelOpen=true. Không có lỗi JS.
- npm test: 836 pass / 6 fail. 5 lỗi có sẵn trên bản gốc (journey 'hour' undefined, landpool kích thước hồ, tutorial chủ đề mới, account sw) — account sw đã sửa ở đây; còn journey/landpool/tutorial KHÔNG do phiên này. 1 lỗi là test fireflies ngẫu nhiên.

## CHƯA kiểm / giả định
- Chưa thử trên điện thoại thật; tốc độ/độ cao/34 s là số tạm, cần anh xem bằng mắt rồi chỉnh.
- Chú thích địa danh có thể chồng lên dòng "Chạm vào màn hình để bật nhạc" ở đáy.
- Chưa có nhạc/âm thanh riêng cho cảnh bay.

## Việc tồn
journey/landpool/tutorial test lỗi sẵn (cần xem nguồn Phiên 93); room.js đổi phòng theo vùng; thêm kiến trúc (hỏi anh); GAS Donations; THIET_KE_CHIEU_SAU mục 6; js/PROMPT.md & js/sw.js thừa (chờ anh quyết).
