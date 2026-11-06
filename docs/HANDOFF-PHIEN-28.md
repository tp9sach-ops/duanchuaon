# Bàn giao Phiên 28 (NPC che dù và tìm chỗ trú mưa)

Đọc PROMPT.md, HANDOFF.md, rồi docs/HANDOFF-PHIEN-26.md, docs/HANDOFF-PHIEN-27.md, rồi file này. HANDOFF.md đã trên 160 KB nên các mục Phiên 26, 27, 28 nằm riêng; phiên sau gộp cả ba vào HANDOFF.md/PROMPT.md mục 7.

## Đã làm
Trời mưa thì dân làng và NPC ngoài trời mở dù; mưa lớn thì dân làng đi tìm chỗ trú, hết mưa quay lại chỗ cũ. Mốc trước khi làm: `npm test` 389/389 đạt (đã chạy thật trên bản clone của main).
- **js/world/shelter.js (MỚI, logic thuần, có test):** `SHELTERS` (9 chỗ trú: gốc đa x2, đình nghỉ chân, miếu, 5 cửa hàng), `COVERED_IDS` (NPC đã có mái: truru, nvdidong, nvdienmay, nvkimhoan, cohoa, ongcu), ngưỡng, `clearLine`, `planShelter`, `newWalker`, `stepWalker`.
- **Quy tắc:** mưa nhỏ trở lên (level ≥ 1) mở dù. Người lớn đi trú khi mưa lớn (level 3). Trẻ em (scale < 1) đi trú từ mưa vừa (level 2), ưu tiên cửa hàng; vào cửa hàng thì ẩn (`k.hidden`) cho tới khi mưa chỉ còn nhỏ (level ≤ 1) hoặc tạnh. Ngưỡng vào và ra khác nhau để không chập chờn. Đi trú nhanh x1,5; mưa thì đi tuần nhanh x1,2.
- **Đường đi:** `planShelter` đi dọc đường tuần tới điểm rẽ P rồi rẽ thẳng vào chỗ trú; chọn tổng quãng ngắn nhất (≤ 90 m), mọi đoạn qua `clearLine` (lấy mẫu 0,25 m, lề 0,25 m, không sượt vật cản). Hết mưa đi ngược đúng đường về điểm rời đi rồi tuần tiếp. Đổi ý giữa đường (tạnh khi đang đi trú, lại mưa lớn khi đang về) đều xử lý.
- **Phản ứng lệch nhau:** mỗi người trễ `REACT_BASE + i * REACT_STEP` (0,8 s + 0,9 s mỗi người) mới đi trú, vì lập đường tốn 2 đến 100 ms mỗi người (đo trên Node, máy yếu chậm hơn); không tìm được chỗ trú thì thử lại sau `RETRY` = 6 s (không tính lại mỗi khung).
- **js/scene/npc.js (ghi đè):** thêm cây dù (tán nón + cán, 5 màu, hình học và vật liệu dùng chung), mở/thu mượt ~0,3 s; NPC đứng yên không thuộc `COVERED_IDS` mở dù khi mưa; dân đi lại dùng `stepWalker`, thu dù khi đứng dưới chỗ trú, ẩn cả nhân vật khi `k.hidden`. Cấp mưa lấy từ `LGT.weather.level` (không phải sửa index.js).
- **tests/shelter.test.mjs (MỚI, 14 test):** ngưỡng, chỗ trú không bị chặn và đi tới được từ cổng, mọi điểm trên đường của 7 dân làng đều có chỗ trú, ưu tiên cửa hàng cho trẻ em, độ trễ phản ứng, đổi ý giữa đường, mô phỏng 10 phút mưa đổi liên tục cho cả 7 người (không ai bước vào vật cản). Thêm vào package.json. sw.js VERSION = dgt-v22.
- Test bắt được 1 lỗi thật trong lúc làm: đường vào Điện Máy sượt qua nhân viên đứng cửa; đã sửa bằng lề 0,25 m trong `clearLine`.

## Kiểm thử
`npm test` toàn bộ chạy trên bản clone (xem số cuối báo cáo phiên). Chưa mở trình duyệt thật nên CHƯA nhìn bằng mắt: dù có nằm đúng trên đầu không, tán có đè nhãn tên không, trẻ em vào cửa hàng có tự nhiên không.

## Chưa làm / rủi ro
- Dù và dáng cầm là ước lượng theo kích thước avatar (cán ở tay phải x = 0,34, tán tâm cao 1,78); cần nhìn bằng mắt và chỉnh.
- Chỗ trú ở cửa hàng chỉ là điểm trên sân trước (chưa kiểm có mái hiên thật trong cảnh 3D); trẻ em "vào nhà" bằng cách ẩn.
- Chưa làm: NPC trong chùa (Tri khách, cư sĩ) vẫn đứng ngoài trời với dù, không tìm chỗ trú; dù trước cửa nhà dân và chùa; người chơi chưa có dù; âm thanh mưa trên dù.
- Sấm chớp vẫn ngẫu nhiên riêng từng máy (Phiên 27).

## Việc tiếp theo (Phiên 1 master prompt, còn lại)
(2) Đèn lồng chùa/biển hiệu cửa hàng theo giờ + đồng hồ nhỏ trên giao diện (`LGT.clock`, `LGT.phase`, `LGT.weather.name`); đèn đường và cửa sổ nhà ban đêm đã có từ Phiên 23. (3) Đom đóm bay tự nhiên hơn + trẻ cầm lồng đèn. (4) Âm thanh theo mùa (ve mùa hạ) và theo môi trường (rừng, thác). Sau đó Phiên 3 master prompt (chú tiểu, trụ trì, tưới cây bồ đề, thiền 3 phút). Làm TỪNG MỤC MỘT, xong báo rồi chờ đồng ý.

## Quy tắc bàn giao
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
