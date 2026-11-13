# Phiên 137 — Mục 1: Giao lưu võ thuật + Võ đài (xem docs/ROADMAP-6-MUC.md)

## Đã làm
- `js/world/duel.js` (logic thuần, có test): mã hoá gói tin chỉ chữ a–z (đi chung kênh chat, qua bộ lọc chatOk), bộ máy trận, 4 chiêu, kết quả.
  Mỗi bên tự tính phần MÌNH bị đánh (né / đỡ / trúng) rồi báo người đánh. Sinh lực cố định 1000 mỗi người (công bằng, không phụ thuộc cấp/hạt sen). 90 giây; hết giờ so sinh lực.
- Chiêu: J Đánh thường · K Chém khí (né ngang được) · L Thiết đầu công (lao 7 m, né sang bên) · U Hộ thân (đỡ −70%; canh đúng ≤0,45 s trước khi đòn tới = đỡ hoàn hảo, phản 30 sát thương). Spam một chiêu: yếu dần 15%/lần (tối đa −45%).
- `js/world/zoneVoDai.js` + `js/scene/voDai.js`: zone `vo-dai` (sàn tròn r 13,2 m tại x≈580), cổng ở sân chùa (18, 13) và cổng về chùa; ai cũng vào tập một mình được.
- `js/ui/duel.js`: nút "Giao lưu" (bên trái màn hình) → danh sách người gần → Mời → họ Chấp nhận → cả hai vào Võ đài → đếm 3 giây → đánh → bảng kết quả (Ở lại / Về chùa). Rời võ đài giữa trận = bỏ cuộc.
- `js/net/roomClient.js`: hàng đợi gói tin (`signal`), lọc gói khỏi bong bóng chat, `xform` đổi vị trí đối thủ. `js/net/room.js`: vị trí "mượn" trong khung ±200 khi ở võ đài (NET 170,−170), `LGT.room.signal/onSignal/selfId`, nạp `ui/duel.js`. `js/net/transportManager.js`: lộ `transport` để lấy uid.
- Gói tin giao lưu gửi nhanh hơn chat thường (chatGapMs hạ còn 150 ms chỉ trong trận, trả lại sau trận).

## CHƯA làm / cần thử trên máy thật
- Chưa thử bằng hai máy thật và chưa nhìn bằng mắt (môi trường AI không có WebGL). Cần xem: sàn võ đài, vòng báo hiệu đỏ, vị trí nút "Giao lưu" có bị che không.
- Firebase gửi nhanh (~0,25 s); Apps Script dự phòng chậm (~2 s) nên đòn bị trễ.
- Firebase không tách phòng theo zone: người ở chùa sẽ thấy bóng người đang ở Võ đài ở một góc xa của khung ±200.
- "Gọi boss khi có boss": chưa làm — làm cùng mục 5 (linh thú).
- Mọi con số (sát thương, hồi chiêu, 1000 sinh lực) là TẠM, chờ ptg duyệt.
