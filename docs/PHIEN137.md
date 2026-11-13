# Phiên 137 — Mục 1: Giao lưu võ thuật + Võ đài (xem docs/ROADMAP-6-MUC.md)

## ĐÃ LÀM (đã đẩy GitHub, test pass)
- `js/world/duel.js` (logic thuần): gói tin chỉ chữ a–z "#dg…" đi chung kênh chat; bộ máy trận; 4 chiêu; kết quả. Mỗi bên tự tính phần MÌNH bị đánh (né/đỡ/trúng) rồi báo người đánh. Sinh lực cố định 1000 mỗi người (không phụ thuộc cấp/hạt sen). 90 giây; hết giờ so sinh lực.
- Chiêu: J Đánh thường · K Chém khí (né ngang) · L Thiết đầu công (lao 7 m, né sang bên) · U Hộ thân (đỡ −70%; canh ≤0,45 s trước khi đòn tới = đỡ hoàn hảo, phản 30). Spam một chiêu yếu dần 15%/lần (tối đa −45%).
- `js/world/zoneVoDai.js` + `js/scene/voDai.js`: zone `vo-dai` (sàn tròn r 13,2 m tại x≈580), cổng ở sân chùa (18,13), cổng về chùa. Đăng ký trong `zoneRuntime.js` (initZones). Ai cũng đi vào tập một mình được bằng cổng.
- `js/ui/duel.js`: nút "Giao lưu" (trái màn hình, chỉ hiện ở chùa) → danh sách người trong 30 m → Mời → họ Chấp nhận/Từ chối → cả hai qua cổng (màn che) vào Võ đài (bên a/b) → chờ → đếm 3 giây → đánh → bảng kết quả (Ở lại tập / Về chùa). 4 nút chiêu giữa-dưới + phím J K L U; tự ngắm đối thủ; vòng/vệt báo hiệu đỏ khi đối thủ ra đòn. Rời Võ đài giữa trận = bỏ cuộc (đối thủ thắng).
- `js/net/room.js`: `LGT.room.signal/onSignal/selfId`; vị trí "mượn" khung ±200 (NET 170,−170) khi ở Võ đài; `xform` đổi vị trí đối thủ về toạ độ Võ đài; nạp `ui/duel.js`. `roomClient.js`: hàng đợi gói tin, lọc gói khỏi bong bóng chat. `transportManager.js`: lộ `transport`. `firebaseTransport.js`: gói "#dg" gửi cách nhau 120 ms (lời nhắn thường vẫn 2 giây).
- `tests/duel.test.mjs` 15 test pass; room/transport/bridge/zoneruntime/zones pass.

## CHƯA LÀM / CẦN THỬ MÁY THẬT
- Chưa thử hai máy thật, chưa nhìn bằng mắt (không có WebGL ở môi trường AI): xem sàn Võ đài, vòng báo hiệu, vị trí nút "Giao lưu" và hàng 4 nút chiêu có bị che bởi dock/joystick không.
- Đường dự phòng Apps Script chậm (~2 giây/gói, chatGap trong gas/Room.gs) nên đòn bị trễ; Firebase ~0,25 giây.
- Firebase không tách phòng theo zone: người ở chùa thấy bóng người ở Võ đài ở góc xa của khung ±200.
- "Gọi boss khi có boss": chưa làm — làm cùng mục 5 (linh thú).
- Con số (sát thương, hồi chiêu, 1000 sinh lực) là TẠM, chờ ptg duyệt.

## Mục kế: 2 (mở rộng map: sát vách núi, rừng đều có quái, càng sâu càng mạnh) — xem docs/ROADMAP-6-MUC.md
