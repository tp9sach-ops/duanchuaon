# Phiên 235 (chat người chơi ảo) — MỤC 7 (người chơi ảo) · BƯỚC 1: lệnh `/nguoichoiao`, tên tự nhiên, tin "/" chỉ người gõ thấy

Yêu cầu ptg (2026-11-18): xem lại repo, việc đã làm thì bỏ qua; làm từng mục từng bước, xong đẩy GitHub rồi báo để nói "tiếp tục". Mục 7: người chơi ảo như người thật, tỷ thí được; vẫn làm nhiệm vụ, câu cá, xây nhà, luyện cấp, đánh quái, học chiêu, đi phó bản, lá bồ đề như người chơi; số lượng theo lệnh `/nguoichoiao` (mỗi lần gõ thêm 1 người); tên hệ thống tự đặt ngẫu nhiên, tự nhiên, không lộ là máy; tin bắt đầu bằng `/` người khác không thấy.

> Lưu ý đánh số: một phiên làm song song cũng đặt tên "Phiên 235" (mục 1, 4d — phó bản). File này có hậu tố `_NGUOICHOIAO` để không ghi đè `docs/PHIEN235.md` nếu phiên kia tạo.

## Đã làm (bước 1)
- `js/world/virtualPlayers.js` (logic thuần, có test): `makeName` (tên người Việt: họ+đệm+tên, họ+tên, đệm+tên, chỉ tên, "Chị Lan", biệt danh có/không năm sinh, kiểu tên đăng nhập không dấu; ≤ 20 ký tự, không trùng, không trùng tên người thật đang thấy); `pickLook` (áo trong bảng chọn của người chơi + đầu trọc/tóc búi); `parseSlash`/`isSlash`; `createWanderer` (đứng nghỉ → đi dạo trong vùng `home` → nghỉ; tránh vật cản; thỉnh thoảng nói một câu ngắn); `createVirtual` (quản lý danh sách, mỗi lần `add()` thêm đúng 1 người, tối đa `VP_CFG.max` = 12 TẠM, id bắt đầu `ao-`).
- `js/ui/virtualPlayers.js`: dựng người ảo bằng đúng `createAvatar` của người chơi (cùng dáng chibi/áo/tên nổi trên đầu), vòng cập nhật riêng; chỉ hiện ở sân chùa (sang võ đài/phó bản/luyện chiêu thì ẩn); `LGT.virtual.command(text)`.
- `js/ui/chat.js`: tin bắt đầu bằng `/` là LỆNH → chỉ hiện dòng "Hệ thống" trong khung chat của người gõ, KHÔNG gọi `room.say`, không có bong bóng, không gửi lên mạng. Nối: chat.js tự nạp `js/ui/virtualPlayers.js` (nạp lười) ở lần đầu có người gõ lệnh `/…` — không sửa `js/main.js`.
- `js/engines/room.js` `chatOk`: tin bắt đầu bằng `/` trả rỗng → mọi đường gửi (`client.say`) và nhận chữ đều bỏ tin "/" (chặn chắc chắn dù có đường gọi nào khác).
- Test: `tests/virtualplayers.test.mjs` (10 test, đăng ký trong package.json). `sw.js` → `dgt-v221`. `npm test` trên bản trước khi đẩy: 1479/1479 đạt (1469 cũ + 10 mới).

## Cách dùng
Mở khung trò chuyện (nút "Cộng đồng") → gõ `/nguoichoiao` → Gửi: thêm 1 người ảo đi dạo ở sân trước tam quan. Gõ nhiều lần = nhiều người (tối đa 12). `/nguoichoiao xoa` cho tất cả rời đi (thêm để thử cho tiện, ptg không yêu cầu — bỏ được).

## CHƯA làm / giới hạn thật (không giấu)
- **Người ảo mới CHỈ hiện ở máy người gõ lệnh.** Người online khác chưa thấy họ → chưa đạt luật "mọi thứ phải đồng bộ cho mọi người thấy" (PROMPT.md 6b). Đồng bộ là BƯỚC 2 (máy chủ nhà là máy người gõ lệnh, phát thêm các "người" `ao-…` vào phòng; cần chú ý giới hạn 30 người/phòng và luật Firebase).
- Người ảo mới chỉ đi dạo + chào. Chưa làm nhiệm vụ / câu cá / xây nhà / luyện cấp / đánh quái / học chiêu / phó bản / lá bồ đề, chưa tỷ thí được, chưa có công đức/cấp riêng.
- `gas/Room.gs` chưa chặn tin bắt đầu `/` ở phía máy chủ (client đã chặn). Chưa nhìn bằng mắt trên máy thật (môi trường AI không có WebGL): ptg gõ `/nguoichoiao` vài lần xem tên/dáng/đi lại.
- Số TẠM: tối đa 12 người, vùng dạo bán kính 11 m quanh (0, 50), tốc độ 1,5–2,5 m/s, nói 1 câu mỗi 45–140 giây.
- `PROMPT.md` mục 7 và `HANDOFF.md` CHƯA ghi dòng Phiên 235 này (hai file quá lớn để đẩy qua công cụ GitHub, giống Phiên 226): phiên sau thêm 1 dòng trỏ tới file này.

## VIỆC KẾ (chờ ptg nói "tiếp tục")
Bước 2: đồng bộ người ảo cho mọi người online thấy (phát qua `js/net/room.js`), rồi bước 3 cho họ làm việc như người chơi (bắt đầu bằng nhiệm vụ/luyện cấp + đánh quái bãi rừng bằng `js/world/farm.js`), bước 4 tỷ thí (`js/world/duel.js`), bước 5 câu cá/xây nhà/học chiêu/phó bản/lá bồ đề.
