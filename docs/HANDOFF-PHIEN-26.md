# Bàn giao Phiên 26 (giờ game dùng chung + sửa đa người không gặp nhau)

Đọc PROMPT.md rồi HANDOFF.md, sau đó file này (HANDOFF.md đã 163 KB nên mục này nằm riêng; phiên sau gộp vào HANDOFF.md).

## Đã làm
1. Giờ game dùng chung: 24 phút thật = 24 giờ game. `sharedHour(nowMs)`, `usesSharedClock(search)` trong js/world/daycycle.js; js/scene/index.js đọc lại giờ từ đồng hồ thật (UTC) mỗi khung hình. `?gio=H` và `?gio=thuc` là chế độ thử riêng. `LGT.clockOffsetMs` để chỉnh lệch đồng hồ máy sau này.
2. Hai người vào không gặp nhau. Nguyên nhân (suy ra từ mã, chưa xác nhận bằng log thật): người ở Firebase và người rơi xuống Apps Script dự phòng ở hai kho dữ liệu riêng, và bị kẹt 10 phút mới thử lại.
   - js/net/transportManager.js: thử lại nơi ưu tiên sau 15 giây kể từ lúc rơi xuống dự phòng, thất bại thì gấp đôi (30 s, 60 s, tối đa 120 s); chờ kết nối 6 → 10 giây.
   - js/net/bridge.js (mới) + js/net/room.js: người ở Firebase báo vị trí lên Apps Script (id = uid Firebase, mỗi 4 giây) và gộp người của Apps Script vào danh sách, nên hai bên luôn thấy nhau. Tắt bằng `gasBridgeMs: 0` trong js/config.js. Lời nhắn chỉ đi qua Firebase.
3. sw.js lên dgt-v20; package.json thêm tests/bridge.test.mjs.

## Kiểm thử
npm test: 378 đạt, 0 lỗi (trước 371). Mới: tests/bridge.test.mjs (5 test), 2 test trong tests/daycycle.test.mjs.

## Chưa kiểm tra
- Chưa thử trên trình duyệt/điện thoại thật, chưa thử hai người thật cùng lúc.
- checkin mở "Góc tâm linh" qua https://www.baocaonoibo.io.vn/tâm-linh; chưa kiểm tra trang đó nhúng đúng địa chỉ game (https://tp9sach-ops.github.io/loinhuan.github.io/). Địa chỉ .../loinhuan/ trong checkin là app Lợi nhuận, không phải chùa.
- Khung lồng nhau có thể chặn tải SDK Firebase; cầu nối đã che lỗi này nhưng cần đo thật.
- Thời tiết vẫn ngẫu nhiên theo từng máy.

## Việc tiếp theo
(1) Gộp mục này vào HANDOFF.md/PROMPT.md. (2) Đồng bộ thời tiết theo đồng hồ chung. (3) Phiên 1 master prompt: đèn nhà ban đêm, đom đóm, nhạc nền và âm thanh theo môi trường. Thay đổi gửi dạng vá tìm-và-thay; chạy npm test và ghi số thực tế.
