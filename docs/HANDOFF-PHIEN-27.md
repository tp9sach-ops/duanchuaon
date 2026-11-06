# Bàn giao Phiên 27 (thời tiết dùng chung theo đồng hồ thật)

Đọc PROMPT.md, HANDOFF.md, rồi docs/HANDOFF-PHIEN-26.md, rồi file này. HANDOFF.md đã trên 160 KB nên các mục Phiên 26 và 27 nằm riêng; phiên sau gộp cả hai vào HANDOFF.md/PROMPT.md mục 7.

## Đã làm
Thời tiết (mưa 3 cấp, sấm chớp) trước đây ngẫu nhiên riêng từng máy, nên hai người cùng vào thấy hai bầu trời khác nhau. Nay cấp mưa suy ra từ đồng hồ thật + mùa, nên mọi người chơi thấy CÙNG một cơn mưa (cùng cách giờ game dùng chung ở Phiên 26).
- js/world/weather.js: thêm `SLOT_SECONDS` (120 giây/ô), `slotOf`, `stepShared`, `sharedLevel(nowMs, season)`; `createWeather({ shared, nowMs })` và `update(dt, nowMs)`. Mặc định `shared: false` nên hành vi cũ (Phiên 25) giữ nguyên.
- Cách hoạt động: thời gian chia thành ô 120 giây (UTC). Cấp mưa của mỗi ô là kết quả của một chuỗi Markov chạy từ nhiều ô trước, mỗi ô dùng số ngẫu nhiên băm từ số ô. `stepShared` đơn điệu theo cấp nên chuỗi xuất phát từ cấp 0 và từ cấp 3 gặp nhau (coupling from the past); khi gặp nhau thì kết quả không phụ thuộc điểm xuất phát, nên không cần máy chủ và không cần lưu gì. Hai ô kề nhau chênh tối đa một cấp.
- Mở trang là vào đúng cơn mưa đang diễn ra (mặt đất ướt sẵn 0,6 nếu đang mưa); cấp mưa thực `cur` vẫn trôi từ từ (35 giây/cấp) tới cấp mục tiêu.
- `?troi=0..3` vẫn ép cố định một cấp; `?dem=1` vẫn không có thời tiết.
- Tỉ lệ thời gian ở mỗi cấp (mô phỏng 20000 ô): xuân quang 54% / nhỏ 29% / vừa 13% / lớn 4%; hạ 21 / 27 / 29 / 24; thu 61 / 27 / 9 / 3; đông 79 / 18 / 2 / 0,3.
- Test mới: tests/weatherShared.test.mjs (11 test), thêm vào package.json.

## Đã đẩy lên GitHub
Các thay đổi đã nằm trong repo (js/world/weather.js, js/scene/index.js 2 chỗ, package.json, sw.js dgt-v21, tests/weatherShared.test.mjs, file này).

## Kiểm thử
`npm test` toàn bộ: 389/389 đạt (378 trước + 11 mới), 0 lỗi.

## Chưa làm / rủi ro
- Chưa mở trình duyệt thật: chưa thấy hai cửa sổ cùng đồng bộ mưa (mới kiểm bằng test logic).
- Sấm chớp (thời điểm tia chớp, khoảng cách) vẫn ngẫu nhiên riêng từng máy; chỉ cấp mưa, gió, mưa rơi, độ ướt là chung.
- Các số xác suất và ô 120 giây là quy ước tạm (`SEASON_P`, `SLOT_SECONDS`), ptg xem bằng mắt rồi chỉnh. Mùa lấy theo tháng máy hoặc `?mua=`, hai máy khác tháng (lúc giao tháng) có thể khác mùa.
- Công cụ ghi file GitHub (push_files) bị 403; đẩy được bằng add_repo quyền push rồi git clone/push.
- Phiên 26 còn nghi vấn: lỗi hai người không gặp nhau chưa xác nhận bằng log thật; cầu nối Apps Script chưa thử hai người thật.

## Việc tiếp theo (Phiên 1 master prompt)
(1) NPC/dân làng mở dù hoặc mặc áo mưa, tìm chỗ trú; dù trước cửa nhà dân và chùa; trẻ em không ra ngoài khi giông lớn. (2) Đèn lồng chùa/biển hiệu cửa hàng theo giờ + đồng hồ nhỏ trên giao diện (`LGT.clock`, `LGT.phase`, `LGT.weather.name`). (3) Đom đóm bay tự nhiên hơn + trẻ cầm lồng đèn. (4) Âm thanh theo mùa (ve mùa hạ) và theo môi trường (rừng, thác). Lưu ý: đèn đường và cửa sổ nhà ban đêm đã làm ở Phiên 23. Sau đó Phiên 3 master prompt (chú tiểu, trụ trì, tưới cây bồ đề, thiền 3 phút).

## Quy tắc bàn giao
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
