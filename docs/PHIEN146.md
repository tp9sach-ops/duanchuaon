# Phiên 146 — Mục 2 (danh sách 14/11): Túi hồ lô

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (5 mục, làm tuần tự, xong mục nào đẩy GitHub rồi báo, chờ "tiếp tục")
1. Tự động đánh không dừng khi chuyển tab / hết máu → XONG (docs/PHIEN145.md).
2. Đổi "Túi đồ" thành "Túi hồ lô": giao diện như game mẫu (ảnh ptg gửi: thanh tab danh mục ở trên, thẻ vật phẩm có tên + hình tròn), hình nhân vật bên cạnh; tick xanh ở vật phẩm đang dùng và nhân vật trong túi mang đúng vật phẩm đó; hình vật phẩm đẹp, giống ngoài game → XONG phần chính (xem dưới).
3. Bồ đoàn Hỏa / Tu Vi hiển thị / chuyển tab không đứng → Phiên 143 báo xong nhưng ptg báo chưa được: KIỂM LẠI.
4. Phó bản (NPC → khu riêng, quái hồi sinh mạnh/to hơn, 9 lượt → boss, rơi đồ, phó bản đã chinh phục mạnh hơn) → từ bước 4d docs/PHIEN140.md.
5. Mảnh ghép boss → Túi hồ lô → 3 mảnh ghép thành linh thú gọi/cưỡi/chiến đấu, kỹ năng boss tương tác.

## Mục 2 — đã làm
- `js/ui/bag.js` VIẾT LẠI: tiêu đề "Túi hồ lô của bạn"; tab (Tất cả · Đang cầm · Tiền · Câu cá · Nội thất · Khác); thẻ vật phẩm kem, tên ở trên, hình tròn ở giữa, số lượng góc dưới; lưới 3 cột. CSS tự chèn từ bag.js (không sửa css/dock.css).
- Nhân vật 3D bên trái (WebGL riêng, tạo khi mở, hủy khi đóng): `createAvatar` với màu/tóc đọc từ `lgt.color`, `lgt.hair`; Thương → vào thế sẵn sàng, côn hiện trên tay; Gậy như ý → thay côn bằng `buildStaff()` (hai đầu chớp); Ván trượt → đứng trên ván khối. Đổi đồ cầm là nhân vật đổi theo ngay.
- Tick xanh: ô đang cầm (LGT.loadout.hold) và quả cầu câu cá "đang dùng" (nhận qua chữ "đang dùng" trong `mo` của bagSections).
- Ảnh Thương/Gậy/Ván: chụp từ mô hình 3D (côn mặc định, buildStaff, ván khối), nhớ lại một lần. Gậy chụp bằng bản khối (GLB nạp bất đồng bộ, không chờ).
- `js/world/dock.js`: nhãn nút "Túi đồ" → "Túi hồ lô" (2 chỗ), HINTS.tui đổi. Không đổi id `tui`, SLOT_OF, test.
- Không động tới: hudMenu.js, board.js (LGT.loadout.list/choose giữ nguyên), items.js.

## CHƯA kiểm / còn thiếu
- Chưa chạy `npm test`, chưa nhìn bằng mắt trên máy thật (phiên này chỉ sửa qua GitHub). Cần xem: khung nhân vật có hiện, côn/gậy đúng tay, ván đứng đúng chỗ, tick xanh, ô vừa 3 cột trên điện thoại.
- Còn chữ "Túi đồ" trong: toast của js/ui/items.js, js/ui/board.js, js/ui/loadout.js; có thể cả menu trong js/ui/hudMenu.js (chưa đọc). Đổi dần nếu ptg muốn.
- Quả cầu câu cá bấm vào chưa chọn dùng được (chỉ hiện tick); cần API chọn cầu của js/ui/fishing.js nếu muốn.
- Nhân vật xem trước chưa có râu/phụ kiện khác (world.js chỉ truyền màu, tóc).
- Dòng nhật ký Phiên 145/146 trong PROMPT.md mục 7 chưa thêm (file 74 KB).

## Việc kế
Mục 3: kiểm lại bồ đoàn Hỏa / Tu Vi (js/ui/khaiNgo.js, heSkill.js, hud.js #tuvi-chip, main.js). Rồi mục 4, mục 5.

## Prompt khởi động phiên mới
> Đọc docs/PHIEN146.md, docs/PHIEN145.md, docs/PHIEN143.md. Chỉ xem chỗ cần sửa. Mục 1, 2 xong. Làm mục 3 (kiểm lại bồ đoàn Hỏa + Tu Vi), từng bước nhỏ, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN147.md kèm prompt và chép nguyên văn quy tắc ptg ở đầu file này.
