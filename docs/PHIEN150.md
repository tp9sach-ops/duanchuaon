# Phiên 150 — Mục 1 (danh sách 8 mục ngày 14/11): bồ đoàn + bỏ tên chiêu độc/sát + khu luyện chiêu

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh main). Chỉ xem chỗ cần sửa, không đọc hết repo, việc đã làm thì bỏ qua, cập nhật không được gây lỗi. Làm TUẦN TỰ từng mục, xong mục nào đẩy GitHub rồi báo, chờ "tiếp tục".

## Danh sách 8 mục ptg giao (14/11)
1. Sửa lỗi ngồi bồ đoàn Hỏa; bỏ tên chiêu có chữ độc/sát/giết; ngồi bồ đoàn → sang khu luyện tập thử TẤT CẢ chiêu trước khi chọn → XONG code (phiên này), CHỜ ptg thử máy thật.
2. Kỹ năng nhảy: bấm đi tới thì nhảy lên phía trước, tiếp đất xong lướt thêm một đoạn theo hướng đi để né/tiếp cận → CHƯA LÀM.
3. Vũ khí khi không chiến đấu: thu gọn, nằm sau lưng có dây đeo, vẫn phát sáng → CHƯA LÀM.
4. Nón bán ở điện máy: 400 lá bồ đề, mang vào thì nhân vật đội nón, +3% giáp → CHƯA LÀM. (File mẫu ptg đã upload: japanese_hat_jingasa.glb, nón Jingasa.)
5. Sửa lỗi hiển thị túi hồ lô (ảnh chụp: tab bị cắt, thẻ vật phẩm chữ rớt từng chữ "T h.", "G ậ", thanh Sinh Lực HUD đè lên bảng, vùng nội dung trống bên phải) → CHƯA LÀM.
6. Ngọc hồi máu → "Bánh sầu riêng 3 vị"; Ngọc dịch chuyển → "Bánh sầu riêng pho mai than tre"; cả hai mua ở tiệm bánh sầu riêng 9 Sạch → CHƯA LÀM.
7. Phó bản đầy đủ (NPC → khu riêng, quái hồi sinh mạnh/to hơn theo lượt, 9 lượt → boss chính, rơi nhiều đồ, phó bản đã chinh phục mạnh hơn khi quay lại) → CHƯA LÀM, tiếp từ bước 4d docs/PHIEN140.md (xem docs/PHIEN139.md, js/world/zoneDungeon.js, js/world/dungeon.js, js/ui/dungeonZones.js, js/ui/dungeonPanel.js).
8. Linh thú từ mảnh ghép boss (3 mảnh → ghép → túi hồ lô → gọi/cưỡi/chiến đấu; kỹ năng boss tác động người chơi và quái) → CHƯA LÀM.

## Đã làm ở mục 1 (5 commit trên main, sw.js = dgt-v144)
### a) Đổi tên chiêu (js/data/combatSkills.js — chỉ đổi chữ, id/fx giữ nguyên)
- U Minh Độc Tiễn → U Minh Linh Tiễn; Vạn Độc Quy Tâm → Vạn Hương Quy Tâm; Độc Vụ Lan Tỏa → Mê Vụ Lan Tỏa; Lạc Diệp Truy Hồn → Lạc Diệp Truy Phong.
- Vai trò Pháp Môn: U Minh Môn → "Khói mê, hiệu ứng theo thời gian"; Ẩn Thân Môn → "Ẩn thân, bùng nổ".
- Khóa fx nội bộ (doc, suongDoc, docLan) không đổi; chữ hiển thị ở khu luyện lấy từ FX_TXT (js/world/luyenChieu.js). Test canh: tests/luyenchieu.test.mjs. Docs cũ (GDD_v2.md, PHIEN110/111.md) còn tên cũ, không sửa.

### b) Bồ đoàn (js/ui/khaiNgo.js)
- Dưới cấp 10 vẫn ngồi được: hiện bảng "Bồ đoàn Hệ X" với nút "Luyện tập chiêu", khóa Dùng thử/Chọn Hệ. Từ cấp 10: bảng cũ + nút "Luyện tập chiêu".
- initKhaiNgo/initHeSkill đã nối trong js/main.js (Phiên 147). Không tái hiện được lỗi thật trên trình duyệt; nếu bồ đoàn Hỏa (bd04) vẫn lỗi, cần ảnh chụp/Console (F12).

### c) Khu luyện chiêu (zone `luyen-chieu`, giống zone phó bản)
- js/world/zoneLuyen.js (thuần): tâm (640,0) bán kính 14, temp + viaNpc, 3 mộc nhân, điểm về `tu-luyen-<he>` (đứng sau bồ đoàn). registerLuyen gọi ở js/world/zoneRuntime.js.
- js/world/luyenChieu.js (thuần): listForHe (6 chiêu/Hệ), describeSkill, createDemoRuntime (hồi chiêu ≤ 2,5 s, số mẫu 100 × heSo, không đụng chỉ số thật).
- js/scene/luyen.js: sàn, đèn lồng, mộc nhân rung/nháy, cổng về. js/ui/luyenChieu.js: bảng chiêu ở đáy màn hình, nút "Về bồ đoàn" ngồi lại để chọn Hệ. API LGT.luyenChieu.enter/leave. main.js nạp bằng import động.
- Sửa kèm: class hồi chiêu "cd" của js/ui/heSkill.js trùng `.cd{position:absolute}` của css/donate.css → đổi thành `hs-cd` (khu luyện dùng `lc-cd`).
- package.json thêm tests/luyenchieu.test.mjs. Kết quả npm test trước khi đẩy: 1103/1103.

## Lưu ý quy trình
- Môi trường AI KHÔNG đẩy git được (không có credential); dùng công cụ GitHub MCP `push_files` / `create_or_update_file` (cần đọc lại nguyên văn file rồi đẩy). Container có thể mất bản clone giữa phiên: clone lại từ GitHub nếu cần chạy npm test.
- HANDOFF.md (rất lớn) CHƯA thêm dòng trỏ tới file này; phiên sau nên thêm một dòng đầu file trỏ tới docs/PHIEN150.md.
- Chưa có: hiệu ứng riêng từng chiêu, chữ sát thương bay trên mộc nhân (đang là toast), kiểm bằng mắt 3D.

## Cách ptg thử
(1) Ngồi bồ đoàn Hỏa (thứ 4 từ trái, hàng sát bàn thờ, id bd04) dưới và từ cấp 10; (2) bấm "Luyện tập chiêu" → sang võ đường, thử 6 chiêu; (3) "Về bồ đoàn" có ngồi lại và chọn Hệ được.

## Prompt khởi động phiên mới
> Đọc PROMPT.md (mục 3, 5, 7), docs/PHIEN150.md. Chỉ xem chỗ cần sửa. Mục 1 xong (chờ ptg thử). Làm mục 2: bấm đi tới + nhảy → nhảy lên phía trước rồi lướt thêm một đoạn theo hướng di chuyển (xem js/world/skills.js Khinh Thân, js/world/world.js, js/ui/dock.js). npm test xanh, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN151.md và chép nguyên văn quy tắc ptg.
