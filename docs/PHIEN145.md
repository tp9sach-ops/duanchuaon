# Phiên 145 — Mục 1 (danh sách 14/11): Tự động đánh không dừng khi chuyển tab / hết máu

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (5 mục, làm tuần tự, xong mục nào đẩy GitHub rồi báo, chờ "tiếp tục")
1. Tự động đánh vẫn chạy khi tắt/chuyển tab, hết máu.
2. Đổi "Túi đồ" thành "Túi hồ lô": hiển thị dạng ô như ảnh, có hình nhân vật bên cạnh; tick xanh ở vật phẩm đang dùng, nhân vật trong túi mang vật phẩm đó; hình vật phẩm đẹp hơn, giống ngoài game.
3. Bồ đoàn Hỏa không ngồi được (cấp 10 gia nhập phái), Tu Vi hiển thị ở đâu, chuyển tab game không đứng.
4. Phó bản (NPC → khu riêng, quái hồi sinh mạnh/to hơn, 9 lượt → boss chính, rơi đồ, phó bản đã chinh phục mạnh hơn lần sau).
5. Mảnh ghép boss → Túi hồ lô → ghép (3 mảnh) → linh thú gọi/cưỡi/chiến đấu, kỹ năng boss tương tác.

## Mục 1 — hiện trạng và cách sửa
- Chuyển tab: ĐÃ làm từ Phiên 143 (`js/bgTick.js` + `js/tickWorker.js`; `farm.js`, `farmCombat.js` đăng ký vào bgTick). Không đổi gì thêm.
- Hết máu: nguyên nhân là `defeat()` trong `js/ui/farmCombat.js` gọi `toggleAuto()` rồi dịch chuyển về cổng chùa; và bước "3)" tự tắt auto khi Sinh Lực < `VITALS_CFG.autoStopFrac`.
- Sửa (CHỈ `js/ui/farmCombat.js`): khi Tự Động Hàng Yêu đang BẬT mà hết Sinh Lực → `vit.revive()` tại chỗ (đầy máu + bất tử `koGrace` giây), quái đang giận bị `calm`, auto chạy tiếp, toast tối đa 1 lần / 15 giây. Bỏ đoạn tự dừng khi Sinh Lực thấp. Đánh tay (auto tắt) giữ nguyên: về cổng chùa. Ngọc dịch chuyển vẫn hồi sinh tại chỗ như cũ (đi trước nhánh auto).
- Auto vẫn dừng khi: người chơi tắt, mở bảng (`LGT.panelOpen`), bị giữ/đổi chế độ khác `free`, vào nhà, có yêu quái hằng tháng, hết 60 phút/ngày.

## Quyết định tôi TỰ đặt — ptg duyệt/chỉnh
1. Chỉ áp "hết máu vẫn đánh" cho chế độ TỰ ĐỘNG; đánh tay vẫn về cổng chùa (để Ngọc dịch chuyển còn giá trị).
2. Không giới hạn số lần hồi sức khi auto (có bất tử ngắn sau mỗi lần). Nếu muốn giới hạn: thêm đếm trong `defeat()`.

## CHƯA kiểm / còn thiếu
- Chưa chạy `npm test` và chưa thử trình duyệt thật (phiên này không có máy chạy; sửa trực tiếp qua GitHub). File sửa là giao diện, không có test riêng; logic thuần `monsterAttack.js` không đổi.
- "Tắt tab" hẳn (đóng tab/trình duyệt) thì JavaScript dừng hẳn, không thể chạy tiếp; chỉ chuyển tab/thu nhỏ mới chạy nền được. Safari/iOS có thể đóng băng Worker.
- Vòng lặp khác chưa chuyển sang bgTick: `js/ui/yeuquai.js` (setInterval 50 ms).

## Việc kế
Mục 2: đổi tên Túi đồ → Túi hồ lô + giao diện ô có hình nhân vật (đọc `js/ui/bag.js`, `bagIcons.js`, `css/dock.css`), rồi mục 3 (kiểm lại bồ đoàn Hỏa/Tu Vi vì Phiên 143 báo xong nhưng ptg báo chưa được), mục 4 (từ bước 4d docs/PHIEN140.md), mục 5.

## Prompt khởi động phiên mới
> Đọc docs/PHIEN145.md, docs/PHIEN144.md, docs/PHIEN143.md. Chỉ xem chỗ cần sửa. Mục 1 xong. Làm mục 2 (Túi hồ lô), từng bước nhỏ, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN146.md kèm prompt và chép nguyên văn quy tắc ptg ở đầu file này.
