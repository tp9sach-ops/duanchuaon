# PHIÊN 62 — Làm lại thao tác cho điện thoại: cụm nút góc phải-dưới + chỉ chỗ bấm + Túi đồ ngoài nhà — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu (ptg, 2026-11-08):** "Làm lại cho người chơi điện thoại dễ thao tác, dễ hiểu; các kỹ năng, thả cầu, thu cầu, thu phục cá… đều là nút ở góc phải bên dưới màn hình. Nhiệm vụ / kỹ năng mới có hướng dẫn bấm vào chỗ nào. Túi đồ hiển thị khi không ở trong nhà. Làm sao người không rành vẫn chơi được. Thêm hệ thống SỨC MẠNH (công đức + luyện thân cao → khiêng/ném vật nặng, ném người chơi). Thêm YÊU QUÁI mỗi tháng 1 lần (đá/nước/lửa…), dùng bộ kỹ năng chiến đấu bảo vệ dân làng, thu phục được thưởng lá bồ đề + cấp + sức mạnh." Phiên này CHỈ làm việc 1–3 (thao tác + chỉ chỗ + túi đồ); việc sức mạnh và yêu quái ở "VIỆC KẾ". Đã `git pull` Phiên 58–61 của các phiên khác (chương nhiệm vụ, Đại Phật, rừng thông) — không xung đột.

## Vì sao điện thoại rối (đã đọc mã)
Góc phải-dưới đã có lưới 3×2 nút Lạy/Thiền/Tụng kinh…; nút Nhảy (`#jump-btn`) bị đặt CHỒNG lên lưới đó; chip "Khinh thân" ở góc trên; nút "Câu cá" nổi giữa màn hình; bảng câu cá che gần hết màn hình khi đang câu; Túi đồ ngoài nhà chỉ báo "hãy vào nhà".

## ĐÃ LÀM
- `js/world/dock.js` (MỚI, logic thuần): `dockButtons(ctx)` (nút theo hoàn cảnh, xếp từ dưới lên), `pickHint`/`loadSeen`/`HINTS` (chỉ chỗ bấm), `bagSections` (nội dung Túi đồ).
- `js/ui/dock.js` (MỚI): cụm nút tròn to (58/76 px) **trên** lưới nút cũ, góc phải-dưới: **Bấm!** (đang câu; sáng khi hoa sen nở) · **Thả cầu / Mua cầu / Sửa cầu** (đứng sát nước) · **Thu cá + Phóng sinh** (câu được) · **Nhảy** · **Kỹ năng** (✦ sáng khi đủ điều kiện luyện) · **Túi đồ**. Nút Nhảy/Bấm! bắt `pointerdown` (không trễ). Dòng chữ trạng thái câu cá hiện ngay trên nút. Ngồi/thiền/lạy hoặc đang mở bảng → cụm ẩn.
- **Chỉ chỗ bấm:** bong bóng vàng có mũi tên cạnh nút + nút nhấp nháy, hiện MỘT LẦN cho từng nút (nhớ `localStorage['lgt.dockhint']`; bấm nút đó là hết nhắc). Ưu tiên: Bấm! › Thả cầu › Thu cá › Nhảy › Kỹ năng (chỉ khi luyện được) › Túi đồ.
- `js/ui/fishing.js`: lượt câu chạy cả khi bảng ĐÓNG; đóng bảng không hủy lượt; thêm `LGT.fishing.cast/tap/keep/release/status`; câu xong mà bảng đóng thì hiện toast kết quả; chưa có cầu / cầu nứt → mở tab "Quả cầu" kèm lời nhắc; bỏ nút nổi "Câu cá" giữa màn hình.
- `js/ui/skill.js`: `LGT.skill.canTrain`. CSS ẩn `#jump-btn` và `#kt-chip` cũ khi cụm mới có mặt (`body.has-dock`).
- `js/ui/bag.js` (MỚI) + `hudMenu.js`: bấm Túi đồ khi **không ở trong nhà** → bảng xem đồ (hạt sen, lá, quả cầu + độ bền, ao cá, nội thất đã mua/đặt, Khinh thân, nhà); trong nhà vẫn mở bảng sửa nhà cũ.
- `css/dock.css` (MỚI, đã link trong `index.html`), `tests/dock.test.mjs` (7 test, trong `npm test`), `sw.js` = `dgt-v67`. `npm test`: **669/669** (Node 22).

## CHƯA KIỂM (cần ptg xem trên điện thoại thật)
- Vị trí cụm nút so với lưới nút cũ (đặt cao hơn lưới: bottom 176 px điện thoại / 214 px máy tính), có che joystick/chat không, bong bóng chỉ chỗ có bị cắt ở màn hẹp không.
- Bấm "Bấm!" kịp trong 0,5 giây hoa sen; bấm Nhảy không làm trượt sang nút khác.
- Node 20 chưa chạy.

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
1. **"Người không rành vẫn chơi được"** (phần còn lại): làm lần lượt — (a) chỉ chỗ bấm cho nhiệm vụ mới (nút "Dẫn đường" nhấp nháy trên thẻ Việc kế tiếp), (b) cụm nút gốc phải-trên/dưới có nhãn chữ thay vì chỉ biểu tượng, (c) màn hướng dẫn lần đầu 3 bước (đi / chạm nút / mở nhiệm vụ). Hỏi ptg ưu tiên cái nào nếu cần.
2. **Hệ thống sức mạnh** (CẦN PTG QUYẾT trước khi làm): "sức mạnh" tính từ công đức + bậc luyện thân (Khinh thân) → khiêng vật nặng tương ứng; vật nào khiêng được (thùng, đá, bao gạo…) và đặt ở đâu; nút Khiêng/Ném thêm vào cụm góc phải-dưới; ném NGƯỜI CHƠI khác — chỉ khi hai bên đồng ý (xin ý ptg: tránh trêu chọc/lạm dụng, có tắt được không?). Logic thuần `js/world/strength.js` + test trước, giao diện sau.
3. **Yêu quái mỗi tháng 1 lần**: yêu quái đá / nước / lửa; xuất hiện một lần mỗi tháng (theo lịch thật, lưu `lgt.yq`), tấn công làng; người chơi dùng bộ kỹ năng chiến đấu (hiện CHƯA có kỹ năng chiến đấu ngoài Khinh thân — cần thiết kế: đòn đánh, máu, né); thu phục thưởng lá bồ đề + điểm cấp + cộng sức mạnh. CẦN PTG QUYẾT: kỹ năng chiến đấu là gì, có thua/bị thương không, trẻ em chơi nên mức bạo lực.
4. Còn mở từ Phiên 61: sông + hồ, kiến trúc thêm, Suối Trong, trang "Tu tập"/"NPC" trong Lộ trình. Kết quả phép 8 của `chan-doan.html` (đăng nhập `blocked`, PHIEN55) vẫn chờ ptg.
